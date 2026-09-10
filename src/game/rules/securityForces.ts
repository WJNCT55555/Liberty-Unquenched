import type { GameState } from '../types';

/**
 * The Assault Guard (Guardia de Asalto) was a corps the Republic created itself
 * after April 1931, not an institution inherited from the monarchy. Its
 * existence is therefore owned by the Security Corps Law: level 0 (Civil Guard
 * dominance) means the corps has not been raised yet, and every level above it
 * maintains the same establishment. Later levels change the corps' political
 * role and loyalty, not its size.
 *
 * This constant is a game parameter, not a historical headcount. It is kept
 * roughly at a quarter of the Civil Guard's 30,000 so the two corps stay
 * distinguishable.
 */
export const GUARDIA_ASALTO_ESTABLISHMENT = 8000;

const clampSecurityCorpsLawLevel = (level: number): number => {
  if (!Number.isFinite(level)) return 0;
  return Math.max(0, Math.min(4, Math.round(level)));
};

/** Establishment strength the Security Corps Law grants the Assault Guard. */
export const getGuardiaAsaltoManpower = (securityCorpsLawLevel: number): number =>
  clampSecurityCorpsLawLevel(securityCorpsLawLevel) >= 1 ? GUARDIA_ASALTO_ESTABLISHMENT : 0;

/**
 * Keeps `armedForces.guardiaAsalto.manpower` in sync with the Security Corps
 * Law. This module is the only writer of that field, so cards, events and the
 * sandbox may advance the law without duplicating the establishment values.
 */
export const applySecurityForcesDerivedState = (state: GameState): GameState => {
  const guardiaAsalto = state.armedForces?.guardiaAsalto;
  if (!guardiaAsalto) return state;

  const manpower = getGuardiaAsaltoManpower(Number(state.domesticPolicy?.security_corps_law) || 0);
  if (guardiaAsalto.manpower === manpower) return state;

  return {
    ...state,
    armedForces: {
      ...state.armedForces,
      guardiaAsalto: { ...guardiaAsalto, manpower },
    },
  };
};
