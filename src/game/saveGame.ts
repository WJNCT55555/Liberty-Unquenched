import type { Advisor, Card, GameEvent, GameState } from './types';
import { addEasyUndoOption, createEasyConfirmationEvent } from './easyMode';
import { normalizeOrganizationState } from './organizations';

export const SAVE_FORMAT = 'cnt-fai-save' as const;
export const SAVE_FORMAT_VERSION = 2 as const;
export const SAVE_LIBRARY_VERSION = 2 as const;
export const SAVE_LIBRARY_KEY = 'cnt_fai_saves_v2';
export const MANUAL_SAVE_SLOT_COUNT = 6;

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface SerializedGameEvent {
  id: string;
  data: JsonObject;
}

export interface SaveGameSnapshotV2 {
  format: typeof SAVE_FORMAT;
  version: typeof SAVE_FORMAT_VERSION;
  state: JsonObject;
  runtime: {
    hand: string[];
    actionDeck: string[];
    governmentDeck: string[];
    militaryDeck: string[];
    discard: string[];
    activeAdvisors: Array<string | null>;
    advisorPool: string[];
    pendingEvents: SerializedGameEvent[];
    currentEvent: SerializedGameEvent | null;
    easyUndoState: SaveGameSnapshotV2 | null;
  };
}

export type SaveGameSnapshot = SaveGameSnapshotV2;

export interface SaveSummary {
  scenario: GameState['scenario'];
  difficulty: GameState['difficulty'];
  year: number;
  month: number;
  phase: GameState['phase'];
}

export interface SaveRecord {
  savedAt: string;
  summary: SaveSummary;
  snapshot: SaveGameSnapshot;
}

export interface ManualSaveSlot {
  id: string;
  name: string;
  record: SaveRecord | null;
}

export interface SaveLibrary {
  version: typeof SAVE_LIBRARY_VERSION;
  autosave: SaveRecord | null;
  manualSlots: ManualSaveSlot[];
}

export interface SaveRuntimeCatalog {
  cards: Card[];
  advisors: Advisor[];
  events: GameEvent[];
}

const runtimeStateKeys = new Set<keyof GameState>([
  'hand',
  'actionDeck',
  'governmentDeck',
  'militaryDeck',
  'discard',
  'activeAdvisors',
  'advisorPool',
  'pendingEvents',
  'currentEvent',
  'easyUndoState',
]);

const sanitizeJson = (value: unknown): JsonValue => {
  const json = JSON.stringify(value, (_key, nestedValue) => {
    if (typeof nestedValue === 'function' || typeof nestedValue === 'symbol' || nestedValue === undefined) {
      return undefined;
    }
    return nestedValue;
  });

  if (json === undefined) return null;
  return JSON.parse(json) as JsonValue;
};

const serializeEvent = (event: GameEvent): SerializedGameEvent => ({
  id: event.id,
  data: sanitizeJson(event) as JsonObject,
});

const cardIds = (cards: Card[] | undefined): string[] => (cards || []).map((card) => card.id);

export const serializeGameState = (state: GameState): SaveGameSnapshot => {
  const plainState = Object.fromEntries(
    Object.entries(state).filter(([key]) => !runtimeStateKeys.has(key as keyof GameState)),
  );

  return {
    format: SAVE_FORMAT,
    version: SAVE_FORMAT_VERSION,
    state: sanitizeJson(plainState) as JsonObject,
    runtime: {
      hand: cardIds(state.hand),
      actionDeck: cardIds(state.actionDeck),
      governmentDeck: cardIds(state.governmentDeck),
      militaryDeck: cardIds(state.militaryDeck),
      discard: cardIds(state.discard),
      activeAdvisors: (state.activeAdvisors || []).map((advisor) => advisor?.id || null),
      advisorPool: (state.advisorPool || []).map((advisor) => advisor.id),
      pendingEvents: (state.pendingEvents || []).map(serializeEvent),
      currentEvent: state.currentEvent ? serializeEvent(state.currentEvent) : null,
      easyUndoState: state.easyUndoState ? serializeGameState(state.easyUndoState) : null,
    },
  };
};

export const isSaveGameSnapshot = (value: unknown): value is SaveGameSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveGameSnapshot>;
  return candidate.format === SAVE_FORMAT
    && candidate.version === SAVE_FORMAT_VERSION
    && Boolean(candidate.state && typeof candidate.state === 'object')
    && Boolean(candidate.runtime && typeof candidate.runtime === 'object');
};

const cloneForProbe = (state: GameState, currentEvent: GameEvent | null): GameState => {
  const clone = sanitizeJson(state) as unknown as GameState;
  clone.currentEvent = currentEvent;
  clone.pendingEvents = [];
  clone.hand = state.hand;
  clone.actionDeck = state.actionDeck;
  clone.governmentDeck = state.governmentDeck;
  clone.militaryDeck = state.militaryDeck;
  clone.discard = state.discard;
  clone.activeAdvisors = state.activeAdvisors;
  clone.advisorPool = state.advisorPool;
  return clone;
};

const randomSequences = [
  [0.01, 0.01, 0.01],
  [0.99, 0.01, 0.01],
  [0.99, 0.99, 0.01],
  [0.99, 0.99, 0.99],
  [0.5, 0.5, 0.5],
];

const withDeterministicRandom = <T>(sequence: number[], callback: () => T): T => {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => sequence[Math.min(index++, sequence.length - 1)] ?? 0.5;
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
};

const collectEventsFromPartial = (partial: Partial<GameState> | undefined): GameEvent[] => {
  if (!partial) return [];
  return [
    ...(partial.currentEvent ? [partial.currentEvent] : []),
    ...(partial.pendingEvents || []),
  ];
};

const buildEventCatalog = (
  state: GameState,
  runtime: SaveRuntimeCatalog,
  requiredIds: Set<string>,
): Map<string, GameEvent> => {
  const eventMap = new Map<string, GameEvent>();
  const queue: GameEvent[] = [];

  const register = (event: GameEvent | null | undefined) => {
    if (!event || eventMap.has(event.id)) return;
    eventMap.set(event.id, event);
    queue.push(event);
  };

  runtime.events.forEach(register);

  const hasEveryRequiredEvent = () => [...requiredIds].every((id) => eventMap.has(id));
  if (hasEveryRequiredEvent()) return eventMap;

  for (const card of runtime.cards) {
    try {
      const probe = cloneForProbe(state, null);
      const generatedEvents = collectEventsFromPartial(card.effect(probe));
      if (state.difficulty === 'easy' && state.easyUndoState) {
        generatedEvents.map(addEasyUndoOption).forEach(register);
        register(createEasyConfirmationEvent(card, state));
      } else {
        generatedEvents.forEach(register);
      }
    } catch {
      // A card may require a story state that the loaded save does not have.
    }
  }

  for (const advisor of runtime.advisors) {
    for (const action of advisor.actions) {
      try {
        const probe = cloneForProbe(state, null);
        collectEventsFromPartial(action.effect(probe)).forEach(register);
      } catch {
        // Advisor actions without a generated event do not need to be restorable here.
      }
    }
  }

  const explored = new Set<string>();
  const maximumExploredEvents = 400;

  while (queue.length > 0 && explored.size < maximumExploredEvents && !hasEveryRequiredEvent()) {
    const event = queue.shift()!;
    if (explored.has(event.id)) continue;
    explored.add(event.id);

    for (const option of event.options) {
      for (const randomSequence of randomSequences) {
        try {
          const probe = cloneForProbe(state, event);
          const result = withDeterministicRandom(randomSequence, () => option.effect(probe));
          collectEventsFromPartial(result).forEach(register);
        } catch {
          // Some branches deliberately assume a very specific story state. Other
          // branches and the saved presentation data remain available for matching.
        }
      }
    }
  }

  return eventMap;
};

const getString = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined;

const restoreEvent = (saved: SerializedGameEvent, definition: GameEvent): GameEvent => {
  const savedData = saved.data as Record<string, unknown>;
  const savedOptions = Array.isArray(savedData.options)
    ? savedData.options.filter((option): option is Record<string, unknown> => Boolean(option && typeof option === 'object'))
    : [];
  const usedDefinitionOptions = new Set<number>();

  const options = savedOptions.length > 0
    ? savedOptions.map((savedOption, savedIndex) => {
        const savedText = getString(savedOption.text);
        const savedTextZh = getString(savedOption.textZh);
        let definitionIndex = definition.options.findIndex((option, index) => {
          if (usedDefinitionOptions.has(index)) return false;
          return (savedText && typeof option.text === 'string' && option.text === savedText)
            || (savedTextZh && typeof option.textZh === 'string' && option.textZh === savedTextZh);
        });
        if (definitionIndex < 0 && definition.options[savedIndex] && !usedDefinitionOptions.has(savedIndex)) {
          definitionIndex = savedIndex;
        }
        const definitionOption = definition.options[definitionIndex];
        if (!definitionOption) {
          throw new Error(`Event "${saved.id}" option ${savedIndex + 1} no longer has a runtime definition.`);
        }
        usedDefinitionOptions.add(definitionIndex);
        return {
          ...definitionOption,
          ...savedOption,
          text: savedOption.text as GameEvent['options'][number]['text'] ?? definitionOption.text,
          textZh: savedOption.textZh as GameEvent['options'][number]['textZh'] ?? definitionOption.textZh,
          unavailableSubtitle: definitionOption.unavailableSubtitle,
          unavailableSubtitleZh: definitionOption.unavailableSubtitleZh,
          condition: definitionOption.condition,
          effectPreview: definitionOption.effectPreview,
          effect: definitionOption.effect,
        };
      })
    : definition.options;

  return {
    ...definition,
    ...savedData,
    id: saved.id,
    title: (savedData.title as GameEvent['title'] | undefined) ?? definition.title,
    titleZh: (savedData.titleZh as GameEvent['titleZh'] | undefined) ?? definition.titleZh,
    condition: definition.condition,
    renderContent: definition.renderContent,
    options,
  } as GameEvent;
};

const requireById = <T extends { id: string }>(items: T[], id: string, kind: string): T => {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`${kind} "${id}" is missing from the current game version.`);
  return item;
};

export const deserializeGameState = (
  snapshot: SaveGameSnapshot,
  runtime: SaveRuntimeCatalog,
): GameState => {
  if (!isSaveGameSnapshot(snapshot)) {
    throw new Error('Unsupported or damaged save-game format.');
  }

  const state = sanitizeJson(snapshot.state) as unknown as GameState;
  const restoreCards = (ids: string[]) => ids.map((id) => requireById(runtime.cards, id, 'Card'));
  const restoreAdvisor = (id: string) => requireById(runtime.advisors, id, 'Advisor');

  state.hand = restoreCards(snapshot.runtime.hand || []);
  state.actionDeck = restoreCards(snapshot.runtime.actionDeck || []);
  state.governmentDeck = restoreCards(snapshot.runtime.governmentDeck || []);
  state.militaryDeck = restoreCards(snapshot.runtime.militaryDeck || []);
  state.discard = restoreCards(snapshot.runtime.discard || []);
  state.activeAdvisors = (snapshot.runtime.activeAdvisors || []).map((id) => id ? restoreAdvisor(id) : null);
  state.advisorPool = (snapshot.runtime.advisorPool || []).map(restoreAdvisor);
  state.pendingEvents = [];
  state.currentEvent = null;
  state.easyUndoState = snapshot.runtime.easyUndoState
    ? deserializeGameState(snapshot.runtime.easyUndoState, runtime)
    : null;

  const serializedEvents = [
    ...(snapshot.runtime.pendingEvents || []),
    ...(snapshot.runtime.currentEvent ? [snapshot.runtime.currentEvent] : []),
  ];
  const requiredEventIds = new Set(serializedEvents.map((event) => event.id));
  const eventCatalog = buildEventCatalog(state, runtime, requiredEventIds);
  const hydrateEvent = (event: SerializedGameEvent) => {
    const definition = eventCatalog.get(event.id);
    if (!definition) {
      throw new Error(`Event "${event.id}" cannot be restored by the current game version.`);
    }
    return restoreEvent(event, definition);
  };

  state.pendingEvents = (snapshot.runtime.pendingEvents || []).map(hydrateEvent);
  state.currentEvent = snapshot.runtime.currentEvent ? hydrateEvent(snapshot.runtime.currentEvent) : null;
  return normalizeOrganizationState(state);
};

const createManualSlots = (): ManualSaveSlot[] => Array.from(
  { length: MANUAL_SAVE_SLOT_COUNT },
  (_unused, index) => ({
    id: `manual-${index + 1}`,
    name: `Save Slot ${index + 1}`,
    record: null,
  }),
);

const createEmptyLibrary = (): SaveLibrary => ({
  version: SAVE_LIBRARY_VERSION,
  autosave: null,
  manualSlots: createManualSlots(),
});

const summaryFromState = (state: GameState): SaveSummary => ({
  scenario: state.scenario,
  difficulty: state.difficulty,
  year: state.year,
  month: state.month,
  phase: state.phase,
});

const createRecord = (state: GameState): SaveRecord => ({
  savedAt: new Date().toISOString(),
  summary: summaryFromState(state),
  snapshot: serializeGameState(state),
});

const normalizeLibrary = (value: unknown): SaveLibrary => {
  const empty = createEmptyLibrary();
  if (!value || typeof value !== 'object') return empty;
  const candidate = value as Partial<SaveLibrary>;
  if (candidate.version !== SAVE_LIBRARY_VERSION) return empty;

  const savedSlots = Array.isArray(candidate.manualSlots) ? candidate.manualSlots : [];
  return {
    version: SAVE_LIBRARY_VERSION,
    autosave: candidate.autosave && isSaveGameSnapshot(candidate.autosave.snapshot)
      ? candidate.autosave
      : null,
    manualSlots: empty.manualSlots.map((defaultSlot) => {
      const savedSlot = savedSlots.find((slot) => slot?.id === defaultSlot.id);
      if (!savedSlot) return defaultSlot;
      return {
        id: defaultSlot.id,
        name: typeof savedSlot.name === 'string' && savedSlot.name.trim()
          ? savedSlot.name.trim().slice(0, 40)
          : defaultSlot.name,
        record: savedSlot.record && isSaveGameSnapshot(savedSlot.record.snapshot)
          ? savedSlot.record
          : null,
      };
    }),
  };
};

const writeLibrary = (library: SaveLibrary): SaveLibrary => {
  localStorage.setItem(SAVE_LIBRARY_KEY, JSON.stringify(library));
  window.dispatchEvent(new CustomEvent('cnt-fai-save-library-changed'));
  return library;
};

export const readSaveLibrary = (): SaveLibrary => {
  const raw = localStorage.getItem(SAVE_LIBRARY_KEY);
  if (!raw) return createEmptyLibrary();
  try {
    return normalizeLibrary(JSON.parse(raw));
  } catch {
    return createEmptyLibrary();
  }
};

export const writeAutosave = (state: GameState): SaveLibrary => {
  const library = readSaveLibrary();
  library.autosave = createRecord(state);
  return writeLibrary(library);
};

export const writeManualSave = (slotId: string, state: GameState): SaveLibrary => {
  const library = readSaveLibrary();
  const slot = library.manualSlots.find((candidate) => candidate.id === slotId);
  if (!slot) throw new Error(`Unknown save slot "${slotId}".`);
  slot.record = createRecord(state);
  return writeLibrary(library);
};

export const renameManualSaveSlot = (slotId: string, name: string): SaveLibrary => {
  const trimmedName = name.trim().slice(0, 40);
  if (!trimmedName) throw new Error('Save-slot name cannot be empty.');
  const library = readSaveLibrary();
  const slot = library.manualSlots.find((candidate) => candidate.id === slotId);
  if (!slot) throw new Error(`Unknown save slot "${slotId}".`);
  slot.name = trimmedName;
  return writeLibrary(library);
};

export const clearManualSaveSlot = (slotId: string): SaveLibrary => {
  const library = readSaveLibrary();
  const slot = library.manualSlots.find((candidate) => candidate.id === slotId);
  if (!slot) throw new Error(`Unknown save slot "${slotId}".`);
  slot.record = null;
  return writeLibrary(library);
};
