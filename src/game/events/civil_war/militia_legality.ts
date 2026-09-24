import type { GameEvent, GameState } from '../../types';
import { adjustFactionDissents } from '../../utils';
import { clampLawLevel } from '../../lawStances';
import { applyControlInfluence } from '../../rules/controlShares';
import { isSpanishCivilWarOngoing, monthIndex } from '../../rules/wartimeCoalition';

/**
 * 「民兵合法性法」的推进链——`domesticPolicy.militia_legality_law` 的**唯一写入者**。
 *
 * 这条法律此前没有任何写入者（三份剧本都停在 1 级），而两条军事化日志的完成条件
 * 都要求它到 4 级，所以「人民军」与「武装民兵」两条路线**永远走不完**。这里用三个
 * 一次性历史事件把阶梯补上：
 *
 *   1 级（默许地方民兵，剧本初值）
 *     → 2 级「武装工会法令」        `militia_legality_armed_unions`
 *     → 3 级「后方民兵治安统合」    `militia_legality_rear_security`
 *     → 4 级「反法西斯民兵委员会」  `militia_legality_committee`
 *
 * 阶梯的**形状**比速度更重要：2 级是"承认民兵存在"，3 级是"把后方治安交给他们"
 * （PCE 的偏好：把民兵并入国家机器），4 级是"承认一个工团主义的平行治安机构"
 * （CNT 的偏好：`LAW_STANCE_PREFERENCES` 里 CNT 对 3 级的偏好只有 2、对 4 级是 10，
 * 而 PCE 恰好相反）。每一级都可以拒绝，拒绝就停在原地——**这条链随时可以走死**，
 * 而走死意味着 `army_reform_law` 的 3/4 级也一起够不着。这是刻意的。
 *
 * 时间锚点用 `civilWarSetupCompletedAt` 而不是各自的解决时间：`eventHistory` 只记
 * id 不记日期，而 `JournalState` 也没有时间戳。三个事件分别在内战开局完成后的
 * 第 1 / 4 / 8 个月评估，这样阶梯一定走在「人民军还是武装民兵」那条抉择
 * （战时人民阵线成立后一个月）的附近，给 24 个月期限留出余量。
 */

const ARMED_UNIONS_ID = 'militia_legality_armed_unions';
const REAR_SECURITY_ID = 'militia_legality_rear_security';
const COMMITTEE_ID = 'militia_legality_committee';

const ARMED_UNIONS_MONTH = 1;
const REAR_SECURITY_MONTH = 4;
const COMMITTEE_MONTH = 8;

const militiaLegalityLevel = (state: GameState): number => (
  Number(state.domesticPolicy?.militia_legality_law) || 0
);

/** 内战开局完成后经过的月数；未开局时返回 -1，任何"第 N 个月"的条件都不成立。 */
const monthsSinceCivilWarSetup = (state: GameState): number => (
  state.civilWarSetupCompletedAt
    ? monthIndex(state) - monthIndex(state.civilWarSetupCompletedAt)
    : -1
);

/**
 * 三级共用形状：战争仍在打、已经过了指定的开局月数、法律恰好停在上一级、
 * 且本事件从未被解决过。`>=` 而不是 `===`，这样若当月被别的事件占住，下个月还会再来。
 */
const isRungDue = (
  state: GameState,
  eventId: string,
  requiredLevel: number,
  monthOffset: number,
): boolean => Boolean(
  isSpanishCivilWarOngoing(state)
  && monthsSinceCivilWarSetup(state) >= monthOffset
  && militiaLegalityLevel(state) === requiredLevel
  && !state.eventHistory?.resolved.includes(eventId),
);

const raiseMilitiaLegality = (state: GameState, level: number): Partial<GameState> => ({
  domesticPolicy: {
    ...state.domesticPolicy,
    militia_legality_law: clampLawLevel('militia_legality_law', level),
  },
});

/**
 * 一次结算两个标量，避免嵌套调用时把 `stats` 拼错。
 *
 * 传入的 `state` 必须是**已经套用过所有权补丁**的那个：`applyControlInfluence` 只返回
 * 部分的 `stats`（仅 `workerControl`），这里要把那份派生值一并带进最终补丁，否则预览
 * 会少显示一段工人控制度的变化。
 */
const withStats = (
  state: GameState,
  { fervor = 0, authority = 0 }: { fervor?: number; authority?: number },
): GameState['stats'] => ({
  ...state.stats,
  revolutionaryFervor: Math.max(0, Math.min(100, state.stats.revolutionaryFervor + fervor)),
  republicanAuthority: Math.max(0, Math.min(100, state.stats.republicanAuthority + authority)),
});

// ---------------------------------------------------------------------------
// 1 级 → 2 级　武装工会法令
// ---------------------------------------------------------------------------

const signArmedUnionsDecree = (state: GameState): Partial<GameState> => {
  const control = applyControlInfluence(state, 3, { land: 0.3, industry: 0.7 });
  return {
    ...raiseMilitiaLegality(state, 2),
    factions: adjustFactionDissents(state.factions, {
      Faistas: -6,
      Puristas: -4,
      Cenetistas: 2,
      Treintistas: 6,
    }),
    partyRelations: {
      ...state.partyRelations,
      PCE: Math.max(-100, (state.partyRelations.PCE || 0) - 4),
      PSOE: Math.max(-100, (state.partyRelations.PSOE || 0) - 2),
    },
    ...control,
    stats: withStats({ ...state, ...control }, { fervor: 5, authority: -6 }),
  };
};

const keepParamilitariesIllegal = (state: GameState): Partial<GameState> => ({
  factions: adjustFactionDissents(state.factions, {
    Faistas: 10,
    Puristas: 8,
    Treintistas: -6,
    Cenetistas: -3,
  }),
  partyRelations: {
    ...state.partyRelations,
    PCE: Math.min(100, (state.partyRelations.PCE || 0) + 6),
    IR: Math.min(100, (state.partyRelations.IR || 0) + 6),
    PSOE: Math.min(100, (state.partyRelations.PSOE || 0) + 4),
  },
  stats: withStats(state, { fervor: -6, authority: 8 }),
});

export const militiaLegalityArmedUnions: GameEvent = {
  id: 'militia_legality_armed_unions',
  meta: { category: 'politics', flow: 'solo', series: ['civil_war', 'militarization'], tags: ['law'] },
  condition: state => isRungDue(state, ARMED_UNIONS_ID, 1, ARMED_UNIONS_MONTH),
  title: 'The Armed Unions Decree',
  titleZh: '武装工会法令',
  description: 'The columns exist because in July nobody could have disarmed them. The Republic has spent the summer pretending otherwise: the militias are still, on paper, illegal paramilitary bands, and every requisition they make is technically a crime. The Ministry of Justice has drafted a way out — a decree recognising the unions as lawful belligerents, arming them openly, and giving their committees a legal existence. Sign it and the Republic admits that a state which could not protect its citizens handed them the rifles instead. Refuse, and the fiction holds: the government keeps its monopoly on legality, and the men at the front keep fighting under a government that calls them criminals.',
  descriptionZh: '各纵队之所以存在，是因为七月里没有人能解除他们的武装。整个夏天，共和国都在假装事情不是这样：民兵在纸面上仍是非法准军事团体，他们每一次征用严格说来都是犯罪。司法部拟好了一条出路——一纸法令，承认工会是合法的交战方，公开武装他们，并让他们的委员会获得法律地位。签下它，共和国就等于承认：一个保护不了公民的国家，是把步枪交到了公民手上。拒绝，则这套虚构得以维持：政府保住了对合法性的垄断，而在前线流血的人，继续为一个称他们为罪犯的政府作战。',
  options: [
    {
      text: 'Sign it. The unions are the Republic\'s army now.',
      textZh: '签字。工会如今就是共和国的军队。',
      subtitle: 'Militia legality law level 2 (Armed Unions Decree): militia militarization +0.2/month. The anarchist wings are satisfied, the moderates are not, and the Republic\'s authority over its own territory slips another notch.',
      subtitleZh: '民兵合法性法提升至 2 级（武装工会法令）：民兵军事化率 +0.2/月。安那其各派满意，温和派不满，而共和国对自己领土的权威再滑一格。',
      effect: signArmedUnionsDecree,
    },
    {
      text: 'Refuse. The Republic must not legalise its own rival.',
      textZh: '拒绝。共和国不能把自己的对手合法化。',
      subtitle: 'The law stays at level 1, and both roads out of the crossroads close with it: neither the People\'s Army nor the Militia Columns can ever be completed, because army reform levels 3 and 4 become unreachable.',
      subtitleZh: '法律停在 1 级，而那场抉择的两条出路也随之关闭：人民军与民兵纵队都再也完不成，因为军事改革法的 3、4 级变得不可达。',
      effect: keepParamilitariesIllegal,
    },
  ],
};

// ---------------------------------------------------------------------------
// 2 级 → 3 级　后方民兵治安统合
// ---------------------------------------------------------------------------

const handRearSecurityToMilitias = (state: GameState): Partial<GameState> => {
  const control = applyControlInfluence(state, 5, { land: 0.3, industry: 0.7 });
  return {
    ...raiseMilitiaLegality(state, 3),
    factions: adjustFactionDissents(state.factions, {
      Faistas: 6,
      Puristas: 6,
      Treintistas: -4,
      Cenetistas: -3,
    }),
    partyRelations: {
      ...state.partyRelations,
      PCE: Math.min(100, (state.partyRelations.PCE || 0) + 10),
      PSOE: Math.min(100, (state.partyRelations.PSOE || 0) + 5),
    },
    ...control,
    stats: withStats({ ...state, ...control }, { authority: -5 }),
  };
};

const keepPoliceOnTheCheckpoints = (state: GameState): Partial<GameState> => ({
  factions: adjustFactionDissents(state.factions, {
    Faistas: -4,
    Puristas: -3,
  }),
  partyRelations: {
    ...state.partyRelations,
    PCE: Math.max(-100, (state.partyRelations.PCE || 0) - 8),
    PSOE: Math.max(-100, (state.partyRelations.PSOE || 0) - 3),
  },
  stats: withStats(state, { authority: 4 }),
});

export const militiaLegalityRearSecurity: GameEvent = {
  id: 'militia_legality_rear_security',
  meta: { category: 'politics', flow: 'solo', series: ['civil_war', 'militarization'], tags: ['law'] },
  condition: state => isRungDue(state, REAR_SECURITY_ID, 2, REAR_SECURITY_MONTH),
  title: 'Who Polices the Rear?',
  titleZh: '谁来管后方？',
  description: 'The militias hold the front and the police hold the rear, and the two of them have been arresting each other\'s men since August. The Interior Ministry proposes a division of labour: the militias take over the rear checkpoints, the patrols, the roadblocks and the search of suspects, formally and in law. It would end the shooting in the rear and it would end the Republic\'s claim to a monopoly of force in its own territory. The Communists support it warmly — they read it as the first step towards a single army. The purists support it for the opposite reason.',
  descriptionZh: '民兵守前线，警察守后方，而两拨人从八月起就在互相抓对方的人。内政部提出一套分工：把后方的检查站、巡逻、路障与嫌疑人搜查正式地、以法律的名义交给民兵。这会结束后方的互射，也会结束共和国对"在自己领土上垄断武力"的主张。共产党热烈支持——他们把它读作通往统一军队的第一步。纯粹派支持它的理由恰恰相反。',
  options: [
    {
      text: 'Give the militias the rear. Let the unions police their own districts.',
      textZh: '把后方交给民兵。让工会在自己的街区执法。',
      subtitle: 'Militia legality law level 3 (Rearguard Militia Integration): militia militarization +0.3/month, authority −0.3/month. The PCE warms to us; our own radicals grumble that this is integration by another name.',
      subtitleZh: '民兵合法性法提升至 3 级（后方民兵治安统合）：民兵军事化率 +0.3/月，共和国权威 −0.3/月。共产党与我们靠近；我们自己的激进派抱怨说这不过是换了名字的收编。',
      effect: handRearSecurityToMilitias,
    },
    {
      text: 'The police keep the checkpoints. The militias stay at the front.',
      textZh: '检查站留给警察。民兵就待在前线。',
      subtitle: 'The law stays at level 2. The Interior Ministry keeps its authority and the Communists take it as a refusal of the whole integration project.',
      subtitleZh: '法律停在 2 级。内政部保住了自己的权威，而共产党把这看作对整个整编计划的拒绝。',
      effect: keepPoliceOnTheCheckpoints,
    },
  ],
};

// ---------------------------------------------------------------------------
// 3 级 → 4 级　反法西斯民兵委员会
// ---------------------------------------------------------------------------

const recogniseTheCommittee = (state: GameState): Partial<GameState> => {
  const control = applyControlInfluence(state, 8, { land: 0.3, industry: 0.7 });
  return {
    ...raiseMilitiaLegality(state, 4),
    factions: adjustFactionDissents(state.factions, {
      Faistas: -10,
      Puristas: -8,
      Cenetistas: 3,
      Treintistas: 8,
    }),
    partyRelations: {
      ...state.partyRelations,
      PCE: Math.max(-100, (state.partyRelations.PCE || 0) - 10),
      PSOE: Math.max(-100, (state.partyRelations.PSOE || 0) - 6),
      IR: Math.max(-100, (state.partyRelations.IR || 0) - 4),
    },
    relations: { ...state.relations, ussr: Math.max(0, (state.relations.ussr || 0) - 5) },
    ...control,
    stats: withStats({ ...state, ...control }, { fervor: 8, authority: -10 }),
  };
};

const dissolveTheCommittee = (state: GameState): Partial<GameState> => ({
  factions: adjustFactionDissents(state.factions, {
    Faistas: 12,
    Puristas: 10,
    Treintistas: -6,
  }),
  partyRelations: {
    ...state.partyRelations,
    PCE: Math.min(100, (state.partyRelations.PCE || 0) + 6),
    PSOE: Math.min(100, (state.partyRelations.PSOE || 0) + 6),
  },
  stats: withStats(state, { fervor: -6, authority: 6 }),
});

export const militiaLegalityCommittee: GameEvent = {
  id: 'militia_legality_committee',
  meta: { category: 'politics', flow: 'solo', series: ['civil_war', 'militarization'], tags: ['law'] },
  condition: state => isRungDue(state, COMMITTEE_ID, 3, COMMITTEE_MONTH),
  title: 'The Anti-Fascist Militia Committee',
  titleZh: '反法西斯民兵委员会',
  description: 'The committees that ran the rear have stopped being an improvisation. They levy taxes, issue passes, judge offences and settle disputes between unions, and they answer to nobody in the cabinet. Two futures are on the table. Recognise the committee as a lawful authority and the Republic becomes, permanently, two powers sharing one territory — a syndicalist rear behind a republican front. Dissolve it and there is one authority again, and it belongs to the state. There is no third option in which the militias keep the rear and the government keeps its sovereignty; whichever way this goes, somebody\'s revolution ends here.',
  descriptionZh: '管理后方的那些委员会已经不再是临时的应急机构。它们征税、发通行证、审判违法行为、裁决工会之间的纠纷，且不对内阁里的任何人负责。桌上摆着两种未来。承认这个委员会是合法机关，共和国就永久地变成两个政权共处一片领土——共和国的前线，工团主义者的后方。解散它，权威重新归一，而归国家所有。不存在第三种选择能让民兵留住后方而政府保住主权；无论走哪边，某一些人的革命到此为止。',
  options: [
    {
      text: 'Recognise the committee. The rear will be run by the revolution.',
      textZh: '承认委员会。后方将由革命来管。',
      subtitle: 'Militia legality law level 4 (Anti-Fascist Militia Committee): militia militarization +0.4/month, fervor +0.5/month, authority −0.5/month. This is the rung both journals wait for — the People\'s Army and the Militia Columns now become winnable.',
      subtitleZh: '民兵合法性法提升至 4 级（反法西斯民兵委员会）：民兵军事化率 +0.4/月，革命热情 +0.5/月，共和国权威 −0.5/月。这正是两条日志所等的最后一级——人民军与民兵纵队至此才可能完成。',
      effect: recogniseTheCommittee,
    },
    {
      text: 'Dissolve it. One authority, and it is the Republic\'s.',
      textZh: '解散它。权威只能有一个，而且属于共和国。',
      subtitle: 'The law stays at level 3, and both journals stay unwinnable: army reform levels 3 and 4 need a militia legality of 4, and this was the last rung that could have supplied it.',
      subtitleZh: '法律停在 3 级，两条日志也就永远赢不了：军事改革法的 3、4 级要求民兵合法性达到 4 级，而这是最后一个能提供它的台阶。',
      effect: dissolveTheCommittee,
    },
  ],
};
