import type { EffectPreviewLine, GameEvent, GameState } from '../../types';
import { adjustFactionDissents } from '../../utils';
import { activateJournal } from '../../rules/journalEvents';
import { applyControlInfluence } from '../../rules/controlShares';
import {
  adjustMilitarization,
  adjustMilitarizations,
  chooseMilitarizationPath,
  getMilitarization,
} from '../../rules/militarization';
import { MILITIA_AUTONOMY_CEILING } from '../../journal/militia_autonomy';
import { isMilitarizationCrossroadsDue } from '../../rules/wartimeCoalition';

/**
 * 「人民军还是武装民兵」——战时人民阵线成立后一个月的路线抉择。
 *
 * 这是整场战争里 CNT 唯一一次决定"我们的武装要不要变成一支国家军队"的机会，
 * 一经选择不可更改。两个选项各自开一条日志，日志的成败再把 `army_reform_law`
 * 钉到 3 级（共和国人民军）或 4 级（民兵纵队体系）。
 */

const CROSSROADS_DESCRIPTION = 'The front has held for a month, and the argument that was postponed in July can be postponed no longer. The columns fight well and coordinate badly; the general staff exists on paper and commands nothing. To win, the Republic needs one army. To remain a revolution, the CNT needs its own. Both are true, and only one can be chosen.';
const CROSSROADS_DESCRIPTION_ZH = '阵线撑住了一个月，而七月被推迟的那场争论再也无法推迟。各纵队勇猛善战，却彼此难以协同；总参谋部只存在于纸面上，指挥不了任何东西。要打赢，共和国需要一支统一的军队。要留住革命，CNT 需要属于自己的武装。两句话都对，而只能选一句。';

const previewLine = (text: string, textZh: string): EffectPreviewLine[] => [{ text, textZh }];

const buildPopularArmy = (state: GameState): Partial<GameState> => ({
  ...adjustMilitarizations(state, { gov: 3, pce: 5 }),
  ...chooseMilitarizationPath(state, 'popular_army'),
  factions: adjustFactionDissents(state.factions, { Faistas: 8, Puristas: 6 }),
  partyRelations: { ...state.partyRelations, PCE: Math.min(100, state.partyRelations.PCE + 10) },
  stats: { ...state.stats, revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5) },
  ...activateJournal(state, 'journal_popular_army'),
  currentEvent: popularArmyResult,
});

const buildMilitiaColumns = (state: GameState): Partial<GameState> => ({
  ...adjustMilitarization(state, 'cnt', 5),
  ...chooseMilitarizationPath(state, 'militia_autonomy'),
  partyRelations: { ...state.partyRelations, PCE: Math.max(-100, state.partyRelations.PCE - 10) },
  relations: { ...state.relations, ussr: Math.max(0, state.relations.ussr - 5) },
  ...applyControlInfluence(state, 3, { land: 0.4, industry: 0.6 }),
  stats: {
    ...state.stats,
    revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
  },
  ...activateJournal(state, 'journal_militia_autonomy'),
  currentEvent: militiaColumnsSecured,
});

export const militarizationCrossroads: GameEvent = {
  id: 'militarization_crossroads',
  meta: { category: 'politics', flow: 'inline.root', series: ['civil_war', 'militarization'] },
  condition: isMilitarizationCrossroadsDue,
  title: 'The People\'s Army, or the Militia?',
  titleZh: '人民军，还是民兵？',
  description: CROSSROADS_DESCRIPTION,
  descriptionZh: CROSSROADS_DESCRIPTION_ZH,
  options: [
    {
      text: 'Build the People\'s Army. Absorb the party columns into one command.',
      textZh: '组建人民军。把各党派纵队收编进统一指挥。',
      subtitle: 'Government and PCE militarization rise, the PCE warms to us, and the anti-militarist wings revolt. Our own independent armed force ends here — if we can carry the integration through within two years.',
      subtitleZh: '政府军与 PCE 军事化率上升，共产党与我们靠近，反军事化的两派则发生反弹。我们自己的独立武装到此为止——前提是能在两年内把整编推行到底。',
      effectPreview: state => previewLine(
        'Government +3 and PCE +5 militarization; PCE relations +10; Faistas +8 and Puristas +6 dissent; revolutionary fervor −5. Opens the People\'s Army journal (24-month deadline; failure costs 40 commitment).',
        '政府军军事化率 +3、PCE +5；PCE 关系 +10；Faistas 异议 +8、Puristas +6；革命热情 −5。开启人民军日志（期限 24 个月，失败代价为承诺度 −40）。',
      ),
      effect: buildPopularArmy,
    },
    {
      text: 'Arm the militia. The columns stay the revolution in arms.',
      textZh: '武装民兵。各纵队继续作为武装起来的革命存在。',
      subtitle: 'CNT militarization rises and the revolution is enthused, but Moscow cools and the Communists drift away. Every month this front holds, our commitment inside it erodes.',
      subtitleZh: 'CNT 军事化率上升，革命热情高涨，但莫斯科转冷、共产党渐行渐远。这条阵线每维持一个月，我们在其中的承诺度就被磨掉一分。',
      // 已经练过头就没得选了：选完下个月立刻触发失败，等于走进陷阱。
      condition: state => getMilitarization(state, 'cnt') <= MILITIA_AUTONOMY_CEILING,
      unavailableSubtitle: () => `The CNT militia is already too well organised for autonomy (CNT militarization of ${MILITIA_AUTONOMY_CEILING} or below required).`,
      unavailableSubtitleZh: () => `CNT 民兵组织度已经太高，自治路线不再可行（需要 CNT 军事化率不超过 ${MILITIA_AUTONOMY_CEILING}）。`,
      effectPreview: state => previewLine(
        'CNT +5 militarization; revolutionary fervor +5 and worker control +3; PCE relations −10 and USSR −5. Opens the Militia Columns journal (fails if CNT militarization exceeds 60).',
        'CNT 军事化率 +5；革命热情 +5、工人控制 +3；PCE 关系 −10、苏联好感 −5。开启民兵纵队日志（若 CNT 军事化率超过 60 则失败）。',
      ),
      effect: buildMilitiaColumns,
    },
  ],
};

export const popularArmyResult: GameEvent = {
  id: 'popular_army_formed',
  meta: { category: 'politics', flow: 'inline.leaf', series: ['civil_war', 'militarization'] },
  condition: () => false,
  title: 'One Army',
  titleZh: '一支军队',
  description: 'The party columns are dissolved into the new establishment. Their men keep their rifles and lose their autonomy; their officers trade an elected committee for a rank. The general staff can at last give an order that means something ninety kilometres away. Nobody who watched the columns march out of Barcelona in July believes this was free.',
  descriptionZh: '各党派纵队被解散，编入新的建制。士兵保留步枪，失去自主；指挥员用当选的委员会换来了军衔。总参谋部终于能下达一条九十公里外仍然算数的命令。七月看着纵队开出巴塞罗那的人，没有一个相信这是没有代价的。',
  options: [{
    text: 'The integration is complete.', textZh: '整编完成',
    effect: () => ({ currentEvent: null }),
  }],
};

export const popularArmyStalled: GameEvent = {
  id: 'popular_army_stalled',
  meta: { category: 'politics', flow: 'inline.leaf', series: ['civil_war', 'militarization'] },
  condition: () => false,
  title: 'Two Years Wasted',
  titleZh: '两年白费',
  description: 'The decree was signed in the autumn of 1936 and never executed. The columns are still columns, the staff is still a drawing, and two years of arguing have bought nothing but resentments. In the front\'s councils, the CNT is now the delegation that blocked the army and could not replace it.',
  descriptionZh: '那纸命令签于 1936 年秋，却从未被执行。纵队依旧是纵队，参谋部依旧是一张图纸，两年的争论只买来了怨恨。在阵线的会议上，CNT 如今是那个既挡住了建军、又拿不出替代方案的代表团。',
  options: [{
    text: 'We have lost the argument, and the room knows it.', textZh: '我们输掉了这场争论，而全场都知道',
    effect: () => ({ currentEvent: null }),
  }],
};

export const militiaColumnsSecured: GameEvent = {
  id: 'militia_columns_secured',
  meta: { category: 'politics', flow: 'inline.leaf', series: ['civil_war', 'militarization'] },
  condition: () => false,
  title: 'The Columns Stand',
  titleZh: '纵队仍在',
  description: 'There will be no unified establishment, no saluting, no staff college. The columns hold their own sectors, elect their own officers, and answer to the unions that arm them. The military men call it a museum of July. The men in the columns call it the only reason they are still fighting.',
  descriptionZh: '不会有什么统一建制，没有敬礼，没有参谋学院。各纵队守着自己的地段，自己选举指挥员，向武装他们的工会负责。军人把这称作七月的博物馆。纵队里的人说，这是他们还在打的唯一理由。',
  options: [{
    text: 'We keep our own army.', textZh: '我们保有自己的军队',
    effect: () => ({ currentEvent: null }),
  }],
};

export const militiaColumnsAbsorbed: GameEvent = {
  id: 'militia_columns_absorbed',
  meta: { category: 'politics', flow: 'inline.leaf', series: ['civil_war', 'militarization'] },
  condition: () => false,
  title: 'Regularised in Fact',
  titleZh: '事实上已被正规化',
  description: 'No decree was ever passed, and none was needed. The columns that drilled, saluted and took orders are the ones that survived; the rest are names on a memorial. The Purists say we spent the revolution\'s army learning to be soldiers, and they are not entirely wrong.',
  descriptionZh: '没有任何法令通过，也不需要。活下来的是那些操练过、敬过礼、听过命令的纵队，其余的只是纪念碑上的名字。纯粹派说我们把革命的军队拿去学会了当兵——这话并不全错。',
  options: [{
    text: 'The revolution has an army, and it is not ours.', textZh: '革命有了一支军队，而它不是我们的',
    effect: () => ({ currentEvent: null }),
  }],
};
