import type { GameState, LawId } from '../types';
import { getPolicyLevelDefinition, POLICY_DEFINITION_BY_ID, type PolicyModifier } from './policyDefinitions';

export interface EconomyBreakdown {
  isCivilWar: boolean;
  taxRates: {
    lower: number;
    middle: number;
    upper: number;
    tariff: number;
    consumption: number;
  };
  revenue: {
    incomeTax: number;
    tariff: number;
    consumptionTax: number;
    total: number;
  };
  expenditure: {
    civilAdministration: number;
    maxHours: number;
    workplaceSafety: number;
    minimumWage: number;
    education: number;
    womensRights: number;
    warMobilization: number;
    military: number;
    debtInterest: number;
    landCompensation: number;
    total: number;
  };
  budgetDelta: number;
  nextBudget: number;
  nextDebt: number;
  tradeFxYield: number;
  nextForeignExchange: number;
  armyLoyaltyFactor: number;
  nextArmyLoyalty: number;
  nextGrowth: number;
  nextInflation: number;
  nextUnemployment: number;
  landLawLevel: number;
  landReformPaused: boolean;
}

export const ECONOMIC_RULES = {
  defaults: {
    lowerTax: 5,
    middleTax: 15,
    upperTax: 25,
    tariff: 10,
    consumptionTax: 8,
    budget: 12,
    debt: 500,
    foreignExchange: 180,
    growth: 2.5,
    inflation: 3.5,
    unemployment: 11.2,
    goldReserves: 2200,
    militarySpending: 15,
    armyLoyalty: 50,
  },
  incomeWeights: { lower: 4, middle: 3.5, upper: 4.5, consumption: 8, peaceTariffBase: 5, warTariffBase: 2 },
  /**
   * Macro-indicator dynamics: monthly partial adjustment (inertia).
   * Each month the model computes a "target" from current parameters
   * (taxes/debt/gold/deficit/war/policies), then moves the actual value
   * only partway toward it:
   *     next = current + alpha * (target - current)
   * Targets are never applied instantly, so one-off shocks (e.g. selling
   * gold, war-bond issuance) decay smoothly instead of being overwritten
   * the following month. Labor markets (unemployment) intentionally
   * adjust slower than growth or prices.
   */
  indicatorInertia: { growth: 0.35, inflation: 0.3, unemployment: 0.2 },
  /** Allowed band for the growth indicator (min < 1 allows recessions). */
  growthBounds: { min: -6, max: 15 },
} as const;

const roundTo = (value: number, decimals: number): number => Number(value.toFixed(decimals));
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const monthlyPolicyCost = (policyId: LawId, level: number): number =>
  POLICY_DEFINITION_BY_ID[policyId]?.levels
    .find(policyLevel => policyLevel.level === level)?.cost?.monthlyBudget ?? 0;

const monthlyPolicyModifier = (
  policyId: LawId,
  level: number,
  target: Extract<PolicyModifier, { kind: 'economy' }>['target'],
): number => getPolicyLevelDefinition(policyId, level)?.monthlyModifiers
  ?.filter((modifier): modifier is Extract<PolicyModifier, { kind: 'economy' }> => modifier.kind === 'economy' && modifier.target === target)
  .reduce((sum, modifier) => sum + modifier.delta, 0) ?? 0;

/**
 * The single source for national monthly economic rules. It is intentionally
 * read-only: the reducer applies the returned values, while previews consume
 * the same breakdown without duplicating formulas.
 */
export const calculateMonthlyEconomy = (state: GameState): EconomyBreakdown => {
  const taxRates = {
    lower: (state.tax_lower_class ?? ECONOMIC_RULES.defaults.lowerTax) / 100,
    middle: (state.tax_middle_class ?? ECONOMIC_RULES.defaults.middleTax) / 100,
    upper: (state.tax_upper_class ?? ECONOMIC_RULES.defaults.upperTax) / 100,
    tariff: (state.tax_tariff ?? ECONOMIC_RULES.defaults.tariff) / 100,
    consumption: (state.tax_consumption ?? ECONOMIC_RULES.defaults.consumptionTax) / 100,
  };
  const isCivilWar = state.civilWarStatus === 'ongoing';
  const incomeTax = (taxRates.lower * ECONOMIC_RULES.incomeWeights.lower)
    + (taxRates.middle * ECONOMIC_RULES.incomeWeights.middle)
    + (taxRates.upper * ECONOMIC_RULES.incomeWeights.upper);
  const tariff = taxRates.tariff * (isCivilWar ? ECONOMIC_RULES.incomeWeights.warTariffBase : ECONOMIC_RULES.incomeWeights.peaceTariffBase);
  const consumptionTax = taxRates.consumption * ECONOMIC_RULES.incomeWeights.consumption;
  const totalRevenue = incomeTax + tariff + consumptionTax;

  const landLawLevel = state.domesticPolicy.land_law;
  const landReformPaused = landLawLevel === 1 && (state.budget ?? ECONOMIC_RULES.defaults.budget) <= 0;
  const expenditure = {
    civilAdministration: 1,
    maxHours: monthlyPolicyCost('max_hours_law', state.domesticPolicy.max_hours_law),
    workplaceSafety: monthlyPolicyCost('workplace_safety', state.domesticPolicy.workplace_safety),
    minimumWage: monthlyPolicyCost('min_wage', state.domesticPolicy.min_wage),
    education: monthlyPolicyCost('education_institutions', state.domesticPolicy.education_institutions),
    womensRights: monthlyPolicyCost('womens_rights', state.domesticPolicy.womens_rights),
    warMobilization: isCivilWar ? 3.5 : 0,
    military: ((state.military_spending ?? ECONOMIC_RULES.defaults.militarySpending) / 100) * (isCivilWar ? 8 : 3),
    debtInterest: (state.public_debt ?? ECONOMIC_RULES.defaults.debt) * ((isCivilWar ? 0.05 : 0.02) / 12),
    landCompensation: landLawLevel === 1 && !landReformPaused
      ? monthlyPolicyCost('land_law', landLawLevel)
      : 0,
    total: 0,
  };
  expenditure.total = Object.entries(expenditure)
    .filter(([key]) => key !== 'total')
    .reduce((sum, [, value]) => sum + value, 0);

  const budgetDelta = totalRevenue - expenditure.total;
  const currentDebt = state.public_debt ?? ECONOMIC_RULES.defaults.debt;
  const nextBudget = clamp(roundTo((state.budget ?? ECONOMIC_RULES.defaults.budget) + budgetDelta, 2), -100, 100);
  const nextDebtBeforeClamp = budgetDelta < 0
    ? currentDebt + Math.abs(budgetDelta)
    : currentDebt - Math.min(budgetDelta * 0.4, currentDebt);
  const nextDebt = roundTo(clamp(nextDebtBeforeClamp, 0, 5000), 2);

  const tradeFxYield = ((state.economy_growth ?? ECONOMIC_RULES.defaults.growth) - ECONOMIC_RULES.defaults.growth) * 1.5
    - ((state.inflation_rate ?? ECONOMIC_RULES.defaults.inflation) - ECONOMIC_RULES.defaults.inflation) * 0.5
    + (taxRates.tariff * 4)
    - (isCivilWar ? 2.5 : 0);
  const nextForeignExchange = roundTo(clamp((state.foreign_exchange ?? ECONOMIC_RULES.defaults.foreignExchange) + tradeFxYield, 0, 2500), 2);

  const armyLoyaltyFactor = ((state.military_spending ?? ECONOMIC_RULES.defaults.militarySpending) - ECONOMIC_RULES.defaults.militarySpending) * 0.12;
  const nextArmyLoyalty = clamp((state.stats.armyLoyalty ?? ECONOMIC_RULES.defaults.armyLoyalty) + armyLoyaltyFactor, 0, 100);

  // ------------------------------------------------------------------
  // 宏观指标：目标值 + 带惯性的部分调整 (partial adjustment)
  // ------------------------------------------------------------------
  // 每月先用当期参数(税率/国债/黄金/赤字/战争/法案)算出"目标值"，
  // 实际指标只按 ECONOMIC_RULES.indicatorInertia 的比例向目标收敛：
  //     next = current + alpha * (target - current)
  // 效果：① 一次性冲击(抛售黄金 +1.5、战争公债 +1.2 通胀)不再被次月
  //        直接覆盖，而是呈驼峰状自然衰减；② 三指标存在惯性滞后，
  //        失业市场(alpha 最小)收敛最慢；③ 增长区间放宽，内战期间
  //        可出现负增长(衰退)。
  const currentGrowth = state.economy_growth ?? ECONOMIC_RULES.defaults.growth;
  const currentInflation = state.inflation_rate ?? ECONOMIC_RULES.defaults.inflation;
  const currentUnemployment = state.unemployment_rate ?? ECONOMIC_RULES.defaults.unemployment;
  const {
    growth: growthInertia,
    inflation: inflationInertia,
    unemployment: unemploymentInertia,
  } = ECONOMIC_RULES.indicatorInertia;
  const { min: minGrowth, max: maxGrowth } = ECONOMIC_RULES.growthBounds;

  // --- 增长目标：税率拖累 + 高债拖累 (+ 内战休克) ---
  const debtGrowthDrag = Math.max(0, (nextDebt - 1200) * 0.001);
  const targetGrowth = clamp(
    3.5
      - (taxRates.lower * 1.5)
      - (taxRates.middle * 2)
      - (taxRates.upper * 2.5)
      - (taxRates.tariff * 3)
      - (taxRates.consumption * 3.5)
      - debtGrowthDrag
      - (isCivilWar ? 6 : 0),
    minGrowth,
    maxGrowth,
  );
  const nextGrowth = roundTo(clamp(currentGrowth + growthInertia * (targetGrowth - currentGrowth), minGrowth, maxGrowth), 2);

  // --- 通胀目标：累进税压制需求 − 间接税推升价格 + 赤字印刷 + 黄金信心流失 (+ 内战) ---
  const goldLossConfidence = Math.max(0, (700 - (state.gold_reserves ?? ECONOMIC_RULES.defaults.goldReserves)) * 0.006);
  const deficitInflation = budgetDelta < 0 ? Math.abs(budgetDelta) * 0.5 : 0;
  const targetInflation = clamp(
    2.5
      - (taxRates.lower * 1)
      - (taxRates.middle * 1.5)
      - (taxRates.upper * 2)
      + (taxRates.tariff * 8)
      + (taxRates.consumption * 6)
      + deficitInflation
      + goldLossConfidence
      + (isCivilWar ? 8 : 0),
    1,
    100,
  );
  const nextInflation = roundTo(clamp(currentInflation + inflationInertia * (targetInflation - currentInflation), 1, 100), 2);

  // --- 失业目标：随(带惯性的)当月增长与税负/高债移动，收敛最慢 ---
  const laborReformReduction = monthlyPolicyModifier('max_hours_law', state.domesticPolicy.max_hours_law, 'unemployment');
  const highDebtUnemploymentFactor = nextDebt > 1500 ? 1 : 0;
  const targetUnemployment = clamp(
    12
      - ((nextGrowth - 2.5) * 0.4)
      + (taxRates.lower * 1)
      + (taxRates.middle * 1.5)
      + (taxRates.upper * 3)
      - (taxRates.tariff * 1.5)
      + laborReformReduction
      + highDebtUnemploymentFactor
      + (isCivilWar ? 4 : 0),
    0,
    100,
  );
  const nextUnemployment = roundTo(clamp(currentUnemployment + unemploymentInertia * (targetUnemployment - currentUnemployment), 0, 100), 2);

  return {
    isCivilWar,
    taxRates,
    revenue: { incomeTax, tariff, consumptionTax, total: totalRevenue },
    expenditure,
    budgetDelta,
    nextBudget,
    nextDebt,
    tradeFxYield,
    nextForeignExchange,
    armyLoyaltyFactor,
    nextArmyLoyalty,
    nextGrowth,
    nextInflation,
    nextUnemployment,
    landLawLevel,
    landReformPaused,
  };
};
