import type { DomainReducer, GameAction } from './types';
import type { GameState } from '../types';
import { ECONOMIC_RULES } from '../rules/economy';

const clampTax = (value: number) => Math.max(1, Math.min(100, value));

/** Handles actions that mutate the national fiscal/economic slice. */
export const reduceEconomy: DomainReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_TAXES':
      return {
        ...state,
        tax_lower_class: action.payload.tax_lower_class !== undefined ? clampTax(action.payload.tax_lower_class) : state.tax_lower_class,
        tax_middle_class: action.payload.tax_middle_class !== undefined ? clampTax(action.payload.tax_middle_class) : state.tax_middle_class,
        tax_upper_class: action.payload.tax_upper_class !== undefined ? clampTax(action.payload.tax_upper_class) : state.tax_upper_class,
        tax_tariff: action.payload.tax_tariff !== undefined ? clampTax(action.payload.tax_tariff) : state.tax_tariff,
        tax_consumption: action.payload.tax_consumption !== undefined ? clampTax(action.payload.tax_consumption) : state.tax_consumption,
        military_spending: action.payload.military_spending !== undefined
          ? Math.max(5, Math.min(100, action.payload.military_spending))
          : (state.military_spending !== undefined ? state.military_spending : ECONOMIC_RULES.defaults.militarySpending),
      };
    case 'SELL_GOLD_FOR_FX':
      if ((state.gold_reserves ?? ECONOMIC_RULES.defaults.goldReserves) < 100) return state;
      return {
        ...state,
        gold_reserves: (state.gold_reserves ?? ECONOMIC_RULES.defaults.goldReserves) - 100,
        foreign_exchange: (state.foreign_exchange ?? ECONOMIC_RULES.defaults.foreignExchange) + 100,
        inflation_rate: state.inflation_rate + 1.5,
      };
    case 'ISSUE_WAR_BONDS':
      return {
        ...state,
        budget: state.budget + 50,
        foreign_exchange: (state.foreign_exchange ?? ECONOMIC_RULES.defaults.foreignExchange) + 10,
        public_debt: (state.public_debt ?? ECONOMIC_RULES.defaults.debt) + 60,
        has_issued_war_bonds: true,
        inflation_rate: state.inflation_rate + 1.2,
      };
    case 'BUY_RESOURCES_URGENT':
      if ((state.foreign_exchange ?? ECONOMIC_RULES.defaults.foreignExchange) < 25) return state;
      return {
        ...state,
        foreign_exchange: (state.foreign_exchange ?? ECONOMIC_RULES.defaults.foreignExchange) - 25,
        resources: state.resources + 2,
        armaments: state.armaments + 1,
      };
    default:
      return null;
  }
};

export type EconomyAction = Extract<GameAction, {
  type: 'UPDATE_TAXES' | 'SELL_GOLD_FOR_FX' | 'ISSUE_WAR_BONDS' | 'BUY_RESOURCES_URGENT'
}>;

export type EconomyState = Pick<GameState,
  | 'budget'
  | 'gold_reserves'
  | 'foreign_exchange'
  | 'public_debt'
  | 'military_spending'
  | 'inflation_rate'
  | 'resources'
  | 'armaments'
>;
