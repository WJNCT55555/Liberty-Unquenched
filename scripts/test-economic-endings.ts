import assert from 'node:assert/strict';
import { createScenarioState } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';
import { checkEndings, ENDINGS, ENDING_DETAILS } from '../src/game/endings';
import { MapFaction } from '../src/map/types_map';

const completed = (state: GameState, journalId: string): GameState => ({
  ...state,
  journal: {
    ...state.journal,
    [journalId]: { ...state.journal[journalId], status: 'completed' },
  },
});

const victory = (): GameState => {
  const base = createScenarioState('1936', 'normal', 'zh');
  return {
    ...base,
    year: 1940,
    month: 5,
    civilWarStatus: 'won',
    activeWar: null,
    wars: { ...base.wars, spanish_civil_war: 'won' },
    postwarSettlement: {
      startedAt: { year: 1939, month: 3 },
      completedAt: { year: 1939, month: 4 },
      regime: 'free_commune_federation',
    },
  };
};

const withFreeCommune = (state: GameState): GameState => completed(state, 'journal_economy_free_commune');
const withSyndicalist = (state: GameState): GameState => completed(state, 'journal_economy_syndicalist');
const parliamentary = (state: GameState): GameState => ({
  ...state,
  postwarSettlement: { ...state.postwarSettlement!, regime: 'parliamentary_republic' },
});

// Free commune regime + completed free-commune journal.
assert.equal(checkEndings(withFreeCommune(victory())).ending, ENDINGS.LAND_AND_FREEDOM);

// Both economic routes completed: Land and Freedom is the more specific ending.
assert.equal(checkEndings(withSyndicalist(withFreeCommune(victory()))).ending, ENDINGS.LAND_AND_FREEDOM);

// Free commune regime without the journal: Children of the People is the fallback,
// regardless of fervor or dissent.
const fallback = victory();
assert.equal(checkEndings(fallback).ending, ENDINGS.CHILDREN_OF_THE_PEOPLE);
const lowFervor = {
  ...fallback,
  stats: { ...fallback.stats, revolutionaryFervor: 5 },
  factions: Object.fromEntries(Object.entries(fallback.factions).map(([id, faction]) => [id, { ...faction, dissent: 100 }])) as GameState['factions'],
};
assert.equal(checkEndings(lowFervor).ending, ENDINGS.CHILDREN_OF_THE_PEOPLE);

// The moderate route alone, outside the free-commune regime.
assert.equal(checkEndings(withSyndicalist(parliamentary(victory()))).ending, ENDINGS.SYNDICATE_DREAM);

// A free-commune journal without the regime is not Land and Freedom.
const journalOnly = withFreeCommune(victory());
const noRegime = parliamentary(journalOnly);
assert.equal(checkEndings(noRegime).ending, 'GENERIC_WIN');

// Outside a free-commune regime, high fervor no longer produces Children.
const highFervorCouncil = {
  ...parliamentary(victory()),
  stats: { ...victory().stats, revolutionaryFervor: 95 },
  cntStance: 'oppose' as const,
  factions: Object.fromEntries(Object.entries(victory().factions).map(([id, faction]) => [id, { ...faction, dissent: 0 }])) as GameState['factions'],
};
assert.equal(checkEndings(highFervorCouncil).ending, 'GENERIC_WIN');

// The Asturias settlement also supplies the regime.
const asturias: GameState = {
  ...victory(),
  postwarSettlement: undefined,
  asturiasVictory: { regime: 'free_commune_federation' },
};
assert.equal(checkEndings(withFreeCommune(asturias)).ending, ENDINGS.LAND_AND_FREEDOM);
assert.equal(checkEndings(asturias).ending, ENDINGS.CHILDREN_OF_THE_PEOPLE);

// A later parliamentary settlement overrides the earlier free-commune regime.
const overridden: GameState = {
  ...withFreeCommune(victory()),
  asturiasVictory: { regime: 'free_commune_federation' },
  postwarSettlement: { ...victory().postwarSettlement!, regime: 'parliamentary_republic' },
};
assert.equal(checkEndings(overridden).ending, 'GENERIC_WIN');

// The Iberian settlement can produce Land and Freedom instead of the Committee victory.
const campaign: NonNullable<GameState['iberianDefense']> = {
  formedAt: { year: 1937, month: 5 },
  allies: { poum: true, psoeLeft: true },
  leftSocialistReserve: 0,
  eliminated: [MapFaction.NATIONALIST, MapFaction.REPUBLICAN, MapFaction.CARLIST],
  eliminations: [],
  surrenderThresholds: {},
  initialProvinces: ['barcelona'],
  contributions: { cnt: 1, poum: 1, psoeLeft: 0 },
  carlistEntered: true,
  winner: MapFaction.IBERIAN_DEFENSE,
};
const iberian: GameState = {
  ...victory(),
  postwarSettlement: undefined,
  civilWarStatus: 'won',
  iberianDefense: campaign,
  iberianSettlement: {
    startedAt: { year: 1939, month: 5 },
    completedAt: { year: 1939, month: 6 },
    regime: 'free_commune_federation',
  },
};
assert.equal(checkEndings(iberian).ending, ENDINGS.CHILDREN_OF_THE_PEOPLE);
assert.equal(checkEndings(withFreeCommune(iberian)).ending, ENDINGS.LAND_AND_FREEDOM);
assert.equal(checkEndings(withSyndicalist(iberian)).ending, ENDINGS.CHILDREN_OF_THE_PEOPLE);
const committee: GameState = {
  ...iberian,
  iberianSettlement: { ...iberian.iberianSettlement!, regime: 'revolutionary_committee' },
};
assert.equal(checkEndings(committee).ending, ENDINGS.REVOLUTION_WITHOUT_END);
assert.equal(checkEndings(withFreeCommune(committee)).ending, ENDINGS.REVOLUTION_WITHOUT_END);

// The May 1940 checkpoint: victory endings must wait for it.
const early = { ...withFreeCommune(victory()), year: 1940, month: 4 };
assert.equal(checkEndings(early).isGameOver, false);
const earlyGeneric = { ...parliamentary(victory()), year: 1940, month: 4 };
assert.equal(checkEndings(earlyGeneric).isGameOver, false);
const earlySilent = { ...victory(), civilWarStatus: 'not_started' as const, year: 1940, month: 4 };
assert.equal(checkEndings(earlySilent).isGameOver, false);
assert.equal(checkEndings({ ...earlySilent, month: 5 }).ending, ENDINGS.SILENT_REPUBLIC);
const earlyBell = { ...victory(), civilWarStatus: 'ongoing' as const, year: 1940, month: 4 };
assert.equal(checkEndings(earlyBell).isGameOver, false);
assert.equal(checkEndings({ ...earlyBell, month: 5 }).ending, ENDINGS.FOR_WHOM_THE_BELL_TOLLS);

// Economic endings outrank the generic fervor/stance endings.
const fervorHigh: GameState = {
  ...withFreeCommune(victory()),
  stats: { ...victory().stats, revolutionaryFervor: 95 },
  factions: Object.fromEntries(Object.entries(victory().factions).map(([id, faction]) => [id, { ...faction, dissent: 0 }])) as GameState['factions'],
};
assert.equal(checkEndings(fervorHigh).ending, ENDINGS.LAND_AND_FREEDOM);
const popularFront: GameState = {
  ...withSyndicalist(victory()),
  postwarSettlement: { ...victory().postwarSettlement!, regime: 'parliamentary_republic' },
  stats: { ...victory().stats, revolutionaryFervor: 20 },
  cntStance: 'govern',
};
assert.equal(checkEndings(popularFront).ending, ENDINGS.SYNDICATE_DREAM);

// Defeat still wins over the economic routes.
assert.equal(checkEndings({ ...withSyndicalist(victory()), civilWarStatus: 'lost' }).ending, ENDINGS.WE_HAVE_PASSED);

// Both endings have bilingual copy.
for (const id of [ENDINGS.LAND_AND_FREEDOM, ENDINGS.SYNDICATE_DREAM, ENDINGS.REVOLUTION_WITHOUT_END]) {
  const detail = ENDING_DETAILS[id];
  assert.ok(detail?.title && detail.titleZh && detail.description && detail.descriptionZh, `${id} needs bilingual text`);
}

console.log('Economic and May 1940 endings passed.');
