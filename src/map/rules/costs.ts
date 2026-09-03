import type { Army, ArmyComposition } from '../types_map';

export interface ResourceCost {
  supplies: number;
  ic: number;
  manpower: number;
}

export interface ArmyCost extends ResourceCost {
  tankReserve: number;
}

/**
 * Canonical construction costs.  Fortress and ammunition-factory entries are
 * keyed by the level being built; the other structures can only be built once.
 */
export const BUILDING_COSTS = {
  barracks: { supplies: 120, ic: 80, manpower: 0 },
  fortress: {
    1: { supplies: 150, ic: 100, manpower: 0 },
    2: { supplies: 250, ic: 180, manpower: 0 },
    3: { supplies: 400, ic: 280, manpower: 0 },
  },
  recruitingOffice: { supplies: 100, ic: 60, manpower: 30 },
  ammoFactory: {
    1: { supplies: 200, ic: 150, manpower: 0 },
    2: { supplies: 300, ic: 220, manpower: 0 },
  },
} as const;

export type BuildingType = keyof typeof BUILDING_COSTS;

const ZERO_BUILDING_COST: ResourceCost = { supplies: 0, ic: 0, manpower: 0 };

/** Return the cost for the requested building type and next level. */
export function getBuildingCost(buildingType: string, level = 1): ResourceCost {
  let cost: ResourceCost;
  switch (buildingType) {
    case 'barracks':
      cost = BUILDING_COSTS.barracks;
      break;
    case 'fortress':
      cost = level === 1 ? BUILDING_COSTS.fortress[1] : level === 2 ? BUILDING_COSTS.fortress[2] : BUILDING_COSTS.fortress[3];
      break;
    case 'recruitingOffice':
      cost = BUILDING_COSTS.recruitingOffice;
      break;
    case 'ammoFactory':
      cost = level === 1 ? BUILDING_COSTS.ammoFactory[1] : BUILDING_COSTS.ammoFactory[2];
      break;
    default:
      cost = ZERO_BUILDING_COST;
  }

  // Consumers only read the values today; return a copy so a future caller
  // cannot accidentally mutate the canonical table.
  return { ...cost };
}

/** Cost of mobilizing a new army with the supplied composition. */
export function armyRecruitCost(composition: ArmyComposition): ArmyCost {
  const { infantry, artillery, tanks } = composition;
  return {
    manpower: infantry + artillery + tanks,
    supplies: Math.floor(infantry * 0.03 + artillery * 0.06 + tanks * 1.2),
    ic: Math.floor(artillery * 0.04 + tanks * 0.08),
    tankReserve: tanks,
  };
}

/** Maximum 50% of each lost unit type that one reinforcement action may restore. */
export function reinforceTarget(army: Pick<Army, 'composition' | 'designedComposition'>): ArmyComposition {
  const designed = army.designedComposition || army.composition;
  return {
    infantry: Math.max(0, Math.floor((designed.infantry - army.composition.infantry) * 0.5)),
    artillery: Math.max(0, Math.floor((designed.artillery - army.composition.artillery) * 0.5)),
    tanks: Math.max(0, Math.floor((designed.tanks - army.composition.tanks) * 0.5)),
  };
}

/** Cost of restoring the supplied reinforcement composition. */
export function reinforceCost(composition: ArmyComposition): ArmyCost {
  return armyRecruitCost(composition);
}
