import { JournalEntryDef } from '../types';

export const regionalIssuesJournal: JournalEntryDef = {
  id: 'journal_regional_issues',
  title: 'The Regional Question',
  titleZh: '地区问题',
  description: 'Catalonia, the Basque Country, and Galicia demand greater autonomy. Failing to address these demands will alienate crucial allies and threaten the unity of the Republic, while giving in too much might provoke the centralist forces.',
  descriptionZh: '加泰罗尼亚、巴斯克地区和加利西亚要求获得更大的自治权。如果不满足这些要求，将会疏远至关重要的盟友并威胁共和国的统一，而让步太多可能会激怒中央集权势力。',
  successCondition: 'Regional Autonomy Progress reaches 100%',
  successConditionZh: '地区自治进度达到 100%',
  successEffectDesc: 'Republican Authority +10, Popular Front Unity +10',
  successEffectDescZh: '共和国权威 +10，人民阵线团结度 +10',
  failureCondition: 'Tension Reaches 90',
  failureConditionZh: '紧张局势达到 90',
  failureEffectDesc: 'Republican Authority -20, Tension +10',
  failureEffectDescZh: '共和国权威 -20，紧张局势 +10',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => state.domesticPolicy.regional_autonomy_progress,
  
  checkStatus: (state, entryState) => {
    if (entryState.status === 'completed' || entryState.status === 'failed') return null;
    
    // Complete if autonomy is high enough
    if (state.domesticPolicy.regional_autonomy_progress >= 100) {
      return 'completed';
    }
    
    // Fail if tension is too high
    if (state.stats.tension >= 90) return 'failed';

    return 'active';
  },

  onComplete: (state) => ({
    stats: {
      ...state.stats,
      republicanAuthority: Math.min(100, state.stats.republicanAuthority + 10),
      popularFrontUnity: Math.min(100, state.stats.popularFrontUnity + 10)
    }
  }),
  
  onFail: (state) => ({
    stats: {
      ...state.stats,
      republicanAuthority: Math.max(0, state.stats.republicanAuthority - 20),
      tension: Math.min(100, state.stats.tension + 10)
    }
  }),

  activeEffect: {
    description: 'Republican authority slowly erodes without a clear regional policy.',
    descriptionZh: '如果没有明确的地区政策，共和国的权威将慢慢被削弱。',
    apply: (state) => ({
      stats: {
        ...state.stats,
        republicanAuthority: Math.max(0, state.stats.republicanAuthority - 1)
      }
    })
  }
};
