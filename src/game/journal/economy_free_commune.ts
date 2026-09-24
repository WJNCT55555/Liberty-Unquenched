import type { GameState, JournalEntryDef } from '../types';
import { adjustClassSupport } from '../utils';
import { ECONOMY_ROUTE_RULES, isJournalCompleted } from '../rules/economyReforms';

/**
 * 自由公社路线（docs/经济改造方案.md §5.2）。
 *
 * 三份剧本开局即自带此日志：开始事件 `economy_free_commune_start` 由月结管线在开局月
 * 强制入队（`rules/monthlyPipeline.ts` 的 `forceFreeCommuneStartNextMonth`），它只有一个
 * 确认选项，玩家不需要做选择。
 *
 * **永不失败**，但持续代价写在 activeEffect 里：公社不听命于任何部，马德里的权威随之流失。
 */
export const economyFreeCommuneJournal: JournalEntryDef = {
  id: 'journal_economy_free_commune',
  title: 'The Free Commune',
  titleZh: '自由公社路线',
  description: 'Tierra y Libertad is not a slogan about ownership; it is a claim about who decides. The villages of Aragon and Andalusia have already stopped asking Madrid for permission. If the land is held in common, the money abolished, and the railways and pits run by the workers themselves, then the state becomes a relic — not because it was stormed, but because nobody needs it any more.',
  descriptionZh: '「土地与自由」不是关于所有权的口号，而是关于谁说了算的主张。阿拉贡与安达卢西亚的村庄已经不再向马德里请示。如果土地归公、货币废除、铁路与矿井由工人自己经营，国家就成了遗物——不是因为它被攻占，而是因为再没有人需要它。',
  successCondition: 'Land reform and collectivization completed, workers\' control above 60, money abolished, and the railways and coal mines taken over',
  successConditionZh: '土地改革与土地集体化均完成、工人控制程度超过 60、货币已废除，且铁路与煤矿已被接管',
  successEffectDesc: 'The communes federate: the confederation\'s organization grows, the countryside is organized for the CNT, and the movement no longer needs the Republic.',
  successEffectDescZh: '公社结成联邦：联合会组织规模扩大、乡村被 CNT 组织起来，运动不再需要共和国。',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => Math.min(
    isJournalCompleted(state, 'journal_land_reform') ? 100 : (state.domesticPolicy?.land_reform_progress ?? 0),
    // 第 5C 期起这本日志真实存在（journal/land_collectivization.ts），完成条件读的是
    // 土地饼里的集体份额（≥65%），因此这里不再是恒 0 的占位。
    isJournalCompleted(state, 'journal_land_collectivization') ? 100 : 0,
    // The free commune wants the land and the workshops in the workers' own hands;
    // state ownership does not count towards this route (方案 §5.1).
    ECONOMY_ROUTE_RULES.freeCommuneControlProgress(state),
    (state.currency_abolition / 3) * 100,
    (state.rail_nationalization / 3) * 100,
    (state.coal_nationalization / 2) * 100,
  ),

  activationEventId: 'economy_free_commune_start',
  completionEventId: 'economy_free_commune_victory',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    if (
      isJournalCompleted(state, 'journal_land_reform')
      && isJournalCompleted(state, 'journal_land_collectivization')
      && ECONOMY_ROUTE_RULES.freeCommuneControl(state)
      && state.currency_abolition >= 3
      && state.rail_nationalization >= 3
      && state.coal_nationalization >= 2
    ) {
      return 'completed';
    }
    return null;
  },

  onComplete: (state: GameState) => ({
    stats: {
      ...state.stats,
      revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10),
      republicanAuthority: Math.max(0, state.stats.republicanAuthority - 8),
    },
    classes: adjustClassSupport(state.classes, 'Braceros', 'CNT_FAI', 6),
  }),

  activeEffect: {
    description: 'The communes answer to no ministry. The countryside is quieter and the columns are fed, but authority drains away from Madrid month by month.',
    descriptionZh: '公社不听命于任何部。乡村安静了，纵队有饭吃了，但马德里的权威正在逐月流失。',
    apply: (state) => ({
      stats: {
        ...state.stats,
        revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 0.5),
        republicanAuthority: Math.max(0, state.stats.republicanAuthority - 0.3),
      },
      classes: adjustClassSupport(state.classes, 'Braceros', 'CNT_FAI', 2 / 12),
    }),
  },
};
