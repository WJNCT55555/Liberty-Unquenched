import { JournalEntryDef } from '../types';

export const uhpJournal: JournalEntryDef = {
  id: 'journal_uhp',
  title: 'Uníos Hermanos Proletarios',
  titleZh: '联合无产阶级兄弟 (UHP)',
  description: 'The historic slogan "Uníos Hermanos Proletarios" (Unite, Proletarian Brothers) represents the urge for worker unity. To prepare for the upcoming struggles and potential reaction, the CNT and the socialist PSOE must build strong mutual trust and form a joint revolutionary front.',
  descriptionZh: '历史性的口号“联合无产阶级兄弟”（UHP）代表了工人阶级团结一致的渴望。为了应对未来的斗争和潜在的反动逆流，全国劳工联盟（CNT）与社会主义左翼（PSOE）必须建立深厚的互信，并结成联合革命战线。',
  successCondition: 'Relations with PSOE reach 70',
  successConditionZh: '与 PSOE 的关系达到 70',
  successEffectDesc: 'Pops the Crossroads event (Proletarian Uprising or Anti-Fascist Alliance)',
  successEffectDescZh: '弹出「十字路口：无产阶级起义还是反法西斯同盟？」事件',
  failureCondition: 'PSOE enters a political coalition',
  failureConditionZh: 'PSOE 已经加入政党联盟',
  failureEffectDesc: 'Opportunity lost',
  failureEffectDescZh: '错失良机',
  hasProgress: true,
  progressMax: 70,
  getProgress: (state) => state.partyRelations?.PSOE ?? 0,

  /**
   * 事件—日志—事件契约（设计文档 §6.1）：
   *   开始事件 = 「工人联盟的尝试？」，其选项效果调用 `activateJournal()`；
   *   结果事件 = 「十字路口：无产阶级起义还是反法西斯同盟？」，由月结管线在完成时
   *   自动排队（`completionEventId`），再由它的选项 A 开启工人联盟日志。
   * 因此 `checkStatus` 不再自行激活（也不允许返回 `active`），只负责完成/失败判定。
   */
  activationEventId: 'workers_alliance_attempt',
  completionEventId: 'crossroads_uprising_alliance',

  checkStatus: (state, entryState) => {
    // 激活不属于 checkStatus：未激活或已终局时不做任何判定。
    if (entryState.status !== 'active') return null;

    // Fail if PSOE enters a political coalition (Republican-Socialist Coalition or Popular Front)
    const psoeCoalition = state.activeCoalitions.find(c => c.activeId === 'republican_socialist' || c.activeId === 'popular_front');
    if (psoeCoalition) return 'failed';

    if ((state.partyRelations?.PSOE ?? 0) >= 70) return 'completed';

    return null;
  },

  onFail: () => ({})
};
