import { Advisor, GameState } from '../types';
import { adjustFactionInfluence } from '../utils';
import { advanceEconomyPush } from '../rules/economyReforms';
import { applyControlInfluence, applyEconomicOption } from '../rules/controlShares';
import { economyAfterTheRevolution } from '../events/economy/after_the_revolution';

/**
 * The organic programme needs this many advisor pushes to open the route
 * (docs/经济改造方案.md §9.3). Mirrors `ECONOMY_PUSH_LIMITS.organicPushes`.
 */
export const ORGANIC_ROUTE_PUSH_LIMIT = 3;

/** The organic journal is already open (the advisor action then has nothing left to do). */
const isOrganicRouteOpen = (state: Pick<GameState, 'journal'>): boolean => {
  const status = state.journal?.['journal_economy_organic']?.status;
  return status === 'active' || status === 'completed';
};

const organicPushUnavailable = (state: GameState, isZh: boolean): string => {
  if ((state.economy?.organicPushes ?? 0) >= ORGANIC_ROUTE_PUSH_LIMIT || isOrganicRouteOpen(state)) {
    return isZh ? '有机工团方案已经推动完毕。' : 'The organic programme is already under way.';
  }
  return isZh
    ? `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`
    : `${state.advisorActionTimer} months before next advisor action.`;
};

export const diegoAbadDeSantillan: Advisor = {
  id: 'Diego Abad de Santillán',
  name: 'Diego Abad de Santillán',
  nameZh: '迭戈·阿巴德·德·桑蒂利安',
  faction: 'Faistas',
  description: 'Anarchist intellectual, writer, and economist of the FAI. He developed comprehensive theories on self-managed socialization, and actively organized Catalonia\'s antifascist economy during the revolution.',
  descriptionZh: '无政府主义知识分子、作家，FAI著名经济理论家。他系统阐述了自决互助与自主管理的社会化经济学说，并在战时深度参与组织了加泰罗尼亚的军事经济体系。',
  image: 'img/Advisors/Diego_Abad_de_Santillan.png',
  actions: [
    {
      id: 'santillan_socialized_economics',
      title: 'Socialization Blueprint',
      titleZh: '社会化经济规划',
      subtitle: 'Advance self-managed industries and cooperative distribution networks.',
      subtitleZh: '推进企业自主管理与合作化物资分配，提升公社化生产能力。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        resources: state.resources + 5,
        ...applyControlInfluence(state, 8, { land: 0, industry: 1 })
      }),
      description: 'By defining concrete economic structures instead of pure abstractions, we have systematized factory collectivism and secured vital provisions.',
      descriptionZh: '摒弃了空洞的理论论证，我们以详尽、详实的工业规划组织工厂集体化，保障了物资产出的有序循环。',
    },
    {
      id: 'santillan_cultural_agitation',
      title: 'Publish "Tierra y Libertad"',
      titleZh: '主编《土地与自由》',
      subtitle: 'Disseminate revolutionary theory to strengthen grassroots solidarity and enthusiasm.',
      subtitleZh: '印刷并分发革命刊物，厘清理论，降低内部迷茫与内耗。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 5);
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 10);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 12)
          }
        };
      },
      description: 'Through robust educational journals and cultural forums, our message has educated an entire generation of active militants.',
      descriptionZh: '无政府主义理论报刊的广泛发行厘清了混乱概念，大幅降低了战斗员的派内分歧，激荡了广泛的革命热情。',
    },
    {
      id: 'santillan_militia_economy',
      title: 'War Economy Mobilization',
      titleZh: '战时自卫工业动员',
      subtitle: 'Coordinate weapons laboratories and industrial conversion for defensive readiness.',
      subtitleZh: '协调机械协作和轻工业改组，保障前线大后方军需自卫供给。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        armaments: state.armaments + 15,
        stats: {
          ...state.stats
        }
      }),
      description: 'By organizing a coordinated Committee of Militias and industrial experts, we turned private workshops into vital defense labs.',
      descriptionZh: '组建了跨党派的民兵技术委员会，指导地方制造业和车间转产简易防御军需，强化了反法西斯力量对国难的备战度。',
    },
    {
      // The organic route's deterministic entry point, mirroring Peiró's cooperative
      // programme. Three rounds of work open the route; the third hands the player the
      // "After the Revolution" event, which is where the journal is actually activated.
      id: 'santillan_promote_organic_route',
      title: 'Promote the Organic Programme',
      titleZh: '推动有机工团方案',
      subtitle: 'Federate production on the confederation\'s own accounts: goods in kind, settlements on credit, no bank in the middle. Three rounds of work open the Organic Road.',
      subtitleZh: '用联合会自己的账本把生产联邦化：实物计产出、以信用清算、中间不设银行。三轮工作后开启「有机工团路线」。',
      unavailableSubtitle: (state) => organicPushUnavailable(state, false),
      unavailableSubtitleZh: (state) => organicPushUnavailable(state, true),
      condition: (state) => state.advisorActionTimer <= 0
        && (state.economy?.organicPushes ?? 0) < ORGANIC_ROUTE_PUSH_LIMIT
        && !isOrganicRouteOpen(state),
      effect: (state: GameState) => {
        const opensRoute = (state.economy?.organicPushes ?? 0) + 1 >= ORGANIC_ROUTE_PUSH_LIMIT;
        return {
          advisorActionTimer: 6,
          ...advanceEconomyPush(state, 'organicPushes'),
          // One round of work advances both ladders, ownership included.
          ...applyEconomicOption(state, 'supply_coordination_network'),
          ...applyEconomicOption(state, 'foreign_capital_seizure'),
          factions: adjustFactionInfluence(state.factions, 'Faistas', 3),
          // The third round publishes the plan: the event's option is what activates the
          // journal, and its condition also allows the collectivization entry later (§5.4).
          currentEvent: opensRoute ? economyAfterTheRevolution : null
        };
      },
      description: 'Santillán has been writing this plan for two years and the clearing office has been running for one. The third round of work is what turns an improvised arrangement between syndicates into a programme the confederation answers for.',
      descriptionZh: '桑蒂利安这份方案写了两年的，而清算所已经运转了一年。第三轮工作是把它从工团之间的临时安排，变成一份联合会要为之负责的纲领。',
    }
  ]
};
