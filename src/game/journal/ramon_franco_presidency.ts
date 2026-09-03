import { JournalEntryDef } from '../types';
import { adjustFactionInfluence } from '../utils';
import { isOrganizationEstablished } from '../organizations';

export const ramonFrancoPresidencyJournal: JournalEntryDef = {
  id: 'journal_ramon_franco_presidency',
  title: 'The Iberian Eagle',
  titleZh: '伊比利亚之鹰',
  description: 'Ramón Franco — legendary aviator, adventurer, the rebel of the Franco family — has been swept up by the Jabalí movement into a mad ambition: running for President of the Republic. His platform is as blunt as it is dangerous: abolish centralism, forge an Iberian Federation from Gibraltar to Porto, from Cádiz to Andorra. Every region shall have full self-determination. This is either a grand revolution or suicide against the tide.',
  descriptionZh: '拉蒙·佛朗哥——传奇飞行员、冒险家、佛朗哥家族的叛逆者——在野猪运动的推波助澜之下，萌生了一个疯狂的念头：竞选共和国总统。他的纲领直白而危险：废除中央集权，建立从直布罗陀到波尔图、从加的斯到安道尔的伊比利亚联邦。每一个地区都将拥有完全的自决权。这要么是一场宏大的革命，要么是以卵击石的自杀。',
  
  successCondition: 'ERC relations >= 80 and Ramón Franco campaigns 3 times',
  successConditionZh: '与 ERC 的关系达到 80，且拉蒙·佛朗哥进行 3 次竞选宣传',
  successEffectDesc: 'Unlock President Ramón Franco, Jabalistas +10 influence, ERC relations +15, FAI/Puristas dissent +12',
  successEffectDescZh: '解锁总统拉蒙·佛朗哥，野猪派影响力 +10，ERC 关系 +15，FAI与纯洁派不服度 +12',
  
  hasProgress: true,
  progressMax: 3,
  getProgress: (state) => Math.min(3, state.ramon_franco_campaign_count || 0),

  checkStatus: (state, entryState) => {
    if (entryState.status === 'completed' || entryState.status === 'failed') return null;

    if (entryState.status === 'inactive') {
      const hasRamon = state.advisorPool.some(a => a?.id === 'Ramón Franco') || state.activeAdvisors.some(a => a?.id === 'Ramón Franco');
      const isReady = (state.factions.Jabalistas?.influence ?? 0) >= 15 &&
                      hasRamon &&
                      isOrganizationEstablished(state, 'PRRevS') &&
                      state.civilWarStatus === 'not_started' &&
                      !state.journal_ramon_franco_presidency_seen;
      
      if (isReady) {
        // We set the flag seen when activating
        state.journal_ramon_franco_presidency_seen = true;
        return 'active';
      }
      return 'inactive';
    }

    if (entryState.status === 'active') {
      // Complete condition: ERC relations >= 80, and ramon_franco_campaign_count >= 3
      const ercRelation = state.partyRelations?.ERC ?? 50;
      const campaignCount = state.ramon_franco_campaign_count ?? 0;
      if (ercRelation >= 80 && campaignCount >= 3) {
        return 'completed';
      }
    }

    return 'active';
  },

  onComplete: (state) => ({
    factions: (() => {
      let f = adjustFactionInfluence(state.factions, 'Jabalistas', 10);
      f.Faistas.dissent = Math.min(100, (f.Faistas.dissent || 0) + 12);
      f.Puristas.dissent = Math.min(100, (f.Puristas.dissent || 0) + 12);
      return f;
    })(),
    partyRelations: {
      ...state.partyRelations,
      ERC: Math.min(100, (state.partyRelations.ERC || 50) + 15)
    },
    stats: {
      ...state.stats,
      revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
      republicanAuthority: Math.max(0, state.stats.republicanAuthority - 5)
    }
  }),

  onFail: (state) => ({})
};
