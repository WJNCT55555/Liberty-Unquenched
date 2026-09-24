import type { GameState, JournalEntryDef } from '../types';
import { adjustFactionDissent } from '../utils';
import { getMilitarization } from '../rules/militarization';
import { countCntMilitiaUnits } from '../rules/armyPools';
import { adjustMemberContribution } from '../rules/wartimeCoalition';

/** 完成门槛：场上至少要这么多支归属 CNT 的民兵单位。 */
export const MILITIA_COLUMN_TARGET = 8;
/** 完成门槛：民兵合法性法必须达到 4 级。 */
export const MILITIA_LEGALITY_TARGET = 4;
/**
 * 失败门槛：CNT 民兵军事化率超过这个数，自治就名存实亡了。
 *
 * 这条线刻意低于人民军路线的 85，所以这条路线的玩法不是"练得更好"，而是
 * **"人多但别练过头"**：要靠 `militia_reorg` 的「招募民兵」凑满 8 支部队
 * （+1000 人、Puristas 异议 −5），而不是靠「建立突击营」（+8 军事化率、异议 +10）。
 */
export const MILITIA_AUTONOMY_CEILING = 60;

const militiaLegalityLevel = (state: GameState): number =>
  Number(state.domesticPolicy?.militia_legality_law) || 0;

/**
 * 武装民兵：各党派保留自己的武装与自己的打法。
 *
 * 代价是持续的：苏联对我们"不肯建军"越来越不满、共产党与我们越走越远，
 * 而 CNT 在人民阵线里的承诺度**每月 −1**——联盟会被这条路一点点磨薄。
 */
export const militiaAutonomyJournal: JournalEntryDef = {
  id: 'journal_militia_autonomy',
  title: 'Militia Columns',
  titleZh: '民兵纵队',
  description: 'We did not arm the workers so that a ministry could take them away. The columns are the revolution in arms — volunteers who chose to fight, commanded by men they elected, answerable to the unions that feed them. Staff officers call this amateurism. We call it the only army worth having, and we will keep it.',
  descriptionZh: '我们武装工人，不是为了让他们被某个部夺走。纵队就是武装起来的革命——自愿参战的人，由他们自己选出的指挥员带领，向供养他们的工会负责。参谋军官把这称作外行。我们把它称作唯一值得拥有的军队，而且我们会保住它。',
  successCondition: 'At least 8 CNT militia units in the field, and the Militia Legality Law at level 4',
  successConditionZh: '场上至少 8 支归属 CNT 的民兵单位，且民兵合法性法达到 4 级',
  successEffectDesc: 'The Army Reform Law jumps to "Militia Column System"; the parties keep their own armed forces.',
  successEffectDescZh: '军队改革法跳到「民兵纵队体系」；各党派保有独立武装。',
  failureCondition: 'CNT militia militarization rises above 60',
  failureConditionZh: 'CNT 民兵军事化率超过 60',
  failureEffectDesc: 'The militia has been regularised in fact if not in name; Purista dissent +25.',
  failureEffectDescZh: '民兵事实上已被正规化；纯粹派异议度 +25。',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => Math.min(
    (countCntMilitiaUnits(state) / MILITIA_COLUMN_TARGET) * 100,
    (militiaLegalityLevel(state) / MILITIA_LEGALITY_TARGET) * 100,
  ),

  activationEventId: 'militarization_crossroads',
  completionEventId: 'militia_columns_secured',
  failureEventId: 'militia_columns_absorbed',

  checkStatus: (state, entryState) => {
    if (entryState.status !== 'active') return null;
    // 完成优先于失败。
    if (countCntMilitiaUnits(state) >= MILITIA_COLUMN_TARGET
      && militiaLegalityLevel(state) >= MILITIA_LEGALITY_TARGET) {
      return 'completed';
    }
    if (getMilitarization(state, 'cnt') > MILITIA_AUTONOMY_CEILING) return 'failed';
    return null;
  },

  /** 池不动——这正是这条路线的实质。只把军队改革法钉到民兵纵队体系。 */
  onComplete: (state) => ({
    domesticPolicy: { ...state.domesticPolicy, army_reform_law: 4 },
  }),

  onFail: (state) => ({ factions: adjustFactionDissent(state.factions, 'Puristas', 25) }),

  activeEffect: {
    description: 'Our refusal to build a regular army costs us with Moscow, with the Communists, and month by month within the front itself.',
    descriptionZh: '我们拒绝建立正规军，代价体现在莫斯科、体现在共产党身上，也逐月体现在阵线本身。',
    apply: (state) => ({
      ...adjustMemberContribution(state, 'CNT_FAI', -1),
      relations: { ...state.relations, ussr: Math.max(0, state.relations.ussr - 5 / 12) },
      partyRelations: { ...state.partyRelations, PCE: Math.max(-100, state.partyRelations.PCE - 10 / 12) },
    }),
  },
};
