import type { Army, ArmyIdentity } from '../../map/types_map';
import { MapFaction } from '../../map/types_map';
import type { CoalitionMember, CoalitionState, GameState, MinisterParty, Party, WartimeGovernmentRoute } from '../types';
import { getPartySupport } from '../parties';
import { getPartyLawSatisfaction } from '../lawStances';
import { isRepublicanPartyPresent } from '../politicalEligibility';
import { getUnionShare, UNION_SHARE_ORGANIZATION } from '../unions';
import { isOrganizationActive } from '../organizations';
import { getMilitarization } from './militarization';

export const WARTIME_COALITION_ID = 'popular_front_wartime' as const;
export const WARTIME_EVENT_ID = 'wartime_power_arrangement';
export const WARTIME_CRISIS_ID = 'wartime_cabinet_coordination';
export const WARTIME_MEMBERS: CoalitionMember[] = ['CNT_FAI', 'PSOE', 'PCE', 'IR', 'UR', 'ERC', 'PNV', 'POUM', 'PS'];
export const monthIndex = (date: { year: number; month: number }) => date.year * 12 + date.month;
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export const isSpanishCivilWarOngoing = (state: GameState) =>
  state.activeWar === 'spanish_civil_war' && state.civilWarStatus === 'ongoing';

export const completeCivilWarSetup = (state: GameState): Partial<GameState> => ({
  activeWar: 'spanish_civil_war',
  civilWarStatus: 'ongoing',
  civilWarSetupCompletedAt: state.civilWarSetupCompletedAt || { year: state.year, month: state.month },
});

export const isWartimeArrangementDue = (state: GameState): boolean => Boolean(
  isSpanishCivilWarOngoing(state)
  && state.civilWarSetupCompletedAt
  && monthIndex(state) > monthIndex(state.civilWarSetupCompletedAt)
  && !state.wartimePowerArrangement
  && !state.eventHistory?.resolved.includes(WARTIME_EVENT_ID),
);

/**
 * 军事化路线抉择「人民军还是武装民兵」：**战时人民阵线成立后的下一个月**弹出，一次性。
 *
 * 三个额外子句的用意：
 * - `rulingCoalition === WARTIME_COALITION_ID`：`wartime_power_arrangement` 只是选项，
 *   若玩家选的那条没组阁成功，就不该问这个问题。
 * - `!state.iberianDefense`：五月危机若已分裂出第三阵营，CNT 已脱离共和国，
 *   再问"要不要组建人民军"是荒谬的。
 * - 幂等守卫：事件一次性。
 */
export const isMilitarizationCrossroadsDue = (state: GameState): boolean => Boolean(
  (state.militarizationPaths?.chosen ?? 'none') === 'none'
  && state.wartimePowerArrangement
  && state.rulingCoalition === WARTIME_COALITION_ID
  && monthIndex(state) > monthIndex(state.wartimePowerArrangement.formedAt)
  && !state.iberianDefense
  && !state.eventHistory?.resolved.includes('militarization_crossroads'),
);

/**
 * 承诺度（`memberContributions`）的唯一写入口。
 *
 * 缺失时以 80 为基准——与 `getWartimeCoalitionPower` 等读取处的 `?? 80` 一致，
 * 否则第一次写入会把默认值凭空变成 0。
 */
export const adjustMemberContribution = (
  state: Pick<GameState, 'activeCoalitions'>,
  member: CoalitionMember,
  delta: number,
): Partial<GameState> => {
  const coalitions = state.activeCoalitions || [];
  const index = coalitions.findIndex(coalition => coalition.activeId === WARTIME_COALITION_ID);
  if (index < 0 || !delta) return {};
  const coalition = coalitions[index];
  const current = clamp(coalition.memberContributions?.[member] ?? 80);
  const next = clamp(current + delta);
  if (next === current) return {};
  const nextCoalitions = [...coalitions];
  nextCoalitions[index] = {
    ...coalition,
    memberContributions: { ...coalition.memberContributions, [member]: next },
  };
  return { activeCoalitions: nextCoalitions };
};

export const getWartimeMembers = (state: GameState): CoalitionMember[] =>
  WARTIME_MEMBERS.filter(member => isRepublicanPartyPresent(state, member));

/**
 * 下调**所有在册联盟**成员的相互承诺度。
 *
 * 与上面的 `adjustMemberContribution` 的区别：那个只动战时人民阵线里的某一个成员，
 * 这个是"这件事让整个阵线离心"的通用写法，用于政府卡（例如司法改革的激进路线）。
 *
 * `delta` 可以是统一数值，也可以是**按党派区分的表**——后者用于"某些党比另一些党
 * 更不可接受这次决定"的场合（例如激进司法改革：社会党只降 2，共和左翼与共和联盟降 6—8）。
 * 不在表里的成员保持不变。
 *
 * **不要直接写 `cohesion`。** `updateCoalitions()` 在每次 reducer 之后都会按
 * `memberContributions` 重算凝聚力（见 `utils/coalition.ts`），直接写 cohesion 会在
 * 下一步被抹掉；承诺度才是唯一真相来源。
 */
export const applyCoalitionCommitmentDelta = (
  state: Pick<GameState, 'activeCoalitions'>,
  delta: number | Partial<Record<CoalitionMember, number>>,
): CoalitionState[] => {
  const coalitions = state.activeCoalitions || [];
  const isUniform = typeof delta === 'number';
  if (isUniform && !delta) return coalitions;
  return coalitions.map(coalition => ({
    ...coalition,
    memberContributions: Object.fromEntries(
      Object.entries(coalition.memberContributions ?? {}).map(([member, value]) => {
        const memberDelta = isUniform ? delta : (delta[member as CoalitionMember] ?? 0);
        return [member, memberDelta ? clamp((value ?? 80) + memberDelta) : value];
      }),
    ) as CoalitionState['memberContributions'],
  }));
};

export const WARTIME_COMMITMENTS: Record<WartimeGovernmentRoute, Partial<Record<CoalitionMember, number>>> = {
  cabinet: { CNT_FAI: 65, PSOE: 85, PCE: 80, IR: 80, UR: 80, ERC: 75, PNV: 70, POUM: 60, PS: 75 },
  council: { CNT_FAI: 85, PSOE: 75, PCE: 50, IR: 55, UR: 55, ERC: 70, PNV: 65, POUM: 85, PS: 80 },
  external: { CNT_FAI: 80, PSOE: 80, PCE: 80, IR: 80, UR: 80, ERC: 75, PNV: 70, POUM: 65, PS: 75 },
};

/**
 * 三条路线的战时内阁表。
 *
 * 战时人民阵线的成立**就是**一次部长重新划分，这张表本身就是那次改组的载体：
 *  - `health` 从劳动部分出。史实上 1936 年 9 月组阁、11 月 4 日改组时才单设
 *    `Sanidad y Asistencia Social`，两件事是同一场谈判的两半；若内战提前爆发，这次
 *    改组同样提前，因此这里不设任何固定日期闸门。在
 *    `events/civil_war/health_ministry.ts` 确认之前 `health` 与 `labor` 同党，
 *    以免内阁面板出现一个尚未成立的部。
 *  - `commerce` 从「工业与商业部」拆出，`industry` 只保留工业；史实上 1936 年 11 月
 *    佩罗掌工业、洛佩斯·桑切斯掌商业。
 *  - `publicWorks` 为公共工程部（1931 年称 Fomento，1933 年 12 月起为 Obras
 *    Públicas），铁路与港口的集体化走这个部。
 */
const CABINETS: Record<WartimeGovernmentRoute, Required<GameState['ministers']>> = {
  cabinet: {
    labor: 'PSOE', health: 'PSOE', justice: 'POUM', industry: 'CNT', commerce: 'CNT',
    interior: 'PSOE', war: 'PSOE', agriculture: 'PCE', education: 'IR', publicWorks: 'UR',
    finance: 'PSOE', estado: 'PSOE',
  },
  council: {
    labor: 'CNT', health: 'CNT', justice: 'POUM', industry: 'CNT', commerce: 'CNT',
    interior: 'PSOE', war: 'PSOE', agriculture: 'CNT', education: 'CNT', publicWorks: 'CNT',
    finance: 'PSOE', estado: 'IR',
  },
  external: {
    labor: 'ERC', health: 'ERC', justice: 'IR', industry: 'PSOE', commerce: 'PSOE',
    interior: 'PSOE', war: 'PSOE', agriculture: 'PCE', education: 'ERC', publicWorks: 'IR',
    finance: 'PSOE', estado: 'PSOE',
  },
};

export const getWartimeCabinet = (state: GameState, route: WartimeGovernmentRoute): GameState['ministers'] => {
  const members = getWartimeMembers(state);
  const eligible = (party: MinisterParty) => members.includes(party === 'CNT' ? 'CNT_FAI' : party)
    && !(route === 'external' && party === 'CNT');
  const fallbacks: MinisterParty[] = ['PSOE', 'IR', 'UR', 'ERC', 'PCE', 'PNV', 'PS', 'POUM', 'CNT'];
  const cabinet = Object.fromEntries(Object.entries(CABINETS[route]).map(([office, party]) => [
    office, eligible(party) ? party : party === 'POUM' && eligible('UR') ? 'UR' : fallbacks.find(eligible) || 'Other',
  ])) as unknown as GameState['ministers'];
  // 卫生职能在单设该部之前仍属劳动部：两者必须同党，否则内阁面板会显示一个尚未
  // 成立的部，并且比劳动部更早被 CNT 掌管。
  return state.wartimeSanidadMinistry ? cabinet : { ...cabinet, health: cabinet.labor };
};

export const createWartimeCoalition = (state: GameState, route: WartimeGovernmentRoute): CoalitionState => {
  const members = getWartimeMembers(state);
  const ministers = Object.values(getWartimeCabinet(state, route));
  return {
    activeId: WARTIME_COALITION_ID,
    members,
    memberContributions: Object.fromEntries(members.map(member => [member, WARTIME_COMMITMENTS[route][member] ?? 70])) as CoalitionState['memberContributions'],
    participation: Object.fromEntries(members.map(member => [member, member !== 'PRRevS' && ministers.includes(member === 'CNT_FAI' ? 'CNT' : member) ? 'government' : 'external'])),
    cohesion: 0,
    cntAttitude: 0,
    formedAt: { year: state.year, month: state.month },
  };
};

/** Source ownership is political command, not the party membership of every soldier. */
export const getArmyPoliticalMember = (army: Army): CoalitionMember | null => {
  if (army.sourceEntityId) {
    const owners: Partial<Record<NonNullable<Army['sourceEntityId']>, CoalitionMember>> = {
      cnt_defense_committees: 'CNT_FAI', ugt_socialist_militias: 'PSOE', maoc: 'PCE', fifth_regiment: 'PCE',
      poum_militias: 'POUM', euzko_gudarostea: 'PNV', international_brigades: 'PCE',
    };
    return owners[army.sourceEntityId] ?? null;
  }
  // Legacy regional units cannot safely be attributed from their current province.
  const owners: Partial<Record<NonNullable<Army['identity']>, CoalitionMember>> = {
    cnt: 'CNT_FAI', ugt: 'PSOE', pce: 'PCE', poum: 'POUM', intl: 'PCE',
  };
  return owners[army.identity ?? 'gov'] ?? null;
};

export const getArmyEffectiveManpower = (
  state: { militarization?: Record<ArmyIdentity, number> },
  army: Army,
): number => {
  const rate = getMilitarization(state, army.identity ?? 'gov');
  return Math.max(0, Number.isFinite(army.manpower) ? army.manpower : 0)
    * (0.5 + (clamp(army.morale) + clamp(rate)) / 400);
};

export interface CoalitionPowerRow {
  member: CoalitionMember;
  support: number;
  unionShare: number;
  unionBonus: number;
  effectiveManpower: number;
  militaryIndex: number;
  militaryBonus: number;
  power: number;
  weight: number;
  baseCommitment: number;
  lawModifier: number;
  commitment: number;
  contribution: number;
}

export const getWartimeCoalitionPower = (state: GameState, coalition: CoalitionState): CoalitionPowerRow[] => {
  const members = (coalition.members ?? getWartimeMembers(state)).filter(member => WARTIME_MEMBERS.includes(member) && isRepublicanPartyPresent(state, member));
  const armies = (state.armies || []).filter(army => army.faction === MapFaction.REPUBLICAN);
  const totalMilitary = Math.max(50_000, armies.reduce((sum, army) => sum + getArmyEffectiveManpower(state, army), 0));
  const unionShare = getUnionShare(state);
  const unionKeys = { CNT_FAI: 'CNT', PSOE: 'UGT', ERC: 'UR', PNV: 'ELA' } as const;
  const rows = [...new Set(members)].map(member => {
    const key = unionKeys[member as keyof typeof unionKeys];
    const organization = key ? UNION_SHARE_ORGANIZATION[key] : undefined;
    const share = key && organization && isOrganizationActive(state, organization) ? clamp(unionShare[key]) : 0;
    const effectiveManpower = armies.filter(army => getArmyPoliticalMember(army) === member)
      .reduce((sum, army) => sum + getArmyEffectiveManpower(state, army), 0);
    const militaryIndex = 100 * effectiveManpower / totalMilitary;
    const support = clamp(getPartySupport(state, member));
    const baseCommitment = clamp(coalition.memberContributions[member] ?? 80);
    const lawModifier = member === 'Other' || member === 'PRRevS' ? 0 : getPartyLawSatisfaction(state, member).overall * 0.1;
    return {
      member, support, unionShare: share, unionBonus: share * 0.5, effectiveManpower,
      militaryIndex, militaryBonus: militaryIndex * 0.3,
      power: support + share * 0.5 + militaryIndex * 0.3,
      baseCommitment, lawModifier, commitment: clamp(baseCommitment + lawModifier), weight: 0, contribution: 0,
    };
  });
  const total = rows.reduce((sum, row) => sum + row.power, 0);
  return rows.map(row => {
    const weight = total > 0 ? row.power / total : 1 / (rows.length || 1);
    return { ...row, weight, contribution: weight * row.commitment };
  });
};

export const updateWartimeCoalition = (state: GameState, coalition: CoalitionState): CoalitionState => {
  const rows = getWartimeCoalitionPower(state, coalition);
  const otherMembers = rows.filter(row => row.member !== 'CNT_FAI');
  const otherWeight = otherMembers.reduce((sum, row) => sum + row.weight, 0);
  return {
    ...coalition,
    cohesion: clamp(Math.round(rows.reduce((sum, row) => sum + row.contribution, 0))),
    cntAttitude: otherWeight > 0 ? clamp(Math.round(otherMembers.reduce((sum, row) =>
      sum + row.weight * (state.partyRelations[row.member as Exclude<Party, 'PRRevS'>] ?? 0), 0) / otherWeight), -100, 100) : 0,
  };
};

export const canFormDefenceCouncil = (state: GameState): boolean => {
  const rows = getWartimeCoalitionPower(state, createWartimeCoalition(state, 'council'));
  const workerWeight = rows.filter(row => row.member === 'CNT_FAI' || row.member === 'PSOE')
    .reduce((sum, row) => sum + row.weight, 0);
  return rows.some(row => row.member === 'PSOE') && workerWeight >= 0.55
    && (state.partyRelations.PSOE >= 60 || state.activeCoalitions.some(coalition => coalition.activeId === 'workers_alliance'));
};

export const getWartimeAuthorityDelta = (cohesion: number): number =>
  cohesion >= 80 ? 1 : cohesion >= 60 ? 0 : cohesion >= 40 ? -1 : cohesion >= 25 ? -2 : -3;

export const settleWartimeCoalition = (state: GameState): GameState => {
  const arrangement = state.wartimePowerArrangement;
  const coalition = state.activeCoalitions.find(item => item.activeId === WARTIME_COALITION_ID);
  const now = monthIndex(state);
  if (!arrangement || !coalition || !isSpanishCivilWarOngoing(state) || now <= arrangement.lastSettlementMonth) return state;
  return {
    ...state,
    stats: { ...state.stats, republicanAuthority: clamp(state.stats.republicanAuthority + getWartimeAuthorityDelta(coalition.cohesion)) },
    wartimePowerArrangement: {
      ...arrangement,
      lastSettlementMonth: now,
      lowCohesionMonths: coalition.cohesion < 25 ? arrangement.lowCohesionMonths + 1 : 0,
    },
  };
};

export const isWartimeCrisisDue = (state: GameState): boolean => Boolean(
  isSpanishCivilWarOngoing(state) && state.rulingCoalition === WARTIME_COALITION_ID
  && !state.currentEvent?.id.startsWith('may_days') && !state.pendingEvents.some(event => event.id.startsWith('may_days'))
  && state.wartimePowerArrangement && state.wartimePowerArrangement.lowCohesionMonths >= 2
  && monthIndex(state) >= state.wartimePowerArrangement.crisisCooldownUntil,
) && state.activeCoalitions.some(coalition => coalition.activeId === WARTIME_COALITION_ID && updateWartimeCoalition(state, coalition).cohesion < 25);
