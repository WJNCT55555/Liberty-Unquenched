import type { GameState, JournalEntryDef } from '../types';
import { adjustClassSupport } from '../utils';
import { isJournalCompleted } from '../rules/economyReforms';

/**
 * 自治合作社路线（docs/经济改造方案.md §5.3）。
 *
 * 两个触发入口：佩罗「推动合作社方案」推满 2 次，或事件板普通调度。
 * **永不失败**；与土地集体化是竞争关系（见日志 §5.3 的 getProgress 说明），但不是失败。
 */
export const economyCooperativeJournal: JournalEntryDef = {
  id: 'journal_economy_cooperative',
  title: 'The Cooperative Road',
  titleZh: '自治合作社路线',
  description: 'Not every peasant wants to be a collective farmer, and not every workshop wants a committee. The cooperative road takes the smallholder, the tenant and the artisan as they are: voluntary association, mutual credit instead of the usurer, and a federation of societies that buys and sells on their behalf. It is slower than expropriation. It is also the only road that does not make enemies of the countryside.',
  descriptionZh: '不是每个农民都想当集体农庄的庄员，也不是每个作坊都想要委员会。合作社路线接受小农、佃农与手工业者本来的样子：自愿联合、用互助信贷取代高利贷、用合作社的联邦替他们买卖。它比没收慢，也是唯一一条不在乡村制造敌人的路。',
  successCondition: 'Rural cooperatives and industrial cooperatives at full strength, land reform completed, and the local mutual credit network complete',
  successConditionZh: '农业合作社与工业合作社达到满额、土地改革完成、地方互助信贷网络建成',
  successEffectDesc: 'The cooperative federation is recognized: the peasantry and the petty bourgeoisie move toward the CNT, and the movement\'s organization grows in the countryside.',
  successEffectDescZh: '合作社联邦获得承认：农民与小资产阶级转向 CNT，运动在乡村的组织规模扩大。',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => {
    // 集体化一旦落地，自愿合作的经济基础就没了：进度显示归零，路线停在 active。
    // 这不是失败——玩家仍可回头把计数器推上去，但要先面对"已经集体化了"这个事实。
    if (isJournalCompleted(state, 'journal_land_collectivization')) return 0;
    return Math.min(
      (state.agricultural_cooperative / 5) * 100,
      (state.mutual_credit_network / 5) * 100,
      (state.industrial_cooperative / 5) * 100,
      isJournalCompleted(state, 'journal_land_reform') ? 100 : (state.domesticPolicy?.land_reform_progress ?? 0),
    );
  },

  activationEventId: 'economy_cooperative_path',
  completionEventId: 'economy_cooperative_victory',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    if (isJournalCompleted(state, 'journal_land_collectivization')) return null;
    if (
      state.agricultural_cooperative >= 5
      && state.mutual_credit_network >= 5
      && state.industrial_cooperative >= 5
      && isJournalCompleted(state, 'journal_land_reform')
    ) {
      return 'completed';
    }
    return null;
  },

  onComplete: (state: GameState) => {
    let classes = adjustClassSupport(state.classes, 'Labradores', 'CNT_FAI', 8);
    classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 6);
    return {
      classes,
      stats: {
        ...state.stats,
        bureaucratization: Math.max(0, state.stats.bureaucratization - 3),
      },
    };
  },

  activeEffect: {
    description: 'Cooperative nurseries and credit subsidies cost the treasury every month, but the smallholders and the shopkeepers are beginning to see the CNT as their own institution.',
    descriptionZh: '合作社保育与信贷补贴每月都在吃国库，但自耕农与店主开始把 CNT 看作自己的机构。',
    apply: (state) => ({
      classes: adjustClassSupport(
        adjustClassSupport(state.classes, 'PequenaBurguesia', 'CNT_FAI', 2 / 12),
        'Labradores',
        'CNT_FAI',
        2 / 12,
      ),
    }),
  },
};
