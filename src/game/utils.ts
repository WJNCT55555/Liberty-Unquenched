import { Faction } from './types';

export function adjustFactionInfluence(
  factions: Record<Faction, { influence: number; dissent: number }>,
  targetFaction: Faction,
  delta: number
): Record<Faction, { influence: number; dissent: number }> {
  const newFactions = JSON.parse(JSON.stringify(factions)) as Record<Faction, { influence: number; dissent: number }>;
  
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

  return newFactions;
}
