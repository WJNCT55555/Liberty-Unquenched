import assert from 'node:assert/strict';
import type { Card, GameEvent, GameState, JournalState, JournalStatus } from '../src/game/types';
import { MapFaction } from '../src/map/types_map';
import { PRE_START_STATE, createScenarioState } from '../src/game/scenarios';
import { advancePhase } from '../src/game/rules/phaseOrchestrator';
import { activateJournal } from '../src/game/rules/journalEvents';
import { getJournalEntryDef, JOURNAL_ENTRIES } from '../src/game/journal';
import { SCHEDULED_EVENT_REGISTRY } from '../src/game/registries/scheduledEventRegistry';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { economyFreeCommuneStart } from '../src/game/events/economy/free_commune_start';
import { economyWartimeRouteChoice } from '../src/game/events/economy/wartime_route_choice';
import {
  economyOrganicVictory,
  economySyndicalistVictory,
  economyWarEffortConceded,
  economyWarEffortVictory,
  economyRevolutionaryWarConceded,
} from '../src/game/events/economy';
import { industryPolicy } from '../src/game/government_affairs/industry_policy';
import { tradePolicy } from '../src/game/government_affairs/trade_policy';
import { fiscalMeasures } from '../src/game/government_affairs/fiscal_measures';
import { agriculturalPolicy } from '../src/game/government_affairs/agricultural_policy';
import { landAndFreedom } from '../src/game/action_affairs/land_and_freedom';
import { joanPeiro } from '../src/game/advisors/joan_peiro';
import {
  diegoAbadDeSantillan,
  ORGANIC_ROUTE_PUSH_LIMIT,
} from '../src/game/advisors/diego_abad_de_santillan';
import { economyCooperativePath } from '../src/game/events/economy/cooperative_path';
import { economyAfterTheRevolution } from '../src/game/events/economy/after_the_revolution';
import {
  areEconomyReformViewModelsEqual,
  selectEconomyReformViewModel,
} from '../src/game/selectors';
import { ECONOMY_COUNTERS } from '../src/game/rules/economyReforms';

/**
 * 经济改造第 2 期验收：日志定义、事件契约、强制入队与路线互斥
 * （docs/经济改造方案.md §11 第 2 期、§5.7）。
 */

const ECONOMY_JOURNAL_IDS = [
  'journal_economy_syndicalist',
  'journal_economy_free_commune',
  'journal_economy_cooperative',
  'journal_economy_organic',
  'journal_economy_war_effort',
  'journal_economy_revolutionary_war',
] as const;

const findEvent = (id: string): GameEvent | undefined =>
  RESTORABLE_EVENT_REGISTRY.find(event => event.id === id);

// ---- 1. 日志定义 ----

for (const journalId of ECONOMY_JOURNAL_IDS) {
  const def = getJournalEntryDef(journalId);
  assert(def, `${journalId} must be registered in JOURNAL_ENTRIES`);
  assert(def!.activationEventId, `${journalId} must declare an activation event (激活只属于开始事件)`);
  assert(def!.completionEventId, `${journalId} must declare a completion event`);
  assert(def!.hasProgress && def!.getProgress, `${journalId} must expose getProgress`);
  assert(def!.titleZh && def!.descriptionZh && def!.successConditionZh, `${journalId} must be bilingual`);
  assert(
    findEvent(def!.activationEventId!) || SCHEDULED_EVENT_REGISTRY.some(event => event.id === def!.activationEventId),
    `${journalId} activation event must be schedulable or restorable`,
  );
  assert(findEvent(def!.completionEventId!), `${journalId} completion event must be restorable`);
}

// 平时四条路线永不失败：没有 failureEventId（方案 §5.7①）。
for (const journalId of ['journal_economy_syndicalist', 'journal_economy_free_commune', 'journal_economy_cooperative', 'journal_economy_organic'] as const) {
  assert(
    getJournalEntryDef(journalId)?.failureEventId === undefined,
    `${journalId} must never fail and must not declare a failure event`,
  );
}

// 战时两条路线：各自声明失败事件（唯一失败原因 = 对方先完成）。
for (const journalId of ['journal_economy_war_effort', 'journal_economy_revolutionary_war'] as const) {
  const def = getJournalEntryDef(journalId)!;
  assert(def.failureEventId, `${journalId} must declare its failure event`);
  assert(findEvent(def.failureEventId!), `${journalId} failure event must be restorable`);
}

// ---- 2. 结果/失败事件都不参与事件板调度 ----

for (const eventId of ['economy_syndicalist_victory', 'economy_free_commune_victory', 'economy_cooperative_victory', 'economy_organic_victory', 'economy_war_effort_victory', 'economy_revolutionary_war_victory', 'economy_war_effort_conceded', 'economy_revolutionary_war_conceded', 'currency_abolished', 'bankers_panic'] as const) {
  const event = findEvent(eventId);
  assert(event, `${eventId} must be restorable`);
  assert(event!.condition?.({ ...PRE_START_STATE }) === false, `${eventId} must stay out of the event board`);
  assert(!SCHEDULED_EVENT_REGISTRY.some(candidate => candidate.id === eventId), `${eventId} must not be schedulable`);
}

// 四个开始事件反过来：可被调度器识别，但不靠 condition 自然触发。
for (const event of [economyFreeCommuneStart, economyWartimeRouteChoice] as const) {
  assert(SCHEDULED_EVENT_REGISTRY.some(candidate => candidate.id === event.id), `${event.id} must be registered for scheduling`);
  assert(event.condition?.({ ...PRE_START_STATE }) === false, `${event.id} must be entered by the orchestrator, not by the scheduler`);
}

// ---- 3. 开局自带的自由公社路线 ----

const opening = createScenarioState('1931', 'normal', 'en');
assert.equal(opening.journal.journal_economy_free_commune?.status, 'inactive', 'The free-commune journal must start inactive');
assert.equal(opening.journal.journal_economy_syndicalist?.status, 'inactive', 'The syndicalist journal must start inactive');

// 第一个月的月结必须把开始事件推到队首（方案 §4.3①）。
const afterAction = advancePhase({ ...opening, phase: 'action' });
const afterMonth = advancePhase(afterAction);
const queuedFreeCommune = afterMonth.pendingEvents.find(event => event.id === 'economy_free_commune_start');
assert(queuedFreeCommune, 'The free-commune start event must be queued at the first monthly settlement');
assert.equal(afterMonth.pendingEvents[0]?.id, 'economy_free_commune_start', 'The forced event must go to the front of the queue');

// 确认选项激活日志（放弃玩家不需要做选择）。
const activated = { ...afterMonth, ...queuedFreeCommune!.options[0].effect(afterMonth) };
assert.equal(
  activated.journal.journal_economy_free_commune?.status,
  'active',
  'Confirming the start event must activate the free-commune journal',
);

// 幂等：日志已经激活之后，月结不再重复入队。
//
// 注意月结会重建整份 pendingEvents（`pendingEvents: newPendingEvents`），所以"队列里有
// 什么"只能作为当月的观察；真正跨月生效的守卫是日志状态本身——开始事件的选项把它写成
// `active`，下一月的强制入队检查读到的就是 active。这里同时覆盖两个守卫：
//   ① 日志已激活 → 不再入队；② 事件已经在 history 里 → 即使日志条目缺失也不再入队。
// 注意 spread 顺序：`activated` 本身带着上个月的 pendingEvents，必须在它之后覆盖队列字段。
const triggeredState = {
  ...activated,
  currentEvent: null,
  pendingEvents: [],
};
assert.equal(
  triggeredState.journal.journal_economy_free_commune?.status,
  'active',
  'The activated state must keep the journal active',
);
assert.equal(triggeredState.pendingEvents.length, 0, 'The probe state must start from an empty queue');
const secondMonth = advancePhase({ ...triggeredState, phase: 'action' });
assert(
  !secondMonth.pendingEvents.some(event => event.id === 'economy_free_commune_start'),
  'An already-active journal must not re-queue its start event',
);

// ② history 守卫：日志条目缺失（模拟极端旧档）时靠 history 兜住。
const historyOnlyGuard = {
  ...afterMonth,
  ...activated,
  currentEvent: null,
  pendingEvents: [],
  journal: Object.fromEntries(
    Object.entries(activated.journal ?? afterMonth.journal)
      .filter(([journalId]) => journalId !== 'journal_economy_free_commune'),
  ),
  eventHistory: {
    ...afterMonth.eventHistory,
    triggered: [...afterMonth.eventHistory.triggered, 'economy_free_commune_start'],
  },
};
assert.equal(
  historyOnlyGuard.journal.journal_economy_free_commune,
  undefined,
  'The history-guard probe must run without the journal entry',
);
const thirdMonth = advancePhase({ ...historyOnlyGuard, phase: 'action' });
assert(
  !thirdMonth.pendingEvents.some(event => event.id === 'economy_free_commune_start'),
  'An already-triggered start event must not be queued again even without a journal entry',
);

// ---- 4. 温和工团路线由 CNT 三大激活 ----

const syndicalistActivation = activateJournal(opening, 'journal_economy_syndicalist');
assert.equal(
  syndicalistActivation.journal?.journal_economy_syndicalist?.status,
  'active',
  'The third-congress option must be able to activate the syndicalist journal',
);

// ---- 5. 战时抉择：一个选项同时开两条日志 ----

assert.equal(economyWartimeRouteChoice.options.length, 1, 'The wartime choice must offer exactly one option');
const wartimeActivated = {
  ...opening,
  ...economyWartimeRouteChoice.options[0].effect(opening),
};
assert.equal(wartimeActivated.journal.journal_economy_war_effort?.status, 'active', 'The single option must open the coordination journal');
assert.equal(wartimeActivated.journal.journal_economy_revolutionary_war?.status, 'active', 'The same option must open the militarization journal');

// ---- 6. 谁先完成谁关掉对方（唯一的硬互斥） ----

const warEffortDone = {
  ...wartimeActivated,
  private_bank_seizure: 1,
  wartime_requisition: 1,
  family_rationing: 1,
  wartime_trade_monopoly: 2,
  journal: {
    ...wartimeActivated.journal,
    journal_economy_war_effort: { id: 'journal_economy_war_effort', status: 'completed' as const, progress: 0 },
    journal_economy_revolutionary_war: { id: 'journal_economy_revolutionary_war', status: 'active' as const, progress: 0 },
  },
};
const revolutionaryStatus = getJournalEntryDef('journal_economy_revolutionary_war')!
  .checkStatus!(warEffortDone, warEffortDone.journal.journal_economy_revolutionary_war);
assert.equal(revolutionaryStatus, 'failed', 'Completing one wartime route must fail the other');

const warEffortOnly = {
  ...wartimeActivated,
  private_bank_seizure: 1,
  wartime_requisition: 1,
  family_rationing: 1,
  wartime_trade_monopoly: 2,
  journal: {
    ...wartimeActivated.journal,
    journal_economy_war_effort: { id: 'journal_economy_war_effort', status: 'active' as const, progress: 0 },
  },
};
assert.equal(
  getJournalEntryDef('journal_economy_war_effort')!.checkStatus!(warEffortOnly, warEffortOnly.journal.journal_economy_war_effort),
  'completed',
  'The coordination route must complete once its four counters are in place',
);

// ---- 7. 每个日志的 getProgress / checkStatus 在所有状态下都不抛异常 ----

const probeStates = [opening, afterMonth, wartimeActivated, warEffortDone, PRE_START_STATE];
for (const def of JOURNAL_ENTRIES) {
  for (const probe of probeStates) {
    const entryState = probe.journal?.[def.id] ?? { id: def.id, status: 'inactive' as const, progress: 0 };
    assert.doesNotThrow(() => def.getProgress?.(probe, entryState), `${def.id}.getProgress threw`);
    assert.doesNotThrow(() => def.checkStatus?.(probe, entryState), `${def.id}.checkStatus threw`);
  }
}

// ---- 8. 结果事件与日志的叙事分工：结果事件不得重复发奖 ----

for (const resultEvent of [economySyndicalistVictory, economyWarEffortVictory]) {
  assert.equal(resultEvent.options.length >= 1, true, `${resultEvent.id} must offer at least one option`);
  assert.equal(
    typeof resultEvent.options[0].effect,
    'function',
    `${resultEvent.id} options must carry an effect (result acknowledgements may return {})`,
  );
}
for (const conceded of [economyWarEffortConceded, economyRevolutionaryWarConceded]) {
  const patch = conceded.options[0].effect({ ...PRE_START_STATE }) as Record<string, unknown>;
  assert.equal(Object.keys(patch).length, 0, `${conceded.id} must not double-charge the losing route`);
}
const organicVictoryPatch = economyOrganicVictory.options[0].effect({ ...PRE_START_STATE }) as Record<string, unknown>;
assert(organicVictoryPatch.stats, 'Route result options may confirm a state transition, but only their own');

// ---- 9. 卡牌：每个选项都要落一次计数器、花掉冷却，且不越过上限 ----
// 这一节用真实的卡牌/事件路径驱动（而不是直接调 helper），因此它覆盖的是
// "选项是否接对了计数器"这一层，而不是 helper 本身（helper 在第 1 期已经单测过）。

const openingWith = (patch: Partial<GameState>): GameState => ({ ...PRE_START_STATE, ...patch });

const governmentState = (patch: Partial<GameState>): GameState => openingWith({
  screen: 'game',
  cntStance: 'govern',
  ministers: { ...PRE_START_STATE.ministers, industry: 'CNT', finance: 'CNT', estado: 'CNT' },
  resources: 12,
  ...patch,
});

const eventFromCard = (card: Card, state: GameState): GameEvent => {
  const event = card.effect(state)?.currentEvent;
  assert(event, `${card.id} must open an event`);
  return event!;
};

const findOption = (event: GameEvent, search: string) => {
  const option = event.options.find(candidate => String(candidate.text).includes(search));
  assert(option, `${event.id} must expose an option matching "${search}"`);
  return option!;
};

// 卡牌门槛：参政 + 掌对应部委 + 冷却归零。
assert.equal(industryPolicy.condition?.(governmentState({})), true, 'Industry policy needs government + industry ministry');
assert.equal(
  industryPolicy.condition?.(governmentState({ ministers: { ...PRE_START_STATE.ministers, industry: 'PSOE', finance: 'CNT', estado: 'CNT' } })),
  false,
  'Industry policy must be gated on holding the industry ministry',
);
assert.equal(
  industryPolicy.condition?.(governmentState({ industry_policy_timer: 3 })),
  false,
  'A cooling industry policy card must stay unavailable',
);
assert.equal(
  tradePolicy.condition?.(governmentState({ ministers: { ...PRE_START_STATE.ministers, industry: 'PSOE', finance: 'PSOE', estado: 'PSOE' } })),
  false,
  'Trade policy needs Foreign Affairs or Finance',
);
assert.equal(fiscalMeasures.condition?.(governmentState({})), true, 'Fiscal instruments need government + finance ministry');

// 工业与商业：五个实质选项各推进一个计数器。
const industryOptions: Array<[string, string]> = [
  ['Nationalize the railways', 'rail_nationalization'],
  ['Take over the coal mines', 'coal_nationalization'],
  ['Federate the workshops', 'industrial_cooperative'],
  ['Seize foreign-owned plants', 'foreign_capital_seizure'],
  ['Build the syndicalist supply network', 'supply_coordination_network'],
];
for (const [text, counter] of industryOptions) {
  const base = governmentState({});
  const event = eventFromCard(industryPolicy, base);
  const option = findOption(event, text);
  // The supply network requires an existing cooperative; give every probe that head start.
  const probe = { ...base, industrial_cooperative: 1, resources: 12 };
  assert(option.condition?.(probe) !== false, `${text} must be available in a prepared state`);
  const patch = option.effect(probe);
  assert.equal(patch[counter as keyof typeof patch], (probe as unknown as Record<string, number>)[counter] + 1, `${text} must advance ${counter}`);
  assert.equal(patch.industry_policy_timer, 6, `${text} must spend the industry cooldown`);
  assert.equal(patch.currentEvent, null, `${text} must close the card event`);
}

// 农业五项无上限：连点 8 次必须得到 8，而不是被夹在 5。
const agriculturalPolicyEvent = eventFromCard(agriculturalPolicy, governmentState({}));
const cooperativeOption = findOption(agriculturalPolicyEvent, 'Organize agricultural cooperatives');
let cooperativeState = governmentState({});
for (let step = 0; step < 8; step += 1) {
  const patch = cooperativeOption.effect(cooperativeState);
  cooperativeState = { ...cooperativeState, ...patch } as GameState;
  cooperativeState.agricultural_policy_timer = 0;
}
assert.equal(cooperativeState.agricultural_cooperative, 8, 'Agricultural cooperatives must be uncapped through the card path too');

// 有上限的计数器在卡牌路径上也要夹紧：铁路第 4 次点击必须不可用。
let railState = governmentState({});
for (let step = 0; step < 3; step += 1) {
  const event = eventFromCard(industryPolicy, railState);
  const option = findOption(event, 'Nationalize the railways');
  railState = { ...railState, ...option.effect(railState), industry_policy_timer: 0 } as GameState;
}
assert.equal(railState.rail_nationalization, 3, 'Railways must reach level 3');
assert.equal(
  findOption(eventFromCard(industryPolicy, railState), 'Nationalize the railways').condition?.(railState),
  false,
  'A maxed railway counter must hide its option',
);
assert.equal(
  railState.domesticPolicy.union_status >= 3,
  true,
  'Completing rail nationalization must push union status to collective bargaining',
);

// 战时门槛：外贸垄断与两项农业战时杠杆只在战争期间可选。
const wartimeOnly: Array<[Card, string]> = [
  [tradePolicy, 'single state office'],
  [agriculturalPolicy, 'Requisition the harvest'],
  [agriculturalPolicy, 'Issue family ration books'],
];
for (const [card, text] of wartimeOnly) {
  const peaceEvent = eventFromCard(card, governmentState({}));
  const option = findOption(peaceEvent, text);
  assert.equal(option.condition?.(governmentState({})), false, `${text} must be unavailable in peacetime`);
  assert.equal(
    option.condition?.(governmentState({ civilWarStatus: 'ongoing' })),
    true,
    `${text} must become available once the civil war is ongoing`,
  );
  assert(option.unavailableSubtitle, `${text} must explain why it is unavailable`);
  assert(option.unavailableSubtitleZh, `${text} must explain why it is unavailable in Chinese`);
}

// 家庭口粮本配给制：注入的补给必须落在玩家阵营的资源池上。
const rationOption = findOption(eventFromCard(agriculturalPolicy, governmentState({})), 'Issue family ration books');
const rationPatch = rationOption.effect(governmentState({ civilWarStatus: 'ongoing' }));
const republicanSuppliesBefore = PRE_START_STATE.mapResources[MapFaction.REPUBLICAN].supplies;
assert.equal(
  rationPatch.mapResources?.[MapFaction.REPUBLICAN].supplies,
  republicanSuppliesBefore + 120,
  'Family rationing must add supplies to the Republican war stock',
);
const iberianRationPatch = rationOption.effect(governmentState({
  civilWarStatus: 'ongoing',
  iberianDefense: { ...PRE_START_STATE.iberianDefense!, winner: null } as GameState['iberianDefense'],
}));
assert.equal(
  iberianRationPatch.mapResources?.[MapFaction.IBERIAN_DEFENSE].supplies,
  PRE_START_STATE.mapResources[MapFaction.IBERIAN_DEFENSE].supplies + 120,
  'With a defence committee the supplies must go to the committee stock instead',
);

// 财政手段：第三级废除货币必须把玩家送进确认事件。
let currencyState = governmentState({});
for (let step = 0; step < 3; step += 1) {
  const event = eventFromCard(fiscalMeasures, currencyState);
  const option = findOption(event, 'Advance the abolition of money');
  const patch = option.effect(currencyState);
  currencyState = { ...currencyState, ...patch, fiscal_measures_timer: 0 } as GameState;
  if (step < 2) {
    assert.equal(patch.currentEvent, null, `Currency level ${step + 1} must not open the confirmation event yet`);
  }
}
assert.equal(currencyState.currency_abolition, 3, 'Currency abolition must reach level 3');
assert.equal(
  findOption(eventFromCard(fiscalMeasures, currencyState), 'Advance the abolition of money').condition?.(currencyState),
  false,
  'The abolition option must hide once money is gone',
);

// 银行没收与兑换委员会各自把玩家送进 / 引出对应的事件。
const bankersPatch = findOption(eventFromCard(fiscalMeasures, governmentState({})), 'Seize the deposits').effect(governmentState({}));
assert.equal(bankersPatch.currentEvent?.id, 'bankers_panic', 'Bank seizure must hand the player to the panic event');
assert.equal(bankersPatch.private_bank_seizure, 1, 'Bank seizure must set its counter');
assert.equal(bankersPatch.budget, PRE_START_STATE.budget + 8, 'Bank seizure must move the deposits into the treasury');

const committeePatch = findOption(eventFromCard(fiscalMeasures, governmentState({})), 'Credit and Exchange Committee')
  .effect(governmentState({ mutual_credit_network: 3 }));
assert.equal(committeePatch.credit_exchange_committee, 1, 'The exchange committee must set its counter');

// 土地与自由：新增两个选项落计数器，且卡牌现在有自己的冷却。
assert.equal(
  landAndFreedom.condition?.({ ...PRE_START_STATE, land_and_freedom_timer: 3 }),
  false,
  'Land and Freedom must respect its new cooldown',
);
const landEvent = landAndFreedom.effect({ ...PRE_START_STATE, resources: 5 })?.currentEvent;
assert(landEvent, 'Land and Freedom must still open its event');
const requisitionPatch = findOption(landEvent!, 'Requisition the estates by force')
  .effect({ ...PRE_START_STATE, resources: 5, armaments: 5 });
assert.equal(requisitionPatch.land_requisition, 1, 'Armed requisition must advance the requisition ledger');
assert.equal(requisitionPatch.land_and_freedom_timer, 3, 'Armed requisition must spend the card cooldown');
const forcedPatch = findOption(landEvent!, 'Collectivize by force')
  .effect({ ...PRE_START_STATE, resources: 5, armaments: 5 });
assert.equal(forcedPatch.land_forced_collectivization, 1, 'Forced collectivization must advance its ledger');

// ---- 10. 顾问配方案：佩罗推 2 次、桑蒂利安推 3 次开路线（方案 §9.3） ----

const advisorState = (patch: Partial<GameState>): GameState => ({
  ...PRE_START_STATE,
  screen: 'game',
  ...patch,
});

const peiroPush = joanPeiro.actions.find(action => action.id === 'peiro_promote_cooperative_route');
const santillanPush = diegoAbadDeSantillan.actions.find(action => action.id === 'santillan_promote_organic_route');
assert(peiroPush, 'Joan Peiró must expose the cooperative programme action');
assert(santillanPush, 'Santillán must expose the organic programme action');

// Both actions must be bilingual and explain why they are unavailable.
for (const action of [peiroPush!, santillanPush!]) {
  assert(action.unavailableSubtitle, `${action.id} must provide an unavailable subtitle`);
  assert(action.unavailableSubtitleZh, `${action.id} must provide a Chinese unavailable subtitle`);
  assert(action.description && action.descriptionZh, `${action.id} must be bilingual`);
}

// Peiró: first push is small, second push opens the route.
let peiroState = advisorState({});
const firstPeiroPatch = peiroPush!.effect(peiroState);
assert.equal(firstPeiroPatch.currentEvent, null, 'The first cooperative push must not open the route yet');
assert.equal((firstPeiroPatch.economy?.cooperativePushes), 1, 'The first push must record itself');
assert.equal(firstPeiroPatch.agricultural_cooperative, 1, 'The first push must advance the cooperative ladder');
assert.equal(firstPeiroPatch.mutual_credit_network, 1, 'The first push must advance the mutual credit ladder');
assert.equal(firstPeiroPatch.advisorActionTimer, 6, 'A push must spend the shared advisor cooldown');
peiroState = { ...peiroState, ...firstPeiroPatch } as GameState;

const secondPeiroPatch = peiroPush!.effect(peiroState);
assert.equal(secondPeiroPatch.economy?.cooperativePushes, 2, 'The second push must reach the limit');
assert.equal(
  (secondPeiroPatch.currentEvent as GameEvent | null)?.id,
  'economy_cooperative_path',
  'The second cooperative push must open the Cooperative Road event',
);
peiroState = { ...peiroState, ...secondPeiroPatch, advisorActionTimer: 0 } as GameState;
assert.equal(
  peiroPush!.condition?.(peiroState),
  false,
  'The cooperative programme action must retire once the route is open',
);

// The event the advisor opens is what actually activates the journal.
const coopEventOption = economyCooperativePath.options[0];
const coopActivated = { ...peiroState, ...coopEventOption.effect(peiroState) };
assert.equal(
  coopActivated.journal.journal_economy_cooperative?.status,
  'active',
  'Confirming the Cooperative Road event must activate the cooperative journal',
);

// Santillán: three pushes, the third opens the route.
let santillanState = advisorState({});
for (let step = 1; step <= ORGANIC_ROUTE_PUSH_LIMIT; step += 1) {
  const patch = santillanPush!.effect(santillanState);
  assert.equal(patch.economy?.organicPushes, step, `Organic push ${step} must be recorded`);
  assert.equal(patch.advisorActionTimer, 6, 'Every organic push must spend the shared cooldown');
  if (step < ORGANIC_ROUTE_PUSH_LIMIT) {
    assert.equal(patch.currentEvent, null, `Organic push ${step} must not open the route yet`);
  } else {
    assert.equal(
      (patch.currentEvent as GameEvent | null)?.id,
      'economy_after_the_revolution',
      'The third organic push must open the After the Revolution event',
    );
  }
  santillanState = { ...santillanState, ...patch, advisorActionTimer: 0 } as GameState;
}
assert.equal(
  santillanPush!.condition?.(santillanState),
  false,
  'The organic programme action must retire once the route is open',
);
assert.equal(
  santillanState.foreign_capital_seizure,
  ORGANIC_ROUTE_PUSH_LIMIT,
  'Every organic push must advance the foreign capital ladder',
);

// The two push counters are independent.
assert.equal((peiroState.economy?.organicPushes ?? 0), 0, 'Peiró must not touch the organic counter');
assert.equal((santillanState.economy?.cooperativePushes ?? 0), 0, 'Santillán must not touch the cooperative counter');

// ---- 11. 面板读模型：只读、稳定、覆盖六条路线 ----

const viewModel = selectEconomyReformViewModel(opening);
assert.equal(viewModel.routeJournalIds.length, 6, 'The panel view model must expose all six routes');
assert.equal(
  selectEconomyReformViewModel(opening).routeJournalIds,
  viewModel.routeJournalIds,
  'The route list must be a shared constant, not rebuilt per call',
);
assert(
  areEconomyReformViewModelsEqual(viewModel, selectEconomyReformViewModel({ ...opening, month: opening.month + 1 })),
  'An unrelated state change must not invalidate the panel view model',
);
assert(
  !areEconomyReformViewModelsEqual(viewModel, selectEconomyReformViewModel({ ...opening, rail_nationalization: 1 })),
  'Advancing a counter must invalidate the panel view model',
);
assert(
  !areEconomyReformViewModelsEqual(viewModel, selectEconomyReformViewModel({
    ...opening,
    economy: { cooperativePushes: 1, organicPushes: 0 },
  })),
  'An advisor push must invalidate the panel view model',
);
// Every counter must be surfaced: the panel is the only place the player can read them.
for (const key of ECONOMY_COUNTERS) {
  assert.equal(typeof viewModel.counters[key], 'number', `${key} must be present in the panel view model`);
}

// ---- 12. 土地集体化日志（第 5C 期，方案 §13 + 工人控制度改造方案 §4.6）----
//
// 这本日志的完成条件不是计数器，而是**土地饼里的集体份额 ≥65%**：计数器是账本，
// 饼才是"地归谁"的真相。下面三条断言分别守住：门槛读饼、开始事件可达但不过早、
// 两条依赖它的路线读的是真日志而不是恒假占位。

const collectivizationJournal = getJournalEntryDef('journal_land_collectivization');
assert(collectivizationJournal, 'The land collectivization journal must be registered');
assert.equal(
  collectivizationJournal!.activationEventId,
  'land_collectivization_start',
  'Land collectivization may only be activated by its start event',
);
assert.equal(collectivizationJournal!.completionEventId, 'land_collectivization_complete');
assert.equal(collectivizationJournal!.failureEventId, 'land_collectivization_abandoned');

const collectivizationStart = findEvent('land_collectivization_start');
assert(collectivizationStart, 'The land collectivization start event must be restorable');
const startCondition = collectivizationStart!.condition!;

/** 开始事件的两个条件：土改过半（或已完成）**且**已经投过一次集体化。 */
const startProbe = (patch: Partial<GameState>): GameState => ({
  ...PRE_START_STATE,
  land_forced_collectivization: 0,
  land_voluntary_collectivization: 0,
  ...patch,
} as GameState);

assert.equal(
  startCondition(startProbe({ domesticPolicy: { ...PRE_START_STATE.domesticPolicy, land_reform_progress: 50 }, land_forced_collectivization: 1 })),
  true,
  'Half-done land reform plus one collectivization use must open the journal',
);
assert.equal(
  startCondition(startProbe({ domesticPolicy: { ...PRE_START_STATE.domesticPolicy, land_reform_progress: 49 }, land_forced_collectivization: 3 })),
  false,
  'A single collectivization use must not open the journal before the reform is half done',
);
assert.equal(
  startCondition(startProbe({ domesticPolicy: { ...PRE_START_STATE.domesticPolicy, land_reform_progress: 100 } })),
  false,
  'A finished land reform alone must not open the journal (the villages have not pooled anything yet)',
);
const journalState = (id: string, status: JournalStatus, progress = 0): JournalState => ({ id, status, progress });

assert.equal(
  startCondition(startProbe({
    journal: { ...PRE_START_STATE.journal, journal_land_collectivization: journalState('journal_land_collectivization', 'active') },
    domesticPolicy: { ...PRE_START_STATE.domesticPolicy, land_reform_progress: 60 },
    land_voluntary_collectivization: 1,
  })),
  false,
  'An already-open journal must not be opened twice',
);

// 门槛读饼，不读计数器：计数器灌满、饼没动，日志不得完成。
const counterFull = {
  ...opening,
  land_forced_collectivization: 9,
  land_voluntary_collectivization: 9,
  journal: { ...opening.journal, journal_land_collectivization: journalState('journal_land_collectivization', 'active') },
} as GameState;
assert.equal(
  collectivizationJournal!.checkStatus!(counterFull, counterFull.journal!['journal_land_collectivization']),
  null,
  'A full counter ledger must not complete the journal while the land pie still says otherwise',
);

const pieComplete = {
  ...counterFull,
  controlShares: {
    land: { church: 2, latifundia: 3, smallholders: 10, cooperative: 15, collective: 65, state: 5 },
    industry: counterFull.controlShares!.industry,
  },
} as GameState;
assert.equal(
  collectivizationJournal!.checkStatus!(pieComplete, pieComplete.journal!['journal_land_collectivization']),
  'completed',
  'A 65% collective share must complete the journal even with a modest counter ledger',
);

// 两条依赖它的路线：占位恒假已经拆掉，读的是真日志。
// 进度条是六个条件的最小值，因此必须把其余五个条件都置满，才能观察集体化这一项。
const freeCommuneReady = (collectivizationStatus: 'active' | 'completed'): GameState => ({
  ...opening,
  currency_abolition: 3,
  rail_nationalization: 3,
  coal_nationalization: 2,
  domesticPolicy: { ...opening.domesticPolicy, land_reform_progress: 100 },
  journal: {
    ...opening.journal,
    journal_land_reform: journalState('journal_land_reform', 'completed', 100),
    journal_land_collectivization: journalState('journal_land_collectivization', collectivizationStatus),
  },
  controlShares: {
    land: { church: 2, latifundia: 3, smallholders: 10, cooperative: 20, collective: 60, state: 5 },
    industry: { foreign: 0, bigCapital: 10, smallBusiness: 10, cooperative: 20, union: 55, state: 5 },
  },
} as GameState);

const freeCommuneProgressWithout = getJournalEntryDef('journal_economy_free_commune')!
  .getProgress!(freeCommuneReady('active'), journalState('journal_economy_free_commune', 'active'));
const freeCommuneProgressWith = getJournalEntryDef('journal_economy_free_commune')!
  .getProgress!(freeCommuneReady('completed'), journalState('journal_economy_free_commune', 'active'));
assert.equal(
  freeCommuneProgressWithout,
  0,
  'The free commune route must stall on the collectivization condition while the journal is open',
);
assert.equal(
  freeCommuneProgressWith,
  100,
  'Completing land collectivization must lift the free commune route out of its placeholder',
);

const afterTheRevolution = economyAfterTheRevolution;
assert(afterTheRevolution, 'The organic route start event must be restorable');
assert.equal(
  afterTheRevolution!.condition!({ ...freeCommuneReady('completed'), economy: { cooperativePushes: 0, organicPushes: 0 } }),
  false,
  'Land collectivization alone must not hand out the organic route: the advisor still has to make the case',
);
assert.equal(
  afterTheRevolution!.condition!({ ...freeCommuneReady('completed'), economy: { cooperativePushes: 0, organicPushes: ORGANIC_ROUTE_PUSH_LIMIT } }),
  true,
  'The second entry must open once Santillán has pushed the organic programme to its limit',
);

console.log(`Economy reform journals passed: ${ECONOMY_JOURNAL_IDS.length} route journals, ${RESTORABLE_EVENT_REGISTRY.length} restorable events.`);
