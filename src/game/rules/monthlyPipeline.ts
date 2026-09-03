import type { GameEvent, GameState } from '../types';
import { calculateMonthlyEconomy, type EconomyBreakdown } from './economy';
import { calculateMonthlyPolicyEffects, type MonthlyPolicyEffects } from './policy';
import { INITIAL_PROVINCES } from '../../map/map_constants';
import { MapFaction, type ResourceSet } from '../../map/types_map';
import { checkCoalitionDissolve, updateCoalitions, updatePartySupport, shouldQueueEvent } from '../utils';
import { INITIAL_EVENTS } from '../data';
import { applyMonthlyOrganizationEffects, isOrganizationEstablished } from '../organizations';

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
  Object.keys(mapResources).forEach(factionKey => {
    const faction = factionKey as MapFaction;
    const current = mapResources[faction];
    if (!current) return;
    const ownedProvinces = Object.values(state.provinces || INITIAL_PROVINCES).filter(province => province.owner === faction);
    let manpower = 500;
    let supplies = 250;
    let industrialCapacity = 50;
    ownedProvinces.forEach(province => {
      manpower += province.manpower * 8;
      supplies += province.industry * 2;
      industrialCapacity += province.industry;
      const buildings = province.buildings || {};
      if (buildings.recruitingOffice) manpower += 1500;
      if (buildings.ammoFactory) supplies += buildings.ammoFactory === 1 ? 500 : 1200;
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
    mapCurrentPlayer: state.activeWar === 'asturias_war' ? MapFaction.WORKERS_ALLIANCE : MapFaction.REPUBLICAN,
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
  return checkCoalitionDissolve(nextState);
};

const getEventTriggerMode = (difficulty: GameState['difficulty']) =>
  difficulty === 'historical' ? 'historical' : 'nonHistorical';

/** Queues date/condition-driven events after all monthly state changes settle. */
export const calculateMonthlyEventQueue = (
  previousState: GameState,
  nextState: GameState,
  nextYear: number,
  nextMonth: number,
): GameEvent[] => {
  let pendingEvents = [...nextState.pendingEvents];
  const monthlyEvents = INITIAL_EVENTS.filter(event => shouldQueueEvent(event, nextState, {
    mode: getEventTriggerMode(previousState.difficulty),
    date: { year: nextYear, month: nextMonth },
    pendingEvents,
    currentEvent: previousState.currentEvent,
  }));
  if (previousState.forceAsturiasRevolutionNextMonth) {
    const asturiasEvent = INITIAL_EVENTS.find(event => event.id === 'asturias_revolution');
    if (asturiasEvent
      && !monthlyEvents.some(event => event.id === asturiasEvent.id)
      && !pendingEvents.some(event => event.id === asturiasEvent.id)
      && previousState.currentEvent?.id !== asturiasEvent.id) {
      monthlyEvents.push(asturiasEvent);
    }
  }
  pendingEvents = [...pendingEvents, ...monthlyEvents];

  const electionChainIds = new Set([
    'elections_1933',
    'elections_1933_results',
    'elections_1936',
    'elections_1936_results',
    'presidential_dissolution_of_cortes',
    'early_general_election_results',
  ]);
  const electionAlreadyScheduled = pendingEvents.some(event => electionChainIds.has(event.id))
    || Boolean(previousState.currentEvent && electionChainIds.has(previousState.currentEvent.id));
  if (
    nextState.governmentCrisis
    && !nextState.earlyElectionInProgress
    && nextState.civilWarStatus !== 'ongoing'
    && !electionAlreadyScheduled
  ) {
    const dissolutionEvent = INITIAL_EVENTS.find(event => event.id === 'presidential_dissolution_of_cortes');
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
    foreign_exchange: economy.nextForeignExchange,
    economy_growth: economy.nextGrowth,
    inflation_rate: economy.nextInflation,
    unemployment_rate: economy.nextUnemployment,
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
  const afterOrganizations = applyMonthlyOrganizationEffects(afterPolicy);
  return {
    economy,
    policy,
    state: afterOrganizations,
  };
};
