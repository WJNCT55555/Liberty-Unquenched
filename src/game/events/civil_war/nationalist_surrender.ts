import type { GameEvent } from '../../types';
import { MapFaction } from '../../../map/types_map';

const civilWarTerminalMeta = {
  category: 'war' as const,
  flow: 'solo' as const,
  series: ['civil_war'],
  tags: ['map', 'terminal'],
};

export const nationalistSurrender: GameEvent = {
  id: 'nationalist_surrender',
  meta: civilWarTerminalMeta,
  condition: (state) => {
    if (state.iberianDefense || state.civilWarStatus !== 'ongoing') return false;

    const burgos = state.provinces?.['burgos'];
    const burgosNotNationalist = burgos ? burgos.owner !== MapFaction.NATIONALIST : true;

    const provincesList = Object.values(state.provinces || {});
    const nationalistProvinces = provincesList.filter(p => p.owner === MapFaction.NATIONALIST);
    const totalStrategicValue = nationalistProvinces.reduce((sum, p) => sum + (p.strategicValue || 0), 0);

    return burgosNotNationalist && totalStrategicValue < 60;
  },
  title: 'Nationalist Surrender',
  titleZh: '国民军投降',
  description: 'With Burgos and its strategic bases lost, the Nationalist command capitulates. If the Carlists maintain a separate front, the civil war continues against them.',
  descriptionZh: '布尔戈斯与主要战略基地失守，国民军指挥部投降。若卡洛斯派仍维持独立战线，内战将继续。',
  options: [
    {
      text: 'Record the Nationalist capitulation.',
      textZh: '记录国民军投降。',
      effect: (state) => {
        if (state.iberianDefense) return state;
        if (!nationalistSurrender.condition?.(state)) return {};
        const carlistsFight = Object.values(state.provinces).some(p => p.owner === MapFaction.CARLIST);
        const recipient = state.provinces.burgos?.owner === MapFaction.CARLIST ? MapFaction.CARLIST : MapFaction.REPUBLICAN;
        return {
          civilWarStatus: carlistsFight ? 'ongoing' : 'won',
          ...(carlistsFight ? { nationalistIntegration: { ...(state.nationalistIntegration ?? { stage: 'fragmented' as const }),
            nationalistCapitulatedAt: { year: state.year, month: state.month } } } : { superEvent: 'spanish_civil_war_ends' }),
          provinces: Object.fromEntries(Object.entries(state.provinces).map(([id, province]) => [id,
            province.owner === MapFaction.NATIONALIST ? { ...province, owner: recipient } : province])),
          armies: state.armies.filter(army => army.faction !== MapFaction.NATIONALIST),
          mapResources: { ...state.mapResources, [MapFaction.NATIONALIST]: {
            manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 } },
        };
      }
    }
  ]
};
