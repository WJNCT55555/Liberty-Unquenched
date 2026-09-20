import assert from 'node:assert/strict';
import { INITIAL_PROVINCES } from '../src/map/map_constants';
import { MapFaction, type Army, type IberianDefenseState } from '../src/map/types_map';
import { resolveBattle, splitLossAcrossUnits } from '../src/game/rules/combat';
import {
  DEFAULT_MAP_AI_TURN_DEPENDENCIES,
  executeAiTurn,
} from '../src/game/rules/mapAiTurn';
import {
  advancePhase,
  type PhaseOrchestratorDependencies,
} from '../src/game/rules/phaseOrchestrator';
import { WARTIME_EVENT_ID } from '../src/game/rules/wartimeCoalition';
import { createScenarioState, PRE_START_STATE } from '../src/game/scenarios';
import type { GameEvent, GameState } from '../src/game/types';

const makeArmy = (
  id: string,
  faction: MapFaction,
  provinceId: string,
  infantry: number,
): Army => ({
  id,
  faction,
  identity: 'gov',
  provinceId,
  movesLeft: 2,
  manpower: infantry,
  maxManpower: infantry,
  composition: { infantry, artillery: 0, tanks: 0 },
  designedComposition: { infantry, artillery: 0, tanks: 0 },
  morale: 60,
  militarization: 10,
});

const lossUnits = [
  makeArmy('loss-a', MapFaction.NATIONALIST, 'madrid', 100),
  makeArmy('loss-b', MapFaction.NATIONALIST, 'madrid', 300),
  makeArmy('loss-c', MapFaction.NATIONALIST, 'madrid', 600),
];
assert.deepEqual(
  splitLossAcrossUnits(lossUnits, 101),
  [10, 30, 61],
  'Rounding remainder must be assigned without exceeding the requested total.',
);

const attacker = makeArmy('attacker', MapFaction.REPUBLICAN, 'toledo', 2_000);
const defender = makeArmy('defender', MapFaction.NATIONALIST, 'madrid', 1_800);
const battleProvinces = {
  ...INITIAL_PROVINCES,
  madrid: { ...INITIAL_PROVINCES.madrid, owner: MapFaction.NATIONALIST },
};
const originalArmies = [attacker, defender];
const originalSnapshot = structuredClone(originalArmies);
const fixedRoll = () => 0.25;
const firstBattle = resolveBattle(originalArmies, battleProvinces, attacker, 'madrid', false, fixedRoll);
const secondBattle = resolveBattle(originalArmies, battleProvinces, attacker, 'madrid', false, fixedRoll);
assert.deepEqual(firstBattle, secondBattle, 'Injected combat randomness must make battle resolution repeatable.');
assert.deepEqual(originalArmies, originalSnapshot, 'Battle resolution must not mutate its army input.');

const richRepublicanResources = {
  ...PRE_START_STATE.mapResources!,
  [MapFaction.REPUBLICAN]: {
    manpower: 20_000,
    industrialCapacity: 500,
    commandPoints: 0,
    supplies: 20_000,
    tankReserve: 50,
  },
};
const aiBaseState: GameState = {
  ...PRE_START_STATE,
  difficulty: 'normal',
  year: 1936,
  month: 8,
  provinces: battleProvinces,
  armies: [],
  mapResources: richRepublicanResources,
  mapHistory: [],
};
const deterministicAiDependencies = {
  ...DEFAULT_MAP_AI_TURN_DEPENDENCIES,
  calculateMoves: () => [{
    type: 'RECRUIT' as const,
    payload: {
      provinceId: 'madrid',
      composition: { infantry: 1_000, artillery: 100, tanks: 0 },
    },
  }],
  now: () => 123_456,
  random: () => 0.321,
};
const firstAiTurn = executeAiTurn(aiBaseState, MapFaction.REPUBLICAN, false, deterministicAiDependencies);
const secondAiTurn = executeAiTurn(aiBaseState, MapFaction.REPUBLICAN, false, deterministicAiDependencies);
assert.deepEqual(firstAiTurn, secondAiTurn, 'Injected AI planning, clock, and randomness must make a turn repeatable.');
assert.equal(firstAiTurn.armies?.[0]?.id, 'army_rec_123456_ai_321');

let finishedTurns = 0;
let warStatusChecks = 0;
const phaseDependencies: PhaseOrchestratorDependencies = {
  finishPlayerMapTurn: (state) => {
    finishedTurns += 1;
    return { ...state, mapHistory: ['finished-ai-turn', ...(state.mapHistory ?? [])] };
  },
  checkWarStatus: (state) => {
    warStatusChecks += 1;
    return state;
  },
};

const scenario = createScenarioState('1931', 'normal', 'en');
const fromEvent = advancePhase({ ...scenario, phase: 'event' }, phaseDependencies);
assert.equal(fromEvent.phase, 'action');
assert.equal(fromEvent.actionsLeft, 2);
assert.equal(warStatusChecks, 1, 'Ordinary phase transitions must settle war status last.');

const fromWartimeAction = advancePhase({
  ...scenario,
  phase: 'action',
  civilWarStatus: 'ongoing',
  activeWar: 'spanish_civil_war',
}, phaseDependencies);
assert.equal(fromWartimeAction.phase, 'war');
assert.equal(fromWartimeAction.currentView, 'map');

const iberianDefense: IberianDefenseState = {
  formedAt: { year: 1937, month: 5 },
  allies: { poum: false, psoeLeft: false },
  leftSocialistReserve: 0,
  eliminated: [],
  eliminations: [],
  surrenderThresholds: {},
  initialProvinces: ['barcelona'],
  contributions: { cnt: 1, poum: 0, psoeLeft: 0 },
};
warStatusChecks = 0;
const afterIberianAi = advancePhase({
  ...scenario,
  year: 1937,
  month: 5,
  phase: 'war',
  civilWarStatus: 'ongoing',
  activeWar: 'spanish_civil_war',
  iberianDefense,
}, phaseDependencies);
assert.equal(finishedTurns, 1);
assert.equal(afterIberianAi.mapHistory?.[0], 'finished-ai-turn');
assert.equal(warStatusChecks, 0, 'The injected map-turn finisher owns war settlement for the AI branch.');

const mandatoryEvent: GameEvent = {
  id: WARTIME_EVENT_ID,
  title: 'Mandatory arrangement',
  description: 'Blocks phase advancement.',
  options: [{ text: 'Continue', effect: () => ({}) }],
};
const blocked = { ...scenario, phase: 'action' as const, pendingEvents: [mandatoryEvent] };
assert.strictEqual(
  advancePhase(blocked, phaseDependencies),
  blocked,
  'Mandatory wartime events must block phase advancement without copying state.',
);

const december = advancePhase({
  ...scenario,
  year: 1931,
  month: 12,
  phase: 'action',
  civilWarStatus: 'not_started',
  activeWar: null,
  currentEvent: null,
  pendingEvents: [],
}, phaseDependencies);
assert.equal(december.year, 1932);
assert.equal(december.month, 1);
assert.equal(december.phase, 'event');

console.log('Phase 3 orchestration and deterministic runtime tests passed.');
