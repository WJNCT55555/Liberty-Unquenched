import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { gameReducer } from '../src/game/GameContext';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { GameState, WartimeGovernmentRoute } from '../src/game/types';
import { civilWarSetup, civilWarStep31 } from '../src/game/events/civil_war/civil_war_setup';
import { wartimePowerArrangement, wartimePowerArrangementResult, wartimeCabinetCoordination } from '../src/game/events/civil_war/wartime_power_arrangement';
import { elections1931Results } from '../src/game/events/elections_1931_results';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { calculateMonthlyEventQueue, applyMonthlyPoliticalMaintenance } from '../src/game/rules/monthlyPipeline';
import { shouldQueueEvent, checkCoalitionDissolve, updateCoalitions } from '../src/game/utils';
import { canFormDefenceCouncil, createWartimeCoalition, getArmyEffectiveManpower, getArmyPoliticalMember, getWartimeCabinet, getWartimeCoalitionPower, isWartimeCrisisDue, monthIndex, updateWartimeCoalition } from '../src/game/rules/wartimeCoalition';
import { getEffectiveCortes, isRepublicanPartyEligible } from '../src/game/politicalEligibility';
import { getLegalActorSeats, getLegalStanceActors } from '../src/game/lawStances';
import { getPartySupport } from '../src/game/parties';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';
import { reduceMapWarAction } from '../src/game/reducers/mapReducer';
import { MapFaction, type Army } from '../src/map/types_map';
import { cntInterPartyRelationships } from '../src/game/action_affairs/inter_party_relationships';
import { WartimeCoalitionDetails } from '../src/components/WartimeCoalitionDetails';

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const runtime = { cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY };
const seed = (scenario: GameState['scenario'] = '1936', difficulty: GameState['difficulty'] = 'normal'): GameState => {
  const initial = gameReducer(copy(PRE_START_STATE), { type: 'START_GAME', payload: { scenario, difficulty } });
  return {
    ...copy(initial), year: 1936, month: 7, phase: 'action', actionsLeft: 2,
    superEvent: null, currentEvent: null, pendingEvents: [], civilWarStatus: 'not_started', activeWar: null,
    eventHistory: { triggered: [], resolved: [] },
  };
};
const setup = (state = seed()): GameState => ({ ...state, ...civilWarSetup.options[0].effect(state) });
const due = (state = setup()): GameState => ({ ...state, year: state.month === 12 ? state.year + 1 : state.year, month: state.month === 12 ? 1 : state.month + 1 });
const arrange = (route: WartimeGovernmentRoute, state = due()): GameState => {
  const option = wartimePowerArrangement.options[{ cabinet: 0, council: 1, external: 2 }[route]];
  return { ...state, ...option.effect(state) };
};
const troop = (id: string, identity: Army['identity'], manpower: number, extras: Partial<Army> = {}): Army => ({
  id, identity, faction: MapFaction.REPUBLICAN, provinceId: 'barcelona', manpower, maxManpower: manpower,
  composition: { infantry: manpower, artillery: 0, tanks: 0 }, designedComposition: { infantry: manpower, artillery: 0, tanks: 0 },
  movesLeft: 2, morale: 60, militarization: 40, ...extras,
});
const close = (actual: number, expected: number, message: string) => assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} versus ${expected}`);
let checks = 0;
const test = (name: string, fn: () => void) => { fn(); checks++; console.log(`PASS ${name}`); };

test('All scenarios and difficulties: both setup exits trigger exactly next month, including December rollover', () => {
  for (const scenario of ['1931', '1933', '1936'] as const) for (const difficulty of ['easy', 'normal', 'hard', 'historical', 'sandbox'] as const) {
    for (const finish of [civilWarSetup.options[0], civilWarStep31.options[0]]) {
      const before = { ...seed(scenario, difficulty), year: 1933, month: 12 };
      const state = { ...before, ...finish.effect(before) };
      assert.deepEqual(state.civilWarSetupCompletedAt, { year: 1933, month: 12 });
      const options = { mode: difficulty === 'historical' ? 'historical' as const : 'nonHistorical' as const };
      assert.equal(shouldQueueEvent(wartimePowerArrangement, state, options), false);
      assert.equal(shouldQueueEvent(wartimePowerArrangement, due(state), options), true);
      assert.equal(calculateMonthlyEventQueue(state, due(state), 1934, 1)[0]?.id, wartimePowerArrangement.id);
    }
  }
});

test('Setup entry, unfinished setup, Asturias, peace and completed wars cannot trigger', () => {
  const start = seed();
  const immersive = { ...start, ...civilWarSetup.options[1].effect(start) };
  assert.equal(immersive.civilWarSetupCompletedAt, undefined);
  const state = due();
  for (const patch of [
    { civilWarSetupCompletedAt: undefined }, { activeWar: 'asturias_war' as const },
    { activeWar: null }, { civilWarStatus: 'won' as const }, { civilWarStatus: 'lost' as const },
  ]) assert.equal(wartimePowerArrangement.condition!({ ...state, ...patch }), false);
  const july = setup();
  assert.equal(due(july).month, 8);
});

test('Monthly reducer opens the arrangement before ordinary events', () => {
  const state = setup();
  const next = gameReducer({ ...state, phase: 'war' }, { type: 'NEXT_PHASE' });
  assert.equal(next.month, 8);
  assert.equal(next.currentEvent?.id, wartimePowerArrangement.id);
  assert.equal(next.pendingEvents.some(event => event.id === wartimePowerArrangement.id), false);
  assert.equal(gameReducer(next, { type: 'NEXT_PHASE' }).currentEvent?.id, wartimePowerArrangement.id);
  const otherEvent = elections1931Results;
  assert.equal(gameReducer({ ...next, pendingEvents: [otherEvent] }, { type: 'SELECT_EVENT', payload: { eventId: otherEvent.id } }).currentEvent?.id, wartimePowerArrangement.id);
  const earlyWar = { ...setup(seed('1931')), year: 1931, month: 5 };
  const queue = calculateMonthlyEventQueue(earlyWar, { ...earlyWar, month: 6, pendingEvents: [otherEvent] }, 1931, 6);
  assert.ok(!queue.some(event => event.id === otherEvent.id), 'peace elections must not replace an early wartime cabinet');
});

test('Government settlement preserves social support, historical seats, president and both armies', () => {
  const state = due();
  state.government = { ...state.government, president: 'Ramón Franco', presidentZh: '拉蒙·佛朗哥' };
  const before = JSON.stringify(state);
  const next = arrange('cabinet', state);
  assert.equal(JSON.stringify(state), before, 'event must not mutate its input');
  assert.equal(next.rulingCoalition, 'popular_front_wartime');
  assert.equal(next.government.president, 'Ramón Franco');
  assert.deepEqual(next.classes, state.classes);
  assert.deepEqual(next.cortes, state.cortes);
  assert.deepEqual(next.armies, state.armies);
  assert.deepEqual(next.armedForces, state.armedForces);
  assert.deepEqual(next.unionShare, state.unionShare);
  for (const party of ['AP', 'RE', 'CT', 'FE', 'PRR', 'DLR'] as const) {
    assert.equal(isRepublicanPartyEligible(next, party), false);
    assert.equal(getEffectiveCortes(next)[party], 0);
    assert.equal(getLegalActorSeats(next, party), 0);
    assert.equal(getLegalStanceActors(next).includes(party), false);
    assert.equal(getPartySupport(next, party), getPartySupport(state, party));
    assert.equal(Object.values(next.ministers).includes(party), false);
  }
  assert.equal(isRepublicanPartyEligible(next, 'PNV'), true);
  assert.ok(next.coalitionHistory.some(item => item.id === state.rulingCoalition));
  assert.ok(!cntInterPartyRelationships.effect(next).currentEvent!.options.some(option => typeof option.text === 'string' && option.text.includes('Republican Radical')));
  assert.equal(next.ministers.health, 'CNT');
  assert.equal(next.cntStance, 'govern');
});

test('All routes use the same new coalition; external CNT keeps power without ministries or electoral conversion', () => {
  const state = due();
  state.cntStance = 'oppose';
  state.cntStanceAlwaysOpposed = true;
  const external = arrange('external', state);
  const coalition = external.activeCoalitions.find(item => item.activeId === 'popular_front_wartime')!;
  assert.ok(coalition.members!.includes('CNT_FAI'));
  assert.ok(coalition.members!.includes('PNV'));
  assert.ok(!coalition.members!.includes('PRRevS'));
  assert.equal(coalition.participation!.CNT_FAI, 'external');
  assert.equal(Object.values(external.ministers).includes('CNT'), false);
  assert.equal(external.cntStance, 'oppose');
  assert.equal(external.cntStanceAlwaysOpposed, true);
  assert.ok(getWartimeCoalitionPower(external, coalition).find(row => row.member === 'CNT_FAI')!.weight > 0);
  const councilState = { ...state, armies: [troop('cnt', 'cnt', 500_000)], partyRelations: { ...state.partyRelations, PSOE: 90 } };
  assert.equal(canFormDefenceCouncil(councilState), true);
  const council = arrange('council', councilState);
  assert.equal(council.rulingCoalition, 'popular_front_wartime');
  assert.equal(council.ministers.agriculture, 'CNT');
  assert.equal(council.government.type, 'National Defence Council');
  assert.equal(canFormDefenceCouncil({ ...councilState, partyRelations: { ...state.partyRelations, PSOE: -100 }, activeCoalitions: [] }), false);
});

test('Absent parties do not join or receive ministries; resolving twice never repeats rewards', () => {
  const state = due();
  state.organizations = { ...state.organizations, POUM: { established: false, status: 'unformed' }, PS: { established: false, status: 'unformed' } };
  state.poum_founded = false;
  state.ps_founded = false;
  const next = arrange('cabinet', state);
  const coalition = next.activeCoalitions.find(item => item.activeId === 'popular_front_wartime')!;
  assert.ok(!coalition.members!.includes('POUM') && !coalition.members!.includes('PS'));
  assert.equal(getWartimeCabinet(state, 'council').justice, 'UR');
  assert.deepEqual(arrange('cabinet', next), next);
  assert.equal(wartimePowerArrangement.condition!(due(next)), false);
  assert.equal(shouldQueueEvent(wartimePowerArrangement, state, { mode: 'nonHistorical', pendingEvents: [wartimePowerArrangement] }), false);
});

test('Union ownership, state troops, international forces and explicit Basque provenance are counted once', () => {
  const state = due();
  state.unionShare = { CNT: 30, UGT: 20, UR: 10, ELA: 5, CNCA: 5, CONS: 0, other: 0, unorganized: 30 };
  state.armies = [troop('cnt', 'cnt', 40_000), troop('ugt', 'ugt', 20_000), troop('state', 'gov', 100_000),
    troop('basque', 'regional', 8_000, { sourceEntityId: 'euzko_gudarostea' }), troop('unknown', 'regional', 8_000),
    troop('intl', 'intl', 12_000, { sourceEntityId: 'international_brigades' })];
  const rows = getWartimeCoalitionPower(state, createWartimeCoalition(state, 'cabinet'));
  const row = (party: string) => rows.find(item => item.member === party)!;
  close(row('CNT_FAI').unionBonus, 15, 'CNT union bonus');
  close(row('PSOE').unionBonus, 10, 'UGT belongs to PSOE once');
  close(row('ERC').unionBonus, 5, 'Rabassaires belongs to ERC');
  close(row('UR').unionBonus, 0, 'Republican Union is not Rabassaires');
  close(row('PCE').unionBonus, 0, 'no second full UGT allocation');
  close(row('PNV').effectiveManpower, 6_000, 'only the explicitly sourced Basque unit counts');
  close(row('PCE').effectiveManpower, 9_000, 'international organizational ownership');
  assert.equal(getArmyPoliticalMember(state.armies[2]), null);
  assert.equal(getArmyPoliticalMember(state.armies[4]), null);
  close(rows.reduce((sum, item) => sum + item.weight, 0), 1, 'normalized weights');
  const hugeReserves = { ...state, armedForces: { ...state.armedForces, militias: { ...state.armedForces.militias, cntFai: 10_000_000 } } };
  assert.deepEqual(getWartimeCoalitionPower(hugeReserves, createWartimeCoalition(hugeReserves, 'cabinet')), rows);
});

test('A stronger dissatisfied member lowers cohesion; a stronger cooperative member raises it', () => {
  const state = due();
  state.armies = [];
  const coalition = createWartimeCoalition(state, 'cabinet');
  coalition.memberContributions.CNT_FAI = 0;
  const stronger = { ...state, armies: [troop('cnt', 'cnt', 100_000)] };
  assert.ok(updateWartimeCoalition(stronger, coalition).cohesion < updateWartimeCoalition(state, coalition).cohesion);
  coalition.memberContributions.CNT_FAI = 100;
  assert.ok(updateWartimeCoalition(stronger, coalition).cohesion > updateWartimeCoalition(state, coalition).cohesion);
  const first = updateWartimeCoalition(state, coalition);
  assert.deepEqual(updateWartimeCoalition(state, first), first, 'law satisfaction must not accumulate on refresh');
});

test('Splitting and merging preserve effective strength and source; unrelated regional commands cannot merge', () => {
  const state = due();
  state.phase = 'war';
  const army = troop('basque', 'regional', 1000, { sourceEntityId: 'euzko_gudarostea' });
  state.armies = [army];
  const context = { resolveBattle: () => { throw new Error('Unexpected battle'); }, executeAiTurn: () => { throw new Error('Unexpected AI turn'); }, checkWarStatus: (s: GameState) => s };
  const split = reduceMapWarAction(state, { type: 'SPLIT_MAP_ARMY', payload: { armyId: army.id, composition: { infantry: 300, artillery: 0, tanks: 0 } } }, context)!;
  assert.equal(split.armies!.length, 2);
  assert.ok(split.armies!.every(item => item.sourceEntityId === 'euzko_gudarostea'));
  close(split.armies!.reduce((sum, item) => sum + getArmyEffectiveManpower(item), 0), getArmyEffectiveManpower(army), 'split strength');
  const merged = reduceMapWarAction({ ...split, mapSelectedArmyIds: split.armies!.map(item => item.id) }, { type: 'MERGE_MAP_ARMIES' }, context)!;
  assert.equal(merged.armies!.length, 1);
  close(getArmyEffectiveManpower(merged.armies![0]), getArmyEffectiveManpower(army), 'merge strength');
  const mixed = { ...state, armies: [army, troop('other', 'regional', 500)], mapSelectedArmyIds: ['basque', 'other'] };
  const rejected = reduceMapWarAction(mixed, { type: 'MERGE_MAP_ARMIES' }, context);
  assert.equal((rejected ?? mixed).armies!.length, 2);
});

test('Low cohesion uses actual monthly settlements, keeps the government and enters a separately cooled crisis', () => {
  let state = arrange('external');
  state.currentEvent = null;
  state.activeCoalitions = state.activeCoalitions.map(coalition => ({ ...coalition, memberContributions: Object.fromEntries(Object.keys(coalition.memberContributions).map(member => [member, 0])) as typeof coalition.memberContributions }));
  state.activeCoalitions = updateCoalitions(state);
  assert.equal(checkCoalitionDissolve(state).rulingCoalition, 'popular_front_wartime');
  const first = applyMonthlyPoliticalMaintenance(due(state));
  assert.equal(first.wartimePowerArrangement!.lowCohesionMonths, 1);
  const sameMonth = applyMonthlyPoliticalMaintenance(first);
  assert.equal(sameMonth.wartimePowerArrangement!.lowCohesionMonths, 1);
  assert.equal(sameMonth.stats.republicanAuthority, first.stats.republicanAuthority);
  const second = applyMonthlyPoliticalMaintenance(due(first));
  assert.equal(isWartimeCrisisDue(second), true);
  assert.equal(second.rulingCoalition, 'popular_front_wartime');
  assert.equal(second.governmentCrisis, null);
  const recovered = gameReducer({ ...second, pendingEvents: [wartimeCabinetCoordination] }, {
    type: 'RESOLVE_EVENT', payload: current => ({ activeCoalitions: current.activeCoalitions.map(coalition => ({ ...coalition,
      memberContributions: Object.fromEntries(Object.keys(coalition.memberContributions).map(member => [member, 100])),
    })) }),
  });
  assert.equal(recovered.wartimePowerArrangement!.lowCohesionMonths, 0);
  assert.ok(!recovered.pendingEvents.some(event => event.id === wartimeCabinetCoordination.id));
  const bankrupt = { ...second, resources: 0 };
  assert.equal(wartimeCabinetCoordination.options[0].condition!(bankrupt), false);
  const settled = { ...bankrupt, ...wartimeCabinetCoordination.options[1].effect(bankrupt) };
  assert.equal(settled.wartimePowerArrangement!.lowCohesionMonths, 0);
  assert.equal(settled.wartimePowerArrangement!.crisisCooldownUntil, monthIndex(settled) + 3);
  assert.equal(isWartimeCrisisDue(settled), false);
  assert.deepEqual(settled.ministers, state.ministers);
  assert.equal(settled.coalitionHistory.length, state.coalitionHistory.length);
});

test('Save/restore covers waiting event, completed result, army sources and legacy timing', () => {
  const state = due();
  state.currentEvent = wartimePowerArrangement;
  state.phase = 'event';
  const waiting = deserializeGameState(serializeGameState(state), runtime);
  assert.equal(waiting.currentEvent?.id, wartimePowerArrangement.id);
  const result = { ...waiting, ...waiting.currentEvent!.options[0].effect(waiting) };
  result.armies = [...result.armies!, troop('basque', 'regional', 3000, { sourceEntityId: 'euzko_gudarostea' })];
  const restored = deserializeGameState(serializeGameState(result), runtime);
  assert.equal(restored.currentEvent?.id, wartimePowerArrangementResult.id);
  assert.equal(restored.armies!.find(army => army.id === 'basque')!.sourceEntityId, 'euzko_gudarostea');
  const dismissed = { ...restored, ...restored.currentEvent!.options[0].effect(restored) };
  assert.deepEqual(dismissed.stats, restored.stats);
  assert.deepEqual(dismissed.ministers, restored.ministers);
  assert.equal(wartimePowerArrangement.condition!(due(dismissed)), false);
  const legacy = setup();
  delete legacy.civilWarSetupCompletedAt;
  const migrated = deserializeGameState(serializeGameState(legacy), runtime);
  assert.deepEqual(migrated.civilWarSetupCompletedAt, { year: 1936, month: 7, inferred: true });
  assert.equal(wartimePowerArrangement.condition!(migrated), false);
  assert.equal(wartimePowerArrangement.condition!(due(migrated)), true);
  const unfinished = deserializeGameState(serializeGameState({ ...legacy, currentEvent: civilWarStep31 }), runtime);
  assert.equal(unfinished.civilWarSetupCompletedAt, undefined);
});

test('Chinese and English details expose real power, participation and law modifiers', () => {
  const state = arrange('external');
  const coalition = state.activeCoalitions.find(item => item.activeId === 'popular_front_wartime')!;
  for (const isZh of [true, false]) {
    const html = renderToStaticMarkup(<WartimeCoalitionDetails state={state} coalition={coalition} isZh={isZh} />);
    assert.ok(html.includes(isZh ? '阁外支持' : 'External support'));
    assert.ok(html.includes(isZh ? '军事修正' : 'Military'));
    assert.ok(html.includes(isZh ? '法律修正' : 'law modifier'));
  }
  assert.equal(SCHEDULED_EVENT_REGISTRY.filter(event => event.id === wartimePowerArrangement.id).length, 1);
  assert.ok(RESTORABLE_EVENT_REGISTRY.some(event => event.id === wartimePowerArrangementResult.id));
});

console.log(`Wartime politics: ${checks} checks passed (including 30 scenario/mode/setup combinations).`);
