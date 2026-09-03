import type { EventHistory, GameState } from '../types';
import type { DomainReducer } from './types';
import { INITIAL_EVENTS } from '../data';
import { hydrateAdvisors, hydrateCards, hydrateEvents } from './eventReducer';
import { normalizeOrganizationState } from '../organizations';

const isBeforeYearMonth = (date: { year: number; month: number }, year: number, month: number) =>
  date.year < year || (date.year === year && date.month < month);

const createLegacySaveEventHistory = (state: Pick<GameState, 'year' | 'month'>): EventHistory => ({
  triggered: [],
  resolved: INITIAL_EVENTS
    .filter(event => event.date && isBeforeYearMonth(event.date, state.year, state.month))
    .map(event => event.id),
});

/** Handles save/load transitions and keeps persisted data independent of UI state. */
export const reduceSave: DomainReducer = (state, action) => {
  switch (action.type) {
    case 'RETURN_TO_START':
      return { ...state, screen: 'start' };
    case 'LOAD_STATE': {
      const payload = action.payload;
      const normalizedPayload = normalizeOrganizationState(payload);
      return {
        ...normalizedPayload,
        screen: 'game',
        hand: hydrateCards(payload.hand || []),
        actionDeck: hydrateCards(payload.actionDeck || []),
        governmentDeck: hydrateCards(payload.governmentDeck || []),
        militaryDeck: hydrateCards(payload.militaryDeck || []),
        discard: hydrateCards(payload.discard || []),
        activeAdvisors: hydrateAdvisors(payload.activeAdvisors || [null, null, null]),
        advisorPool: hydrateAdvisors(payload.advisorPool || []) as NonNullable<GameState['advisorPool']>,
        pendingEvents: hydrateEvents(payload.pendingEvents || []),
        currentEvent: payload.currentEvent ? hydrateEvents([payload.currentEvent])[0] : null,
        eventHistory: payload.eventHistory || createLegacySaveEventHistory(payload),
      };
    }
    default:
      return null;
  }
};

export type SaveState = Pick<GameState,
  | 'screen'
  | 'eventHistory'
  | 'hand'
  | 'actionDeck'
  | 'governmentDeck'
  | 'militaryDeck'
  | 'discard'
  | 'activeAdvisors'
  | 'advisorPool'
  | 'pendingEvents'
  | 'currentEvent'
>;
