import type { GameState } from '../types';
import { applyOwnershipDrift, getControlCeilings, getSocializedShare } from './controlShares';

/**
 * 生产资料所有权的月度漂移（docs/工人控制度改造方案.md §4.2）。
 *
 * 本文件取代旧的"单标尺月度规则"。旧规则做两件事——缺制度支撑时每月 −1，以及
 * 1936·7 之前封顶 40。新规则改成**每张饼的社会化总量朝自己的结构性上限收拢**：
 *
 *  - 超过上限：按各项比例退回私人三项，超出 1 点以上时每月只回落 1 点（给玩家反应时间）；
 *  - 低于上限：**不动**。上涨必须来自玩家的行动——控制权是争来的，不是等来的。
 *
 * 天花板由 `getControlCeilings()` 给出（战前土地 12—21、工业 7—16；战时土地 45—92、
 * 工业 55—95），它读土地改革进度与工会法等级，不再看日历。
 *
 * 下面三个常量保留原名以兼容既有引用；它们的旧语义（单一标尺的封顶／衰减）已废弃，
 * 新设计里对应的概念分别是"社会化总量上限"与"超出部分的月度回落"。
 */

/** @deprecated 单标尺时代的战前封顶；见 `getControlCeilings()` 的两条结构性上限。 */
export const CONTROL_OBRERO_PRE_WAR_CAP = 40;
/** @deprecated 单标尺时代的每月衰减；新设计只在超过上限时回落。 */
export const CONTROL_OBRERO_DECAY = 1;
/** @deprecated 单标尺时代的停衰减阈值；新设计的对应概念是"土改进度 ≥30 时土地上限抬到 21"。 */
export const CONTROL_OBRERO_LAND_REFORM_SUPPORT = 30;

/**
 * 月度漂移入口。函数名与调用位置与旧版一致，`monthlyPipeline` 不需要改动。
 */
export const applyControlObreroDrift = (state: GameState): GameState => applyOwnershipDrift(state);

/** 当前两张饼与各自上限的读数，供界面与预览使用。 */
export const getControlObreroStatus = (state: GameState): {
  land: { socialized: number; ceiling: number };
  industry: { socialized: number; ceiling: number };
} => {
  const ceilings = getControlCeilings(state);
  return {
    land: { socialized: getSocializedShare(state, 'land'), ceiling: ceilings.land },
    industry: { socialized: getSocializedShare(state, 'industry'), ceiling: ceilings.industry },
  };
};
