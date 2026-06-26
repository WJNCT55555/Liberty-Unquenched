import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';
import { ramonCampaignEvent1, ramonCampaignEvent2, ramonCampaignEvent3 } from '../events/ramon_campaign_events';

export const ramonFranco: Advisor = {
  id: 'Ramón Franco',
  name: 'Ramón Franco',
  nameZh: '拉蒙·弗朗哥',
  faction: 'Jabalistas',
  description: 'A famous republican aviator and deputy, leader of the radical "Jabalíes" faction. He advocates for aggressive decentralization, federalism, and sweeping social changes, flying in the face of conservative republicans.',
  descriptionZh: '著名的共和派飞行员与议员，“野猪议员”（Jabalíes）集团的领袖。他主张激进的去中心化、联邦制和彻底的社会变革，是保守共和派和君主派眼中极具威胁的人物。',
  image: 'img/Ramon_Franco.png',
  actions: [
    {
      id: 'ramon_franco_federalist_agitation',
      title: 'Federalist Agitation',
      titleZh: '联邦主义宣传',
      subtitle: 'Agitate for localized autonomy and federal structures.',
      subtitleZh: '高呼去中心化与地方自治权力。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        domesticPolicy: {
          ...state.domesticPolicy,
          regional_autonomy_progress: Math.min(100, state.domesticPolicy.regional_autonomy_progress + 15)
        }
      }),
      description: 'Franco\'s passionate speeches for federal self-determination rally regionalists but deeply anger centralization forces.',
      descriptionZh: '拉蒙·弗朗哥为联邦自治所作的激情演讲争取到了地方主义者的支持，但也惊扰了中央集权派。',
    },
    {
      id: 'ramon_franco_cortex_speech',
      title: 'Wild Boar Speech',
      titleZh: '野猪议会抨击',
      subtitle: 'A raw, uncompromising speech in the Cortes to gain Jabalistas influence.',
      subtitleZh: '在议会发表好斗且绝不妥协的演说，提高野猪议员的影响力。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Jabalistas', 5);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 6),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 4)
          }
        };
      },
      description: 'His fiery oratorical strikes rally radical Republicans and leftists, driving up revolutionary zeal at the expense of central control.',
      descriptionZh: '他充满激情的政治演说吸引了激进的共和党人，推高了革命热情，但也削弱了中央控制。',
    },
    {
      id: 'ramon_franco_air_support',
      title: 'Plus Ultra Aviation Prep',
      titleZh: '空军整军',
      subtitle: 'Leverage his legendary aviation fame to inspire officers and train militiamen.',
      subtitleZh: '利用空军将领的声望与魅力，加强民兵并提升军队忠诚。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          armyLoyalty: Math.min(100, state.stats.armyLoyalty + 5),
          anarchistMilitia: state.stats.anarchistMilitia + 10
        }
      }),
      description: 'By sharing modern aviation wisdom with officers and organizing aerial volunteer units, we elevate our tactical preparedness.',
      descriptionZh: '通过向基层官兵传授航空战术并组织空中志愿飞行，有效提升了部队技术素养和民兵士气。',
    },
    {
      id: 'ramon_franco_campaign_president',
      title: 'Campaign for President',
      titleZh: '竞选总统',
      subtitle: 'Organize a massive regional campaign tour for his presidential bid.',
      subtitleZh: '为他的总统竞选组织一场大规模的地方巡回宣传活动。',
      unavailableSubtitle: (state) => state.journal?.journal_ramon_franco_presidency?.status !== 'active' ? 'Presidential campaign is not active.' : (state.advisorActionTimer > 0 ? `${state.advisorActionTimer} months before next action.` : 'Campaign limit reached (Max 3).'),
      unavailableSubtitleZh: (state) => state.journal?.journal_ramon_franco_presidency?.status !== 'active' ? '总统竞选活动尚未开启。' : (state.advisorActionTimer > 0 ? `距离下一次行动还有 ${state.advisorActionTimer} 个月。` : '竞选宣传次数已达上限（最多3次）。'),
      condition: (state) => state.journal?.journal_ramon_franco_presidency?.status === 'active' && state.advisorActionTimer <= 0 && (state.ramon_franco_campaign_count || 0) < 3,
      effect: (state) => {
        const count = (state.ramon_franco_campaign_count || 0) + 1;
        let campaignEvent = ramonCampaignEvent1;
        if (count === 2) {
          campaignEvent = ramonCampaignEvent2;
        } else if (count === 3) {
          campaignEvent = ramonCampaignEvent3;
        }
        return {
          ramon_franco_campaign_count: count,
          advisorActionTimer: 6,
          currentEvent: campaignEvent
        };
      },
      description: 'Launch a coordinated series of federalist rallies and regional campaign events.',
      descriptionZh: '发起一系列精心筹划的联邦主义集会与地方竞选演讲。',
    }
  ]
};
