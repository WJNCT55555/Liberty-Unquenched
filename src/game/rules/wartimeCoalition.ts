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

export const WARTIME_COMMITMENTS: Record<WartimeGovernmentRoute, Partial<Record<CoalitionMember, number>>> = {
  cabinet: { CNT_FAI: 65, PSOE: 85, PCE: 80, IR: 80, UR: 80, ERC: 75, PNV: 70, POUM: 60, PS: 75 },
  council: { CNT_FAI: 85, PSOE: 75, PCE: 50, IR: 55, UR: 55, ERC: 70, PNV: 65, POUM: 85, PS: 80 },
  external: { CNT_FAI: 80, PSOE: 80, PCE: 80, IR: 80, UR: 80, ERC: 75, PNV: 70, POUM: 65, PS: 75 },
};

const CABINETS: Record<WartimeGovernmentRoute, Required<GameState['ministers']>> = {
  cabinet: { labor: 'PSOE', health: 'CNT', justice: 'CNT', industry: 'CNT', interior: 'PSOE', war: 'PSOE', agriculture: 'PCE', finance: 'PSOE', estado: 'PSOE' },
  council: { labor: 'CNT', health: 'CNT', justice: 'POUM', industry: 'CNT', interior: 'PSOE', war: 'PSOE', agriculture: 'CNT', finance: 'PSOE', estado: 'IR' },
  external: { labor: 'ERC', health: 'ERC', justice: 'IR', industry: 'PSOE', interior: 'PSOE', war: 'PSOE', agriculture: 'PCE', finance: 'PSOE', estado: 'PSOE' },
};

export const getWartimeCabinet = (state: GameState, route: WartimeGovernmentRoute): GameState['ministers'] => {
  const members = getWartimeMembers(state);
  const eligible = (party: MinisterParty) => members.includes(party === 'CNT' ? 'CNT_FAI' : party)
    && !(route === 'external' && party === 'CNT');
  const fallbacks: MinisterParty[] = ['PSOE', 'IR', 'UR', 'ERC', 'PCE', 'PNV', 'PS', 'POUM', 'CNT'];
  return Object.fromEntries(Object.entries(CABINETS[route]).map(([office, party]) => [
    office, eligible(party) ? party : party === 'POUM' && eligible('UR') ? 'UR' : fallbacks.find(eligible) || 'Other',
  ])) as GameState['ministers'];
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
