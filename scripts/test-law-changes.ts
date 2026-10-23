/**
 * 法律等级改动的统一约定测试。
 *
 * 对应设计文档 §4.4 的硬约束与 `rules/lawChange.ts`：
 *
 *  1. 只有**政府卡与事件**可以改法律等级，行动卡只能积累诉求压力；
 *  2. 每次改动都必须**先读当前等级**，四种意图各有一个 helper；
 *  3. 「推进改革」类效果必须是"至少到这一级"（`ensureLawAtLeast` / `atLeast`），
 *     不许在当前等级更高时把法律拉回去；
 *  4. 「降级」只出现在明确写了降级意图的地方。
 *
 * 第 1 条用源码扫描做结构断言，其余用真实的卡牌 / 事件效果求值做行为断言。
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState, LawId } from '../src/game/types';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { LAW_LEVEL_LIMITS } from '../src/game/lawStances';
import {
  canRaiseLaw, changeLaws, ensureLawAtLeast, lowerLaw, raiseLaw, setLawLevel,
} from '../src/game/rules/lawChange';
import { laborRights } from '../src/game/government_affairs/labor_rights';
import { policeAffairs } from '../src/game/government_affairs/police_affairs';
import { publicInstruction } from '../src/game/government_affairs/public_instruction';
import { laSanjurjada } from '../src/game/events/la_sanjurjada';
import { juradosMixtos } from '../src/game/events/jurados_mixtos';
import { constitution1931 } from '../src/game/events/constitution_1931';
import { azanaMilitaryReform } from '../src/game/events/azana_military_reform';
import { economyWarEffortVictory } from '../src/game/events/economy/war_effort_victory';
import { militiaLegalityArmedUnions, militiaLegalityRearSecurity, militiaLegalityCommittee } from '../src/game/events/civil_war/militia_legality';
import { economySyndicalistJournal } from '../src/game/journal/economy_syndicalist';

const ROOT = process.cwd();
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
let checks = 0;
const test = (name: string, fn: () => void) => { fn(); checks++; console.log(`PASS ${name}`); };

const seed = (scenario: GameState['scenario'] = '1931'): GameState => ({
  ...gameReducer(copy(PRE_START_STATE), { type: 'START_GAME', payload: { scenario, difficulty: 'normal' } }),
  year: 1931, month: 1, phase: 'action', actionsLeft: 2,
  superEvent: null, currentEvent: null, pendingEvents: [],
  eventHistory: { triggered: [], resolved: [] },
});

const withLaws = (state: GameState, laws: Partial<Record<LawId, number>>): GameState => ({
  ...state,
  domesticPolicy: { ...state.domesticPolicy, ...laws },
});

const effectOf = (
  options: readonly { condition?: (state: GameState) => boolean; effect: (state: GameState) => any }[],
  index: number,
  state: GameState,
): GameState => ({ ...state, ...options[index].effect(state) });

/** 政府卡的效果把选项包在 `currentEvent` 里，测试需要把它取出来。 */
const cardOptions = (card: { effect: (state: GameState) => any }, state: GameState) =>
  card.effect(state).currentEvent.options as {
    subtitle?: string;
    subtitleZh?: string;
    condition?: (state: GameState) => boolean;
    effect: (state: GameState) => any;
  }[];

// ------------------------------------------------------------------ helper 语义

test('lawChange helpers: 相对升降与钳制', () => {
  const state = withLaws(seed(), { max_hours_law: 0, union_status: 4 });
  assert.equal(raiseLaw(state, 'max_hours_law'), 1);
  assert.equal(raiseLaw(state, 'max_hours_law', 3), 3);
  // 封顶：max_hours_law 的等级表长度是 5（0..4）
  assert.equal(raiseLaw(state, 'max_hours_law', 99), LAW_LEVEL_LIMITS.max_hours_law);
  // 下限：union_status 已在 4，再降不可能低于 0
  assert.equal(lowerLaw(state, 'union_status', 99), 0);
  assert.equal(setLawLevel(state, 'union_status', 2), 2);
  // 至少到 3 级：当前 4 级时原样保留
  assert.equal(ensureLawAtLeast(state, 'union_status', 3), 4);
  assert.equal(ensureLawAtLeast(state, 'union_status', 5), LAW_LEVEL_LIMITS.union_status);
  assert.equal(canRaiseLaw(state, 'union_status'), LAW_LEVEL_LIMITS.union_status > 4);
});

test('lawChange helpers: changeLaws 的四种意图', () => {
  const state = withLaws(seed(), { max_hours_law: 1, min_wage: 3, union_status: 4, land_law: 0 });
  const patch = changeLaws(state, {
    max_hours_law: 'up',
    min_wage: 'down',
    union_status: { atLeast: 3 },
    land_law: { atLeast: 1 },
  });
  assert.equal(patch.max_hours_law, 2);
  assert.equal(patch.min_wage, 2);
  assert.equal(patch.union_status, 4, '至少 N 级不得把 4 级降到 3 级');
  assert.equal(patch.land_law, 1);
  const forced = changeLaws(state, { min_wage: { to: 1 }, max_hours_law: { up: 2 } });
  assert.equal(forced.min_wage, 1);
  assert.equal(forced.max_hours_law, 3);
});

// ------------------------------------------------------------------ 政府卡

test('labor_rights: 逐级推进，且每条路线都不越过当前等级', () => {
  const atOne = withLaws(seed(), { max_hours_law: 1 });
  const options = cardOptions(laborRights, atOne);
  assert.equal(options[0].condition!(atOne), true);
  assert.equal(options[1].condition!(atOne), false);
  assert.equal(effectOf(options, 0, atOne).domesticPolicy.max_hours_law, 2);
  // 已经是 L2 时，L2 选项关闭，L3 选项开启
  const atTwo = withLaws(seed(), { max_hours_law: 2 });
  assert.equal(options[0].condition!(atTwo), false);
  assert.equal(options[1].condition!(atTwo), true);
  assert.equal(effectOf(options, 1, atTwo).domesticPolicy.max_hours_law, 3);
  // L3 → L4，然后封顶不再可升
  const atThree = withLaws(seed(), { max_hours_law: 3 });
  assert.equal(effectOf(options, 2, atThree).domesticPolicy.max_hours_law, 4);
  const atFour = withLaws(seed(), { max_hours_law: 4, workplace_safety: 4 });
  assert.equal(options[2].condition!(atFour), false);
  assert.equal(options[3].condition!(atFour), false, '工作安全已满级时不该还能选');
});

test('police_affairs: 治安机关法阶梯只能逐级走，且不写出非法等级', () => {
  const seedState = seed();
  const ladderOptions = cardOptions(policeAffairs, seedState);
  const byLawLevel = ladderOptions.filter(option => option.subtitle?.includes('Security Corps Law to level'));
  assert.equal(byLawLevel.length, 5, '应恰好有五条治安机关法路线');
  // 这些路线同时有忠诚度门槛，测试需要把忠诚度也给足。
  const loyal = (level: number, extra: Partial<GameState> = {}): GameState => ({
    ...withLaws(seedState, { security_corps_law: level }),
    armedForces: {
      ...seedState.armedForces,
      guardiaNacional: { manpower: 100, loyalty: 100 },
      guardiaAsalto: { manpower: 100, loyalty: 100 },
    },
    ...extra,
  } as GameState);
  const usable = (state: GameState) => byLawLevel.filter(option => option.condition ? option.condition(state) : true);
  // 逐级：0→1、1→2、2→3 各只有一条路线可用
  assert.deepEqual(usable(loyal(0)).map(o => o.subtitleZh), ['将治安机关法提升至 1 级，组建突击卫队。']);
  assert.deepEqual(usable(loyal(1)).map(o => o.subtitleZh), ['将治安机关法提升至 2 级。']);
  assert.deepEqual(usable(loyal(2)).map(o => o.subtitleZh), ['将治安机关法提升至 3 级，国民警卫队与突击卫队合并为共和国警卫队。']);
  // 4 级的路线需要战争或和平的区分
  const atThree = loyal(3);
  assert.deepEqual(usable(atThree).map(o => o.subtitleZh), ['在非战争状态下将治安机关法提升至 4 级，撤销警卫队、改设工人巡逻队。']);
  const atThreeAtWar = loyal(3, { civilWarStatus: 'ongoing' });
  assert.ok(usable(atThreeAtWar).some(o => o.subtitleZh?.includes('战争状态下将治安机关法提升至 4 级')));
  // 直接验证写入值全部被钳制在 0..上限 内
  const max = LAW_LEVEL_LIMITS.security_corps_law;
  for (const level of [0, 1, 2, 3, 4]) {
    const state = withLaws(seedState, { security_corps_law: level });
    for (const option of byLawLevel) {
      const next = option.effect(state);
      const written = next.domesticPolicy?.security_corps_law;
      if (written === undefined) continue;
      assert.ok(written >= 0 && written <= max, `写入 ${written} 越界`);
      assert.ok(written >= level, `治安机关法是逐级上升的阶梯，不该从 ${level} 降到 ${written}`);
    }
  }
});

test('public_instruction: 教育制度只会被推进，不会被拉回', () => {
  const atTwo: GameState = {
    ...withLaws(seed(), { education_institutions: 2 }),
    ateneos_established: 2,
  };
  const literacy = cardOptions(publicInstruction, atTwo);
  assert.equal(effectOf(literacy, 1, atTwo).domesticPolicy.education_institutions, 2,
    '扫盲选项不得把已到 2 级的学制降回 1 级');
  const schools = effectOf(literacy, 2, atTwo);
  assert.equal(schools.domesticPolicy.education_institutions, 3);
});

// ------------------------------------------------------------------ 事件（含曾经会降级的四处）

test('jurados_mixtos: 已在 3 级以上时不再被拉回 2 级', () => {
  for (const level of [0, 1]) {
    const state = withLaws(seed(), { union_status: level });
    for (const index of [0, 1]) {
      assert.equal(effectOf(juradosMixtos.options, index, state).domesticPolicy.union_status, 2);
    }
  }
  for (const level of [3, 4]) {
    const state = withLaws(seed(), { union_status: level });
    for (const index of [0, 1]) {
      assert.equal(effectOf(juradosMixtos.options, index, state).domesticPolicy.union_status, level,
        `union_status=${level} 时不该被拉回 2`);
    }
  }
});

test('la_sanjurjada: 土地法与军官改革法只被保证「至少 1 级」', () => {
  const base = seed();
  assert.equal(effectOf(laSanjurjada.options, 0, base).domesticPolicy.land_law, 1);
  const advanced = withLaws(base, { land_law: 3, army_reform_law: 4 });
  assert.equal(effectOf(laSanjurjada.options, 0, advanced).domesticPolicy.land_law, 3);
  assert.equal(effectOf(laSanjurjada.options, 1, advanced).domesticPolicy.army_reform_law, 4);
});

test('war_effort_victory 与 militia_legality: 保证最低等级且不越界', () => {
  const state = withLaws(seed(), { public_order_law: 0 });
  assert.equal(effectOf(economyWarEffortVictory.options, 0, state).domesticPolicy.public_order_law, 2);
  const already = withLaws(seed(), { public_order_law: 3 });
  assert.equal(effectOf(economyWarEffortVictory.options, 0, already).domesticPolicy.public_order_law, 3);

  const max = LAW_LEVEL_LIMITS.militia_legality_law;
  for (const event of [militiaLegalityArmedUnions, militiaLegalityRearSecurity, militiaLegalityCommittee]) {
    const first = event.options[0];
    const next = first.effect(seed());
    const written = next.domesticPolicy?.militia_legality_law;
    assert.ok(written === undefined || (written >= 0 && written <= max), `${event.id} 写入越界`);
  }
});

test('constitution_1931 与 azana_military_reform: 相对推进，不写成绝对值', () => {
  const state = withLaws(seed(), { political_rights: 0, religion_policy: 0 });
  const after = effectOf(constitution1931.options, 0, state).domesticPolicy;
  assert.equal(after.political_rights, 1);
  assert.equal(after.religion_policy, 2);
  // 已经走到上限时不再上涨（也不会下降）
  const maxed = withLaws(seed(), {
    political_rights: LAW_LEVEL_LIMITS.political_rights,
    religion_policy: LAW_LEVEL_LIMITS.religion_policy,
  });
  const afterMaxed = effectOf(constitution1931.options, 0, maxed).domesticPolicy;
  assert.equal(afterMaxed.political_rights, LAW_LEVEL_LIMITS.political_rights);
  assert.equal(afterMaxed.religion_policy, LAW_LEVEL_LIMITS.religion_policy);

  const barracks = effectOf(azanaMilitaryReform.options, 0, seed()).domesticPolicy;
  assert.equal(barracks.army_reform_law, 1);
  assert.equal(barracks.security_corps_law, 1);
});

test('economy_syndicalist 完成时只保证集体谈判「至少 3 级」', () => {
  const atTwo = withLaws(seed(), { union_status: 2 });
  assert.equal(economySyndicalistJournal.onComplete!(atTwo).domesticPolicy!.union_status, 3);
  const atFour = withLaws(seed(), { union_status: 4 });
  assert.equal(economySyndicalistJournal.onComplete!(atFour).domesticPolicy!.union_status, 4);
});

// ------------------------------------------------------------------ 结构约定

test('结构约定：改法律的代码只出现在政府卡与事件里，且都经由 rules/lawChange', () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(full)) files.push(full);
    }
  };
  walk(join(ROOT, 'src', 'game'));

  const LAW_IDS = Object.keys(LAW_LEVEL_LIMITS);
  const writePattern = new RegExp(`^\\s*(${LAW_IDS.join('|')})\\s*:`, 'm');
  const allowed = /government_affairs\/|events\/|journal\/|rules\/(lawChange|laborPressure)\.ts$/;
  const violations: string[] = [];

  for (const file of files) {
    const path = relative(ROOT, file).replace(/\\/g, '/');
    const source = readFileSync(file, 'utf8');
    if (!writePattern.test(source)) continue;
    // 剧本起始值、等级表、类型与预览文案不是"改动"，按项目既有约定排除。
    if (/scenarios\/|policyDefinitions|types\.ts|effectPreview/.test(path)) continue;
    // 这两处的 `lawId: something` 是「法律 → 标签 / 结果事件」的映射表，不是状态写入。
    if (/events\/labor_pressure\.ts$|rules\/laborPressure\.ts$/.test(path)) continue;
    if (!allowed.test(path)) {
      violations.push(`${path}：改法律的位置不在政府卡/事件/日志目录内`);
      continue;
    }
    // 白名单文件必须在效果里使用统一 helper。
    const usesHelper = /from '[^']*lawChange'/.test(source);
    if (!usesHelper) {
      violations.push(`${path}：改法律但未使用 rules/lawChange 的 helper`);
    }
  }

  assert.deepEqual(violations, [], violations.join('\n'));

  // 行动卡不得直接写等级
  for (const card of CARD_REGISTRY.filter(item => item.type === 'Action')) {
    const file = files.find(f => f.endsWith(`${card.id}.ts`) || f.endsWith(`${card.id}.tsx`));
    if (!file) continue;
    assert.equal(writePattern.test(readFileSync(file, 'utf8')), false, `行动卡 ${card.id} 直接写了法律等级`);
  }
});

console.log(`\nLaw-change conventions: ${checks} checks passed.`);
