import type { Card, GameEvent, GameState } from '../types';
import { adjustFactionDissents } from '../utils';
import { getEconomyCounter } from '../rules/economyReforms';
import { applyEconomicOption } from '../rules/controlShares';

/**
 * Commerce and Trade (docs/经济改造方案.md §6.3).
 *
 * Gated on the CNT holding Foreign Affairs (`estado`) or Finance. It does not conflict
 * with the Foreign Policy card mechanically, but both write into the same international
 * relation readings, so the player is choosing between them in practice.
 */
export const tradePolicy: Card = {
  id: 'trade_policy',
  title: 'Commerce and Trade',
  titleZh: '商业与贸易',
  type: 'Government',
  description: 'A Republic at war buys more than it sells, and the difference has to be paid for in something other than promises. The confederation can let the market find its own level, or it can put foreign trade under a single office and decide what leaves Spain and what comes back — which is the only way to make a blockade into a bargaining position rather than a sentence.',
  descriptionZh: '处于战争中的共和国买得比卖得多，而差额不能用承诺来付。联合会可以让市场自己找价格，也可以把对外贸易收进一个衙门，决定什么离开西班牙、什么回来——这是把封锁从判决书变成谈判筹码的唯一办法。',
  cost: 1,
  condition: (state: GameState) => (
    state.cntStance === 'govern'
    && (state.ministers.estado === 'CNT' || state.ministers.finance === 'CNT')
    && (state.trade_policy_timer || 0) <= 0
  ),
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: tradePolicyEvent(state)
  })
};

const CONCLUDE_TRADE_POLICY = (state: GameState): Partial<GameState> => ({
  trade_policy_timer: 6,
  currentEvent: null
});

const tradePolicyEvent = (state: GameState): GameEvent => ({
  id: 'trade_policy_event',
  date: { year: state.year, month: state.month },
  title: 'Commerce and Trade',
  titleZh: '商业与贸易',
  description: 'The customs house at Barcelona is a queue of clerks; the customs house at Irún is a queue of lorries. Somewhere between them the Republic\'s foreign trade is being conducted by whoever happens to hold the bill of lading.',
  descriptionZh: '巴塞罗那的海关是一队职员；伊伦的海关是一队卡车。在这两者之间的某个地方，共和国的对外贸易正由手上有提单的那个人决定。',
  options: [
    {
      text: 'Put foreign trade under a single state office.',
      textZh: '实行战时外贸垄断',
      subtitle: 'Wartime only. Exports and imports pass through one buyer, which is the only lever that makes Moscow interested and London nervous.',
      subtitleZh: '仅限战时。进出口只经过一个买家——这是唯一能让莫斯科感兴趣、让伦敦紧张的杠杆。',
      condition: (s: GameState) => getEconomyCounter(s, 'wartime_trade_monopoly') < 2
        && s.civilWarStatus === 'ongoing',
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'wartime_trade_monopoly') >= 2
        ? 'Foreign trade is already monopolized.'
        : 'Only available while the civil war is ongoing.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'wartime_trade_monopoly') >= 2
        ? '对外贸易已经完成垄断。'
        : '仅在内战进行中可用。'),
      effect: (s: GameState): Partial<GameState> => {
        const next = { ...s, ...applyEconomicOption(s, 'wartime_trade_monopoly') } as GameState;
        const completed = getEconomyCounter(next, 'wartime_trade_monopoly') >= 2;
        return {
          ...applyEconomicOption(s, 'wartime_trade_monopoly'),
          foreign_exchange: Math.min(2500, (s.foreign_exchange ?? 0) + 8),
          relations: {
            ...s.relations,
            ussr: Math.min(100, s.relations.ussr + 8),
            uk: Math.max(-100, s.relations.uk - 6)
          },
          factions: completed ? adjustFactionDissents(s.factions, { Puristas: 4 }) : s.factions,
          ...CONCLUDE_TRADE_POLICY(s)
        };
      }
    },
    {
      text: 'Trade coal for grain with France.',
      textZh: '与法国签订煤炭换粮食协定',
      subtitle: 'Sells Asturian coal across the border and buys wheat back. Costs 1M in freight and advance payment.',
      subtitleZh: '把阿斯图里亚斯的煤卖过边境，把小麦买回来。花费 1M 运费与预付款。',
      condition: (s: GameState) => getEconomyCounter(s, 'coal_nationalization') >= 1
        && s.relations.france >= 30
        && s.budget >= 1,
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'coal_nationalization') < 1
        ? 'Requires the coal mines under workers\' control.'
        : s.relations.france < 30
          ? 'Requires relations with France of at least 30.'
          : 'Requires 1M in the treasury.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'coal_nationalization') < 1
        ? '需要煤矿已在工人控制之下。'
        : s.relations.france < 30
          ? '需要与法国的关系至少 30。'
          : '需要国库现金 1M。'),
      effect: (s: GameState): Partial<GameState> => ({
        budget: Math.max(0, s.budget - 1),
        foreign_exchange: Math.min(2500, (s.foreign_exchange ?? 0) + 4),
        relations: {
          ...s.relations,
          france: Math.min(100, s.relations.france + 5)
        },
        ...CONCLUDE_TRADE_POLICY(s)
      })
    },
    {
      text: 'Settle the sterling balances.',
      textZh: '与英国清算英镑余额',
      subtitle: 'Converts frozen commercial balances into usable exchange, at the price of accepting the City\'s conditions.',
      subtitleZh: '把冻结的商业余额换成可用的外汇，代价是接受伦敦城的条件。',
      condition: (s: GameState) => s.relations.uk >= 25,
      unavailableSubtitle: () => 'Requires relations with Britain of at least 25.',
      unavailableSubtitleZh: () => '需要与英国的关系至少 25。',
      effect: (s: GameState): Partial<GameState> => ({
        foreign_exchange: Math.min(2500, (s.foreign_exchange ?? 0) + 12),
        relations: {
          ...s.relations,
          uk: Math.min(100, s.relations.uk + 3),
          ussr: Math.max(-100, s.relations.ussr - 2)
        },
        ...CONCLUDE_TRADE_POLICY(s)
      })
    },
    {
      text: 'Leave trade to the market this session.',
      textZh: '本次不干预贸易',
      subtitle: 'No new controls; the customs houses keep their queues.',
      subtitleZh: '不设新管制；海关继续排它的队。',
      effect: (s: GameState): Partial<GameState> => CONCLUDE_TRADE_POLICY(s)
    }
  ]
});
