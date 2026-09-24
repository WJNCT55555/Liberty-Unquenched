import type { GameEvent } from '../../types';

/**
 * 自由公社路线的结果事件（docs/经济改造方案.md §5.2）。
 *
 * 只叙事；唯一需要玩家确认的转换是"是否把公社联邦宣布为共和国内部的合法政权"。
 */
export const economyFreeCommuneVictory: GameEvent = {
  id: 'economy_free_commune_victory',
  meta: { category: 'cnt', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'Tierra y Libertad!',
  titleZh: '土地与自由！',
  description: 'The land reform became collectivization, collectivization became federation, and somewhere along the way the money stopped meaning anything outside the cities. A peasant in Aragon now settles his account with the syndicate in wheat and olives, and the syndicate settles with Barcelona in machine parts and cloth, and the whole chain holds together on paper and trust and nothing else in particular.\n\nMadrid has not been abolished. It has simply become irrelevant to the people who used to send it petitions. That is a stranger victory than barricades — and much harder to take back.',
  descriptionZh: '土地改革变成了集体化，集体化变成了联邦，而在这条路上的某个地方，货币在城市之外不再有任何意义。阿拉贡的农民如今用小麦和橄榄与工团结账，工团用机器零件与布匹与巴塞罗那结账，整条链条靠纸张、信任，以及别的什么也没有，维系着。\n\n马德里并没有被废除。它只是对那些曾经向它递请愿书的人变得无关紧要了。这比街垒是更奇怪的胜利——也更难被收回。',
  options: [
    {
      text: 'Declare the federation of communes a lawful authority within the Republic.',
      textZh: '宣布公社联邦是共和国境内的合法政权。',
      subtitle: 'Makes the parallel power explicit. Republican authority falls further; the countryside is ours.',
      subtitleZh: '把平行权力摆上台面。共和国权威进一步下降；乡村归我们。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          republicanAuthority: Math.max(0, state.stats.republicanAuthority - 5),
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
        }
      })
    },
    {
      text: 'Say nothing. Let Madrid keep calling it a temporary arrangement.',
      textZh: '什么也不说。让马德里继续把它称作临时安排。',
      subtitle: 'Avoids a constitutional quarrel it is not yet time to have.',
      subtitleZh: '避免一场时机未到的宪制争吵。',
      effect: () => ({})
    }
  ]
};
