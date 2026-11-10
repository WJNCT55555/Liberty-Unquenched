import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import { cataloniaDefense } from '../src/game/events/civil_war/catalonia_defense';

const base = createScenarioState('1936', 'normal', 'zh');
const state = {
  ...base,
  civilWarStatus: 'ongoing' as const,
  cataloniaControl: 'republic' as const,
};

const seize = cataloniaDefense.options[0].effect(state);
const next = { ...state, ...seize };

assert.equal(next.cataloniaControl, 'cnt_fai');
assert.equal(next.stats.revolutionaryFervor, state.stats.revolutionaryFervor);
assert.equal(next.stats.bureaucratization, state.stats.bureaucratization);
assert.equal(Number.isFinite(next.stats.workerControl), true);
assert.equal(Number.isFinite(next.stats.revolutionaryFervor), true);
assert.equal(Number.isFinite(next.stats.bureaucratization), true);

const allied = cataloniaDefense.options[1].effect(state);
assert.equal(({ ...state, ...allied }).cataloniaControl, 'committee');

console.log('catalonia defense tests passed');
