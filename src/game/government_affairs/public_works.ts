import type { Card, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence } from '../utils';
import { getEconomyCounter } from '../rules/economyReforms';
import { applyEconomicOption } from '../rules/controlShares';

/**
 * 公共工程部（Ministerio de Obras Públicas，1931 年称 Fomento）。
 *
 * 这是评审里指出的第二个缺失的部：铁路、公路、港口与电报全归它管，而加泰罗尼亚的
 * 铁路集体化正是内战中最著名的一次生产资料接管。此前版本把「铁路国有化」塞在
 * 「工业与商业」卡里，等于让一个主管运输的部不存在，却让工业部去修铁路。
 *
 * 卡内四条路线：
 *   1. 把铁路交给铁路工人工团（史实：1936 年 8 月加泰罗尼亚铁路集体化）；
 *   2. 以国家名义接管铁路，交给国家而不是工会（`rail_nationalization` 计数器的另一条用法）；
 *   3. 修路与港口，为前线而非为承包商（战时补给导向）；
 *   4. 维持现状，让私营公司继续经营。
 */
export const publicWorks: Card = {
  id: 'public_works',
  title: 'Public Works',
  titleZh: '公共工程',
  type: 'Government',
  description: 'Railways, roads, ports and telegraphs are one portfolio, and nothing reaches the front without passing through it. The companies that own the lines have been moving their capital abroad since April 1931; the men who drive the trains have been asking who the railway actually belongs to. The ministry has to answer that, and then it has to keep the coal moving.',
  descriptionZh: '铁路、公路、港口与电报同属一个部，而没有任何物资能不经它到达前线。自 1931 年 4 月起，拥有这些线路的公司一直在把资本转往国外；开火车的人则一直在问：铁路到底属于谁。这个部必须回答这个问题，然后还得让煤继续运。',
  cost: 1,
  condition: (state: GameState) => (
    state.cntStance === 'govern'
    && state.ministers.publicWorks === 'CNT'
    && (state.public_works_timer || 0) <= 0
  ),
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: {
      id: 'public_works_event',
      title: 'Public Works',
      titleZh: '公共工程',
      description: 'The general manager of the Northern Railway has asked for police protection for the locomotives; the railwaymen’s union has asked for the locomotives. The ministry answers one of them this month.',
      descriptionZh: '北方铁路的总经理要求派警察保护机车；铁路工人工会要求把机车交给他们。这个月，部里只能回答其中一方。',
      date: { year: state.year, month: state.month },
      options: [
        {
          text: 'Hand the railways to the railwaymen’s union.',
          textZh: '把铁路交给铁路工人工团',
          subtitle: 'The lines pass to the union that already runs them, along with the workshops and the rolling stock. Worker control rises sharply, the companies scream expropriation, and the trains keep running — which is the only argument that matters at the front.',
          subtitleZh: '线路连同修车厂与车辆一并交给本来就在运营它们的工会。工人控制度大幅上升，公司方面高呼没收，而列车继续运行——在前线，这是唯一算数的理由。',
          effect: (s: GameState): Partial<GameState> => {
            let factions = adjustFactionDissents(s.factions, { Puristas: -5, Faistas: -3, Treintistas: 7, Cenetistas: 4 });
            factions = adjustFactionInfluence(factions, 'Cenetistas', 5);
            let classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', 5);
            classes = adjustClassSupport(classes, 'Burguesia', 'CNT_FAI', -2);

            return {
              public_works_timer: 8,
              factions,
              classes,
              ...applyEconomicOption(s, 'rail_nationalization', { industry: { bigCapital: -4, foreign: -2, union: 6 } }),
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 4),
                republicanAuthority: Math.max(0, s.stats.republicanAuthority - 3),
              },
            };
          },
        },
        {
          text: 'Nationalize the railways, but keep the unions out of the boardroom.',
          textZh: '铁路国有化，但不让工会进董事会',
          subtitle: 'The state takes the lines and the shareholders are compensated in paper. Orderly, legal, and it leaves the men who actually run the trains exactly where they were.',
          subtitleZh: '国家接管线路，股东以债券获得补偿。有序、合法，而真正在开火车的人位置完全没变。',
          effect: (s: GameState): Partial<GameState> => {
            const factions = adjustFactionDissents(s.factions, { Treintistas: -6, Cenetistas: -4, Puristas: 9, Faistas: 6 });
            let classes = adjustClassSupport(s.classes, 'PequenaBurguesia', 'CNT_FAI', -1);
            classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', -2);

            return {
              public_works_timer: 8,
              factions,
              classes,
              ...applyEconomicOption(s, 'rail_nationalization', { industry: { bigCapital: -3, state: 3 } }),
              stats: {
                ...s.stats,
                republicanAuthority: Math.min(100, s.stats.republicanAuthority + 4),
                revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 3),
              },
            };
          },
        },
        {
          text: 'Build for the front: roads, sidings and the port of Barcelona.',
          textZh: '为前线施工：公路、岔线与巴塞罗那港',
          subtitle: 'Costs 1 resource and 1 armament. Repairs the arteries the war actually uses — the coast road, the port cranes, the narrow-gauge sidings that feed the front. It buys supply, not socialism, and the Faistas will say so.',
          subtitleZh: '花费 1 资源与 1 军备。修的是战争真正用得上的动脉——海岸公路、港口吊车、通往战场的窄轨岔线。它买到的是补给，不是社会主义，无政府主义者会这样讲。',
          condition: (s: GameState) => s.resources >= 1 && s.armaments >= 1,
          unavailableSubtitle: (s: GameState) => (s.resources < 1
            ? 'Requires 1 resource.'
            : 'Requires 1 armament.'),
          unavailableSubtitleZh: (s: GameState) => (s.resources < 1
            ? '需要 1 资源。'
            : '需要 1 军备。'),
          effect: (s: GameState): Partial<GameState> => {
            let factions = adjustFactionDissents(s.factions, { Faistas: 6, Puristas: 5, Cenetistas: -4 });
            factions = adjustFactionInfluence(factions, 'Cenetistas', 3);
            const classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', 3);

            return {
              resources: s.resources - 1,
              armaments: s.armaments - 1,
              public_works_timer: 6,
              factions,
              classes,
              stats: {
                ...s.stats,
                republicanAuthority: Math.min(100, s.stats.republicanAuthority + 3),
              },
            };
          },
        },
        {
          text: 'Leave the companies in place and collect the reports.',
          textZh: '让公司继续经营，照收报告',
          subtitle: 'No expropriation this month. The ministry audits, the companies keep the receipts, and the men who asked about ownership are told to wait.',
          subtitleZh: '这个月不征收。部里做审计，公司继续留着账本，而那些问所有权的人被告知再等等。',
          effect: (s: GameState): Partial<GameState> => {
            const factions = adjustFactionDissents(s.factions, { Faistas: 8, Puristas: 10, Treintistas: -5 });
            let classes = adjustClassSupport(s.classes, 'Burguesia', 'CNT_FAI', 1);
            classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', -2);

            return {
              public_works_timer: 6,
              factions,
              classes,
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 3),
                bureaucratization: Math.min(100, s.stats.bureaucratization + 2),
              },
            };
          },
        },
      ],
    },
  }),
};

/** 铁路计数器在界面上的可读进度，供效果预览与文案复用。 */
export const getRailwayProgress = (state: GameState): number => getEconomyCounter(state, 'rail_nationalization');
