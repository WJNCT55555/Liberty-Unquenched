import type {
  GameState,
  OrganizationId,
  OrganizationOwner,
  OrganizationState,
  OrganizationStateMap,
  OrganizationType,
  ArmedEntityId,
  ArmedEntityPool,
  OrganizationUiVisibility,
} from './types';

export interface OrganizationDefinition {
  id: OrganizationId;
  abbreviation: string;
  name: string;
  nameZh: string;
  type: OrganizationType;
  owner: OrganizationOwner;
  icon?: string;
  defaultEstablished?: Partial<Record<GameState['scenario'], boolean>>;
  defaultEstablishedAt?: Partial<Record<GameState['scenario'], { year: number; month: number }>>;
  uiVisibility: OrganizationUiVisibility;
  armedEntityId?: ArmedEntityId;
  militiaDisplayName?: string;
  militiaDisplayNameZh?: string;
  monthlyEffect?: (state: GameState) => Partial<GameState>;
  monthlyEffectText: string;
  monthlyEffectTextZh: string;
  capabilityText?: string;
  capabilityTextZh?: string;
}

export type OrganizationStateReader = {
  organizations: OrganizationStateMap;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

/**
 * Single source of truth for organizations.  The owner field intentionally
 * accepts every party even though only CNT-FAI organizations are surfaced in
 * the UI during this iteration.
 */
export const ORGANIZATION_DEFINITIONS: OrganizationDefinition[] = [
  {
    id: 'CNT',
    abbreviation: 'CNT',
    name: 'Confederación Nacional del Trabajo',
    nameZh: '全国劳工联合会',
    type: 'union',
    owner: 'CNT_FAI',
    icon: '/img/Organization/CNT_Emblem.png',
    defaultEstablished: { '1931': true, '1933': true, '1936': true },
    defaultEstablishedAt: { '1931': { year: 1910, month: 10 }, '1933': { year: 1910, month: 10 }, '1936': { year: 1910, month: 10 } },
    uiVisibility: 'visible',
    monthlyEffectText: 'No monthly effect.',
    monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'FAI',
    abbreviation: 'FAI',
    name: 'Federación Anarquista Ibérica',
    nameZh: '伊比利亚无政府主义联合会',
    type: 'political',
    owner: 'CNT_FAI',
    icon: '/img/Organization/FAI_Emblem.png',
    defaultEstablished: { '1931': true, '1933': true, '1936': true },
    defaultEstablishedAt: { '1931': { year: 1927, month: 7 }, '1933': { year: 1927, month: 7 }, '1936': { year: 1927, month: 7 } },
    uiVisibility: 'visible',
    monthlyEffectText: '+1 Revolutionary Fervor each month.',
    monthlyEffectTextZh: '每月革命热情 +1。',
    monthlyEffect: (state) => ({
      stats: {
        ...state.stats,
        revolutionaryFervor: clampPercent((state.stats?.revolutionaryFervor ?? 0) + 1),
      },
    }),
  },
  {
    id: 'FIJL',
    abbreviation: 'FIJL',
    name: 'Federación Ibérica de Juventudes Libertarias',
    nameZh: '伊比利亚自由青年联合会',
    type: 'youth',
    owner: 'CNT_FAI',
    icon: '/img/Organization/JJLA_Emblempng.png',
    defaultEstablished: { '1933': true, '1936': true },
    defaultEstablishedAt: { '1933': { year: 1932, month: 1 }, '1936': { year: 1932, month: 1 } },
    uiVisibility: 'visible',
    monthlyEffectText: 'No monthly effect.',
    monthlyEffectTextZh: '暂无月度效果。',
    capabilityText: 'Enables the FIJL action card.',
    capabilityTextZh: '可使用 FIJL 行动卡牌。',
  },
  {
    id: 'ML',
    abbreviation: 'ML',
    name: 'Mujeres Libres',
    nameZh: '自由女性',
    type: 'women',
    owner: 'CNT_FAI',
    defaultEstablished: { '1936': true },
    defaultEstablishedAt: { '1936': { year: 1936, month: 5 } },
    uiVisibility: 'visible',
    monthlyEffectText: 'No monthly effect.',
    monthlyEffectTextZh: '暂无月度效果。',
    capabilityText: 'Enables the Mujeres Libres action card.',
    capabilityTextZh: '可使用 Mujeres Libres 行动卡牌。',
  },
  {
    id: 'FNA',
    abbreviation: 'FNA',
    name: 'Federación Nacional de Agricultores',
    nameZh: '全国农民联合会',
    type: 'agricultural',
    owner: 'CNT_FAI',
    uiVisibility: 'visible',
    monthlyEffectText: 'No monthly effect.',
    monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'DC',
    abbreviation: 'DC',
    name: 'Comités de Defensa',
    nameZh: '防御委员会',
    type: 'militia',
    owner: 'CNT_FAI',
    defaultEstablished: { '1936': true },
    defaultEstablishedAt: { '1936': { year: 1934, month: 11 } },
    uiVisibility: 'visible',
    armedEntityId: 'cnt_defense_committees',
    militiaDisplayName: 'Milicias Confederales',
    militiaDisplayNameZh: '联合民兵',
    monthlyEffectText: 'No recurring numeric effect.',
    monthlyEffectTextZh: '无持续数值效果。',
    capabilityText: 'Serves as the CNT militia organization and enables the military deck.',
    capabilityTextZh: '作为 CNT 民兵组织，并启用武装事务牌库。',
  },
  {
    id: 'PSOE', abbreviation: 'PSOE', name: 'Partido Socialista Obrero Español', nameZh: '西班牙社会主义工人党',
    type: 'political', owner: 'PSOE', defaultEstablished: { '1931': true, '1933': true, '1936': true },
    defaultEstablishedAt: { '1931': { year: 1879, month: 5 }, '1933': { year: 1879, month: 5 }, '1936': { year: 1879, month: 5 } }, uiVisibility: 'internal',
    monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'UGT', abbreviation: 'UGT', name: 'Unión General de Trabajadores', nameZh: '劳动者总工会',
    type: 'union', owner: 'PSOE', defaultEstablished: { '1931': true, '1933': true, '1936': true },
    defaultEstablishedAt: { '1931': { year: 1888, month: 8 }, '1933': { year: 1888, month: 8 }, '1936': { year: 1888, month: 8 } }, uiVisibility: 'internal',
    armedEntityId: 'ugt_socialist_militias', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  // 参与工会占比向量（unionShare）的其他工会。它们是"对手工会"，
  // 与 CNT 争夺同一批劳动者或乡村社会主导权，因此注册在这里以便
  // 复用 owner / 成立状态 / 标签等元数据；全部 internal，不进入 CNT-FAI 组织网格。
  {
    id: 'UR', abbreviation: 'UR', name: 'Unió de Rabassaires', nameZh: '拉巴塞尔联盟',
    type: 'union', owner: 'ERC', defaultEstablished: { '1931': true, '1933': true, '1936': true },
    defaultEstablishedAt: { '1931': { year: 1922, month: 6 }, '1933': { year: 1922, month: 6 }, '1936': { year: 1922, month: 6 } }, uiVisibility: 'internal',
    monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'ELA', abbreviation: 'ELA', name: 'Eusko Langileen Alkartasuna', nameZh: '巴斯克工人团结工会',
    type: 'union', owner: 'PNV', defaultEstablished: { '1931': true, '1933': true, '1936': true },
    defaultEstablishedAt: { '1931': { year: 1911, month: 7 }, '1933': { year: 1911, month: 7 }, '1936': { year: 1911, month: 7 } }, uiVisibility: 'internal',
    monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'CNCA', abbreviation: 'CNCA', name: 'Confederación Nacional Católica Agraria', nameZh: '天主教农业联合会',
    type: 'union', owner: 'AP', defaultEstablished: { '1931': true, '1933': true, '1936': true },
    defaultEstablishedAt: { '1931': { year: 1916, month: 5 }, '1933': { year: 1916, month: 5 }, '1936': { year: 1916, month: 5 } }, uiVisibility: 'internal',
    monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    // 长枪党的国家工团主义工会，1934-06 成立：1931 / 1933 剧本开局尚未存在。
    id: 'CONS', abbreviation: 'CONS', name: 'Central Obrera Nacional-Sindicalista', nameZh: '国家工团工会组织',
    type: 'union', owner: 'FE', defaultEstablished: { '1936': true },
    defaultEstablishedAt: { '1936': { year: 1934, month: 6 } }, uiVisibility: 'internal',
    monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'PSOE_MILITIA', abbreviation: 'PSOE-M', name: 'Socialist Militia', nameZh: '社会主义民兵', type: 'militia', owner: 'PSOE',
    uiVisibility: 'internal', armedEntityId: 'ugt_socialist_militias', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'PCE', abbreviation: 'PCE', name: 'Partido Comunista de España', nameZh: '西班牙共产党', type: 'political', owner: 'PCE',
    defaultEstablished: { '1931': true, '1933': true, '1936': true },
    defaultEstablishedAt: { '1931': { year: 1921, month: 11 }, '1933': { year: 1921, month: 11 }, '1936': { year: 1921, month: 11 } }, uiVisibility: 'internal',
    monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'MAOC', abbreviation: 'MAOC', name: 'Milicias Antifascistas Obreras y Campesinas', nameZh: '工农反法西斯民兵', type: 'militia', owner: 'PCE',
    defaultEstablished: { '1933': true, '1936': true }, defaultEstablishedAt: { '1933': { year: 1933, month: 1 }, '1936': { year: 1933, month: 1 } },
    uiVisibility: 'internal', armedEntityId: 'maoc', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'FIFTH_REGIMENT', abbreviation: '5º', name: 'Fifth Regiment', nameZh: '第五团', type: 'militia', owner: 'PCE',
    uiVisibility: 'internal', armedEntityId: 'fifth_regiment', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'POUM', abbreviation: 'POUM', name: 'Partido Obrero de Unificación Marxista', nameZh: '马克思主义统一工人党', type: 'political', owner: 'POUM',
    defaultEstablished: { '1936': true }, defaultEstablishedAt: { '1936': { year: 1935, month: 9 } }, uiVisibility: 'internal',
    monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'POUM_MILITIA', abbreviation: 'POUM-M', name: 'POUM Militias', nameZh: 'POUM 民兵', type: 'militia', owner: 'POUM',
    uiVisibility: 'internal', armedEntityId: 'poum_militias', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'CT', abbreviation: 'CT', name: 'Comunión Tradicionalista', nameZh: '传统主义共同体', type: 'political', owner: 'CT',
    defaultEstablished: { '1931': true, '1933': true, '1936': true }, uiVisibility: 'internal', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'REQUETE', abbreviation: 'RE', name: 'Requeté', nameZh: '雷盖特', type: 'political', owner: 'RE',
    defaultEstablished: { '1931': true, '1933': true, '1936': true }, uiVisibility: 'internal', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'REQUETE_MILITIA', abbreviation: 'RE-M', name: 'Requeté Militias', nameZh: '雷盖特民兵', type: 'militia', owner: 'RE',
    uiVisibility: 'internal', armedEntityId: 'requetes', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'FE', abbreviation: 'FE', name: 'Falange Española', nameZh: '西班牙长枪党', type: 'political', owner: 'FE',
    defaultEstablished: { '1933': true, '1936': true }, defaultEstablishedAt: { '1933': { year: 1933, month: 10 }, '1936': { year: 1933, month: 10 } }, uiVisibility: 'internal',
    monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'FALANGE_MILITIA', abbreviation: 'FE-M', name: 'Falange First Line', nameZh: '长枪党第一线', type: 'militia', owner: 'FE',
    uiVisibility: 'internal', armedEntityId: 'falange_first_line', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'PNV', abbreviation: 'PNV', name: 'Partido Nacionalista Vasco', nameZh: '巴斯克民族主义党', type: 'political', owner: 'PNV',
    defaultEstablished: { '1931': true, '1933': true, '1936': true }, uiVisibility: 'internal', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'EUZKO_GUDAROSTEA', abbreviation: 'EG', name: 'Euzko Gudarostea', nameZh: '巴斯克民族军', type: 'militia', owner: 'PNV',
    uiVisibility: 'internal', armedEntityId: 'euzko_gudarostea', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'INTERNATIONAL_BRIGADES', abbreviation: 'IB', name: 'International Brigades', nameZh: '国际纵队', type: 'militia', owner: 'PCE',
    uiVisibility: 'internal', armedEntityId: 'international_brigades', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'ITALIAN_CTV', abbreviation: 'CTV', name: 'Corpo Truppe Volontarie', nameZh: '意大利志愿军团', type: 'militia', owner: 'FE',
    uiVisibility: 'internal', armedEntityId: 'italian_ctv', monthlyEffectText: 'No monthly effect.', monthlyEffectTextZh: '暂无月度效果。',
  },
  {
    id: 'PRRevS',
    abbreviation: 'PRRevS',
    name: 'Partido Republicano Revolucionario Sindicalista',
    nameZh: '革命共和工团党',
    type: 'political',
    owner: 'CNT_FAI',
    icon: '/img/Organization/PRRevS_Emblem.png',
    uiVisibility: 'visible',
    monthlyEffectText: '+1 Bureaucratization and +1 CNT voting willingness each month.',
    monthlyEffectTextZh: '每月官僚度 +1、CNT 投票意愿 +1。',
    monthlyEffect: (state) => ({
      stats: {
        ...state.stats,
        bureaucratization: clampPercent((state.stats?.bureaucratization ?? 0) + 1),
      },
      cntVotingRate: clampPercent((state.cntVotingRate ?? 0) + 1),
    }),
  },
];

export const ORGANIZATION_DEFINITION_BY_ID: Record<OrganizationId, OrganizationDefinition> =
  ORGANIZATION_DEFINITIONS.reduce((result, definition) => {
    result[definition.id] = definition;
    return result;
  }, {} as Record<OrganizationId, OrganizationDefinition>);

/** Build a complete registry state for a new scenario. */
export const getDefaultOrganizationState = (scenario: GameState['scenario']): OrganizationStateMap => (
  ORGANIZATION_DEFINITIONS.reduce((result, definition) => {
    result[definition.id] = {
      established: definition.defaultEstablished?.[scenario] === true,
      status: definition.defaultEstablished?.[scenario] === true ? 'active' : 'unformed',
      ...(definition.type === 'militia' ? { militiaManpower: 0 } : {}),
      ...(definition.defaultEstablishedAt?.[scenario]
        ? { establishedAt: definition.defaultEstablishedAt[scenario] }
        : {}),
    };
    return result;
  }, {} as OrganizationStateMap)
);

/** Read organization state from the canonical registry. */
export const isOrganizationEstablished = (state: OrganizationStateReader, id: OrganizationId): boolean => {
  return state.organizations?.[id]?.established === true
    && state.organizations?.[id]?.status !== 'dissolved';
};

export const isOrganizationActive = (state: OrganizationStateReader, id: OrganizationId): boolean => {
  const organization = state.organizations?.[id];
  return organization?.established === true
    && (organization.status === undefined || organization.status === 'active');
};

export const isOrganizationVisible = (id: OrganizationId): boolean => {
  return ORGANIZATION_DEFINITION_BY_ID[id]?.uiVisibility === 'visible';
};

export const getOrganizationDefinition = (id: OrganizationId) => ORGANIZATION_DEFINITION_BY_ID[id];

export const getOrganizationsForOwner = (owner: OrganizationOwner) =>
  ORGANIZATION_DEFINITIONS.filter((definition) => definition.owner === owner && definition.uiVisibility === 'visible');

/** Ensure every registered organization has a normalized state entry. */
export const normalizeOrganizationState = (state: GameState): GameState => {
  const rawOrganizations = { ...(state.organizations || {}) } as OrganizationStateMap & Record<string, OrganizationState | undefined>;
  // Migrate the short-lived split model: old MC state is now the DC militia state.
  if (rawOrganizations.MC?.established && !rawOrganizations.DC?.established) {
    rawOrganizations.DC = { ...(rawOrganizations.DC || {}), ...rawOrganizations.MC };
  }
  delete rawOrganizations.MC;
  const organizations = rawOrganizations as OrganizationStateMap;
  ORGANIZATION_DEFINITIONS.forEach((definition) => {
    const current = organizations[definition.id];
    organizations[definition.id] = {
      ...(current || {}),
      established: current?.established === true,
      status: current?.status || (current?.established === true ? 'active' : 'unformed'),
      ...(definition.type === 'militia' ? { militiaManpower: Math.max(0, current?.militiaManpower || 0) } : {}),
      ...(current?.established && !current.establishedAt && definition.defaultEstablishedAt?.[state.scenario]
        ? { establishedAt: definition.defaultEstablishedAt[state.scenario] }
        : {}),
    };
  });

  const legacyPools = (state.armedForces?.entityPools || {}) as Record<string, ArmedEntityPool | undefined>;
  const entityPools = {
    ...getDefaultArmedEntityPools(),
    ...legacyPools,
  };
  if (legacyPools.milicias_confederales) {
    const currentCntPool = entityPools.cnt_defense_committees;
    const legacyCntPool = legacyPools.milicias_confederales;
    entityPools.cnt_defense_committees = {
      ...currentCntPool,
      entityId: 'cnt_defense_committees',
      organizationId: 'DC',
      status: currentCntPool.status === 'active' || legacyCntPool.status === 'active' ? 'active' : currentCntPool.status,
      manpower: currentCntPool.manpower + legacyCntPool.manpower,
      artillery: currentCntPool.artillery + legacyCntPool.artillery,
      tanks: currentCntPool.tanks + legacyCntPool.tanks,
    };
  }
  delete (entityPools as Record<string, unknown>).milicias_confederales;

  const legacyMilitiaManpower: Partial<Record<OrganizationId, number>> = {
    DC: state.armedForces?.militias?.cntFai,
    MAOC: state.armedForces?.militias?.maoc,
  };
  ORGANIZATION_DEFINITIONS.forEach((definition) => {
    if (definition.type !== 'militia' || !definition.armedEntityId) return;
    if (!isOrganizationActive({ organizations }, definition.id)) return;
    const pool = entityPools[definition.armedEntityId];
    const militiaManpower = Math.max(
      organizations[definition.id]?.militiaManpower || 0,
      pool?.manpower || 0,
      legacyMilitiaManpower[definition.id] || 0,
    );
    organizations[definition.id] = { ...organizations[definition.id]!, militiaManpower };
    entityPools[definition.armedEntityId] = { ...pool, manpower: militiaManpower };
  });

  return {
    ...state,
    organizations,
    armedForces: state.armedForces
      ? { ...state.armedForces, entityPools }
      : state.armedForces,
    fijl_timer: Number.isFinite(state.fijl_timer)
      ? Math.max(0, state.fijl_timer)
      : 0,
    mujeres_libres_timer: Number.isFinite(state.mujeres_libres_timer)
      ? Math.max(0, state.mujeres_libres_timer)
      : 0,
  };
};

/** Set one organization in the canonical registry. */
export const setOrganizationEstablished = (
  state: GameState,
  id: OrganizationId,
  established = true,
): Partial<GameState> => {
  const normalized = normalizeOrganizationState(state);
  const current = normalized.organizations?.[id];
  const organizationState: OrganizationState = {
    ...(current || {}),
    established,
    status: established ? 'active' : 'unformed',
    ...(established && !current?.establishedAt
      ? { establishedAt: { year: state.year, month: state.month } }
      : {}),
  };
  const organizations = {
    ...(normalized.organizations || {}),
    [id]: organizationState,
  } as OrganizationStateMap;

  const entityId = getOrganizationDefinition(id)?.armedEntityId;
  if (!established && entityId) {
    const entityPools = {
      ...(normalized.armedForces.entityPools || getDefaultArmedEntityPools()),
      [entityId]: {
        ...(normalized.armedForces.entityPools?.[entityId] || {}),
        status: 'inactive' as const,
      },
    };
    return { organizations, armedForces: { ...normalized.armedForces, entityPools } };
  }
  return { organizations };
};

const EMPTY_POOL = (entityId: ArmedEntityId, organizationId: OrganizationId | undefined, owner: ArmedEntityPool['owner']): ArmedEntityPool => ({
  entityId,
  organizationId,
  owner,
  status: 'inactive',
  manpower: 0,
  artillery: 0,
  tanks: 0,
});

const DEFAULT_POOL_DEFINITIONS: Array<[ArmedEntityId, OrganizationId | undefined, ArmedEntityPool['owner']]> = [
  ['republican_state', undefined, 'STATE'],
  ['cnt_defense_committees', 'DC', 'CNT_FAI'],
  ['ugt_socialist_militias', 'PSOE_MILITIA', 'PSOE'],
  ['maoc', 'MAOC', 'PCE'],
  ['fifth_regiment', 'FIFTH_REGIMENT', 'PCE'],
  ['poum_militias', 'POUM_MILITIA', 'POUM'],
  ['requetes', 'REQUETE_MILITIA', 'RE'],
  ['falange_first_line', 'FALANGE_MILITIA', 'FE'],
  ['euzko_gudarostea', 'EUZKO_GUDAROSTEA', 'PNV'],
  ['international_brigades', 'INTERNATIONAL_BRIGADES', 'PCE'],
  ['italian_ctv', 'ITALIAN_CTV', 'FE'],
];

export const getDefaultArmedEntityPools = (): Record<ArmedEntityId, ArmedEntityPool> => (
  DEFAULT_POOL_DEFINITIONS.reduce((result, [entityId, organizationId, owner]) => {
    result[entityId] = EMPTY_POOL(entityId, organizationId, owner);
    return result;
  }, {} as Record<ArmedEntityId, ArmedEntityPool>)
);

/** Activate an entity only after its corresponding organization exists. */
export const activateArmedEntity = (
  state: GameState,
  organizationId: OrganizationId,
  activeFrom = { year: state.year, month: state.month },
): Partial<GameState> => {
  const definition = getOrganizationDefinition(organizationId);
  if (!definition?.armedEntityId || !isOrganizationActive(state, organizationId)) return {};
  const pools = {
    ...(state.armedForces.entityPools || getDefaultArmedEntityPools()),
    [definition.armedEntityId]: {
      ...(state.armedForces.entityPools?.[definition.armedEntityId] || EMPTY_POOL(definition.armedEntityId, organizationId, definition.owner)),
      status: 'active' as const,
      activeFrom,
    },
  };
  return { armedForces: { ...state.armedForces, entityPools: pools } };
};

/**
 * Apply the July 1936 mobilization chain. Party organizations are historical
 * prerequisites; their militia organizations and pools activate when the
 * civil war actually mobilizes.
 */
export const activateCivilWarOrganizations = (state: GameState): Partial<GameState> => {
  if (state.year < 1936 || state.civilWarStatus === 'not_started') return {};

  const organizations = { ...(state.organizations || {}) } as OrganizationStateMap;
  const form = (id: OrganizationId) => {
    organizations[id] = {
      ...(organizations[id] || {}),
      established: true,
      status: 'active',
      ...(organizations[id]?.establishedAt ? {} : { establishedAt: { year: state.year, month: state.month } }),
    };
  };

  if (organizations.PSOE?.established && organizations.UGT?.established) form('PSOE_MILITIA');
  if (organizations.MAOC?.established) {
    form('FIFTH_REGIMENT');
    organizations.MAOC = { ...organizations.MAOC, status: 'integrated' };
  }
  if (organizations.POUM?.established && state.poum_founded) form('POUM_MILITIA');
  if (organizations.REQUETE?.established) form('REQUETE_MILITIA');
  if (organizations.FE?.established) form('FALANGE_MILITIA');

  // Regional and foreign formations are delayed even after the initial setup.
  if (state.year > 1936 || (state.year === 1936 && state.month >= 8)) {
    if (organizations.PNV?.established) form('EUZKO_GUDAROSTEA');
  }
  if (state.year > 1936 || (state.year === 1936 && state.month >= 9)) {
    if (organizations.PCE?.established) form('INTERNATIONAL_BRIGADES');
  }
  if (state.year > 1936 || (state.year === 1936 && state.month >= 12)) form('ITALIAN_CTV');

  const pools = { ...(state.armedForces.entityPools || getDefaultArmedEntityPools()) };
  ORGANIZATION_DEFINITIONS.forEach((definition) => {
    if (!definition.armedEntityId || !isOrganizationActive({ organizations }, definition.id)) return;
    const existing = pools[definition.armedEntityId] || EMPTY_POOL(definition.armedEntityId, definition.id, definition.owner);
    pools[definition.armedEntityId] = {
      ...existing,
      organizationId: definition.id,
      status: 'active',
      activeFrom: existing.activeFrom || { year: state.year, month: state.month },
    };
  });

  const legacyManpower: Partial<Record<ArmedEntityId, number>> = {
    cnt_defense_committees: state.armedForces.militias.cntFai,
    maoc: state.armedForces.militias.maoc,
    poum_militias: state.armedForces.militias.poum,
    ugt_socialist_militias: state.armedForces.militias.ugt,
    requetes: state.armedForces.militias.requete,
    falange_first_line: state.armedForces.militias.falange,
    international_brigades: state.internationalBrigades,
  };
  Object.entries(legacyManpower).forEach(([entityId, manpower]) => {
    const pool = pools[entityId as ArmedEntityId];
    if (pool && pool.status === 'active' && pool.manpower === 0 && manpower !== undefined) {
      pools[entityId as ArmedEntityId] = { ...pool, manpower: Math.max(0, manpower) };
    }
  });
  const maocPool = pools.maoc;
  const fifthPool = pools.fifth_regiment;
  if (maocPool && fifthPool && fifthPool.status === 'active' && fifthPool.manpower === 0) {
    pools.fifth_regiment = { ...fifthPool, manpower: maocPool.manpower || Math.max(0, state.armedForces.militias.maoc) };
    pools.maoc = { ...maocPool, status: 'integrated', manpower: 0 };
  }

  ORGANIZATION_DEFINITIONS.forEach((definition) => {
    if (definition.type !== 'militia' || !definition.armedEntityId) return;
    if (!isOrganizationActive({ organizations }, definition.id)) return;
    const pool = pools[definition.armedEntityId];
    const legacyValue = definition.id === 'DC' ? state.armedForces.militias.cntFai : 0;
    const militiaManpower = Math.max(
      0,
      organizations[definition.id]?.militiaManpower || 0,
      pool?.manpower || 0,
      legacyValue,
    );
    organizations[definition.id] = { ...organizations[definition.id]!, militiaManpower };
    pools[definition.armedEntityId] = { ...pool, manpower: militiaManpower };
  });

  return {
    organizations,
    armedForces: { ...state.armedForces, entityPools: pools },
  };
};

/** Keep the DC militia organization, source-owned pool, and legacy view in sync. */
export const adjustCntMilitiaManpower = (state: GameState, delta: number): Partial<GameState> => {
  const organizationId: OrganizationId = 'DC';
  if (!isOrganizationActive(state, organizationId)) return {};
  const definition = getOrganizationDefinition(organizationId);
  const entityId = definition.armedEntityId;
  if (!entityId) return {};
  const existingPool = state.armedForces.entityPools?.[entityId]
    || EMPTY_POOL(entityId, organizationId, 'CNT_FAI');
  const currentValue = Math.max(
    existingPool.manpower,
    state.organizations.DC?.militiaManpower || 0,
    state.armedForces.militias.cntFai || 0,
  );
  const nextValue = Math.max(0, currentValue + delta);
  const pools = {
    ...(state.armedForces.entityPools || getDefaultArmedEntityPools()),
    [entityId]: { ...existingPool, status: 'active' as const, manpower: nextValue },
  };
  const organizations = {
    ...state.organizations,
    DC: { ...state.organizations.DC!, militiaManpower: nextValue },
  };
  const militias = { ...state.armedForces.militias, cntFai: nextValue };
  return { organizations, armedForces: { ...state.armedForces, militias, entityPools: pools } };
};

/** Apply all recurring organization effects without mutating the input. */
export const applyMonthlyOrganizationEffects = (state: GameState): GameState => {
  let nextState = normalizeOrganizationState(state);

  ORGANIZATION_DEFINITIONS.forEach((definition) => {
    if (!isOrganizationEstablished(nextState, definition.id)) return;
    if (definition.monthlyEffect) {
      nextState = { ...nextState, ...definition.monthlyEffect(nextState) };
    }
  });

  return nextState;
};
