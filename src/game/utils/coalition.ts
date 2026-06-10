import { GameState, CoalitionState, CoalitionId, Party, SocialClass } from '../types';
import { COALITION_DEFS } from '../coalitions';
import { CLASS_INFO } from '../constants';

/**
 * Calculates support percentage for a specific party dynamically based on class popular ratios
 */
export function getPartySupport(state: GameState, party: 'CNT_FAI' | Party): number {
  let totalSupport = 0;
  for (const classId in state.classes) {
    const classData = state.classes[classId as SocialClass];
    if (!classData || !classData.support) continue;
    
    const pop = CLASS_INFO[classId as SocialClass]?.pop / 100 || 0.125;
    const classTotalPoints = Object.values(classData.support).reduce((sum, val) => sum + val, 0) || 1;
    const relativePercent = ((classData.support[party] || 0) / classTotalPoints) * 100;
    totalSupport += pop * relativePercent;
  }
  return Number(totalSupport.toFixed(2));
}

/**
 * Recalculates all parties' support values in bulk
 */
export function updatePartySupport(state: GameState): Record<Party, number> {
  const support: Partial<Record<Party, number>> = {};
  const parties: Party[] = ['PSOE', 'PCE', 'IR', 'UR', 'PS', 'FE', 'POUM', 'AP', 'CT', 'RE', 'DLR', 'PRR', 'ERC', 'Other'];
  parties.forEach(p => {
    support[p] = getPartySupport(state, p);
  });
  return support as Record<Party, number>;
}

/**
 * Re-evaluates cohesive power and average CNT-relation attitude for the active coalition
 */
export function updateCoalitionState(state: GameState): CoalitionState | null {
  if (!state.activeCoalition) return null;
  const coalition = { ...state.activeCoalition };
  const def = COALITION_DEFS.find(d => d.id === coalition.activeId);
  if (!def) return null;

  const support = state.partySupport && Object.keys(state.partySupport).length > 0 
    ? state.partySupport 
    : updatePartySupport(state);

  // 1. Calculate the sum of support of all parties in the coalition
  let totalAllianceSupport = 0;
  def.members.forEach(member => {
    const pSupport = member === 'CNT_FAI' ? getPartySupport(state, 'CNT_FAI') : (support[member as Party] ?? 0);
    totalAllianceSupport += pSupport;
  });

  // 2. Calculate cohesion using: Sum of (memberContribution * (partySupport / totalAllianceSupport))
  let cohesion = 0;
  if (totalAllianceSupport > 0) {
    def.members.forEach(member => {
      const contribution = coalition.memberContributions[member as Party] ?? 80;
      const pSupport = member === 'CNT_FAI' ? getPartySupport(state, 'CNT_FAI') : (support[member as Party] ?? 0);
      const factionPower = pSupport / totalAllianceSupport; // ratio of support within coalition
      cohesion += contribution * factionPower;
    });
  } else {
    // If no support at all, fallback to a simple average of contributions
    let sumContrib = 0;
    def.members.forEach(member => {
      sumContrib += coalition.memberContributions[member as Party] ?? 80;
    });
    cohesion = sumContrib / (def.members.length || 1);
  }
  // Cap between 0 and 100
  coalition.cohesion = Math.min(100, Math.max(0, Math.round(cohesion)));

  // 2. Calculate average CNT relations of the other parties
  const actualMembers = def.members.filter(m => m !== 'CNT_FAI') as Party[];
  const totalSupport = actualMembers.reduce((sum, p) => sum + (support[p] || 0), 0);
  let cntAttitude = 0;
  if (totalSupport > 0) {
    const sumAttitude = actualMembers.reduce((sum, p) => sum + (state.partyRelations[p] || 0) * (support[p] || 0), 0);
    cntAttitude = Math.round(sumAttitude / totalSupport);
  } else {
    // defaults
    cntAttitude = 0;
  }
  coalition.cntAttitude = Math.min(100, Math.max(-100, cntAttitude));

  return coalition;
}

/**
 * Activates a coalition by template ID and updates historical tracking
 */
export function formCoalition(state: GameState, id: CoalitionId): GameState {
  const def = COALITION_DEFS.find(d => d.id === id);
  if (!def) return state;

  const history = [...(state.coalitionHistory || [])];
  if (state.activeCoalition) {
    history.push({
      id: state.activeCoalition.activeId,
      from: state.activeCoalition.formedAt,
      to: { year: state.year, month: state.month }
    });
  }

  const contributions: Partial<Record<Party, number>> = {};
  const parties: Party[] = ['PSOE', 'PCE', 'IR', 'UR', 'PS', 'FE', 'POUM', 'AP', 'CT', 'RE', 'DLR', 'PRR', 'ERC', 'Other'];
  parties.forEach(p => {
    contributions[p] = 80; // Starting average contribution is 80
  });

  const coalition: CoalitionState = {
    activeId: id,
    memberContributions: contributions as Record<Party, number>,
    cohesion: 80,
    cntAttitude: 0,
    cntStance: 'cooperate',
    formedAt: { year: state.year, month: state.month }
  };

  const newState = {
    ...state,
    activeCoalition: coalition,
    coalitionHistory: history
  };

  newState.activeCoalition = updateCoalitionState(newState);
  return newState;
}

/**
 * Increments or decrements a member party's commitment contribution and recalcs
 */
export function adjustMemberContribution(state: GameState, party: Party, amount: number): GameState {
  if (!state.activeCoalition) return state;
  const contributions = { ...state.activeCoalition.memberContributions };
  const oldVal = contributions[party] ?? 80;
  contributions[party] = Math.min(100, Math.max(0, oldVal + amount));

  const updatedCoalition = {
    ...state.activeCoalition,
    memberContributions: contributions
  };

  const newState = {
    ...state,
    activeCoalition: updatedCoalition
  };

  newState.activeCoalition = updateCoalitionState(newState);
  return newState;
}

/**
 * Checks cohesion, seat requirements, and custom criteria. Dissolves if requirements fail.
 */
export function checkCoalitionDissolve(state: GameState): GameState {
  if (!state.activeCoalition) return state;

  const coalition = state.activeCoalition;
  const def = COALITION_DEFS.find(d => d.id === coalition.activeId);
  if (!def) return state;

  let shouldDissolve = false;

  // 1. Cohesion drops below template's dissolve threshold
  if (coalition.cohesion < def.dissolveThreshold) {
    shouldDissolve = true;
  }

  // 2. Custom dissolution callback
  if (def.shouldDissolve && def.shouldDissolve(state, coalition)) {
    shouldDissolve = true;
  }

  // 3. Fall below seat percentage requirement if Cortes exists
  if (state.cortes) {
    const memberSeats = def.members.reduce((sum, m) => sum + (m === 'CNT_FAI' ? 0 : (state.cortes?.[m as Party] || 0)), 0);
    const totalSeats = Object.values(state.cortes).reduce((sum, v) => sum + v, 0) || 470;
    const seatShare = memberSeats / totalSeats;
    if (seatShare < def.minSeatShare) {
      shouldDissolve = true;
    }
  }

  if (shouldDissolve) {
    const history = [...(state.coalitionHistory || [])];
    history.push({
      id: coalition.activeId,
      from: coalition.formedAt,
      to: { year: state.year, month: state.month }
    });

    return {
      ...state,
      activeCoalition: null,
      coalitionHistory: history
    };
  }

  return state;
}

/**
 * Matches existing template requirements and auto-forms a coalition if none is active
 */
export function autoFormCoalitionIfNeeded(state: GameState): GameState {
  return state;
}

/**
 * Initializes starting coalition based on selected scenario
 */
export function initializeStartingCoalition(state: GameState): GameState {
  let s = { ...state };
  s.partySupport = updatePartySupport(s);
  
  if (s.scenario === '1931') {
    s.activeCoalition = null;
  } else if (s.scenario === '1933') {
    s = formCoalition(s, 'ceda_radical');
  } else if (s.scenario === '1936') {
    s = formCoalition(s, 'popular_front');
    if (s.activeCoalition) {
      s.activeCoalition.cntStance = 'cooperate'; // default cooperation stance
    }
  }
  return s;
}
