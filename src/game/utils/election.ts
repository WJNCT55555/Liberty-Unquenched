import { GameState, Party, SocialClass } from '../types';
import { CLASS_INFO } from '../constants';

export function calculateElectionResults(state: GameState): Record<Party, number> {
  const votes: Record<Party, number> = {
    PSOE: 0, PCE: 0, IR: 0, UR: 0, PS: 0, FE: 0, POUM: 0, AP: 0, CT: 0, RE: 0, DLR: 0, Other: 0
  };
  let cntVotes = 0;

  // 1. Calculate raw votes
  let totalValidVotes = 0;
  for (const classId in state.classes) {
    const classData = state.classes[classId as SocialClass];
    const popWeight = CLASS_INFO[classId as SocialClass].pop;

    for (const party in classData.support) {
      const supportVal = classData.support[party as Party | 'CNT_FAI'];
      const rawVotes = (supportVal / 100) * popWeight;
      
      if (party === 'CNT_FAI') {
        cntVotes += rawVotes;
      } else {
        votes[party as Party] += rawVotes;
      }
    }
  }

  // 2. Handle CNT-FAI votes
  const cntSupported = state.stats.republican_socialist_coalition_power > 50;

  if (cntSupported) {
    // Distribute CNT votes to left allies (PSOE, IR)
    votes['PSOE'] += cntVotes * 0.7;
    votes['IR'] += cntVotes * 0.3;
  } else {
    // Abstention - votes are lost, reducing total valid votes pool
  }

  // Calculate total valid votes after distribution
  for (const party in votes) {
    totalValidVotes += votes[party as Party];
  }

  // 3. Convert to seats (Total 470)
  const TOTAL_SEATS = 470;
  const seats: Record<Party, number> = {
    PSOE: 0, PCE: 0, IR: 0, UR: 0, PS: 0, FE: 0, POUM: 0, AP: 0, CT: 0, RE: 0, DLR: 0, Other: 0
  };

  let remainingSeats = TOTAL_SEATS;
  const fractionalSeats: { party: Party, fraction: number }[] = [];

  for (const p in seats) {
    const party = p as Party;
    if (totalValidVotes > 0) {
      const exactSeats = (votes[party] / totalValidVotes) * TOTAL_SEATS;
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
