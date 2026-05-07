import { JournalEntryDef } from '../types';

export const iberianDreamJournal: JournalEntryDef = {
  id: 'journal_iberian_dream',
  title: 'The Iberian Dream',
  titleZh: '伊比利亚之梦',
  description: 'The unification of the Iberian peninsula has long been a dream for many progressives and revolutionaries. To achieve an Iberian Federation, we must extend our influence into Portugal and support the revolutionary elements there against the Estado Novo.',
  descriptionZh: '伊比利亚半岛的统一长久以来是许多进步人士和革命者的梦想。为了实现伊比利亚联邦，我们必须将影响力扩展到葡萄牙，并支持那里的革命力量对抗“新国家”政权。',
  successCondition: 'Covert Ops in Portugal reaches 100',
  successConditionZh: '在葡萄牙的隐蔽行动进度达到 100',
  successEffectDesc: 'Economy +15, Republican Authority +15, Tension -5',
  successEffectDescZh: '经济 +15，共和国权威 +15，紧张局势 -5',
  failureCondition: 'Full civil war breaks out',
  failureConditionZh: '全面内战爆发',
  failureEffectDesc: 'The dream is shattered, Popular Front Unity -10',
  failureEffectDescZh: '梦想破灭，人民阵线团结度 -10',
  hasProgress: true,
  progressMax: 100,
  getProgress: (state) => state.covert_ops_portugal,
  
  checkStatus: (state, entryState) => {
    if (entryState.status === 'completed' || entryState.status === 'failed') return null;
    
    if (state.covert_ops_portugal >= 100) return 'completed';
    
    // Fail if civil war broke out
    if (state.civilWarStatus === 'ongoing') return 'failed';

    return 'active';
  },

  onComplete: (state) => ({
    stats: {
      ...state.stats,
      economy: Math.min(100, state.stats.economy + 15),
      republicanAuthority: Math.min(100, state.stats.republicanAuthority + 15),
      tension: Math.max(0, state.stats.tension - 5)
    }
  }),
  
  onFail: (state) => ({
    stats: {
      ...state.stats,
      popularFrontUnity: Math.max(0, state.stats.popularFrontUnity - 10)
    }
  }),

  activeEffect: {
    description: 'International tensions simmer as we meddle in our neighbor\'s affairs.',
    descriptionZh: '当我们干涉周边事务时，国际紧张局势正在酝酿。',
    apply: (state) => ({})
  }
};
