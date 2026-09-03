export interface IncomeTaxAdjustment {
  budgetChange: number;
  workingClassSupport: number;
  middleClassSupport: number;
  upperClassSupport: number;
  faistasDissent: number;
  puristasDissent: number;
}

export interface TariffConsumptionAdjustment {
  budgetChange: number;
  workingClassSupport: number;
  faistasDissent: number;
  puristasDissent: number;
  internationalFriction: number;
  foreignExchangeGain: number;
}

/** Pure consequences of staged income-tax changes. Deltas are percentage points. */
export const calculateIncomeTaxAdjustment = (
  deltaLower: number,
  deltaMiddle: number,
  deltaUpper: number,
): IncomeTaxAdjustment => {
  let workingClassSupport = 0;
  let middleClassSupport = 0;
  let upperClassSupport = 0;
  let budgetChange = 0;
  let faistasDissent = 0;
  let puristasDissent = 0;

  if (deltaLower < 0) {
    workingClassSupport += Math.abs(deltaLower) * 1.5;
    budgetChange -= Math.abs(deltaLower) * 0.15;
  } else if (deltaLower > 0) {
    workingClassSupport -= deltaLower * 2;
    faistasDissent += deltaLower;
    puristasDissent += deltaLower;
    budgetChange += deltaLower * 0.2;
  }

  if (deltaMiddle > 0) {
    middleClassSupport -= deltaMiddle;
    budgetChange += deltaMiddle * 0.15;
  } else if (deltaMiddle < 0) {
    middleClassSupport += Math.abs(deltaMiddle) * 0.8;
    budgetChange -= Math.abs(deltaMiddle) * 0.1;
  }

  if (deltaUpper > 0) {
    upperClassSupport -= deltaUpper * 1.5;
    budgetChange += deltaUpper * 0.25;
    faistasDissent -= deltaUpper * 0.4;
    puristasDissent -= deltaUpper * 0.4;
  } else if (deltaUpper < 0) {
    faistasDissent += Math.abs(deltaUpper) * 1.5;
    puristasDissent += Math.abs(deltaUpper) * 1.5;
    upperClassSupport += Math.abs(deltaUpper) * 0.3;
    budgetChange -= Math.abs(deltaUpper) * 0.2;
  }

  return { budgetChange, workingClassSupport, middleClassSupport, upperClassSupport, faistasDissent, puristasDissent };
};

/** Pure consequences of staged tariff and consumption-tax changes. */
export const calculateTariffConsumptionAdjustment = (
  deltaTariff: number,
  deltaConsumption: number,
): TariffConsumptionAdjustment => {
  let budgetChange = 0;
  let workingClassSupport = 0;
  let faistasDissent = 0;
  let puristasDissent = 0;
  let internationalFriction = 0;
  let foreignExchangeGain = 0;

  if (deltaTariff > 0) {
    budgetChange += deltaTariff * 0.15;
    internationalFriction -= deltaTariff * 0.5;
    foreignExchangeGain += deltaTariff;
  } else if (deltaTariff < 0) {
    budgetChange -= Math.abs(deltaTariff) * 0.12;
    internationalFriction += Math.abs(deltaTariff) * 0.3;
  }

  if (deltaConsumption < 0) {
    workingClassSupport += Math.abs(deltaConsumption);
    budgetChange -= Math.abs(deltaConsumption) * 0.18;
    faistasDissent -= Math.abs(deltaConsumption) * 0.5;
    puristasDissent -= Math.abs(deltaConsumption) * 0.5;
  } else if (deltaConsumption > 0) {
    workingClassSupport -= deltaConsumption * 1.5;
    budgetChange += deltaConsumption * 0.22;
    faistasDissent += deltaConsumption * 0.8;
    puristasDissent += deltaConsumption * 0.8;
  }

  return { budgetChange, workingClassSupport, faistasDissent, puristasDissent, internationalFriction, foreignExchangeGain };
};
