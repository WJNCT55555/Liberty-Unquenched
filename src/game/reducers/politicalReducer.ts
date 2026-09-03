import type { DomainReducer, GameAction } from './types';

/** Handles political/settings actions that do not belong to a card or event. */
export const reducePolitical: DomainReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'DEBUG_TRIGGER_ENDING':
      return { ...state, isGameOver: true, ending: action.payload };
    case 'SANDBOX_EDIT':
      return state.difficulty === 'sandbox' ? { ...state, ...action.payload } : state;
    case 'SET_REGIONAL_STATUS':
      return {
        ...state,
        regionalStatuses: {
          ...state.regionalStatuses,
          [action.payload.region]: action.payload.status,
        },
      };
    default:
      return null;
  }
};

export type PoliticalAction = Extract<GameAction, {
  type: 'SET_LANGUAGE' | 'DEBUG_TRIGGER_ENDING' | 'SANDBOX_EDIT' | 'SET_REGIONAL_STATUS'
}>;
