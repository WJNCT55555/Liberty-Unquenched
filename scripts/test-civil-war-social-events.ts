import assert from 'node:assert/strict';
import type { GameEvent, GameState } from '../src/game/types';
import { PRE_START_STATE } from '../src/game/scenarios';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { civilWarSetup } from '../src/game/events/civil_war/civil_war_setup';
import { wartimePowerArrangement } from '../src/game/events/civil_war/wartime_power_arrangement';
import { moscowGold } from '../src/game/events/civil_war/moscow_gold';
import { pcePoliticalVacuum, pceSmallholderGuarantees, pceMiddleClassAppeal } from '../src/game/events/civil_war/pce_social_expansion';
import { MOSCOW_GOLD_MONTHS, isMoscowGoldDue } from '../src/game/rules/moscowGold';
import { WARTIME_PARTY_STATUS } from '../src/game/politicalEligibility';
import { calculateMonthlyEventQueue } from '../src/game/rules/monthlyPipeline';
import { negotiateSovietEvent } from '../src/game/government_affairs/foreign_policy';
import { adjustSingleClassSupport, shouldQueueEvent } from '../src/game/utils';
import { getOptionEffectPreview } from '../src/game/effectPreview';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { deserializeGameState, serializeGameState } from '../src/game/saveGame';

function copy<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(copy) as T;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)])) as T;
}
const seed = (scenario: GameState['scenario'] = '1936', difficulty: GameState['difficulty'] = 'normal'): GameState => {
  let state = copy(gameReducer(copy(PRE_START_STATE), { type: 'START_GAME', payload: { scenario, difficulty } }));
  state = { ...state, year: 1936, month: 7, currentEvent: null, pendingEvents: [], superEvent: null,
    eventHistory: { triggered: [], resolved: [] } };
  state = { ...state, ...civilWarSetup.options[0].effect(state), currentEvent: null, pendingEvents: [] };
  state = { ...state, month: 8 };
  state = { ...state, ...wartimePowerArrangement.options[2].effect(state), currentEvent: null, pendingEvents: [] };
  return { ...state, phase: 'event', budget: 0, resources: 10, gold_reserves: 1000,
    ministers: { ...state.ministers, estado: 'IR', finance: 'PSOE' }, republicanPartyStatus: { ...WARTIME_PARTY_STATUS } };
};
const after = (state: GameState, months: number): GameState => {
  const index = state.civilWarSetupCompletedAt!.year * 12 + state.civilWarSetupCompletedAt!.month - 1 + months;
  return { ...state, year: Math.floor(index / 12), month: index % 12 + 1 };
};
const resolve = (state: GameState, event: GameEvent, index = 0): GameState => {
  const opened = { ...state, phase: 'event' as const, currentEvent: event, pendingEvents: [],
    eventHistory: { ...state.eventHistory, triggered: [...state.eventHistory.triggered, event.id] } };
  assert(!event.options[index].condition || event.options[index].condition!(opened));
  return gameReducer(opened, { type: 'RESOLVE_EVENT', payload: event.options[index].effect });
};
const socialEvents = [pcePoliticalVacuum, pceSmallholderGuarantees, pceMiddleClassAppeal];
const socialState = (event: GameEvent): GameState => {
  const index = socialEvents.indexOf(event);
  const state = after(seed(), [2, 4, 6][index]);
  return { ...state, eventHistory: { triggered: [], resolved: socialEvents.slice(0, index).map(item => item.id) } };
};
const near = (actual: number, expected: number) => assert(Math.abs(actual - expected) <= .0002, `${actual} != ${expected}`);
let checks = 0;
const test = (name: string, check: () => void) => { check(); checks++; console.log(`PASS ${name}`); };

test('Gold waits seven actual months in every scenario/mode, including year rollover and early wars', () => {
  assert.equal(MOSCOW_GOLD_MONTHS, 7);
  for (const scenario of ['1931', '1933', '1936'] as const) for (const difficulty of ['easy', 'normal', 'hard', 'historical', 'sandbox'] as const) {
    const state = seed(scenario, difficulty);
    for (const onset of [{ year: 1936, month: 7 }, { year: 1934, month: 12 }]) {
      const start = { ...state, civilWarSetupCompletedAt: onset };
      assert.equal(isMoscowGoldDue(after(start, 6)), false);
      assert.equal(isMoscowGoldDue(after(start, 7)), true);
      assert.equal(isMoscowGoldDue(after(start, 8)), true);
      assert.equal(shouldQueueEvent(moscowGold, after(start, 7), { mode: difficulty === 'historical' ? 'historical' : 'nonHistorical' }), true);
    }
    let campaign = state;
    for (const [index, event] of socialEvents.entries()) {
      campaign = after(campaign, [2, 4, 6][index]);
      assert.equal(shouldQueueEvent(event, campaign, { mode: difficulty === 'historical' ? 'historical' : 'nonHistorical' }), true);
      campaign = resolve(campaign, event);
    }
  }
});

test('Only holding both ministries blocks gold; seizure, no bullion, completed transfer and ended wars also block it', () => {
  const state = after(seed(), 7);
  for (const estado of ['CNT', 'IR'] as const) for (const finance of ['CNT', 'PSOE'] as const)
    assert.equal(isMoscowGoldDue({ ...state, ministers: { ...state.ministers, estado, finance } }), !(estado === 'CNT' && finance === 'CNT'));
  for (const patch of [{ private_bank_seizure: 1 }, { gold_reserves: 149 }, { moscowGoldTransferred: true },
    { civilWarSetupCompletedAt: undefined }, { activeWar: 'asturias_war' as const }, { civilWarStatus: 'won' as const }, { civilWarStatus: 'lost' as const }])
    assert.equal(isMoscowGoldDue({ ...state, ...patch }), false);
  assert.equal(isMoscowGoldDue({ ...state, private_bank_seizure: undefined } as unknown as GameState), true);
});

test('Every gold response settles exactly once without requiring CNT budget or changing parliament', () => {
  for (const index of [0, 1, 2]) {
    const state = { ...after(seed(), 7), tankResearchProgress: 90 };
    const before = JSON.stringify(state);
    const patch = moscowGold.options[index].effect(state);
    assert.equal(JSON.stringify(state), before);
    const next = { ...state, ...patch };
    assert.equal(next.gold_reserves, 850);
    assert.equal(next.budget, 0);
    assert.equal(next.armaments, state.armaments + 4);
    assert.equal(next.tankResearchProgress, 100);
    assert.equal(next.moscowGoldTransferred, true);
    assert.equal(next.pceInPower, false);
    assert.equal(next.pceAcceptsComintern, state.pceAcceptsComintern);
    assert.deepEqual(next.cortes, state.cortes);
    assert.deepEqual(next.ministers, state.ministers);
    assert.deepEqual(moscowGold.options[index].effect(next), { currentEvent: null });
  }
  const poor = { ...after(seed(), 7), resources: 0 };
  assert.equal(moscowGold.options[2].condition!(poor), false);
  assert.equal(moscowGold.options[1].condition, undefined);
});

test('Manual gold and the government event share the transaction and cannot double-charge', () => {
  const option = negotiateSovietEvent.options[2];
  const state = { ...after(seed(), 7), budget: 10 };
  const manual = { ...state, ...option.effect(state) };
  assert.equal(manual.budget, 7);
  assert.equal(manual.international_relations_timer, 2);
  assert.equal(manual.gold_reserves, 850);
  assert.equal(isMoscowGoldDue(manual), false);
  assert.deepEqual(moscowGold.options[0].effect(manual), { currentEvent: null });
  const automatic = { ...state, ...moscowGold.options[0].effect(state) };
  assert.equal(option.condition!(automatic), false);
  assert.deepEqual(option.effect(automatic), {});
});

test('Donor-limited zero-sum gains preserve active allies, cap gains, and leave default behavior intact', () => {
  const support = seed().classes.Labradores.support;
  const donors = ['AP', 'RE', 'CT', 'FE', 'PRR', 'DLR'] as const;
  const pool = donors.reduce((sum, party) => sum + support[party], 0);
  const moved = adjustSingleClassSupport(support, 'PCE', 100, donors);
  near(moved.PCE, support.PCE + pool);
  near(Object.values(moved).reduce((sum, value) => sum + value, 0), 100);
  for (const party of Object.keys(support) as (keyof typeof support)[]) {
    assert(moved[party] >= 0);
    if (party !== 'PCE' && !donors.some(donor => donor === party)) near(moved[party], support[party]);
  }
  assert.deepEqual(adjustSingleClassSupport(support, 'PCE', 20, []), support);
  assert.deepEqual(adjustSingleClassSupport(moved, 'PCE', 20, donors), moved);
  assert.deepEqual(adjustSingleClassSupport(support, 'PCE', 5), adjustSingleClassSupport(support, 'PCE', 5, Object.keys(support) as (keyof typeof support)[]));
});

test('Social campaigns enter sequentially at months 2/4/6 and remain playable without resources', () => {
  for (const [index, event] of socialEvents.entries()) {
    const state = socialState(event);
    assert.equal(event.condition!(state), true);
    assert.equal(event.condition!(after(state, [1, 3, 5][index])), false);
    if (index) assert.equal(event.condition!({ ...state, eventHistory: { triggered: [], resolved: [] } }), false);
    assert.equal(event.condition!({ ...state, wartimePowerArrangement: undefined, republicanPartyStatus: {} }), false);
    assert.equal(event.condition!({ ...state, republicanPartyStatus: { ...state.republicanPartyStatus, PCE: 'excluded' } }), false);
    assert.equal(event.options[1].condition!({ ...state, resources: 0 }), false);
    assert.equal(event.options[0].condition, undefined);
    assert.equal(event.options[2].condition, undefined);
    const next = resolve(state, event);
    assert.equal(event.condition!(next), false);
    assert.deepEqual(event.options[0].effect(next), { currentEvent: null });
    const queued = calculateMonthlyEventQueue(state, state, state.year, state.month);
    assert(queued.some(item => item.id === event.id));
  }
});

test('Campaigns move displaced-party support without altering active allies, historical seats or enemy armies', () => {
  for (const event of socialEvents) for (const option of event.options) {
    const state = socialState(event);
    const before = JSON.stringify(state);
    const patch = option.effect(state);
    assert.equal(JSON.stringify(state), before);
    const next = { ...state, ...patch };
    for (const socialClass of Object.keys(next.classes) as (keyof GameState['classes'])[]) {
      for (const party of ['PSOE', 'POUM', 'IR', 'UR', 'ERC', 'PNV', 'PS'] as const)
        near(next.classes[socialClass].support[party], state.classes[socialClass].support[party]);
      near(Object.values(next.classes[socialClass].support).reduce((sum, value) => sum + value, 0), Object.values(state.classes[socialClass].support).reduce((sum, value) => sum + value, 0));
    }
    assert.deepEqual(next.cortes, state.cortes);
    assert.deepEqual(next.armies, state.armies);
    assert.deepEqual(next.organizations, state.organizations);
  }
});

test('CNT counter-mobilization limits PCE gains; forced collectivization and bank seizure amplify the alternative', () => {
  for (const event of socialEvents) {
    const state = socialState(event);
    const accept = event.options[0].effect(state).classes!;
    const compete = event.options[1].effect(state).classes!;
    const socialClass = event === pceMiddleClassAppeal ? 'PequenaBurguesia' : 'Labradores';
    assert(compete[socialClass].support.PCE < accept[socialClass].support.PCE);
    assert(compete[socialClass].support.CNT_FAI > accept[socialClass].support.CNT_FAI);
  }
  const farmers = socialState(pceSmallholderGuarantees);
  near(pceSmallholderGuarantees.options[0].effect({ ...farmers, land_forced_collectivization: 9 }).classes!.Labradores.support.PCE,
    pceSmallholderGuarantees.options[0].effect(farmers).classes!.Labradores.support.PCE + 6);
  const shops = socialState(pceMiddleClassAppeal);
  near(pceMiddleClassAppeal.options[0].effect({ ...shops, private_bank_seizure: 1 }).classes!.PequenaBurguesia.support.PCE,
    pceMiddleClassAppeal.options[0].effect(shops).classes!.PequenaBurguesia.support.PCE + 4);
});

test('All four events queue, resolve, restore with callbacks and display pure bilingual previews', () => {
  const runtime = { cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY };
  for (const event of [moscowGold, ...socialEvents]) {
    let state = event === moscowGold ? after(seed(), 7) : socialState(event);
    assert(SCHEDULED_EVENT_REGISTRY.some(candidate => candidate === event));
    for (const option of event.options) {
      assert(option.textZh && option.subtitle && option.subtitleZh);
      const before = JSON.stringify(state);
      const preview = getOptionEffectPreview(state, option);
      assert(preview.length);
      assert.equal(JSON.stringify(state), before);
    }
    const pendingEvents = calculateMonthlyEventQueue(state, state, state.year, state.month);
    state = gameReducer({ ...state, pendingEvents }, { type: 'SELECT_EVENT', payload: { eventId: event.id } });
    assert.equal(state.currentEvent?.id, event.id);
    const restored = deserializeGameState(serializeGameState(state), runtime);
    assert.equal(typeof restored.currentEvent!.options[0].effect, 'function');
    const finished = gameReducer(restored, { type: 'RESOLVE_EVENT', payload: restored.currentEvent!.options[0].effect });
    assert(finished.eventHistory.resolved.includes(event.id));
    assert.equal(shouldQueueEvent(event, finished, { mode: 'historical' }), false);
  }
});

console.log(`Civil-war social events: ${checks} checks passed.`);
