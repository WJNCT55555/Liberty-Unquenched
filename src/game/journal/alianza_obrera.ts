import { JournalEntryDef } from '../types';
import { formCoalition } from '../utils';
import { getRightShare, getUnionShare } from '../unions';

export const alianzaObreraJournal: JournalEntryDef = {
  id: 'journal_alianza_obrera',
  title: 'Alianza Obrera',
  titleZh: '工人联盟 (Alianza Obrera)',
  description: 'The Workers\' Alliance is the ultimate goal for the revolutionary factions. By combining PSOE and CNT forces, the working class can build a formidable revolutionary power capable of challenging the old order.',
  descriptionZh: '工人联盟是革命派的终极目标。通过将 PSOE 和 CNT 的力量结合起来，工人阶级可以建立起一股强大的革命力量，足以挑战旧秩序。',
  successCondition: 'Relations with PSOE reaches 80, Workers\' Alliance progress reaches 3 (advisor action "Promote Workers\' Alliance" by Valeriano Orobón or Segundo Blanco, unlocked once the UHP journal is completed), CNT share is at least 18, CNT+UGT at least 35, and right-wing unions no more than 12',
  successConditionZh: '与 PSOE 的关系达到 80，工人联盟进度达到 3（由奥罗本或布兰科的「推动工人联盟」顾问行动累积，需先完成 UHP 日志），CNT 工会占比至少 18、CNT+UGT 至少 35，且右翼工会不超过 12',
  successEffectDesc: 'Activates the Workers\' Alliance and triggers its formation event',
  successEffectDescZh: '激活工人联盟，并触发其组建事件',
  failureCondition: 'PSOE enters a political coalition',
  failureConditionZh: 'PSOE 已经加入政党联盟',
  failureEffectDesc: 'Opportunity lost',
  failureEffectDescZh: '错失良机',
  hasProgress: true,
  progressMax: 3,
  getProgress: (state) => state.workersAllianceProgress || 0,

  /**
   * 结果事件：完成时由月结管线自动推入（`rules/journalEvents.ts`），同一回合的
   * 事件阶段即可读到。数值/状态效果只由下面的 `onComplete` 负责，事件只叙事。
   */
  completionEventId: 'workers_alliance_formation',

  checkStatus: (state, entryState) => {
    if (entryState.status === 'completed' || entryState.status === 'failed') return null;

    // Fail if PSOE enters a political coalition (Republican-Socialist Coalition or Popular Front)
    const psoeCoalition = state.activeCoalitions.find(c => c.activeId === 'republican_socialist' || c.activeId === 'popular_front');
    const isPsoeInCoalition = !!psoeCoalition;
    if (isPsoeInCoalition) return 'failed';

    // Must be activated after journal_uhp is completed
    if (!state.alliance_obrera_activated) return 'inactive';

    const psoeRel = state.partyRelations?.PSOE ?? 0;
    const actionCount = state.workersAllianceProgress || 0;
    const share = getUnionShare(state);

    // 工人联盟要求：左翼要够强（CNT 主导 + CNT/UGT 合计够大），右翼掣肘要够弱。
    if (
      psoeRel >= 80
      && actionCount >= 3
      && share.CNT >= 18
      && share.CNT + share.UGT >= 35
      && getRightShare(share) <= 12
    ) {
      return 'completed';
    }

    return 'active';
  },

  onComplete: (state) => {
    // Form the workers_alliance coalition. 结果事件由 completionEventId 自动入队，
    // 这里不再手动改 pendingEvents，避免同一个事件被推两次。
    const newState = formCoalition(state, 'workers_alliance');

    return {
      activeCoalitions: newState.activeCoalitions,
      coalitionHistory: newState.coalitionHistory
    };
  },

  onFail: (state) => ({})
};
