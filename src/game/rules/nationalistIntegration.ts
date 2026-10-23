import type { GameState, OrganizationId, SocialClass } from '../types';
import { MapFaction, type Army, type ResourceSet } from '../../map/types_map';
import { PROVINCE_ADJACENCY } from '../../map/map_constants';
import { armyRecruitCost } from '../../map/rules/costs';
import { adjustClassSupport } from '../utils/classSupport';
import { isOrganizationActive } from '../organizations';
import { isSpanishCivilWarOngoing, monthIndex } from './wartimeCoalition';

export const NATIONALIST_CHAIN_IDS = [
  'nationalist_provisional_command', 'nationalist_franco_alignment', 'nationalist_carlist_autonomy',
  'nationalist_unification_or_schism', 'carlist_secession_aftermath',
  'fet_statutes', 'fet_national_council', 'fet_affiliate_services',
] as const;

export const nationalistExists = (state: GameState): boolean =>
  Object.values(state.provinces ?? {}).some(province => province.owner === MapFaction.NATIONALIST)
  || (state.armies ?? []).some(army => army.faction === MapFaction.NATIONALIST);

export const nationalistChainDue = (state: GameState, months: number): boolean => Boolean(
  !state.isGameOver && isSpanishCivilWarOngoing(state) && state.civilWarSetupCompletedAt
  && monthIndex(state) - monthIndex(state.civilWarSetupCompletedAt) >= months && nationalistExists(state),
);

export const francoJoinedNationalists = (state: GameState): boolean => state.francoStatus === 'nationalist';

export const carlistsArmed = (state: GameState): boolean => Boolean(
  isOrganizationActive(state, 'CT') && isOrganizationActive(state, 'REQUETE_MILITIA')
  && ((state.armedForces?.entityPools?.requetes?.manpower ?? 0)
    + (state.armies ?? []).filter(army => army.faction === MapFaction.NATIONALIST
      && (army.sourceEntityId === 'requetes' || army.identity === 'requetes'))
      .reduce((sum, army) => sum + army.manpower, 0)) > 0,
);

const reorganizeFet = (state: GameState): GameState => {
  const date = { year: state.year, month: state.month };
  let classes = state.classes;
  for (const socialClass of Object.keys(classes) as SocialClass[]) {
    const support = classes[socialClass].support;
    const transfer = (support.FE ?? 0) + (support.CT ?? 0);
    if (transfer > 0) classes = adjustClassSupport(classes, socialClass, 'FET', transfer, ['FE', 'CT']);
  }
  const organizations = { ...state.organizations };
  for (const id of ['FE', 'CT'] as OrganizationId[]) {
    const prior = organizations[id];
    if (prior) organizations[id] = { ...prior, status: 'integrated' };
  }
  for (const id of ['AP', 'RE'] as OrganizationId[]) {
    const prior = organizations[id];
    if (prior?.established) organizations[id] = { ...prior, status: 'dissolved' };
  }
  for (const id of ['REQUETE_MILITIA', 'FALANGE_MILITIA', 'PELAYOS', 'SEU', 'SECCION_FEMENINA', 'CONS'] as OrganizationId[]) {
    const prior = organizations[id];
    if (prior?.established && prior.status !== 'dissolved') organizations[id] = { ...prior, affiliatedOwner: 'FET' };
  }
  for (const id of ['FET', 'FET_NATIONAL_MILITIA'] as OrganizationId[]) {
    organizations[id] = { established: true, establishedAt: date, status: 'active' };
  }
  return { ...state, classes, organizations,
    nationalistIntegration: { ...state.nationalistIntegration, stage: 'fet', resolvedAt: date } };
};

const resourcesAfterSecession = (state: GameState): GameState['mapResources'] => {
  const nationalist = state.mapResources[MapFaction.NATIONALIST];
  const industry = Object.values(state.provinces).filter(p => p.owner === MapFaction.NATIONALIST)
    .reduce((sum, province) => sum + province.industry, 0);
  const share = industry > 0 ? (state.provinces.navarra?.industry ?? 0) / industry : 0;
  const keys = ['supplies', 'industrialCapacity', 'tankReserve'] as const;
  const carlist: ResourceSet = { manpower: 0, supplies: 0, industrialCapacity: 0, tankReserve: 0, commandPoints: 2 };
  const remainder = { ...nationalist };
  for (const key of keys) {
    carlist[key] = Math.floor(nationalist[key] * share);
    remainder[key] -= carlist[key];
  }
  return { ...state.mapResources, [MapFaction.NATIONALIST]: remainder, [MapFaction.CARLIST]: carlist };
};

const secedeCarlists = (state: GameState): GameState => {
  const date = { year: state.year, month: state.month };
  const provinces = { ...state.provinces, navarra: { ...state.provinces.navarra, owner: MapFaction.CARLIST } };
  let armies: Army[] = state.armies.map(army => {
    if (army.faction === MapFaction.NATIONALIST && (army.sourceEntityId === 'requetes' || army.identity === 'requetes')) {
      return { ...army, faction: MapFaction.CARLIST };
    }
    if (army.faction === MapFaction.NATIONALIST && army.provinceId === 'navarra') {
      const retreat = (PROVINCE_ADJACENCY.navarra ?? []).find(id => provinces[id]?.owner === MapFaction.NATIONALIST);
      return retreat ? { ...army, provinceId: retreat } : army;
    }
    return army;
  });
  const mapResources = resourcesAfterSecession(state);
  const pool = state.armedForces.entityPools.requetes;
  const hasCarlistInNavarra = armies.some(army => army.faction === MapFaction.CARLIST && army.provinceId === 'navarra');
  let armedForces = state.armedForces;
  if (!hasCarlistInNavarra && pool?.manpower > 0) {
    const availableSupplies = mapResources[MapFaction.CARLIST].supplies;
    const mobilized = Math.min(2500, pool.manpower, Math.max(0, Math.floor((availableSupplies + 1) / 0.03)));
    const cost = armyRecruitCost({ infantry: mobilized, artillery: 0, tanks: 0 });
    if (mobilized > 0 && availableSupplies >= cost.supplies) {
      armies = [...armies, { id: `carlist_requetes_${state.year}_${state.month}`, faction: MapFaction.CARLIST,
        sourceEntityId: 'requetes', identity: 'requetes', name: 'Navarre Requetés', nameZh: '纳瓦拉呼啸兵',
        provinceId: 'navarra', movesLeft: 0, manpower: mobilized, maxManpower: mobilized,
        composition: { infantry: mobilized, artillery: 0, tanks: 0 },
        designedComposition: { infantry: mobilized, artillery: 0, tanks: 0 }, morale: 65 }];
      armedForces = { ...armedForces, entityPools: { ...armedForces.entityPools,
        requetes: { ...pool, manpower: pool.manpower - mobilized } } };
      mapResources[MapFaction.CARLIST] = { ...mapResources[MapFaction.CARLIST], supplies: availableSupplies - cost.supplies };
    }
  }
  return { ...state, provinces, armies, armedForces, mapResources,
    ...(state.iberianDefense ? { iberianDefense: { ...state.iberianDefense, carlistEntered: true } } : {}),
    mapSelectedArmyId: null, mapSelectedArmyIds: [],
    nationalistIntegration: { ...state.nationalistIntegration, stage: 'carlist_secession', resolvedAt: date, splitAt: date },
    mapHistory: [state.language === 'zh' ? '卡洛斯派脱离国民军，纳瓦拉成为独立战线。'
      : 'The Carlists secede from the Nationalists; Navarre becomes an independent front.', ...state.mapHistory] };
};

export const settleNationalistIntegration = (state: GameState): GameState => {
  if (!nationalistChainDue(state, 9) || state.nationalistIntegration?.resolvedAt) return state;
  if (francoJoinedNationalists(state)) {
    if (isOrganizationActive(state, 'FE') && isOrganizationActive(state, 'CT')) return reorganizeFet(state);
    return { ...state, nationalistIntegration: { ...state.nationalistIntegration, stage: 'military_unity',
      resolvedAt: { year: state.year, month: state.month } } };
  }
  if (carlistsArmed(state) && state.provinces.navarra?.owner === MapFaction.NATIONALIST) return secedeCarlists(state);
  return { ...state, nationalistIntegration: { ...state.nationalistIntegration, stage: 'fragmented',
    resolvedAt: { year: state.year, month: state.month } } };
};
