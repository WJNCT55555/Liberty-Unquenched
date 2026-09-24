import type { GameState } from '../types';
// 暂停所有权向量时不再需要：import type { IndustryOwnershipKey, LandOwnershipKey } from '../types';
import { isOrganizationEstablished } from '../organizations';
import { getControlShares, getWorkersShare } from './controlShares';

/**
 * 经济改造（生产关系的六条路线）的规则层单一来源。
 *
 * 设计见 `docs/经济改造方案.md`。当前计数器只统计进度；宏观换算已暂停：
 *
 *  1. `advanceEconomyCounter()` —— 18 个顶层计数器的唯一写入口（卡牌/顾问选项调用）；
 *  2. `calculateEconomyReformGraphs()` —— 暂时返回零修正，
 *     由 `rules/economy.ts` 的 `calculateMonthlyEconomy` 消费（预览与月结共用）。
 *
 * 依赖方向是单向的：`economy.ts` → `economyReforms.ts` → `types.ts` / `organizations.ts`。
 * 本模块**不得** import `economy.ts`，否则会与 `calculateMonthlyEconomy` 形成循环依赖。
 * 需要宏观值时用参数传入，不要回头 import。
 */

/** 有上限的计数器。农业五项（见 `UNCAPPED_ECONOMY_COUNTERS`）刻意不在此表。 */
export const ECONOMY_REFORM_CAPS = {
  currency_abolition: 3,
  private_bank_seizure: 1,
  mutual_credit_network: 5,
  credit_exchange_committee: 1,
  rail_nationalization: 3,
  coal_nationalization: 2,
  industrial_cooperative: 5,
  foreign_capital_seizure: 5,
  supply_coordination_network: 3,
  wartime_requisition: 1,
  family_rationing: 1,
  war_industry_conversion: 3,
  wartime_trade_monopoly: 2,
} as const;

/**
 * 无上限的农业计数器。它们是一本流水账（征用了多少次、赎买了多少次），
 * 不是升级树：UI 显示纯数字，不设档位名，也不夹紧。
 */
export const UNCAPPED_ECONOMY_COUNTERS = [
  'agricultural_cooperative',
  'land_requisition',
  'land_redemption',
  'land_voluntary_collectivization',
  'land_forced_collectivization',
] as const;

export type CappedEconomyCounter = keyof typeof ECONOMY_REFORM_CAPS;
export type UncappedEconomyCounter = (typeof UNCAPPED_ECONOMY_COUNTERS)[number];
export type EconomyCounter = CappedEconomyCounter | UncappedEconomyCounter;

/** 18 个计数器的完整清单，供迁移与测试遍历。 */
export const ECONOMY_COUNTERS: readonly EconomyCounter[] = [
  ...UNCAPPED_ECONOMY_COUNTERS,
  ...(Object.keys(ECONOMY_REFORM_CAPS) as CappedEconomyCounter[]),
];

/** 旧存档补齐用的零值表。 */
export const ECONOMY_COUNTER_DEFAULTS: Record<EconomyCounter, number> = ECONOMY_COUNTERS.reduce(
  (accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  },
  {} as Record<EconomyCounter, number>,
);

/**
 * 历史方案中的所有权转移向量，目前仅作为暂存设计数据保留。
 * `applyEconomicOption()` 已停止查表；计数器 +1 不再自动改变所有权。
 */
/* 暂停：计数器的历史所有权向量不参与运行；恢复时应先改为各行动独立效果。
export const ECONOMY_COUNTER_TRANSFERS: Record<
  EconomyCounter,
  {
    land?: Partial<Record<LandOwnershipKey, number>>;
    industry?: Partial<Record<IndustryOwnershipKey, number>>;
  }
> = {
  // ---- 农业五项（无上限；以下为暂停的历史转移方案）----
  agricultural_cooperative: { land: { smallholders: -1.5, cooperative: 1.5 } },
  land_requisition: { land: { latifundia: -2, church: -0.5, collective: 2, cooperative: 0.5 } },
  land_redemption: { land: { latifundia: -1.5, church: -0.5, state: 2 } },
  land_voluntary_collectivization: { land: { smallholders: -3, cooperative: -1, collective: 4 } },
  land_forced_collectivization: {
    land: { latifundia: -3, church: -1, smallholders: -5, collective: 8, state: 1 },
  },
  // ---- 金融与货币 ----
  currency_abolition: { industry: { smallBusiness: -2, cooperative: 2 } },
  private_bank_seizure: { industry: { bigCapital: -4, state: 4 } },
  mutual_credit_network: { land: { smallholders: -2, cooperative: 2 } },
  // 清算机构是记账与结算，不改所有权。
  credit_exchange_committee: {},
  // ---- 工业 ----
  rail_nationalization: { industry: { foreign: -4, bigCapital: -2, state: 6 } },
  coal_nationalization: { industry: { bigCapital: -5, union: 5 } },
  industrial_cooperative: { industry: { smallBusiness: -5, cooperative: 5 } },
  foreign_capital_seizure: { industry: { foreign: -6, state: 6 } },
  supply_coordination_network: {
    land: { smallholders: -1, cooperative: 1 },
    industry: { smallBusiness: -1, cooperative: 1 },
  },
  // ---- 战时经济 ----
  wartime_requisition: { land: { church: -1, latifundia: -1, smallholders: -2, state: 4 } },
  // 口粮本重新分配的是食物，不是地契。
  family_rationing: {},
  war_industry_conversion: { industry: { smallBusiness: -3, bigCapital: -2, state: 5 } },
  wartime_trade_monopoly: { industry: { foreign: -3, state: 3 } },
};
*/

/** 顾问配方案的推动次数上限（方案 §9.3）。 */
export const ECONOMY_PUSH_LIMITS = { cooperativePushes: 2, organicPushes: 3 } as const;
export type EconomyPushCounter = keyof typeof ECONOMY_PUSH_LIMITS;

/**
 * 六条经济路线的日志 id，按方案 §0.3 的顺序。
 *
 * 放在规则层而不是 selectors：界面（读模型）、成就（"六条路"）与测试都要用它，
 * 而规则层是三者唯一共同的依赖方向。
 */
export const ECONOMY_ROUTE_JOURNAL_IDS: readonly string[] = [
  'journal_economy_syndicalist',
  'journal_economy_free_commune',
  'journal_economy_cooperative',
  'journal_economy_organic',
  'journal_economy_war_effort',
  'journal_economy_revolutionary_war',
];

const finiteOrZero = (value: unknown): number => (Number.isFinite(value) ? (value as number) : 0);
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/**
 * 计数器读出口：缺失或非法值一律当 0，避免旧存档/迁移中间态把 NaN 带进公式。
 */
export const getEconomyCounter = (state: GameState, key: EconomyCounter): number =>
  Math.max(0, finiteOrZero(state[key]));

/**
 * 计数器唯一写入口。有上限的夹紧到 `[0, cap]`；农业五项只保证非负。
 *
 * 这样写的原因：18 个计数器 × 30+ 个选项，如果每个选项手写 `Math.min(5, state.x + 1)`，
 * 一处笔误就会出现"地方互助信贷 6/5"；反过来，农业五项若被顺手夹到 5，就违反了设计。
 */
export const advanceEconomyCounter = (
  state: GameState,
  key: EconomyCounter,
  delta: number,
): Partial<GameState> => {
  const current = getEconomyCounter(state, key);
  const cap = (ECONOMY_REFORM_CAPS as Partial<Record<string, number>>)[key];
  const next = cap === undefined
    ? Math.max(0, current + delta)
    : clamp(current + delta, 0, cap);
  return { [key]: next } as Partial<GameState>;
};

/** 顾问推动计数的唯一写入口，同样夹紧到各方案的阈值。 */
export const advanceEconomyPush = (
  state: GameState,
  key: EconomyPushCounter,
): Partial<GameState> => {
  const current = finiteOrZero(state.economy?.[key]);
  const next = clamp(current + 1, 0, ECONOMY_PUSH_LIMITS[key]);
  return {
    economy: {
      cooperativePushes: finiteOrZero(state.economy?.cooperativePushes),
      organicPushes: finiteOrZero(state.economy?.organicPushes),
      [key]: next,
    },
  };
};

/** 铁路/煤炭是否已由工会委员会实际管理（草案的"铁路委员会/煤炭委员会"口径）。 */
export const isRailUnderWorkersControl = (state: GameState): boolean =>
  getEconomyCounter(state, 'rail_nationalization') >= 2 && isOrganizationEstablished(state, 'DC');

export const isCoalUnderWorkersControl = (state: GameState): boolean =>
  getEconomyCounter(state, 'coal_nationalization') >= 1 && isOrganizationEstablished(state, 'DC');

/**
 * 经济路线的判定公共件（方案 §5.1）。
 *
 * 日志文件的 `checkStatus` 全部读这里，而不是各自手写阈值：阈值散落在各个文件里
 * 就是多次抄错的机会。
 *
 * **两条路线的控制权门槛刻意不同**，这是所有权饼带来的最重要一处设计收益：
 *  - 温和工团要的是"工业不再属于私人"**且国家拿到实权**——它要通过国家管理工业；
 *  - 自由公社要的是土地与工业都在**劳动者自己**手里，国有不算数——它的终点是国家变成遗物。
 * 旧设计里两条路线读同一个 `workerControl > 60`，做完同一套操作就能同时推进。
 */
export const ECONOMY_ROUTE_RULES = {
  /** 温和工团：工业社会化 ≥70 且国有 ≥25。 */
  syndicalistControl: (state: GameState): boolean => {
    const industry = getControlShares(state).industry;
    return industry.cooperative + industry.union + industry.state >= 70 && industry.state >= 25;
  },
  /** 自由公社：土地劳动者 ≥60 且工业劳动者 ≥55（不含国有）。 */
  freeCommuneControl: (state: GameState): boolean =>
    getWorkersShare(state, 'land') >= 60 && getWorkersShare(state, 'industry') >= 55,
  /** 温和工团的控制权进度（两个条件取最紧的一条）。 */
  syndicalistControlProgress: (state: GameState): number => {
    const industry = getControlShares(state).industry;
    const socialized = industry.cooperative + industry.union + industry.state;
    return Math.min((socialized / 70) * 100, (industry.state / 25) * 100);
  },
  /** 自由公社的控制权进度（两个条件取最紧的一条）。 */
  freeCommuneControlProgress: (state: GameState): number =>
    Math.min((getWorkersShare(state, 'land') / 60) * 100, (getWorkersShare(state, 'industry') / 55) * 100),
  /** 土地集体化在配方上要求参与次数（第 5C 期起同时读饼图，见方案 §13）。 */
  landCollectivizationTarget: 5,
} as const;

/** 某本日志是否已经完成。`journal_land_collectivization` 在第 5 期上线前恒为 false。 */
export const isJournalCompleted = (state: GameState, journalId: string): boolean =>
  state.journal?.[journalId]?.status === 'completed';

/**
 * 经济改造对国家宏观经济的月度修正。
 *
 * 设计原则（方案 §3.5）：不改 `economy.ts` 的任何既有公式，只提供四个方向的增量与
 * 一个税基乘数。正数 = 对共和国有利，负数 = 代价。
 */
export interface EconomyReformGraphs {
  /** 加到增长目标 `targetGrowth`。 */
  growthGraph: number;
  /** 加到通胀目标 `targetInflation`。 */
  inflationGraph: number;
  /** 加到每月贸易外汇收益 `tradeFxYield`。 */
  foreignExchangeGraph: number;
  /** 直接加到国库现金（月度，正负皆可）。 */
  budgetGraph: number;
  /** 消费税税基乘数；当前恒为 1，旧设计完全废除货币时为 0.6。 */
  consumptionTaxBaseFactor: number;
}

export const EMPTY_ECONOMY_REFORM_GRAPHS: EconomyReformGraphs = {
  growthGraph: 0,
  inflationGraph: 0,
  foreignExchangeGraph: 0,
  budgetGraph: 0,
  consumptionTaxBaseFactor: 1,
};

// 暂停：完全废除货币后的消费税税基乘数。
// export const CURRENCY_ABOLITION_CONSUMPTION_FACTOR = 0.6;

// 暂停宏观修正期间保留原舍入函数，恢复下方公式时一并启用。
// const roundTo = (value: number, decimals: number): number => Number(value.toFixed(decimals));

/**
 * 18 个计数器原本折算成四个宏观方向 + 一个税基乘数。
 *
 * 当前按设计决定暂时停用这些自动宏观效果。计数器本身、行动独立写入的
 * 即时效果与路线判定保留；经济窗口与月结都从这里读到零修正。
 * 原公式注释保留在函数内，恢复时可对照。
 */
export const calculateEconomyReformGraphs = (_state: GameState): EconomyReformGraphs => {
  return EMPTY_ECONOMY_REFORM_GRAPHS;

  /* 暂停：经济改造计数器不再自动改变国家宏观经济。
  const counter = (key: EconomyCounter): number => getEconomyCounter(state, key);
  const isCivilWar = state.civilWarStatus === 'ongoing';

  const agriculturalCooperative = counter('agricultural_cooperative');
  const landRequisition = counter('land_requisition');
  const landRedemption = counter('land_redemption');
  const landVoluntary = counter('land_voluntary_collectivization');
  const landForced = counter('land_forced_collectivization');
  const currencyAbolition = counter('currency_abolition');
  const privateBankSeizure = counter('private_bank_seizure');
  const mutualCredit = counter('mutual_credit_network');
  const creditExchangeCommittee = counter('credit_exchange_committee');
  const railNationalization = counter('rail_nationalization');
  const coalNationalization = counter('coal_nationalization');
  const industrialCooperative = counter('industrial_cooperative');
  const foreignCapitalSeizure = counter('foreign_capital_seizure');
  const supplyCoordination = counter('supply_coordination_network');
  const wartimeRequisition = counter('wartime_requisition');
  const familyRationing = counter('family_rationing');
  const warIndustryConversion = counter('war_industry_conversion');
  const wartimeTradeMonopoly = counter('wartime_trade_monopoly');

  // 货币废除的三级梯度：地方代用券 → 工会工资券 → 货币废除。
  const currencyInflation = currencyAbolition >= 3 ? 0.35 : currencyAbolition === 2 ? 0.25 : currencyAbolition === 1 ? 0.15 : 0;
  const currencyGrowth = currencyAbolition >= 3 ? -0.4 : currencyAbolition === 2 ? -0.1 : 0;

  let growthGraph = 0
    + agriculturalCooperative * 0.05
    - landRequisition * 0.04
    + landRedemption * 0.03
    + landVoluntary * 0.04
    - landForced * 0.06
    + currencyGrowth
    - privateBankSeizure * 0.3
    + mutualCredit * 0.03
    + creditExchangeCommittee * 0.05
    + railNationalization * 0.06
    + coalNationalization * 0.08
    + industrialCooperative * 0.05
    + foreignCapitalSeizure * 0.05
    + supplyCoordination * 0.04
    + wartimeRequisition * 0.05
    + warIndustryConversion * 0.1
    + wartimeTradeMonopoly * 0.05;
  if (isCivilWar && growthGraph > 0) growthGraph *= 1.5;

  const inflationGraph = 0
    + landRequisition * 0.03
    + landRedemption * 0.02
    + landForced * 0.04
    + currencyInflation
    + privateBankSeizure * 0.5
    - mutualCredit * 0.02
    - creditExchangeCommittee * 0.05
    + foreignCapitalSeizure * 0.02
    - supplyCoordination * 0.03
    + wartimeRequisition * 0.1
    - familyRationing * 0.15
    + warIndustryConversion * 0.05
    + wartimeTradeMonopoly * 0.08;

  const foreignExchangeGraph = 0
    + creditExchangeCommittee * 1.2
    - foreignCapitalSeizure * 0.4
    + wartimeTradeMonopoly * 1.0;

  const budgetGraph = 0
    - landRedemption * 0.15
    + railNationalization * 0.1
    + coalNationalization * 0.12
    + foreignCapitalSeizure * 0.2
    + wartimeRequisition * 0.4
    - familyRationing * 0.2;

  return {
    growthGraph: roundTo(growthGraph, 4),
    inflationGraph: roundTo(inflationGraph, 4),
    foreignExchangeGraph: roundTo(foreignExchangeGraph, 4),
    budgetGraph: roundTo(budgetGraph, 4),
    consumptionTaxBaseFactor: currencyAbolition >= 3 && state.currency_abolished_declared === true
      ? CURRENCY_ABOLITION_CONSUMPTION_FACTOR
      : 1,
  };
  */
};
