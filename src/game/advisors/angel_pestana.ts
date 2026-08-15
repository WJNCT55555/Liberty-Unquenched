import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const angelPestana: Advisor = {
  id: 'Ángel Pestaña',
  name: 'Ángel Pestaña',
  nameZh: '安赫尔·佩斯塔尼亚',
  faction: 'Treintistas',
  description: 'A prominent anarcho-syndicalist leader and key figure of the Treintistas. He advocates for a more moderate, syndicalist approach and closer ties with the Republic.',
  descriptionZh: '著名的无政府工团主义领导人，三十人集团的核心人物。他主张采取更温和的工团主义路线，并与共和国建立更紧密的联系。',
    image: 'img/Advisors/Angel_Pestana.png',
  actions: [
    {
      id: 'improve_relations_ir',
      title: 'Improve Relations with Left Republicans',
      titleZh: '改善与共和国左翼的关系',
      subtitle: 'Improve IR relations with CNT by +5, and Republican Authority by +5.',
      subtitleZh: 'IR与CNT关系 +5，共和国权威 +5。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        return {
          advisorActionTimer: 6,
          partyRelations: {
            ...state.partyRelations,
            IR: Math.min(100, (state.partyRelations?.IR ?? 0) + 5)
          },
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, (state.stats?.republicanAuthority ?? 0) + 5)
          }
        };
      },
      description: 'By engaging in constructive talks with Left Republicans, we have built mutual trust and strengthened the democratic authority of the Republic.',
      descriptionZh: '通过与共和国左翼进行建设性的会谈，我们建立了互信，并巩固了共和国的民主权威。',
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
