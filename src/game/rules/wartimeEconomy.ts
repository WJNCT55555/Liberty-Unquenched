import type { GameState } from '../types';
import { monthIndex, WARTIME_COALITION_ID } from './wartimeCoalition';

/**
 * 战时经济路线的编排层判定（docs/经济改造方案.md §4.3②）。
 *
 * 两条战时经济日志共用一个开始事件，因此"到期"这件事必须跨日志判断：只要两条都还没激活、
 * 战时权力安排已经落定一个月，就应该把抉择事件推到玩家面前。
 *
 * 与 `isMilitarizationCrossroadsDue` 同构，包括它的三个守卫：
 *  - 战时人民阵线必须真的成立（`rulingCoalition`），否则玩家选的那条路没有落地；
 *  - 五月危机若已分裂出第三阵营（`iberianDefense`），CNT 已脱离共和国，不该再问战时经济；
 *  - 事件一次性（`eventHistory.resolved`）。
 */
export const isWartimeEconomyRouteDue = (state: GameState): boolean => Boolean(
  state.wartimePowerArrangement
  && state.rulingCoalition === WARTIME_COALITION_ID
  && monthIndex(state) > monthIndex(state.wartimePowerArrangement.formedAt)
  && !state.iberianDefense
  && !state.eventHistory?.resolved.includes('economy_wartime_route_choice'),
);
