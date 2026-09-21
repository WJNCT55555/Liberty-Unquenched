import type { CoalitionId, GameEvent, GameState } from '../types';
import { COALITION_DEFS } from '../coalitions';

const coalitionDissolutionMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  series: ['coalitions'],
  tags: ['journal'],
};

const createCoalitionDissolutionEvent = (id: CoalitionId): GameEvent => {
  const definition = COALITION_DEFS.find(coalition => coalition.id === id);
  if (!definition) throw new Error(`Missing coalition definition for dissolution event: ${id}`);

  return {
    id: `coalition_dissolved_${id}`,
    meta: coalitionDissolutionMeta,
    condition: () => false,
    repeatable: true,
    title: `${definition.name} Ends`,
    titleZh: `${definition.nameZh}结束`,
    description: `The agreement sustaining the ${definition.name} has ended. Its member parties are no longer bound by this coalition, and any government or opposition arrangement based on it must now be replaced by a new political settlement.`,
    descriptionZh: `维系${definition.nameZh}的共同协议已经终止。成员政党不再受该联盟约束，以其为基础的执政或反对派安排必须由新的政治协议取代。`,
    options: [
      {
        text: 'Record the end of the coalition.',
        textZh: '记录该联盟的终结。',
        effect: () => ({ currentEvent: null }),
      },
    ],
  };
};

/** Save-restorable notification definitions, one stable id per coalition. */
export const coalitionDissolutionEvents: GameEvent[] = COALITION_DEFS.map(definition => (
  createCoalitionDissolutionEvent(definition.id)
));

const coalitionDissolutionEventIds = new Set(coalitionDissolutionEvents.map(event => event.id));

export const isCoalitionDissolutionEventId = (eventId?: string | null): boolean => (
  Boolean(eventId && coalitionDissolutionEventIds.has(eventId))
);

const coalitionDissolutionEventById = new Map<CoalitionId, GameEvent>(
  COALITION_DEFS.map((definition, index) => [definition.id, coalitionDissolutionEvents[index]]),
);

/**
 * Queue visible notices for coalitions that just ceased to exist. Direct queueing
 * deliberately ignores handled-event history because the same coalition may form
 * and end more than once in a campaign.
 */
export const queueCoalitionDissolutionEvents = (
  state: GameState,
  coalitionIds: readonly CoalitionId[],
): GameState => {
  const alreadyQueued = new Set([
    state.currentEvent?.id,
    ...state.pendingEvents.map(event => event.id),
  ]);
  const notices = [...new Set(coalitionIds)]
    .map(id => coalitionDissolutionEventById.get(id))
    .filter((event): event is GameEvent => Boolean(event) && !alreadyQueued.has(event.id));

  return notices.length > 0
    ? { ...state, pendingEvents: [...notices, ...state.pendingEvents] }
    : state;
};
