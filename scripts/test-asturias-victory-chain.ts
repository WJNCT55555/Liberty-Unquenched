import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import type { Advisor, GameState } from '../src/game/types';
import { checkWarStatus } from '../src/game/rules/warStatus';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { MapFaction } from '../src/map/types_map';
import {
  ASTURIAS_VICTORY_EVENTS, armyOrMilitia, asturiasVictoryPrologue, industryTakeover,
  legacyAsturiasWarVictory, workersAllianceVictory,
} from '../src/game/events/asturias_victory_chain';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { isRepublicanPartyEligible } from '../src/game/politicalEligibility';
import { getPartySupport } from '../src/game/parties';
import { getPartyName } from '../src/game/partyNames';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';
import { setOrganizationEstablished } from '../src/game/organizations';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });

const VICTORY_PROVINCES = ['asturias', 'oviedo', 'madrid', 'malaga', 'zaragoza', 'valencia'];

const atVictory = (): GameState => {
  const base = createScenarioState('1933', 'normal', 'zh');
  const provinces = Object.fromEntries(Object.entries(base.provinces).map(([id, province]) => [id,
    VICTORY_PROVINCES.includes(id) ? { ...province, owner: MapFaction.WORKERS_ALLIANCE } : province]));
  return { ...base, year: 1934, month: 10, phase: 'war', currentView: 'map',
    activeWar: 'asturias_war', wars: { ...base.wars, asturias_war: 'ongoing' }, provinces };
};

const resolve = (state: GameState, optionIndex = 0): GameState => {
  const event = state.currentEvent;
  assert.ok(event, 'expected a current event');
  const option = event.options[optionIndex];
  assert.ok(option, `missing option ${optionIndex} on ${event.id}`);
  return gameReducer(state, { type: 'RESOLVE_EVENT', payload: option.effect });
};

const withCnlSupport = (state: GameState, support = 80): GameState => ({
  ...state,
  classes: Object.fromEntries(Object.entries(state.classes).map(([id, entry]) => [id, {
    ...entry,
    support: Object.fromEntries(Object.keys(entry.support).map(party => [party,
      party === 'CNT_FAI' ? support : party === 'PSOE' ? 100 - support : 0])),
  }])) as GameState['classes'],
});

const withPrrevsAndAdvisor = (state: GameState): GameState => {
  let next = { ...state, partyRelations: { ...state.partyRelations, PSOE: 90, ERC: 80 } };
  next = { ...next, ...setOrganizationEstablished(next, 'PRRevS') };
  const advisor: Advisor = { id: 'test_jabali', name: 'Test', faction: 'Jabalistas', description: 'test', actions: [] };
  return { ...next, activeAdvisors: [advisor, null, null] };
};

// The old one-click victory reward is gone; victory now opens the settlement chain.
const victory = checkWarStatus(atVictory(), true);
assert.equal(victory.wars?.asturias_war, 'won');
assert.equal(victory.activeWar, null);
assert.equal(victory.currentEvent?.id, 'asturias_victory_prologue');
assert.equal(victory.currentEvent, asturiasVictoryPrologue);
assert.equal(victory.stats.revolutionaryFervor, atVictory().stats.revolutionaryFervor);
assert.equal(victory.armaments, atVictory().armaments);
assert.equal(victory.resources, atVictory().resources);

// Prologue → regime decision.
const regimeStep = resolve(victory);
assert.equal(regimeStep.currentEvent?.id, 'workers_alliance_victory');
assert.equal(workersAllianceVictory.options[0].condition?.(regimeStep) ?? true, true);
assert.equal(workersAllianceVictory.options[1].condition?.(regimeStep), false);
assert.equal(workersAllianceVictory.options[2].condition?.(regimeStep), false);
assert.equal(workersAllianceVictory.options[1].condition?.(withCnlSupport(regimeStep)), true);
assert.equal(workersAllianceVictory.options[2].condition?.(withPrrevsAndAdvisor(regimeStep)), true);

// Council Republic: state planning only, then parties, then the army.
const council = resolve(regimeStep, 0);
assert.equal(council.asturiasVictory?.regime, 'council_republic');
assert.equal(council.currentEvent?.id, 'asturias_industry_takeover');
assert.equal(industryTakeover.options[0].condition?.(council), true);
assert.equal(industryTakeover.options[1].condition?.(council), false);

const planned = resolve(council, 0);
assert.equal(planned.asturiasVictory?.economy, 'state_plan');
assert.equal(planned.currentEvent?.id, 'asturias_party_fates');
assert.equal(planned.asturiasVictory?.partyPolicy, undefined);

const broadFront = resolve(planned, 0);
assert.equal(broadFront.asturiasVictory?.partyPolicy, 'broad_front');
assert.equal(broadFront.currentEvent?.id, 'asturias_army_or_militia');
for (const party of ['PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'UR'] as const) {
  assert.equal(isRepublicanPartyEligible(broadFront, party), false, `${party} should be outlawed`);
}
for (const party of ['IR', 'PNV', 'ERC', 'PSOE', 'PCE', 'POUM', 'PS'] as const) {
  assert.equal(isRepublicanPartyEligible(broadFront, party), true, `${party} should remain legal`);
}
assert.equal(broadFront.classes.Labradores.support.UR, 0);
assert.ok(broadFront.classes.Labradores.support.IR > planned.classes.Labradores.support.IR);

const peopleArmy = resolve(broadFront, 0);
assert.equal(peopleArmy.asturiasVictory?.military, 'people_army');
assert.deepEqual(peopleArmy.asturiasVictory?.completedAt, { year: peopleArmy.year, month: peopleArmy.month });
assert.equal(peopleArmy.currentEvent, null);
assert.equal(peopleArmy.domesticPolicy.militia_legality_law, 4);
assert.equal(peopleArmy.domesticPolicy.army_reform_law, 3);
assert.equal(peopleArmy.domesticPolicy.security_corps_law, 3);
assert.equal(peopleArmy.domesticPolicy.public_order_law, 3);

// Free Commune Federation: union self-management only, no People's Army.
const commune = resolve(withCnlSupport(regimeStep), 1);
assert.equal(commune.asturiasVictory?.regime, 'free_commune_federation');
assert.equal(industryTakeover.options[0].condition?.(commune), false);
assert.equal(industryTakeover.options[1].condition?.(commune), true);
const selfManaged = resolve(commune, 1);
assert.equal(selfManaged.asturiasVictory?.economy, 'union_self_management');

const allPartiesGone = resolve(selfManaged, 4); // option E: abolish every party
assert.equal(allPartiesGone.asturiasVictory?.partyPolicy, 'no_parties');
for (const party of ['PSOE', 'PNV', 'POUM', 'ERC', 'IR', 'PRR', 'PCE'] as const) {
  assert.equal(isRepublicanPartyEligible(allPartiesGone, party), false, `${party} should be abolished`);
}
assert.equal(getPartyName(allPartiesGone, 'PSOE', true, true), 'UGT');
assert.equal(getPartyName(allPartiesGone, 'PNV', true, true), 'STV');
assert.equal(getPartyName(allPartiesGone, 'POUM', true, true), 'FOUS');
assert.equal(getPartyName(allPartiesGone, 'ERC', true, true), 'ERC-LU');
assert.equal(armyOrMilitia.options[0].condition?.(allPartiesGone), false);

// Option C keeps only the proletarian parties.
const workersOnly = resolve(planned, 2);
assert.equal(workersOnly.asturiasVictory?.partyPolicy, 'workers_only');
assert.equal(isRepublicanPartyEligible(workersOnly, 'PNV'), false);
assert.equal(isRepublicanPartyEligible(workersOnly, 'ERC'), false);
assert.equal(isRepublicanPartyEligible(workersOnly, 'PSOE'), true);

// Federal Republic: both industrial routes are open.
const federal = resolve(withPrrevsAndAdvisor(regimeStep), 2);
assert.equal(federal.asturiasVictory?.regime, 'federal_republic');
assert.equal(industryTakeover.options[0].condition?.(federal), true);
assert.equal(industryTakeover.options[1].condition?.(federal), true);

// Alliance dictatorship only tolerates its own members.
const alliance = {
  ...planned,
  activeCoalitions: [{
    activeId: 'workers_alliance' as const,
    memberContributions: { PSOE: 80, PCE: 80, CNT_FAI: 80 },
    formedAt: { year: 1934, month: 9 },
    cohesion: 80,
    cntAttitude: 0,
  }],
};
const dictatorship = resolve(alliance, 3);
assert.equal(dictatorship.asturiasVictory?.partyPolicy, 'alliance_dictatorship');
assert.equal(isRepublicanPartyEligible(dictatorship, 'PSOE'), true);
assert.equal(isRepublicanPartyEligible(dictatorship, 'PCE'), true);
assert.equal(isRepublicanPartyEligible(dictatorship, 'PRR'), false);
assert.equal(isRepublicanPartyEligible(dictatorship, 'ERC'), false);

// Militia route sets all four laws to L4.
const militia = resolve(broadFront, 1);
assert.equal(militia.asturiasVictory?.military, 'militia');
assert.equal(militia.domesticPolicy.militia_legality_law, 4);
assert.equal(militia.domesticPolicy.army_reform_law, 4);
assert.equal(militia.domesticPolicy.security_corps_law, 4);
assert.equal(militia.domesticPolicy.public_order_law, 4);

// Every node is restorable, bilingual and persisted.
for (const event of ASTURIAS_VICTORY_EVENTS) {
  assert.ok(RESTORABLE_EVENT_REGISTRY.some(candidate => candidate.id === event.id), `${event.id} must be restorable`);
  assert.ok(event.titleZh && event.descriptionZh, `${event.id} needs Chinese text`);
  for (const option of event.options) {
    assert.ok(option.text && option.textZh && option.subtitle && option.subtitleZh, `${event.id} option text`);
  }
}
assert.ok(serializeGameState(planned).state.asturiasVictory);
assert.equal(getPartySupport(planned, 'CNT_FAI') > 0, true);

// A mid-chain save restores the current event and the regime record.
const restored = deserializeGameState(serializeGameState(planned), {
  cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY,
});
assert.equal(restored.currentEvent?.id, 'asturias_party_fates');
assert.deepEqual(restored.asturiasVictory, planned.asturiasVictory);

// Retired one-click event survives only as a restorable bridge for old saves.
assert.ok(RESTORABLE_EVENT_REGISTRY.some(event => event.id === 'asturias_war_victory'));
const legacy = { ...planned, currentEvent: legacyAsturiasWarVictory };
assert.equal(legacy.currentEvent.options[0].effect(legacy).currentEvent, asturiasVictoryPrologue);

console.log('Asturias victory settlement chain: regime, industry, party and army checks passed.');
