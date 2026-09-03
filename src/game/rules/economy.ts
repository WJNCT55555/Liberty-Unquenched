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
    goldReserves: 2200,
    militarySpending: 15,
    armyLoyalty: 50,
  },
  incomeWeights: { lower: 4, middle: 3.5, upper: 4.5, consumption: 8, peaceTariffBase: 5, warTariffBase: 2 },
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

  const landLawLevel = state.domesticPolicy.land_law
    ?? (state.domesticPolicy.land_reform_law_enabled ? 1 : 0);
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

  const debtGrowthDrag = Math.max(0, (nextDebt - 1200) * 0.001);
  let nextGrowthRaw = 3.5
    - (taxRates.lower * 1.5)
    - (taxRates.middle * 2)
    - (taxRates.upper * 2.5)
    - (taxRates.tariff * 3)
    - (taxRates.consumption * 3.5)
    - debtGrowthDrag;
  if (isCivilWar) nextGrowthRaw -= 6;
  const nextGrowth = roundTo(clamp(nextGrowthRaw, 1, 100), 2);

  const goldLossConfidence = Math.max(0, (700 - (state.gold_reserves ?? ECONOMIC_RULES.defaults.goldReserves)) * 0.006);
  const deficitInflation = budgetDelta < 0 ? Math.abs(budgetDelta) * 0.5 : 0;
  let nextInflation = 2.5
    - (taxRates.lower * 1)
    - (taxRates.middle * 1.5)
    - (taxRates.upper * 2)
    + (taxRates.tariff * 8)
    + (taxRates.consumption * 6)
    + deficitInflation
    + goldLossConfidence;
  if (isCivilWar) nextInflation += 8;

  const laborReformReduction = monthlyPolicyModifier('max_hours_law', state.domesticPolicy.max_hours_law, 'unemployment');
  const highDebtUnemploymentFactor = nextDebt > 1500 ? 1 : 0;
  let nextUnemployment = 12
    - ((nextGrowth - 2.5) * 0.4)
    + (taxRates.lower * 1)
    + (taxRates.middle * 1.5)
    + (taxRates.upper * 3)
    - (taxRates.tariff * 1.5)
    + laborReformReduction
    + highDebtUnemploymentFactor;
  if (isCivilWar) nextUnemployment += 4;

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
    nextInflation: roundTo(clamp(nextInflation, 1, 100), 2),
    nextUnemployment: roundTo(clamp(nextUnemployment, 0, 100), 2),
    landLawLevel,
    landReformPaused,
  };
};
