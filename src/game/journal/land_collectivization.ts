import type { GameState, JournalEntryDef } from '../types';
import { adjustClassSupport, adjustFactionDissent } from '../utils';
import { getControlShares, getWorkersShare } from '../rules/controlShares';
import { getEconomyCounter, isJournalCompleted } from '../rules/economyReforms';

/**
 * 土地集体化（docs/工人控制度改造方案.md §4.6、经济改造方案 §13）。
 *
 * 与既有的「土地改革问题」并列的第二本农村日志：土地改革解决"地是谁的"，
 * 土地集体化解决"地怎么种"。它的完成条件是**所有权饼上的硬指标**——
 * 农业集体占到全部土地的 **65%**，而不是计数器等级。
 *
 * 这个门槛刻意很高（1936·7 开局只有 1%）：它要求玩家把整条农业路线走到底。
 */
export const LAND_COLLECTIVIZATION_TARGET = 65;

export const landCollectivizationJournal: JournalEntryDef = {
  id: 'journal_land_collectivization',
  title: 'Collectivization of the Land',
  titleZh: '土地集体化',
  description: 'Redistribution settled who owns the fields; it did not settle how they are worked. A peasant with four hectares and a mule is not a collective, and the syndicates in Aragon have already discovered that you cannot plan a harvest across a hundred private plots. Collectivization means the villages pool the land itself — the boundary stones come up, the machinery is shared, and the harvest is reckoned in common.',
  descriptionZh: '重新分配解决了地是谁的，却没有解决地怎么种。一个有四公顷地和一头骡子的农民不是一个集体，而阿拉贡的工团已经发现：一百块私人的地是没法统一安排收成的。集体化意味着村庄把土地本身合起来——界石拔掉、机械共用、收成共同核算。',
  successCondition: 'Agricultural collectives hold 65% of the land',
  successConditionZh: '农业集体占到全部土地的 65%',
  successEffectDesc: 'The countryside is collectivized: the movement\'s organization grows in the villages and the yeomanry\'s resistance hardens.',
  successEffectDescZh: '乡村完成集体化：运动在村庄的组织规模扩大，自耕农的抵触也随之加深。',
  failureCondition: 'The land reform itself fails',
  failureConditionZh: '土地改革本身失败',
  failureEffectDesc: 'Collectivization is abandoned along with the reform it rested on.',
  failureEffectDescZh: '集体化随它所依赖的改革一起被放弃。',
  hasProgress: true,
  progressMax: LAND_COLLECTIVIZATION_TARGET,
  // 进度直接读饼：农业集体那一块占了多少。
  getProgress: (state) => getControlShares(state).land.collective,

  /**
   * 开始事件 `land_collectivization_start` 是唯一入口（事件—日志—事件契约）。
   * 它的条件两侧都要成立：土改过半（或已完成）**且**已投过一次集体化，
   * 见 `src/game/events/economy/land_collectivization.ts` 的文件头。
   */
  activationEventId: 'land_collectivization_start',
  completionEventId: 'land_collectivization_complete',
  failureEventId: 'land_collectivization_abandoned',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    // 完成优先于失败：改革失败与集体化到顶同月时让玩家赢。
    if (getControlShares(state).land.collective >= LAND_COLLECTIVIZATION_TARGET) return 'completed';
    if (state.journal?.['journal_land_reform']?.status === 'failed') return 'failed';
    return null;
  },

  onComplete: (state: GameState) => ({
    stats: {
      ...state.stats,
      revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 8),
    },
    classes: adjustClassSupport(state.classes, 'Braceros', 'CNT_FAI', 8),
    factions: adjustFactionDissent(state.factions, 'Faistas', -5),
  }),

  onFail: (state: GameState) => ({
    classes: adjustClassSupport(state.classes, 'Braceros', 'CNT_FAI', -6),
  }),

  activeEffect: {
    description: 'Every village that pools its land is a village the yeomanry will not forgive; the syndicates grow, and so does the resistance.',
    descriptionZh: '每一个把土地合起来的村庄，都是自耕农不会原谅的村庄；工团在增长，抵触也一样。',
    apply: (state) => ({
      // 集体化推进时，自耕农持续流失——这是这本日志的持续代价。
      classes: adjustClassSupport(
        adjustClassSupport(state.classes, 'Braceros', 'CNT_FAI', 2 / 12),
        'Labradores',
        'CNT_FAI',
        -2 / 12,
      ),
    }),
  },
};

/** 供事件与测试读取的当前集体化读数。 */
export const getLandCollectivizationProgress = (state: GameState): number =>
  getControlShares(state).land.collective;

/** 完成条件的另一半读数，供界面解释"离目标还差多少"。 */
export const getLandCollectivizationStatus = (state: GameState): {
  collective: number;
  target: number;
  workers: number;
  reformCompleted: boolean;
} => ({
  collective: getControlShares(state).land.collective,
  target: LAND_COLLECTIVIZATION_TARGET,
  workers: getWorkersShare(state, 'land'),
  reformCompleted: isJournalCompleted(state, 'journal_land_reform'),
});

/** 强制集体化的次数（事件里用来决定叙事分支）。 */
export const getForcedCollectivizationUses = (state: GameState): number =>
  getEconomyCounter(state, 'land_forced_collectivization');
