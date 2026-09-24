import type { GameState, JournalEntryDef } from '../types';
import { adjustClassSupport } from '../utils';
import { getMilitarization } from '../rules/militarization';
import { mergeMilitiaPoolsIntoStateArmy } from '../rules/armyPools';
import { adjustMemberContribution, monthIndex } from '../rules/wartimeCoalition';

/** 完成门槛：CNT 民兵军事化率必须**超过** 85（严格大于）。 */
export const POPULAR_ARMY_MILITARIZATION_TARGET = 85;
/** 完成门槛：民兵合法性法必须达到 4 级。 */
export const MILITIA_LEGALITY_TARGET = 4;
/** 期限：日志触发满 24 个月仍未完成即失败。 */
export const POPULAR_ARMY_DEADLINE_MONTHS = 24;

const militiaLegalityLevel = (state: GameState): number =>
  Number(state.domesticPolicy?.militia_legality_law) || 0;

/** 期限以 `militarizationPaths.chosenAt` 为锚点——`JournalState` 本身没有时间戳。 */
const isPastDeadline = (state: GameState): boolean => {
  const chosenAt = state.militarizationPaths?.chosenAt;
  if (!chosenAt) return false;
  return monthIndex(state) >= monthIndex(chosenAt) + POPULAR_ARMY_DEADLINE_MONTHS;
};

/**
 * 人民军：把各党派的独立武装收进一支国家军队。
 *
 * 这条路线是**一场跟时间的赛跑**——24 个月内把 CNT 的军事化率推过 85、同时把民兵
 * 合法性法推到 4 级。推不动不是"什么也没发生"，而是 CNT 在人民阵线里的承诺度被
 * 削掉 40。
 */
export const popularArmyJournal: JournalEntryDef = {
  id: 'journal_popular_army',
  title: 'The People\'s Army',
  titleZh: '人民军',
  description: 'A modern army cannot be improvised out of party columns. If the Republic is to be defended, the confederal militia must be absorbed into a single command with a single staff — which means the CNT gives up the independent armed force that made it a power in its own right. The Communists have been saying this since July. They are not wrong; they are simply not disinterested.',
  descriptionZh: '现代军队无法从党派纵队里临时拼凑出来。要守住共和国，联合民兵就必须被并入统一的指挥与参谋体系——这意味着 CNT 要交出那支让它本身成为一股势力的独立武装。共产党从七月起就在这样说。他们没有说错，只是并非毫无私心。',
  successCondition: 'CNT militia militarization above 85, and the Militia Legality Law at level 4',
  successConditionZh: 'CNT 民兵军事化率超过 85，且民兵合法性法达到 4 级',
  successEffectDesc: 'The party militia pools merge into the state army pool, and the Army Reform Law jumps to "People\'s Republican Army".',
  successEffectDescZh: '各党派民兵池并入共和军池；军队改革法跳到「共和国人民军」。',
  failureCondition: '24 months pass without the army being formed',
  failureConditionZh: '日志触发满 24 个月仍未完成',
  failureEffectDesc: 'The CNT loses 40 commitment in the wartime Popular Front.',
  failureEffectDescZh: 'CNT 在战时人民阵线中的承诺度 −40。',
  hasProgress: true,
  progressMax: 100,
  // 进度条从完成条件派生，取两个条件里更紧的那一条——不留独立的进度字段。
  getProgress: (state) => Math.min(
    (getMilitarization(state, 'cnt') / POPULAR_ARMY_MILITARIZATION_TARGET) * 100,
    (militiaLegalityLevel(state) / MILITIA_LEGALITY_TARGET) * 100,
  ),

  /** 激活只属于开始事件（`isEventMediatedJournal` 会忽略 checkStatus 的 active 判定）。 */
  activationEventId: 'militarization_crossroads',
  completionEventId: 'popular_army_formed',
  failureEventId: 'popular_army_stalled',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    // 完成优先于失败：同一个月既冲线又到期时，让玩家赢。
    if (getMilitarization(state, 'cnt') > POPULAR_ARMY_MILITARIZATION_TARGET
      && militiaLegalityLevel(state) >= MILITIA_LEGALITY_TARGET) {
      return 'completed';
    }
    if (isPastDeadline(state)) return 'failed';
    return null;
  },

  onComplete: (state) => ({
    ...mergeMilitiaPoolsIntoStateArmy(state),
    domesticPolicy: { ...state.domesticPolicy, army_reform_law: 3 },
  }),

  onFail: (state) => adjustMemberContribution(state, 'CNT_FAI', -40),

  activeEffect: {
    description: 'As the army is built, the Communists gain ground among the workers.',
    descriptionZh: '随着人民军的建设，共产党在工人中的影响力上升。',
    apply: (state) => ({
      classes: adjustClassSupport(state.classes, 'Obreros', 'PCE', 10 / 12),
    }),
  },
};
