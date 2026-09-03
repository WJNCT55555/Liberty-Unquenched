import type { GameState, LawId } from '../types';
import { adjustClassSupport } from '../utils';
import { POLICY_DEFINITION_BY_ID, type PolicyCondition, type PolicyModifier } from './policyDefinitions';

export interface MonthlyPolicyEffects {
  stats: GameState['stats'];
  classes: GameState['classes'];
  relations: GameState['relations'];
  domesticPolicy: GameState['domesticPolicy'];
  coupProgress: number;
}

export interface MonthlyPolicyOptions {
  landLawLevel?: number;
  landReformPaused?: boolean;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const roundTo = (value: number, decimals: number): number => Number(value.toFixed(decimals));
type StatKey = keyof GameState['stats'];

const conditionSatisfied = (
  condition: PolicyCondition,
  state: GameState,
  landReformPaused: boolean,
): boolean => {
  if (condition.kind === 'coupActive') return state.coupSystemActive;
  if (condition.kind === 'ateneosEstablished') return state.ateneos_established >= (condition.minimum ?? 1);
  if (condition.kind === 'mixedJuryOpposed') return state.domesticPolicy.mixed_jury_cnt_opposed;
  if (condition.kind === 'landReformFunded') return !landReformPaused;
  return true;
};

/** Computes all policy-driven monthly changes from POLICY_DEFINITIONS. */
export const calculateMonthlyPolicyEffects = (
  state: GameState,
  options: MonthlyPolicyOptions = {},
): MonthlyPolicyEffects => {
  let stats = { ...state.stats };
  let classes = state.classes;
  let relations = { ...state.relations };
  let domesticPolicy = { ...state.domesticPolicy };
  let coupProgress = state.coupProgress;
  const aggregatedStatDeltas: Partial<Record<StatKey, number>> = {};

  const landLawLevel = options.landLawLevel
    ?? (domesticPolicy.land_law ?? (domesticPolicy.land_reform_law_enabled ? 1 : 0));
  const landReformPaused = options.landReformPaused
    ?? (landLawLevel === 1 && (state.budget ?? 12) <= 0);

  const applyModifier = (modifier: PolicyModifier, aggregateStats = false) => {
    if (modifier.conditions?.some(condition => !conditionSatisfied(condition, state, landReformPaused))) return;

    if (modifier.kind === 'stat') {
      if (aggregateStats) {
        aggregatedStatDeltas[modifier.target] = (aggregatedStatDeltas[modifier.target] ?? 0) + modifier.delta;
        return;
      }
      const current = stats[modifier.target] ?? 0;
      stats = { ...stats, [modifier.target]: clampPercent(current + modifier.delta) };
    } else if (modifier.kind === 'classSupport') {
      const scale = modifier.scaleBy === 'ateneos_established' ? state.ateneos_established : 1;
      classes = adjustClassSupport(classes, modifier.targetClass, modifier.targetForce, modifier.delta * scale);
    } else if (modifier.kind === 'relation') {
      relations = {
        ...relations,
        [modifier.target]: clampPercent((relations[modifier.target] ?? 0) + modifier.delta),
      };
    } else if (modifier.kind === 'economy') {
      // Economy modifiers are consumed by calculateMonthlyEconomy. Keeping
      // them in the shared definition prevents policy cards and previews from
      // maintaining a second set of policy-level values.
    } else if (modifier.kind === 'coupProgress') {
      coupProgress = roundTo(clampPercent(coupProgress + modifier.delta), 2);
    } else if (modifier.kind === 'landProgress') {
      domesticPolicy = {
        ...domesticPolicy,
        land_reform_progress: roundTo(Math.min(100, domesticPolicy.land_reform_progress + modifier.delta), 2),
      };
    }
  };

  const applyPolicyModifiers = (policyId: LawId, level: number, aggregateStats = false) => {
    const levelDefinition = POLICY_DEFINITION_BY_ID[policyId].levels.find(item => item.level === level);
    levelDefinition?.monthlyModifiers?.forEach(modifier => applyModifier(modifier, aggregateStats));
  };

  // Labor laws historically combine their stat deltas before clamping. This
  // matters at 0/100 boundaries where applying each modifier independently
  // would discard an opposing modifier (for example +1 followed by -1).
  applyPolicyModifiers('max_hours_law', domesticPolicy.max_hours_law, true);
  applyPolicyModifiers('workplace_safety', domesticPolicy.workplace_safety, true);
  if (Object.keys(aggregatedStatDeltas).length > 0) {
    stats = {
      ...stats,
      ...(Object.keys(aggregatedStatDeltas) as StatKey[]).reduce<Partial<GameState['stats']>>((result, target) => {
        const delta = aggregatedStatDeltas[target] ?? 0;
        result[target] = roundTo(clampPercent((stats[target] ?? 0) + delta), 2);
        return result;
      }, {}),
    };
  }

  if (!state.coupSystemActive) {
    coupProgress = 0;
  } else {
    const tension = stats.tension !== undefined ? stats.tension : 34;
    const armyLoyalty = stats.armyLoyalty !== undefined ? stats.armyLoyalty : 50;
    const monthlyCoupDelta = 0.15 + (tension * 0.012) + ((100 - armyLoyalty) * 0.025);
    coupProgress = roundTo(clampPercent(coupProgress + monthlyCoupDelta), 2);
  }

  applyPolicyModifiers('land_law', landLawLevel);
  applyPolicyModifiers('union_status', domesticPolicy.union_status);
  applyPolicyModifiers('education_institutions', domesticPolicy.education_institutions);

  applyPolicyModifiers('language_policy', domesticPolicy.language_policy);
  stats = { ...stats, revolutionaryFervor: roundTo(clampPercent(stats.revolutionaryFervor), 2) };

  applyPolicyModifiers('political_rights', domesticPolicy.political_rights);
  stats = { ...stats, revolutionaryFervor: roundTo(clampPercent(stats.revolutionaryFervor), 2) };

  applyPolicyModifiers('womens_rights', domesticPolicy.womens_rights);
  stats = {
    ...stats,
    revolutionaryFervor: roundTo(clampPercent(stats.revolutionaryFervor), 2),
    republicanAuthority: roundTo(clampPercent(stats.republicanAuthority), 2),
  };

  applyPolicyModifiers('religion_policy', domesticPolicy.religion_policy);
  stats = { ...stats, republicanAuthority: roundTo(clampPercent(stats.republicanAuthority), 2) };

  applyPolicyModifiers('public_order_law', domesticPolicy.public_order_law);
  applyPolicyModifiers('security_corps_law', domesticPolicy.security_corps_law);
  applyPolicyModifiers('army_reform_law', domesticPolicy.army_reform_law);

  return { stats, classes, relations, domesticPolicy, coupProgress };
};
