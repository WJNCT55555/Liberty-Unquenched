import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const jaimeBalius: Advisor = {
  id: 'Jaime Balius',
  name: 'Jaime Balius',
  nameZh: '海梅·巴利乌斯',
  faction: 'Puristas',
  description: 'A radical journalist and leading figure of the Friends of Durruti Group. He opposes collaborationism and demands a revolutionary junta.',
  descriptionZh: '激进的记者，杜鲁蒂之友小组的领导人物。他反对合作主义，并要求建立革命军政府。',
  image: 'img/Jaime_Balius.png',
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
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', 10);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10),
            popularFrontUnity: Math.max(0, state.stats.popularFrontUnity - 5)
          }
        };
      },
      description: 'We must expose the betrayals of the politicians and call the workers to complete the revolution.',
      descriptionZh: '我们必须揭露政客的背叛，并号召工人完成革命。',
    },
    {
      id: 'denounce_the_ministers',
      title: 'Denounce the Ministers',
      titleZh: '谴责部长',
      subtitle: 'Attack the collaborationist leadership of the CNT-FAI.',
      subtitleZh: '攻击CNT-FAI的合作主义领导层。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', -10);
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', 5);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5)
          }
        };
      },
      description: 'Those who sit in government ministries have abandoned the working class. They must be removed.',
      descriptionZh: '那些坐在政府部门里的人已经抛弃了工人阶级。必须将他们罢免。',
    },
    {
      id: 'demand_revolutionary_junta',
      title: 'Demand Revolutionary Junta',
      titleZh: '要求革命军政府',
      subtitle: 'Call for the overthrow of the bourgeois republic.',
      subtitleZh: '呼吁推翻资产阶级共和国。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          workerControl: Math.min(100, state.stats.workerControl + 15),
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15)
        }
      }),
      description: 'All power to the working class! We must establish a revolutionary junta to direct the war and the economy.',
      descriptionZh: '一切权力归工人阶级！我们必须建立一个革命军政府来指导战争和经济。',
    }
  ]
};
