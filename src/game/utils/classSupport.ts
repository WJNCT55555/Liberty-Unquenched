import { Party, SocialClass } from '../types';
import { adjustZeroSumShare } from './zeroSumShare';

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
  return adjustZeroSumShare(support, targetForce, delta, 100);
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
