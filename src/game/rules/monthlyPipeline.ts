import type { GameEvent, GameState } from '../types';
import { calculateMonthlyEconomy, type EconomyBreakdown } from './economy';
import { calculateMonthlyPolicyEffects, type MonthlyPolicyEffects } from './policy';
import { calculateEconomicPoliticalFeedback } from './economicFeedback';
import { applyControlObreroDrift } from './controlObrero';
import { INITIAL_PROVINCES } from '../../map/map_constants';
import { MapFaction, type ResourceSet } from '../../map/types_map';
import { checkCoalitionDissolve, updateCoalitions, updatePartySupport, shouldQueueEvent } from '../utils';
import { SCHEDULED_EVENT_REGISTRY } from '../registries/scheduledEventRegistry';
import { applyMonthlyOrganizationEffects, isOrganizationEstablished } from '../organizations';
import { isSpanishCivilWarOngoing, settleWartimeCoalition, WARTIME_EVENT_ID } from './wartimeCoalition';
import { getMayDaysProductionFactor, isMayDaysEvent, settleMayDaysPressure } from './mayDays';
import { isWartimeEconomyRouteDue } from './wartimeEconomy';
import { applyPceMilitarizationMonthlyDrift } from './militarization';
import { getPlayerMapFaction, isCivilWarFaction } from '../../map/rules/factions';

export interface MonthlyPipelineResult {
  economy: EconomyBreakdown;
  policy: MonthlyPolicyEffects;
  state: GameState;
}

export interface MonthlyMapStage {
  mapResources: Record<MapFaction, ResourceSet>;
  armies: GameState['armies'];
  mapCurrentPlayer: GameState['mapCurrentPlayer'];
  asturiasWarTurns: number;
}

/** Computes map resource income and monthly movement resets without mutating state. */
export const calculateMonthlyMapStage = (state: GameState): MonthlyMapStage => {
  const mapResources = { ...state.mapResources } as Record<MapFaction, ResourceSet>;
  const armies = (state.armies || []).map(army => ({ ...army, movesLeft: 2 }));
  // Provincial manpower, supplies and industry are wartime mobilization output.
  // Accruing them every peacetime month let the Republic bank an unusable pool
  // before the civil war ever started, so peace months leave the pools frozen at
  // their seeded values and only war months add provincial income.
  const isWartime = state.civilWarStatus === 'ongoing' || Boolean(state.activeWar);
  Object.keys(mapResources).forEach(factionKey => {
    const faction = factionKey as MapFaction;
    const current = mapResources[faction];
    if (!current) return;
    if (!isWartime) return;
    if (faction === MapFaction.IBERIAN_DEFENSE && !state.iberianDefense) return;
    if (state.iberianDefense && (!isCivilWarFaction(faction) || state.iberianDefense.eliminated.includes(faction))) return;
    const ownedProvinces = Object.values(state.provinces || INITIAL_PROVINCES).filter(province => province.owner === faction);
    // Province manpower income is DISABLED. Wartime manpower is meant to come from
    // the armed-entity pools, which events and cards feed; `province.manpower` is
    // retained in the data for display and AI scoring only and no longer accrues.
    // Supplies and industry remain provincial output.
    let manpower = 500;
    let supplies = 250;
    let industrialCapacity = 50;
    ownedProvinces.forEach(province => {
      const productionFactor = getMayDaysProductionFactor(state, province.id);
      supplies += province.industry * 2 * productionFactor;
      industrialCapacity += province.industry * productionFactor;
      const buildings = province.buildings || {};
      // Recruiting offices still produce national conscripts; party militias come
      // from their own pools and only need the office as a recruitment gate.
      if (buildings.recruitingOffice) manpower += 1500;
      if (buildings.ammoFactory) supplies += (buildings.ammoFactory === 1 ? 500 : 1200) * productionFactor;
    });
    mapResources[faction] = {
      manpower: current.manpower + Math.floor(manpower),
      supplies: current.supplies + Math.floor(supplies),
      industrialCapacity: Math.min(250, current.industrialCapacity + Math.floor(industrialCapacity * 0.2)),
      commandPoints: 2,
      tankReserve: current.tankReserve + (faction === MapFaction.REPUBLICAN ? 1 : 0),
    };
  });
  return {
    mapResources,
    armies,
    mapCurrentPlayer: getPlayerMapFaction(state),
    asturiasWarTurns: state.activeWar === 'asturias_war' ? (state.asturiasWarTurns || 0) + 1 : (state.asturiasWarTurns || 0),
  };
};

/** Applies the recurring political maintenance stage after economic effects. */
export const applyMonthlyPoliticalMaintenance = (state: GameState): GameState => {
  let nextState = { ...state };
  if (nextState.cntStance === 'oppose') {
    const decayedRate = Math.max(0, nextState.cntVotingRate - 1);
    // PRRevS's recurring +1 voting-willingness effect is applied by the
    // pure monthly pipeline above. Preserve that gain after the ordinary
    // anti-parliamentary decay is processed here.
    nextState.cntVotingRate = isOrganizationEstablished(nextState, 'PRRevS')
      ? Math.min(100, decayedRate + 1)
      : decayedRate;
  }
  nextState.partySupport = updatePartySupport(nextState);
  if (nextState.activeCoalitions) nextState.activeCoalitions = updateCoalitions(nextState);
  // PCE 的独立军事化路线（设计文档 §7）：它不受 CNT 的法律与路线影响，所以不进
  // `policyDefinitions`，而是在这里按"内战进行中 + 与本党关系达标"自行增长。
  nextState = { ...nextState, ...applyPceMilitarizationMonthlyDrift(nextState) };
  return settleMayDaysPressure(settleWartimeCoalition(checkCoalitionDissolve(nextState)));
};

const getEventTriggerMode = (difficulty: GameState['difficulty']) =>
  difficulty === 'historical' ? 'historical' : 'nonHistorical';

/**
 * 经济改造的两个强制入队规则（docs/经济改造方案.md §4.3）。
 *
 * 两个开始事件的 `condition` 都是 `() => false`——它们不属于事件板的普通筛选，
 * 出现的时点由编排决定：
 *
 *  1. **自由公社路线开局自带**：三份剧本的第一个月就把开始事件推到队首；
 *  2. **战时两条路线**：战时权力安排落定后的下一个月，由 `isWartimeEconomyRouteDue` 决定。
 *
 * 幂等由 `eventHistory.triggered` 保证：这个集合随存档保存，因此已经出现过的事件不会被
 * 再次推入，也不会因为读档而重复弹窗。
 */
const queueForcedEconomyStart = (
  pendingEvents: GameEvent[],
  previousState: GameState,
  nextState: GameState,
): GameEvent[] => {
  const freeCommuneInactive = (nextState.journal?.journal_economy_free_commune?.status ?? 'inactive') === 'inactive';
  const forcedIds: string[] = [];
  if (freeCommuneInactive) forcedIds.push('economy_free_commune_start');
  if (isWartimeEconomyRouteDue(nextState)) forcedIds.push('economy_wartime_route_choice');

  let next = pendingEvents;
  forcedIds.forEach((eventId) => {
    const alreadySeen = nextState.eventHistory?.triggered.includes(eventId)
      || previousState.eventHistory?.triggered.includes(eventId);
    if (alreadySeen) return;
    if (next.some(event => event.id === eventId)) return;
    if (previousState.currentEvent?.id === eventId) return;
    const startEvent = SCHEDULED_EVENT_REGISTRY.find(event => event.id === eventId);
    if (startEvent) next = [startEvent, ...next];
  });
  return next;
};

/** Queues date/condition-driven events after all monthly state changes settle. */
export const calculateMonthlyEventQueue = (
  previousState: GameState,
  nextState: GameState,
  nextYear: number,
  nextMonth: number,
): GameEvent[] => {
  let pendingEvents = [...nextState.pendingEvents];
  const monthlyEvents = SCHEDULED_EVENT_REGISTRY.filter(event => shouldQueueEvent(event, nextState, {
    mode: getEventTriggerMode(previousState.difficulty),
    date: { year: nextYear, month: nextMonth },
    pendingEvents,
    currentEvent: previousState.currentEvent,
  }));
  if (previousState.forceAsturiasRevolutionNextMonth && !nextState.activeWar && nextState.civilWarStatus !== 'ongoing') {
    const asturiasEvent = SCHEDULED_EVENT_REGISTRY.find(event => event.id === 'asturias_revolution');
    if (asturiasEvent
      && !monthlyEvents.some(event => event.id === asturiasEvent.id)
      && !pendingEvents.some(event => event.id === asturiasEvent.id)
      && previousState.currentEvent?.id !== asturiasEvent.id) {
      monthlyEvents.push(asturiasEvent);
    }
  }
  pendingEvents = [...pendingEvents, ...monthlyEvents];
  // 经济改造的开始事件由编排层强制入队（见上）。放在这里而不是月度筛选里，是因为它们
  // 既不能被 date/condition 筛选捞出，又必须在指定的月份出现。
  pendingEvents = queueForcedEconomyStart(pendingEvents, previousState, nextState);
  if (nextState.iberianDefense) pendingEvents = pendingEvents.filter(event => !['nationalist_surrender', 'republican_surrender', 'asturias_revolution'].includes(event.id));
  if (isMayDaysEvent(nextState.currentEvent?.id) || pendingEvents.some(event => isMayDaysEvent(event.id))) {
    pendingEvents = pendingEvents.filter(event => event.id !== 'wartime_cabinet_coordination');
    pendingEvents = [...pendingEvents.filter(event => isMayDaysEvent(event.id)), ...pendingEvents.filter(event => !isMayDaysEvent(event.id))];
  }
  const wartimeArrangement = pendingEvents.find(event => event.id === WARTIME_EVENT_ID);
  if (wartimeArrangement) {
    pendingEvents = [wartimeArrangement, ...pendingEvents.filter(event => event.id !== WARTIME_EVENT_ID)];
  }

  const electionChainIds = new Set([
    'elections_1931_results',
    'cabinet_formation_1931',
    'republican_cabinet_1931',
    'left_cabinet_excludes_cnt_1931',
    'minister_allocation',
    'elections_1933',
    'elections_1936',
    'general_election_campaign',
    'general_election_results',
    'hung_parliament_formation',
    'presidential_dissolution_of_cortes',
    'presidential_election_decision',
  ]);
  if (isSpanishCivilWarOngoing(nextState)) {
    pendingEvents = pendingEvents.filter(event => !electionChainIds.has(event.id) && !event.id.startsWith('presidential_election_'));
  }
  const awaitingPresidentialDissolution = Boolean(
    nextState.governmentCrisis
    && !nextState.earlyElectionInProgress
    && nextState.civilWarStatus !== 'ongoing',
  );
  if (awaitingPresidentialDissolution) {
    // A crisis must first pass through the constitutional dissolution event.
    // If its scheduled election date is already due, defer that campaign until
    // the next monthly queue pass instead of entering both roots together.
    pendingEvents = pendingEvents.filter(event => ![
      'elections_1933',
      'elections_1936',
      'general_election_campaign',
    ].includes(event.id));
  }
  const electionAlreadyScheduled = pendingEvents.some(event => electionChainIds.has(event.id))
    || Boolean(previousState.currentEvent && electionChainIds.has(previousState.currentEvent.id));
  if (
    awaitingPresidentialDissolution
    && !electionAlreadyScheduled
  ) {
    const dissolutionEvent = SCHEDULED_EVENT_REGISTRY.find(event => event.id === 'presidential_dissolution_of_cortes');
    if (dissolutionEvent) pendingEvents = [dissolutionEvent, ...pendingEvents];
  }
  return pendingEvents;
};

/**
 * Runs the national monthly accounting stages in a deterministic order.
 *
 * Journal/event scheduling and timer updates remain orchestration concerns.
 * Keeping them outside this calculator makes the economic/policy result
 * reusable by previews and simulations.
 */
export const calculateMonthlyPipeline = (state: GameState): MonthlyPipelineResult => {
  const economy = calculateMonthlyEconomy(state);
  const afterEconomy: GameState = {
    ...state,
    budget: economy.nextBudget,
    public_debt: economy.nextDebt,
    fiscal_arrears: economy.nextFiscalArrears,
    foreign_exchange: economy.nextForeignExchange,
    economy_growth: economy.nextGrowth,
    inflation_rate: economy.nextInflation,
    unemployment_rate: economy.nextUnemployment,
    economic_output_index: economy.nextEconomicOutputIndex,
    stats: {
      ...state.stats,
      armyLoyalty: Number(economy.nextArmyLoyalty.toFixed(1)),
    },
  };
  const policy = calculateMonthlyPolicyEffects(afterEconomy, {
    landLawLevel: economy.landLawLevel,
    landReformPaused: economy.landReformPaused,
  });
  const afterPolicy: GameState = {
    ...afterEconomy,
    ...policy,
  };
  // Economic hardship realigns the social classes (unemployment/inflation
  // thresholds → CNT-FAI / FE / AP / PSOE support). Runs after policy effects
  // so both write into the same monthly class-support settlement.
  const afterEconomicFeedback: GameState = {
    ...afterPolicy,
    classes: calculateEconomicPoliticalFeedback(afterPolicy),
  };
  const afterOrganizations = applyMonthlyOrganizationEffects(afterEconomicFeedback);
  // 工人控制程度不是只增不减的进度条：无制度支撑则衰减，1936.7 前封顶 40。
  const afterControlDrift = applyControlObreroDrift(afterOrganizations);
  return {
    economy,
    policy,
    state: afterControlDrift,
  };
};
