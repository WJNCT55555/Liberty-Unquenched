import type { GameEvent, GameState } from '../../types';
import { adjustClassSupport } from '../../utils';

/**
 * 银行家的恐慌（docs/经济改造方案.md §7.4）。
 *
 * 由「财政手段」卡「没收私营银行储蓄」选项推入。选项本身已经把
 * `private_bank_seizure` 写成 1、把存款倒进国库，**本事件不重复结算那部分**，
 * 只承担叙事与关系/阶层微调（同一效果只能有一个归属）。
 */
export const bankersPanic: GameEvent = {
  id: 'bankers_panic',
  meta: { category: 'politics', flow: 'inline.leaf', series: ['economy'] },
  condition: () => false,
  title: 'The Bankers\' Panic',
  titleZh: '银行家的恐慌',
  description: 'By morning the ledgers of the private banks are in the hands of the Finance Ministry, and by evening the accounts have been moved to Paris and London. The foreign press has a headline ready: Spain is the second Soviet. Depositors who kept their savings in a mattress are laughing; depositors who did not are queuing outside a closed door. The Republic\'s credit abroad has just become much more expensive, and the movement has to decide whether to explain itself or to stand on the expropriation.',
  descriptionZh: '到了早上，私营银行的账本已经在财政部手里；到了晚上，账户已经转去了巴黎和伦敦。外国报纸的标题早就准备好了：西班牙是第二个苏联。把钱藏在床垫里的储户在笑，没藏的储户在一扇关着的门前排队。共和国在国外的信用刚刚变得昂贵得多，而运动必须决定：是去解释，还是就站在没收这件事上不动。',
  options: [
    {
      text: 'Stand on the expropriation. Let them write what they like.',
      textZh: '就站在没收上。让他们随便写。',
      subtitle: 'Foreign relations worsen further and the petty bourgeoisie turns away, but the movement\'s own base is electrified.',
      subtitleZh: '对外关系进一步恶化、小资产阶级离心，但运动自己的基本盘被点燃。',
      effect: (state: GameState): Partial<GameState> => ({
        relations: {
          ...state.relations,
          uk: Math.max(-100, state.relations.uk - 3),
          usa: Math.max(-100, state.relations.usa - 3),
        },
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
        },
        classes: adjustClassSupport(state.classes, 'PequenaBurguesia', 'CNT_FAI', -5)
      })
    },
    {
      text: 'Compensate the small depositors and say so loudly.',
      textZh: '偿付小额储户，并且大声说出来。',
      subtitle: 'Costs 5M from the treasury, softens the foreign reaction, and keeps some of the petty bourgeoisie on side.',
      subtitleZh: '花掉 5M 国库现金，缓和外国反应，并留住一部分小资产阶级。',
      condition: (state: GameState) => state.budget >= 5,
      unavailableSubtitle: () => 'Requires 5M in the treasury.',
      unavailableSubtitleZh: () => '需要国库现金 5M。',
      effect: (state: GameState): Partial<GameState> => ({
        budget: Math.max(0, state.budget - 5),
        relations: {
          ...state.relations,
          uk: Math.max(-100, state.relations.uk - 1),
          usa: Math.max(-100, state.relations.usa - 1),
        },
        classes: adjustClassSupport(state.classes, 'PequenaBurguesia', 'CNT_FAI', 2)
      })
    }
  ]
};
