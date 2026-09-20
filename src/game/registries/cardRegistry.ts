import type { Card } from '../types';
import { ACTION_AFFAIRS } from '../action_affairs';
import { GOVERNMENT_AFFAIRS } from '../government_affairs';
import { MILITARY_AFFAIRS } from '../military_affairs';
import { defineUniqueRegistry } from './registryUtils';

/** Runtime card definitions. This module deliberately has no event-scheduler dependency. */
export const CARD_REGISTRY: Card[] = defineUniqueRegistry('card', [
  ...ACTION_AFFAIRS,
  ...GOVERNMENT_AFFAIRS,
  ...MILITARY_AFFAIRS,
]);
