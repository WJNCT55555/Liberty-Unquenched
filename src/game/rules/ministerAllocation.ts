import type { Ministers, Party } from '../types';

/**
 * Canonical cost of every cabinet portfolio.
 *
 * The 1931 cabinet negotiation and every later election share this table. The
 * total is deliberately 100 so a party's seat share can be converted into a
 * cabinet bargaining budget without a second scale.
 */
export const MINISTER_COSTS: Record<keyof Ministers, number> = {
  labor: 5,
  health: 5,
  justice: 10,
  industry: 10,
  commerce: 5,
  interior: 15,
  war: 15,
  agriculture: 5,
  education: 5,
  publicWorks: 10,
  finance: 10,
  estado: 5,
};

export const TOTAL_MINISTER_COST = Object.values(MINISTER_COSTS)
  .reduce((sum, cost) => sum + cost, 0);

/** Cheapest portfolio. A party below this cannot enter the cabinet at all. */
export const MINISTER_MINIMUM_COST = Math.min(...Object.values(MINISTER_COSTS));

/** The 1931 Constituent Cortes had 470 seats; the 1933/1936 Cortes had 473. */
export const TOTAL_CORTES_SEATS = 470;

/** The 1931 founding election keeps its hand-authored special budget. */
export const FIRST_ELECTION_MINISTER_LEVERAGE = 15;

/**
 * Cabinet bargaining budget.
 *
 * - 1931 founding election: fixed 15, even though the CNT has no PRRevS seats.
 * - Every later election: `floor(PRRevS seats / totalSeats × 100)`.
 *   A party with no PRRevS organization or no seats receives 0 and must not
 *   trigger the minister-allocation event.
 */
export const getMinisterLeverage = (
  cortes: Partial<Record<Party, number>>,
  firstElection = false,
  totalSeats: number = TOTAL_CORTES_SEATS,
): number => {
  if (firstElection) return FIRST_ELECTION_MINISTER_LEVERAGE;
  const prrevsSeats = cortes.PRRevS ?? 0;
  if (prrevsSeats <= 0) return 0;
  return Math.max(0, Math.floor((prrevsSeats / totalSeats) * TOTAL_MINISTER_COST));
};
