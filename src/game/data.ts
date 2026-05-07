import { Card, GameEvent } from './types';
import { ACTION_AFFAIRS } from './action_affairs';
import { GOVERNMENT_AFFAIRS } from './government_affairs';
import { MILITARY_AFFAIRS } from './military_affairs';
import { INITIAL_EVENTS as EVENTS } from './events';

export const INITIAL_CARDS: Card[] = [
  ...ACTION_AFFAIRS,
  ...GOVERNMENT_AFFAIRS,
  ...MILITARY_AFFAIRS
];

export const INITIAL_EVENTS: GameEvent[] = EVENTS;

