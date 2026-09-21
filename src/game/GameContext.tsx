import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react';
import type { GameState } from './types';
import { CARD_REGISTRY } from './registries/cardRegistry';
import { INITIAL_ADVISORS } from './advisors';
import { RESTORABLE_EVENT_REGISTRY } from './registries/restorableEventRegistry';
import {
  deserializeGameState,
  writeAutosave,
  type SaveGameSnapshot,
} from './saveGame';
import type { GameAction } from './reducers/types';
import { gameReducer } from './reducers/gameReducer';
import { PRE_START_STATE } from './scenarios';
import { selectMapRuntimeState } from './selectors';

export interface GameActions {
  dispatch: (action: GameAction) => void;
  loadSave: (snapshot: SaveGameSnapshot) => { ok: true } | { ok: false; error: string };
}

interface GameStore {
  getSnapshot: () => GameState;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: GameAction) => void;
  loadSave: (snapshot: SaveGameSnapshot) => { ok: true } | { ok: false; error: string };
}

const GameContext = createContext<GameStore | undefined>(undefined);

const createGameStore = (): GameStore => {
  let currentState = PRE_START_STATE;
  const listeners = new Set<() => void>();

  const dispatch = (action: GameAction) => {
    const nextState = gameReducer(currentState, action);
    if (nextState === currentState) return;
    currentState = nextState;
    listeners.forEach(listener => listener());
  };

  const loadSave: GameStore['loadSave'] = (snapshot) => {
    try {
      const restoredState = deserializeGameState(snapshot, {
        cards: CARD_REGISTRY,
        advisors: INITIAL_ADVISORS,
        events: RESTORABLE_EVENT_REGISTRY,
      });
      dispatch({ type: 'LOAD_STATE', payload: restoredState });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown save-game error.';
      console.error('Failed to load save game:', error);
      return { ok: false, error: message };
    }
  };

  return {
    getSnapshot: () => currentState,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch,
    loadSave,
  };
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<GameStore | null>(null);
  if (!storeRef.current) storeRef.current = createGameStore();
  const store = storeRef.current;
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  // Event progression and autosave observe only the snapshots they need. The
  // store itself stays stable, so provider consumers no longer re-render when
  // the provider value object changes identity on every action.
  useEffect(() => {
    if (state.phase === 'event' && !state.currentEvent) {
      store.dispatch({ type: 'CHECK_EVENT' });
    }
  }, [store, state.phase, state.month, state.year, state.currentEvent]);

  useEffect(() => {
    if (state.screen !== 'game') return;
    const autosaveTimer = window.setTimeout(() => {
      try {
        writeAutosave(state);
      } catch (error) {
        console.error('Failed to write autosave:', error);
      }
    }, 500);
    return () => window.clearTimeout(autosaveTimer);
  }, [state]);

  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
};

const useGameStore = () => {
  const store = useContext(GameContext);
  if (!store) throw new Error('useGame hooks must be used within a GameProvider');
  return store;
};

export const shallowEqual = <T extends object>(left: T, right: T) => {
  if (Object.is(left, right)) return true;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  return leftKeys.every(key => Object.is(leftRecord[key], rightRecord[key]));
};

export const useGameSelector = <Selected,>(selector: (state: GameState) => Selected, equality: (left: Selected, right: Selected) => boolean = Object.is) => {
  const store = useGameStore();
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equality);
  selectorRef.current = selector;
  equalityRef.current = equality;
  const selectedRef = useRef<{
    snapshot: GameState;
    selector: (state: GameState) => Selected;
    equality: (left: Selected, right: Selected) => boolean;
    value: Selected;
  } | null>(null);
  const getSelectedSnapshot = useCallback(() => {
    const snapshot = store.getSnapshot();
    const previous = selectedRef.current;
    const activeSelector = selectorRef.current;
    const activeEquality = equalityRef.current;
    if (
      previous?.snapshot === snapshot
      && previous.selector === activeSelector
      && previous.equality === activeEquality
    ) return previous.value;
    const nextValue = activeSelector(snapshot);
    if (previous && activeEquality(previous.value, nextValue)) {
      selectedRef.current = { snapshot, selector: activeSelector, equality: activeEquality, value: previous.value };
      return previous.value;
    }
    selectedRef.current = { snapshot, selector: activeSelector, equality: activeEquality, value: nextValue };
    return nextValue;
  }, [store]);
  return useSyncExternalStore(store.subscribe, getSelectedSnapshot, getSelectedSnapshot);
};

export const useGameActions = (): GameActions => {
  const store = useGameStore();
  return useMemo(() => ({ dispatch: store.dispatch, loadSave: store.loadSave }), [store]);
};

export const useMapRuntimeState = () => useGameSelector(selectMapRuntimeState, shallowEqual);

/** Full snapshots are reserved for mounted editors, persistence, and custom event renderers. */
export const useGameSnapshotWhen = (active: boolean): GameState | null => (
  useGameSelector((snapshot) => active ? snapshot : null)
);
