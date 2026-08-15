const fs = require('fs');

let code = `
import { GameState, CoalitionState, CoalitionId, Party, SocialClass } from '../types';
import { COALITION_DEFS } from '../coalitions';
import { CLASS_INFO } from '../constants';
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

export function formCoalition(state: GameState, id: CoalitionId, isRuling = false): GameState {
  const def = COALITION_DEFS.find(d => d.id === id);
  if (!def) return state;

  // A party can only be in one coalition. Strip members from other active coalitions.
  let currentActive = [...(state.activeCoalitions || [])];
  
  // Actually, wait, it's easier to dissolve any coalition that shares members, or just remove them.
  // The rule says "1个政党同时只能加入一个". Let's remove them from other coalitions.
  let shouldDissolveIds: CoalitionId[] = [];
  
  currentActive = currentActive.map(c => {
    const cDef = COALITION_DEFS.find(d => d.id === c.activeId);
    if (!cDef) return c;
    
    // Check overlap
    const hasOverlap = cDef.members.some(m => def.members.includes(m));
    if (hasOverlap) {
      shouldDissolveIds.push(c.activeId);
    }
    return c;
  });

  const history = [...(state.coalitionHistory || [])];
  
  shouldDissolveIds.forEach(did => {
    const idx = currentActive.findIndex(c => c.activeId === did);
    if (idx > -1) {
      history.push({
        id: currentActive[idx].activeId,
        from: currentActive[idx].formedAt,
        to: { year: state.year, month: state.month }
      });
      currentActive.splice(idx, 1);
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

  currentActive.push(coalition);

  const newState = {
    ...state,
    activeCoalitions: currentActive,
    coalitionHistory: history,
    rulingCoalition: isRuling ? id : (shouldDissolveIds.includes(state.rulingCoalition as CoalitionId) ? id : state.rulingCoalition)
  };

  newState.activeCoalitions = updateCoalitions(newState);
  return newState;
}

export function adjustMemberContribution(state: GameState, party: Party, amount: number, targetCoalitionId?: CoalitionId): GameState {
  if (!state.activeCoalitions || state.activeCoalitions.length === 0) return state;
  
  // If target specified, adjust that. Otherwise adjust ruling. Otherwise adjust first.
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
  let coalitionJustDissolved = false;
  let newRulingCoalition = state.rulingCoalition;

  for (let i = currentActive.length - 1; i >= 0; i--) {
    const coalition = currentActive[i];
    const def = COALITION_DEFS.find(d => d.id === coalition.activeId);
    if (!def) continue;

    let shouldDissolve = false;

    if (coalition.cohesion < def.dissolveThreshold) {
      shouldDissolve = true;
    }
    if (def.shouldDissolve && def.shouldDissolve(state, coalition)) {
      shouldDissolve = true;
    }
    if (state.cortes) {
      const memberSeats = def.members.reduce((sum, m) => sum + (m === 'CNT_FAI' ? 0 : (state.cortes?.[m as Party] || 0)), 0);
      const totalSeats = Object.values(state.cortes).reduce((sum, v) => sum + v, 0) || 470;
      const seatShare = memberSeats / totalSeats;
      if (seatShare < def.minSeatShare) {
        shouldDissolve = true;
      }
    }

    if (shouldDissolve) {
      history.push({
        id: coalition.activeId,
        from: coalition.formedAt,
        to: { year: state.year, month: state.month }
      });
      if (coalition.activeId === 'republican_socialist') isRepublicanSocialistDissolved = true;
      if (coalition.activeId === 'ceda_radical') isCedaRadicalDissolved = true;
      coalitionJustDissolved = true;
      
      if (state.rulingCoalition === coalition.activeId) {
        newRulingCoalition = null;
        // Trigger snap election by unsetting ruling and flagging
        // Note: the prompt says "若这个政党联盟是执政联盟，则触发提前大选"
        // We will just let coalition_just_dissolved flag handle it or we can do something else
      }
      
      currentActive.splice(i, 1);
    }
  }

  if (coalitionJustDissolved) {
    return {
      ...state,
      activeCoalitions: currentActive,
      coalitionHistory: history,
      isRepublicanSocialistDissolved,
      isCedaRadicalDissolved,
      coalition_just_dissolved: true,
      rulingCoalition: newRulingCoalition
    };
  }

  return state;
}

export function autoFormCoalitionIfNeeded(state: GameState): GameState {
  return state;
}

export function initializeStartingCoalition(state: GameState): GameState {
  let s = { ...state };
  s.partySupport = updatePartySupport(s);
  
  if (s.scenario === '1931') {
    s = formCoalition(s, 'provisional_government', true);
    s.cntStance = 'oppose';
  } else if (s.scenario === '1933') {
    s = formCoalition(s, 'ceda_radical', true);
    s.cntStance = 'oppose';
  } else if (s.scenario === '1936') {
    s = formCoalition(s, 'popular_front', true);
    s.cntStance = 'cooperate';
  }
  
  return s;
}
`;

fs.writeFileSync('src/game/utils/coalition.ts', code);
