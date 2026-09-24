import type { GameEvent } from '../../types';

/**
 * 有机工团路线的结果事件（docs/经济改造方案.md §5.4）。
 *
 * 只叙事；唯一需要玩家确认的转换是"是否把工团清算所写进运动章程"。
 */
export const economyOrganicVictory: GameEvent = {
  id: 'economy_organic_victory',
  meta: { category: 'cnt', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'Iberia, Cradle of a New Era',
  titleZh: '伊比利亚，新时代的摇篮',
  description: 'There is no bank. There is a clearing office with three clerks and a filing system, and it knows what every federated industry produced last month and what every other one is owed for it. The peseta still circulates abroad, because foreigners insist on being paid in something; inside, accounts are settled the way a village settles them, in goods and in memory.\n\nThe foreign shareholders are gone, the deposits are the Republic\'s, and the confederation runs an economy that no economist in Europe would have said could run at all. Whether it can survive a war is a question the next year will answer.',
  descriptionZh: '没有银行。只有一个三名职员和一柜卷宗的清算所，而它知道每一个加入联邦的产业上个月生产了什么、其余各家该向它收多少钱。比塞塔在国外还在流通，因为外国人坚持要用某种东西付款；在国内，账目按村庄的方式结清——用货物，用记忆。\n\n外国股东走了，存款成了共和国的，而联合会经营者一个欧洲任何经济学家都会说根本运转不起来的经济体。它能不能撑过一场战争，是明年才会回答的问题。',
  options: [
    {
      text: 'Write the clearing house into the movement\'s constitution.',
      textZh: '把清算所写进运动章程。',
      subtitle: 'The confederation formalizes itself as the economy\'s central institution — a bureaucracy with an anarchist name.',
      subtitleZh: '联合会把自己正式确立为经济的中央机构——一个挂着无政府主义名字的官僚机构。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          bureaucratization: Math.min(100, state.stats.bureaucratization + 6),
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 3),
        }
      })
    },
    {
      text: 'Keep it as a working arrangement between syndicates. Nothing more.',
      textZh: '让它保持为工团之间的工作安排。仅此而已。',
      subtitle: 'Preserves the movement\'s form; the clearing office stays improvised and fragile.',
      subtitleZh: '保住运动的形式；清算所继续临时、脆弱地运转。',
      effect: () => ({})
    }
  ]
};
