import type { GameEvent } from '../../types';
import { adjustClassSupport } from '../../utils';

/**
 * 自治合作社路线的结果事件（docs/经济改造方案.md §5.3）。
 *
 * 只叙事；唯一需要玩家确认的转换是"是否让合作社联邦取得全国采购与信贷的垄断地位"。
 */
export const economyCooperativeVictory: GameEvent = {
  id: 'economy_cooperative_victory',
  meta: { category: 'cnt', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'Mutual Aid, Cooperation, Freedom',
  titleZh: '互助、合作、自由',
  description: 'The men who would have shot at a requisition party have spent three years signing minutes. The purchasing federation sells the olive crop without a middleman, the credit union has driven the usurer out of four provinces, and the workshops that joined the industrial cooperatives did it by vote, in meetings, with quorum.\n\nIt is the least dramatic thing the confederation has ever built, and the only one the countryside actually defends. Ask a smallholder in Castile what the CNT is, and he will not answer with an idea. He will answer with a warehouse.',
  descriptionZh: '那些会朝征发队开枪的人，花了三年时间在会议纪要上签名。采购联合会绕开中间商卖掉了橄榄，信用合作社把高利贷者赶出了四个省，而加入工业合作社的作坊是投票决定的——在会议上、有法定人数、有记录。\n\n这是联合会建过的最不戏剧化的一样东西，也是乡村唯一真正会去保卫的东西。去问卡斯蒂利亚的一个自耕农 CNT 是什么，他不会用一个理念回答你。他会用一座仓库回答你。',
  options: [
    {
      text: 'Give the cooperative federation the national monopoly on purchasing and credit.',
      textZh: '让合作社联邦取得全国采购与信贷的垄断地位。',
      subtitle: 'Turns the cooperatives into an economic power — and the smallholders into a constituency with something to lose.',
      subtitleZh: '把合作社变成一支经济力量——也让自耕农成为有东西可失去的选民。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          republicanAuthority: Math.min(100, state.stats.republicanAuthority + 3),
        },
        classes: adjustClassSupport(state.classes, 'PequenaBurguesia', 'CNT_FAI', 4)
      })
    },
    {
      text: 'Leave purchasing to the open market and keep the cooperatives voluntary.',
      textZh: '把采购留给公开市场，合作社保持自愿。',
      subtitle: 'No monopoly, no new enemies. The federation stays a federation.',
      subtitleZh: '不设垄断，不制造新敌人。联邦就还是联邦。',
      effect: () => ({})
    }
  ]
};
