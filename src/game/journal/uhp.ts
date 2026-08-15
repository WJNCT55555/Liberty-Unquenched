import { JournalEntryDef } from '../types';

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

  checkStatus: (state, entryState) => {
    if (entryState.status === 'completed' || entryState.status === 'failed') return null;

    if (!state.uhp_journal_activated) return 'inactive';

    // Fail if PSOE enters a political coalition (Republican-Socialist Coalition or Popular Front)
    const psoeCoalition = state.activeCoalitions.find(c => c.activeId === 'republican_socialist' || c.activeId === 'popular_front');
    const isPsoeInCoalition = !!psoeCoalition;
    if (isPsoeInCoalition) return 'failed';

    if ((state.partyRelations?.PSOE ?? 0) >= 70) return 'completed';

    return 'active';
  },

  onComplete: (state) => ({
    alliance_obrera_activated: true
  }),

  onFail: (state) => ({})
};
