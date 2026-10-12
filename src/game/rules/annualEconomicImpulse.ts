import type { AnnualEconomicImpulse, GameState } from '../types';

/**
 * 年度经济冲量：每年 1 月静默换表的外部经济环境。
 *
 * 为什么是"目标修正"而不是"直接改值"：三个指标在 `calculateMonthlyEconomy` 里是
 * **惯性收敛**（`当前 + 惯性 × (目标 − 当前)`）。直接给当前值加一笔，下个月就会朝没变的
 * 目标走回去；只有把冲量写进目标，它才会稳定地把三个数推到新的水平，年底换表时再移动一次。
 *
 * 数值口径：单位＝该指标的**月度目标位移**，持续 12 个月。难度倍数见
 * `DIFFICULTY_IMPULSE_SCALE`；`sandbox` 一律为 0（沙盒不应被历史环境推着走）。
 *
 * 分工：本表负责**持续的环境**（大萧条、复苏、战时封锁）；一次性的历史冲击（英国放弃
 * 金本位、毕尔巴鄂陷落……）由 `events/economic_news/*` 的新闻事件承担，两者不重复表述。
 */

/** 1932—1939 的和平年份：大萧条 → 复苏 → 战前动荡 → 孤立停滞。 */
const PEACE_IMPULSES: Record<number, Omit<AnnualEconomicImpulse, 'year'>> = {
  1932: {
    label: 'Depression trough', labelZh: '大萧条谷底',
    growth: -1.0, inflation: -0.8, unemployment: 1.2, foreignExchangeMonthly: -1.5, goldMonthly: -15,
  },
  1933: {
    label: 'Bottom, recovery in sight', labelZh: '谷底徘徊，复苏在望',
    growth: -0.4, inflation: -0.2, unemployment: 0.6, foreignExchangeMonthly: -0.8, goldMonthly: -5,
  },
  1934: {
    label: 'Slow recovery and an agrarian crisis', labelZh: '缓慢复苏与农业危机',
    growth: 0.3, inflation: 0.1, unemployment: -0.2, foreignExchangeMonthly: 0.4, goldMonthly: 0,
  },
  1935: {
    label: 'Recovery and a good harvest', labelZh: '复苏与丰收',
    growth: 0.6, inflation: 0.2, unemployment: -0.6, foreignExchangeMonthly: 1.0, goldMonthly: 0,
  },
  1936: {
    label: 'Unrest and capital flight', labelZh: '政治动荡与资本外逃',
    growth: -0.8, inflation: 0.6, unemployment: 0.3, foreignExchangeMonthly: -2.0, goldMonthly: -25,
  },
  1937: {
    label: 'Isolation and stagnation', labelZh: '孤立与停滞',
    growth: -0.2, inflation: 0.2, unemployment: 0.2, foreignExchangeMonthly: -0.3, goldMonthly: 0,
  },
  1938: {
    label: 'Isolation and stagnation', labelZh: '孤立与停滞',
    growth: -0.2, inflation: 0.2, unemployment: 0.2, foreignExchangeMonthly: -0.3, goldMonthly: 0,
  },
  1939: {
    label: 'Isolation and stagnation', labelZh: '孤立与停滞',
    growth: -0.2, inflation: 0.2, unemployment: 0.2, foreignExchangeMonthly: -0.3, goldMonthly: 0,
  },
};

/**
 * 内战进行中的年份。
 *
 * 刻意做小：战争的结构性代价已经由 `isCivilWar` 的 −6 增长／+8 通胀／+4 失业承担，
 * 这里只表达"深化"——物资短缺、双重货币、失去工业区。
 */
const WAR_IMPULSES: Record<number, Omit<AnnualEconomicImpulse, 'year'>> = {
  1936: {
    label: 'War', labelZh: '战争爆发',
    growth: -1.5, inflation: 1.5, unemployment: 0.5, foreignExchangeMonthly: -2.5, goldMonthly: -30,
  },
  1937: {
    label: 'War economy', labelZh: '战时经济',
    growth: -0.4, inflation: 0.5, unemployment: 0.2, foreignExchangeMonthly: -1.5, goldMonthly: -10,
  },
  1938: {
    label: 'Shortages and blockade', labelZh: '物资短缺与封锁',
    growth: -0.6, inflation: 0.8, unemployment: 0.3, foreignExchangeMonthly: -2.0, goldMonthly: -10,
  },
  1939: {
    label: 'Economic collapse', labelZh: '经济崩溃',
    growth: -0.8, inflation: 1.0, unemployment: 0.4, foreignExchangeMonthly: -2.5, goldMonthly: -15,
  },
};

export const DIFFICULTY_IMPULSE_SCALE: Record<GameState['difficulty'], number> = {
  easy: 0.75,
  normal: 1,
  hard: 1.15,
  historical: 1.25,
  sandbox: 0,
};

export const EMPTY_ANNUAL_IMPULSE: AnnualEconomicImpulse = {
  year: 0,
  label: 'No external impulse',
  labelZh: '无外部冲量',
  growth: 0,
  inflation: 0,
  unemployment: 0,
  foreignExchangeMonthly: 0,
  goldMonthly: 0,
};

/** 有表可查的年份区间（用于测试与文档）。 */
export const ANNUAL_IMPULSE_YEARS = Object.keys(PEACE_IMPULSES).map(Number).sort((left, right) => left - right);

const scale = (value: number, factor: number): number => Number((value * factor).toFixed(2));

/**
 * 取某一年的冲量。没有表项的年份（1931 及以后超出范围的年份）返回零冲量——
 * 因此 1931 剧本开局是干净的，第一次冲量落在 1932 年 1 月。
 */
export const getAnnualEconomicImpulse = (
  year: number,
  difficulty: GameState['difficulty'],
  civilWarStatus: GameState['civilWarStatus'],
): AnnualEconomicImpulse => {
  const factor = DIFFICULTY_IMPULSE_SCALE[difficulty] ?? 1;
  const ongoing = civilWarStatus === 'ongoing';
  const row = (ongoing ? WAR_IMPULSES[year] : undefined) ?? PEACE_IMPULSES[year];
  if (!row) return { ...EMPTY_ANNUAL_IMPULSE, year };
  return {
    ...row,
    year,
    growth: scale(row.growth, factor),
    inflation: scale(row.inflation, factor),
    unemployment: scale(row.unemployment, factor),
    foreignExchangeMonthly: scale(row.foreignExchangeMonthly, factor),
    goldMonthly: scale(row.goldMonthly, factor),
  };
};

/** 冲量是否有实际效果（界面用它决定要不要显示那一行）。 */
export const hasAnnualEconomicImpulseEffect = (impulse: AnnualEconomicImpulse | undefined): boolean =>
  Boolean(impulse) && (
    impulse!.growth !== 0
    || impulse!.inflation !== 0
    || impulse!.unemployment !== 0
    || impulse!.foreignExchangeMonthly !== 0
    || impulse!.goldMonthly !== 0
  );

/** 读取当前生效的冲量（缺字段的老存档视为零冲量）。 */
export const readAnnualEconomicImpulse = (state: GameState): AnnualEconomicImpulse =>
  state.annualEconomicImpulse ?? EMPTY_ANNUAL_IMPULSE;
