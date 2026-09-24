import type { Card, GameEvent, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence } from '../utils';
import { applyEconomicOption } from '../rules/controlShares';
import { applyUnionShareDelta } from '../unions';
import { advanceEconomyCounter, getEconomyCounter } from '../rules/economyReforms';
import { bankersPanic } from '../events/economy/bankers_panic';
import { currencyAbolished } from '../events/economy/currency_abolished';

/**
 * Fiscal Instruments (docs/经济改造方案.md §6.4).
 *
 * Division of labour with the Fiscal Policy card: that one owns tax RATES (the draft
 * review of the income-tax and tariff/consumption groups); this one owns the OWNERSHIP
 * of money and banking — abolition, bank seizure, mutual credit, the exchange
 * committee. Both need the Finance Ministry, and neither touches the other's cooldown.
 */
export const fiscalMeasures: Card = {
  id: 'fiscal_measures',
  title: 'Fiscal Instruments',
  titleZh: '财政手段',
  type: 'Government',
  description: 'Taxation is how a state pays for a war. This is how a movement pays for a revolution: it decides whose money still exists. The Finance Ministry can leave the banks and the peseta alone, or it can begin dismantling both — starting with the deposits of the men who have been moving their capital abroad since April 1931.',
  descriptionZh: '税收是国家支付战争的方式。而这个，是运动支付革命的方式：它决定谁的钱还算数。财政部可以让银行和比塞塔安然无恙，也可以开始把两者一起拆掉——从那些自 1931 年 4 月起就在把资本转移出国的人的存款开始。',
  cost: 1,
  condition: (state: GameState) => (
    state.cntStance === 'govern'
    && state.ministers.finance === 'CNT'
    && (state.fiscal_measures_timer || 0) <= 0
  ),
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: fiscalMeasuresEvent(state)
  })
};

const CONCLUDE_FISCAL_MEASURES = (state: GameState): Partial<GameState> => ({
  fiscal_measures_timer: 6,
  currentEvent: null
});

const fiscalMeasuresEvent = (state: GameState): GameEvent => ({
  id: 'fiscal_measures_event',
  date: { year: state.year, month: state.month },
  title: 'Fiscal Instruments',
  titleZh: '财政手段',
  description: 'The Republic\'s money is still the bankers\' money: it is issued by a bank, cleared through private ledgers and moved abroad at the discretion of its owners. Every instrument on this table takes a piece of that arrangement apart.',
  descriptionZh: '共和国的钱仍然是银行家的钱：由一家银行发行、通过私人账本清算，并且任由其所有者决定移往国外。这张桌上的每一样工具都在拆掉这套安排的一部分。',
  options: [
    {
      text: 'Advance the abolition of money.',
      textZh: '推进废除货币',
      subtitle: 'Vouchers first, then union wage scrip, then nothing. Requires 1 resource.',
      subtitleZh: '先代用券、再工会工资券，最后什么都不用。需要 1 资源。',
      condition: (s: GameState) => getEconomyCounter(s, 'currency_abolition') < 3 && s.resources >= 1,
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'currency_abolition') >= 3
        ? 'Money has already been abolished.'
        : 'Requires 1 resource.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'currency_abolition') >= 3
        ? '货币已经废除。'
        : '需要 1 资源。'),
      effect: (s: GameState): Partial<GameState> => {
        const next = { ...s, ...applyEconomicOption(s, 'currency_abolition') } as GameState;
        const level = getEconomyCounter(next, 'currency_abolition');
        // Level 1–2 buys the FAI's enthusiasm at the price of the purists' patience;
        // level 3 is total, so the purists come round and the shopkeepers do not.
        let factions = s.factions;
        if (level >= 2) {
          factions = adjustFactionDissents(
            adjustFactionInfluence(factions, 'Faistas', level >= 3 ? 5 : 0),
            { Puristas: -5 },
          );
        } else {
          factions = adjustFactionInfluence(factions, 'Faistas', 5);
        }
        return {
          resources: s.resources - 1,
          ...applyEconomicOption(s, 'currency_abolition'),
          factions,
          classes: level === 1
            ? adjustClassSupport(s.classes, 'PequenaBurguesia', 'CNT_FAI', -3)
            : s.classes,
          // Level 3 is not settled here: it hands the player to the `currency_abolished`
          // event, because "do we declare it" is the transition that needs confirmation
          // (docs/经济改造方案.md §7.5).
          fiscal_measures_timer: 6,
          currentEvent: level >= 3 ? currencyAbolished : null
        };
      }
    },
    {
      text: 'Seize the deposits of the private banks.',
      textZh: '没收私营银行储蓄',
      subtitle: 'The balances move to the Republic\'s account. The bankers move their ledgers abroad, and the foreign press notices.',
      subtitleZh: '余额转入共和国的账户。银行家把账本转往国外，外国报纸也会注意到。',
      condition: (s: GameState) => getEconomyCounter(s, 'private_bank_seizure') < 1,
      unavailableSubtitle: () => 'The private banks have already been emptied.',
      unavailableSubtitleZh: () => '私营银行的钱已经被取空了。',
      effect: (s: GameState): Partial<GameState> => ({
        ...applyEconomicOption(s, 'private_bank_seizure'),
        budget: Math.min(5000, s.budget + 8),
        inflation_rate: Math.min(100, s.inflation_rate + 0.5),
        relations: {
          ...s.relations,
          uk: Math.max(-100, s.relations.uk - 5),
          usa: Math.max(-100, s.relations.usa - 5)
        },
        classes: adjustClassSupport(s.classes, 'PequenaBurguesia', 'CNT_FAI', -3),
        // The seizure amount and the deposit transfer are already settled above; the event
        // only carries the political aftermath, so it must not pay the treasury again.
        fiscal_measures_timer: 6,
        currentEvent: bankersPanic
      })
    },
    {
      text: 'Build the local mutual credit network.',
      textZh: '建立地方互助信贷网络',
      subtitle: 'Village credit unions displace the usurer. Requires 1 resource.',
      subtitleZh: '乡村信用合作社取代高利贷者。需要 1 资源。',
      condition: (s: GameState) => getEconomyCounter(s, 'mutual_credit_network') < 5 && s.resources >= 1,
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'mutual_credit_network') >= 5
        ? 'The mutual credit network is already complete.'
        : 'Requires 1 resource.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'mutual_credit_network') >= 5
        ? '地方互助信贷网络已经建成。'
        : '需要 1 资源。'),
      effect: (s: GameState): Partial<GameState> => {
        const next = { ...s, ...applyEconomicOption(s, 'mutual_credit_network') } as GameState;
        const completed = getEconomyCounter(next, 'mutual_credit_network') >= 5;
        return {
          resources: s.resources - 1,
          ...applyEconomicOption(s, 'mutual_credit_network'),
          ...(completed ? applyUnionShareDelta(s, { CNT: 2, other: -2 }) : {}),
          classes: adjustClassSupport(
            adjustClassSupport(s.classes, 'Labradores', 'CNT_FAI', 3),
            'Braceros',
            'CNT_FAI',
            2
          ),
          ...CONCLUDE_FISCAL_MEASURES(s)
        };
      }
    },
    {
      text: 'Found the Credit and Exchange Committee.',
      textZh: '成立信用与兑换委员会',
      subtitle: 'Clears accounts between regions and turns blocked balances into usable exchange. Requires 3 levels of mutual credit.',
      subtitleZh: '在地区之间清算账目，把被冻结的余额变成可用的外汇。需要 3 级地方互助信贷。',
      condition: (s: GameState) => getEconomyCounter(s, 'credit_exchange_committee') < 1
        && getEconomyCounter(s, 'mutual_credit_network') >= 3,
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'credit_exchange_committee') >= 1
        ? 'The Committee already exists.'
        : 'Requires at least 3 levels of the mutual credit network.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'credit_exchange_committee') >= 1
        ? '兑换委员会已经成立。'
        : '需要至少 3 级地方互助信贷网络。'),
      effect: (s: GameState): Partial<GameState> => ({
        // A clearing house changes who settles accounts, not who owns the plant, so this
        // project advances its counter without moving any ownership.
        ...advanceEconomyCounter(s, 'credit_exchange_committee', 1),
        ...applyUnionShareDelta(s, { CNT: 1, other: -1 }),
        // The clearing committee needs the PSOE's municipal treasuries to work.
        partyRelations: {
          ...s.partyRelations,
          PSOE: Math.min(100, (s.partyRelations?.PSOE ?? 0) + 3)
        },
        ...CONCLUDE_FISCAL_MEASURES(s)
      })
    },
    {
      text: 'Leave the money alone this session.',
      textZh: '本次不动金融',
      subtitle: 'The peseta keeps circulating and the banks keep their ledgers.',
      subtitleZh: '比塞塔继续流通，银行继续保留它们的账本。',
      effect: (s: GameState): Partial<GameState> => CONCLUDE_FISCAL_MEASURES(s)
    }
  ]
});
