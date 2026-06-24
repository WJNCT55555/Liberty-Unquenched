/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { GameState, MapFaction as Faction, Province, Army } from '../types_map';
import { INITIAL_PROVINCES, PROVINCE_ADJACENCY, INITIAL_ARMIES, getCombatWidth, getSupplyLimit } from '../map_constants';

const INITIAL_BUILDINGS_MAP: { [key: string]: { barracks?: number; fortress?: number; recruitingOffice?: number; ammoFactory?: number; } } = {
  madrid: { barracks: 1, recruitingOffice: 1 },
  barcelona: { barracks: 1, recruitingOffice: 1 },
  valencia: { barracks: 1, recruitingOffice: 1 },
  burgos: { barracks: 1, recruitingOffice: 1 },
  sevilla: { barracks: 1, recruitingOffice: 1 },
  zaragoza: { barracks: 1, recruitingOffice: 1 },
  tetouan: { barracks: 1, recruitingOffice: 1 },
};

const INITIAL_PROVINCES_WITH_BUILDINGS = Object.keys(INITIAL_PROVINCES).reduce((acc, key) => {
  acc[key] = {
    ...INITIAL_PROVINCES[key],
    buildings: INITIAL_BUILDINGS_MAP[key] || { barracks: 0, fortress: 0, recruitingOffice: 0, ammoFactory: 0 }
  };
  return acc;
}, {} as { [key: string]: Province });

const getGameDate = (turn: number): string => {
  const months = [
    'July', 'August', 'September', 'October', 'November', 'December',
    'January', 'February', 'March', 'April', 'May', 'June'
  ];
  const startMonthIndex = 0; // July is index 0
  const totalMonths = startMonthIndex + (turn - 1);
  const monthName = months[totalMonths % 12];
  const year = 1936 + Math.floor((6 + (turn - 1)) / 12);
  return `${monthName} ${year}`;
};

const INITIAL_STATE: GameState = {
  turn: 1,
  date: 'July 1936',
  currentPlayer: Faction.REPUBLICAN,
  resources: {
    [Faction.REPUBLICAN]: {
      manpower: 500,
      industrialCapacity: 300,
      commandPoints: 2,
      supplies: 200,
      tankReserve: 2500,
    },
    [Faction.NATIONALIST]: {
      manpower: 450,
      industrialCapacity: 250,
      commandPoints: 2,
      supplies: 250,
      tankReserve: 3000,
    },
    [Faction.PORTUGAL]: {
      manpower: 300,
      industrialCapacity: 150,
      commandPoints: 0,
      supplies: 100,
      tankReserve: 1000,
    },
  },
  provinces: INITIAL_PROVINCES_WITH_BUILDINGS,
  armies: INITIAL_ARMIES,
  selectedProvinceId: null,
  selectedArmyId: null,
  selectedArmyIds: [],
  history: ['The war has begun. Factional divisions have split Spain.'],
  aiConfig: {
    enabled: true,
    aiFaction: Faction.NATIONALIST,
    difficulty: 'normal',
    confirmed: true,
  },
};

export function useGameState() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const selectProvince = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedProvinceId: id, selectedArmyId: null, selectedArmyIds: [] }));
  }, []);

  const selectArmy = useCallback((id: string | null, isShift: boolean = false) => {
    setState((s) => {
      if (!id) {
        return { ...s, selectedArmyId: null, selectedArmyIds: [], selectedProvinceId: null };
      }

      const clickedArmy = s.armies.find(a => a.id === id);
      if (!clickedArmy) return s;

      // If shift-clicking, we add to or toggle the selection, provided they are in the same province
      if (isShift) {
        const isAlreadySelected = s.selectedArmyIds.includes(id);
        let nextSelectedIds = [...s.selectedArmyIds];

        if (isAlreadySelected) {
          nextSelectedIds = nextSelectedIds.filter(x => x !== id);
        } else {
          // If we have some selected armies, check if they are in the same province and of the same faction
          const activeSels = s.armies.filter(a => s.selectedArmyIds.includes(a.id));
          const canSelect = activeSels.length === 0 || (
            activeSels[0].provinceId === clickedArmy.provinceId && 
            activeSels[0].faction === clickedArmy.faction &&
            clickedArmy.faction === s.currentPlayer
          );

          if (canSelect && clickedArmy.faction === s.currentPlayer) {
            nextSelectedIds.push(id);
          } else if (clickedArmy.faction === s.currentPlayer) {
            // Reset to just the newly clicked one if not in same province or faction or not current player
            nextSelectedIds = [id];
          }
        }

        const nextPrimaryId = nextSelectedIds.length > 0 ? nextSelectedIds[nextSelectedIds.length - 1] : null;
        return {
          ...s,
          selectedArmyId: nextPrimaryId,
          selectedArmyIds: nextSelectedIds,
          selectedProvinceId: null,
        };
      } else {
        // Simple click without Shift replaces selection
        return {
          ...s,
          selectedArmyId: id,
          selectedArmyIds: [id],
          selectedProvinceId: null,
        };
      }
    });
  }, []);

  const endTurn = useCallback(() => {
    setState((s) => {
      const nextPlayer = s.currentPlayer === Faction.REPUBLICAN ? Faction.NATIONALIST : Faction.REPUBLICAN;
      const nextTurn = nextPlayer === Faction.REPUBLICAN ? s.turn + 1 : s.turn;
      
      const newResources = { ...s.resources };
      
      // Calculate resource gain from controlled provinces
      let provinceManpower = 0;
      let provinceIndustry = 0;
      let extraAmmoSupplies = 0;
      (Object.values(s.provinces) as Province[]).forEach(p => {
        if (p.owner === nextPlayer) {
          provinceManpower += p.manpower;
          provinceIndustry += p.industry;
          
          const ammoLvl = p.buildings?.ammoFactory || 0;
          if (ammoLvl === 1) {
            extraAmmoSupplies += 10;
          } else if (ammoLvl === 2) {
            extraAmmoSupplies += 20;
          }
        }
      });

      // Passive income calculations
      const manpowerGained = Math.floor(provinceManpower * 5); // 5x manpower score as raw recruits
      const suppliesGained = Math.floor(provinceIndustry * 0.08) + extraAmmoSupplies; // industry + factories provides supplies

      const currNextRes = s.resources[nextPlayer];
      newResources[nextPlayer] = {
        manpower: (currNextRes?.manpower || 0) + manpowerGained,
        supplies: (currNextRes?.supplies || 0) + suppliesGained,
        commandPoints: 2, // Reset command points to 2
        industrialCapacity: (currNextRes?.industrialCapacity || 0) + Math.floor(provinceIndustry * 0.2), // industrial accumulation
        tankReserve: currNextRes?.tankReserve || 0,
      };

      // Reset moves for the NEXT player's armies
      let newArmies = s.armies.map(army => {
        if (army.faction === nextPlayer) {
          return { ...army, movesLeft: 2 };
        }
        return army;
      });

      // Calculate supply attrition for ALL armies currently stationed in each province
      const attritionMessages: string[] = [];
      newArmies = newArmies.map(army => {
        const province = s.provinces[army.provinceId];
        if (!province) return army;

        // Find all armies in this same province
        const sisterArmies = newArmies.filter(a => a.provinceId === army.provinceId);
        const totalProvinceManpower = sisterArmies.reduce((sum, a) => sum + a.manpower, 0);
        
        const limit = getSupplyLimit(province);
        if (totalProvinceManpower > limit) {
          // Exceeded supply limit! Apply attrition penalty
          const excessRatio = (totalProvinceManpower - limit) / totalProvinceManpower;
          // Apply a base penalty of 5% + excess ratio * 15%, capped at 25% total attrition loss
          const attritionPercent = Math.min(0.25, 0.05 + excessRatio * 0.15);
          
          const infLoss = Math.floor(army.composition.infantry * attritionPercent);
          const artLoss = Math.floor(army.composition.artillery * attritionPercent);
          const tankLoss = Math.floor(army.composition.tanks * attritionPercent);
          const totalLoss = infLoss + artLoss + tankLoss;

          const nextInf = Math.max(0, army.composition.infantry - infLoss);
          const nextArt = Math.max(0, army.composition.artillery - artLoss);
          const nextTnk = Math.max(0, army.composition.tanks - tankLoss);
          const nextManpower = nextInf + nextArt + nextTnk;
          
          // Deduct morale as well due to undersupply
          const nextMorale = Math.max(10, army.morale - Math.floor(10 + excessRatio * 15));

          const provName = province.name;
          const detailMsg = `[⚠️ Attrition] Forces in ${provName} exceeded supply limit (${totalProvinceManpower.toLocaleString()} / ${limit.toLocaleString()}). Div. ${army.id.slice(-4).toUpperCase()} lost ${totalLoss.toLocaleString()} soldiers; morale fell to ${nextMorale}%.`;
          attritionMessages.push(detailMsg);

          return {
            ...army,
            composition: {
              infantry: nextInf,
              artillery: nextArt,
              tanks: nextTnk,
            },
            manpower: nextManpower,
            morale: nextMorale,
          };
        }
        return army;
      }).filter(a => a.manpower > 150);

      const nextDate = getGameDate(nextTurn);

      const histMessage = extraAmmoSupplies > 0 
        ? `${nextDate}: Turn passed to ${nextPlayer}. Generated +${manpowerGained} Manpower, +${suppliesGained} Supplies (incl. +${extraAmmoSupplies} from Factories).`
        : `${nextDate}: Turn passed to ${nextPlayer}. Generated +${manpowerGained} Manpower, +${suppliesGained} Supplies.`;

      const nextHistory = [histMessage, ...attritionMessages, ...s.history].slice(0, 50);

      return {
        ...s,
        turn: nextTurn,
        date: nextDate,
        currentPlayer: nextPlayer,
        resources: newResources,
        armies: newArmies,
        history: nextHistory,
      };
    });
  }, []);

  const moveArmy = useCallback((armyId: string, targetProvinceId: string) => {
    setState((s) => {
      const army = s.armies.find(a => a.id === armyId);
      if (!army || army.faction !== s.currentPlayer) return s;
      
      const currentCP = s.resources[s.currentPlayer].commandPoints;
      if (currentCP < 1) return s;
      if (army.movesLeft < 1) return s;

      // Check adjacency
      const adjacent = PROVINCE_ADJACENCY[army.provinceId] || [];
      if (!adjacent.includes(targetProvinceId)) return s;

      const targetProvince = s.provinces[targetProvinceId];
      const enemyArmies = s.armies.filter(a => a.provinceId === targetProvinceId && a.faction !== s.currentPlayer);
      
      let newArmies = [...s.armies];
      const newHistory = [...s.history];
      const newProvinces = { ...s.provinces };
      const newResources = { ...s.resources };

      // Deduct CP
      newResources[s.currentPlayer] = {
        ...newResources[s.currentPlayer],
        commandPoints: currentCP - 1
      };

      // Battle Logic if enemies are present
      if (enemyArmies.length > 0) {
        const defender = enemyArmies[0];
        
        // EU4-style Dice Rolls (1 to 9)
        const attackerRoll = Math.floor(Math.random() * 9) + 1;
        const defenderRoll = Math.floor(Math.random() * 9) + 1;

        // Terrain and fortifications
        const terrain = targetProvince.terrain;
        const fort = targetProvince.fortification || 0;

        let attackerTerrainMult = 1.0;
        let defenderTerrainMult = 1.0;
        let attackerTankMult = 1.0;

        if (terrain === 'mountains') {
          attackerTerrainMult -= 0.30;
          attackerTankMult = 0.4; // Tanks are heavily penalized in mountains
          defenderTerrainMult += 0.20 + (fort * 0.15);
        } else if (terrain === 'urban') {
          attackerTerrainMult -= 0.20;
          attackerTankMult = 0.6; // Tanks penalized in narrow city blocks
          defenderTerrainMult += 0.15 + (fort * 0.25);
        } else if (terrain === 'forest') {
          attackerTerrainMult -= 0.10;
          attackerTankMult = 0.8;
          defenderTerrainMult += 0.10 + (fort * 0.10);
        } else if (terrain === 'plains') {
          attackerTankMult = 1.35; // Tanks excel in plains (Shock charge bonus!)
        }

        const attComp = army.composition;
        const defComp = defender.composition;

        const widthLimit = getCombatWidth(terrain);

        // Combat Width limits active infantry and tanks. Artillery is unaffected.
        const attackerFrontline = attComp.infantry + attComp.tanks;
        const attackerScale = attackerFrontline > widthLimit ? (widthLimit / attackerFrontline) : 1.0;
        const effectiveAttInf = attComp.infantry * attackerScale;
        const effectiveAttTank = attComp.tanks * attackerScale;

        const defenderFrontline = defComp.infantry + defComp.tanks;
        const defenderScale = defenderFrontline > widthLimit ? (widthLimit / defenderFrontline) : 1.0;
        const effectiveDefInf = defComp.infantry * defenderScale;
        const effectiveDefTank = defComp.tanks * defenderScale;

        // Custom Unit Strengths using effective units
        const attInfPower = effectiveAttInf * 1.0 * (terrain === 'urban' ? 1.25 : 1.0);
        const attArtPower = attComp.artillery * 1.5;
        const attTankPower = effectiveAttTank * 2.0 * attackerTankMult;

        const defInfPower = effectiveDefInf * 1.0 * (terrain === 'urban' ? 1.3 : 1.15); // Defender advantage
        const defArtPower = defComp.artillery * 1.5;
        const defTankPower = effectiveDefTank * 2.0 * (terrain === 'plains' ? 1.35 : terrain === 'mountains' ? 0.4 : 1.0);

        // EU4 Fire and Shock components integrated
        const attTotalBaseSupport = attInfPower + attArtPower + attTankPower;
        const defTotalBaseSupport = defInfPower + defArtPower + defTankPower;

        const attackerPower = attTotalBaseSupport * (1 + army.morale / 100) * (1 + army.militarization / 100) * (attackerRoll + 3) * attackerTerrainMult;
        const defenderPowerBase = defTotalBaseSupport * (1 + defender.morale / 100) * (1 + defender.militarization / 100) * (defenderRoll + 3) * defenderTerrainMult;
        const fortressLvl = targetProvince.buildings?.fortress || 0;
        const fortressCombatMult = 1.0 + (fortressLvl * 0.10);
        const defenderPower = defenderPowerBase * fortressCombatMult;

        // Base casualty estimations
        const totalBaseLossAttacker = Math.floor(defenderPower * 0.08);
        const totalBaseLossDefender = Math.floor(attackerPower * 0.11);

        // Back-Row Artillery Shielding: Artillery absorbs damage from front line
        const attArtRatio = attComp.artillery / Math.max(1, army.manpower);
        const defArtRatio = defComp.artillery / Math.max(1, defender.manpower);

        const attackerLossReduction = Math.min(0.25, attArtRatio * 0.8);
        const defenderLossReduction = Math.min(0.25, defArtRatio * 0.8);

        let finalAttackerLosses = Math.max(100, Math.floor(totalBaseLossAttacker * (1 - attackerLossReduction)));
        let finalDefenderLosses = Math.max(100, Math.floor(totalBaseLossDefender * (1 - defenderLossReduction)));

        // Ensure we do not kill more troop counts than exist
        finalAttackerLosses = Math.min(army.manpower, finalAttackerLosses);
        finalDefenderLosses = Math.min(defender.manpower, finalDefenderLosses);

        // Distribute casualties proportionally among regiments
        const distributeLosses = (comp: typeof army.composition, totalLosses: number) => {
          const totalUnits = comp.infantry + comp.artillery + comp.tanks;
          if (totalUnits <= 0) return { infantry: 0, artillery: 0, tanks: 0 };

          let infLoss = 0;
          let artLoss = 0;
          let tankLoss = 0;

          const frontUnits = comp.infantry + comp.tanks;
          
          if (frontUnits > 0) {
            const infShare = comp.infantry / frontUnits;
            const tankShare = comp.tanks / frontUnits;

            const frontLosses = totalLosses * 0.85;
            const backLosses = totalLosses * 0.15;

            infLoss = Math.min(comp.infantry, Math.floor(frontLosses * infShare));
            tankLoss = Math.min(comp.tanks, Math.floor(frontLosses * tankShare));
            artLoss = Math.min(comp.artillery, Math.floor(backLosses));

            // Distribute leftover remainders
            let leftover = totalLosses - (infLoss + artLoss + tankLoss);
            if (leftover > 0) {
              const remInf = comp.infantry - infLoss;
              const remArt = comp.artillery - artLoss;
              const remTank = comp.tanks - tankLoss;
              const remTotal = remInf + remArt + remTank;

              if (remTotal > 0) {
                infLoss += Math.min(remInf, Math.floor(leftover * (remInf / remTotal)));
                artLoss += Math.min(remArt, Math.floor(leftover * (remArt / remTotal)));
                tankLoss += Math.min(remTank, Math.floor(leftover * (remTank / remTotal)));
              }
            }
          } else {
            artLoss = Math.min(comp.artillery, totalLosses);
          }

          return {
            infantry: Math.max(0, comp.infantry - infLoss),
            artillery: Math.max(0, comp.artillery - artLoss),
            tanks: Math.max(0, comp.tanks - tankLoss),
          };
        };

        const nextAttComp = distributeLosses(attComp, finalAttackerLosses);
        const nextDefComp = distributeLosses(defComp, finalDefenderLosses);

        const nextAttManpower = nextAttComp.infantry + nextAttComp.artillery + nextAttComp.tanks;
        const nextDefManpower = nextDefComp.infantry + nextDefComp.artillery + nextDefComp.tanks;

        // Morale breaks
        const attackerLostRatio = finalAttackerLosses / Math.max(1, army.manpower);
        const defenderLostRatio = finalDefenderLosses / Math.max(1, defender.manpower);

        const attMoraleLoss = Math.floor(10 + attackerLostRatio * 100 + Math.max(0, defenderRoll - attackerRoll) * 3);
        const defMoraleLoss = Math.floor(15 + defenderLostRatio * 100 + Math.max(0, attackerRoll - defenderRoll) * 4);

        newArmies = newArmies.map(a => {
          if (a.id === armyId) {
            return { 
              ...a, 
              composition: nextAttComp,
              manpower: nextAttManpower,
              morale: Math.max(10, a.morale - attMoraleLoss),
              movesLeft: 0 
            };
          }
          if (a.id === defender.id) {
            return { 
              ...a, 
              composition: nextDefComp,
              manpower: nextDefManpower,
              morale: Math.max(10, a.morale - defMoraleLoss) 
            };
          }
          return a;
        });

        // Delete routed/wiped out forces
        newArmies = newArmies.filter(a => a.manpower > 150);

        const isVictory = defenderLostRatio >= attackerLostRatio;
        const resultText = isVictory ? 'Victory' : 'Stalemate';

        // --- ORGANIZED RETREAT LOGIC ---
        let defenderRetreated = false;
        let defenderAnnihilated = false;
        let retreatDestId = '';

        const activeDefenderIndex = newArmies.findIndex(a => a.id === defender.id);
        if (activeDefenderIndex !== -1) {
          const activeDefender = newArmies[activeDefenderIndex];
          if (isVictory || activeDefender.morale < 35) {
            // Find adjacent friendly provinces
            const defenderNeighbors = PROVINCE_ADJACENCY[targetProvinceId] || [];
            const friendlyDestinations = defenderNeighbors.filter(pId => s.provinces[pId].owner === defender.faction);

            if (friendlyDestinations.length > 0) {
              retreatDestId = friendlyDestinations[0];
              newArmies[activeDefenderIndex] = {
                ...activeDefender,
                provinceId: retreatDestId,
                morale: Math.max(10, activeDefender.morale - 10), // retreating reduces morale
                movesLeft: 0,
              };
              defenderRetreated = true;
            } else {
              // Trap and wipe out
              newArmies = newArmies.filter(a => a.id !== defender.id);
              defenderAnnihilated = true;
            }
          }
        }

        const widthNote = (attackerFrontline > widthLimit || defenderFrontline > widthLimit)
          ? `[Combat Width Cap: ${widthLimit.toLocaleString()} in effect] ` 
          : '';

        newHistory.unshift(
          `BATTLE OF ${targetProvince.name.toUpperCase()}: ${resultText}! ${widthNote}` +
          `Attacker (rolled ${attackerRoll}) lost ${finalAttackerLosses} [Remaining: ${nextAttComp.infantry} Inf, ${nextAttComp.artillery} Art, ${nextAttComp.tanks} Tnk]. ` +
          `Defender (rolled ${defenderRoll}) lost ${finalDefenderLosses} [Remaining: ${nextDefComp.infantry} Inf, ${nextDefComp.artillery} Art, ${nextDefComp.tanks} Tnk].`
        );

        if (defenderRetreated) {
          const destName = s.provinces[retreatDestId]?.name || retreatDestId;
          newHistory.unshift(
            `[🛡️ Organized Retreat] Defeated Div. ${defender.id.slice(-4).toUpperCase()} successfully executed an organized retreat to ${destName} (morale penalty applied).`
          );
        } else if (defenderAnnihilated) {
          newHistory.unshift(
            `[💥 Annihilation] Defeated Div. ${defender.id.slice(-4).toUpperCase()} was trapped with no friendly land route to escape to and was completely annihilated!`
          );
        }

        // If defender completely routed, retreated, or was annihilated (meaning they are no longer in targetProvinceId), occupy
        const defenderStillInProvince = newArmies.some(a => a.id === defender.id && a.provinceId === targetProvinceId);
        if (!defenderStillInProvince) {
          newArmies = newArmies.map(a => a.id === armyId ? { ...a, provinceId: targetProvinceId } : a);
          newProvinces[targetProvinceId] = { ...targetProvince, owner: s.currentPlayer };
          newHistory.unshift(`${army.faction} forces achieved a decisive breakthrough and won ${targetProvince.name}.`);
        }
      } else {
        // Normal move without combat
        newArmies = newArmies.map(a => 
          a.id === armyId ? { ...a, provinceId: targetProvinceId, movesLeft: a.movesLeft - 1 } : a
        );

        // Capture logic
        if (targetProvince.owner !== s.currentPlayer) {
          newProvinces[targetProvinceId] = { ...targetProvince, owner: s.currentPlayer };
          newHistory.unshift(`${army.faction} army took unoccupied province ${targetProvince.name}.`);
        } else {
          newHistory.unshift(`${army.faction} army repositioned to ${targetProvince.name}.`);
        }
      }

      return {
        ...s,
        armies: newArmies,
        resources: newResources,
        provinces: newProvinces,
        history: newHistory.slice(0, 50),
        selectedArmyId: armyId, // Keep it selected
      };
    });
  }, []);

  const recruitArmy = useCallback((provinceId: string, comp: { infantry: number, artillery: number, tanks: number }) => {
    setState((s) => {
      // Validate province control
      const province = s.provinces[provinceId];
      if (!province || province.owner !== s.currentPlayer) return s;

      // Validate recruiting office building
      const hasRecruitingOffice = province.buildings?.recruitingOffice && province.buildings.recruitingOffice > 0;
      if (!hasRecruitingOffice) return s;

      const totalManpower = comp.infantry + comp.artillery + comp.tanks;
      if (totalManpower <= 0) return s;

      // Cost estimation:
      // Infantry: 1 manpower per soldier, 0.03 supplies per soldier
      // Artillery: 1 manpower per crew, 0.06 supplies, 0.04 IC
      // Tanks: 1 manpower, 1.2 supplies, 0.08 IC, 1 tankReserve
      const manpowerCost = totalManpower;
      const suppliesCost = Math.floor(comp.infantry * 0.03 + comp.artillery * 0.06 + comp.tanks * 1.2);
      const industrialCost = Math.floor(comp.artillery * 0.04 + comp.tanks * 0.08);
      const tankReserveCost = comp.tanks;

      const res = s.resources[s.currentPlayer];
      if (
        res.manpower < manpowerCost || 
        res.supplies < suppliesCost || 
        res.industrialCapacity < industrialCost ||
        res.tankReserve < tankReserveCost
      ) {
        return s; // Not enough resources
      }

      // Deduct resources
      const newResources = { ...s.resources };
      newResources[s.currentPlayer] = {
        ...res,
        manpower: res.manpower - manpowerCost,
        supplies: res.supplies - suppliesCost,
        industrialCapacity: res.industrialCapacity - industrialCost,
        tankReserve: res.tankReserve - tankReserveCost,
      };

      const armyId = `army_${s.currentPlayer.slice(0, 3).toLowerCase()}_${Date.now()}`;
      const newArmy: Army = {
        id: armyId,
        faction: s.currentPlayer,
        provinceId,
        movesLeft: 0, // Recruited army cannot move immediately (EU style)
        manpower: totalManpower,
        maxManpower: totalManpower,
        composition: { ...comp },
        designedComposition: { ...comp },
        morale: 70, 
        militarization: s.currentPlayer === Faction.NATIONALIST ? 45 : 35,
      };

      return {
        ...s,
        resources: newResources,
        armies: [...s.armies, newArmy],
        history: [`Enabled mobilization in ${province.name}: +${comp.infantry} Inf, +${comp.artillery} Art, +${comp.tanks} Tanks in Division ${armyId.slice(-4).toUpperCase()}`, ...s.history].slice(0, 50),
        selectedProvinceId: provinceId,
      };
    });
  }, []);

  const reinforceArmy = useCallback((armyId: string) => {
    setState((s) => {
      const army = s.armies.find(a => a.id === armyId);
      if (!army || army.faction !== s.currentPlayer) return s;

      const province = s.provinces[army.provinceId];
      if (!province || province.owner !== s.currentPlayer) return s;

      // Calculate maximum possible 50% replenishment for each type based on losses
      const designedComp = army.designedComposition || army.composition;
      const maxInfRestored = Math.max(0, Math.floor((designedComp.infantry - army.composition.infantry) * 0.5));
      const maxArtRestored = Math.max(0, Math.floor((designedComp.artillery - army.composition.artillery) * 0.5));
      const maxTnkRestored = Math.max(0, Math.floor((designedComp.tanks - army.composition.tanks) * 0.5));

      const totalMaxRestored = maxInfRestored + maxArtRestored + maxTnkRestored;
      if (totalMaxRestored <= 0) return s; // Already at full strength

      // Base target costs for maximum possible 50% replenishment
      const targetManpower = totalMaxRestored;
      const targetSupplies = Math.floor(maxInfRestored * 0.03 + maxArtRestored * 0.06 + maxTnkRestored * 1.2);
      const targetIndustrial = Math.floor(maxArtRestored * 0.04 + maxTnkRestored * 0.08);
      const targetTankReserve = maxTnkRestored;

      const res = s.resources[s.currentPlayer];

      // Calculate replenishment scaling factor based on current resources available
      let scale = 1.0;
      if (res.manpower < targetManpower) {
        scale = Math.min(scale, res.manpower / targetManpower);
      }
      if (res.supplies < targetSupplies) {
        scale = Math.min(scale, res.supplies / targetSupplies);
      }
      if (res.industrialCapacity < targetIndustrial) {
        scale = Math.min(scale, res.industrialCapacity / targetIndustrial);
      }
      if (res.tankReserve < targetTankReserve) {
        scale = Math.min(scale, res.tankReserve / targetTankReserve);
      }

      // Calculate final actual replenishment numbers safely
      const actualInf = Math.floor(maxInfRestored * scale);
      const actualArt = Math.floor(maxArtRestored * scale);
      const actualTnk = Math.floor(maxTnkRestored * scale);
      const actualTotal = actualInf + actualArt + actualTnk;

      if (actualTotal <= 0) return s; // Cannot afford even a single soldier

      // Deduct actual consumed resources
      const consumedManpower = actualTotal;
      const consumedSupplies = Math.floor(actualInf * 0.03 + actualArt * 0.06 + actualTnk * 1.2);
      const consumedIndustrial = Math.floor(actualArt * 0.04 + actualTnk * 0.08);

      const newResources = { ...s.resources };
      newResources[s.currentPlayer] = {
        ...res,
        manpower: Math.max(0, res.manpower - consumedManpower),
        supplies: Math.max(0, res.supplies - consumedSupplies),
        industrialCapacity: Math.max(0, res.industrialCapacity - consumedIndustrial),
        tankReserve: Math.max(0, res.tankReserve - actualTnk),
      };

      // Boost morale by 20% of its current value: new morale = old morale + old morale * 0.20
      const moraleBonus = Math.floor(army.morale * 0.20);
      const nextMorale = Math.min(100, army.morale + moraleBonus);

      const newArmies = s.armies.map(a => {
        if (a.id === armyId) {
          return {
            ...a,
            composition: {
              infantry: a.composition.infantry + actualInf,
              artillery: a.composition.artillery + actualArt,
              tanks: a.composition.tanks + actualTnk,
            },
            manpower: a.manpower + actualTotal,
            morale: nextMorale,
          };
        }
        return a;
      });

      return {
        ...s,
        resources: newResources,
        armies: newArmies,
        history: [
          `Performed personnel supplement for Div. ${armyId.slice(-4).toUpperCase()}: +${actualTotal} troops (+${actualInf} Inf, +${actualArt} Art, +${actualTnk} Tnk). Morale boosted from ${army.morale}% to ${nextMorale}%.`,
          ...s.history
        ].slice(0, 50),
      };
    });
  }, []);

  const executeOffensive = useCallback((provinceId: string) => {
    return; 
  }, []);

  const mergeSelectedArmies = useCallback(() => {
    setState((s) => {
      if (s.selectedArmyIds.length <= 1) return s;

      // Filter armies that are currently selected and exist in the list
      const selectedArmies = s.armies.filter(a => s.selectedArmyIds.includes(a.id));
      if (selectedArmies.length <= 1) return s;

      // Verify they are all in the same province, of the same faction
      const baseProvinceId = selectedArmies[0].provinceId;
      const baseFaction = selectedArmies[0].faction;
      const allInSameProvinceAndFaction = selectedArmies.every(
        a => a.provinceId === baseProvinceId && a.faction === baseFaction
      );

      if (!allInSameProvinceAndFaction) return s;

      // We will merge everything into the first army of the selection
      const targetArmy = selectedArmies[0];
      const otherArmies = selectedArmies.slice(1);

      // Compute combined composition
      const combinedComposition = {
        infantry: selectedArmies.reduce((sum, a) => sum + a.composition.infantry, 0),
        artillery: selectedArmies.reduce((sum, a) => sum + a.composition.artillery, 0),
        tanks: selectedArmies.reduce((sum, a) => sum + a.composition.tanks, 0),
      };

      const combinedDesignedComposition = {
        infantry: selectedArmies.reduce((sum, a) => sum + (a.designedComposition?.infantry ?? a.composition.infantry), 0),
        artillery: selectedArmies.reduce((sum, a) => sum + (a.designedComposition?.artillery ?? a.composition.artillery), 0),
        tanks: selectedArmies.reduce((sum, a) => sum + (a.designedComposition?.tanks ?? a.composition.tanks), 0),
      };

      const totalManpower = selectedArmies.reduce((sum, a) => sum + a.manpower, 0);
      const totalMaxManpower = selectedArmies.reduce((sum, a) => sum + (a.maxManpower || a.manpower), 0);

      // Weighted averages
      let weightedMorale = targetArmy.morale;
      let weightedMilitarization = targetArmy.militarization;

      if (totalManpower > 0) {
        const sumMorale = selectedArmies.reduce((sum, a) => sum + (a.morale * a.manpower), 0);
        const sumMilitarization = selectedArmies.reduce((sum, a) => sum + (a.militarization * a.manpower), 0);
        weightedMorale = Math.round(sumMorale / totalManpower);
        weightedMilitarization = Math.round(sumMilitarization / totalManpower);
      }

      // Minimum moves left to prevent movement exploit
      const minMovesLeft = Math.min(...selectedArmies.map(a => a.movesLeft));

      // Construct the newly merged army
      const mergedArmy: Army = {
        ...targetArmy,
        manpower: totalManpower,
        maxManpower: totalMaxManpower,
        composition: combinedComposition,
        designedComposition: combinedDesignedComposition,
        morale: Math.min(100, Math.max(10, weightedMorale)),
        militarization: Math.min(100, Math.max(0, weightedMilitarization)),
        movesLeft: minMovesLeft,
      };

      // Create new armies list
      const otherSelectedIds = otherArmies.map(a => a.id);
      const newArmies = s.armies
        .map(a => (a.id === targetArmy.id ? mergedArmy : a))
        .filter(a => !otherSelectedIds.includes(a.id));

      const logMsg = `[Merger] Combined ${selectedArmies.length} divisions in ${s.provinces[baseProvinceId].name} into Division ${targetArmy.id.slice(-4).toUpperCase()} (Total: ${totalManpower.toLocaleString()} troops).`;

      return {
        ...s,
        armies: newArmies,
        selectedArmyId: targetArmy.id,
        selectedArmyIds: [targetArmy.id],
        history: [logMsg, ...s.history].slice(0, 50),
      };
    });
  }, []);

  const disbandSelectedArmies = useCallback(() => {
    setState((s) => {
      const activeSelectedIds = s.selectedArmyIds;
      const armiesToDisband = s.armies.filter(
        a => activeSelectedIds.includes(a.id) && a.faction === s.currentPlayer
      );

      if (armiesToDisband.length === 0) return s;

      let reclaimedManpower = 0;
      let reclaimedTanks = 0;

      armiesToDisband.forEach(a => {
        reclaimedManpower += a.manpower;
        reclaimedTanks += a.composition.tanks;
      });

      const res = s.resources[s.currentPlayer];
      const newResources = {
        ...s.resources,
        [s.currentPlayer]: {
          ...res,
          manpower: res.manpower + reclaimedManpower,
          tankReserve: res.tankReserve + reclaimedTanks,
        }
      };

      const disbandedIds = armiesToDisband.map(a => a.id);
      const newArmies = s.armies.filter(a => !disbandedIds.includes(a.id));

      const logMsg = `[Disband] Disbanded ${armiesToDisband.length} division(s), reclaiming +${reclaimedManpower.toLocaleString()} manpower and +${reclaimedTanks.toLocaleString()} tanks.`;

      let newSelectedArmyId = s.selectedArmyId;
      if (newSelectedArmyId && disbandedIds.includes(newSelectedArmyId)) {
        newSelectedArmyId = undefined;
      }
      const newSelectedArmyIds = s.selectedArmyIds.filter(id => !disbandedIds.includes(id));

      return {
        ...s,
        resources: newResources,
        armies: newArmies,
        selectedArmyId: newSelectedArmyId,
        selectedArmyIds: newSelectedArmyIds,
        history: [logMsg, ...s.history].slice(0, 50),
      };
    });
  }, []);

  const buildBuilding = useCallback((
    provinceId: string, 
    buildingType: 'barracks' | 'fortress' | 'recruitingOffice' | 'ammoFactory'
  ) => {
    setState((s) => {
      const province = s.provinces[provinceId];
      if (!province || province.owner !== s.currentPlayer) return s;

      const currentBuildings = province.buildings || { barracks: 0, fortress: 0, recruitingOffice: 0, ammoFactory: 0 };
      const currentLevel = currentBuildings[buildingType] || 0;
      const nextLevel = currentLevel + 1;

      // Define level limits
      let maxLvl = 1;
      if (buildingType === 'fortress') maxLvl = 3;
      if (buildingType === 'ammoFactory') maxLvl = 2; // Supports up to Level 2 (+10/+20)

      if (currentLevel >= maxLvl) return s; // Already maxed

      // Check restrictions
      if (buildingType === 'recruitingOffice' && province.strategicValue < 4) {
        return s; // Requires strategicValue >= 4
      }
      if (buildingType === 'ammoFactory' && province.terrain !== 'urban') {
        return s; // Requires urban terrain
      }

      // Cost matrix
      let costSupplies = 0;
      let costIC = 0;
      let costManpower = 0;

      if (buildingType === 'barracks') {
        costSupplies = 120;
        costIC = 80;
      } else if (buildingType === 'fortress') {
        if (nextLevel === 1) {
          costSupplies = 150;
          costIC = 100;
        } else if (nextLevel === 2) {
          costSupplies = 250;
          costIC = 180;
        } else if (nextLevel === 3) {
          costSupplies = 400;
          costIC = 280;
        }
      } else if (buildingType === 'recruitingOffice') {
        costSupplies = 100;
        costIC = 60;
        costManpower = 30;
      } else if (buildingType === 'ammoFactory') {
        if (nextLevel === 1) {
          costSupplies = 200;
          costIC = 150;
        } else {
          costSupplies = 300;
          costIC = 220;
        }
      }

      const res = s.resources[s.currentPlayer];
      if (res.supplies < costSupplies || res.industrialCapacity < costIC || res.manpower < costManpower) {
        return s; // Not enough resources
      }

      // Deduct resources and update province buildings
      const newResources = { ...s.resources };
      newResources[s.currentPlayer] = {
        ...res,
        supplies: res.supplies - costSupplies,
        industrialCapacity: res.industrialCapacity - costIC,
        manpower: res.manpower - costManpower,
      };

      const updatedProvince = {
        ...province,
        buildings: {
          ...currentBuildings,
          [buildingType]: nextLevel,
        }
      };

      // If building a fortress, increase fortification and allow cap up to 6
      if (buildingType === 'fortress') {
        updatedProvince.fortification = Math.min(6, (updatedProvince.fortification || 0) + 1);
      }

      const typeLabels: Record<string, [string, string]> = {
        barracks: ['兵营', 'Barracks'],
        fortress: ['要塞', 'Fortress'],
        recruitingOffice: ['征兵办', 'Recruiting Office'],
        ammoFactory: ['军火厂', 'Ammunition Factory'],
      };

      const cnLabel = typeLabels[buildingType][0];
      const enLabel = typeLabels[buildingType][1];

      return {
        ...s,
        resources: newResources,
        provinces: {
          ...s.provinces,
          [provinceId]: updatedProvince,
        },
        history: [`[Construction] Upgraded ${enLabel} (${cnLabel}) to Level ${nextLevel} in ${province.name}. Supplies cost: ${costSupplies}, IC cost: ${costIC}.`, ...s.history].slice(0, 50),
      };
    });
  }, []);

  const updateAiConfig = useCallback((enabled: boolean, aiFaction: Faction, difficulty: 'easy' | 'normal' | 'hard') => {
    setState((s) => ({
      ...s,
      aiConfig: {
        enabled,
        aiFaction,
        difficulty,
        confirmed: false,
      }
    }));
  }, []);

  const confirmAiConfig = useCallback(() => {
    setState((s) => ({
      ...s,
      aiConfig: {
        enabled: s.aiConfig?.enabled ?? false,
        aiFaction: s.aiConfig?.aiFaction ?? Faction.NATIONALIST,
        difficulty: s.aiConfig?.difficulty ?? 'normal',
        confirmed: true,
      }
    }));
  }, []);

  const splitArmy = useCallback((armyId: string, comp: { infantry: number, artillery: number, tanks: number }) => {
    setState((s) => {
      const parentArmy = s.armies.find(a => a.id === armyId);
      if (!parentArmy) return s;

      const totalSplitManpower = comp.infantry + comp.artillery + comp.tanks;
      if (totalSplitManpower <= 0) return s;

      // Validate parent has enough units
      if (
        parentArmy.composition.infantry < comp.infantry ||
        parentArmy.composition.artillery < comp.artillery ||
        parentArmy.composition.tanks < comp.tanks
      ) {
        return s;
      }

      // Ensure at least someone is left in parent army
      const parentNewInf = parentArmy.composition.infantry - comp.infantry;
      const parentNewArt = parentArmy.composition.artillery - comp.artillery;
      const parentNewTnk = parentArmy.composition.tanks - comp.tanks;
      const parentNewManpower = parentNewInf + parentNewArt + parentNewTnk;

      if (parentNewManpower <= 0) return s;

      // Update parent army
      const updatedParent: Army = {
        ...parentArmy,
        manpower: parentNewManpower,
        maxManpower: Math.max(parentNewManpower, (parentArmy.maxManpower || parentArmy.manpower) - totalSplitManpower),
        composition: {
          infantry: parentNewInf,
          artillery: parentNewArt,
          tanks: parentNewTnk,
        },
        designedComposition: parentArmy.designedComposition ? {
          infantry: Math.max(parentNewInf, (parentArmy.designedComposition.infantry || 0) - comp.infantry),
          artillery: Math.max(parentNewArt, (parentArmy.designedComposition.artillery || 0) - comp.artillery),
          tanks: Math.max(parentNewTnk, (parentArmy.designedComposition.tanks || 0) - comp.tanks),
        } : undefined,
      };

      // Create new split army
      const splitArmyId = `army_${s.currentPlayer.slice(0, 3).toLowerCase()}_${Date.now()}_split`;
      const newSplitArmy: Army = {
        id: splitArmyId,
        faction: parentArmy.faction,
        provinceId: parentArmy.provinceId,
        movesLeft: parentArmy.movesLeft,
        manpower: totalSplitManpower,
        maxManpower: totalSplitManpower,
        composition: { ...comp },
        designedComposition: { ...comp },
        morale: parentArmy.morale,
        militarization: parentArmy.militarization,
      };

      const updatedArmies = s.armies.map(a => a.id === parentArmy.id ? updatedParent : a);
      updatedArmies.push(newSplitArmy);

      const parentAbbr = parentArmy.id.slice(-4).toUpperCase();
      const childAbbr = splitArmyId.slice(-10, -6).toUpperCase();
      const logMsg = `[Split] Split Division ${parentAbbr} in ${s.provinces[parentArmy.provinceId].name}. Created Division ${childAbbr} with ${totalSplitManpower.toLocaleString()} troops.`;

      return {
        ...s,
        armies: updatedArmies,
        selectedArmyId: parentArmy.id,
        selectedArmyIds: [parentArmy.id],
        history: [logMsg, ...s.history].slice(0, 50),
      };
    });
  }, []);

  return { state, selectProvince, selectArmy, endTurn, moveArmy, executeOffensive, recruitArmy, reinforceArmy, mergeSelectedArmies, disbandSelectedArmies, splitArmy, buildBuilding, updateAiConfig, confirmAiConfig };
}
