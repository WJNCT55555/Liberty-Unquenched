import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore, ReactNode } from 'react';
import { GameState, GameEvent } from './types';
import { initializeStartingCoalition, updatePartySupport, shouldQueueEvent } from './utils';
import { INITIAL_CARDS, INITIAL_EVENTS } from './data';
import { INITIAL_ADVISORS } from './advisors';
import { MILITARY_AFFAIRS } from './military_affairs';
import { JOURNAL_ENTRIES, getJournalEntryDef } from './journal';
import { INITIAL_PROVINCES, INITIAL_ARMIES, PROVINCE_ADJACENCY, getCombatWidth, isPortugalProvince, initializeMapState } from '../map/map_constants';
import { MapFaction, Army } from '../map/types_map';
import { calculateAiMoves } from '../map/lib/gameAi';
import { armyRecruitCost, getBuildingCost, reinforceCost, reinforceTarget } from '../map/rules/costs';
import { INITIAL_CLASSES, INITIAL_PARTY_RELATIONS, SCENARIO_1933_CLASSES, SCENARIO_1936_CLASSES } from './parties';
import { normalizeDomesticPolicyLawLevels } from './lawStances';
import { RESTORABLE_EVENTS } from './events';
import {
  deserializeGameState,
  writeAutosave,
  type SaveGameSnapshot,
} from './saveGame';
import { ECONOMIC_RULES } from './rules/economy';
import { calculateMonthlyIncome } from './rules/income';
import { calculateMonthlyPipeline, calculateMonthlyMapStage, applyMonthlyPoliticalMaintenance, calculateMonthlyEventQueue } from './rules/monthlyPipeline';
import { getDefaultOrganizationState, isOrganizationEstablished } from './organizations';
import type { GameAction } from './reducers/types';
export type { GameAction } from './reducers/types';
import { reduceEconomy } from './reducers/economyReducer';
import { reducePolitical } from './reducers/politicalReducer';
import { reduceMap, reduceMapWarAction } from './reducers/mapReducer';
import { reduceEvent } from './reducers/eventReducer';
import { reduceSave } from './reducers/saveReducer';
import { checkEndings } from './endings';
import { checkAchievements } from './achievements';

const initialJournalState = JOURNAL_ENTRIES.reduce((acc, entry) => {
  acc[entry.id] = { 
    id: entry.id, 
    status: 'inactive', 
    progress: 0,
    ...(entry.id === 'journal_land_reform' ? { failureProgress: 0 } : {})
  };
  return acc;
}, {} as Record<string, any>);

const getEventTriggerMode = (difficulty: GameState['difficulty']) =>
  difficulty === 'historical' ? 'historical' : 'nonHistorical';

function resolveBattle(
  armies: Army[],
  provinces: Record<string, any>,
  movedArmy: Army,
  targetProvinceId: string,
  isZh: boolean
): { updatedArmies: Army[]; updatedProvinces: Record<string, any>; messages: string[] } {
  const targetProvince = provinces[targetProvinceId];
  if (!targetProvince) {
    return { updatedArmies: armies, updatedProvinces: provinces, messages: [] };
  }
  const defenders = armies.filter(a => a.provinceId === targetProvinceId && a.faction !== movedArmy.faction);
  
  if (defenders.length === 0) {
    const updatedProvinces = {
      ...provinces,
      [targetProvinceId]: {
        ...targetProvince,
        owner: movedArmy.faction,
      }
    };
    const updatedArmies = armies.map(a => a.id === movedArmy.id ? { ...a, provinceId: targetProvinceId, movesLeft: Math.max(0, a.movesLeft - 1) } : a);
    const msg = isZh 
      ? `【移驻】${movedArmy.faction === MapFaction.REPUBLICAN ? '共和军' : '国民军'}占领了未设防的省份 ${targetProvince.name}。`
      : `${movedArmy.faction} army captured undefended province ${targetProvince.name}.`;
    return { updatedArmies, updatedProvinces, messages: [msg] };
  }

  const hasPortugalOrNeutral = movedArmy.faction === MapFaction.PORTUGAL || movedArmy.faction === MapFaction.NEUTRAL ||
                               defenders.some(d => d.faction === MapFaction.PORTUGAL || d.faction === MapFaction.NEUTRAL);
  if (hasPortugalOrNeutral) {
    return { updatedArmies: armies, updatedProvinces: provinces, messages: [] };
  }

  const defender = defenders[0];
  const attackerRoll = Math.floor(Math.random() * 9) + 1;
  const defenderRoll = Math.floor(Math.random() * 9) + 1;

  const terrain = targetProvince.terrain || 'plains';
  const fort = targetProvince.fortification || 0;

  let attackerTerrainMult = 1.0;
  let defenderTerrainMult = 1.0;
  let attackerTankMult = 1.0;

  if (terrain === 'mountains') {
    attackerTerrainMult -= 0.30;
    attackerTankMult = 0.4;
    defenderTerrainMult += 0.20 + (fort * 0.15);
  } else if (terrain === 'urban') {
    attackerTerrainMult -= 0.20;
    attackerTankMult = 0.6;
    defenderTerrainMult += 0.15 + (fort * 0.25);
  } else if (terrain === 'forest') {
    attackerTerrainMult -= 0.10;
    attackerTankMult = 0.8;
    defenderTerrainMult += 0.10 + (fort * 0.10);
  } else if (terrain === 'plains') {
    attackerTankMult = 1.35;
  }

  const attComp = movedArmy.composition;
  const defComp = defender.composition;

  const widthLimit = getCombatWidth(terrain as any || 'plains');

  const attackerFrontline = attComp.infantry + attComp.tanks;
  const attackerScale = attackerFrontline > widthLimit ? (widthLimit / attackerFrontline) : 1.0;
  const effectiveAttInf = attComp.infantry * attackerScale;
  const effectiveAttTank = attComp.tanks * attackerScale;

  const defenderFrontline = defComp.infantry + defComp.tanks;
  const defenderScale = defenderFrontline > widthLimit ? (widthLimit / defenderFrontline) : 1.0;
  const effectiveDefInf = defComp.infantry * defenderScale;
  const effectiveDefTank = defComp.tanks * defenderScale;

  const attInfPower = effectiveAttInf * 1.0 * (terrain === 'urban' ? 1.25 : 1.0);
  const attArtPower = attComp.artillery * 1.5;
  const attTankPower = effectiveAttTank * 2.0 * attackerTankMult;

  const defInfPower = effectiveDefInf * 1.0 * (terrain === 'urban' ? 1.3 : 1.15);
  const defArtPower = defComp.artillery * 1.5;
  const defTankPower = effectiveDefTank * 2.0 * (terrain === 'plains' ? 1.35 : terrain === 'mountains' ? 0.4 : 1.0);

  const attTotalBaseSupport = attInfPower + attArtPower + attTankPower;
  const defTotalBaseSupport = defInfPower + defArtPower + defTankPower;

  const attackerPower = attTotalBaseSupport * (1 + movedArmy.morale / 100) * (1 + movedArmy.militarization / 100) * (attackerRoll + 3) * attackerTerrainMult;
  const defenderPowerBase = defTotalBaseSupport * (1 + defender.morale / 100) * (1 + defender.militarization / 100) * (defenderRoll + 3) * defenderTerrainMult;
  const fortressLvl = targetProvince.buildings?.fortress || 0;
  const fortressCombatMult = 1.0 + (fortressLvl * 0.10);
  const defenderPower = defenderPowerBase * fortressCombatMult;

  const totalBaseLossAttacker = Math.floor(defenderPower * 0.08);
  const totalBaseLossDefender = Math.floor(attackerPower * 0.11);

  const attArtRatio = attComp.artillery / Math.max(1, movedArmy.manpower);
  const defArtRatio = defComp.artillery / Math.max(1, defender.manpower);

  const attackerLossReduction = Math.min(0.25, attArtRatio * 0.8);
  const defenderLossReduction = Math.min(0.25, defArtRatio * 0.8);

  let finalAttackerLosses = Math.max(100, Math.floor(totalBaseLossAttacker * (1 - attackerLossReduction)));
  let finalDefenderLosses = Math.max(100, Math.floor(totalBaseLossDefender * (1 - defenderLossReduction)));

  finalAttackerLosses = Math.min(movedArmy.manpower, finalAttackerLosses);
  finalDefenderLosses = Math.min(defender.manpower, finalDefenderLosses);

  const distributeLosses = (comp: { infantry: number; artillery: number; tanks: number }, totalLosses: number) => {
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

  const attackerLostRatio = finalAttackerLosses / Math.max(1, movedArmy.manpower);
  const defenderLostRatio = finalDefenderLosses / Math.max(1, defender.manpower);

  const attMoraleLoss = Math.floor(10 + attackerLostRatio * 100 + Math.max(0, defenderRoll - attackerRoll) * 3);
  const defMoraleLoss = Math.floor(15 + defenderLostRatio * 100 + Math.max(0, attackerRoll - defenderRoll) * 4);

  let finalAttackerArmy: Army | null = {
    ...movedArmy,
    composition: nextAttComp,
    manpower: nextAttManpower,
    morale: Math.max(10, movedArmy.morale - attMoraleLoss),
    movesLeft: 0,
  };
  if (finalAttackerArmy.manpower <= 150) {
    finalAttackerArmy = null;
  }

  let finalDefenderArmy: Army | null = {
    ...defender,
    composition: nextDefComp,
    manpower: nextDefManpower,
    morale: Math.max(10, defender.morale - defMoraleLoss),
  };
  if (finalDefenderArmy.manpower <= 150) {
    finalDefenderArmy = null;
  }

  const isVictory = defenderLostRatio >= attackerLostRatio;
  const resultText = isVictory 
    ? (isZh ? '进攻方胜利' : 'Attacker Victory') 
    : (isZh ? '守军平局/获胜' : 'Defender Stalemate/Victory');

  let defenderRetreated = false;
  let defenderAnnihilated = false;
  let retreatDestId = '';

  if (finalDefenderArmy) {
    if (isVictory || finalDefenderArmy.morale < 35) {
      const defenderNeighbors = PROVINCE_ADJACENCY[targetProvinceId] || [];
      const friendlyDestinations = defenderNeighbors.filter(pId => provinces[pId] && provinces[pId].owner === defender.faction);

      if (friendlyDestinations.length > 0) {
        retreatDestId = friendlyDestinations[0];
        finalDefenderArmy.provinceId = retreatDestId;
        finalDefenderArmy.morale = Math.max(10, finalDefenderArmy.morale - 10);
        finalDefenderArmy.movesLeft = 0;
        defenderRetreated = true;
      } else {
        finalDefenderArmy = null;
        defenderAnnihilated = true;
      }
    }
  }

  const messages: string[] = [];
  const terrainLabel = isZh 
    ? (terrain === 'mountains' ? '山地' : terrain === 'urban' ? '城市' : terrain === 'forest' ? '森林' : '平原')
    : terrain;

  messages.push(
    isZh 
      ? `【交战：${targetProvince.name}（${terrainLabel}）】 ${resultText}！` +
        `攻击方伤亡 ${finalAttackerLosses}人。` +
        `防守方伤亡 ${finalDefenderLosses}人。`
      : `BATTLE OF ${targetProvince.name.toUpperCase()} (${terrainLabel}): ${resultText}! ` +
        `Attacker (rolled ${attackerRoll}) lost ${finalAttackerLosses}. ` +
        `Defender (rolled ${defenderRoll}) lost ${finalDefenderLosses}.`
  );

  if (defenderRetreated) {
    const destName = provinces[retreatDestId]?.name || retreatDestId;
    messages.push(
      isZh 
        ? `【退却】防守方 Div. ${defender.id.slice(-4).toUpperCase()} 撤退至 ${destName}。`
        : `[🛡️ Organized Retreat] Defeated Div. ${defender.id.slice(-4).toUpperCase()} retreated to ${destName}.`
    );
  } else if (defenderAnnihilated) {
    messages.push(
      isZh 
        ? `【歼灭】防守方 Div. ${defender.id.slice(-4).toUpperCase()} 全军覆没！`
        : `[💥 Annihilation] Defeated Div. ${defender.id.slice(-4).toUpperCase()} was completely annihilated!`
    );
  }

  let updatedProvinces = { ...provinces };
  let finalArmies = armies.map(a => {
    if (a.id === movedArmy.id) {
      return finalAttackerArmy;
    }
    if (a.id === defender.id) {
      return finalDefenderArmy;
    }
    return a;
  }).filter((a): a is Army => a !== null);

  const defenderStillInProvince = finalArmies.some(a => a.id === defender.id && a.provinceId === targetProvinceId);
  if (!defenderStillInProvince && finalAttackerArmy) {
    finalArmies = finalArmies.map(a => a.id === movedArmy.id ? { ...a, provinceId: targetProvinceId } : a);
    updatedProvinces[targetProvinceId] = { ...targetProvince, owner: movedArmy.faction };
    messages.push(
      isZh 
        ? `【占领】突破成功，占领 ${targetProvince.name}！`
        : `${movedArmy.faction} forces achieved a decisive breakthrough and won ${targetProvince.name}.`
    );
  }

  return { updatedArmies: finalArmies, updatedProvinces, messages };
}

function checkWarStatus(state: GameState, isZh: boolean): GameState {
  if (state.activeWar === 'asturias_war') {
    const provinces = state.provinces || {};
    const armies = state.armies || [];
    
    // Check Workers' Alliance control
    const hasAsturias = provinces['asturias']?.owner === MapFaction.WORKERS_ALLIANCE;
    const hasOviedo = provinces['oviedo']?.owner === MapFaction.WORKERS_ALLIANCE;
    
    // Check if both are lost
    if (!hasAsturias && !hasOviedo) {
      // Defeat!
      const nextWars = { ...(state.wars || { spanish_civil_war: 'not_started', asturias_war: 'not_started' }) };
      nextWars.asturias_war = 'lost';

      return {
        ...state,
        activeWar: null,
        wars: nextWars,
        currentView: 'standard',
        phase: 'action'
      };
    }
    
    // Check if won: Workers' Alliance controls madrid, malaga, zaragoza, valencia
    const hasVictoryProvinces = 
      provinces['madrid']?.owner === MapFaction.WORKERS_ALLIANCE &&
      provinces['malaga']?.owner === MapFaction.WORKERS_ALLIANCE &&
      provinces['zaragoza']?.owner === MapFaction.WORKERS_ALLIANCE &&
      provinces['valencia']?.owner === MapFaction.WORKERS_ALLIANCE;
    
    if (hasVictoryProvinces) {
      // Victory!
      const nextWars = { ...(state.wars || { spanish_civil_war: 'not_started', asturias_war: 'not_started' }) };
      nextWars.asturias_war = 'won';
      
      const asturiasVictoryEvent: GameEvent = {
        id: 'asturias_war_victory',
        title: isZh ? '工人联盟自治政府胜利！' : 'Victory of Workers\' Alliance Government!',
        titleZh: '工人联盟自治政府胜利！',
        description: isZh 
          ? '这是一次震动全国的伟大无产阶级武装胜利！工人联盟自治政府不仅彻底击退了反动派守军，还稳固了对红色阿斯图里亚斯苏维埃的控制！全国工人阶级欢欣鼓舞，革命热情空前高涨！' 
          : 'A magnificent proletarian victory that shakes the entire nation! The Workers\' Alliance Autonomous Government successfully repelled the reactionary forces and secured red Asturias! The working class is exultant, and revolutionary fervor soars!',
        options: [
          {
            text: isZh ? '无产阶级红色政权万岁！' : 'Long live the Red Proletarian Power!',
            textZh: '无产阶级红色政权万岁！',
            effect: (s) => ({
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, (s.stats?.revolutionaryFervor ?? 10) + 25),
                republicanAuthority: Math.max(0, (s.stats?.republicanAuthority ?? 50) - 15)
              },
              armaments: s.armaments + 3,
              resources: s.resources + 2
            })
          }
        ]
      };
      
      return {
        ...state,
        activeWar: null,
        wars: nextWars,
        phase: 'event',
        currentView: 'standard',
        pendingEvents: [asturiasVictoryEvent, ...(state.pendingEvents || [])],
        currentEvent: asturiasVictoryEvent
      };
    }
  }
  return state;
}

function executeAiTurn(state: GameState, aiFaction: MapFaction, isZh: boolean): GameState {
  let tempState = { ...state };
  let mapResources = { ...tempState.mapResources };
  let provinces = { ...(tempState.provinces || INITIAL_PROVINCES) };
  let armies = [...(tempState.armies || INITIAL_ARMIES)];
  let history = [...(tempState.mapHistory || [])];

  // Set AI command points to 2 for the AI turn to let them make decisions!
  if (mapResources[aiFaction]) {
    mapResources[aiFaction] = {
      ...mapResources[aiFaction],
      commandPoints: 2,
    };
  }

  const aiState = {
    ...tempState,
    resources: mapResources,
    provinces,
    armies,
  } as any;

  // Let's get the difficulty. Difficulty from state could be easy, normal, hard, historical, sandbox.
  let diff: 'easy' | 'normal' | 'hard' = 'normal';
  if (state.difficulty === 'easy') diff = 'easy';
  else if (state.difficulty === 'hard') diff = 'hard';

  const aiActions = calculateAiMoves(aiState, aiFaction, diff);

  const factionNameZh = aiFaction === MapFaction.REPUBLICAN ? '共和国政府军' : '国民军';
  const factionNameEn = aiFaction === MapFaction.REPUBLICAN ? 'Republican' : 'Nationalist';

  aiActions.forEach(action => {
    if (action.type === 'BUILD') {
      const { provinceId, buildingType } = action.payload || {};
      if (!provinceId || !buildingType) return;
      const province = provinces[provinceId];
      const playerRes = mapResources[aiFaction];
      if (!province || !playerRes) return;

      const currentBuildings = province.buildings || { barracks: 0, fortress: 0, recruitingOffice: 0, ammoFactory: 0 };
      const currentLevel = currentBuildings[buildingType as keyof typeof currentBuildings] || 0;
      const nextLevel = currentLevel + 1;

      const cost = getBuildingCost(buildingType, nextLevel);

      if (
        playerRes.supplies >= cost.supplies &&
        playerRes.industrialCapacity >= cost.ic &&
        playerRes.manpower >= cost.manpower
      ) {
        mapResources[aiFaction] = {
          ...playerRes,
          supplies: Math.max(0, playerRes.supplies - cost.supplies),
          industrialCapacity: Math.max(0, playerRes.industrialCapacity - cost.ic),
          manpower: Math.max(0, playerRes.manpower - cost.manpower),
        };
        provinces[provinceId] = {
          ...province,
          buildings: {
            ...currentBuildings,
            [buildingType]: nextLevel,
          },
          ...(buildingType === 'fortress' ? { fortification: Math.min(3, nextLevel) } : {}),
        };
        const buildingName = isZh 
          ? (buildingType === 'barracks' ? '兵营' : buildingType === 'fortress' ? '要塞' : buildingType === 'recruitingOffice' ? '征兵处' : '弹药厂')
          : buildingType;
        history.push(
          isZh 
            ? `【AI建设】${factionNameZh}在 ${province.name} 建造了 ${buildingName}。`
            : `[AI Build] ${factionNameEn} built ${buildingName} in ${province.name}.`
        );
      }
    } else if (action.type === 'REINFORCE') {
      const { armyId } = action.payload || {};
      if (!armyId) return;
      const army = armies.find(a => a.id === armyId);
      const playerRes = mapResources[aiFaction];
      if (!army || !playerRes) return;

      const maxRestored = reinforceTarget(army);
      const maxInfRestored = maxRestored.infantry;
      const maxArtRestored = maxRestored.artillery;
      const maxTnkRestored = maxRestored.tanks;

      const totalMaxRestored = maxInfRestored + maxArtRestored + maxTnkRestored;
      let scale = 1.0;
      const targetManpower = totalMaxRestored;
      const targetCost = reinforceCost(maxRestored);
      const targetSupplies = targetCost.supplies;
      const targetIndustrial = targetCost.ic;
      const targetTankReserve = targetCost.tankReserve;

      if (targetManpower > 0) {
        if (playerRes.manpower < targetManpower) scale = Math.min(scale, playerRes.manpower / targetManpower);
        if (playerRes.supplies < targetSupplies) scale = Math.min(scale, playerRes.supplies / targetSupplies);
        if (playerRes.industrialCapacity < targetIndustrial) scale = Math.min(scale, playerRes.industrialCapacity / targetIndustrial);
        if (playerRes.tankReserve < targetTankReserve) scale = Math.min(scale, playerRes.tankReserve / targetTankReserve);
      }

      const actualInf = Math.floor(maxInfRestored * scale);
      const actualArt = Math.floor(maxArtRestored * scale);
      const actualTnk = Math.floor(maxTnkRestored * scale);
      const actualTotal = actualInf + actualArt + actualTnk;
      const actualCost = reinforceCost({ infantry: actualInf, artillery: actualArt, tanks: actualTnk });

      if (actualTotal > 0) {
        mapResources[aiFaction] = {
          ...playerRes,
          manpower: Math.max(0, playerRes.manpower - actualCost.manpower),
          supplies: Math.max(0, playerRes.supplies - actualCost.supplies),
          industrialCapacity: Math.max(0, playerRes.industrialCapacity - actualCost.ic),
          tankReserve: Math.max(0, playerRes.tankReserve - actualCost.tankReserve),
        };

        armies = armies.map(a => {
          if (a.id === armyId) {
            const nextComposition = {
              infantry: a.composition.infantry + actualInf,
              artillery: a.composition.artillery + actualArt,
              tanks: a.composition.tanks + actualTnk,
            };
            return {
              ...a,
              composition: nextComposition,
              manpower: nextComposition.infantry + nextComposition.artillery + nextComposition.tanks,
              morale: Math.min(100, a.morale + 20),
            };
          }
          return a;
        });

        history.push(
          isZh 
            ? `【AI整编】${factionNameZh}对 Division ${armyId.slice(-4).toUpperCase()} 补充了 ${actualTotal} 人。`
            : `[AI Reinforce] ${factionNameEn} reinforced Div. ${armyId.slice(-4).toUpperCase()} with ${actualTotal} soldiers.`
        );
      }
    } else if (action.type === 'RECRUIT') {
      const { provinceId, composition } = action.payload || {};
      if (!provinceId || !composition) return;
      const { infantry, artillery, tanks } = composition;
      const playerRes = mapResources[aiFaction];
      if (!playerRes) return;

      const recruitCost = armyRecruitCost({ infantry, artillery, tanks });
      const reqManpower = recruitCost.manpower;
      const reqSupplies = recruitCost.supplies;
      const reqIndustry = recruitCost.ic;
      const reqTankReserve = recruitCost.tankReserve;

      if (
        playerRes.manpower >= reqManpower &&
        playerRes.supplies >= reqSupplies &&
        playerRes.industrialCapacity >= reqIndustry &&
        playerRes.tankReserve >= reqTankReserve
      ) {
        mapResources[aiFaction] = {
          ...playerRes,
          manpower: Math.max(0, playerRes.manpower - reqManpower),
          supplies: Math.max(0, playerRes.supplies - reqSupplies),
          industrialCapacity: Math.max(0, playerRes.industrialCapacity - reqIndustry),
          tankReserve: Math.max(0, playerRes.tankReserve - reqTankReserve),
        };

        const newArmyId = `army_rec_${Date.now()}_ai_${Math.floor(Math.random() * 1000)}`;
        const newArmy: Army = {
          id: newArmyId,
          faction: aiFaction,
          provinceId,
          movesLeft: 0,
          manpower: reqManpower,
          maxManpower: reqManpower,
          composition: { infantry, artillery, tanks },
          designedComposition: { infantry, artillery, tanks },
          morale: 60,
          militarization: 10,
        };
        armies.push(newArmy);

        const provName = provinces[provinceId]?.name || provinceId;
        history.push(
          isZh 
            ? `【AI招募】${factionNameZh}在 ${provName} 组建了 Div. ${newArmyId.slice(-4).toUpperCase()}。`
            : `[AI Recruit] ${factionNameEn} raised Div. ${newArmyId.slice(-4).toUpperCase()} in ${provName}.`
        );
      }
    } else if (action.type === 'MOVE') {
      const { armyId, targetProvinceId } = action.payload || {};
      if (!armyId || !targetProvinceId) return;
      const movedArmy = armies.find(a => a.id === armyId);
      const playerRes = mapResources[aiFaction];
      if (!movedArmy || !playerRes) return;

      if (playerRes.commandPoints >= 1) {
        mapResources[aiFaction] = {
          ...playerRes,
          commandPoints: Math.max(0, playerRes.commandPoints - 1),
        };

        const res = resolveBattle(armies, provinces, movedArmy, targetProvinceId, isZh);
        armies = res.updatedArmies;
        provinces = res.updatedProvinces;
        if (res.messages && res.messages.length > 0) {
          history = [...res.messages, ...history];
        }
      }
    }
  });

  return {
    ...tempState,
    mapResources,
    provinces,
    armies,
    mapHistory: history,
  };
}

export const INITIAL_STATE: GameState = {
  screen: 'start',
  currentView: 'standard',
  provinces: INITIAL_PROVINCES,
  armies: INITIAL_ARMIES,
  mapSelectedProvinceId: null,
  mapSelectedArmyId: null,
  mapSelectedArmyIds: [],
  mapCurrentPlayer: MapFaction.REPUBLICAN,
  mapResources: {
    [MapFaction.REPUBLICAN]: { manpower: 15000, industrialCapacity: 100, commandPoints: 2, supplies: 8000, tankReserve: 10 },
    [MapFaction.NATIONALIST]: { manpower: 12000, industrialCapacity: 80, commandPoints: 2, supplies: 6000, tankReserve: 5 },
    [MapFaction.PORTUGAL]: { manpower: 5000, industrialCapacity: 30, commandPoints: 2, supplies: 3000, tankReserve: 0 },
    [MapFaction.WORKERS_ALLIANCE]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 },
    [MapFaction.NEUTRAL]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 },
    [MapFaction.UNITED_KINGDOM]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 },
    [MapFaction.ANDORRA]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 }
  },
  mapHistory: [],
  mapAiConfig: { enabled: true, aiFaction: MapFaction.NATIONALIST, difficulty: 'normal' },
  scenario: '1931',
  difficulty: 'normal',
  language: 'en',
  year: 1931,
  month: 4,
  phase: 'event',
  actionsLeft: 2,
  resources: 2,
  armaments: 1,
  dues: 2,
  fundraising_timer: 0,
  propaganda_timer: 0,
  propaganda_by_deed_timer: 0,
  mitin_popular_timer: 0,
  prrevs_campaign_timer: 0,
  organizations_timer: 0,
  international_relations_timer: 0,
  choose_enemies_timer: 0,
  inter_party_relationships_timer: 0,
  military_policy_timer: 0,
  agricultural_policy_timer: 0,
  labor_rights_timer: 0,
  labor_affairs_timer: 0,
  fiscal_policy_timer: 0,
  coupProgress: 0,
  economy_growth: ECONOMIC_RULES.defaults.growth,
  inflation_rate: ECONOMIC_RULES.defaults.inflation,
  unemployment_rate: 11.2,
  economyHistory: [
    { year: 1930, month: 10, growth: 2.1, inflation: 3.1, unemployment: 10.5 },
    { year: 1930, month: 11, growth: 2.3, inflation: 3.2, unemployment: 10.7 },
    { year: 1930, month: 12, growth: 2.2, inflation: 3.4, unemployment: 10.9 },
    { year: 1931, month: 1, growth: 2.4, inflation: 3.3, unemployment: 11.0 },
    { year: 1931, month: 2, growth: 2.5, inflation: 3.6, unemployment: 11.1 },
    { year: 1931, month: 3, growth: 2.5, inflation: 3.5, unemployment: 11.2 }
  ],
  budget: ECONOMIC_RULES.defaults.budget,
  tax_lower_class: ECONOMIC_RULES.defaults.lowerTax,
  tax_middle_class: ECONOMIC_RULES.defaults.middleTax,
  tax_upper_class: ECONOMIC_RULES.defaults.upperTax,
  tax_tariff: ECONOMIC_RULES.defaults.tariff,
  tax_consumption: ECONOMIC_RULES.defaults.consumptionTax,
  gold_reserves: ECONOMIC_RULES.defaults.goldReserves,
  foreign_exchange: ECONOMIC_RULES.defaults.foreignExchange,
  public_debt: ECONOMIC_RULES.defaults.debt,
  has_issued_war_bonds: false,
  military_spending: ECONOMIC_RULES.defaults.militarySpending,
  workersAllianceProgress: 0,
  cntVotingRate: 15,
  isPRRevSFormed: false,
  prrevs_formed_months: 0,
  prrevsConstructionLevel: 0,
  cntStance: 'oppose',
  sandboxCardChoiceEnabled: false,
  sandboxManualTaxAdjustmentEnabled: false,
  organizations: getDefaultOrganizationState('1931'),
  ateneos_established: 0,
  fijl_established: false,
  mujeres_libres_established: false,
  advisorActionTimer: 0,
  stats: {
    armyLoyalty: 60,
    tension: 34,
    workerControl: 10,
    anarchistMilitia: 0,
    republicanAuthority: 50,
    revolutionaryFervor: 10,
    bureaucratization: 0,
  },
  factions: {
    Treintistas: { influence: 10, dissent: 30 },
    Cenetistas: { influence: 35, dissent: 10 },
    Faistas: { influence: 45, dissent: 15 },
    Puristas: { influence: 10, dissent: 20 },
    Jabalistas: { influence: 0, dissent: 0 },
  },
  classes: INITIAL_CLASSES,
  armedForces: {
    regularArmy: { manpower: 100000, loyalty: 50 },
    guardiaNacional: { manpower: 30000, loyalty: 40 },
    guardiaAsalto: { manpower: 30000, loyalty: 70 },
    militias: {
      cntFai: 50000,
      maoc: 10000,
      poum: 5000,
      ugt: 20000,
      requete: 30000,
      falange: 10000,
      africaArmy: 40000,
    },
  },
  government: {
    type: 'Provisional Government',
    typeZh: '临时政府',
    president: 'Niceto Alcalá-Zamora',
    presidentZh: '尼塞托·阿尔卡拉-萨莫拉',
    primeMinister: 'Niceto Alcalá-Zamora',
    primeMinisterZh: '尼塞托·阿尔卡拉-萨莫拉',
  },
  partyRelations: INITIAL_PARTY_RELATIONS,
  domesticPolicy: {
    land_law: 0,
    public_order_law: 0,
    security_corps_law: 0,
    army_reform_law: 0,
    militia_legality_law: 0,
    land_reform_progress: 0,
    regional_autonomy_progress: 0,
    max_hours_law: 0,
    min_wage: 0,
    workplace_safety: 0,
    political_rights: 0,
    womens_rights: 0,
    religion_policy: 0,
    education_institutions: 0,
    language_policy: 0,
    union_status: 0,
    land_reform_law_enabled: false,
    mixed_jury_cnt_opposed: false,
  },
  relations: {
    uk: 50,
    usa: 50,
    france: 50,
    germany: 50,
    italy: 50,
    portugal: 50,
    ussr: 50,
    mexico: 50,
    internationalSocialists: 50,
    syndicalistParty: 0,
  },
  internationalBrigades: 0,
  internationalBrigadesFormed: false,
  militiaCombatPower: 100,
  tankResearchProgress: 0,
  tankResearchCompleted: false,
  aragonCouncilExists: false,
  aragonTimer: 0,
  militiaReorgTimer: 0,
  tankTimer: 0,
  civilWarStatus: 'not_started',
  activeWar: null,
  wars: {
    spanish_civil_war: 'not_started',
    asturias_war: 'not_started',
  },
  asturiasWarTurns: 0,
  forceAsturiasRevolutionNextMonth: false,
  leverage: 0,
  ministers: {
    labor: 'AP',
    health: 'AP',
    justice: 'AP',
    industry: 'AP',
    interior: 'AP',
    war: 'AP',
    agriculture: 'AP',
    finance: 'AP',
    estado: 'AP',
  },
  superEvent: null,
  pendingEvents: [],
  eventHistory: {
    triggered: [],
    resolved: [],
  },
  treintistasLeft: false,
  commercialized_propaganda: 0,
  campaign_propaganda: 0,
  ideological_propaganda: 0,
  radio: 0,
  cinema: 0,
  assassination_success_base: 65,
  assassination_training: {},
  assassination_training_general: 0,
  calvoSoteloStatus: 'alive',
  primoDeRiveraStatus: 'alive',
  ramiroLedesmaStatus: 'alive',
  zamoraStatus: 'alive',
  alfonsoXIIIStatus: 'alive',
  fe_leadership_crisis: false,
  socialism: 0,
  nationalism: 0,
  pacifism: 0,
  democratization: 0,
  pro_republic: 0,
  francoStatus: 'alive',
  africaArmyStatus: 'neutral',
  cataloniaControl: 'republic',
  navyStatus: 'neutral',
  moscowGoldTransferred: false,
  pceInPower: false,
  pceAcceptsComintern: false,
  militaryDeckEnabled: false,
  ps_founded: false,
  fe_founded: false,
  poum_founded: false,
  ceda_formed: false,
  ir_formed: false,
  ur_formed: false,
  falange_jons: false,
  isCasasViejasTriggered: false,
  isJabaliTriggered: false,
  isAndalusiaFireTriggered: false,
  uhp_attempt_triggered: false,
  uhp_journal_activated: false,
  alliance_obrera_activated: false,
  crossroads_uprising_alliance_decided: false,
  crossroads_choice: undefined,
  isRepublicanSocialistDissolved: false,
  isCedaRadicalDissolved: false,
  dissolutionCount: 0,
  impeachPresidentAvailable: false,
  isPresidentImpeached: false,
  coupSystemActive: false,
  molaStatus: 'republic',
  queipoStatus: 'republic',
  coupTriggered10: false,
  coupTriggered20: false,
  coupTriggered30: false,
  coupTriggered40: false,
  coupTriggered50: false,
  coupTriggered60: false,
  coupTriggered70: false,
  coupTriggered80: false,
  coupTriggered90: false,
  coupTriggered100: false,
  durrutiAlive: true,
  sanjurjoStatus: 'alive',
  francoAfricaControl: false,
  hasArmoredCars: false,
  womensRightsReformed: false,
  internationalBrigadesArrived: false,
  educationSecularized: false,
  journal_ramon_franco_presidency_seen: false,
  ramon_franco_campaign_count: 0,
  presidentElectionSeen: false,
  cntParticipatePresidential: false,
  presidentElectionLeftCandidate: null,
  presidentElectionActiveCandidate: null,
  presidentElectionRound: 1,
  campaignLobbyVisited: {
    lobby_psoe: false,
    lobby_erc: false,
    lobby_street: false,
    lobby_resources: false,
    lobby_r2_martinez_barrio_switch: false,
    lobby_r2_gil_robles_allies: false
  },
  covert_ops_france: 0,
  covert_ops_portugal: 0,
  regionalStatuses: {
    andalusia: 'direct',
    catalonia: 'direct',
    basque: 'direct',
    galicia: 'direct',
    asturias: 'direct',
  },
  isGameOver: false,
  ending: null,
  unlockedAchievementsThisRun: [],
  journal: initialJournalState,
  activeAdvisors: [null, null, null],
  advisorPool: INITIAL_ADVISORS.filter(a => a.id !== 'Ramón Franco' && a.id !== 'Pedro Vallina' && a.id !== 'Eduardo Barriobero'),
  currentEvent: null,
  easyUndoState: null,
  hand: [],
  actionDeck: INITIAL_CARDS.filter(c => c.type === 'Action'),
  governmentDeck: INITIAL_CARDS.filter(c => c.type === 'Government'),
  militaryDeck: INITIAL_CARDS.filter(c => c.type === 'Military'),
  discard: [],
  partySupport: {
    POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 0, PNV: 0, PRR: 0, DLR: 0, AP: 0, RE: 0, CT: 0, FE: 0, Other: 0, PRRevS: 0
  },
  lawStanceModifiers: [],
  activeCoalitions: [],
  rulingCoalition: null,
  coalitionHistory: [],
  governmentCrisis: null,
  governmentCrisisSequence: 0,
  earlyElectionInProgress: false,
  coalition_dissent: 0,
};

// Kept as a compatibility export for existing tests and integrations. The
// implementation lives in the pure rules/income calculator.
export { getMonthlyArmamentIncome } from './rules/income';

export interface GameContextType {
  state: GameState;
  dispatch: (action: GameAction) => void;
  loadSave: (snapshot: SaveGameSnapshot) => { ok: true } | { ok: false; error: string };
}

interface GameStore {
  getSnapshot: () => GameState;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: GameAction) => void;
  loadSave: (snapshot: SaveGameSnapshot) => { ok: true } | { ok: false; error: string };
}

const GameContext = createContext<GameStore | undefined>(undefined);

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  let newState = state;
  const reduceMapWar = (mapState: GameState, mapAction: GameAction) => reduceMapWarAction(mapState, mapAction, {
    resolveBattle,
    executeAiTurn,
    checkWarStatus,
  });
  switch (action.type) {
    case 'START_GAME': {
      let startYear = 1931;
      let startMonth = 4;
      let startCivilWarStatus: 'not_started' | 'ongoing' = 'not_started';
      let psFounded = false;
      let feFounded = false;
      
      let start_growth = 2.5;
      let start_inflation = 3.5;
      let start_unemployment = 11.2;
      let start_budget = 12.0;
      let start_gold = 2200;
      let start_fx = 180;
      let start_debt = 500;
      let start_has_bonds = false;
      let start_mil_spend = 15;
      let startCortes: Record<string, number> | undefined = undefined;


      let startMinisters: GameState['ministers'] = {
        labor: 'AP',
        health: 'AP',
        justice: 'AP',
        industry: 'AP',
        interior: 'AP',
        war: 'AP',
        agriculture: 'AP',
        finance: 'AP',
        estado: 'AP',
      };

      if (action.payload.scenario === '1931') {
        startMinisters = {
          labor: 'PSOE',
          health: 'PSOE',
          justice: 'PSOE',
          industry: 'Other',
          interior: 'DLR',
          agriculture: 'Other',
          finance: 'PSOE',
          estado: 'PRR',
          war: 'Other',
        };
        startYear = 1931;
        startMonth = 4;
        start_growth = 1.2;
        start_inflation = 1.4;
        start_unemployment = 14.5;
        start_budget = 10.0;
        start_gold = 2200;
        start_fx = 180;
        start_debt = 500;
        start_has_bonds = false;
        start_mil_spend = 15;
      } else if (action.payload.scenario === '1933') {
        startMinisters = {
          labor: 'PRR',
          health: 'PRR',
          justice: 'Other',
          industry: 'Other',
          interior: 'Other',
          war: 'PRR',
          agriculture: 'Other',
          finance: 'PRR',
          estado: 'Other',
        };
        startYear = 1933;
        startMonth = 11;
        feFounded = true;
        start_growth = 2.1;
        start_inflation = 2.5;
        start_unemployment = 18.2;
        start_budget = 8.0;
        start_gold = 2100;
        start_fx = 140;
        start_debt = 750;
        start_has_bonds = false;
        start_mil_spend = 12;
        startCortes = {
          AP: 115, PRR: 102, PSOE: 59, ERC: 17, RE: 14, CT: 20, FE: 1, IR: 5, UR: 1, PNV: 11, DLR: 0, POUM: 0, PCE: 1, PS: 0, Other: 124, PRRevS: 0
        };
      } else if (action.payload.scenario === '1936') {
        startMinisters = {
          labor: 'ERC',
          health: 'ERC',
          justice: 'UR',
          industry: 'Other',
          interior: 'Other',
          war: 'IR',
          agriculture: 'IR',
          finance: 'IR',
          estado: 'IR',
        };
        startYear = 1936;
        startMonth = 7;
        startCivilWarStatus = 'ongoing';
        psFounded = true;
        feFounded = true;
        start_growth = 3.5;
        start_inflation = 5.8;
        start_unemployment = 12.0;
        start_budget = 15.0;
        start_gold = 1800;
        start_fx = 90;
        start_debt = 1100;
        start_has_bonds = true;
        start_mil_spend = 40;
        startCortes = {
          PSOE: 99, IR: 87, UR: 37, ERC: 36, PCE: 17, POUM: 1, PS: 2, AP: 88, RE: 12, CT: 10, FE: 0, PRR: 5, PNV: 10, DLR: 0, Other: 66, PRRevS: 0
        };
      }

      let initialResources = 2;
      let initialArmaments = 1;
      if (action.payload.difficulty === 'easy' || action.payload.difficulty === 'sandbox') {
        initialResources = 3;
        initialArmaments = 2;
      }

      const startMapState = initializeMapState(action.payload.scenario, startCivilWarStatus);
      const startingDomesticPolicy = action.payload.scenario === '1931'
        ? {
            ...INITIAL_STATE.domesticPolicy,
            max_hours_law: 1,
            union_status: 1,
            political_rights: 1,
            militia_legality_law: 0,
          }
        : INITIAL_STATE.domesticPolicy;
      const startEventState = {
        ...INITIAL_STATE,
        domesticPolicy: startingDomesticPolicy,
        scenario: action.payload.scenario,
        difficulty: action.payload.difficulty,
        organizations: getDefaultOrganizationState(action.payload.scenario),
        year: startYear,
        month: startMonth,
        civilWarStatus: startCivilWarStatus,
        ...startMapState
      } as GameState;
      const startingEvents = INITIAL_EVENTS.filter(e => shouldQueueEvent(e, startEventState, {
        mode: getEventTriggerMode(action.payload.difficulty),
        date: { year: startYear, month: startMonth },
        pendingEvents: [],
        currentEvent: null,
        respectHistory: false,
      }));

       // Start charts at the scenario's first playable month. Older versions
       // synthesized six pre-start records, which made a 1931.4 start appear
       // to have January–March economic history that never occurred in-game.
       const initialHistory: GameState['economyHistory'] = [{
         year: startYear,
         month: startMonth,
         growth: start_growth,
         inflation: start_inflation,
         unemployment: start_unemployment,
       }];

      newState = { 
        ...INITIAL_STATE, 
        domesticPolicy: { ...startingDomesticPolicy },
        classes: action.payload.scenario === '1936' ? SCENARIO_1936_CLASSES : (action.payload.scenario === '1933' ? SCENARIO_1933_CLASSES : INITIAL_CLASSES),
        cortes: startCortes as any,
        ministers: startMinisters,
        language: state.language, 
        screen: 'game',
        scenario: action.payload.scenario,
        difficulty: action.payload.difficulty,
        resources: initialResources,
        armaments: initialArmaments,
        year: startYear,
        month: startMonth,
        ps_founded: psFounded,
        fe_founded: feFounded,
        poum_founded: action.payload.scenario === '1936',
        ceda_formed: action.payload.scenario !== '1931',
        ir_formed: action.payload.scenario === '1936',
        ur_formed: action.payload.scenario === '1936',
        civilWarStatus: startCivilWarStatus,
        isCasasViejasTriggered: action.payload.scenario === '1933' || action.payload.scenario === '1936',
        isJabaliTriggered: false,
        isRepublicanSocialistDissolved: action.payload.scenario === '1933' || action.payload.scenario === '1936',
        isCedaRadicalDissolved: action.payload.scenario === '1936',
        dissolutionCount: action.payload.scenario === '1936' ? 2 : (action.payload.scenario === '1933' ? 1 : 0),
        impeachPresidentAvailable: action.payload.scenario === '1936',
        isPresidentImpeached: action.payload.scenario === '1936', // In July 1936, the impeachment has already completed and Azaña is president
        presidentElectionSeen: action.payload.scenario === '1936',
        government: {
          type: action.payload.scenario === '1936' ? 'Popular Front Cabinet' : (action.payload.scenario === '1933' ? 'Radical-CEDA Coalition' : 'Provisional Government'),
          typeZh: action.payload.scenario === '1936' ? '人民阵线内阁' : (action.payload.scenario === '1933' ? '激进党-CEDA联合政府' : '临时政府'),
          president: action.payload.scenario === '1936' ? 'Manuel Azaña' : 'Niceto Alcalá-Zamora',
          presidentZh: action.payload.scenario === '1936' ? '曼努埃尔·阿萨尼亚' : '尼塞托·阿尔卡拉-萨莫拉',
          primeMinister: action.payload.scenario === '1936' ? 'Santiago Casares Quiroga' : (action.payload.scenario === '1933' ? 'Alejandro Lerroux' : 'Niceto Alcalá-Zamora'),
          primeMinisterZh: action.payload.scenario === '1936' ? '圣地亚哥·卡萨雷斯·基罗加' : (action.payload.scenario === '1933' ? '亚历杭德罗·勒鲁' : '尼塞托·阿尔卡拉-萨莫拉'),
        },
        coupSystemActive: action.payload.scenario === '1933' || action.payload.scenario === '1936',
        ...initializeMapState(action.payload.scenario, startCivilWarStatus),
        mapSelectedProvinceId: null,
        mapSelectedArmyId: null,
        mapSelectedArmyIds: [],
        currentView: 'standard',
        pendingEvents: startingEvents,
        superEvent: action.payload.scenario === '1931' ? 'abdication_alfonso' : (action.payload.scenario === '1936' ? 'spanish_civil_war' : null),
        economy_growth: start_growth,
        inflation_rate: start_inflation,
        unemployment_rate: start_unemployment,
        economyHistory: initialHistory,
        budget: start_budget,
        gold_reserves: start_gold,
        foreign_exchange: start_fx,
        public_debt: start_debt,
        has_issued_war_bonds: start_has_bonds,
        military_spending: start_mil_spend,
        fijl_established: action.payload.scenario === '1933' || action.payload.scenario === '1936',
        mujeres_libres_established: action.payload.scenario === '1936',
        militaryDeckEnabled: action.payload.scenario === '1936',
        organizations: getDefaultOrganizationState(action.payload.scenario),
        regionalStatuses: {
          andalusia: 'direct',
          catalonia: (action.payload.scenario === '1933' || action.payload.scenario === '1936') ? 'autonomy' : 'direct',
          basque: 'direct',
          galicia: 'direct',
          asturias: 'direct',
        },
      };
      newState = initializeStartingCoalition(newState);
      break;
    }
    case 'RETURN_TO_START':
    case 'LOAD_STATE':
      newState = reduceSave(state, action) || state;
      break;
    case 'SET_LANGUAGE':
    case 'DEBUG_TRIGGER_ENDING':
    case 'SANDBOX_EDIT':
    case 'SET_REGIONAL_STATUS':
      newState = reducePolitical(state, action) || state;
      break;
    case 'UPDATE_TAXES':
    case 'SELL_GOLD_FOR_FX':
    case 'ISSUE_WAR_BONDS':
    case 'BUY_RESOURCES_URGENT':
      newState = reduceEconomy(state, action) || state;
      break;
    case 'TOGGLE_MAP_VIEW':
    case 'SELECT_MAP_PROVINCE':
    case 'SELECT_MAP_ARMY':
      newState = reduceMap(state, action) || state;
      break;
    case 'MOVE_MAP_ARMY': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'END_MAP_PLAYER_TURN': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'RECRUIT_MAP_ARMY': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'REINFORCE_MAP_ARMY': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'MERGE_MAP_ARMIES': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'DISBAND_MAP_ARMIES': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'SPLIT_MAP_ARMY': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'BUILD_MAP_BUILDING': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'NEXT_PHASE': {
      const isZh = state.language === 'zh';
      if (state.phase === 'event') {
        newState = { ...state, phase: 'action', actionsLeft: 2 };
      } else if (state.phase === 'action' && (state.civilWarStatus === 'ongoing' || state.activeWar)) {
        newState = { ...state, phase: 'war', currentView: 'map' };
      } else {
        // Next month
        let nextMonth = state.month + 1;
        let nextYear = state.year;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }
        
        // Discard remaining hand at end of turn
        const newDiscard = [...state.discard, ...state.hand];
        
        // Calculate periodic income through the shared, pure rules source.
        // CNT clandestine armaments remain independent from national military spending.
        const monthlyIncome = calculateMonthlyIncome(state, nextMonth);
        
        // International Brigades Logic
        let newIntBrigades = state.internationalBrigades;
        let newIntBrigadesFormed = state.internationalBrigadesFormed;

        if (state.civilWarStatus !== 'not_started' && state.relations.internationalSocialists > 60) {
          newIntBrigadesFormed = true;
        }

        if (newIntBrigadesFormed) {
          let baseIncrease = 1000;
          if (state.difficulty === 'easy' || state.difficulty === 'sandbox') baseIncrease = 2000;
          else if (state.difficulty === 'hard') baseIncrease = 500;

          let bonusIncrease = 0;
          if (state.relations.internationalSocialists > 80) bonusIncrease = 750;
          else if (state.relations.internationalSocialists > 60) bonusIncrease = 250;

          newIntBrigades += baseIncrease + bonusIncrease;
        }
        
        let newPendingEvents = [...state.pendingEvents];
        let newSuperEvent = state.superEvent;
        let newCivilWarStatus = state.civilWarStatus;

        // Check Civil War Trigger
        if (newCivilWarStatus === 'not_started') {
          const isHistoricalTrigger = state.difficulty === 'historical'
            && nextYear === 1936
            && nextMonth === 7;
          
          if (isHistoricalTrigger) {
            newSuperEvent = 'spanish_civil_war';
          }
        }

        const monthlyMapStage = calculateMonthlyMapStage(state);

        let tempState: GameState = {
          ...state,
          month: nextMonth,
          year: nextYear,
          civilWarStatus: newCivilWarStatus,
          resources: state.resources + monthlyIncome.resources,
          armaments: state.armaments + monthlyIncome.armaments,
          internationalBrigades: newIntBrigades,
          internationalBrigadesFormed: newIntBrigadesFormed,
          prrevs_formed_months: isOrganizationEstablished(state, 'PRRevS') ? state.prrevs_formed_months + 1 : 0,
          mapResources: monthlyMapStage.mapResources,
          armies: monthlyMapStage.armies,
          mapCurrentPlayer: monthlyMapStage.mapCurrentPlayer,
          asturiasWarTurns: monthlyMapStage.asturiasWarTurns,
        };

        // National accounting is a pure, shared pipeline. Journal effects and
        // phase/timer orchestration remain in this reducer.
        const monthlyPipeline = calculateMonthlyPipeline(tempState);
        const economy = monthlyPipeline.economy;
        tempState = monthlyPipeline.state;
        const updatedHistory = [
          ...(state.economyHistory || []),
          {
            year: tempState.year,
            month: tempState.month,
            growth: tempState.economy_growth,
            inflation: tempState.inflation_rate,
            unemployment: tempState.unemployment_rate
          }
        ].slice(-24);
        tempState = {
          ...tempState,
          economyHistory: updatedHistory
        };

        let newJournal = JSON.parse(JSON.stringify(state.journal || {}));

        Object.keys(newJournal).forEach(journalId => {
          const entryState = newJournal[journalId];
          const def = getJournalEntryDef(journalId);
          if (def && entryState.status === 'active' && def.activeEffect?.apply) {
             const effectResult = def.activeEffect.apply(tempState);
             tempState = { ...tempState, ...effectResult };
          }
        });

        // Check failure progress for land reform: if no progress is made from previous month, increase failureProgress by 1% (1)
        const landReformEntry = newJournal['journal_land_reform'];
        if (landReformEntry && state.journal['journal_land_reform']?.status === 'active') {
          const prevProgress = state.domesticPolicy.land_reform_progress;
          const nextProgress = tempState.domesticPolicy.land_reform_progress;
          if (nextProgress <= prevProgress) {
            landReformEntry.failureProgress = Math.min(100, (landReformEntry.failureProgress || 0) + 1);
          }
        }

        Object.keys(newJournal).forEach(journalId => {
          const entryState = newJournal[journalId];
          const def = getJournalEntryDef(journalId);
          if (def && def.checkStatus) {
            const newStatus = def.checkStatus(tempState, entryState);
            if (newStatus && newStatus !== entryState.status) {
              entryState.status = newStatus;
              if (newStatus === 'completed' && def.onComplete) {
                const effectResult = def.onComplete(tempState);
                tempState = { ...tempState, ...effectResult };
              } else if (newStatus === 'failed' && def.onFail) {
                const effectResult = def.onFail(tempState);
                tempState = { ...tempState, ...effectResult };
              }
            }
          }
        });

        // --- Core Political Party Alliance System Monthly Processing ---
        tempState = applyMonthlyPoliticalMaintenance(tempState);

        // Event conditions observe the fully updated next-month state, including
        // coalition maintenance and any newly created government crisis.
        newPendingEvents = calculateMonthlyEventQueue(state, tempState, nextYear, nextMonth);

        let finalProvinces = tempState.provinces || state.provinces || INITIAL_PROVINCES;
        let finalArmies = tempState.armies || state.armies || INITIAL_ARMIES;

        newState = {
          ...state,
          ...tempState,
          provinces: finalProvinces,
          armies: finalArmies,
          phase: 'event',
          currentView: 'standard',
          actionsLeft: 0,
          journal: newJournal,
          fundraising_timer: Math.max(0, state.fundraising_timer - 1),
          mitin_popular_timer: Math.max(0, (state.mitin_popular_timer || 0) - 1),
          prrevs_campaign_timer: Math.max(0, (state.prrevs_campaign_timer || 0) - 1),
          organizations_timer: Math.max(0, state.organizations_timer - 1),
          international_relations_timer: Math.max(0, state.international_relations_timer - 1),
          choose_enemies_timer: Math.max(0, state.choose_enemies_timer - 1),
          inter_party_relationships_timer: Math.max(0, state.inter_party_relationships_timer - 1),
          military_policy_timer: Math.max(0, state.military_policy_timer - 1),
          agricultural_policy_timer: Math.max(0, (state.agricultural_policy_timer || 0) - 1),
          labor_rights_timer: Math.max(0, (state.labor_rights_timer || 0) - 1),
          labor_affairs_timer: Math.max(0, (state.labor_affairs_timer || 0) - 1),
          fiscal_policy_timer: Math.max(0, (state.fiscal_policy_timer || 0) - 1),
          advisorActionTimer: Math.max(0, state.advisorActionTimer - 1),
          aragonTimer: Math.max(0, state.aragonTimer - 1),
          militiaReorgTimer: Math.max(0, state.militiaReorgTimer - 1),
          tankTimer: Math.max(0, state.tankTimer - 1),
          propaganda_timer: Math.max(0, state.propaganda_timer - 1),
          propaganda_by_deed_timer: Math.max(0, state.propaganda_by_deed_timer - 1),
          internationalBrigades: newIntBrigades,
          internationalBrigadesFormed: newIntBrigadesFormed,
          superEvent: newSuperEvent,
          pendingEvents: newPendingEvents,
          civilWarStatus: newCivilWarStatus,
          hand: [],
          discard: newDiscard,
          forceAsturiasRevolutionNextMonth: false,
        };
      }
      newState = checkWarStatus(newState, isZh);
      break;
    }
    case 'PLAY_CARD':
      newState = reduceEvent(state, action) || state;
      break;
    case 'DISMISS_SUPER_EVENT':
      newState = reduceEvent(state, action) || state;
      break;
    case 'SELECT_EVENT':
      newState = reduceEvent(state, action) || state;
      break;
    case 'RESOLVE_EVENT':
      newState = reduceEvent(state, action) || state;
      break;
    case 'ADD_ADVISOR':
      newState = reduceEvent(state, action) || state;
      break;
    case 'REMOVE_ADVISOR':
      newState = reduceEvent(state, action) || state;
      break;
    case 'DRAW_CARD': {
      newState = reduceEvent(state, action) || state;
      break;
    }
    case 'DRAW_SPECIFIC_CARD': {
      newState = reduceEvent(state, action) || state;
      break;
    }
    case 'CHECK_EVENT': {
      newState = reduceEvent(state, action) || state;
      break;
    }
    default:
      newState = state;
  }
  
  // Normalize values to prevent overflow/underflow (0-100)
  if (newState !== state) {
    if (newState.domesticPolicy) {
      // Law levels use their own L0-L3/L4 scales. Journal progress fields,
      // including land_reform_progress, remain independent 0-100 values.
      newState.domesticPolicy = normalizeDomesticPolicyLawLevels(newState.domesticPolicy);
    }
    if (!newState.wars) {
      newState.wars = {
        spanish_civil_war: 'not_started',
        asturias_war: 'not_started'
      };
    }
    if (newState.civilWarStatus === 'ongoing') {
      if (newState.wars.spanish_civil_war !== 'ongoing') {
        newState.wars.spanish_civil_war = 'ongoing';
      }
      if (!newState.activeWar) {
        newState.activeWar = 'spanish_civil_war';
      }
    } else if (newState.civilWarStatus === 'won' || newState.civilWarStatus === 'lost') {
      newState.wars.spanish_civil_war = newState.civilWarStatus;
      if (newState.activeWar === 'spanish_civil_war') {
        newState.activeWar = null;
      }
    }

    if (newState.classes) {
      Object.keys(newState.classes).forEach(c => {
        const cls = c as keyof typeof newState.classes;
        if (newState.classes[cls] && newState.classes[cls].support) {
          Object.keys(newState.classes[cls].support).forEach(p => {
            const party = p as keyof typeof newState.classes[typeof cls]['support'];
            newState.classes[cls].support[party] = Math.max(0, Math.min(100, newState.classes[cls].support[party]));
          });
        }
      });
      newState.partySupport = updatePartySupport(newState);
    }
    if (newState.stats) {
      Object.keys(newState.stats).forEach(s => {
        const stat = s as keyof typeof newState.stats;
        newState.stats[stat] = Math.max(0, Math.min(100, newState.stats[stat]));
      });
    }
    if (newState.factions) {
      Object.keys(newState.factions).forEach(f => {
        const faction = f as keyof typeof newState.factions;
        newState.factions[faction].influence = Math.max(0, Math.min(100, newState.factions[faction].influence));
        newState.factions[faction].dissent = Math.max(0, Math.min(100, newState.factions[faction].dissent));
      });
    }
    if (newState.relations) {
      Object.keys(newState.relations).forEach(r => {
        const rel = r as keyof typeof newState.relations;
        if (typeof newState.relations[rel] === 'number') {
          newState.relations[rel] = Math.max(0, Math.min(100, newState.relations[rel] as number));
        }
      });
    }
    if (newState.armedForces) {
      if (newState.armedForces.regularArmy) {
        newState.armedForces.regularArmy.loyalty = Math.max(0, Math.min(100, newState.armedForces.regularArmy.loyalty));
      }
      if (newState.armedForces.guardiaNacional) {
        newState.armedForces.guardiaNacional.loyalty = Math.max(0, Math.min(100, newState.armedForces.guardiaNacional.loyalty));
      }
      if (newState.armedForces.guardiaAsalto) {
        newState.armedForces.guardiaAsalto.loyalty = Math.max(0, Math.min(100, newState.armedForces.guardiaAsalto.loyalty));
      }
    }
    
    // Dynamically calculate tension
    if (newState.stats) {
      const { republicanAuthority, armyLoyalty, revolutionaryFervor } = newState.stats;
      newState.stats.tension = Math.max(0, Math.min(100, 
        (100 - republicanAuthority) * 0.3 + 
        (100 - armyLoyalty) * 0.4 + 
        revolutionaryFervor * 0.3
      ));
    }

    // Force coupProgress to 0 if the system is inactive
    if (!newState.coupSystemActive) {
      newState.coupProgress = 0;
    } else {
      // Level 10: 暗流未息
      if (newState.coupProgress >= 10 && !newState.coupTriggered10) {
        newState.coupTriggered10 = true;
      }
      // Level 20: 阴谋之网
      if (newState.coupProgress >= 20 && !newState.coupTriggered20) {
        newState.coupTriggered20 = true;
      }
      // Level 30: 莫拉登场
      if (newState.coupProgress >= 30 && !newState.coupTriggered30) {
        newState.coupTriggered30 = true;
        if (newState.armedForces && newState.armedForces.regularArmy) {
          newState.armedForces.regularArmy.loyalty = Math.max(0, newState.armedForces.regularArmy.loyalty - 3);
        }
        newState.molaStatus = 'nationalist';
      }
      // Level 40: 密令扩散
      if (newState.coupProgress >= 40 && !newState.coupTriggered40) {
        newState.coupTriggered40 = true;
        if (newState.armedForces && newState.armedForces.regularArmy) {
          newState.armedForces.regularArmy.loyalty = Math.max(0, newState.armedForces.regularArmy.loyalty - 10);
        }
      }
      // Level 50: 非洲军团
      if (newState.coupProgress >= 50 && !newState.coupTriggered50) {
        newState.coupTriggered50 = true;
        newState.africaArmyStatus = 'nationalist';
      }
      // Level 60: 凯波入局
      if (newState.coupProgress >= 60 && !newState.coupTriggered60) {
        newState.coupTriggered60 = true;
        // A dead Queipo de Llano cannot join the conspiracy; the level's effect is skipped.
        if (newState.queipoStatus !== 'dead') {
          newState.queipoStatus = 'nationalist';
        }
      }
      // Level 70: 外援暗流
      if (newState.coupProgress >= 70 && !newState.coupTriggered70) {
        newState.coupTriggered70 = true;
        if (newState.relations) {
          newState.relations.germany = Math.max(0, newState.relations.germany - 5);
          newState.relations.italy = Math.max(0, newState.relations.italy - 5);
        }
      }
      // Level 80: 佛朗哥倒戈
      if (newState.coupProgress >= 80 && !newState.coupTriggered80) {
        newState.coupTriggered80 = true;
        // A dead Franco cannot defect; the whole level effect is skipped.
        if (newState.francoStatus !== 'dead') {
          if (newState.armedForces && newState.armedForces.regularArmy) {
            newState.armedForces.regularArmy.loyalty = Math.max(0, newState.armedForces.regularArmy.loyalty - 5);
          }
          newState.francoStatus = 'nationalist';
        }
      }
      // Level 90: 箭在弦上
      if (newState.coupProgress >= 90 && !newState.coupTriggered90) {
        newState.coupTriggered90 = true;
        if (newState.armedForces) {
          if (newState.armedForces.regularArmy) {
            newState.armedForces.regularArmy.loyalty = Math.max(0, newState.armedForces.regularArmy.loyalty - 3);
          }
          if (newState.armedForces.guardiaNacional) {
            newState.armedForces.guardiaNacional.loyalty = Math.max(0, newState.armedForces.guardiaNacional.loyalty - 3);
          }
          if (newState.armedForces.guardiaAsalto) {
            newState.armedForces.guardiaAsalto.loyalty = Math.max(0, newState.armedForces.guardiaAsalto.loyalty - 3);
          }
        }
      }
      // Level 100: 国民军叛乱爆发
      if (newState.coupProgress >= 100 && !newState.coupTriggered100) {
        newState.coupTriggered100 = true;
        newState.superEvent = 'spanish_civil_war';
      }
    }
  }

  const stateWithEndings = checkEndings(newState);
  return checkAchievements(stateWithEndings);
};

const createGameStore = (): GameStore => {
  let currentState = INITIAL_STATE;
  const listeners = new Set<() => void>();

  const dispatch = (action: GameAction) => {
    const nextState = gameReducer(currentState, action);
    if (nextState === currentState) return;
    currentState = nextState;
    listeners.forEach(listener => listener());
  };

  const loadSave: GameStore['loadSave'] = (snapshot) => {
    try {
      const restoredState = deserializeGameState(snapshot, {
        cards: INITIAL_CARDS,
        advisors: INITIAL_ADVISORS,
        events: RESTORABLE_EVENTS,
      });
      dispatch({ type: 'LOAD_STATE', payload: restoredState });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown save-game error.';
      console.error('Failed to load save game:', error);
      return { ok: false, error: message };
    }
  };

  return {
    getSnapshot: () => currentState,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch,
    loadSave,
  };
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<GameStore | null>(null);
  if (!storeRef.current) storeRef.current = createGameStore();
  const store = storeRef.current;
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  // Event progression and autosave observe only the snapshots they need. The
  // store itself stays stable, so provider consumers no longer re-render when
  // the provider value object changes identity on every action.
  useEffect(() => {
    if (state.phase === 'event' && !state.currentEvent) {
      store.dispatch({ type: 'CHECK_EVENT' });
    }
  }, [store, state.phase, state.month, state.year, state.currentEvent]);

  useEffect(() => {
    if (state.screen !== 'game') return;
    const autosaveTimer = window.setTimeout(() => {
      try {
        writeAutosave(state);
      } catch (error) {
        console.error('Failed to write autosave:', error);
      }
    }, 500);
    return () => window.clearTimeout(autosaveTimer);
  }, [state]);

  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
};

const useGameStore = () => {
  const store = useContext(GameContext);
  if (!store) throw new Error('useGame hooks must be used within a GameProvider');
  return store;
};

export const shallowEqual = <T extends Record<string, unknown>>(left: T, right: T) => {
  if (Object.is(left, right)) return true;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(key => Object.is(left[key], right[key]));
};

export const useGameSelector = <Selected,>(selector: (state: GameState) => Selected, equality: (left: Selected, right: Selected) => boolean = Object.is) => {
  const store = useGameStore();
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equality);
  selectorRef.current = selector;
  equalityRef.current = equality;
  const selectedRef = useRef<{ snapshot: GameState; value: Selected } | null>(null);
  const getSelectedSnapshot = useCallback(() => {
    const snapshot = store.getSnapshot();
    const previous = selectedRef.current;
    if (previous?.snapshot === snapshot) return previous.value;
    const nextValue = selectorRef.current(snapshot);
    if (previous && equalityRef.current(previous.value, nextValue)) {
      selectedRef.current = { snapshot, value: previous.value };
      return previous.value;
    }
    selectedRef.current = { snapshot, value: nextValue };
    return nextValue;
  }, [store]);
  return useSyncExternalStore(store.subscribe, getSelectedSnapshot, getSelectedSnapshot);
};

export const useGameActions = (): Pick<GameContextType, 'dispatch' | 'loadSave'> => {
  const store = useGameStore();
  return useMemo(() => ({ dispatch: store.dispatch, loadSave: store.loadSave }), [store]);
};

export const selectEconomyState = (state: GameState) => ({
  budget: state.budget,
  resources: state.resources,
  armaments: state.armaments,
  gold_reserves: state.gold_reserves,
  foreign_exchange: state.foreign_exchange,
  public_debt: state.public_debt,
  military_spending: state.military_spending,
  economy_growth: state.economy_growth,
  inflation_rate: state.inflation_rate,
  unemployment_rate: state.unemployment_rate,
});

export const selectPoliticalState = (state: GameState) => {
  const rulingCoalition = state.rulingCoalition;
  return {
    language: state.language,
    government: state.government,
    domesticPolicy: state.domesticPolicy,
    factions: state.factions,
    partySupport: state.partySupport,
    activeCoalitions: state.activeCoalitions,
    rulingCoalition,
    governmentCrisis: state.governmentCrisis,
    organizations: state.organizations,
  };
};

export const selectEventState = (state: GameState) => ({
  language: state.language,
  phase: state.phase,
  currentEvent: state.currentEvent,
  pendingEvents: state.pendingEvents,
  superEvent: state.superEvent,
  hand: state.hand,
  discard: state.discard,
  activeAdvisors: state.activeAdvisors,
  advisorPool: state.advisorPool,
});

export const selectMapState = (state: GameState) => ({
  language: state.language,
  phase: state.phase,
  year: state.year,
  month: state.month,
  currentView: state.currentView,
  provinces: state.provinces,
  armies: state.armies,
  mapHistory: state.mapHistory,
  mapAiConfig: state.mapAiConfig,
  mapResources: state.mapResources,
  mapCurrentPlayer: state.mapCurrentPlayer,
  mapSelectedProvinceId: state.mapSelectedProvinceId,
  mapSelectedArmyId: state.mapSelectedArmyId,
  mapSelectedArmyIds: state.mapSelectedArmyIds,
  activeWar: state.activeWar,
});

export const selectSaveState = (state: GameState) => ({
  screen: state.screen,
  year: state.year,
  month: state.month,
  scenario: state.scenario,
  difficulty: state.difficulty,
  eventHistory: state.eventHistory,
});

export const useEconomyState = () => useGameSelector(selectEconomyState, shallowEqual);
export const usePoliticalState = () => useGameSelector(selectPoliticalState, shallowEqual);
export const useEventState = () => useGameSelector(selectEventState, shallowEqual);
export const useMapState = () => useGameSelector(selectMapState, shallowEqual);
export const useSaveState = () => useGameSelector(selectSaveState, shallowEqual);

/** Compatibility API for existing screens. New code should select a domain slice. */
export const useGame = (): GameContextType => {
  const state = useGameSelector(snapshot => snapshot);
  const { dispatch, loadSave } = useGameActions();
  return useMemo(() => ({ state, dispatch, loadSave }), [state, dispatch, loadSave]);
};
