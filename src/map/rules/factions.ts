import { MapFaction, type MapRuntimeState } from '../types_map';

export const CIVIL_WAR_FACTIONS = [MapFaction.IBERIAN_DEFENSE, MapFaction.REPUBLICAN, MapFaction.NATIONALIST] as const;
export const getPlayerMapFaction = (state: Pick<MapRuntimeState, 'activeWar' | 'iberianDefense'>): MapFaction =>
  state.iberianDefense ? MapFaction.IBERIAN_DEFENSE
    : state.activeWar === 'asturias_war' ? MapFaction.WORKERS_ALLIANCE : MapFaction.REPUBLICAN;
export const isCivilWarFaction = (faction: MapFaction) => CIVIL_WAR_FACTIONS.some(item => item === faction);

/** 西班牙各阵营：内战三方加上不属于内战阵营的工人联盟自治政府。 */
const SPAIN_MAP_FACTIONS: MapFaction[] = [...CIVIL_WAR_FACTIONS, MapFaction.WORKERS_ALLIANCE];

/**
 * 机动许可：西班牙各阵营只能在内战阵营与工人联盟控制的省份之间移动。
 *
 * 外国非交战国（葡萄牙、英国、安道尔、中立）对任何一方都不开放——工人联盟自治
 * 政府不属于 `CIVIL_WAR_FACTIONS`，所以必须在这里显式纳入西班牙阵营名单，否则
 * 它的部队会绕过这条规则直接走进葡萄牙。
 */
export const canEnterMapProvince = (faction: MapFaction, owner: MapFaction): boolean => {
  if (!SPAIN_MAP_FACTIONS.includes(faction)) return true;
  return isCivilWarFaction(owner) || owner === MapFaction.WORKERS_ALLIANCE;
};
export const getMapFactionName = (faction: MapFaction, zh: boolean): string => {
  const names: Record<MapFaction, [string, string]> = {
    REPUBLICAN: ['Madrid Government', '马德里政府'], NATIONALIST: ['Nationalists', '国民军'],
    IBERIAN_DEFENSE: ['Iberian Defense Committee', '伊比利亚防御委员会'],
    WORKERS_ALLIANCE: ["Workers’ Alliance", '工人联盟自治政府'], PORTUGAL: ['Portugal', '葡萄牙'],
    NEUTRAL: ['Neutral', '中立'], UNITED_KINGDOM: ['United Kingdom', '英国'], ANDORRA: ['Andorra', '安道尔'],
  };
  return names[faction]?.[zh ? 1 : 0] ?? faction;
};
