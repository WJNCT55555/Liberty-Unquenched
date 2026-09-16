import type { CoalitionMember, Faction, GameState, MayDaysPOUMOutcome, MayDaysSettlement, MayDaysState, MinisterParty } from '../types';
import { MapFaction } from '../../map/types_map';
import { isOrganizationActive, setOrganizationStatus } from '../organizations';
import { isRepublicanPartyPresent } from '../politicalEligibility';
import { adjustClassSupport, adjustFactionDissents, reshapeWartimeCabinet, updateCoalitions } from '../utils';
import { getWartimeCoalitionPower, isSpanishCivilWarOngoing, monthIndex, WARTIME_COALITION_ID, WARTIME_CRISIS_ID } from './wartimeCoalition';

export const MAY_DAYS_ID = 'may_days';
export const MAY_DAYS_POUM_ID = 'may_days_poum_case';
export const MAY_DAYS_EVENT_IDS = ['may_days', 'may_days_ceasefire', 'may_days_government_crisis', 'may_days_result', 'may_days_poum_case', 'may_days_poum_result', 'may_days_split_alignment', 'may_days_split_result'] as const;
export const isMayDaysEvent = (id?: string | null) => MAY_DAYS_EVENT_IDS.some(value => value === id);
export const hasMandatoryMayDaysEvent = (state: GameState) => isMayDaysEvent(state.currentEvent?.id)
  || state.pendingEvents.some(event => isMayDaysEvent(event.id));
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const date = (state: GameState) => ({ year: state.year, month: state.month });
export const getMayDaysState = (state: GameState): MayDaysState => state.mayDays ?? {
  stage: 'idle', pressureMonths: 0, lastPressureMonth: -1, escalation: 0, productionFactor: 1, productionThroughMonth: -1,
};
export const getMayDaysCoalition = (state: GameState) => state.activeCoalitions.find(coalition => coalition.activeId === WARTIME_COALITION_ID);
export const getMayDaysPower = (state: GameState) => {
  const coalition = getMayDaysCoalition(state);
  return coalition ? getWartimeCoalitionPower(state, coalition) : [];
};
export const getMayDaysCohesion = (state: GameState) => Math.round(getMayDaysPower(state).reduce((sum, row) => sum + row.contribution, 0));
const hasWartimePact = (state: GameState) => !state.iberianDefense && isSpanishCivilWarOngoing(state)
  && Boolean(state.wartimePowerArrangement) && state.rulingCoalition === WARTIME_COALITION_ID && Boolean(getMayDaysCoalition(state));
const hasLocalDualPower = (state: GameState) => hasWartimePact(state)
  && state.provinces?.barcelona?.owner === MapFaction.REPUBLICAN
  && state.regionalStatuses?.catalonia !== 'independent'
  && isOrganizationActive(state, 'CNT')
  && (state.cataloniaControl === 'cnt_fai' || state.cataloniaControl === 'committee');
export const hasMayDaysPressure = (state: GameState) => getMayDaysCohesion(state) < 55
  || (['PCE', 'ERC'] as const).some(party => isRepublicanPartyPresent(state, party) && state.partyRelations[party] < 25);

/** Count completed monthly political settlements, never UI refreshes or repeated saves. */
export const settleMayDaysPressure = (state: GameState): GameState => {
  if (!state.wartimePowerArrangement || state.difficulty === 'historical') return state;
  const may = getMayDaysState(state);
  const now = monthIndex(state);
  if (may.startedAt || now <= may.lastPressureMonth || now <= monthIndex(state.wartimePowerArrangement.formedAt)) return state;
  const pressure = hasLocalDualPower(state) && hasMayDaysPressure(state);
  return { ...state, mayDays: {
    ...may, lastPressureMonth: now,
    pressureMonths: pressure ? (may.lastPressureMonth === now - 1 ? may.pressureMonths + 1 : 1) : 0,
  } };
};

export const isMayDaysDue = (state: GameState): boolean => {
  if (!hasLocalDualPower(state) || state.mayDays?.startedAt || state.eventHistory?.resolved.includes(MAY_DAYS_ID)) return false;
  const elapsed = monthIndex(state) - monthIndex(state.wartimePowerArrangement!.formedAt);
  if (elapsed < 1) return false;
  return state.difficulty === 'historical'
    ? state.year === 1937 && state.month === 5
    : elapsed >= 6 && getMayDaysState(state).pressureMonths >= 2
      && getMayDaysState(state).lastPressureMonth === monthIndex(state) && hasMayDaysPressure(state);
};

export const ministerToMember = (party?: MinisterParty): CoalitionMember | undefined => party === 'CNT' ? 'CNT_FAI' : party;
export const getMayDaysSupport = (state: GameState, judicial = false) => getMayDaysPower(state).map(row => {
  const relation = row.member === 'CNT_FAI' ? 100 : state.partyRelations[row.member] ?? 0;
  const threshold = row.member === 'POUM' ? 30 : row.member === 'PSOE' ? 50 : row.member === 'ERC' ? 35 : judicial && row.member === 'PCE' ? 60 : 40;
  const supports = row.member === 'CNT_FAI' || (relation >= threshold && (row.member === 'POUM' || row.commitment >= (judicial && row.member === 'PCE' ? 60 : 50)));
  return { ...row, supports };
});
export const getMayDaysSupportWeight = (state: GameState, judicial = false) => getMayDaysSupport(state, judicial)
  .reduce((sum, row) => sum + (row.supports ? row.weight : 0), 0);
export const getMayDaysRequiredPartner = (state: GameState) => state.cataloniaControl === 'committee' && isRepublicanPartyPresent(state, 'ERC')
  ? 'ERC' : ministerToMember(state.ministers.interior);
export const canAgreeMayDays = (state: GameState) => getMayDaysSupportWeight(state) + 1e-9 >= 0.6
  && getMayDaysSupport(state).some(row => row.member === getMayDaysRequiredPartner(state) && row.supports);
const workerWeight = (state: GameState, partner: CoalitionMember) => getMayDaysPower(state)
  .filter(row => row.member === 'CNT_FAI' || row.member === partner).reduce((sum, row) => sum + row.weight, 0);
export const canBackMayDaysCommittees = (state: GameState) => (state.cataloniaControl === 'cnt_fai' || state.stats.workerControl >= 60)
  && workerWeight(state, 'POUM') + 1e-9 >= 0.4;
export const canWinMayDaysCommitteeAgreement = (state: GameState) => canAgreeMayDays(state) && workerWeight(state, 'POUM') + 1e-9 >= 0.45;
export const canPreserveMayDaysGovernment = (state: GameState) => state.mayDays?.settlement === 'joint' || state.mayDays?.settlement === 'committee'
  || (workerWeight(state, 'PSOE') + 1e-9 >= 0.55 && state.partyRelations.PSOE >= 55
    && getMayDaysPower(state).some(row => row.member === 'PSOE' && row.commitment >= 60));

interface PoliticalEffect {
  resources?: number;
  stats: Partial<GameState['stats']>;
  dissent: Partial<Record<Faction, number>>;
  commitments: Partial<Record<CoalitionMember, number>>;
}
export const MAY_DAYS_SETTLEMENT_EFFECTS: Record<MayDaysSettlement, PoliticalEffect> = {
  withdrawal: { stats: { republicanAuthority: 6, workerControl: -8, revolutionaryFervor: -5 }, dissent: { Faistas: 6, Puristas: 10 }, commitments: { CNT_FAI: -10, POUM: -10, PCE: 8, PSOE: 5, ERC: 3 } },
  joint: { resources: -2, stats: { republicanAuthority: 3, bureaucratization: 2 }, dissent: { Faistas: 2, Puristas: 4 }, commitments: { CNT_FAI: 5, PSOE: 5, ERC: 5, POUM: 3, PCE: -5 } },
  committee: { resources: -3, stats: { workerControl: 5, revolutionaryFervor: 5 }, dissent: { Faistas: -4, Treintistas: 6 }, commitments: { CNT_FAI: 8, POUM: 8, PCE: -15, IR: -8, UR: -8, PSOE: -5 } },
  defeat: { stats: { republicanAuthority: 3, workerControl: -12, revolutionaryFervor: -8 }, dissent: { Faistas: 10, Puristas: 15 }, commitments: { CNT_FAI: -18, POUM: -15, PCE: 5, PSOE: -5, ERC: -5 } },
};
const applyPolitics = (state: GameState, effect: PoliticalEffect): GameState => {
  const stats = { ...state.stats };
  for (const [key, delta] of Object.entries(effect.stats)) {
    const stat = key as keyof GameState['stats'];
    stats[stat] = clamp(stats[stat] + delta);
  }
  const members = getMayDaysPower(state).map(row => row.member);
  const next = {
    ...state, stats, resources: state.resources + (effect.resources ?? 0), factions: adjustFactionDissents(state.factions, effect.dissent),
    activeCoalitions: state.activeCoalitions.map(coalition => coalition.activeId !== WARTIME_COALITION_ID ? coalition : {
      ...coalition, memberContributions: {
        ...coalition.memberContributions,
        ...Object.fromEntries(members.map(member => [member, clamp((coalition.memberContributions[member] ?? 80) + (effect.commitments[member] ?? 0))])),
      },
    }),
  };
  return { ...next, activeCoalitions: updateCoalitions(next) };
};

export const beginMayDays = (state: GameState, intention: NonNullable<MayDaysState['intention']>): GameState => {
  if (!isMayDaysDue(state) || (intention === 'committee' && !canBackMayDaysCommittees(state))) return state;
  const coalition = getMayDaysCoalition(state)!;
  const escalation = intention === 'committee' ? 3 : hasMayDaysPressure(state) ? (intention === 'negotiate' ? 2 : 1) : 0;
  return {
    ...state, pendingEvents: state.pendingEvents.filter(event => event.id !== WARTIME_CRISIS_ID),
    mayDays: {
      ...getMayDaysState(state), stage: 'negotiations', startedAt: date(state), intention, escalation,
      before: { ministers: { ...state.ministers }, primeMinister: state.government.primeMinister, primeMinisterZh: state.government.primeMinisterZh, cohesion: getMayDaysCohesion(state), commitments: { ...coalition.memberContributions } },
    },
  };
};

const finishMayDays = (state: GameState): GameState => {
  const may = state.mayDays!;
  const needsPOUMCase = isRepublicanPartyPresent(state, 'POUM') && (may.escalation >= 2 || may.governmentOutcome === 'centralized'
    || getMayDaysPower(state).some(row => row.member === 'PCE' && row.commitment < 45));
  return {
    ...state,
    mayDays: { ...may, stage: 'result', resolvedAt: date(state), poumFollowupDueAt: needsPOUMCase ? monthIndex(state) + 1 : undefined },
    wartimePowerArrangement: { ...state.wartimePowerArrangement!, lowCohesionMonths: 0, crisisCooldownUntil: monthIndex(state) + 3 },
    pendingEvents: state.pendingEvents.filter(event => event.id !== WARTIME_CRISIS_ID),
  };
};

export const settleMayDaysCeasefire = (state: GameState, settlement: MayDaysSettlement): GameState => {
  if (!hasWartimePact(state) || state.mayDays?.stage !== 'negotiations' || state.mayDays.settlement) return state;
  if (settlement === 'joint' && (!canAgreeMayDays(state) || state.resources < 2)) return state;
  if (settlement === 'committee' && (state.mayDays.intention !== 'committee' || !canWinMayDaysCommitteeAgreement(state) || state.resources < 3)) return state;
  if (settlement === 'defeat' && state.mayDays.escalation < 2) return state;
  const next = applyPolitics(state, MAY_DAYS_SETTLEMENT_EFFECTS[settlement]);
  const central = settlement === 'withdrawal' || settlement === 'defeat';
  const control = central ? 'central' : settlement === 'committee' ? 'committee' : 'joint';
  const escalation = state.mayDays.escalation;
  next.mayDays = {
    ...state.mayDays, settlement, leadershipAttitude: settlement === 'joint' ? 'guarantees' : settlement === 'committee' ? 'committees' : 'unity', communicationsControl: control, publicOrderControl: control, defenceControl: control,
    productionFactor: escalation >= 2 ? 0.75 : escalation === 1 ? 0.9 : 1,
    productionThroughMonth: monthIndex(state) + (escalation === 3 ? 2 : escalation > 0 ? 1 : 0),
    stage: 'government',
  };
  return central || escalation >= 2 ? next : finishMayDays({ ...next, mayDays: { ...next.mayDays, governmentOutcome: 'preserved' } });
};

export const resolveMayDaysGovernment = (state: GameState, preserve: boolean): GameState => {
  if (!hasWartimePact(state) || state.mayDays?.stage !== 'government' || state.mayDays.governmentOutcome) return state;
  if (preserve && !canPreserveMayDaysGovernment(state)) return state;
  const next = preserve ? state : applyPolitics(reshapeWartimeCabinet(state, 'centralize'), {
    stats: { republicanAuthority: 4, bureaucratization: 6 }, dissent: {}, commitments: { CNT_FAI: -8, PCE: 5, IR: 3, UR: 3 },
  });
  return finishMayDays({ ...next, mayDays: {
    ...next.mayDays!, governmentOutcome: preserve ? 'preserved' : 'centralized',
    ...(preserve ? {} : { defenceControl: 'central', publicOrderControl: 'central' }),
  } });
};

/** Upcoming output, not permanent province industry or existing national stockpiles. */
export const getMayDaysProductionFactor = (state: GameState, provinceId: string, targetMonth = monthIndex(state) + 1): number =>
  isSpanishCivilWarOngoing(state) && provinceId === 'barcelona' && state.provinces?.barcelona?.owner === MapFaction.REPUBLICAN
  && state.mayDays?.resolvedAt && targetMonth > monthIndex(state.mayDays.resolvedAt) && targetMonth <= state.mayDays.productionThroughMonth
    ? state.mayDays.productionFactor : 1;

export const isMayDaysPOUMDue = (state: GameState): boolean => hasWartimePact(state) && state.mayDays?.stage === 'settled'
  && state.mayDays.poumFollowupDueAt !== undefined && monthIndex(state) >= state.mayDays.poumFollowupDueAt
  && !state.mayDays.poumOutcome && isRepublicanPartyPresent(state, 'POUM')
  && !state.eventHistory?.resolved.includes(MAY_DAYS_POUM_ID);
export const canGuaranteePOUM = (state: GameState) => getMayDaysSupportWeight(state, true) + 1e-9 >= 0.6 && state.resources >= 2;
export const canProtectPOUMByInquiry = (state: GameState) => getMayDaysSupportWeight(state, true) + 1e-9 >= 0.6
  || getMayDaysSupport(state, true).some(row => row.member === ministerToMember(state.ministers.justice) && row.supports);

export const resolveMayDaysPOUM = (state: GameState, choice: 'guarantee' | 'inquiry' | 'ban'): GameState => {
  if (!isMayDaysPOUMDue(state) || (choice === 'guarantee' && !canGuaranteePOUM(state))) return state;
  const outcome: MayDaysPOUMOutcome = choice === 'guarantee' ? 'guaranteed' : choice === 'inquiry' ? (canProtectPOUMByInquiry(state) ? 'inquiry' : 'protested_ban') : 'banned';
  const banned = outcome === 'banned' || outcome === 'protested_ban';
  let next = applyPolitics(state, banned ? {
    stats: {}, dissent: { Faistas: outcome === 'banned' ? 8 : 4, Puristas: outcome === 'banned' ? 12 : 6 },
    commitments: { CNT_FAI: outcome === 'banned' ? -12 : -6, PCE: 10, PNV: -5 },
  } : {
    resources: outcome === 'guaranteed' ? -2 : 0, stats: {},
    dissent: outcome === 'guaranteed' ? { Faistas: -3, Puristas: -3 } : {},
    commitments: { CNT_FAI: outcome === 'guaranteed' ? 8 : 3, POUM: outcome === 'guaranteed' ? 8 : 3, PCE: outcome === 'guaranteed' ? -10 : -5 },
  });
  if (banned) {
    next = reshapeWartimeCabinet(next, 'exclude_poum');
    for (const organization of ['POUM', 'POUM_MILITIA', 'JCI'] as const) {
      if (next.organizations[organization]?.established) next = { ...next, ...setOrganizationStatus(next, organization, 'dissolved') };
    }
    next = { ...next, classes: adjustClassSupport(next.classes, 'Obreros', 'CNT_FAI', -3) };
  }
  return {
    ...next, activeCoalitions: updateCoalitions(next),
    mayDays: { ...next.mayDays!, stage: 'poum_result', poumOutcome: outcome, poumUnitsAwaitingIntegration: banned && Boolean(next.armies?.some(army => army.faction === MapFaction.REPUBLICAN && (army.sourceEntityId === 'poum_militias' || (!army.sourceEntityId && army.identity === 'poum')))) },
    wartimePowerArrangement: { ...next.wartimePowerArrangement!, lowCohesionMonths: 0, crisisCooldownUntil: monthIndex(state) + 3 },
    pendingEvents: next.pendingEvents.filter(event => event.id !== WARTIME_CRISIS_ID),
  };
};
