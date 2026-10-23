/**
 * 公共卫生改革卡的回归测试。
 *
 * 覆盖：
 *  1. 触发条件（CNT 参政 + 卫生部长是 CNT + 冷却归零）；
 *  2. 堕胎合法化的**法律门槛链**：女性权利必须正好在 L2「离婚合法化」，
 *     推上去之后落在既有的 L3「女性堕胎权」；
 *  3. 女性权利 L1 → L2 → L3 的完整链条（含 `divorce_law_1932` 事件）；
 *  4. 两条路线的进度、资源与冷却；
 *  5. 结构断言：**至此 12 个部委每一个都有对应的政府卡**（弹劾总统是唯一豁免）。
 */
import assert from 'node:assert/strict';
import React from 'react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { CABINET_FIELDS, CABINET_OFFICE_LABELS } from '../src/game/rules/cabinet';
import { LAW_LEVEL_LIMITS } from '../src/game/lawStances';
import { healthReform } from '../src/game/government_affairs/health_reform';
import { divorceLaw1932 } from '../src/game/events/divorce_law_1932';
import { updateCoalitions } from '../src/game/utils';

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
let checks = 0;
const test = (name: string, fn: () => void) => { fn(); checks++; console.log(`PASS ${name}`); };

const seed = (scenario: GameState['scenario'] = '1936'): GameState => ({
  ...gameReducer(copy(PRE_START_STATE), { type: 'START_GAME', payload: { scenario, difficulty: 'normal' } }),
  year: 1936, month: 9, phase: 'action', actionsLeft: 2,
  superEvent: null, currentEvent: null, pendingEvents: [],
  eventHistory: { triggered: [], resolved: [] },
});

const withHealthMinister: GameState = {
  ...seed(),
  cntStance: 'govern',
  ministers: { ...seed().ministers, health: 'CNT' },
  health_timer: 0,
};

const eventOf = (state: GameState) => healthReform.effect(state).currentEvent!;
const optionState = (state: GameState, index: number): GameState => ({
  ...state,
  ...eventOf(state).options[index].effect(state),
});

test('卡已注册，触发条件与规格一致', () => {
  assert.ok(CARD_REGISTRY.some(card => card.id === 'health_reform'), '卡必须在注册表里');
  assert.equal(healthReform.type, 'Government');
  assert.equal(healthReform.cost, 1);
  assert.equal(healthReform.condition!({ ...withHealthMinister, cntStance: 'oppose' }), false);
  assert.equal(healthReform.condition!({ ...withHealthMinister, cntStance: 'cooperate' }), false);
  assert.equal(healthReform.condition!({
    ...withHealthMinister,
    ministers: { ...withHealthMinister.ministers, health: 'PSOE' },
  }), false);
  assert.equal(healthReform.condition!({ ...withHealthMinister, health_timer: 4 }), false);
  assert.equal(healthReform.condition!(withHealthMinister), true);
});

test('堕胎合法化：女性权利必须正好在 L2，推进后落在既有的 L3「女性堕胎权」', () => {
  const option = eventOf(withHealthMinister).options[0];
  const atL1: GameState = {
    ...withHealthMinister,
    domesticPolicy: { ...withHealthMinister.domesticPolicy, womens_rights: 1 },
  };
  const atL2: GameState = {
    ...withHealthMinister,
    domesticPolicy: { ...withHealthMinister.domesticPolicy, womens_rights: 2 },
  };
  const atL3: GameState = {
    ...withHealthMinister,
    domesticPolicy: { ...withHealthMinister.domesticPolicy, womens_rights: 3 },
  };
  assert.equal(option.condition!(atL1), false, 'L1（民事婚姻）时不可推动');
  assert.equal(option.condition!(atL2), true, 'L2（离婚合法化）时可以推动');
  assert.equal(option.condition!(atL3), false, '已到 L3 时不该重复推动');

  const after = optionState(atL2, 0);
  assert.equal(after.domesticPolicy.womens_rights, 3);
  assert.equal(LAW_LEVEL_LIMITS.womens_rights >= 3, true, 'L3 必须存在于女性权利等级表中');
  assert.ok(after.domesticPolicy.womens_rights <= LAW_LEVEL_LIMITS.womens_rights);
  // 不可用时的提示分别覆盖"等级不够"和"已经超过"两种情况
  assert.ok(option.unavailableSubtitleZh!(atL1).includes('需要女性权利达到 2 级'));
  assert.ok(option.unavailableSubtitleZh!(atL3).includes('已经超过'));
});

test('两条路线：堕胎合法化（进度 +3、冷却 8、不花资源）与保持现状（进度不变、冷却 6）', () => {
  const start: GameState = {
    ...withHealthMinister,
    resources: 3,
    domesticPolicy: { ...withHealthMinister.domesticPolicy, womens_rights: 2, health_reform_progress: 40 },
  };
  const abortion = optionState(start, 0);
  const hold = optionState(start, 1);

  assert.equal(abortion.domesticPolicy.health_reform_progress, 43);
  assert.equal(hold.domesticPolicy.health_reform_progress, 40, '保持现状不推进进度');
  assert.equal(abortion.health_timer, 8);
  assert.equal(hold.health_timer, 6);
  // 堕胎合法化不花资源；保持现状同样不花
  assert.equal(abortion.resources, 3);
  assert.equal(hold.resources, 3);
  // 这张卡现在只有两个选项，且都不需要资源门槛
  assert.equal(eventOf(start).options.length, 2);
  for (const option of eventOf(start).options) {
    assert.equal(option.condition ? option.condition(start) : true, true);
  }
});

test('保持现状的代价：工人与知识分子支持下降、官僚化与政变进度上升', () => {
  const start: GameState = withHealthMinister;
  const hold = optionState(start, 1);
  assert.ok(hold.classes.Obreros.support.CNT_FAI < start.classes.Obreros.support.CNT_FAI,
    '工人对 CNT 的支持应下降');
  assert.ok(hold.classes.Intelectuales.support.CNT_FAI < start.classes.Intelectuales.support.CNT_FAI,
    '知识分子对 CNT 的支持应下降');
  assert.ok(hold.stats.bureaucratization > start.stats.bureaucratization, '官僚化应上升');
  assert.ok(hold.stats.revolutionaryFervor < start.stats.revolutionaryFervor, '革命热情应下降');
  assert.ok(hold.coupProgress > start.coupProgress, '政变进度应上升');
  assert.ok(hold.factions.Puristas.influence > start.factions.Puristas.influence);
  // 保持现状不动阵线承诺度
  assert.deepEqual(hold.activeCoalitions, start.activeCoalitions);
});

test('进度封顶 100，缺失字段按 0 处理（旧存档兼容）', () => {
  const nearly: GameState = {
    ...withHealthMinister,
    domesticPolicy: { ...withHealthMinister.domesticPolicy, womens_rights: 2, health_reform_progress: 99 },
  };
  assert.equal(optionState(nearly, 0).domesticPolicy.health_reform_progress, 100);
  assert.equal(optionState(nearly, 1).domesticPolicy.health_reform_progress, 99, '保持现状不该越界或改动');

  const legacy = { ...withHealthMinister } as GameState;
  delete (legacy.domesticPolicy as Record<string, unknown>).health_reform_progress;
  assert.equal(optionState(legacy, 0).domesticPolicy.health_reform_progress, 3);
  assert.equal(optionState(legacy, 1).domesticPolicy.health_reform_progress, 0);
});

test('堕胎合法化压低神职人员支持并推高政变进度，但不直接写阵线承诺度', () => {
  // 先给神职人员一个可被削掉的 CNT 支持基数，否则初始 0 之下订阅再减也不会动。
  const base: GameState = {
    ...withHealthMinister,
    domesticPolicy: { ...withHealthMinister.domesticPolicy, womens_rights: 2 },
  };
  const start: GameState = {
    ...base,
    classes: {
      ...base.classes,
      Clero: {
        support: { ...base.classes.Clero.support, CNT_FAI: 5, AP: (base.classes.Clero.support.AP ?? 0) - 5 },
      },
    },
  };
  const before = start.classes.Clero.support.CNT_FAI;
  const after = optionState(start, 0);
  assert.equal(before, 5, '前置条件：神职人员对 CNT 的支持应为 5');
  assert.equal(after.classes.Clero.support.CNT_FAI, 0, '神职人员对 CNT 的支持应下降 5');
  assert.ok(after.coupProgress > start.coupProgress, '政变进度应上升');
  // 工人与知识分子的支持上升
  assert.ok(after.classes.Obreros.support.CNT_FAI > start.classes.Obreros.support.CNT_FAI);
  assert.ok(after.classes.Intelectuales.support.CNT_FAI > start.classes.Intelectuales.support.CNT_FAI);
  // 承诺度不变，因此重算后的凝聚力与使用前一致
  assert.deepEqual(after.activeCoalitions, start.activeCoalitions);
  assert.equal(
    updateCoalitions(after).find(c => c.activeId === after.rulingCoalition)!.cohesion,
    updateCoalitions(start).find(c => c.activeId === start.rulingCoalition)!.cohesion,
  );
});

test('事件内容：进度条与两条路线都能渲染，中英文都有文案', () => {
  const state: GameState = {
    ...withHealthMinister,
    domesticPolicy: { ...withHealthMinister.domesticPolicy, womens_rights: 2 },
  };
  for (const language of ['en', 'zh'] as const) {
    const localized = { ...state, language };
    const event = eventOf(localized);
    const markup = renderToStaticMarkup(event.renderContent!(localized) as React.ReactElement);
    assert.ok(markup.includes(language === 'zh' ? '公共卫生改革进度' : 'Public health reform progress'));
    assert.equal(event.options.length, 2);
    assert.deepEqual(
      event.options.map(option => (language === 'zh' ? option.textZh : option.text)),
      language === 'zh' ? ['推动堕胎合法化', '保持现状'] : ['Legalize abortion under regulated medical care.', 'Leave public health as it is.'],
    );
    for (const option of event.options) {
      assert.ok(typeof option.text === 'string' && option.text.length > 0);
      assert.ok(typeof option.subtitle === 'string' && option.subtitle!.length > 0);
      if (language === 'zh') assert.ok(typeof option.textZh === 'string' && option.textZh!.length > 0);
    }
  }
});

test('女性权利链条：L1 →（离婚法事件）→ L2 →（堕胎合法化）→ L3', () => {
  const atL1: GameState = {
    ...withHealthMinister,
    year: 1932, month: 2,
    domesticPolicy: { ...withHealthMinister.domesticPolicy, womens_rights: 1 },
  };
  // 离婚法：1932 年 2 月起可按历史推进，单选项只改法律等级
  assert.equal(divorceLaw1932.condition!(atL1), true);
  assert.equal(divorceLaw1932.condition!({ ...atL1, year: 1932, month: 1 }), false, '1932 年 2 月之前不触发');
  assert.equal(divorceLaw1932.options.length, 1, '按定稿只有单选项');
  const divorcePatch = divorceLaw1932.options[0].effect(atL1);
  assert.equal(divorcePatch.domesticPolicy!.womens_rights, 2);
  // 效果只有法律等级：不产生其它顶层状态改动
  assert.deepEqual(Object.keys(divorcePatch), ['domesticPolicy']);

  // 接力：L2 之后由堕胎合法化推到 L3
  const atL2: GameState = { ...atL1, ...divorcePatch } as GameState;
  assert.equal(divorceLaw1932.condition!(atL2), true, '事件本身仍会在队列里，但已被 eventHistory 挡住重复');
  assert.equal(eventOf(atL2).options[0].condition!(atL2), true, 'L2 时堕胎合法化可用');
  assert.equal(optionState(atL2, 0).domesticPolicy.womens_rights, 3);

  // L0 → L1 由 1931 年宪法事件负责，这里只断言 L3 之上没有衔接（已知缺口）
  assert.equal(LAW_LEVEL_LIMITS.womens_rights, 4);
});

test('结构断言：12 个部委现在每一个都有政府卡（弹劾总统豁免）', () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(full)) files.push(full);
    }
  };
  walk(join(process.cwd(), 'src', 'game', 'government_affairs'));

  const uncovered: string[] = [];
  for (const field of CABINET_FIELDS) {
    const covered = files.some(file => readFileSync(file, 'utf8').includes(`ministers.${field}`));
    if (!covered) uncovered.push(`${field}（${CABINET_OFFICE_LABELS[field][1]}）`);
  }
  assert.deepEqual(uncovered, [], `仍无政府卡的部委：${uncovered.join('、')}`);

  // 唯一的豁免：弹劾总统不挂任何部委，由弹劾可用标志与和平状态控制。
  const exemptions = CARD_REGISTRY
    .filter(card => card.type === 'Government')
    .filter(card => !CABINET_FIELDS.some(field => {
      const file = files.find(f => f.endsWith(`${card.id}.ts`) || f.endsWith(`${card.id}.tsx`));
      return file ? readFileSync(file, 'utf8').includes(`ministers.${field}`) : false;
    }))
    .map(card => card.id);
  assert.deepEqual(exemptions, ['impeach_president'], `不挂部委的政府卡应只有弹劾总统，实际：${exemptions.join('、')}`);
});

console.log(`\nHealth reform: ${checks} checks passed.`);
