import { MapFaction, type ArmedEntityId, type ArmyIdentity, type ResourceSet } from '../map/types_map';
import { createDefaultMapResources, INITIAL_PROVINCES, SPANISH_ARMY_FORMATIONS } from '../map/map_constants';
import type { ArmedEntityPool, GameState, OrganizationState, OrganizationStateMap } from './types';
import { getDefaultArmedEntityPools, ORGANIZATION_DEFINITIONS } from './organizations';
import { applySecurityForcesDerivedState } from './rules/securityForces';
import { ECONOMIC_RULES } from './rules/economy';
import { normalizeGeneralElectionSchedule } from './rules/electionSchedule';

interface LegacyMilitiaView {
  cntFai?: number;
  maoc?: number;
  poum?: number;
  ugt?: number;
  requete?: number;
  falange?: number;
}

type LegacyOrganizationState = OrganizationState & { militiaManpower?: number };
const DEPRECATED_SDAAH_STATE_KEYS = [
  'socialism',
  'nationalism',
  'pacifism',
  'democratization',
  'pro_republic',
] as const;
type DeprecatedSdaahStateKey = (typeof DEPRECATED_SDAAH_STATE_KEYS)[number];

type LegacySaveState = Omit<GameState, 'organizations' | 'armedForces' | 'generalElectionSchedule'>
  & Partial<Record<DeprecatedSdaahStateKey, number>>
  & {
    uhp_journal_activated?: boolean;
    generalElectionSchedule?: GameState['generalElectionSchedule'];
    organizations?: OrganizationStateMap & Record<string, LegacyOrganizationState | undefined>;
    armedForces?: Partial<GameState['armedForces']> & {
      militias?: LegacyMilitiaView;
      entityPools?: Record<string, ArmedEntityPool | undefined>;
    };
  };

const removeDeprecatedSdaahState = (state: LegacySaveState): LegacySaveState => {
  const next = { ...state };
  for (const key of DEPRECATED_SDAAH_STATE_KEYS) delete next[key];
  return next;
};

const migrateGeneralElectionSchedule = (state: LegacySaveState): LegacySaveState => {
  const schedule = normalizeGeneralElectionSchedule(state);
  const minimumCrisisSequence = schedule.crisis?.coalitionId === 'ceda_radical'
    ? 2
    : schedule.crisis?.coalitionId === 'republican_socialist'
      ? 1
      : 0;
  const governmentCrisisSequence = Math.max(
    Number.isFinite(state.governmentCrisisSequence) ? state.governmentCrisisSequence : 0,
    Number.isFinite(state.dissolutionCount) ? state.dissolutionCount : 0,
    minimumCrisisSequence,
  );
  return {
    ...state,
    governmentCrisisSequence,
    generalElectionSchedule: schedule.crisis
      ? {
          ...schedule,
          crisis: {
            ...schedule.crisis,
            sequence: Math.max(schedule.crisis.sequence, minimumCrisisSequence),
          },
        }
      : schedule,
  };
};

const LEGACY_MILITIA_POOLS: ReadonlyArray<[keyof LegacyMilitiaView, ArmedEntityId]> = [
  ['cntFai', 'cnt_defense_committees'],
  ['maoc', 'maoc'],
  ['poum', 'poum_militias'],
  ['ugt', 'ugt_socialist_militias'],
  ['requete', 'requetes'],
  ['falange', 'falange_first_line'],
];

const migrateEconomyV2 = (state: LegacySaveState): LegacySaveState => ({
  ...state,
  budget: Math.max(0, Number.isFinite(state.budget) ? state.budget : ECONOMIC_RULES.defaults.budget),
  fiscal_arrears: Number.isFinite(state.fiscal_arrears)
    ? Math.max(0, state.fiscal_arrears)
    : ECONOMIC_RULES.defaults.fiscalArrears,
  economic_output_index: Number.isFinite(state.economic_output_index)
    ? state.economic_output_index
    : ECONOMIC_RULES.defaults.outputIndex,
  sandboxSovereignInterventionsEnabled: state.sandboxSovereignInterventionsEnabled === true,
});

const migrateUhpJournalContract = (state: LegacySaveState): LegacySaveState => {
  const next = { ...state };
  delete next.uhp_journal_activated;
  if (state.uhp_journal_activated === true && state.journal?.journal_uhp?.status === 'inactive') {
    next.journal = {
      ...state.journal,
      journal_uhp: { ...state.journal.journal_uhp, status: 'active' },
    };
  }
  return next;
};

const migrateOrganizationIdsAndPools = (state: LegacySaveState): GameState => {
  const rawOrganizations = { ...(state.organizations || {}) } as Record<string, LegacyOrganizationState | undefined>;
  if (rawOrganizations.MC?.established && !rawOrganizations.DC?.established) {
    rawOrganizations.DC = { ...(rawOrganizations.DC || {}), ...rawOrganizations.MC };
  }
  delete rawOrganizations.MC;
  if (!rawOrganizations.UNIO_RABASSAIRES && rawOrganizations.UR) {
    rawOrganizations.UNIO_RABASSAIRES = { ...rawOrganizations.UR };
    delete rawOrganizations.UR;
  }

  const legacyArmedForces = state.armedForces || {};
  const legacyPools = (legacyArmedForces.entityPools || {}) as Record<string, ArmedEntityPool | undefined>;
  const entityPools = {
    ...getDefaultArmedEntityPools(),
    ...legacyPools,
  } as Record<ArmedEntityId, ArmedEntityPool>;

  const confederalPool = legacyPools.milicias_confederales;
  if (confederalPool) {
    const current = entityPools.cnt_defense_committees;
    entityPools.cnt_defense_committees = {
      ...current,
      status: current.status === 'active' || confederalPool.status === 'active' ? 'active' : current.status,
      manpower: current.manpower + confederalPool.manpower,
      artillery: current.artillery + confederalPool.artillery,
      tanks: current.tanks + confederalPool.tanks,
    };
  }
  delete (entityPools as Record<string, unknown>).milicias_confederales;

  for (const [legacyKey, entityId] of LEGACY_MILITIA_POOLS) {
    const legacyValue = legacyArmedForces.militias?.[legacyKey];
    if (legacyValue === undefined) continue;
    entityPools[entityId] = {
      ...entityPools[entityId],
      manpower: Math.max(entityPools[entityId].manpower, Math.max(0, legacyValue)),
    };
  }

  for (const definition of ORGANIZATION_DEFINITIONS) {
    const current = rawOrganizations[definition.id];
    if (!current) continue;
    const { militiaManpower, ...canonical } = current;
    rawOrganizations[definition.id] = canonical;
    if (!definition.armedEntityId || militiaManpower === undefined) continue;
    entityPools[definition.armedEntityId] = {
      ...entityPools[definition.armedEntityId],
      manpower: Math.max(entityPools[definition.armedEntityId].manpower, Math.max(0, militiaManpower)),
    };
  }

  if (state.internationalBrigades > 0) {
    entityPools.international_brigades = {
      ...entityPools.international_brigades,
      manpower: Math.max(entityPools.international_brigades.manpower, state.internationalBrigades),
    };
  }

  const { militias: _legacyMilitias, ...canonicalArmedForces } = legacyArmedForces;
  const absentCorps = { manpower: 0, loyalty: 0 };
  return {
    ...state,
    organizations: rawOrganizations as OrganizationStateMap,
    armedForces: {
      ...canonicalArmedForces,
      guardiaNacional: legacyArmedForces.guardiaNacional || absentCorps,
      guardiaAsalto: legacyArmedForces.guardiaAsalto || absentCorps,
      guardiaRepublicana: legacyArmedForces.guardiaRepublicana || absentCorps,
      patrullasObreras: legacyArmedForces.patrullasObreras || absentCorps,
      entityPools,
    } as GameState['armedForces'],
  } as GameState;
};

const ARMY_IDENTITIES = new Set<ArmyIdentity>(['gov', 'cnt', 'ugt', 'poum', 'pce', 'intl', 'requetes', 'falange', 'regional']);

const migrateMilitaryState = (state: GameState): GameState => {
  const armies = (state.armies || []).map((army) => ({
    ...army,
    identity: ARMY_IDENTITIES.has(army.identity as ArmyIdentity) ? army.identity : 'gov',
  }));
  if (!state.armyFormations) {
    const atPeace = state.civilWarStatus === 'not_started' && !state.activeWar;
    const formations = atPeace && armies.length > 0
      ? armies.map((army) => ({
          id: army.id,
          name: army.name || army.id,
          nameZh: army.nameZh || army.name || army.id,
          provinceId: army.provinceId,
          manpower: army.manpower,
          maxManpower: army.maxManpower,
          composition: army.composition,
          designedComposition: army.designedComposition,
          morale: army.morale,
          militarization: army.militarization,
        }))
      : SPANISH_ARMY_FORMATIONS;
    return applySecurityForcesDerivedState({ ...state, armies: atPeace ? [] : armies, armyFormations: formations });
  }
  return applySecurityForcesDerivedState({ ...state, armies });
};

const migrateMapState = (state: GameState): GameState => {
  const resources = createDefaultMapResources();
  const savedResources = state.mapResources as Partial<Record<MapFaction, Partial<ResourceSet>>> | undefined;
  for (const faction of Object.values(MapFaction)) {
    const saved = savedResources?.[faction];
    if (saved) resources[faction] = { ...resources[faction], ...saved };
  }
  return {
    ...state,
    provinces: state.provinces || { ...INITIAL_PROVINCES },
    armies: Array.isArray(state.armies) ? state.armies : [],
    mapSelectedProvinceId: state.mapSelectedProvinceId ?? null,
    mapSelectedArmyId: state.mapSelectedArmyId ?? null,
    mapSelectedArmyIds: Array.isArray(state.mapSelectedArmyIds) ? state.mapSelectedArmyIds : [],
    mapCurrentPlayer: state.mapCurrentPlayer ?? MapFaction.REPUBLICAN,
    mapResources: resources,
    mapHistory: Array.isArray(state.mapHistory) ? state.mapHistory : [],
  };
};

/** Convert every accepted v2 legacy shape before it enters typed reducers. */
export const migrateSaveState = (rawState: unknown): GameState => {
  const raw = rawState as LegacySaveState;
  const withoutDeprecatedSdaahState = removeDeprecatedSdaahState(raw);
  return migrateMapState(
    migrateMilitaryState(
      migrateOrganizationIdsAndPools(
        migrateUhpJournalContract(migrateEconomyV2(migrateGeneralElectionSchedule(withoutDeprecatedSdaahState))),
      ),
    ),
  );
};
