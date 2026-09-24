import type {
  EconomyOwnershipShares,
  GameState,
  IndustryOwnership,
  IndustryOwnershipKey,
  LandOwnership,
  LandOwnershipKey,
  OwnershipSector,
} from '../types';
import { getInitialControlShares } from '../scenarios/controlShares';
import { advanceEconomyCounter, type EconomyCounter } from './economyReforms';

/**
 * 土地与生产资料所有权（两张六分饼）的规则层单一来源。
 * 设计见 `docs/工人控制度改造方案.md`。
 *
 * 两条不变量（所有函数都必须维持）：
 *  1. 每张饼六项之和恒为 100，每项非负；
 *  2. 写入只经 `transferControlShare()` / `applyControlInfluence()`，
 *     不允许内容层逐个 bucket 手写增量（后一次会覆盖前一次）。
 *
 * 经济改造计数器当前只记进度；`applyEconomicOption()` 不自动转移所有权。
 * 独立行动仍可显式调用 `transferControlShare()` 改变所有权。
 *
 * 依赖方向是单向的：`rules/*` → `rules/controlShares.ts` → `types.ts` / `scenarios/controlShares.ts`。
 * 本模块不得 import 经济改造的日志或事件。
 */

const finiteOrZero = (value: unknown): number => (Number.isFinite(value) ? (value as number) : 0);

/** 私人三项：行动只从这些桶里取。 */
export const LAND_PRIVATE_KEYS: readonly LandOwnershipKey[] = ['church', 'latifundia', 'smallholders'];
export const INDUSTRY_PRIVATE_KEYS: readonly IndustryOwnershipKey[] = ['foreign', 'bigCapital', 'smallBusiness'];

/** 社会化三项（劳动者 + 国有）。 */
export const LAND_SOCIALIZED_KEYS: readonly LandOwnershipKey[] = ['cooperative', 'collective', 'state'];
export const INDUSTRY_SOCIALIZED_KEYS: readonly IndustryOwnershipKey[] = ['cooperative', 'union', 'state'];

/** 劳动者两项（社会化里"归劳动者"的那部分，**不含国有**）。 */
export const LAND_WORKER_KEYS: readonly LandOwnershipKey[] = ['cooperative', 'collective'];
export const INDUSTRY_WORKER_KEYS: readonly IndustryOwnershipKey[] = ['cooperative', 'union'];

const PRIVATE_KEYS: Record<OwnershipSector, readonly string[]> = {
  land: LAND_PRIVATE_KEYS,
  industry: INDUSTRY_PRIVATE_KEYS,
};

/** 取饼；旧存档缺字段时按剧本初值兜底。 */
export const getControlShares = (state: GameState): EconomyOwnershipShares =>
  state.controlShares ?? getInitialControlShares(state.scenario);

const getSector = (state: GameState, sector: OwnershipSector): Record<string, number> =>
  getControlShares(state)[sector] as unknown as Record<string, number>;

const sumKeys = (share: Record<string, number>, keys: readonly string[]): number =>
  keys.reduce((sum, key) => sum + finiteOrZero(share[key]), 0);

/** 某部门里"属于劳动者"的份额：合作社 + 集体 / 地方工会。**不含国有。** */
export const getWorkersShare = (state: GameState, sector: OwnershipSector): number =>
  sector === 'land'
    ? sumKeys(getSector(state, 'land'), LAND_WORKER_KEYS)
    : sumKeys(getSector(state, 'industry'), INDUSTRY_WORKER_KEYS);

/** 某部门里"已脱离私人"的份额：劳动者份额 + 国有。 */
export const getSocializedShare = (state: GameState, sector: OwnershipSector): number =>
  sector === 'land'
    ? sumKeys(getSector(state, 'land'), LAND_SOCIALIZED_KEYS)
    : sumKeys(getSector(state, 'industry'), INDUSTRY_SOCIALIZED_KEYS);

/** 某部门里仍属私人（含教会与外资）的份额。`private + socialized` 恒为 100。 */
export const getPrivateShare = (state: GameState, sector: OwnershipSector): number =>
  sumKeys(getSector(state, sector), PRIVATE_KEYS[sector]);

/** 国有份额（两条路线的分野所在）。 */
export const getStateShare = (state: GameState, sector: OwnershipSector): number =>
  finiteOrZero(getSector(state, sector).state);

/**
 * 兼容读取器：**只统计劳动者份额，不把国有算进"工人控制"**。
 * 旧口径的 `workerControl` 表达的是"工人控制程度"，国有化的工厂不是工人控制的工厂。
 */
export const getWorkerControlEquivalent = (state: GameState): number =>
  (getWorkersShare(state, 'land') + getWorkersShare(state, 'industry')) / 2;

/**
 * 把一张饼沿 `delta` 移动：正项足额增加，负项按可动用余额减少，
 * 未指定的项按现有比例吸收差额；最后整数化并把舍入误差补到最大项。
 *
 * 出方容量不足时不静默失败：进方永远足额到账，缺口由**未指定的私人桶**补足。
 * 例（1933 剧本外资只有 10）：`foreign_capital_seizure` 第二次要 −6，实际只扣到 4，
 * 其余 2 点从国内大资本出——"没收外资"在外资见底后转为没收民族资本。
 */
export const transferControlShare = (
  state: GameState,
  sector: OwnershipSector,
  delta: Partial<Record<string, number>>,
): Partial<GameState> => {
  const current = getSector(state, sector);
  const next: Record<string, number> = { ...current };
  const explicit = new Set(Object.keys(delta).filter((key) => finiteOrZero(delta[key]) !== 0));

  let promisedOut = 0;
  let actualOut = 0;
  explicit.forEach((key) => {
    const value = finiteOrZero(delta[key]);
    if (value > 0) {
      next[key] = (next[key] ?? 0) + value;
      return;
    }
    promisedOut += -value;
    const movable = Math.min(-value, Math.max(0, next[key] ?? 0));
    next[key] = (next[key] ?? 0) - movable;
    actualOut += movable;
  });

  // 进方总额是 promisedOut + 净转移量；二者之差由隐式桶按比例承担。
  // 注意这里用"承诺支出"而不是"实付"：进方拿了多少，就必须有同样多的量从别处出。
  const netFromImplicit = promisedOut - actualOut;
  if (Math.abs(netFromImplicit) > 1e-9) {
    const implicit = Object.keys(next).filter((key) => !explicit.has(key));
    const pool = implicit.reduce((sum, key) => sum + Math.max(0, next[key]), 0);
    if (pool > 0) {
      implicit.forEach((key) => {
        const value = Math.max(0, next[key]);
        next[key] = Math.max(0, value - netFromImplicit * (value / pool));
      });
    } else {
      const largest = Object.keys(next).reduce((best, key) => (next[key] > next[best] ? key : best), Object.keys(next)[0]);
      next[largest] = Math.max(0, next[largest] - netFromImplicit);
    }
  }

  const keys = Object.keys(next);
  keys.forEach((key) => { next[key] = Math.round(next[key]); });
  const total = keys.reduce((sum, key) => sum + next[key], 0);
  if (total !== 100) {
    const largest = keys.reduce((best, key) => (next[key] > next[best] ? key : best), keys[0]);
    next[largest] = Math.max(0, next[largest] + (100 - total));
  }

  return { controlShares: { ...getControlShares(state), [sector]: next } } as Partial<GameState>;
};

/**
 * 结构性上限：没有新的行动，社会化总量最多只能到这个位置。
 * 取代旧的"1936·7 之前封顶 40"——那条规则只看日历，这条看制度与土地改革。
 */
export interface OwnershipCeilings {
  /** 土地社会化（合作社 + 集体 + 国有）上限。 */
  land: number;
  /** 工业社会化（工业合作社 + 地方工会 + 国有）上限。 */
  industry: number;
}

export const getControlCeilings = (state: GameState): OwnershipCeilings => {
  const unionRecognized = (state.domesticPolicy?.union_status ?? 0) >= 1;
  const unionBargaining = (state.domesticPolicy?.union_status ?? 0) >= 2;
  const landReformStarted = (state.domesticPolicy?.land_reform_progress ?? 0) >= 30;
  const war = state.civilWarStatus === 'ongoing' || Boolean(state.activeWar);

  if (war) {
    return { land: landReformStarted ? 92 : 45, industry: unionBargaining ? 95 : 55 };
  }
  // 农村可以走在城市前面（1932 卡萨斯·维耶哈斯、1933 安达卢西亚农运），
  // 但没有土改就没有合法性：进度不到 30 时只有 12。
  return {
    land: landReformStarted ? 21 : 12,
    industry: unionBargaining ? 16 : unionRecognized ? 10 : 7,
  };
};

/**
 * 月度收拢：社会化总量高于上限时，把超出部分按比例退回私人三项；低于上限时不动。
 *
 * **上涨必须来自玩家的行动**，所以这里只往下收。超出 1 点以上时每月回落 1 点
 * （给玩家留出反应时间）；超出不足 1 点时一次性退到上限。
 *
 * 两个实现细节，都是被测试逼出来的：
 *  1. **按比例削减会在整数化时被抹掉**——社会化总量可能只剩 1—2 点，`cut * (value / pool)`
 *     小于 0.5 就被 `Math.round` 抹平，于是永远收不到位。这里改成"把削减量记到最大的
 *     社会化桶上"，保证每个月真的掉 1 点；
 *  2. 私人池为零时无法退，直接放弃这次收拢（份额不能再涨，但也不该凭空虚增）。
 */
export const applyOwnershipDrift = (state: GameState): GameState => {
  const ceilings = getControlCeilings(state);
  let shares = getControlShares(state);
  let changed = false;

  (['land', 'industry'] as const).forEach((sector) => {
    const current = shares[sector] as unknown as Record<string, number>;
    const socializedKeys = sector === 'land' ? LAND_SOCIALIZED_KEYS : INDUSTRY_SOCIALIZED_KEYS;
    const privateKeys = PRIVATE_KEYS[sector];
    const socialized = sumKeys(current, socializedKeys);
    const excess = socialized - ceilings[sector];
    if (excess <= 0) return;

    const cut = excess > 1 ? 1 : excess;
    const privatePool = privateKeys.reduce((sum, key) => sum + Math.max(0, current[key] ?? 0), 0);
    if (privatePool <= 0) return;

    const next: Record<string, number> = { ...current };
    // 削减量记到最大的社会化桶（它一定 ≥ 1，因为总量超过了上限）。
    const donor = socializedKeys.reduce((best, key) => ((next[key] ?? 0) > (next[best] ?? 0) ? key : best), socializedKeys[0]);
    next[donor] = Math.max(0, (next[donor] ?? 0) - cut);

    // 退回私人三项，按现有比例分配；至少给最大的一项，避免被舍入抹掉。
    const recipient = privateKeys.reduce((best, key) => ((next[key] ?? 0) > (next[best] ?? 0) ? key : best), privateKeys[0]);
    privateKeys.forEach((key) => {
      const value = Math.max(0, next[key] ?? 0);
      next[key] = value + cut * (value / privatePool);
    });
    next[recipient] = Math.max(next[recipient], 0);

    const keys = Object.keys(next);
    keys.forEach((key) => { next[key] = Math.round(next[key]); });
    const total = keys.reduce((sum, key) => sum + next[key], 0);
    if (total !== 100) {
      // 舍入误差补到"最大的一项"，且优先补私人（不影响社会化总量）。
      const largest = privateKeys.reduce((best, key) => (next[key] > next[best] ? key : best), privateKeys[0]);
      next[largest] = Math.max(0, next[largest] + (100 - total));
    }

    shares = { ...shares, [sector]: next } as EconomyOwnershipShares;
    changed = true;
  });

  return changed ? { ...state, controlShares: shares } : state;
};

/**
 * 内容层的"影响力写入"：把一个行动对工人控制的作用翻译成所有权转移。
 *
 * 迁移期（第 5A 期）用它把 15 个写入点逐个换掉，同时保持旧的数值手感：
 * `points` 的**总和等于旧的 `workerControl` 增量**，因此"同一串选项序列下新旧数值
 * 逐月一致"这条验收标准可以成立。
 *
 * 返回的补丁同时包含两件东西，让调用点保持既有形状：
 *   - `controlShares`：真正变动的所有权饼；
 *   - `stats.workerControl`：**派生值**（`postReducer` 还会再算一次，这里是让
 *     "只取 `patch.stats.workerControl`"的调用点与预览继续工作）。
 *
 * @param points 旧口径的 `workerControl` 增量；正数默认落在两个部门的劳动者桶上。
 * @param spread 可选的重心覆盖（两个部门之间怎么分），默认土地 40% / 工业 60%——
 *               与旧设计"工业动作更常出现"的经验分布一致。两者之和应为 1。
 */
export const applyControlInfluence = (
  state: GameState,
  points: number,
  spread: { land: number; industry: number } = { land: 0.4, industry: 0.6 },
): Partial<GameState> => {
  const shares = getControlShares(state);
  if (!points) return {};

  // 负向影响（例如土地改革失败、五月事件失败）先走反向转移：劳动者份额退回私人三项。
  if (points < 0) {
    const landLoss = Math.min(getWorkersShare(state, 'land'), -points * spread.land);
    const industryLoss = Math.min(getWorkersShare(state, 'industry'), -points * spread.industry);
    let next = shares;
    if (landLoss > 0) {
      const patch = transferControlShare({ ...state, controlShares: next }, 'land', {
        cooperative: -landLoss * 0.6,
        collective: -landLoss * 0.4,
      });
      next = patch.controlShares as EconomyOwnershipShares;
    }
    if (industryLoss > 0) {
      const patch = transferControlShare({ ...state, controlShares: next }, 'industry', {
        cooperative: -industryLoss * 0.4,
        union: -industryLoss * 0.6,
      });
      next = patch.controlShares as EconomyOwnershipShares;
    }
    return {
      controlShares: next,
      stats: { workerControl: getDerivedWorkerControl(next) },
    } as unknown as Partial<GameState>;
  }

  const landCapacity = Math.max(0, 100 - getPrivateShare(state, 'land'));
  const industryCapacity = Math.max(0, 100 - getPrivateShare(state, 'industry'));

  let land = Math.max(0, points * spread.land);
  let industry = Math.max(0, points * spread.industry);

  // 把超出某部门可转移量的部分挪到另一个部门（只挪一次，避免来回振荡）。
  if (land > landCapacity) {
    industry += land - landCapacity;
    land = landCapacity;
  }
  if (industry > industryCapacity) {
    land = Math.min(landCapacity, land + (industry - industryCapacity));
    industry = industryCapacity;
  }

  let next = shares;
  if (land > 0) {
    const patch = transferControlShare({ ...state, controlShares: next }, 'land', {
      cooperative: land * 0.6,
      collective: land * 0.4,
    });
    next = patch.controlShares as EconomyOwnershipShares;
  }
  if (industry > 0) {
    const patch = transferControlShare({ ...state, controlShares: next }, 'industry', {
      cooperative: industry * 0.4,
      union: industry * 0.6,
    });
    next = patch.controlShares as EconomyOwnershipShares;
  }

  return {
    controlShares: next,
    // `stats` 刻意只给 workerControl 一项：所有权饼是新的真相来源，这个字段只是为了
    // 让"只取 patch.stats.workerControl"的调用点与预览继续工作（类型上允许部分 stats）。
    stats: { workerControl: getDerivedWorkerControl(next) },
  } as unknown as Partial<GameState>;
};

/** 只想要派生值时用它（与 `applyControlInfluence` 的 `stats` 字段同源）。 */
export const getDerivedWorkerControl = (shares: EconomyOwnershipShares): number => {
  const land = sumKeys(shares.land as unknown as Record<string, number>, LAND_WORKER_KEYS);
  const industry = sumKeys(shares.industry as unknown as Record<string, number>, INDUSTRY_WORKER_KEYS);
  return (land + industry) / 2;
};

/**
 * **经济改造选项的唯一效果写法**（docs/工人控制度改造方案.md §4.4／§4.6）。
 *
 * 只推进一次计数。完成状态仍供路线和选项条件读取，但计数不自动改变所有权。
 * 原先按计数器查向量的实现暂时注释保留，待独立设计行动效果时再处理。
 */
export const applyEconomicOption = (
  state: GameState,
  counter: EconomyCounter,
): Partial<GameState> => {
  return advanceEconomyCounter(state, counter, 1);
  /* 暂停：经济改造计数器不再自动转移生产资料所有权。
  const counterPatch = advanceEconomyCounter(state, counter, 1);
  let next = { ...state, ...counterPatch } as GameState;
  const transfers = ECONOMY_COUNTER_TRANSFERS[counter];
  if (transfers.land) {
    const patch = transferControlShare(next, 'land', transfers.land as Partial<Record<string, number>>);
    next = { ...next, ...patch } as GameState;
  }
  if (transfers.industry) {
    const patch = transferControlShare(next, 'industry', transfers.industry as Partial<Record<string, number>>);
    next = { ...next, ...patch } as GameState;
  }
  return { ...counterPatch, controlShares: next.controlShares } as Partial<GameState>;
  */
};

/** 给界面与预览用的份额条目顺序（私人三项 → 社会化三项）。 */
export const OWNERSHIP_LABELS: Record<OwnershipSector, readonly { key: string; label: string; labelZh: string }[]> = {
  land: [
    { key: 'church', label: 'Church land', labelZh: '教会土地' },
    { key: 'latifundia', label: 'Large estates', labelZh: '大庄园所有制' },
    { key: 'smallholders', label: 'Yeomen & smallholders', labelZh: '中小地主与自耕农' },
    { key: 'cooperative', label: 'Agricultural cooperatives', labelZh: '农业合作社' },
    { key: 'collective', label: 'Agricultural collectives', labelZh: '农业集体' },
    { key: 'state', label: 'State land', labelZh: '国有土地' },
  ],
  industry: [
    { key: 'foreign', label: 'Foreign capital', labelZh: '外资控制' },
    { key: 'bigCapital', label: 'Large private capital', labelZh: '大资本私有制' },
    { key: 'smallBusiness', label: 'Small proprietors', labelZh: '小业主私有制' },
    { key: 'cooperative', label: 'Industrial cooperatives', labelZh: '工业合作社' },
    { key: 'union', label: 'Local union ownership', labelZh: '地方工会所有制' },
    { key: 'state', label: 'State ownership', labelZh: '国有制' },
  ],
};

/**
 * 两张饼的配色（docs/工人控制度改造方案.md §6.2，用户指定）。
 *
 * 设计规则：**同一类私有制在两张饼上用同一个颜色**，让两张饼可以直接对比——
 * 大庄园与大资本都是黄色（大私有制）、中小地主与小业主都是蓝色（小私有制）、
 * 教会土地是灰色、国有是深紫色。劳动者那两块用红系，与"工会占比"图同一套语言。
 */
export const OWNERSHIP_COLORS: Record<OwnershipSector, Record<string, string>> = {
  land: {
    church: '#9ca3af',        // 灰：教会土地
    latifundia: '#eab308',    // 黄：大庄园所有制
    smallholders: '#2563eb',  // 蓝：中小地主与自耕农所有制
    cooperative: '#dc2626',   // 次深红：农业合作社
    collective: '#991b1b',    // 最深红：农业集体
    state: '#4c1d95',         // 深紫：国有土地
  },
  industry: {
    foreign: '#0d9488',       // 青绿：外资控制（与"大私有制"区分：它不吃黄/蓝）
    bigCapital: '#eab308',    // 黄：大资本私有制
    smallBusiness: '#2563eb', // 蓝：小业主私有制
    cooperative: '#dc2626',   // 次深红：工业合作社
    union: '#991b1b',         // 最深红：地方工会所有制
    state: '#4c1d95',         // 深紫：国有制
  },
};

/** 单张饼的校验（测试与迁移共用）。 */
export const isValidOwnershipPie = (shares: Record<string, number>): boolean => {
  const values = Object.values(shares);
  return values.every((value) => Number.isFinite(value) && value >= 0)
    && values.reduce((sum, value) => sum + value, 0) === 100;
};

/** 供类型层复用：六项都是数字。 */
export type OwnershipPie = LandOwnership | IndustryOwnership;
export type { LandOwnershipKey, IndustryOwnershipKey };
