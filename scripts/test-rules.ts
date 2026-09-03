import { INITIAL_STATE } from '../src/game/GameContext';
import {
  calculateIncomeTaxAdjustment,
  calculateMonthlyEconomy,
  calculateMonthlyIncome,
  calculateMonthlyPolicyEffects,
  calculateMonthlyPipeline,
  calculateMonthlyMapStage,
  applyMonthlyPoliticalMaintenance,
  calculateTariffConsumptionAdjustment,
  getPolicyEffectLines,
  POLICY_DEFINITIONS,
} from '../src/game/rules';
import { getBaselineLawStanceScore } from '../src/game/lawStances';
import { formCoalition, formRulingCoalitionFromSandbox } from '../src/game/utils';
import type { GameState } from '../src/game/types';
import {
  applyMonthlyOrganizationEffects,
  getDefaultOrganizationState,
  isOrganizationEstablished,
} from '../src/game/organizations';
import { fijlFormation } from '../src/game/events/fijl_formation';
import { mujeresLibresFormation } from '../src/game/events/mujeres_libres_formation';
import { INITIAL_EVENTS } from '../src/game/events';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type StatePatch = Omit<Partial<GameState>, 'stats' | 'domesticPolicy' | 'relations'> & {
  stats?: Partial<GameState['stats']>;
  domesticPolicy?: Partial<GameState['domesticPolicy']>;
  relations?: Partial<GameState['relations']>;
};

const stateWith = (patch: StatePatch): GameState => ({
  ...INITIAL_STATE,
  ...patch,
  stats: { ...INITIAL_STATE.stats, ...(patch.stats || {}) },
  domesticPolicy: { ...INITIAL_STATE.domesticPolicy, ...(patch.domesticPolicy || {}) },
  relations: { ...INITIAL_STATE.relations, ...(patch.relations || {}) },
});

const peace = stateWith({ month: 1, stats: { workerControl: 0 } });
assert(calculateMonthlyIncome(peace, 2).resources === 1, 'Base resource income should be 1');
assert(calculateMonthlyIncome(stateWith({ stats: { workerControl: 40 } }), 2).resources === 3, 'Worker control bonus should be floored by 20-point bands');
assert(calculateMonthlyIncome(peace, 2).armaments === 1, 'Peace armaments should arrive every second month');
assert(calculateMonthlyIncome(peace, 3).armaments === 0, 'Peace armaments should be zero on alternating months');
assert(calculateMonthlyIncome(stateWith({ civilWarStatus: 'ongoing' }), 3).armaments === 1, 'Wartime armaments should arrive monthly');
assert(calculateMonthlyIncome(stateWith({ activeWar: 'asturias_war' }), 3).armaments === 1, 'An active regional war should use wartime armament income');

const policyState = stateWith({
  budget: 12,
  public_debt: 500,
  military_spending: 15,
  domesticPolicy: { womens_rights: 4, land_law: 1, land_reform_law_enabled: true },
});
const before = {
  budget: policyState.budget,
  debt: policyState.public_debt,
  women: policyState.domesticPolicy.womens_rights,
};
const economy = calculateMonthlyEconomy(policyState);
assert(economy.expenditure.womensRights === 0.3, 'Economy calculator must include women’s rights expenditure');
assert(economy.expenditure.landCompensation === 0.4, 'Land compensation should be charged when reform is funded');
assert(economy.expenditure.total > economy.expenditure.civilAdministration, 'Total expenditure should include all policy items');
assert(policyState.budget === before.budget && policyState.public_debt === before.debt && policyState.domesticPolicy.womens_rights === before.women, 'Economy calculator must not mutate state');
const wartimeEconomy = calculateMonthlyEconomy(stateWith({ ...policyState, civilWarStatus: 'ongoing' }));
assert(wartimeEconomy.revenue.tariff < economy.revenue.tariff, 'Civil-war tariff base should be lower');
assert(wartimeEconomy.expenditure.military > economy.expenditure.military, 'Civil-war military expenditure should be higher');
const laborBaseline = calculateMonthlyEconomy(stateWith({ domesticPolicy: { max_hours_law: 2 } }));
const laborReformed = calculateMonthlyEconomy(stateWith({ domesticPolicy: { max_hours_law: 4 } }));
assert(laborReformed.nextUnemployment < laborBaseline.nextUnemployment, 'Max-hours unemployment modifier should come from policy definitions');

const policyResult = calculateMonthlyPolicyEffects(stateWith({
  coupSystemActive: false,
  domesticPolicy: { land_law: 2, land_reform_law_enabled: true, max_hours_law: 0, workplace_safety: 0 },
}));
assert(policyResult.coupProgress === 0, 'Inactive coup system should reset progress');
assert(policyResult.domesticPolicy.land_reform_progress === 1.5, 'Land law level 2 should add 1.5 monthly progress');
assert(policyResult.stats.revolutionaryFervor > INITIAL_STATE.stats.revolutionaryFervor, 'Unrestricted labor laws should increase monthly fervor');

const upperLaborBoundary = calculateMonthlyPolicyEffects(stateWith({
  stats: { revolutionaryFervor: 100 },
  domesticPolicy: {
    max_hours_law: 0,
    workplace_safety: 4,
    land_law: 1,
    public_order_law: 2,
    security_corps_law: 1,
    army_reform_law: 3,
  },
}));
assert(upperLaborBoundary.stats.revolutionaryFervor === 99.9, 'Opposing labor modifiers must aggregate before the upper-bound clamp');

const lowerLaborBoundary = calculateMonthlyPolicyEffects(stateWith({
  stats: { revolutionaryFervor: 0 },
  domesticPolicy: {
    max_hours_law: 4,
    workplace_safety: 0,
    land_law: 1,
    public_order_law: 2,
    security_corps_law: 1,
    army_reform_law: 3,
  },
}));
assert(lowerLaborBoundary.stats.revolutionaryFervor === 0, 'Opposing labor modifiers must aggregate before the lower-bound clamp');

const monthlyPipeline = calculateMonthlyPipeline(policyState);
assert(monthlyPipeline.state.budget === monthlyPipeline.economy.nextBudget, 'Monthly pipeline should apply economy before policy effects');
assert(monthlyPipeline.state.stats.armyLoyalty === Number(monthlyPipeline.economy.nextArmyLoyalty.toFixed(1)), 'Monthly pipeline should round army loyalty consistently');
const organizations1931 = getDefaultOrganizationState('1931');
const organizations1933 = getDefaultOrganizationState('1933');
const organizations1936 = getDefaultOrganizationState('1936');
assert(organizations1931.CNT?.established && organizations1931.FAI?.established, 'CNT and FAI should exist in the 1931 start');
assert(organizations1933.FIJL?.established && !organizations1933.ML?.established, '1933 should start with FIJL but not Mujeres Libres');
assert(organizations1936.FIJL?.established && organizations1936.ML?.established && organizations1936.DC?.established, '1936 should start with FIJL, Mujeres Libres, and Defense Committees');
const legacyOrganizationState = stateWith({ organizations: undefined, isPRRevSFormed: true });
assert(isOrganizationEstablished(legacyOrganizationState, 'PRRevS'), 'Legacy PRRevS saves should hydrate through the organization selector');
const mixedLegacyOrganizationState = stateWith({ fijl_established: true });
assert(isOrganizationEstablished(mixedLegacyOrganizationState, 'FIJL'), 'Legacy organization aliases should win when an older save carries a false registry entry');
const organizationEffects = applyMonthlyOrganizationEffects(stateWith({
  organizations: { ...organizations1931, PRRevS: { established: true } },
  stats: { revolutionaryFervor: 10, bureaucratization: 20 },
  cntVotingRate: 15,
}));
assert(organizationEffects.stats.revolutionaryFervor === 11, 'FAI should add one revolutionary fervor each month');
assert(organizationEffects.stats.bureaucratization === 21 && organizationEffects.cntVotingRate === 16, 'PRRevS should add bureaucratization and CNT voting willingness monthly');
const maintainedOrganizationState = applyMonthlyPoliticalMaintenance(organizationEffects);
assert(maintainedOrganizationState.cntVotingRate === 16, 'PRRevS voting willingness should remain a net monthly +1 while CNT opposes parliament');
const fijlHistoricalState = stateWith({
  scenario: '1931',
  difficulty: 'historical',
  year: 1932,
  month: 1,
  organizations: organizations1931,
});
assert(INITIAL_EVENTS.some((event) => event.id === fijlFormation.id) && INITIAL_EVENTS.some((event) => event.id === mujeresLibresFormation.id), 'Organization formation events should be registered in the initial event catalog');
assert(fijlFormation.date?.year === 1932 && fijlFormation.date.month === 1, 'FIJL formation should be scheduled for January 1932');
assert(fijlFormation.condition?.(fijlHistoricalState) === true, 'FIJL formation should trigger for a historical 1931 start in 1932');
assert(fijlFormation.condition?.({ ...fijlHistoricalState, difficulty: 'normal' }) === false, 'FIJL formation should remain historical-mode only');
const fijlEstablished = fijlFormation.options[0].effect(fijlHistoricalState);
assert(fijlEstablished.organizations?.FIJL?.established === true && fijlEstablished.fijl_established === true, 'FIJL formation should update the registry and legacy alias');
const mujeresLibresHistoricalState = stateWith({
  scenario: '1933',
  difficulty: 'historical',
  year: 1936,
  month: 4,
  organizations: organizations1933,
});
assert(mujeresLibresFormation.date?.year === 1936 && mujeresLibresFormation.date.month === 4, 'Mujeres Libres formation should be scheduled for April 1936');
assert(mujeresLibresFormation.condition?.(mujeresLibresHistoricalState) === true, 'Mujeres Libres formation should trigger for a historical pre-1936 start');
assert(mujeresLibresFormation.condition?.({ ...mujeresLibresHistoricalState, scenario: '1936' }) === false, 'Mujeres Libres formation should not repeat in the 1936 start');
const mujeresLibresEstablished = mujeresLibresFormation.options[0].effect(mujeresLibresHistoricalState);
assert(mujeresLibresEstablished.organizations?.ML?.established === true && mujeresLibresEstablished.mujeres_libres_established === true, 'Mujeres Libres formation should update the registry and legacy alias');
const mapStage = calculateMonthlyMapStage(INITIAL_STATE);
assert(mapStage.armies?.every(army => army.movesLeft === 2), 'Monthly map stage should reset army movement points');

const sandboxRulingCoalition = formRulingCoalitionFromSandbox(
  stateWith({ difficulty: 'sandbox' }),
  'provisional_government',
);
const sandboxWithOpposition = formCoalition(sandboxRulingCoalition, 'workers_alliance');
assert(sandboxWithOpposition.rulingCoalition === 'provisional_government', 'Sandbox opposition formation must preserve the ruling coalition');
assert(sandboxWithOpposition.activeCoalitions.some(coalition => coalition.activeId === 'workers_alliance'), 'Sandbox must allow an opposition coalition alongside the ruling coalition');

assert(POLICY_DEFINITIONS.length === 14, 'Every domestic policy must have one central definition');
assert(POLICY_DEFINITIONS.every(definition => definition.levels.every(level => level.name.en && level.name.zh && level.description.en && level.description.zh && level.effect.en && level.effect.zh)), 'Policy levels must carry bilingual text');
assert(getBaselineLawStanceScore('CNT_FAI', 'land_law', 2) === 6, 'Law stance scores must come from policy level definitions');
const educationPreview = getPolicyEffectLines('education_institutions', 2, stateWith({ ateneos_established: 0 }), true);
assert(educationPreview.some(line => line.includes('无阶层支持度影响')), 'Education preview should explain unmet Ateneos condition');
const educationEstablishedPreview = getPolicyEffectLines('education_institutions', 2, stateWith({ ateneos_established: 3 }), true);
assert(educationEstablishedPreview.some(line => line.includes('+0.15')), 'Education preview should scale support by Ateneos level');

const incomeTaxChange = calculateIncomeTaxAdjustment(5, 0, 5);
assert(incomeTaxChange.budgetChange === 2.25, 'Income-tax calculator should preserve progressive budget effects');
assert(incomeTaxChange.faistasDissent === 3, 'Income-tax calculator should combine anarchist dissent effects');
const tradeTaxChange = calculateTariffConsumptionAdjustment(5, -3);
assert(tradeTaxChange.foreignExchangeGain === 5, 'Tariff increases should produce foreign-exchange gains');
assert(tradeTaxChange.workingClassSupport === 3, 'Consumption-tax cuts should support working classes');

console.log('Pure rules calculator tests passed.');
