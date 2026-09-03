import type { GameState } from '../types';

export interface MonthlyIncome {
  resources: number;
  armaments: number;
}

export const INCOME_RULES = {
  baseResources: 1,
  workerControlBand: 20,
  peaceArmamentCadence: 2,
  defaultMilitarySpending: 15,
} as const;

export const getMonthlyArmamentIncome = (isAtWar: boolean, nextMonth: number): number => {
  if (isAtWar) return 1;
  return nextMonth % INCOME_RULES.peaceArmamentCadence === 0 ? 1 : 0;
};

/** Resource and clandestine CNT armament income for one month. */
export const calculateMonthlyIncome = (state: GameState, nextMonth: number): MonthlyIncome => ({
  resources: INCOME_RULES.baseResources + Math.floor(state.stats.workerControl / INCOME_RULES.workerControlBand),
  armaments: getMonthlyArmamentIncome(
    state.civilWarStatus === 'ongoing' || Boolean(state.activeWar),
    nextMonth,
  ),
});
