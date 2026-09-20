import type { GameEvent, GameState, JournalEntryDef, JournalStatus } from '../types';

/**
 * 事件—日志—事件契约的共享实现（设计文档 §6.3）。
 *
 * 目标形态：
 *
 *   触发事件（条件满足即排队）→ 事件选项调用 `activateJournal()` 激活日志
 *     → 日志按月运行 `activeEffect`
 *     → 完成/失败条件满足 → 日志自己结算 `onComplete` / `onFail`
 *     → 管线用 `queueJournalOutcomeEvent()` 推入结果事件（同回合可读）
 *
 * 三条边界：
 *  1. **激活只属于开始事件**。声明了 `activationEventId` 的日志不再由
 *     `checkStatus` 自行激活，`isEventMediatedJournal()` 让月结管线忽略它的
 *     `active` 判定。
 *  2. **数值效果只属于日志**。结果事件只负责叙事，禁止在事件选项里重复发奖。
 *  3. **结果事件同回合入队**。数值立即结算，事件随本回合的事件阶段一起出现。
 */

/** 完成/失败时要推入的那个结果事件 id（无声明则返回 undefined）。 */
export const getJournalOutcomeEventId = (
  def: Pick<JournalEntryDef, 'completionEventId' | 'failureEventId'>,
  status: JournalStatus,
): string | undefined => {
  if (status === 'completed') return def.completionEventId;
  if (status === 'failed') return def.failureEventId;
  return undefined;
};

/** 该日志的激活是否已经完全交给开始事件管理。 */
export const isEventMediatedJournal = (
  def: Pick<JournalEntryDef, 'activationEventId'>,
): boolean => Boolean(def.activationEventId);

/**
 * 把日志置为 `active` —— 开始事件选项的唯一合法写入口。
 *
 * 已终局（completed / failed）的日志不会被重新激活，未知 id 返回空补丁。
 */
export const activateJournal = (
  state: Pick<GameState, 'journal'>,
  journalId: string,
): Partial<GameState> => {
  const entry = state.journal?.[journalId];
  if (!entry || entry.status === 'completed' || entry.status === 'failed') return {};
  return {
    journal: {
      ...state.journal,
      [journalId]: { ...entry, status: 'active' },
    },
  };
};

/**
 * 结果事件入队：放在待办队首，玩家在新月份的事件阶段立刻能看到。
 *
 * 已经排队、正在展示或历史里处理过的同 id 事件不会重复推入；非法/缺失事件返回
 * `null`，调用方保持原队列不变。
 */
export const queueJournalOutcomeEvent = (
  state: Pick<GameState, 'pendingEvents' | 'currentEvent' | 'eventHistory'>,
  event: GameEvent | undefined,
): GameEvent[] | null => {
  if (!event) return null;

  const pending = state.pendingEvents ?? [];
  if (state.currentEvent?.id === event.id) return null;
  if (pending.some((candidate) => candidate.id === event.id)) return null;

  const history = state.eventHistory;
  if (history?.triggered?.includes(event.id) || history?.resolved?.includes(event.id)) return null;

  return [event, ...pending];
};
