import { strict as assert } from 'node:assert';
import { huelgaTelefonica1931 } from '../src/game/events/huelga_telefonica_1931';
import { PRE_START_STATE } from '../src/game/scenarios';
import { shouldQueueEvent } from '../src/game/utils/eventTrigger';
import { calculateMonthlyEventQueue } from '../src/game/rules/monthlyPipeline';

const state = {
  ...PRE_START_STATE,
  scenario: '1931' as const,
  cntStance: 'oppose' as const,
  eventHistory: { triggered: [], resolved: [] },
};

for (const mode of ['historical', 'nonHistorical'] as const) {
  const queues = (year: number, month: number, cntStance: 'oppose' | 'govern' = 'oppose') => (
    shouldQueueEvent(huelgaTelefonica1931, { ...state, year, month, cntStance }, { mode })
  );

  assert.equal(queues(1931, 6), false, `${mode}: the strike cannot occur before July 1931`);
  assert.equal(queues(1931, 7), true, `${mode}: the strike can occur in July 1931`);
  assert.equal(queues(1931, 7, 'govern'), false, `${mode}: CNT participation in government blocks it`);
  assert.equal(queues(1932, 1), false, `${mode}: a 1931 strike cannot first occur in 1932`);
  assert.equal(queues(1933, 1), false, `${mode}: leaving government during Casas Viejas cannot revive the strike`);
}

assert.equal(
  shouldQueueEvent(huelgaTelefonica1931, { ...state, year: 1931, month: 12 }, { mode: 'nonHistorical' }),
  true,
  'Non-historical mode retains the remaining 1931 window when CNT is outside government'
);
assert.equal(
  shouldQueueEvent(huelgaTelefonica1931, { ...state, year: 1931, month: 12 }, { mode: 'historical' }),
  false,
  'Historical mode keeps the exact July 1931 date'
);
const staleQueue = calculateMonthlyEventQueue(
  { ...state, year: 1931, month: 12, pendingEvents: [huelgaTelefonica1931] },
  { ...state, year: 1932, month: 1, pendingEvents: [huelgaTelefonica1931] },
  1932,
  1
);
assert.equal(staleQueue.some(event => event.id === huelgaTelefonica1931.id), false, 'An unresolved 1931 strike must expire at the new year');

console.log('Telephone strike chronology tests passed.');
