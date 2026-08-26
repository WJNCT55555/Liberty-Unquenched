import type { GameEvent } from '../../types';
import { MapFaction } from '../../../map/types_map';

const civilWarTerminalMeta = {
  category: 'war' as const,
  flow: 'solo' as const,
  series: ['civil_war'],
  tags: ['map', 'terminal'],
};

export const republicanSurrender: GameEvent = {
  id: 'republican_surrender',
  meta: civilWarTerminalMeta,
  condition: (state) => {
    if (state.civilWarStatus !== 'ongoing') return false;

    // Madrid, Barcelona, and Valencia must not belong to the Republican Faction
    const madrid = state.provinces?.['madrid'];
    const barcelona = state.provinces?.['barcelona'];
    const valencia = state.provinces?.['valencia'];

    const madridNotRep = madrid ? madrid.owner !== MapFaction.REPUBLICAN : true;
    const barcelonaNotRep = barcelona ? barcelona.owner !== MapFaction.REPUBLICAN : true;
    const valenciaNotRep = valencia ? valencia.owner !== MapFaction.REPUBLICAN : true;

    if (!madridNotRep || !barcelonaNotRep || !valenciaNotRep) {
      return false;
    }

    // Total strategic value of Republican-controlled provinces must be below 50
    const provincesList = Object.values(state.provinces || {});
    const republicanProvinces = provincesList.filter(p => p.owner === MapFaction.REPUBLICAN);
    const totalStrategicValue = republicanProvinces.reduce((sum, p) => sum + (p.strategicValue || 0), 0);

    return totalStrategicValue < 50;
  },
  title: 'Republican Surrender',
  titleZh: '共和国投降',
  description: 'With Madrid, Barcelona, and Valencia all fallen to the nationalist rebels, and the remaining republican-controlled zones reduced to fragments with no strategic strength, the republican cabinet realizes that further bloodshed is pointless. A formal surrender document has been signed. The Second Spanish Republic has fallen.',
  descriptionZh: '随着马德里、巴塞罗那和巴伦西亚全部落入叛军之手，其余共和军控制区也已四分五裂、失去战略价值，共和国政府不得不承认继续抵抗只会带来更大的牺牲。无条件投降书正式签署，西班牙第二共和国在悲壮中宣告覆灭。',
  options: [
    {
      text: 'A dark day for liberty...',
      textZh: '自由最黑暗的一天……',
      effect: (state) => ({
        civilWarStatus: 'lost',
        superEvent: 'spanish_civil_war_ends'
      })
    }
  ]
};
