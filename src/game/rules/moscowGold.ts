import type { GameState } from '../types';
import { adjustClassSupport, adjustFactionDissents } from '../utils';
import { getEconomyCounter } from './economyReforms';
import { isSpanishCivilWarOngoing, monthIndex } from './wartimeCoalition';

export const MOSCOW_GOLD_MONTHS = 7;
export const MOSCOW_GOLD_AMOUNT = 150;

export const canTransferMoscowGold = (state: GameState): boolean =>
  !state.moscowGoldTransferred && state.gold_reserves >= MOSCOW_GOLD_AMOUNT;

export const isMoscowGoldDue = (state: GameState): boolean => Boolean(
  isSpanishCivilWarOngoing(state)
  && state.civilWarSetupCompletedAt
  && monthIndex(state) - monthIndex(state.civilWarSetupCompletedAt) >= MOSCOW_GOLD_MONTHS
  && !(state.ministers.estado === 'CNT' && state.ministers.finance === 'CNT')
  && getEconomyCounter(state, 'private_bank_seizure') < 1
  && canTransferMoscowGold(state),
);

/** Shared physical transaction; only an active diplomatic card charges budget/AP. */
export const transferMoscowGold = (state: GameState): Partial<GameState> => {
  if (!canTransferMoscowGold(state)) return {};
  return {
    gold_reserves: state.gold_reserves - MOSCOW_GOLD_AMOUNT,
    moscowGoldTransferred: true,
    tankResearchProgress: Math.min(100, state.tankResearchProgress + 25),
    armaments: state.armaments + 4,
    factions: adjustFactionDissents(state.factions, { Faistas: 6, Puristas: 5 }),
    relations: { ...state.relations, ussr: Math.min(100, state.relations.ussr + 5) },
    classes: adjustClassSupport(state.classes, 'Obreros', 'PCE', 5),
  };
};
