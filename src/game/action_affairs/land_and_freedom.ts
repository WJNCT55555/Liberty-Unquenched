import { Card, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissent, adjustFactionInfluence, getDissentMultiplier } from '../utils';
import { getEconomyCounter } from '../rules/economyReforms';
import { applyEconomicOption } from '../rules/controlShares';

export const landAndFreedom: Card = {
  id: 'land_and_freedom',
  title: 'Land and Freedom',
  titleZh: '土地与自由',
  type: 'Action',
  description: 'The agrarian question is central to our revolution. We must decide how to reorganize the land and the agricultural economy in the regions we control.',
  descriptionZh: '土地问题是我们革命的核心。我们必须决定如何在我们控制的地区重组土地和农业经济。',
  cost: 1,
  resourceCost: 1,
  // Economy reform turns this card from a one-shot three-way choice into the recurring
  // lever of the agrarian route, so it needs its own cooldown — otherwise a single month
  // could max out land requisition (docs/经济改造方案.md §6.6).
  condition: (state: GameState) => (state.land_and_freedom_timer || 0) <= 0,
  effect: (state) => ({
    currentEvent: {
      id: 'land_and_freedom_event',
      date: { year: state.year, month: state.month },
      title: 'Tierra y Libertad',
      titleZh: '土地与自由',
      description: 'The cry of "Tierra y Libertad" echoes across the countryside. The peasants and laborers are looking to the syndicates for leadership. To break the power of the Latifundistas and feed the revolution, we must implement our agrarian vision. But what form should it take? Complete collectivization, voluntary cooperatives, or immediate confiscation by force?',
      descriptionZh: '“土地与自由”的呼声在乡村回荡。农民和劳工作为受压迫者，正指望工会来领导他们。为了打破大地主的权力并为革命提供补给，我们必须实施我们的土地愿景。但这应该采取什么形式？是彻底的集体化、自愿的合作社，还是立即的武力没收（充公）？',
      options: [
        {
          text: 'Collectivizations',
          textZh: '农业集体化',
          subtitle: 'Abolish money and property inside the rural collectives. Work according to ability, receive according to need.',
          subtitleZh: '在农村集体中废除货币和私有财产。各尽所能，按需分配。',
          effect: (s) => {
            const multiplier = getDissentMultiplier(s.factions);
            return {
              // The rural collectives are the voluntary-collectivization counter: the
              // ownership transfer is declared on the counter itself, never here
              // (docs/工人控制度改造方案.md §4.4).
              ...applyEconomicOption(s, 'land_voluntary_collectivization'),
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 5 * multiplier),
              },
              factions: adjustFactionInfluence(s.factions, 'Cenetistas', 5),
              domesticPolicy: {
                ...s.domesticPolicy,
                land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 3)
              }
            };
          }
        },
        {
          text: 'Cooperativa',
          textZh: '合作社模式',
          subtitle: 'Encourage voluntary cooperatives. Maintain some individual plots to appease the moderate peasantry and boost yields.',
          subtitleZh: '鼓励建立自愿的合作社。保留部分个人地块，以安抚温和的农户并提高农业产量。',
          effect: (s) => {
            return {
              factions: adjustFactionInfluence(s.factions, 'Treintistas', 5),
              domesticPolicy: {
                ...s.domesticPolicy,
                land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 5)
              }
            };
          }
        },
        {
          text: 'Incautación',
          textZh: '直接夺取',
          subtitle: 'Commit our armed detachments to seize the estates of the Latifundistas and the reactionaries immediately.',
          subtitleZh: '投入我们的武装力量，立即没收大地主和反动派的庄园。',
          condition: (s) => s.armaments >= 1,
          unavailableSubtitle: () => 'Need at least 1 armament.',
          unavailableSubtitleZh: () => '需要至少 1 军备。',
          effect: (s) => {
            return {
              armaments: Math.max(0, s.armaments - 1),
              land_and_freedom_timer: 3,
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 5),
              },
              factions: adjustFactionInfluence(s.factions, 'Faistas', 5),
              domesticPolicy: {
                ...s.domesticPolicy,
                land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 10)
              }
            };
          }
        },
        // Economy reform: rural land requisition and forced collectivization
        // (docs/经济改造方案.md §6.6, 工人控制度改造方案 §4.6). Every economic option reads
        // as **counter +1 for the ledger, plus the ownership transfer that is the effect**.
        {
          text: 'Requisition the estates by force.',
          textZh: '武装征用大庄园',
          subtitle: 'Armed detachments move onto the estates and the deeds are burned in the yard. Costs 1 armament; the yeomanry will not forget it.',
          subtitleZh: '武装队开进庄园，地契在院子里烧掉。消耗 1 军备；自耕农不会忘记这件事。',
          condition: (s) => s.armaments >= 1,
          unavailableSubtitle: () => 'Need at least 1 armament.',
          unavailableSubtitleZh: () => '需要至少 1 军备。',
          effect: (s) => {
            let classes = adjustClassSupport(s.classes, 'Braceros', 'CNT_FAI', 6);
            classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', -4);
            classes = adjustClassSupport(classes, 'Latifundistas', 'CNT_FAI', -8);
            return {
              armaments: Math.max(0, s.armaments - 1),
              land_and_freedom_timer: 3,
              // The estates pass to the collectives; some land becomes state property
              // because a requisition needs a legal owner to register it.
              ...applyEconomicOption(s, 'land_requisition'),
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 3),
              },
              factions: adjustFactionInfluence(s.factions, 'Faistas', 3),
              domesticPolicy: {
                ...s.domesticPolicy,
                land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 8)
              },
              classes
            };
          }
        },
        {
          text: 'Collectivize by force.',
          textZh: '强制集体化',
          subtitle: 'The village is told to pool its land. Yields will fall before they rise, and the Church will preach against it. Costs 2 armaments and 1 resource.',
          subtitleZh: '村庄被要求把土地合并。产量会先跌后涨，教会会公开反对。消耗 2 军备与 1 资源。',
          condition: (s) => s.armaments >= 2 && s.resources >= 1,
          unavailableSubtitle: () => 'Need at least 2 armaments and 1 resource.',
          unavailableSubtitleZh: () => '需要至少 2 军备与 1 资源。',
          effect: (s) => {
            const next = { ...s, ...applyEconomicOption(s, 'land_forced_collectivization') } as GameState;
            const uses = getEconomyCounter(next, 'land_forced_collectivization');
            let classes = adjustClassSupport(s.classes, 'Braceros', 'CNT_FAI', 8);
            classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', -8);
            classes = adjustClassSupport(classes, 'Clero', 'CNT_FAI', -4);
            return {
              armaments: Math.max(0, s.armaments - 2),
              resources: s.resources - 1,
              land_and_freedom_timer: 3,
              // Forced pooling takes from every private holder at once — the estates, the
              // Church and the yeomanry — and needs the state to enforce it.
              ...applyEconomicOption(s, 'land_forced_collectivization'),
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 6),
              },
              // The FAI only turns on the movement once coercion becomes routine.
              factions: uses >= 3
                ? adjustFactionDissent(s.factions, 'Faistas', 6)
                : s.factions,
              domesticPolicy: {
                ...s.domesticPolicy,
                land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 10)
              },
              classes
            };
          }
        }
      ]
    }
  }),
};

