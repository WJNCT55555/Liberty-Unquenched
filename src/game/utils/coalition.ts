import type { GameState, CoalitionState, CoalitionId, GovernmentCrisisCause, Party } from '../types';
import { COALITION_DEFS } from '../coalitions';
import { getPartySupport, updatePartySupport } from '../parties';

export { getPartySupport, updatePartySupport };

export function updateCoalitions(state: GameState): CoalitionState[] {
  const support = state.partySupport && Object.keys(state.partySupport).length > 0 
    ? state.partySupport 
    : updatePartySupport(state);

  return state.activeCoalitions.map(coalition => {
    const c = { ...coalition };
    const def = COALITION_DEFS.find(d => d.id === c.activeId);
    if (!def) return c;

    let totalAllianceSupport = 0;
    def.members.forEach(member => {
      const pSupport = member === 'CNT_FAI' ? getPartySupport(state, 'CNT_FAI') : (support[member as Party] ?? 0);
      totalAllianceSupport += pSupport;
    });

    let cohesion = 0;
    if (totalAllianceSupport > 0) {
      def.members.forEach(member => {
        const contribution = c.memberContributions[member as Party] ?? 80;
        const pSupport = member === 'CNT_FAI' ? getPartySupport(state, 'CNT_FAI') : (support[member as Party] ?? 0);
        const factionPower = pSupport / totalAllianceSupport;
        cohesion += contribution * factionPower;
      });
    } else {
      let sumContrib = 0;
      def.members.forEach(member => {
        sumContrib += c.memberContributions[member as Party] ?? 80;
      });
      cohesion = sumContrib / (def.members.length || 1);
    }
    c.cohesion = Math.min(100, Math.max(0, Math.round(cohesion)));

    const actualMembers = def.members.filter(m => m !== 'CNT_FAI') as Party[];
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
  return establishCoalition(state, id, false);
}

/** The only public runtime API allowed to install an elected government. */
export function formRulingCoalitionFromElection(state: GameState, id: CoalitionId): GameState {
  const nextState = establishCoalition(state, id, true);
  return {
    ...nextState,
    governmentCrisis: null,
    earlyElectionInProgress: false,
  };
}

/** Debug-only ruling-coalition installation for the sandbox controls. */
export function formRulingCoalitionFromSandbox(state: GameState, id: CoalitionId): GameState {
  const nextState = establishCoalition(state, id, true);
  return {
    ...nextState,
    governmentCrisis: null,
    earlyElectionInProgress: false,
  };
}

export function adjustMemberContribution(state: GameState, party: Party, amount: number, targetCoalitionId?: CoalitionId): GameState {
  if (!state.activeCoalitions || state.activeCoalitions.length === 0) return state;
  
  let targetId = targetCoalitionId;
  if (!targetId) targetId = state.rulingCoalition || state.activeCoalitions[0].activeId;

  const currentActive = state.activeCoalitions.map(c => {
    if (c.activeId === targetId) {
      const contributions = { ...c.memberContributions };
      const oldVal = contributions[party] ?? 80;
      contributions[party] = Math.min(100, Math.max(0, oldVal + amount));
      return { ...c, memberContributions: contributions };
    }
    return c;
  });

  const newState = { ...state, activeCoalitions: currentActive };
  newState.activeCoalitions = updateCoalitions(newState);
  return newState;
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
