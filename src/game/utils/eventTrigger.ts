import type { GameEvent, GameState } from '../types';

export type EventTriggerMode = 'historical' | 'nonHistorical';

export type YearMonth = {
  year: number;
  month: number;
};

export interface ShouldQueueEventOptions {
  mode: EventTriggerMode;
  date?: YearMonth;
  pendingEvents?: GameEvent[];
  currentEvent?: GameEvent | null;
  respectHistory?: boolean;
}

export function isSameMonth(value: YearMonth, year: number, month: number): boolean {
  return value.year === year && value.month === month;
}

export function isAtOrAfter(value: YearMonth, year: number, month: number): boolean {
  return value.year > year || (value.year === year && value.month >= month);
}

export function isEventRepeatable(event: GameEvent): boolean {
  return event.repeatable ?? false;
}

export function hasEventBeenHandled(state: GameState, eventId: string): boolean {
  const history = state.eventHistory || { triggered: [], resolved: [] };
  return history.triggered.includes(eventId) || history.resolved.includes(eventId);
}

export function isEventAlreadyQueued(
  event: GameEvent,
  pendingEvents: GameEvent[] = [],
  currentEvent: GameEvent | null = null
): boolean {
  return pendingEvents.some(pe => pe.id === event.id) || currentEvent?.id === event.id;
}

export function eventConditionMatches(event: GameEvent, state: GameState): boolean {
  return event.condition ? event.condition(state) : false;
}

export function eventDateMatches(event: GameEvent, date: YearMonth): boolean {
  return event.date ? isSameMonth(event.date, date.year, date.month) : false;
}

export function shouldQueueEvent(
  event: GameEvent,
  state: GameState,
  options: ShouldQueueEventOptions
): boolean {
  const targetDate = options.date || { year: state.year, month: state.month };
  const effectiveState =
    targetDate.year === state.year && targetDate.month === state.month
      ? state
      : { ...state, year: targetDate.year, month: targetDate.month };

  if (isEventAlreadyQueued(event, options.pendingEvents, options.currentEvent)) {
    return false;
  }

  if ((options.respectHistory ?? true) && !isEventRepeatable(event) && hasEventBeenHandled(state, event.id)) {
    return false;
  }

  if (options.mode === 'historical') {
    if (event.date) {
      return eventDateMatches(event, targetDate) && (event.condition ? event.condition(effectiveState) : true);
    }
    return eventConditionMatches(event, effectiveState);
  }

  return eventConditionMatches(event, effectiveState);
}
