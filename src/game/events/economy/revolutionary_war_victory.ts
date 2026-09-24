import type { GameEvent } from '../../types';

/**
 * 革命军事化路线的结果事件（docs/经济改造方案.md §5.6）。
 *
 * 唯一需要玩家确认的转换：是否由军事机构直接接管集体企业的人事。
 */
export const economyRevolutionaryWarVictory: GameEvent = {
  id: 'economy_revolutionary_war_victory',
  meta: { category: 'war', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'Everything for the Revolution!',
  titleZh: '一切为了革命！',
  description: 'The conversion took four months and cost the workshops their last pretence of autonomy. A lathe that made door hinges now makes fuse bodies; a committee that used to argue for a week about hours now receives a production figure on Monday and reports on it on Friday. Foreign capital is gone, the family book is universal, and the front has more shells than it had in July.\n\nThe men who collectivized these factories in 1936 are still in them. They are simply no longer the ones deciding what the machines do.',
  descriptionZh: '转产花了四个月，代价是车间失去了最后一点自治的伪装。一台做门铰链的车床现在做引信体；一个过去会为工时争论一周的委员会，现在周一收到一个产量数字，周五就它汇报。外资没了，口粮本普及了，前线的炮弹比七月时多得多。\n\n1936 年把这些工厂集体化的人还在厂里。他们只是不再是决定机器做什么的人了。',
  options: [
    {
      text: 'Give the general staff direct authority over collective industry.',
      textZh: '把集体工业的直接管辖交给总参谋部。',
      subtitle: 'Wartime efficiency at the price of the movement\'s own principle: the committees answer to officers.',
      subtitleZh: '以运动自身的原则为代价换取战时效率：委员会向军官负责。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          bureaucratization: Math.min(100, state.stats.bureaucratization + 8),
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 6),
        }
      })
    },
    {
      text: 'Keep the committees in place and let them take the orders.',
      textZh: '让委员会留在原位，由它们接单。',
      subtitle: 'Slower, and the officers will complain; the factories stay the workers\'.',
      subtitleZh: '更慢，军官们会抱怨；但工厂仍然是工人的。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 4),
        }
      })
    }
  ]
};
