/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, MapFaction as Faction, Province, Army } from '../types_map';
import { PROVINCE_ADJACENCY, isPortugalProvince } from '../map_constants';

export interface AiAction {
  type: 'BUILD' | 'REINFORCE' | 'RECRUIT' | 'MOVE' | 'END_TURN';
  payload?: any;
}

/**
 * Pure algorithmic AI decision engine for the Spanish Civil War game.
 * Operates entirely on clientside state without calling any external APIs.
 * 
 * Logic flow:
 * 1. Simulates the resource budget (Manpower, Supplies, Industrial Capacity, and Command Points).
 * 2. Decides on division level reinforcements (Reinforce damaged armies with passive scaling).
 * 3. Builds critical structures:
 *    - Fortresses in vulnerable frontline zones to lock down bottlenecks.
 *    - Ammunition Factories in urban environments for sustainable supplies.
 *    - Recruiting Offices in high strategic value hubs (Strategic Value >= 4).
 *    - Barracks for expansion of troop support capabilities and supply limit capacity.
 * 4. Mobilizes new forces near active frontlines if resources permit.
 * 5. Spend limited Command Points (CP) to maneuver armies:
 *    - Priority 1: Expand territory by taking adjacent undefended enemy sectors.
 *    - Priority 2: Engage and destroy weaker enemy armies with safe threshold ratios.
 *    - Priority 3: Re-deploy inactive regiments from rear guard bases to active frontlines.
 * 6. Finishes up by executing an End Turn phase.
 */
export function calculateAiMoves(
  state: GameState,
  aiFaction: Faction,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal'
): AiAction[] {
  const actions: AiAction[] = [];
  
  // Track visual planning resources to avoid over-purchasing during planning phase
  let simResources = { ...state.resources[aiFaction] };
  let simManpower = simResources.manpower;
  let simSupplies = simResources.supplies;
  let simIC = simResources.industrialCapacity;
  let simCP = simResources.commandPoints;
  let simTankReserve = simResources.tankReserve || 0;

  // Helper: Frontline checking (does this province share borders with an enemy or neutral?)
  const isFrontline = (pId: string) => {
    const neighbors = PROVINCE_ADJACENCY[pId] || [];
    return neighbors.some(nId => {
      const neighborProv = state.provinces[nId];
      return neighborProv && neighborProv.owner !== aiFaction;
    });
  };

  const myProvinces = Object.values(state.provinces).filter(p => p.owner === aiFaction);
  const myArmies = state.armies.filter(a => a.faction === aiFaction);

  // Set attack thresholds depending on relative game difficulty
  let attackThreshold = 1.1; // Default "Normal"
  if (difficulty === 'easy') {
    attackThreshold = 1.8; // Extremely passive, only attacks when victory is guaranteed
  } else if (difficulty === 'hard') {
    attackThreshold = 0.85; // Highly aggressive tactical risk taker
  }

  // ==========================================
  // PHASE 1: REINFORCE PLANNING (Personnel Refills)
  // ==========================================
  // It is highly cost-effective to restore veteran divisions instead of hiring new green recruits.
  // Sort damaged divisions starting with the weakest to maximize unit survival.
  if (difficulty !== 'easy') {
    const damagedArmies = [...myArmies]
      .filter(a => a.manpower < a.maxManpower)
      .sort((a, b) => (a.manpower / a.maxManpower) - (b.manpower / b.maxManpower));

    for (const army of damagedArmies) {
      const designedComp = army.designedComposition || army.composition;
      const infLoss = Math.max(0, designedComp.infantry - army.composition.infantry);
      const artLoss = Math.max(0, designedComp.artillery - army.composition.artillery);
      const tnkLoss = Math.max(0, designedComp.tanks - army.composition.tanks);

      // Max 50% replenishment target
      const infRestored = Math.floor(infLoss * 0.5);
      const artRestored = Math.floor(artLoss * 0.5);
      const tnkRestored = Math.floor(tnkLoss * 0.5);
      const totalTargetRestored = infRestored + artRestored + tnkRestored;

      if (totalTargetRestored > 0) {
        const costManpower = totalTargetRestored;
        const costSupplies = Math.floor(infRestored * 0.03 + artRestored * 0.06 + tnkRestored * 1.2);
        const costIC = Math.floor(artRestored * 0.04 + tnkRestored * 0.08);
        const costTankReserve = tnkRestored;

        if (simManpower >= costManpower && simSupplies >= costSupplies && simIC >= costIC && simTankReserve >= costTankReserve) {
          simManpower -= costManpower;
          simSupplies -= costSupplies;
          simIC -= costIC;
          simTankReserve -= costTankReserve;

          actions.push({
            type: 'REINFORCE',
            payload: { armyId: army.id }
          });
        }
      }
    }
  }

  // ==========================================
  // PHASE 2: CONSTRUCTION PLANNING (Buildings)
  // ==========================================
  // Hard and Normal AI spend dynamic surplus reserves on long-term infrastructure. Easy mode skips building upgrades.
  if (difficulty !== 'easy') {
    for (const province of myProvinces) {
      const buildings = province.buildings || { barracks: 0, fortress: 0, recruitingOffice: 0, ammoFactory: 0 };

      // 1. Fortresses: Core choke point defense
      if (isFrontline(province.id) && (buildings.fortress || 0) < (difficulty === 'hard' ? 3 : 2)) {
        const nextLevel = (buildings.fortress || 0) + 1;
        let costSupplies = 150;
        let costIC = 100;
        if (nextLevel === 2) { costSupplies = 250; costIC = 180; }
        else if (nextLevel === 3) { costSupplies = 400; costIC = 280; }

        if (simSupplies >= costSupplies && simIC >= costIC) {
          simSupplies -= costSupplies;
          simIC -= costIC;
          actions.push({
            type: 'BUILD',
            payload: { provinceId: province.id, buildingType: 'fortress' }
          });
          continue; // Cap construction to one building per province in a single planning cycle
        }
      }

      // 2. Ammunition Factories: Urban logistical expansion
      if (province.terrain === 'urban' && (buildings.ammoFactory || 0) < (difficulty === 'hard' ? 2 : 1)) {
        const nextLevel = (buildings.ammoFactory || 0) + 1;
        const costSupplies = nextLevel === 1 ? 200 : 300;
        const costIC = nextLevel === 1 ? 150 : 220;

        if (simSupplies >= costSupplies && simIC >= costIC) {
          simSupplies -= costSupplies;
          simIC -= costIC;
          actions.push({
            type: 'BUILD',
            payload: { provinceId: province.id, buildingType: 'ammoFactory' }
          });
          continue;
        }
      }

      // 3. Recruiting Offices: Focus on high strategic rate territories (strategic value >= 4)
      if (province.strategicValue >= 4 && (buildings.recruitingOffice || 0) < 1) {
        const costSupplies = 100;
        const costIC = 60;
        const costManpower = 30;

        if (simSupplies >= costSupplies && simIC >= costIC && simManpower >= costManpower) {
          simSupplies -= costSupplies;
          simIC -= costIC;
          simManpower -= costManpower;
          actions.push({
            type: 'BUILD',
            payload: { provinceId: province.id, buildingType: 'recruitingOffice' }
          });
          continue;
        }
      }

      // 4. Barracks: Expand garrison structures
      if ((buildings.barracks || 0) < 1) {
        const costSupplies = 120;
        const costIC = 80;

        if (simSupplies >= costSupplies && simIC >= costIC) {
          simSupplies -= costSupplies;
          simIC -= costIC;
          actions.push({
            type: 'BUILD',
            payload: { provinceId: province.id, buildingType: 'barracks' }
          });
          continue;
        }
      }
    }
  }

  // ==========================================
  // PHASE 3: RECRUITMENT PLANNING (New Corps)
  // ==========================================
  // Hire standard cohorts in frontlines with Recruiting Offices.
  if (difficulty !== 'easy') {
    const activeRecruiters = myProvinces.filter(
      p => p.buildings?.recruitingOffice && p.buildings.recruitingOffice > 0 && isFrontline(p.id)
    );

    for (const province of activeRecruiters) {
      // Scale-up composition of divisions according to game difficulty
      let comp = { infantry: 1000, artillery: 0, tanks: 0 };
      if (difficulty === 'normal') {
        comp = { infantry: 1500, artillery: 200, tanks: 50 };
      } else if (difficulty === 'hard') {
        comp = { infantry: 2000, artillery: 450, tanks: 150 };
      }

      const totalMobilized = comp.infantry + comp.artillery + comp.tanks;
      const costManpower = totalMobilized;
      const costSupplies = Math.floor(comp.infantry * 0.03 + comp.artillery * 0.06 + comp.tanks * 1.2);
      const costIC = Math.floor(comp.artillery * 0.04 + comp.tanks * 0.08);
      const costTankReserve = comp.tanks;

      if (
        simManpower >= costManpower && 
        simSupplies >= costSupplies && 
        simIC >= costIC && 
        simTankReserve >= costTankReserve
      ) {
        simManpower -= costManpower;
        simSupplies -= costSupplies;
        simIC -= costIC;
        simTankReserve -= costTankReserve;

        actions.push({
          type: 'RECRUIT',
          payload: { provinceId: province.id, comp }
        });
      }
    }
  }

  // ==========================================
  // PHASE 4: MOVEMENT & OFFENSIVE PLANNING
  // ==========================================
  // We model a localized state layout to predict valid moves without invalidating remaining moves or CPs.
  const simArmies = myArmies.map(a => ({ ...a }));
  const simProvinceOwners: { [key: string]: Faction } = {};
  myProvinces.forEach(p => { simProvinceOwners[p.id] = aiFaction; });

  while (simCP > 0) {
    let bestMove: {
      armyId: string;
      fromId: string;
      toId: string;
      score: number;
    } | null = null;

    // Check all possible moves for active mobile units
    for (const army of simArmies) {
      if (army.movesLeft <= 0) continue;

      const adj = PROVINCE_ADJACENCY[army.provinceId] || [];
      for (const targetId of adj) {
        if (
          (army.faction === Faction.REPUBLICAN || army.faction === Faction.NATIONALIST) &&
          isPortugalProvince(targetId)
        ) {
          continue;
        }

        const toProvince = state.provinces[targetId];
        if (!toProvince) continue;

        // Fetch enemies standing on target province
        const enemyArmies = state.armies.filter(
          a => a.provinceId === targetId && a.faction !== aiFaction
        );
        const enemyPower = enemyArmies.reduce((sum, a) => sum + a.manpower, 0);
        const isCombat = enemyPower > 0;
        const currentOwner = simProvinceOwners[targetId] || toProvince.owner;

        let score = 0;

        if (!isCombat) {
          // 1. Invade vacant enemy territory (Absolutely free expansion of industry!)
          if (currentOwner !== aiFaction) {
            score = 1500 + toProvince.strategicValue * 150 + toProvince.industry * 100;
          } else {
            // 2. Reposition within friendly territory (Maneuver away from safe zones into frontline defense)
            const isCurrentlyFrontline = isFrontline(army.provinceId);
            const isTargetFrontline = isFrontline(targetId);

            if (isTargetFrontline && !isCurrentlyFrontline) {
              score = 300 + toProvince.strategicValue * 20; // Support endangered front
            } else {
              score = 10; // Keep waste to a minimum
            }
          }
        } else {
          // 3. Engaging enemy divisions in combat
          const powerRatio = army.manpower / (enemyPower || 1);

          if (powerRatio >= attackThreshold) {
            score = 1000 + (powerRatio * 200) + toProvince.strategicValue * 100 + toProvince.industry * 50;

            // Plains bonus check for Tanks
            if (toProvince.terrain === 'plains' && army.composition.tanks > 100) {
              score += 300;
            }
            // Mountain penalty reduction check
            if (toProvince.terrain === 'mountains') {
              score -= 300;
            }
            // Add fortification defense warning
            score -= (toProvince.fortification || 0) * 150;
          } else {
            // Unfavorable battle, avoid suicide campaigns
            score = -9999;
          }
        }

        // Keep the best scored action
        if (score > 0 && (!bestMove || score > bestMove.score)) {
          bestMove = {
            armyId: army.id,
            fromId: army.provinceId,
            toId: targetId,
            score
          };
        }
      }
    }

    // Apply and lock-in the best tactical action
    if (bestMove) {
      simCP -= 1;
      const move = bestMove; // type-safe local copy
      
      // Update simulated indices so future iterations in current turn are aware of new tactical landscape
      const activeArmy = simArmies.find(a => a.id === move.armyId);
      if (activeArmy) {
        activeArmy.provinceId = move.toId;
        activeArmy.movesLeft -= 1;
      }
      simProvinceOwners[move.toId] = aiFaction;

      actions.push({
        type: 'MOVE',
        payload: { armyId: move.armyId, targetProvinceId: move.toId }
      });
    } else {
      break; // No viable or strategic moves can be found, conserve residual actions
    }
  }

  // ==========================================
  // PHASE 5: MERGER OPTIMIZATION (Division Consolidation)
  // ==========================================
  // Hard AI automatically consolidates tiny shattered units into single high-strength divisions in the same province.
  if (difficulty === 'hard') {
    // Group simulated armies by province
    const provinceArmyGroups: { [key: string]: string[] } = {};
    simArmies.forEach(a => {
      if (!provinceArmyGroups[a.provinceId]) {
        provinceArmyGroups[a.provinceId] = [];
      }
      provinceArmyGroups[a.provinceId].push(a.id);
    });

    Object.entries(provinceArmyGroups).forEach(([pId, armyIds]) => {
      if (armyIds.length > 1) {
        // Schedule an optimized merge action for all these armies in that province
        actions.push({
          type: 'MOVE', // Wait, we can construct standard merge actions in App.tsx!
          payload: { mergeProvinceId: pId, armyIds }
        });
      }
    });
  }

  // Always end the turn to allow game flow to proceed
  actions.push({ type: 'END_TURN' });

  return actions;
}
