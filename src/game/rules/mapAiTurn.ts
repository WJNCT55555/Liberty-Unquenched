import { PROVINCE_ADJACENCY } from '../../map/map_constants';
import { MapFaction, type Army, type MapRuntimeState } from '../../map/types_map';
import { calculateAiMoves } from '../../map/lib/gameAi';
import { armyRecruitCost, getBuildingCost, reinforceCost, reinforceTarget } from '../../map/rules/costs';
import { canEnterMapProvince } from '../../map/rules/factions';
import { settleIberianCapitulations } from './iberianDefense';
import { resolveBattle } from './combat';

export interface MapAiTurnDependencies {
  calculateMoves: typeof calculateAiMoves;
  resolveBattle: typeof resolveBattle;
  settleCapitulations: typeof settleIberianCapitulations;
  now: () => number;
  random: () => number;
}

export const DEFAULT_MAP_AI_TURN_DEPENDENCIES: MapAiTurnDependencies = {
  calculateMoves: calculateAiMoves,
  resolveBattle,
  settleCapitulations: settleIberianCapitulations,
  now: Date.now,
  random: Math.random,
};

export function executeAiTurn<State extends MapRuntimeState>(
  state: State,
  aiFaction: MapFaction,
  isZh: boolean,
  dependencies: MapAiTurnDependencies = DEFAULT_MAP_AI_TURN_DEPENDENCIES,
): State {
  let tempState = { ...state };
  let mapResources = { ...tempState.mapResources };
  let provinces = { ...tempState.provinces };
  let armies = [...tempState.armies];
  let history = [...tempState.mapHistory];

  // Set AI command points to 2 for the AI turn to let them make decisions!
  if (mapResources[aiFaction]) {
    mapResources[aiFaction] = {
      ...mapResources[aiFaction],
      commandPoints: 2,
    };
  }

  const aiState: Pick<MapRuntimeState, 'mapResources' | 'provinces' | 'armies'> = {
    mapResources,
    provinces,
    armies,
  };

  // Let's get the difficulty. Difficulty from state could be easy, normal, hard, historical, sandbox.
  let diff: 'easy' | 'normal' | 'hard' = 'normal';
  if (state.difficulty === 'easy') diff = 'easy';
  else if (state.difficulty === 'hard') diff = 'hard';

  const aiActions = dependencies.calculateMoves(aiState, aiFaction, diff);

  const factionNameZh = aiFaction === MapFaction.REPUBLICAN ? '共和国政府军' : '国民军';
  const factionNameEn = aiFaction === MapFaction.REPUBLICAN ? 'Republican' : 'Nationalist';

  aiActions.forEach(action => {
    if (tempState.iberianDefense?.winner || tempState.iberianDefense?.eliminated.includes(aiFaction)) return;
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

        const newArmyId = `army_rec_${dependencies.now()}_ai_${Math.floor(dependencies.random() * 1000)}`;
        const newArmy: Army = {
          id: newArmyId,
          faction: aiFaction,
          identity: 'gov',
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
      if (!movedArmy || !playerRes || movedArmy.faction !== aiFaction || movedArmy.movesLeft <= 0
        || !(PROVINCE_ADJACENCY[movedArmy.provinceId] ?? []).includes(targetProvinceId)
        || !provinces[targetProvinceId] || !canEnterMapProvince(aiFaction, provinces[targetProvinceId].owner)) return;

      if (playerRes.commandPoints >= 1) {
        mapResources[aiFaction] = {
          ...playerRes,
          commandPoints: Math.max(0, playerRes.commandPoints - 1),
        };

        const res = dependencies.resolveBattle(armies, provinces, movedArmy, targetProvinceId, isZh, dependencies.random);
        armies = res.updatedArmies;
        provinces = res.updatedProvinces;
        if (res.messages && res.messages.length > 0) {
          history = [...res.messages, ...history];
        }
        if (tempState.iberianDefense) {
          tempState = dependencies.settleCapitulations({ ...tempState, provinces, armies, mapResources, mapHistory: history });
          provinces = tempState.provinces;
          armies = tempState.armies;
          mapResources = tempState.mapResources;
          history = tempState.mapHistory;
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
  } as State;
}
