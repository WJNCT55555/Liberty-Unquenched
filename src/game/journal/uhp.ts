import { GameState, JournalEntryDef } from '../types';

/**
 * UHP 日志是否已经完成（PSOE 关系达到 70）。
 *
 * 顾问的「推动工人联盟」以此为解锁条件：UHP 完成之前，工人联盟日志仍是
 * inactive、进度条不渲染，此时开放该行动会让进度被静默记录，玩家会在日志
 * 激活的当月看到联盟「凭空成立」。
 */
export const isUhpJournalCompleted = (state: Pick<GameState, 'journal'>): boolean =>
  state.journal?.['journal_uhp']?.status === 'completed';

export const uhpJournal: JournalEntryDef = {
  id: 'journal_uhp',
  title: 'Uníos Hermanos Proletarios',
  titleZh: '联合无产阶级兄弟 (UHP)',
  description: 'The historic slogan "Uníos Hermanos Proletarios" (Unite, Proletarian Brothers) represents the urge for worker unity. To prepare for the upcoming struggles and potential reaction, the CNT and the socialist PSOE must build strong mutual trust and form a joint revolutionary front.',
  descriptionZh: '历史性的口号“联合无产阶级兄弟”（UHP）代表了工人阶级团结一致的渴望。为了应对未来的斗争和潜在的反动逆流，全国劳工联盟（CNT）与社会主义左翼（PSOE）必须建立深厚的互信，并结成联合革命战线。',
  successCondition: 'Relations with PSOE reach 70',
  successConditionZh: '与 PSOE 的关系达到 70',
  successEffectDesc: 'Activates the Alianza Obrera Journal',
  successEffectDescZh: '激活“工人联盟”日志',
  failureCondition: 'PSOE enters a political coalition',
  failureConditionZh: 'PSOE 已经加入政党联盟',
  failureEffectDesc: 'Opportunity lost',
  failureEffectDescZh: '错失良机',
  hasProgress: true,
  progressMax: 70,
  getProgress: (state) => state.partyRelations?.PSOE ?? 0,

  /**
   * 事件—日志—事件契约：开始事件是「工人联盟的尝试？」，它的选项效果调用
   * `activateJournal()` 把本日志置为 active。因此 `checkStatus` 不再自行激活
   * （也不允许返回 `active`），只负责完成/失败判定。
   */
  activationEventId: 'workers_alliance_attempt',

  checkStatus: (state, entryState) => {
    // 激活不属于 checkStatus：未激活或已终局时不做任何判定。
    if (entryState.status !== 'active') return null;

    // Fail if PSOE enters a political coalition (Republican-Socialist Coalition or Popular Front)
    const psoeCoalition = state.activeCoalitions.find(c => c.activeId === 'republican_socialist' || c.activeId === 'popular_front');
    if (psoeCoalition) return 'failed';

    if ((state.partyRelations?.PSOE ?? 0) >= 70) return 'completed';

    return null;
  },

  onComplete: () => ({
    // 工人联盟日志的激活目前仍是旧路径（它的开始事件尚未落笔）。
    alliance_obrera_activated: true
  }),

  onFail: () => ({})
};
