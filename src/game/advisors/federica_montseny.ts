import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const federicaMontseny: Advisor = {
  id: 'Federica Montseny',
  name: 'Federica Montseny',
  nameZh: '费德里卡·蒙特塞尼',
  faction: 'Faistas',
  description: 'A prominent anarchist intellectual and orator. She advocates for pragmatism and collaboration with the Republic to defeat fascism.',
  descriptionZh: '著名的无政府主义知识分子和演说家。她主张实用主义，并与共和国合作以击败法西斯主义。',
  image: 'img/Federica_Montseny.png',
  actions: [
    {
      id: 'health_reforms',
      title: 'Health Reforms',
      titleZh: '卫生改革',
      subtitle: 'Improve public health and gain middle-class support.',
      subtitleZh: '改善公共卫生并获得中产阶级的支持。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI += 5;
        newClasses.PequenaBurguesia.support.CNT_FAI += 5;
        return {
          advisorActionTimer: 6,
          classes: newClasses,
          stats: {
            ...state.stats,
            popularFrontUnity: Math.min(100, state.stats.popularFrontUnity + 5),
            economy: Math.min(100, state.stats.economy + 5)
          }
        };
      },
      description: 'By implementing progressive health policies, we can show the masses that anarchism brings tangible benefits.',
      descriptionZh: '通过实施进步的卫生政策，我们可以向群众展示无政府主义能带来切实的好处。',
    },
    {
      id: 'pragmatic_collaboration',
      title: 'Pragmatic Collaboration',
      titleZh: '务实合作',
      subtitle: 'Work with the government to secure our gains.',
      subtitleZh: '与政府合作以巩固我们的成果。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 10);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats
          }
        };
      },
      description: 'We must be realistic. Defeating fascism requires temporary alliances, even if it means compromising our ideals.',
      descriptionZh: '我们必须现实一点。击败法西斯主义需要暂时的联盟，即使这意味着妥协我们的理想。',
    },
    {
      id: 'mobilize_women',
      title: 'Mobilize Women',
      titleZh: '动员妇女',
      subtitle: 'Encourage women to join the militias and factories.',
      subtitleZh: '鼓励妇女加入民兵和工厂。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        return {
          advisorActionTimer: 6,
          stats: {
            ...state.stats,
            anarchistMilitia: Math.min(100, state.stats.anarchistMilitia + 10),
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5)
          }
        };
      },
      description: 'The revolution cannot succeed without the full participation of women in all aspects of society.',
      descriptionZh: '没有妇女在社会各个方面的充分参与，革命就不可能成功。',
    }
  ]
};
