import type { Card, CommitteeStrategy, GameEvent, GameState } from '../types';
import { buildCommuneGovernment } from '../rules/communeFederation';
import { clearRulingCoalitionForRegime } from '../utils/coalition';

const communeMeta = {
  category: 'politics' as const,
  flow: 'inline.root' as const,
  series: ['polity', 'commune_federation'],
  tags: ['polity', 'commune_federation'],
};

const hasCompletedCommuneSettlement = (state: GameState): boolean => {
  const latest = state.postwarSettlement
    ?? state.iberianSettlement
    ?? state.asturiasVictory;
  return Boolean(latest?.regime === 'free_commune_federation' && latest.completedAt);
};

/**
 * After a free-commune settlement, create the initial Federal Coordination
 * Council. The player can then use the “Council Strategy” card to reconfigure
 * the commission balance.
 */
export const communeFederationTransition: GameEvent = {
  id: 'commune_federation_transition',
  meta: communeMeta,
  condition: (state) => hasCompletedCommuneSettlement(state)
    && state.polity?.type !== 'free_commune_federation',
  title: 'The Free Commune Federation Is Proclaimed',
  titleZh: '自由公社联邦宣告成立',
  description: 'The old state has been dissolved. Communes and unions send recallable delegates to a Federal Congress; no president, no prime minister, no ministers remain. The Federal Coordination Council must now be composed from the CNT tendencies and the surviving parties. The revolution has no capital and no cabinet — only coordination.',
  descriptionZh: '旧国家已经解散。公社与工会派出可召回的代表参加联邦大会；没有总统、没有总理、没有部长。联邦协调委员会必须由 CNT 各派系与尚存的政党组成。革命没有首都，也没有内阁——只有协调。',
  options: [
    {
      text: 'Proclaim the Federation. Coordinate, do not command.',
      textZh: '宣告联邦成立。协调，而不是命令。',
      subtitle: 'Create a provisional Federal Coordination Council; the Council Strategy card can reconfigure it.',
      subtitleZh: '组成临时联邦协调委员会；之后可用“委员会方略”卡重新配置。',
      effect: (state) => {
        const next = buildCommuneGovernment(state, 'united_front');
        const cleared = clearRulingCoalitionForRegime({ ...state, ...next });
        return {
          ...cleared,
          currentEvent: null,
        };
      },
    },
  ],
};

export const communeStrategyEvent: GameEvent = {
  id: 'commune_strategy_event',
  meta: { ...communeMeta, flow: 'inline.node' },
  title: 'Council Strategy',
  titleZh: '委员会方略',
  description: 'The Federal Congress must decide how the Coordination Council is balanced between the communes, the industrial unions and the parties. This is not a cabinet; it is a choice about who coordinates, and how much coordination the communes will tolerate.',
  descriptionZh: '联邦大会必须决定协调委员会在公社、产业工会与政党之间如何平衡。这不是组阁，而是选择“谁来协调”，以及公社愿意容忍多少协调。',
  options: [
    {
      text: 'Commune primacy: the free communes come first.',
      textZh: '公社优先：自由公社至上。',
      subtitle: 'More commissions to CNT tendencies rooted in communal autonomy; coordination is weaker.',
      subtitleZh: '更多委员会交给主张公社自治的 CNT 派系；协调能力较弱。',
      effect: (state) => ({
        polity: state.polity
          ? { ...state.polity, committeeStrategy: 'commune_primacy' }
          : state.polity,
        currentEvent: communeCoordinationCouncil,
      }),
    },
    {
      text: 'Union primacy: the industrial federations coordinate the economy.',
      textZh: '工团优先：产业联合会协调经济。',
      subtitle: 'More commissions to the syndicalist wing; parties are marginalized.',
      subtitleZh: '更多委员会交给工团派系；政党被边缘化。',
      effect: (state) => ({
        polity: state.polity
          ? { ...state.polity, committeeStrategy: 'union_primacy' }
          : state.polity,
        currentEvent: communeCoordinationCouncil,
      }),
    },
    {
      text: 'United front: CNT tendencies and parties share the Council.',
      textZh: '联合阵线：CNT 派系与政党共治。',
      subtitle: 'A broader but slower Coordination Council.',
      subtitleZh: '更广泛但更缓慢的协调委员会。',
      effect: (state) => ({
        polity: state.polity
          ? { ...state.polity, committeeStrategy: 'united_front' }
          : state.polity,
        currentEvent: communeCoordinationCouncil,
      }),
    },
    {
      text: 'Coordination primacy: give the Council the agenda and the chair.',
      textZh: '协调优先：把议程与召集权交给协调委员会。',
      subtitle: 'More effective in war and crisis; risks recreating a state.',
      subtitleZh: '在战争与危机中更有效；但有重新造出国家的风险。',
      effect: (state) => ({
        polity: state.polity
          ? { ...state.polity, committeeStrategy: 'coordination_primacy' }
          : state.polity,
        currentEvent: communeCoordinationCouncil,
      }),
    },
  ],
};

export const communeCoordinationCouncil: GameEvent = {
  id: 'commune_coordination_council',
  meta: { ...communeMeta, flow: 'inline.leaf' },
  title: 'Compose the Federal Coordination Council',
  titleZh: '组成联邦协调委员会',
  description: 'Twelve commissions are to be filled. CNT delegates take their commissions as mandated coordinators, not ministers; the remaining seats go to the parties according to the Federal Congress balance. The communes may reject any accord they consider an imposition.',
  descriptionZh: '十二个委员会等待分配。CNT 代表以受命协调人而非部长的身份取得委员会；其余席位按联邦大会的党派比例分配。公社可以拒绝任何被视为强加的命令。',
  options: [
    {
      text: 'Confirm the composition. Coordination begins.',
      textZh: '确认组成。协调开始。',
      subtitle: 'Apply the current Council Strategy and commission balance.',
      subtitleZh: '按当前委员会方略与委员会配额生效。',
      effect: (state) => {
        const strategy: CommitteeStrategy = state.polity?.committeeStrategy ?? 'united_front';
        const next = buildCommuneGovernment(state, strategy);
        const cleared = clearRulingCoalitionForRegime({ ...state, ...next });
        return {
          ...cleared,
          currentEvent: null,
        };
      },
    },
    {
      text: 'Return to the Council Strategy.',
      textZh: '返回委员会方略。',
      subtitle: 'Choose a different balance before confirming.',
      subtitleZh: '在确认前选择另一种平衡。',
      effect: () => ({ currentEvent: communeStrategyEvent }),
    },
  ],
};

/**
 * The “Council Strategy” card. It costs 1 resource and 1 action, and opens the
 * four-way strategy choice above. The chosen strategy then opens the
 * Coordination Council government card.
 */
export const communeStrategyCard: Card = {
  id: 'commune_strategy',
  title: 'Council Strategy',
  titleZh: '委员会方略',
  type: 'Government',
  description: 'The Federal Coordination Council can be balanced in several ways. Choose how the communes, the industrial unions and the parties will coordinate — and what the cost of coordination will be.',
  descriptionZh: '联邦协调委员会可以有不同的平衡方式。选择公社、产业工会与政党如何协调，以及协调要付出什么代价。',
  cost: 1,
  resourceCost: 1,
  condition: (state) => state.polity?.type === 'free_commune_federation',
  effect: () => ({ currentEvent: communeStrategyEvent }),
};

export const COMMUNE_FEDERATION_EVENTS: GameEvent[] = [
  communeFederationTransition,
  communeStrategyEvent,
  communeCoordinationCouncil,
];
