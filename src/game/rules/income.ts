import type { GameState } from '../types';
import { getUnionShare } from '../unions';

export interface MonthlyIncome {
  resources: number;
  armaments: number;
}

export const INCOME_RULES = {
  baseResources: 1,
  /** CNT 工会占比每满 20 点，月度资源 +1（上限 +5）。 */
  unionShareBand: 20,
  peaceArmamentCadence: 2,
  defaultMilitarySpending: 15,
} as const;

export const getMonthlyArmamentIncome = (isAtWar: boolean, nextMonth: number): number => {
  if (isAtWar) return 1;
  return nextMonth % INCOME_RULES.peaceArmamentCadence === 0 ? 1 : 0;
};

/** Resource and clandestine CNT armament income for one month. */
export const calculateMonthlyIncome = (state: GameState, nextMonth: number): MonthlyIncome => ({
  // 会费与群众募捐基础来自 CNT 的组织规模（工会占比），而非生产资料控制程度。
  resources: INCOME_RULES.baseResources
    + Math.floor(getUnionShare(state).CNT / INCOME_RULES.unionShareBand),
  armaments: getMonthlyArmamentIncome(
    state.civilWarStatus === 'ongoing' || Boolean(state.activeWar),
    nextMonth,
  ),
});
