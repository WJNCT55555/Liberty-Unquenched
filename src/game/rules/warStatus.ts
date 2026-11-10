import { MapFaction } from '../../map/types_map';
import type { GameState } from '../types';
import { settleIberianCapitulations, getFactionStrategicValue } from './iberianDefense';
import { isCivilWarFaction } from '../../map/rules/factions';
import { asturiasVictoryPrologue } from '../events/asturias_victory_chain';
import { beginPostwarSettlement } from '../events/postwar_settlement';

export function checkWarStatus(state: GameState, isZh: boolean): GameState {
  if (state.iberianDefense) return settleIberianCapitulations(state);
  if (state.activeWar === 'spanish_civil_war' && state.civilWarStatus === 'ongoing'
    && state.nationalistIntegration?.stage === 'carlist_secession'
    && !state.nationalistIntegration.carlistCapitulatedAt) {
    const occupier = state.provinces.navarra?.owner;
    if (occupier && occupier !== MapFaction.CARLIST && isCivilWarFaction(occupier)
      && getFactionStrategicValue(state, MapFaction.CARLIST) < 7) {
      const republicWins = Boolean(state.nationalistIntegration.nationalistCapitulatedAt);
      return {
        ...state,
        provinces: Object.fromEntries(Object.entries(state.provinces).map(([id, province]) => [id,
          province.owner === MapFaction.CARLIST ? { ...province, owner: occupier } : province])),
        armies: state.armies.filter(army => army.faction !== MapFaction.CARLIST),
        mapResources: { ...state.mapResources, [MapFaction.CARLIST]: {
          manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 } },
        nationalistIntegration: { ...state.nationalistIntegration,
          carlistCapitulatedAt: { year: state.year, month: state.month } },
        mapHistory: [isZh ? '卡洛斯派失去纳瓦拉与剩余战略基础，独立战线瓦解。'
          : 'The Carlist front collapses after losing Navarre and its strategic bases.', ...state.mapHistory],
        ...(republicWins ? { civilWarStatus: 'won' as const, activeWar: null,
          superEvent: 'spanish_civil_war_ends', ...beginPostwarSettlement(state) } : {}),
      };
    }
  }
  if (state.activeWar === 'asturias_war') {
    const provinces = state.provinces || {};

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
      // Victory opens the Workers' Alliance settlement chain. The old one-click
      // `asturias_war_victory` reward (fervor/armaments/resources) is retired.
      const nextWars = { ...(state.wars || { spanish_civil_war: 'not_started', asturias_war: 'not_started' }) };
      nextWars.asturias_war = 'won';

      return {
        ...state,
        activeWar: null,
        wars: nextWars,
        phase: 'event',
        currentView: 'standard',
        pendingEvents: [...(state.pendingEvents || [])],
        currentEvent: asturiasVictoryPrologue
      };
    }
  }
  return state;
}
