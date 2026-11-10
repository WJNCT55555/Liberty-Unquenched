import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import { jonsFormation } from '../src/game/events/falange_organizations';
import { divorceLaw1932 } from '../src/game/events/divorce_law_1932';
import { cnt_fourth_congress_6 } from '../src/game/events/cnt_fourth_congress';

const state1931 = createScenarioState('1931', 'normal', 'zh');
const state1933 = createScenarioState('1933', 'normal', 'zh');
const state1936 = createScenarioState('1936', 'normal', 'zh');

const ids = (state: typeof state1931) => new Set((state.pendingEvents ?? []).map(event => event.id));

assert.equal(ids(state1936).has('jons_formation'), false, '1936 must not replay the 1931 JONS founding.');
assert.equal(ids(state1936).has('divorce_law_1932'), false, '1936 must not replay the 1932 Divorce Law.');
assert.equal(ids(state1936).has('economy_free_commune_start'), false, 'The old Free Commune start event must not be forced.');
assert.equal(ids(state1933).has('divorce_law_1932'), false, '1933 must start with divorce already legalised.');
assert.equal(state1933.domesticPolicy.womens_rights, 2);
assert.equal(state1936.domesticPolicy.womens_rights, 2);

assert.equal(
  state1936.journal?.journal_economy_free_commune?.status,
  'active',
  'The 1936 start must already have the Free Commune journal active.',
);
assert.equal(
  state1933.journal?.journal_economy_free_commune?.status,
  'inactive',
  'The 1933 start waits for the Fourth Congress blueprint.',
);

const october1931 = { ...state1931, year: 1931, month: 10 };
assert.equal(jonsFormation.condition?.(october1931), true, 'JONS must still form in October 1931.');
assert.equal(jonsFormation.condition?.(state1936), false, 'JONS must not form after the 1934 merger.');

const february1932 = { ...state1931, year: 1932, month: 2 };
assert.equal(divorceLaw1932.condition?.(february1932), true, 'The Divorce Law must still fire in 1932.');
assert.equal(divorceLaw1932.condition?.(state1936), false, 'The Divorce Law must not replay in 1936.');

for (const [index, option] of cnt_fourth_congress_6.options.entries()) {
  const next = { ...state1933, ...option.effect(state1933) };
  assert.equal(
    next.journal?.journal_economy_free_commune?.status,
    'active',
    `Fourth Congress blueprint option ${index} must activate the Free Commune journal.`,
  );
}

console.log('scenario start events tests passed');
