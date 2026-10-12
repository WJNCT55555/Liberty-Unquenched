import type { GameState, JournalEntryDef } from '../types';
import { adjustAllActiveFactionDissent, adjustClassSupport } from '../utils';
import { getUnionShare } from '../unions';
import {
  advanceForcedUnemploymentStreak,
  areForcedUnemploymentPledgesMet,
  FORCED_UNEMPLOYMENT_DEADLINE_MONTHS,
  FORCED_UNEMPLOYMENT_JOURNAL_ID,
  FORCED_UNEMPLOYMENT_STREAK_MONTHS,
  getForcedUnemploymentMonthsElapsed,
  getForcedUnemploymentPledge,
  getForcedUnemploymentProgress,
  getForcedUnemploymentRewards,
  getForcedUnemploymentTarget,
  isForcedUnemploymentPledgeMet,
} from '../rules/forcedUnemployment';

export const forcedUnemploymentJournal: JournalEntryDef = {
  id: FORCED_UNEMPLOYMENT_JOURNAL_ID,
  title: 'Against Involuntary Unemployment',
  titleZh: '阻止强制失业',
  description: 'At the Third CNT Congress, the Confederation made public promises on work hours, unemployment and any additional demands chosen by its delegates. The mandate is judged by the promises actually adopted.',
  descriptionZh: 'CNT第三次代表大会向群众许下了工时、失业率及代表们额外选定的承诺。本日志只按大会实际通过的决议进行核验。',
  successCondition: 'Fulfil every selected congress pledge, including the chosen unemployment ceiling for three consecutive months.',
  successConditionZh: '完成大会选定的每项承诺，其中所选失业率上限须连续维持三个月。',
  successEffectDesc: 'CNT support among industrial and rural workers rises according to the total difficulty chips pledged.',
  successEffectDescZh: '产业工人与农村雇农对CNT的支持，按承诺的难度筹码总量增加。',
  failureCondition: 'The promises remain unfulfilled 48 months after the congress.',
  failureConditionZh: '大会决议通过48个月后仍未兑现全部承诺。',
  failureEffectDesc: 'The broken public promise causes a large loss of worker support, revolutionary fervor and internal unity; higher stakes cause a greater backlash.',
  failureEffectDescZh: '公开失约将大幅损失工人支持、革命热情与内部团结；承诺筹码越高，反噬越重。',
  hasProgress: true,
  progressMax: 100,
  getProgress: getForcedUnemploymentProgress,
  getGoalLines: (state) => {
    const mandate = state.forcedUnemploymentMandate;
    if (!mandate) return [];
    const target = getForcedUnemploymentTarget(mandate);
    const elapsed = getForcedUnemploymentMonthsElapsed(state, mandate);
    const lines = mandate.pledgeIds.map(id => {
      const pledge = getForcedUnemploymentPledge(id);
      const met = isForcedUnemploymentPledgeMet(state, mandate, id);
      const actual = pledge.group === 'hours'
        ? `L${state.domesticPolicy.max_hours_law}`
        : pledge.group === 'unemployment'
          ? `${state.unemployment_rate.toFixed(2)}%, ${mandate.unemploymentStreak}/${FORCED_UNEMPLOYMENT_STREAK_MONTHS}`
          : id === 'minimum_wage_1'
            ? `L${state.domesticPolicy.min_wage}`
            : id === 'land_reform_20'
              ? `${state.domesticPolicy.land_reform_progress}%`
              : `${getUnionShare(state).CNT}%`;
      return {
        text: `${pledge.text} (${pledge.chips} chips; now ${actual})`,
        textZh: `${pledge.textZh}（${pledge.chips}筹码；当前${actual}）`,
        met,
      };
    });
    lines.push({
      text: `Deadline: ${Math.max(0, FORCED_UNEMPLOYMENT_DEADLINE_MONTHS - elapsed)} months remain. Unemployment target: ≤${target}%.`,
      textZh: `期限：还剩${Math.max(0, FORCED_UNEMPLOYMENT_DEADLINE_MONTHS - elapsed)}个月；失业率目标≤${target}%。`,
      met: elapsed < FORCED_UNEMPLOYMENT_DEADLINE_MONTHS,
    });
    return lines;
  },
  activationEventId: 'cnt_forced_unemployment_resolution',
  completionEventId: 'cnt_forced_unemployment_fulfilled',
  failureEventId: 'cnt_forced_unemployment_broken_promise',
  activeEffect: {
    description: 'The unemployment streak is counted at each monthly settlement; the journal grants no automatic economic improvement.',
    descriptionZh: '每月结算时核算失业率连续达标月数；日志本身不自动改善经济。',
    apply: advanceForcedUnemploymentStreak,
  },
  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active' || !state.forcedUnemploymentMandate) return null;
    const mandate = state.forcedUnemploymentMandate;
    if (areForcedUnemploymentPledgesMet(state, mandate)) return 'completed';
    if (getForcedUnemploymentMonthsElapsed(state, mandate) >= FORCED_UNEMPLOYMENT_DEADLINE_MONTHS) return 'failed';
    return null;
  },
  onComplete: (state: GameState) => {
    const reward = getForcedUnemploymentRewards(state.forcedUnemploymentMandate?.chips ?? 0);
    let classes = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', reward.successWorkers);
    classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', reward.successRuralWorkers);
    return { classes };
  },
  onFail: (state: GameState) => {
    const reward = getForcedUnemploymentRewards(state.forcedUnemploymentMandate?.chips ?? 0);
    let classes = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', reward.failureWorkers);
    classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', reward.failureRuralWorkers);
    return {
      classes,
      factions: adjustAllActiveFactionDissent(state.factions, reward.failureDissent),
      stats: {
        ...state.stats,
        revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor + reward.failureFervor),
      },
    };
  },
};
