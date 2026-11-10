import assert from 'node:assert/strict';
import { INITIAL_PROVINCES } from '../src/map/map_constants';
import { MapFaction, getEffectiveFortressLevel, type Army, type MapRuntimeState } from '../src/map/types_map';
import { createDefaultMilitarization } from '../src/game/rules/militarization';
import { buildCombatPreview } from '../src/game/rules/combatPreview';
import { executeAiTurn, type MapAiTurnDependencies } from '../src/game/rules/mapAiTurn';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';

const makeArmy = (
  id: string,
  faction: MapFaction,
  provinceId: string,
  infantry: number,
  artillery: number,
  morale: number,
  identity: Army['identity'] = 'gov',
): Army => ({
  id,
  faction,
  identity,
  provinceId,
  movesLeft: 2,
  manpower: infantry + artillery,
  maxManpower: infantry + artillery,
  composition: { infantry, artillery, tanks: 0 },
  designedComposition: { infantry, artillery, tanks: 0 },
  morale,
});

const closeTo = (actual: number, expected: number, epsilon = 0.02): void => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};

const att = makeArmy('att', MapFaction.REPUBLICAN, 'cuenca', 2_000, 1_000, 60, 'cnt');
const def = makeArmy('def', MapFaction.NATIONALIST, 'teruel', 2_000, 0, 80, 'gov');
const teruelFort2 = { ...INITIAL_PROVINCES.teruel, owner: MapFaction.NATIONALIST, fortification: 2 };
const state = {
  ...PRE_START_STATE,
  provinces: { ...INITIAL_PROVINCES, teruel: teruelFort2 },
  armies: [att, def],
  militarization: { ...createDefaultMilitarization(), cnt: 51 },
} as MapRuntimeState;

const preview = buildCombatPreview(state, att, 'teruel');
assert.ok(preview, 'The preview must be built for a named target province');
assert.equal(preview!.defense.base, 1.2, 'Defence base must be 1.2');
closeTo(preview!.defense.terrainBonus, 0.3, 0.0001);
assert.equal(preview!.defense.fortress, 2, 'Inherent fortification must be reported separately');
closeTo(preview!.defense.total, 3.5, 0.0001);
assert.equal(preview!.verdict, 'hopeless', '2k+1k militia attacking a 2,000-man mountain fortress is hopeless');
closeTo(preview!.attacker.power, 2.7336, 0.01);
closeTo(preview!.defender.power, 10.71, 0.01);
closeTo(preview!.attacker.militarization, 0.51, 0.0001);
closeTo(preview!.defender.militarization, 0.85, 0.0001);
assert.equal(preview!.attackerLossRate, 0.18, 'Attacker loss rate is capped at 18%');
assert.equal(preview!.defenderLossRate, 0.02, 'Defender loss rate is floored at 2%');
assert.equal(preview!.attackerExpectedLosses, 538);
assert.equal(preview!.defenderExpectedLosses, 37);
assert.ok(preview!.requiredPower > preview!.attacker.power * 3, 'The required power must dwarf the attacker');

const undefended = buildCombatPreview(
  { ...state, armies: [att] },
  att,
  'teruel',
);
assert.ok(undefended);
assert.equal(undefended!.verdict, 'undefended');
assert.equal(undefended!.defender.power, 0);
assert.equal(undefended!.defenderExpectedLosses, 0);

const strongAttacker = makeArmy('strong', MapFaction.REPUBLICAN, 'toledo', 6_000, 0, 70, 'gov');
const weakDefender = makeArmy('weak', MapFaction.NATIONALIST, 'guadalajara', 1_000, 0, 80, 'gov');
const favourableState = {
  ...state,
  armies: [strongAttacker, weakDefender],
  provinces: { ...state.provinces, guadalajara: { ...INITIAL_PROVINCES.guadalajara, owner: MapFaction.NATIONALIST } },
} as MapRuntimeState;
const favourable = buildCombatPreview(favourableState, strongAttacker, 'guadalajara');
assert.ok(favourable);
assert.equal(favourable!.verdict, 'favourable');
assert.ok(favourable!.attacker.power > favourable!.requiredPower);

// AI builder must write `buildings.fortress` only; `fortification` is the
// province's inherent defence and must not be overwritten.
const aiState = {
  ...PRE_START_STATE,
  difficulty: 'normal',
  provinces: {
    ...INITIAL_PROVINCES,
    teruel: { ...INITIAL_PROVINCES.teruel, owner: MapFaction.NATIONALIST },
  },
  armies: [],
  mapResources: {
    ...PRE_START_STATE.mapResources,
    [MapFaction.NATIONALIST]: {
      ...PRE_START_STATE.mapResources[MapFaction.NATIONALIST],
      supplies: 1_000,
      industrialCapacity: 300,
    },
  },
} as GameState;
const aiDependencies = {
  calculateMoves: () => [{ type: 'BUILD', payload: { provinceId: 'teruel', buildingType: 'fortress' } }],
  resolveBattle: () => ({ updatedArmies: [], updatedProvinces: {}, messages: [] }),
  settleCapitulations: (value: MapRuntimeState) => value,
  now: () => 0,
  random: () => 0.5,
} as unknown as MapAiTurnDependencies;
const aiResult = executeAiTurn(aiState, MapFaction.NATIONALIST, false, aiDependencies);
assert.equal(aiResult.provinces.teruel.buildings?.fortress, 1, 'The AI must build exactly one fortress level');
assert.equal(aiResult.provinces.teruel.fortification, 0, 'The AI must not overwrite the intrinsic fortification');
assert.equal(getEffectiveFortressLevel(aiResult.provinces.teruel), 1, 'The AI fortress must not be counted twice');

console.log('test-combat-preview: 20 checks passed');
