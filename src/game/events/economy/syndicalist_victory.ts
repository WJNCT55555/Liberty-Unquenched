import type { GameEvent } from '../../types';

/**
 * 温和工团路线的结果事件（docs/经济改造方案.md §5.1）。
 *
 * 只叙事：数值（工会占比、派系影响、`union_status`）已经在 `onComplete` 里立即合并。
 * 唯一需要玩家确认的转换写在选项里——把产业联合会正式改称全国产业工会。
 */
export const economySyndicalistVictory: GameEvent = {
  id: 'economy_syndicalist_victory',
  meta: { category: 'cnt', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'The Victory of Syndicalism?',
  titleZh: '工团主义的胜利？',
  description: 'It did not look like a revolution. There was no storming of ministries, no red flag over the Bank of Spain, no decree abolishing the state. There was a congress, a federation of industries, a party, a law on collective bargaining — and then one morning the men who had run the railways and the pits under workers\' committees were running them under a ministry letterhead that carried their own names.\n\nThe purists call it absorption. The moderates call it the only way an anarcho-syndicalist movement survives contact with a modern economy. Both are describing the same fact: the confederation now manages Spanish industry, and it does so from inside the Republic it once refused to enter.',
  descriptionZh: '它看起来不像革命。没有人攻占部会，没有红旗插上西班牙银行，也没有废除国家的法令。只有一次代表大会、一个产业联合会、一个党、一条集体谈判的法律——然后某个早上，那些在工人委员会下经营铁路与矿井的人，开始在一张印着自己名字的部会信纸上经营它们。\n\n纯粹派把这称作被吸收。温和派把这称作一个无政府工团主义运动与现代经济接触后唯一可能的活法。两边描述的是同一个事实：联合会现在管理者西班牙的工业，而且是从它一度拒绝进入的共和国**内部**管理。',
  options: [
    {
      text: 'Let the industrial federations become the National Syndical Federation.',
      textZh: '让产业联合会正式成为全国产业工会。',
      subtitle: 'Confirms the movement\'s new legal form: the confederation is now an administrative power.',
      subtitleZh: '确认运动的新法律形态：联合会如今是一支行政权力。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          bureaucratization: Math.min(100, state.stats.bureaucratization + 5),
        }
      })
    },
    {
      text: 'Keep the old name and the old autonomy. Say nothing.',
      textZh: '保留旧名字与旧自治。什么也不说。',
      subtitle: 'Leaves the federations as they are; the purists are not reassured either way.',
      subtitleZh: '联合会维持原状；纯粹派无论哪种选择都不会被安抚。',
      effect: () => ({})
    }
  ]
};
