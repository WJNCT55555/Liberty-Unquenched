/**
 * 司法改革卡的回归测试。
 *
 * 覆盖四件事：
 *  1. 触发条件与规格一致（CNT 参政 + 司法部长是 CNT + 冷却归零）；
 *  2. 三条路线的进度推进是 +1 / +2 / +0，并且封顶 100；
 *  3. 激进路线通过**成员承诺度**下调阵线团结度（不是直接写 cohesion——那一层每次
 *     reducer 之后都会被 `updateCoalitions` 重算）；
 *  4. 冷却被写入并随时间递减。
 */
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { judiciaryReform } from '../src/game/government_affairs/judiciary_reform';
import { updateCoalitions } from '../src/game/utils';
import { advancePhase } from '../src/game/rules/phaseOrchestrator';
import { getEffectiveLawStanceScore } from '../src/game/lawStances';

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
let checks = 0;
const test = (name: string, fn: () => void) => { fn(); checks++; console.log(`PASS ${name}`); };

const seed = (scenario: GameState['scenario'] = '1936'): GameState => ({
  ...gameReducer(copy(PRE_START_STATE), { type: 'START_GAME', payload: { scenario, difficulty: 'normal' } }),
  year: 1936, month: 9, phase: 'action', actionsLeft: 2,
  superEvent: null, currentEvent: null, pendingEvents: [],
  eventHistory: { triggered: [], resolved: [] },
});

/** 和平状态：内战进行中时 `advancePhase` 走 action→war 分支，不结算月份。 */
const peacetime = (state: GameState): GameState => ({
  ...state, civilWarStatus: 'not_started', activeWar: null, wars: { ...state.wars, spanish_civil_war: 'not_started' },
});

const asMinister: GameState = {
  ...seed(),
  cntStance: 'govern',
  ministers: { ...seed().ministers, justice: 'CNT' },
  judiciary_timer: 0,
};

const eventOf = (state: GameState) => judiciaryReform.effect(state).currentEvent!;
const optionState = (state: GameState, index: number, expected: GameState = state) => ({
  ...state,
  ...eventOf(expected).options[index].effect(expected),
});

test('卡已注册，且触发条件与规格一致', () => {
  assert.ok(CARD_REGISTRY.some(card => card.id === 'judiciary_reform'), '卡必须在注册表里');
  assert.equal(judiciaryReform.type, 'Government');
  assert.equal(judiciaryReform.cost, 1);
  // 未参政 / 部长不是 CNT / 冷却未归零 —— 三种情况都不能用
  assert.equal(judiciaryReform.condition!({ ...asMinister, cntStance: 'oppose' }), false);
  assert.equal(judiciaryReform.condition!({ ...asMinister, cntStance: 'cooperate' }), false);
  assert.equal(judiciaryReform.condition!({ ...asMinister, ministers: { ...asMinister.ministers, justice: 'IR' } }), false);
  assert.equal(judiciaryReform.condition!({ ...asMinister, judiciary_timer: 3 }), false);
  assert.equal(judiciaryReform.condition!(asMinister), true);
});

test('三条路线：进度 +1 / +2 / +0，并且都写入冷却', () => {
  const start: GameState = {
    ...asMinister,
    domesticPolicy: { ...asMinister.domesticPolicy, judiciary_reform_progress: 10 },
  };
  const moderate = optionState(start, 0);
  const radical = optionState(start, 1);
  const hold = optionState(start, 2);
  assert.equal(moderate.domesticPolicy.judiciary_reform_progress, 11);
  assert.equal(radical.domesticPolicy.judiciary_reform_progress, 12);
  assert.equal(hold.domesticPolicy.judiciary_reform_progress, 10);
  for (const next of [moderate, radical, hold]) {
    assert.equal(next.judiciary_timer, 6, '三条路线都应进入 6 个月冷却');
  }
});

test('进度封顶 100，且缺失字段按 0 处理（旧存档兼容）', () => {
  const nearlyDone: GameState = {
    ...asMinister,
    domesticPolicy: { ...asMinister.domesticPolicy, judiciary_reform_progress: 99 },
  };
  assert.equal(optionState(nearlyDone, 1).domesticPolicy.judiciary_reform_progress, 100);
  assert.equal(optionState(nearlyDone, 0).domesticPolicy.judiciary_reform_progress, 100);

  const legacy = { ...asMinister } as GameState;
  delete (legacy.domesticPolicy as Record<string, unknown>).judiciary_reform_progress;
  assert.equal(optionState(legacy, 0).domesticPolicy.judiciary_reform_progress, 1);
});

test('激进路线：按党派分别下调承诺度，重算后凝聚力确实更低', () => {
  const start = asMinister;
  const radical = optionState(start, 1);
  const before = updateCoalitions(start).find(c => c.activeId === start.rulingCoalition)!;
  const after = updateCoalitions(radical).find(c => c.activeId === radical.rulingCoalition)!;
  assert.ok(after.cohesion < before.cohesion, `凝聚力应下降：${before.cohesion} → ${after.cohesion}`);

  // 规格：PSOE −2、PCE −6、IR −6、UR −8、PNV −8；其余成员不动。
  const perMember: Record<string, number> = { PSOE: -2, PCE: -6, IR: -6, UR: -8, PNV: -8 };
  const beforeContributions = start.activeCoalitions[0].memberContributions;
  const afterContributions = radical.activeCoalitions[0].memberContributions;
  for (const [member, prior] of Object.entries(beforeContributions)) {
    const expected = Math.max(0, (prior ?? 80) + (perMember[member] ?? 0));
    assert.equal(afterContributions[member as keyof typeof afterContributions], expected,
      `${member} 的承诺度应为 ${expected}`);
  }
  // 两个降幅确实不同：社会党最轻，共和联盟最重
  assert.notEqual(afterContributions.PSOE, afterContributions.UR);
  // 温和路线不动阵线
  const moderate = optionState(start, 0);
  assert.deepEqual(moderate.activeCoalitions, start.activeCoalitions);
});

test('三条路线的具体数值与规格一致', () => {
  const start: GameState = {
    ...asMinister,
    domesticPolicy: { ...asMinister.domesticPolicy, judiciary_reform_progress: 20 },
    factions: {
      ...asMinister.factions,
      Treintistas: { influence: 20, dissent: 30 },
      Cenetistas: { influence: 30, dissent: 30 },
      Faistas: { influence: 30, dissent: 30 },
      Puristas: { influence: 20, dissent: 30 },
    },
    stats: { ...asMinister.stats, revolutionaryFervor: 30 },
  };
  const moderate = optionState(start, 0);
  const radical = optionState(start, 1);
  const hold = optionState(start, 2);

  // 温和：异议按规格下调，且不再给三十人集团加影响力
  assert.equal(moderate.factions.Treintistas.influence, start.factions.Treintistas.influence,
    '温和改革不该再提升三十人集团影响力');
  assert.equal(moderate.factions.Faistas.dissent, 26, '无政府主义者异议 −4');
  assert.equal(moderate.factions.Puristas.dissent, 27, '纯粹派异议 −3');
  assert.equal(moderate.factions.Cenetistas.dissent, 25, '工团派异议 −5');
  assert.equal(moderate.factions.Treintistas.dissent, 24, '三十人集团异议 −6');

  // 激进：革命热情 +3（原为 +8）
  assert.equal(radical.stats.revolutionaryFervor, 33);

  // 保持现状：不再有 Faistas / Puristas 异议惩罚
  assert.equal(hold.factions.Faistas.dissent, start.factions.Faistas.dissent, '不该再给无政府主义者加异议');
  assert.equal(hold.factions.Puristas.dissent, start.factions.Puristas.dissent, '不该再给纯粹派加异议');
  assert.equal(hold.factions.Cenetistas.dissent, 33, '工团派 +3 保留');
  assert.equal(hold.factions.Treintistas.dissent, 28, '三十人集团 −2 保留');
  assert.ok(hold.factions.Puristas.influence > start.factions.Puristas.influence,
    `纯粹派影响力应上升（${start.factions.Puristas.influence} → ${hold.factions.Puristas.influence}）`);
});

test('冷却逐月递减，归零后可以再次使用', () => {
  const used = optionState(peacetime(asMinister), 0);
  assert.equal(judiciaryReform.condition!(used), false, '冷却期内不可再用');
  let state = used;
  for (let month = 0; month < 6; month += 1) {
    state = advancePhase({ ...state, phase: 'action', currentEvent: null, pendingEvents: [] });
    assert.equal(state.judiciary_timer, 5 - month, `第 ${month + 1} 次月结后冷却应为 ${5 - month}`);
  }
  assert.equal(state.judiciary_timer, 0, '六个月后冷却归零');
  assert.equal(judiciaryReform.condition!(state), true);
});

test('事件内容：进度条与三条路线都能渲染，中英文都有文案', () => {
  for (const language of ['en', 'zh'] as const) {
    const state = { ...asMinister, language };
    const event = eventOf(state);
    const markup = renderToStaticMarkup(event.renderContent!(state) as React.ReactElement);
    assert.ok(markup.includes(language === 'zh' ? '司法改革进度' : 'Judiciary reform progress'));
    assert.equal(event.options.length, 3);
    for (const option of event.options) {
      assert.ok(typeof option.text === 'string' && option.text.length > 0);
      assert.ok(typeof option.subtitle === 'string' && option.subtitle!.length > 0);
      if (language === 'zh') assert.ok(typeof option.textZh === 'string' && option.textZh!.length > 0);
      assert.equal(typeof option.effect, 'function');
    }
  }
});

test('这张卡不改任何法律等级（司法改革走的是自有进度字段）', () => {
  const before = { ...asMinister.domesticPolicy };
  for (const index of [0, 1, 2]) {
    const after = optionState(asMinister, index).domesticPolicy;
    for (const key of Object.keys(before) as (keyof typeof before)[]) {
      if (key === 'judiciary_reform_progress') continue;
      assert.equal(after[key], before[key], `选项 ${index} 不该改 ${String(key)}`);
    }
  }
  // 顺带确认法律立场读取接口对本卡无涉（避免未来被误接成法律门槛）
  assert.equal(typeof getEffectiveLawStanceScore, 'function');
});

console.log(`\nJudiciary reform: ${checks} checks passed.`);
