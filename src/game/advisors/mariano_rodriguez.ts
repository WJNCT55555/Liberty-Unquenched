import { Advisor } from '../types';
import {
  adjustFactionDissent,
  adjustFactionDissents,
  COALITION_FRICTION_COMMITMENT,
  getDissentMultiplier,
  getRulingCoalitionMembers,
  raiseRulingCoalitionContribution,
} from '../utils';

export const marianoRodriguez: Advisor = {
  id: 'mariano_rodriguez',
  name: 'Mariano R. Vázquez',
  nameZh: '马里亚诺·罗德里格斯',
  faction: 'Cenetistas',
  description: 'Secretary General of the CNT National Committee, known as "Marianet". A pragmatic organizer who believes strict organization and compromise are necessary to win the war.',
  descriptionZh: 'CNT 全国委员会秘书长，被称为 "Marianet"。一位务实的组织者，他认为为了赢得战争，必须建立严密的组织结构甚至妥协。',
  image: 'img/Advisors/Mariano_Rodriguez_Vazquez.png',
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
      effect: (state) => {
        const factions = adjustFactionDissent(state.factions, 'Puristas', 7);

        return {
          advisorActionTimer: 6,
          stats: {
            ...state.stats,
            // The recruitment gain shrinks as the movement's overall dissent rises.
            anarchistMilitia: Math.min(100, state.stats.anarchistMilitia + 10 * getDissentMultiplier(state.factions))
          },
          factions
        };
      }
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
      subtitle: 'Reduce friction between the internal factions.',
      subtitleZh: '降低内部派系矛盾。',
      description: '',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        const factions = adjustFactionDissents(state.factions, {
          Treintistas: -6,
          Cenetistas: -6,
          Faistas: -6
        });

        return {
          advisorActionTimer: 6,
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 6)
          },
          factions
        };
      }
    },
    {
      id: 'mariano_coalition_friction',
      title: 'Reduce Coalition Friction',
      titleZh: '降低联盟分歧',
      subtitle: 'Mediate inside the ruling coalition to raise the CNT-FAI\'s commitment, and with it the coalition\'s cohesion.',
      subtitleZh: '在执政联盟内部斡旋，提高 CNT-FAI 的承诺度，从而抬升联盟凝聚力。',
      unavailableSubtitle: (state) => {
        if (state.cntStance !== 'cooperate') {
          return 'Requires the CNT-FAI to be cooperating with the government.';
        }
        if (!getRulingCoalitionMembers(state).includes('CNT_FAI')) {
          return 'Requires the CNT-FAI to sit in the ruling coalition.';
        }
        if (!getRulingCoalitionMembers(state).includes('PSOE')) {
          return 'Requires the PSOE in the same ruling coalition.';
        }
        return `${state.advisorActionTimer} months before next advisor action.`;
      },
      unavailableSubtitleZh: (state) => {
        if (state.cntStance !== 'cooperate') {
          return '需要 CNT-FAI 对政府采取合作态度。';
        }
        if (!getRulingCoalitionMembers(state).includes('CNT_FAI')) {
          return '需要 CNT-FAI 身处执政联盟。';
        }
        if (!getRulingCoalitionMembers(state).includes('PSOE')) {
          return '需要社会党在同一执政联盟内。';
        }
        return `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`;
      },
      condition: (state) => state.advisorActionTimer <= 0
        && state.cntStance === 'cooperate'
        && getRulingCoalitionMembers(state).includes('CNT_FAI')
        && getRulingCoalitionMembers(state).includes('PSOE'),
      effect: (state) => ({
        advisorActionTimer: 6,
        // Commitment is the source of truth; cohesion is recomputed from it.
        activeCoalitions: raiseRulingCoalitionContribution(state, 'CNT_FAI', COALITION_FRICTION_COMMITMENT)
      }),
      description: 'Marianet has spent the month on the telephone: the ministry keeps its ministry, the PSOE gets its guarantees, and the pact holds for another season.',
      descriptionZh: '马里亚内这个月把时间花在电话上：部里保住自己的部，社会党拿到保证，协议又撑过一个季度。',
    }
  ]
};
