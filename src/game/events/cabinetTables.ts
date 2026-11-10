import type { CoalitionId, MinisterParty, Ministers } from '../types';

export type CabinetTable = Record<keyof Ministers, MinisterParty>;

export type GovernmentProfileId =
  | 'provisional_government'
  | 'republican_socialist'
  | 'popular_front'
  | 'radical_ceda'
  | 'national_front'
  | 'workers_alliance'
  | 'prrevs_parliamentary_majority'
  | 'republican_coalition';

/**
 * Party-level baseline cabinets for every government profile.
 *
 * These are deliberately party-level, not individual names: the game only
 * stores `MinisterParty`. `national_front` is a counterfactual proxy because
 * the historical National Front never formed a government (1936: it lost;
 * 1933: CEDA supported a Radical government rather than leading one).
 */
export const HISTORICAL_CABINETS: Record<GovernmentProfileId, CabinetTable> = {
  provisional_government: {
    labor: 'PSOE',
    health: 'PSOE',
    justice: 'PSOE',
    industry: 'Other',
    commerce: 'Other',
    interior: 'DLR',
    war: 'Other',
    agriculture: 'Other',
    education: 'Other',
    publicWorks: 'Other',
    finance: 'PSOE',
    estado: 'PRR',
  },
  republican_socialist: {
    labor: 'PSOE',
    health: 'PSOE',
    justice: 'PSOE',
    industry: 'Other',
    commerce: 'Other',
    interior: 'IR',
    war: 'IR',
    agriculture: 'IR',
    education: 'IR',
    publicWorks: 'PSOE',
    finance: 'PSOE',
    estado: 'PRR',
  },
  popular_front: {
    labor: 'ERC',
    health: 'ERC',
    justice: 'UR',
    industry: 'Other',
    commerce: 'Other',
    interior: 'IR',
    war: 'IR',
    agriculture: 'IR',
    education: 'IR',
    publicWorks: 'IR',
    finance: 'IR',
    estado: 'IR',
  },
  radical_ceda: {
    labor: 'PRR',
    health: 'PRR',
    justice: 'PRR',
    industry: 'PRR',
    commerce: 'PRR',
    interior: 'PRR',
    war: 'PRR',
    agriculture: 'AP',
    education: 'PRR',
    publicWorks: 'PRR',
    finance: 'PRR',
    estado: 'PRR',
  },
  national_front: {
    labor: 'AP',
    health: 'AP',
    justice: 'CT',
    industry: 'RE',
    commerce: 'RE',
    interior: 'AP',
    war: 'Other',
    agriculture: 'CT',
    education: 'AP',
    publicWorks: 'RE',
    finance: 'AP',
    estado: 'AP',
  },
  workers_alliance: {
    labor: 'PSOE',
    health: 'PSOE',
    justice: 'PSOE',
    industry: 'PSOE',
    commerce: 'PSOE',
    interior: 'PSOE',
    war: 'PSOE',
    agriculture: 'PCE',
    education: 'PCE',
    publicWorks: 'PSOE',
    finance: 'PSOE',
    estado: 'PSOE',
  },
  prrevs_parliamentary_majority: {
    labor: 'CNT',
    health: 'CNT',
    justice: 'CNT',
    industry: 'CNT',
    commerce: 'CNT',
    interior: 'CNT',
    war: 'CNT',
    agriculture: 'CNT',
    education: 'CNT',
    publicWorks: 'CNT',
    finance: 'CNT',
    estado: 'CNT',
  },
  republican_coalition: {
    labor: 'PRR',
    health: 'PRR',
    justice: 'IR',
    industry: 'PRR',
    commerce: 'PRR',
    interior: 'IR',
    war: 'IR',
    agriculture: 'IR',
    education: 'IR',
    publicWorks: 'IR',
    finance: 'PRR',
    estado: 'PRR',
  },
};

export const getCabinetTable = (coalitionId: CoalitionId): CabinetTable => {
  switch (coalitionId) {
    case 'provisional_government':
      return HISTORICAL_CABINETS.provisional_government;
    case 'republican_socialist':
      return HISTORICAL_CABINETS.republican_socialist;
    case 'popular_front':
      return HISTORICAL_CABINETS.popular_front;
    case 'ceda_radical':
      return HISTORICAL_CABINETS.radical_ceda;
    case 'national_front':
      return HISTORICAL_CABINETS.national_front;
    case 'workers_alliance':
      return HISTORICAL_CABINETS.workers_alliance;
    case 'prrevs_parliamentary_majority':
      return HISTORICAL_CABINETS.prrevs_parliamentary_majority;
    default:
      return HISTORICAL_CABINETS.republican_coalition;
  }
};
