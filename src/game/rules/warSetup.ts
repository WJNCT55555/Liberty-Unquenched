import type { GameState, OrganizationId } from '../types';
import { MapFaction, type ArmedEntityId, type Army, type ArmyIdentity } from '../../map/types_map';
import { SECURITY_CORPS_IDS, type SecurityCorpsState } from './securityForces';
import { ORGANIZATION_DEFINITIONS, isOrganizationActive } from '../organizations';
import { isRepublicanPartyEligible } from '../politicalEligibility';

/**
 * July 1936 militia levels used by the 1936 direct start. They are the design's
 * own reference scale for "what five ordinary years of preparation produced", so
 * a player who accumulated more enters the war stronger than history and one who
 * accumulated less enters it weaker. See `military-system-redesign-v2.md` §6.3.
 */
export const MILITIA_REFERENCE_MANPOWER: Partial<Record<ArmyIdentity, number>> = {
  cnt: 50000,
  ugt: 20000,
  pce: 10000,
  poum: 5000,
};

export interface PreparationBand {
  minRatio: number;
  /** How far a deployed militia unit may grow before the surplus becomes reserve. */
  frontMultiplier: number;
  readinessDelta: number;
}

/** §6.3 preparation bands: thresholds rather than a linear build-up. */
export const PREPARATION_BANDS: PreparationBand[] = [
  { minRatio: 1.40, frontMultiplier: 2.00, readinessDelta: 10 },
  { minRatio: 1.00, frontMultiplier: 1.50, readinessDelta: 5 },
  { minRatio: 0.60, frontMultiplier: 1.25, readinessDelta: 0 },
  { minRatio: 0.00, frontMultiplier: 1.00, readinessDelta: -10 },
];

export const getPreparationBand = (ratio: number): PreparationBand =>
  PREPARATION_BANDS.find((band) => ratio >= band.minRatio) ?? PREPARATION_BANDS[PREPARATION_BANDS.length - 1];

/** Supplies granted per point of accumulated `armaments` (§6.5 equipment conversion). */
export const SUPPLIES_PER_ARMAMENT = 250;
/** Armoured reserve granted by completed tank research or armoured cars. */
export const ARMOURED_RESEARCH_TANKS = 10;

/**
 * 每个武装实体在战场上携带的政治身份。这是唯一的权威定义：它既是开战动员的
 * 分池键，也是战斗解算时查军事化率的键——`combat.ts` 按 `Army.identity` 查表，
 * 而 `identity` 在单位出生时就来自这里。
 */
export const ENTITY_IDENTITY: Record<ArmedEntityId, ArmyIdentity> = {
  republican_state: 'gov',
  cnt_defense_committees: 'cnt',
  ugt_socialist_militias: 'ugt',
  maoc: 'pce',
  fifth_regiment: 'pce',
  poum_militias: 'poum',
  international_brigades: 'intl',
  euzko_gudarostea: 'regional',
  requetes: 'requetes',
  falange_first_line: 'falange',
  italian_ctv: 'falange',
};

/** 参与和平期民兵动员的实体；国家池与外国军团不在其中。 */
const MOBILISED_MILITIA_ENTITIES: readonly ArmedEntityId[] = [
  'cnt_defense_committees',
  'maoc',
  'fifth_regiment',
  'poum_militias',
  'ugt_socialist_militias',
];

/** 某个武装实体对应的派系；UI 与战报用它查军事化率。 */
export const getEntityIdentity = (entityId: ArmedEntityId): ArmyIdentity =>
  ENTITY_IDENTITY[entityId] ?? 'gov';

export interface MilitiaRecruitmentPool {
  entityId: ArmedEntityId;
  /** Political identity the unit carries once it is raised. */
  identity: ArmyIdentity;
  camp: MapFaction;
  label: { en: string; zh: string };
}

/**
 * Party militia pools a recruiting office can tap. The pool supplies the men and
 * the political identity of the unit it raises; the camp still pays supplies,
 * industry and armour. National conscripts are a separate path that needs barracks.
 */
export const MILITIA_RECRUITMENT_POOLS: MilitiaRecruitmentPool[] = [
  { entityId: 'cnt_defense_committees', identity: 'cnt', camp: MapFaction.REPUBLICAN, label: { en: 'CNT-FAI militia', zh: 'CNT-FAI 民兵' } },
  { entityId: 'ugt_socialist_militias', identity: 'ugt', camp: MapFaction.REPUBLICAN, label: { en: 'UGT/PSOE militia', zh: 'UGT/PSOE 民兵' } },
  { entityId: 'maoc', identity: 'pce', camp: MapFaction.REPUBLICAN, label: { en: 'MAOC (PCE)', zh: 'MAOC（共产党）' } },
  { entityId: 'fifth_regiment', identity: 'pce', camp: MapFaction.REPUBLICAN, label: { en: 'Fifth Regiment', zh: '第五团' } },
  { entityId: 'poum_militias', identity: 'poum', camp: MapFaction.REPUBLICAN, label: { en: 'POUM militia', zh: 'POUM 民兵' } },
  { entityId: 'euzko_gudarostea', identity: 'regional', camp: MapFaction.REPUBLICAN, label: { en: 'Basque Army (PNV)', zh: '巴斯克军（PNV）' } },
  { entityId: 'international_brigades', identity: 'intl', camp: MapFaction.REPUBLICAN, label: { en: 'International Brigades', zh: '国际纵队' } },
  { entityId: 'requetes', identity: 'requetes', camp: MapFaction.NATIONALIST, label: { en: 'Requeté', zh: '雷盖特' } },
  { entityId: 'falange_first_line', identity: 'falange', camp: MapFaction.NATIONALIST, label: { en: 'Falange', zh: '长枪党' } },
];

export interface RecruitmentPoolView extends MilitiaRecruitmentPool {
  organizationId?: OrganizationId;
  manpower: number;
  /** Only an active organization may raise units from its pool. */
  active: boolean;
}

export const getMilitiaRecruitmentPools = (
  state: GameState,
  camp: MapFaction,
): RecruitmentPoolView[] => MILITIA_RECRUITMENT_POOLS
  .filter((pool) => {
    if (!state.iberianDefense) return pool.camp === camp;
    if (state.iberianDefense.eliminated.includes(camp)) return false;
    if (pool.entityId === 'cnt_defense_committees') return camp === MapFaction.IBERIAN_DEFENSE;
    if (pool.entityId === 'poum_militias' && state.iberianDefense.allies.poum) return camp === MapFaction.IBERIAN_DEFENSE;
    if (pool.entityId === 'ugt_socialist_militias' && camp === MapFaction.IBERIAN_DEFENSE) return state.iberianDefense.allies.psoeLeft;
    return pool.camp === camp;
  })
  .map((pool) => {
    const definition = ORGANIZATION_DEFINITIONS.find((definition) => definition.armedEntityId === pool.entityId);
    const organizationId = definition?.id;
    return {
      ...pool,
      camp,
      ...(camp === MapFaction.IBERIAN_DEFENSE && pool.entityId === 'ugt_socialist_militias'
        ? { label: { en: 'Left Socialist militia', zh: 'PSOE 左翼民兵' } } : {}),
      organizationId,
      manpower: Math.max(0, camp === MapFaction.IBERIAN_DEFENSE && pool.entityId === 'ugt_socialist_militias'
        ? state.iberianDefense?.leftSocialistReserve ?? 0 : state.armedForces?.entityPools?.[pool.entityId]?.manpower || 0),
      active: Boolean(organizationId) && isOrganizationActive(state, organizationId as OrganizationId)
        && (camp !== MapFaction.REPUBLICAN || Boolean(definition && isRepublicanPartyEligible(state, definition.owner))),
    };
  });

export const getMilitiaRecruitmentPool = (
  state: GameState,
  camp: MapFaction,
  entityId: ArmedEntityId,
): RecruitmentPoolView | undefined =>
  getMilitiaRecruitmentPools(state, camp).find((pool) => pool.entityId === entityId);

/** Remove manpower from a party militia pool once its men are formed into a unit. */
export const spendMilitiaPoolManpower = (
  state: GameState,
  entityId: ArmedEntityId,
  manpower: number,
  camp?: MapFaction,
): Partial<GameState> => {
  if (camp === MapFaction.IBERIAN_DEFENSE && entityId === 'ugt_socialist_militias' && state.iberianDefense) {
    return { iberianDefense: { ...state.iberianDefense, leftSocialistReserve: Math.max(0, state.iberianDefense.leftSocialistReserve - manpower) } };
  }
  const pools = state.armedForces?.entityPools;
  const pool = pools?.[entityId];
  if (!pools || !pool) return {};
  const remaining = Math.max(0, pool.manpower - manpower);
  return {
    ...(entityId === 'international_brigades' ? { internationalBrigades: remaining } : {}),
    armedForces: {
      ...state.armedForces!,
      entityPools: {
        ...pools,
        [entityId]: { ...pool, manpower: remaining },
      },
    },
  };
};

/** Total peacetime militia manpower a camp accumulated for one map identity. */export const getPeacetimeMilitiaManpower = (state: GameState, identity: ArmyIdentity): number => {
  const pools = state.armedForces?.entityPools || {};
  return MOBILISED_MILITIA_ENTITIES.reduce(
    (total, entityId) => (
      getEntityIdentity(entityId) === identity ? total + Math.max(0, pools[entityId]?.manpower || 0) : total
    ),
    0,
  );
};

export interface PeacetimeMobilization {
  armies: Army[];
  /** Militia manpower that did not reach the front, added to the camp's pool. */
  reserveManpower: number;
  reserveSupplies: number;
  reserveTanks: number;
}

/**
 * Converts the peacetime years into the war's opening position (§6).
 *
 * The historical setup has already deployed the core formations, so only manpower
 * *beyond* what is already on the map may be spent — counting the same men twice
 * is exactly what §6.4 forbids. The preparation band decides how far those units
 * may grow immediately; whatever is left over becomes reserve manpower.
 *
 * Only the **quantity** axis lives here. The **quality** axis is each force
 * group's militarization rate (`rules/militarization.ts`), which units never
 * store — combat resolves it from the unit's `identity` at resolution time. The two
 * axes are deliberately orthogonal: a militia can be numerous but badly organised.
 */
export const applyPeacetimeMobilization = (state: GameState, armies: Army[]): PeacetimeMobilization => {
  const nextArmies = armies.map((army) => ({
    ...army,
    composition: { ...army.composition },
    designedComposition: { ...army.designedComposition },
  }));
  let reserveManpower = 0;

  (Object.keys(MILITIA_REFERENCE_MANPOWER) as ArmyIdentity[]).forEach((identity) => {
    const reference = MILITIA_REFERENCE_MANPOWER[identity];
    if (!reference) return;
    const peacetime = getPeacetimeMilitiaManpower(state, identity);
    const units = nextArmies.filter(
      (army) => (army.identity ?? 'gov') === identity && army.faction === MapFaction.REPUBLICAN,
    );
    if (units.length === 0 || peacetime <= 0) return;

    const band = getPreparationBand(peacetime / reference);

    const deployed = units.reduce((total, army) => total + army.manpower, 0);
    let remaining = Math.max(0, peacetime - deployed);
    units.forEach((army) => {
      const ceiling = Math.floor((army.maxManpower || army.manpower) * band.frontMultiplier);
      const growth = Math.min(remaining, Math.max(0, ceiling - army.manpower));
      if (growth <= 0) return;
      // Growing a unit must preserve manpower === sum(composition) and
      // maxManpower === sum(designedComposition), so both sides move together.
      army.manpower += growth;
      army.maxManpower += growth;
      army.composition.infantry += growth;
      army.designedComposition.infantry += growth;
      remaining -= growth;
    });
    reserveManpower += remaining;
  });

  return {
    armies: nextArmies,
    reserveManpower,
    reserveSupplies: Math.max(0, Math.round(Number(state.armaments ?? 0) * SUPPLIES_PER_ARMAMENT)),
    reserveTanks: state.tankResearchCompleted || state.hasArmoredCars ? ARMOURED_RESEARCH_TANKS : 0,
  };
};

/** Adds the mobilization surplus to the Republican camp's war economy. */
export const applyMobilizationToMapResources = (
  mapResources: GameState['mapResources'],
  mobilization: PeacetimeMobilization,
): GameState['mapResources'] => {
  const republican = mapResources?.[MapFaction.REPUBLICAN];
  if (!republican) return mapResources;
  return {
    ...mapResources,
    [MapFaction.REPUBLICAN]: {
      ...republican,
      manpower: republican.manpower + mobilization.reserveManpower,
      supplies: republican.supplies + mobilization.reserveSupplies,
      tankReserve: republican.tankReserve + mobilization.reserveTanks,
    },
  };
};

/**
 * Historical manpower of the Spanish Army the Republic inherited. The eight map
 * garrisons are the deployed part of it, so the peacetime army pool is what is left
 * over — the same §6.4 rule that governs the militia conversion.
 */
export const PEACETIME_ARMY_MANPOWER = 100000;

export const getDeployedGarrisonManpower = (state: GameState): number =>
  (state.armyFormations || [])
    .reduce((total, formation) => total + Math.max(0, formation.manpower), 0);

/** Army manpower that exists on paper but is not yet formed into a garrison. */
export const getPeacetimeArmyPool = (state: GameState): number =>
  Math.max(0, PEACETIME_ARMY_MANPOWER - getDeployedGarrisonManpower(state));

const clampLoyalty = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

export interface CivilWarLoyaltySplit {
  mapResources: GameState['mapResources'];
  armedForces: GameState['armedForces'];
  republicanGain: number;
  nationalistGain: number;
}

/**
 * Divides the peacetime army pool and every existing police corps between the two
 * camps when the civil war breaks out. The army follows officer loyalty; each corps
 * follows its own, which is why the Civil Guard can go over while the Assault Guard
 * stays. Corps are emptied once absorbed: their men now exist as camp manpower.
 */
export const applyCivilWarLoyaltySplit = (
  state: GameState,
  mapResources: GameState['mapResources'],
): CivilWarLoyaltySplit => {
  const armyPool = getPeacetimeArmyPool(state);
  const armyLoyalShare = Math.round((armyPool * clampLoyalty(state.stats?.armyLoyalty ?? 0)) / 100);

  const armedForces = state.armedForces;
  const corps = SECURITY_CORPS_IDS
    .map((id) => armedForces?.[id])
    .filter((corpsState): corpsState is SecurityCorpsState => Boolean(corpsState));

  let policeLoyalShare = 0;
  let policeTotal = 0;
  corps.forEach((corpsState) => {
    const manpower = Math.max(0, corpsState.manpower);
    policeTotal += manpower;
    policeLoyalShare += Math.round((manpower * clampLoyalty(corpsState.loyalty)) / 100);
  });

  const republicanGain = armyLoyalShare + policeLoyalShare;
  const nationalistGain = (armyPool - armyLoyalShare) + (policeTotal - policeLoyalShare);

  const republican = mapResources?.[MapFaction.REPUBLICAN];
  const nationalist = mapResources?.[MapFaction.NATIONALIST];
  const nextMapResources = republican && nationalist
    ? {
        ...mapResources,
        [MapFaction.REPUBLICAN]: { ...republican, manpower: republican.manpower + republicanGain },
        [MapFaction.NATIONALIST]: { ...nationalist, manpower: nationalist.manpower + nationalistGain },
      }
    : mapResources;

  const emptiedCorps = armedForces
    ? Object.fromEntries(SECURITY_CORPS_IDS.map((id) => [id, { ...armedForces[id], manpower: 0 }]))
    : {};

  return {
    mapResources: nextMapResources,
    armedForces: armedForces ? { ...armedForces, ...emptiedCorps } : armedForces,
    republicanGain,
    nationalistGain,
  };
};
