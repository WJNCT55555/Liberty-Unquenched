import { GameState, Party, SocialClass } from '../types';
import { CLASS_INFO } from '../constants';
import { getPartySupport } from './coalition';
import { isOrganizationEstablished } from '../organizations';

export function calculateRawVotes(state: GameState): Record<Party, number> {
  const votes: Record<Party, number> = {
    POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 0, PNV: 0, PRR: 0, DLR: 0, AP: 0, RE: 0, CT: 0, FE: 0, Other: 0, PRRevS: 0
  };
  let cntVotes = 0;

  // 1. Calculate raw votes
  for (const classId in state.classes) {
    const classData = state.classes[classId as SocialClass];
    const popWeight = CLASS_INFO[classId as SocialClass].pop;

    for (const party in classData.support) {
      const supportVal = classData.support[party as Party | 'CNT_FAI'];
      const rawVotes = (supportVal / 100) * popWeight;
      
      if (party === 'CNT_FAI') {
        cntVotes += rawVotes;
      } else {
        if (party in votes) {
          votes[party as Party] += rawVotes;
        }
      }
    }
  }

  // 2. Handle CNT-FAI votes
  const cntVoteFraction = (state.cntVotingRate || 0) / 100;
  const actualCntVotes = cntVotes * cntVoteFraction;

  if (actualCntVotes > 0) {
    if (isOrganizationEstablished(state, 'PRRevS')) {
      votes['PRRevS'] += actualCntVotes;
    } else {
      const eligibleParties = (Object.keys(state.partyRelations) as Party[]).filter(p => {
        if (p === 'PRRevS' || p === 'Other') return false;
        const rel = state.partyRelations[p] || 0;
        return rel > 60;
      });

      if (eligibleParties.length > 0) {
        const totalRelation = eligibleParties.reduce((sum, p) => sum + (state.partyRelations[p] || 0), 0);
        if (totalRelation > 0) {
          eligibleParties.forEach(p => {
            const relation = state.partyRelations[p] || 0;
            votes[p] += actualCntVotes * (relation / totalRelation);
          });
        } else {
          eligibleParties.forEach(p => {
            votes[p] += actualCntVotes / eligibleParties.length;
          });
        }
      }
    }
  }

  return votes;
}

export function votesToSeats(votes: Record<Party, number>, totalSeats: number): Record<Party, number> {
  const seats: Record<Party, number> = {
    POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 0, PNV: 0, PRR: 0, DLR: 0, AP: 0, RE: 0, CT: 0, FE: 0, Other: 0, PRRevS: 0
  };

  let totalValidVotes = 0;
  for (const party in votes) {
    totalValidVotes += votes[party as Party];
  }

  let remainingSeats = totalSeats;
  const fractionalSeats: { party: Party, fraction: number }[] = [];

  for (const p in seats) {
    const party = p as Party;
    if (totalValidVotes > 0) {
      const exactSeats = (votes[party] / totalValidVotes) * totalSeats;
      seats[party] = Math.floor(exactSeats);
      remainingSeats -= seats[party];
      fractionalSeats.push({ party, fraction: exactSeats - seats[party] });
    }
  }

  // Distribute remaining seats based on highest fractions (Largest Remainder Method)
  fractionalSeats.sort((a, b) => b.fraction - a.fraction);
  for (let i = 0; i < remainingSeats; i++) {
    if (fractionalSeats[i]) {
      seats[fractionalSeats[i].party]++;
    }
  }

  return seats;
}

export function calculateElectionResults(state: GameState): Record<Party, number> {
  const rawVotes = calculateRawVotes(state);
  return votesToSeats(rawVotes, 470);
}

export function calculatePresidentialVotes(
  state: GameState,
  leftCandidate: 'azana' | 'ramon_franco',  // 第一阶段决定的左翼代表
  activeCandidate: 'left' | 'martinez_barrio' | 'gil_robles' | null  // CNT在第二阶段支持谁
): {
  votes: Record<string, number>;
  deputyVotes: Record<string, number>;
  electorVotes: Record<string, number>;
  total: number;
  majorityRequired: number;
  hasWinner: boolean;
  winner: string | null;
} {
  // ===== 候选人层票仓初始化 =====
  const deputyVotes: Record<string, number> = { left: 0, martinez_barrio: 0, gil_robles: 0 };
  const electorVotes: Record<string, number> = { left: 0, martinez_barrio: 0, gil_robles: 0 };
  const candidateVotes: Record<string, number> = { left: 0, martinez_barrio: 0, gil_robles: 0 };

  // 1. deputyVotes uses state.cortes (Total 470 seats)
  const cortesVotes = { ...state.cortes };

  // 2. electorVotes uses calculateRawVotes(state) scaled to 470 seats
  const rawVotes = calculateRawVotes(state);
  const electorSeats = votesToSeats(rawVotes, 470);

  // Helper mapping function to aggregate Party seats into Candidates
  const mapPartyToCandidate = (
    partyVotes: Record<Party, number>,
    isElectorLayer: boolean
  ): Record<string, number> => {
    const candidate: Record<string, number> = { left: 0, martinez_barrio: 0, gil_robles: 0 };

    // --- Left (left) ---
    // IR + UR + ERC + PSOE(55%) + PCE(70%) + POUM(50%) + PS(30%) + Other(20%)
    candidate.left = 
      (partyVotes.IR || 0) + (partyVotes.UR || 0) +
      (partyVotes.ERC || 0) +
      (partyVotes.PSOE || 0) * 0.55 +
      (partyVotes.PCE || 0) * 0.70 +
      (partyVotes.POUM || 0) * 0.50 +
      (partyVotes.PS || 0) * 0.30 +
      (partyVotes.Other || 0) * 0.20;

    // Apply lobby modifications to voter share distributions if any
    if (state.campaignLobbyVisited?.lobby_psoe) {
      if (activeCandidate === 'left') {
        // PSOE allocation to left shifts from 55% -> 70%, martinez_barrio from 25% -> 10%
        candidate.left += (partyVotes.PSOE || 0) * 0.15;
        candidate.martinez_barrio -= (partyVotes.PSOE || 0) * 0.15;
      } else if (activeCandidate === 'martinez_barrio') {
        // PSOE allocation to martinez_barrio shifts from 25% -> 40%, left from 55% -> 40%
        candidate.left -= (partyVotes.PSOE || 0) * 0.15;
        candidate.martinez_barrio += (partyVotes.PSOE || 0) * 0.15;
      }
    }

    // --- Center (martinez_barrio) ---
    // DLR + PRR(70%) + PSOE(25%) + Other(30%) + PS(20%)
    candidate.martinez_barrio += 
      (partyVotes.DLR || 0) +
      (partyVotes.PRR || 0) * 0.70 +
      (partyVotes.PSOE || 0) * 0.25 +
      (partyVotes.Other || 0) * 0.30 +
      (partyVotes.PS || 0) * 0.20;

    // 若CNT未参与 -> 中间派因CNT被动中立而在选举人票层获得10票中立好感
    if (isElectorLayer && !state.cntParticipatePresidential) {
      candidate.martinez_barrio += 10;
    }

    // Apply Other voter shifts from lobby_resources
    if (isElectorLayer && state.campaignLobbyVisited?.lobby_resources) {
      // Other votes shift 15 votes towards our selected active candidate
      const actualShift = Math.min(15, (partyVotes.Other || 0) * 0.5); // protect underflow
      if (activeCandidate === 'left') {
        candidate.left += actualShift;
        candidate.martinez_barrio -= actualShift * 0.6;
        candidate.gil_robles -= actualShift * 0.4;
      } else if (activeCandidate === 'martinez_barrio') {
        candidate.martinez_barrio += actualShift;
        candidate.left -= actualShift * 0.5;
        candidate.gil_robles -= actualShift * 0.5;
      } else if (activeCandidate === 'gil_robles') {
        candidate.gil_robles += actualShift;
        candidate.left -= actualShift * 0.5;
        candidate.martinez_barrio -= actualShift * 0.5;
      }
    }

    // --- Right (gil_robles) ---
    // AP + CT + RE + PRR(30%) + PSOE(5%) + PCE(5%) + Other(20%)
    candidate.gil_robles += 
      (partyVotes.AP || 0) + (partyVotes.CT || 0) +
      (partyVotes.RE || 0) +
      (partyVotes.PRR || 0) * 0.30 +
      (partyVotes.PSOE || 0) * 0.05 +
      (partyVotes.PCE || 0) * 0.05 +
      (partyVotes.Other || 0) * 0.20;

    // Left candidate adjustment
    if (leftCandidate === 'ramon_franco') {
      const rallyEffect = 0.10;
      const alienationEffect = 0.08;
      const originalLeft = candidate.left;
      candidate.left = originalLeft * (1 + rallyEffect - alienationEffect);
      candidate.martinez_barrio += originalLeft * alienationEffect;
    }

    // Apply lobby_r2_martinez_barrio_switch
    if (state.campaignLobbyVisited?.lobby_r2_martinez_barrio_switch && activeCandidate === 'left') {
      candidate.left += candidate.martinez_barrio;
      candidate.martinez_barrio = 0;
    }

    // Apply lobby_r2_gil_robles_allies
    if (state.campaignLobbyVisited?.lobby_r2_gil_robles_allies) {
      if (activeCandidate && activeCandidate !== 'gil_robles') {
        const penalty = Math.min(20, candidate.gil_robles);
        candidate.gil_robles -= penalty;
        candidate[activeCandidate] += penalty;
      }
    }

    return candidate;
  };

  const mappedDeputies = mapPartyToCandidate(cortesVotes, false);
  const mappedElectors = mapPartyToCandidate(electorSeats, true);

  // Apply CNT Participation Bonus ONLY to electors layer (electorVotes)
  if (state.cntParticipatePresidential && activeCandidate) {
    const faistasDissent = state.factions.Faistas.dissent || 0;
    const puristasDissent = state.factions.Puristas.dissent || 0;
    const totalDissent = (faistasDissent + puristasDissent) / 200;
    const discipline = Math.max(0, 1.0 - totalDissent);
    const baseBonus = 30;
    const cntBonus = Math.floor(baseBonus * discipline);

    if (activeCandidate === 'left') {
      mappedElectors.left += cntBonus;
    } else if (activeCandidate === 'martinez_barrio') {
      mappedElectors.martinez_barrio += cntBonus + 5;
    } else if (activeCandidate === 'gil_robles') {
      mappedElectors.gil_robles += Math.floor(cntBonus * 0.1);
    }
  }

  // Apply lobby_erc
  if (state.campaignLobbyVisited?.lobby_erc && activeCandidate) {
    mappedElectors[activeCandidate] += 15;
  }

  // Apply lobby_street
  if (state.campaignLobbyVisited?.lobby_street && activeCandidate) {
    mappedElectors[activeCandidate] += 8;
  }

  // Round results to nearest integers
  for (const k in deputyVotes) {
    deputyVotes[k] = Math.round(mappedDeputies[k]);
    electorVotes[k] = Math.round(mappedElectors[k]);
    candidateVotes[k] = deputyVotes[k] + electorVotes[k];
  }

  const total = 940;
  const majorityRequired = Math.ceil(total * 2 / 3);
  let hasWinner = false;
  let winner: string | null = null;

  for (const k in candidateVotes) {
    if (candidateVotes[k] >= majorityRequired) {
      hasWinner = true;
      winner = k;
    }
  }

  // If we are in round 2 (simple majority), find who has the maximum votes
  if (state.presidentElectionRound === 2) {
    let maxVotes = -1;
    let maxKey = null;
    for (const k in candidateVotes) {
      if (candidateVotes[k] > maxVotes) {
        maxVotes = candidateVotes[k];
        maxKey = k;
      }
    }
    winner = maxKey;
    hasWinner = true;
  }

  return {
    votes: candidateVotes,
    deputyVotes,
    electorVotes,
    total,
    majorityRequired,
    hasWinner,
    winner
  };
}
