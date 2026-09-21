import type { GameState } from '../types';

/**
 * The Security Corps Law owns the state's police entirely: which corps exist, how
 * strong they are, and how reliable they are. This module is the only writer of
 * those fields, so cards and events may advance the law without duplicating any of
 * these numbers.
 *
 * Level history:
 *   0 Civil Guard dominance — only the Civil Guard exists.
 *   1 Assault Guards raised  — the Republic adds its own urban corps.
 *   2 Loyalty purge          — deliberately the SAME two corps, an intermediate
 *                              step so the law cannot leap straight to a merger.
 *   3 Reorganisation         — both corps merge into one Republican Guard.
 *   4 Workers' patrols       — the Republican Guard is dissolved and replaced by
 *                              Catalan-style workers' patrols.
 */
export const SECURITY_CORPS_IDS = [
  'guardiaNacional',
  'guardiaAsalto',
  'guardiaRepublicana',
  'patrullasObreras',
] as const;

export type SecurityCorpsId = typeof SECURITY_CORPS_IDS[number];

export interface SecurityCorpsState {
  manpower: number;
  loyalty: number;
}

export type SecurityForcesState = Record<SecurityCorpsId, SecurityCorpsState>;

/** Historical manpower of the Civil Guard, the corps the Republic inherited. */
export const GUARDIA_NACIONAL_ESTABLISHMENT = 30000;
/** The Assault Guard was a small elite urban corps, not a second gendarmerie. */
export const GUARDIA_ASALTO_ESTABLISHMENT = 8000;
/** Workers' patrols are a militia-scale replacement for the dissolved guard. */
export const WORKER_PATROL_ESTABLISHMENT = 12000;

const ABSENT: SecurityCorpsState = { manpower: 0, loyalty: 0 };

const corps = (
  guardiaNacional: SecurityCorpsState,
  guardiaAsalto: SecurityCorpsState,
  guardiaRepublicana: SecurityCorpsState,
  patrullasObreras: SecurityCorpsState,
): SecurityForcesState => ({ guardiaNacional, guardiaAsalto, guardiaRepublicana, patrullasObreras });

/**
 * Corps composition by law level. The law owns WHICH corps exist and how strong
 * they are; it does not own their loyalty, because the Police Affairs card is what
 * raises that between legal reforms. Level 3 merges both corps without losing men
 * (30,000 + 8,000 = 38,000).
 */
export const SECURITY_FORCES_BY_LAW_LEVEL: SecurityForcesState[] = [
  corps({ manpower: GUARDIA_NACIONAL_ESTABLISHMENT, loyalty: 0 }, ABSENT, ABSENT, ABSENT),
  corps(
    { manpower: GUARDIA_NACIONAL_ESTABLISHMENT, loyalty: 0 },
    { manpower: GUARDIA_ASALTO_ESTABLISHMENT, loyalty: 0 },
    ABSENT,
    ABSENT,
  ),
  corps(
    { manpower: GUARDIA_NACIONAL_ESTABLISHMENT, loyalty: 0 },
    { manpower: GUARDIA_ASALTO_ESTABLISHMENT, loyalty: 0 },
    ABSENT,
    ABSENT,
  ),
  corps(ABSENT, ABSENT, { manpower: GUARDIA_NACIONAL_ESTABLISHMENT + GUARDIA_ASALTO_ESTABLISHMENT, loyalty: 0 }, ABSENT),
  corps(ABSENT, ABSENT, ABSENT, { manpower: WORKER_PATROL_ESTABLISHMENT, loyalty: 0 }),
];

/**
 * Loyalty a corps starts with the moment the law raises it. Afterwards loyalty is
 * ordinary state the player moves through the Police Affairs card.
 */
export const SECURITY_CORPS_BASE_LOYALTY: Record<SecurityCorpsId, number> = {
  guardiaNacional: 35,
  guardiaAsalto: 70,
  guardiaRepublicana: 74,
  patrullasObreras: 85,
};

/** Display data for every corps; the sidebar renders whatever currently exists. */
export const SECURITY_CORPS_INFO: Record<SecurityCorpsId, { en: string; zh: string; color: string }> = {
  guardiaNacional: { en: 'Guardia Civil', zh: '国民警卫队', color: 'bg-blue-800' },
  guardiaAsalto: { en: 'Guardia de Asalto', zh: '突击卫队', color: 'bg-blue-500' },
  guardiaRepublicana: { en: 'Guardia Republicana', zh: '共和国警卫队', color: 'bg-republic-purple' },
  patrullasObreras: { en: 'Patrullas Obreras', zh: '工人巡逻队', color: 'bg-cnt-red' },
};

const clampLawLevel = (level: number): number => {
  if (!Number.isFinite(level)) return 0;
  return Math.max(0, Math.min(SECURITY_FORCES_BY_LAW_LEVEL.length - 1, Math.round(level)));
};

/** The police the Security Corps Law provides, with merged and dissolved corps applied. */
export const getSecurityForces = (securityCorpsLawLevel: number): SecurityForcesState =>
  SECURITY_FORCES_BY_LAW_LEVEL[clampLawLevel(securityCorpsLawLevel)];

/**
 * Keeps the police corps in sync with the Security Corps Law.
 *
 * The law owns which corps exist and how strong they are, so manpower is rewritten
 * from the table on every pass. Loyalty is NOT: it is raised by the Police Affairs
 * card and only set here when a corps is first raised or when two corps merge.
 * Fields an older save does not carry yet are created, so loading is self-healing.
 */
export const applySecurityForcesDerivedState = (state: GameState): GameState => {
  if (!state.armedForces) return state;

  const next = getSecurityForces(Number(state.domesticPolicy?.security_corps_law) || 0);
  const current = state.armedForces;
  const nextForces = {} as SecurityForcesState;

  SECURITY_CORPS_IDS.forEach((id) => {
    const manpower = next[id].manpower;
    if (manpower <= 0) {
      nextForces[id] = { manpower: 0, loyalty: 0 };
      return;
    }
    // A corps that already holds men keeps the loyalty the player built up.
    const existing = current[id];
    const loyalty = existing && existing.manpower > 0 && existing.loyalty > 0
      ? existing.loyalty
      : SECURITY_CORPS_BASE_LOYALTY[id];
    nextForces[id] = { manpower, loyalty };
  });

  // Merging the two corps carries their men and their reliability into the guard.
  const mergedManpower = current.guardiaNacional.manpower + current.guardiaAsalto.manpower;
  if (nextForces.guardiaRepublicana.manpower > 0 && mergedManpower > 0) {
    nextForces.guardiaRepublicana = {
      manpower: nextForces.guardiaRepublicana.manpower,
      loyalty: Math.round(
        (current.guardiaNacional.manpower * current.guardiaNacional.loyalty
          + current.guardiaAsalto.manpower * current.guardiaAsalto.loyalty) / mergedManpower,
      ),
    };
  }

  const unchanged = SECURITY_CORPS_IDS.every((id) => (
    current[id]?.manpower === nextForces[id].manpower && current[id]?.loyalty === nextForces[id].loyalty
  ));
  if (unchanged) return state;

  return { ...state, armedForces: { ...current, ...nextForces } };
};

/** Raises one corps' loyalty, which is the Police Affairs card's main lever. */
export const raiseSecurityCorpsLoyalty = (
  state: GameState,
  corpsId: SecurityCorpsId,
  delta: number,
): Partial<GameState> => {
  const armedForces = state.armedForces;
  if (!armedForces) return {};
  const current = armedForces[corpsId];
  return {
    armedForces: {
      ...armedForces,
      [corpsId]: {
        ...current,
        loyalty: Math.max(0, Math.min(100, current.loyalty + delta)),
      },
    },
  };
};
