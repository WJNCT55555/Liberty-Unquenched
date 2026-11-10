import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import type { GameState, PartyAlias } from '../src/game/types';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { MapFaction } from '../src/map/types_map';
import { checkEndings, ENDINGS } from '../src/game/endings';
import {
  IBERIAN_SETTLEMENT_EVENTS, iberianArmyQuestion, iberianBirthOfFreedom,
  iberianFuneralOfMoney, iberianVictoryPrologue,
} from '../src/game/events/iberian_victory_chain';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { isRepublicanPartyEligible } from '../src/game/politicalEligibility';
import { getPartyName } from '../src/game/partyNames';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });

const atCommitteeVictory = (): GameState => {
  const base = createScenarioState('1936', 'normal', 'zh');
  return {
    ...base,
    phase: 'war',
    civilWarStatus: 'won',
    activeWar: null,
    wars: { ...base.wars, spanish_civil_war: 'won' },
    iberianDefense: {
      formedAt: { year: 1937, month: 5 },
      allies: { poum: true, psoeLeft: true },
      leftSocialistReserve: 0,
      eliminated: [MapFaction.NATIONALIST, MapFaction.REPUBLICAN, MapFaction.CARLIST],
      eliminations: [
        { faction: MapFaction.NATIONALIST, recipient: MapFaction.IBERIAN_DEFENSE, year: 1938, month: 3 },
        { faction: MapFaction.CARLIST, recipient: MapFaction.IBERIAN_DEFENSE, year: 1938, month: 5 },
        { faction: MapFaction.REPUBLICAN, recipient: MapFaction.IBERIAN_DEFENSE, year: 1938, month: 8 },
      ],
      surrenderThresholds: {},
      initialProvinces: ['barcelona'],
      contributions: { cnt: 40000, poum: 6000, psoeLeft: 0 },
      carlistEntered: true,
      winner: MapFaction.IBERIAN_DEFENSE,
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

// Victory opens the settlement instead of the ending screen.
const victory = atCommitteeVictory();
const started = checkEndings(victory);
assert.equal(started.isGameOver, false);
assert.equal(started.currentEvent?.id, 'iberian_victory_prologue');
assert.equal(started.currentEvent, iberianVictoryPrologue);
assert.ok(started.iberianSettlement);
assert.equal(checkEndings(started).isGameOver, false, 'the chain must keep deferring the ending');

// Free-commune route: municipal federation, total socialization, party shells, black army.
const birth = resolve(started);
assert.equal(birth.currentEvent?.id, 'iberian_birth_of_freedom');
assert.equal(iberianBirthOfFreedom.options.length, 3);

const commune = resolve(birth, 0);
assert.equal(commune.iberianSettlement?.regime, 'free_commune_federation');
assert.equal(commune.iberianSettlement?.variant, 'municipal_federation');
assert.equal(commune.currentEvent?.id, 'iberian_funeral_of_money');
assert.equal(iberianFuneralOfMoney.options[1].condition?.(commune), true);
assert.equal(iberianFuneralOfMoney.options[2].condition?.(commune), false);

const socialized = resolve(commune, 1);
assert.equal(socialized.iberianSettlement?.economy, 'total_socialization');
assert.equal(socialized.currentEvent?.id, 'iberian_final_reckoning');

const partyShells = resolve(socialized, 1);
assert.equal(partyShells.iberianSettlement?.partyPolicy, 'party_shells');
assert.equal(partyShells.currentEvent?.id, 'iberian_army_question');
for (const party of ['PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'IR', 'UR'] as const) {
  assert.equal(isRepublicanPartyEligible(partyShells, party), false, `${party} should be outlawed`);
}
for (const party of ['PCE', 'PSOE', 'PNV', 'ERC', 'PS'] as const) {
  assert.equal(isRepublicanPartyEligible(partyShells, party), true, `${party} should remain legal`);
}
// POUM is an allied camp inside the Committee, so it is never "Republican-eligible";
// the settlement simply does not outlaw it.
assert.equal(partyShells.republicanPartyStatus?.POUM, undefined);
assert.equal(getPartyName(partyShells, 'PSOE', true, true), 'UGT');
assert.equal(getPartyName(partyShells, 'PNV', true, true), 'STV');
assert.equal(getPartyName(partyShells, 'POUM', true, true), 'FOUS');
assert.equal(getPartyName(partyShells, 'ERC', true, true), 'ERC-LU');

const blackArmy = resolve(partyShells, 2);
assert.equal(blackArmy.iberianSettlement?.military, 'black_army');
assert.deepEqual(blackArmy.iberianSettlement?.completedAt, { year: blackArmy.year, month: blackArmy.month });
assert.equal(blackArmy.currentEvent, null);
assert.equal(blackArmy.domesticPolicy.militia_legality_law, 4);
assert.equal(blackArmy.domesticPolicy.army_reform_law, 4);
assert.equal(blackArmy.domesticPolicy.public_order_law, 4);
assert.equal(blackArmy.isGameOver, false, 'the ending waits for May 1940');
assert.equal(checkEndings({ ...blackArmy, year: 1940, month: 5 }).ending, ENDINGS.CHILDREN_OF_THE_PEOPLE);

// Revolutionary Committee route: directive economy, CNT-only, committee command.
const committee = resolve(birth, 2);
assert.equal(committee.iberianSettlement?.regime, 'revolutionary_committee');
assert.equal(iberianFuneralOfMoney.options[1].condition?.(committee), false);
assert.equal(iberianFuneralOfMoney.options[2].condition?.(committee), true);
const directed = resolve(committee, 2);
assert.equal(directed.iberianSettlement?.economy, 'committee_directive');

const cntOnly = resolve(directed, 2);
assert.equal(cntOnly.iberianSettlement?.partyPolicy, 'cnt_only');
for (const party of ['PRR', 'DLR', 'AP', 'CT', 'FE', 'IR', 'PNV', 'ERC', 'PCE', 'PSOE', 'POUM', 'PS'] as const) {
  assert.equal(isRepublicanPartyEligible(cntOnly, party), false, `${party} should be outlawed`);
}
const beforeUnion = directed.unionShare?.CNT ?? 0;
assert.ok((cntOnly.unionShare?.CNT ?? 0) > beforeUnion, 'UGT share should merge into CNT');

const committeeArmy = resolve(cntOnly, 0);
assert.equal(committeeArmy.iberianSettlement?.military, 'committee_command');
assert.equal(committeeArmy.domesticPolicy.militia_legality_law, 4);
assert.equal(committeeArmy.domesticPolicy.army_reform_law, 4);
assert.equal(committeeArmy.domesticPolicy.security_corps_law, 4);
assert.equal(committeeArmy.domesticPolicy.public_order_law, 4);
assert.equal(committeeArmy.isGameOver, false, 'the ending waits for May 1940');
assert.equal(
  checkEndings({ ...committeeArmy, year: 1940, month: 5 }).ending,
  ENDINGS.REVOLUTION_WITHOUT_END,
);

// "Free principles" leaves only POUM and PS legal.
const freePrinciples = resolve(directed, 0);
assert.equal(freePrinciples.iberianSettlement?.partyPolicy, 'free_principles');
assert.equal(isRepublicanPartyEligible(freePrinciples, 'PS'), true);
assert.equal(freePrinciples.republicanPartyStatus?.POUM, undefined);
assert.equal(isRepublicanPartyEligible(freePrinciples, 'PCE'), false);
assert.equal(isRepublicanPartyEligible(freePrinciples, 'PSOE'), false);

// Every node is restorable, bilingual and survives a mid-chain save.
for (const event of IBERIAN_SETTLEMENT_EVENTS) {
  assert.ok(RESTORABLE_EVENT_REGISTRY.some(candidate => candidate.id === event.id), `${event.id} must be restorable`);
  assert.ok(event.titleZh && event.descriptionZh, `${event.id} needs Chinese text`);
  for (const option of event.options) {
    assert.ok(option.text && option.textZh && option.subtitle && option.subtitleZh, `${event.id} option text`);
  }
}
const restored = deserializeGameState(serializeGameState(partyShells), {
  cards: CARD_REGISTRY, advisors: INITIAL_ADVISORS, events: RESTORABLE_EVENT_REGISTRY,
});
assert.equal(restored.currentEvent?.id, 'iberian_army_question');
assert.deepEqual(restored.iberianSettlement, partyShells.iberianSettlement);
assert.equal(restored.partyAliases?.PSOE?.shortZh, 'UGT');

// The aliased names survive the save round-trip.
const aliases: GameState['partyAliases'] = partyShells.partyAliases;
assert.equal((aliases?.POUM as PartyAlias).shortEn, 'FOUS');
assert.equal(iberianArmyQuestion.options[1].condition?.(partyShells) ?? true, true, 'militia route is always available');

console.log('Iberian victory settlement chain: deferral, regimes, economy, party清算 and armies passed.');
