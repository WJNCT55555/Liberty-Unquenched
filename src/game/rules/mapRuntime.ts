import { resolveBattle } from './combat';
import { executeAiTurn } from './mapAiTurn';
import { checkWarStatus } from './warStatus';

/** Runtime capabilities shared by map actions and phase advancement. */
export const MAP_RUNTIME_HELPERS = {
  resolveBattle,
  executeAiTurn,
  checkWarStatus,
} as const;
