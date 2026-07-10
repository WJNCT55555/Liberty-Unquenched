import { Faction } from './types';

export { adjustClassSupport, adjustSingleClassSupport, collectClassSupportAdjustments } from './utils/classSupport';
export * from './utils/eventTrigger';
export type { ClassPoliticalForce, ClassSupportAdjustment } from './utils/classSupport';

type FactionState = Record<Faction, { influence: number; dissent: number }>;
export type FactionInfluenceAdjustment = {
  faction: Faction;
  delta: number;
};

let activeFactionInfluenceTrace: FactionInfluenceAdjustment[] | null = null;

export function collectFactionInfluenceAdjustments<T>(callback: () => T): {
  result: T;
  adjustments: FactionInfluenceAdjustment[];
} {
  const previousTrace = activeFactionInfluenceTrace;
  const adjustments: FactionInfluenceAdjustment[] = [];
  activeFactionInfluenceTrace = adjustments;

  try {
    return {
      result: callback(),
      adjustments
    };
  } finally {
    activeFactionInfluenceTrace = previousTrace;
  }
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export function isFactionActiveForDissent(factions: FactionState, faction: Faction): boolean {
  return faction !== 'Jabalistas' || (factions.Jabalistas?.influence ?? 0) > 0;
}

export function getOverallFactionDissent(factions: FactionState): number {
  const activeFactions = (Object.keys(factions) as Faction[])
    .filter((faction) => isFactionActiveForDissent(factions, faction));
  const totalInfluence = activeFactions.reduce((sum, faction) => sum + (factions[faction]?.influence ?? 0), 0);

  if (totalInfluence <= 0) return 0;

  return activeFactions.reduce(
    (sum, faction) => sum + ((factions[faction]?.influence ?? 0) * (factions[faction]?.dissent ?? 0)),
    0
  ) / totalInfluence;
}

export function getDissentMultiplier(factions: FactionState): number {
  return 1 - (getOverallFactionDissent(factions) / 100);
}

export function adjustFactionDissent(
  factions: FactionState,
  targetFaction: Faction,
  delta: number
): FactionState {
  const newFactions = JSON.parse(JSON.stringify(factions)) as FactionState;
  if (!newFactions[targetFaction]) return newFactions;
  newFactions[targetFaction].dissent = clampPercent((newFactions[targetFaction].dissent ?? 0) + delta);
  return newFactions;
}

export function adjustFactionDissents(
  factions: FactionState,
  deltas: Partial<Record<Faction, number>>
): FactionState {
  const newFactions = JSON.parse(JSON.stringify(factions)) as FactionState;

  (Object.keys(deltas) as Faction[]).forEach((faction) => {
    if (!newFactions[faction]) return;
    newFactions[faction].dissent = clampPercent((newFactions[faction].dissent ?? 0) + (deltas[faction] ?? 0));
  });

  return newFactions;
}

export function adjustAllActiveFactionDissent(
  factions: FactionState,
  delta: number
): FactionState {
  const newFactions = JSON.parse(JSON.stringify(factions)) as FactionState;

  (Object.keys(newFactions) as Faction[])
    .filter((faction) => isFactionActiveForDissent(newFactions, faction))
    .forEach((faction) => {
      newFactions[faction].dissent = clampPercent((newFactions[faction].dissent ?? 0) + delta);
    });

  return newFactions;
}

export function adjustFactionInfluence(
  factions: Record<Faction, { influence: number; dissent: number }>,
  targetFaction: Faction,
  delta: number
): Record<Faction, { influence: number; dissent: number }> {
  const newFactions = JSON.parse(JSON.stringify(factions)) as Record<Faction, { influence: number; dissent: number }>;
  let intendedTargetDelta = 0;
  
  if (delta > 0) {
    let remainingDelta = delta;
    
    if (newFactions[targetFaction].influence + remainingDelta > 100) {
      remainingDelta = 100 - newFactions[targetFaction].influence;
    }

    let actualIncrease = remainingDelta;

    while (remainingDelta > 0.001) {
      const otherFactions = (Object.keys(newFactions) as Faction[]).filter(f => f !== targetFaction && newFactions[f].influence > 0);
      
      let S = 0;
      for (const f of otherFactions) {
        S += newFactions[f].influence;
      }
      
      if (S <= 0) {
        actualIncrease -= remainingDelta;
        break;
      }
      
      let nextRemainingDelta = 0;
      for (const f of otherFactions) {
        const deduction = remainingDelta * (newFactions[f].influence / S);
        if (newFactions[f].influence < deduction) {
          nextRemainingDelta += (deduction - newFactions[f].influence);
          newFactions[f].influence = 0;
        } else {
          newFactions[f].influence -= deduction;
        }
      }
      remainingDelta = nextRemainingDelta;
    }
    
    newFactions[targetFaction].influence += actualIncrease;
    intendedTargetDelta = actualIncrease;
  } else if (delta < 0) {
    let remainingDelta = -delta;
    
    if (newFactions[targetFaction].influence - remainingDelta < 0) {
      remainingDelta = newFactions[targetFaction].influence;
    }
    
    let actualDecrease = remainingDelta;
    
    const otherFactions = (Object.keys(newFactions) as Faction[]).filter(f => f !== targetFaction);
    let S = 0;
    for (const f of otherFactions) {
      S += newFactions[f].influence;
    }
    
    if (S <= 0) {
      const equalShare = remainingDelta / otherFactions.length;
      for (const f of otherFactions) {
        newFactions[f].influence += equalShare;
      }
    } else {
      for (const f of otherFactions) {
        const addition = remainingDelta * (newFactions[f].influence / S);
        newFactions[f].influence += addition;
      }
    }
    
    newFactions[targetFaction].influence -= actualDecrease;
    intendedTargetDelta = -actualDecrease;
  }
  
  // Round to integers
  let total = 0;
  for (const f in newFactions) {
    newFactions[f as Faction].influence = Math.round(newFactions[f as Faction].influence);
    total += newFactions[f as Faction].influence;
  }
  
  // Fix rounding errors
  let diff = 100 - total;
  if (diff !== 0) {
    newFactions[targetFaction].influence += diff;
    if (newFactions[targetFaction].influence < 0) {
      newFactions[targetFaction].influence -= diff;
      let largest = targetFaction;
      let maxInf = -1;
      for (const f in newFactions) {
        if (newFactions[f as Faction].influence > maxInf) {
          maxInf = newFactions[f as Faction].influence;
          largest = f as Faction;
        }
      }
      newFactions[largest].influence += diff;
    }
  }

  if (activeFactionInfluenceTrace && Math.abs(intendedTargetDelta) >= 0.005) {
    activeFactionInfluenceTrace.push({
      faction: targetFaction,
      delta: intendedTargetDelta
    });
  }

  return newFactions;
}
