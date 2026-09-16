import React from 'react';
import type { GameState, MayDaysPOUMOutcome, MayDaysSettlement } from '../game/types';
import { getPartyName } from '../game/partyNames';
import { getMayDaysCohesion, getMayDaysRequiredPartner, getMayDaysSupport, getMayDaysSupportWeight } from '../game/rules/mayDays';
import { monthIndex } from '../game/rules/wartimeCoalition';

export const MAY_SETTLEMENT_NAMES: Record<MayDaysSettlement, [string, string]> = {
  withdrawal: ['Ceasefire through concessions', '让步停火'], joint: ['Joint management with guarantees', '有保障的共同管理'],
  committee: ['An agreement for the defence committees', '地方委员会取得协议'], defeat: ['A forced ceasefire', '抵抗后被迫停火'],
};
export const MAY_POUM_NAMES: Record<MayDaysPOUMOutcome, [string, string]> = {
  guaranteed: ['Lawful activity guaranteed', '共同担保合法活动'], inquiry: ['An open judicial inquiry', '公开调查，保留资格'],
  banned: ['POUM banned', '接受取缔 POUM'], protested_ban: ['The ban proceeds despite CNT protests', 'CNT 抗议未能阻止取缔'],
};
const CONTROL_NAMES = { central: ['Central government', '中央政府'], joint: ['Joint supervision', '共同监督'], committee: ['Local committees', '地方委员会'] } as const;
const OFFICES: Record<keyof GameState['ministers'], [string, string]> = {
  labor: ['Labour', '劳动'], health: ['Health', '卫生'], justice: ['Justice', '司法'], industry: ['Industry and commerce', '工业与商业'],
  interior: ['Interior', '内政'], war: ['War', '战争'], agriculture: ['Agriculture', '农业'], finance: ['Finance', '财政'], estado: ['Foreign affairs', '外交'],
};

export const MayDaysNegotiators = ({ state, judicial = false }: { state: GameState; judicial?: boolean }) => {
  const zh = state.language === 'zh';
  const rows = getMayDaysSupport(state, judicial);
  const required = getMayDaysRequiredPartner(state);
  return <section className="space-y-2 text-xs font-typewriter" aria-label={zh ? '谈判支持方' : 'Negotiating partners'}>
    <p className="font-bold">{zh ? `支持权重 ${(getMayDaysSupportWeight(state, judicial) * 100).toFixed(1)}% / 60%` : `Supporting weight ${(getMayDaysSupportWeight(state, judicial) * 100).toFixed(1)}% / 60%`}</p>
    {!judicial && <p>{zh ? '还需同意的负责方：' : 'Responsible partner whose consent is also required: '}{required ? getPartyName(state, required, zh, true) : (zh ? '无可参与的负责党派' : 'No eligible responsible party')}</p>}
    <p>{zh ? '权重包括政治支持、所属工会与军事力量；此处显示政治谈判实力。PSUC 的政治影响由现有 PCE 党派项承载。' : 'Weights include political support, affiliated unions and military power. They measure bargaining strength. PSUC political effects use the existing PCE party entry.'}</p>
    <div className="overflow-x-auto"><table className="w-full text-left text-[11px] whitespace-nowrap">
      <thead><tr>{(zh ? ['成员', '政治', '工会加成', '军事修正', '权重', '合作意愿', '支持协议'] : ['Member', 'Political', 'Union bonus', 'Military', 'Weight', 'Commitment', 'Supports']).map(label => <th key={label} className="p-1">{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.member} className="border-t border-ink/15">
        <td className="p-1">{getPartyName(state, row.member, zh, true)}</td><td className="p-1">{row.support.toFixed(1)}</td>
        <td className="p-1">{row.unionBonus.toFixed(1)}</td><td className="p-1">{row.militaryBonus.toFixed(1)}</td>
        <td className="p-1">{(row.weight * 100).toFixed(1)}%</td><td className="p-1">{row.commitment.toFixed(1)}</td><td className="p-1">{row.supports ? (zh ? '支持' : 'Yes') : (zh ? '未支持' : 'No')}</td>
      </tr>)}</tbody>
    </table></div>
  </section>;
};

export const MayDaysAftermath = ({ state }: { state: GameState }) => {
  const may = state.mayDays;
  if (!may?.settlement) return null;
  const zh = state.language === 'zh';
  const i = zh ? 1 : 0;
  const remaining = Math.max(0, may.productionThroughMonth - monthIndex(state));
  return <section className="border border-ink/25 p-3 space-y-2 text-xs font-typewriter" aria-label={zh ? '巴塞罗那街垒后果' : 'Barcelona crisis aftermath'}>
    <h4 className="font-bold">{zh ? '巴塞罗那街垒' : 'Barcelona barricades'} · {MAY_SETTLEMENT_NAMES[may.settlement][i]}</h4>
    <p>{zh ? `通信：${may.communicationsControl ? CONTROL_NAMES[may.communicationsControl][i] : '—'}；治安：${may.publicOrderControl ? CONTROL_NAMES[may.publicOrderControl][i] : '—'}；军事协调：${may.defenceControl ? CONTROL_NAMES[may.defenceControl][i] : '—'}。` : `Communications: ${may.communicationsControl ? CONTROL_NAMES[may.communicationsControl][i] : '—'}; public order: ${may.publicOrderControl ? CONTROL_NAMES[may.publicOrderControl][i] : '—'}; defence coordination: ${may.defenceControl ? CONTROL_NAMES[may.defenceControl][i] : '—'}.`}</p>
    <p>{remaining > 0 ? (zh ? `巴塞罗那接下来 ${remaining} 次月结的补给与工业产出为正常值的 ${Math.round(may.productionFactor * 100)}%。` : `Barcelona produces ${Math.round(may.productionFactor * 100)}% of its supplies and industry for the next ${remaining} monthly settlements.`) : (zh ? '巴塞罗那当前没有街垒造成的产出减益。' : 'No remaining production penalty from the barricades.')}</p>
    {may.governmentOutcome && <p>{may.governmentOutcome === 'centralized' ? (zh ? '全国政府已改组，CNT 保留人民阵线成员身份并在阁外合作。' : 'The national government was reshuffled; CNT remains in the Popular Front outside the cabinet.') : (zh ? '原有全国权力安排继续有效。' : 'The previous national governing arrangement remains in force.')}</p>}
    {may.poumOutcome ? <p>POUM: {MAY_POUM_NAMES[may.poumOutcome][i]}</p> : may.poumFollowupDueAt !== undefined && <p>{zh ? '次月将根据 POUM 的活动资格处理责任追究争论。' : 'The following month may bring a POUM case, subject to its political eligibility.'}</p>}
    {may.poumUnitsAwaitingIntegration && <p>{zh ? 'POUM 现有部队保持原人数与装备，等待另行协商指挥整编。' : 'Existing POUM units retain their personnel and equipment pending a separate command agreement.'}</p>}
  </section>;
};

export const MayDaysResultDetails = ({ state }: { state: GameState }) => {
  const before = state.mayDays?.before;
  const members = getMayDaysSupport(state);
  const zh = state.language === 'zh';
  const i = zh ? 1 : 0;
  return <div className="space-y-4">
    <MayDaysAftermath state={state} />
    {before && <>
      <p className="font-bold text-sm">{zh ? `联盟凝聚力：${before.cohesion} → ${getMayDaysCohesion(state)}` : `Coalition cohesion: ${before.cohesion} → ${getMayDaysCohesion(state)}`}</p>
      <p className="text-xs">{zh ? `总理：${before.primeMinisterZh} → ${state.government.primeMinisterZh}` : `Prime minister: ${before.primeMinister} → ${state.government.primeMinister}`}</p>
      <table className="w-full text-left text-xs"><thead><tr><th>{zh ? '职务' : 'Office'}</th><th>{zh ? '事件前' : 'Before'}</th><th>{zh ? '现在' : 'Now'}</th></tr></thead><tbody>
        {Object.entries(state.ministers).map(([office, party]) => <tr key={office} className="border-t border-ink/15"><td className="py-1">{OFFICES[office as keyof typeof OFFICES][i]}</td><td>{before.ministers[office as keyof typeof OFFICES] ?? '—'}</td><td>{party}</td></tr>)}
      </tbody></table>
      <details className="text-xs"><summary className="cursor-pointer font-bold">{zh ? '联盟成员与基础合作承诺变化' : 'Coalition membership and base commitment changes'}</summary>
        <table className="w-full text-left mt-2"><thead><tr><th>{zh ? '成员' : 'Member'}</th><th>{zh ? '事件前' : 'Before'}</th><th>{zh ? '现在' : 'Now'}</th></tr></thead><tbody>
          {Object.entries(before.commitments).map(([member, commitment]) => {
            const row = members.find(candidate => candidate.member === member);
            return <tr key={member} className="border-t border-ink/15"><td className="py-1">{getPartyName(state, member as typeof members[number]['member'], zh, true)}</td><td>{commitment}</td><td>{row ? row.baseCommitment : (zh ? '已退出／不参与' : 'Excluded / absent')}</td></tr>;
          })}
        </tbody></table>
      </details>
    </>}
  </div>;
};
