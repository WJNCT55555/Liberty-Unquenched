import type { GameState } from '../../game/types';
import { MapFaction } from '../types_map';

export const CIVIL_WAR_FACTIONS = [MapFaction.IBERIAN_DEFENSE, MapFaction.REPUBLICAN, MapFaction.NATIONALIST] as const;
export const getPlayerMapFaction = (state: Pick<GameState, 'activeWar' | 'iberianDefense'>): MapFaction =>
  state.iberianDefense ? MapFaction.IBERIAN_DEFENSE
    : state.activeWar === 'asturias_war' ? MapFaction.WORKERS_ALLIANCE : MapFaction.REPUBLICAN;
export const isCivilWarFaction = (faction: MapFaction) => CIVIL_WAR_FACTIONS.some(item => item === faction);
/** Foreign neutral states do not participate in the three-sided civil war. */
export const canEnterMapProvince = (faction: MapFaction, owner: MapFaction) =>
  !isCivilWarFaction(faction) || isCivilWarFaction(owner) || owner === MapFaction.WORKERS_ALLIANCE;
export const getMapFactionName = (faction: MapFaction, zh: boolean): string => {
  const names: Record<MapFaction, [string, string]> = {
    REPUBLICAN: ['Madrid Government', '马德里政府'], NATIONALIST: ['Nationalists', '国民军'],
    IBERIAN_DEFENSE: ['Iberian Defense Committee', '伊比利亚防御委员会'],
    WORKERS_ALLIANCE: ["Workers’ Alliance", '工人联盟自治政府'], PORTUGAL: ['Portugal', '葡萄牙'],
    NEUTRAL: ['Neutral', '中立'], UNITED_KINGDOM: ['United Kingdom', '英国'], ANDORRA: ['Andorra', '安道尔'],
  };
  return names[faction]?.[zh ? 1 : 0] ?? faction;
};
