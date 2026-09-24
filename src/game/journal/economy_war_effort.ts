import type { GameState, JournalEntryDef } from '../types';
import { adjustClassSupport } from '../utils';
import { isJournalCompleted } from '../rules/economyReforms';

/**
 * 战时统筹路线（docs/经济改造方案.md §5.5）。
 *
 * 开始事件 `economy_wartime_route_choice` **只有一个选项，一次激活两条战时日志**：
 * 谁先完成谁就把对方判为失败——这是本方案唯一的硬互斥。
 */
export const economyWarEffortJournal: JournalEntryDef = {
  id: 'journal_economy_war_effort',
  title: 'Wartime Coordination',
  titleZh: '战时统筹路线',
  description: 'A war economy is not a market with soldiers in it. The unions take the distribution: grain is requisitioned at a fixed price, bread is rationed by the family book, foreign trade passes through a single office, and the banks are emptied into the Republic\'s account. It feeds the front. It also makes the state, for the first time since July, capable of giving an order that is obeyed.',
  descriptionZh: '战时经济不是"加了士兵的市场"。工会接管分配：粮食按定价征发、面包按家庭口粮本配给、对外贸易只走一个衙门、银行里的存款被倒进共和国的账户。它养活了前线，也让国家自七月以来第一次有能力下达一条会被执行的命令。',
  successCondition: 'Bank deposits seized, agricultural requisition enforced, family ration books issued, and foreign trade monopolized',
  successConditionZh: '私营银行储蓄已没收、农业强制征发已实行、家庭口粮本已发行、对外贸易已垄断',
  successEffectDesc: 'The coordination committees hold: the Republic regains executive capacity and the war economy holds together.',
  successEffectDescZh: '统筹委员会站稳了：共和国重新获得执行力，战时经济得以维系。',
  failureCondition: 'The militarization route completes first',
  failureConditionZh: '革命军事化路线先完成',
  failureEffectDesc: 'The coordination committees are absorbed into the military apparatus.',
  failureEffectDescZh: '统筹委员会被并入军事机构。',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => Math.min(
    (state.private_bank_seizure / 1) * 100,
    (state.wartime_requisition / 1) * 100,
    (state.family_rationing / 1) * 100,
    (state.wartime_trade_monopoly / 2) * 100,
  ),

  activationEventId: 'economy_wartime_route_choice',
  completionEventId: 'economy_war_effort_victory',
  failureEventId: 'economy_war_effort_conceded',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    // 两条战时日志谁先完成谁关掉对方。
    if (isJournalCompleted(state, 'journal_economy_revolutionary_war')) return 'failed';
    if (
      state.private_bank_seizure >= 1
      && state.wartime_requisition >= 1
      && state.family_rationing >= 1
      && state.wartime_trade_monopoly >= 2
    ) {
      return 'completed';
    }
    return null;
  },

  onComplete: (state: GameState) => ({
    stats: {
      ...state.stats,
      republicanAuthority: Math.min(100, state.stats.republicanAuthority + 6),
    },
    classes: adjustClassSupport(state.classes, 'PequenaBurguesia', 'CNT_FAI', -3),
  }),

  /** 输掉内部竞争本身就是代价（持续收益归零），失败事件只叙事，不再额外扣分。 */
  onFail: () => ({}),

  activeEffect: {
    description: 'Requisition and rationing put labour back into production and steady the budget, at the cost of the shopkeepers and the small traders.',
    descriptionZh: '征发与配给把劳动力压回生产、稳住预算，代价是店主与小商贩的不满。',
    apply: (state) => ({
      classes: adjustClassSupport(state.classes, 'PequenaBurguesia', 'CNT_FAI', -1 / 12),
    }),
  },
};
