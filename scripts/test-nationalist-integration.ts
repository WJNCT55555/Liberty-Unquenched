import assert from 'node:assert/strict';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameEvent, GameState } from '../src/game/types';
import { civilWarSetup, civilWarStep31 } from '../src/game/events/civil_war/civil_war_setup';
import { NATIONALIST_INTEGRATION_EVENTS } from '../src/game/events/civil_war/nationalist_integration';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { calculateMonthlyEventQueue } from '../src/game/rules/monthlyPipeline';
import { getMilitiaRecruitmentPool } from '../src/game/rules/warSetup';
import { checkWarStatus } from '../src/game/rules/warStatus';
import { settleIberianCapitulations } from '../src/game/rules/iberianDefense';
import { finishPlayerMapTurn } from '../src/game/reducers/mapReducer';
import { nationalistSurrender } from '../src/game/events/civil_war/nationalist_surrender';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { MapFaction } from '../src/map/types_map';
import { PROVINCE_ADJACENCY } from '../src/map/map_constants';
import { checkEndings, ENDINGS } from '../src/game/endings';
import { executeAiTurn, DEFAULT_MAP_AI_TURN_DEPENDENCIES } from '../src/game/rules/mapAiTurn';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const byId = (id: string) => {
  const event = NATIONALIST_INTEGRATION_EVENTS.find(item => item.id === id);
  assert.ok(event, id);
  return event;
};
const resolve = (state: GameState, event: GameEvent): GameState => {
  assert.equal(event.options.length, 1, event.id);
  assert.ok(event.condition?.(state), `condition for ${event.id}`);
  const next = { ...state, ...event.options[0].effect(state) };
  return { ...next, eventHistory: { triggered: [...new Set([...next.eventHistory.triggered, event.id])],
    resolved: [...new Set([...next.eventHistory.resolved, event.id])] } };
};
const at = (state: GameState, offset: number): GameState => {
  const index = state.civilWarSetupCompletedAt!.year * 12 + state.civilWarSetupCompletedAt!.month + offset;
  return { ...state, year: Math.floor((index - 1) / 12), month: (index - 1) % 12 + 1 };
};
const start = (quick: boolean, year = 1936, month = 7): GameState => {
  const base = gameReducer(copy(PRE_START_STATE), { type: 'START_GAME', payload: { scenario: '1936', difficulty: 'normal' } });
  const dated = { ...base, year, month, currentEvent: null, pendingEvents: [],
    eventHistory: { triggered: [], resolved: [] }, superEvent: null };
  const detailed = { ...dated, civilWarChoices: { ...dated.civilWarChoices, step14: 'nationalist' },
    provinces: { ...dated.provinces, navarra: { ...dated.provinces.navarra, owner: MapFaction.NATIONALIST },
      burgos: { ...dated.provinces.burgos, owner: MapFaction.NATIONALIST } } };
  return { ...dated, ...(quick ? civilWarSetup.options[0].effect(dated) : civilWarStep31.options[0].effect(detailed)) };
};
const march = (initial: GameState): GameState => {
  let state = resolve(initial, byId('nationalist_provisional_command'));
  assert.ok(!byId('nationalist_franco_alignment').condition?.(at(state, 1)));
  state = resolve(at(state, 2), byId('nationalist_franco_alignment'));
  state = at(state, 6);
  if (byId('nationalist_carlist_autonomy').condition?.(state)) state = resolve(state, byId('nationalist_carlist_autonomy'));
  return at(state, 9);
};
const requetesTotal = (state: GameState) => state.armedForces.entityPools.requetes.manpower
  + state.armies.filter(army => army.sourceEntityId === 'requetes' || army.identity === 'requetes')
    .reduce((sum, army) => sum + army.manpower, 0);

for (const quick of [true, false]) {
  const started = start(quick);
  assert.deepEqual(started.civilWarSetupCompletedAt, { year: 1936, month: 7 });
  assert.equal(started.francoStatus, 'nationalist');
  const before = march(started);
  const support = Object.fromEntries(Object.entries(before.classes).map(([key, entry]) =>
    [key, { total: Object.values(entry.support).reduce((sum, value) => sum + value, 0),
      fet: entry.support.FET + entry.support.FE + entry.support.CT, ap: entry.support.AP, re: entry.support.RE }]));
  const after = resolve(before, byId('nationalist_unification_or_schism'));
  const viaReducer = gameReducer({ ...before, phase: 'event', currentEvent: byId('nationalist_unification_or_schism') },
    { type: 'RESOLVE_EVENT', payload: byId('nationalist_unification_or_schism').options[0].effect });
  assert.ok(viaReducer.partySupport.FET > 0);
  assert.ok(viaReducer.eventHistory.resolved.includes('nationalist_unification_or_schism'));
  assert.equal(after.nationalistIntegration?.stage, 'fet');
  assert.equal(after.organizations.FE.status, 'integrated');
  assert.equal(after.organizations.CT.status, 'integrated');
  assert.equal(after.organizations.AP.status, 'dissolved');
  assert.equal(after.organizations.RE.status, 'dissolved');
  assert.equal(after.organizations.REQUETE_MILITIA.affiliatedOwner, 'FET');
  assert.equal(after.organizations.ITALIAN_CTV.affiliatedOwner, undefined);
  for (const [key, entry] of Object.entries(after.classes)) {
    const original = support[key] as { total: number; fet: number; ap: number; re: number };
    assert.ok(Math.abs(Object.values(entry.support).reduce((sum, value) => sum + value, 0) - original.total) < 0.0002);
    assert.ok(Math.abs(entry.support.FET - original.fet) < 0.0002);
    assert.equal(entry.support.AP, original.ap);
    assert.equal(entry.support.RE, original.re);
  }
  assert.ok(!byId('carlist_secession_aftermath').condition?.(after));
  assert.ok(byId('fet_statutes').condition?.(at(after, 13)));
  const statutes = resolve(at(after, 13), byId('fet_statutes'));
  const council = resolve(at(statutes, 15), byId('fet_national_council'));
  const services = resolve(at(council, 16), byId('fet_affiliate_services'));
  assert.ok(services.organizations.FET_POLITICAL_BOARD.established);
  assert.ok(services.organizations.FET_NATIONAL_COUNCIL.established);
  assert.ok(services.nationalistIntegration?.servicesAt);
}

const delayed = start(true, 1937, 1);
assert.ok(byId('nationalist_provisional_command').condition?.(delayed));
assert.ok(byId('nationalist_franco_alignment').condition?.(at(resolve(delayed, byId('nationalist_provisional_command')), 2)));
assert.equal(march(delayed).year, 1937);
assert.equal(resolve(march(delayed), byId('nationalist_unification_or_schism')).nationalistIntegration?.stage, 'fet');

const missingFe = march({ ...start(true), organizations: { ...start(true).organizations,
  FE: { established: false, status: 'dissolved' } } });
assert.equal(resolve(missingFe, byId('nationalist_unification_or_schism')).nationalistIntegration?.stage, 'military_unity');
const missingCt = march({ ...start(true), organizations: { ...start(true).organizations,
  CT: { established: false, status: 'dissolved' } } });
assert.equal(resolve(missingCt, byId('nationalist_unification_or_schism')).nationalistIntegration?.stage, 'military_unity');
const unarmed = start(true);
const noRequetes = march({ ...unarmed, armies: unarmed.armies.filter(army => army.identity !== 'requetes'),
  armedForces: { ...unarmed.armedForces, entityPools: { ...unarmed.armedForces.entityPools,
    requetes: { ...unarmed.armedForces.entityPools.requetes, manpower: 0 } } } });
assert.ok(!noRequetes.eventHistory.resolved.includes('nationalist_carlist_autonomy'));
assert.ok(byId('nationalist_unification_or_schism').condition?.(noRequetes));
assert.equal(resolve(noRequetes, byId('nationalist_unification_or_schism')).nationalistIntegration?.stage, 'fet');

for (const francoStatus of ['dead', 'alive', 'republic'] as const) {
  const prepared = march(start(true));
  const before = { ...prepared, francoStatus };
  const total = requetesTotal(before);
  const split = resolve(before, byId('nationalist_unification_or_schism'));
  assert.equal(split.nationalistIntegration?.stage, 'carlist_secession');
  assert.equal(split.provinces.navarra.owner, MapFaction.CARLIST);
  assert.equal(requetesTotal(split), total);
  assert.equal(getMilitiaRecruitmentPool(split, MapFaction.CARLIST, 'requetes')?.active, true);
  assert.equal(getMilitiaRecruitmentPool(split, MapFaction.NATIONALIST, 'requetes'), undefined);
  assert.ok(!byId('carlist_secession_aftermath').condition?.(split));
  assert.ok(byId('carlist_secession_aftermath').condition?.(at(split, 10)));
  assert.deepEqual(byId('nationalist_unification_or_schism').options[0].effect(split), {});
}

const absentNavarra = march({ ...start(true), francoStatus: 'dead',
  provinces: { ...start(true).provinces, navarra: { ...start(true).provinces.navarra, owner: MapFaction.REPUBLICAN } } });
assert.equal(resolve(absentNavarra, byId('nationalist_unification_or_schism')).nationalistIntegration?.stage, 'fragmented');

const prepared = march(start(true));
const split = resolve({ ...prepared, francoStatus: 'dead' }, byId('nationalist_unification_or_schism'));
const oldNavarraGarrison = prepared.armies.find(army => army.provinceId === 'navarra' && army.faction === MapFaction.NATIONALIST);
if (oldNavarraGarrison) {
  const moved = split.armies.find(army => army.id === oldNavarraGarrison.id)!;
  assert.ok(PROVINCE_ADJACENCY.navarra.includes(moved.provinceId));
  assert.equal(split.provinces[moved.provinceId].owner, MapFaction.NATIONALIST);
}
const beforeMaterials = prepared.mapResources.NATIONALIST;
const afterMaterials = split.mapResources.NATIONALIST;
const carlistMaterials = split.mapResources.CARLIST;
assert.equal(afterMaterials.industrialCapacity + carlistMaterials.industrialCapacity, beforeMaterials.industrialCapacity);
assert.equal(afterMaterials.tankReserve + carlistMaterials.tankReserve, beforeMaterials.tankReserve);
assert.ok(afterMaterials.supplies + carlistMaterials.supplies <= beforeMaterials.supplies);
const levy = executeAiTurn(split, MapFaction.CARLIST, true, { ...DEFAULT_MAP_AI_TURN_DEPENDENCIES,
  calculateMoves: () => [] });
assert.equal(requetesTotal(levy), requetesTotal(split));
assert.equal(levy.armies.filter(army => army.faction === MapFaction.CARLIST).length,
  split.armies.filter(army => army.faction === MapFaction.CARLIST).length + 1);
assert.equal(executeAiTurn(levy, MapFaction.CARLIST, true, { ...DEFAULT_MAP_AI_TURN_DEPENDENCIES,
  calculateMoves: () => [] }).armies.length, levy.armies.length);
const surrenderState = { ...split, provinces: Object.fromEntries(Object.entries(split.provinces).map(([id, province]) =>
  [id, province.owner === MapFaction.NATIONALIST ? { ...province, owner: MapFaction.REPUBLICAN } : province])) };
assert.ok(nationalistSurrender.condition?.(surrenderState));
const afterNationalist = { ...surrenderState, ...nationalistSurrender.options[0].effect(surrenderState) };
assert.equal(afterNationalist.civilWarStatus, 'ongoing');
const afterCarlist = checkWarStatus({ ...afterNationalist, provinces: { ...afterNationalist.provinces,
  navarra: { ...afterNationalist.provinces.navarra, owner: MapFaction.REPUBLICAN } } }, true);
assert.equal(afterCarlist.civilWarStatus, 'won');
assert.equal(checkEndings({ ...afterNationalist, civilWarStatus: 'lost' }).ending, ENDINGS.CARLIST_VICTORY);
assert.equal(checkEndings({ ...split, civilWarStatus: 'lost' }).ending, ENDINGS.DIVIDED_REBEL_VICTORY);

const campaign: NonNullable<GameState['iberianDefense']> = { formedAt: { year: 1937, month: 5 }, allies: { poum: false, psoeLeft: false },
  leftSocialistReserve: 0, eliminated: [], eliminations: [], surrenderThresholds: {},
  initialProvinces: ['barcelona'], contributions: { cnt: 0, poum: 0, psoeLeft: 0 }, carlistEntered: true };
const threeWay = { ...split, iberianDefense: campaign,
  provinces: { ...split.provinces, barcelona: { ...split.provinces.barcelona, owner: MapFaction.NATIONALIST } } };
const defeated = settleIberianCapitulations(threeWay);
assert.equal(defeated.iberianDefense?.playerDefeated, true);
assert.equal(defeated.civilWarStatus, 'lost');
const splitDuringThreeWay = resolve({ ...prepared, francoStatus: 'dead', iberianDefense: { ...campaign,
  carlistEntered: false } }, byId('nationalist_unification_or_schism'));
assert.equal(splitDuringThreeWay.iberianDefense?.carlistEntered, true);

const calls: MapFaction[] = [];
const helpers = { checkWarStatus: (state: GameState) => state,
  executeAiTurn: (state: GameState, faction: MapFaction) => { calls.push(faction); return state; },
  resolveBattle: () => { throw new Error('unexpected battle'); } };
const once = finishPlayerMapTurn({ ...split, phase: 'war', mapCurrentPlayer: MapFaction.REPUBLICAN }, helpers);
finishPlayerMapTurn(once, helpers);
assert.deepEqual(calls, [MapFaction.NATIONALIST, MapFaction.CARLIST]);
const onceRestored = deserializeGameState(serializeGameState(once), { cards: CARD_REGISTRY,
  advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY });
finishPlayerMapTurn(onceRestored, helpers);
assert.deepEqual(calls, [MapFaction.NATIONALIST, MapFaction.CARLIST]);

const pending = { ...split, pendingEvents: [byId('carlist_secession_aftermath')], currentEvent: byId('nationalist_unification_or_schism') };
const restored = deserializeGameState(serializeGameState(pending), { cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS,
  events: RESTORABLE_EVENT_REGISTRY });
assert.equal(restored.pendingEvents[0].id, 'carlist_secession_aftermath');
assert.equal(typeof restored.pendingEvents[0].options[0].effect, 'function');
assert.equal(restored.provinces.navarra.owner, MapFaction.CARLIST);
const old = copy(serializeGameState(start(true)));
delete (old.state.mapResources as Record<string, unknown>).CARLIST;
delete (old.state.partySupport as Record<string, unknown>).FET;
const migrated = deserializeGameState(old, { cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY });
assert.ok(migrated.mapResources.CARLIST);
assert.equal(migrated.partySupport.FET, 0);

for (const event of NATIONALIST_INTEGRATION_EVENTS) {
  assert.ok(SCHEDULED_EVENT_REGISTRY.some(item => item.id === event.id));
  assert.ok(RESTORABLE_EVENT_REGISTRY.some(item => item.id === event.id));
}
const initialQueue = calculateMonthlyEventQueue(start(true), at(start(true), 1), 1936, 8);
assert.ok(initialQueue.some(event => event.id === 'nationalist_provisional_command'));
console.log('Nationalist integration checks passed.');
