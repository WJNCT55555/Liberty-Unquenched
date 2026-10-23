import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const jaimeBalius: Advisor = {
  id: 'Jaime Balius',
  name: 'Jaime Balius',
  nameZh: '海梅·巴利乌斯',
  faction: 'Puristas',
  description: 'A radical journalist and leading figure of the Friends of Durruti Group. He opposes collaborationism and demands a revolutionary junta.',
  descriptionZh: '激进的记者，杜鲁蒂之友小组的领导人物。他反对合作主义，并要求建立革命军政府。',
  image: 'img/Advisors/Jaime_Balius.png',
  actions: [
    {
      id: 'publish_el_amigo_del_pueblo',
      title: "Publish 'El Amigo del Pueblo'",
      titleZh: '出版《人民之友》',
      subtitle: 'Spread radical propaganda against the government.',
      subtitleZh: '散布反对政府的激进宣传。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const factions = adjustFactionInfluence(state.factions, 'Puristas', 8);

        return {
          advisorActionTimer: 6,
          factions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3)
          }
        };
      },
      description: 'We must expose the betrayals of the politicians and call the workers to complete the revolution.',
      descriptionZh: '我们必须揭露政客的背叛，并号召工人完成革命。',
    }
  ]
};
