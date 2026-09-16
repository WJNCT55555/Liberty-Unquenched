import React from 'react';
import type { CoalitionState, GameState } from '../game/types';
import { getPartyName } from '../game/partyNames';
import { getArmyEffectiveManpower, getArmyPoliticalMember, getWartimeAuthorityDelta, getWartimeCoalitionPower, updateWartimeCoalition } from '../game/rules/wartimeCoalition';
import { MapFaction } from '../map/types_map';
import { MayDaysAftermath } from './MayDaysDetails';

/** The event, sidebar and politics sheet all display the same runtime calculation. */
export const WartimeCoalitionDetails = ({ state, coalition, isZh }: {
  state: GameState; coalition: CoalitionState; isZh: boolean;
}) => {
  const rows = getWartimeCoalitionPower(state, coalition);
  const current = updateWartimeCoalition(state, coalition);
  const authority = getWartimeAuthorityDelta(current.cohesion);
  return <section className="space-y-3 text-xs font-typewriter" aria-label={isZh ? '战时人民阵线权力明细' : 'Wartime coalition power breakdown'}>
    <MayDaysAftermath state={state} />
    <p className="font-bold">
      {isZh ? `凝聚力 ${current.cohesion}/100 · 每月共和国权威 ${authority > 0 ? '+' : ''}${authority}` : `Cohesion ${current.cohesion}/100 · Monthly authority ${authority > 0 ? '+' : ''}${authority}`}
    </p>
    <p>{isZh ? '影响力 = 政治支持 + 工会份额 × 0.5 + 军事指数 × 0.3；凝聚力按成员影响力加权。' : 'Power = political support + union share × 0.5 + military index × 0.3. Cohesion weights each member by this power.'}</p>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
        <thead><tr className="border-b border-ink/30">
          {(isZh ? ['成员', '政治', '工会加成', '军事修正', '权重', '合作意愿', '凝聚贡献'] : ['Member', 'Political', 'Union', 'Military', 'Weight', 'Commitment', 'Contribution']).map(label => <th key={label} className="p-1.5">{label}</th>)}
        </tr></thead>
        <tbody>{rows.map(row => <tr key={row.member} className="border-b border-ink/10">
          <td className="p-1.5 font-bold">{getPartyName(state, row.member, isZh, true)}<span className="block font-normal text-[10px] opacity-70">
            {coalition.participation?.[row.member] === 'government' ? (isZh ? '参阁' : 'In government') : (isZh ? '阁外支持' : 'External support')}
          </span></td>
          <td className="p-1.5">{row.support.toFixed(1)}</td>
          <td className="p-1.5">+{row.unionBonus.toFixed(1)}</td>
          <td className="p-1.5">+{row.militaryBonus.toFixed(1)}</td>
          <td className="p-1.5">{(row.weight * 100).toFixed(1)}%</td>
          <td className="p-1.5" title={isZh ? `基础承诺 ${row.baseCommitment}，法律修正 ${row.lawModifier.toFixed(1)}` : `Base commitment ${row.baseCommitment}; law modifier ${row.lawModifier.toFixed(1)}`}>
            {row.commitment.toFixed(1)}<span className="block text-[9px] opacity-70">{row.baseCommitment} {row.lawModifier >= 0 ? '+' : '−'} {Math.abs(row.lawModifier).toFixed(1)}</span>
          </td>
          <td className="p-1.5">{row.contribution.toFixed(1)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p>{isZh ? `连续低凝聚力：${state.wartimePowerArrangement?.lowCohesionMonths ?? 0}/2 月；低于 25 时进入危机计时。` : `Consecutive low cohesion: ${state.wartimePowerArrangement?.lowCohesionMonths ?? 0}/2 months; crisis threshold: below 25.`}</p>
    <details>
      <summary className="cursor-pointer">{isZh ? '军事来源与统计口径' : 'Military sources and calculation'}</summary>
      <p className="my-2 opacity-75">{isZh ? '只计算已部署有效兵力；国家部队计入总量，预备兵员不重复计入。国际纵队按组织协调归 PCE。' : 'Only deployed effective manpower counts. State troops enter the total; reserves are excluded. International Brigades count toward PCE organizational coordination.'}</p>
      <p className="my-2 opacity-75">{isZh ? '有效兵力 = 当前兵力 × [0.5 +（士气 + 军事化）÷ 400]；军事指数 = 100 × 成员有效兵力 ÷ max（共和国总有效兵力，50,000）。' : 'Effective manpower = manpower × [0.5 + (morale + militarization) / 400]. Military index = 100 × member effective manpower / max(Republican effective manpower, 50,000).'}</p>
      <ul className="space-y-1">{(state.armies || []).filter(army => army.faction === MapFaction.REPUBLICAN).map(army => {
        const member = getArmyPoliticalMember(army);
        return <li key={army.id}>{isZh ? army.nameZh || army.name || army.id : army.name || army.id}: {Math.round(getArmyEffectiveManpower(army)).toLocaleString()} · {member ? getPartyName(state, member, isZh, true) : (isZh ? '国家／未归属' : 'State / unassigned')}</li>;
      })}</ul>
    </details>
  </section>;
};
