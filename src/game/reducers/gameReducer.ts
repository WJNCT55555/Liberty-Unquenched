import type { GameState } from '../types';
import type { GameAction } from './types';
import { createScenarioState } from '../scenarios';
import { reduceEconomy } from './economyReducer';
import { reducePolitical } from './politicalReducer';
import { reduceMap, reduceMapWarAction } from './mapReducer';
import { reduceEvent } from './eventReducer';
import { reduceSave } from './saveReducer';
import { advancePhase } from '../rules/phaseOrchestrator';
import { MAP_RUNTIME_HELPERS } from '../rules/mapRuntime';
import { applyPostReducerPipeline } from './postReducer';

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  let newState = state;
  const reduceMapWar = (mapState: GameState, mapAction: GameAction) =>
    reduceMapWarAction(mapState, mapAction, MAP_RUNTIME_HELPERS);
  switch (action.type) {
    case 'START_GAME': {
      // Start-state initialization lives in `./scenarios`: a scenario-free base
      // plus one complete, compiler-checked descriptor per scenario.
      newState = createScenarioState(action.payload.scenario, action.payload.difficulty, state.language);
      break;
    }

    case 'RETURN_TO_START':
    case 'LOAD_STATE':
      newState = reduceSave(state, action) || state;
      break;
    case 'SET_LANGUAGE':
    case 'DEBUG_TRIGGER_ENDING':
    case 'SANDBOX_EDIT':
    case 'SET_REGIONAL_STATUS':
      newState = reducePolitical(state, action) || state;
      break;
    case 'UPDATE_TAXES':
    case 'SELL_GOLD_FOR_FX':
    case 'ISSUE_WAR_BONDS':
    case 'BUY_RESOURCES_URGENT':
      newState = reduceEconomy(state, action) || state;
      break;
    case 'TOGGLE_MAP_VIEW':
    case 'SELECT_MAP_PROVINCE':
    case 'SELECT_MAP_ARMY':
      newState = reduceMap(state, action) || state;
      break;
    case 'MOVE_MAP_ARMY': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'END_MAP_PLAYER_TURN': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'RECRUIT_MAP_ARMY': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'REINFORCE_MAP_ARMY': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'MERGE_MAP_ARMIES': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'DISBAND_MAP_ARMIES': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'SPLIT_MAP_ARMY': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'BUILD_MAP_BUILDING': {
      newState = reduceMapWar(state, action) || state;
      break;
    }
    case 'NEXT_PHASE': {
      newState = advancePhase(state);
      break;
    }
    case 'PLAY_CARD':
      newState = reduceEvent(state, action) || state;
      break;
    case 'DISMISS_SUPER_EVENT':
      newState = reduceEvent(state, action) || state;
      break;
    case 'SELECT_EVENT':
      newState = reduceEvent(state, action) || state;
      break;
    case 'RESOLVE_EVENT':
      newState = reduceEvent(state, action) || state;
      break;
    case 'ADD_ADVISOR':
      newState = reduceEvent(state, action) || state;
      break;
    case 'REMOVE_ADVISOR':
      newState = reduceEvent(state, action) || state;
      break;
    case 'DRAW_CARD': {
      newState = reduceEvent(state, action) || state;
      break;
    }
    case 'DRAW_SPECIFIC_CARD': {
      newState = reduceEvent(state, action) || state;
      break;
    }
    case 'CHECK_EVENT': {
      newState = reduceEvent(state, action) || state;
      break;
    }
    default:
      newState = state;
  }

  return applyPostReducerPipeline(state, newState);
};
