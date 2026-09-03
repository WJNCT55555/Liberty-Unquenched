import type { Advisor, Card, EventHistory, GameEvent } from '../types';
import type { DomainReducer, GameAction } from './types';
import { INITIAL_CARDS, INITIAL_EVENTS } from '../data';
import { INITIAL_ADVISORS } from '../advisors';
import { civilWarSetup } from '../events/civil_war/civil_war_setup';
import { addEasyUndoOption, createEasyConfirmationEvent } from '../easyMode';

const createEmptyEventHistory = (): EventHistory => ({ triggered: [], resolved: [] });

const appendEventHistoryId = (
  history: EventHistory | undefined,
  bucket: keyof EventHistory,
  eventId?: string | null,
): EventHistory => {
  const base = history || createEmptyEventHistory();
  if (!eventId || base[bucket].includes(eventId)) return base;
  return { ...base, [bucket]: [...base[bucket], eventId] };
};

const hydrateCards = (cards: Card[]) => cards.map(card => {
  const original = INITIAL_CARDS.find(candidate => candidate.id === card.id);
  return original ? { ...card, effect: original.effect, condition: original.condition } : card;
});

const hydrateAdvisors = (advisors: (Advisor | null)[]) => advisors.map(advisor => {
  if (!advisor) return null;
  const original = INITIAL_ADVISORS.find(candidate => candidate.id === advisor.id);
  if (!original) return advisor;
  return {
    ...advisor,
    actions: advisor.actions.map(action => {
      const originalAction = original.actions.find(candidate => candidate.id === action.id);
      return originalAction ? { ...action, condition: originalAction.condition, effect: originalAction.effect } : action;
    }),
  };
});

const hydrateEvents = (events: GameEvent[]) => events.map(event => {
  const original = INITIAL_EVENTS.find(candidate => candidate.id === event.id);
  if (!original) return event;
  return {
    ...event,
    condition: original.condition,
    options: event.options.map((option, index) => {
      const originalOption = original.options[index];
      return originalOption ? { ...option, condition: originalOption.condition, effect: originalOption.effect } : option;
    }),
  };
});

/** Handles event, card, advisor, and deck mutations. */
export const reduceEvent: DomainReducer = (state, action) => {
  switch (action.type) {
    case 'PLAY_CARD': {
      if (state.actionsLeft <= 0) return state;
      const cardPayload = action.payload;
      const card = INITIAL_CARDS.find(candidate => candidate.id === cardPayload.id) || cardPayload;
      if (typeof card.effect !== 'function') return state;
      if (card.resourceCost !== undefined && state.resources < card.resourceCost) return state;
      if (card.armamentCost !== undefined && state.armaments < card.armamentCost) return state;
      if (card.condition !== undefined && !card.condition(state)) return state;

      let newStateAfterCard = card.effect(state);
      if (state.difficulty === 'easy') {
        const easyEvent = newStateAfterCard.currentEvent
          ? addEasyUndoOption(newStateAfterCard.currentEvent)
          : createEasyConfirmationEvent(card, state);
        newStateAfterCard = { ...newStateAfterCard, currentEvent: easyEvent, easyUndoState: state };
      }
      return {
        ...state,
        ...newStateAfterCard,
        actionsLeft: state.actionsLeft - card.cost,
        resources: state.resources - (card.resourceCost || 0),
        armaments: state.armaments - (card.armamentCost || 0),
        hand: state.hand.filter(candidate => candidate.id !== cardPayload.id),
        discard: [...state.discard, cardPayload],
      };
    }
    case 'DISMISS_SUPER_EVENT': {
      let extra: Partial<typeof state> = {};
      let eventHistory = state.eventHistory || createEmptyEventHistory();
      if (state.superEvent === 'spanish_civil_war') {
        eventHistory = appendEventHistoryId(eventHistory, 'triggered', civilWarSetup.id);
        extra = { currentEvent: civilWarSetup, phase: 'event' };
      }
      return { ...state, superEvent: null, eventHistory, ...extra };
    }
    case 'SELECT_EVENT': {
      const selectedEvent = state.pendingEvents.find(event => event.id === action.payload.eventId);
      return selectedEvent
        ? {
            ...state,
            currentEvent: selectedEvent,
            pendingEvents: state.pendingEvents.filter(event => event.id !== action.payload.eventId),
            eventHistory: appendEventHistoryId(state.eventHistory, 'triggered', selectedEvent.id),
          }
        : state;
    }
    case 'RESOLVE_EVENT': {
      const newStateAfterEvent = action.payload(state);
      const nextCurrentEvent = newStateAfterEvent.currentEvent || null;
      const currentEventId = state.currentEvent?.id;
      const nextPendingEvents = currentEventId
        ? (newStateAfterEvent.pendingEvents || state.pendingEvents || []).filter(event => event.id !== currentEventId)
        : (newStateAfterEvent.pendingEvents || state.pendingEvents || []);
      let eventHistory = appendEventHistoryId(newStateAfterEvent.eventHistory || state.eventHistory, 'resolved', currentEventId);
      if (nextCurrentEvent) eventHistory = appendEventHistoryId(eventHistory, 'triggered', nextCurrentEvent.id);

      const nextState = {
        ...state,
        ...newStateAfterEvent,
        pendingEvents: nextPendingEvents,
        currentEvent: nextCurrentEvent,
        eventHistory,
      };
      if (!nextState.currentEvent && nextState.pendingEvents.length === 0 && nextState.phase === 'event') {
        nextState.phase = 'action';
        nextState.actionsLeft = 2;
      }
      return nextState;
    }
    case 'ADD_ADVISOR': {
      const { advisor, slotIndex } = action.payload;
      const activeAdvisors = [...state.activeAdvisors];
      const oldAdvisor = activeAdvisors[slotIndex];
      activeAdvisors[slotIndex] = advisor;
      const advisorPool = state.advisorPool.filter(candidate => candidate.id !== advisor.id);
      if (oldAdvisor) advisorPool.push(oldAdvisor);
      return { ...state, activeAdvisors, advisorPool };
    }
    case 'REMOVE_ADVISOR': {
      const { slotIndex } = action.payload;
      const activeAdvisors = [...state.activeAdvisors];
      const oldAdvisor = activeAdvisors[slotIndex];
      if (!oldAdvisor) return state;
      activeAdvisors[slotIndex] = null;
      return { ...state, activeAdvisors, advisorPool: [...state.advisorPool, oldAdvisor] };
    }
    case 'DRAW_CARD': {
      const handLimit = state.difficulty === 'hard' ? 3 : 4;
      if (state.hand.length >= handLimit) return state;
      const cardType = action.payload;
      let sourceDeck = cardType === 'Action'
        ? state.actionDeck
        : cardType === 'Governmental' ? state.governmentDeck : state.militaryDeck;
      let availableCards = sourceDeck.filter(card => card.condition ? card.condition(state) : true);
      let actionDeck = [...state.actionDeck];
      let governmentDeck = [...state.governmentDeck];
      let militaryDeck = [...state.militaryDeck];
      let discard = [...state.discard];

      if (availableCards.length === 0) {
        const discardedOfType = state.discard.filter(card => cardType === 'Governmental' ? card.type === 'Government' : card.type === cardType);
        if (discardedOfType.length === 0) return state;
        if (cardType === 'Action') { actionDeck = [...actionDeck, ...discardedOfType]; sourceDeck = actionDeck; }
        else if (cardType === 'Governmental') { governmentDeck = [...governmentDeck, ...discardedOfType]; sourceDeck = governmentDeck; }
        else { militaryDeck = [...militaryDeck, ...discardedOfType]; sourceDeck = militaryDeck; }
        discard = discard.filter(card => cardType === 'Governmental' ? card.type !== 'Government' : card.type !== cardType);
        availableCards = sourceDeck.filter(card => card.condition ? card.condition(state) : true);
        if (availableCards.length === 0) return state;
      }

      const drawnCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      if (cardType === 'Action') actionDeck = actionDeck.filter(card => card.id !== drawnCard.id);
      else if (cardType === 'Governmental') governmentDeck = governmentDeck.filter(card => card.id !== drawnCard.id);
      else militaryDeck = militaryDeck.filter(card => card.id !== drawnCard.id);
      return { ...state, hand: [...state.hand, drawnCard], actionDeck, governmentDeck, militaryDeck, discard };
    }
    case 'DRAW_SPECIFIC_CARD': {
      const handLimit = state.difficulty === 'hard' ? 3 : 4;
      if (state.hand.length >= handLimit) return state;
      const { cardId, deckType } = action.payload;
      const sourceDeck = deckType === 'Action' ? state.actionDeck : deckType === 'Governmental' ? state.governmentDeck : state.militaryDeck;
      const card = sourceDeck.find(candidate => candidate.id === cardId);
      if (!card) return state;
      return {
        ...state,
        hand: [...state.hand, card],
        actionDeck: deckType === 'Action' ? state.actionDeck.filter(candidate => candidate.id !== cardId) : state.actionDeck,
        governmentDeck: deckType === 'Governmental' ? state.governmentDeck.filter(candidate => candidate.id !== cardId) : state.governmentDeck,
        militaryDeck: deckType === 'Military' ? state.militaryDeck.filter(candidate => candidate.id !== cardId) : state.militaryDeck,
      };
    }
    case 'CHECK_EVENT':
      return state.pendingEvents.length > 0 ? { ...state } : { ...state, phase: 'action', actionsLeft: 2 };
    default:
      return null;
  }
};

export type EventAction = Extract<GameAction, {
  type: 'PLAY_CARD' | 'DISMISS_SUPER_EVENT' | 'SELECT_EVENT' | 'RESOLVE_EVENT'
    | 'ADD_ADVISOR' | 'REMOVE_ADVISOR' | 'DRAW_CARD' | 'DRAW_SPECIFIC_CARD' | 'CHECK_EVENT'
}>;

export { hydrateCards, hydrateAdvisors, hydrateEvents };
