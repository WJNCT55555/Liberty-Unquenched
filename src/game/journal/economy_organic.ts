import type { GameState, JournalEntryDef } from '../types';
import { adjustClassSupport } from '../utils';
import { isJournalCompleted } from '../rules/economyReforms';

/**
 * 有机工团路线（docs/经济改造方案.md §5.4）。
 *
 * 两个触发入口：桑蒂利安「推动有机工团方案」推满 3 次，或（第 5 期起）土地集体化完成后调度。
 * "有机"= 没有货币、没有银行、没有外资，只有工团之间的实物与信用网络。
 *
 * **永不失败**：原设计的"英法关系双低于 20 即失败"已删除；外交环境恶劣只是让路线更慢，
 * 代价通过 foreignExchangeGraph 的月度修正持续支付。
 */
export const economyOrganicJournal: JournalEntryDef = {
  id: 'journal_economy_organic',
  title: 'The Organic Syndicalist Road',
  titleZh: '有机工团路线',
  description: 'Santillán\'s answer to the economists: do not nationalize and do not merely collectivize — federate. Let the syndicates settle between themselves what each produces and what each receives, in kind, on credit, without a bank in the middle and without a foreign shareholder at the end of the chain. A whole economy held together by nothing but the confederation\'s own accounts.',
  descriptionZh: '桑蒂利安对经济学家的回答：不要国有化，也不要仅仅集体化——要结成联邦。让各工团彼此清算谁生产了什么、谁该得到什么：以实物、以信用，中间没有银行，链条末端没有外国股东。一整个经济体，只靠联合会自己的账本维系。',
  successCondition: 'Collectivization completed, money abolished, private bank deposits seized, the Credit and Exchange Committee founded, foreign capital seized, and the supply network built',
  successConditionZh: '土地集体化完成、货币废除、私营银行储蓄没收、信用与兑换委员会成立、外资没收、物资调控网络建成',
  successEffectDesc: 'Iberia becomes the cradle of a new era: the movement\'s intellectuals rally to the CNT, and the confederation runs an economy without money.',
  successEffectDescZh: '伊比利亚成为新时代的摇篮：知识分子向 CNT 靠拢，联合会经营着一个没有货币的经济体。',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => Math.min(
    isJournalCompleted(state, 'journal_land_collectivization') ? 100 : 0,
    (state.currency_abolition / 3) * 100,
    (state.private_bank_seizure / 1) * 100,
    (state.credit_exchange_committee / 1) * 100,
    (state.foreign_capital_seizure / 3) * 100,
    (state.supply_coordination_network / 3) * 100,
  ),

  activationEventId: 'economy_after_the_revolution',
  completionEventId: 'economy_organic_victory',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    if (
      isJournalCompleted(state, 'journal_land_collectivization')
      && state.currency_abolition >= 3
      && state.private_bank_seizure >= 1
      && state.credit_exchange_committee >= 1
      && state.foreign_capital_seizure >= 3
      && state.supply_coordination_network >= 3
    ) {
      return 'completed';
    }
    return null;
  },

  onComplete: (state: GameState) => ({
    stats: {
      ...state.stats,
      revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 8),
      bureaucratization: Math.max(0, state.stats.bureaucratization - 5),
    },
    classes: adjustClassSupport(state.classes, 'Intelectuales', 'CNT_FAI', 10),
  }),

  activeEffect: {
    description: 'Self-sufficiency has a price: the confederation earns less abroad every month, and the intellectuals are the only class still gaining faith in the experiment.',
    descriptionZh: '自给自足是有代价的：联合会每月从国外挣得更少，而知识分子是唯一对这个实验越来越有信心的阶层。',
    apply: (state) => ({
      stats: {
        ...state.stats,
        revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 0.3),
      },
      classes: adjustClassSupport(state.classes, 'Intelectuales', 'CNT_FAI', 1 / 12),
    }),
  },
};
