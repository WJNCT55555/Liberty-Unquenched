import type { GameEvent } from '../../types';

/**
 * 战时统筹路线的结果事件（docs/经济改造方案.md §5.5）。
 *
 * 唯一需要玩家确认的转换：把 `public_order_law` 推到 2 级「共和国防卫法」——
 * 这在设计上是"战时统筹"的政治代价，必须由玩家点头。
 */
export const economyWarEffortVictory: GameEvent = {
  id: 'economy_war_effort_victory',
  meta: { category: 'war', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'United, We Shall Not Be Conquered!',
  titleZh: '团结一致！众志筹城！',
  description: 'The bread arrives. That is the whole of it, and it is more than anyone expected in July. The family book gets a family through a week, the requisition parties come back with grain instead of with bodies, and the single foreign trade office has turned a dozen small purchases into one large one that the British cannot ignore.\n\nIt has cost the Republic the goodwill of every shopkeeper who ever voted for it, and it has cost the movement a piece of its own language: the committees now enforce prices. But the front is fed, and the men who complain loudest are the men who are not hungry.',
  descriptionZh: '面包到了。全部的意义就在这一句里，而它比七月时任何人的预期都多。家庭口粮本能让人撑过一周，征发队带回来的是粮食而不是尸体，而那个唯一的对外贸易衙门把十几笔小买卖变成了一笔英国人无法无视的大买卖。\n\n代价是共和国失去了每一个曾经投票给它的店主的好感，运动也失去了一部分自己的语言：委员会现在要执行定价。但前线有饭吃，抱怨得最大声的那些人，正是没有挨饿的那些人。',
  options: [
    {
      text: 'Put the emergency powers on a legal footing. The Republic needs them.',
      textZh: '把紧急权力落到法律上。共和国需要它。',
      subtitle: 'Public Order Law → level 2, the Defense of the Republic Act. Authority rises; fervor falls.',
      subtitleZh: '公共秩序法 → 2 级「共和国防卫法」。共和国权威上升，革命热情下降。',
      effect: (state) => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          public_order_law: Math.max(state.domesticPolicy.public_order_law, 2),
        },
        stats: {
          ...state.stats,
          republicanAuthority: Math.min(100, state.stats.republicanAuthority + 3),
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 4),
        }
      })
    },
    {
      text: 'Keep them as wartime improvisation. They end with the war.',
      textZh: '让它们保持为战时的临时办法。战争结束就结束。',
      subtitle: 'No new law. The committees keep their powers without a statute behind them.',
      subtitleZh: '不立新法。委员会继续掌权，但背后没有法条。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3),
        }
      })
    }
  ]
};
