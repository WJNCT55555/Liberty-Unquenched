import type { Card, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissents } from '../utils';
import { getEconomyCounter } from '../rules/economyReforms';
import { applyEconomicOption } from '../rules/controlShares';

/**
 * 商业部（Ministerio de Comercio）。
 *
 * 「工业与商业部」在 1933 年 12 月成立时是一个部，1936 年 11 月战时改组才把商业拆出来
 * 交给 CNT 的洛佩斯·桑切斯（见 `events/civil_war/health_ministry.ts` 的同类处理与
 * `rules/wartimeCoalition.ts` 的内阁表）。此前版本把外贸垄断与煤炭换粮食放在
 * 「商业与贸易」卡里，由外交或财政部长发放——那是机制折衷，不是史实。
 *
 * 现在商业部有自己的卡：它管的是海关、提单与商铺，而不是税率（财政部）或外交
 * （国务部）。战争时期的对外贸易只有两种命运——被封锁掐死，或者被收进一个衙门当筹码。
 */
export const commercePolicy: Card = {
  id: 'commerce_policy',
  title: 'Commerce',
  titleZh: '商业',
  type: 'Government',
  description: 'A Republic at war buys more than it sells, and the difference has to be paid for in something other than promises. The customs houses at Barcelona and Irún are the two doors the country still has. The ministry decides whether they stay open to whoever holds a bill of lading, or close behind a single buyer.',
  descriptionZh: '处于战争中的共和国买得比卖得多，而差额不能用承诺来付。巴塞罗那与伊伦的海关是这个国家仅剩的两扇门。这个部决定这两扇门是对所有拿着提单的人敞开，还是在一个买家身后关上。',
  cost: 1,
  condition: (state: GameState) => (
    state.cntStance === 'govern'
    && state.ministers.commerce === 'CNT'
    && (state.commerce_policy_timer || 0) <= 0
  ),
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: {
      id: 'commerce_policy_event',
      title: 'Commerce',
      titleZh: '商业',
      description: 'A clerk at the port has two manifests in front of him: one for a British freighter carrying petrol, one for a German one carrying the same. Both are legal. One of them is useful.',
      descriptionZh: '港口的职员面前摆着两份舱单：一份是英国货轮运的汽油，一份是德国货轮运的同样的东西。两份都合法。其中一份有用。',
      date: { year: state.year, month: state.month },
      options: [
        {
          text: 'Put foreign trade under a single state office.',
          textZh: '把对外贸易收进一个衙门',
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
            const next = { ...s, ...applyEconomicOption(s, 'wartime_trade_monopoly', { industry: { foreign: -3, state: 3 } }) } as GameState;
            const completed = getEconomyCounter(next, 'wartime_trade_monopoly') >= 2;
            const factions = adjustFactionDissents(s.factions, completed ? { Puristas: 4 } : { Puristas: 2 });

            return {
              commerce_policy_timer: 8,
              factions,
              ...applyEconomicOption(s, 'wartime_trade_monopoly', { industry: { foreign: -3, state: 3 } }),
              stats: {
                ...s.stats,
                republicanAuthority: Math.min(100, s.stats.republicanAuthority + 2),
              },
            };
          },
        },
        {
          text: 'Sell the coal we have and buy the grain we need.',
          textZh: '用我们有的煤换我们缺的粮',
          subtitle: 'A barter agreement that bypasses the gold and the sterling balances altogether: Asturian and León coal out, Argentine and Canadian grain in. It works exactly as long as nobody inspects the flag on the ships.',
          subtitleZh: '一项绕开黄金与英镑余额的易货协定：阿斯图里亚斯与莱昂的煤出去，阿根廷与加拿大的粮食进来。只要没人细查船上的旗，它就完全可行。',
          effect: (s: GameState): Partial<GameState> => {
            let classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', 3);
            classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 3);
            classes = adjustClassSupport(classes, 'Burguesia', 'CNT_FAI', -1);
            const factions = adjustFactionDissents(s.factions, { Faistas: -4, Puristas: -3, Cenetistas: -4, Treintistas: -3 });

            return {
              commerce_policy_timer: 6,
              factions,
              classes,
              stats: {
                ...s.stats,
                republicanAuthority: Math.min(100, s.stats.republicanAuthority + 2),
              },
              relations: {
                ...s.relations,
                france: Math.max(-100, (s.relations.france || 0) - 2),
              },
            };
          },
        },
        {
          text: 'Clear the sterling balances the companies moved to London.',
          textZh: '清算各公司转往伦敦的英镑余额',
          subtitle: 'Costs 2M in legal fees and pressure. The Republic claims the foreign accounts of the firms that have been exporting capital since 1931 — a slow, respectable expropriation fought in London courts rather than in the customs house.',
          subtitleZh: '花费 2M 用于诉讼与施压。共和国主张对那些自 1931 年起就在输出资本的公司海外账户的权利——一场缓慢、体面的没收，战场在伦敦的法庭而不是海关。',
          condition: (s: GameState) => s.budget >= 2,
          unavailableSubtitle: () => 'Requires 2M in the treasury.',
          unavailableSubtitleZh: () => '需要国库现金 2M。',
          effect: (s: GameState): Partial<GameState> => {
            let classes = adjustClassSupport(s.classes, 'Burguesia', 'CNT_FAI', -2);
            classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 1);
            const factions = adjustFactionDissents(s.factions, { Treintistas: -5, Cenetistas: -3, Faistas: 6, Puristas: 5 });

            return {
              budget: Math.max(0, s.budget - 2),
              commerce_policy_timer: 10,
              factions,
              classes,
              ...applyEconomicOption(s, 'foreign_capital_seizure', {}),
              stats: {
                ...s.stats,
                republicanAuthority: Math.min(100, s.stats.republicanAuthority + 4),
                revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 2),
              },
            };
          },
        },
        {
          text: 'Leave the customs houses to the men who know them.',
          textZh: '让熟悉海关的人继续管海关',
          subtitle: 'No new office, no new monopoly. Trade continues under the old clerks and the old rules; the ministry goes back to its files.',
          subtitleZh: '不设新衙门，不搞新垄断。贸易照旧由老职员与旧规则办理；部里回去整理档案。',
          effect: (s: GameState): Partial<GameState> => {
            const factions = adjustFactionDissents(s.factions, { Faistas: 5, Puristas: 6, Treintistas: -3 });
            let classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', -1);
            classes = adjustClassSupport(s.classes, 'Burguesia', 'CNT_FAI', 1);

            return {
              commerce_policy_timer: 6,
              factions,
              classes,
              stats: {
                ...s.stats,
                bureaucratization: Math.min(100, s.stats.bureaucratization + 2),
              },
            };
          },
        },
      ],
    },
  }),
};
