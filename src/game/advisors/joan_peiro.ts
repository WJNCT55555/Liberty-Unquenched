import { Advisor, GameState } from '../types';
import { adjustFactionInfluence } from '../utils';
import { advanceEconomyPush } from '../rules/economyReforms';
import { applyControlInfluence, applyEconomicOption } from '../rules/controlShares';
import { economyCooperativePath } from '../events/economy/cooperative_path';

/**
 * The cooperative programme needs this many advisor pushes to open the route
 * (docs/经济改造方案.md §9.3). Mirrors `ECONOMY_PUSH_LIMITS.cooperativePushes`.
 */
export const COOPERATIVE_ROUTE_PUSH_LIMIT = 2;

/** The cooperative journal is already open (the advisor action then has nothing left to do). */
const isCooperativeRouteOpen = (state: Pick<GameState, 'journal'>): boolean =>
  state.journal?.['journal_economy_cooperative']?.status === 'active';

const cooperativePushUnavailable = (state: GameState, isZh: boolean): string => {
  if ((state.economy?.cooperativePushes ?? 0) >= COOPERATIVE_ROUTE_PUSH_LIMIT || isCooperativeRouteOpen(state)) {
    return isZh ? '合作社方案已经推动完毕。' : 'The cooperative programme is already under way.';
  }
  return isZh
    ? `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`
    : `${state.advisorActionTimer} months before next advisor action.`;
};

export const joanPeiro: Advisor = {
  id: 'Joan Peiró',
  name: 'Joan Peiró',
  nameZh: '胡安·佩罗',
  faction: 'Treintistas',
  description: 'An influential anarcho-syndicalist who served as Minister of Industry during the Civil War. He focuses on economic organization and industrial collectivization.',
  descriptionZh: '一位有影响力的无政府工团主义者，在内战期间担任工业部长。他专注于经济组织和工业集体化。',
  image: 'img/Advisors/Joan_Peiro.png',
  actions: [
    {
      id: 'Joan Peiró_action1',
      title: 'Industrial Collectivization',
      titleZh: '工业集体化',
      subtitle: 'Increase worker control over the economy.',
      subtitleZh: '增加工人对经济的控制。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        ...applyControlInfluence(state, 5, { land: 0, industry: 1 })
      }),
      description: 'We have reorganized factories under direct worker management. Production is stabilizing, and the workers feel empowered.',
      descriptionZh: '我们在工人直接管理下重组了工厂。生产正在稳定，工人们感到了力量。',
    },
    {
      id: 'emergency_union_fundraising',
      title: 'Emergency Union Fundraising',
      titleZh: '工会紧急筹款',
      subtitle: 'Levy an emergency fund on the syndicates to cover the movement\'s immediate needs.',
      subtitleZh: '向各工团征收特别会费，筹措运动急需的资金。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        resources: state.resources + 3,
      }),
      description: 'An emergency levy on the syndicates has filled the movement\'s coffers without disturbing the workshops.',
      descriptionZh: '向各工团征收的特别会费充实了运动的金库，且没有打扰车间的生产秩序。',
    },
    {
      // The cooperative route's deterministic entry point: card draws decide when
      // cooperatives appear, Peiró decides whether the movement commits to them.
      id: 'peiro_promote_cooperative_route',
      title: 'Promote the Cooperative Programme',
      titleZh: '推动合作社方案',
      subtitle: 'Push the federations of purchasing and credit societies as the movement\'s answer to the agrarian question. Two rounds of work open the Cooperative Road.',
      subtitleZh: '把采购与信用合作社的联邦推为运动对农业问题的回答。两轮工作后开启「合作社之路」。',
      unavailableSubtitle: (state) => cooperativePushUnavailable(state, false),
      unavailableSubtitleZh: (state) => cooperativePushUnavailable(state, true),
      condition: (state) => state.advisorActionTimer <= 0
        && (state.economy?.cooperativePushes ?? 0) < COOPERATIVE_ROUTE_PUSH_LIMIT
        && !isCooperativeRouteOpen(state),
      effect: (state: GameState) => {
        const opensRoute = (state.economy?.cooperativePushes ?? 0) + 1 >= COOPERATIVE_ROUTE_PUSH_LIMIT;
        return {
          advisorActionTimer: 6,
          ...advanceEconomyPush(state, 'cooperativePushes'),
          // One round of work advances both ladders, ownership included.
          ...applyEconomicOption(state, 'agricultural_cooperative'),
          ...applyEconomicOption(state, 'mutual_credit_network'),
          factions: adjustFactionInfluence(state.factions, 'Treintistas', 3),
          // The second round of work is the route's start event: it carries the narrative
          // confirmation, and its option is what activates the journal (方案 §5.3).
          currentEvent: opensRoute ? economyCooperativePath : null
        };
      },
      description: 'Peiró has spent the year in the villages, and the balance sheets are beginning to mean more than the pamphlets. If the confederation commits to this programme, the countryside gets an institution it can defend.',
      descriptionZh: '佩罗在村子里待了整整一年，而资产负债表开始比传单更有说服力。如果联合会承诺这条路，乡村就得到了一所它愿意保卫的机构。',
    }
  ]
};
