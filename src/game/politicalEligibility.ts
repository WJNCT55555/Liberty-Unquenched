import type { CoalitionMember, GameState, OrganizationId, Party } from './types';

export const WARTIME_PARTY_STATUS = {
  AP: 'excluded', RE: 'excluded', CT: 'excluded', FE: 'excluded',
  PRR: 'withdrawn', DLR: 'withdrawn',
} as const;

/** Eligibility never rewrites class support, historical seats or enemy organizations. */
export const isRepublicanPartyEligible = (state: GameState, party: CoalitionMember): boolean => {
  if (state.iberianDefense && (party === 'CNT_FAI' || (party === 'POUM' && state.iberianDefense.allies.poum))) return false;
  if (party === 'CNT_FAI') return true;
  return !state.republicanPartyStatus?.[party]
    && !(state.wartimePowerArrangement && party in WARTIME_PARTY_STATUS);
};

export const isRepublicanPartyPresent = (state: GameState, party: CoalitionMember): boolean => {
  if (!isRepublicanPartyEligible(state, party)) return false;
  if (party === 'CNT_FAI' || party === 'Other') return true;
  const organization = state.organizations?.[party as OrganizationId];
  if (organization) return organization.established && (!organization.status || organization.status === 'active');
  if (party === 'POUM') return Boolean(state.poum_founded);
  if (party === 'PS') return Boolean(state.ps_founded);
  if (party === 'FE') return Boolean(state.fe_founded);
  return party !== 'PRRevS';
};

export const getEffectiveCortes = (
  state: GameState,
  seats: Record<Party, number> = state.cortes || {} as Record<Party, number>,
): Record<Party, number> => Object.fromEntries(
  Object.entries(seats).map(([party, count]) => [
    party, isRepublicanPartyEligible(state, party as Party) ? count : 0,
  ]),
) as Record<Party, number>;

export const getVacantCortesSeats = (state: GameState): number => Object.entries(state.cortes || {})
  .reduce((sum, [party, seats]) => sum + (isRepublicanPartyEligible(state, party as Party) ? 0 : seats), 0);
