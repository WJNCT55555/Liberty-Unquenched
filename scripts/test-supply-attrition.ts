import assert from 'node:assert/strict';
import { INITIAL_PROVINCES } from '../src/map/map_constants';
import { MapFaction, type Army, type Province } from '../src/map/types_map';
import {
  applySupplyAttrition,
  getProvinceSupplyLoad,
  isProvinceOverSupply,
} from '../src/game/rules/supply';
import { calculateMonthlyMapStage } from '../src/game/rules/monthlyPipeline';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';

const makeArmy = (
  id: string,
  provinceId: string,
  manpower: number,
  morale = 60,
): Army => ({
  id,
  faction: MapFaction.REPUBLICAN,
  identity: 'gov',
  provinceId,
  movesLeft: 2,
  manpower,
  maxManpower: manpower,
  composition: { infantry: manpower, artillery: 0, tanks: 0 },
  designedComposition: { infantry: manpower, artillery: 0, tanks: 0 },
  morale,
});

// Madrid: urban (12,000) + strategic value 10 (5,000) = 17,000 supply limit.
const underLimit = applySupplyAttrition(
  [makeArmy('under', 'madrid', 10_000)],
  INITIAL_PROVINCES,
  false,
);
assert.equal(underLimit.messages.length, 0, 'A province under its supply limit must not suffer attrition');
assert.equal(underLimit.armies[0].manpower, 10_000, 'Under-limit garrisons keep their men');

const overLimit = applySupplyAttrition(
  [makeArmy('over', 'madrid', 20_000)],
  INITIAL_PROVINCES,
  true,
);
assert.equal(overLimit.armies[0].manpower, 19_400, '20,000 men in a 17,000-limit province lose 600 men');
assert.equal(overLimit.armies[0].morale, 56, 'The same province costs 4 morale');
assert.equal(overLimit.messages.length, 1, 'Over-limit attrition must be reported');
assert.ok(overLimit.messages[0].includes('600'), 'The report must include the real manpower loss');
assert.ok(overLimit.messages[0].includes('−4'), 'The report must include the morale loss');

// Losses are split across the whole garrison in proportion to manpower.
const many = Array.from({ length: 10 }, (_, index) => makeArmy(`many-${index}`, 'madrid', 2_000));
const manyResult = applySupplyAttrition(many, INITIAL_PROVINCES, false);
assert.equal(manyResult.armies.length, 10, 'Every unit survives a supply month');
assert.equal(
  getProvinceSupplyLoad(manyResult.armies, 'madrid'),
  19_400,
  'Ten 2,000-man units lose exactly the same 600 men in total',
);
assert.ok(
  manyResult.armies.every((army) => army.manpower === 1_940),
  'Each of the ten units loses its proportional 60 men',
);

// A controlled 6,000-man province: mountains with no strategic value.
const constrainedProvince: Province = {
  ...INITIAL_PROVINCES.teruel,
  strategicValue: 0,
  isCoastal: false,
  buildings: {},
  terrain: 'mountains',
};
const constrainedProvinces = { ...INITIAL_PROVINCES, teruel: constrainedProvince };

// Supply attrition is a slow bleed, not a battle: a 148-man unit is not
// shattered by the 150-man battlefield threshold.
const tinyUnits = Array.from({ length: 60 }, (_, index) => makeArmy(`tiny-${index}`, 'teruel', 160));
const tinyResult = applySupplyAttrition(tinyUnits, constrainedProvinces, false);
assert.equal(tinyResult.armies.length, 60, 'Supply attrition must not apply the 150-man battle threshold');
assert.ok(tinyResult.armies.every((army) => army.manpower === 148), 'Each 160-man unit loses 12 men');
assert.equal(tinyResult.armies[0].morale, 51, 'The 6,000-limit province costs 9 morale');

const lowMorale = applySupplyAttrition(
  Array.from({ length: 60 }, (_, index) => makeArmy(`low-${index}`, 'teruel', 160, 12)),
  constrainedProvinces,
  false,
);
assert.ok(lowMorale.armies.every((army) => army.morale === 10), 'Attrition morale never falls below 10');

assert.equal(
  isProvinceOverSupply([makeArmy('exact', 'madrid', 17_000)], INITIAL_PROVINCES.madrid, 'madrid'),
  true,
  'A garrison exactly at the limit is over-supplied: no further replacements',
);
assert.equal(
  isProvinceOverSupply([makeArmy('below', 'madrid', 16_999)], INITIAL_PROVINCES.madrid, 'madrid'),
  false,
  'A garrison below the limit is not over-supplied',
);

// The monthly stage must run attrition before the new month's orders.
const stageState = {
  ...PRE_START_STATE,
  civilWarStatus: 'ongoing',
  activeWar: 'spanish_civil_war',
  armies: [makeArmy('stage', 'madrid', 20_000)],
  provinces: INITIAL_PROVINCES,
} as GameState;
const stage = calculateMonthlyMapStage(stageState);
assert.equal(stage.armies[0].manpower, 19_400, 'The monthly map stage must apply supply attrition');
assert.equal(stage.supplyMessages.length, 1, 'The monthly map stage must surface the supply report');

console.log('test-supply-attrition: 12 checks passed');
