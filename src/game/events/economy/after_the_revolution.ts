import type { GameEvent } from '../../types';
import { activateJournal } from '../../rules/journalEvents';
import { ECONOMY_PUSH_LIMITS, isJournalCompleted } from '../../rules/economyReforms';

/**
 * 有机工团路线的开始事件（docs/经济改造方案.md §5.4）。
 *
 * 两个入口：桑蒂利安「推动有机工团方案」推满 3 次时由顾问行动直接推入；或土地集体化
 * 日志完成后由事件板调度——后者同样要求 `organicPushes >= 3`（方案 §5.4 的第二个
 * 入口），它是一条**补送**通道：顾问已经把方案讲完了，但那次事件因为别的原因没能
 * 落地时，集体化的完成会把这份方案重新摆到桌上。
 *
 * 它**不是**"完成集体化就送一条路线"的通道：六条路线的开门权在顾问手里
 * （佩罗 2 次 / 桑蒂利安 3 次），这里不能绕开。
 */
export const economyAfterTheRevolution: GameEvent = {
  id: 'economy_after_the_revolution',
  meta: { category: 'cnt', flow: 'solo', series: ['economy'], tags: ['journal'] },
  condition: (state) => (
    isJournalCompleted(state, 'journal_land_collectivization')
    && (state.economy?.organicPushes ?? 0) >= ECONOMY_PUSH_LIMITS.organicPushes
  ),
  title: 'After the Revolution',
  titleZh: '革命之后',
  description: 'The estates are gone. Now the harder question: what holds the new economy together? Peasants will not accept paper that nobody redeems, and the syndicates cannot federate on goodwill alone. Santillán has an answer that horrifies the bankers and the Bolsheviks alike: let the confederation itself be the clearing house — production reckoned in kind, settlements made on account, no bank in the middle and no foreign shareholder at the end of the chain.',
  descriptionZh: '庄园没了。更难的问题在后头：新经济靠什么维系？农民不会接受无人兑付的纸片，而工团之间也没法只靠善意结成联邦。桑蒂利安给出的答案让银行家和布尔什维克同样惊恐：让联合会自己充当清算所——产出以实物计、往来以账户清算，中间没有银行，链条末端没有外国股东。',
  options: [
    {
      text: 'Federate production. The confederation keeps the accounts.',
      textZh: '把生产联邦化。账本由联合会自己管。',
      effect: (state) => ({
        ...activateJournal(state, 'journal_economy_organic')
      })
    }
  ]
};
