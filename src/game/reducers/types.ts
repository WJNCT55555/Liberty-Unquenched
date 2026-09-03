import type { Advisor, Card, GameEvent, GameState } from '../types';

/** All user and engine commands accepted by the game store. */
export type GameAction =
  | { type: 'START_GAME'; payload: { scenario: '1931' | '1933' | '1936'; difficulty: 'easy' | 'normal' | 'hard' | 'historical' | 'sandbox' } }
  | { type: 'RETURN_TO_START' }
  | { type: 'NEXT_PHASE' }
  | { type: 'PLAY_CARD'; payload: Card }
  | { type: 'RESOLVE_EVENT'; payload: (state: GameState) => Partial<GameState> }
  | { type: 'DISMISS_SUPER_EVENT' }
  | { type: 'SELECT_EVENT'; payload: { eventId: string } }
  | { type: 'ADD_ADVISOR'; payload: { advisor: Advisor; slotIndex: number } }
  | { type: 'REMOVE_ADVISOR'; payload: { slotIndex: number } }
  | { type: 'DRAW_CARD'; payload: 'Action' | 'Governmental' | 'Military' }
  | { type: 'DRAW_SPECIFIC_CARD'; payload: { cardId: string; deckType: 'Action' | 'Governmental' | 'Military' } }
  | { type: 'CHECK_EVENT' }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'zh' }
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'UPDATE_TAXES'; payload: { tax_lower_class?: number; tax_middle_class?: number; tax_upper_class?: number; tax_tariff?: number; tax_consumption?: number; military_spending?: number } }
  | { type: 'SELL_GOLD_FOR_FX' }
  | { type: 'ISSUE_WAR_BONDS' }
  | { type: 'BUY_RESOURCES_URGENT' }
  | { type: 'DEBUG_TRIGGER_ENDING'; payload: string }
  | { type: 'SANDBOX_EDIT'; payload: Partial<GameState> }
  | { type: 'SET_REGIONAL_STATUS'; payload: { region: 'andalusia' | 'catalonia' | 'basque' | 'galicia' | 'asturias'; status: 'direct' | 'autonomy' | 'independent' } }
  | { type: 'TOGGLE_MAP_VIEW' }
  | { type: 'END_MAP_PLAYER_TURN' }
  | { type: 'SELECT_MAP_PROVINCE'; payload: string | null }
  | { type: 'SELECT_MAP_ARMY'; payload: { armyId: string | null; isShift: boolean } }
  | { type: 'MOVE_MAP_ARMY'; payload: { armyId: string; targetProvinceId: string } }
  | { type: 'RECRUIT_MAP_ARMY'; payload: { provinceId: string; composition: { infantry: number; artillery: number; tanks: number } } }
  | { type: 'REINFORCE_MAP_ARMY'; payload: { armyId: string } }
  | { type: 'MERGE_MAP_ARMIES' }
  | { type: 'DISBAND_MAP_ARMIES' }
  | { type: 'SPLIT_MAP_ARMY'; payload: { armyId: string; composition: { infantry: number; artillery: number; tanks: number } } }
  | { type: 'BUILD_MAP_BUILDING'; payload: { provinceId: string; buildingType: string } };

export type ReducerResult = GameState | null;
export type DomainReducer = (state: GameState, action: GameAction) => ReducerResult;
