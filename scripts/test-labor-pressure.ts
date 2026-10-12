import assert from 'node:assert/strict';
import type { GameState } from '../src/game/types';
import { createScenarioState } from '../src/game/scenarios';
import { strike } from '../src/game/action_affairs/strike';
import { mitinPopular } from '../src/game/action_affairs/mitin_popular';
import {
  addLaborPressure,
  getLaborPressureCampaign,
  getLaborPressureResistance,
  getLaborPressureThreshold,
  settleLaborPressure,
} from '../src/game/rules/laborPressure';
import { advancePhase } from '../src/game/rules/phaseOrchestrator';
import { serializeGameState, deserializeGameState } from '../src/game/saveGame';
import { CARD_REGISTRY } from '../src/game/registries/cardRegistry';
import { INITIAL_ADVISORS } from '../src/game/advisors';
import { RESTORABLE_EVENT_REGISTRY } from '../src/game/registries/restorableEventRegistry';
import { reduceEvent } from '../src/game/reducers/eventReducer';

const original = createScenarioState('1931', 'normal', 'zh');
const strikeEvent = strike.effect(original).currentEvent!;
const workersStrike = strikeEvent.options.find(option => option.textZh === '推动工人权利的罢工')!;
const strikePatch = workersStrike.effect(original);
assert.equal(strikePatch.domesticPolicy, undefined);
assert.equal(strikePatch.currentEvent?.id, 'strike_labor_pressure_choice');
assert.equal(strikePatch.classes?.Obreros.support.CNT_FAI, original.classes.Obreros.support.CNT_FAI + 2);

const chooseWages = strikePatch.currentEvent!.options.find(option => option.textZh === '争取更强的最低工资保障')!;
const chosen = chooseWages.effect({ ...original, ...strikePatch, currentEvent: strikePatch.currentEvent! });
assert.equal(chosen.laborPressure?.points, 2);
assert.equal(chosen.laborPressure?.targetLevel, 1);
assert.equal(chosen.domesticPolicy, undefined);
assert.equal(chosen.currentEvent, null);

const assemblyEvent = mitinPopular.effect(original).currentEvent!;
const economicAssembly = assemblyEvent.options.find(option => option.textZh === '为了面包与工作！')!;
const assemblyPatch = economicAssembly.effect(original);
assert.equal(assemblyPatch.domesticPolicy, undefined);
assert.equal(assemblyPatch.currentEvent?.id, 'assembly_labor_pressure_choice');
assert.equal(assemblyPatch.classes?.Obreros.support.CNT_FAI > original.classes.Obreros.support.CNT_FAI, true);
const assemblyChoice = assemblyPatch.currentEvent!.options.find(option => option.textZh === '争取更强的最低工资保障')!;
const afterAssembly = assemblyChoice.effect({ ...original, ...chosen, ...assemblyPatch, currentEvent: assemblyPatch.currentEvent! });
assert.equal(afterAssembly.laborPressure?.points, 3);

const bridge = assemblyEvent.options.find(option => option.textZh === '集会逐渐升级为一场罢工。')!;
const bridgeReady: GameState = {
  ...original,
  resources: 1,
  unionShare: { ...original.unionShare!, CNT: 30, unorganized: original.unionShare!.unorganized - (30 - original.unionShare!.CNT) },
};
assert.equal(bridge.condition?.(bridgeReady), true);
assert.equal(bridge.effect(bridgeReady).resources, 0);
assert.equal(bridge.condition?.({ ...bridgeReady, resources: 0 }), false);

const playedStrike = reduceEvent({
  ...original,
  phase: 'action',
  actionsLeft: 2,
  resources: 3,
  hand: [strike],
}, { type: 'PLAY_CARD', payload: strike });
assert.equal(playedStrike.resources, 2);
assert.equal(playedStrike.actionsLeft, 1);
const selectedStrike = reduceEvent(playedStrike, { type: 'RESOLVE_EVENT', payload: workersStrike.effect });
assert.equal(selectedStrike.currentEvent?.id, 'strike_labor_pressure_choice');
const committedStrike = reduceEvent(selectedStrike, { type: 'RESOLVE_EVENT', payload: chooseWages.effect });
assert.equal(committedStrike.resources, 2);
assert.equal(committedStrike.laborPressure?.points, 2);

const playedAssembly = reduceEvent({
  ...bridgeReady,
  phase: 'action',
  actionsLeft: 2,
  hand: [mitinPopular],
}, { type: 'PLAY_CARD', payload: mitinPopular });
const escalated = reduceEvent(playedAssembly, { type: 'RESOLVE_EVENT', payload: bridge.effect });
assert.equal(escalated.resources, 0);
assert.equal(escalated.currentEvent?.id, 'strike_event');
const committedEscalation = reduceEvent(
  reduceEvent(escalated, { type: 'RESOLVE_EVENT', payload: workersStrike.effect }),
  { type: 'RESOLVE_EVENT', payload: chooseWages.effect },
);
assert.equal(committedEscalation.actionsLeft, 1);
assert.equal(committedEscalation.laborPressure?.points, 2);

const target = 'min_wage' as const;
const threshold = getLaborPressureThreshold(original, target, 1);
assert.equal(threshold, 3 + getLaborPressureResistance(original, target, 1).total);
assert.equal(getLaborPressureResistance({ ...original, ministers: { ...original.ministers, labor: 'Other' } }, target, 1).ministry, 1);
let campaign: GameState = { ...original, laborPressure: afterAssembly.laborPressure };
campaign = { ...campaign, ...addLaborPressure(campaign, target, 2) };
assert.equal(campaign.laborPressure?.points, 5);
assert.ok(campaign.laborPressure!.points >= threshold);
const beforeLaw = campaign.domesticPolicy.min_wage;
const settled = settleLaborPressure(campaign);
assert.equal(settled.enactedLawId, target);
assert.equal(settled.patch.domesticPolicy?.min_wage, beforeLaw + 1);
assert.equal(settled.patch.laborPressure, null);

const monthly = advancePhase({ ...campaign, phase: 'action', currentEvent: null, pendingEvents: [] }, {
  finishPlayerMapTurn: state => state,
  checkWarStatus: state => state,
});
assert.equal(monthly.domesticPolicy.min_wage, beforeLaw + 1);
assert.equal(monthly.laborPressure, null);
assert.ok(monthly.pendingEvents.some(event => event.id === 'labor_pressure_min_wage_enacted'));
const repeatCampaign: GameState = {
  ...campaign,
  domesticPolicy: { ...campaign.domesticPolicy, min_wage: 1 },
  laborPressure: { ...campaign.laborPressure!, targetLevel: 2, points: 8 },
  eventHistory: {
    ...campaign.eventHistory,
    resolved: [...campaign.eventHistory.resolved, 'labor_pressure_min_wage_enacted'],
  },
  phase: 'action',
  currentEvent: null,
  pendingEvents: [],
};
const repeated = advancePhase(repeatCampaign, {
  finishPlayerMapTurn: state => state,
  checkWarStatus: state => state,
});
assert.equal(repeated.domesticPolicy.min_wage, 2);
assert.ok(repeated.pendingEvents.some(event => event.id === 'labor_pressure_min_wage_enacted'));

const switched = addLaborPressure(campaign, 'workplace_safety', 1);
assert.equal(switched.laborPressure?.points, 1);
const idleCampaign: GameState = {
  ...campaign,
  laborPressure: { ...campaign.laborPressure!, points: 1 },
  year: original.year,
  month: original.month + 6,
};
assert.equal(settleLaborPressure(idleCampaign).patch.laborPressure, null);
const alreadyChanged: GameState = {
  ...campaign,
  domesticPolicy: { ...campaign.domesticPolicy, min_wage: campaign.laborPressure!.targetLevel },
};
assert.equal(settleLaborPressure(alreadyChanged).patch.laborPressure, null);
assert.equal(getLaborPressureCampaign(alreadyChanged), null);
const crisis: GameState = {
  ...campaign,
  governmentCrisis: {
    sequence: 1,
    coalitionId: 'republican_socialist',
    cause: 'scripted',
    occurredAt: { year: original.year, month: original.month },
  },
};
assert.equal(settleLaborPressure(crisis).patch.laborPressure?.points, campaign.laborPressure?.points);
assert.equal(settleLaborPressure(crisis).patch.laborPressure?.nextDecayMonth, campaign.laborPressure!.nextDecayMonth + 1);
assert.equal(settleLaborPressure({ ...campaign, civilWarStatus: 'ongoing' }).patch.laborPressure, null);
const rolledBack: GameState = {
  ...campaign,
  laborPressure: { ...campaign.laborPressure!, targetLevel: 2 },
  domesticPolicy: { ...campaign.domesticPolicy, min_wage: 0 },
};
assert.equal(getLaborPressureCampaign(rolledBack)?.targetLevel, 1);
assert.equal(getLaborPressureCampaign(rolledBack)?.points, campaign.laborPressure?.points);

const choiceState: GameState = { ...original, ...strikePatch, currentEvent: strikePatch.currentEvent! };
const restored = deserializeGameState(serializeGameState(choiceState), {
  cards: CARD_REGISTRY,
  advisors: INITIAL_ADVISORS,
  events: RESTORABLE_EVENT_REGISTRY,
});
assert.equal(restored.currentEvent?.id, 'strike_labor_pressure_choice');
const restoredChoice = restored.currentEvent!.options.find(option => option.textZh === '争取更强的最低工资保障')!;
assert.equal(restoredChoice.effect(restored).laborPressure?.points, 2);

const assemblyChoiceState: GameState = { ...original, ...assemblyPatch, currentEvent: assemblyPatch.currentEvent! };
const restoredAssembly = deserializeGameState(serializeGameState(assemblyChoiceState), {
  cards: CARD_REGISTRY,
  advisors: INITIAL_ADVISORS,
  events: RESTORABLE_EVENT_REGISTRY,
});
assert.equal(restoredAssembly.currentEvent?.id, 'assembly_labor_pressure_choice');
assert.equal(restoredAssembly.currentEvent!.options[0].effect(restoredAssembly).laborPressure?.points, 1);

console.log('Labor pressure cards, month settlement, decay, switching, and save restoration passed.');
