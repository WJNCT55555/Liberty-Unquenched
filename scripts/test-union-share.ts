import { INITIAL_STATE } from '../src/game/GameContext';
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
import { getDefaultOrganizationState } from '../src/game/organizations';
import type { GameState } from '../src/game/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const shareSum = (state: GameState): number =>
  UNION_SHARE_KEYS.reduce((total, key) => total + (state.unionShare?.[key] ?? 0), 0);

const withScenario = (scenario: GameState['scenario']): GameState => ({
  ...INITIAL_STATE,
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
const legacy: GameState = { ...INITIAL_STATE, scenario: '1933' };
delete legacy.unionShare;
const migrated = normalizeUnionShare(legacy);
assert(Boolean(migrated.unionShare), 'missing unionShare should be hydrated');
assert(Math.abs(shareSum(migrated) - 100) < 0.01, 'migrated share must sum to 100');

// 8) 显式增量映射：从 UGT 与未组织者争取（零和）
const baseShare = getDefaultUnionShare('1931');
const fromRivals = applyUnionShareDelta(
  { ...INITIAL_STATE, unionShare: baseShare },
  { CNT: 8, UGT: -4, unorganized: -4 },
).unionShare!;
assert(fromRivals.CNT === baseShare.CNT + 8, 'CNT should gain the requested amount');
assert(fromRivals.UGT === baseShare.UGT - 4, 'UGT should lose the requested amount');
assert(fromRivals.unorganized === baseShare.unorganized - 4, 'unorganized should lose the requested amount');
assert(Math.abs(UNION_SHARE_KEYS.reduce((sum, key) => sum + fromRivals[key], 0) - 100) < 0.01, 'explicit delta must keep the sum at 100');

// 9) 工人控制程度月度漂移：无制度支撑则衰减，1936.7 前封顶 40
const noSupport: GameState = {
  ...INITIAL_STATE,
  year: 1931,
  month: 6,
  domesticPolicy: { ...INITIAL_STATE.domesticPolicy, union_status: 1, land_reform_progress: 0 },
  stats: { ...INITIAL_STATE.stats, workerControl: 10 },
};
assert(applyControlObreroDrift(noSupport).stats.workerControl === 9, 'worker control should decay by 1 without institutional support');

const withSupport: GameState = {
  ...noSupport,
  domesticPolicy: { ...noSupport.domesticPolicy, union_status: 2 },
};
assert(applyControlObreroDrift(withSupport).stats.workerControl === 10, 'institutional support should stop the decay');

const preWarCap: GameState = {
  ...withSupport,
  stats: { ...withSupport.stats, workerControl: 80 },
};
assert(applyControlObreroDrift(preWarCap).stats.workerControl === 40, 'worker control should be capped at 40 before July 1936');

const postWar: GameState = {
  ...preWarCap,
  year: 1936,
  month: 7,
};
assert(applyControlObreroDrift(postWar).stats.workerControl === 80, 'the pre-war cap should lift from July 1936');

console.log('Union share tests passed.');
