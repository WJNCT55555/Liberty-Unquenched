import { MapFaction, type ArmedEntityId, type ArmyIdentity, type ResourceSet } from '../map/types_map';
import { createDefaultMapResources, INITIAL_PROVINCES, SPANISH_ARMY_FORMATIONS } from '../map/map_constants';
import type { ArmedEntityPool, GameState, OrganizationState, OrganizationStateMap } from './types';
import { getDefaultArmedEntityPools, ORGANIZATION_DEFINITIONS } from './organizations';
import { applySecurityForcesDerivedState } from './rules/securityForces';
import {
  clampMilitarization,
  createDefaultMilitarization,
  createDefaultMilitarizationPaths,
  MILITIA_GROUPS,
} from './rules/militarization';
import { ECONOMIC_RULES } from './rules/economy';
import { normalizeGeneralElectionSchedule } from './rules/electionSchedule';
import {
  ECONOMY_COUNTERS,
  ECONOMY_COUNTER_DEFAULTS,
  type EconomyCounter,
  type EconomyPushCounter,
} from './rules/economyReforms';
import { JOURNAL_ENTRIES } from './journal';
import { getInitialControlShares } from './scenarios/controlShares';
import {
  INDUSTRY_PRIVATE_KEYS,
  INDUSTRY_WORKER_KEYS,
  LAND_PRIVATE_KEYS,
  LAND_WORKER_KEYS,
} from './rules/controlShares';

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
  & Partial<Record<EconomyCounter, number>>
  & {
    uhp_journal_activated?: boolean;
    alliance_obrera_activated?: boolean;
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

/**
 * 经济改造计数器（docs/经济改造方案.md §10.2）。
 *
 * 旧存档完全没有这 18 个字段与顾问推动计数，必须逐个补齐默认 0：
 * `advanceEconomyCounter()` 对缺失值按 0 处理，但 UI 与 `effectPreview` 会直接读字段，
 * 缺失会显示成空白；`calculateEconomyReformGraphs` 也会把 undefined 当 0，不会崩，
 * 但补齐之后整条链的行为才是确定的。
 */
const migrateEconomyReformV3 = (state: LegacySaveState): LegacySaveState => {
  const record = state as Record<string, unknown>;
  const next: Record<string, unknown> = { ...record };
  for (const key of ECONOMY_COUNTERS) {
    const current = record[key];
    next[key] = Number.isFinite(current) ? Math.max(0, current as number) : ECONOMY_COUNTER_DEFAULTS[key];
  }
  const economy = (record.economy ?? {}) as Partial<Record<EconomyPushCounter, unknown>>;
  next.economy = {
    cooperativePushes: Number.isFinite(economy.cooperativePushes) ? Math.max(0, economy.cooperativePushes as number) : 0,
    organicPushes: Number.isFinite(economy.organicPushes) ? Math.max(0, economy.organicPushes as number) : 0,
  };
  return next as LegacySaveState;
};

/**
 * 所有权饼（docs/工人控制度改造方案.md §3.2）。
 *
 * 旧档只有一根 `stats.workerControl` 标尺（1931 开局为 10，且三份剧本共用）。新口径下
 * `workerControl` 是**派生值**（两个部门劳动者份额的均值），因此必须把旧值折算进饼，
 * 否则读旧档会凭空少掉 8 点控制权。
 *
 * 折算规则：
 *  1. 以该剧本的初值为基准；
 *  2. `delta = 旧值 − 派生初值`（1931：10 − 2 = 8；1933：10 − 3.5 = 6.5；1936：10 − 5 = 5）；
 *  3. `delta > 0` 时从**私人三项**按比例取出、平分给劳动者桶；`delta < 0` 时反向退回。
 *     **国有份额保持不变**——旧标尺从未表达过"国有"，凭空调整它会伪造历史。
 */
const LEGACY_WORKER_CONTROL_BASELINE: Record<GameState['scenario'], number> = {
  // getWorkerControlEquivalent(初值) = 两个部门劳动者份额的均值。
  '1931': (2 + 2) / 2,
  '1933': (3 + 4) / 2,
  '1936': (6 + 4) / 2,
};

const migrateControlShares = (state: LegacySaveState): LegacySaveState => {
  const record = state as Record<string, unknown>;
  const scenario = (record.scenario as GameState['scenario']) ?? '1931';
  const existing = record.controlShares as GameState['controlShares'] | undefined;
  const stats = record.stats as GameState['stats'] | undefined;
  const legacyWorkerControl = stats && Number.isFinite(stats.workerControl) ? stats.workerControl : undefined;

  // 已经有饼的档（新档二次读入）只需保证形状完整。
  const base: NonNullable<GameState['controlShares']> = existing
    ? { land: { ...existing.land }, industry: { ...existing.industry } }
    : getInitialControlShares(scenario);

  if (existing || legacyWorkerControl === undefined) {
    return { ...state, controlShares: base };
  }

  const delta = legacyWorkerControl - LEGACY_WORKER_CONTROL_BASELINE[scenario];
  if (Math.abs(delta) < 1e-9) return { ...state, controlShares: base };

  const shift = (pie: Record<string, number>, privateKeys: readonly string[], workerKeys: readonly string[]) => {
    const next: Record<string, number> = { ...pie };
    const privatePool = privateKeys.reduce((sum, key) => sum + Math.max(0, next[key] ?? 0), 0);
    if (privatePool <= 0) return next;
    privateKeys.forEach((key) => {
      const value = Math.max(0, next[key] ?? 0);
      next[key] = Math.max(0, value - delta * (value / privatePool));
    });
    const perWorkerKey = delta / workerKeys.length;
    workerKeys.forEach((key) => { next[key] = Math.max(0, (next[key] ?? 0) + perWorkerKey); });

    const keys = Object.keys(next);
    keys.forEach((key) => { next[key] = Math.round(next[key]); });
    const total = keys.reduce((sum, key) => sum + next[key], 0);
    if (total !== 100) {
      const largest = keys.reduce((best, key) => (next[key] > next[best] ? key : best), keys[0]);
      next[largest] = Math.max(0, next[largest] + (100 - total));
    }
    return next;
  };

  return {
    ...state,
    controlShares: {
      land: shift(base.land as unknown as Record<string, number>, LAND_PRIVATE_KEYS, LAND_WORKER_KEYS),
      industry: shift(base.industry as unknown as Record<string, number>, INDUSTRY_PRIVATE_KEYS, INDUSTRY_WORKER_KEYS),
    } as GameState['controlShares'],
  };
};

/**
 * 补齐旧存档缺失的日志条目。
 *
 * `state.journal` 随存档保存，新增日志不会自动出现在旧档里；而 `activateJournal()`
 * 在 `state.journal[id]` 不存在时直接返回空补丁（rules/journalEvents.ts），
 * 于是新路线点了没反应且不报错。这里按当前的 `JOURNAL_ENTRIES` 建缺失条目。
 *
 * 之所以放在迁移而不是 `deserializeGameState`：保持"读档只做一次形状修正"的分工，
 * 并且这一段可以被 `test:save-system` 直接覆盖。
 */
const migrateJournalEntries = (state: LegacySaveState): LegacySaveState => {
  const journal = { ...(state.journal ?? {}) } as Record<string, { id: string; status: string; progress: number }>;
  for (const entry of JOURNAL_ENTRIES) {
    if (!journal[entry.id]) journal[entry.id] = { id: entry.id, status: 'inactive', progress: 0 };
  }
  return { ...state, journal: journal as GameState['journal'] };
};

const migrateJournalEventContract = (state: LegacySaveState): LegacySaveState => {
  const next = { ...state };
  delete next.uhp_journal_activated;
  delete next.alliance_obrera_activated;

  const journal = state.journal ? { ...state.journal } : undefined;
  if (!journal) return next;

  // UHP：过去由 `uhp_journal_activated` 标志在月结时激活，现在由开始事件
  // （「工人联盟的尝试？」）直接把日志写成 active。
  if (state.uhp_journal_activated === true && journal.journal_uhp?.status === 'inactive') {
    journal.journal_uhp = { ...journal.journal_uhp, status: 'active' };
  }

  // 工人联盟：过去由 UHP 的 onComplete 写 `alliance_obrera_activated` 再自行激活，
  // 现在由「十字路口」选项 A 开启。旧档若停在"标志已置位／已选择起义但日志尚未开启"
  // 的那一个月，这里补上激活，避免链断掉。
  const alianzaShouldBeOpen = state.alliance_obrera_activated === true || state.crossroads_choice === 'uprising';
  if (alianzaShouldBeOpen && journal.journal_alianza_obrera?.status === 'inactive') {
    journal.journal_alianza_obrera = { ...journal.journal_alianza_obrera, status: 'active' };
  }

  next.journal = journal;
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

/**
 * Introduces the per-force-group militarization model.
 *
 * Legacy saves carried a single global `militiaCombatPower` scalar with a
 * baseline of 100. Its excess is worth half a point of militarization per point
 * (the same 0.5 conversion the old mobilization used) and is spread over the
 * militia groups, because that scalar only ever described militia quality.
 *
 * `militarizationPaths` is a pure addition: an old save was written before the
 * civil-war route choice existed, so it starts at `none`.
 */
const migrateMilitarization = (state: GameState): GameState => {
  const legacyPower = Number((state as GameState & { militiaCombatPower?: number }).militiaCombatPower ?? 100);
  const legacyDelta = Number.isFinite(legacyPower) ? (legacyPower - 100) * 0.5 : 0;

  const stored = state.militarization as Partial<Record<ArmyIdentity, number>> | undefined;
  const militarization = createDefaultMilitarization();
  (Object.keys(militarization) as ArmyIdentity[]).forEach((group) => {
    const saved = stored?.[group];
    if (Number.isFinite(saved)) {
      militarization[group] = clampMilitarization(saved as number);
      return;
    }
    if (legacyDelta !== 0 && MILITIA_GROUPS.includes(group)) {
      militarization[group] = clampMilitarization(militarization[group] + legacyDelta);
    }
  });

  const { militiaCombatPower: _legacyMilitiaCombatPower, ...withoutLegacyScalar } =
    state as GameState & { militiaCombatPower?: number };

  return {
    ...withoutLegacyScalar,
    militarization,
    militarizationPaths: state.militarizationPaths ?? createDefaultMilitarizationPaths(),
  } as GameState;
};

/** Convert every accepted v2 legacy shape before it enters typed reducers. */
export const migrateSaveState = (rawState: unknown): GameState => {
  const raw = rawState as LegacySaveState;
  const withoutDeprecatedSdaahState = removeDeprecatedSdaahState(raw);
  return migrateMilitarization(
    migrateMapState(
      migrateMilitaryState(
        migrateOrganizationIdsAndPools(
          migrateJournalEntries(
            migrateControlShares(
              migrateEconomyReformV3(
                migrateJournalEventContract(migrateEconomyV2(migrateGeneralElectionSchedule(withoutDeprecatedSdaahState))),
              ),
            ),
          ),
        ),
      ),
    ),
  );
};
