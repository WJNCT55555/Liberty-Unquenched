import { Party, SocialClass } from '../types';

export type ClassPoliticalForce = 'CNT_FAI' | Exclude<Party, 'PRRevS'>;
export type ClassSupportAdjustment = {
  socialClass: SocialClass;
  force: ClassPoliticalForce;
  delta: number;
};

let activeClassSupportTrace: ClassSupportAdjustment[] | null = null;

export function collectClassSupportAdjustments<T>(callback: () => T): {
  result: T;
  adjustments: ClassSupportAdjustment[];
} {
  const previousTrace = activeClassSupportTrace;
  const adjustments: ClassSupportAdjustment[] = [];
  activeClassSupportTrace = adjustments;

  try {
    return {
      result: callback(),
      adjustments
    };
  } finally {
    activeClassSupportTrace = previousTrace;
  }
}

/**
 * Adjusts the internal political alignment of a single social class with zero-sum normalization (sum remains 100%).
 * The algorithm mimics adjustFactionInfluence to ensure stability, non-negative values, and no rounding errors.
 *
 * @param support The original political support Record for this social class.
 * @param targetForce The political force to adjust (e.g. 'CNT_FAI' or a specific Party).
 * @param delta The value to adjust by (positive or negative).
 * @returns The new adjusted and normalized support Record.
 */
export function adjustSingleClassSupport(
  support: Record<ClassPoliticalForce, number>,
  targetForce: ClassPoliticalForce,
  delta: number
): Record<ClassPoliticalForce, number> {
  const newSupport = JSON.parse(JSON.stringify(support)) as Record<ClassPoliticalForce, number>;
  const keys = Object.keys(newSupport) as ClassPoliticalForce[];

  if (!keys.includes(targetForce)) {
    return newSupport;
  }

  if (delta > 0) {
    let remainingDelta = delta;
    
    // Cap the increase so that the target support value does not exceed 100%
    if ((newSupport[targetForce] || 0) + remainingDelta > 100) {
      remainingDelta = 100 - (newSupport[targetForce] || 0);
    }

    let actualIncrease = remainingDelta;

    // Deduct from other forces proportionally
    while (remainingDelta > 0.001) {
      const otherForces = keys.filter(f => f !== targetForce && (newSupport[f] || 0) > 0);
      
      let S = 0;
      for (const f of otherForces) {
        S += newSupport[f] || 0;
      }
      
      if (S <= 0) {
        actualIncrease -= remainingDelta;
        break;
      }
      
      let nextRemainingDelta = 0;
      for (const f of otherForces) {
        const deduction = remainingDelta * ((newSupport[f] || 0) / S);
        if ((newSupport[f] || 0) < deduction) {
          nextRemainingDelta += (deduction - (newSupport[f] || 0));
          newSupport[f] = 0;
        } else {
          newSupport[f] = (newSupport[f] || 0) - deduction;
        }
      }
      remainingDelta = nextRemainingDelta;
    }
    
    newSupport[targetForce] = (newSupport[targetForce] || 0) + actualIncrease;
  } else if (delta < 0) {
    let remainingDelta = -delta;
    
    // Cap the decrease so that the target support value does not go below 0%
    if ((newSupport[targetForce] || 0) - remainingDelta < 0) {
      remainingDelta = newSupport[targetForce] || 0;
    }
    
    const actualDecrease = remainingDelta;
    
    const otherForces = keys.filter(f => f !== targetForce);
    let S = 0;
    for (const f of otherForces) {
      S += newSupport[f] || 0;
    }
    
    if (S <= 0) {
      // If all other forces are at 0, distribute the increase equally
      const equalShare = remainingDelta / otherForces.length;
      for (const f of otherForces) {
        newSupport[f] = (newSupport[f] || 0) + equalShare;
      }
    } else {
      // Distribute the increase proportionally based on existing support
      for (const f of otherForces) {
        const addition = remainingDelta * ((newSupport[f] || 0) / S);
        newSupport[f] = (newSupport[f] || 0) + addition;
      }
    }
    
    newSupport[targetForce] = (newSupport[targetForce] || 0) - actualDecrease;
  }
  
  // Round to 4 decimal places
  let total = 0;
  for (const f of keys) {
    newSupport[f] = parseFloat(Number(newSupport[f] || 0).toFixed(4));
    total += newSupport[f];
  }
  
  // Fix rounding errors to ensure the sum equals exactly 100
  const diff = parseFloat((100 - total).toFixed(4));
  if (Math.abs(diff) > 0.0001) {
    newSupport[targetForce] = parseFloat(((newSupport[targetForce] || 0) + diff).toFixed(4));
    if ((newSupport[targetForce] || 0) < 0) {
      newSupport[targetForce] = parseFloat(((newSupport[targetForce] || 0) - diff).toFixed(4));
      let largest = targetForce;
      let maxSupport = -1;
      for (const f of keys) {
        if ((newSupport[f] || 0) > maxSupport) {
          maxSupport = newSupport[f] || 0;
          largest = f;
        }
      }
      newSupport[largest] = parseFloat(((newSupport[largest] || 0) + diff).toFixed(4));
    }
  }

  return newSupport;
}

/**
 * Adjusts political support for a specified social class in the game state,
 * performs zero-sum normalization, and returns a new classes state object.
 *
 * @param classes The entire classes Record from the game state.
 * @param targetClass The social class to adjust (e.g. 'Obreros').
 * @param targetForce The political force to adjust (e.g. 'CNT_FAI' or a specific Party).
 * @param delta The value to adjust by (positive or negative).
 * @returns The updated new classes Record.
 */
export function adjustClassSupport(
  classes: Record<SocialClass, { support: Record<ClassPoliticalForce, number> }>,
  targetClass: SocialClass,
  targetForce: ClassPoliticalForce,
  delta: number
): Record<SocialClass, { support: Record<ClassPoliticalForce, number> }> {
  const newClasses = JSON.parse(JSON.stringify(classes)) as Record<SocialClass, { support: Record<ClassPoliticalForce, number> }>;
  
  if (newClasses[targetClass]) {
    const beforeTargetSupport = newClasses[targetClass].support[targetForce] || 0;
    const adjustedSupport = adjustSingleClassSupport(
      newClasses[targetClass].support,
      targetForce,
      delta
    );
    const actualDelta = (adjustedSupport[targetForce] || 0) - beforeTargetSupport;
    newClasses[targetClass].support = adjustedSupport;

    if (activeClassSupportTrace && Math.abs(actualDelta) >= 0.005) {
      activeClassSupportTrace.push({
        socialClass: targetClass,
        force: targetForce,
        delta: actualDelta
      });
    }
  }
  
  return newClasses;
}
