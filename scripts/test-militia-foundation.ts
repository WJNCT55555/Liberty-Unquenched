import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import { maocFormation } from '../src/game/events/maoc_formation';
import { defenseCommitteeFormation } from '../src/game/events/defense_committee_formation';
import { foundingOfFalange } from '../src/game/events/founding_of_falange';
import {
  applyMonthlyOrganizationEffects,
  DEFENSE_COMMITTEE_FOUNDING_MANPOWER,
  FALANGE_FIRST_LINE_FOUNDING_MANPOWER,
  MAOC_FOUNDING_MANPOWER,
} from '../src/game/organizations';

const state1931 = createScenarioState('1931', 'normal', 'zh');
const state1933 = createScenarioState('1933', 'normal', 'zh');
const state1936 = createScenarioState('1936', 'normal', 'zh');

const pool = (state: typeof state1931, entityId: string) =>
  state.armedForces.entityPools[entityId as keyof typeof state.armedForces.entityPools];

assert.equal(pool(state1931, 'requetes').manpower, 8000, '1931 Requetés must start with their historical cadre.');
assert.equal(pool(state1933, 'requetes').manpower, 15000, '1933 Requetés must start with their historical cadre.');
assert.equal(pool(state1936, 'requetes').manpower, 30000, '1936 Requetés must keep the July 1936 level.');
assert.equal(pool(state1933, 'maoc').manpower, MAOC_FOUNDING_MANPOWER, '1933 MAOC must start with its founding cadre.');
assert.equal(
  pool(state1933, 'falange_first_line').manpower,
  FALANGE_FIRST_LINE_FOUNDING_MANPOWER,
  '1933 Falange First Line must start with its founding cadre.',
);

const maocState = { ...state1931, ...maocFormation.options[0].effect(state1931) };
assert.equal(pool(maocState, 'maoc').manpower, MAOC_FOUNDING_MANPOWER);
assert.equal(maocState.organizations?.MAOC?.status, 'active');

const dcState = { ...state1931, ...defenseCommitteeFormation.options[0].effect(state1931) };
assert.equal(pool(dcState, 'cnt_defense_committees').manpower, DEFENSE_COMMITTEE_FOUNDING_MANPOWER);
assert.equal(dcState.organizations?.DC?.status, 'active');

const falangeState = { ...state1931, ...foundingOfFalange.options[0].effect(state1931) };
assert.equal(pool(falangeState, 'falange_first_line').manpower, FALANGE_FIRST_LINE_FOUNDING_MANPOWER);

// The 1936 start is after the April merger: only the JSU is active. The
// monthly youth channel then feeds the successor PCE militia (Fifth Regiment).
assert.equal(state1936.organizations?.JSU?.status, 'active');
assert.equal(state1936.organizations?.JJSS?.status, 'integrated');
assert.equal(state1936.organizations?.UJCE?.status, 'integrated');

const afterYouthMonth = applyMonthlyOrganizationEffects(state1936);
assert.equal(pool(afterYouthMonth, 'fifth_regiment').manpower, 10600, 'JSU must add 600 to the Fifth Regiment.');
assert.equal(pool(afterYouthMonth, 'falange_first_line').manpower, 10500, 'SEU must add 500 to the Falange.');
assert.equal(pool(afterYouthMonth, 'poum_militias').manpower, 5500, 'JCI must add 500 to the POUM militia.');
assert.equal(pool(afterYouthMonth, 'requetes').manpower, 30600, 'Pelayos must add 600 to the Requetés.');

// In 1931 the PCE youth still feeds the MAOC directly.
const maocWithYouth = applyMonthlyOrganizationEffects({ ...state1931, ...maocFormation.options[0].effect(state1931) });
assert.equal(
  pool(maocWithYouth, 'maoc').manpower,
  MAOC_FOUNDING_MANPOWER + 500,
  'UJCE must add 500 to the MAOC each month.',
);

// CNT youth (FIJL) and the confederal militia deliberately have no such channel.
const cntState = applyMonthlyOrganizationEffects(state1936);
assert.equal(
  pool(cntState, 'cnt_defense_committees').manpower,
  pool(state1936, 'cnt_defense_committees').manpower,
  'CNT youth must not add monthly manpower to the confederal militia.',
);

console.log('militia foundation tests passed');
