import type { GameState } from '../types';

/** 1936 年 7 月之前，工人控制程度的上限（真正的 control obrero 尚未发生）。 */
export const CONTROL_OBRERO_PRE_WAR_CAP = 40;
/** 缺少制度支撑时每月的自然衰减。 */
export const CONTROL_OBRERO_DECAY = 1;
/** 土地改革推进到该进度视为已发生集体化，衰减停止。 */
export const CONTROL_OBRERO_LAND_REFORM_SUPPORT = 30;

const round2 = (value: number): number => Number(value.toFixed(2));

/**
 * 工人控制程度（生产资料控制）的月度漂移。
 *
 * 它不是一个只会累积的进度条：
 *  - 缺少制度支撑（`union_status < 2` 且土地改革未推进）时每月 −1；
 *  - 1936 年 7 月之前封顶 40。
 */
export const applyControlObreroDrift = (state: GameState): GameState => {
  const institutionalSupport = state.domesticPolicy.union_status >= 2
    || state.domesticPolicy.land_reform_progress >= CONTROL_OBRERO_LAND_REFORM_SUPPORT;
  const beforeCivilWar = state.year < 1936 || (state.year === 1936 && state.month < 7);

  let next = state.stats.workerControl;
  if (!institutionalSupport) next = Math.max(0, next - CONTROL_OBRERO_DECAY);
  if (beforeCivilWar) next = Math.min(next, CONTROL_OBRERO_PRE_WAR_CAP);
  next = round2(next);

  if (next === state.stats.workerControl) return state;
  return { ...state, stats: { ...state.stats, workerControl: next } };
};
