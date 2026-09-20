/**
 * Historical replay with a law ledger.
 *
 * Plays the 1931 scenario forward through the real reducer, never playing cards,
 * always taking the option marked "(Historical)" when one exists. Prints every
 * month in which any domestic-policy field changed, so each value in a scenario
 * descriptor can be traced to the event that produced it.
 *
 * Usage: npx tsx scripts/scenario-history-probe.ts <targetYear> <targetMonth>
 */
import { gameReducer } from '../src/game/reducers/gameReducer';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';

const D = (s: GameState, a: unknown): GameState => gameReducer(s, a as never);

const textOf = (t: unknown, s: GameState): string =>
  typeof t === 'function' ? String((t as (x: GameState) => unknown)(s)) : String(t ?? '');

const LAW_KEYS = [
  'land_law', 'public_order_law', 'security_corps_law', 'army_reform_law', 'militia_legality_law',
  'land_reform_progress', 'regional_autonomy_progress', 'max_hours_law', 'min_wage', 'workplace_safety',
  'political_rights', 'womens_rights', 'religion_policy', 'education_institutions', 'language_policy',
  'union_status', 'mixed_jury_cnt_opposed',
] as const;

const FLAG_KEYS = [
  'treintistasLeft', 'ps_founded', 'fe_founded', 'poum_founded', 'ceda_formed', 'ir_formed', 'ur_formed',
  'falange_jons', 'isCasasViejasTriggered', 'isJabaliTriggered', 'isRepublicanSocialistDissolved',
  'isCedaRadicalDissolved', 'dissolutionCount', 'impeachPresidentAvailable', 'isPresidentImpeached',
  'presidentElectionSeen', 'coupSystemActive', 'cntStance', 'cntStanceAlwaysOpposed',
] as const;

const snapshotLaws = (s: GameState) => {
  const out: Record<string, unknown> = {};
  for (const k of LAW_KEYS) out[k] = (s.domesticPolicy as unknown as Record<string, unknown>)[k];
  return out;
};
const snapshotFlags = (s: GameState) => {
  const out: Record<string, unknown> = {};
  for (const k of FLAG_KEYS) out[k] = (s as unknown as Record<string, unknown>)[k];
  return out;
};

const targetYear = Number(process.argv[2] ?? 1933);
const targetMonth = Number(process.argv[3] ?? 12);
const target = targetYear * 12 + targetMonth;

let state = D(PRE_START_STATE, { type: 'START_GAME', payload: { scenario: '1931', difficulty: 'historical' } });
let laws = snapshotLaws(state);
let flags = snapshotFlags(state);
const ledger: string[] = [`   start ${state.year}-${state.month}  laws=${JSON.stringify(laws)}`];

let iterations = 0;
let lastKey = '';
let stuck = 0;

while (state.year * 12 + state.month < target && iterations < 20000) {
  iterations++;
  if (state.isGameOver) { ledger.push(`   GAME OVER @ ${state.year}-${state.month}`); break; }

  if (state.superEvent) { state = D(state, { type: 'DISMISS_SUPER_EVENT' }); }
  else if (state.currentEvent) {
    const ev = state.currentEvent;
    const options = ev.options ?? [];
    const historical = options.find(o => /\(Historical\)|（历史）/.test(`${textOf(o.text, state)} ${textOf(o.textZh, state)}`));
    const option = historical ?? options.find(o => typeof o.effect === 'function');
    if (option && typeof option.effect === 'function') {
      state = D(state, { type: 'RESOLVE_EVENT', payload: option.effect });
      ledger.push(`   ${state.year}-${state.month} ${ev.id} -> ${historical ? 'HISTORICAL' : 'default'} option`);
    } else {
      ledger.push(`   ${state.year}-${state.month} ${ev.id}: NO USABLE OPTION`);
      state = D(state, { type: 'CHECK_EVENT' });
    }
  } else if (state.phase === 'event' && state.pendingEvents.length > 0) {
    state = D(state, { type: 'SELECT_EVENT', payload: { eventId: state.pendingEvents[0].id } });
  } else if (state.phase === 'event') { state = D(state, { type: 'CHECK_EVENT' }); }
  else if (state.phase === 'action') { state = D(state, { type: 'NEXT_PHASE' }); }
  else if (state.phase === 'war') { state = D(state, { type: 'END_MAP_PLAYER_TURN' }); }
  else { state = D(state, { type: 'NEXT_PHASE' }); }

  const nextLaws = snapshotLaws(state);
  if (JSON.stringify(nextLaws) !== JSON.stringify(laws)) {
    const delta: string[] = [];
    for (const k of LAW_KEYS) if (nextLaws[k] !== laws[k]) delta.push(`${k}: ${String(laws[k])} -> ${String(nextLaws[k])}`);
    ledger.push(`>> ${state.year}-${state.month} LAW CHANGE: ${delta.join(', ')}`);
    laws = nextLaws;
  }
  const nextFlags = snapshotFlags(state);
  if (JSON.stringify(nextFlags) !== JSON.stringify(flags)) {
    const delta: string[] = [];
    for (const k of FLAG_KEYS) if (nextFlags[k] !== flags[k]) delta.push(`${k}: ${String(flags[k])} -> ${String(nextFlags[k])}`);
    ledger.push(`>> ${state.year}-${state.month} FLAG CHANGE: ${delta.join(', ')}`);
    flags = nextFlags;
  }

  const key = `${state.year}-${state.month}|${state.phase}|${state.currentEvent?.id ?? '-'}|${state.pendingEvents.length}|${state.actionsLeft}|${state.mapCurrentPlayer ?? '-'}`;
  if (key === lastKey) {
    stuck++;
    if (stuck > 8) { ledger.push(`   ${state.year}-${state.month} STUCK @ ${key} -> forced NEXT_PHASE`); state = D(state, { type: 'NEXT_PHASE' }); stuck = 0; }
  } else stuck = 0;
  lastKey = key;
}

console.log(`=== 1931 (historical) replayed to ${targetYear}-${targetMonth} — reached ${state.year}-${state.month} in ${iterations} iterations ===`);
console.log(ledger.join('\n'));
console.log('\nFINAL LAWS :', JSON.stringify(laws, null, 0));
console.log('FINAL FLAGS:', JSON.stringify(flags, null, 0));
