import React from 'react';
import type { EffectPreviewLine, GameEvent, GameState, MayDaysState } from '../../types';
import { getPartyName } from '../../partyNames';
import {
  beginMayDays, canAgreeMayDays, canBackMayDaysCommittees, canGuaranteePOUM, canPreserveMayDaysGovernment,
  canProtectPOUMByInquiry, canWinMayDaysCommitteeAgreement, getMayDaysCohesion, getMayDaysCommitteeControl,
  getMayDaysPower, holdsMayDaysCommitteeControl, isMayDaysDue, isMayDaysPOUMDue, resolveMayDaysGovernment,
  resolveMayDaysPOUM, settleMayDaysCeasefire, MAY_DAYS_UNION_OWNERSHIP_GATE, MAY_DAYS_UNION_SHARE_GATE,
} from '../../rules/mayDays';
import { getSecurityForces, SECURITY_CORPS_INFO } from '../../rules/securityForces';
import { MayDaysNegotiators, MayDaysResultDetails, MAY_SETTLEMENT_NAMES } from '../../../components/MayDaysDetails';
import { canEscalateMayDays, canChooseIberianAllies, formIberianDefense, getIberianTransferProvinces, projectIberianForces, type IberianAllies } from '../../rules/iberianDefense';
import { IberianWarDetails } from '../../../components/IberianWarDetails';

const series = ['civil_war', 'may_days'];
const statNames: Partial<Record<keyof GameState['stats'], [string, string]>> = {
  republicanAuthority: ['Republican authority', '共和国权威'], workerControl: ['Workers’ control', '工人控制'],
  revolutionaryFervor: ['Revolutionary fervor', '革命热情'], bureaucratization: ['Bureaucratization', '官僚化'],
};
const factionNames = { Treintistas: '三十人集团', Cenetistas: '工团派', Faistas: 'FAI 派', Puristas: '纯粹派', Jabalistas: '野猪派' };

/** Pure projections use the exact same guarded settlement functions as the choices. */
const preview = (state: GameState, next: GameState): EffectPreviewLine[] => {
  if (state === next) return [{ text: 'The conditions for this choice are not met.', textZh: '当前未满足这项选择的条件。' }];
  const lines: EffectPreviewLine[] = [];
  if (state.resources !== next.resources) lines.push({ label: 'Resources', labelZh: '资源', value: next.resources - state.resources });
  for (const [key, names] of Object.entries(statNames)) {
    const stat = key as keyof GameState['stats'];
    if (state.stats[stat] !== next.stats[stat]) lines.push({ label: names[0], labelZh: names[1], value: next.stats[stat] - state.stats[stat] });
  }
  for (const [key, zh] of Object.entries(factionNames)) {
    const faction = key as keyof typeof factionNames;
    const delta = next.factions[faction].dissent - state.factions[faction].dissent;
    if (delta) lines.push({ label: `${key} dissent`, labelZh: `${zh}异议`, value: delta });
  }
  const after = getMayDaysPower(next);
  for (const row of getMayDaysPower(state)) {
    const updated = after.find(candidate => candidate.member === row.member);
    const en = getPartyName(state, row.member, false, true), zh = getPartyName(state, row.member, true, true);
    if (!updated) lines.push({ text: `${en} leaves the coalition and loses political and recruitment eligibility.`, textZh: `${zh} 退出联盟并失去政治与新招募资格。` });
    else if (updated.baseCommitment !== row.baseCommitment) lines.push({ label: `${en} base commitment`, labelZh: `${zh} 基础合作承诺`, value: updated.baseCommitment - row.baseCommitment });
  }
  if (next.classes !== state.classes) lines.push({ label: 'CNT support among industrial workers', labelZh: '产业工人对 CNT 的支持', value: next.classes.Obreros.support.CNT_FAI - state.classes.Obreros.support.CNT_FAI });
  lines.push({ text: `Projected cohesion: ${getMayDaysCohesion(state)} → ${getMayDaysCohesion(next)}.`, textZh: `预计联盟凝聚力：${getMayDaysCohesion(state)} → ${getMayDaysCohesion(next)}。` });
  if (next.mayDays?.settlement) {
    const outcome = MAY_SETTLEMENT_NAMES[next.mayDays.settlement];
    lines.push({ text: `Settlement: ${outcome[0]}.`, textZh: `停火结局：${outcome[1]}。` });
  }
  if (next.mayDays?.stage === 'government') lines.push({ text: 'Continue to the national government crisis.', textZh: '随后进入全国权力会议，决定是否改组政府。' });
  if (next.mayDays?.governmentOutcome === 'centralized') lines.push({ text: 'Reshuffle ministries; CNT remains in the coalition outside the cabinet.', textZh: '重新分配部长职位；CNT 留在联盟并转为阁外合作。' });
  if (next.mayDays?.productionFactor !== undefined && next.mayDays.productionFactor < 1) lines.push({
    text: `Barcelona output: ${next.mayDays.productionFactor * 100}% for ${next.mayDays.escalation === 3 ? 2 : 1} subsequent monthly settlements.`,
    textZh: `巴塞罗那随后 ${next.mayDays.escalation === 3 ? 2 : 1} 次月结的补给与工业产出为正常值的 ${next.mayDays.productionFactor * 100}%。`,
  });
  return lines;
};

const transition = (state: GameState, next: GameState): Partial<GameState> => {
  if (next === state) return state;
  const event = next.mayDays?.stage === 'negotiations' ? mayDaysCeasefire
    : next.mayDays?.stage === 'government' ? mayDaysGovernmentCrisis
    : next.mayDays?.stage === 'poum_result' ? mayDaysPOUMResult : mayDaysResult;
  return { ...next, currentEvent: event };
};
const start = (state: GameState, intention: NonNullable<MayDaysState['intention']>) => {
  const next = beginMayDays(state, intention);
  return next === state || intention !== 'withdraw' ? next : settleMayDaysCeasefire(next, 'withdrawal');
};
const withdraw = (state: GameState) => settleMayDaysCeasefire(state, (state.mayDays?.escalation ?? 0) >= 2 ? 'defeat' : 'withdrawal');
const committeeSettlement = (state: GameState) => settleMayDaysCeasefire(state,
  canWinMayDaysCommitteeAgreement(state) && state.resources >= 3 ? 'committee' : 'defeat');

export const mayDays: GameEvent = {
  id: 'may_days',
  meta: { category: 'politics', flow: 'inline.root', series, tags: ['map'] },
  date: { year: 1937, month: 5 },
  condition: isMayDaysDue,
  title: state => state.year === 1937 && state.month === 5 ? 'May Days: The Telephone Exchange' : 'Barcelona Power Crisis: The Telephone Exchange',
  titleZh: state => state.year === 1937 && state.month === 5 ? '五月事件：电话局的接管令' : '巴塞罗那权力危机：电话局的接管令',
  description: 'The workers at the telephone exchange have received an order to surrender control. The government demands reliable military communications; the unions fear that surrendering the exchange will prepare the way for disarming their committees. District delegates await instructions while our partners in the Popular Front demand an answer.',
  descriptionZh: '电话局的工人委员会收到了一道接管命令。政府要求保障军用通信，工会则担心交出电话局会成为解除地方委员会武装的开端。各区代表等待全国委员会表态，人民阵线的伙伴也要求我们说明立场。此前签订的合作协定，能否约束今天试图接管大楼的人？',
  renderContent: state => {
    const zh = state.language === 'zh';
    const law = Number(state.domesticPolicy.security_corps_law) || 0;
    const corps = Object.entries(getSecurityForces(law)).filter(([, value]) => value.manpower > 0)
      .map(([id]) => SECURITY_CORPS_INFO[id as keyof typeof SECURITY_CORPS_INFO][zh ? 'zh' : 'en']);
    return <div className="space-y-4"><p className="text-sm">{law >= 4
      ? (zh ? '工人巡逻队制度已经实行。争论首先表现为政府要求重新划定巡逻与通信权限，街头冲突取决于随后的选择。' : 'Workers’ patrols already operate under the current law. The government demands a new division of patrol and communications powers; street conflict depends on the response.')
      : (zh ? `当前公共安全力量：${corps.join('、')}。接管命令由现存机构执行。` : `Current security corps: ${corps.join(', ')}. The order is enforced through existing institutions.`)}</p><MayDaysNegotiators state={state} /></div>;
  },
  options: [
    {
      text: 'Call for a ceasefire and accept the takeover.', textZh: '发出停火呼吁，接受政府接管',
      subtitle: 'Concede control to restore order, then settle the national governing arrangement.', subtitleZh: '让出控制权以恢复秩序，随后处理全国权力安排。',
      effectPreview: state => preview(state, start(state, 'withdraw')),
      effect: state => transition(state, start(state, 'withdraw')),
    },
    {
      text: 'Hold the exchange and negotiate joint management.', textZh: '守住电话局，争取双方撤队与共同管理',
      subtitle: 'Negotiate guarantees; strained relations can turn the confrontation into street fighting.', subtitleZh: '争取相互担保；关系紧张时，对峙会升级为街头冲突。',
      effectPreview: state => [{ text: 'Proceed to negotiations; a joint agreement requires 60% supporting weight, the responsible partner’s consent, and 2 resources.', textZh: '进入谈判；共同管理需要 60% 支持权重、负责方同意及 2 资源。' }, ...preview(state, start(state, 'negotiate'))],
      effect: state => transition(state, start(state, 'negotiate')),
    },
    {
      text: 'Back the local defence committees.', textZh: '支持地方防卫委员会，提出革命方面的条件',
      subtitle: 'Mobilize the committees. Prolonged disruption accompanies the stronger demands.', subtitleZh: '动员地方委员会；更强硬的要求伴随更长的生产中断。',
      condition: canBackMayDaysCommittees,
      unavailableSubtitle: () => 'Requires CNT control, or joint control with workers’ control ≥60; CNT and POUM coalition weight ≥40%.',
      unavailableSubtitleZh: () => '需要 CNT 掌权，或联合委员会掌权且工人控制 ≥60；CNT 与 POUM 联盟权重合计 ≥40%。',
      effectPreview: state => [{ text: 'Committee demands require 60% supporting weight and CNT/POUM weight of 45%, plus 3 resources. Failure leads to a forced ceasefire.', textZh: '委员会协议需要 60% 支持权重、CNT／POUM 权重合计 45% 和 3 资源；条件不足则只能被迫停火。' }, ...preview(state, start(state, 'committee'))],
      effect: state => transition(state, start(state, 'committee')),
    },
  ],
};

export const mayDaysCeasefire: GameEvent = {
  id: 'may_days_ceasefire',
  meta: { category: 'politics', flow: 'inline.node', series, tags: ['map'] },
  title: 'CNT Leadership: Negotiations at the Barricades', titleZh: 'CNT 高层的态度：街垒上的停火谈判',
  description: 'The national CNT leadership must choose its position. Ministers and union leaders appeal for antifascist unity; district committees demand guarantees against arrests and disarmament. We can authorize a ceasefire, negotiate safeguards, or endorse an insurrection against Madrid. The last choice opens an alternative course: the Iberian Defense Committee will fight both Madrid and the Nationalists. PSOE delegates and UGT members do not form a single bloc.',
  descriptionZh: 'CNT 全国领导层必须作出表态。部长与工会领袖呼吁维护反法西斯团结，各区委员会则要求防止任意逮捕与解除武装的保障。我们可以授权停火、争取有保障的协议，也可以支持起义，公开与马德里决裂。最后一项将开启另一条历史道路：伊比利亚防御委员会同时对抗马德里政府与国民军。PSOE 代表和 UGT 会员并不拥有统一立场。',
  renderContent: state => {
    const isZh = state.language === 'zh';
    // The committee gate has two halves — an organized base and ownership of the plants —
    // so it shows both readings rather than a single "control" number
    // (docs/工人控制度改造方案.md §5.2).
    const control = getMayDaysCommitteeControl(state);
    const gateOpen = holdsMayDaysCommitteeControl(state);
    return <div className="space-y-3">
      <p className="font-bold text-sm">{isZh
        ? `当前局势：${['行政通牒，尚未交火', '局部对峙', '街头冲突', '地方委员会动员'][state.mayDays?.escalation ?? 0]}`
        : `Situation: ${['An administrative demand; no fighting', 'A local standoff', 'Street fighting', 'Defence committee mobilization'][state.mayDays?.escalation ?? 0]}`}</p>
      <p className={`text-xs font-typewriter border-l-2 pl-2 ${gateOpen ? 'border-green-700' : 'border-cnt-red'}`}>
        {isZh
          ? `支持地方委员会的条件：CNT 工会占比 ${control.cntUnionShare.toFixed(0)}/${MAY_DAYS_UNION_SHARE_GATE}、地方工会所有制 ${control.localUnionOwnership.toFixed(0)}/${MAY_DAYS_UNION_OWNERSHIP_GATE}`
          : `To back the committees: CNT union share ${control.cntUnionShare.toFixed(0)}/${MAY_DAYS_UNION_SHARE_GATE}, local union ownership ${control.localUnionOwnership.toFixed(0)}/${MAY_DAYS_UNION_OWNERSHIP_GATE}`}
      </p>
      <MayDaysNegotiators state={state} />
    </div>;
  },
  options: [
    {
      text: 'Stop resistance and accept government control.', textZh: '停止抵抗，接受政府接管',
      subtitle: 'End the confrontation; an escalated struggle brings a harsher settlement.', subtitleZh: '结束对峙；已经升级的冲突将带来更严厉的停火条件。',
      effectPreview: state => preview(state, withdraw(state)), effect: state => transition(state, withdraw(state)),
    },
    {
      text: 'Sign a joint management and mutual withdrawal agreement.', textZh: '签署共同管理与双方撤队协议',
      subtitle: 'Restore communications with shared oversight and individual judicial accountability.', subtitleZh: '以共同监督恢复通信，具体违法行为交由司法审查。',
      condition: state => canAgreeMayDays(state) && state.resources >= 2,
      unavailableSubtitle: () => 'Requires 2 resources, 60% supporting weight and the responsible partner’s consent.',
      unavailableSubtitleZh: () => '需要 2 资源、60% 支持权重，以及负责方同意。',
      effectPreview: state => preview(state, settleMayDaysCeasefire(state, 'joint')),
      effect: state => transition(state, settleMayDaysCeasefire(state, 'joint')),
    },
    {
      text: state => canWinMayDaysCommitteeAgreement(state) && state.resources >= 3 ? 'Conclude an agreement preserving the committees.' : 'Maintain our demands and face a forced ceasefire.',
      textZh: state => canWinMayDaysCommitteeAgreement(state) && state.resources >= 3 ? '达成保留地方委员会的协议' : '坚持委员会条件，承受被迫停火的后果',
      subtitle: 'Keep committee representation if the political mandate holds; otherwise resistance ends in concessions.', subtitleZh: '政治支持充分时保留委员会代表权；否则抵抗以更大的让步告终。',
      condition: state => state.mayDays?.intention === 'committee',
      unavailableSubtitle: () => 'Only available after backing the defence committees.', unavailableSubtitleZh: () => '仅在此前支持地方防卫委员会时可用。',
      effectPreview: state => preview(state, committeeSettlement(state)), effect: state => transition(state, committeeSettlement(state)),
    },
    {
      text: 'Endorse the uprising and break with Madrid.', textZh: '支持全面起义，与马德里政府决裂',
      subtitle: 'Choose the founding allies, then take command of a third faction at war with both existing camps.',
      subtitleZh: '决定委员会的结盟构成后，玩家转为第三阵营指挥官，与政府军、国民军全面交战。',
      condition: canEscalateMayDays,
      unavailableSubtitle: () => 'Requires an unresolved confrontation, CNT activity and Republican control of Barcelona.',
      unavailableSubtitleZh: () => '需要危机尚未解决、CNT 活动正常，且巴塞罗那仍属共和军。',
      effectPreview: () => [{ text: 'CNT leaves the Popular Front. No truce is possible between the three camps; only one can win.', textZh: 'CNT 退出人民阵线。三方互相敌对、不能休战，直到唯一胜者产生。' }],
      effect: state => !canEscalateMayDays(state) ? state : { mayDays: { ...state.mayDays!, stage: 'split_alignment', leadershipAttitude: 'insurrection' }, currentEvent: mayDaysSplitAlignment },
    },
  ],
};

export const mayDaysGovernmentCrisis: GameEvent = {
  id: 'may_days_government_crisis',
  meta: { category: 'politics', flow: 'inline.node', series },
  title: 'The National Governing Conference', titleZh: '全国权力会议',
  description: 'The ceasefire has left the question of government unresolved. Our partners demand a clearer division of authority. We can seek a renewed mandate for the existing arrangement, or accept a cabinet reshuffle and central control of defence and public order. The President remains in office, and regional civil autonomy remains distinct from these wartime powers.',
  descriptionZh: '停火没有消除全国政府内部的分歧。联盟伙伴要求重新划分权力。我们可以争取延续既有安排，或接受内阁改组及中央对军事、治安的接管。共和国总统继续在任，地方民政自治与这些战时权限分别处理。',
  renderContent: state => <div className="space-y-3"><p className="text-sm">{state.language === 'zh'
    ? state.wartimePowerArrangement?.route === 'council' ? '全国国防委员会面临存续表决。成员支持充分时，委员会代表制可以继续。' : state.wartimePowerArrangement?.route === 'external' ? 'CNT 当前采取阁外路线。会议争论的是合作条件与地方权限。' : 'CNT 的部长席位面临重新分配。社会主义者的支持将影响联合内阁能否继续。'
    : state.wartimePowerArrangement?.route === 'council' ? 'The National Defence Council faces a vote on its continued existence.' : state.wartimePowerArrangement?.route === 'external' ? 'CNT operates outside the cabinet; the dispute concerns cooperation terms and local powers.' : 'CNT ministries face redistribution; Socialist support can sustain the joint cabinet.'}</p><MayDaysNegotiators state={state} /></div>,
  options: [
    {
      text: 'Renew the existing governing agreement.', textZh: '更新协定，保住原有权力安排',
      subtitle: 'Preserve the cabinet or council through a renewed political mandate.', subtitleZh: '依靠新的政治支持，保留既有内阁或国防委员会。',
      condition: canPreserveMayDaysGovernment,
      unavailableSubtitle: () => 'Requires an agreed settlement, or CNT/PSOE weight ≥55%, PSOE relations ≥55 and PSOE commitment ≥60.',
      unavailableSubtitleZh: () => '需要已达成共同协议，或 CNT／PSOE 权重 ≥55%、PSOE 关系 ≥55 且合作意愿 ≥60。',
      effectPreview: state => preview(state, resolveMayDaysGovernment(state, true)), effect: state => transition(state, resolveMayDaysGovernment(state, true)),
    },
    {
      text: 'Accept a reshuffle and continue wartime cooperation.', textZh: '接受内阁改组，继续战时合作',
      subtitle: 'A new central cabinet replaces CNT ministries; CNT remains a coalition member.', subtitleZh: '中央内阁重新分配 CNT 部长职位；CNT 继续留在人民阵线。',
      effectPreview: state => preview(state, resolveMayDaysGovernment(state, false)), effect: state => transition(state, resolveMayDaysGovernment(state, false)),
    },
  ],
};

export const mayDaysResult: GameEvent = {
  id: 'may_days_result',
  meta: { category: 'politics', flow: 'inline.leaf', series, tags: ['map'] },
  title: 'After the Barricades', titleZh: '街垒之后',
  description: 'The barricades are coming down. The agreements reached here will shape the cabinet, local institutions and the willingness of the Popular Front’s members to work together. The front still needs the factories and supplies of Barcelona.',
  descriptionZh: '街垒开始拆除。这里达成的协议将影响内阁、地方机构，以及人民阵线各成员继续合作的意愿。前线仍需要巴塞罗那的工厂与补给。',
  renderContent: state => <MayDaysResultDetails state={state} />,
  options: [{
    text: 'Record the agreement and resume our work.', textZh: '记录协议，恢复工作',
    subtitle: 'Complete this month’s crisis. Any POUM follow-up is scheduled for the next month.', subtitleZh: '结束本月危机；符合条件的 POUM 后续将在次月处理。',
    effect: state => state.mayDays?.stage !== 'result' ? state : { mayDays: { ...state.mayDays, stage: state.mayDays.poumFollowupDueAt === undefined ? 'complete' : 'settled' }, currentEvent: null },
  }],
};


const alignmentOption = (allies: IberianAllies, text: string, textZh: string): GameEvent['options'][number] => ({
  text, textZh,
  subtitle: allies.psoeLeft ? 'The Socialist left contributes 40% of UGT militia forces and reserves; the rest stay with Madrid.' : allies.poum ? 'CNT and POUM bring their actual formations, equipment and recruitment reserves.' : 'CNT committees bring their own formations, equipment and recruitment reserves.',
  subtitleZh: allies.psoeLeft ? 'PSOE 左翼带来 UGT 民兵与预备人力的 40%；其余力量留在马德里一方。' : allies.poum ? 'CNT 与 POUM 带入各自实际部队、装备和招募预备人力。' : 'CNT 委员会带入自己的实际部队、装备和招募预备人力。',
  condition: state => canChooseIberianAllies(state, allies),
  unavailableSubtitle: () => 'Invited organizations must be active; POUM must retain legal activity.',
  unavailableSubtitleZh: () => '受邀组织必须处于活动状态；POUM 必须尚未被取缔。',
  effectPreview: state => {
    const forces = projectIberianForces(state, allies).contributions;
    const next = formIberianDefense(state, allies);
    const resources = next.mapResources?.IBERIAN_DEFENSE;
    return [
      { text: `Joining troops: CNT ${forces.cnt}; POUM ${forces.poum}; PSOE left ${forces.psoeLeft}. ${getIberianTransferProvinces(state, allies).length} provinces change ownership.`,
        textZh: `加入兵力：CNT ${forces.cnt}、POUM ${forces.poum}、PSOE 左翼 ${forces.psoeLeft}；共 ${getIberianTransferProvinces(state, allies).length} 个省份改属委员会。` },
      { text: `Starting reserves: ${resources?.manpower ?? 0} conscripts, ${resources?.supplies ?? 0} supplies, ${resources?.industrialCapacity ?? 0} industry, ${resources?.tankReserve ?? 0} armour. These are divided from Republican stocks by transferred industry.`,
        textZh: `分得库存：${resources?.manpower ?? 0} 征召人力、${resources?.supplies ?? 0} 补给、${resources?.industrialCapacity ?? 0} 工业能力、${resources?.tankReserve ?? 0} 装甲预备；按转移工业比例划分共和国现有库存。` },
      { text: 'Non-joining garrisons withdraw to their own territory. Each camp has 2 CP per month; Madrid and Nationalist AI each act once.',
        textZh: '未加入的驻军撤往本方领土。每方每月 2 CP，马德里政府与国民军 AI 各行动一次。' },
    ];
  },
  effect: state => {
    const next = formIberianDefense(state, allies);
    return next === state ? state : { ...next, currentEvent: mayDaysSplitResult };
  },
});

export const mayDaysSplitAlignment: GameEvent = {
  id: 'may_days_split_alignment',
  meta: { category: 'war', flow: 'inline.node', series, tags: ['map', 'military'] },
  title: 'Who Will Join the Defense Committee?', titleZh: '谁将加入防御委员会？',
  description: 'The decision to break with Madrid has been made. CNT committees form the core. POUM can bring its formations, while an invited Socialist left brings part of the UGT militia without taking the whole PSOE with it. Republican-held provinces in Catalonia, Valencia and Aragon, plus provinces occupied by the joining committee units, form the new territory. Barcelona becomes its capital.',
  descriptionZh: '与马德里决裂的决定已经作出。CNT 防卫委员会构成核心，POUM 可以带领所属部队加入；受邀的社会主义左翼则带来部分 UGT 民兵，PSOE 其余力量继续留在政府一方。加泰罗尼亚、瓦伦西亚、阿拉贡当时属于共和军的地块，以及加入委员会的单位所在省份，组成新阵营版图。首府设在巴塞罗那。',
  options: [
    alignmentOption({ poum: false, psoeLeft: false }, 'The CNT committees will stand alone.', '由 CNT 委员会独立作战'),
    alignmentOption({ poum: true, psoeLeft: false }, 'Form a common front with POUM.', '与 POUM 组成共同阵线'),
    alignmentOption({ poum: false, psoeLeft: true }, 'Invite the Socialist left.', '邀请 PSOE 左翼加入'),
    alignmentOption({ poum: true, psoeLeft: true }, 'Unite CNT, POUM and the Socialist left.', '联合 CNT、POUM 与 PSOE 左翼'),
  ],
};

export const mayDaysSplitResult: GameEvent = {
  id: 'may_days_split_result',
  meta: { category: 'war', flow: 'inline.leaf', series, tags: ['map', 'military'] },
  title: 'The Iberian Defense Committee', titleZh: '伊比利亚防御委员会成立',
  description: 'The Popular Front has split. You now command the Iberian Defense Committee. Madrid and the Nationalists are independent enemies. Losing a capital is fatal only when the same camp also falls below its strategic-value threshold; the capital occupier receives its remaining territory. The war continues until only one camp remains.',
  descriptionZh: '人民阵线已经分裂。你现在指挥伊比利亚防御委员会，马德里政府和国民军分别成为独立敌人。一个阵营只有在失去首都、且战略价值低于阈值时才出局；其剩余领土交给首都占领方。战争持续至唯一胜者出现，即使国民军先亡，两支左翼力量仍将继续交战。',
  renderContent: state => <IberianWarDetails state={state} />,
  options: [{ text: 'Take command in Barcelona.', textZh: '在巴塞罗那接掌指挥权',
    subtitle: 'Complete the event and proceed to the Committee’s war turn.', subtitleZh: '结束事件，在战争阶段指挥委员会部队。',
    effect: state => state.mayDays?.stage !== 'split_result' ? state : { mayDays: { ...state.mayDays, stage: 'complete' }, currentEvent: null },
  }],
};


export const mayDaysPOUMCase: GameEvent = {
  id: 'may_days_poum_case',
  meta: { category: 'politics', flow: 'inline.root', series, tags: ['law'] },
  condition: isMayDaysPOUMDue,
  title: 'The Fate of the POUM', titleZh: '街垒余波：POUM 的命运',
  description: 'The dispute over responsibility for Barcelona has become a demand to suppress the POUM. Allegations of treason circulate, but allegations are not proof. CNT must decide whether to organize guarantees, press for a public judicial inquiry, or accept the ban to preserve cooperation with the cabinet.',
  descriptionZh: '追究巴塞罗那冲突责任的争论，已经发展为取缔 POUM 的要求。通敌指控正在流传，但指控本身不能作为定罪证据。CNT 必须决定：组织共同担保、争取公开司法调查，还是为维持内阁合作而接受取缔。',
  renderContent: state => <MayDaysNegotiators state={state} judicial />,
  options: [
    {
      text: 'Organize joint guarantees for lawful political activity.', textZh: '组织共同担保，保护合法政治活动',
      subtitle: 'Protect POUM’s public activity under explicit guarantees.', subtitleZh: '以明确的共同担保保护 POUM 的公开活动。',
      condition: canGuaranteePOUM,
      unavailableSubtitle: () => 'Requires 2 resources and 60% weight supporting judicial guarantees.', unavailableSubtitleZh: () => '需要 2 资源，以及支持司法保障的成员权重达到 60%。',
      effectPreview: state => preview(state, resolveMayDaysPOUM(state, 'guarantee')), effect: state => transition(state, resolveMayDaysPOUM(state, 'guarantee')),
    },
    {
      text: 'Demand an open inquiry and judicial supervision.', textZh: '要求公开调查和司法监督',
      subtitle: 'Use judicial support or a political majority; without either, the ban proceeds despite our protest.', subtitleZh: '依靠司法部长支持或政治多数；两者都不足时，抗议将无法阻止取缔。',
      effectPreview: state => [{ text: canProtectPOUMByInquiry(state) ? 'The inquiry preserves POUM’s political eligibility.' : 'Our protest cannot prevent the ban.', textZh: canProtectPOUMByInquiry(state) ? '公开调查将保留 POUM 的政治活动资格。' : '当前支持不足，抗议无法阻止取缔。' }, ...preview(state, resolveMayDaysPOUM(state, 'inquiry'))],
      effect: state => transition(state, resolveMayDaysPOUM(state, 'inquiry')),
    },
    {
      text: 'Accept the ban to maintain cabinet cooperation.', textZh: '接受取缔，维持内阁合作',
      subtitle: 'Remove POUM from legal politics and recruitment. Its existing troops retain their personnel and equipment.', subtitleZh: '撤销 POUM 的政治活动与新招募资格；现有部队保留人数和装备。',
      effectPreview: state => preview(state, resolveMayDaysPOUM(state, 'ban')), effect: state => transition(state, resolveMayDaysPOUM(state, 'ban')),
    },
  ],
};

export const mayDaysPOUMResult: GameEvent = {
  id: 'may_days_poum_result',
  meta: { category: 'politics', flow: 'inline.leaf', series, tags: ['law'] },
  title: 'The Price of Cooperation', titleZh: '合作的代价',
  description: 'The decision has changed the Popular Front. Its cohesion now reflects the remaining members, their political strength, unions and military commands. The record below also preserves the consequences for those excluded from the pact.',
  descriptionZh: '这项决定改变了人民阵线。联盟凝聚力已经根据现有成员的政治实力、工会与军事指挥力量重新计算。记录同时保留了被排除者的处境与这项决定的政治代价。',
  renderContent: state => <MayDaysResultDetails state={state} />,
  options: [{
    text: 'Record the outcome.', textZh: '记录结果',
    subtitle: 'Complete the POUM follow-up.', subtitleZh: '结束 POUM 后续事件。',
    effect: state => state.mayDays?.stage !== 'poum_result' ? state : { mayDays: { ...state.mayDays, stage: 'complete' }, currentEvent: null },
  }],
};
