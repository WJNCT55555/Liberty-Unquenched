import type { GameEvent, GameState } from '../../types';
import { adjustFactionDissents } from '../../utils';
import { isMoscowGoldDue, transferMoscowGold } from '../../rules/moscowGold';

const eventMeta = { category: 'war' as const, flow: 'solo' as const, series: ['civil_war', 'soviet_aid'] };

/** CNT reacts to Madrid's decision; no option assumes a veto over both ministries. */
const respondToGoldTransfer = (state: GameState, response: 'support' | 'protest' | 'audit'): Partial<GameState> => {
  if (!isMoscowGoldDue(state) || (response === 'audit' && state.resources < 1)) return { currentEvent: null };
  const transferred = transferMoscowGold(state);
  if (!transferred.moscowGoldTransferred) return { currentEvent: null };
  return {
    ...transferred,
    ...(response === 'support' ? {
      partyRelations: { ...state.partyRelations, PCE: Math.min(100, state.partyRelations.PCE + 5) },
      factions: adjustFactionDissents(transferred.factions!, { Puristas: 3 }),
    } : response === 'protest' ? {
      partyRelations: { ...state.partyRelations, PCE: Math.max(0, state.partyRelations.PCE - 8) },
      factions: adjustFactionDissents(transferred.factions!, { Faistas: -4, Puristas: -3 }),
    } : {
      resources: state.resources - 1,
      factions: adjustFactionDissents(transferred.factions!, { Faistas: -5, Puristas: -4 }),
    }),
    currentEvent: null,
  };
};

export const moscowGold: GameEvent = {
  id: 'moscow_gold',
  meta: eventMeta,
  // Relative timing must work in historical mode and after an early civil war.
  condition: isMoscowGoldDue,
  title: 'Moscow Gold',
  titleZh: '莫斯科黄金',
  description: 'Madrid has arranged a shipment of bank gold to Moscow to pay for Soviet weapons. The CNT controls neither the entire diplomatic and financial process nor the bank reserves, and cannot halt the shipment by a unilateral order. Communist organizers claim the credit for securing arms. We must decide how to respond to the transfer of 150 gold reserves.',
  descriptionZh: '马德里政府已安排将银行黄金运往莫斯科，用于购买苏联武器。CNT 尚未同时控制国务部与财政部，也没有接管银行储蓄，无法凭单方面命令阻断运输。共产党组织者将获得军援的功劳归于自身。面对这笔 150 黄金储备的转移，我们必须决定如何回应。',
  options: [
    {
      text: 'Support the arms purchase in the name of antifascist unity',
      textZh: '以反法西斯团结之名支持军购',
      subtitle: '-150 gold; +4 armaments; +25 tank research; +5 USSR relations; +5 PCE worker support. PCE relations +5; Faistas dissent +6, Puristas +8.',
      subtitleZh: '黄金 −150；军备 +4；坦克研究 +25；苏联关系 +5；产业工人内 PCE 支持 +5。PCE 关系 +5；Faistas 异议 +6、Puristas +8。',
      effect: (state) => respondToGoldTransfer(state, 'support'),
    },
    {
      text: 'Protest the dependence on Moscow without obstructing deliveries',
      textZh: '抗议对莫斯科的依赖，但不阻断军购交付',
      subtitle: 'The same gold and arms transfer occurs. PCE relations -8; Faistas dissent +2, Puristas +2.',
      subtitleZh: '同样转移 150 黄金并获得军购收益。PCE 关系 −8；Faistas 异议 +2、Puristas +2。',
      effect: (state) => respondToGoldTransfer(state, 'protest'),
    },
    {
      text: 'Send union accountants to scrutinize the contracts',
      textZh: '派工会会计审查合同与军购账目',
      subtitle: 'The same gold and arms transfer occurs. Spend 1 resource; Faistas dissent +1, Puristas +1.',
      subtitleZh: '同样转移 150 黄金并获得军购收益。消耗 1 资源；Faistas 异议 +1、Puristas +1。',
      condition: (state) => state.resources >= 1,
      unavailableSubtitle: () => 'Requires 1 resource to organize the audit.',
      unavailableSubtitleZh: () => '组织账目审查需要 1 资源。',
      effect: (state) => respondToGoldTransfer(state, 'audit'),
    },
  ],
};
