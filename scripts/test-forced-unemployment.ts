import assert from 'node:assert/strict';
import type { GameState } from '../src/game/types';
import { createScenarioState } from '../src/game/scenarios';
import {
  cnt_forced_unemployment_resolution,
  cnt_third_congress_3,
} from '../src/game/events/cnt_third_congress';
import { forcedUnemploymentJournal } from '../src/game/journal/forced_unemployment';
import {
  advanceForcedUnemploymentStreak,
  FORCED_UNEMPLOYMENT_JOURNAL_ID,
  getForcedUnemploymentChips,
  getForcedUnemploymentProgress,
  getForcedUnemploymentRewards,
  isValidForcedUnemploymentSelection,
  type ForcedUnemploymentPledgeId,
} from '../src/game/rules/forcedUnemployment';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { advancePhase } from '../src/game/rules/phaseOrchestrator';

const original = createScenarioState('1931', 'normal', 'zh');
assert.equal(original.journal[FORCED_UNEMPLOYMENT_JOURNAL_ID]?.status, 'inactive');
for (const option of cnt_third_congress_3.options) {
  assert.equal(option.effect(original).currentEvent?.id, 'cnt_forced_unemployment_resolution');
}

assert.equal(isValidForcedUnemploymentSelection(['hours_1', 'unemployment_13']), true);
assert.equal(isValidForcedUnemploymentSelection(['hours_1', 'hours_2', 'unemployment_13']), false);
assert.equal(isValidForcedUnemploymentSelection(['hours_1', 'unemployment_13', 'unemployment_13']), false);

const selection: ForcedUnemploymentPledgeId[] = ['hours_1', 'unemployment_13', 'cnt_union_20'];
const rendered = cnt_forced_unemployment_resolution.renderContent?.(original, () => undefined) as {
  props: { onConfirm: (state: GameState, ids: ForcedUnemploymentPledgeId[]) => Partial<GameState> };
};
const adoptedPatch = rendered.props.onConfirm(original, selection);
assert.equal(adoptedPatch.currentEvent?.id, 'cnt_third_congress_4');
assert.equal(adoptedPatch.journal?.[FORCED_UNEMPLOYMENT_JOURNAL_ID]?.status, 'active');
assert.equal(adoptedPatch.forcedUnemploymentMandate?.chips, getForcedUnemploymentChips(selection));

let active: GameState = { ...original, ...adoptedPatch, currentEvent: null };
active = {
  ...active,
  unemployment_rate: 12.8,
  unionShare: { ...active.unionShare!, CNT: 20, unorganized: active.unionShare!.unorganized - 10 },
};
for (let month = 1; month <= 3; month++) {
  active = { ...active, ...advanceForcedUnemploymentStreak(active) };
  assert.equal(active.forcedUnemploymentMandate?.unemploymentStreak, month);
  assert.equal(forcedUnemploymentJournal.checkStatus?.(active, active.journal[FORCED_UNEMPLOYMENT_JOURNAL_ID]), month === 3 ? 'completed' : null);
}
assert.equal(getForcedUnemploymentProgress(active), 100);
const success = forcedUnemploymentJournal.onComplete?.(active);
assert.ok((success?.classes?.Obreros.support.CNT_FAI ?? 0) > active.classes.Obreros.support.CNT_FAI);

const lapse = { ...active, unemployment_rate: 15 };
assert.equal(advanceForcedUnemploymentStreak(lapse).forcedUnemploymentMandate?.unemploymentStreak, 0);

const failed: GameState = {
  ...active,
  year: 1935,
  month: 6,
  unemployment_rate: 16,
  forcedUnemploymentMandate: { ...active.forcedUnemploymentMandate!, unemploymentStreak: 0 },
};
assert.equal(forcedUnemploymentJournal.checkStatus?.(failed, failed.journal[FORCED_UNEMPLOYMENT_JOURNAL_ID]), 'failed');
assert.equal(forcedUnemploymentJournal.checkStatus?.({ ...failed, unemployment_rate: 12, forcedUnemploymentMandate: { ...failed.forcedUnemploymentMandate!, unemploymentStreak: 3 } }, failed.journal[FORCED_UNEMPLOYMENT_JOURNAL_ID]), 'completed');
const failure = forcedUnemploymentJournal.onFail?.(failed);
assert.ok((failure?.classes?.Obreros.support.CNT_FAI ?? 100) < failed.classes.Obreros.support.CNT_FAI);
assert.ok((failure?.stats?.revolutionaryFervor ?? 100) < failed.stats.revolutionaryFervor);
assert.ok(getForcedUnemploymentRewards(14).failureWorkers < getForcedUnemploymentRewards(4).failureWorkers);
assert.ok(getForcedUnemploymentRewards(14).successWorkers > getForcedUnemploymentRewards(4).successWorkers);

// Exercise the actual month pipeline: unemployment is checked after the economy,
// and the outcome event must be queued after the journal settles.
const pipelinePatch = rendered.props.onConfirm(original, ['hours_1', 'unemployment_13']);
let pipelineState: GameState = {
  ...original,
  ...pipelinePatch,
  phase: 'action',
  currentEvent: null,
  pendingEvents: [],
  unemployment_rate: 10.5,
};
const workerSupportBefore = pipelineState.classes.Obreros.support.CNT_FAI;
for (let month = 0; month < 3; month++) {
  pipelineState = advancePhase(pipelineState, {
    finishPlayerMapTurn: state => state,
    checkWarStatus: state => state,
  });
  if (month < 2) {
    assert.equal(pipelineState.journal[FORCED_UNEMPLOYMENT_JOURNAL_ID].status, 'active');
    pipelineState = { ...pipelineState, phase: 'action', currentEvent: null, pendingEvents: [] };
  }
}
assert.equal(pipelineState.journal[FORCED_UNEMPLOYMENT_JOURNAL_ID].status, 'completed');
assert.ok(pipelineState.pendingEvents.some(event => event.id === 'cnt_forced_unemployment_fulfilled'));
assert.ok(pipelineState.classes.Obreros.support.CNT_FAI > workerSupportBefore);

const saveState = { ...active, currentEvent: cnt_forced_unemployment_resolution };
const snapshot = serializeGameState(saveState);
const restored = deserializeGameState(snapshot, {
  cards: CARD_REGISTRY,
  advisors: INITIAL_ADVISORS,
  events: RESTORABLE_EVENT_REGISTRY,
});
assert.equal(restored.currentEvent?.id, 'cnt_forced_unemployment_resolution');
assert.equal(typeof restored.currentEvent?.renderContent, 'function');
assert.deepEqual(restored.forcedUnemploymentMandate, active.forcedUnemploymentMandate);

const olderSnapshot = structuredClone(snapshot);
delete (olderSnapshot.state.journal as Record<string, unknown>)[FORCED_UNEMPLOYMENT_JOURNAL_ID];
const migrated = deserializeGameState(olderSnapshot, {
  cards: CARD_REGISTRY,
  advisors: INITIAL_ADVISORS,
  events: RESTORABLE_EVENT_REGISTRY,
});
assert.equal(migrated.journal[FORCED_UNEMPLOYMENT_JOURNAL_ID]?.status, 'inactive');

console.log('Forced-unemployment resolution, journal outcomes, and save restoration passed.');
