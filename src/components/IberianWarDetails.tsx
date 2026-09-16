import React from 'react';
import type { GameState } from '../game/types';
import { CIVIL_WAR_FACTIONS, getMapFactionName } from '../map/rules/factions';
import { getFactionStrategicValue, IBERIAN_CAPITALS, IBERIAN_SURRENDER_THRESHOLDS } from '../game/rules/iberianDefense';
import { PROVINCE_NAMES_ZH } from '../map/map_constants';

export const IberianWarDetails = ({ state }: { state: Pick<GameState, 'iberianDefense' | 'provinces' | 'armies' | 'mapResources' | 'language'> }) => {
  const war = state.iberianDefense;
  if (!war) return null;
  const zh = state.language === 'zh';
  return <section className="space-y-3 text-sm not-italic" aria-label={zh ? '三方战争状态' : 'Three-sided war status'}>
    <p>{zh ? '委员会成员：CNT' : 'Committee members: CNT'}{war.allies.poum ? ' + POUM' : ''}{war.allies.psoeLeft ? (zh ? ' + PSOE 左翼' : ' + PSOE left') : ''}</p>
    <p>{zh ? '成立时带入兵力' : 'Troops contributed at formation'}：CNT {war.contributions.cnt} · POUM {war.contributions.poum} · {zh ? 'PSOE 左翼' : 'PSOE left'} {war.contributions.psoeLeft}</p>
    <p>{zh ? '每月顺序：委员会 → 马德里政府 → 国民军；各 2 CP，出局方跳过。首都失守且 SV 严格低于阈值才出局。' : 'Monthly order: Committee → Madrid → Nationalists; 2 CP each, eliminated camps skipped. Capitulation requires capital loss AND SV strictly below the threshold.'}</p>
    {war.playerDefeated && !war.winner && <p className="font-bold">{zh ? '委员会已出局。继续推进月份可观察剩余两方争夺最终胜利。' : 'The Committee is eliminated. Advance months to observe the remaining factions fight for final victory.'}</p>}
    <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr>{(zh ? ['阵营', '首都归属', 'SV / 出局线', '省份', '兵力', '状态'] : ['Faction', 'Capital owner', 'SV / limit', 'Provinces', 'Troops', 'Status']).map(label => <th key={label} className="p-1 border-b border-ink/30">{label}</th>)}</tr></thead><tbody>
      {CIVIL_WAR_FACTIONS.map(faction => {
        const capital = IBERIAN_CAPITALS[faction], owner = state.provinces?.[capital]?.owner;
        return <tr key={faction} className="border-b border-ink/15">
          <td className="p-1">{getMapFactionName(faction, zh)}</td>
          <td className="p-1">{zh ? PROVINCE_NAMES_ZH[capital] : capital}: {owner ? getMapFactionName(owner, zh) : '—'}</td>
          <td className="p-1">{getFactionStrategicValue(state, faction)} / &lt;{war.surrenderThresholds[faction] ?? IBERIAN_SURRENDER_THRESHOLDS[faction]}</td>
          <td className="p-1">{Object.values(state.provinces ?? {}).filter(province => province.owner === faction).length}</td>
          <td className="p-1">{(state.armies ?? []).filter(army => army.faction === faction).reduce((sum, army) => sum + army.manpower, 0)}</td>
          <td className="p-1">{war.winner === faction ? (zh ? '胜者' : 'Victor') : war.eliminated.includes(faction) ? (zh ? '出局' : 'Eliminated') : (zh ? '交战' : 'At war')}</td>
        </tr>;
      })}
    </tbody></table></div>
  </section>;
};
