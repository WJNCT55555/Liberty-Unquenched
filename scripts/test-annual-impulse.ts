import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { calculateMonthlyEconomy } from '../src/game/rules/economy';
import {
  ANNUAL_IMPULSE_YEARS,
  DIFFICULTY_IMPULSE_SCALE,
  EMPTY_ANNUAL_IMPULSE,
  getAnnualEconomicImpulse,
  hasAnnualEconomicImpulseEffect,
  readAnnualEconomicImpulse,
} from '../src/game/rules/annualEconomicImpulse';
import type { GameState } from '../src/game/types';

/**
 * 年度经济冲量（`rules/annualEconomicImpulse.ts`）的规则测试。
 *
 * 重点不是"表里有数字"，而是三件事：
 *  1. **换表时机**：每年 1 月静默换表，其他月份不动，且不产生事件；
 *  2. **它是目标修正**：同一局面下，带冲量的目标值必须整体位移，且三个指标会朝新目标走；
 *  3. **长局不再冻结**（这条是这次改动的真正目的）：什么都不做跑 5 年，
 *     1931 剧本的三个指标必须仍然在变，而不是像改动前那样第 12 个月就冻住。
 */

let checks = 0;
const test = (name: string, fn: () => void) => {
  fn();
  checks++;
  console.log(`PASS ${name}`);
};

/**
 * 被放弃的"自定义界面事件"（`options: []` + `renderContent`，例如部长分配、
 * 第三次代表大会的强制失业决议）。测试里没有那个界面，只能让它过期；
 * 否则它会永远当 `currentEvent` 挂着，把月份一路推飞（推进的循环会反复走
 * event → action → 下一个月）。
 */
const dismissedCustomEvents: string[] = [];

/** 解决当前挂着的所有事件（当前事件 + 事件板 + 超级事件）。 */
const resolvePendingEvents = (state: GameState): GameState => {
  let next = state;
  let guard = 0;
  while ((next.currentEvent || next.pendingEvents.length > 0 || next.superEvent) && guard++ < 30) {
    if (next.superEvent) { next = gameReducer(next, { type: 'DISMISS_SUPER_EVENT' }); continue; }
    if (next.currentEvent) {
      const event = next.currentEvent;
      const available = event.options.filter(candidate => !candidate.condition || candidate.condition(next));
      if (available.length === 0) {
        dismissedCustomEvents.push(event.id);
        const cleared = gameReducer(next, { type: 'RESOLVE_EVENT', payload: () => ({ currentEvent: null }) });
        if (cleared === next) break;
        next = cleared;
        continue;
      }
      next = gameReducer(next, { type: 'RESOLVE_EVENT', payload: available[0].effect });
      continue;
    }
    next = gameReducer(next, { type: 'SELECT_EVENT', payload: { eventId: next.pendingEvents[0].id } });
  }
  return next;
};

/**
 * 推进**整整一个月**：阶段机是 action →（月结）event → action，所以"月份变了"才算过月；
 * 中途出现的事件都要解决，否则 `advancePhase` 会拒绝推进。
 */
const advanceOneMonth = (state: GameState): GameState => {
  let next = resolvePendingEvents(state);
  for (let guard = 0; guard < 12; guard++) {
    const before = `${next.year}-${next.month}`;
    next = resolvePendingEvents(gameReducer(next, { type: 'NEXT_PHASE' }));
    if (`${next.year}-${next.month}` !== before) return next;
  }
  return next;
};

/**
 * 推进到指定的年月，带硬上限与诊断信息。
 *
 * **必须有上限**：游戏走到结局（或战争地图回合）时月份会停止推进，没有上限的
 * `while` 会在这里空转成死循环。上限触发时直接抛错并说明当前局面。
 */
const advanceTo = (state: GameState, year: number, month: number, maxMonths: number): GameState => {
  let next = state;
  for (let i = 0; i < maxMonths; i++) {
    if (next.year === year && next.month === month) return next;
    const before = `${next.year}-${next.month}-${next.phase}`;
    next = advanceOneMonth(next);
    if (`${next.year}-${next.month}-${next.phase}` === before) {
      throw new Error(
        `月份卡在 ${before}（结局=${next.ending ?? '无'}，isGameOver=${next.isGameOver}）：无法到达 ${year}-${month}`,
      );
    }
  }
  throw new Error(`推进 ${maxMonths} 个月仍未到达 ${year}-${month}（当前 ${next.year}-${next.month}）`);
};

/** 冲量绝不能作为事件出现（它是静默机制）。 */
const looksLikeImpulseEvent = (id: string): boolean => /impulse|economic_environment/i.test(id);

test('冲量表覆盖 1932—1939，且和平/战时两套齐全', () => {
  assert.deepEqual(ANNUAL_IMPULSE_YEARS, [1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939]);
  ANNUAL_IMPULSE_YEARS.forEach((year) => {
    const peace = getAnnualEconomicImpulse(year, 'normal', 'not_started');
    assert.equal(peace.year, year);
    assert(peace.labelZh.length > 0, `${year} 缺中文说明`);
  });
  // 1936—1939 必须同时有战时行，且与和平行不同
  [1936, 1937, 1938, 1939].forEach((year) => {
    const peace = getAnnualEconomicImpulse(year, 'normal', 'not_started');
    const war = getAnnualEconomicImpulse(year, 'normal', 'ongoing');
    assert.notDeepEqual(war, peace, `${year} 的战时冲量必须与和平不同`);
    assert(war.inflation > 0, `${year} 战时通胀冲量应为正`);
  });
  // 表外年份＝零冲量（1931 开局干净）
  const none = getAnnualEconomicImpulse(1931, 'normal', 'not_started');
  assert.equal(hasAnnualEconomicImpulseEffect(none), false);
  assert.deepEqual({ ...none, year: 0 }, EMPTY_ANNUAL_IMPULSE);
});

test('难度倍数：sandbox 归零、historical 更痛、hard 在中间', () => {
  assert.equal(DIFFICULTY_IMPULSE_SCALE.sandbox, 0);
  const sandbox = getAnnualEconomicImpulse(1932, 'sandbox', 'not_started');
  assert.equal(hasAnnualEconomicImpulseEffect(sandbox), false, '沙盒不应被历史环境推着走');
  const normal = getAnnualEconomicImpulse(1932, 'normal', 'not_started');
  const hard = getAnnualEconomicImpulse(1932, 'hard', 'not_started');
  const historical = getAnnualEconomicImpulse(1932, 'historical', 'not_started');
  assert(normal.growth < 0 && hard.growth < normal.growth && historical.growth < hard.growth,
    `1932 增长冲量应随难度加深: ${normal.growth} / ${hard.growth} / ${historical.growth}`);
  assert(historical.unemployment > normal.unemployment, 'historical 的失业冲量更大');
});

test('冲量进入三个目标公式（是目标修正，不是当前值跳变）', () => {
  const base = createScenarioState('1931', 'normal', 'zh');
  const impulse = getAnnualEconomicImpulse(1932, 'normal', 'not_started');
  const withImpulse: GameState = { ...base, annualEconomicImpulse: impulse };

  const baseTargets = calculateMonthlyEconomy(base);
  const impulseTargets = calculateMonthlyEconomy(withImpulse);

  // 当前值不变，只有目标位移 → 下一月的值应朝冲量方向走
  assert.equal(withImpulse.economy_growth, base.economy_growth, '冲量不应直接改当前值');
  assert(impulseTargets.nextGrowth < baseTargets.nextGrowth,
    `1932 冲量应压低增长: ${baseTargets.nextGrowth} → ${impulseTargets.nextGrowth}`);
  assert(impulseTargets.nextInflation < baseTargets.nextInflation, '1932 冲量应压低通胀（通缩型萧条）');
  assert(impulseTargets.nextUnemployment > baseTargets.nextUnemployment, '1932 冲量应抬高失业');
  assert(impulseTargets.nextForeignExchange < baseTargets.nextForeignExchange, '1932 冲量应抽走外汇');
});

test('每年 1 月静默换表，且不产生事件', () => {
  let state = createScenarioState('1931', 'normal', 'zh'); // 1931·04
  assert.equal(readAnnualEconomicImpulse(state).year, 1931, '1931 开局为零冲量行');
  assert.equal(hasAnnualEconomicImpulseEffect(state.annualEconomicImpulse), false);
  assert(!state.pendingEvents.some(event => looksLikeImpulseEvent(event.id)), '冲量绝不能作为事件入队');

  // 走到 1932·01
  state = advanceTo(state, 1932, 1, 24);
  const january = readAnnualEconomicImpulse(state);
  assert.equal(january.year, 1932, '1932·1 应换上 1932 年的冲量');
  assert.equal(january.labelZh, '大萧条谷底');
  assert.equal(hasAnnualEconomicImpulseEffect(state.annualEconomicImpulse), true);
  assert(!state.pendingEvents.some(event => looksLikeImpulseEvent(event.id)), '冲量绝不能变成事件');

  // 2 月不再换表
  state = advanceOneMonth(state);
  assert.equal(readAnnualEconomicImpulse(state).year, 1932, '同一年内不重复换表');
  assert.equal(readAnnualEconomicImpulse(state).labelZh, '大萧条谷底');
});

test('长局不再冻结：5 年里三个指标始终在变（这是本次改动的目的）', () => {
  let state = createScenarioState('1931', 'normal', 'zh');
  const samples: Array<{ year: number; growth: number; inflation: number; unemployment: number; note: string }> = [];
  for (let month = 0; month < 72; month++) {
    state = advanceOneMonth(state);
    if (state.month === 1) {
      samples.push({
        year: state.year,
        growth: state.economy_growth,
        inflation: state.inflation_rate,
        unemployment: state.unemployment_rate,
        note: `${readAnnualEconomicImpulse(state).labelZh}｜战争:${state.civilWarStatus}｜欠款:${state.fiscal_arrears.toFixed(1)}｜外汇:${state.foreign_exchange.toFixed(0)}`,
      });
    }
  }
  assert(samples.length >= 5, `应至少采到 5 个 1 月样本，实际 ${samples.length}`);
  console.log('  每年 1 月的三个指标（什么都不做的一局）：');
  samples.forEach(sample => console.log(
    `    ${sample.year}  增长 ${sample.growth.toFixed(2)}  通胀 ${sample.inflation.toFixed(2)}  失业 ${sample.unemployment.toFixed(2)}   ← ${sample.note}`,
  ));
  const distinct = (pick: (sample: typeof samples[number]) => number): number =>
    new Set(samples.map(sample => pick(sample).toFixed(2))).size;
  assert(distinct(sample => sample.growth) >= 3, `增长应逐年变化: ${samples.map(s => s.growth.toFixed(2)).join(' → ')}`);
  assert(distinct(sample => sample.inflation) >= 3, `通胀应逐年变化: ${samples.map(s => s.inflation.toFixed(2)).join(' → ')}`);
  assert(distinct(sample => sample.unemployment) >= 3, `失业应逐年变化: ${samples.map(s => s.unemployment.toFixed(2)).join(' → ')}`);

  const first = samples[0];
  const trough = samples.find(sample => sample.year === 1933);
  const recovery = samples.find(sample => sample.year === 1935);
  assert(trough && recovery, '应采到 1933 与 1935 年样本');
  assert(trough!.unemployment > first.unemployment, `大萧条应抬高失业: ${first.unemployment} → ${trough!.unemployment}`);
  assert(trough!.growth < first.growth, `大萧条应压低增长: ${first.growth} → ${trough!.growth}`);
  assert(recovery!.growth > trough!.growth, `1935 复苏应抬回增长: ${trough!.growth} → ${recovery!.growth}`);
  assert(recovery!.unemployment < trough!.unemployment, `1935 复苏应让失业回落: ${trough!.unemployment} → ${recovery!.unemployment}`);
});

test('战时年份自动切到战时冲量', () => {
  const wartime = createScenarioState('1936', 'normal', 'zh'); // 1936·07 已开战
  const impulse = readAnnualEconomicImpulse(wartime);
  assert.equal(impulse.year, 1936);
  assert.equal(impulse.labelZh, '战争爆发');
  assert(impulse.inflation > 0 && impulse.growth < 0, '战时冲量应压低增长、抬高通胀');

  // 下一个 1 月换到 1937 年的战时行
  const state1937 = advanceTo(wartime, 1937, 1, 24);
  assert.equal(readAnnualEconomicImpulse(state1937).labelZh, '战时经济');
});

console.log(`\nAnnual economic impulse: ${checks} checks passed (${ANNUAL_IMPULSE_YEARS.length} years on the table).`);
if (dismissedCustomEvents.length > 0) {
  const unique = Array.from(new Set(dismissedCustomEvents));
  console.log(`（测试放弃的自定义界面事件：${unique.join(', ')} ×${dismissedCustomEvents.length}）`);
}
