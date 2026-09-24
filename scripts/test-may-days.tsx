import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState, WartimeGovernmentRoute } from '../src/game/types';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { civilWarSetup } from '../src/game/events/civil_war/civil_war_setup';
import { wartimePowerArrangement, wartimeCabinetCoordination } from '../src/game/events/civil_war/wartime_power_arrangement';
import { mayDays, mayDaysCeasefire, mayDaysGovernmentCrisis, mayDaysResult, mayDaysPOUMCase, mayDaysPOUMResult } from '../src/game/events/civil_war/may_days';
import { beginMayDays, canAgreeMayDays, canBackMayDaysCommittees, canPreserveMayDaysGovernment, getMayDaysPower, getMayDaysProductionFactor, getMayDaysSupportWeight, isMayDaysDue, isMayDaysPOUMDue, resolveMayDaysGovernment, resolveMayDaysPOUM, settleMayDaysCeasefire, settleMayDaysPressure } from '../src/game/rules/mayDays';
import { calculateMonthlyEventQueue, calculateMonthlyMapStage } from '../src/game/rules/monthlyPipeline';
import { getArmyPoliticalMember, isWartimeCrisisDue, monthIndex } from '../src/game/rules/wartimeCoalition';
import { shouldQueueEvent, updateCoalitions } from '../src/game/utils';
import { getEffectiveCortes, isRepublicanPartyEligible } from '../src/game/politicalEligibility';
import { getLegalStanceActors } from '../src/game/lawStances';
import { activateCivilWarOrganizations, isOrganizationActive, normalizeOrganizationState, setOrganizationEstablished } from '../src/game/organizations';
import { getMilitiaRecruitmentPool } from '../src/game/rules/warSetup';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';
import { MapFaction, type Army } from '../src/map/types_map';
import { formIberianDefense, settleIberianCapitulations, IBERIAN_CAPITALS, IBERIAN_SURRENDER_THRESHOLDS } from '../src/game/rules/iberianDefense';
import { mayDaysSplitAlignment } from '../src/game/events/civil_war/may_days';
import { getPlayerMapFaction, canEnterMapProvince, CIVIL_WAR_FACTIONS } from '../src/map/rules/factions';
import { finishPlayerMapTurn, reduceMapWarAction, type MapReducerHelpers } from '../src/game/reducers/mapReducer';
import { calculateAiMoves } from '../src/map/lib/gameAi';
import { checkEndings } from '../src/game/endings';
import { IberianWarDetails } from '../src/components/IberianWarDetails';
import { PROVINCE_REGIONS, PROVINCE_ADJACENCY } from '../src/map/map_constants';
import { nationalistSurrender } from '../src/game/events/civil_war/nationalist_surrender';
import { republicanSurrender } from '../src/game/events/civil_war/republican_surrender';

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });
const runtime = { cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY };
const restore = (state: GameState) => deserializeGameState(serializeGameState(state), runtime);
const troop = (id: string, identity: Army['identity'], manpower: number): Army => ({
  id, identity, faction: MapFaction.REPUBLICAN, provinceId: 'barcelona', manpower, maxManpower: manpower,
  composition: { infantry: manpower, artillery: 0, tanks: 0 }, designedComposition: { infantry: manpower, artillery: 0, tanks: 0 },
  movesLeft: 2, morale: 70,
});
const seed = (route: WartimeGovernmentRoute = 'cabinet', difficulty: GameState['difficulty'] = 'historical', scenario: GameState['scenario'] = '1936'): GameState => {
  let state = gameReducer(copy(PRE_START_STATE), { type: 'START_GAME', payload: { scenario, difficulty } });
  state = { ...state, year: 1936, month: 7, currentEvent: null, pendingEvents: [], superEvent: null, eventHistory: { triggered: [], resolved: [] } };
  state = { ...state, ...civilWarSetup.options[0].effect(state), month: 8 };
  state.classes = Object.fromEntries(Object.entries(state.classes).map(([id, value]) => [id, { ...value, support: {
    ...Object.fromEntries(Object.keys(value.support).map(party => [party, 0])), CNT_FAI: 45, PSOE: 25, POUM: 10, PCE: 5, IR: 4, UR: 3, ERC: 4, PNV: 3, PS: 1,
  } }])) as GameState['classes'];
  state.partyRelations = Object.fromEntries(Object.keys(state.partyRelations).map(party => [party, 90])) as GameState['partyRelations'];
  for (const party of ['POUM', 'PS', 'IR', 'UR', 'ERC', 'PNV', 'PCE', 'PSOE'] as const) state = { ...state, ...setOrganizationEstablished(state, party) };
  state.poum_founded = true;
  state.armies = [troop('cnt_may', 'cnt', 40000), troop('poum_may', 'poum', 6000), ...state.armies!];
  const option = wartimePowerArrangement.options[{ cabinet: 0, council: 1, external: 2 }[route]];
  assert.ok(!option.condition || option.condition(state));
  state = { ...state, ...option.effect(state), year: 1937, month: 5, language: 'zh', currentEvent: null, pendingEvents: [], phase: 'event', resources: 20 };
  state.provinces = { ...state.provinces, barcelona: { ...state.provinces!.barcelona, owner: MapFaction.REPUBLICAN } };
  state.regionalStatuses = { ...state.regionalStatuses, catalonia: 'autonomy' };
  state.cataloniaControl = 'committee';
  state.stats = { ...state.stats, republicanAuthority: 55, revolutionaryFervor: 50 };
  // `stats.workerControl` is a derived cache (docs/工人控制度改造方案.md §2.5), so this
  // fixture sets the two things the May Days gate actually reads: the CNT's share of the
  // union movement, and how much industry the local unions own.
  state.unionShare = { ...(state.unionShare ?? { CNT: 27, UGT: 14, UR: 2, ELA: 2, CNCA: 5, CONS: 1, other: 3, unorganized: 46 }), CNT: 40 };
  state.controlShares = {
    land: { church: 2, latifundia: 20, smallholders: 33, cooperative: 20, collective: 25, state: 0 },
    industry: { foreign: 4, bigCapital: 8, smallBusiness: 8, cooperative: 25, union: 50, state: 5 },
  };
  state = { ...state, ...activateCivilWarOrganizations(state) };
  return { ...state, activeCoalitions: updateCoalitions(state) };
};
const choose = (state: GameState, index: number): GameState => {
  assert.ok(state.currentEvent, 'an event must be open');
  const option = state.currentEvent.options[index];
  assert.ok(option, `missing option ${index}`);
  assert.ok(!option.condition || option.condition(state), `disabled option ${state.currentEvent.id}:${index}`);
  return gameReducer(state, { type: 'RESOLVE_EVENT', payload: option.effect });
};
const open = (state = seed()) => ({ ...state, currentEvent: mayDays });
const endCentralized = (state = seed()) => choose(choose(choose(open(state), 0), 1), 0);
const openPOUM = (state = endCentralized()): GameState => ({ ...state, month: state.month === 12 ? 1 : state.month + 1, year: state.month === 12 ? state.year + 1 : state.year, phase: 'event', currentEvent: mayDaysPOUMCase });
const weak = (state: GameState): GameState => ({ ...state, partyRelations: Object.fromEntries(Object.keys(state.partyRelations).map(party => [party, 0])) as GameState['partyRelations'] });
let checks = 0;
const test = (name: string, fn: () => void) => { fn(); checks++; console.log(`PASS ${name}`); };

test('Historical May eligibility across all scenarios; non-historical pressure in all four modes', () => {
  for (const scenario of ['1931', '1933', '1936'] as const) for (const difficulty of ['historical', 'easy', 'normal', 'hard', 'sandbox'] as const) {
    let state = seed('cabinet', difficulty, scenario);
    if (difficulty !== 'historical') {
      state = weak(state);
      state = settleMayDaysPressure({ ...state, month: 4 });
      assert.equal(isMayDaysDue(state), false);
      state = settleMayDaysPressure({ ...state, month: 5 });
    }
    assert.equal(shouldQueueEvent(mayDays, state, { mode: difficulty === 'historical' ? 'historical' : 'nonHistorical' }), true);
    if (difficulty === 'historical') for (const month of [4, 6]) assert.equal(isMayDaysDue({ ...state, month }), false);
    else assert.equal(isMayDaysDue({ ...state, year: 1936, month: 12 }), false);
  }
});

test('No war, Asturias, lost Barcelona, independence, absent CNT or absent local dual power cannot trigger', () => {
  const state = seed();
  const invalid: Partial<GameState>[] = [
    { activeWar: 'asturias_war' }, { civilWarStatus: 'won' }, { activeWar: null }, { wartimePowerArrangement: undefined },
    { rulingCoalition: null }, { activeCoalitions: [] }, { cataloniaControl: 'republic' },
    { regionalStatuses: { ...state.regionalStatuses, catalonia: 'independent' } },
    { provinces: { ...state.provinces, barcelona: { ...state.provinces!.barcelona, owner: MapFaction.NATIONALIST } } },
    { organizations: { ...state.organizations, CNT: { established: false, status: 'unformed' } } },
    { wartimePowerArrangement: { ...state.wartimePowerArrangement!, formedAt: { year: 1937, month: 5 } } },
  ];
  for (const patch of invalid) assert.equal(isMayDaysDue({ ...state, ...patch }), false);
});

test('Pressure counts consecutive actual months, survives saves, and clears on reconciliation or a gap', () => {
  let state = weak(seed('cabinet', 'normal'));
  state = settleMayDaysPressure({ ...state, month: 3 });
  assert.equal(state.mayDays?.pressureMonths, 1);
  assert.equal(settleMayDaysPressure(state), state);
  state = settleMayDaysPressure({ ...restore(state), month: 4 });
  assert.equal(state.mayDays?.pressureMonths, 2);
  assert.equal(settleMayDaysPressure({ ...state, month: 6 }).mayDays?.pressureMonths, 1);
  const friendly = { ...state, month: 5, partyRelations: seed().partyRelations };
  assert.equal(settleMayDaysPressure(friendly).mayDays?.pressureMonths, 0);
  const december = settleMayDaysPressure({ ...weak(seed('cabinet', 'normal')), year: 1936, month: 12 });
  assert.equal(settleMayDaysPressure({ ...december, year: 1937, month: 1 }).mayDays?.pressureMonths, 2);
});

test('The real monthly reducer opens May Days, protects the chain and suppresses the generic crisis', () => {
  let state = seed();
  state = { ...state, month: 4, phase: 'war', currentEvent: null, pendingEvents: [wartimeCabinetCoordination] };
  const next = gameReducer(state, { type: 'NEXT_PHASE' });
  assert.equal(next.month, 5);
  assert.equal(next.currentEvent?.id, mayDays.id);
  assert.ok(!next.pendingEvents.some(event => event.id === wartimeCabinetCoordination.id));
  assert.equal(gameReducer(next, { type: 'NEXT_PHASE' }).month, 5);
  assert.equal(gameReducer({ ...next, pendingEvents: [wartimeCabinetCoordination] }, { type: 'SELECT_EVENT', payload: { eventId: wartimeCabinetCoordination.id } }).currentEvent?.id, mayDays.id);
  assert.equal(isWartimeCrisisDue({ ...next, wartimePowerArrangement: { ...next.wartimePowerArrangement!, lowCohesionMonths: 4, crisisCooldownUntil: 0 } }), false);
  const followup = gameReducer({ ...endCentralized(), phase: 'war' }, { type: 'NEXT_PHASE' });
  assert.equal(followup.month, 6);
  assert.equal(followup.currentEvent?.id, mayDaysPOUMCase.id);
  assert.equal(followup.phase, 'event');
});

test('All three government routes can retain their institutions and can accept a central cabinet', () => {
  for (const route of ['cabinet', 'council', 'external'] as const) {
    const initial = seed(route);
    const gov = choose(open(initial), 0);
    assert.equal(gov.currentEvent?.id, mayDaysGovernmentCrisis.id);
    assert.equal(canPreserveMayDaysGovernment(gov), true);
    const kept = choose(gov, 0);
    assert.deepEqual(kept.ministers, initial.ministers);
    assert.equal(kept.government.type, initial.government.type);
    const changed = choose(gov, 1);
    assert.equal(changed.government.primeMinister, 'Juan Negrín');
    assert.equal(changed.government.president, initial.government.president);
    assert.equal(changed.ministers.justice, 'PNV');
    assert.equal(changed.ministers.estado, 'IR');
    assert.ok(!Object.values(changed.ministers).includes('CNT'));
    assert.equal(changed.rulingCoalition, initial.rulingCoalition);
    assert.deepEqual(changed.activeCoalitions[0].formedAt, initial.activeCoalitions[0].formedAt);
    assert.deepEqual(changed.wartimePowerArrangement?.formedAt, initial.wartimePowerArrangement?.formedAt);
    assert.equal(changed.activeCoalitions[0].participation?.CNT_FAI, 'external');
    assert.equal(changed.regionalStatuses.catalonia, 'autonomy');
    assert.equal(changed.cntStanceAlwaysOpposed, initial.cntStanceAlwaysOpposed);
    assert.ok(getMayDaysPower(changed).some(row => row.member === 'CNT_FAI' && row.unionBonus > 0 && row.militaryBonus > 0));
  }
});

test('Peaceful agreement avoids street losses; committee success and defeat produce distinct outcomes', () => {
  const initial = seed();
  const negotiation = choose(open(initial), 1);
  assert.equal(negotiation.mayDays?.escalation, 0);
  assert.equal(canAgreeMayDays(negotiation), true);
  const joint = choose(negotiation, 1);
  assert.equal(joint.currentEvent?.id, mayDaysResult.id);
  assert.equal(joint.mayDays?.productionFactor, 1);
  assert.equal(joint.resources, initial.resources - 2);
  assert.equal(choose(joint, 0).mayDays?.stage, 'complete');
  assert.equal(canBackMayDaysCommittees(initial), true);
  const committees = choose(open(initial), 2);
  const agreement = choose(committees, 2);
  assert.equal(agreement.mayDays?.settlement, 'committee');
  assert.equal(agreement.resources, initial.resources - 3);
  assert.equal(agreement.mayDays?.productionThroughMonth, monthIndex(initial) + 2);
  const failed = choose(weak(committees), 2);
  assert.equal(failed.mayDays?.settlement, 'defeat');
  assert.equal(canPreserveMayDaysGovernment(failed), false);
  assert.equal(choose(failed, 1).currentEvent?.id, mayDaysResult.id);
});

test('Resources gate agreements; zero-resource states retain a complete fallback path', () => {
  let state = choose(open({ ...seed(), resources: 0 }), 1);
  assert.equal(mayDaysCeasefire.options[1].condition!(state), false);
  assert.equal(settleMayDaysCeasefire(state, 'joint'), state);
  state = choose(choose(choose(state, 0), 1), 0);
  assert.equal(state.resources, 0);
  state = openPOUM(state);
  assert.equal(mayDaysPOUMCase.options[0].condition!(state), false);
  assert.equal(choose(choose(state, 1), 0).mayDays?.stage, 'complete');
});

test('All effects and previews are immutable, and duplicate callbacks never repeat a settlement', () => {
  const initial = open(seed());
  const before = JSON.stringify(initial);
  for (const option of mayDays.options) option.effectPreview?.(initial);
  const started = beginMayDays(initial, 'negotiate');
  assert.equal(JSON.stringify(initial), before);
  const settled = settleMayDaysCeasefire(started, 'joint');
  assert.equal(settleMayDaysCeasefire(settled, 'joint'), settled);
  assert.equal(beginMayDays(settled, 'withdraw'), settled);
  const gov = choose(initial, 0);
  const after = choose(gov, 1);
  assert.equal(resolveMayDaysGovernment(after, false), after);
  const duplicated = gameReducer(after, { type: 'RESOLVE_EVENT', payload: mayDaysGovernmentCrisis.options[1].effect });
  assert.deepEqual(duplicated, after);
  assert.equal(isMayDaysDue(choose(after, 0)), false);
});

test('Barcelona production alone loses output for exactly the subsequent settlements, including year rollover', () => {
  const original = seed();
  const committees = choose(open(original), 2);
  const settled = choose(choose(committees, 2), 0);
  const baseline = calculateMonthlyMapStage({ ...settled, mayDays: undefined });
  const reduced = calculateMonthlyMapStage(settled);
  assert.ok(reduced.mapResources.REPUBLICAN.supplies < baseline.mapResources.REPUBLICAN.supplies);
  assert.deepEqual(reduced.mapResources.NATIONALIST, baseline.mapResources.NATIONALIST);
  assert.equal(reduced.mapResources.REPUBLICAN.manpower, baseline.mapResources.REPUBLICAN.manpower);
  assert.deepEqual(settled.provinces, original.provinces);
  const may = monthIndex(settled);
  assert.equal(getMayDaysProductionFactor(settled, 'barcelona', may), 1);
  for (const step of [1, 2]) assert.equal(getMayDaysProductionFactor(settled, 'barcelona', may + step), 0.75);
  assert.equal(getMayDaysProductionFactor(settled, 'barcelona', may + 3), 1);
  assert.equal(getMayDaysProductionFactor(settled, 'madrid'), 1);
  assert.equal(getMayDaysProductionFactor({ ...settled, provinces: { ...settled.provinces, barcelona: { ...settled.provinces!.barcelona, owner: MapFaction.NATIONALIST } } }, 'barcelona'), 1);
  const december = { ...settled, year: 1937, month: 12, mayDays: { ...settled.mayDays!, resolvedAt: { year: 1937, month: 12 }, productionThroughMonth: 1938 * 12 + 2 } };
  assert.equal(getMayDaysProductionFactor(restore(december), 'barcelona', 1938 * 12 + 1), 0.75);
  assert.equal(getMayDaysProductionFactor(december, 'barcelona', 1938 * 12 + 3), 1);
});

test('POUM follow-up is deferred one month, prioritized, non-repeating and available in every mode', () => {
  for (const difficulty of ['historical', 'easy', 'normal', 'hard', 'sandbox'] as const) {
    let initial = seed('cabinet', difficulty);
    if (difficulty !== 'historical') initial = settleMayDaysPressure({ ...settleMayDaysPressure({ ...weak(initial), month: 4 }), month: 5 });
    const settled = endCentralized(initial);
    assert.equal(isMayDaysPOUMDue(settled), false);
    const next = { ...settled, month: 6 };
    assert.equal(isMayDaysPOUMDue(next), true);
    assert.equal(calculateMonthlyEventQueue(settled, next, 1937, 6)[0]?.id, mayDaysPOUMCase.id);
    const done = choose(choose({ ...next, currentEvent: mayDaysPOUMCase }, 2), 0);
    assert.equal(isMayDaysPOUMDue(done), false);
    assert.equal(resolveMayDaysPOUM(done, 'ban'), done);
  }
});

test('POUM guarantees and judicial inquiry preserve eligibility; unsupported protest leads to a distinct ban', () => {
  const state = openPOUM();
  assert.ok(getMayDaysSupportWeight(state, true) >= 0.6);
  const guarantee = choose(state, 0);
  assert.equal(guarantee.mayDays?.poumOutcome, 'guaranteed');
  assert.equal(isRepublicanPartyEligible(guarantee, 'POUM'), true);
  assert.equal(choose(state, 1).mayDays?.poumOutcome, 'inquiry');
  const protest = choose(weak(state), 1);
  assert.equal(protest.mayDays?.poumOutcome, 'protested_ban');
  const accepting = choose(weak(state), 2);
  assert.ok(protest.factions.Puristas.dissent < accepting.factions.Puristas.dissent);
});

test('Ban removes political and recruiting eligibility without deleting soldiers, equipment, support or rebel forces', () => {
  const state = openPOUM();
  const before = JSON.stringify(state);
  const banned = choose(state, 2);
  assert.equal(JSON.stringify(state), before);
  assert.equal(isRepublicanPartyEligible(banned, 'POUM'), false);
  assert.equal(getEffectiveCortes(banned).POUM, 0);
  assert.ok(!getLegalStanceActors(banned).includes('POUM'));
  assert.ok(!Object.values(banned.ministers).includes('POUM'));
  assert.ok(!getMayDaysPower(banned).some(row => row.member === 'POUM'));
  assert.deepEqual(banned.armies, state.armies);
  assert.deepEqual(banned.cortes, state.cortes);
  assert.deepEqual(banned.armedForces.entityPools, state.armedForces.entityPools);
  assert.ok(banned.classes.Obreros.support.POUM > 0, 'class-support normalization must preserve POUM social support after a political ban');
  assert.equal(banned.classes.Intelectuales.support.POUM, state.classes.Intelectuales.support.POUM);
  assert.equal(getArmyPoliticalMember(banned.armies!.find(army => army.id === 'poum_may')!), 'POUM');
  assert.equal(banned.mayDays?.poumUnitsAwaitingIntegration, true);
  let loaded = restore(banned);
  loaded = { ...loaded, ...activateCivilWarOrganizations(loaded) };
  loaded = normalizeOrganizationState(loaded);
  assert.equal(isOrganizationActive(loaded, 'POUM_MILITIA'), false);
  assert.equal(getMilitiaRecruitmentPool(loaded, MapFaction.REPUBLICAN, 'poum_militias')?.active, false);
  assert.equal(getMilitiaRecruitmentPool(loaded, MapFaction.NATIONALIST, 'falange_first_line')?.active, true);
  assert.deepEqual(setOrganizationEstablished(loaded, 'POUM'), {});
  const recruitState = { ...loaded, phase: 'war' as const };
  const recruited = gameReducer(recruitState, { type: 'RECRUIT_MAP_ARMY', payload: { provinceId: 'barcelona', sourceEntityId: 'poum_militias', composition: { infantry: 100, artillery: 0, tanks: 0 } } });
  assert.equal(recruited?.armies?.length, recruitState.armies?.length);
});

test('Missing parties cannot return through appointments; a late POUM foundation does not auto-join the pact', () => {
  let state = seed();
  state = { ...state, organizations: { ...state.organizations, PSOE: { established: false, status: 'unformed' }, PNV: { established: false, status: 'unformed' } } };
  const gov = choose(open(state), 0);
  const result = choose(gov, 1);
  assert.equal(result.government.primeMinister, 'Acting cabinet coordinator');
  assert.ok(!Object.values(result.ministers).includes('PSOE'));
  assert.ok(!Object.values(result.ministers).includes('PNV'));
  state = seed();
  state.activeCoalitions = state.activeCoalitions.map(coalition => ({ ...coalition, members: coalition.members?.filter(member => member !== 'POUM') }));
  const next = choose(choose(open(state), 1), 1);
  assert.ok(!getMayDaysPower(next).some(row => row.member === 'POUM'));
});

test('All six nodes hydrate with callable choices and bilingual content; only roots enter the monthly pool', () => {
  const nodes = [mayDays, mayDaysCeasefire, mayDaysGovernmentCrisis, mayDaysResult, mayDaysPOUMCase, mayDaysPOUMResult];
  const root = open();
  const negotiation = choose(root, 1);
  const government = choose(root, 0);
  const result = choose(government, 1);
  const poum = openPOUM(choose(result, 0));
  const poumResult = choose(poum, 2);
  const states = [root, negotiation, government, result, poum, poumResult];
  for (let index = 0; index < nodes.length; index++) {
    const event = nodes[index];
    assert.equal(SCHEDULED_EVENT_REGISTRY.some(candidate => candidate.id === event.id), index === 0 || index === 4);
    const restored = restore(states[index]);
    assert.equal(restored.currentEvent?.id, event.id);
    assert.equal(restored.phase, 'event');
    assert.equal(gameReducer(restored, { type: 'CHECK_EVENT' }).phase, restored.phase, 'late provider effects must preserve the restored event phase');
    for (const language of ['zh', 'en'] as const) {
      const localized = { ...restored, language };
      assert.ok(renderToStaticMarkup(<>{restored.currentEvent!.renderContent?.(localized)}</>).length > 40);
      for (const option of restored.currentEvent!.options) {
        assert.ok(option.text && option.textZh && option.subtitle && option.subtitleZh);
        assert.equal(typeof option.effect, 'function');
        if (!option.condition || option.condition(localized)) option.effectPreview?.(localized);
      }
    }
  }
  assert.equal(choose(restore(negotiation), 1).mayDays?.settlement, 'joint');
  assert.equal(choose(restore(government), 1).mayDays?.governmentOutcome, 'centralized');
  assert.equal(choose(restore(poumResult), 0).mayDays?.stage, 'complete');
});

test('Worker patrol law changes the opening narrative; old saves do not invent a past crisis', () => {
  const state = seed();
  const patrols = { ...state, domesticPolicy: { ...state.domesticPolicy, security_corps_law: 4 } };
  const markup = renderToStaticMarkup(<>{mayDays.renderContent!(patrols)}</>);
  assert.ok(markup.includes('工人巡逻队制度已经实行'));
  assert.ok(!markup.includes('突击卫队'));
  const old = restore({ ...state, year: 1938, mayDays: undefined });
  assert.equal(old.mayDays, undefined);
  assert.equal(isMayDaysDue(old), false);
});

test('Starting a fresh campaign clears the previous May Days history and aftermath', () => {
  const completed = choose(choose(openPOUM(), 2), 0);
  const restarted = gameReducer(completed, { type: 'START_GAME', payload: { scenario: '1936', difficulty: 'normal' } });
  assert.equal(restarted.mayDays, undefined);
  assert.ok(!restarted.eventHistory.resolved.includes('may_days'));
});

const alignment = (state = seed()) => choose(choose(open(state), 1), 3);
const secede = (option = 3, state = seed()) => choose(choose(alignment(state), option), 0);
const battleHelpers = (calls: MapFaction[] = []): MapReducerHelpers => ({
  resolveBattle: (armies, provinces) => ({ updatedArmies: armies, updatedProvinces: provinces, messages: [] }),
  executeAiTurn: (state, faction) => {
    calls.push(faction);
    return { ...state, mapResources: { ...state.mapResources!, [faction]: { ...state.mapResources![faction], commandPoints: 0 } } };
  },
  checkWarStatus: state => settleIberianCapitulations(state),
});

test('All four secession alignments work in all scenarios, difficulties and cabinet routes', () => {
  for (const scenario of ['1931', '1933', '1936'] as const) for (const difficulty of ['historical', 'easy', 'normal', 'hard', 'sandbox'] as const) {
    for (const route of ['cabinet', 'council', 'external'] as const) for (let option = 0; option < 4; option++) {
      let state = seed(route, difficulty, scenario);
      if (difficulty !== 'historical') state = settleMayDaysPressure({ ...settleMayDaysPressure({ ...weak(state), month: 4 }), month: 5 });
      const next = secede(option, state);
      assert.equal(next.iberianDefense?.allies.poum, option === 1 || option === 3);
      assert.equal(next.iberianDefense?.allies.psoeLeft, option === 2 || option === 3);
      assert.equal(next.mapCurrentPlayer, MapFaction.IBERIAN_DEFENSE);
      assert.equal(getPlayerMapFaction(next), MapFaction.IBERIAN_DEFENSE);
      assert.equal(next.mayDays?.leadershipAttitude, 'insurrection');
      assert.equal(next.mayDays?.stage, 'complete');
      assert.equal(next.rulingCoalition, null);
      assert.ok(!Object.values(next.ministers).includes('CNT'));
      assert.equal(next.cntStance, 'oppose');
      assert.equal(isRepublicanPartyEligible(next, 'CNT_FAI'), false);
      assert.equal(isMayDaysPOUMDue({ ...next, month: 6 }), false);
    }
  }
});

test('Secession conserves every soldier and weapon; only the Socialist left separates from UGT', () => {
  const state = alignment();
  state.armies!.push({ ...troop('ugt_fraction', 'ugt', 1023), composition: { infantry: 1001, artillery: 17, tanks: 5 }, designedComposition: { infantry: 1101, artillery: 27, tanks: 8 } });
  const before = JSON.stringify(state);
  const sum = (armies: Army[], field: 'composition' | 'designedComposition', unit: 'infantry' | 'artillery' | 'tanks') => armies.reduce((value, army) => value + army[field][unit], 0);
  for (const allies of [{ poum: false, psoeLeft: false }, { poum: true, psoeLeft: true }]) {
    const next = formIberianDefense(state, allies);
    for (const field of ['composition', 'designedComposition'] as const) for (const unit of ['infantry', 'artillery', 'tanks'] as const) assert.equal(sum(next.armies!, field, unit), sum(state.armies!, field, unit));
    for (const resource of ['manpower', 'supplies', 'industrialCapacity', 'tankReserve'] as const) {
      assert.equal(next.mapResources!.REPUBLICAN[resource] + next.mapResources!.IBERIAN_DEFENSE[resource], state.mapResources!.REPUBLICAN[resource]);
    }
    if (allies.psoeLeft) {
      assert.deepEqual(next.armies!.find(army => army.id === 'ugt_fraction_psoe_left')!.composition, { infantry: 400, artillery: 6, tanks: 2 });
      assert.equal(next.armies!.find(army => army.id === 'ugt_fraction')!.faction, MapFaction.REPUBLICAN);
    }
    assert.deepEqual(formIberianDefense(next, allies), next, 'the split cannot run twice');
  }
  assert.equal(JSON.stringify(state), before);
});

test('Territory includes the three Republican regions and committee unit provinces; non-joining garrisons withdraw', () => {
  const state = alignment();
  state.provinces = { ...state.provinces!, zaragoza: { ...state.provinces!.zaragoza, owner: MapFaction.NATIONALIST }, madrid: { ...state.provinces!.madrid, owner: MapFaction.REPUBLICAN } };
  state.armies = [...state.armies!.filter(army => army.provinceId !== 'zaragoza'), { ...troop('cnt_outside', 'cnt', 1500), provinceId: 'malaga' }, troop('loyal_garrison', 'gov', 1700)];
  const next = formIberianDefense(state, { poum: false, psoeLeft: false });
  assert.equal(next.provinces!.zaragoza.owner, MapFaction.NATIONALIST);
  assert.equal(next.provinces!.malaga.owner, MapFaction.IBERIAN_DEFENSE);
  for (const province of Object.values(state.provinces!)) if (province.owner === MapFaction.REPUBLICAN && ['catalonia', 'valencia', 'aragon'].includes(PROVINCE_REGIONS[province.id]?.group)) assert.equal(next.provinces![province.id].owner, MapFaction.IBERIAN_DEFENSE);
  for (const army of next.armies!) if (next.iberianDefense!.initialProvinces.includes(army.provinceId)) assert.equal(army.faction, MapFaction.IBERIAN_DEFENSE);
  const garrison = next.armies!.find(army => army.id === 'loyal_garrison')!;
  assert.equal(garrison.faction, MapFaction.REPUBLICAN);
  assert.equal(next.provinces![garrison.provinceId].owner, MapFaction.REPUBLICAN);
  assert.equal(garrison.manpower, 1700);
  assert.equal(next.provinces!.andorra.owner, state.provinces!.andorra.owner);
});

test('Party reserves belong to one side; recruitment and save restoration cannot regenerate spent militia', () => {
  const state = alignment();
  state.armedForces.entityPools.ugt_socialist_militias.manpower = 10000;
  const next = formIberianDefense(state, { poum: true, psoeLeft: true });
  assert.equal(next.iberianDefense!.leftSocialistReserve, 4000);
  assert.equal(getMilitiaRecruitmentPool(next, MapFaction.REPUBLICAN, 'ugt_socialist_militias')!.manpower, 6000);
  assert.equal(getMilitiaRecruitmentPool(next, MapFaction.REPUBLICAN, 'cnt_defense_committees'), undefined);
  assert.equal(getMilitiaRecruitmentPool(next, MapFaction.REPUBLICAN, 'poum_militias'), undefined);
  for (const entity of ['cnt_defense_committees', 'poum_militias', 'ugt_socialist_militias'] as const) {
    let recruit = { ...next, currentEvent: null, phase: 'war' as const, provinces: { ...next.provinces!, barcelona: { ...next.provinces!.barcelona, buildings: { recruitingOffice: 1 } } } };
    if (entity !== 'ugt_socialist_militias') recruit.armedForces = { ...recruit.armedForces, entityPools: { ...recruit.armedForces.entityPools, [entity]: { ...recruit.armedForces.entityPools[entity], manpower: 10000 } } };
    const oldPool = getMilitiaRecruitmentPool(recruit, MapFaction.IBERIAN_DEFENSE, entity)!.manpower;
    const joined = gameReducer(recruit, { type: 'RECRUIT_MAP_ARMY', payload: { provinceId: 'barcelona', sourceEntityId: entity, composition: { infantry: 100, artillery: 0, tanks: 0 } } });
    assert.equal(joined.armies!.length, recruit.armies!.length + 1);
    let loaded = restore(joined);
    loaded = normalizeOrganizationState({ ...loaded, ...activateCivilWarOrganizations(loaded) });
    assert.equal(getMilitiaRecruitmentPool(loaded, MapFaction.IBERIAN_DEFENSE, entity)!.manpower, oldPool - 100);
  }
});

test('Monthly turns run Madrid then Nationalists once, including reloads and voluntary early ending', () => {
  const state = { ...secede(), phase: 'war' as const };
  const calls: MapFaction[] = [];
  const next = finishPlayerMapTurn(state, battleHelpers(calls));
  assert.deepEqual(calls, [MapFaction.REPUBLICAN, MapFaction.NATIONALIST]);
  assert.equal(next.iberianDefense?.completedAiMonth, monthIndex(state));
  assert.equal(finishPlayerMapTurn(next, battleHelpers(calls)), next);
  finishPlayerMapTurn(restore(next), battleHelpers(calls));
  assert.equal(calls.length, 2);
  const advance = gameReducer(state, { type: 'NEXT_PHASE' });
  assert.equal(advance.month, state.month, 'early next-phase requests must execute the AI before advancing the calendar');
  assert.equal(advance.iberianDefense?.completedAiMonth, monthIndex(state));
  const after = gameReducer(advance, { type: 'NEXT_PHASE' });
  assert.equal(after.month, state.month + 1);
  assert.equal(after.mapCurrentPlayer, MapFaction.IBERIAN_DEFENSE);
  assert.equal(after.mapResources!.IBERIAN_DEFENSE.commandPoints, 2);
  const aiEntries = advance.mapHistory!.filter(entry => entry.includes('AI 回合'));
  assert.equal(aiEntries.length, 2);
  const duplicate = gameReducer(advance, { type: 'END_MAP_PLAYER_TURN' });
  assert.deepEqual(duplicate.mapHistory, advance.mapHistory);
});

test('All player army and construction actions reject hostile units, hostile provinces and AI turns', () => {
  const state = { ...secede(), phase: 'war' as const };
  const enemy = state.armies!.find(army => army.faction === MapFaction.REPUBLICAN)!;
  const selected = { ...state, mapSelectedArmyIds: [enemy.id] };
  for (const action of [
    { type: 'REINFORCE_MAP_ARMY', payload: { armyId: enemy.id } },
    { type: 'SPLIT_MAP_ARMY', payload: { armyId: enemy.id, composition: { infantry: 1, artillery: 0, tanks: 0 } } },
    { type: 'DISBAND_MAP_ARMIES' }, { type: 'MERGE_MAP_ARMIES' },
    { type: 'BUILD_MAP_BUILDING', payload: { provinceId: 'madrid', buildingType: 'barracks' } },
    { type: 'RECRUIT_MAP_ARMY', payload: { provinceId: 'madrid', composition: { infantry: 1, artillery: 0, tanks: 0 } } },
  ] as const) assert.equal(reduceMapWarAction(selected, action, battleHelpers()), selected);
  const ai = { ...state, mapCurrentPlayer: MapFaction.REPUBLICAN };
  assert.equal(reduceMapWarAction(ai, { type: 'END_MAP_PLAYER_TURN' }, battleHelpers()), ai);
  for (const faction of CIVIL_WAR_FACTIONS) {
    for (const enemyFaction of CIVIL_WAR_FACTIONS) assert.equal(canEnterMapProvince(faction, enemyFaction), true);
    for (const neutral of [MapFaction.ANDORRA, MapFaction.PORTUGAL, MapFaction.UNITED_KINGDOM]) assert.equal(canEnterMapProvince(faction, neutral), false);
  }
});

test('Two Committee moves spend exactly 2 CP and automatically run each AI once', () => {
  const state = { ...secede(), phase: 'war' as const };
  const army = state.armies!.find(item => item.id === 'cnt_may')!;
  const calls: MapFaction[] = [];
  const helpers: MapReducerHelpers = { ...battleHelpers(calls), resolveBattle: (armies, provinces, moved, target) => ({
    updatedArmies: armies.map(item => item.id === moved.id ? { ...item, provinceId: target, movesLeft: item.movesLeft - 1 } : item),
    updatedProvinces: provinces, messages: [],
  }) };
  assert.ok(PROVINCE_ADJACENCY.barcelona.includes('gerona'));
  const first = reduceMapWarAction(state, { type: 'MOVE_MAP_ARMY', payload: { armyId: army.id, targetProvinceId: 'gerona' } }, helpers)!;
  assert.equal(first.mapResources!.IBERIAN_DEFENSE.commandPoints, 1);
  assert.equal(calls.length, 0);
  const second = reduceMapWarAction(first, { type: 'MOVE_MAP_ARMY', payload: { armyId: army.id, targetProvinceId: 'barcelona' } }, helpers)!;
  assert.equal(second.mapResources!.IBERIAN_DEFENSE.commandPoints, 0);
  assert.deepEqual(calls, [MapFaction.REPUBLICAN, MapFaction.NATIONALIST]);
  assert.equal(second.armies!.find(item => item.id === army.id)!.movesLeft, 0);
  assert.equal(reduceMapWarAction(second, { type: 'END_MAP_PLAYER_TURN' }, helpers), second);
});

test('A camp eliminated during the Madrid AI turn receives no later turn that month', () => {
  const state = thresholdFixture(MapFaction.NATIONALIST, 59, false);
  const calls: MapFaction[] = [];
  finishPlayerMapTurn(state, { ...battleHelpers(calls), executeAiTurn: (next, faction) => {
    calls.push(faction);
    return { ...next, provinces: { ...next.provinces!, burgos: { ...next.provinces!.burgos, owner: MapFaction.REPUBLICAN } } };
  } });
  assert.deepEqual(calls, [MapFaction.REPUBLICAN]);
});

test('Both AI factions can plan attacks against either opponent', () => {
  for (const attacker of [MapFaction.REPUBLICAN, MapFaction.NATIONALIST]) for (const defender of CIVIL_WAR_FACTIONS.filter(faction => faction !== attacker)) {
    const state = secede();
    const provinces = { madrid: { ...state.provinces!.madrid, owner: attacker }, toledo: { ...state.provinces!.toledo, owner: defender } };
    const armies = [{ ...troop('ai_test', 'gov', 5000), faction: attacker, provinceId: 'madrid' }];
    const moves = calculateAiMoves({ ...state, provinces, armies, resources: state.mapResources! } as any, attacker);
    assert.ok(moves.some(action => action.type === 'MOVE' && action.payload.targetProvinceId === 'toledo'));
  }
});

function thresholdFixture(faction: typeof CIVIL_WAR_FACTIONS[number], value: number, capitalLost: boolean): GameState {
  const state = secede();
  const enemy = faction === MapFaction.NATIONALIST ? MapFaction.REPUBLICAN : MapFaction.NATIONALIST;
  const provinces = Object.fromEntries(CIVIL_WAR_FACTIONS.map(camp => [IBERIAN_CAPITALS[camp], { ...state.provinces![IBERIAN_CAPITALS[camp]], owner: camp, strategicValue: camp === faction ? 0 : 100 }]));
  provinces[`test_${faction}`] = { ...state.provinces!.valencia, id: `test_${faction}`, owner: faction, strategicValue: value };
  if (capitalLost) provinces[IBERIAN_CAPITALS[faction]] = { ...provinces[IBERIAN_CAPITALS[faction]], owner: enemy };
  return { ...state, provinces, armies: [], phase: 'war' };
};

test('Every capitulation uses strict SV and capital loss together; remaining territory goes to the capital occupier', () => {
  for (const faction of CIVIL_WAR_FACTIONS) {
    const threshold = IBERIAN_SURRENDER_THRESHOLDS[faction];
    for (const [value, lost, eliminated] of [[threshold, true, false], [threshold - 1, false, false], [threshold - 1, true, true]] as const) {
      const state = thresholdFixture(faction, value, lost);
      const before = JSON.stringify(state);
      const next = settleIberianCapitulations(state);
      assert.equal(next.iberianDefense!.eliminated.includes(faction), eliminated);
      if (eliminated) {
        assert.equal(next.provinces![`test_${faction}`].owner, state.provinces![IBERIAN_CAPITALS[faction]].owner);
        assert.equal(next.mapResources![faction].commandPoints, 0);
      }
      assert.equal(JSON.stringify(state), before);
    }
  }
  const custom = thresholdFixture(MapFaction.NATIONALIST, 60, true);
  custom.iberianDefense = { ...custom.iberianDefense!, surrenderThresholds: { ...custom.iberianDefense!.surrenderThresholds, NATIONALIST: 61 } };
  assert.ok(settleIberianCapitulations(custom).iberianDefense!.eliminated.includes(MapFaction.NATIONALIST));
});

test('Nationalist elimination leaves the left-wing war running; Committee defeat allows AI observation beyond 1939', () => {
  const leftWar = settleIberianCapitulations(thresholdFixture(MapFaction.NATIONALIST, 59, true));
  assert.equal(leftWar.civilWarStatus, 'ongoing');
  assert.equal(leftWar.iberianDefense!.winner, undefined);
  const leftCalls: MapFaction[] = [];
  finishPlayerMapTurn(leftWar, battleHelpers(leftCalls));
  assert.deepEqual(leftCalls, [MapFaction.REPUBLICAN]);
  const observer = settleIberianCapitulations(thresholdFixture(MapFaction.IBERIAN_DEFENSE, 49, true));
  assert.equal(observer.iberianDefense!.playerDefeated, true);
  assert.equal(checkEndings({ ...observer, year: 1942 }).isGameOver, false);
  const calls: MapFaction[] = [];
  finishPlayerMapTurn(observer, battleHelpers(calls));
  assert.deepEqual(calls, [MapFaction.REPUBLICAN, MapFaction.NATIONALIST]);
  const income = calculateMonthlyMapStage(observer);
  assert.equal(income.mapResources.IBERIAN_DEFENSE.manpower, 0);
  assert.equal(income.mapResources.IBERIAN_DEFENSE.commandPoints, 0);
});

test('Only the last surviving faction wins, with distinct endings and no defeated-faction revival', () => {
  for (const winner of CIVIL_WAR_FACTIONS) {
    let state = secede();
    state = { ...state, provinces: Object.fromEntries(Object.entries(state.provinces!).map(([id, province]) => [id, CIVIL_WAR_FACTIONS.some(faction => faction === province.owner) ? { ...province, owner: winner } : province])) };
    const next = settleIberianCapitulations(state);
    assert.equal(next.iberianDefense!.winner, winner);
    assert.equal(next.iberianDefense!.eliminated.length, 2);
    assert.equal(next.activeWar, null);
    assert.equal(checkEndings(next).isGameOver, true);
    assert.equal(checkEndings(next).ending, winner === MapFaction.IBERIAN_DEFENSE ? 'IBERIAN_COMMITTEE_VICTORY' : winner === MapFaction.REPUBLICAN ? 'IBERIAN_MADRID_VICTORY' : 'WE_HAVE_PASSED');
    assert.deepEqual(settleIberianCapitulations(next), next);
  }
});

test('Old two-sided surrender events and forced Asturias cannot interrupt the three-sided campaign', () => {
  for (const faction of [MapFaction.NATIONALIST, MapFaction.REPUBLICAN] as const) {
    const state = settleIberianCapitulations(thresholdFixture(faction, 0, true));
    state.pendingEvents = [nationalistSurrender, republicanSurrender];
    state.forceAsturiasRevolutionNextMonth = true;
    for (const event of [nationalistSurrender, republicanSurrender]) {
      assert.equal(event.condition!(state), false);
      assert.equal(event.options[0].effect(state).civilWarStatus, 'ongoing');
    }
    const events = calculateMonthlyEventQueue(state, state, state.year, state.month + 1);
    assert.ok(!events.some(event => ['nationalist_surrender', 'republican_surrender', 'asturias_revolution'].includes(event.id)));
    const afterAI = gameReducer(state, { type: 'NEXT_PHASE' });
    const afterMonth = gameReducer(afterAI, { type: 'NEXT_PHASE' });
    assert.equal(afterMonth.civilWarStatus, 'ongoing');
    assert.equal(afterMonth.isGameOver, false);
  }
});

test('New nodes restore in both languages, previews remain pure, and absent allies are unavailable', () => {
  const state = alignment();
  const before = JSON.stringify(state);
  for (const option of mayDaysSplitAlignment.options) option.effectPreview!(state);
  assert.equal(JSON.stringify(state), before);
  for (const snapshot of [state, choose(state, 3)]) {
    const loaded = restore(snapshot);
    assert.equal(loaded.currentEvent?.id, snapshot.currentEvent?.id);
    assert.equal(typeof loaded.currentEvent!.options[0].effect, 'function');
    for (const language of ['zh', 'en'] as const) {
      const localized = { ...loaded, language };
      if (localized.iberianDefense) assert.ok(renderToStaticMarkup(<IberianWarDetails state={localized} />).includes(language === 'zh' ? '伊比利亚防御委员会' : 'Iberian Defense Committee'));
    }
  }
  const unavailable = { ...state, organizations: { ...state.organizations, POUM: { established: false, status: 'unformed' as const }, UGT: { established: false, status: 'unformed' as const } } };
  assert.equal(mayDaysSplitAlignment.options[0].condition!(unavailable), true);
  for (const index of [1, 2, 3]) assert.equal(mayDaysSplitAlignment.options[index].condition!(unavailable), false);
  assert.equal(getPlayerMapFaction(restore(seed())), MapFaction.REPUBLICAN);
  assert.equal(gameReducer(secede(), { type: 'START_GAME', payload: { scenario: '1936', difficulty: 'normal' } }).iberianDefense, undefined);
});

console.log(`May Days: ${checks} checks passed.`);

if (process.argv.includes('--write-preview')) {
  const { mkdirSync, writeFileSync } = await import('node:fs');
  const root = open();
  const negotiation = choose(root, 1);
  const government = choose(root, 0);
  const result = choose(government, 1);
  const poum = openPOUM(choose(result, 0));
  const split = alignment();
  const splitResult = choose(split, 3);
  const war = { ...choose(splitResult, 0), phase: 'war' as const, currentView: 'map' as const };
  const states = [root, negotiation, government, result, poum, choose(poum, 2), split, splitResult, war];
  mkdirSync('output/qa', { recursive: true });
  writeFileSync('output/qa/may-days-snapshots.json', JSON.stringify(states.map(serializeGameState)));
}
