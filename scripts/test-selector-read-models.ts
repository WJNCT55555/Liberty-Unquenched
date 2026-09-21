import assert from 'node:assert/strict';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { Advisor, Card, GameEvent, GameState } from '../src/game/types';
import {
  areAdvisorPanelViewModelsEqual,
  areCardViewModelsEqual,
  areDomesticPolicyModalStatesEqual,
  areEconomyModalStatesEqual,
  areEventBoardViewModelsEqual,
  areEventModalViewModelsEqual,
  areJournalViewModelsEqual,
  areLawStanceModalStatesEqual,
  arePoliticalModalStatesEqual,
  areRecruitmentPoolViewsEqual,
  areSidePanelStatesEqual,
  formatGeneralElectionViewModel,
  selectAdvisorPanelViewModel,
  selectCardViewModel,
  selectEventBoardViewModel,
  selectEventModalViewModel,
  selectJournalViewModel,
  selectGeneralElectionViewModel,
  selectMapRecruitmentPools,
  selectMapRuntimeState,
} from '../src/game/selectors';

const baseState: GameState = {
  ...PRE_START_STATE,
  actionsLeft: 2,
  resources: 2,
  armaments: 1,
  currentEvent: null,
  pendingEvents: [],
};

const card: Card = {
  id: 'selector_test_card',
  title: 'Selector test',
  type: 'Action',
  description: 'Tests the card read model.',
  cost: 1,
  condition: (state) => state.resources >= 2,
  effect: () => ({}),
};

const cardView = selectCardViewModel(baseState, card);
assert(areCardViewModelsEqual(cardView, selectCardViewModel({ ...baseState, month: baseState.month + 1 }, card)));
assert(!areCardViewModelsEqual(cardView, selectCardViewModel({ ...baseState, resources: 0 }, card)));

const event: GameEvent = {
  id: 'selector_test_event',
  title: (state) => `Resources ${state.resources}`,
  description: 'Tests the event read model.',
  options: [{
    text: 'Continue',
    condition: (state) => state.resources >= 3,
    unavailableSubtitle: (state) => `Need ${3 - state.resources}`,
    effect: () => ({}),
  }],
};

const eventState = { ...baseState, pendingEvents: [event] };
const eventView = selectEventModalViewModel(eventState, event);
assert(areEventModalViewModelsEqual(eventView, selectEventModalViewModel({ ...eventState, month: eventState.month + 1 }, event)));
assert(!areEventModalViewModelsEqual(eventView, selectEventModalViewModel({ ...eventState, resources: 3 }, event)));

const eventBoard = selectEventBoardViewModel(eventState);
assert(areEventBoardViewModelsEqual(eventBoard, selectEventBoardViewModel({ ...eventState, month: eventState.month + 1 })));
assert(!areEventBoardViewModelsEqual(eventBoard, selectEventBoardViewModel({ ...eventState, resources: 3 })));

const advisor: Advisor = {
  id: 'selector_test_advisor',
  name: 'Selector Advisor',
  faction: 'None',
  description: 'Tests the advisor read model.',
  actions: [{
    id: 'selector_test_action',
    title: 'Act',
    subtitle: 'Requires resources',
    description: 'Tests availability.',
    condition: (state) => state.resources >= 3,
    unavailableSubtitle: (state) => `Need ${3 - state.resources}`,
    effect: () => ({}),
  }],
};
const advisorState = { ...baseState, activeAdvisors: [advisor, null, null], advisorPool: [] };
const advisorView = selectAdvisorPanelViewModel(advisorState, advisor.id);
assert(areAdvisorPanelViewModelsEqual(advisorView, selectAdvisorPanelViewModel({ ...advisorState, month: advisorState.month + 1 }, advisor.id)));
assert(!areAdvisorPanelViewModelsEqual(advisorView, selectAdvisorPanelViewModel({ ...advisorState, resources: 3 }, advisor.id)));

const actionOnlyChange = { ...baseState, actionsLeft: baseState.actionsLeft + 1 };
assert(areEconomyModalStatesEqual(baseState, actionOnlyChange));
assert(!areEconomyModalStatesEqual(baseState, { ...baseState, budget: baseState.budget + 1 }));
assert(arePoliticalModalStatesEqual(baseState, actionOnlyChange));
assert(!arePoliticalModalStatesEqual(baseState, { ...baseState, government: { ...baseState.government, primeMinister: 'Changed' } }));
assert(areDomesticPolicyModalStatesEqual(baseState, actionOnlyChange));
assert(!areDomesticPolicyModalStatesEqual(baseState, { ...baseState, domesticPolicy: { ...baseState.domesticPolicy, land_law: baseState.domesticPolicy.land_law + 1 } }));
assert(areLawStanceModalStatesEqual(baseState, actionOnlyChange));
assert(!areLawStanceModalStatesEqual(baseState, { ...baseState, lawStanceModifiers: [...baseState.lawStanceModifiers] }));
assert(areSidePanelStatesEqual(baseState, { ...baseState, resources: baseState.resources + 1 }));
assert(!areSidePanelStatesEqual(baseState, { ...baseState, stats: { ...baseState.stats, tension: baseState.stats.tension + 1 } }));
assert.equal(
  formatGeneralElectionViewModel(selectGeneralElectionViewModel(baseState), true),
  '1931年6月 (制宪议会大选)',
);
assert.equal(
  formatGeneralElectionViewModel(selectGeneralElectionViewModel({ ...baseState, civilWarStatus: 'ongoing' }), false),
  'Suspended (Civil War)',
);
assert(!areSidePanelStatesEqual(baseState, {
  ...baseState,
  generalElectionSchedule: {
    lastElectionAt: { year: 1931, month: 6 },
    nextElectionAt: { year: 1935, month: 6 },
    reason: 'term_expiry',
  },
}));

const mapRuntime = selectMapRuntimeState(baseState);
const unrelatedMapRuntime = selectMapRuntimeState({ ...baseState, resources: baseState.resources + 1 });
assert.deepEqual(mapRuntime, unrelatedMapRuntime, 'Political resources must not leak into the strategic-map read model.');
assert(!('organizations' in mapRuntime), 'The map runtime must not expose organization state.');
assert(!('armedForces' in mapRuntime), 'Recruitment domain state belongs behind its own selector.');
assert.notDeepEqual(
  mapRuntime,
  selectMapRuntimeState({ ...baseState, mapSelectedProvinceId: 'madrid' }),
  'Map selection changes must update the map read model.',
);

const recruitmentPools = selectMapRecruitmentPools(baseState);
assert(areRecruitmentPoolViewsEqual(
  recruitmentPools,
  selectMapRecruitmentPools({ ...baseState, resources: baseState.resources + 1 }),
), 'Unrelated political resources must not invalidate recruitment pool views.');
assert(!areRecruitmentPoolViewsEqual(
  recruitmentPools,
  selectMapRecruitmentPools({
    ...baseState,
    armedForces: {
      ...baseState.armedForces!,
      entityPools: {
        ...baseState.armedForces!.entityPools!,
        cnt_defense_committees: {
          ...baseState.armedForces!.entityPools!.cnt_defense_committees,
          manpower: baseState.armedForces!.entityPools!.cnt_defense_committees.manpower + 1,
        },
      },
    },
  }),
), 'Recruitment pool manpower changes must update the recruitment view.');

const journalView = selectJournalViewModel(baseState);
assert(areJournalViewModelsEqual(journalView, selectJournalViewModel({ ...baseState, resources: baseState.resources + 1 })));
assert(!areJournalViewModelsEqual(journalView, selectJournalViewModel({
  ...baseState,
  partyRelations: { ...baseState.partyRelations, PSOE: baseState.partyRelations.PSOE + 1 },
})));

console.log('Selector read-model stability tests passed.');
