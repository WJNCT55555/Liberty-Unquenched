import { JournalEntryDef } from '../types';
import { formCoalition } from '../utils/coalition';
import { workersAllianceFormation } from '../events/workers_alliance_formation';

export const alianzaObreraJournal: JournalEntryDef = {
  id: 'journal_alianza_obrera',
  title: 'Alianza Obrera',
  titleZh: '工人联盟 (Alianza Obrera)',
  description: 'The Workers\' Alliance is the ultimate goal for the revolutionary factions. By combining PSOE and CNT forces, the working class can build a formidable revolutionary power capable of challenging the old order.',
  descriptionZh: '工人联盟是革命派的终极目标。通过将 PSOE 和 CNT 的力量结合起来，工人阶级可以建立起一股强大的革命力量，足以挑战旧秩序。',
  successCondition: 'Relations with PSOE reaches 80, Valeriano Orobón promotes the alliance 3 times, and Worker Control is at least 55',
  successConditionZh: '与 PSOE 的关系达到 80，瓦莱里亚诺·奥罗本推动工人联盟达到 3 次，且工人控制度至少达到 55',
  successEffectDesc: 'Activates the Workers\' Alliance and triggers its formation event',
  successEffectDescZh: '激活工人联盟，并触发其组建事件',
  failureCondition: 'PSOE enters a political coalition',
  failureConditionZh: 'PSOE 已经加入政党联盟',
  failureEffectDesc: 'Opportunity lost',
  failureEffectDescZh: '错失良机',
  hasProgress: true,
  progressMax: 3,
  getProgress: (state) => state.workersAllianceProgress || 0,

  checkStatus: (state, entryState) => {
    if (entryState.status === 'completed' || entryState.status === 'failed') return null;

    // Fail if PSOE enters a political coalition (Republican-Socialist Coalition or Popular Front)
    const isPsoeInCoalition = state.activeCoalition && 
      (state.activeCoalition.activeId === 'republican_socialist' || state.activeCoalition.activeId === 'popular_front');
    if (isPsoeInCoalition) return 'failed';

    // Must be activated after journal_uhp is completed
    if (!state.alliance_obrera_activated) return 'inactive';

    const psoeRel = state.partyRelations?.PSOE ?? 0;
    const actionCount = state.workersAllianceProgress || 0;
    const workerCtrl = state.stats?.workerControl ?? 0;

    if (psoeRel >= 80 && actionCount >= 3 && workerCtrl >= 55) {
      return 'completed';
    }

    return 'active';
  },

  onComplete: (state) => {
    // Form the workers_alliance coalition
    const newState = formCoalition(state, 'workers_alliance');
    
    // Queue the workers_alliance_formation event
    const updatedEvents = [
      workersAllianceFormation,
      ...(newState.pendingEvents || [])
    ];

    return {
      activeCoalition: newState.activeCoalition,
      coalitionHistory: newState.coalitionHistory,
      pendingEvents: updatedEvents
    };
  },

  onFail: (state) => ({})
};
