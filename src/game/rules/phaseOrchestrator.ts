import { INITIAL_PROVINCES } from '../../map/map_constants';
import type { GameState } from '../types';
import { RESTORABLE_EVENT_REGISTRY } from '../registries/restorableEventRegistry';
import { getJournalEntryDef } from '../journal';
import { activateCivilWarOrganizations, isOrganizationEstablished } from '../organizations';
import { finishPlayerMapTurn } from '../reducers/mapReducer';
import { calculateMonthlyIncome } from './income';
import {
  applyMonthlyPoliticalMaintenance,
  calculateMonthlyEventQueue,
  calculateMonthlyMapStage,
  calculateMonthlyPipeline,
} from './monthlyPipeline';
import {
  getJournalOutcomeEventId,
  isEventMediatedJournal,
  queueJournalOutcomeEvent,
} from './journalEvents';
import { hasMandatoryMayDaysEvent, isMayDaysEvent } from './mayDays';
import { WARTIME_EVENT_ID } from './wartimeCoalition';
import { MAP_RUNTIME_HELPERS } from './mapRuntime';
import { checkWarStatus } from './warStatus';

export interface PhaseOrchestratorDependencies {
  finishPlayerMapTurn: (state: GameState) => GameState;
  checkWarStatus: (state: GameState, isZh: boolean) => GameState;
}

export const DEFAULT_PHASE_ORCHESTRATOR_DEPENDENCIES: PhaseOrchestratorDependencies = {
  finishPlayerMapTurn: (state) => finishPlayerMapTurn(state, MAP_RUNTIME_HELPERS),
  checkWarStatus,
};

/**
 * Advances one phase boundary. Month settlement is intentionally ordered here:
 * map income -> national economy/policy -> journals -> political maintenance ->
 * event scheduling -> phase/timer settlement -> war outcome.
 */
export const advancePhase = (
  state: GameState,
  dependencies: PhaseOrchestratorDependencies = DEFAULT_PHASE_ORCHESTRATOR_DEPENDENCIES,
): GameState => {
  let newState = state;
  if (hasMandatoryMayDaysEvent(state) || state.currentEvent?.id === WARTIME_EVENT_ID || state.currentEvent?.id === 'wartime_power_arrangement_result'
    || state.pendingEvents.some(event => event.id === WARTIME_EVENT_ID)) return state;
  const isZh = state.language === 'zh';
  if (state.phase === 'war' && state.iberianDefense && !state.iberianDefense.winner
    && state.iberianDefense.completedAiMonth !== state.year * 12 + state.month) {
    return dependencies.finishPlayerMapTurn(state);
  }
  if (state.phase === 'event') {
    newState = { ...state, phase: 'action', actionsLeft: 2 };
  } else if (state.phase === 'action' && (state.civilWarStatus === 'ongoing' || state.activeWar)) {
    newState = { ...state, phase: 'war', currentView: 'map' };
  } else {
    // Next month
    let nextMonth = state.month + 1;
    let nextYear = state.year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    
    // Discard remaining hand at end of turn
    const newDiscard = [...state.discard, ...state.hand];
    
    // Calculate periodic income through the shared, pure rules source.
    // CNT clandestine armaments remain independent from national military spending.
    const monthlyIncome = calculateMonthlyIncome(state, nextMonth);
    
    // International Brigades Logic
    let newIntBrigades = state.internationalBrigades;
    let newIntBrigadesFormed = state.internationalBrigadesFormed;

    const internationalBrigadesWindow = nextYear > 1936 || (nextYear === 1936 && nextMonth >= 9);
    if (state.civilWarStatus !== 'not_started' && internationalBrigadesWindow && state.relations.internationalSocialists > 60) {
      newIntBrigadesFormed = true;
    }

    if (newIntBrigadesFormed) {
      let baseIncrease = 1000;
      if (state.difficulty === 'easy' || state.difficulty === 'sandbox') baseIncrease = 2000;
      else if (state.difficulty === 'hard') baseIncrease = 500;

      let bonusIncrease = 0;
      if (state.relations.internationalSocialists > 80) bonusIncrease = 750;
      else if (state.relations.internationalSocialists > 60) bonusIncrease = 250;

      newIntBrigades += baseIncrease + bonusIncrease;
    }
    
    let newPendingEvents = [...state.pendingEvents];
    let newSuperEvent = state.superEvent;
    let newCivilWarStatus = state.civilWarStatus;

    // Check Civil War Trigger
    if (newCivilWarStatus === 'not_started') {
      const isHistoricalTrigger = state.difficulty === 'historical'
        && nextYear === 1936
        && nextMonth === 7;
      
      if (isHistoricalTrigger) {
        newSuperEvent = 'spanish_civil_war';
      }
    }

    const monthlyMapStage = calculateMonthlyMapStage(state);

    let tempState: GameState = {
      ...state,
      month: nextMonth,
      year: nextYear,
      civilWarStatus: newCivilWarStatus,
      resources: state.resources + monthlyIncome.resources,
      armaments: state.armaments + monthlyIncome.armaments,
      internationalBrigades: newIntBrigades,
      internationalBrigadesFormed: newIntBrigadesFormed,
      prrevs_formed_months: isOrganizationEstablished(state, 'PRRevS') ? state.prrevs_formed_months + 1 : 0,
      mapResources: monthlyMapStage.mapResources,
      armies: monthlyMapStage.armies,
      mapCurrentPlayer: monthlyMapStage.mapCurrentPlayer,
      asturiasWarTurns: monthlyMapStage.asturiasWarTurns,
    };
    tempState = {
      ...tempState,
      ...activateCivilWarOrganizations(tempState),
    };

    // National accounting is a pure, shared pipeline. Journal effects and
    // phase/timer orchestration remain in this reducer.
    const monthlyPipeline = calculateMonthlyPipeline(tempState);
    const economy = monthlyPipeline.economy;
    tempState = monthlyPipeline.state;
    const updatedHistory = [
      ...(state.economyHistory || []),
      {
        year: tempState.year,
        month: tempState.month,
        growth: tempState.economy_growth,
        inflation: tempState.inflation_rate,
        unemployment: tempState.unemployment_rate
      }
    ].slice(-24);
    tempState = {
      ...tempState,
      economyHistory: updatedHistory
    };

    let newJournal = JSON.parse(JSON.stringify(state.journal || {}));

    Object.keys(newJournal).forEach(journalId => {
      const entryState = newJournal[journalId];
      const def = getJournalEntryDef(journalId);
      if (def && entryState.status === 'active' && def.activeEffect?.apply) {
         const effectResult = def.activeEffect.apply(tempState);
         tempState = { ...tempState, ...effectResult };
      }
    });

    // Check failure progress for land reform: if no progress is made from previous month, increase failureProgress by 1% (1)
    const landReformEntry = newJournal['journal_land_reform'];
    if (landReformEntry && state.journal['journal_land_reform']?.status === 'active') {
      const prevProgress = state.domesticPolicy.land_reform_progress;
      const nextProgress = tempState.domesticPolicy.land_reform_progress;
      if (nextProgress <= prevProgress) {
        landReformEntry.failureProgress = Math.min(100, (landReformEntry.failureProgress || 0) + 1);
      }
    }

    Object.keys(newJournal).forEach(journalId => {
      const entryState = newJournal[journalId];
      const def = getJournalEntryDef(journalId);
      if (!def || !def.checkStatus) return;

      let newStatus = def.checkStatus(tempState, entryState);
      // 事件中介的日志：激活只属于它的开始事件，忽略 checkStatus 的 active 判定。
      if (newStatus === 'active' && isEventMediatedJournal(def)) newStatus = null;
      if (!newStatus || newStatus === entryState.status) return;

      entryState.status = newStatus;
      if (newStatus === 'completed' && def.onComplete) {
        tempState = { ...tempState, ...def.onComplete(tempState) };
      } else if (newStatus === 'failed' && def.onFail) {
        tempState = { ...tempState, ...def.onFail(tempState) };
      }

      // 结果事件：数值效果已由日志结算，这里只把叙事事件排进本回合的事件阶段。
      const outcomeEventId = getJournalOutcomeEventId(def, newStatus);
      if (!outcomeEventId) return;
      const outcomeEvent = RESTORABLE_EVENT_REGISTRY.find(event => event.id === outcomeEventId);
      const nextPendingEvents = queueJournalOutcomeEvent(tempState, outcomeEvent);
      if (nextPendingEvents) tempState = { ...tempState, pendingEvents: nextPendingEvents };
    });

    // --- Core Political Party Alliance System Monthly Processing ---
    tempState = applyMonthlyPoliticalMaintenance(tempState);

    // Event conditions observe the fully updated next-month state, including
    // coalition maintenance and any newly created government crisis.
    newPendingEvents = calculateMonthlyEventQueue(state, tempState, nextYear, nextMonth);
    const mandatoryArrangement = newPendingEvents.find(event => event.id === WARTIME_EVENT_ID || isMayDaysEvent(event.id));
    if (mandatoryArrangement && !tempState.currentEvent) {
      tempState = {
        ...tempState,
        currentEvent: mandatoryArrangement,
        eventHistory: { ...tempState.eventHistory, triggered: [...new Set([...tempState.eventHistory.triggered, mandatoryArrangement.id])] },
      };
      newPendingEvents = newPendingEvents.filter(event => event.id !== mandatoryArrangement.id);
    }

    let finalProvinces = tempState.provinces || state.provinces || INITIAL_PROVINCES;
    let finalArmies = tempState.armies || state.armies || [];

    newState = {
      ...state,
      ...tempState,
      provinces: finalProvinces,
      armies: finalArmies,
      phase: 'event',
      currentView: 'standard',
      actionsLeft: 0,
      journal: newJournal,
      fundraising_timer: Math.max(0, state.fundraising_timer - 1),
      mitin_popular_timer: Math.max(0, (state.mitin_popular_timer || 0) - 1),
      prrevs_campaign_timer: Math.max(0, (state.prrevs_campaign_timer || 0) - 1),
      organizations_timer: Math.max(0, state.organizations_timer - 1),
      fijl_timer: Math.max(0, (state.fijl_timer || 0) - 1),
      mujeres_libres_timer: Math.max(0, (state.mujeres_libres_timer || 0) - 1),
      international_relations_timer: Math.max(0, state.international_relations_timer - 1),
      choose_enemies_timer: Math.max(0, state.choose_enemies_timer - 1),
      inter_party_relationships_timer: Math.max(0, state.inter_party_relationships_timer - 1),
      military_policy_timer: Math.max(0, state.military_policy_timer - 1),
      police_affairs_timer: Math.max(0, (state.police_affairs_timer || 0) - 1),
      agricultural_policy_timer: Math.max(0, (state.agricultural_policy_timer || 0) - 1),
      labor_rights_timer: Math.max(0, (state.labor_rights_timer || 0) - 1),
      labor_affairs_timer: Math.max(0, (state.labor_affairs_timer || 0) - 1),
      fiscal_policy_timer: Math.max(0, (state.fiscal_policy_timer || 0) - 1),
      advisorActionTimer: Math.max(0, state.advisorActionTimer - 1),
      aragonTimer: Math.max(0, state.aragonTimer - 1),
      militiaReorgTimer: Math.max(0, state.militiaReorgTimer - 1),
      tankTimer: Math.max(0, state.tankTimer - 1),
      propaganda_timer: Math.max(0, state.propaganda_timer - 1),
      propaganda_by_deed_timer: Math.max(0, state.propaganda_by_deed_timer - 1),
      internationalBrigades: newIntBrigades,
      internationalBrigadesFormed: newIntBrigadesFormed,
      superEvent: newSuperEvent,
      pendingEvents: newPendingEvents,
      civilWarStatus: newCivilWarStatus,
      hand: [],
      discard: newDiscard,
      forceAsturiasRevolutionNextMonth: false,
    };
  }
  return dependencies.checkWarStatus(newState, isZh);
};
