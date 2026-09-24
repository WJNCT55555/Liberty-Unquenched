import type { GameState, JournalEntryDef } from '../types';
import { adjustFactionInfluence } from '../utils';
import { applyUnionShareDelta } from '../unions';
import { clampLawLevel } from '../lawStances';
import { isOrganizationEstablished } from '../organizations';
import {
  ECONOMY_ROUTE_RULES,
  isCoalUnderWorkersControl,
  isJournalCompleted,
  isRailUnderWorkersControl,
} from '../rules/economyReforms';

/**
 * 温和工团路线（docs/经济改造方案.md §5.1）。
 *
 * 开始事件不是独立事件：CNT 第三次代表大会「批准建立全国产业联合会」的选项直接激活本日志。
 * **本日志永不失败**：条件没满足就停在 active，玩家随时可以回来继续推。
 */
export const economySyndicalistJournal: JournalEntryDef = {
  id: 'journal_economy_syndicalist',
  title: 'The Syndicalist Road',
  titleZh: '温和工团路线',
  description: 'The National Industrial Federations were the moderates\' answer to bourgeois monopoly: meet the trust with a union of your own, and take the economy over from the inside. If the confederation can hold the railways and the pits while the PRRevS carries the workers into the Republic\'s institutions, the syndicates will not need to smash the state — they will simply replace its management.',
  descriptionZh: '全国产业联合会是温和派对资产阶级垄断的回答：用你自己的联合对抗托拉斯，从内部接管经济。如果联合会能握住铁路与矿井，同时由 PRRevS 把工人带进共和国的机构，工团就不需要砸碎国家——它们只需要替换掉国家的管理层。',
  successCondition: 'Land reform completed, the PRRevS founded, workers\' control above 60, and the railways and the coal mines under national or committee control',
  successConditionZh: '土地改革完成、PRRevS 已成立、工人控制程度超过 60，且铁路与煤矿已由国家或委员会接管',
  successEffectDesc: 'The unions take over industrial management: Collective Bargaining becomes law, the Treintistas gain influence, and CNT organization grows.',
  successEffectDescZh: '工会接管工业管理：集体谈判入法、三十人集团影响力上升、CNT 组织规模扩大。',
  hasProgress: true,
  progressMax: 100,
  // 进度取五个条件里最紧的一条，不留独立进度字段。
  getProgress: (state) => Math.min(
    isJournalCompleted(state, 'journal_land_reform') ? 100 : (state.domesticPolicy?.land_reform_progress ?? 0),
    isOrganizationEstablished(state, 'PRRevS') ? 100 : 0,
    // This route wants industry out of private hands *and* the state holding real power:
    // the unions are to manage industry through the Republic (方案 §5.1).
    ECONOMY_ROUTE_RULES.syndicalistControlProgress(state),
    isRailUnderWorkersControl(state) ? 100 : (state.rail_nationalization / 3) * 100,
    isCoalUnderWorkersControl(state) ? 100 : (state.coal_nationalization / 2) * 100,
  ),

  /** 激活只属于开始事件（CNT 三大选项），这里不返回 active。 */
  activationEventId: 'cnt_third_congress_2',
  completionEventId: 'economy_syndicalist_victory',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    if (
      isJournalCompleted(state, 'journal_land_reform')
      && isOrganizationEstablished(state, 'PRRevS')
      && ECONOMY_ROUTE_RULES.syndicalistControl(state)
      && (state.rail_nationalization >= 3 || isRailUnderWorkersControl(state))
      && (state.coal_nationalization >= 2 || isCoalUnderWorkersControl(state))
    ) {
      return 'completed';
    }
    return null;
  },

  onComplete: (state: GameState) => ({
    stats: {
      ...state.stats,
      bureaucratization: Math.min(100, state.stats.bureaucratization + 5),
    },
    factions: adjustFactionInfluence(state.factions, 'Treintistas', 10),
    ...applyUnionShareDelta(state, { CNT: 3, UGT: -1, unorganized: -2 }),
    domesticPolicy: {
      ...state.domesticPolicy,
      union_status: clampLawLevel('union_status', Math.max(state.domesticPolicy.union_status, 3)),
    },
  }),
};
