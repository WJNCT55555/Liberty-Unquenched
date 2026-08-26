/**
 * driver.ts — 无 AI 的纯逻辑推演器（由 tools/sim.mjs 构建运行）
 *
 * 直接用真实 gameReducer 逐回合结算事件/卡牌/月份/地图战争，
 * 用确定性启发式（按路线打分）代替人工选择，输出里程碑与异常日志。
 * 不改动任何现有源码（gameReducer 导出由 sim.mjs 在内存中注入）。
 */
// --- browser shims (headless) ---
(globalThis as any).localStorage = {
  _s: new Map<string, string>(),
  getItem(k: string) { return this._s.has(k) ? this._s.get(k) : null; },
  setItem(k: string, v: string) { this._s.set(k, String(v)); },
  removeItem(k: string) { this._s.delete(k); },
  clear() { this._s.clear(); },
  key(i: number) { return [...this._s.keys()][i] ?? null; },
  get length() { return this._s.size; },
};

import { gameReducer, INITIAL_STATE } from '../src/game/GameContext';
import type { GameState } from '../src/game/types';
import { MapFaction } from '../src/map/types_map';
import { PROVINCE_ADJACENCY } from '../src/map/map_constants';

type Route = 'peace' | 'asturias' | 'civilwar';
type Difficulty = 'easy' | 'normal' | 'hard';

interface Config {
  route: Route;
  difficulty: Difficulty;
  scenario: '1931' | '1933';
  tag: string;
  maxMonths: number;
  maxIterations: number;
}

const D = (s: GameState, a: any): GameState => gameReducer(s, a as any);
const rtext = (t: any, s: GameState): string =>
  typeof t === 'function' ? String(t(s)) : String(t ?? '');

// ---------- 路线评分 ----------
function overallDissent(s: GameState): number {
  const vals = Object.values((s.factions ?? {}) as any) as any[];
  const total = vals.reduce((a, f) => a + (f?.influence ?? 0), 0);
  if (total <= 0) return 0;
  return vals.reduce((a, f) => a + ((f?.influence ?? 0) * (f?.dissent ?? 0)), 0) / 100;
}

function metric(s: GameState, route: Route): number {
  const st: any = s.stats ?? {};
  const j: any = s.journal ?? {};
  const fs: any = s.factions ?? {};
  const pr: any = s.partyRelations ?? {};
  const rc = s.rulingCoalition as string | null;
  const ds = overallDissent(s);
  switch (route) {
    case 'peace':
      return (st.republicanAuthority ?? 50) * 2 + (st.armyLoyalty ?? 50) * 1.5
        + (100 - (st.tension ?? 34)) * 2 + (100 - (st.revolutionaryFervor ?? 10)) * 0.2
        + (s.budget ?? 12) - (s.public_debt ?? 500) * 0.01 + (st.workerControl ?? 0) - ds;
    case 'asturias': {
      const alianzaDone = j['journal_alianza_obrera']?.status === 'completed';
      let m = (st.revolutionaryFervor ?? 10) * 2 + (st.tension ?? 34)
        + (s.workersAllianceProgress ?? 0) * 20 + (j['journal_uhp']?.progress ?? 0)
        + (fs.Faistas?.influence ?? 0) + (fs.Puristas?.influence ?? 0)
        + (pr.PSOE ?? 0) * 0.5 + (st.workerControl ?? 0) - ds * 0.5;
      if (rc === 'popular_front' || rc === 'republican_socialist') m -= 5000;
      if (rc === 'ceda_radical') m += 40;
      // 革命触发前禁止把 tension/fervor 推过阈值（Alianza 未完成时）
      if (!alianzaDone && s.year >= 1934 && s.month >= 1) {
        if ((st.tension ?? 0) > 60 || (st.revolutionaryFervor ?? 0) > 50) m -= 3000;
      }
      return m;
    }
    case 'civilwar':
      return (s.armaments ?? 1) * 2 + (s.resources ?? 2) + (st.revolutionaryFervor ?? 10)
        + (st.anarchistMilitia ?? 0) / 100 + (s.militiaCombatPower ?? 100) / 10
        + (st.workerControl ?? 0) + (s.internationalBrigades ?? 0) / 100
        - ds + (st.armyLoyalty ?? 50) * 0.3;
  }
}

function scoreEffect(s: GameState, effect: any, route: Route): number {
  try {
    const next = effect(s);
    if (!next || typeof next !== 'object') return Number.NEGATIVE_INFINITY;
    return metric({ ...s, ...next }, route);
  } catch {
    return Number.NEGATIVE_INFINITY;
  }
}

// ---------- 事件选择 ----------
function pickOption(s: GameState, ev: any, route: Route): any {
  const easySkip = (o: any) =>
    !/Return card to hand|返还消耗|Apply Effect|应用效果/.test(rtext(o.text, s) + rtext(o.textZh, s));
  const usable = ev.options.filter((o: any) => o && typeof o.effect === 'function' && easySkip(o));
  const available = usable.filter((o: any) => !o.condition || o.condition(s));
  const pool = available.length > 0 ? available : usable;
  if (pool.length === 0) return null;
  if (ev.id === 'civil_war_setup') {
    const def = pool.find((o: any) =>
      /default historical|默认历史/.test(rtext(o.text, s) + rtext(o.textZh, s)));
    if (def) return def;
  }
  let best = pool[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const opt of pool) {
    const text = rtext(opt.text, s) + ' ' + rtext(opt.textZh, s);
    let sc = scoreEffect(s, opt.effect, route);
    if (route === 'peace' && /ramon|拉蒙/i.test(text)) sc += 5000;
    if (route === 'peace' && /阿萨尼亚|azaña/i.test(text)) sc -= 3000;
    if (route === 'asturias' && /人民阵线|popular front/i.test(text)) sc -= 3000;
    if (sc > bestScore) { bestScore = sc; best = opt; }
  }
  return best;
}

// 组件驱动事件（options 为空，由 React 内结算）——headless 下手工构造等效效果
function resolveComponentEvent(s: GameState, ev: any): GameState {
  if (ev.id === 'minister_allocation') {
    return D(s, {
      type: 'RESOLVE_EVENT',
      payload: (cur: GameState) => ({
        ministers: { ...cur.ministers, labor: 'CNT', industry: 'CNT' },
        leverage: Math.max(0, (cur.leverage ?? 15) - 15),
        stats: { ...cur.stats, workerControl: Math.min(100, (cur.stats.workerControl ?? 0) + 35) },
        currentEvent: null,
      }),
    });
  }
  return D(s, { type: 'CHECK_EVENT' });
}

// ---------- 顾问 ----------
function setupAdvisors(state: GameState, cfg: Config): GameState {
  let s = state;
  const prefs: Record<Route, string[]> = {
    peace: ['Horacio Martínez Prieto', 'Federica Montseny', 'Joan Peiró'],
    asturias: ['orobon_fernandez', 'Segundo Blanco', 'Ángel Pestaña'],
    civilwar: ['Buenaventura Durruti', 'Juan García Oliver', 'Francisco Ascaso'],
  };
  for (let slot = 0; slot < 3; slot++) {
    if (s.activeAdvisors?.[slot]) continue;
    const pool: any[] = s.advisorPool ?? [];
    const pick = prefs[cfg.route].map((id) => pool.find((a) => a?.id === id)).find(Boolean)
      ?? pool.find((a) => !s.activeAdvisors?.includes(a));
    if (!pick) break;
    s = D(s, { type: 'ADD_ADVISOR', payload: { advisor: pick, slotIndex: slot } });
  }
  return s;
}

function playAdvisorActions(s: GameState, cfg: Config): GameState {
  let state = s;
  let guard = 0;
  while (state.actionsLeft > 0 && guard++ < 6) {
    const base = metric(state, cfg.route);
    let best: any = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const adv of state.activeAdvisors ?? []) {
      if (!adv) continue;
      for (const act of adv.actions ?? []) {
        if (act.condition && !act.condition(state)) continue;
        const wrapped = (cur: GameState) => ({ ...act.effect(cur), actionsLeft: Math.max(0, cur.actionsLeft - 1) });
        const sc = scoreEffect(state, wrapped, cfg.route);
        if (sc > bestScore) { bestScore = sc; best = wrapped; }
      }
    }
    if (!best || bestScore < base - 0.5) break;
    state = D(state, { type: 'RESOLVE_EVENT', payload: best });
  }
  return state;
}

function playActionPhase(s: GameState, cfg: Config): GameState {
  let state = playAdvisorActions(s, cfg);
  const handLimit = state.difficulty === 'hard' ? 3 : 4;
  while (state.hand.length < handLimit) {
    const before = state.hand.length;
    const decks: any[] = [];
    if (state.actionDeck.length) decks.push('Action');
    if (state.governmentDeck.length) decks.push('Governmental');
    if (state.civilWarStatus !== 'not_started' && state.militaryDeck.length) decks.push('Military');
    if (decks.length === 0) break;
    state = D(state, { type: 'DRAW_CARD', payload: decks[0] });
    if (state.hand.length === before) break;
  }
  let guard = 0;
  while (state.actionsLeft > 0 && guard++ < 20) {
    const base = metric(state, cfg.route);
    let best: any = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const c of state.hand) {
      if (state.actionsLeft < (c.cost ?? 1)) continue;
      if (c.resourceCost !== undefined && (state.resources ?? 0) < c.resourceCost) continue;
      if (c.armamentCost !== undefined && (state.armaments ?? 0) < c.armamentCost) continue;
      if (c.condition && !c.condition(state)) continue;
      const sc = scoreEffect(state, c, cfg.route);
      if (sc > bestScore) { bestScore = sc; best = c; }
    }
    if (!best || bestScore < base - 0.5) break;
    state = D(state, { type: 'PLAY_CARD', payload: best });
  }
  return state;
}

// ---------- 地图战争 ----------
function buildAdj(): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  for (const [k, vs] of Object.entries(PROVINCE_ADJACENCY)) {
    if (k.endsWith('_adjacent')) continue;
    adj[k] = adj[k] ?? [];
    for (const v of vs as string[]) {
      adj[k].push(v);
      adj[v] = adj[v] ?? [];
      adj[v].push(k);
    }
  }
  return adj;
}
const ADJ = buildAdj();

function bfsStep(from: string, goal: string): string | null {
  if (from === goal || !ADJ[from]) return null;
  const queue: string[][] = ADJ[from].map((n) => [n]);
  const visited = new Set<string>([from]);
  while (queue.length) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    if (visited.has(node)) continue;
    visited.add(node);
    if (node === goal) return path[0];
    for (const nb of ADJ[node] ?? []) if (!visited.has(nb)) queue.push([...path, nb]);
  }
  return null;
}

function getWarTargets(s: GameState): string[] {
  const provs: any = s.provinces ?? {};
  if (s.activeWar === 'asturias_war') {
    return ['madrid', 'malaga', 'zaragoza', 'valencia'].filter(
      (p) => provs[p]?.owner !== MapFaction.WORKERS_ALLIANCE);
  }
  const lostCore = ['madrid', 'barcelona', 'valencia'].filter(
    (p) => provs[p]?.owner === MapFaction.NATIONALIST);
  const list = Object.values(provs)
    .filter((p: any) => p?.owner === MapFaction.NATIONALIST)
    .map((p: any) => p.id) as string[];
  list.sort((a, b) => {
    const av = provs[a]?.strategicValue ?? 0;
    const bv = provs[b]?.strategicValue ?? 0;
    const pa = a === 'burgos' ? 1000 : 0;
    const pb = b === 'burgos' ? 1000 : 0;
    return (pb + bv) - (pa + av);
  });
  return [...lostCore, ...list.filter((p) => !lostCore.includes(p))];
}

function pickMoveStep(s: GameState, army: any): string | null {
  if (s.activeWar === 'spanish_civil_war') {
    const provs: any = s.provinces ?? {};
    const enemies: any[] = (s.armies ?? []).filter((a) => a.faction === MapFaction.NATIONALIST);
    for (const core of ['madrid', 'barcelona', 'valencia']) {
      if (provs[core]?.owner !== MapFaction.REPUBLICAN) return bfsStep(army.provinceId, core);
      const threatened = enemies.some((e) => (ADJ[e.provinceId] ?? []).includes(core));
      if (threatened) return bfsStep(army.provinceId, core);
    }
  }
  const targets = getWarTargets(s);
  return targets.length ? bfsStep(army.provinceId, targets[0]) : null;
}

function playWarPhase(s: GameState, cfg: Config): GameState {
  let state = s;
  let guard = 0;
  while (state.phase === 'war' && guard++ < 300) {
    const playerFaction = state.activeWar === 'asturias_war' ? MapFaction.WORKERS_ALLIANCE : MapFaction.REPUBLICAN;
    if (state.mapCurrentPlayer !== playerFaction) { state = D(state, { type: 'NEXT_PHASE' }); continue; }
    const res: any = state.mapResources?.[playerFaction];
    const cp = res?.commandPoints ?? 0;
    if (cp <= 0) { state = D(state, { type: 'END_MAP_PLAYER_TURN' }); continue; }

    // 同省军队合并（集中兵力）
    const byProv: Record<string, string[]> = {};
    for (const a of state.armies ?? []) {
      if (a.faction !== playerFaction) continue;
      byProv[a.provinceId] = byProv[a.provinceId] ?? [];
      byProv[a.provinceId].push(a.id);
    }
    for (const ids of Object.values(byProv)) {
      if (ids.length < 2) continue;
      for (const id of ids) state = D(state, { type: 'SELECT_MAP_ARMY', payload: { armyId: id, isShift: true } });
      state = D(state, { type: 'MERGE_MAP_ARMIES' });
    }

    // 征兵 + 整编（不耗 CP）
    if ((res?.manpower ?? 0) > 5000 && (res?.supplies ?? 0) > 800 && (res?.industrialCapacity ?? 0) > 60) {
      const provs: any = state.provinces ?? {};
      const owned = Object.values(provs).filter((p: any) => p?.owner === playerFaction).map((p: any) => p.id);
      // This driver only simulates Republican-side players, so the enemy is always the Nationalists.
      const enemyFaction = MapFaction.NATIONALIST;
      const spot = owned.find((id: string) => (ADJ[id] ?? []).some((nb) => provs[nb]?.owner === enemyFaction)) ?? owned[0];
      if (spot) state = D(state, { type: 'RECRUIT_MAP_ARMY', payload: { provinceId: spot, composition: { infantry: 2000, artillery: 500, tanks: 0 } } });
    }
    for (const a of state.armies ?? []) {
      if (a.faction !== playerFaction) continue;
      const dc: any = a.designedComposition ?? a.composition;
      const need = (dc.infantry - a.composition.infantry) + (dc.artillery - a.composition.artillery) + (dc.tanks - a.composition.tanks);
      if (need > 300) state = D(state, { type: 'REINFORCE_MAP_ARMY', payload: { armyId: a.id } });
    }

    let moved = false;
    for (const army of (state.armies ?? []).filter((a: any) => a.faction === playerFaction)) {
      const cpNow = state.mapResources?.[playerFaction]?.commandPoints ?? 0;
      if (cpNow <= 0) break;
      if ((army.movesLeft ?? 0) <= 0) continue;
      const step = pickMoveStep(state, army);
      if (!step) continue;
      state = D(state, { type: 'MOVE_MAP_ARMY', payload: { armyId: army.id, targetProvinceId: step } });
      moved = true;
    }
    if (!moved) state = D(state, { type: 'END_MAP_PLAYER_TURN' });
  }
  return state;
}

// ---------- 主循环 ----------
function run(cfg: Config): void {
  const log: string[] = [];
  let state = D(INITIAL_STATE, { type: 'START_GAME', payload: { scenario: cfg.scenario, difficulty: cfg.difficulty } });
  state = setupAdvisors(state, cfg);
  let months = 0, iterations = 0, stuck = 0, lastKey = '';
  let lastMonth = `${state.year}-${state.month}`;
  const notable: string[] = [];
  log.push(`[run] route=${cfg.route} scenario=${cfg.scenario} diff=${cfg.difficulty} start=${state.year}-${state.month} super=${state.superEvent}`);

  while (!state.isGameOver && months < cfg.maxMonths && iterations < cfg.maxIterations) {
    iterations++;

    if (state.superEvent) {
      notable.push(`[super] ${state.superEvent} @ ${state.year}-${state.month}`);
      state = D(state, { type: 'DISMISS_SUPER_EVENT' });
      continue;
    }
    if (state.currentEvent) {
      const ev = state.currentEvent;
      const opt = pickOption(state, ev, cfg.route);
      if (!opt) {
        notable.push(`[skip:${ev.id}] no usable option (component path)`);
        state = resolveComponentEvent(state, ev);
        continue;
      }
      if (/^(presidential_|ramon|cw_|civil_war|asturias_|uhp|workers_alliance|elections_|jabali|crossroads)/.test(ev.id)) {
        notable.push(`[ev:${ev.id}] ${state.year}-${state.month} -> ${String(rtext(opt.textZh, state) || rtext(opt.text, state)).slice(0, 40)}`);
      }
      const before = `${state.phase}|${state.currentEvent?.id}`;
      state = D(state, { type: 'RESOLVE_EVENT', payload: opt.effect });
      if (before === `${state.phase}|${state.currentEvent?.id}` && state.currentEvent) {
        notable.push(`[BUG?] ${ev.id} did not resolve; forced advance`);
        state = D(state, { type: 'CHECK_EVENT' });
      }
    } else if (state.phase === 'event' && state.pendingEvents.length > 0) {
      state = D(state, { type: 'SELECT_EVENT', payload: { eventId: state.pendingEvents[0].id } });
    } else if (state.phase === 'event') {
      state = D(state, { type: 'CHECK_EVENT' });
    } else if (state.phase === 'action') {
      state = playActionPhase(state, cfg);
      if (state.phase === 'action') state = D(state, { type: 'NEXT_PHASE' });
    } else if (state.phase === 'war') {
      state = playWarPhase(state, cfg);
    }

    const key = `${state.year}-${state.month}|${state.phase}|${state.currentEvent?.id ?? '-'}|${state.pendingEvents.length}|${state.actionsLeft}|${state.mapCurrentPlayer ?? '-'}`;
    if (key === lastKey) {
      stuck++;
      if (stuck > 8) { notable.push(`[BUG?] stuck @ ${key}; forced advance`); state = D(state, { type: 'NEXT_PHASE' }); stuck = 0; }
    } else stuck = 0;
    lastKey = key;

    const mkey = `${state.year}-${state.month}`;
    if (mkey !== lastMonth) { months++; lastMonth = mkey; }
    if (iterations % 250 === 0 && state.phase === 'event') {
      log.push(`[progress] ${state.year}-${state.month} phase=${state.phase} pending=${state.pendingEvents.length} war=${state.civilWarStatus}/${state.activeWar ?? '-'} ending=${state.ending ?? '-'}`);
    }
  }

  const st: any = state.stats ?? {};
  const provinces: any = state.provinces ?? {};
  log.push(`[end] iter=${iterations} months≈${months} date=${state.year}-${state.month}`);
  log.push(`[end] isGameOver=${state.isGameOver} ending=${state.ending ?? 'NONE'} civilWar=${state.civilWarStatus} wars=${JSON.stringify(state.wars)} activeWar=${state.activeWar ?? '-'}`);
  log.push(`[end] stats=${JSON.stringify(st)}`);
  log.push(`[end] government=${JSON.stringify(state.government)} rulingCoalition=${JSON.stringify(state.rulingCoalition)}`);
  log.push(`[end] journals=${JSON.stringify(Object.fromEntries(Object.entries(state.journal ?? {}).map(([k, v]: any) => [k, v.status])))}`);
  log.push(`[end] provinces nat=${Object.values(provinces).filter((p: any) => p?.owner === MapFaction.NATIONALIST).length} rep=${Object.values(provinces).filter((p: any) => p?.owner === MapFaction.REPUBLICAN).length} wa=${Object.values(provinces).filter((p: any) => p?.owner === MapFaction.WORKERS_ALLIANCE).length} armies=${(state.armies ?? []).length}`);
  log.push('--- notable (last 60) ---');
  for (const n of notable.slice(-60)) log.push(n);
  log.push('--- anomalies ---');
  const anoms = log.filter((l) => l.startsWith('ANOMALY') || l.includes('[BUG?]'));
  if (anoms.length === 0) log.push('(none)');
  else for (const a of anoms) log.push(a);

  console.log(`\n========== RESULT ${cfg.tag} ==========`);
  console.log(log.join('\n'));
}

const args = process.argv.slice(2);
const which = args[0] ?? 'all';
const diff = (args[1] as Difficulty) ?? 'normal';

const routes: Config[] = [
  { route: 'peace', difficulty: diff, scenario: '1931', tag: 'PEACE', maxMonths: 105, maxIterations: 20000 },
  { route: 'asturias', difficulty: diff, scenario: '1933', tag: 'ASTURIAS', maxMonths: 90, maxIterations: 12000 },
  { route: 'civilwar', difficulty: diff, scenario: '1931', tag: 'CIVILWAR', maxMonths: 80, maxIterations: 20000 },
];

if (which === 'all') for (const c of routes) run(c);
else {
  const c = routes.find((r) => r.tag.toLowerCase() === which.toLowerCase());
  if (c) run(c);
  else console.error('unknown route: ' + which);
}
