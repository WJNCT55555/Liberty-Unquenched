export interface IncomeTaxAdjustment {
  workingClassSupport: number;
  middleClassSupport: number;
  upperClassSupport: number;
  faistasDissent: number;
  puristasDissent: number;
}

export interface TariffConsumptionAdjustment {
  workingClassSupport: number;
  faistasDissent: number;
  puristasDissent: number;
  internationalFriction: number;
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
  let faistasDissent = 0;
  let puristasDissent = 0;

  if (deltaLower < 0) {
    workingClassSupport += Math.abs(deltaLower) * 1.5;
  } else if (deltaLower > 0) {
    workingClassSupport -= deltaLower * 2;
    faistasDissent += deltaLower;
    puristasDissent += deltaLower;
  }

  if (deltaMiddle > 0) {
    middleClassSupport -= deltaMiddle;
  } else if (deltaMiddle < 0) {
    middleClassSupport += Math.abs(deltaMiddle) * 0.8;
  }

  if (deltaUpper > 0) {
    upperClassSupport -= deltaUpper * 1.5;
    faistasDissent -= deltaUpper * 0.4;
    puristasDissent -= deltaUpper * 0.4;
  } else if (deltaUpper < 0) {
    faistasDissent += Math.abs(deltaUpper) * 1.5;
    puristasDissent += Math.abs(deltaUpper) * 1.5;
    upperClassSupport += Math.abs(deltaUpper) * 0.3;
  }

  return { workingClassSupport, middleClassSupport, upperClassSupport, faistasDissent, puristasDissent };
};

/** Pure consequences of staged tariff and consumption-tax changes. */
export const calculateTariffConsumptionAdjustment = (
  deltaTariff: number,
  deltaConsumption: number,
): TariffConsumptionAdjustment => {
  let workingClassSupport = 0;
  let faistasDissent = 0;
  let puristasDissent = 0;
  let internationalFriction = 0;

  if (deltaTariff > 0) {
    internationalFriction -= deltaTariff * 0.5;
  } else if (deltaTariff < 0) {
    internationalFriction += Math.abs(deltaTariff) * 0.3;
  }

  if (deltaConsumption < 0) {
    workingClassSupport += Math.abs(deltaConsumption);
    faistasDissent -= Math.abs(deltaConsumption) * 0.5;
    puristasDissent -= Math.abs(deltaConsumption) * 0.5;
  } else if (deltaConsumption > 0) {
    workingClassSupport -= deltaConsumption * 1.5;
    faistasDissent += deltaConsumption * 0.8;
    puristasDissent += deltaConsumption * 0.8;
  }

  return { workingClassSupport, faistasDissent, puristasDissent, internationalFriction };
};
