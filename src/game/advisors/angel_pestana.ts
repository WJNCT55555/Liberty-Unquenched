import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const angelPestana: Advisor = {
  id: 'Ángel Pestaña',
  name: 'Ángel Pestaña',
  nameZh: '安赫尔·佩斯塔尼亚',
  faction: 'Treintistas',
  description: 'A prominent anarcho-syndicalist leader and key figure of the Treintistas. He advocates for a more moderate, syndicalist approach and closer ties with the Republic.',
  descriptionZh: '著名的无政府工团主义领导人，三十人集团的核心人物。他主张采取更温和的工团主义路线，并与共和国建立更紧密的联系。',
    image: 'img/Ángel_Pestaña.png',
  actions: [
    {
      id: 'Ángel Pestaña_action1',
      title: 'Forge Republican Alliances',
      titleZh: '建立共和国联盟',
      subtitle: 'Improve relations with the Republican Left (IR).',
      subtitleZh: '改善与共和左翼(IR)的关系。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.IR += 10;
        newClasses.PequenaBurguesia.support.IR += 10;
        return {
          advisorActionTimer: 6,
          classes: newClasses
        };
      },
      description: 'By engaging in dialogue with moderate republicans, we have secured better conditions for our unions, though purists decry this as class collaboration.',
      descriptionZh: '通过与温和的共和派对话，我们为工会争取到了更好的条件，尽管纯粹主义者谴责这是阶级合作。',
    },
    {
      id: 'moderate_syndicalism',
      title: 'Moderate Syndicalism',
      titleZh: '温和工团主义',
      subtitle: 'Focus on gradual economic gains.',
      subtitleZh: '专注于渐进的经济收益。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          economy: Math.min(100, state.stats.economy + 10),
        }
      }),
      description: 'We must prioritize the economic well-being of the workers over immediate revolution.',
      descriptionZh: '我们必须把工人的经济福祉放在首位，而不是立即进行革命。',
    },
    {
      id: 'strengthen_treintistas',
      title: 'Strengthen the Treintistas',
      titleZh: '加强三十人集团',
      subtitle: 'Expand the influence of the moderate faction.',
      subtitleZh: '扩大温和派的影响力。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 5);
        return {
          advisorActionTimer: 6,
          factions: newFactions
        };
      },
      description: 'The radicalism of the FAI is dangerous. We must ensure the CNT remains focused on syndicalist goals.',
      descriptionZh: 'FAI的激进主义是危险的。我们必须确保CNT继续专注于工团主义目标。',
    },
    {
      id: 'prepare_the_party',
      title: 'Prepare the Party',
      titleZh: '筹备政党',
      subtitle: 'Lay the groundwork for a syndicalist political party.',
      subtitleZh: '为建立工团主义政党奠定基础。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0 && !state.isPRRevSFormed,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 2);
        return {
          advisorActionTimer: 6,
          prrevsConstructionLevel: state.prrevsConstructionLevel + 1,
          factions: newFactions,
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 2)
          }
        };
      },
      description: 'We are building the infrastructure for a political organization that can represent syndicalist interests in the Republic.',
      descriptionZh: '我们正在为一个能够在共和国中代表工团主义利益的政治组织建设基础设施。',
    }
  ]
};
