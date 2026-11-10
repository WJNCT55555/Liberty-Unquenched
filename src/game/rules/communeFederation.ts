import type {
  CommitteeStrategy,
  CntFaction,
  GameState,
  MinisterParty,
  Ministers,
} from '../types';
import { buildCongressSeats, type CouncilSeats } from './councilRepublic';

const COMMISSIONS: (keyof Ministers)[] = [
  'industry', 'commerce', 'labor', 'health', 'agriculture', 'publicWorks',
  'education', 'justice', 'interior', 'war', 'finance', 'estado',
];

const CNT_COMMISSION_COUNT: Record<CommitteeStrategy, number> = {
  commune_primacy: 7,
  union_primacy: 9,
  united_front: 6,
  coordination_primacy: 6,
};

const ECONOMIC_COMMISSIONS = new Set<keyof Ministers>(['industry', 'commerce', 'publicWorks', 'finance']);
const SOCIAL_COMMISSIONS = new Set<keyof Ministers>(['labor', 'health', 'education', 'agriculture']);
const POLITICAL_COMMISSIONS = new Set<keyof Ministers>(['justice', 'interior', 'war', 'estado']);

const factionForCommission = (
  office: keyof Ministers,
  strategy: CommitteeStrategy,
  index: number,
): CntFaction => {
  if (strategy === 'commune_primacy') {
    if (SOCIAL_COMMISSIONS.has(office)) return 'Faistas';
    if (POLITICAL_COMMISSIONS.has(office)) return 'Jabalistas';
    return 'Puristas';
  }
  if (strategy === 'union_primacy') {
    if (ECONOMIC_COMMISSIONS.has(office)) return 'Treintistas';
    if (SOCIAL_COMMISSIONS.has(office)) return 'Puristas';
    return 'Jabalistas';
  }
  if (strategy === 'coordination_primacy') {
    if (ECONOMIC_COMMISSIONS.has(office)) return 'Jabalistas';
    if (SOCIAL_COMMISSIONS.has(office)) return 'Faistas';
    return 'Treintistas';
  }
  // united_front: distribute across all four tendencies.
  return (['Faistas', 'Treintistas', 'Puristas', 'Jabalistas'] as CntFaction[])[index % 4];
};

const buildCommissions = (
  congressSeats: CouncilSeats,
  strategy: CommitteeStrategy,
): Ministers => {
  const ministers: Ministers = {
    labor: 'Other', health: 'Other', justice: 'Other', industry: 'Other',
    commerce: 'Other', interior: 'Other', war: 'Other', agriculture: 'Other',
    education: 'Other', publicWorks: 'Other', finance: 'Other', estado: 'Other',
  };
  const cntCount = CNT_COMMISSION_COUNT[strategy];
  const cntOffices = COMMISSIONS.slice(0, cntCount);

  cntOffices.forEach((office) => {
    ministers[office] = 'CNT';
  });

  const partyOrder = Object.entries(congressSeats)
    .filter(([actor, seats]) => actor !== 'CNT' && seats > 0)
    .sort((left, right) => right[1] - left[1])
    .map(([actor]) => actor as MinisterParty);

  let partyIndex = 0;
  COMMISSIONS.slice(cntCount).forEach((office) => {
    ministers[office] = partyOrder[partyIndex % Math.max(1, partyOrder.length)] ?? 'Other';
    partyIndex += 1;
  });

  return ministers;
};

export const buildCommuneGovernment = (
  state: GameState,
  strategy: CommitteeStrategy = 'united_front',
): Partial<GameState> => {
  const congressSeats = buildCongressSeats(state);
  const ministers = buildCommissions(congressSeats, strategy);
  const commissionFactions: Partial<Record<keyof Ministers, CntFaction>> = {};
  COMMISSIONS
    .filter((office) => ministers[office] === 'CNT')
    .forEach((office, index) => {
      commissionFactions[office] = factionForCommission(office, strategy, index);
    });

  return {
    polity: {
      type: 'free_commune_federation',
      since: { year: state.year, month: state.month },
      congressSeats,
      committeeStrategy: strategy,
      commissionFactions,
    },
    government: {
      ...state.government,
      type: 'Free Commune Federation',
      typeZh: '自由公社联邦',
      president: '—',
      presidentZh: '—',
      primeMinister: '—',
      primeMinisterZh: '—',
    },
    ministers,
    leverage: 0,
    cntStance: Object.values(ministers).some((party) => party === 'CNT') ? 'govern' : 'cooperate',
  };
};

export const COMMISSION_ORDER = COMMISSIONS;
