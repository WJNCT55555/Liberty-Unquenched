import assert from 'node:assert/strict';
import type { GameState } from '../src/game/types';
import { createScenarioState } from '../src/game/scenarios';
import { cominternSeventhCongress as congress } from '../src/game/events/comintern_seventh_congress';
import { calculateMonthlyEventQueue } from '../src/game/rules/monthlyPipeline';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { shouldQueueEvent } from '../src/game/utils';
import { checkEndings, ENDINGS } from '../src/game/endings';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { deserializeGameState, serializeGameState } from '../src/game/saveGame';
import { getOptionEffectPreview } from '../src/game/effectPreview';

assert.equal(congress.options.length, 1);
assert.equal(congress.options[0].textZh, '西班牙共产党转向反法西斯人民阵线战略');
assert(SCHEDULED_EVENT_REGISTRY.some(event => event === congress));
for (const scenario of ['1931', '1933', '1936'] as const) {
  for (const difficulty of ['easy', 'normal', 'hard', 'historical', 'sandbox'] as const) {
    const start = createScenarioState(scenario, difficulty, 'zh');
    assert.equal(start.pceAcceptsComintern, scenario === '1936');
    const mode = difficulty === 'historical' ? 'historical' : 'nonHistorical';
    const august = { ...start, year: 1935, month: 8, currentEvent: null, pendingEvents: [] };
    assert.equal(shouldQueueEvent(congress, { ...august, month: 7 }, { mode }), false);
    assert.equal(shouldQueueEvent(congress, august, { mode }), scenario !== '1936');
    assert.equal(shouldQueueEvent(congress, { ...august, month: 9 }, { mode }), scenario !== '1936' && mode !== 'historical');
    assert.equal(shouldQueueEvent(congress, { ...august, pceAcceptsComintern: true }, { mode }), false);
    assert.equal(shouldQueueEvent(congress, august, { mode, pendingEvents: [congress] }), false);
  }
}

// Exercise monthly scheduling, actual resolution and saved callback hydration.
let state: GameState = { ...createScenarioState('1933', 'historical', 'zh'), year: 1935, month: 8,
  phase: 'event' as const, currentEvent: null, pendingEvents: [], superEvent: null };
const before = JSON.stringify(state);
assert(getOptionEffectPreview(state, congress.options[0]).length);
assert.equal(JSON.stringify(state), before);
state = { ...state, pendingEvents: calculateMonthlyEventQueue(state, state, 1935, 8) };
const opened = gameReducer(state, { type: 'SELECT_EVENT', payload: { eventId: congress.id } });
assert.equal(opened.currentEvent?.id, congress.id);
const runtime = { cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY };
const restored = deserializeGameState(serializeGameState(opened), runtime);
assert.equal(typeof restored.currentEvent!.options[0].effect, 'function');
const resolved = gameReducer(restored, { type: 'RESOLVE_EVENT', payload: restored.currentEvent!.options[0].effect });
assert.equal(resolved.pceAcceptsComintern, true);
assert.equal(resolved.pceInPower, false);
assert.deepEqual(resolved.cortes, opened.cortes);
assert(resolved.eventHistory.resolved.includes(congress.id));
assert.equal(shouldQueueEvent(congress, resolved, { mode: 'nonHistorical' }), false);
assert.equal(deserializeGameState(serializeGameState(resolved), runtime).pceAcceptsComintern, true);

// Constructed states test predicate boundaries and priority, not route reachability.
const victory: GameState = { ...createScenarioState('1936', 'normal', 'zh'), year: 1937,
  civilWarStatus: 'won', cntStance: 'govern', moscowGoldTransferred: true, pceInPower: true,
  stats: { ...resolved.stats, revolutionaryFervor: 60 } };
const atSupport = (support: number, patch: Partial<GameState> = {}) => checkEndings({
  ...victory, partySupport: { ...victory.partySupport, PCE: support }, ...patch,
});
assert.equal(atSupport(70).ending, 'GENERIC_WIN');
assert.equal(atSupport(70.0001).ending, ENDINGS.RUSSIAN_SPAIN);
assert.equal(atSupport(75).ending, ENDINGS.RUSSIAN_SPAIN);
assert.equal(atSupport(75.0001).ending, ENDINGS.THE_GREAT_PURGE);
assert.equal(atSupport(76, { cntStance: 'oppose' }).ending, ENDINGS.RUSSIAN_SPAIN);
for (const patch of [{ moscowGoldTransferred: false }, { pceInPower: false }, { pceAcceptsComintern: false }] as const) {
  assert.equal(atSupport(71, patch).ending, 'GENERIC_WIN');
}
assert.equal(atSupport(75, { civilWarStatus: 'ongoing' }).isGameOver, false);
assert.equal(atSupport(75.0001, { civilWarStatus: 'ongoing' }).ending, ENDINGS.THE_GREAT_PURGE);
assert.equal(atSupport(71, { civilWarStatus: 'ongoing' }).isGameOver, false);
console.log('Comintern event scheduling, one-time resolution, save hydration and strict ending boundaries passed.');
