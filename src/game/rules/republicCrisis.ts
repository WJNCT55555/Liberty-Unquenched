import type { GameState } from '../types';

/**
 * 共和国危机机制的存续判定（设计文档 §11.1）。
 *
 * 共和国危机（紧张度合成 + 政变蓄积 + 政变里程碑）只服务于**和平阶段**。
 * 一旦进入**战争状态**——阿斯图里亚斯战争（左翼革命）或西班牙内战（国民军叛乱）
 * 正在进行——危机即视为已被引爆，整套机制停摆：
 *
 * - **紧张度不再重算**，保留最后一次数值（它是派生指标，见 §11.1 的公式）；
 * - **政变不再逐月蓄积**，里程碑（军官忠诚扣减、莫拉／奎波／非洲军团转向，
 *   以及进度 ≥100 时排入内战开局链）也不再推进——阴谋已经变成公开的战争；
 * - 内容层对 `coupProgress` 的直接写入仍然生效，待逐个迁移（见 §11.1 登记表）。
 *
 * 战争结束后（`activeWar` 清空）机制自动恢复；"左翼革命之后是否应当永久停摆"
 * 仍是待设计项，因此这里只判断"**当下是否处于战争状态**"，不看战争的胜负结果。
 */
export const isAnyWarOngoing = (
  state: Pick<GameState, 'activeWar' | 'civilWarStatus'>,
): boolean => Boolean(state.activeWar) || state.civilWarStatus === 'ongoing';

/** 危机机制停摆 ⇔ 当下处于战争状态。 */
export const isRepublicCrisisSuspended = isAnyWarOngoing;
