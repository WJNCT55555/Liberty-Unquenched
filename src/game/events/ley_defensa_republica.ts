import type { GameEvent, GameState } from '../types';
import { adjustFactionDissents, adjustFactionInfluence, isAtOrAfter } from '../utils';
import { clampLawLevel } from '../lawStances';

const lawMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  tags: ['law'],
};

/**
 * The Ley de Defensa de la República, drafted in October 1931.
 *
 * This is the only writer of `domesticPolicy.public_order_law` in the game, so
 * the two rungs below the old jurisdiction law are opened here and nowhere else:
 *   option 2 -> public_order_law 1  (Public Order Law, a bounded framework)
 *   option 3 -> public_order_law 2  (Defense of the Republic Act, extrajudicial powers)
 *
 * The default (first) option deliberately leaves the law where it is: the 1933 and
 * 1936 scenario descriptors are replayed from the 1931 scenario through the real
 * reducer, and both record `public_order_law: 0`. Firing the statute by default
 * would silently rewrite those two start states.
 */
export const leyDefensaRepublica: GameEvent = {
  id: 'ley_defensa_republica',
  meta: lawMeta,
  date: { year: 1931, month: 10 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1931, 10),
  title: 'The Defense of the Republic Act',
  titleZh: '共和国防卫法',
  description: 'The Constituent Cortes has drafted the Ley de Defensa de la República. It would let the government suspend newspapers and associations, hold suspects without charge, and declare illegal any act "against the security of the State" — aimed at monarchist plotters and the old caciques, but worded widely enough to swallow a strike, an occupation of estates, or a meeting held without permission. The cabinet wants the Confederation\'s acquiescence, or at least its silence, and has sent a delegation to the National Committee. Whatever we answer, the union locals are already asking what they are permitted to do in the coming months.',
  descriptionZh: '制宪议会拟定了《共和国防卫法》草案。该法将允许政府查封报刊与社团、无指控羁押嫌疑人，并把任何“危害国家安全”的行为定为非法——名义上针对君主派阴谋家与旧式地方豪强，条文却宽泛到足以吞下一场罢工、一次土地占领，或一场未经许可的集会。内阁希望得到全劳联的默许，至少是沉默，并已派代表团前往全国委员会。无论我们如何答复，各地的工会组织都已在询问：接下来几个月，他们被允许做什么。',
  options: [
    {
      text: 'Refuse to recognise it. We answer with the unions, not with the Cortes.',
      textZh: '拒绝承认。我们用工会、而不是议会来回答。',
      subtitle: 'The act is fought to a standstill and public order stays on the old jurisdiction law, but the Republic marks us as its enemy and the radicals take the lead.',
      subtitleZh: '该法被抵制到无法推行，公共秩序仍沿用旧式管辖权法；但共和国将我们标记为敌人，激进派由此掌握主导权。',
      effect: (state: GameState): Partial<GameState> => {
        let factions = adjustFactionDissents(state.factions, {
          Treintistas: 8,
          Cenetistas: -3,
          Faistas: -4,
          Puristas: -3,
        });
        factions = adjustFactionInfluence(factions, 'Faistas', 6);
        factions = adjustFactionInfluence(factions, 'Puristas', 4);

        return {
          factions,
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, (state.partyRelations.PSOE || 0) - 12),
            IR: Math.max(-100, (state.partyRelations.IR || 0) - 10),
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 8),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 4),
          },
        };
      },
    },
    {
      text: 'Demand judicial guarantees before a single article is voted.',
      textZh: '在任何一个条款表决之前，先要求写入司法保障。',
      subtitle: 'Our lawyers and deputies narrow the bill into a bounded emergency framework: public order law level 1, with no detention without a hearing.',
      subtitleZh: '我们的律师与议员将法案压缩为受约束的紧急状态框架：公共秩序法提升至 1 级，且无听证不得羁押。',
      effect: (state: GameState): Partial<GameState> => {
        let factions = adjustFactionDissents(state.factions, {
          Faistas: 10,
          Puristas: 6,
          Treintistas: -4,
        });
        factions = adjustFactionInfluence(factions, 'Treintistas', 8);
        factions = adjustFactionInfluence(factions, 'Cenetistas', 3);

        return {
          factions,
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.min(100, (state.partyRelations.PSOE || 0) + 6),
            IR: Math.min(100, (state.partyRelations.IR || 0) + 6),
          },
          domesticPolicy: {
            ...state.domesticPolicy,
            public_order_law: clampLawLevel('public_order_law', 1),
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 2),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 3),
          },
        };
      },
    },
    {
      text: 'Let the Republic arm itself. Support the act as written.',
      textZh: '让共和国武装自己。按原文支持该法案。',
      subtitle: 'The Interior Ministry receives extrajudicial powers — public order law level 2 — and constitutional guarantees are suspended with it. Our own radicals will not forgive this.',
      subtitleZh: '内政部获得法外权力——公共秩序法提升至 2 级——宪法保障随之中止。我们自己的激进派不会原谅这一决定。',
      effect: (state: GameState): Partial<GameState> => {
        let factions = adjustFactionDissents(state.factions, {
          Faistas: 25,
          Puristas: 18,
        });
        factions = adjustFactionInfluence(factions, 'Treintistas', 6);
        factions = adjustFactionInfluence(factions, 'Cenetistas', -4);

        return {
          factions,
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.min(100, (state.partyRelations.PSOE || 0) + 14),
            IR: Math.min(100, (state.partyRelations.IR || 0) + 12),
            AP: Math.max(-100, (state.partyRelations.AP || 0) - 6),
            RE: Math.max(-100, (state.partyRelations.RE || 0) - 6),
          },
          domesticPolicy: {
            ...state.domesticPolicy,
            public_order_law: clampLawLevel('public_order_law', 2),
            // The act suspends the guarantees the 1931 constitution is about to write.
            political_rights: clampLawLevel('political_rights', state.domesticPolicy.political_rights - 1),
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 8),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 8),
          },
        };
      },
    },
  ],
};
