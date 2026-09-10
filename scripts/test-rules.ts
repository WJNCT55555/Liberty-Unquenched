import { INITIAL_STATE, gameReducer } from '../src/game/GameContext';
import {
  calculateIncomeTaxAdjustment,
  calculateMonthlyEconomy,
  calculateMonthlyIncome,
  calculateMonthlyPolicyEffects,
  calculateMonthlyPipeline,
  calculateMonthlyMapStage,
  applyMonthlyPoliticalMaintenance,
  calculateTariffConsumptionAdjustment,
  calculateEconomicPoliticalFeedback,
  getPolicyEffectLines,
  POLICY_DEFINITIONS,
  GUARDIA_ASALTO_ESTABLISHMENT,
  getGuardiaAsaltoManpower,
  applySecurityForcesDerivedState,
} from '../src/game/rules';
import { getBaselineLawStanceScore } from '../src/game/lawStances';
import { formCoalition, formRulingCoalitionFromSandbox } from '../src/game/utils';
import type { GameEvent, GameState } from '../src/game/types';
import {
  applyMonthlyOrganizationEffects,
  getDefaultOrganizationState,
  isOrganizationEstablished,
} from '../src/game/organizations';
import { fijlFormation } from '../src/game/events/fijl_formation';
import { azanaMilitaryReform } from '../src/game/events/azana_military_reform';
import { mujeresLibresFormation } from '../src/game/events/mujeres_libres_formation';
import { INITIAL_EVENTS } from '../src/game/events';
import { organizationsCard } from '../src/game/action_affairs/organizations';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type StatePatch = Omit<Partial<GameState>, 'stats' | 'domesticPolicy' | 'relations' | 'unionShare'> & {
  stats?: Partial<GameState['stats']>;
  domesticPolicy?: Partial<GameState['domesticPolicy']>;
  relations?: Partial<GameState['relations']>;
  unionShare?: Partial<GameState['unionShare']>;
};

const stateWith = (patch: StatePatch): GameState => ({
  ...INITIAL_STATE,
  ...patch,
  stats: { ...INITIAL_STATE.stats, ...(patch.stats || {}) },
  domesticPolicy: { ...INITIAL_STATE.domesticPolicy, ...(patch.domesticPolicy || {}) },
  relations: { ...INITIAL_STATE.relations, ...(patch.relations || {}) },
  unionShare: { ...INITIAL_STATE.unionShare!, ...(patch.unionShare || {}) },
});

// 收入由 CNT 工会占比驱动（每 20 点 +1，上限 +5），与工人控制程度无关。
const peace = stateWith({ month: 1, unionShare: { CNT: 0, unorganized: 83 } });
assert(calculateMonthlyIncome(peace, 2).resources === 1, 'Base resource income should be 1');
assert(calculateMonthlyIncome(stateWith({ unionShare: { CNT: 40, unorganized: 43 } }), 2).resources === 3, 'CNT share bonus should be floored by 20-point bands');
assert(calculateMonthlyIncome(stateWith({ unionShare: { CNT: 22 }, stats: { workerControl: 100 } }), 2).resources === 2, 'Worker control must no longer drive income');
assert(calculateMonthlyIncome(peace, 2).armaments === 1, 'Peace armaments should arrive every second month');
assert(calculateMonthlyIncome(peace, 3).armaments === 0, 'Peace armaments should be zero on alternating months');
assert(calculateMonthlyIncome(stateWith({ civilWarStatus: 'ongoing' }), 3).armaments === 1, 'Wartime armaments should arrive monthly');
assert(calculateMonthlyIncome(stateWith({ activeWar: 'asturias_war' }), 3).armaments === 1, 'An active regional war should use wartime armament income');

// The Assault Guard is a corps the Republic raises through the Security Corps Law,
// so level 0 (Civil Guard dominance) must not field it.
assert(getGuardiaAsaltoManpower(0) === 0, 'Security Corps Law level 0 must not raise the Assault Guard');
assert(getGuardiaAsaltoManpower(1) === GUARDIA_ASALTO_ESTABLISHMENT, 'Security Corps Law level 1 must raise the Assault Guard establishment');
assert(getGuardiaAsaltoManpower(4) === GUARDIA_ASALTO_ESTABLISHMENT, 'Later Security Corps Law levels keep the same Assault Guard establishment');

const legacyAssaultGuard = applySecurityForcesDerivedState({
  ...stateWith({ domesticPolicy: { security_corps_law: 0 } }),
  armedForces: {
    ...INITIAL_STATE.armedForces,
    guardiaAsalto: { manpower: 30000, loyalty: 70 },
  },
});
assert(legacyAssaultGuard.armedForces.guardiaAsalto.manpower === 0, 'A legacy save must lose the Assault Guard while the law stays at level 0');

const raisedAssaultGuard = applySecurityForcesDerivedState(stateWith({
  domesticPolicy: { security_corps_law: 1 },
}));
assert(raisedAssaultGuard.armedForces.guardiaAsalto.manpower === GUARDIA_ASALTO_ESTABLISHMENT, 'Derived state must grant the Assault Guard once the law is passed');
assert(raisedAssaultGuard.armedForces.regularArmy.manpower === INITIAL_STATE.armedForces.regularArmy.manpower, 'Deriving security forces must not touch the regular army');
assert(applySecurityForcesDerivedState(raisedAssaultGuard) === raisedAssaultGuard, 'Derived security-force state must be idempotent');

// Scenario hydration: the 1931 start predates the corps, while the 1933 and 1936
// starts inherit the law the Republic had already passed.
const startScenario = (scenario: '1931' | '1933' | '1936') =>
  gameReducer(INITIAL_STATE, { type: 'START_GAME', payload: { scenario, difficulty: 'normal' } });

const start1931 = startScenario('1931');
assert(start1931.domesticPolicy.security_corps_law === 0, 'The 1931 start must not have passed the Security Corps Law');
assert(start1931.armedForces.guardiaAsalto.manpower === 0, 'The 1931 start must not field the Assault Guard');

const start1933 = startScenario('1933');
assert(start1933.domesticPolicy.security_corps_law === 1, 'The 1933 start must hydrate the Security Corps Law');
assert(start1933.armedForces.guardiaAsalto.manpower === GUARDIA_ASALTO_ESTABLISHMENT, 'The 1933 start must field the Assault Guard');

const start1936 = startScenario('1936');
assert(start1936.armedForces.guardiaAsalto.manpower === GUARDIA_ASALTO_ESTABLISHMENT, 'The 1936 start must field the Assault Guard');

// The Azaña reform is the event that raises the law; combined with the derivation
// above it must produce the corps in the same step.
const azanaEffect = azanaMilitaryReform.options[0].effect(start1931);
assert(azanaEffect.domesticPolicy?.security_corps_law === 1, 'The Azaña reform must advance the Security Corps Law');
assert(azanaEffect.domesticPolicy?.army_reform_law === 1, 'The Azaña reform must advance the Army Reform Law');
const afterAzana = applySecurityForcesDerivedState({ ...start1931, ...azanaEffect });
assert(afterAzana.armedForces.guardiaAsalto.manpower === GUARDIA_ASALTO_ESTABLISHMENT, 'Resolving the Azaña reform must raise the Assault Guard');

const policyState = stateWith({
  budget: 12,
  public_debt: 500,
  military_spending: 15,
  domesticPolicy: { womens_rights: 4, land_law: 1 },
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

// Deflation: the inflation band must allow negative values, and deflation
// must push the unemployment target up (1931-33 Spanish deflation).
const inflationNormal = calculateMonthlyEconomy(stateWith({ inflation_rate: 3 }));
const deflationMild = calculateMonthlyEconomy(stateWith({ inflation_rate: -1 }));
const deflationSevere = calculateMonthlyEconomy(stateWith({ inflation_rate: -6 }));
assert(deflationSevere.nextInflation < 0, 'The inflation floor must allow deflation below zero');
assert(calculateMonthlyEconomy(stateWith({ inflation_rate: -20 })).nextInflation === -5, 'Inflation must clamp at the -5% deflation floor');
assert(deflationMild.nextUnemployment > inflationNormal.nextUnemployment, 'Mild deflation should raise the unemployment target');
assert(deflationSevere.nextUnemployment > deflationMild.nextUnemployment, 'Severe deflation should raise unemployment more than mild deflation');
assert(
  calculateMonthlyEconomy(stateWith({ inflation_rate: -0.4 })).nextUnemployment === inflationNormal.nextUnemployment,
  'Inflation above -0.5 must not trigger the deflation penalty',
);

// Economic hardship → political realignment (SDAAH-style feedback).
const hardshipClasses = calculateEconomicPoliticalFeedback(stateWith({ unemployment_rate: 20, fe_founded: true }));
assert(
  Math.abs(hardshipClasses.PequenaBurguesia.support.AP - (INITIAL_STATE.classes.PequenaBurguesia.support.AP + 4 / 12)) < 0.001,
  'High unemployment should push the petty bourgeoisie toward AP/CEDA (+4/12)',
);
// Note: class support is zero-sum (sum stays 100), so when two forces are
// raised in the same month the later adjustment shaves the earlier one.
// Assertions therefore check the last-applied force exactly and the earlier
// one for a net positive/negative move.
assert(
  hardshipClasses.Obreros.support.CNT_FAI > INITIAL_STATE.classes.Obreros.support.CNT_FAI + 0.02,
  'High unemployment should push workers toward CNT-FAI (net gain after zero-sum normalization)',
);
assert(
  Math.abs(hardshipClasses.Braceros.support.FE - (INITIAL_STATE.classes.Braceros.support.FE + 1 / 12)) < 0.001,
  'High unemployment should push peasants toward FE when the Falange exists (+1/12)',
);
const noFalangeClasses = calculateEconomicPoliticalFeedback(stateWith({ unemployment_rate: 20, fe_founded: false }));
assert(
  noFalangeClasses.Obreros.support.FE === INITIAL_STATE.classes.Obreros.support.FE,
  'FE support must stay untouched while the Falange is not founded',
);
const inflationClasses = calculateEconomicPoliticalFeedback(stateWith({ inflation_rate: 9, fe_founded: true }));
assert(
  inflationClasses.PequenaBurguesia.support.PSOE < INITIAL_STATE.classes.PequenaBurguesia.support.PSOE - 0.3,
  'High inflation should move the petty bourgeoisie away from PSOE (-4/12)',
);
assert(
  Math.abs(inflationClasses.PequenaBurguesia.support.FE - (INITIAL_STATE.classes.PequenaBurguesia.support.FE + 4 / 12)) < 0.001,
  'High inflation should move the petty bourgeoisie toward FE (+4/12)',
);
const feedbackPipeline = calculateMonthlyPipeline(stateWith({ unemployment_rate: 25, fe_founded: true }));
assert(
  feedbackPipeline.state.classes.PequenaBurguesia.support.AP > INITIAL_STATE.classes.PequenaBurguesia.support.AP,
  'The monthly pipeline should apply economic political feedback after policy effects',
);

const policyResult = calculateMonthlyPolicyEffects(stateWith({
  coupSystemActive: false,
  domesticPolicy: { land_law: 2, max_hours_law: 0, workplace_safety: 0 },
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
assert(!organizations1931.FNA?.established && organizations1931.FNA?.status === 'unformed', 'FNA must not exist at the 1931 start');
assert(organizations1933.FIJL?.established && !organizations1933.ML?.established, '1933 should start with FIJL but not Mujeres Libres');
assert(!organizations1933.FNA?.established && organizations1933.FNA?.status === 'unformed', 'FNA must not exist at the 1933 start');
assert(organizations1936.FIJL?.established && organizations1936.ML?.established && organizations1936.DC?.established, '1936 should start with FIJL, Mujeres Libres, and Defense Committees');
assert(!organizations1936.FNA?.established && organizations1936.FNA?.status === 'unformed', 'FNA must not exist at the 1936 start');
const organizationsMenu = organizationsCard.effect(stateWith({ organizations: organizations1931 })).currentEvent as GameEvent;
const armDefenseOption = organizationsMenu.options.find(option => option.text === 'Arm Comités de Defensa (-1 Resource)');
assert(armDefenseOption?.condition?.(stateWith({ resources: 2, organizations: organizations1931 })) === false, 'Defense armament should require an established Defense Committee');
assert(armDefenseOption?.condition?.(stateWith({ resources: 2, organizations: organizations1936 })) === true, 'Defense armament should be available after the Defense Committee is established');
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
assert(fijlEstablished.organizations?.FIJL?.established === true, 'FIJL formation should update the organization registry');
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
assert(mujeresLibresEstablished.organizations?.ML?.established === true, 'Mujeres Libres formation should update the organization registry');
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
