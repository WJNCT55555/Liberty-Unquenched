import type { Party } from './parties';

// Shared display order along the game's left-to-right ideological spectrum.
// PRRevS represents the CNT's electoral wing and belongs on the left. Other
// is a mixed electoral bucket, placed at the centre/right boundary for display.
// This order must not be used to calculate election results or coalitions.
export const PARLIAMENT_PARTY_ORDER: readonly Party[] = [
  'POUM', 'PCE', 'PRRevS', 'PSOE', 'PS', 'ERC', 'IR', 'UR',
  'PNV', 'PRR', 'DLR', 'Other', 'AP', 'RE', 'CT', 'FE',
];

export function getParliamentSeatEntries(
  cortes: Readonly<Partial<Record<Party, number>>>,
): [Party, number][] {
  return PARLIAMENT_PARTY_ORDER.flatMap(party => {
    const seats = cortes[party] ?? 0;
    return seats > 0 ? [[party, seats] as [Party, number]] : [];
  });
}
