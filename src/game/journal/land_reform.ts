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
  failureCondition: 'Puristas Influence > 80 by 1936',
  failureConditionZh: '到1936年，纯粹派（Puristas）影响力超过 80',
  failureEffectDesc: 'Tension +15, Worker Control -10',
  failureEffectDescZh: '紧张局势 +15，工人控制度 -10',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => state.domesticPolicy.land_reform_progress,
  
  checkStatus: (state, entryState) => {
    // Only activate if not already completed/failed
    if (entryState.status === 'completed' || entryState.status === 'failed') return null;
    
    // Complete if land reform progress reaches 100
    if (entryState.progress >= 100 || state.domesticPolicy.land_reform_progress >= 100) return 'completed';
    
    // Fail if latifundistas get too much support / other failure condition
    if (state.factions.Puristas.influence > 80 && state.year >= 1936) return 'failed';

    return 'active';
  },

  onComplete: (state) => ({
    stats: {
      ...state.stats,
      workerControl: Math.min(100, state.stats.workerControl + 10),
      economy: Math.min(100, state.stats.economy + 5)
    }
  }),
  
  onFail: (state) => ({
    stats: {
      ...state.stats,
      tension: Math.min(100, state.stats.tension + 15),
      workerControl: Math.max(0, state.stats.workerControl - 10)
    }
  }),

  activeEffect: {
    description: 'Ongoing rural unrest decreases economy and increases tension.',
    descriptionZh: '持续的农村动荡会降低经济并增加紧张局势。',
    apply: (state) => ({
      stats: {
        ...state.stats,
        tension: Math.min(100, state.stats.tension + 1), // Optional monthly tick effect
      }
    })
  }
};
