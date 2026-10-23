import assert from 'node:assert/strict';
import { durrutiDeath } from '../src/game/events/civil_war/durruti_death';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { gameReducer } from '../src/game/reducers/gameReducer';
import { createScenarioState } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';
import { getPartySupport } from '../src/game/parties';
import { shouldQueueEvent } from '../src/game/utils/eventTrigger';
import { MapFaction } from '../src/map/types_map';
import { PROVINCE_ADJACENCY } from '../src/map/map_constants';

const initial = createScenarioState('1936', 'normal', 'en');
const base: GameState = {
  ...initial,
  year: 1936,
  month: 12,
  activeWar: 'spanish_civil_war',
  civilWarStatus: 'ongoing',
  eventHistory: { triggered: [], resolved: [] },
  provinces: Object.fromEntries(Object.entries(initial.provinces).map(([id, province]) => [
    id, PROVINCE_ADJACENCY.madrid.includes(id) ? { ...province, owner: MapFaction.REPUBLICAN } : province,
  ])) as GameState['provinces'],
};
const due = (state: GameState, mode: 'historical' | 'nonHistorical') =>
  shouldQueueEvent(durrutiDeath, state, { mode });

assert.equal(durrutiDeath.options.length, 1);
assert.equal(SCHEDULED_EVENT_REGISTRY.filter(event => event.id === durrutiDeath.id).length, 1);
assert.equal(RESTORABLE_EVENT_REGISTRY.filter(event => event.id === durrutiDeath.id).length, 1);
assert.equal(due(base, 'nonHistorical'), false);
assert.equal(due({ ...base, month: 11 }, 'nonHistorical'), false);
assert.equal(due({ ...base, activeWar: null }, 'nonHistorical'), false);

const highDissent: GameState = {
  ...base,
  factions: Object.fromEntries(Object.entries(base.factions).map(([name, faction]) =>
    [name, { ...faction, dissent: 61 }])) as GameState['factions'],
};
assert.equal(due(highDissent, 'nonHistorical'), true);
assert.equal(due({ ...highDissent, month: 11 }, 'nonHistorical'), false);
assert.equal(due({ ...highDissent, civilWarStatus: 'won' }, 'nonHistorical'), false);

const highPce: GameState = {
  ...base,
  classes: Object.fromEntries(Object.entries(base.classes).map(([name, classState]) =>
    [name, { ...classState, support: { ...classState.support, PCE: 1000 } }])) as GameState['classes'],
};
assert.ok(getPartySupport(highPce, 'PCE') > 60);
assert.equal(due(highPce, 'nonHistorical'), true);

const madridThreat: GameState = {
  ...base,
  provinces: {
    ...base.provinces,
    toledo: { ...base.provinces.toledo, owner: MapFaction.NATIONALIST },
  },
};
assert.equal(due(madridThreat, 'nonHistorical'), true);
assert.equal(due({ ...madridThreat, provinces: base.provinces }, 'nonHistorical'), false);

const historical: GameState = { ...base, difficulty: 'historical', month: 11, activeWar: null, civilWarStatus: 'not_started' };
assert.equal(due(historical, 'historical'), true);
assert.equal(due({ ...historical, month: 10 }, 'historical'), false);
assert.equal(due({ ...historical, month: 12 }, 'historical'), false);
assert.equal(due({ ...historical, durrutiAlive: false }, 'historical'), false);

const durruti = base.advisorPool.find(advisor => advisor.id === 'Buenaventura Durruti');
assert.ok(durruti);
const active: GameState = {
  ...madridThreat,
  advisorPool: base.advisorPool.filter(advisor => advisor.id !== durruti.id),
  activeAdvisors: [durruti, null, null],
};
const changes = durrutiDeath.options[0].effect(active);
const resolved = { ...active, ...changes };
assert.equal(resolved.durrutiAlive, false);
assert.equal(resolved.activeAdvisors[0], null);
assert.equal(resolved.advisorPool.some(advisor => advisor.id === durruti.id), false);
assert.equal(due(resolved, 'nonHistorical'), false);
assert.equal(gameReducer(resolved, { type: 'ADD_ADVISOR', payload: { advisor: durruti, slotIndex: 0 } }), resolved);
assert.deepEqual(durrutiDeath.options[0].effect(resolved), {});

console.log('Durruti death event checks passed.');
