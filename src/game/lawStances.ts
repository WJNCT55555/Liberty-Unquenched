import {
  GameState,
  LawId,
  LawStance,
  LawStanceModifier,
  LegalStanceParty,
  PoliticalActor,
  Party,
} from './types';
import { POLICY_DEFINITIONS, POLICY_STANCE_PREFERENCES, type PolicyCategory, type PolicyDefinition } from './rules/policyDefinitions';
import { isOrganizationEstablished } from './organizations';

export const LAW_STANCE_SCORE: Record<LawStance, number> = {
  strongly_support: 8,
  support: 4,
  neutral: 0,
  oppose: -4,
  strongly_oppose: -8,
};

export const LEGAL_STANCE_PARTIES: LegalStanceParty[] = [
  'POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV',
  'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE',
];

export type LawCategory = PolicyCategory;
export type LawDefinition = PolicyDefinition;
export { POLICY_DEFINITIONS };

// Backwards-compatible name used by the legal stance panel and older content.
export const LAW_DEFINITIONS = POLICY_DEFINITIONS;
const LAW_BY_ID = Object.fromEntries(LAW_DEFINITIONS.map(def => [def.id, def])) as Record<LawId, LawDefinition>;
export const LAW_LEVEL_LIMITS = Object.fromEntries(
  LAW_DEFINITIONS.map(definition => [definition.id, definition.levels.length - 1])
) as Record<LawId, number>;

export const clampLawLevel = (lawId: LawId, value: number) => {
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(0, Math.min(LAW_LEVEL_LIMITS[lawId], rounded));
};

export const normalizeDomesticPolicyLawLevels = (
  domesticPolicy: GameState['domesticPolicy']
): GameState['domesticPolicy'] => {
  const normalized = { ...domesticPolicy };
  for (const definition of LAW_DEFINITIONS) {
    normalized[definition.id] = clampLawLevel(definition.id, Number(domesticPolicy[definition.id] || 0));
  }
  return normalized;
};

const clampPreference = (score: number) => Math.max(-10, Math.min(10, Math.round(score)));

// Kept as a compatibility alias; policy levels now own the baseline stance scores.
export const BASELINE_LAW_PREFERENCES = POLICY_STANCE_PREFERENCES;

const scoreToStance = (score: number): LawStance => {
  const clamped = clampPreference(score);
  if (clamped >= 7) return 'strongly_support';
  if (clamped >= 2) return 'support';
  if (clamped <= -7) return 'strongly_oppose';
  if (clamped <= -2) return 'oppose';
  return 'neutral';
};

const stanceToScore = (stance: LawStance) => LAW_STANCE_SCORE[stance];

export const isCNTParliamentaryActor = (state: GameState, cortes?: Record<Party, number>) => {
  const prrevsSeats = cortes?.PRRevS || state.cortes?.PRRevS || 0;
  return state.cntStance === 'govern' || (isOrganizationEstablished(state, 'PRRevS') && prrevsSeats > 0);
};

export const isLegalStancePartyPresent = (state: GameState, party: LegalStanceParty) => {
  // These identities are created by explicit historical events.  The
  // remaining legal parties exist from the start of the Republic.
  if (party === 'POUM') return Boolean(state.poum_founded);
  if (party === 'PS') return Boolean(state.ps_founded);
  if (party === 'FE') return Boolean(state.fe_founded);
  return true;
};

export const getLegalStanceActors = (state: GameState, cortes?: Record<Party, number>): PoliticalActor[] => {
  // CNT is always selectable as a political actor, even while it remains
  // outside parliament.  Its seat weight is still resolved separately.
  return [
    ...LEGAL_STANCE_PARTIES.filter(party => isLegalStancePartyPresent(state, party)),
    'CNT_FAI',
  ];
};

export const getLegalActorSeats = (state: GameState, actor: PoliticalActor, cortes?: Record<Party, number>) => {
  if (actor === 'CNT_FAI') return cortes?.PRRevS || state.cortes?.PRRevS || 0;
  return cortes?.[actor] || state.cortes?.[actor] || 0;
};

export const getLawDefinition = (lawId: LawId) => LAW_BY_ID[lawId];

export const getBaselineLawStanceScore = (actor: PoliticalActor, lawId: LawId, targetLevel: number) => {
  const definition = LAW_BY_ID[lawId];
  const maxLevel = definition.levels.length - 1;
  const level = clampLawLevel(lawId, targetLevel);
  const levelDefinition = definition.levels[Math.max(0, Math.min(maxLevel, level))];
  return clampPreference(levelDefinition?.stanceChanges?.[actor] ?? 0);
};

const isModifierActive = (state: GameState, modifier: LawStanceModifier) => {
  if (modifier.expiresAtMonth === undefined) return true;
  const currentMonth = state.year * 12 + state.month;
  return currentMonth <= modifier.expiresAtMonth;
};

export const getEffectiveLawStanceScore = (state: GameState, actor: PoliticalActor, lawId: LawId, targetLevel: number) => {
  let score = getBaselineLawStanceScore(actor, lawId, targetLevel);
  const modifiers = state.lawStanceModifiers.filter(modifier =>
    modifier.actor === actor &&
    modifier.lawId === lawId &&
    isModifierActive(state, modifier) &&
    (modifier.targetLevel === undefined || modifier.targetLevel === 'all' || modifier.targetLevel === targetLevel)
  );

  const overrides = modifiers.filter(modifier => modifier.override !== undefined);
  if (overrides.length > 0) score = stanceToScore(overrides[overrides.length - 1].override!);
  score += modifiers.reduce((sum, modifier) => sum + (modifier.delta || 0), 0);
  return clampPreference(score);
};

export const getEffectiveLawStance = (state: GameState, actor: PoliticalActor, lawId: LawId, targetLevel: number): LawStance => {
  return scoreToStance(getEffectiveLawStanceScore(state, actor, lawId, targetLevel));
};

/** Return a partial state suitable for a card/event option effect. */
export const applyLawStanceModifier = (state: GameState, modifier: LawStanceModifier): Partial<GameState> => ({
  lawStanceModifiers: [...state.lawStanceModifiers, modifier],
});

// Alias used by future card/event effects.  Keeping one implementation avoids
// direct nested mutation of GameState in individual content files.
export const adjustLawStance = applyLawStanceModifier;

export interface PartyLawSatisfaction {
  overall: number;
  byCategory: Record<LawCategory, number>;
  contributions: Record<LawId, number>;
}

export const getPartyLawSatisfaction = (state: GameState, actor: PoliticalActor): PartyLawSatisfaction => {
  const categoryTotals: Record<LawCategory, { weighted: number; weight: number }> = {
    economy: { weighted: 0, weight: 0 },
    society: { weighted: 0, weight: 0 },
    security: { weighted: 0, weight: 0 },
  };
  const contributions = {} as Record<LawId, number>;

  for (const definition of LAW_DEFINITIONS) {
    const currentLevel = Number(state.domesticPolicy[definition.id] || 0);
    const level = Math.max(0, Math.min(definition.levels.length - 1, currentLevel));
    const score = getEffectiveLawStanceScore(state, actor, definition.id, level);
    // Equal weight is the first-pass rule.  Keeping the calculation here
    // makes future per-law importance weights easy to add without changing UI.
    const contribution = Math.round((score / 10) * 100);
    contributions[definition.id] = contribution;
    categoryTotals[definition.category].weighted += contribution;
    categoryTotals[definition.category].weight += 1;
  }

  const byCategory = {
    economy: Math.round(categoryTotals.economy.weighted / categoryTotals.economy.weight),
    society: Math.round(categoryTotals.society.weighted / categoryTotals.society.weight),
    security: Math.round(categoryTotals.security.weighted / categoryTotals.security.weight),
  };
  const totalWeighted = Object.values(categoryTotals).reduce((sum, item) => sum + item.weighted, 0);
  const totalWeight = Object.values(categoryTotals).reduce((sum, item) => sum + item.weight, 0);
  return { overall: Math.round(totalWeighted / totalWeight), byCategory, contributions };
};

export const getParliamentWeightedLawSatisfaction = (state: GameState, cortes?: Record<Party, number>) => {
  const actors = getLegalStanceActors(state, cortes);
  const weighted = actors.reduce((sum, actor) => sum + getPartyLawSatisfaction(state, actor).overall * getLegalActorSeats(state, actor, cortes), 0);
  const seats = actors.reduce((sum, actor) => sum + getLegalActorSeats(state, actor, cortes), 0);
  return seats > 0 ? Math.round(weighted / seats) : 0;
};
