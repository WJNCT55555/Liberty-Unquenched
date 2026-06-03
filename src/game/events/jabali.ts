import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';
import { ramonFranco } from '../advisors/ramon_franco';

export const jabaliEvent: GameEvent = {
  id: 'jabali',
  title: 'Jabalí?',
  titleZh: '野猪议员？',
  description: 'The "Jabalíes" (Wild Boars) are a group of extremely radical republican deputies in the Cortes. Passionate, rowdy, and uncompromising, they reject any centralized status quo, demanding complete autonomy for the regions and a total transformation of social relations. Some of our members want to align with them to tear the old, centralized, conservative structure of Spanish society apart.',
  descriptionZh: '“野猪议员”（Jabalíes）是西班牙制宪议会中一群激进且言辞犀利的共和派议员，他们生性好斗、绝不妥协，拒绝任何中央集权的现状，要求地方实行完全自治，并彻底改变旧西班牙的社会关系。部分组织成员主张同他们联手，用“野猪的獠牙”将守旧、集权的西班牙旧制度彻底撕碎。',
  condition: (state) => {
    return state.isPRRevSFormed && state.prrevs_formed_months >= 1;
  },
  options: [
    {
      text: "Let the boar's tusks tear old Spain apart!",
      textZh: '让野猪的獠牙撕碎旧西班牙',
      subtitle: 'Unleash radical passions: introduce the Jabalistas faction (Influence 15, Dissent 0), unlock Ramón Franco as an advisor, increase revolutionary fervor, and gain worker support.',
      subtitleZh: '释放激进的狂热：引入野猪议员派系（影响力 15，分歧 0），解锁顾问拉蒙·弗朗哥加入池中，建立革命热情并赢得工人支持。',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        if (newClasses.Obreros && newClasses.Obreros.support) {
          newClasses.Obreros.support.CNT_FAI = Math.min(100, (newClasses.Obreros.support.CNT_FAI || 0) + 8);
        }
        if (newClasses.Braceros && newClasses.Braceros.support) {
          newClasses.Braceros.support.CNT_FAI = Math.min(100, (newClasses.Braceros.support.CNT_FAI || 0) + 8);
        }

        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Jabalistas', 15);
        newFactions.Jabalistas.dissent = 0;

        const newPool = [...state.advisorPool];
        if (!newPool.some(a => a.id === 'Ramón Franco')) {
          newPool.push(ramonFranco);
        }

        return {
          classes: newClasses,
          factions: newFactions,
          advisorPool: newPool,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 8)
          }
        };
      }
    },
    {
      text: 'This is too crazy...',
      textZh: '这太疯狂了......',
      subtitle: 'Distance ourselves from the radical hotheads, but slightly cools revolutionary spirits.',
      subtitleZh: '与激进的狂热分子保持距离，但会轻微冷却革命热情。',
      effect: (state) => {
        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 8),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 10)
          }
        };
      }
    }
  ]
};
