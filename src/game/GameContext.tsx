import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GameState, Card, Advisor, GameEvent, EventHistory } from './types';
import { initializeStartingCoalition, updatePartySupport, updateCoalitions, checkCoalitionDissolve, autoFormCoalitionIfNeeded } from './utils/coalition';
import { INITIAL_CARDS, INITIAL_EVENTS } from './data';
import { INITIAL_ADVISORS } from './advisors';
import { MILITARY_AFFAIRS } from './military_affairs';
import { JOURNAL_ENTRIES, getJournalEntryDef } from './journal';
import { INITIAL_PROVINCES, INITIAL_ARMIES, PROVINCE_ADJACENCY, getCombatWidth, isPortugalProvince, initializeMapState } from '../map/map_constants';
import { MapFaction, Army, ResourceSet } from '../map/types_map';
import { calculateAiMoves } from '../map/lib/gameAi';
import { civilWarSetup } from './events/civil_war/civil_war_setup';
import { adjustClassSupport, shouldQueueEvent } from './utils';
import { INITIAL_CLASSES, INITIAL_PARTY_RELATIONS, SCENARIO_1933_CLASSES, SCENARIO_1936_CLASSES } from './parties';

const initialJournalState = JOURNAL_ENTRIES.reduce((acc, entry) => {
  acc[entry.id] = { 
    id: entry.id, 
    status: 'inactive', 
    progress: 0,
    ...(entry.id === 'journal_land_reform' ? { failureProgress: 0 } : {})
  };
  return acc;
}, {} as Record<string, any>);

const createEmptyEventHistory = (): EventHistory => ({
  triggered: [],
  resolved: [],
});

const appendEventHistoryId = (
  history: EventHistory | undefined,
  bucket: keyof EventHistory,
  eventId?: string | null
): EventHistory => {
  const base = history || createEmptyEventHistory();
  if (!eventId || base[bucket].includes(eventId)) {
    return base;
  }

  return {
    ...base,
    [bucket]: [...base[bucket], eventId],
  };
};

const isBeforeYearMonth = (date: { year: number; month: number }, year: number, month: number) =>
  date.year < year || (date.year === year && date.month < month);

const createLegacySaveEventHistory = (state: Pick<GameState, 'year' | 'month'>): EventHistory => ({
  triggered: [],
  resolved: INITIAL_EVENTS
    .filter((event) => event.date && isBeforeYearMonth(event.date, state.year, state.month))
    .map((event) => event.id),
});

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

      let cost = { supplies: 0, ic: 0, manpower: 0 };
      if (buildingType === 'barracks') {
        cost = { supplies: 120, ic: 80, manpower: 0 };
      } else if (buildingType === 'fortress') {
        if (nextLevel === 1) cost = { supplies: 150, ic: 100, manpower: 0 };
        else if (nextLevel === 2) cost = { supplies: 250, ic: 180, manpower: 0 };
        else cost = { supplies: 400, ic: 280, manpower: 0 };
      } else if (buildingType === 'recruitingOffice') {
        cost = { supplies: 100, ic: 60, manpower: 30 };
      } else if (buildingType === 'ammoFactory') {
        if (nextLevel === 1) cost = { supplies: 200, ic: 150, manpower: 0 };
        else cost = { supplies: 300, ic: 220, manpower: 0 };
      }

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

      const designedComp = army.designedComposition || army.composition;
      const maxInfRestored = Math.max(0, Math.floor((designedComp.infantry - army.composition.infantry) * 0.5));
      const maxArtRestored = Math.max(0, Math.floor((designedComp.artillery - army.composition.artillery) * 0.5));
      const maxTnkRestored = Math.max(0, Math.floor((designedComp.tanks - army.composition.tanks) * 0.5));

      const totalMaxRestored = maxInfRestored + maxArtRestored + maxTnkRestored;
      let scale = 1.0;
      const targetManpower = totalMaxRestored;
      const targetSupplies = Math.floor(maxInfRestored * 0.03 + maxArtRestored * 0.06 + maxTnkRestored * 1.2);
      const targetIndustrial = Math.floor(maxArtRestored * 0.04 + maxTnkRestored * 0.08);
      const targetTankReserve = maxTnkRestored;

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

      if (actualTotal > 0) {
        mapResources[aiFaction] = {
          ...playerRes,
          manpower: Math.max(0, playerRes.manpower - actualTotal),
          supplies: Math.max(0, playerRes.supplies - Math.floor(actualInf * 0.03 + actualArt * 0.06 + actualTnk * 1.2)),
          industrialCapacity: Math.max(0, playerRes.industrialCapacity - Math.floor(actualArt * 0.04 + actualTnk * 0.08)),
          tankReserve: Math.max(0, playerRes.tankReserve - actualTnk),
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

      const reqManpower = infantry + artillery + tanks;
      const reqSupplies = Math.floor(infantry * 0.03 + artillery * 0.06 + tanks * 1.2);
      const reqIndustry = Math.floor(artillery * 0.04 + tanks * 0.08);
      const reqTankReserve = tanks;

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
    [MapFaction.NEUTRAL]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 }
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
  economy_growth: 2.5,
  inflation_rate: 3.5,
  unemployment_rate: 11.2,
  economyHistory: [
    { year: 1930, month: 10, growth: 2.1, inflation: 3.1, unemployment: 10.5 },
    { year: 1930, month: 11, growth: 2.3, inflation: 3.2, unemployment: 10.7 },
    { year: 1930, month: 12, growth: 2.2, inflation: 3.4, unemployment: 10.9 },
    { year: 1931, month: 1, growth: 2.4, inflation: 3.3, unemployment: 11.0 },
    { year: 1931, month: 2, growth: 2.5, inflation: 3.6, unemployment: 11.1 },
    { year: 1931, month: 3, growth: 2.5, inflation: 3.5, unemployment: 11.2 }
  ],
  budget: 12.0,
  tax_lower_class: 5,
  tax_middle_class: 15,
  tax_upper_class: 25,
  tax_tariff: 10,
  tax_consumption: 8,
  gold_reserves: 2200,
  foreign_exchange: 180,
  public_debt: 500,
  has_issued_war_bonds: false,
  military_spending: 15,
  workersAllianceProgress: 0,
  cntVotingRate: 15,
  isPRRevSFormed: false,
  prrevs_formed_months: 0,
  prrevsConstructionLevel: 0,
  cntStance: 'oppose',
  sandboxCardChoiceEnabled: false,
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
  coalition_just_dissolved: false,
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
  civilWarChainStep: 0,
  francoAfricaControl: false,
  hasArmoredCars: false,
  womensRightsReformed: false,
  internationalBrigadesArrived: false,
  educationSecularized: false,
  journal_ramon_franco_presidency_seen: false,
  ramonFrancoPresidentUnlocked: false,
  ramon_franco_campaign_count: 0,
  presidentElectionSeen: false,
  presidentElectionPhase: undefined,
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
  hand: [],
  actionDeck: INITIAL_CARDS.filter(c => c.type === 'Action'),
  governmentDeck: INITIAL_CARDS.filter(c => c.type === 'Government'),
  militaryDeck: INITIAL_CARDS.filter(c => c.type === 'Military'),
  discard: [],
  partySupport: {
    POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 0, PNV: 0, PRR: 0, DLR: 0, AP: 0, RE: 0, CT: 0, FE: 0, Other: 0, PRRevS: 0
  },
  activeCoalitions: [],
  rulingCoalition: null,
  coalitionHistory: [],
  coalition_dissent: 0,
};

interface GameContextType {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

type GameAction =
  | { type: 'START_GAME'; payload: { scenario: '1931' | '1933' | '1936'; difficulty: 'easy' | 'normal' | 'hard' | 'historical' | 'sandbox' } }
  | { type: 'RETURN_TO_START' }
  | { type: 'NEXT_PHASE' }
  | { type: 'PLAY_CARD'; payload: Card }
  | { type: 'RESOLVE_EVENT'; payload: (state: GameState) => Partial<GameState> }
  | { type: 'DISMISS_SUPER_EVENT' }
  | { type: 'SELECT_EVENT'; payload: { eventId: string } }
  | { type: 'ADD_ADVISOR'; payload: { advisor: Advisor; slotIndex: number } }
  | { type: 'REMOVE_ADVISOR'; payload: { slotIndex: number } }
  | { type: 'DRAW_CARD'; payload: 'Action' | 'Governmental' | 'Military' }
  | { type: 'DRAW_SPECIFIC_CARD'; payload: { cardId: string; deckType: 'Action' | 'Governmental' | 'Military' } }
  | { type: 'CHECK_EVENT' }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'zh' }
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'UPDATE_TAXES'; payload: { tax_lower_class?: number; tax_middle_class?: number; tax_upper_class?: number; tax_tariff?: number; tax_consumption?: number; military_spending?: number } }
  | { type: 'SELL_GOLD_FOR_FX' }
  | { type: 'ISSUE_WAR_BONDS' }
  | { type: 'BUY_RESOURCES_URGENT' }
  | { type: 'DEBUG_TRIGGER_ENDING'; payload: string }
  | { type: 'SANDBOX_EDIT'; payload: Partial<GameState> }
  | { type: 'SET_REGIONAL_STATUS'; payload: { region: 'andalusia' | 'catalonia' | 'basque' | 'galicia' | 'asturias'; status: 'direct' | 'autonomy' | 'independent' } }
  | { type: 'TOGGLE_MAP_VIEW' }
  | { type: 'END_MAP_PLAYER_TURN' }
  | { type: 'SELECT_MAP_PROVINCE'; payload: string | null }
  | { type: 'SELECT_MAP_ARMY'; payload: { armyId: string | null; isShift: boolean } }
  | { type: 'MOVE_MAP_ARMY'; payload: { armyId: string; targetProvinceId: string } }
  | { type: 'RECRUIT_MAP_ARMY'; payload: { provinceId: string; composition: { infantry: number; artillery: number; tanks: number } } }
  | { type: 'REINFORCE_MAP_ARMY'; payload: { armyId: string } }
  | { type: 'MERGE_MAP_ARMIES' }
  | { type: 'DISBAND_MAP_ARMIES' }
  | { type: 'SPLIT_MAP_ARMY'; payload: { armyId: string; composition: { infantry: number; artillery: number; tanks: number } } }
  | { type: 'BUILD_MAP_BUILDING'; payload: { provinceId: string; buildingType: string } };

const GameContext = createContext<GameContextType | undefined>(undefined);

import { checkEndings } from './endings';
import { checkAchievements } from './achievements';

const gameReducer = (state: GameState, action: GameAction): GameState => {
  let newState = state;
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
      const startEventState = {
        ...INITIAL_STATE,
        scenario: action.payload.scenario,
        difficulty: action.payload.difficulty,
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

      const initialHistory = [];
      let tempY = startYear;
      let tempM = startMonth;
      for (let i = 0; i < 6; i++) {
        tempM--;
        if (tempM <= 0) {
          tempM = 12;
          tempY--;
        }
        initialHistory.unshift({
          year: tempY,
          month: tempM,
          growth: parseFloat((start_growth * (0.9 + Math.random() * 0.2)).toFixed(2)),
          inflation: parseFloat((start_inflation * (0.9 + Math.random() * 0.2)).toFixed(2)),
          unemployment: parseFloat((start_unemployment * (0.95 + Math.random() * 0.1)).toFixed(2)),
        });
      }

      newState = { 
        ...INITIAL_STATE, 
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
        coalition_just_dissolved: false,
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
      newState = { ...state, screen: 'start' };
      break;
    case 'SET_LANGUAGE':
      newState = { ...state, language: action.payload };
      break;
    case 'LOAD_STATE': {
      const hydrateCards = (cards: Card[]) => {
        return cards.map(c => {
          const original = INITIAL_CARDS.find(ic => ic.id === c.id);
          return original ? { ...c, effect: original.effect, condition: original.condition } : c;
        });
      };

      const hydrateAdvisors = (advisors: (Advisor | null)[]) => {
        return advisors.map(a => {
          if (!a) return null;
          const original = INITIAL_ADVISORS.find(ia => ia.id === a.id);
          if (!original) return a;
          return {
            ...a,
            actions: a.actions.map(action => {
              const originalAction = original.actions.find(oa => oa.id === action.id);
              return originalAction ? { ...action, condition: originalAction.condition, effect: originalAction.effect } : action;
            })
          };
        });
      };

      const hydrateEvents = (events: GameEvent[]) => {
        return events.map(e => {
          const original = INITIAL_EVENTS.find(ie => ie.id === e.id);
          if (!original) return e;
          return {
            ...e,
            condition: original.condition,
            options: e.options.map((opt, idx) => {
              const originalOpt = original.options[idx];
              return originalOpt ? { ...opt, condition: originalOpt.condition, effect: originalOpt.effect } : opt;
            })
          };
        });
      };

      newState = { 
        ...action.payload, 
        screen: 'game',
        hand: hydrateCards(action.payload.hand || []),
        actionDeck: hydrateCards(action.payload.actionDeck || []),
        governmentDeck: hydrateCards(action.payload.governmentDeck || []),
        militaryDeck: hydrateCards(action.payload.militaryDeck || []),
        discard: hydrateCards(action.payload.discard || []),
        activeAdvisors: hydrateAdvisors(action.payload.activeAdvisors || [null, null, null]),
        advisorPool: hydrateAdvisors(action.payload.advisorPool || []) as Advisor[],
        pendingEvents: hydrateEvents(action.payload.pendingEvents || []),
        currentEvent: action.payload.currentEvent ? hydrateEvents([action.payload.currentEvent])[0] : null,
        eventHistory: action.payload.eventHistory || createLegacySaveEventHistory(action.payload),
      };
      break;
    }
    case 'UPDATE_TAXES':
      newState = {
        ...state,
        tax_lower_class: action.payload.tax_lower_class !== undefined ? Math.max(1, Math.min(100, action.payload.tax_lower_class)) : state.tax_lower_class,
        tax_middle_class: action.payload.tax_middle_class !== undefined ? Math.max(1, Math.min(100, action.payload.tax_middle_class)) : state.tax_middle_class,
        tax_upper_class: action.payload.tax_upper_class !== undefined ? Math.max(1, Math.min(100, action.payload.tax_upper_class)) : state.tax_upper_class,
        tax_tariff: action.payload.tax_tariff !== undefined ? Math.max(1, Math.min(100, action.payload.tax_tariff)) : state.tax_tariff,
        tax_consumption: action.payload.tax_consumption !== undefined ? Math.max(1, Math.min(100, action.payload.tax_consumption)) : state.tax_consumption,
        military_spending: action.payload.military_spending !== undefined ? Math.max(5, Math.min(100, action.payload.military_spending)) : (state.military_spending !== undefined ? state.military_spending : 15),
      };
      break;
    case 'SELL_GOLD_FOR_FX':
      if ((state.gold_reserves ?? 2200) >= 100) {
        newState = {
          ...state,
          gold_reserves: (state.gold_reserves ?? 2200) - 100,
          foreign_exchange: (state.foreign_exchange ?? 180) + 100,
          inflation_rate: state.inflation_rate + 1.5,
        };
      }
      break;
    case 'ISSUE_WAR_BONDS':
      newState = {
        ...state,
        budget: state.budget + 50.0,
        foreign_exchange: (state.foreign_exchange ?? 180) + 10.0,
        public_debt: (state.public_debt ?? 500) + 60.0,
        has_issued_war_bonds: true,
        inflation_rate: state.inflation_rate + 1.2,
      };
      break;
    case 'BUY_RESOURCES_URGENT':
      if ((state.foreign_exchange ?? 180) >= 25.0) {
        newState = {
          ...state,
          foreign_exchange: (state.foreign_exchange ?? 180) - 25.0,
          resources: state.resources + 2,
          armaments: state.armaments + 1,
        };
      }
      break;
    case 'DEBUG_TRIGGER_ENDING':
      newState = { ...state, isGameOver: true, ending: action.payload };
      break;
    case 'SANDBOX_EDIT':
      if (state.difficulty === 'sandbox') {
        newState = { ...state, ...action.payload };
      }
      break;
    case 'SET_REGIONAL_STATUS':
      newState = {
        ...state,
        regionalStatuses: {
          ...state.regionalStatuses,
          [action.payload.region]: action.payload.status,
        },
      };
      break;
    case 'TOGGLE_MAP_VIEW':
      newState = {
        ...state,
        currentView: state.currentView === 'map' ? 'standard' : 'map',
      };
      break;
    case 'SELECT_MAP_PROVINCE':
      newState = {
        ...state,
        mapSelectedProvinceId: action.payload,
      };
      break;
    case 'SELECT_MAP_ARMY': {
      const { armyId, isShift } = action.payload;
      if (!isShift) {
        newState = {
          ...state,
          mapSelectedArmyId: armyId,
          mapSelectedArmyIds: armyId ? [armyId] : [],
        };
      } else {
        const currentIds = state.mapSelectedArmyIds || [];
        const isSelected = armyId ? currentIds.includes(armyId) : false;
        let nextIds = [...currentIds];
        if (armyId) {
          if (isSelected) {
            nextIds = nextIds.filter(id => id !== armyId);
          } else {
            nextIds.push(armyId);
          }
        }
        newState = {
          ...state,
          mapSelectedArmyId: nextIds[nextIds.length - 1] || null,
          mapSelectedArmyIds: nextIds,
        };
      }
      break;
    }
    case 'MOVE_MAP_ARMY': {
      if (state.phase !== 'war') return state;
      const { armyId, targetProvinceId } = action.payload;
      const armies = state.armies || [];
      const movedArmy = armies.find(a => a.id === armyId);
      if (!movedArmy) break;

      // Prevent Nationalist and Republican armies from entering Portugal
      if (
        (movedArmy.faction === MapFaction.REPUBLICAN || movedArmy.faction === MapFaction.NATIONALIST) &&
        isPortugalProvince(targetProvinceId)
      ) {
        break;
      }

      const currentPlayerFaction = state.activeWar === 'asturias_war' ? MapFaction.WORKERS_ALLIANCE : MapFaction.REPUBLICAN;
      const playerFaction = movedArmy.faction;
      const isPlayer = playerFaction === currentPlayerFaction;
      const mapResources = { ...state.mapResources };
      const playerRes = mapResources[playerFaction];

      // If player is moving, they must have >= 1 CP
      if (isPlayer && (!playerRes || playerRes.commandPoints < 1)) {
        break;
      }

      // Deduct 1 CP for player
      if (isPlayer && playerRes) {
        mapResources[playerFaction] = {
          ...playerRes,
          commandPoints: Math.max(0, playerRes.commandPoints - 1),
        };
      }

      // Resolve movement/combat
      const isZh = state.language === 'zh';
      const nextProvinces = { ...(state.provinces || INITIAL_PROVINCES) };
      const res = resolveBattle(armies, nextProvinces, movedArmy, targetProvinceId, isZh);

      let nextHistory = [...(state.mapHistory || [])];
      if (res.messages && res.messages.length > 0) {
        nextHistory = [...res.messages, ...nextHistory];
      }

      let updatedState: GameState = {
        ...state,
        mapResources,
        armies: res.updatedArmies,
        provinces: res.updatedProvinces,
        mapHistory: nextHistory,
      };

      // Check if player has run out of CP
      const updatedPlayerRes = mapResources[currentPlayerFaction];
      if (isPlayer && updatedPlayerRes && updatedPlayerRes.commandPoints === 0) {
        const aiFaction = state.activeWar === 'asturias_war' ? MapFaction.REPUBLICAN : MapFaction.NATIONALIST;
        updatedState.mapCurrentPlayer = aiFaction;
        updatedState = executeAiTurn(updatedState, aiFaction, isZh);
        updatedState = checkWarStatus(updatedState, isZh);
      } else {
        updatedState = checkWarStatus(updatedState, isZh);
      }

      newState = updatedState;
      break;
    }
    case 'END_MAP_PLAYER_TURN': {
      if (state.phase !== 'war') return state;
      const isZh = state.language === 'zh';
      const aiFaction = state.activeWar === 'asturias_war' ? MapFaction.REPUBLICAN : MapFaction.NATIONALIST;
      const currentPlayerFaction = state.activeWar === 'asturias_war' ? MapFaction.WORKERS_ALLIANCE : MapFaction.REPUBLICAN;
      let updatedState: GameState = {
        ...state,
        mapCurrentPlayer: aiFaction,
      };
      updatedState = executeAiTurn(updatedState, aiFaction, isZh);
      updatedState = checkWarStatus(updatedState, isZh);
      
      newState = updatedState;
      break;
    }
    case 'RECRUIT_MAP_ARMY': {
      if (state.phase !== 'war') return state;
      const { provinceId, composition } = action.payload;
      const { infantry, artillery, tanks } = composition;

      const playerFaction = state.mapCurrentPlayer || MapFaction.REPUBLICAN;
      const mapResources = { ...state.mapResources };
      const playerRes = mapResources[playerFaction];

      if (!playerRes) break;

      const reqManpower = infantry + artillery + tanks;
      const reqSupplies = Math.floor(infantry * 0.03 + artillery * 0.06 + tanks * 1.2);
      const reqIndustry = Math.floor(artillery * 0.04 + tanks * 0.08);
      const reqTankReserve = tanks;

      if (
        playerRes.manpower < reqManpower ||
        playerRes.supplies < reqSupplies ||
        playerRes.industrialCapacity < reqIndustry ||
        playerRes.tankReserve < reqTankReserve
      ) {
        break;
      }

      mapResources[playerFaction] = {
        ...playerRes,
        manpower: Math.max(0, playerRes.manpower - reqManpower),
        supplies: Math.max(0, playerRes.supplies - reqSupplies),
        industrialCapacity: Math.max(0, playerRes.industrialCapacity - reqIndustry),
        tankReserve: Math.max(0, playerRes.tankReserve - reqTankReserve),
      };

      const newArmyId = `army_rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const newArmy: Army = {
        id: newArmyId,
        faction: playerFaction,
        provinceId,
        movesLeft: 0,
        manpower: reqManpower,
        maxManpower: reqManpower,
        composition: { infantry, artillery, tanks },
        designedComposition: { infantry, artillery, tanks },
        morale: 60,
        militarization: 10,
      };

      newState = {
        ...state,
        mapResources,
        armies: [...(state.armies || []), newArmy],
        mapSelectedArmyId: newArmyId,
        mapSelectedArmyIds: [newArmyId],
      };
      break;
    }
    case 'REINFORCE_MAP_ARMY': {
      if (state.phase !== 'war') return state;
      const { armyId } = action.payload;
      const armies = state.armies || [];
      const army = armies.find(a => a.id === armyId);
      if (!army) break;

      const playerFaction = state.mapCurrentPlayer || MapFaction.REPUBLICAN;
      const mapResources = { ...state.mapResources };
      const playerRes = mapResources[playerFaction];
      if (!playerRes) break;

      const designedComp = army.designedComposition || army.composition;
      const maxInfRestored = Math.max(0, Math.floor((designedComp.infantry - army.composition.infantry) * 0.5));
      const maxArtRestored = Math.max(0, Math.floor((designedComp.artillery - army.composition.artillery) * 0.5));
      const maxTnkRestored = Math.max(0, Math.floor((designedComp.tanks - army.composition.tanks) * 0.5));

      const totalMaxRestored = maxInfRestored + maxArtRestored + maxTnkRestored;
      
      let scale = 1.0;
      const targetManpower = totalMaxRestored;
      const targetSupplies = Math.floor(maxInfRestored * 0.03 + maxArtRestored * 0.06 + maxTnkRestored * 1.2);
      const targetIndustrial = Math.floor(maxArtRestored * 0.04 + maxTnkRestored * 0.08);
      const targetTankReserve = maxTnkRestored;

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

      if (actualTotal <= 0) break;

      const costManpower = actualTotal;
      const costSupplies = Math.floor(actualInf * 0.03 + actualArt * 0.06 + actualTnk * 1.2);
      const costIndustrial = Math.floor(actualArt * 0.04 + actualTnk * 0.08);
      const costTankReserve = actualTnk;

      mapResources[playerFaction] = {
        ...playerRes,
        manpower: Math.max(0, playerRes.manpower - costManpower),
        supplies: Math.max(0, playerRes.supplies - costSupplies),
        industrialCapacity: Math.max(0, playerRes.industrialCapacity - costIndustrial),
        tankReserve: Math.max(0, playerRes.tankReserve - costTankReserve),
      };

      const updatedArmies = armies.map(a => {
        if (a.id === armyId) {
          const nextComposition = {
            infantry: a.composition.infantry + actualInf,
            artillery: a.composition.artillery + actualArt,
            tanks: a.composition.tanks + actualTnk,
          };
          const nextManpower = nextComposition.infantry + nextComposition.artillery + nextComposition.tanks;
          return {
            ...a,
            composition: nextComposition,
            manpower: nextManpower,
            morale: Math.min(100, a.morale + 20),
          };
        }
        return a;
      });

      newState = {
        ...state,
        mapResources,
        armies: updatedArmies,
      };
      break;
    }
    case 'MERGE_MAP_ARMIES': {
      if (state.phase !== 'war') return state;
      const selectedIds = state.mapSelectedArmyIds || [];
      const armies = state.armies || [];
      const mergeCandidates = armies.filter(a => selectedIds.includes(a.id));

      if (mergeCandidates.length <= 1) break;

      const primary = mergeCandidates[0];
      const others = mergeCandidates.slice(1);
      const otherIds = others.map(o => o.id);

      let totalInf = primary.composition.infantry;
      let totalArt = primary.composition.artillery;
      let totalTnk = primary.composition.tanks;
      let totalMaxInf = (primary.designedComposition || primary.composition).infantry;
      let totalMaxArt = (primary.designedComposition || primary.composition).artillery;
      let totalMaxTnk = (primary.designedComposition || primary.composition).tanks;

      let weightedMoraleSum = primary.morale * primary.manpower;
      let weightedMilSum = primary.militarization * primary.manpower;
      let totalManpower = primary.manpower;

      others.forEach(a => {
        totalInf += a.composition.infantry;
        totalArt += a.composition.artillery;
        totalTnk += a.composition.tanks;

        const designed = a.designedComposition || a.composition;
        totalMaxInf += designed.infantry;
        totalMaxArt += designed.artillery;
        totalMaxTnk += designed.tanks;

        weightedMoraleSum += a.morale * a.manpower;
        weightedMilSum += a.militarization * a.manpower;
        totalManpower += a.manpower;
      });

      const avgMorale = totalManpower > 0 ? Math.round(weightedMoraleSum / totalManpower) : primary.morale;
      const avgMilitarization = totalManpower > 0 ? Math.round(weightedMilSum / totalManpower) : primary.militarization;

      const mergedArmy: Army = {
        ...primary,
        manpower: totalManpower,
        maxManpower: totalMaxInf + totalMaxArt + totalMaxTnk,
        composition: { infantry: totalInf, artillery: totalArt, tanks: totalTnk },
        designedComposition: { infantry: totalMaxInf, artillery: totalMaxArt, tanks: totalMaxTnk },
        morale: Math.min(100, Math.max(0, avgMorale)),
        militarization: Math.min(100, Math.max(0, avgMilitarization)),
      };

      const updatedArmies = armies
        .filter(a => !otherIds.includes(a.id))
        .map(a => (a.id === primary.id ? mergedArmy : a));

      newState = {
        ...state,
        armies: updatedArmies,
        mapSelectedArmyId: primary.id,
        mapSelectedArmyIds: [primary.id],
      };
      break;
    }
    case 'DISBAND_MAP_ARMIES': {
      if (state.phase !== 'war') return state;
      const selectedIds = state.mapSelectedArmyIds || [];
      const armies = state.armies || [];
      const disbandArmiesList = armies.filter(a => selectedIds.includes(a.id));

      if (disbandArmiesList.length === 0) break;

      const playerFaction = state.mapCurrentPlayer || MapFaction.REPUBLICAN;
      const mapResources = { ...state.mapResources };
      const playerRes = mapResources[playerFaction];

      if (!playerRes) break;

      let recoveredManpower = 0;
      let recoveredTanks = 0;
      let recoveredSupplies = 0;

      disbandArmiesList.forEach(a => {
        recoveredManpower += a.manpower;
        recoveredTanks += a.composition.tanks;
        recoveredSupplies += Math.floor(
          a.composition.infantry * 0.01 + a.composition.artillery * 0.02 + a.composition.tanks * 0.4
        );
      });

      mapResources[playerFaction] = {
        ...playerRes,
        manpower: playerRes.manpower + recoveredManpower,
        tankReserve: playerRes.tankReserve + recoveredTanks,
        supplies: playerRes.supplies + recoveredSupplies,
      };

      const remainingArmies = armies.filter(a => !selectedIds.includes(a.id));

      newState = {
        ...state,
        mapResources,
        armies: remainingArmies,
        mapSelectedArmyId: null,
        mapSelectedArmyIds: [],
      };
      break;
    }
    case 'SPLIT_MAP_ARMY': {
      if (state.phase !== 'war') return state;
      const { armyId, composition } = action.payload;
      const { infantry: splitInf, artillery: splitArt, tanks: splitTnk } = composition;

      const armies = state.armies || [];
      const parent = armies.find(a => a.id === armyId);
      if (!parent) break;

      if (
        parent.composition.infantry < splitInf ||
        parent.composition.artillery < splitArt ||
        parent.composition.tanks < splitTnk
      ) {
        break;
      }

      const parentInf = parent.composition.infantry - splitInf;
      const parentArt = parent.composition.artillery - splitArt;
      const parentTnk = parent.composition.tanks - splitTnk;
      const parentNewManpower = parentInf + parentArt + parentTnk;

      if (parentNewManpower <= 0) {
        break;
      }

      const updatedArmies = armies.map(a => {
        if (a.id === armyId) {
          return {
            ...a,
            manpower: parentNewManpower,
            composition: { infantry: parentInf, artillery: parentArt, tanks: parentTnk },
            designedComposition: { infantry: parentInf, artillery: parentArt, tanks: parentTnk },
          };
        }
        return a;
      });

      const newArmyId = `army_rec_${Date.now()}_split`;
      const splitArmyTotal = splitInf + splitArt + splitTnk;
      const splitArmy: Army = {
        id: newArmyId,
        faction: parent.faction,
        provinceId: parent.provinceId,
        movesLeft: parent.movesLeft,
        manpower: splitArmyTotal,
        maxManpower: splitArmyTotal,
        composition: { infantry: splitInf, artillery: splitArt, tanks: splitTnk },
        designedComposition: { infantry: splitInf, artillery: splitArt, tanks: splitTnk },
        morale: parent.morale,
        militarization: parent.militarization,
      };

      newState = {
        ...state,
        armies: [...updatedArmies, splitArmy],
        mapSelectedArmyId: armyId,
        mapSelectedArmyIds: [armyId],
      };
      break;
    }
    case 'BUILD_MAP_BUILDING': {
      if (state.phase !== 'war') return state;
      const { provinceId, buildingType } = action.payload;
      const provinces = { ...(state.provinces || INITIAL_PROVINCES) };
      const province = provinces[provinceId];
      if (!province) break;

      const playerFaction = state.mapCurrentPlayer || MapFaction.REPUBLICAN;
      const mapResources = { ...state.mapResources };
      const playerRes = mapResources[playerFaction];
      if (!playerRes) break;

      const currentBuildings = province.buildings || { barracks: 0, fortress: 0, recruitingOffice: 0, ammoFactory: 0 };
      const currentLevel = currentBuildings[buildingType as keyof typeof currentBuildings] || 0;
      const nextLevel = currentLevel + 1;

      let cost = { supplies: 0, ic: 0, manpower: 0 };
      if (buildingType === 'barracks') {
        cost = { supplies: 120, ic: 80, manpower: 0 };
      } else if (buildingType === 'fortress') {
        if (nextLevel === 1) cost = { supplies: 150, ic: 100, manpower: 0 };
        else if (nextLevel === 2) cost = { supplies: 250, ic: 180, manpower: 0 };
        else cost = { supplies: 400, ic: 280, manpower: 0 };
      } else if (buildingType === 'recruitingOffice') {
        cost = { supplies: 100, ic: 60, manpower: 30 };
      } else if (buildingType === 'ammoFactory') {
        if (nextLevel === 1) cost = { supplies: 200, ic: 150, manpower: 0 };
        else cost = { supplies: 300, ic: 220, manpower: 0 };
      }

      if (
        playerRes.supplies < cost.supplies ||
        playerRes.industrialCapacity < cost.ic ||
        playerRes.manpower < cost.manpower
      ) {
        break;
      }

      mapResources[playerFaction] = {
        ...playerRes,
        supplies: Math.max(0, playerRes.supplies - cost.supplies),
        industrialCapacity: Math.max(0, playerRes.industrialCapacity - cost.ic),
        manpower: Math.max(0, playerRes.manpower - cost.manpower),
      };

      const nextBuildings = {
        ...currentBuildings,
        [buildingType]: nextLevel,
      };

      provinces[provinceId] = {
        ...province,
        buildings: nextBuildings,
        ...(buildingType === 'fortress' ? { fortification: Math.min(3, nextLevel) } : {}),
      };

      newState = {
        ...state,
        mapResources,
        provinces,
      };
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
        
        // Calculate periodic income
        // Base income + bonus from worker control (collectivization)
        const resourceIncome = 1 + Math.floor(state.stats.workerControl / 20);
        // Base armament income
        const armamentIncome = 1;
        
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
          const isHistoricalTrigger = nextYear === 1936 && nextMonth === 7;
          
          if (isHistoricalTrigger) {
            newSuperEvent = 'spanish_civil_war';
          }
        }

        const eventCheckState = {
          ...state,
          month: nextMonth,
          year: nextYear,
          civilWarStatus: newCivilWarStatus,
          prrevs_formed_months: state.isPRRevSFormed ? state.prrevs_formed_months + 1 : 0
        } as GameState;

        // Add other regular events based on date or condition
        let monthlyEvents = INITIAL_EVENTS.filter(e => shouldQueueEvent(e, eventCheckState, {
          mode: getEventTriggerMode(state.difficulty),
          date: { year: nextYear, month: nextMonth },
          pendingEvents: state.pendingEvents,
          currentEvent: state.currentEvent,
        }));

        if (state.forceAsturiasRevolutionNextMonth) {
          const asturiasEventObj = INITIAL_EVENTS.find(e => e.id === 'asturias_revolution');
          if (asturiasEventObj && !monthlyEvents.some(e => e.id === 'asturias_revolution') && !state.pendingEvents.some(pe => pe.id === 'asturias_revolution') && state.currentEvent?.id !== 'asturias_revolution') {
            monthlyEvents.push(asturiasEventObj);
          }
        }

        newPendingEvents = [...newPendingEvents, ...monthlyEvents];
        
        // Map updates: resource income and move reset
        const nextMapResources = { ...state.mapResources } as Record<MapFaction, ResourceSet>;
        const updatedNextArmies = (state.armies || []).map(army => ({
          ...army,
          movesLeft: 2, // Reset movement limits
        }));

        Object.keys(nextMapResources).forEach(factionKey => {
          const fac = factionKey as MapFaction;
          const currentRes = nextMapResources[fac];
          if (!currentRes) return;

          const ownedProvinces = Object.values(state.provinces || INITIAL_PROVINCES).filter(
            p => p.owner === fac
          );

          let monthlyManpower = 500;
          let monthlySupplies = 250;
          let monthlyIC = 50;

          ownedProvinces.forEach(p => {
            monthlyManpower += p.manpower * 8;
            monthlySupplies += p.industry * 2.0;
            monthlyIC += p.industry * 1.0;

            const b = p.buildings || {};
            if (b.recruitingOffice) {
              monthlyManpower += 1500;
            }
            if (b.ammoFactory) {
              monthlySupplies += b.ammoFactory === 1 ? 500 : 1200;
            }
          });

          nextMapResources[fac] = {
            manpower: currentRes.manpower + Math.floor(monthlyManpower),
            supplies: currentRes.supplies + Math.floor(monthlySupplies),
            industrialCapacity: Math.min(250, currentRes.industrialCapacity + Math.floor(monthlyIC * 0.2)), 
            commandPoints: 2,
            tankReserve: currentRes.tankReserve + (fac === MapFaction.REPUBLICAN ? 1 : 0),
          };
        });

        let tempState: GameState = {
          ...state,
          month: nextMonth,
          year: nextYear,
          civilWarStatus: newCivilWarStatus,
          resources: state.resources + resourceIncome,
          armaments: state.armaments + armamentIncome,
          internationalBrigades: newIntBrigades,
          internationalBrigadesFormed: newIntBrigadesFormed,
          prrevs_formed_months: state.isPRRevSFormed ? state.prrevs_formed_months + 1 : 0,
          mapResources: nextMapResources,
          armies: updatedNextArmies,
          mapCurrentPlayer: state.activeWar === 'asturias_war' ? MapFaction.WORKERS_ALLIANCE : MapFaction.REPUBLICAN,
          asturiasWarTurns: state.activeWar === 'asturias_war' ? (state.asturiasWarTurns || 0) + 1 : (state.asturiasWarTurns || 0),
        };

        // --- Core Economic Monthly Simulation ---
        const taxLowerRate = (tempState.tax_lower_class !== undefined ? tempState.tax_lower_class : 5) / 100;
        const taxMiddleRate = (tempState.tax_middle_class !== undefined ? tempState.tax_middle_class : 15) / 100;
        const taxUpperRate = (tempState.tax_upper_class !== undefined ? tempState.tax_upper_class : 25) / 100;
        const taxTarRate = (tempState.tax_tariff !== undefined ? tempState.tax_tariff : 10) / 100;
        const taxConsRate = (tempState.tax_consumption !== undefined ? tempState.tax_consumption : 8) / 100;

        const isCivilWar = tempState.civilWarStatus === 'ongoing';
        const milSpendVal = tempState.military_spending !== undefined ? tempState.military_spending : 15;

        // 1. Budget Balance (Revenue - Expenditures)
        // Weighted contributions by class to total income tax revenue
        const incomeTaxRev = (taxLowerRate * 4.0) + (taxMiddleRate * 3.5) + (taxUpperRate * 4.5);
        const tariffRev = taxTarRate * (isCivilWar ? 2.0 : 5.0);
        const consumptionTaxRev = taxConsRate * 8.0;
        const totalTaxRev = incomeTaxRev + tariffRev + consumptionTaxRev;

        // Monthly Expenditures: Basic administration, plus social and military parameters
        let monthlyExpenditures = 1.0; // Basic civil administration
        if (tempState.domesticPolicy.max_hours_law > 0) {
          monthlyExpenditures += 0.3;
        }
        
        let minWageExpenditure = 0;
        switch (tempState.domesticPolicy.min_wage) {
          case 1: minWageExpenditure = 0.05; break;
          case 2: minWageExpenditure = 0.15; break;
          case 3: minWageExpenditure = 0.3; break;
          case 4: minWageExpenditure = 0.5; break;
          default: minWageExpenditure = 0; break;
        }
        monthlyExpenditures += minWageExpenditure;

        let educationExpenditure = 0;
        if (tempState.domesticPolicy.education_institutions === 2) {
          educationExpenditure = 0.05;
        } else if (tempState.domesticPolicy.education_institutions === 3) {
          educationExpenditure = 0.1;
        }
        monthlyExpenditures += educationExpenditure;

        if (isCivilWar) {
          monthlyExpenditures += 3.5; // War efforts drain
        }

        // Active military expenditures (ranges from 0.15 to 3.0 during peacetime, up to 8.0 wartime)
        const milExpenditures = (milSpendVal / 100) * (isCivilWar ? 8.0 : 3.0);
        monthlyExpenditures += milExpenditures;

        // Public Debt sovereign interest (2% peacetime, 5% wartime annually)
        const currentDebt = tempState.public_debt !== undefined ? tempState.public_debt : 500.0;
        const interestRate = (isCivilWar ? 0.05 : 0.02) / 12;
        const debtInterestCost = currentDebt * interestRate;
        monthlyExpenditures += debtInterestCost;

        // Legislative expenditures for Land Reform Compensation
        const landLawLevel = tempState.domesticPolicy.land_law ?? (tempState.domesticPolicy.land_reform_law_enabled ? 1 : 0);
        const isLandReformPaused = (landLawLevel === 1) && (tempState.budget <= 0);
        const landCompCost = (landLawLevel === 1 && !isLandReformPaused) ? 0.4 : 0.0;
        monthlyExpenditures += landCompCost;

        const budgetDelta = totalTaxRev - monthlyExpenditures;
        const newBudgetVal = parseFloat(((tempState.budget !== undefined ? tempState.budget : 12.0) + budgetDelta).toFixed(2));
        tempState.budget = Math.max(-100, Math.min(100, newBudgetVal));

        // 2. Sovereign Public Debt Accrual & Paydown
        let nextDebt = currentDebt;
        if (budgetDelta < 0) {
          nextDebt += Math.abs(budgetDelta);
        } else {
          const autoPay = Math.min(budgetDelta * 0.4, currentDebt);
          nextDebt -= autoPay;
        }
        tempState.public_debt = parseFloat(Math.max(0, Math.min(5000, nextDebt)).toFixed(2));

        // 3. Trade FX generation (export income minus imports and inflation impacts)
        const tradeFxYield = (tempState.economy_growth - 2.5) * 1.5 - (tempState.inflation_rate - 3.5) * 0.5 + (taxTarRate * 4.0) - (isCivilWar ? 2.5 : 0.0);
        const nextFx = (tempState.foreign_exchange !== undefined ? tempState.foreign_exchange : 180.0) + tradeFxYield;
        tempState.foreign_exchange = parseFloat(Math.max(0, Math.min(2500, nextFx)).toFixed(2));

        // 4. Arms Generation & Army Loyalty based on Military Spending
        const monthlyArmamentsYield = (milSpendVal / 15) * 0.15 * (isCivilWar ? 2.5 : 1.0);
        tempState.armaments = parseFloat((tempState.armaments + monthlyArmamentsYield).toFixed(2));

        const milLoyaltyFactor = (milSpendVal - 15) * 0.12;
        const newArmyLoyalty = Math.max(0, Math.min(100, (tempState.stats.armyLoyalty !== undefined ? tempState.stats.armyLoyalty : 50) + milLoyaltyFactor));

        // Adjust landowner class tension / reaction from expropriation (low compensation)

        // 5. Economic Growth Rate (clamped to 1% to 100%)
        const debtGrowthDrag = Math.max(0, (nextDebt - 1200) * 0.001); // high public debt curbs growth
        let nextGrowth = 3.5 - (taxLowerRate * 1.5) - (taxMiddleRate * 2.0) - (taxUpperRate * 2.5) - (taxTarRate * 3.0) - (taxConsRate * 3.5) - debtGrowthDrag;
        if (isCivilWar) {
          nextGrowth -= 6.0;
        }
        tempState.economy_growth = parseFloat(Math.max(1, Math.min(100, nextGrowth)).toFixed(2));

        // 6. Inflation Rate with Gold reserves backing impact (if gold is low, currency loses backing)
        const goldLossConfidence = Math.max(0, (700 - (tempState.gold_reserves !== undefined ? tempState.gold_reserves : 2200)) * 0.006);
        let deficitInflation = 0;
        if (budgetDelta < 0) {
          deficitInflation = Math.abs(budgetDelta) * 0.5;
        }
        let nextInflation = 2.5 - (taxLowerRate * 1.0) - (taxMiddleRate * 1.5) - (taxUpperRate * 2.0) + (taxTarRate * 8.0) + (taxConsRate * 6.0) + deficitInflation + goldLossConfidence;
        if (isCivilWar) {
          nextInflation += 8.0;
        }
        tempState.inflation_rate = parseFloat(Math.max(1, Math.min(100, nextInflation)).toFixed(2));

        // 7. Unemployment Rate (clamped to 1% to 100%)
        let laborReformReduction = 0;
        if (tempState.domesticPolicy.max_hours_law > 0) {
          laborReformReduction += 1.5;
        }
        const highDebtUnemploymentFactor = nextDebt > 1500 ? 1.0 : 0.0;
        let nextUnemployment = 12.0 - ((tempState.economy_growth - 2.5) * 0.4) + (taxLowerRate * 1.0) + (taxMiddleRate * 1.5) + (taxUpperRate * 3.0) - (taxTarRate * 1.5) - laborReformReduction + highDebtUnemploymentFactor;
        if (isCivilWar) {
          nextUnemployment += 4.0;
        }
        tempState.unemployment_rate = parseFloat(Math.max(1, Math.min(100, nextUnemployment)).toFixed(2));

        tempState.stats = {
          ...tempState.stats,
          armyLoyalty: parseFloat(newArmyLoyalty.toFixed(1)),
        };

        if (!tempState.coupSystemActive) {
          tempState.coupProgress = 0;
        } else {
          const tension = tempState.stats.tension !== undefined ? tempState.stats.tension : 34;
          const armyLoyalty = tempState.stats.armyLoyalty !== undefined ? tempState.stats.armyLoyalty : 50;
          const monthlyCoupDelta = 0.15 + (tension * 0.012) + ((100 - armyLoyalty) * 0.025);
          tempState.coupProgress = parseFloat(Math.max(0, Math.min(100, tempState.coupProgress + monthlyCoupDelta)).toFixed(2));
        }

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

        // Monthly action of Land Law (土地法)
        if (landLawLevel === 0) {
          // Level 0: 无土地改革 -> Monthly Revolutionary Fervor +1
          tempState.stats = {
            ...tempState.stats,
            revolutionaryFervor: Math.min(100, (tempState.stats.revolutionaryFervor || 0) + 1)
          };
        } else {
          // Level 1: 土地改革法 -> Monthly Land Reform journal progress +1
          // Level 2: 强制土地没收 -> Monthly Land Reform journal progress +1.5
          // Level 3: 革命集体化 -> Monthly Land Reform journal progress +2
          let landProgressStep = 0;
          if (landLawLevel === 1) {
            if (!isLandReformPaused) {
              landProgressStep = 1.0;
            }
          } else if (landLawLevel === 2) {
            landProgressStep = 1.5;
          } else if (landLawLevel === 3) {
            landProgressStep = 2.0;
          }

          if (landProgressStep > 0) {
            tempState.domesticPolicy = {
              ...tempState.domesticPolicy,
              land_reform_progress: parseFloat(Math.min(100, tempState.domesticPolicy.land_reform_progress + landProgressStep).toFixed(2))
            };
          }
        }

        // Monthly action of Mixed Jury Law (integrated into Union Status level 2)
        if (tempState.domesticPolicy.union_status === 2) {
          tempState.stats = {
            ...tempState.stats,
            revolutionaryFervor: Math.max(0, tempState.stats.revolutionaryFervor - 1)
          };

          if (tempState.domesticPolicy.mixed_jury_cnt_opposed) {
            tempState.classes = adjustClassSupport(tempState.classes, 'Obreros', 'PSOE', 5 / 12);
          }
        }

        // Monthly action of Education System (教育制度)
        if (tempState.domesticPolicy.education_institutions === 2) {
          if (tempState.ateneos_established > 0) {
            const level = tempState.ateneos_established;
            tempState.classes = adjustClassSupport(tempState.classes, 'Obreros', 'CNT_FAI', 0.05 * level);
            tempState.classes = adjustClassSupport(tempState.classes, 'Intelectuales', 'CNT_FAI', 0.01 * level);
            tempState.classes = adjustClassSupport(tempState.classes, 'Braceros', 'CNT_FAI', 0.06 * level);
          }
        }

        // Monthly action of Political Rights (政治权利)
        if (tempState.domesticPolicy.political_rights === 1) {
          tempState.stats = {
            ...tempState.stats,
            revolutionaryFervor: parseFloat(Math.min(100, Math.max(0, tempState.stats.revolutionaryFervor + 0.5)).toFixed(2))
          };
        } else if (tempState.domesticPolicy.political_rights === 2) {
          tempState.classes = adjustClassSupport(tempState.classes, 'PequenaBurguesia', 'PRR', 0.05);
          tempState.classes = adjustClassSupport(tempState.classes, 'Clero', 'AP', 0.05);
        } else if (tempState.domesticPolicy.political_rights === 3) {
          tempState.classes = adjustClassSupport(tempState.classes, 'Labradores', 'PSOE', 0.05);
          tempState.classes = adjustClassSupport(tempState.classes, 'PequenaBurguesia', 'PSOE', 0.05);
          tempState.classes = adjustClassSupport(tempState.classes, 'Obreros', 'PCE', 0.05);
        }

        // Monthly action of Religion Policy (宗教权利)
        if (tempState.domesticPolicy.religion_policy === 2) {
          tempState.stats = {
            ...tempState.stats,
            republicanAuthority: parseFloat(Math.min(100, Math.max(0, tempState.stats.republicanAuthority + 0.05)).toFixed(2))
          };
          if (tempState.coupSystemActive) {
            tempState.coupProgress = parseFloat(Math.min(100, Math.max(0, tempState.coupProgress + 0.1)).toFixed(2));
          }
        }

        // Public Order Law (公共秩序法)
        if (tempState.domesticPolicy.public_order_law === 0) {
          tempState.stats.revolutionaryFervor = Math.min(100, (tempState.stats.revolutionaryFervor || 0) + 1);
          tempState.stats.republicanAuthority = Math.max(0, (tempState.stats.republicanAuthority || 0) - 0.5);
        } else if (tempState.domesticPolicy.public_order_law === 1) {
          tempState.stats.revolutionaryFervor = Math.min(100, (tempState.stats.revolutionaryFervor || 0) + 0.5);
          tempState.stats.republicanAuthority = Math.max(0, (tempState.stats.republicanAuthority || 0) - 0.5);
        } else if (tempState.domesticPolicy.public_order_law === 2) {
          tempState.stats.revolutionaryFervor = Math.max(0, (tempState.stats.revolutionaryFervor || 0) - 0.1);
          tempState.stats.republicanAuthority = Math.min(100, (tempState.stats.republicanAuthority || 0) + 0.5);
        } else if (tempState.domesticPolicy.public_order_law === 3) {
          tempState.stats.revolutionaryFervor = Math.max(0, (tempState.stats.revolutionaryFervor || 0) - 0.5);
          tempState.stats.republicanAuthority = Math.min(100, (tempState.stats.republicanAuthority || 0) + 0.1);
        }

        // Security Corps Law (治安机关法)
        if (tempState.domesticPolicy.security_corps_law === 0) {
          tempState.classes = adjustClassSupport(tempState.classes, 'Braceros', 'CNT_FAI', 0.01);
          tempState.stats.armyLoyalty = Math.min(100, (tempState.stats.armyLoyalty || 0) + 0.05);
        }

        // Army Reform Law (军队改革法)
        if (tempState.domesticPolicy.army_reform_law === 0) {
          tempState.stats.republicanAuthority = Math.max(0, (tempState.stats.republicanAuthority || 0) - 0.5);
          tempState.stats.armyLoyalty = Math.max(0, (tempState.stats.armyLoyalty || 0) - 0.05);
        } else if (tempState.domesticPolicy.army_reform_law === 1) {
          tempState.stats.republicanAuthority = Math.min(100, (tempState.stats.republicanAuthority || 0) + 0.5);
          tempState.stats.armyLoyalty = Math.max(0, (tempState.stats.armyLoyalty || 0) - 0.1);
        } else if (tempState.domesticPolicy.army_reform_law === 2) {
          tempState.stats.republicanAuthority = Math.min(100, (tempState.stats.republicanAuthority || 0) + 1.0);
          tempState.stats.armyLoyalty = Math.min(100, (tempState.stats.armyLoyalty || 0) + 0.1);
        }

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
        if (tempState.cntStance === 'oppose') {
          tempState.cntVotingRate = Math.max(0, tempState.cntVotingRate - 1);
        }
        tempState.partySupport = updatePartySupport(tempState);
        if (tempState.activeCoalitions) {
          tempState.activeCoalitions = updateCoalitions(tempState);
        }
        tempState = checkCoalitionDissolve(tempState);
        tempState = autoFormCoalitionIfNeeded(tempState);

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
    case 'PLAY_CARD': {
      if (state.actionsLeft <= 0) return state;
      const cardPayload = action.payload;
      // Find the original card definition to ensure functions (effect, condition) exist
      const card = INITIAL_CARDS.find(c => c.id === cardPayload.id) || cardPayload;
      
      if (typeof card.effect !== 'function') {
        console.error(`Card ${card.id} has no effect function`, card);
        return state;
      }

      // Check resource costs
      if (card.resourceCost !== undefined && state.resources < card.resourceCost) return state;
      if (card.armamentCost !== undefined && state.armaments < card.armamentCost) return state;
      if (card.condition !== undefined && !card.condition(state)) return state;
      
      const stateBeforeCard = JSON.parse(JSON.stringify(state));
      let newStateAfterCard = card.effect(state);
      
      if (state.difficulty === 'easy') {
        if (!newStateAfterCard.currentEvent) {
          newStateAfterCard = {
            currentEvent: {
              id: `${card.id}_easy_event`,
              title: card.title,
              titleZh: card.titleZh,
              description: card.description,
              descriptionZh: card.descriptionZh,
              options: [
                {
                  text: 'Apply Effect',
                  textZh: '应用效果',
                  effect: () => {
                    const originalCard = INITIAL_CARDS.find(c => c.id === cardPayload.id) || cardPayload;
                    return originalCard.effect(state);
                  }
                }
              ]
            }
          };
        }
        
        // Deep copy the event to avoid mutating the original card definition
        newStateAfterCard.currentEvent = {
          ...newStateAfterCard.currentEvent,
          options: [
            ...newStateAfterCard.currentEvent.options,
            {
              text: 'Return card to hand (Refund costs)',
              textZh: '将卡牌放回手牌 (返还消耗)',
              effect: () => {
                return stateBeforeCard;
              }
            }
          ]
        };
      }
      
      newState = {
        ...state,
        ...newStateAfterCard,
        actionsLeft: state.actionsLeft - card.cost,
        resources: state.resources - (card.resourceCost || 0),
        armaments: state.armaments - (card.armamentCost || 0),
        hand: state.hand.filter((c) => c.id !== cardPayload.id),
        discard: [...state.discard, cardPayload],
      };
      break;
    }
    case 'DISMISS_SUPER_EVENT': {
      let extra = {};
      let eventHistory = state.eventHistory || createEmptyEventHistory();
      if (state.superEvent === 'spanish_civil_war') {
        eventHistory = appendEventHistoryId(eventHistory, 'triggered', civilWarSetup.id);
        extra = {
          currentEvent: civilWarSetup,
          phase: 'event'
        };
      }
      newState = { ...state, superEvent: null, eventHistory, ...extra };
      break;
    }
    case 'SELECT_EVENT': {
      const selectedEvent = state.pendingEvents.find(e => e.id === action.payload.eventId);
      if (selectedEvent) {
        newState = {
          ...state,
          currentEvent: selectedEvent,
          pendingEvents: state.pendingEvents.filter(e => e.id !== action.payload.eventId),
          eventHistory: appendEventHistoryId(state.eventHistory, 'triggered', selectedEvent.id)
        };
      }
      break;
    }
    case 'RESOLVE_EVENT': {
      const newStateAfterEvent = action.payload(state);
      
      let nextCurrentEvent = null;
      if (newStateAfterEvent.currentEvent) {
        nextCurrentEvent = newStateAfterEvent.currentEvent;
      }
      
      // Remove currentEvent from pendingEvents if it is present, avoiding double popups
      const currentEventId = state.currentEvent?.id;
      const nextPendingEvents = currentEventId
        ? (newStateAfterEvent.pendingEvents || state.pendingEvents || []).filter(e => e.id !== currentEventId)
        : (newStateAfterEvent.pendingEvents || state.pendingEvents || []);
      let nextEventHistory = appendEventHistoryId(
        newStateAfterEvent.eventHistory || state.eventHistory,
        'resolved',
        currentEventId
      );
      if (nextCurrentEvent) {
        nextEventHistory = appendEventHistoryId(nextEventHistory, 'triggered', nextCurrentEvent.id);
      }

      newState = {
        ...state,
        ...newStateAfterEvent,
        pendingEvents: nextPendingEvents,
        currentEvent: nextCurrentEvent,
        eventHistory: nextEventHistory,
      };
      
      // If no current event and no pending events, move to action phase automatically if we were in event phase
      if (!newState.currentEvent && newState.pendingEvents.length === 0 && newState.phase === 'event') {
        newState.phase = 'action';
        newState.actionsLeft = 2;
      }
      break;
    }
    case 'ADD_ADVISOR': {
      const { advisor, slotIndex } = action.payload;
      const newActive = [...state.activeAdvisors];
      const oldAdvisor = newActive[slotIndex];
      newActive[slotIndex] = advisor;
      
      let newPool = state.advisorPool.filter((a) => a.id !== advisor.id);
      if (oldAdvisor) {
        newPool.push(oldAdvisor);
      }
      newState = { ...state, activeAdvisors: newActive, advisorPool: newPool };
      break;
    }
    case 'REMOVE_ADVISOR': {
      const { slotIndex } = action.payload;
      const newActive = [...state.activeAdvisors];
      const oldAdvisor = newActive[slotIndex];
      if (!oldAdvisor) return state;
      
      newActive[slotIndex] = null;
      newState = {
        ...state,
        activeAdvisors: newActive,
        advisorPool: [...state.advisorPool, oldAdvisor],
      };
      break;
    }
    case 'DRAW_CARD': {
      const handLimit = state.difficulty === 'hard' ? 3 : 4;
      if (state.hand.length >= handLimit) return state;
      const cardType = action.payload;
      
      let sourceDeck: Card[] = [];
      if (cardType === 'Action') sourceDeck = state.actionDeck;
      else if (cardType === 'Governmental') sourceDeck = state.governmentDeck;
      else if (cardType === 'Military') sourceDeck = state.militaryDeck;

      let availableCards = sourceDeck.filter(c => c.condition ? c.condition(state) : true);
      
      let newActionDeck = [...state.actionDeck];
      let newGovDeck = [...state.governmentDeck];
      let newMilDeck = [...state.militaryDeck];
      let newDiscard = [...state.discard];
      
      if (availableCards.length === 0) {
        // Shuffle ALL discarded cards of this type back into the deck
        const allDiscardedOfType = state.discard.filter(c => {
          if (cardType === 'Governmental') return c.type === 'Government';
          return c.type === cardType;
        });
        if (allDiscardedOfType.length === 0) return state; 
        
        if (cardType === 'Action') {
          newActionDeck = [...newActionDeck, ...allDiscardedOfType];
          sourceDeck = newActionDeck;
        } else if (cardType === 'Governmental') {
          newGovDeck = [...newGovDeck, ...allDiscardedOfType];
          sourceDeck = newGovDeck;
        } else if (cardType === 'Military') {
          newMilDeck = [...newMilDeck, ...allDiscardedOfType];
          sourceDeck = newMilDeck;
        }
        newDiscard = newDiscard.filter(c => {
          if (cardType === 'Governmental') return c.type !== 'Government';
          return c.type !== cardType;
        });
        
        // Now check available cards again
        availableCards = sourceDeck.filter(c => c.condition ? c.condition(state) : true);
        if (availableCards.length === 0) return state; 
      }
      
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const drawnCard = availableCards[randomIndex];
      
      if (cardType === 'Action') newActionDeck = newActionDeck.filter(c => c.id !== drawnCard.id);
      else if (cardType === 'Governmental') newGovDeck = newGovDeck.filter(c => c.id !== drawnCard.id);
      else if (cardType === 'Military') newMilDeck = newMilDeck.filter(c => c.id !== drawnCard.id);
      
      newState = {
        ...state,
        hand: [...state.hand, drawnCard],
        actionDeck: newActionDeck,
        governmentDeck: newGovDeck,
        militaryDeck: newMilDeck,
        discard: newDiscard
      };
      break;
    }
    case 'DRAW_SPECIFIC_CARD': {
      const handLimit = state.difficulty === 'hard' ? 3 : 4;
      if (state.hand.length >= handLimit) return state;
      const { cardId, deckType } = action.payload;
      
      let card: Card | undefined;
      let newActionDeck = [...state.actionDeck];
      let newGovDeck = [...state.governmentDeck];
      let newMilDeck = [...state.militaryDeck];
      
      if (deckType === 'Action') {
        card = state.actionDeck.find(c => c.id === cardId);
        if (card) newActionDeck = newActionDeck.filter(c => c.id !== cardId);
      } else if (deckType === 'Governmental') {
        card = state.governmentDeck.find(c => c.id === cardId);
        if (card) newGovDeck = newGovDeck.filter(c => c.id !== cardId);
      } else if (deckType === 'Military') {
        card = state.militaryDeck.find(c => c.id === cardId);
        if (card) newMilDeck = newMilDeck.filter(c => c.id !== cardId);
      }
      
      if (!card) return state;
      
      newState = {
        ...state,
        hand: [...state.hand, card],
        actionDeck: newActionDeck,
        governmentDeck: newGovDeck,
        militaryDeck: newMilDeck
      };
      break;
    }
    case 'CHECK_EVENT': {
      if (state.pendingEvents.length > 0) {
        // We have pending events, so we stay in event phase. The UI will show the Event Board.
        newState = { ...state };
      } else {
        // If no events, skip to action phase
        newState = { ...state, phase: 'action', actionsLeft: 2 };
      }
      break;
    }
    default:
      newState = state;
  }
  
  // Normalize values to prevent overflow/underflow (0-100)
  if (newState !== state) {
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
        newState.queipoStatus = 'nationalist';
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
        if (newState.armedForces && newState.armedForces.regularArmy) {
          newState.armedForces.regularArmy.loyalty = Math.max(0, newState.armedForces.regularArmy.loyalty - 5);
        }
        newState.francoStatus = 'nationalist';
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

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const dispatch = (action: GameAction) => {
    setState((prevState) => gameReducer(prevState, action));
  };

  // Game loop effects
  useEffect(() => {
    if (state.phase === 'event' && !state.currentEvent) {
      dispatch({ type: 'CHECK_EVENT' });
    }
  }, [state.phase, state.month, state.year, state.currentEvent]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
