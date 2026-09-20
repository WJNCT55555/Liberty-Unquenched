import type { GameEvent, GameState } from '../types';
import { adjustFactionDissents, adjustFactionInfluence, isAtOrAfter } from '../utils';
import { clampLawLevel } from '../lawStances';

const lawMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  tags: ['law'],
};

/**
 * The Ley de Orden Público, July 1933.
 *
 * This is the second — and, with `ley_defensa_republica`, the last — writer of
 * `domesticPolicy.public_order_law`. The 1933 statute repealed the 1931 Defense
 * Act and replaced it with three declared states (prevention, alarm, war), so
 * every option that lets the bill pass lands the law on level 1; only the option
 * that re-writes the old extrajudicial clauses keeps it at level 2.
 *
 * Like `catalonia_autonomy_1932` and `la_sanjurjada`, it is gated on the
 * Republican-Socialist Cabinet rather than on the scenario id, so the historical
 * 1931 replay carries it into the November 1933 start (see `scenarios/1933.ts`).
 */
export const leyOrdenPublico: GameEvent = {
  id: 'ley_orden_publico',
  meta: lawMeta,
  date: { year: 1933, month: 7 },
  condition: (state) => isAtOrAfter(state, 1933, 7) && state.government.type === 'Republican-Socialist Cabinet',
  title: 'The Public Order Law',
  titleZh: '公共秩序法',
  description: 'The Minister of the Interior has brought the Cortes a Public Order Law to replace the Defense Act of 1931. It would set three declared states — prevention, alarm and war — each with named powers, each requiring the government to report to the Cortes, and each lapsing automatically unless it is renewed. Its defenders call it a return to legality. Its critics answer that the same raids, the same deportations to the penal colonies and the same closed newspaper offices will continue under a tidier name, and that the men who will apply it are the same men. The cabinet wants our vote, or at the very least our abstention.',
  descriptionZh: '内政部长向议会提交了《公共秩序法》，用以取代 1931 年的《共和国防卫法》。该法设立三级明定状态——预防、戒备与战争——各自对应具名的权力、都要求政府向议会报告、且到期不续即自动失效。支持者称这是回归法治；批评者则回答：同样的搜捕、同样发往流放地的船、同样被查封的报馆，只会换上一个更体面的名字继续存在，而执行它的人还是同一批人。内阁想要我们的赞成票，至少想要我们弃权。',
  options: [
    {
      text: 'Accept the framework. Three declared states beat a blank cheque.',
      textZh: '接受这套框架。三级明定状态好过一张空白支票。',
      subtitle: 'The Defense Act is replaced by a bounded emergency framework: public order law level 1, and every state of emergency must be reported to the Cortes.',
      subtitleZh: '防卫法被受约束的紧急状态框架取代：公共秩序法定为 1 级，且每次紧急状态都必须向议会报告。',
      effect: (state: GameState): Partial<GameState> => {
        let factions = adjustFactionDissents(state.factions, {
          Faistas: 8,
          Puristas: 4,
          Treintistas: -3,
        });
        factions = adjustFactionInfluence(factions, 'Treintistas', 6);

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
      text: 'Renew the Defense Act instead. The Republic cannot afford scruples.',
      textZh: '不如续行防卫法。共和国没有讲求良知的余裕。',
      subtitle: 'The extrajudicial clauses are written into the new statute: public order law level 2, and constitutional guarantees are suspended with them.',
      subtitleZh: '法外条款被写进新法：公共秩序法定为 2 级，宪法保障随之中止。',
      effect: (state: GameState): Partial<GameState> => {
        let factions = adjustFactionDissents(state.factions, {
          Faistas: 20,
          Puristas: 12,
        });
        factions = adjustFactionInfluence(factions, 'Treintistas', 5);
        factions = adjustFactionInfluence(factions, 'Cenetistas', -3);

        return {
          factions,
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.min(100, (state.partyRelations.PSOE || 0) + 8),
            IR: Math.min(100, (state.partyRelations.IR || 0) + 6),
            AP: Math.max(-100, (state.partyRelations.AP || 0) - 5),
            RE: Math.max(-100, (state.partyRelations.RE || 0) - 5),
          },
          domesticPolicy: {
            ...state.domesticPolicy,
            public_order_law: clampLawLevel('public_order_law', 2),
            // The renewed statute keeps the guarantees suspended, as the 1931 act did.
            political_rights: clampLawLevel('political_rights', state.domesticPolicy.political_rights - 1),
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 6),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 6),
          },
        };
      },
    },
    {
      text: 'No emergency law is legitimate. Denounce it and defend the accused.',
      textZh: '没有哪一部紧急状态法是正当的。公开谴责，并为被告辩护。',
      subtitle: 'The bill passes over our protests at level 1, but we refuse to legitimise it, and the movement swings back to direct action.',
      subtitleZh: '法案仍在我们的抗议声中以 1 级通过；但我们拒绝为它背书，运动重新转向直接行动。',
      effect: (state: GameState): Partial<GameState> => {
        let factions = adjustFactionDissents(state.factions, {
          Treintistas: 6,
          Cenetistas: -3,
          Faistas: -4,
          Puristas: -2,
        });
        factions = adjustFactionInfluence(factions, 'Faistas', 6);
        factions = adjustFactionInfluence(factions, 'Puristas', 4);

        return {
          factions,
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, (state.partyRelations.PSOE || 0) - 10),
            IR: Math.max(-100, (state.partyRelations.IR || 0) - 8),
          },
          domesticPolicy: {
            ...state.domesticPolicy,
            public_order_law: clampLawLevel('public_order_law', 1),
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 6),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 3),
          },
        };
      },
    },
  ],
};
