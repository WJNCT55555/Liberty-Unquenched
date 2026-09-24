import { PRE_START_STATE } from '../src/game/scenarios';
import {
  UNION_SHARE_KEYS,
  UNION_SHARE_MIN_UNORGANIZED,
  adjustUnionShare,
  applyUnionShareDelta,
  getCntDominance,
  getDefaultUnionShare,
  getOrganizedShare,
  getRightShare,
  normalizeUnionShare,
} from '../src/game/unions';
import { applyControlObreroDrift } from '../src/game/rules/controlObrero';
import { getSocializedShare, getControlCeilings } from '../src/game/rules/controlShares';
import { getDefaultOrganizationState } from '../src/game/organizations';
import type { GameState } from '../src/game/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const shareSum = (state: GameState): number =>
  UNION_SHARE_KEYS.reduce((total, key) => total + (state.unionShare?.[key] ?? 0), 0);

const withScenario = (scenario: GameState['scenario']): GameState => ({
  ...PRE_START_STATE,
  scenario,
  organizations: getDefaultOrganizationState(scenario),
  unionShare: getDefaultUnionShare(scenario),
});

// 1) 三个剧本的默认占比之和恒为 100
(['1931', '1933', '1936'] as const).forEach((scenario) => {
  const normalized = normalizeUnionShare(withScenario(scenario));
  assert(Math.abs(shareSum(normalized) - 100) < 0.01, `${scenario} union share must sum to 100`);
});

// 2) 未成立的组织占比强制归零：CONS 成立于 1934-06，1931/1933 剧本必须为 0
(['1931', '1933'] as const).forEach((scenario) => {
  const seeded = withScenario(scenario);
  seeded.unionShare = { ...seeded.unionShare!, CONS: 12 };
  const normalized = normalizeUnionShare(seeded);
  assert(normalized.unionShare!.CONS === 0, `CONS must be 0 in ${scenario} (not yet established)`);
  assert(Math.abs(shareSum(normalized) - 100) < 0.01, `${scenario} share must still sum to 100 after zeroing CONS`);
});

// 3) 1936 剧本 CONS 已成立，允许非零
const s1936 = normalizeUnionShare(withScenario('1936'));
assert(s1936.unionShare!.CONS > 0, 'CONS should be able to hold a share in 1936');

// 4) 未组织者下限 15%：把已组织总量推到 100 也会被压回 85
const saturated = withScenario('1931');
saturated.unionShare = {
  CNT: 90, UGT: 90, UR: 90, ELA: 90, CNCA: 90, CONS: 90, other: 90, unorganized: 0,
};
const clamped = normalizeUnionShare(saturated);
assert(clamped.unionShare!.unorganized >= UNION_SHARE_MIN_UNORGANIZED, 'unorganized must never fall below 15');
assert(Math.abs(clamped.unionShare!.unorganized - UNION_SHARE_MIN_UNORGANIZED) < 0.01, 'unorganized should be pinned at 15 when saturated');
assert(Math.abs(shareSum(clamped) - 100) < 0.01, 'saturated share must still sum to 100');

// 5) 零和调整：任一键变动后总和仍为 100，且未组织者受下限保护
const before = normalizeUnionShare(withScenario('1931'));
const after = normalizeUnionShare({ ...before, ...adjustUnionShare(before, 'CNT', 5) } as GameState);
assert(after.unionShare!.CNT > before.unionShare!.CNT, 'CNT share should rise');
assert(Math.abs(shareSum(after) - 100) < 0.01, 'share must stay at 100 after adjustment');
assert(after.unionShare!.unorganized >= UNION_SHARE_MIN_UNORGANIZED, 'adjustment must respect the unorganized floor');

const drained = normalizeUnionShare({ ...before, ...adjustUnionShare(before, 'CNT', -100) } as GameState);
assert(drained.unionShare!.CNT === 0, 'CNT share cannot go below 0');
assert(Math.abs(shareSum(drained) - 100) < 0.01, 'share must stay at 100 after a full drain');

// 6) 派生读数：组织化率 / 右翼掣肘 / CNT 主导度
const defaults = getDefaultUnionShare('1931');
assert(getOrganizedShare(defaults) === 100 - defaults.unorganized, 'organized share = 100 - unorganized');
assert(getRightShare(defaults) === defaults.CNCA + defaults.CONS, 'right share = CNCA + CONS');
const left = defaults.CNT + defaults.UGT + defaults.UR + defaults.ELA + defaults.other;
assert(Math.abs(getCntDominance(defaults) - (defaults.CNT / left) * 100) < 0.01, 'CNT dominance = CNT / left share');
assert(getCntDominance({ CNT: 0, UGT: 0, UR: 0, ELA: 0, CNCA: 0, CONS: 0, other: 0, unorganized: 100 }) === 0, 'dominance is 0 when no left-wing union exists');

// 7) 旧存档迁移：缺失 unionShare 时按剧本补默认值
const legacy: GameState = { ...PRE_START_STATE, scenario: '1933' };
delete legacy.unionShare;
const migrated = normalizeUnionShare(legacy);
assert(Boolean(migrated.unionShare), 'missing unionShare should be hydrated');
assert(Math.abs(shareSum(migrated) - 100) < 0.01, 'migrated share must sum to 100');

// 8) 显式增量映射：从 UGT 与未组织者争取（零和）
const baseShare = getDefaultUnionShare('1931');
const fromRivals = applyUnionShareDelta(
  { ...PRE_START_STATE, unionShare: baseShare },
  { CNT: 8, UGT: -4, unorganized: -4 },
).unionShare!;
assert(fromRivals.CNT === baseShare.CNT + 8, 'CNT should gain the requested amount');
assert(fromRivals.UGT === baseShare.UGT - 4, 'UGT should lose the requested amount');
assert(fromRivals.unorganized === baseShare.unorganized - 4, 'unorganized should lose the requested amount');
assert(Math.abs(UNION_SHARE_KEYS.reduce((sum, key) => sum + fromRivals[key], 0) - 100) < 0.01, 'explicit delta must keep the sum at 100');

// 9) 生产资料所有权的月度漂移
// 旧规则（缺制度支撑每月 −1、1936·7 前封顶 40）已被结构性上限取代，见
// docs/工人控制度改造方案.md §4.2：社会化总量超过上限时按部门逐月回落 1 点，
// 低于上限时不动。这里验证"不动"与"回落"两端，上限的具体数值在
// `scripts/test-control-shares.ts` 里逐剧本断言。
const underCeiling: GameState = {
  ...PRE_START_STATE,
  year: 1931,
  month: 6,
  scenario: '1931',
  domesticPolicy: { ...PRE_START_STATE.domesticPolicy, union_status: 1, land_reform_progress: 0 },
  controlShares: {
    land: { church: 2, latifundia: 48, smallholders: 44, cooperative: 2, collective: 0, state: 4 },
    industry: { foreign: 18, bigCapital: 38, smallBusiness: 37, cooperative: 2, union: 0, state: 5 },
  },
};
assert(
  applyControlObreroDrift(underCeiling) === underCeiling,
  'a pie below its ceiling must not drift on its own',
);

const overCeiling: GameState = {
  ...underCeiling,
  controlShares: {
    land: { church: 2, latifundia: 30, smallholders: 20, cooperative: 20, collective: 20, state: 8 },
    industry: { foreign: 5, bigCapital: 5, smallBusiness: 5, cooperative: 40, union: 40, state: 5 },
  },
};
const driftedOnce = applyControlObreroDrift(overCeiling);
assert(
  getSocializedShare(driftedOnce, 'land') === getSocializedShare(overCeiling, 'land') - 1,
  'a pie above its ceiling should come down by one point per month',
);
assert(
  getSocializedShare(driftedOnce, 'industry') === getSocializedShare(overCeiling, 'industry') - 1,
  'each sector settles against its own ceiling',
);
const driftedTwice = applyControlObreroDrift(driftedOnce);
assert(
  getSocializedShare(driftedTwice, 'land') === getSocializedShare(driftedOnce, 'land') - 1,
  'the drift must keep biting until the ceiling is reached',
);
// 战时上限更高：同一张饼在内战期间不再回落。这里把两个部门都放在
// "高于各自战前上限、低于各自战时上限（土地 45 / 工业 55）"的区间里。
const warPie: GameState = {
  ...overCeiling,
  controlShares: {
    land: { church: 2, latifundia: 40, smallholders: 28, cooperative: 10, collective: 10, state: 10 },
    industry: { foreign: 15, bigCapital: 15, smallBusiness: 20, cooperative: 25, union: 20, state: 5 },
  },
};
const wartimeOverCeiling: GameState = { ...warPie, civilWarStatus: 'ongoing' };
assert(
  getSocializedShare(warPie, 'land') > getControlCeilings(warPie).land,
  'the fixture must sit above the pre-war ceiling',
);
assert(
  getSocializedShare(wartimeOverCeiling, 'land') <= getControlCeilings(wartimeOverCeiling).land,
  'the same pie must sit below the wartime ceiling',
);
assert(
  applyControlObreroDrift(wartimeOverCeiling) === wartimeOverCeiling,
  'the wartime ceiling must stop the pre-war drift',
);

console.log('Union share tests passed.');
