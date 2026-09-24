import assert from 'node:assert/strict';
import { PRE_START_STATE } from '../src/game/scenarios';
import type { Advisor, Card, GameEvent, GameState, OrganizationId } from '../src/game/types';
import { MILITIA_ORGANIZATION_DISPLAY_ORDER, setOrganizationEstablished } from '../src/game/organizations';
import { getMilitarization } from '../src/game/rules/militarization';
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
  selectMilitiaOrganizationViewModels,
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

// --- 「准军事组织」面板：军事化横条只挂在已经成立的组织下面 ---
const withOrg = (state: GameState, id: OrganizationId): GameState => ({ ...state, ...setOrganizationEstablished(state, id) });
const rowsOf = (state: GameState) => selectMilitiaOrganizationViewModels(state);

// 1. 未成立的组织整行不出现，所以未成立的民兵派系也没有横条可挂。
const peacetimeRows = rowsOf(baseState);
assert(
  peacetimeRows.every((row) => row.organizationId !== 'DC' && row.identity !== 'cnt'),
  'The defence committees do not exist before a war, so the CNT militia has no bar to hang on.',
);
assert(
  peacetimeRows.every((row) => row.entityId in baseState.armedForces.entityPools),
  'Every row must point at a real armed-entity pool.',
);

// 2. 每个已成立的组织一行，且前面至少有一个组织的派系横条先出现（顺序不变）。
const everyMilitiaOrg = [
  'DC', 'PSOE_MILITIA', 'MAOC', 'FIFTH_REGIMENT', 'POUM_MILITIA',
  'INTERNATIONAL_BRIGADES', 'EUZKO_GUDAROSTEA', 'REQUETE_MILITIA', 'FALANGE_MILITIA', 'ITALIAN_CTV',
] as const;
const everything = everyMilitiaOrg.reduce((state, id) => withOrg(state, id), baseState);
const everythingRows = rowsOf(everything);
assert.deepEqual(
  everythingRows.map((row) => row.organizationId),
  MILITIA_ORGANIZATION_DISPLAY_ORDER.filter((id) => everyMilitiaOrg.includes(id as typeof everyMilitiaOrg[number])),
  'The panel must follow MILITIA_ORGANIZATION_DISPLAY_ORDER.',
);
// 一个派系可以承载多个组织：长枪党第一线与意大利 CTV 都是 `falange`。它们各自
// 拿到一条横条，显示的是同一个率——这是对的，两者本就是同一支武装集团。
const duplicatedGroups = everythingRows
  .map((row) => row.identity)
  .filter((identity, index, all) => all.indexOf(identity) !== index);
assert.deepEqual([...new Set(duplicatedGroups)].sort(), ['falange', 'pce'], 'Only the shared force groups may repeat.');
const firstEnemyRow = everythingRows.findIndex((row) => row.camp === 'nationalist');
assert(firstEnemyRow > 0, 'The nationalist camp must be listed, and after the republicans.');
assert(
  everythingRows.slice(firstEnemyRow).every((row) => row.camp === 'nationalist'),
  'Once the nationalist camp starts it must run to the end — the panel draws one divider there.',
);

// 3. 军事化率读的就是该派系共享的那一个值；DC 高亮，且挂的是 CNT 自己的率。
const withDc = withOrg(baseState, 'DC');
const dcRow = rowsOf(withDc).find((row) => row.organizationId === 'DC');
assert.ok(dcRow, 'An established militia organisation must be listed.');
assert.equal(dcRow.identity, 'cnt');
assert.equal(dcRow.militarization, getMilitarization(withDc, 'cnt'));
assert.equal(dcRow.entityId, 'cnt_defense_committees');
assert.equal(dcRow.highlighted, true);
assert.equal(dcRow.nameZh, '联合民兵', 'The militia name, not the committee name, is what the roster shows.');

// 4. MAOC 与第五团共用 `pce`：升格时 MAOC 转为 integrated，横条跟着换挂到第五团。
const withMaoc = withOrg(baseState, 'MAOC');
assert.equal(rowsOf(withMaoc).find((row) => row.identity === 'pce')?.organizationId, 'MAOC');
const upgraded = {
  ...withMaoc,
  organizations: { ...withMaoc.organizations, MAOC: { ...withMaoc.organizations.MAOC, status: 'integrated' as const } },
};
const afterUpgrade = withOrg(upgraded, 'FIFTH_REGIMENT');
const pceRows = rowsOf(afterUpgrade).filter((row) => row.identity === 'pce');
assert.equal(pceRows.length, 1, 'The Fifth Regiment replaces the MAOC; it never sits beside it.');
assert.equal(pceRows[0].organizationId, 'FIFTH_REGIMENT');
assert.equal(pceRows[0].entityId, 'fifth_regiment');

// 5. 人力取自该组织的武装实体池。
const withManpower = {
  ...withDc,
  armedForces: {
    ...withDc.armedForces,
    entityPools: {
      ...withDc.armedForces.entityPools,
      cnt_defense_committees: { ...withDc.armedForces.entityPools.cnt_defense_committees, manpower: 4242 },
    },
  },
};
assert.equal(rowsOf(withManpower).find((row) => row.organizationId === 'DC')?.manpower, 4242);

console.log('Selector read-model stability tests passed.');
