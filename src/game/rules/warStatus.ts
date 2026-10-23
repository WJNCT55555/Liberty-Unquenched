import { MapFaction } from '../../map/types_map';
import type { GameEvent, GameState } from '../types';
import { settleIberianCapitulations, getFactionStrategicValue } from './iberianDefense';
import { isCivilWarFaction } from '../../map/rules/factions';

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
          superEvent: 'spanish_civil_war_ends' } : {}),
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
