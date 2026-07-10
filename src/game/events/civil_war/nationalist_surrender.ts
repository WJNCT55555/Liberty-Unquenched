import { GameEvent } from '../../types';
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
  title: 'Nationalist Surrender',
  titleZh: '国民军投降',
  description: 'With their provisional capital Burgos liberated and their key strategic provinces lost, the Nationalist high command realizes further resistance is futile. The rebel junta has formally signed an unconditional surrender. The rebellion is over, and the Second Spanish Republic has triumphed!',
  descriptionZh: '随着其临时首都布尔戈斯宣告解放，关键战略行省全部丢失，国民军最高指挥部意识到继续抵抗已无可能。叛乱军政委员会正式签署了无条件投降书。叛乱已被彻底平定，西班牙第二共和国赢得了最后的胜利！',
  condition: (state) => {
    if (state.civilWarStatus !== 'ongoing') return false;

    const burgos = state.provinces?.['burgos'];
    const burgosNotNationalist = burgos ? burgos.owner !== MapFaction.NATIONALIST : true;

    const provincesList = Object.values(state.provinces || {});
    const nationalistProvinces = provincesList.filter(p => p.owner === MapFaction.NATIONALIST);
    const totalStrategicValue = nationalistProvinces.reduce((sum, p) => sum + (p.strategicValue || 0), 0);

    return burgosNotNationalist && totalStrategicValue < 60;
  },
  options: [
    {
      text: 'Long Live the Republic!',
      textZh: '共和国万岁！',
      effect: (state) => ({
        civilWarStatus: 'won',
        superEvent: 'spanish_civil_war_ends'
      })
    }
  ]
};
