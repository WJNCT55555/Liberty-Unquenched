import type { Card, GameEvent, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence } from '../utils';
import { applyUnionShareDelta } from '../unions';
import { clampLawLevel } from '../lawStances';
import { isOrganizationEstablished } from '../organizations';
import { getEconomyCounter } from '../rules/economyReforms';
import { applyEconomicOption } from '../rules/controlShares';

/**
 * Industry and Commerce (docs/经济改造方案.md §6.2).
 *
 * The industrial levers of the economy reform: railways, coal, industrial
 * cooperatives, foreign capital and the supply network. Gated on the CNT holding
 * the Ministry of Industry. The cooldown is set inside the card effect so that every
 * visible option — including the deliberate no-op — spends the same session.
 */
export const industryPolicy: Card = {
  id: 'industry_policy',
  title: 'Industry and Commerce',
  titleZh: '工业与商业',
  type: 'Government',
  description: 'The Republic\'s industry is the war\'s industry, and the confederation is the only body that actually knows where the lathes are. The Ministry of Industry can either confine itself to inspections, or it can hand the syndicates the railways, the pits and the foreign-owned plants one section at a time — every section a political fight, and every section a piece of the economy that stops answering to its former owners.',
  descriptionZh: '共和国的工业就是战争的工业，而联合会是唯一真正知道车床在哪儿的机构。工业部可以把自己限制在检查表上，也可以一段一段地把铁路、矿井与外资工厂交给工团——每一段都是一场政治斗争，每一段都意味着一块经济不再听命于它从前的主人。',
  cost: 1,
  condition: (state: GameState) => (
    state.cntStance === 'govern'
    && state.ministers.industry === 'CNT'
    && (state.industry_policy_timer || 0) <= 0
  ),
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: industryPolicyEvent(state)
  })
};

/** Every visible option spends the session, so the cooldown lives here. */
const concludeIndustryPolicy = (state: GameState): Partial<GameState> => ({
  industry_policy_timer: 6,
  currentEvent: null
});

const industryPolicyEvent = (state: GameState): GameEvent => ({
  id: 'industry_policy_event',
  date: { year: state.year, month: state.month },
  title: 'Industry and Commerce',
  titleZh: '工业与商业',
  description: 'The ministry\'s agenda is on the table. Every item on it takes something away from somebody, and every item on it makes the front a little less dependent on men who are waiting to see which side wins.',
  descriptionZh: '部里的议程摆在桌上。每一项都要从某个人手里拿走一点东西，每一项都让前线少依赖一点那些正在观望谁将获胜的人。',
  options: [
    {
      text: 'Nationalize the railways.',
      textZh: '推进铁路系统国有化',
      subtitle: 'The trunk lines pass to the state; the station committees keep running them. Requires 2 resources.',
      subtitleZh: '干线收归国家，车站委员会继续运营。需要 2 资源。',
      condition: (s: GameState) => getEconomyCounter(s, 'rail_nationalization') < 3 && s.resources >= 2,
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'rail_nationalization') >= 3
        ? 'The railways are already nationalized.'
        : 'Requires 2 resources.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'rail_nationalization') >= 3
        ? '铁路已经完成国有化。'
        : '需要 2 资源。'),
      effect: (s: GameState): Partial<GameState> => {
        const next = { ...s, ...applyEconomicOption(s, 'rail_nationalization') } as GameState;
        const completed = getEconomyCounter(next, 'rail_nationalization') >= 3;
        return {
          resources: s.resources - 2,
          // Railway nationalization creates *state* ownership, not worker ownership:
          // this is the line that separates the syndicalist road from the free commune
          // (docs/工人控制度改造方案.md §4.1).
          ...applyEconomicOption(s, 'rail_nationalization'),
          // Completing nationalization hands the confederation real bargaining rights
          // inside the Republic: collective bargaining becomes law.
          ...(completed
            ? {
                domesticPolicy: {
                  ...s.domesticPolicy,
                  union_status: clampLawLevel('union_status', Math.max(s.domesticPolicy.union_status, 3))
                },
                ...applyUnionShareDelta(s, { CNT: 2, other: -2 })
              }
            : {}),
          classes: adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', completed ? 3 : 1),
          ...concludeIndustryPolicy(s)
        };
      }
    },
    {
      text: 'Take over the coal mines.',
      textZh: '接管煤矿',
      subtitle: 'Asturias and Río Tinto pass to the confederation\'s pit committees. Requires 2 resources.',
      subtitleZh: '阿斯图里亚斯与里奥廷托交给联合会的矿工委员会。需要 2 资源。',
      condition: (s: GameState) => getEconomyCounter(s, 'coal_nationalization') < 2
        && s.resources >= 2
        && isOrganizationEstablished(s, 'CNT'),
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'coal_nationalization') >= 2
        ? 'The mines are already under workers\' control.'
        : 'Requires the CNT to be established and 2 resources.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'coal_nationalization') >= 2
        ? '煤矿已在工人控制之下。'
        : '需要 CNT 已成立，且拥有 2 资源。'),
      effect: (s: GameState): Partial<GameState> => {
        const next = { ...s, ...applyEconomicOption(s, 'coal_nationalization') } as GameState;
        const completed = getEconomyCounter(next, 'coal_nationalization') >= 2;
        return {
          resources: s.resources - 2,
          // The pit committees take the mines for themselves: this one produces *union*
          // ownership rather than state ownership.
          ...applyEconomicOption(s, 'coal_nationalization'),
          ...(completed ? applyUnionShareDelta(s, { CNT: 3, other: -3 }) : {}),
          classes: adjustClassSupport(s.classes, 'Braceros', 'CNT_FAI', 5),
          ...concludeIndustryPolicy(s)
        };
      }
    },
    {
      text: 'Federate the workshops into industrial cooperatives.',
      textZh: '扶植工业合作社',
      subtitle: 'Small workshops pool orders and tools instead of being swallowed by the trusts. Requires 1 resource.',
      subtitleZh: '小作坊联合接单、共用工具，而不是被托拉斯吞掉。需要 1 资源。',
      condition: (s: GameState) => getEconomyCounter(s, 'industrial_cooperative') < 5 && s.resources >= 1,
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'industrial_cooperative') >= 5
        ? 'The industrial cooperatives are already at full strength.'
        : 'Requires 1 resource.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'industrial_cooperative') >= 5
        ? '工业合作社已达到满额。'
        : '需要 1 资源。'),
      effect: (s: GameState): Partial<GameState> => {
        const next = { ...s, ...applyEconomicOption(s, 'industrial_cooperative') } as GameState;
        const level = getEconomyCounter(next, 'industrial_cooperative');
        return {
          resources: s.resources - 1,
          ...applyEconomicOption(s, 'industrial_cooperative'),
          ...(level >= 3 ? applyUnionShareDelta(s, { CNT: 2, other: -2 }) : {}),
          classes: adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', 2),
          factions: level >= 5
            ? adjustFactionInfluence(s.factions, 'Cenetistas', 5)
            : s.factions,
          ...concludeIndustryPolicy(s)
        };
      }
    },
    {
      text: 'Seize foreign-owned plants.',
      textZh: '没收外资企业',
      subtitle: 'Electricity, telephones and the mining concessions pass to the state. London and Washington will notice.',
      subtitleZh: '电力、电话与矿业租让权收归国家。伦敦与华盛顿会注意到。',
      condition: (s: GameState) => getEconomyCounter(s, 'foreign_capital_seizure') < 5
        && (s.relations.uk >= 20 || s.relations.france >= 20),
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'foreign_capital_seizure') >= 5
        ? 'There is no foreign capital left to seize.'
        : 'Requires relations with Britain or France of at least 20.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'foreign_capital_seizure') >= 5
        ? '已经没有可没收的外资了。'
        : '需要与英国或法国的关系至少 20。'),
      effect: (s: GameState): Partial<GameState> => {
        const next = { ...s, ...applyEconomicOption(s, 'foreign_capital_seizure') } as GameState;
        const level = getEconomyCounter(next, 'foreign_capital_seizure');
        return {
          ...applyEconomicOption(s, 'foreign_capital_seizure'),
          relations: {
            ...s.relations,
            uk: Math.max(-100, s.relations.uk - 4),
            usa: Math.max(-100, s.relations.usa - 4),
            france: Math.max(-100, s.relations.france - 2)
          },
          factions: level >= 3 ? adjustFactionDissents(s.factions, { Puristas: 4 }) : s.factions,
          ...concludeIndustryPolicy(s)
        };
      }
    },
    {
      text: 'Build the syndicalist supply network.',
      textZh: '建立工团物资调控网络',
      subtitle: 'Cross-regional freight, depots and rationing statistics under one confederal office. Requires 1 resource.',
      subtitleZh: '跨区货运、仓库与配给统计归一个联合会机构掌握。需要 1 资源。',
      condition: (s: GameState) => getEconomyCounter(s, 'supply_coordination_network') < 3
        && s.resources >= 1
        && getEconomyCounter(s, 'industrial_cooperative') >= 1,
      unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'supply_coordination_network') >= 3
        ? 'The supply network is already complete.'
        : 'Requires 1 resource and at least one industrial cooperative.'),
      unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'supply_coordination_network') >= 3
        ? '物资调控网络已经建成。'
        : '需要 1 资源，且至少有一处工业合作社。'),
      effect: (s: GameState): Partial<GameState> => {
        const next = { ...s, ...applyEconomicOption(s, 'supply_coordination_network') } as GameState;
        const completed = getEconomyCounter(next, 'supply_coordination_network') >= 3;
        let factions = adjustFactionInfluence(s.factions, 'Treintistas', 3);
        factions = adjustFactionInfluence(factions, 'Cenetistas', 3);
        return {
          resources: s.resources - 1,
          // A supply network moves goods, not title deeds; its small ownership effect is
          // that depots and workshops are pooled.
          ...applyEconomicOption(s, 'supply_coordination_network'),
          ...(completed ? applyUnionShareDelta(s, { CNT: 1, other: -1 }) : {}),
          factions,
          ...concludeIndustryPolicy(s)
        };
      }
    },
    {
      text: 'Leave industry alone this session.',
      textZh: '本次不动工业',
      subtitle: 'The ministry\'s agenda waits for another six months.',
      subtitleZh: '部里的议程再等半年。',
      effect: (s: GameState): Partial<GameState> => concludeIndustryPolicy(s)
    }
  ]
});
