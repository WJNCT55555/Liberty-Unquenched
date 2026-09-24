import React from 'react';
import type { EffectPreviewLine, Faction, GameEvent, GameState, WartimeGovernmentRoute } from '../../types';
import { adjustFactionDissents, formWartimeGovernment, updateCoalitions } from '../../utils';
import { getPartyName } from '../../partyNames';
import {
  canFormDefenceCouncil, createWartimeCoalition, getWartimeCabinet, getWartimeCoalitionPower,
  isWartimeArrangementDue, isWartimeCrisisDue, monthIndex, updateWartimeCoalition,
  WARTIME_COALITION_ID,
} from '../../rules/wartimeCoalition';
import { WartimeCoalitionDetails } from '../../../components/WartimeCoalitionDetails';
import { applyControlInfluence } from '../../rules/controlShares';

const ROUTE_EFFECTS: Record<WartimeGovernmentRoute, {
  stats: Partial<GameState['stats']>;
  /** Ownership influence: the defence-council route hands the unions a share of industry. */
  controlPoints?: number;
  dissent: Partial<Record<Faction, number>>;
}> = {
  cabinet: { stats: { republicanAuthority: 10, bureaucratization: 10, revolutionaryFervor: -5 }, dissent: { Faistas: 8, Puristas: 12 } },
  council: { stats: { republicanAuthority: 6, revolutionaryFervor: 5, bureaucratization: 3 }, controlPoints: 8, dissent: { Faistas: -4, Puristas: 4 } },
  external: { stats: { republicanAuthority: 3, revolutionaryFervor: 3 }, dissent: { Faistas: -5, Puristas: -8 } },
};
const OFFICES: Record<keyof GameState['ministers'], [string, string]> = {
  labor: ['Labour', '劳动'], health: ['Health', '卫生'], justice: ['Justice', '司法'], industry: ['Industry and commerce', '工业与商业'],
  interior: ['Interior', '内政'], war: ['War', '战争'], agriculture: ['Agriculture', '农业'], finance: ['Finance', '财政'], estado: ['Foreign affairs', '外交'],
};
const STAT_LABELS: Partial<Record<keyof GameState['stats'], [string, string]>> = {
  republicanAuthority: ['Republican authority', '共和国权威'], bureaucratization: ['Bureaucratization', '官僚化'],
  revolutionaryFervor: ['Revolutionary fervor', '革命热情'], workerControl: ['Workers’ control', '工人控制'],
};

const previewArrangement = (state: GameState, route: WartimeGovernmentRoute): EffectPreviewLine[] => {
  const coalition = updateWartimeCoalition(state, createWartimeCoalition(state, route));
  const cntWeight = (getWartimeCoalitionPower(state, coalition).find(row => row.member === 'CNT_FAI')?.weight ?? 0) * 100;
  const offices = Object.entries(getWartimeCabinet(state, route)).filter(([, party]) => party === 'CNT').map(([office]) => OFFICES[office as keyof typeof OFFICES]);
  return [
    { text: `Form the Wartime Popular Front; projected cohesion ${coalition.cohesion}/100; CNT weight ${cntWeight.toFixed(1)}%.`, textZh: `成立战时人民阵线；预计凝聚力 ${coalition.cohesion}/100；CNT 权重 ${cntWeight.toFixed(1)}%。` },
    { text: `CNT offices: ${offices.map(office => office[0]).join(', ') || 'none (external support)'}.`, textZh: `CNT 职务：${offices.map(office => office[1]).join('、') || '无（阁外支持）'}。` },
    { text: 'AP/CEDA, RE, CT and FE lose Republican political eligibility; PRR and DLR withdraw. PNV remains; rebel troops retain their strength.', textZh: 'AP/CEDA、RE、CT、FE 退出共和国政治；PRR、DLR 退出活动。保留 PNV，叛军兵力不变。' },
    ...Object.entries(ROUTE_EFFECTS[route].stats).map(([key, delta]) => {
      const stat = key as keyof GameState['stats'];
      return { label: STAT_LABELS[stat]![0], labelZh: STAT_LABELS[stat]![1], value: Math.max(0, Math.min(100, state.stats[stat] + delta)) - state.stats[stat] };
    }),
    ...Object.entries(ROUTE_EFFECTS[route].dissent).map(([faction, delta]) => {
      const before = state.factions[faction as Faction].dissent;
      return { label: `${faction} dissent`, labelZh: `${faction === 'Faistas' ? 'FAI派' : '纯粹派'}异议`, value: Math.max(0, Math.min(100, before + delta)) - before };
    }),
  ];
};

const applyArrangement = (state: GameState, route: WartimeGovernmentRoute): Partial<GameState> => {
  const next = formWartimeGovernment(state, route);
  if (next === state) return {};
  const stats = { ...next.stats };
  for (const [key, delta] of Object.entries(ROUTE_EFFECTS[route].stats)) {
    const stat = key as keyof GameState['stats'];
    stats[stat] = Math.max(0, Math.min(100, stats[stat] + delta));
  }
  const controlPoints = ROUTE_EFFECTS[route].controlPoints;
  return {
    ...next,
    stats,
    ...(controlPoints ? applyControlInfluence(next, controlPoints, { land: 0.25, industry: 0.75 }) : {}),
    factions: adjustFactionDissents(next.factions, ROUTE_EFFECTS[route].dissent),
    currentEvent: wartimePowerArrangementResult,
  };
};

export const wartimePowerArrangement: GameEvent = {
  id: 'wartime_power_arrangement',
  meta: { category: 'politics', flow: 'inline.root', series: ['civil_war', 'wartime_power_arrangement'] },
  condition: isWartimeArrangementDue,
  title: 'Wartime Power Arrangements',
  titleZh: '战时权力安排',
  description: 'The rebellion has divided Spain. The old cabinet’s formal authority must now reckon with the unions, regional governments and militias sustaining the Republic. A common wartime front will replace the old governing pact. Should the CNT take ministries, press for a National Defence Council, or cooperate from outside the cabinet? This decision condenses the political struggles of 1936 into the first month after the civil-war setup.',
  descriptionZh: '叛乱将西班牙撕成两个阵营。旧内阁的名义权威必须面对支撑共和国的工会、地方政府与民兵力量。新的战时人民阵线将取代原有执政协定。CNT 应当接受部长席位、推动全国国防委员会，还是保持阁外合作？本事件将1936年的战时权力争论压缩到内战开局设置完成后的第一个月份。',
  renderContent: state => {
    const isZh = state.language === 'zh';
    const projections = (['cabinet', 'council', 'external'] as const).map(route => updateWartimeCoalition(state, createWartimeCoalition(state, route)).cohesion);
    return <details className="font-typewriter text-sm border border-ink/20 p-3">
      <summary className="cursor-pointer font-bold">{isZh ? `比较职务安排 · 预计凝聚力：联合政府 ${projections[0]} / 国防委员会 ${projections[1]} / 阁外合作 ${projections[2]}` : `Compare cabinets · Projected cohesion: coalition government ${projections[0]} / defence council ${projections[1]} / external support ${projections[2]}`}</summary>
      <div className="grid sm:grid-cols-3 gap-4 mt-3">{(['cabinet', 'council', 'external'] as const).map(route => <section key={route}>
        <h4 className="font-bold border-b border-ink/20 mb-2">{({ cabinet: ['Coalition government', '联合政府'], council: ['Defence council', '国防委员会'], external: ['External support', '阁外合作'] })[route][isZh ? 1 : 0]}</h4>
        <p className="text-xs mb-2">{isZh ? 'CNT 联盟权重' : 'CNT coalition weight'}: {((getWartimeCoalitionPower(state, createWartimeCoalition(state, route)).find(row => row.member === 'CNT_FAI')?.weight ?? 0) * 100).toFixed(1)}%</p>
        {Object.entries(getWartimeCabinet(state, route)).map(([office, party]) => <p key={office} className="text-xs py-1">{OFFICES[office as keyof typeof OFFICES][isZh ? 1 : 0]}：{getPartyName(state, party === 'CNT' ? 'CNT_FAI' : party, isZh, true)}</p>)}
      </section>)}</div>
    </details>;
  },
  options: [
    {
      text: 'Accept ministerial posts and form an anti-fascist government.',
      textZh: '接受部长席位，组成反法西斯联合政府',
      subtitle: 'Enter the cabinet alongside the socialists and republican partners.',
      subtitleZh: '与社会党及共和派共同执政，承担参政带来的内部争议。',
      effectPreview: state => previewArrangement(state, 'cabinet'),
      effect: state => applyArrangement(state, 'cabinet'),
    },
    {
      text: 'Establish a National Defence Council anchored in the unions.',
      textZh: '以工会为支柱，建立全国国防委员会',
      subtitle: 'An alternate outcome inspired by the CNT’s historical proposal.',
      subtitleZh: '以 CNT 历史提案为基础的架空结果，共和派与共产党对此保留疑虑。',
      condition: canFormDefenceCouncil,
      unavailableSubtitle: () => 'CNT and PSOE need at least 55% of coalition power, plus PSOE relations of 60 or an existing Workers’ Alliance.',
      unavailableSubtitleZh: () => '需要 CNT 与 PSOE 合计权重至少55%，且 PSOE 关系至少60，或已有工人联盟。',
      effectPreview: state => previewArrangement(state, 'council'),
      effect: state => applyArrangement(state, 'council'),
    },
    {
      text: 'Sign the wartime pact while remaining outside the cabinet.',
      textZh: '签订抗战协定，保持阁外独立',
      subtitle: 'Retain a voice in the front through our unions and militias, without ministerial powers.',
      subtitleZh: '凭工会与民兵参与联盟协商，保留组织独立，不取得部长权限。',
      effectPreview: state => previewArrangement(state, 'external'),
      effect: state => applyArrangement(state, 'external'),
    },
  ],
};

export const wartimePowerArrangementResult: GameEvent = {
  id: 'wartime_power_arrangement_result',
  meta: { category: 'politics', flow: 'inline.leaf', series: ['civil_war', 'wartime_power_arrangement'] },
  condition: () => false,
  title: 'The Wartime Popular Front',
  titleZh: '战时人民阵线成立',
  description: 'The new pact assigns executive responsibilities and recognizes the influence of unions and deployed forces. AP/CEDA, RE, CT and FE are excluded from Republican political activity; PRR and DLR withdraw. Historical support and rebel forces remain. The current president stays in office.',
  descriptionZh: '新的协定重新分配行政职务，并承认工会与已部署武装的影响力。AP/CEDA、RE、CT、FE 退出共和国政治活动，PRR、DLR 退出活动；历史支持底账与叛军力量保留。现任共和国总统留任。',
  renderContent: state => {
    const isZh = state.language === 'zh';
    const coalition = state.activeCoalitions.find(item => item.activeId === WARTIME_COALITION_ID);
    return <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm font-typewriter">{Object.entries(state.ministers).map(([office, party]) => <div key={office} className="border border-ink/20 p-2">
        <span className="block text-xs opacity-70">{OFFICES[office as keyof typeof OFFICES]?.[isZh ? 1 : 0] || office}</span>
        {getPartyName(state, party === 'CNT' ? 'CNT_FAI' : party, isZh, true)}
      </div>)}</div>
      {coalition && <WartimeCoalitionDetails state={state} coalition={coalition} isZh={isZh} />}
    </div>;
  },
  options: [{
    text: 'Put the agreement into practice.', textZh: '执行共同协定',
    // The root has already applied the complete settlement, including its history guard.
    effect: () => ({ currentEvent: null }),
  }],
};

const resolveCoordination = (state: GameState, funded: boolean): Partial<GameState> => {
  if (!isWartimeCrisisDue(state) || (funded && state.resources < 2)) return {};
  const delta = funded ? 10 : 5;
  const next: GameState = {
    ...state,
    resources: state.resources - (funded ? 2 : 0),
    stats: { ...state.stats, republicanAuthority: Math.max(0, state.stats.republicanAuthority - (funded ? 0 : 5)) },
    activeCoalitions: state.activeCoalitions.map(coalition => coalition.activeId !== WARTIME_COALITION_ID ? coalition : {
      ...coalition,
      memberContributions: Object.fromEntries(Object.entries(coalition.memberContributions).map(([member, value]) => [member, Math.min(100, value + delta)])) as typeof coalition.memberContributions,
    }),
    wartimePowerArrangement: { ...state.wartimePowerArrangement!, lowCohesionMonths: 0, crisisCooldownUntil: monthIndex(state) + 3 },
    currentEvent: null,
  };
  return { ...next, activeCoalitions: updateCoalitions(next) };
};

export const wartimeCabinetCoordination: GameEvent = {
  id: 'wartime_cabinet_coordination',
  meta: { category: 'politics', flow: 'solo', series: ['civil_war', 'wartime_power_arrangement'] },
  condition: isWartimeCrisisDue,
  repeatable: true,
  title: 'Wartime Cabinet Coordination',
  titleZh: '战时内阁协调',
  description: 'Two months of severe disagreement have brought the wartime pact into crisis. The cabinet continues its duties while the partners negotiate renewed commitments.',
  descriptionZh: '连续两个月的严重分歧使战时协定陷入危机。各方开始协商新的合作承诺，现有内阁继续履行职务。',
  options: [
    {
      text: 'Fund the common commitments.', textZh: '落实共同承诺',
      condition: state => state.resources >= 2,
      unavailableSubtitle: () => 'Requires 2 resources.', unavailableSubtitleZh: () => '需要2资源。',
      effectPreview: () => [{ label: 'Resources', labelZh: '资源', value: -2 }, { text: 'All members: base commitment +10. Crisis cooldown: 3 months.', textZh: '全体成员基础合作承诺 +10；危机冷却3个月。' }],
      effect: state => resolveCoordination(state, true),
    },
    {
      text: 'Make political concessions to preserve the pact.', textZh: '以政治让步维持协定',
      effectPreview: () => [{ label: 'Republican authority', labelZh: '共和国权威', value: -5 }, { text: 'All members: base commitment +5. Crisis cooldown: 3 months.', textZh: '全体成员基础合作承诺 +5；危机冷却3个月。' }],
      effect: state => resolveCoordination(state, false),
    },
  ],
};
