import assert from 'node:assert/strict';
import { INITIAL_PROVINCES } from '../src/map/map_constants';
import { MapFaction, type Army, type IberianDefenseState } from '../src/map/types_map';
import { deployToWidth, getBasePower, getDefenseCoefficient, resolveBattle, splitLossAcrossUnits } from '../src/game/rules/combat';
import { createDefaultMilitarization, getMilitarizationMultiplier } from '../src/game/rules/militarization';
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
const battleMilitarization = createDefaultMilitarization();
const firstBattle = resolveBattle(originalArmies, battleProvinces, attacker, 'madrid', false, battleMilitarization, fixedRoll);
const secondBattle = resolveBattle(originalArmies, battleProvinces, attacker, 'madrid', false, battleMilitarization, fixedRoll);
assert.deepEqual(firstBattle, secondBattle, 'Injected combat randomness must make battle resolution repeatable.');
assert.deepEqual(originalArmies, originalSnapshot, 'Battle resolution must not mutate its army input.');

// Deployment order is fixed: tanks claim the frontage first, infantry fills what is
// left, and artillery is exempt from the width cap entirely.
const widthDeployment = deployToWidth({ infantry: 5_000, artillery: 1_500, tanks: 500 }, 2_000);
assert.equal(widthDeployment.tanks, 500, 'Tanks must claim combat width before infantry');
assert.equal(widthDeployment.infantry, 1_500, 'Infantry fills only what the tanks left behind');
assert.equal(widthDeployment.artillery, 1_500, 'Artillery must ignore combat width');
assert.equal(widthDeployment.reserveInfantry, 3_500, 'Infantry beyond the width waits in reserve');
assert.equal(widthDeployment.reserveTanks, 0, 'Deployed armour leaves no armoured reserve');
assert.equal(
  getBasePower(widthDeployment),
  (1_500 + 500 + 1_500 + 1_500 * 0.35 + 500 * 0.60) / 1_000,
  'Base power must weight artillery at 1.35 and armour at 1.60 per man',
);

// Defence is additive: 1.2 + (terrain coefficient − 1) + fortification level.
assert.equal(getDefenseCoefficient('plains', 0), 1.2, 'Open plains defence is the 1.2 base');
assert.equal(getDefenseCoefficient('mountains', 2), 3.5, 'A mountain fortress stacks terrain and both fortification levels');

// The rate *is* the combat multiplier, so the force-group gap survives into battle.
assert.equal(getMilitarizationMultiplier(85), 0.85, 'Government forces use their rate directly');
assert.equal(getMilitarizationMultiplier(17), 0.17, 'The CNT militia rate carries the 1 : 0.2 design ratio');
assert.equal(getMilitarizationMultiplier(0), 0.1, 'The floor keeps completely unorganised men from being worthless');

// The attacker commits once: losses can never exceed the men who fit in the line,
// because the reserves disengage rather than feeding into the same fight.
const reserveHeavy = makeArmy('reserve-heavy', MapFaction.REPUBLICAN, 'toledo', 12_000);
const reserveBattle = resolveBattle(
  [reserveHeavy, defender],
  battleProvinces,
  reserveHeavy,
  'madrid',
  false,
  battleMilitarization,
  () => 0.5,
);
const reserveSurvivor = reserveBattle.updatedArmies.find(army => army.id === 'reserve-heavy');
assert.ok(reserveSurvivor, 'An attacker holding reserves must never be destroyed outright');
assert.ok(
  reserveSurvivor!.manpower >= 12_000 - 6_000,
  'Attacker losses are capped at the troops that fit in the plains combat width',
);

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
