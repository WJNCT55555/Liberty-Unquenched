import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const marianoRodriguez: Advisor = {
  id: 'mariano_rodriguez',
  name: 'Mariano R. Vázquez',
  nameZh: '马里亚诺·罗德里格斯',
  faction: 'Cenetistas',
  description: 'Secretary General of the CNT National Committee, known as "Marianet". A pragmatic organizer who believes strict organization and compromise are necessary to win the war.',
  descriptionZh: 'CNT 全国委员会秘书长，被称为 "Marianet"。一位务实的组织者，他认为为了赢得战争，必须建立严密的组织结构甚至妥协。',
  image: 'img/Mariano Rodríguez Vázquez.png',
  actions: [
    {
      id: 'centralize_command',
      title: 'Centralize Command',
      titleZh: '集中指挥',
      subtitle: 'Guerrilla romanticism won\'t win a modern war. We need discipline.',
      subtitleZh: '游击队式的浪漫主义赢不了现代战争。我们需要纪律。',
      description: '',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        ...state,
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          anarchistMilitia: Math.min(100, state.stats.anarchistMilitia + 10)
        },
        factions: {
          ...adjustFactionInfluence(state.factions, 'Cenetistas', 10),
          Puristas: { ...state.factions.Puristas, dissent: Math.min(100, state.factions.Puristas.dissent + 15) }
        }
      })
    },
    {
      id: 'pragmatic_compromise',
      title: 'Pragmatic Compromise',
      titleZh: '务实妥协',
      subtitle: 'Social revolution must temporarily yield to the needs of the war.',
      subtitleZh: '社会革命必须暂时让位于战争的需要。',
      description: '',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        ...state,
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          popularFrontUnity: Math.min(100, state.stats.popularFrontUnity + 10),
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5)
        },
        partyRelations: {
          ...state.partyRelations,
          PSOE: Math.min(100, state.partyRelations.PSOE + 5),
          PCE: Math.min(100, state.partyRelations.PCE + 5)
        }
      })
    },
    {
      id: 'maintain_unity',
      title: 'Maintain Unity',
      titleZh: '维护团结',
      subtitle: 'Mediate between factions to keep the confederation together.',
      subtitleZh: '在各派系之间进行调解，以保持联盟的团结。',
      description: '',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        ...state,
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          bureaucratization: Math.min(100, state.stats.bureaucratization + 6)
        },
        factions: {
          ...state.factions,
          Treintistas: { ...state.factions.Treintistas, dissent: Math.max(0, state.factions.Treintistas.dissent - 2) },
          Cenetistas: { ...state.factions.Cenetistas, dissent: Math.max(0, state.factions.Cenetistas.dissent - 2) },
          Faistas: { ...state.factions.Faistas, dissent: Math.max(0, state.factions.Faistas.dissent - 2) },
          Puristas: { ...state.factions.Puristas, dissent: Math.max(0, state.factions.Puristas.dissent - 2) }
        }
      })
    }
  ]
};
