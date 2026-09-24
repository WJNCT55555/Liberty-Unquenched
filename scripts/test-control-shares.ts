import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GameState, IndustryOwnership } from '../src/game/types';
import { PRE_START_STATE, createScenarioState } from '../src/game/scenarios';
import { INITIAL_CONTROL_SHARES } from '../src/game/scenarios/controlShares';
import {
  applyControlInfluence,
  applyEconomicOption,
  applyOwnershipDrift,
  getControlCeilings,
  getPrivateShare,
  getSocializedShare,
  getWorkerControlEquivalent,
  getWorkersShare,
  isValidOwnershipPie,
  transferControlShare,
} from '../src/game/rules/controlShares';
import { applyControlObreroDrift } from '../src/game/rules/controlObrero';
import {
  canBackMayDaysCommittees,
  getMayDaysCommitteeControl,
  holdsMayDaysCommitteeControl,
  MAY_DAYS_UNION_OWNERSHIP_GATE,
  MAY_DAYS_UNION_SHARE_GATE,
} from '../src/game/rules/mayDays';
import { ECONOMY_COUNTERS, ECONOMY_ROUTE_RULES } from '../src/game/rules/economyReforms';
import { migrateSaveState } from '../src/game/saveMigrations';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { selectEconomyReformViewModel, areEconomyReformViewModelsEqual } from '../src/game/selectors';
import { landAndFreedom } from '../src/game/action_affairs/land_and_freedom';
import { joanPeiro } from '../src/game/advisors/joan_peiro';
import { landReformJournal } from '../src/game/journal/land_reform';

/**
 * 第 5A—5C 期验收（docs/工人控制度改造方案.md §9）。
 *
 * 5A 的原始硬指标是"同一串选项序列下新旧 `workerControl` 逐月一致"。**该指标已被
 * 证伪**：旧标尺是无摩擦的（一串选项承诺约 96 点，终值 41），而所有权转移受私人池
 * 与战前上限双重约束（终值约 18—21）。二者不可能一致，差异本身是设计的直接后果，
 * 见 §10.4。因此这里守的是三条可证伪的不变量：
 *  1. 两张饼的和恒为 100、每项非负，私人 + 社会化 = 100，劳动者 ⊆ 社会化；
 *  2. 转移守恒：进方拿到的量必然从别处出，且不越上限；
 *  3. 经济改造计数器只记进度，不自动写入所有权。
 */

type Patch = Partial<GameState>;

const withState = (patch: Patch): GameState => ({ ...PRE_START_STATE, ...patch });

// ---- 1. 数据不变量 ----------------------------------------------------------

(Object.keys(INITIAL_CONTROL_SHARES) as GameState['scenario'][]).forEach((scenarioId) => {
  const shares = INITIAL_CONTROL_SHARES[scenarioId];
  assert(isValidOwnershipPie(shares.land), `${scenarioId} land pie must sum to 100`);
  assert(isValidOwnershipPie(shares.industry), `${scenarioId} industry pie must sum to 100`);
  // 私人 + 社会化 = 100，且劳动者 ⊆ 社会化。
  const state = createScenarioState(scenarioId, 'normal', 'en');
  assert.equal(
    getPrivateShare(state, 'land') + getSocializedShare(state, 'land'),
    100,
    `${scenarioId}: land private + socialized must be 100`,
  );
  assert.equal(
    getPrivateShare(state, 'industry') + getSocializedShare(state, 'industry'),
    100,
    `${scenarioId}: industry private + socialized must be 100`,
  );
  assert(
    getWorkersShare(state, 'industry') <= getSocializedShare(state, 'industry'),
    `${scenarioId}: workers' share must be part of the socialized share`,
  );
});

// 剧本开局的三份派生值（对应用户给定的数据）。
const s1931 = createScenarioState('1931', 'normal', 'en');
const s1933 = createScenarioState('1933', 'normal', 'en');
const s1936 = createScenarioState('1936', 'normal', 'en');
assert.equal(getWorkersShare(s1931, 'land'), 2, '1931 land workers share must be 2');
assert.equal(getWorkersShare(s1931, 'industry'), 2, '1931 industry workers share must be 2');
assert.equal(getSocializedShare(s1933, 'industry'), 7, '1933 industry socialized share must be 7 (3+1+3)');
assert.equal(getWorkersShare(s1933, 'industry'), 4, '1933 industry workers share must be 4 (3+1)');
assert.equal(getWorkersShare(s1936, 'land'), 6, '1936 land workers share must be 6 (5+1)');

// ---- 2. transferControlShare：一次配平、守恒、非负 --------------------------

const transferState = createScenarioState('1931', 'normal', 'en');
const afterRequisition = {
  ...transferState,
  ...transferControlShare(transferState, 'land', {
    latifundia: -2,
    church: -0.5,
    collective: 2,
    cooperative: 0.5,
  }),
} as GameState;
assert(isValidOwnershipPie(afterRequisition.controlShares!.land), 'A transfer must keep the pie summing to 100');
assert(
  afterRequisition.controlShares!.land.latifundia < transferState.controlShares!.land.latifundia,
  'Requisition must shrink the latifundia bucket',
);
assert(
  afterRequisition.controlShares!.land.collective > transferState.controlShares!.land.collective,
  'Requisition must grow the collective bucket',
);

// 随机 200 次转移后仍然守恒且非负。
let randomState = createScenarioState('1931', 'normal', 'en');
let seed = 12345;
const nextRandom = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
for (let step = 0; step < 200; step += 1) {
  const sector = nextRandom() > 0.5 ? 'land' : 'industry';
  const keys = sector === 'land'
    ? ['church', 'latifundia', 'smallholders', 'cooperative', 'collective', 'state']
    : ['foreign', 'bigCapital', 'smallBusiness', 'cooperative', 'union', 'state'];
  const source = keys[Math.floor(nextRandom() * keys.length)];
  const target = keys[Math.floor(nextRandom() * keys.length)];
  if (source === target) continue;
  const amount = 1 + Math.floor(nextRandom() * 5);
  randomState = {
    ...randomState,
    ...transferControlShare(randomState, sector, { [source]: -amount, [target]: amount }),
  } as GameState;
  assert(
    isValidOwnershipPie(randomState.controlShares![sector]),
    `Pie broke at step ${step}: ${JSON.stringify(randomState.controlShares![sector])}`,
  );
}

// 出方容量不足：1933 的外资只有 10，而外资没收每次要 −6。进方必须足额到账。
const scarce = createScenarioState('1933', 'normal', 'en');
const afterFirstSeizure = {
  ...scarce,
  ...transferControlShare(scarce, 'industry', { foreign: -6, state: 6 }),
} as GameState;
assert.equal(afterFirstSeizure.controlShares!.industry.foreign, 4, 'First seizure must take 6 of the 10 foreign points');
assert.equal(afterFirstSeizure.controlShares!.industry.state, 9, 'State must receive the full 6 points');
const afterSecondSeizure = {
  ...afterFirstSeizure,
  ...transferControlShare(afterFirstSeizure, 'industry', { foreign: -6, state: 6 }),
} as GameState;
assert.equal(afterSecondSeizure.controlShares!.industry.foreign, 0, 'Foreign capital must bottom out at 0, never negative');
assert.equal(
  afterSecondSeizure.controlShares!.industry.state,
  15,
  'The shortfall must be filled from the implicit private buckets, not silently dropped',
);
assert(isValidOwnershipPie(afterSecondSeizure.controlShares!.industry), 'Depleted-source transfer must stay at 100');

// ---- 3. 结构性上限 ----------------------------------------------------------

const ceilings1931 = getControlCeilings(createScenarioState('1931', 'normal', 'en'));
assert.equal(ceilings1931.industry, 10, '1931 union_status 1 gives industry a ceiling of 10');
assert.equal(ceilings1931.land, 12, '1931 without land reform gives land a ceiling of 12');
const ceilings1933 = getControlCeilings(createScenarioState('1933', 'normal', 'en'));
assert.equal(ceilings1933.industry, 16, 'union_status 2 gives industry a ceiling of 16');
const reformed = withState({
  domesticPolicy: { ...PRE_START_STATE.domesticPolicy, land_reform_progress: 40 },
});
assert.equal(getControlCeilings(reformed).land, 21, 'Land reform past 30 raises the land ceiling to 21');
const wartime = withState({ civilWarStatus: 'ongoing' });
assert.equal(getControlCeilings(wartime).industry, 55, 'Wartime with union_status < 2 gives industry a ceiling of 55');
assert.equal(getControlCeilings(wartime).land, 45, 'Wartime without land reform gives land a ceiling of 45');

// 超过上限时按月回落，且只回落 1 点。
const overCeiling = withState({
  domesticPolicy: { ...PRE_START_STATE.domesticPolicy, union_status: 1 },
  controlShares: {
    land: { church: 2, latifundia: 20, smallholders: 10, cooperative: 30, collective: 30, state: 8 },
    industry: { foreign: 5, bigCapital: 5, smallBusiness: 5, cooperative: 40, union: 40, state: 5 },
  },
});
const drifted = applyOwnershipDrift(overCeiling);
assert.equal(
  getSocializedShare(drifted, 'land'),
  getSocializedShare(overCeiling, 'land') - 1,
  'A pie over its ceiling must come down by exactly one point per month',
);
assert(isValidOwnershipPie(drifted.controlShares!.land), 'Drift must keep the pie summing to 100');
// 低于上限时不动。
const underCeiling = createScenarioState('1931', 'normal', 'en');
assert.equal(applyOwnershipDrift(underCeiling), underCeiling, 'A pie under its ceiling must not drift');

// `applyControlObreroDrift` 仍是同一个入口（管线不需要改）。
const driftedViaAlias = applyControlObreroDrift(overCeiling);
assert.equal(
  getSocializedShare(driftedViaAlias, 'land'),
  getSocializedShare(drifted, 'land'),
  'applyControlObreroDrift must remain the pipeline entry point for ownership drift',
);

// ---- 4. 派生值：workerControl 只统计劳动者份额（不含国有） ------------------

assert.equal(
  getWorkerControlEquivalent(withState({})),
  (2 + 2) / 2,
  'The derived worker control must be the mean of the two sectors worker shares',
);
// 国有扩大不改派生值：国有化的工厂不是工人控制的工厂。
const moreState = withState({
  controlShares: {
    land: { church: 2, latifundia: 40, smallholders: 44, cooperative: 2, collective: 0, state: 12 },
    industry: { foreign: 18, bigCapital: 38, smallBusiness: 37, cooperative: 2, union: 0, state: 5 },
  },
});
assert.equal(
  getWorkerControlEquivalent(moreState),
  getWorkerControlEquivalent(withState({})),
  'Growing state ownership must not raise the derived worker control',
);

// ---- 5. 对拍：派生值严格跟随"劳动者份额"的变化 -----------------------------
//
// **这里不能直接拿旧标尺的累加值做对比。** 旧 `workerControl` 是一根 0—100 的抽象条，
// 它的每个写入点（佩罗 +5、桑蒂利安 +8、土改 +10…）都能被无摩擦地累加；而两张饼是
// **所有权**，一次转移受限于"私人还剩多少"。两者的差异是这次改造的全部意义所在：
//
//   · 旧：`workerControl` 是"运动的控制能力"，可以一路涨到 100；
//   · 新：劳动者份额是"工人真的拥有多少生产资料"，1931 年的乡村只有 44 点自耕农 +
//     50 点大庄园与教会，可转移量是有限的；而且战前上限（土地 12、工业 10）本身就
//     否定了"战前能到 40"的旧手感。
//
// 因此本节的断言改成三条**可证伪的不变量**，而不是与旧数值比对：
//   ① 派生值严格等于两个部门劳动者份额的均值；
//   ② 每次影响力写入之后，饼仍然守恒且非负；
//   ③ 写入的实际效果 ≤ 承诺，且差额只能用"私人池不足"解释。

const replaySequence: Array<{ label: string; points: number; spread: { land: number; industry: number } }> = [
  { label: 'industrial collectivization', points: 5, spread: { land: 0, industry: 1 } },
  { label: 'socialization blueprint', points: 8, spread: { land: 0, industry: 1 } },
  { label: 'cooperative commonwealth', points: 5, spread: { land: 0.5, industry: 0.5 } },
  { label: 'rural mobilization', points: 3, spread: { land: 1, industry: 0 } },
  { label: 'land reform complete', points: 10, spread: { land: 1, industry: 0 } },
];

(['1931', '1933', '1936'] as const).forEach((scenario) => {
  let state = createScenarioState(scenario, 'normal', 'en');
  let promised = 0;

  replaySequence.forEach((step) => {
    const before = getWorkerControlEquivalent(state);
    const beforePies = state.controlShares;
    const patch = applyControlInfluence(state, step.points, step.spread);
    state = { ...state, ...patch } as GameState;
    promised += step.points;

    // ① 派生值与饼一致（这是 `workerControl` 与所有权之间唯一的契约）。
    assert(
      Math.abs(getWorkerControlEquivalent(state) - (patch.stats as { workerControl: number }).workerControl) < 1e-9,
      `${scenario}/${step.label}: the patch's derived value must match the pie`,
    );
    // ② 守恒。
    assert(isValidOwnershipPie(state.controlShares!.land), `${scenario}/${step.label}: land pie must stay valid`);
    assert(isValidOwnershipPie(state.controlShares!.industry), `${scenario}/${step.label}: industry pie must stay valid`);
    // ③ 只涨不跌（本序列全是正向影响），且涨幅不超过承诺的点数。
    const after = getWorkerControlEquivalent(state);
    const gained = after - before;
    assert(gained >= -1e-9, `${scenario}/${step.label}: a positive influence must not lower the derived value`);
    assert(gained <= step.points + 1e-9, `${scenario}/${step.label}: gain ${gained} exceeded the ${step.points} promised`);
    // 饼真的动了（除非两个部门都已经没有可转移的私人份额）。
    const stillPrivate = getPrivateShare({ ...state, controlShares: beforePies }, 'land')
      + getPrivateShare({ ...state, controlShares: beforePies }, 'industry');
    if (stillPrivate > 0) {
      assert(gained > 0, `${scenario}/${step.label}: a positive influence must move ownership while private shares remain`);
    }
  });

  // 整串序列之后，派生值可以**暂时**超过上限（写入点不受上限约束），
  // 但月度漂移必须把它拉回来——这是"控制权是争来的，也必须守得住"的机制落点。
  // 收拢是逐部门独立终止的，所以循环条件也按部门判断。
  const ceilings = getControlCeilings(state);
  const settled = (candidate: GameState) => (
    getSocializedShare(candidate, 'land') <= ceilings.land
    && getSocializedShare(candidate, 'industry') <= ceilings.industry
  );
  if (!settled(state)) {
    let settling: GameState = state;
    let months = 0;
    while (!settled(settling) && months < 200) {
      const before = settling;
      settling = applyOwnershipDrift(settling);
      assert(
        settling !== before || settled(settling),
        `${scenario}: drift stopped while a sector is still over its ceiling ` +
        `(land ${getSocializedShare(settling, 'land')}/${ceilings.land}, ` +
        `industry ${getSocializedShare(settling, 'industry')}/${ceilings.industry})`,
      );
      months += 1;
    }
    assert(months < 200, `${scenario}: monthly drift must settle within a few years, took ${months} months`);
    assert(isValidOwnershipPie(settling.controlShares!.land), `${scenario}: settled land pie must stay valid`);
    assert(isValidOwnershipPie(settling.controlShares!.industry), `${scenario}: settled industry pie must stay valid`);
  }
  // 承诺量大于实际转移量是**预期**的：私人池不够。这条断言把差额记录下来。
  const transferred = getWorkerControlEquivalent(state) - getWorkerControlEquivalent(createScenarioState(scenario, 'normal', 'en'));
  assert(
    transferred <= promised,
    `${scenario}: transferred ${transferred} cannot exceed the ${promised} promised`,
  );
});

/**
 * 与旧口径的**量级**对照（记录用，不是硬断言）。
 *
 * 旧路径：10 → 15 → 23 → 28 → 31 → 41（一路累加，无摩擦）。
 * 新路径：见下面的计算——1931 的战前上限把总涨幅压到约 18 点以内。
 * 这个差异是设计决定，不是回归：见 docs/工人控制度改造方案.md §8 的第 7 项。
 */
const legacyTrail = replaySequence.reduce<number[]>((trail, step) => {
  const previous = trail.length ? trail[trail.length - 1] : 10;
  trail.push(Math.max(0, Math.min(100, previous + step.points)));
  return trail;
}, []);

let parityState = createScenarioState('1931', 'normal', 'en');
const newTrail = replaySequence.map((step) => {
  parityState = { ...parityState, ...applyControlInfluence(parityState, step.points, step.spread) } as GameState;
  return getWorkerControlEquivalent(parityState);
});
assert.equal(legacyTrail[legacyTrail.length - 1], 41, 'The legacy bar would have reached 41');
assert(
  newTrail[newTrail.length - 1] < legacyTrail[legacyTrail.length - 1],
  `The ownership model must be tighter than the old bar (new ${newTrail[newTrail.length - 1]} vs legacy 41)`,
);
assert(
  newTrail.every((value, index) => index === 0 || value >= newTrail[index - 1] - 1e-9),
  'The new derived value must still be monotonic under a purely additive sequence',
);

// ---- 6. 迁移：旧档补饼，且不凭空改动国有份额 --------------------------------

const legacySave = {
  ...PRE_START_STATE,
  screen: 'game' as const,
  scenario: '1931' as const,
  stats: { ...PRE_START_STATE.stats, workerControl: 10 },
  controlShares: undefined,
} as unknown as GameState;
const migrated = migrateSaveState(JSON.parse(JSON.stringify(legacySave)));
assert(migrated.controlShares, 'A legacy save must receive ownership pies');
assert(isValidOwnershipPie(migrated.controlShares!.land), 'Migrated land pie must sum to 100');
assert(isValidOwnershipPie(migrated.controlShares!.industry), 'Migrated industry pie must sum to 100');
assert.equal(
  migrated.controlShares!.industry.state,
  INITIAL_CONTROL_SHARES['1931'].industry.state,
  'Migration must not touch the state ownership share',
);
assert.equal(
  migrated.controlShares!.land.state,
  INITIAL_CONTROL_SHARES['1931'].land.state,
  'Migration must not touch state land',
);
// 迁移后的派生值应该接近旧的 10（差值来自四舍五入与容量挤压）。
assert(
  Math.abs(getWorkerControlEquivalent(migrated) - 10) < 2,
  `Migrated derived value should stay near the legacy 10, got ${getWorkerControlEquivalent(migrated)}`,
);
// 读入两次不能把偏移重复叠加。
const migratedTwice = migrateSaveState(JSON.parse(JSON.stringify(migrated)));
assert(
  Math.abs(getWorkerControlEquivalent(migratedTwice) - getWorkerControlEquivalent(migrated)) < 1e-9,
  'Re-running the migration must be idempotent',
);

// ---- 7. 内容层的真实选项走一遍，饼必须真的会动 ------------------------------

// 佩罗的「工业集体化」是纯工业动作。
const peiroState = createScenarioState('1936', 'normal', 'en');
const peiroAction = joanPeiro.actions.find(action => action.id === 'Joan Peiró_action1')!;
const peiroPatch = peiroAction.effect(peiroState);
assert(
  peiroPatch.controlShares!.industry.union > peiroState.controlShares!.industry.union,
  'Peiró must grow local union ownership',
);
assert.equal(
  peiroPatch.controlShares!.land.cooperative,
  peiroState.controlShares!.land.cooperative,
  'Peiró must not touch the land pie',
);

// 土地改革日志完成是最大的一次性转移。
const landComplete = landReformJournal.onComplete!(createScenarioState('1931', 'normal', 'en'));
assert(
  landComplete.controlShares!.land.collective > INITIAL_CONTROL_SHARES['1931'].land.collective,
  'Completing land reform must grow the collective bucket',
);
assert(
  landComplete.controlShares!.land.latifundia < INITIAL_CONTROL_SHARES['1931'].land.latifundia,
  'Completing land reform must shrink the latifundia bucket',
);

// 卡牌选项：土地与自由的集体化目前只推进计数器及独立写明的政治效果。
const cardState = { ...createScenarioState('1931', 'normal', 'en'), resources: 5, armaments: 5 };
const cardEvent = landAndFreedom.effect(cardState).currentEvent!;
const collectivization = cardEvent.options.find(option => String(option.text).includes('Collectivizations'))!;
const cardPatch = collectivization.effect(cardState);
assert.equal(cardPatch.controlShares, undefined, 'The counter must not write ownership');
assert.equal(cardPatch.land_voluntary_collectivization, 1, 'The option must still record one use');

// ---- 8. 读模型 --------------------------------------------------------------

const viewModel = selectEconomyReformViewModel(s1936);
assert.equal(viewModel.ownership.land.latifundia, 40, 'The read model must expose the 1936 land pie');
assert.equal(viewModel.ownershipSummary.industry.socialized, 9, 'The read model must expose the socialized total');
assert.equal(viewModel.ownershipSummary.workerControl, 5, 'The derived worker control must reach the read model');
assert(
  areEconomyReformViewModelsEqual(viewModel, selectEconomyReformViewModel(s1936)),
  'The read model must be stable for an unchanged state',
);
const shifted = { ...s1936, ...transferControlShare(s1936, 'land', { latifundia: -3, collective: 3 }) } as GameState;
assert(
  !areEconomyReformViewModelsEqual(viewModel, selectEconomyReformViewModel(shifted)),
  'An ownership transfer must invalidate the read model',
);

// ---- 9. postReducer 必须把 workerControl 拉回派生值 -------------------------

const tampered = withState({ stats: { ...PRE_START_STATE.stats, workerControl: 99 } });
const afterReducer = gameReducer(tampered, { type: 'NEXT_PHASE' });
assert(
  afterReducer.stats.workerControl <= 5,
  `A hand-written workerControl must be overwritten by the derived value, got ${afterReducer.stats.workerControl}`,
);

// ---- 10. 5B：阈值类玩法改读所有权饼 -----------------------------------------

// 五月事件的两道门槛：CNT 工会份额 + 地方工会所有制。
const mayDaysBase = createScenarioState('1936', 'normal', 'en');
const mayGateStart = getMayDaysCommitteeControl(mayDaysBase);
assert.equal(mayGateStart.cntUnionShare, 27, '1936 opens with a CNT union share of 27');
assert.equal(mayGateStart.localUnionOwnership, 1, '1936 opens with almost no local union ownership');
assert.equal(
  mayGateStart.cntUnionShare >= MAY_DAYS_UNION_SHARE_GATE
    && mayGateStart.localUnionOwnership >= MAY_DAYS_UNION_OWNERSHIP_GATE,
  false,
  'May Days must start locked on both gates',
);
const withPoumSupport = (state: GameState): GameState => ({
  ...state,
  partyRelations: { ...state.partyRelations, POUM: 90 },
});
// 光有会员人数不够：工会占比拉满、工厂还在老板手里，依然打不了。
const unionOnly = {
  ...mayDaysBase,
  unionShare: { ...mayDaysBase.unionShare!, CNT: 70 },
} as GameState;
assert.equal(
  holdsMayDaysCommitteeControl(unionOnly),
  false,
  'A mass union without ownership of the plants must not pass the May Days gates',
);
// 光有集体化也不够：工厂到手了，但工会没组织起足够的人。
const ownershipOnly = {
  ...mayDaysBase,
  controlShares: {
    ...mayDaysBase.controlShares!,
    industry: { ...mayDaysBase.controlShares!.industry, union: 30, bigCapital: 7 },
  },
} as GameState;
assert.equal(
  holdsMayDaysCommitteeControl(ownershipOnly),
  false,
  'Ownership without an organized base must not pass the May Days gates either',
);
// 两项都到位才通过。
const bothGates = { ...unionOnly, controlShares: ownershipOnly.controlShares } as GameState;
assert.equal(
  holdsMayDaysCommitteeControl(bothGates),
  true,
  'Both the union share and the ownership gate must open May Days',
);
// 完整的 `canBackMayDaysCommittees` 还要求 POUM 一侧的联盟权重，
// 那部分由 `scripts/test-may-days.tsx` 用真实联盟状态覆盖。
assert.equal(
  canBackMayDaysCommittees(withPoumSupport(bothGates)),
  false,
  'Without a wartime coalition the full gate must still hold back — the ownership read is only half of it',
);

// 两条经济路线的控制权门槛：形状相反，不能靠同一套操作同时满足。
const routeBase = createScenarioState('1936', 'normal', 'en');
const withIndustry = (state: GameState, industry: Partial<IndustryOwnership>) => ({
  ...state,
  controlShares: { ...state.controlShares!, industry: { ...state.controlShares!.industry, ...industry } },
} as GameState);

// 温和工团的形状：国有占大头，工业基本社会化。
const syndicalistShape = withIndustry(routeBase, {
  foreign: 0, bigCapital: 0, smallBusiness: 5, cooperative: 30, union: 15, state: 50,
});
assert(ECONOMY_ROUTE_RULES.syndicalistControl(syndicalistShape), 'State-heavy industry must satisfy the syndicalist gate');
assert(
  !ECONOMY_ROUTE_RULES.freeCommuneControl(syndicalistShape),
  'A state-run industry must NOT satisfy the free commune gate',
);

// 自由公社的形状：劳动者占大头，国家很小。
const freeCommuneShape = {
  ...routeBase,
  controlShares: {
    land: { church: 2, latifundia: 10, smallholders: 20, cooperative: 30, collective: 33, state: 5 },
    industry: { foreign: 2, bigCapital: 5, smallBusiness: 8, cooperative: 35, union: 45, state: 5 },
  },
} as GameState;
assert(
  ECONOMY_ROUTE_RULES.freeCommuneControl(freeCommuneShape),
  'Worker-owned land and industry must satisfy the free commune gate',
);
assert(
  !ECONOMY_ROUTE_RULES.syndicalistControl(freeCommuneShape),
  'A worker-owned economy without state power must NOT satisfy the syndicalist gate',
);

/**
 * 两条路线门槛的真实关系（比"互斥"更准确）：
 *
 *  - 温和工团要求 `社会化 ≥ 70` **且** `国有 ≥ 25`；
 *  - 自由公社要求 `土地劳动者 ≥ 60` **且** `工业劳动者 ≥ 55`。
 *
 * 因为社会化 = 合作社 + 地方工会 + 国有，同时满足两者意味着
 * `union ≥ 55` 且 `state ≥ 25`，即**社会化总量至少 80**，而且国有必须正好落在
 * 25 到 `社会化 − 55` 这个很窄的区间里。也就是说两条路线**可以**同时满足，
 * 但要求工业几乎完全社会化、且国家与工会各占一大块——这不是"顺手就能做到"，
 * 而是"必须把整个工业都交出去"。
 *
 * 下面这条断言把这个结构写下来；真正要守的是"起点不满足任何一条""纯国有形状不满足
 * 自由公社""纯劳动者形状不满足温和工团"这三件事（前面已经断言）。
 */
const bothGateSamples = [70, 80, 90, 100].flatMap((socialized) =>
  [0, 10, 20, 25, 30, 40, 50, 60].map((stateShare) => ({ socialized, stateShare })),
);
bothGateSamples.forEach(({ socialized, stateShare }) => {
  const union = Math.max(0, socialized - stateShare);
  const sample = {
    ...routeBase,
    controlShares: {
      // 土地给足，让自由公社的第一个条件成立，单独考察工业那一条。
      land: { church: 2, latifundia: 5, smallholders: 5, cooperative: 40, collective: 40, state: 8 },
      industry: {
        foreign: 0,
        bigCapital: 0,
        smallBusiness: Math.max(0, 100 - socialized),
        cooperative: 0,
        union,
        state: stateShare,
      },
    },
  } as GameState;
  const passesSyndicalist = ECONOMY_ROUTE_RULES.syndicalistControl(sample);
  const passesFreeCommune = ECONOMY_ROUTE_RULES.freeCommuneControl(sample);
  if (passesSyndicalist && passesFreeCommune) {
    assert(
      socialized >= 80,
      `Both gates can only be met once industry is almost fully socialized (got ${socialized})`,
    );
    assert(
      stateShare >= 25 && stateShare <= socialized - 55,
      `Both gates need the state share inside [25, ${socialized - 55}] (got ${stateShare})`,
    );
  }
});
// 起点（用户给定的三份剧本）必须一条都不满足。
(['1931', '1933', '1936'] as const).forEach((scenario) => {
  const start = createScenarioState(scenario, 'normal', 'en');
  assert.equal(ECONOMY_ROUTE_RULES.syndicalistControl(start), false, `${scenario} must not start with the syndicalist gate open`);
  assert.equal(ECONOMY_ROUTE_RULES.freeCommuneControl(start), false, `${scenario} must not start with the free commune gate open`);
  assert(
    ECONOMY_ROUTE_RULES.syndicalistControlProgress(start) < 25,
    `${scenario} must start far from the syndicalist control threshold`,
  );
  assert(
    ECONOMY_ROUTE_RULES.freeCommuneControlProgress(start) < 25,
    `${scenario} must start far from the free commune control threshold`,
  );
});

// ---- 11. 街头公式改读工业份额 ----------------------------------------------

const streetState = {
  ...withIndustry(createScenarioState('1936', 'normal', 'en'), {
    foreign: 10, bigCapital: 15, smallBusiness: 10, cooperative: 20, union: 40, state: 5,
  }),
} as GameState;
assert.equal(
  getWorkersShare(streetState, 'industry'),
  60,
  'Street formulas must read the industrial worker share (60 = cooperative 20 + union 40)',
);

// ---- 12. 经济改造计数器仅记账 -----------------------------------------------

/** 给两张饼保留可观察的初值，确认所有计数器都不会自动改动它们。 */
const abundant = {
  ...createScenarioState('1936', 'normal', 'en'),
  controlShares: {
    land: { church: 15, latifundia: 30, smallholders: 30, cooperative: 10, collective: 10, state: 5 },
    industry: { foreign: 15, bigCapital: 25, smallBusiness: 25, cooperative: 10, union: 15, state: 10 },
  },
} as GameState;

ECONOMY_COUNTERS.forEach((counter) => {
  const patch = applyEconomicOption(abundant, counter);
  const next = { ...abundant, ...patch } as GameState;
  assert.equal(patch.controlShares, undefined, `${counter}: no automatic ownership transfer`);
  assert.equal(next.controlShares, abundant.controlShares, `${counter}: both ownership pies must be unchanged`);
  assert.equal(next[counter], abundant[counter] + 1, `${counter}: only the named counter advances`);
  assert.deepEqual(Object.keys(patch), [counter], `${counter}: the helper must emit no other effect`);
});

// 源码级守卫：选项不得自己传向量。否则同一个计数器（土地与自由的农业集体化、农业
// 政策的推广农民集体化都写 land_voluntary_collectivization）迟早出现第二种口径，
// 也就重新打开了 §4.4 的双写。这条断言让"下一次双写"在 CI 里就被拦住。
const offenders: string[] = [];
const GAME_SRC = fileURLToPath(new URL('../src/game', import.meta.url));
(function walk(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const text = readFileSync(full, 'utf8');
    const marker = 'applyEconomicOption(';
    for (let at = text.indexOf(marker); at >= 0; at = text.indexOf(marker, at + 1)) {
      const open = at + marker.length - 1;
      let depth = 0;
      let commas = 0;
      let inStr: string | null = null;
      let esc = false;
      for (let i = open; i < text.length; i++) {
        const c = text[i];
        if (inStr) {
          if (esc) { esc = false; continue; }
          if (c === '\\') { esc = true; continue; }
          if (c === inStr) inStr = null;
          continue;
        }
        if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
        if (c === '(' || c === '{' || c === '[') depth++;
        else if (c === ')' || c === '}' || c === ']') { depth--; if (depth === 0) break; }
        else if (c === ',' && depth === 1) commas++;
      }
      if (commas > 1) offenders.push(`${full}:${text.slice(0, at).split('\n').length}`);
    }
  }
})(GAME_SRC);
assert.deepEqual(
  offenders,
  [],
  `applyEconomicOption must not receive a transfer vector from the caller: ${offenders.join(', ')}`,
);

console.log('Control shares passed: 2 pies x 6 buckets, May Days dual gate, route gates diverge.');
