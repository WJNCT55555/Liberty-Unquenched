import type { DomainReducer, GameAction } from './types';
import type { Army } from '../../map/types_map';
import { MapFaction } from '../../map/types_map';
import { INITIAL_PROVINCES, PROVINCE_ADJACENCY, isPortugalProvince } from '../../map/map_constants';
import { armyRecruitCost, getBuildingCost, reinforceCost, reinforceTarget } from '../../map/rules/costs';
import type { GameState } from '../types';

/** Fast, local map interactions are reduced independently from political state. */
export const reduceMap: DomainReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_MAP_VIEW':
      return { ...state, currentView: state.currentView === 'map' ? 'standard' : 'map' };
    case 'SELECT_MAP_PROVINCE':
      return { ...state, mapSelectedProvinceId: action.payload };
    case 'SELECT_MAP_ARMY': {
      const { armyId, isShift } = action.payload;
      if (!isShift) {
        return {
          ...state,
          mapSelectedArmyId: armyId,
          mapSelectedArmyIds: armyId ? [armyId] : [],
        };
      }

      const currentIds = state.mapSelectedArmyIds || [];
      const isSelected = armyId ? currentIds.includes(armyId) : false;
      let nextIds = [...currentIds];
      if (armyId) {
        nextIds = isSelected ? nextIds.filter(id => id !== armyId) : [...nextIds, armyId];
      }
      return { ...state, mapSelectedArmyIds: nextIds };
    }
    default:
      return null;
  }
};

export type MapAction = Extract<GameAction, {
  type: 'TOGGLE_MAP_VIEW' | 'SELECT_MAP_PROVINCE' | 'SELECT_MAP_ARMY'
}>;

export interface MapReducerHelpers {
  resolveBattle: (armies: Army[], provinces: Record<string, any>, movedArmy: Army, targetProvinceId: string, isZh: boolean) => { updatedArmies: Army[]; updatedProvinces: Record<string, any>; messages: string[] };
  executeAiTurn: (state: GameState, aiFaction: MapFaction, isZh: boolean) => GameState;
  checkWarStatus: (state: GameState, isZh: boolean) => GameState;
}

/** Handles map movement, combat, recruitment, construction, and turn actions. */
export const reduceMapWarAction = (state: GameState, action: GameAction, helpers: MapReducerHelpers): GameState | null => {
  let newState = state;
  switch (action.type) {
    case 'MOVE_MAP_ARMY': {
      if (state.phase !== 'war') return state;
      const { armyId, targetProvinceId } = action.payload;
      const armies = state.armies || [];
      const movedArmy = armies.find(a => a.id === armyId);
      if (!movedArmy) break;

      const currentPlayerFaction = state.activeWar === 'asturias_war' ? MapFaction.WORKERS_ALLIANCE : MapFaction.REPUBLICAN;

      // Player movement is only valid during the player's map turn, with one of
      // the player's armies, and into an adjacent province.
      if (
        state.mapCurrentPlayer !== currentPlayerFaction ||
        movedArmy.faction !== currentPlayerFaction ||
        !(PROVINCE_ADJACENCY[movedArmy.provinceId] || []).includes(targetProvinceId)
      ) {
        break;
      }

      // Prevent Nationalist and Republican armies from entering Portugal
      if (currentPlayerFaction === MapFaction.REPUBLICAN && isPortugalProvince(targetProvinceId)) {
        break;
      }

      const mapResources = { ...state.mapResources };
      const playerRes = mapResources[currentPlayerFaction];

      // Every player movement costs exactly one command point.
      if (!playerRes || playerRes.commandPoints < 1) {
        break;
      }

      mapResources[currentPlayerFaction] = {
        ...playerRes,
        commandPoints: Math.max(0, playerRes.commandPoints - 1),
      };

      // Resolve movement/combat
      const isZh = state.language === 'zh';
      const nextProvinces = { ...(state.provinces || INITIAL_PROVINCES) };
      const res = helpers.resolveBattle(armies, nextProvinces, movedArmy, targetProvinceId, isZh);

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
      if (updatedPlayerRes && updatedPlayerRes.commandPoints === 0) {
        const aiFaction = state.activeWar === 'asturias_war' ? MapFaction.REPUBLICAN : MapFaction.NATIONALIST;
        updatedState.mapCurrentPlayer = aiFaction;
        updatedState = helpers.executeAiTurn(updatedState, aiFaction, isZh);
        updatedState = helpers.checkWarStatus(updatedState, isZh);
      } else {
        updatedState = helpers.checkWarStatus(updatedState, isZh);
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
      updatedState = helpers.executeAiTurn(updatedState, aiFaction, isZh);
      updatedState = helpers.checkWarStatus(updatedState, isZh);
      
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

      const recruitCost = armyRecruitCost({ infantry, artillery, tanks });
      const reqManpower = recruitCost.manpower;
      const reqSupplies = recruitCost.supplies;
      const reqIndustry = recruitCost.ic;
      const reqTankReserve = recruitCost.tankReserve;

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

      const maxRestored = reinforceTarget(army);
      const maxInfRestored = maxRestored.infantry;
      const maxArtRestored = maxRestored.artillery;
      const maxTnkRestored = maxRestored.tanks;

      const totalMaxRestored = maxInfRestored + maxArtRestored + maxTnkRestored;
      
      let scale = 1.0;
      const targetCost = reinforceCost(maxRestored);
      const targetManpower = targetCost.manpower;
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

      if (actualTotal <= 0) break;

      const actualCost = reinforceCost({ infantry: actualInf, artillery: actualArt, tanks: actualTnk });
      const costManpower = actualCost.manpower;
      const costSupplies = actualCost.supplies;
      const costIndustrial = actualCost.ic;
      const costTankReserve = actualCost.tankReserve;

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

      const cost = getBuildingCost(buildingType, nextLevel);

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
    default:
      return null;
  }
  return newState;
};
