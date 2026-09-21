import type { GameState, LawId } from '../types';
import { getPolicyLevelDefinition, LAW_DEFINITION_BY_ID, type PolicyModifier } from './policyDefinitions';

export interface EconomyBreakdown {
  isCivilWar: boolean;
  taxRates: { lower: number; middle: number; upper: number; tariff: number; consumption: number };
  taxBaseFactors: {
    output: number;
    employment: number;
    purchasingPower: number;
    capitalConfidence: number;
    tradeVolume: number;
  };
  taxBases: {
    lowerIncome: number;
    middleIncome: number;
    upperIncome: number;
    tariff: number;
    consumption: number;
  };
  collectionEfficiency: { lower: number; middle: number; upper: number; tariff: number; consumption: number };
  revenue: { incomeTax: number; tariff: number; consumptionTax: number; total: number };
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
  /** Monthly operating revenue minus expenditure. This is a flow, not treasury cash. */
  budgetDelta: number;
  financing: {
    openingCash: number;
    openingArrears: number;
    cashUsedForDeficit: number;
    newBorrowing: number;
    newArrears: number;
    arrearsPaid: number;
    principalRepayment: number;
    cashRetained: number;
  };
  nextBudget: number;
  nextDebt: number;
  nextFiscalArrears: number;
  tradeFxYield: number;
  nextForeignExchange: number;
  armyLoyaltyFactor: number;
  nextArmyLoyalty: number;
  nextGrowth: number;
  nextInflation: number;
  nextUnemployment: number;
  nextEconomicOutputIndex: number;
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
    fiscalArrears: 0,
    debt: 500,
    foreignExchange: 180,
    growth: 2.5,
    inflation: 3.5,
    unemployment: 11.2,
    outputIndex: 100,
    goldReserves: 2200,
    militarySpending: 15,
    armyLoyalty: 50,
  },
  incomeWeights: { lower: 4, middle: 3.5, upper: 4.5, consumption: 8, peaceTariffBase: 5 },
  /** Tax rates above these points increasingly shrink the declared/collectable base. */
  taxCapacity: {
    lower: { threshold: 0.25, slope: 1 },
    middle: { threshold: 0.35, slope: 1.2 },
    upper: { threshold: 0.5, slope: 1.5 },
    tariff: { threshold: 0.3, slope: 1.2 },
    consumption: { threshold: 0.25, slope: 1.4 },
  },
  indicatorInertia: { growth: 0.35, inflation: 0.3, unemployment: 0.2 },
  growthBounds: { min: -6, max: 15 },
  inflationBounds: { min: -5, max: 100 },
  outputBounds: { min: 40, max: 200 },
  fiscalBounds: { cashMax: 5000, debtMax: 5000, arrearsMax: 5000 },
  deflationUnemployment: { mildBelow: -0.5, mildDelta: 0.4, severeBelow: -5, severeDelta: 0.8 },
  /** Military spending is a share of the national budget, expressed in percent. */
  militarySpendingBounds: { min: 5, max: 100 },
} as const;

const roundTo = (value: number, decimals: number): number => Number(value.toFixed(decimals));
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/** Use this in cards/events so direct unemployment shocks share clamping and rounding. */
export const adjustUnemploymentRate = (state: Pick<GameState, 'unemployment_rate'>, delta: number): number => {
  const current = Number.isFinite(state.unemployment_rate)
    ? state.unemployment_rate
    : ECONOMIC_RULES.defaults.unemployment;
  return roundTo(clamp(current + (Number.isFinite(delta) ? delta : 0), 0, 100), 2);
};

/** Falling collection efficiency models avoidance, evasion and base flight at extreme rates. */
const getCollectionEfficiency = (rate: number, threshold: number, slope: number): number =>
  clamp(1 - Math.max(0, rate - threshold) * slope, 0.1, 1);

/** Clamps a military-spending value to the band every other writer respects. */
export const clampMilitarySpending = (value: number): number => {
  if (!Number.isFinite(value)) return ECONOMIC_RULES.defaults.militarySpending;
  return Math.max(
    ECONOMIC_RULES.militarySpendingBounds.min,
    Math.min(ECONOMIC_RULES.militarySpendingBounds.max, value),
  );
};

const monthlyPolicyCost = (policyId: LawId, level: number): number =>
  LAW_DEFINITION_BY_ID[policyId]?.levels
    .find(policyLevel => policyLevel.level === level)?.cost?.monthlyBudget ?? 0;

const monthlyPolicyModifier = (
  policyId: LawId,
  level: number,
  target: Extract<PolicyModifier, { kind: 'economy' }>['target'],
): number => getPolicyLevelDefinition(policyId, level)?.monthlyModifiers
  ?.filter((modifier): modifier is Extract<PolicyModifier, { kind: 'economy' }> => modifier.kind === 'economy' && modifier.target === target)
  .reduce((sum, modifier) => sum + modifier.delta, 0) ?? 0;

/**
 * Single source for monthly tax bases, cash accounting and macro feedback.
 * The function is read-only so previews and monthly settlement share the rules.
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
  const currentOutputIndex = state.economic_output_index ?? ECONOMIC_RULES.defaults.outputIndex;
  const currentInflation = state.inflation_rate ?? ECONOMIC_RULES.defaults.inflation;
  const currentUnemployment = state.unemployment_rate ?? ECONOMIC_RULES.defaults.unemployment;
  const currentDebt = clamp(state.public_debt ?? ECONOMIC_RULES.defaults.debt, 0, ECONOMIC_RULES.fiscalBounds.debtMax);
  const currentArrears = clamp(state.fiscal_arrears ?? ECONOMIC_RULES.defaults.fiscalArrears, 0, ECONOMIC_RULES.fiscalBounds.arrearsMax);

  // Output sets scale; employment supports wages and demand; inflation erodes
  // real consumption; debt and arrears weaken confidence; war contracts trade.
  const output = clamp(currentOutputIndex / ECONOMIC_RULES.defaults.outputIndex, 0.4, 2);
  const employment = clamp((100 - currentUnemployment) / (100 - ECONOMIC_RULES.defaults.unemployment), 0.45, 1.15);
  const purchasingPower = clamp(
    1 - Math.max(0, currentInflation - ECONOMIC_RULES.defaults.inflation) * 0.015
      + Math.max(0, ECONOMIC_RULES.defaults.inflation - currentInflation) * 0.005,
    0.45,
    1.1,
  );
  const capitalConfidence = clamp(
    1 - Math.max(0, currentDebt - 1200) / 5000
      - currentArrears / 3000
      - Math.max(0, currentInflation - 8) * 0.01,
    0.4,
    1.1,
  );
  const tradeVolume = clamp(output * purchasingPower * capitalConfidence * (isCivilWar ? 0.4 : 1), 0.15, 2);
  const taxBaseFactors = { output, employment, purchasingPower, capitalConfidence, tradeVolume };
  const taxBases = {
    lowerIncome: ECONOMIC_RULES.incomeWeights.lower * output * employment,
    middleIncome: ECONOMIC_RULES.incomeWeights.middle * output * (0.7 + 0.3 * employment),
    upperIncome: ECONOMIC_RULES.incomeWeights.upper * output * capitalConfidence,
    tariff: ECONOMIC_RULES.incomeWeights.peaceTariffBase * tradeVolume,
    consumption: ECONOMIC_RULES.incomeWeights.consumption * output * employment * purchasingPower,
  };
  const collectionEfficiency = {
    lower: getCollectionEfficiency(taxRates.lower, ECONOMIC_RULES.taxCapacity.lower.threshold, ECONOMIC_RULES.taxCapacity.lower.slope),
    middle: getCollectionEfficiency(taxRates.middle, ECONOMIC_RULES.taxCapacity.middle.threshold, ECONOMIC_RULES.taxCapacity.middle.slope),
    upper: getCollectionEfficiency(taxRates.upper, ECONOMIC_RULES.taxCapacity.upper.threshold, ECONOMIC_RULES.taxCapacity.upper.slope),
    tariff: getCollectionEfficiency(taxRates.tariff, ECONOMIC_RULES.taxCapacity.tariff.threshold, ECONOMIC_RULES.taxCapacity.tariff.slope),
    consumption: getCollectionEfficiency(taxRates.consumption, ECONOMIC_RULES.taxCapacity.consumption.threshold, ECONOMIC_RULES.taxCapacity.consumption.slope),
  };
  const incomeTax = taxRates.lower * taxBases.lowerIncome * collectionEfficiency.lower
    + taxRates.middle * taxBases.middleIncome * collectionEfficiency.middle
    + taxRates.upper * taxBases.upperIncome * collectionEfficiency.upper;
  const tariff = taxRates.tariff * taxBases.tariff * collectionEfficiency.tariff;
  const consumptionTax = taxRates.consumption * taxBases.consumption * collectionEfficiency.consumption;
  const totalRevenue = incomeTax + tariff + consumptionTax;

  const landLawLevel = state.domesticPolicy.land_law;
  const nonLandExpenditure = {
    civilAdministration: 1,
    maxHours: monthlyPolicyCost('max_hours_law', state.domesticPolicy.max_hours_law),
    workplaceSafety: monthlyPolicyCost('workplace_safety', state.domesticPolicy.workplace_safety),
    minimumWage: monthlyPolicyCost('min_wage', state.domesticPolicy.min_wage),
    education: monthlyPolicyCost('education_institutions', state.domesticPolicy.education_institutions),
    womensRights: monthlyPolicyCost('womens_rights', state.domesticPolicy.womens_rights),
    warMobilization: isCivilWar ? 3.5 : 0,
    military: ((state.military_spending ?? ECONOMIC_RULES.defaults.militarySpending) / 100) * (isCivilWar ? 8 : 3),
    debtInterest: currentDebt * ((isCivilWar ? 0.05 : 0.02) / 12),
  };
  const nonLandTotal = Object.values(nonLandExpenditure).reduce((sum, value) => sum + value, 0);
  const plannedLandCompensation = landLawLevel === 1 ? monthlyPolicyCost('land_law', landLawLevel) : 0;
  const openingCash = clamp(state.budget ?? ECONOMIC_RULES.defaults.budget, 0, ECONOMIC_RULES.fiscalBounds.cashMax);
  const landReformPaused = plannedLandCompensation > 0
    && openingCash + totalRevenue < nonLandTotal + plannedLandCompensation;
  const expenditure = { ...nonLandExpenditure, landCompensation: landReformPaused ? 0 : plannedLandCompensation, total: 0 };
  expenditure.total = Object.entries(expenditure)
    .filter(([key]) => key !== 'total')
    .reduce((sum, [, value]) => sum + value, 0);

  // Deficits consume cash before debt; a binding debt ceiling creates arrears.
  // Surpluses clear arrears, then split 40/60 between debt principal and cash.
  const budgetDelta = totalRevenue - expenditure.total;
  let cashUsedForDeficit = 0;
  let newBorrowing = 0;
  let newArrears = 0;
  let arrearsPaid = 0;
  let principalRepayment = 0;
  let cashRetained = 0;
  let nextBudget = openingCash;
  let nextDebt = currentDebt;
  let nextFiscalArrears = currentArrears;
  if (budgetDelta < 0) {
    const financingNeed = Math.abs(budgetDelta);
    cashUsedForDeficit = Math.min(openingCash, financingNeed);
    const borrowingNeed = financingNeed - cashUsedForDeficit;
    newBorrowing = Math.min(borrowingNeed, ECONOMIC_RULES.fiscalBounds.debtMax - currentDebt);
    newArrears = Math.max(0, borrowingNeed - newBorrowing);
    nextBudget = openingCash - cashUsedForDeficit;
    nextDebt = currentDebt + newBorrowing;
    nextFiscalArrears = clamp(currentArrears + newArrears, 0, ECONOMIC_RULES.fiscalBounds.arrearsMax);
  } else {
    arrearsPaid = Math.min(budgetDelta, currentArrears);
    const surplusAfterArrears = budgetDelta - arrearsPaid;
    principalRepayment = Math.min(surplusAfterArrears * 0.4, currentDebt);
    cashRetained = surplusAfterArrears - principalRepayment;
    nextBudget = clamp(openingCash + cashRetained, 0, ECONOMIC_RULES.fiscalBounds.cashMax);
    nextDebt = currentDebt - principalRepayment;
    nextFiscalArrears = currentArrears - arrearsPaid;
  }
  nextBudget = roundTo(nextBudget, 2);
  nextDebt = roundTo(nextDebt, 2);
  nextFiscalArrears = roundTo(nextFiscalArrears, 2);
  const financing = {
    openingCash,
    openingArrears: currentArrears,
    cashUsedForDeficit: roundTo(cashUsedForDeficit, 2),
    newBorrowing: roundTo(newBorrowing, 2),
    newArrears: roundTo(newArrears, 2),
    arrearsPaid: roundTo(arrearsPaid, 2),
    principalRepayment: roundTo(principalRepayment, 2),
    cashRetained: roundTo(cashRetained, 2),
  };

  const tradeFxYield = ((state.economy_growth ?? ECONOMIC_RULES.defaults.growth) - ECONOMIC_RULES.defaults.growth) * 1.5
    - (currentInflation - ECONOMIC_RULES.defaults.inflation) * 0.5
    + taxRates.tariff * 4
    + (tradeVolume - 1) * 2
    - (isCivilWar ? 2.5 : 0);
  const nextForeignExchange = roundTo(clamp((state.foreign_exchange ?? ECONOMIC_RULES.defaults.foreignExchange) + tradeFxYield, 0, 2500), 2);
  const armyLoyaltyFactor = ((state.military_spending ?? ECONOMIC_RULES.defaults.militarySpending) - ECONOMIC_RULES.defaults.militarySpending) * 0.12;
  const nextArmyLoyalty = clamp((state.stats.armyLoyalty ?? ECONOMIC_RULES.defaults.armyLoyalty) + armyLoyaltyFactor, 0, 100);

  const currentGrowth = state.economy_growth ?? ECONOMIC_RULES.defaults.growth;
  const { growth: growthInertia, inflation: inflationInertia, unemployment: unemploymentInertia } = ECONOMIC_RULES.indicatorInertia;
  const { min: minGrowth, max: maxGrowth } = ECONOMIC_RULES.growthBounds;
  const debtGrowthDrag = Math.max(0, (nextDebt - 1200) * 0.001);
  const arrearsGrowthDrag = nextFiscalArrears * 0.003;
  const targetGrowth = clamp(
    3.5 - taxRates.lower * 1.5 - taxRates.middle * 2 - taxRates.upper * 2.5
      - taxRates.tariff * 3 - taxRates.consumption * 3.5 - debtGrowthDrag
      - arrearsGrowthDrag - (isCivilWar ? 6 : 0),
    minGrowth,
    maxGrowth,
  );
  const nextGrowth = roundTo(clamp(currentGrowth + growthInertia * (targetGrowth - currentGrowth), minGrowth, maxGrowth), 2);

  const goldLossConfidence = Math.max(0, (700 - (state.gold_reserves ?? ECONOMIC_RULES.defaults.goldReserves)) * 0.006);
  const financingInflation = newBorrowing * 0.5 + newArrears * 0.9;
  const targetInflation = clamp(
    2.5 - taxRates.lower - taxRates.middle * 1.5 - taxRates.upper * 2
      + taxRates.tariff * 8 + taxRates.consumption * 6 + financingInflation
      + goldLossConfidence + (isCivilWar ? 8 : 0),
    ECONOMIC_RULES.inflationBounds.min,
    ECONOMIC_RULES.inflationBounds.max,
  );
  const nextInflation = roundTo(clamp(
    currentInflation + inflationInertia * (targetInflation - currentInflation),
    ECONOMIC_RULES.inflationBounds.min,
    ECONOMIC_RULES.inflationBounds.max,
  ), 2);

  const { mildBelow, mildDelta, severeBelow, severeDelta } = ECONOMIC_RULES.deflationUnemployment;
  const deflationUnemployment = currentInflation <= severeBelow ? severeDelta : currentInflation < mildBelow ? mildDelta : 0;
  const laborReformReduction = monthlyPolicyModifier('max_hours_law', state.domesticPolicy.max_hours_law, 'unemployment');
  const highDebtUnemploymentFactor = nextDebt > 1500 ? 1 : 0;
  const arrearsUnemploymentFactor = Math.min(4, nextFiscalArrears * 0.005);
  const targetUnemployment = clamp(
    12 - (nextGrowth - 2.5) * 0.4 + taxRates.lower + taxRates.middle * 1.5
      + taxRates.upper * 3 - taxRates.tariff * 1.5 + laborReformReduction
      + highDebtUnemploymentFactor + arrearsUnemploymentFactor
      + deflationUnemployment + (isCivilWar ? 4 : 0),
    0,
    100,
  );
  const nextUnemployment = roundTo(clamp(
    currentUnemployment + unemploymentInertia * (targetUnemployment - currentUnemployment),
    0,
    100,
  ), 2);
  const nextEconomicOutputIndex = roundTo(clamp(
    currentOutputIndex * (1 + nextGrowth / 100 / 12),
    ECONOMIC_RULES.outputBounds.min,
    ECONOMIC_RULES.outputBounds.max,
  ), 2);

  return {
    isCivilWar,
    taxRates,
    taxBaseFactors,
    taxBases,
    collectionEfficiency,
    revenue: {
      incomeTax: roundTo(incomeTax, 4),
      tariff: roundTo(tariff, 4),
      consumptionTax: roundTo(consumptionTax, 4),
      total: roundTo(totalRevenue, 4),
    },
    expenditure,
    budgetDelta: roundTo(budgetDelta, 4),
    financing,
    nextBudget,
    nextDebt,
    nextFiscalArrears,
    tradeFxYield,
    nextForeignExchange,
    armyLoyaltyFactor,
    nextArmyLoyalty,
    nextGrowth,
    nextInflation,
    nextUnemployment,
    nextEconomicOutputIndex,
    landLawLevel,
    landReformPaused,
  };
};
