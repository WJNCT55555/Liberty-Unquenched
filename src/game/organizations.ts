import type {
  GameState,
  OrganizationId,
  OrganizationOwner,
  OrganizationState,
  OrganizationStateMap,
  OrganizationType,
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
  monthlyEffect?: (state: GameState) => Partial<GameState>;
  monthlyEffectText: string;
  monthlyEffectTextZh: string;
  capabilityText?: string;
  capabilityTextZh?: string;
}

export type OrganizationStateReader = {
  organizations?: OrganizationStateMap;
  fijl_established?: boolean;
  mujeres_libres_established?: boolean;
  militaryDeckEnabled?: boolean;
  isPRRevSFormed?: boolean;
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
    monthlyEffectText: 'No recurring numeric effect.',
    monthlyEffectTextZh: '无持续数值效果。',
    capabilityText: 'Enables Milicias Confederales and the military deck.',
    capabilityTextZh: '启用联合民兵（Milicias Confederales）与武装事务牌库。',
  },
  {
    id: 'PRRevS',
    abbreviation: 'PRRevS',
    name: 'Partido Republicano Revolucionario Sindicalista',
    nameZh: '革命共和工团党',
    type: 'political',
    owner: 'CNT_FAI',
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

const LEGACY_ESTABLISHED_FIELDS: Partial<Record<OrganizationId, keyof GameState>> = {
  FIJL: 'fijl_established',
  ML: 'mujeres_libres_established',
  DC: 'militaryDeckEnabled',
  PRRevS: 'isPRRevSFormed',
};

/** Build a complete registry state for a new scenario. */
export const getDefaultOrganizationState = (scenario: GameState['scenario']): OrganizationStateMap => (
  ORGANIZATION_DEFINITIONS.reduce((result, definition) => {
    result[definition.id] = {
      established: definition.defaultEstablished?.[scenario] === true,
    };
    return result;
  }, {} as OrganizationStateMap)
);

/** Read organization state while remaining compatible with pre-registry saves. */
export const isOrganizationEstablished = (state: OrganizationStateReader, id: OrganizationId): boolean => {
  const registryState = state.organizations?.[id];
  if (registryState?.established === true) return true;

  const legacyField = LEGACY_ESTABLISHED_FIELDS[id];
  return legacyField ? state[legacyField] === true : false;
};

export const getOrganizationDefinition = (id: OrganizationId) => ORGANIZATION_DEFINITION_BY_ID[id];

export const getOrganizationsForOwner = (owner: OrganizationOwner) =>
  ORGANIZATION_DEFINITIONS.filter((definition) => definition.owner === owner);

/**
 * Hydrate the registry and legacy aliases together.  Keeping aliases in sync
 * lets older event/card code and old saves continue to work while the registry
 * becomes the canonical source for new code.
 */
export const normalizeOrganizationState = (state: GameState): GameState => {
  const organizations = { ...(state.organizations || {}) } as OrganizationStateMap;
  ORGANIZATION_DEFINITIONS.forEach((definition) => {
    const legacyField = LEGACY_ESTABLISHED_FIELDS[definition.id];
    const legacyEstablished = legacyField ? state[legacyField] === true : false;
    const current = organizations[definition.id];
    organizations[definition.id] = {
      ...(current || {}),
      established: Boolean(current?.established || legacyEstablished),
    };
  });

  return {
    ...state,
    organizations,
    fijl_established: organizations.FIJL?.established === true,
    mujeres_libres_established: organizations.ML?.established === true,
    militaryDeckEnabled: organizations.DC?.established === true,
    isPRRevSFormed: organizations.PRRevS?.established === true,
  };
};

/** Set one organization and update its legacy compatibility alias. */
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
    ...(established && !current?.establishedAt
      ? { establishedAt: { year: state.year, month: state.month } }
      : {}),
  };
  const organizations = {
    ...(normalized.organizations || {}),
    [id]: organizationState,
  } as OrganizationStateMap;
  const legacyField = LEGACY_ESTABLISHED_FIELDS[id];

  return {
    organizations,
    ...(legacyField ? { [legacyField]: established } : {}),
  } as Partial<GameState>;
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
