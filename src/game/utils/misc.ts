import { GameEvent, GameState } from '../types';

export function withCurrentDate(event: GameEvent, state: Pick<GameState, 'year' | 'month'>): GameEvent {
  return {
    ...event,
    date: { year: state.year, month: state.month }
  };
}
