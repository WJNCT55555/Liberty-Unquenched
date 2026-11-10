import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import type { Advisor, GameState } from '../src/game/types';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { MapFaction } from '../src/map/types_map';
import { nationalistSurrender } from '../src/game/events/civil_war/nationalist_surrender';
import {
  POSTWAR_SETTLEMENT_EVENTS, antifascistFrontFate, postwarIndustry, postwarPrologue,
} from '../src/game/events/postwar_settlement';
import { checkEndings, ENDINGS } from '../src/game/endings';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { isRepublicanPartyEligible } from '../src/game/politicalEligibility';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';
import { setOrganizationEstablished } from '../src/game/organizations';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });

const atSurrender = (): GameState => {
  const base = createScenarioState('1936', 'normal', 'zh');
  const provinces = Object.fromEntries(Object.entries(base.provinces).map(([id, province]) => [id,
    province.owner === MapFaction.NATIONALIST || province.owner === MapFaction.CARLIST
      ? { ...province, owner: MapFaction.REPUBLICAN }
      : province]));
  return {
    ...base,
    provinces,
    armies: base.armies.filter(army => army.faction !== MapFaction.NATIONALIST && army.faction !== MapFaction.CARLIST),
    armedForces: {
      ...base.armedForces,
      entityPools: {
        ...base.armedForces.entityPools,
        cnt_defense_committees: { ...base.armedForces.entityPools.cnt_defense_committees, manpower: 1000, status: 'active' },
        ugt_socialist_militias: { ...base.armedForces.entityPools.ugt_socialist_militias, manpower: 0, status: 'active' },
        maoc: { ...base.armedForces.entityPools.maoc, manpower: 0, status: 'active' },
        fifth_regiment: { ...base.armedForces.entityPools.fifth_regiment, manpower: 0, status: 'active' },
        poum_militias: { ...base.armedForces.entityPools.poum_militias, manpower: 500, status: 'active' },
        republican_state: { ...base.armedForces.entityPools.republican_state, manpower: 2000, status: 'active' },
      },
    },
  };
};

const resolve = (state: GameState, optionIndex = 0): GameState => {
  const event = state.currentEvent;
  assert.ok(event, 'expected a current event');
  const option = event.options[optionIndex];
  assert.ok(option, `missing option ${optionIndex} on ${event.id}`);
  return gameReducer(state, { type: 'RESOLVE_EVENT', payload: option.effect });
};

const withPrrevsAndAdvisor = (state: GameState): GameState => {
  let next = { ...state, partyRelations: { ...state.partyRelations, PSOE: 90, ERC: 80 } };
  next = { ...next, ...setOrganizationEstablished(next, 'PRRevS') };
  const advisor: Advisor = { id: 'test_jabali', name: 'Test', faction: 'Jabalistas', description: 'test', actions: [] };
  return { ...next, activeAdvisors: [advisor, null, null] };
};

// Winning without a CNT split starts the settlement instead of ending the game.
const surrenderState = atSurrender();
assert.equal(nationalistSurrender.condition?.(surrenderState), true);
const victory = { ...surrenderState, ...nationalistSurrender.options[0].effect(surrenderState) };
assert.equal(victory.civilWarStatus, 'won');
assert.equal(victory.currentEvent?.id, 'postwar_cabinet_prologue');
assert.equal(victory.currentEvent, postwarPrologue);
assert.deepEqual(victory.postwarSettlement?.startedAt, { year: victory.year, month: victory.month });
assert.equal(victory.superEvent, 'spanish_civil_war_ends');
assert.equal(checkEndings({ ...victory, isGameOver: false, ending: null }).isGameOver, false);

// Prologue → regime → industry → parties → veterans.
const front = resolve(victory);
assert.equal(front.currentEvent?.id, 'postwar_antifascist_front');
assert.equal(antifascistFrontFate.options[0].condition?.(front) ?? true, true);
assert.equal(antifascistFrontFate.options[2].condition?.(front), false);
assert.equal(antifascistFrontFate.options[2].condition?.(withPrrevsAndAdvisor(front)), true);

// Parliamentary route: neither revolutionary industrial option applies, the mixed
// economy fallback keeps the chain playable.
const parliamentary = resolve(front, 0);
assert.equal(parliamentary.postwarSettlement?.regime, 'parliamentary_republic');
assert.equal(parliamentary.currentEvent?.id, 'postwar_industry_settlement');
assert.equal(postwarIndustry.options[0].condition?.(parliamentary), false);
assert.equal(postwarIndustry.options[1].condition?.(parliamentary), false);
assert.equal(postwarIndustry.options[2].condition?.(parliamentary) ?? true, true);

const mixed = resolve(parliamentary, 2);
assert.equal(mixed.postwarSettlement?.economy, 'mixed_economy');
assert.equal(mixed.currentEvent?.id, 'postwar_party_fates');

const broadFront = resolve(mixed, 0);
assert.equal(broadFront.postwarSettlement?.partyPolicy, 'broad_front');
assert.equal(broadFront.currentEvent?.id, 'postwar_veterans_return');
for (const party of ['PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'UR'] as const) {
  assert.equal(isRepublicanPartyEligible(broadFront, party), false, `${party} should be outlawed`);
}
for (const party of ['IR', 'PNV', 'ERC', 'PSOE', 'PCE', 'POUM', 'PS'] as const) {
  assert.equal(isRepublicanPartyEligible(broadFront, party), true, `${party} should remain legal`);
}

const finished = resolve(broadFront, 0);
assert.equal(finished.postwarSettlement?.military, 'reserve_army');
assert.deepEqual(finished.postwarSettlement?.completedAt, { year: finished.year, month: finished.month });
assert.equal(finished.currentEvent, null);
assert.equal(finished.isGameOver, false, 'the political ending waits for May 1940');
assert.equal(finished.ending, null);

// Militia organizations are dissolved and their pools join the state army reserve.
assert.equal(finished.domesticPolicy.militia_legality_law, 0);
assert.equal(finished.domesticPolicy.army_reform_law, 3);
assert.equal(finished.domesticPolicy.security_corps_law, 3);
assert.equal(finished.domesticPolicy.public_order_law, 3);
assert.equal(finished.armedForces.entityPools.republican_state.manpower, 3500);
assert.equal(finished.armedForces.entityPools.cnt_defense_committees.manpower, 0);
assert.equal(finished.armedForces.entityPools.poum_militias.manpower, 0);
assert.equal(finished.armedForces.entityPools.cnt_defense_committees.status, 'integrated');
assert.equal(finished.organizations.DC?.status, 'dissolved');
assert.equal(finished.organizations.POUM_MILITIA?.status, 'dissolved');

// Council and Federal routes gate the industrial options differently.
const council = resolve(front, 1);
assert.equal(council.postwarSettlement?.regime, 'council_republic');
assert.equal(postwarIndustry.options[0].condition?.(council), true);
assert.equal(postwarIndustry.options[1].condition?.(council), false);
const federal = resolve(withPrrevsAndAdvisor(front), 2);
assert.equal(federal.postwarSettlement?.regime, 'federal_republic');
assert.equal(postwarIndustry.options[0].condition?.(federal), true);
assert.equal(postwarIndustry.options[1].condition?.(federal), true);

// The completed settlement re-enters the ordinary ending chain.
const completedBase: GameState = {
  ...finished,
  year: 1940,
  month: 5,
  isGameOver: false,
  ending: null,
  stats: { ...finished.stats, revolutionaryFervor: 90 },
  factions: Object.fromEntries(Object.entries(finished.factions).map(([id, faction]) => [id, { ...faction, dissent: 0 }])) as GameState['factions'],
};
assert.equal(checkEndings(completedBase).ending, 'GENERIC_WIN');
assert.equal(checkEndings({ ...completedBase, stats: { ...completedBase.stats, revolutionaryFervor: 20 }, cntStance: 'govern' }).ending, ENDINGS.POPULAR_FRONT);

// A free-commune settlement without the free-commune journal falls back to Children.
const freeCommuneBase: GameState = {
  ...completedBase,
  postwarSettlement: { ...completedBase.postwarSettlement!, regime: 'free_commune_federation' },
};
assert.equal(checkEndings(freeCommuneBase).ending, ENDINGS.CHILDREN_OF_THE_PEOPLE);

// Every node is restorable, bilingual and survives a mid-chain save.
for (const event of POSTWAR_SETTLEMENT_EVENTS) {
  assert.ok(RESTORABLE_EVENT_REGISTRY.some(candidate => candidate.id === event.id), `${event.id} must be restorable`);
  assert.ok(event.titleZh && event.descriptionZh, `${event.id} needs Chinese text`);
  for (const option of event.options) {
    assert.ok(option.text && option.textZh && option.subtitle && option.subtitleZh, `${event.id} option text`);
  }
}
const restored = deserializeGameState(serializeGameState(parliamentary), {
  cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY,
});
assert.equal(restored.currentEvent?.id, 'postwar_industry_settlement');
assert.deepEqual(restored.postwarSettlement, parliamentary.postwarSettlement);

console.log('Postwar settlement chain: trigger, deferral, regimes, parties, veteran settlement and save restore passed.');
