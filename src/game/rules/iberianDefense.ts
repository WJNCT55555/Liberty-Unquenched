import type { GameState } from '../types';
import {
  MapFaction,
  type Army,
  type ArmyComposition,
  type IberianDefenseState,
  type MapRuntimeState,
  type ResourceSet,
} from '../../map/types_map';
import { PROVINCE_ADJACENCY, PROVINCE_REGIONS } from '../../map/map_constants';
import { CIVIL_WAR_FACTIONS, getMapFactionName } from '../../map/rules/factions';
import { isOrganizationActive } from '../organizations';
import { getArmyPoliticalMember, isSpanishCivilWarOngoing, monthIndex } from './wartimeCoalition';
import { adjustFactionDissents } from '../utils/factionEffects';
import { secedeWartimeGovernment } from '../utils/coalition';

export const IBERIAN_CAPITALS = {
  [MapFaction.NATIONALIST]: 'burgos', [MapFaction.REPUBLICAN]: 'madrid', [MapFaction.IBERIAN_DEFENSE]: 'barcelona',
} as const;
export const IBERIAN_SURRENDER_THRESHOLDS = {
  [MapFaction.NATIONALIST]: 60, [MapFaction.REPUBLICAN]: 50, [MapFaction.IBERIAN_DEFENSE]: 50,
} as const;
/** A scenario rule, not a claim that all UGT members belonged to the PSOE left. */
export const PSOE_LEFT_SHARE = 0.4;
export type IberianAllies = IberianDefenseState['allies'];
const zeroResources = (): ResourceSet => ({ manpower: 0, supplies: 0, industrialCapacity: 0, tankReserve: 0, commandPoints: 0 });
export const getFactionStrategicValue = (state: Pick<MapRuntimeState, 'provinces'>, faction: MapFaction) =>
  Object.values(state.provinces).reduce((sum, province) => sum + (province.owner === faction ? province.strategicValue : 0), 0);
export const canEscalateMayDays = (state: GameState) => isSpanishCivilWarOngoing(state)
  && !state.iberianDefense && state.mayDays?.stage === 'negotiations'
  && state.provinces?.barcelona?.owner === MapFaction.REPUBLICAN && isOrganizationActive(state, 'CNT');
export const canChooseIberianAllies = (state: GameState, allies: IberianAllies) =>
  (!allies.poum || (isOrganizationActive(state, 'POUM') && !state.republicanPartyStatus?.POUM))
  && (!allies.psoeLeft || (isOrganizationActive(state, 'PSOE') && isOrganizationActive(state, 'UGT')));

const fraction = (composition: ArmyComposition, share: number): ArmyComposition => ({
  infantry: Math.floor(composition.infantry * share), artillery: Math.floor(composition.artillery * share), tanks: Math.floor(composition.tanks * share),
});
const subtract = (whole: ArmyComposition, part: ArmyComposition): ArmyComposition => ({
  infantry: whole.infantry - part.infantry, artillery: whole.artillery - part.artillery, tanks: whole.tanks - part.tanks,
});
const total = (composition: ArmyComposition) => composition.infantry + composition.artillery + composition.tanks;

/** Split real formations and equipment; no scripted free divisions. */
export const projectIberianForces = (state: GameState, allies: IberianAllies) => {
  const contributions = { cnt: 0, poum: 0, psoeLeft: 0 };
  const armies: Army[] = [];
  for (const army of state.armies ?? []) {
    const member = getArmyPoliticalMember(army);
    if (army.faction !== MapFaction.REPUBLICAN) { armies.push(army); continue; }
    if (member === 'CNT_FAI' || (member === 'POUM' && allies.poum)) {
      contributions[member === 'CNT_FAI' ? 'cnt' : 'poum'] += army.manpower;
      armies.push({ ...army, faction: MapFaction.IBERIAN_DEFENSE });
    } else if (member === 'PSOE' && allies.psoeLeft) {
      const composition = fraction(army.composition, PSOE_LEFT_SHARE);
      const designed = fraction(army.designedComposition ?? army.composition, PSOE_LEFT_SHARE);
      if (!total(composition)) { armies.push(army); continue; }
      contributions.psoeLeft += total(composition);
      const remainder = subtract(army.composition, composition);
      const remainingDesign = subtract(army.designedComposition ?? army.composition, designed);
      armies.push({ ...army, composition: remainder, designedComposition: remainingDesign, manpower: total(remainder), maxManpower: total(remainingDesign) });
      armies.push({ ...army, id: `${army.id}_psoe_left`, faction: MapFaction.IBERIAN_DEFENSE,
        name: 'Left Socialist Militia', nameZh: '社会主义左翼民兵', composition, designedComposition: designed,
        manpower: total(composition), maxManpower: total(designed) });
    } else armies.push(army);
  }
  return { armies, contributions };
};

export const getIberianTransferProvinces = (state: GameState, allies: IberianAllies): string[] => {
  const units = projectIberianForces(state, allies).armies;
  const occupied = new Set(units.filter(army => army.faction === MapFaction.IBERIAN_DEFENSE).map(army => army.provinceId));
  return Object.values(state.provinces ?? {}).filter(province =>
    (province.owner === MapFaction.REPUBLICAN && ['catalonia', 'valencia', 'aragon'].includes(PROVINCE_REGIONS[province.id]?.group))
    || (CIVIL_WAR_FACTIONS.some(faction => faction === province.owner) && occupied.has(province.id)),
  ).map(province => province.id);
};

/** Arrange the initial withdrawal of non-joining garrisons before hostilities open. */
const nearestOwnedProvince = (start: string, faction: MapFaction, provinces: NonNullable<GameState['provinces']>): string | undefined => {
  const queue = [start], seen = new Set(queue);
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (provinces[id]?.owner === faction) return id;
    for (const neighbor of PROVINCE_ADJACENCY[id] ?? []) {
      if (!seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
    }
  }
  return Object.values(provinces).find(province => province.owner === faction)?.id;
};

export const formIberianDefense = (state: GameState, allies: IberianAllies): GameState => {
  if (!isSpanishCivilWarOngoing(state) || state.iberianDefense || state.mayDays?.stage !== 'split_alignment'
    || state.provinces?.barcelona?.owner !== MapFaction.REPUBLICAN || !canChooseIberianAllies(state, allies)) return state;
  const initialProvinces = getIberianTransferProvinces(state, allies);
  const transfer = new Set(initialProvinces);
  const provinces = Object.fromEntries(Object.entries(state.provinces ?? {}).map(([id, province]) =>
    [id, transfer.has(id) ? { ...province, owner: MapFaction.IBERIAN_DEFENSE } : province]));
  const projected = projectIberianForces(state, allies);
  const armies = projected.armies.map(army => {
    if (!transfer.has(army.provinceId) || army.faction === MapFaction.IBERIAN_DEFENSE) return { ...army, movesLeft: 2 };
    const destination = nearestOwnedProvince(army.provinceId, army.faction, provinces);
    return { ...army, provinceId: destination ?? army.provinceId, movesLeft: 2 };
  });
  const republican = state.mapResources?.[MapFaction.REPUBLICAN] ?? zeroResources();
  const beforeIndustry = Object.values(state.provinces ?? {}).filter(province => province.owner === MapFaction.REPUBLICAN).reduce((sum, province) => sum + province.industry, 0);
  const transferredIndustry = initialProvinces.reduce((sum, id) => sum + (state.provinces?.[id]?.owner === MapFaction.REPUBLICAN ? provinces[id].industry : 0), 0);
  const share = beforeIndustry ? transferredIndustry / beforeIndustry : 0;
  const committee = zeroResources(), remainder = { ...republican };
  for (const key of ['manpower', 'supplies', 'industrialCapacity', 'tankReserve'] as const) {
    committee[key] = Math.floor(republican[key] * share);
    remainder[key] -= committee[key];
  }
  committee.commandPoints = 2;
  remainder.commandPoints = 2;
  const ugtPool = state.armedForces?.entityPools?.ugt_socialist_militias;
  const leftSocialistReserve = allies.psoeLeft ? Math.floor((ugtPool?.manpower ?? 0) * PSOE_LEFT_SHARE) : 0;
  let next: GameState = {
    ...state, provinces, armies,
    iberianDefense: { formedAt: { year: state.year, month: state.month }, allies: { ...allies }, leftSocialistReserve,
      eliminated: [], eliminations: [], surrenderThresholds: { ...IBERIAN_SURRENDER_THRESHOLDS }, initialProvinces, contributions: projected.contributions },
    mapResources: { ...state.mapResources!, [MapFaction.REPUBLICAN]: remainder, [MapFaction.IBERIAN_DEFENSE]: committee },
    ...(ugtPool ? { armedForces: { ...state.armedForces, entityPools: { ...state.armedForces.entityPools,
      ugt_socialist_militias: { ...ugtPool, manpower: ugtPool.manpower - leftSocialistReserve } } } } : {}),
    mapCurrentPlayer: MapFaction.IBERIAN_DEFENSE, mapSelectedArmyId: null, mapSelectedArmyIds: [], mapSelectedProvinceId: 'barcelona',
    mayDays: { ...state.mayDays, stage: 'split_result', leadershipAttitude: 'insurrection', resolvedAt: { year: state.year, month: state.month },
      poumFollowupDueAt: undefined, productionFactor: 1, productionThroughMonth: monthIndex(state),
      communicationsControl: 'committee', publicOrderControl: 'committee', defenceControl: 'committee' },
    factions: adjustFactionDissents(state.factions, { Treintistas: 15, Faistas: -5, Puristas: -5 }),
    pendingEvents: state.pendingEvents.filter(event => !event.id.startsWith('may_days') && !['wartime_cabinet_coordination', 'nationalist_surrender', 'republican_surrender', 'asturias_revolution'].includes(event.id)),
    forceAsturiasRevolutionNextMonth: false,
    mapHistory: [state.language === 'zh' ? '伊比利亚防御委员会成立：与马德里政府、国民军全面交战。' : 'The Iberian Defense Committee forms: open war with Madrid and the Nationalists.', ...(state.mapHistory ?? [])],
  };
  next = secedeWartimeGovernment(next);
  return next;
};

/** Resolve capital loss AND low SV. Re-evaluate after each territorial transfer. */
export const settleIberianCapitulations = <State extends MapRuntimeState>(state: State): State => {
  if (!state.iberianDefense || state.iberianDefense.winner) return state;
  let next = state;
  let changed = true;
  while (changed) {
    changed = false;
    for (const faction of [MapFaction.NATIONALIST, MapFaction.REPUBLICAN, MapFaction.IBERIAN_DEFENSE] as const) {
      const campaign = next.iberianDefense;
      if (!campaign) return next;
      if (campaign.eliminated.includes(faction)) continue;
      const occupier = next.provinces[IBERIAN_CAPITALS[faction]]?.owner;
      const threshold = campaign.surrenderThresholds[faction] ?? IBERIAN_SURRENDER_THRESHOLDS[faction];
      if (!occupier || occupier === faction || !CIVIL_WAR_FACTIONS.some(item => item === occupier)
        || campaign.eliminated.includes(occupier) || getFactionStrategicValue(next, faction) >= threshold) continue;
      const eliminated = [...campaign.eliminated, faction];
      next = {
        ...next,
        provinces: Object.fromEntries(Object.entries(next.provinces).map(([id, province]) => [id, province.owner === faction ? { ...province, owner: occupier } : province])),
        armies: next.armies.filter(army => army.faction !== faction),
        mapResources: { ...next.mapResources, [faction]: zeroResources() },
        iberianDefense: { ...campaign, eliminated, playerDefeated: eliminated.includes(MapFaction.IBERIAN_DEFENSE),
          eliminations: [...campaign.eliminations, { faction, recipient: occupier, year: next.year, month: next.month }] },
        mapHistory: [next.language === 'zh'
          ? `${getMapFactionName(faction, true)}出局；剩余领土交给占领其首都的${getMapFactionName(occupier, true)}。`
          : `${getMapFactionName(faction, false)} capitulates; remaining territory passes to ${getMapFactionName(occupier, false)}, holder of its capital.`, ...next.mapHistory],
      };
      changed = true;
    }
  }
  const campaign = next.iberianDefense;
  if (!campaign) return next;
  const survivors = CIVIL_WAR_FACTIONS.filter(faction => !campaign.eliminated.includes(faction));
  if (survivors.length === 1) {
    const winner = survivors[0];
    const status = winner === MapFaction.IBERIAN_DEFENSE ? 'won' : 'lost';
    next = { ...next, iberianDefense: { ...campaign, winner }, civilWarStatus: status, activeWar: null,
      wars: { ...next.wars, spanish_civil_war: status }, mapSelectedArmyId: null, mapSelectedArmyIds: [] };
  }
  return next;
};
