/**
 * 经济改造事件模块的汇总出口（docs/经济改造方案.md §7.1）。
 *
 * 只供 `registries/restorableEventRegistry.ts` 的 `eventDefinitionsFrom()` 消费：
 * 结果事件、失败事件与中间事件都必须是"可还原"的（读档时要把 effect 函数接回来），
 * 但它们**不进** `SCHEDULED_EVENT_REGISTRY`——那些事件一律 `condition: () => false`，
 * 只由日志管线（`completionEventId` / `failureEventId`）或卡牌选项推入。
 *
 * 开始事件（`free_commune_start` / `cooperative_path` / `after_the_revolution` /
 * `wartime_route_choice`）反过来只登记在调度表里，因此在这里以具名导出提供，
 * 供 `scheduledEventRegistry.ts` 逐个引入。
 *
 * 注意：本文件**不是**事件目录的运行时注册表，也不做重复 id 校验——那一层由两个
 * registry 负责（`defineUniqueRegistry`）。
 */
export { economyFreeCommuneStart } from './free_commune_start';
export { economyCooperativePath } from './cooperative_path';
export { economyAfterTheRevolution } from './after_the_revolution';
export { economyWartimeRouteChoice } from './wartime_route_choice';
export { landCollectivizationStart } from './land_collectivization';
export { landCollectivizationComplete, landCollectivizationAbandoned } from './land_collectivization';
export { currencyAbolished } from './currency_abolished';
export { bankersPanic } from './bankers_panic';
export { economySyndicalistVictory } from './syndicalist_victory';
export { economyFreeCommuneVictory } from './free_commune_victory';
export { economyCooperativeVictory } from './cooperative_victory';
export { economyOrganicVictory } from './organic_victory';
export { economyWarEffortVictory } from './war_effort_victory';
export { economyRevolutionaryWarVictory } from './revolutionary_war_victory';
export { economyWarEffortConceded, economyRevolutionaryWarConceded } from './wartime_conceded';
