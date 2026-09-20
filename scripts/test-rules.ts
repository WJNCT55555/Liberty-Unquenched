import { gameReducer } from '../src/game/GameContext';
import { PRE_START_STATE } from '../src/game/scenarios';
import { getDefaultUnionShare } from '../src/game/unions';
import { INITIAL_CLASSES } from '../src/game/parties';
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
  GUARDIA_NACIONAL_ESTABLISHMENT,
  GUARDIA_ASALTO_ESTABLISHMENT,
  WORKER_PATROL_ESTABLISHMENT,
  getSecurityForces,
  raiseSecurityCorpsLoyalty,
  applySecurityForcesDerivedState,
  applyPeacetimeMobilization,
  applyMobilizationToMapResources,
  getDeployedGarrisonManpower,
  getPeacetimeArmyPool,
  applyCivilWarLoyaltySplit,
  clampMilitarySpending,
  adjustUnemploymentRate,
} from '../src/game/rules';
import { getBaselineLawStanceScore } from '../src/game/lawStances';
import { formCoalition, formRulingCoalitionFromSandbox } from '../src/game/utils';
import type { GameEvent, GameState } from '../src/game/types';
import {
  applyMonthlyOrganizationEffects,
  getDefaultArmedEntityPools,
  getDefaultOrganizationState,
  isOrganizationEstablished,
  normalizeOrganizationState,
  ORGANIZATION_DEFINITIONS,
} from '../src/game/organizations';
import { reduceMapWarAction } from '../src/game/reducers/mapReducer';
import { getEffectiveFortressLevel } from '../src/map/types_map';
import { INITIAL_PROVINCES } from '../src/map/map_constants';
import { foundingOfPOUM } from '../src/game/events/founding_of_poum';
import { foundingOfFalange } from '../src/game/events/founding_of_falange';
import { maocFormation } from '../src/game/events/maoc_formation';
import { consFormation } from '../src/game/events/cons_formation';
import { jonsFormation, seuFormation, seccionFemeninaFormation } from '../src/game/events/falange_organizations';
import { jsuFormation, mujeresAntifascistasFormation, egiFormation, jciFormation } from '../src/game/events/party_auxiliary_organizations';
import { birthOfFeDeLasJons } from '../src/game/events/birth_of_fe_de_las_jons';
import { fijlFormation } from '../src/game/events/fijl_formation';
import { azanaMilitaryReform } from '../src/game/events/azana_military_reform';
import { mujeresLibresFormation } from '../src/game/events/mujeres_libres_formation';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { MapFaction } from '../src/map/types_map';
import type { Army, ArmyIdentity } from '../src/map/types_map';
import { setupArmiesForCivilWar } from '../src/game/events/civil_war/civil_war_setup';
import { organizationsCard } from '../src/game/action_affairs/organizations';
import { militaryPolicy } from '../src/game/government_affairs/military_policy';
import {
  fiscalPolicy,
  fiscalPolicyEvent,
  fiscalPolicyIncomeTaxesEvent,
} from '../src/game/government_affairs/fiscal_policy';

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
  ...PRE_START_STATE,
  ...patch,
  stats: { ...PRE_START_STATE.stats, ...(patch.stats || {}) },
  domesticPolicy: { ...PRE_START_STATE.domesticPolicy, ...(patch.domesticPolicy || {}) },
  relations: { ...PRE_START_STATE.relations, ...(patch.relations || {}) },
  unionShare: { ...getDefaultUnionShare('1931'), ...(patch.unionShare || {}) },
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

// The Security Corps Law owns which corps exist and how strong they are. Loyalty
// is NOT law-derived: the Police Affairs card raises it, so walking the law ladder
// must preserve it.
let ladder = stateWith({});
const walkToLawLevel = (lawLevel: number) => {
  ladder = applySecurityForcesDerivedState({
    ...ladder,
    domesticPolicy: { ...ladder.domesticPolicy, security_corps_law: lawLevel },
  });
  return ladder.armedForces;
};

const level0 = walkToLawLevel(0);
assert(level0.guardiaNacional.manpower === GUARDIA_NACIONAL_ESTABLISHMENT && level0.guardiaAsalto.manpower === 0, 'Level 0 must field the Civil Guard alone');

const level1 = walkToLawLevel(1);
assert(level1.guardiaNacional.manpower === GUARDIA_NACIONAL_ESTABLISHMENT && level1.guardiaAsalto.manpower === GUARDIA_ASALTO_ESTABLISHMENT, 'Level 1 must add the Assault Guard beside the Civil Guard');
assert(level1.guardiaAsalto.loyalty === 70, 'A newly raised Assault Guard must start at its base loyalty');

const level2 = walkToLawLevel(2);
assert(level2.guardiaNacional.manpower === GUARDIA_NACIONAL_ESTABLISHMENT && level2.guardiaAsalto.manpower === GUARDIA_ASALTO_ESTABLISHMENT, 'Level 2 must keep the same two corps as level 1');
assert(level2.guardiaNacional.loyalty === level1.guardiaNacional.loyalty && level2.guardiaAsalto.loyalty === level1.guardiaAsalto.loyalty, 'Level 2 must not change loyalty by itself');

const level3 = walkToLawLevel(3);
assert(level3.guardiaNacional.manpower === 0 && level3.guardiaAsalto.manpower === 0, 'Level 3 must dissolve the two separate corps');
assert(level3.guardiaRepublicana.manpower === GUARDIA_NACIONAL_ESTABLISHMENT + GUARDIA_ASALTO_ESTABLISHMENT, 'Level 3 must merge both corps into the Republican Guard without losing men');
assert(
  level3.guardiaRepublicana.loyalty === Math.round(
    (GUARDIA_NACIONAL_ESTABLISHMENT * level2.guardiaNacional.loyalty
      + GUARDIA_ASALTO_ESTABLISHMENT * level2.guardiaAsalto.loyalty)
    / (GUARDIA_NACIONAL_ESTABLISHMENT + GUARDIA_ASALTO_ESTABLISHMENT),
  ),
  'The merged guard must inherit a manpower-weighted loyalty from both corps',
);

const level4 = walkToLawLevel(4);
assert(level4.guardiaRepublicana.manpower === 0, 'Level 4 must dissolve the Republican Guard');
assert(level4.patrullasObreras.manpower === WORKER_PATROL_ESTABLISHMENT, 'Level 4 must raise the workers\' patrols');
assert(level4.patrullasObreras.loyalty > level3.guardiaRepublicana.loyalty, 'Workers\' patrols must be more reliable than the merged guard');

const legacyAssaultGuard = applySecurityForcesDerivedState({
  ...stateWith({ domesticPolicy: { security_corps_law: 0 } }),
  armedForces: {
    ...PRE_START_STATE.armedForces,
    guardiaAsalto: { manpower: 30000, loyalty: 70 },
  },
});
assert(legacyAssaultGuard.armedForces.guardiaAsalto.manpower === 0, 'A legacy save must lose the Assault Guard while the law stays at level 0');

const lawOneState = applySecurityForcesDerivedState(stateWith({ domesticPolicy: { security_corps_law: 1 } }));
const derivedTwice = applySecurityForcesDerivedState(lawOneState);
assert(getSecurityForces(1).guardiaAsalto.manpower === GUARDIA_ASALTO_ESTABLISHMENT && derivedTwice.armedForces.guardiaAsalto.manpower === GUARDIA_ASALTO_ESTABLISHMENT, 'Derived security-force state must be idempotent');
assert(derivedTwice === lawOneState, 'Derived security-force state must be stable once settled');

// Player-raised loyalty must survive the law pass instead of being overwritten.
const carried = applySecurityForcesDerivedState({
  ...lawOneState,
  ...raiseSecurityCorpsLoyalty(lawOneState, 'guardiaNacional', 5),
});
assert(carried.armedForces.guardiaNacional.loyalty === lawOneState.armedForces.guardiaNacional.loyalty + 5, 'Raised loyalty must survive the law derivation');

const capped = raiseSecurityCorpsLoyalty({
  ...lawOneState,
  armedForces: { ...lawOneState.armedForces, guardiaNacional: { manpower: 30000, loyalty: 100 } },
}, 'guardiaNacional', 5);
assert(capped.armedForces!.guardiaNacional.loyalty === 100, 'Loyalty must be capped at 100');

// Scenario hydration: the 1931 start predates the corps, while the 1933 and 1936
// starts inherit the law the Republic had already passed.
const startScenario = (scenario: '1931' | '1933' | '1936') =>
  gameReducer(PRE_START_STATE, { type: 'START_GAME', payload: { scenario, difficulty: 'normal' } });

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

// Map pools are wartime mobilization income, so peace months must not bank them.
const seededRepublicManpower = PRE_START_STATE.mapResources![MapFaction.REPUBLICAN].manpower;
const peaceMapStage = calculateMonthlyMapStage(stateWith({ civilWarStatus: 'not_started', activeWar: null }));
assert(peaceMapStage.mapResources[MapFaction.REPUBLICAN].manpower === seededRepublicManpower, 'Peacetime months must not accrue provincial manpower');
assert(peaceMapStage.mapResources[MapFaction.NATIONALIST].manpower === PRE_START_STATE.mapResources![MapFaction.NATIONALIST].manpower, 'Peacetime months must not accrue manpower for any faction');

const warMapStage = calculateMonthlyMapStage(stateWith({ civilWarStatus: 'ongoing', activeWar: 'spanish_civil_war' }));
assert(warMapStage.mapResources[MapFaction.REPUBLICAN].manpower > seededRepublicManpower, 'Wartime months must accrue provincial manpower');

// Peace keeps no troops on the map, so the sidebar roster is the peacetime
// formation table and the 1931 start must expose exactly its eight entries.
assert((start1931.armies || []).length === 0, 'The 1931 start must place no troops on the map');
const governmentFormations = start1931.armyFormations || [];
assert(governmentFormations.length === 8, 'The 1931 start must expose the eight Republican formations');
assert(governmentFormations.every((formation) => Boolean(formation.name && formation.nameZh)), 'Every garrison must carry a bilingual historical name');

// §6.4 again for the army: the eight garrisons are the deployed part of the total.
assert(getDeployedGarrisonManpower(start1931) === 30500, 'The 1931 start must deploy 30,500 men in garrisons');
assert(getPeacetimeArmyPool(start1931) === 69500, 'The army pool must exclude the men already in garrisons');

const armySplit = applyCivilWarLoyaltySplit(start1931, start1931.mapResources);
assert(armySplit.republicanGain === 52200, 'The Republican camp must receive its share of the army pool and the loyal police');
assert(armySplit.nationalistGain === 47300, 'The Nationalist camp must receive the disloyal share');
assert(armySplit.mapResources![MapFaction.NATIONALIST].manpower === PRE_START_STATE.mapResources![MapFaction.NATIONALIST].manpower + 47300, 'The split must land in the Nationalist pool');
assert(armySplit.armedForces.guardiaNacional.manpower === 0, 'Absorbed police corps must be emptied once they become camp manpower');

// The two corps split differently: the Civil Guard mostly goes over while the
// Assault Guard mostly stays, which is the whole point of per-corps loyalty.
const splitWithBothCorps = applyCivilWarLoyaltySplit(
  applySecurityForcesDerivedState({
    ...stateWith({ domesticPolicy: { security_corps_law: 1 } }),
    armyFormations: start1931.armyFormations,
  }),
  PRE_START_STATE.mapResources,
);
assert(splitWithBothCorps.republicanGain === 57800, 'Loyal police must be added to the Republican share');
assert(splitWithBothCorps.nationalistGain === 49700, 'Disloyal police must be added to the Nationalist share');
assert(governmentFormations.reduce((sum, formation) => sum + formation.manpower, 0) === 30500, 'The roster must total the standing army');

// §6: the peacetime years decide the war's opening position. The historical setup
// has already deployed part of the pool, so §6.4 forbids counting those men twice.
const militiaArmy = (id: string, identity: ArmyIdentity, manpower: number): Army => ({
  id,
  faction: MapFaction.REPUBLICAN,
  identity,
  provinceId: 'barcelona',
  movesLeft: 2,
  manpower,
  maxManpower: manpower,
  composition: { infantry: manpower, artillery: 0, tanks: 0 },
  designedComposition: { infantry: manpower, artillery: 0, tanks: 0 },
  morale: 80,
  militarization: 20,
});

const withCntPool = (cntFai: number) => stateWith({
  armaments: 0,
  armedForces: {
    ...PRE_START_STATE.armedForces,
    militias: { ...PRE_START_STATE.armedForces.militias, cntFai },
  },
});

const starvedPrep = applyPeacetimeMobilization(withCntPool(7500), [militiaArmy('cnt_a', 'cnt', 7500)]);
assert(starvedPrep.armies[0].manpower === 7500, 'A pool equal to the deployed force must not grow it');
assert(starvedPrep.reserveManpower === 0, 'A pool fully deployed must leave no reserve');
assert(starvedPrep.armies[0].militarization === 10, 'Below the 0.60 band must reduce militia readiness');

const historicalPrep = applyPeacetimeMobilization(withCntPool(50000), [militiaArmy('cnt_a', 'cnt', 7500)]);
assert(historicalPrep.armies[0].manpower === 11250, 'The 1.00 band must let a deployed unit grow by half');
assert(historicalPrep.reserveManpower === 38750, 'Manpower beyond the unit ceiling must become reserve');
assert(historicalPrep.armies[0].manpower === historicalPrep.armies[0].composition.infantry, 'Growth must keep manpower equal to the composition sum');
assert(historicalPrep.armies[0].maxManpower === historicalPrep.armies[0].designedComposition.infantry, 'Growth must keep maxManpower equal to the designed sum');
assert(historicalPrep.armies[0].militarization === 25, 'The 1.00 band must add a small readiness bonus');
assert(historicalPrep.reserveTanks === 0, 'Tank research that never completed must grant no armour');
assert(applyPeacetimeMobilization(stateWith({ armaments: 8 }), []).reserveSupplies === 2000, 'Accumulated armaments must convert into supplies');
assert(applyPeacetimeMobilization(stateWith({ armaments: 0, tankResearchCompleted: true }), []).reserveTanks === 10, 'Completed tank research must grant an armoured reserve');

const appliedMobilization = applyMobilizationToMapResources(PRE_START_STATE.mapResources, {
  armies: [],
  reserveManpower: 1000,
  reserveSupplies: 500,
  reserveTanks: 3,
});
assert(appliedMobilization![MapFaction.REPUBLICAN].manpower === PRE_START_STATE.mapResources![MapFaction.REPUBLICAN].manpower + 1000, 'Reserve manpower must go to the Republican pool');
assert(appliedMobilization![MapFaction.NATIONALIST].manpower === PRE_START_STATE.mapResources![MapFaction.NATIONALIST].manpower, 'The Nationalist pool must not receive Republican reserves');

// The whole chain: the real civil-war setup must deploy the historical militia
// columns first and only then spend the surplus.
const mobilizationState = {
  ...start1931,
  armaments: 0,
  armedForces: {
    ...start1931.armedForces,
    militias: { ...start1931.armedForces.militias, cntFai: 50000 },
  },
};
const mobilisedWarStart = setupArmiesForCivilWar(mobilizationState, false, {});
const cntColumns = mobilisedWarStart.armies.filter(
  (army) => (army.identity ?? 'gov') === 'cnt' && army.faction === MapFaction.REPUBLICAN,
);
const maocColumns = mobilisedWarStart.armies.filter(
  (army) => (army.identity ?? 'gov') === 'pce' && army.faction === MapFaction.REPUBLICAN,
);
assert(cntColumns.length === 1, 'Only the Asturias miners column is CNT');
assert(maocColumns.some((army) => army.id === 'rep_madrid_militia'), 'The Madrid militia must be a MAOC (PCE) column');
assert(mobilisedWarStart.armies.some((army) => army.id === 'rep_21_santander' && (army.identity ?? 'gov') === 'gov'), 'The 21st Regiment must be a government unit');
assert(mobilisedWarStart.armies.filter((army) => army.id.startsWith('rep_')).length >= 8, 'The war must instantiate the standing army from the peacetime roster');
assert(cntColumns.every((army) => army.manpower > army.composition.artillery), 'CNT columns must keep their composition consistent after growth');
assert(mobilisedWarStart.reserveManpower === 44750, 'The civil-war setup must reserve exactly the surplus beyond the deployed columns');

// Military policy: the funding options now move the budget line they describe, and
// reassigning officers sets the conspiracy back substantially.
const militaryPolicyEvent = militaryPolicy.effect(stateWith({})).currentEvent as GameEvent;
const policyOption = (text: string) => militaryPolicyEvent.options.find((option) => option.text === text)!;

assert(policyOption('Increase Funding').effect(stateWith({ military_spending: 15 })).military_spending === 16, 'Increasing funding must raise military spending by one point');
assert(policyOption('Decrease Funding').effect(stateWith({ military_spending: 15 })).military_spending === 14, 'Decreasing funding must lower military spending by one point');
assert(policyOption('Increase Funding').effect(stateWith({ military_spending: 100 })).military_spending === 100, 'Military spending must not exceed its upper bound');
assert(policyOption('Decrease Funding').effect(stateWith({ military_spending: 5 })).military_spending === 5, 'Military spending must not fall below its lower bound');
assert(clampMilitarySpending(Number.NaN) === 15, 'Military spending must fall back to the default when the value is not a number');

assert(policyOption('Reassign Disloyal Officers').effect(stateWith({ coupProgress: 40 })).coupProgress === 35, 'Reassigning officers must set the coup back by five');
assert(policyOption('Reassign Disloyal Officers').effect(stateWith({ coupProgress: 2 })).coupProgress === 0, 'Coup progress must never go negative');

// ---------------------------------------------------------------------------
// Map war system: province manpower income, additive fortresses, merge guards,
// and party-pool recruitment.
// ---------------------------------------------------------------------------
const warStateWith = (patch: Partial<GameState>): GameState => stateWith({
  phase: 'war',
  civilWarStatus: 'ongoing',
  activeWar: 'spanish_civil_war',
  mapCurrentPlayer: MapFaction.REPUBLICAN,
  provinces: { ...INITIAL_PROVINCES },
  armies: [],
  ...patch,
});

// Province manpower income is DISABLED; only the flat base and recruiting offices
// still produce men.
const provinceOnly = calculateMonthlyMapStage(warStateWith({}));
const seededWarManpower = PRE_START_STATE.mapResources![MapFaction.REPUBLICAN].manpower;
const officesOnly = calculateMonthlyMapStage(warStateWith({
  provinces: {
    ...INITIAL_PROVINCES,
    madrid: { ...INITIAL_PROVINCES.madrid, buildings: { recruitingOffice: 1 } },
  },
}));
assert(
  officesOnly.mapResources[MapFaction.REPUBLICAN].manpower - seededWarManpower === 2000,
  'Wartime manpower must come from the flat base and recruiting offices only, never from province manpower',
);
assert(
  provinceOnly.mapResources[MapFaction.REPUBLICAN].manpower - seededWarManpower === 500,
  'Without recruiting offices, wartime manpower must be the flat base only',
);

// A fortress adds to the province's inherent defence and is capped.
assert(getEffectiveFortressLevel({ fortification: 2, buildings: {} }) === 2, 'Madrid is inherently a level-2 fortress');
assert(getEffectiveFortressLevel({ fortification: 2, buildings: { fortress: 1 } }) === 3, 'A built fortress must add to the inherent level');
assert(getEffectiveFortressLevel({ fortification: 3, buildings: { fortress: 3 } }) === 6, 'The effective level is capped at six');
assert(getEffectiveFortressLevel({ fortification: 0, buildings: { fortress: 9 } }) === 6, 'Over-built fortresses must still clamp');

const mergeHelpers = {
  resolveBattle: () => ({ updatedArmies: [], updatedProvinces: {}, messages: [] }),
  executeAiTurn: (state: GameState) => state,
  checkWarStatus: (state: GameState) => state,
};
const mergeArmy = (id: string, provinceId: string, identity: Army['identity']): Army => ({
  id, faction: MapFaction.REPUBLICAN, identity, provinceId, movesLeft: 2,
  manpower: 1000, maxManpower: 1000,
  composition: { infantry: 1000, artillery: 0, tanks: 0 },
  designedComposition: { infantry: 1000, artillery: 0, tanks: 0 },
  morale: 70, militarization: 30,
});
const mergeTwo = (armies: Army[]) => reduceMapWarAction(
  warStateWith({ armies, mapSelectedArmyIds: armies.map(army => army.id) }),
  { type: 'MERGE_MAP_ARMIES' },
  mergeHelpers,
);
assert(mergeTwo([mergeArmy('a', 'madrid', 'cnt'), mergeArmy('b', 'madrid', 'cnt')])!.armies.length === 1, 'Units in one province with one identity must merge');
assert(mergeTwo([mergeArmy('a', 'madrid', 'cnt'), mergeArmy('b', 'toledo', 'cnt')])!.armies.length === 2, 'Merging across provinces must be refused');
assert(mergeTwo([mergeArmy('a', 'madrid', 'cnt'), mergeArmy('b', 'madrid', 'gov')])!.armies.length === 2, 'Merging across political identities must be refused');

// Recruitment: a party pool needs a recruiting office and pays from the pool; the
// national path needs barracks and pays from the camp.
const militiaPoolState = warStateWith({
  provinces: {
    ...INITIAL_PROVINCES,
    madrid: { ...INITIAL_PROVINCES.madrid, buildings: { recruitingOffice: 1 } },
  },
  organizations: { ...getDefaultOrganizationState('1936'), DC: { established: true, status: 'active' } },
  armedForces: {
    ...PRE_START_STATE.armedForces,
    entityPools: {
      ...getDefaultArmedEntityPools(),
      cnt_defense_committees: {
        entityId: 'cnt_defense_committees', organizationId: 'DC', owner: 'CNT_FAI',
        status: 'active', manpower: 5000, artillery: 0, tanks: 0,
      },
    },
  },
});
const militiaRecruit = reduceMapWarAction(
  militiaPoolState,
  { type: 'RECRUIT_MAP_ARMY', payload: { provinceId: 'madrid', composition: { infantry: 1000, artillery: 0, tanks: 0 }, sourceEntityId: 'cnt_defense_committees' } },
  mergeHelpers,
)!;
assert(militiaRecruit.armies.length === 1 && militiaRecruit.armies[0].identity === 'cnt', 'A militia pool must raise a unit with that party identity');
assert(militiaRecruit.armedForces.entityPools!.cnt_defense_committees.manpower === 4000, 'Militia recruitment must spend the pool, not the camp');
assert(militiaRecruit.mapResources![MapFaction.REPUBLICAN].manpower === PRE_START_STATE.mapResources![MapFaction.REPUBLICAN].manpower, 'Militia recruitment must leave the camp manpower untouched');

const noOfficeState = {
  ...militiaPoolState,
  provinces: { ...INITIAL_PROVINCES, madrid: { ...INITIAL_PROVINCES.madrid, buildings: { barracks: 1 } } },
};
assert(
  reduceMapWarAction(noOfficeState, { type: 'RECRUIT_MAP_ARMY', payload: { provinceId: 'madrid', composition: { infantry: 1000, artillery: 0, tanks: 0 }, sourceEntityId: 'cnt_defense_committees' } }, mergeHelpers)!.armies.length === 0,
  'Militia recruitment must require a recruiting office in the province',
);
assert(
  reduceMapWarAction(militiaPoolState, { type: 'RECRUIT_MAP_ARMY', payload: { provinceId: 'madrid', composition: { infantry: 1000, artillery: 0, tanks: 0 } } }, mergeHelpers)!.armies.length === 0,
  'National conscripts must require barracks in the province',
);
const nationalRecruit = reduceMapWarAction(
  noOfficeState,
  { type: 'RECRUIT_MAP_ARMY', payload: { provinceId: 'madrid', composition: { infantry: 1000, artillery: 0, tanks: 0 } } },
  mergeHelpers,
)!;
assert(nationalRecruit.armies.length === 1 && nationalRecruit.armies[0].identity === 'gov', 'National conscripts must be government units');
assert(nationalRecruit.mapResources![MapFaction.REPUBLICAN].manpower === PRE_START_STATE.mapResources![MapFaction.REPUBLICAN].manpower - 1000, 'National conscripts must spend camp manpower');

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

// Tax bases form a complete monthly loop: unemployment affects employment and
// consumption now, while growth compounds the real-output base for next month.
const highEmploymentEconomy = calculateMonthlyEconomy(stateWith({ unemployment_rate: 5 }));
const lowEmploymentEconomy = calculateMonthlyEconomy(stateWith({ unemployment_rate: 25 }));
assert(highEmploymentEconomy.taxBases.lowerIncome > lowEmploymentEconomy.taxBases.lowerIncome, 'Lower unemployment should expand the wage-income tax base');
assert(highEmploymentEconomy.taxBases.consumption > lowEmploymentEconomy.taxBases.consumption, 'Lower unemployment should expand the consumption-tax base');
assert(economy.nextEconomicOutputIndex > policyState.economic_output_index, 'Positive growth should expand next month\'s real-output index');
const upperTaxAtFifty = calculateMonthlyEconomy(stateWith({ tax_upper_class: 50 }));
const upperTaxAtHundred = calculateMonthlyEconomy(stateWith({ tax_upper_class: 100 }));
assert(upperTaxAtFifty.revenue.total > upperTaxAtHundred.revenue.total, 'Extreme tax rates should shrink collection enough to prevent a 100% rate optimum');

// `budget` is treasury cash. A deficit consumes existing cash before it creates
// debt, and only an unfunded amount at the debt ceiling becomes arrears.
const cashFinancedDeficit = calculateMonthlyEconomy(stateWith({
  budget: 100,
  tax_lower_class: 1,
  tax_middle_class: 1,
  tax_upper_class: 1,
  tax_tariff: 1,
  tax_consumption: 1,
  civilWarStatus: 'ongoing',
}));
assert(cashFinancedDeficit.budgetDelta < 0, 'The cash-financing fixture must run a deficit');
assert(cashFinancedDeficit.nextDebt === PRE_START_STATE.public_debt, 'A deficit covered by treasury cash must not also increase debt');
assert(cashFinancedDeficit.nextBudget < 100, 'A cash-financed deficit must reduce treasury cash');
const debtFinancedDeficit = calculateMonthlyEconomy(stateWith({
  budget: 0,
  tax_lower_class: 1,
  tax_middle_class: 1,
  tax_upper_class: 1,
  tax_tariff: 1,
  tax_consumption: 1,
  civilWarStatus: 'ongoing',
}));
assert(debtFinancedDeficit.financing.newBorrowing > 0 && debtFinancedDeficit.nextDebt > PRE_START_STATE.public_debt, 'An uncovered deficit should create new borrowing');
const arrearsDeficit = calculateMonthlyEconomy(stateWith({
  budget: 0,
  public_debt: 5000,
  tax_lower_class: 1,
  tax_middle_class: 1,
  tax_upper_class: 1,
  tax_tariff: 1,
  tax_consumption: 1,
  civilWarStatus: 'ongoing',
}));
assert(arrearsDeficit.financing.newArrears > 0 && arrearsDeficit.nextFiscalArrears > 0, 'A deficit at the debt ceiling should become fiscal arrears');
assert(adjustUnemploymentRate(stateWith({ unemployment_rate: 12 }), -1.5) === 10.5, 'Cards should be able to reduce unemployment through the shared helper');
assert(adjustUnemploymentRate(stateWith({ unemployment_rate: 99 }), 5) === 100, 'Card unemployment shocks should clamp to 100%');

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
  Math.abs(hardshipClasses.PequenaBurguesia.support.AP - (INITIAL_CLASSES.PequenaBurguesia.support.AP + 4 / 12)) < 0.001,
  'High unemployment should push the petty bourgeoisie toward AP/CEDA (+4/12)',
);
// Note: class support is zero-sum (sum stays 100), so when two forces are
// raised in the same month the later adjustment shaves the earlier one.
// Assertions therefore check the last-applied force exactly and the earlier
// one for a net positive/negative move.
assert(
  hardshipClasses.Obreros.support.CNT_FAI > INITIAL_CLASSES.Obreros.support.CNT_FAI + 0.02,
  'High unemployment should push workers toward CNT-FAI (net gain after zero-sum normalization)',
);
assert(
  Math.abs(hardshipClasses.Braceros.support.FE - (INITIAL_CLASSES.Braceros.support.FE + 1 / 12)) < 0.001,
  'High unemployment should push peasants toward FE when the Falange exists (+1/12)',
);
const noFalangeClasses = calculateEconomicPoliticalFeedback(stateWith({ unemployment_rate: 20, fe_founded: false }));
assert(
  noFalangeClasses.Obreros.support.FE === INITIAL_CLASSES.Obreros.support.FE,
  'FE support must stay untouched while the Falange is not founded',
);
const inflationClasses = calculateEconomicPoliticalFeedback(stateWith({ inflation_rate: 9, fe_founded: true }));
assert(
  inflationClasses.PequenaBurguesia.support.PSOE < INITIAL_CLASSES.PequenaBurguesia.support.PSOE - 0.3,
  'High inflation should move the petty bourgeoisie away from PSOE (-4/12)',
);
assert(
  Math.abs(inflationClasses.PequenaBurguesia.support.FE - (INITIAL_CLASSES.PequenaBurguesia.support.FE + 4 / 12)) < 0.001,
  'High inflation should move the petty bourgeoisie toward FE (+4/12)',
);
const feedbackPipeline = calculateMonthlyPipeline(stateWith({ unemployment_rate: 25, fe_founded: true }));
assert(
  feedbackPipeline.state.classes.PequenaBurguesia.support.AP > INITIAL_CLASSES.PequenaBurguesia.support.AP,
  'The monthly pipeline should apply economic political feedback after policy effects',
);

const policyResult = calculateMonthlyPolicyEffects(stateWith({
  coupSystemActive: false,
  domesticPolicy: { land_law: 2, max_hours_law: 0, workplace_safety: 0 },
}));
assert(policyResult.coupProgress === 0, 'Inactive coup system should reset progress');
assert(policyResult.domesticPolicy.land_reform_progress === 1.5, 'Land law level 2 should add 1.5 monthly progress');
assert(policyResult.stats.revolutionaryFervor > PRE_START_STATE.stats.revolutionaryFervor, 'Unrestricted labor laws should increase monthly fervor');

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

// Formation coverage: every organization must be reachable in a long 1931 game,
// either by scenario default, by a formation event, or by the war mobilisation.
assert(organizations1931.REQUETE_MILITIA?.established === true, 'The Requeté militia must predate 1931');
// Parties and their pre-1931 organizations must already exist when the game opens.
const preExisting1931 = [
  'ERC', 'PRR', 'DLR', 'IR', 'UR', 'JJSS', 'UJCE', 'FNTT', 'UNIO_RABASSAIRES',
];
preExisting1931.forEach((id) => {
  assert(
    organizations1931[id as keyof typeof organizations1931]?.established === true,
    `${id} existed before April 1931 and must be established at the 1931 start`,
  );
});
assert(organizations1931.AP?.established !== true, 'Acción Nacional is founded after the 1931 start and must be formed by an event');
assert(organizations1933.AP?.established === true, 'Acción Popular must already exist at the 1933 start');
assert(organizations1931.PS?.established !== true, 'The Syndicalist Party is founded in 1934 and must not exist at the 1931 start');
// The four P4 organizations and their scenario hydration.
assert(organizations1931.JONS?.established !== true && organizations1933.JONS?.established === true, 'The JONS must be formed by an event in 1931 and already exist at the 1933 start');
assert(organizations1936.JONS?.established !== true, 'The JONS were absorbed into FE de las JONS in 1934 and must not exist at the 1936 start');
assert(organizations1931.SEU?.established !== true && organizations1936.SEU?.established === true, 'The SEU is founded in 1933 and hydrated for later scenarios');
assert(organizations1931.SECCION_FEMENINA?.established !== true && organizations1933.SECCION_FEMENINA?.established !== true && organizations1936.SECCION_FEMENINA?.established === true, 'The Sección Femenina is founded in June 1934');
assert(organizations1931.JSU?.established !== true && organizations1933.JSU?.established !== true && organizations1936.JSU?.established === true, 'The JSU is founded in April 1936');
const p4Events = [jonsFormation, seuFormation, seccionFemeninaFormation, jsuFormation, mujeresAntifascistasFormation, egiFormation, jciFormation];
p4Events.forEach((event) => {
  assert(SCHEDULED_EVENT_REGISTRY.some((scheduled) => scheduled.id === event.id), `${event.id} must be scheduled`);
});
// Each P4 event must actually register its organization.
const p4Cases: Array<[GameEvent, GameState, string]> = [
  [jonsFormation, stateWith({ scenario: '1931', year: 1931, month: 10 }), 'JONS'],
  [seuFormation, stateWith({ scenario: '1931', year: 1933, month: 11, fe_founded: true }), 'SEU'],
  [seccionFemeninaFormation, stateWith({ scenario: '1931', year: 1934, month: 6, fe_founded: true }), 'SECCION_FEMENINA'],
  [jsuFormation, stateWith({ scenario: '1931', year: 1936, month: 4 }), 'JSU'],
  [mujeresAntifascistasFormation, stateWith({ scenario: '1931', year: 1933, month: 6 }), 'MUJERES_ANTIFASCISTAS'],
  [egiFormation, stateWith({ scenario: '1931', year: 1932, month: 1 }), 'EGI'],
  [jciFormation, stateWith({ scenario: '1931', year: 1935, month: 9, organizations: { ...organizations1931, POUM: { established: true, status: 'active' } } }), 'JCI'],
];
p4Cases.forEach(([event, eventState, organizationId]) => {
  assert(event.condition?.(eventState) !== false, `${event.id} must be available in its historical window`);
  const result = event.options[0].effect(eventState);
  assert(
    result.organizations?.[organizationId as keyof typeof result.organizations]?.established === true,
    `${event.id} must register ${organizationId}`,
  );
});
// The Falange's organizations must not appear before the Falange does.
assert(seuFormation.condition?.(stateWith({ scenario: '1931', year: 1933, month: 11, fe_founded: false })) === false, 'The SEU must wait for the Falange');
// JSU absorbs both predecessor youth organizations.
const jsuResult = jsuFormation.options[0].effect(stateWith({ scenario: '1931', year: 1936, month: 4 }));
assert(jsuResult.organizations?.JJSS?.status === 'integrated' && jsuResult.organizations?.UJCE?.status === 'integrated', 'The JSU must absorb the JJSS and the UJCE');
assert(jsuResult.organizations?.JSU?.established === true, 'The JSU itself must be established by the same event');
// FE-JONS merger absorbs the JONS.
const falangeJons = birthOfFeDeLasJons.options[0].effect(stateWith({ scenario: '1931', year: 1934, month: 2, fe_founded: true }));
assert(falangeJons.organizations?.JONS?.status === 'integrated', 'The FE-JONS merger must integrate the JONS organization');
// The Rabassaire union moved off the `UR` id, which now belongs to the party.
assert(organizations1931.UR?.established === true && organizations1931.UNIO_RABASSAIRES?.established === true, 'The party and the Rabassaire union must be separate organizations that both exist in 1931');

const formedByEvent = new Set(['FIJL', 'ML', 'FNA', 'DC', 'PRRevS', 'MAOC', 'CONS', 'POUM', 'FE', 'AP', 'PS', 'JONS', 'SEU', 'SECCION_FEMENINA', 'JSU', 'MUJERES_ANTIFASCISTAS', 'EGI', 'JCI']);
const formedByMobilisation = new Set([
  'PSOE_MILITIA', 'FIFTH_REGIMENT', 'POUM_MILITIA', 'REQUETE_MILITIA',
  'FALANGE_MILITIA', 'EUZKO_GUDAROSTEA', 'INTERNATIONAL_BRIGADES', 'ITALIAN_CTV',
]);
const unreachableOrganizations = ORGANIZATION_DEFINITIONS
  .map((definition) => definition.id)
  .filter((id) => !organizations1931[id]?.established && !formedByEvent.has(id) && !formedByMobilisation.has(id));
assert(unreachableOrganizations.length === 0, `Every organization must be reachable in a 1931 run; unreachable: ${unreachableOrganizations.join(', ')}`);

// Founding POUM and the Falange must write the organization registry, not just the
// party flag, or their militias can never mobilise in a 1931 run.
const poumFounding = foundingOfPOUM.options[0].effect(stateWith({ scenario: '1931', year: 1935, month: 9 }));
assert(poumFounding.organizations?.POUM?.established === true, 'Founding POUM must register the POUM organization');
const falangeFounding = foundingOfFalange.options[0].effect(stateWith({ scenario: '1931', year: 1933, month: 10 }));
assert(falangeFounding.organizations?.FE?.established === true, 'Founding the Falange must register the FE organization');

// A party flag that is set must always imply its organization exists, so old saves
// and any future event that only sets the flag still heal on load.
const flagSynced = normalizeOrganizationState(stateWith({
  scenario: '1931',
  poum_founded: true,
  fe_founded: true,
  ps_founded: true,
  organizations: organizations1931,
}));
assert(flagSynced.organizations.POUM?.established === true, 'A set party flag must establish its organization');
assert(flagSynced.organizations.FE?.established === true, 'A set Falange flag must establish its organization');
assert(flagSynced.organizations.PS?.established === true, 'A set Syndicalist Party flag must establish its organization');
assert(flagSynced.organizations.ML?.established !== true, 'An unset flag must never dissolve an organization');
// Legacy saves kept the Rabassaire union under the `UR` id.
const legacyUnion = normalizeOrganizationState(stateWith({
  scenario: '1931',
  organizations: { ...organizations1931, UR: { established: true, status: 'active' } },
}));
assert(legacyUnion.organizations.UNIO_RABASSAIRES?.established === true, 'A legacy UR union entry must move to its new id');
assert(legacyUnion.organizations.UR?.established === true, 'The UR party organization must survive the legacy migration');

// The two news events that fill the remaining gaps.
assert(SCHEDULED_EVENT_REGISTRY.some((event) => event.id === maocFormation.id) && SCHEDULED_EVENT_REGISTRY.some((event) => event.id === consFormation.id), 'The MAOC and CONS formation events must be scheduled');
const maocState = stateWith({ scenario: '1931', year: 1933, month: 1 });
assert(maocFormation.condition?.(maocState) === true, 'The MAOC must form in a 1931 run reaching 1933');
assert(maocFormation.condition?.({ ...maocState, scenario: '1936' }) === false, 'The MAOC must not form in the 1936 start');
assert(maocFormation.options[0].effect(maocState).organizations?.MAOC?.established === true, 'The MAOC event must register the organization');

const consState = stateWith({ scenario: '1931', year: 1934, month: 6, fe_founded: true });
assert(consFormation.condition?.(consState) === true, 'The CONS must form in a 1931 run once the Falange exists');
assert(consFormation.condition?.({ ...consState, fe_founded: false }) === false, 'The CONS must wait for the Falange');
assert(consFormation.options[0].effect(consState).organizations?.CONS?.established === true, 'The CONS event must register the organization');
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
assert(SCHEDULED_EVENT_REGISTRY.some((event) => event.id === fijlFormation.id) && SCHEDULED_EVENT_REGISTRY.some((event) => event.id === mujeresLibresFormation.id), 'Organization formation events should be registered in the scheduled event catalog');
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
const mapStage = calculateMonthlyMapStage(PRE_START_STATE);
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
assert(!('budgetChange' in incomeTaxChange), 'Income-tax submission must not create immediate treasury cash');
assert(incomeTaxChange.faistasDissent === 3, 'Income-tax calculator should combine anarchist dissent effects');
const tradeTaxChange = calculateTariffConsumptionAdjustment(5, -3);
assert(!('foreignExchangeGain' in tradeTaxChange), 'Tariff submission must not create immediate foreign exchange');
assert(tradeTaxChange.workingClassSupport === 3, 'Consumption-tax cuts should support working classes');

// A fiscal review freezes its baseline, writes only drafts, locks each group
// after one submission, and commits rates together on conclusion.
const fiscalBase = stateWith({ cntStance: 'govern', ministers: { ...PRE_START_STATE.ministers, finance: 'CNT' } });
const fiscalStarted = { ...fiscalBase, ...fiscalPolicy.effect(fiscalBase) } as GameState;
assert(fiscalStarted.temp_tax_lower === fiscalBase.tax_lower_class && fiscalStarted.draft_tax_lower === fiscalBase.tax_lower_class, 'Starting a fiscal review should capture an immutable baseline and a separate draft');
const incomeDraft = { ...fiscalStarted, draft_tax_lower: fiscalStarted.draft_tax_lower! + 5 };
const submittedPatch = fiscalPolicyIncomeTaxesEvent.options[0].effect(incomeDraft);
const incomeSubmitted = { ...incomeDraft, ...submittedPatch } as GameState;
assert(incomeSubmitted.tax_lower_class === fiscalBase.tax_lower_class, 'Submitting a tax group must not change the active rate');
assert(incomeSubmitted.budget === fiscalBase.budget, 'Submitting a tax group must not change treasury cash');
assert(incomeSubmitted.fiscal_income_tax_submitted === true, 'Submitting should lock the income-tax group for this review');
assert(fiscalPolicyEvent.options[0].condition?.(incomeSubmitted) === false, 'A submitted tax group must not be opened and submitted twice');
const concluded = { ...incomeSubmitted, ...fiscalPolicyEvent.options[2].effect(incomeSubmitted) } as GameState;
assert(concluded.tax_lower_class === fiscalBase.tax_lower_class + 5, 'Concluding the review should enact the staged rate exactly once');
assert(concluded.budget === fiscalBase.budget, 'Enacting a rate should still leave revenue for the next monthly settlement');
assert(concluded.draft_tax_lower === undefined && concluded.temp_tax_lower === undefined, 'Concluding the review should clear draft and baseline fields');

const normalIntervention = gameReducer(stateWith({ difficulty: 'normal', sandboxSovereignInterventionsEnabled: true }), { type: 'SELL_GOLD_FOR_FX' });
assert(normalIntervention.gold_reserves === PRE_START_STATE.gold_reserves, 'Emergency sovereign interventions must be blocked outside sandbox mode');
const hiddenSandboxIntervention = gameReducer(stateWith({ difficulty: 'sandbox', sandboxSovereignInterventionsEnabled: false }), { type: 'SELL_GOLD_FOR_FX' });
assert(hiddenSandboxIntervention.gold_reserves === PRE_START_STATE.gold_reserves, 'Emergency sovereign interventions must be blocked until the sandbox toggle is enabled');
const enabledSandboxIntervention = gameReducer(stateWith({ difficulty: 'sandbox', sandboxSovereignInterventionsEnabled: true }), { type: 'SELL_GOLD_FOR_FX' });
assert(enabledSandboxIntervention.gold_reserves === PRE_START_STATE.gold_reserves - 100, 'The sandbox toggle should enable emergency sovereign interventions');

console.log('Pure rules calculator tests passed.');
