import { Faction } from './types';

export const modifyFactionInfluence = (
  factions: Record<Faction, { influence: number; dissent: number }>,
  targetFaction: Faction,
  amount: number
): Record<Faction, { influence: number; dissent: number }> => {
  const newFactions = JSON.parse(JSON.stringify(factions)) as Record<Faction, { influence: number; dissent: number }>;
  
  let actualAmount = amount;
  if (newFactions[targetFaction].influence + amount > 100) {
    actualAmount = 100 - newFactions[targetFaction].influence;
  } else if (newFactions[targetFaction].influence + amount < 0) {
    actualAmount = -newFactions[targetFaction].influence;
  }
  
  if (actualAmount === 0) return newFactions;

  newFactions[targetFaction].influence += actualAmount;
  
  const otherFactions = (Object.keys(newFactions) as Faction[]).filter(f => f !== targetFaction);
  // Sort initially by influence descending so we start taking from the largest
  otherFactions.sort((a, b) => newFactions[b].influence - newFactions[a].influence);
  
  let pointsToDistribute = Math.abs(actualAmount);
  const isAddingToTarget = actualAmount > 0;
  let index = 0;
  
  while (pointsToDistribute > 0) {
    if (isAddingToTarget) {
      // Target gained influence, others must lose.
      // Distribute loss evenly (round-robin) among factions that have > 0 influence.
      let found = false;
      for (let i = 0; i < otherFactions.length; i++) {
        const faction = otherFactions[(index + i) % otherFactions.length];
        if (newFactions[faction].influence > 0) {
          newFactions[faction].influence -= 1;
          pointsToDistribute -= 1;
          index = (index + i + 1) % otherFactions.length;
          found = true;
          break;
        }
      }
      if (!found) break; // Should not happen if sum is 100
    } else {
      // Target lost influence, others must gain.
      // Distribute gain evenly (round-robin).
      const faction = otherFactions[index % otherFactions.length];
      newFactions[faction].influence += 1;
      pointsToDistribute -= 1;
      index = (index + 1) % otherFactions.length;
    }
  }
  
  return newFactions;
};
