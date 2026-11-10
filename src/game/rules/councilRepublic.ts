import type {
  CouncilSeatActor,
  GameState,
  MinisterParty,
  Ministers,
  Party,
} from '../types';
import { getPartySupport } from '../parties';
import { MINISTER_COSTS, TOTAL_MINISTER_COST } from './ministerAllocation';

export const COUNCIL_CONGRESS_SEATS = 400;
export const CEC_SEATS = 81;
export const CEC_MAJORITY = Math.floor(CEC_SEATS / 2) + 1;

const COUNCIL_LEFT_BLOC: CouncilSeatActor[] = ['CNT', 'PSOE', 'PCE', 'POUM', 'IR', 'UR', 'ERC', 'PS'];

export type CouncilSeats = Record<CouncilSeatActor, number>;
export type OfficeId = keyof Ministers;

const COUNCIL_PARTIES: Exclude<Party, 'PRRevS'>[] = [
  'POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'Other',
];

const OFFICES = Object.keys(MINISTER_COSTS) as OfficeId[];

const PARTY_PRIORITIES: Partial<Record<Exclude<Party, 'PRRevS'>, OfficeId[]>> = {
  PSOE: ['labor', 'finance', 'interior', 'agriculture', 'education', 'war', 'health', 'justice'],
  PCE: ['agriculture', 'industry', 'labor', 'interior', 'war', 'commerce', 'education'],
  POUM: ['labor', 'industry', 'justice', 'education', 'health'],
  IR: ['education', 'justice', 'interior', 'estado', 'finance', 'publicWorks', 'war'],
  UR: ['justice', 'education', 'publicWorks', 'health'],
  ERC: ['education', 'publicWorks', 'labor', 'health', 'commerce'],
  PNV: ['industry', 'interior', 'agriculture', 'finance'],
  PS: ['labor', 'industry', 'commerce'],
  PRR: ['interior', 'finance', 'estado', 'publicWorks'],
  DLR: ['estado', 'justice', 'education'],
};

const emptySeats = (): CouncilSeats => ({
  POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 0, PNV: 0,
  PRR: 0, DLR: 0, AP: 0, RE: 0, CT: 0, FE: 0, FET: 0, Other: 0, CNT: 0,
});

const allocateLargestRemainder = (
  weights: CouncilSeats,
  totalSeats: number,
): CouncilSeats => {
  const seats = emptySeats();
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (totalWeight <= 0) {
    seats.Other = totalSeats;
    return seats;
  }

  const fractions: { actor: CouncilSeatActor; fraction: number }[] = [];
  let remaining = totalSeats;
  (Object.keys(seats) as CouncilSeatActor[]).forEach((actor) => {
    const exact = (Math.max(0, weights[actor]) / totalWeight) * totalSeats;
    seats[actor] = Math.floor(exact);
    remaining -= seats[actor];
    fractions.push({ actor, fraction: exact - seats[actor] });
  });
  fractions.sort((left, right) => right.fraction - left.fraction);
  for (let index = 0; index < remaining; index += 1) {
    seats[fractions[index % fractions.length].actor] += 1;
  }
  return seats;
};

/**
 * Functional franchise for the Council Republic.
 *
 * This is an MVP formula: CNT support + union density for the CNT delegation,
 * and current party support for the parties. The final game can replace the
 * weights with a full workplace/peasant/soldier council election.
 */
export const buildCongressSeats = (state: GameState): CouncilSeats => {
  const weights = emptySeats();
  const unionDensity = state.unionShare?.CNT ?? 0;
  weights.CNT = (
    getPartySupport(state, 'CNT_FAI') * 0.65
    + unionDensity * 0.35
  );

  COUNCIL_PARTIES.forEach((party) => {
    if (state.republicanPartyStatus?.[party] === 'excluded') return;
    weights[party] = Math.max(0, getPartySupport(state, party));
  });

  return allocateLargestRemainder(weights, COUNCIL_CONGRESS_SEATS);
};

export const buildCecSeats = (congressSeats: CouncilSeats): CouncilSeats => (
  allocateLargestRemainder(congressSeats, CEC_SEATS)
);

export const getCouncilChips = (cecSeats: CouncilSeats, actor: CouncilSeatActor): number => (
  Math.max(0, Math.floor(((cecSeats[actor] ?? 0) / CEC_SEATS) * TOTAL_MINISTER_COST))
);

const getLargestActor = (seats: CouncilSeats): CouncilSeatActor => (
  (Object.keys(seats) as CouncilSeatActor[]).reduce(
    (largest, actor) => (seats[actor] > seats[largest] ? actor : largest),
    'Other' as CouncilSeatActor,
  )
);

const buildAiCommissars = (state: GameState, cecSeats: CouncilSeats): Ministers => {
  const ministers: Ministers = {
    labor: 'Other', health: 'Other', justice: 'Other', industry: 'Other',
    commerce: 'Other', interior: 'Other', war: 'Other', agriculture: 'Other',
    education: 'Other', publicWorks: 'Other', finance: 'Other', estado: 'Other',
  };
  const available = new Set<OfficeId>(OFFICES);
  const partyActors = COUNCIL_PARTIES
    .map((party) => ({
      party,
      chips: getCouncilChips(cecSeats, party),
      seats: cecSeats[party] ?? 0,
    }))
    .filter((entry) => entry.seats > 0)
    .sort((left, right) => right.seats - left.seats || left.party.localeCompare(right.party));

  partyActors.forEach(({ party, chips }) => {
    let remaining = chips;
    const priorities = PARTY_PRIORITIES[party] ?? OFFICES;
    priorities.forEach((office) => {
      if (!available.has(office)) return;
      const cost = MINISTER_COSTS[office];
      if (remaining < cost) return;
      ministers[office] = party as MinisterParty;
      remaining -= cost;
      available.delete(office);
    });
  });

  // Any office no party could afford is left to the largest delegation or an
  // independent; the CNT player can still overwrite it in the allocation UI.
  const largest = getLargestActor(cecSeats);
  available.forEach((office) => {
    ministers[office] = largest === 'CNT'
      ? 'Other'
      : largest as MinisterParty;
  });

  return ministers;
};

export const buildCouncilGovernment = (state: GameState): Partial<GameState> => {
  const congressSeats = buildCongressSeats(state);
  const cecSeats = buildCecSeats(congressSeats);
  const leverage = getCouncilChips(cecSeats, 'CNT');
  const leftBlocSeats = COUNCIL_LEFT_BLOC.reduce((sum, actor) => sum + (cecSeats[actor] ?? 0), 0);
  const canEnterCabinet = leverage >= Math.min(...Object.values(MINISTER_COSTS))
    && leftBlocSeats >= CEC_MAJORITY;
  const since = { year: state.year, month: state.month };

  return {
    polity: {
      type: 'council_republic',
      since,
      congressSeats,
      cecSeats,
      cecChairman: 'CEC Chairman',
      commissarChairman: 'Chairman of the Council of People’s Commissars',
    },
    government: {
      ...state.government,
      type: 'Council Republic',
      typeZh: '委员会共和国',
      president: 'CEC Chairman',
      presidentZh: '中央执行委员会主席',
      primeMinister: 'Commissar Chairman',
      primeMinisterZh: '人民委员会议主席',
    },
    ministers: buildAiCommissars(state, cecSeats),
    leverage: canEnterCabinet ? leverage : 0,
    cntStance: canEnterCabinet ? 'govern' : 'cooperate',
  };
};
