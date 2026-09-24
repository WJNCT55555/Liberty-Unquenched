import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { gameReducer } from '../src/game/reducers/gameReducer';
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
import { canFormDefenceCouncil, createWartimeCoalition, getArmyEffectiveManpower, getArmyPoliticalMember, getWartimeCabinet, getWartimeCoalitionPower, isMilitarizationCrossroadsDue, isSpanishCivilWarOngoing, isWartimeCrisisDue, monthIndex, updateWartimeCoalition } from '../src/game/rules/wartimeCoalition';
import { militarizationCrossroads } from '../src/game/events/civil_war/militarization_crossroads';
import { militiaLegalityArmedUnions, militiaLegalityRearSecurity, militiaLegalityCommittee } from '../src/game/events/civil_war/militia_legality';
import { countCntMilitiaUnits, mergeMilitiaPoolsIntoStateArmy, SPANISH_MILITIA_POOL_ENTITY_IDS } from '../src/game/rules/armyPools';
import { popularArmyJournal } from '../src/game/journal/popular_army';
import { militiaAutonomyJournal, MILITIA_AUTONOMY_CEILING } from '../src/game/journal/militia_autonomy';
import { getEffectiveCortes, isRepublicanPartyEligible } from '../src/game/politicalEligibility';
import { getLegalActorSeats, getLegalStanceActors } from '../src/game/lawStances';
import { getPartySupport } from '../src/game/parties';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';
import { reduceMapWarAction } from '../src/game/reducers/mapReducer';
import { MapFaction, type Army, type ArmyIdentity, getEffectiveFortressLevel } from '../src/map/types_map';
import { getMilitarization, getUnitMilitarizationMultiplier, applyPceMilitarizationMonthlyDrift, getPceMilitarizationMonthlyDrift, PCE_MILITARIZATION_RELATIONS_FLOOR, MAOC_MILITARIZATION_GAIN, INTERNATIONAL_BRIGADES_MILITARIZATION_GAIN } from '../src/game/rules/militarization';
import { advancePhase } from '../src/game/rules/phaseOrchestrator';
import { getDerivedWorkerControl } from '../src/game/rules/controlShares';
import { maocFormation } from '../src/game/events/maoc_formation';
import { deployToWidth, getCombatPower, getDefenseCoefficient, getDeployedManpower } from '../src/game/rules/combat';
import { getCombatWidth } from '../src/map/map_constants';
import { ArmyPowerBoxes } from '../src/map/ArmyDetail';
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
  movesLeft: 2, morale: 60, ...extras,
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
  // Effective manpower reads the unit's morale and its *force group's* militarization
  // rate. Units carry no rate of their own, so the group is the only quality input.
  const effective = (manpower: number, morale: number, group: ArmyIdentity) =>
    manpower * (0.5 + (morale + getMilitarization(state, group)) / 400);
  close(row('PNV').effectiveManpower, effective(8_000, 60, 'regional'), 'only the explicitly sourced Basque unit counts, at the regional group rate');
  close(row('PCE').effectiveManpower, effective(12_000, 60, 'intl'), 'international organizational ownership, at the intl group rate');
  assert.equal(getArmyPoliticalMember(state.armies[2]), null);
  assert.equal(getArmyPoliticalMember(state.armies[4]), null);
  close(rows.reduce((sum, item) => sum + item.weight, 0), 1, 'normalized weights');
  const hugeReserves = { ...state, armedForces: { ...state.armedForces, entityPools: {
    ...state.armedForces.entityPools,
    cnt_defense_committees: { ...state.armedForces.entityPools.cnt_defense_committees, manpower: 10_000_000 },
  } } };
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
  close(split.armies!.reduce((sum, item) => sum + getArmyEffectiveManpower(state, item), 0), getArmyEffectiveManpower(state, army), 'split strength');
  const merged = reduceMapWarAction({ ...split, mapSelectedArmyIds: split.armies!.map(item => item.id) }, { type: 'MERGE_MAP_ARMIES' }, context)!;
  assert.equal(merged.armies!.length, 1);
  close(getArmyEffectiveManpower(state, merged.armies![0]), getArmyEffectiveManpower(state, army), 'merge strength');
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

test('Save/restore covers waiting event, completed result and army sources', () => {
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

/**
 * The map readout must display the combat formula, never a second copy of it. These
 * expectations are re-derived from the very functions `ArmyPowerBoxes` calls, so the
 * test fails the moment the panel starts computing something of its own.
 */
test('Army power readout mirrors the combat formula instead of reimplementing it', () => {
  const state = arrange('cabinet');
  const army = troop('readout', 'gov', 5_000);
  const province = state.provinces[army.provinceId];
  const terrain = province.terrain!;
  const width = getCombatWidth(terrain);
  const deployment = deployToWidth(army.composition, width);
  const militarizationMultiplier = getUnitMilitarizationMultiplier(state, army);
  const attack = getCombatPower({ deployment, militarizationMultiplier, morale: army.morale });
  const defence = getCombatPower({
    deployment,
    militarizationMultiplier,
    morale: army.morale,
    defenseCoefficient: getDefenseCoefficient(terrain, getEffectiveFortressLevel(province)),
  });

  assert.ok(defence > attack, 'A fortified urban province must defend better than it attacks');

  for (const isZh of [true, false]) {
    const html = renderToStaticMarkup(<ArmyPowerBoxes state={state} army={army} isZh={isZh} />);
    assert.ok(html.includes(isZh ? '进攻战力' : 'Attack power'));
    assert.ok(html.includes(isZh ? '防守战力（本地形）' : 'Defence power (here)'));
    assert.ok(html.includes(attack.toFixed(2)), `attack power readout: ${attack.toFixed(2)}`);
    assert.ok(html.includes(defence.toFixed(2)), `defence power readout: ${defence.toFixed(2)}`);
    assert.ok(
      html.includes(`${getDeployedManpower(deployment).toLocaleString()}/${width.toLocaleString()}`),
      'frontage readout must show committed men against the terrain width',
    );
    const reserve = deployment.reserveInfantry + deployment.reserveTanks;
    assert.ok(html.includes(reserve.toLocaleString()), 'uncommitted reserves must be shown');
  }
});

/**
 * 「人民军还是武装民兵」这条链的完整判定：触发时机、两条日志的开合、
 * 池统一的资产守恒，以及两个失败条件的边界。
 */
test('The militarization crossroads fires the month after the wartime Popular Front forms', () => {
  const state = arrange('cabinet');
  assert.ok(state.wartimePowerArrangement, 'the arrangement fixture must record its formation');
  assert.equal(state.rulingCoalition, 'popular_front_wartime');
  const formed = state.wartimePowerArrangement!.formedAt;
  const nextMonth = formed.month === 12 ? { year: formed.year + 1, month: 1 } : { year: formed.year, month: formed.month + 1 };

  const atFormation = { ...state, year: formed.year, month: formed.month, militarizationPaths: { chosen: 'none' as const } };
  assert.equal(isMilitarizationCrossroadsDue(atFormation), false, 'the same month must not trigger it');
  assert.equal(isMilitarizationCrossroadsDue({ ...atFormation, ...nextMonth }), true, 'the following month must trigger it');
  assert.equal(
    isMilitarizationCrossroadsDue({ ...atFormation, ...nextMonth, militarizationPaths: { chosen: 'popular_army' as const } }),
    false,
    'an answered crossroads must not fire again',
  );
  assert.equal(
    isMilitarizationCrossroadsDue({ ...atFormation, ...nextMonth, iberianDefense: undefined, eventHistory: { triggered: [], resolved: ['militarization_crossroads'] } }),
    false,
    'a resolved crossroads must not fire again',
  );
});

test('Each crossroads option opens exactly one journal and locks the route', () => {
  const state = { ...arrange('cabinet'), militarizationPaths: { chosen: 'none' as const } };
  const [buildArmy, armMilitia] = militarizationCrossroads.options;

  const afterArmy = { ...state, ...buildArmy.effect(state) } as GameState;
  assert.equal(afterArmy.militarizationPaths.chosen, 'popular_army');
  assert.equal(afterArmy.journal['journal_popular_army'].status, 'active');
  assert.equal(afterArmy.journal['journal_militia_autonomy'].status, 'inactive');
  assert.equal(afterArmy.currentEvent?.id, 'popular_army_formed');
  assert.ok(afterArmy.militarizationPaths.chosenAt, 'the 24-month deadline needs an anchor');

  const afterMilitia = { ...state, ...armMilitia.effect(state) } as GameState;
  assert.equal(afterMilitia.militarizationPaths.chosen, 'militia_autonomy');
  assert.equal(afterMilitia.journal['journal_militia_autonomy'].status, 'active');
  assert.equal(afterMilitia.journal['journal_popular_army'].status, 'inactive');
  assert.equal(afterMilitia.currentEvent?.id, 'militia_columns_secured');

  // 民兵已经练过头时选项 B 必须灰掉，否则玩家会走进"下个月立刻失败"的陷阱。
  const overtrained = { ...state, militarization: { ...state.militarization, cnt: MILITIA_AUTONOMY_CEILING + 5 } };
  assert.equal(armMilitia.condition?.(overtrained), false);
  assert.equal(armMilitia.condition?.({ ...state, militarization: { ...state.militarization, cnt: MILITIA_AUTONOMY_CEILING } }), true);
});

test('The People\'s Army conserves every man and gun while emptying the party pools', () => {
  const state = arrange('cabinet');
  const before = state.armedForces.entityPools;
  const after = mergeMilitiaPoolsIntoStateArmy(state).armedForces!.entityPools;

  const total = (pools: typeof before) => SPANISH_MILITIA_POOL_ENTITY_IDS
    .reduce((sum, id) => sum + pools[id].manpower + pools[id].artillery + pools[id].tanks, 0)
    + pools.republican_state.manpower + pools.republican_state.artillery + pools.republican_state.tanks;
  assert.equal(total(after), total(before), 'unification must conserve the transferred assets');

  SPANISH_MILITIA_POOL_ENTITY_IDS.forEach((id) => {
    assert.equal(after[id].manpower, 0, `${id} must be emptied`);
    assert.equal(after[id].status, 'integrated', `${id} must be marked integrated`);
  });
  assert.equal(after.international_brigades.manpower, before.international_brigades.manpower, 'the International Brigades are not merged');
  assert.equal(after.euzko_gudarostea.manpower, before.euzko_gudarostea.manpower, 'the Basque Army is not merged');
});

test('Both journals complete on their state conditions and fail on their own thresholds', () => {
  const law = (state: GameState, level: number) => ({ ...state, domesticPolicy: { ...state.domesticPolicy, militia_legality_law: level } });
  const rate = (state: GameState, cnt: number) => ({ ...state, militarization: { ...state.militarization, cnt } });
  const base = arrange('cabinet');
  const chosenAt = { year: base.year, month: base.month };
  const activePopular = { id: 'journal_popular_army', status: 'active' as const, progress: 0 };
  const activeMilitia = { id: 'journal_militia_autonomy', status: 'active' as const, progress: 0 };

  const popularBase = { ...base, militarizationPaths: { chosen: 'popular_army' as const, chosenAt } };
  assert.equal(popularArmyJournal.checkStatus?.(law(popularBase, 4), activePopular), null, 'rate alone is not enough');
  assert.equal(popularArmyJournal.checkStatus?.(rate(popularBase, 86), activePopular), null, 'the law alone is not enough');
  assert.equal(popularArmyJournal.checkStatus?.(law(rate(popularBase, 86), 4), activePopular), 'completed');
  assert.equal(popularArmyJournal.checkStatus?.(law(rate(popularBase, 85), 4), activePopular), null, 'the threshold is strictly greater than 85');

  // 24 个月期限，以及"完成优先于失败"。
  const expired = law(rate({ ...popularBase, year: chosenAt.year + 2, month: chosenAt.month }, 50), 1);
  assert.equal(popularArmyJournal.checkStatus?.(expired, activePopular), 'failed');
  assert.equal(popularArmyJournal.checkStatus?.(law(rate({ ...popularBase, year: chosenAt.year + 2, month: chosenAt.month }, 86), 4), activePopular), 'completed');
  assert.equal(popularArmyJournal.checkStatus?.(expired, { ...activePopular, status: 'inactive' }), null, 'an inactive journal is never judged');

  const militiaBase = { ...base, militarizationPaths: { chosen: 'militia_autonomy' as const, chosenAt } };
  const eightColumns = Array.from({ length: 8 }, (_, index) => troop(`col-${index}`, 'cnt', 1_000));
  assert.equal(countCntMilitiaUnits({ ...militiaBase, armies: eightColumns }), 8);
  assert.equal(countCntMilitiaUnits({ ...militiaBase, armies: eightColumns.slice(0, 7) }), 7);
  assert.equal(militiaAutonomyJournal.checkStatus?.({ ...militiaBase, armies: eightColumns }, activeMilitia), null, 'the law is still missing');
  assert.equal(militiaAutonomyJournal.checkStatus?.(law({ ...militiaBase, armies: eightColumns }, 4), activeMilitia), 'completed');
  assert.equal(militiaAutonomyJournal.checkStatus?.(law(rate(militiaBase, MILITIA_AUTONOMY_CEILING + 1), 4), activeMilitia), 'failed');
  // 恰好等于上限不算越线（判定是严格大于），所以这张表只是"没完成"，不是"失败"。
  assert.equal(militiaAutonomyJournal.checkStatus?.(law(rate(militiaBase, MILITIA_AUTONOMY_CEILING), 4), activeMilitia), null);
});

/**
 * 民兵合法性法的三级阶梯（`docs/militarization-system-design.md` §6.5 问题 1）。
 *
 * 这条链是上面那条测试的**前置**：那三个 `law(..., 4)` 状态在真实游戏里必须能被达到，
 * 否则两条日志永远停在"不可完成"。所以这里既验证时机与一次性，也做一次端到端走通。
 */
const atMonth = (state: GameState, year: number, month: number): GameState => ({ ...state, year, month });
/** 走过第 N 级阶梯后的状态：应用"接受"选项。 */
const climb = (state: GameState, event: typeof militiaLegalityArmedUnions): GameState => ({
  ...state,
  ...event.options[0].effect(state),
});

test('The militia legality ladder opens one rung at a time, anchored on the civil war setup', () => {
  const start = setup();
  assert.equal(start.civilWarSetupCompletedAt?.month, 7, 'the fixture must record the setup month');
  assert.equal(start.domesticPolicy.militia_legality_law, 1, 'all three scenarios leave the law at licence-only');

  // 第 1 级 → 2 级：内战开局后的下一个月。
  assert.equal(militiaLegalityArmedUnions.condition?.(start), false, 'the setup month itself must not fire it');
  assert.equal(militiaLegalityArmedUnions.condition?.(atMonth(start, 1936, 8)), true);
  assert.equal(militiaLegalityRearSecurity.condition?.(atMonth(start, 1936, 8)), false, 'rung 2 needs level 2 first');
  assert.equal(militiaLegalityCommittee.condition?.(atMonth(start, 1936, 8)), false);

  // 跳过一级是走不通的：法律停在哪一级，哪一级的下一级才开。
  const rungTwo = climb(atMonth(start, 1936, 8), militiaLegalityArmedUnions);
  assert.equal(rungTwo.domesticPolicy.militia_legality_law, 2);
  assert.equal(militiaLegalityArmedUnions.condition?.(rungTwo), false, 'the law has moved past this rung');
  assert.equal(militiaLegalityRearSecurity.condition?.(atMonth(rungTwo, 1936, 10)), false, 'too early');
  assert.equal(militiaLegalityRearSecurity.condition?.(atMonth(rungTwo, 1936, 11)), true);

  const rungThree = climb(atMonth(rungTwo, 1936, 11), militiaLegalityRearSecurity);
  assert.equal(rungThree.domesticPolicy.militia_legality_law, 3);
  assert.equal(militiaLegalityCommittee.condition?.(atMonth(rungThree, 1937, 2)), false, 'too early');
  assert.equal(militiaLegalityCommittee.condition?.(atMonth(rungThree, 1937, 3)), true);
  assert.equal(militiaLegalityCommittee.condition?.(climb(atMonth(rungThree, 1937, 3), militiaLegalityCommittee)), false, 'the ladder ends at 4');

  // 一次性：已解决的事件不会再被评估为到期，即使条件仍然成立。
  assert.equal(militiaLegalityArmedUnions.condition?.({
    ...atMonth(start, 1936, 8),
    eventHistory: { triggered: [], resolved: ['militarization_crossroads', 'militia_legality_armed_unions'] },
  }), false);

  // 战争结束/未开始时不评估任何一级。
  assert.equal(militiaLegalityArmedUnions.condition?.({ ...atMonth(start, 1936, 8), civilWarStatus: 'won' }), false);
  assert.equal(militiaLegalityArmedUnions.condition?.({ ...atMonth(start, 1936, 8), activeWar: null }), false);
  assert.equal(militiaLegalityRearSecurity.condition?.({ ...atMonth(rungTwo, 1936, 11), civilWarStatus: 'lost' }), false);
});

test('Every rung is a scheduled event the monthly pipeline can actually queue', () => {
  const start = setup();
  const next = atMonth(start, 1936, 8);
  const queue = calculateMonthlyEventQueue(start, next, 1936, 8);
  assert.ok(queue.some(event => event.id === 'militia_legality_armed_unions'), 'rung 1 must be discoverable by the scheduler');
  assert.ok(SCHEDULED_EVENT_REGISTRY.some(event => event.id === 'militia_legality_armed_unions'));
  assert.ok(RESTORABLE_EVENT_REGISTRY.some(event => event.id === 'militia_legality_committee'), 'leaves must survive save hydration');
  assert.equal(militiaLegalityArmedUnions.meta?.flow, 'solo', 'a scheduled root cannot be chain-only');
});

test('Accepting all three rungs actually reaches level 4 and unblocks both journals', () => {
  const start = due();
  const afterFirst = climb(start, militiaLegalityArmedUnions);
  const afterSecond = climb(atMonth(afterFirst, 1936, 11), militiaLegalityRearSecurity);
  const afterThird = climb(atMonth(afterSecond, 1937, 3), militiaLegalityCommittee);

  assert.equal(afterThird.domesticPolicy.militia_legality_law, 4, 'the ladder must reach the level both journals require');

  // 每一步都要动所有权系统——这是「工人控制度改造」§4.5 表 10a/10b 行挂回来的地方，
  // 曾经随被删除的那张卡一起失去实现。
  assert.notDeepEqual(afterFirst.controlShares, start.controlShares, 'rung 1 must move worker ownership');
  assert.notDeepEqual(afterSecond.controlShares, afterFirst.controlShares, 'rung 2 must move worker ownership');
  assert.notDeepEqual(afterThird.controlShares, afterSecond.controlShares, 'rung 3 must move worker ownership');
  // 预览用的是补丁里的 `stats.workerControl`（`applyControlInfluence` 只返回这一项派生值），
  // 所以事件必须把它合并进最终 stats，而不是用旧值覆盖掉。
  assert.equal(afterThird.stats.workerControl, getDerivedWorkerControl(afterThird.controlShares!), 'the derived worker-control readout must survive the stats merge');
  assert.notEqual(afterThird.stats.workerControl, start.stats.workerControl, 'and it must actually differ from where we started');

  // 端到端：法律到位后，两条日志的完成条件第一次真正可达。
  const activePopular = { id: 'journal_popular_army', status: 'active' as const, progress: 0 };
  const activeMilitia = { id: 'journal_militia_autonomy', status: 'active' as const, progress: 0 };
  const chosenAt = { year: 1936, month: 9 };
  const popular = {
    ...afterThird,
    militarizationPaths: { chosen: 'popular_army' as const, chosenAt },
    militarization: { ...afterThird.militarization, cnt: 86 },
  };
  assert.equal(popularArmyJournal.checkStatus?.(popular, activePopular), 'completed');

  const columns = Array.from({ length: 8 }, (_, index) => troop(`legality-${index}`, 'cnt', 1_000));
  const militia = {
    ...afterThird,
    militarizationPaths: { chosen: 'militia_autonomy' as const, chosenAt },
    armies: columns,
    militarization: { ...afterThird.militarization, cnt: MILITIA_AUTONOMY_CEILING },
  };
  assert.equal(militiaAutonomyJournal.checkStatus?.(militia, activeMilitia), 'completed');
});

test('Refusing a rung closes the ladder for good', () => {
  const start = atMonth(setup(), 1936, 8);
  const refused = { ...start, ...militiaLegalityArmedUnions.options[1].effect(start) };
  assert.equal(refused.domesticPolicy.militia_legality_law, 1, 'refusal must leave the law where it was');
  // 之后每一年都不该再有下半段：第 2 级要求法律已经是 2。
  for (const month of [9, 11, 12]) {
    assert.equal(militiaLegalityRearSecurity.condition?.(atMonth(refused, 1936, month)), false);
    assert.equal(militiaLegalityCommittee.condition?.(atMonth(refused, 1936, month)), false);
  }
  assert.equal(militiaLegalityRearSecurity.condition?.(atMonth(refused, 1937, 6)), false);
  // 右侧选项同样是一次性的：拒绝后该事件已进 resolved，不会再来问第二次。
  const askedAgain = { ...refused, eventHistory: { triggered: [], resolved: ['militia_legality_armed_unions'] } };
  assert.equal(militiaLegalityArmedUnions.condition?.(askedAgain), false);
});

/**
 * PCE 的独立军事化路线（`docs/militarization-system-design.md` §7）。
 *
 * 这是整套机制里唯一一条不经过法律的月度变化：它不由共和国的政策承载，
 * 而是共产党自己的行为，所以既不受 CNT 路线选择影响，也不该在和平期发生。
 */
test('The PCE grows its own army every month the war lasts and relations hold', () => {
  const war = arrange('cabinet');
  assert.ok(isSpanishCivilWarOngoing(war), 'the fixture must be at war');
  const allied = { ...war, partyRelations: { ...war.partyRelations, PCE: PCE_MILITARIZATION_RELATIONS_FLOOR } };
  const cold = { ...war, partyRelations: { ...war.partyRelations, PCE: PCE_MILITARIZATION_RELATIONS_FLOOR - 1 } };
  const peace = { ...allied, activeWar: null };

  assert.deepEqual(getPceMilitarizationMonthlyDrift(allied), { pce: 0.4, intl: 0.3 });
  assert.deepEqual(getPceMilitarizationMonthlyDrift(cold), {}, 'below the relations floor the Party stops growing');
  assert.deepEqual(getPceMilitarizationMonthlyDrift(peace), {}, 'peacetime MAOC is only a street picket');
  assert.deepEqual(getPceMilitarizationMonthlyDrift({ ...allied, civilWarStatus: 'won' }), {});

  // 走的是同一个唯一写入口，所以 0.4 这类小数也照常累积。
  const before = getMilitarization(allied, 'pce');
  const after = { ...allied, ...applyPceMilitarizationMonthlyDrift(allied) };
  close(getMilitarization(after, 'pce'), before + 0.4, 'one month of PCE drift');
  close(getMilitarization(after, 'intl'), getMilitarization(allied, 'intl') + 0.3, 'one month of International Brigade drift');
  assert.deepEqual(applyPceMilitarizationMonthlyDrift(cold), {}, 'no drift means no patch');

  // 月度维护阶段真的会调用它——不是只有纯函数能跑。
  const maintained = applyMonthlyPoliticalMaintenance(allied);
  close(getMilitarization(maintained, 'pce'), before + 0.4, 'the monthly maintenance stage must apply the drift');
  close(getMilitarization(applyMonthlyPoliticalMaintenance(peace), 'pce'), getMilitarization(peace, 'pce'), 'peacetime maintenance must not');

  // CNT 的路线选择完全不影响它：两条路线、以及还没选，都应该拿到同一个增量。
  for (const chosen of ['none', 'popular_army', 'militia_autonomy'] as const) {
    const locked = { ...allied, militarizationPaths: { chosen } };
    assert.deepEqual(getPceMilitarizationMonthlyDrift(locked), { pce: 0.4, intl: 0.3 }, `route ${chosen} must not gate the PCE`);
  }
});

test('The MAOC founding and the International Brigades each lift PCE militarization once', () => {
  const peacetime = { ...seed('1931'), year: 1933, month: 1 };
  const beforeMaoc = getMilitarization(peacetime, 'pce');
  const afterMaoc = { ...peacetime, ...maocFormation.options[0].effect(peacetime) };
  close(getMilitarization(afterMaoc, 'pce'), beforeMaoc + MAOC_MILITARIZATION_GAIN, 'the MAOC is the first organised party militia');
  assert.equal(afterMaoc.organizations?.MAOC?.established, true, 'the organization must still be registered');

  // 一次性的那一跃在编排层：只有布尔值从 false 变 true 的那个月才加。
  // 注意同一个月还会有 +0.3 的 PCE 常月增长（内战 + 关系达标），所以两边都要算上。
  const war = arrange('cabinet');
  assert.equal(war.internationalBrigadesFormed, false, 'the fixture must start before the Brigades exist');
  const deps = { finishPlayerMapTurn: (s: GameState) => s, checkWarStatus: (s: GameState) => s };
  const ready = {
    ...war, year: 1936, month: 8, phase: 'war' as const, currentEvent: null, pendingEvents: [], superEvent: null,
    relations: { ...war.relations, internationalSocialists: 90 },
  };
  const driftIntl = getPceMilitarizationMonthlyDrift(ready).intl ?? 0;
  const formed = advancePhase(ready, deps);
  assert.equal(formed.internationalBrigadesFormed, true, 'September 1936 with warm internationalists must form the Brigades');
  close(
    getMilitarization(formed, 'intl'),
    getMilitarization(ready, 'intl') + INTERNATIONAL_BRIGADES_MILITARIZATION_GAIN + driftIntl,
    'the Brigade jump plus the same month\'s PCE drift',
  );

  // 第二个月只有常月增长，没有第二次跃升。
  const settled = { ...formed, phase: 'war' as const, currentEvent: null, pendingEvents: [], superEvent: null };
  const second = advancePhase(settled, deps);
  close(
    getMilitarization(second, 'intl'),
    getMilitarization(settled, 'intl') + driftIntl,
    'the Brigade jump must not repeat',
  );
});

test('The CNT can endorse or denounce the Communists\' army, but only at war', () => {
  const war = arrange('cabinet');
  const peace = { ...war, activeWar: null };

  const build = (state: GameState) => cntInterPartyRelationships.effect(state).currentEvent!;
  assert.equal(build(peace).options.some(option => String(option.textZh ?? '').includes('共产党人正在建一支真正的军队')), false,
    'the stance question must not be asked in peacetime');
  const wartime = build(war).options;
  const endorse = wartime.filter(option => String(option.textZh ?? '').includes('当成称赞'))[0];
  const denounce = wartime.filter(option => String(option.textZh ?? '').includes('当成警告'))[0];
  assert.ok(endorse && denounce, 'both stances must be offered once the war is on');
  assert.equal(endorse.condition?.(peace), false);
  assert.equal(endorse.condition?.(war), true);

  const afterEndorse = { ...war, ...endorse.effect(war) };
  close(getMilitarization(afterEndorse, 'pce'), getMilitarization(war, 'pce') + 5, 'endorsement lifts the PCE');
  close(getMilitarization(afterEndorse, 'intl'), getMilitarization(war, 'intl') + 3, 'and the Brigades with it');
  assert.equal(afterEndorse.partyRelations.PCE, Math.min(100, (war.partyRelations.PCE || 0) + 5));

  const afterDenounce = { ...war, ...denounce.effect(war) };
  close(getMilitarization(afterDenounce, 'pce'), getMilitarization(war, 'pce') - 5, 'denunciation holds the PCE back');
  assert.equal(afterDenounce.partyRelations.PCE, (war.partyRelations.PCE || 0) - 10);
  assert.equal(afterDenounce.stats.revolutionaryFervor, Math.min(100, war.stats.revolutionaryFervor + 3));
});

console.log(`Wartime politics: ${checks} checks passed (including 30 scenario/mode/setup combinations).`);
