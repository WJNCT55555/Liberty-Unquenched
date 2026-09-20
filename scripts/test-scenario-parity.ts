/**
 * Scenario start-state parity harness.
 *
 * Dumps a canonical snapshot of every scenario start state so a refactor of the
 * START_GAME initialization path can be proven behaviour-preserving.
 *
 * Usage:
 *   npx tsx scripts/test-scenario-parity.ts output/scenario-parity-before.json
 *   npx tsx scripts/test-scenario-parity.ts output/scenario-parity-after.json
 *
 * The two files must be byte-identical for the migration to be a pure code move.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';

const SCENARIOS = ['1931', '1933', '1936'] as const;
const DIFFICULTIES = ['easy', 'normal', 'hard', 'historical', 'sandbox'] as const;

/**
 * Deep clone that keeps functions by reference. The reducer must see the same
 * shape the app hands it, so `JSON.parse(JSON.stringify(...))` is not good
 * enough here — it would silently strip every card/event `effect` callback.
 */
const clonePreservingFunctions = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => clonePreservingFunctions(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = clonePreservingFunctions(item);
    }
    return result as unknown as T;
  }
  return value;
};

/** Canonical, order-stable serialization: sorted keys, explicit function markers. */
const canonicalize = (value: unknown): unknown => {
  if (typeof value === 'function') return '«fn»';
  if (typeof value === 'undefined') return '«undefined»';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return '«NaN»';
    if (value === Infinity) return '«Infinity»';
    if (value === -Infinity) return '«-Infinity»';
    return value;
  }
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
  }
  return sorted;
};

const snapshot = (label: string, state: GameState) => ({
  label,
  state: canonicalize(state),
});

const report: Record<string, unknown> = {};
report['__PRE_START_STATE__'] = canonicalize(PRE_START_STATE);

for (const scenario of SCENARIOS) {
  for (const difficulty of DIFFICULTIES) {
    const label = `${scenario}/${difficulty}`;
    const seeded = clonePreservingFunctions(PRE_START_STATE);
    const result = gameReducer(seeded, {
      type: 'START_GAME',
      payload: { scenario, difficulty },
    });
    report[label] = snapshot(label, result);
  }
}

// Also snapshot a 1931 start reached from a state whose language differs, since
// START_GAME copies `state.language` through.
for (const language of ['zh'] as const) {
  const seeded = { ...clonePreservingFunctions(PRE_START_STATE), language };
  const result = gameReducer(seeded, {
    type: 'START_GAME',
    payload: { scenario: '1931', difficulty: 'normal' },
  });
  report[`1931/normal/lang=${language}`] = snapshot(`1931/normal/lang=${language}`, result);
}

const target = process.argv[2] ?? 'output/scenario-parity.json';
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const labels = Object.keys(report);
console.log(`Wrote ${labels.length} snapshots to ${target}`);
console.log(labels.join('\n'));
