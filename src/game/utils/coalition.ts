import type { GameState, CoalitionState, CoalitionId, CoalitionMember, GovernmentCrisisCause, Party, WartimeGovernmentRoute } from '../types';
import { COALITION_DEFS } from '../coalitions';
import { getPartySupport, updatePartySupport } from '../parties';
import { isRepublicanPartyEligible, isRepublicanPartyPresent, WARTIME_PARTY_STATUS } from '../politicalEligibility';
import { canFormDefenceCouncil, createWartimeCoalition, getWartimeCabinet, isSpanishCivilWarOngoing, isWartimeArrangementDue, monthIndex, updateWartimeCoalition, WARTIME_COALITION_ID, WARTIME_EVENT_ID } from '../rules/wartimeCoalition';

export { getPartySupport, updatePartySupport };

export const getCoalitionMembers = (state: GameState, coalition: CoalitionState): CoalitionMember[] =>
  (coalition.members ?? COALITION_DEFS.find(def => def.id === coalition.activeId)?.members ?? [])
    .filter(member => isRepublicanPartyEligible(state, member));

export function updateCoalitions(state: GameState): CoalitionState[] {
  const support = state.partySupport && Object.keys(state.partySupport).length > 0 
    ? state.partySupport 
    : updatePartySupport(state);

  return state.activeCoalitions.map(coalition => {
    if (coalition.activeId === WARTIME_COALITION_ID) return updateWartimeCoalition(state, coalition);
    const c = { ...coalition };
    const def = COALITION_DEFS.find(d => d.id === c.activeId);
    if (!def) return c;
    const members = getCoalitionMembers(state, coalition);

    let totalAllianceSupport = 0;
    members.forEach(member => {
      const pSupport = member === 'CNT_FAI' ? getPartySupport(state, 'CNT_FAI') : (support[member as Party] ?? 0);
      totalAllianceSupport += pSupport;
    });

    let cohesion = 0;
    if (totalAllianceSupport > 0) {
      members.forEach(member => {
        const contribution = c.memberContributions[member as Party] ?? 80;
        const pSupport = member === 'CNT_FAI' ? getPartySupport(state, 'CNT_FAI') : (support[member as Party] ?? 0);
        const factionPower = pSupport / totalAllianceSupport;
        cohesion += contribution * factionPower;
      });
    } else {
      let sumContrib = 0;
      members.forEach(member => {
        sumContrib += c.memberContributions[member as Party] ?? 80;
      });
      cohesion = sumContrib / (members.length || 1);
    }
    c.cohesion = Math.min(100, Math.max(0, Math.round(cohesion)));

    const actualMembers = members.filter(m => m !== 'CNT_FAI') as Party[];
    const totalSupport = actualMembers.reduce((sum, p) => sum + (support[p] || 0), 0);
    let cntAttitude = 0;
    if (totalSupport > 0) {
      const sumAttitude = actualMembers.reduce((sum, p) => sum + (state.partyRelations[p] || 0) * (support[p] || 0), 0);
      cntAttitude = Math.round(sumAttitude / totalSupport);
    }
    c.cntAttitude = Math.min(100, Math.max(-100, cntAttitude));

    return c;
  });
}

function establishCoalition(state: GameState, id: CoalitionId, asRuling: boolean): GameState {
  const def = COALITION_DEFS.find(d => d.id === id);
  if (!def) return state;

  const existingCoalitions = [...(state.activeCoalitions || [])];
  if (!asRuling && existingCoalitions.some(coalition => coalition.activeId === id)) {
    return state;
  }

  // Ordinary alliances may overlap with the elected government, but never
  // replace or promote themselves into the ruling-coalition slot. An election
  // result replaces the previous government and conflicting alliances.
  const replacedCoalitionIds = existingCoalitions
    .filter(c => {
      if (!asRuling && c.activeId === state.rulingCoalition) return false;
      if (asRuling && c.activeId === state.rulingCoalition) return true;

      const cDef = COALITION_DEFS.find(d => d.id === c.activeId);
      return c.activeId === id || Boolean(cDef?.members.some(member => def.members.includes(member)));
    })
    .map(c => c.activeId);

  const currentActive = existingCoalitions.filter(c => !replacedCoalitionIds.includes(c.activeId));

  const history = [...(state.coalitionHistory || [])];
  replacedCoalitionIds.forEach(replacedId => {
    const replaced = existingCoalitions.find(c => c.activeId === replacedId);
    if (replaced) {
      history.push({
        id: replaced.activeId,
        from: replaced.formedAt,
        to: { year: state.year, month: state.month }
      });
    }
  });

  const contributions: Partial<Record<Party, number>> = {};
  const parties: Party[] = ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'Other', 'PRRevS'];
  parties.forEach(p => { contributions[p] = 80; });

  const coalition: CoalitionState = {
    activeId: id,
    memberContributions: contributions as Record<Party, number>,
    cohesion: 80,
    cntAttitude: 0,
    formedAt: { year: state.year, month: state.month }
  };

  const nextActive = [...currentActive, coalition];

  const newState: GameState = {
    ...state,
    activeCoalitions: nextActive,
    coalitionHistory: history,
    rulingCoalition: asRuling ? id : state.rulingCoalition
  };

  newState.activeCoalitions = updateCoalitions(newState);
  return newState;
}

/** Forms a non-governing political or labor alliance. */
export function formCoalition(state: GameState, id: CoalitionId): GameState {
  if (id === WARTIME_COALITION_ID || COALITION_DEFS.find(def => def.id === id)?.members.some(member => !isRepublicanPartyEligible(state, member))) return state;
  return establishCoalition(state, id, false);
}

/** The designated civil-war event is the sole runtime caller of this appointment API. */
export function formWartimeGovernment(state: GameState, route: WartimeGovernmentRoute): GameState {
  if (!isWartimeArrangementDue(state) || (route === 'council' && !canFormDefenceCouncil(state))) return state;
  const coalition = createWartimeCoalition(state, route);
  const governmentType = route === 'council'
    ? { type: 'National Defence Council', typeZh: '全国国防委员会' }
    : { type: 'Anti-Fascist Coalition Government', typeZh: '反法西斯联合政府' };
  const next = establishCoalition({
    ...state,
    republicanPartyStatus: { ...state.republicanPartyStatus, ...WARTIME_PARTY_STATUS },
    ministers: getWartimeCabinet(state, route),
    government: {
      ...state.government,
      ...governmentType,
      primeMinister: coalition.members?.includes('PSOE') ? 'Francisco Largo Caballero' : 'Acting cabinet coordinator',
      primeMinisterZh: coalition.members?.includes('PSOE') ? '弗朗西斯科·拉尔戈·卡瓦列罗' : '临时内阁协调人',
    },
    cntStance: route === 'external' ? (state.cntStance === 'oppose' ? 'oppose' : 'cooperate') : 'govern',
    cntStanceAlwaysOpposed: route === 'external' && state.cntStance === 'oppose' ? state.cntStanceAlwaysOpposed : false,
    wartimePowerArrangement: {
      route, formedAt: { year: state.year, month: state.month }, lowCohesionMonths: 0,
      lastSettlementMonth: monthIndex(state), crisisCooldownUntil: 0,
    },
    governmentCrisis: null,
    earlyElectionInProgress: false,
    eventHistory: {
      triggered: [...new Set([...(state.eventHistory?.triggered || []), WARTIME_EVENT_ID])],
      resolved: [...new Set([...(state.eventHistory?.resolved || []), WARTIME_EVENT_ID])],
    },
  }, WARTIME_COALITION_ID, true);
  const inactiveCoalitions = next.activeCoalitions.filter(item => item.activeId !== WARTIME_COALITION_ID && getCoalitionMembers(next, item).length === 0);
  next.coalitionHistory = [...next.coalitionHistory, ...inactiveCoalitions.map(item => ({
    id: item.activeId, from: item.formedAt, to: { year: state.year, month: state.month },
  }))];
  next.activeCoalitions = next.activeCoalitions.filter(item => !inactiveCoalitions.includes(item));
  next.activeCoalitions = next.activeCoalitions.map(item => item.activeId === WARTIME_COALITION_ID ? coalition : item);
  next.activeCoalitions = updateCoalitions(next);
  return next;
}

/** May Days may redistribute offices or exclude POUM, while retaining the wartime pact. */
export function reshapeWartimeCabinet(state: GameState, reason: 'centralize' | 'exclude_poum'): GameState {
  if (!isSpanishCivilWarOngoing(state) || state.rulingCoalition !== WARTIME_COALITION_ID || !state.wartimePowerArrangement) return state;
  if (reason === 'centralize' ? state.mayDays?.stage !== 'government' || Boolean(state.mayDays.governmentOutcome)
    : state.mayDays?.stage !== 'settled' || Boolean(state.mayDays.poumOutcome) || Boolean(state.republicanPartyStatus?.POUM)) return state;
  const coalition = state.activeCoalitions.find(item => item.activeId === WARTIME_COALITION_ID);
  if (!coalition) return state;
  const members = getCoalitionMembers(state, coalition).filter(member => isRepublicanPartyPresent(state, member));
  const eligible = (party: typeof state.ministers.labor) => party !== 'POUM'
    && (party !== 'CNT' || reason !== 'centralize') && members.includes(party === 'CNT' ? 'CNT_FAI' : party);
  const fallbacks: Array<typeof state.ministers.labor> = ['PSOE', 'IR', 'UR', 'ERC', 'PNV', 'PCE', 'PS', 'CNT'];
  const fallback = fallbacks.find(eligible) ?? 'Other';
  const template: GameState['ministers'] = reason === 'centralize'
    ? { labor: 'ERC', health: 'ERC', justice: 'PNV', industry: 'PSOE', interior: 'PSOE', war: 'PSOE', agriculture: 'PCE', finance: 'PSOE', estado: 'IR' }
    : state.ministers;
  const ministers = Object.fromEntries(Object.entries(template).map(([office, party]) => [
    office, reason === 'centralize' ? (eligible(party) ? party : fallback) : party === 'POUM' ? fallback : party,
  ])) as GameState['ministers'];
  const next: GameState = {
    ...state, ministers,
    ...(reason === 'centralize' ? {
      government: { ...state.government, type: 'Anti-Fascist Coalition Government', typeZh: '反法西斯联合政府',
        primeMinister: eligible('PSOE') ? 'Juan Negrín' : 'Acting cabinet coordinator',
        primeMinisterZh: eligible('PSOE') ? '胡安·内格林' : '临时内阁协调人' },
      cntStance: state.cntStance === 'govern' ? 'cooperate' : state.cntStance,
      cntStanceAlwaysOpposed: state.cntStance === 'govern' ? false : state.cntStanceAlwaysOpposed,
      governmentCrisis: null, earlyElectionInProgress: false,
    } : { republicanPartyStatus: { ...state.republicanPartyStatus, POUM: 'excluded' } }),
  };
  next.activeCoalitions = state.activeCoalitions.map(item => {
    const remaining = getCoalitionMembers(next, item);
    return { ...item, members: remaining, participation: Object.fromEntries(remaining.map(member => [
      member, Object.values(ministers).includes(member === 'CNT_FAI' ? 'CNT' : member as typeof ministers.labor) ? 'government' : 'external',
    ])) };
  });
  return { ...next, activeCoalitions: updateCoalitions(next) };
}

/** The Madrid government remains distinct from the seceding player's command. */
export function secedeWartimeGovernment(state: GameState): GameState {
  if (!isSpanishCivilWarOngoing(state) || !state.iberianDefense || state.mayDays?.stage !== 'split_result') return state;
  const eligible = (party: typeof state.ministers.labor) => isRepublicanPartyPresent(state, party === 'CNT' ? 'CNT_FAI' : party);
  const fallback = (['PSOE', 'IR', 'UR', 'ERC', 'PCE', 'PNV'] as const).find(eligible) ?? 'Other';
  const ministers = Object.fromEntries(Object.entries(state.ministers).map(([office, party]) => [office, eligible(party) ? party : fallback])) as GameState['ministers'];
  const next: GameState = { ...state, ministers, cntStance: 'oppose', rulingCoalition: null, governmentCrisis: null,
    earlyElectionInProgress: false, activeCoalitions: state.activeCoalitions.map(coalition => ({ ...coalition,
      members: getCoalitionMembers(state, coalition).filter(member => isRepublicanPartyPresent(state, member)) })) };
  return { ...next, activeCoalitions: updateCoalitions(next) };
}

/** The only public runtime API allowed to install an elected government. */
export function formRulingCoalitionFromElection(state: GameState, id: CoalitionId): GameState {
  if (state.wartimePowerArrangement || id === WARTIME_COALITION_ID) return state;
  const nextState = establishCoalition(state, id, true);
  return {
    ...nextState,
    governmentCrisis: null,
    earlyElectionInProgress: false,
  };
}

/** Debug-only ruling-coalition installation for the sandbox controls. */
export function formRulingCoalitionFromSandbox(state: GameState, id: CoalitionId): GameState {
  if (id === WARTIME_COALITION_ID || COALITION_DEFS.find(def => def.id === id)?.members.some(member => !isRepublicanPartyEligible(state, member))) return state;
  const nextState = establishCoalition(state, id, true);
  return {
    ...nextState,
    governmentCrisis: null,
    earlyElectionInProgress: false,
  };
}

export function checkCoalitionDissolve(state: GameState): GameState {
  if (!state.activeCoalitions || state.activeCoalitions.length === 0) return state;

  let currentActive = [...state.activeCoalitions];
  const history = [...(state.coalitionHistory || [])];
  let isRepublicanSocialistDissolved = state.isRepublicanSocialistDissolved;
  let isCedaRadicalDissolved = state.isCedaRadicalDissolved;
  let anyCoalitionDissolved = false;
  let newRulingCoalition = state.rulingCoalition;
  let governmentCrisis = state.governmentCrisis;
  let governmentCrisisSequence = state.governmentCrisisSequence;

  for (let i = currentActive.length - 1; i >= 0; i--) {
    const coalition = currentActive[i];
    if (coalition.activeId === WARTIME_COALITION_ID) continue;
    const def = COALITION_DEFS.find(d => d.id === coalition.activeId);
    if (!def) continue;

    let dissolutionCause: GovernmentCrisisCause | null = null;

    if (coalition.cohesion < def.dissolveThreshold) {
      dissolutionCause = 'cohesion';
    }
    if (def.shouldDissolve && def.shouldDissolve(state, coalition)) {
      dissolutionCause = 'scripted';
    }

    if (dissolutionCause) {
      history.push({
        id: coalition.activeId,
        from: coalition.formedAt,
        to: { year: state.year, month: state.month }
      });
      if (coalition.activeId === 'republican_socialist') isRepublicanSocialistDissolved = true;
      if (coalition.activeId === 'ceda_radical') isCedaRadicalDissolved = true;
      anyCoalitionDissolved = true;
      
      if (state.rulingCoalition === coalition.activeId) {
        newRulingCoalition = null;
        governmentCrisisSequence += 1;
        governmentCrisis = {
          sequence: governmentCrisisSequence,
          coalitionId: coalition.activeId,
          cause: dissolutionCause,
          occurredAt: { year: state.year, month: state.month },
        };
      }
      
      currentActive.splice(i, 1);
    }
  }

  if (anyCoalitionDissolved) {
    return {
      ...state,
      activeCoalitions: currentActive,
      coalitionHistory: history,
      isRepublicanSocialistDissolved,
      isCedaRadicalDissolved,
      rulingCoalition: newRulingCoalition,
      governmentCrisis,
      governmentCrisisSequence,
    };
  }

  return state;
}

export function initializeStartingCoalition(state: GameState): GameState {
  let s = { ...state };
  s.partySupport = updatePartySupport(s);
  
  if (s.scenario === '1931') {
    s = establishCoalition(s, 'provisional_government', true);
    s.cntStance = 'oppose';
  } else if (s.scenario === '1933') {
    s = establishCoalition(s, 'ceda_radical', true);
    s.cntStance = 'oppose';
  } else if (s.scenario === '1936') {
    s = establishCoalition(s, 'popular_front', true);
    s.cntStance = 'cooperate';
  }
  
  return s;
}
