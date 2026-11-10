import type { GameState, Party, SocialClass } from '../types';
import { ORGANIZATION_DEFINITIONS } from '../organizations';
import { adjustClassSupport, updateCoalitions } from '../utils';

/**
 * Shared party-eligibility helpers for the post-war settlements (the Asturias
 * victory chain and the non-split Republican victory chain). Both chains outlaw
 * parties and can fold one party's class support into another, so the mechanics
 * live here instead of in either content file.
 */

export const ALL_PARTIES: Party[] = [
  'POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR',
  'AP', 'RE', 'CT', 'FE', 'FET', 'PRRevS',
];

export const RIGHT_WING_PARTIES: Party[] = ['PRR', 'DLR', 'AP', 'RE', 'CT', 'FE'];
export const LEFT_REPUBLICAN_PARTIES: Party[] = ['IR', 'UR'];
export const REGIONAL_PARTIES: Party[] = ['PNV', 'ERC'];

/** Move one party's class support into another before the source is outlawed. */
export const mergePartySupport = (
  state: GameState,
  from: Exclude<Party, 'PRRevS'>,
  to: Exclude<Party, 'PRRevS'>,
): GameState['classes'] => {
  let classes = state.classes;
  for (const socialClass of Object.keys(classes) as SocialClass[]) {
    const amount = classes[socialClass].support[from] ?? 0;
    if (amount > 0) classes = adjustClassSupport(classes, socialClass, to, amount, [from]);
  }
  return classes;
};

/**
 * Outlaw a set of parties and dissolve their organizations, except for the parties
 * that a settlement turns into unions (their organizations keep their members).
 * Coalition membership is recomputed because eligibility derives from this status.
 */
export const excludeParties = (
  state: GameState,
  parties: Party[],
  keepOrganizations: Party[] = [],
): Partial<GameState> => {
  if (!parties.length) return {};
  const republicanPartyStatus = { ...state.republicanPartyStatus };
  for (const party of parties) republicanPartyStatus[party] = 'excluded';

  const organizations = { ...state.organizations };
  for (const definition of ORGANIZATION_DEFINITIONS) {
    const owner = definition.owner;
    if (owner === 'CNT_FAI' || !parties.includes(owner as Party) || keepOrganizations.includes(owner as Party)) continue;
    const current = organizations[definition.id];
    if (current?.established) organizations[definition.id] = { ...current, status: 'dissolved' };
  }
  // PRRevS is owned by CNT_FAI, so the owner loop above never reaches it; outlawing
  // the party must still dissolve its organization.
  if (parties.includes('PRRevS')) {
    const current = organizations.PRRevS;
    if (current?.established) organizations.PRRevS = { ...current, status: 'dissolved' };
  }

  const next = { ...state, republicanPartyStatus, organizations } as GameState;
  return { republicanPartyStatus, organizations, activeCoalitions: updateCoalitions(next) };
};
