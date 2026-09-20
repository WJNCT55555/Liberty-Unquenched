/**
 * Scenario registry and start-state factory.
 *
 * `createScenarioState` is the single entry point that turns a scenario id plus
 * the opening difficulty into a full `GameState`. It replaces the `if / else if`
 * chain and the ~16 nested ternaries that used to live inside the `START_GAME`
 * reducer case; the sequence of operations is otherwise unchanged.
 *
 * Reading order for a maintainer:
 *   1. `base.ts`   — the scenario-free template.
 *   2. `1931.ts` / `1933.ts` / `1936.ts` — what each start overrides.
 *   3. this file   — how the two are combined.
 */
import type { GameState } from '../types';
import { SCHEDULED_EVENT_REGISTRY } from '../registries/scheduledEventRegistry';
import { initializeStartingCoalition, shouldQueueEvent } from '../utils';
import { activateCivilWarOrganizations, getDefaultArmedEntityPools } from '../organizations';
import { getDefaultArmyFormations, initializeMapState } from '../../map/map_constants';
import { ECONOMIC_RULES } from '../rules/economy';
import {
  PRE_START_STATE,
  NEUTRAL_ARMED_FORCES,
  NEUTRAL_STATE,
  type ScenarioOwnedKey,
} from './base';
import { SCENARIO_1931 } from './1931';
import { SCENARIO_1933 } from './1933';
import { SCENARIO_1936 } from './1936';
import type { ScenarioDefinition, ScenarioId } from './types';

export type { ScenarioDefinition, ScenarioId } from './types';
export { NEUTRAL_STATE, PRE_START_STATE } from './base';

/** Every scenario must be registered here; a missing key is a compile error. */
export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  '1931': SCENARIO_1931,
  '1933': SCENARIO_1933,
  '1936': SCENARIO_1936,
};

const getEventTriggerMode = (difficulty: GameState['difficulty']) =>
  difficulty === 'historical' ? 'historical' : 'nonHistorical';

/**
 * Build the opening state for a scenario.
 *
 * `language` is threaded through from the current store state because the
 * language toggle survives "return to start"; it is not scenario data.
 */
export const createScenarioState = (
  scenario: ScenarioId,
  difficulty: GameState['difficulty'],
  language: GameState['language'],
): GameState => {
  const definition = SCENARIOS[scenario];
  const startYear = definition.startYear;
  const startMonth = definition.startMonth;
  const startCivilWarStatus = definition.civilWarStatus;

  let initialResources = 2;
  let initialArmaments = 1;
  if (difficulty === 'easy' || difficulty === 'sandbox') {
    initialResources = 3;
    initialArmaments = 2;
  }

  const startMapState = initializeMapState(scenario, startCivilWarStatus);
  const entityPools = getDefaultArmedEntityPools();
  Object.entries(definition.armedEntityManpower).forEach(([entityId, manpower]) => {
    const pool = entityPools[entityId as keyof typeof entityPools];
    entityPools[entityId as keyof typeof entityPools] = { ...pool, manpower };
  });

  // The starting-event filter deliberately inspects the *pre-start template*
  // rather than the finished state: event conditions were written and tuned
  // against this shape (ministers all AP, no Cortes, every history flag false).
  // Do not "fix" this to use the new state without re-verifying event content.
  const startEventState = {
    ...PRE_START_STATE,
    domesticPolicy: { ...definition.domesticPolicy },
    scenario,
    difficulty,
    organizations: definition.organizations(),
    year: startYear,
    month: startMonth,
    civilWarStatus: startCivilWarStatus,
    ...startMapState,
  } as GameState;

  const startingEvents = SCHEDULED_EVENT_REGISTRY.filter(e => shouldQueueEvent(e, startEventState, {
    mode: getEventTriggerMode(difficulty),
    date: { year: startYear, month: startMonth },
    pendingEvents: [],
    currentEvent: null,
    respectHistory: false,
  }));

  // Charts start at the scenario's first playable month. Older versions
  // synthesized six pre-start records, which made a 1931.4 start appear to have
  // January–March economic history that never occurred in-game.
  const initialHistory: GameState['economyHistory'] = [{
    year: startYear,
    month: startMonth,
    growth: definition.economy.growth,
    inflation: definition.economy.inflation,
    unemployment: definition.economy.unemployment,
  }];

  // Every scenario-owned key comes from the descriptor. `NEUTRAL_STATE` has
  // these keys deleted, and `Pick<GameState, ScenarioOwnedKey>` is a required
  // object, so nothing can be inherited from the 1931 template by accident.
  const scenarioFields: Pick<GameState, ScenarioOwnedKey> = {
    scenario,
    year: startYear,
    month: startMonth,
    civilWarStatus: startCivilWarStatus,
    government: { ...definition.government },
    ministers: { ...definition.ministers },
    cortes: definition.cortes as GameState['cortes'],
    classes: definition.classes,
    domesticPolicy: { ...definition.domesticPolicy },
    organizations: definition.organizations(),
    unionShare: definition.unionShare(),
    economy_growth: definition.economy.growth,
    inflation_rate: definition.economy.inflation,
    unemployment_rate: definition.economy.unemployment,
    budget: definition.economy.budget,
    gold_reserves: definition.economy.goldReserves,
    foreign_exchange: definition.economy.foreignExchange,
    public_debt: definition.economy.publicDebt,
    has_issued_war_bonds: definition.economy.hasIssuedWarBonds,
    military_spending: definition.economy.militarySpending,
    ps_founded: definition.history.psFounded,
    fe_founded: definition.history.feFounded,
    poum_founded: definition.history.poumFounded,
    ceda_formed: definition.history.cedaFormed,
    ir_formed: definition.history.irFormed,
    ur_formed: definition.history.urFormed,
    treintistasLeft: definition.history.treintistasLeft,
    falange_jons: definition.history.falangeJons,
    isCasasViejasTriggered: definition.history.isCasasViejasTriggered,
    isJabaliTriggered: definition.history.isJabaliTriggered,
    isRepublicanSocialistDissolved: definition.history.isRepublicanSocialistDissolved,
    isCedaRadicalDissolved: definition.history.isCedaRadicalDissolved,
    dissolutionCount: definition.history.dissolutionCount,
    impeachPresidentAvailable: definition.history.impeachPresidentAvailable,
    isPresidentImpeached: definition.history.isPresidentImpeached,
    presidentElectionSeen: definition.history.presidentElectionSeen,
    coupSystemActive: definition.history.coupSystemActive,
    superEvent: definition.superEvent,
    regionalStatuses: { ...definition.regionalStatuses },
    armedForces: {
      // The police corps baseline and everything below it is scenario-free.
      ...NEUTRAL_ARMED_FORCES,
      entityPools,
    },
  };

  let newState: GameState = {
    ...NEUTRAL_STATE,
    ...scenarioFields,
    screen: 'game',
    language,
    difficulty,
    resources: initialResources,
    armaments: initialArmaments,
    // A new game gets its own copy of the peacetime roster so army cards can
    // edit formations without touching the shared constant.
    armyFormations: getDefaultArmyFormations(),
    economic_output_index: ECONOMIC_RULES.defaults.outputIndex,
    economyHistory: initialHistory,
    fiscal_arrears: ECONOMIC_RULES.defaults.fiscalArrears,
    ...initializeMapState(scenario, startCivilWarStatus),
    mapSelectedProvinceId: null,
    mapSelectedArmyId: null,
    mapSelectedArmyIds: [],
    currentView: 'standard',
    pendingEvents: startingEvents,
  };

  if (scenario === '1936') {
    newState = {
      ...newState,
      ...activateCivilWarOrganizations(newState),
    };
  }

  return initializeStartingCoalition(newState);
};
