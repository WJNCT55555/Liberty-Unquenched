import { JournalEntryDef } from '../types';

export const landReformJournal: JournalEntryDef = {
  id: 'journal_land_reform',
  title: 'The Agrarian Question',
  titleZh: '土地改革问题',
  description: 'The concentration of land ownership in the hands of the latifundistas is a major source of poverty and unrest. We must redistribute land to the braceros and labradores, or face continuous agrarian strikes and rural violence.',
  descriptionZh: '土地所有权集中在大地主手中是贫困和动荡的主要根源。我们必须将土地重新分配给雇农（braceros）和农夫（labradores），否则将面临持续的农业罢工和农村暴力。',
  successCondition: 'Land Reform Progress reaches 100%',
  successConditionZh: '土地改革进度达到 100%',
  successEffectDesc: 'Worker Control +10, Economy +5',
  successEffectDescZh: '工人控制度 +10，经济 +5',
  failureCondition: 'Failure progress reaches 100%',
  failureConditionZh: '土地改革失败进度达到 100%',
  failureEffectDesc: 'Worker Control -10',
  failureEffectDescZh: '工人控制度 -10',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => state.domesticPolicy.land_reform_progress,
  
  checkStatus: (state, entryState) => {
    // Only activate if not already completed/failed
    if (entryState.status === 'completed' || entryState.status === 'failed') return null;
    
    // Complete if land reform progress reaches 100
    if (entryState.progress >= 100 || state.domesticPolicy.land_reform_progress >= 100) return 'completed';
    
    // Fail if failure progress reaches 100
    if (entryState.failureProgress !== undefined && entryState.failureProgress >= 100) return 'failed';

    // Must be after 1931 election government formation
    // Scenario 1931 starts with Provisional Government. 
    // Scenario 1933 and 1936 are already past this.
    const isGovFormed = state.scenario !== '1931' || state.government.type !== 'Provisional Government';
    if (!isGovFormed) return 'inactive';

    return 'active';
  },

  onComplete: (state) => ({
    stats: {
      ...state.stats,
      workerControl: Math.min(100, state.stats.workerControl + 10),
      economy: Math.min(100, state.stats.economy + 5),
      revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 10)
    }
  }),
  
  onFail: (state) => ({
    stats: {
      ...state.stats,
      workerControl: Math.max(0, state.stats.workerControl - 10)
    }
  }),

  activeEffect: {
    description: 'Ongoing rural unrest increases revolutionary fervor.',
    descriptionZh: '持续的农村动荡会增加革命热情。',
    apply: (state) => ({
      stats: {
        ...state.stats,
        revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 1),
      }
    })
  }
};
