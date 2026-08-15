import { Card, Faction, GameEvent, GameState, SocialClass } from '../types';
import {
  adjustClassSupport,
  adjustFactionDissent,
  adjustFactionDissents,
  adjustFactionInfluence,
  getDissentMultiplier
} from '../utils';
import type { ClassPoliticalForce } from '../utils';

const PRREVS_CAMPAIGN_COOLDOWN = 3;
const PRREVS_CAMPAIGN_RESOURCE_COST = 1;

type ClassSupportDelta = [SocialClass, ClassPoliticalForce, number];

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const clampRelation = (value: number) => Math.max(-100, Math.min(100, value));

const adjustClassSupports = (
  classes: GameState['classes'],
  deltas: ClassSupportDelta[]
): GameState['classes'] => {
  return deltas.reduce((updatedClasses, [targetClass, targetForce, delta]) => {
    return adjustClassSupport(updatedClasses, targetClass, targetForce, delta);
  }, classes);
};

const influenceThenDissent = (
  factions: GameState['factions'],
  targetFaction: Faction,
  influenceDelta: number,
  dissentDeltas: Partial<Record<Faction, number>>
): GameState['factions'] => {
  const influencedFactions = adjustFactionInfluence(factions, targetFaction, influenceDelta);
  return adjustFactionDissents(influencedFactions, dissentDeltas);
};

const hasCampaignResource = (state: GameState) => {
  return state.resources >= PRREVS_CAMPAIGN_RESOURCE_COST;
};

const campaignResourceUnavailable = () => 'Need at least 1 resource.';
const campaignResourceUnavailableZh = () => '需要至少 1 资源。';

export const prrevsCampaigning: Card = {
  id: 'prrevs_campaigning',
  title: 'PRRevS Electoral Campaign',
  titleZh: 'PRRevS竞选宣传',
  type: 'Action',
  description:
    'With the Revolutionary Republican Syndicalist Party (PRRevS) now formed, the Treintistas argue that electoral campaigning is as essential as street agitation. The ballot box is a weapon the anarchist movement has long rejected, but the moderates insist: in the Republic, ignoring elections is surrendering ground to our enemies. Where should we focus our campaign efforts?',
  descriptionZh:
    '革命共和工团党（PRRevS）成立后，三十人集团认为选举宣传与街头鼓动同等重要。投票箱是无政府主义运动长期拒绝的武器，但温和派坚持认为：在共和国中，忽视选举就是将阵地拱手让给敌人。我们应该将竞选重点放在哪里？',
  cost: 1,
  condition: (state: GameState) => {
    return (
      !state.treintistasLeft &&
      state.factions.Treintistas.influence > 0 &&
      state.isPRRevSFormed &&
      state.prrevs_campaign_timer <= 0
    );
  },
  effect: (state: GameState): Partial<GameState> => {
    const dissentFactor = getDissentMultiplier(state.factions);
    const options: GameEvent['options'] = [];

    options.push({
      text: 'Obreros Industriales — The factory floors and shipyards. (-1 Resource)',
      textZh: '工业工人——工厂车间与造船厂。(-1 资源)',
      subtitle:
        'Our natural constituency. The workers who built the CNT with their calloused hands deserve to hear why the PRRevS is their political voice.',
      subtitleZh:
        '我们天然的选民基础。那些用满是老茧的双手建造了CNT的工人，应该听到为什么PRRevS是他们的政治声音。',
      condition: hasCampaignResource,
      unavailableSubtitle: campaignResourceUnavailable,
      unavailableSubtitleZh: campaignResourceUnavailableZh,
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 14 * dissentFactor]
        ]);
        const factions = influenceThenDissent(s.factions, 'Treintistas', 3, {
          Treintistas: -5,
          Faistas: 5,
          Puristas: 3
        });

        return {
          resources: s.resources - PRREVS_CAMPAIGN_RESOURCE_COST,
          prrevs_campaign_timer: PRREVS_CAMPAIGN_COOLDOWN,
          classes,
          factions,
          stats: {
            ...s.stats,
            workerControl: clampPercent(s.stats.workerControl + 2 * dissentFactor),
            bureaucratization: clampPercent(s.stats.bureaucratization + 2)
          },
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'Braceros y Campesinos — The landless and the smallholders. (-1 Resource)',
      textZh: '雇农与农民——无地者与小土地持有者。(-1 资源)',
      subtitle:
        'The latifundios have ruled the countryside for centuries. We must tell the rural poor that the PRRevS fights for land and bread.',
      subtitleZh:
        '大庄园统治乡村数个世纪。我们必须告诉农村贫民，PRRevS为土地和面包而战。',
      condition: hasCampaignResource,
      unavailableSubtitle: campaignResourceUnavailable,
      unavailableSubtitleZh: campaignResourceUnavailableZh,
      effect: (s: GameState): Partial<GameState> => {
        const landBonus = s.domesticPolicy.land_reform_progress > 0 ? 1.5 : 1;
        const classes = adjustClassSupports(s.classes, [
          ['Braceros', 'CNT_FAI', 11 * dissentFactor],
          ['Labradores', 'CNT_FAI', 7 * dissentFactor]
        ]);
        const factions = influenceThenDissent(s.factions, 'Treintistas', 2, {
          Treintistas: -4,
          Puristas: 4
        });

        return {
          resources: s.resources - PRREVS_CAMPAIGN_RESOURCE_COST,
          prrevs_campaign_timer: PRREVS_CAMPAIGN_COOLDOWN,
          classes,
          factions,
          stats: {
            ...s.stats,
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 2 * dissentFactor * landBonus)
          },
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'Pequeña Burguesía — Shopkeepers, artisans, and small traders. (-1 Resource)',
      textZh: '小资产阶级——店主、手工艺人与小商贩。(-1 资源)',
      subtitle:
        'They fear the monopolists above and the proletarian mob below. The PRRevS can offer them a vision of a cooperative economy that protects their dignity.',
      subtitleZh:
        '他们既恐惧上方的垄断资本，又惧怕下方的无产阶级暴民。PRRevS可以为他们提供一个保护其尊严的合作社经济愿景。',
      condition: hasCampaignResource,
      unavailableSubtitle: campaignResourceUnavailable,
      unavailableSubtitleZh: campaignResourceUnavailableZh,
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['PequenaBurguesia', 'CNT_FAI', 11 * dissentFactor]
        ]);
        const factions = influenceThenDissent(s.factions, 'Treintistas', 2, {
          Treintistas: -3,
          Faistas: 8,
          Puristas: 6
        });

        return {
          resources: s.resources - PRREVS_CAMPAIGN_RESOURCE_COST,
          prrevs_campaign_timer: PRREVS_CAMPAIGN_COOLDOWN,
          classes,
          factions,
          stats: {
            ...s.stats,
            bureaucratization: clampPercent(s.stats.bureaucratization + 3),
            revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 2)
          },
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'Intelectuales y Profesionales — Teachers, lawyers, doctors, and journalists. (-1 Resource)',
      textZh: '知识分子与专业人士——教师、律师、医生与记者。(-1 资源)',
      subtitle:
        'Their pens shape public opinion. The PRRevS must convince the educated classes that syndicalism is the rational path to a modern, just society.',
      subtitleZh:
        '他们的笔塑造着公众舆论。PRRevS必须说服知识阶层，工团主义是通向现代公正社会的理性道路。',
      condition: hasCampaignResource,
      unavailableSubtitle: campaignResourceUnavailable,
      unavailableSubtitleZh: campaignResourceUnavailableZh,
      effect: (s: GameState): Partial<GameState> => {
        const propagandaBonus = s.propaganda_timer <= 0 ? 1.3 : 1;
        const classes = adjustClassSupports(s.classes, [
          ['Intelectuales', 'CNT_FAI', 14 * dissentFactor]
        ]);
        const factions = influenceThenDissent(s.factions, 'Treintistas', 3, {
          Treintistas: -4,
          Faistas: 4
        });

        return {
          resources: s.resources - PRREVS_CAMPAIGN_RESOURCE_COST,
          prrevs_campaign_timer: PRREVS_CAMPAIGN_COOLDOWN,
          classes,
          factions,
          stats: {
            ...s.stats,
            bureaucratization: clampPercent(s.stats.bureaucratization + 1)
          },
          pro_republic: clampPercent(s.pro_republic + 3 * dissentFactor * propagandaBonus),
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'Mujeres Trabajadoras — The invisible half of the working class. (-1 Resource)',
      textZh: '劳动妇女——工人阶级中被忽视的另一半。(-1 资源)',
      subtitle:
        'Women toil in factories, fields, and homes, yet their voices are silenced. The PRRevS must bring them into the political struggle.',
      subtitleZh:
        '妇女在工厂、田野和家庭中劳作，她们的声音却被压制。PRRevS必须将她们带入政治斗争。',
      condition: hasCampaignResource,
      unavailableSubtitle: campaignResourceUnavailable,
      unavailableSubtitleZh: campaignResourceUnavailableZh,
      effect: (s: GameState): Partial<GameState> => {
        const mujeresBonus = s.mujeres_libres_established ? 1.5 : 1;
        const classes = adjustClassSupports(s.classes, [
          ['Obreros', 'CNT_FAI', 8 * dissentFactor],
          ['Intelectuales', 'CNT_FAI', 4 * dissentFactor],
          ['Braceros', 'CNT_FAI', 2 * dissentFactor]
        ]);
        const factions = adjustFactionDissents(s.factions, {
          Treintistas: -3,
          Cenetistas: -2,
          Puristas: 3
        });

        return {
          resources: s.resources - PRREVS_CAMPAIGN_RESOURCE_COST,
          prrevs_campaign_timer: PRREVS_CAMPAIGN_COOLDOWN,
          classes,
          factions,
          stats: {
            ...s.stats,
            workerControl: clampPercent(s.stats.workerControl + 2 * dissentFactor * mujeresBonus),
            revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + dissentFactor)
          },
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'Católicos Progresistas — Progressive Catholics seeking a social gospel. (-1 Resource)',
      textZh: '进步天主教徒——寻求社会福音的进步派信徒。(-1 资源)',
      subtitle:
        'Not all believers are Carlist reactionaries. Many Catholics yearn for social justice. The PRRevS can show them that syndicalism and Christian charity are not enemies.',
      subtitleZh:
        '并非所有信徒都是卡洛斯派反动分子。许多天主教徒渴望社会正义。PRRevS可以向他们展示，工团主义与基督教仁爱并非仇敌。',
      condition: (s: GameState) => {
        return hasCampaignResource(s) && s.domesticPolicy.religion_policy >= 2;
      },
      unavailableSubtitle: (s: GameState) => {
        return s.resources < PRREVS_CAMPAIGN_RESOURCE_COST
          ? 'Need at least 1 resource.'
          : 'Our anti-clerical stance makes Catholic outreach politically impossible.';
      },
      unavailableSubtitleZh: (s: GameState) => {
        return s.resources < PRREVS_CAMPAIGN_RESOURCE_COST
          ? '需要至少 1 资源。'
          : '我们的反教权立场使面向天主教徒的宣传在政治上不可能。';
      },
      effect: (s: GameState): Partial<GameState> => {
        const classes = adjustClassSupports(s.classes, [
          ['Clero', 'CNT_FAI', 8 * dissentFactor],
          ['PequenaBurguesia', 'CNT_FAI', 2 * dissentFactor]
        ]);
        const factions = influenceThenDissent(s.factions, 'Treintistas', 2, {
          Treintistas: -2,
          Faistas: 12,
          Puristas: 10
        });

        return {
          resources: s.resources - PRREVS_CAMPAIGN_RESOURCE_COST,
          prrevs_campaign_timer: PRREVS_CAMPAIGN_COOLDOWN,
          classes,
          factions,
          partyRelations: {
            ...s.partyRelations,
            CT: clampRelation((s.partyRelations.CT || 0) + 2)
          },
          stats: {
            ...s.stats,
            bureaucratization: clampPercent(s.stats.bureaucratization + 2),
            revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 3)
          },
          currentEvent: null
        };
      }
    });

    options.push({
      text: 'The moment is not right. Postpone the campaign.',
      textZh: '时机不对。推迟竞选活动。',
      subtitle: 'Preserve our limited resources for more urgent matters.',
      subtitleZh: '保留我们有限的资源用于更紧迫的事务。',
      effect: (s: GameState): Partial<GameState> => {
        const factions = adjustFactionDissent(s.factions, 'Treintistas', 5);

        return {
          prrevs_campaign_timer: PRREVS_CAMPAIGN_COOLDOWN,
          factions,
          currentEvent: null
        };
      }
    });

    return {
      currentEvent: {
        id: 'prrevs_campaigning_event',
        date: { year: state.year, month: state.month },
        title: 'PRRevS Electoral Campaign',
        titleZh: 'PRRevS竞选宣传',
        description:
          'With the Revolutionary Republican Syndicalist Party (PRRevS) now formed, the Treintistas argue that electoral campaigning is as essential as street agitation. The ballot box is a weapon the anarchist movement has long rejected, but the moderates insist: in the Republic, ignoring elections is surrendering ground to our enemies.\n\nThe campaign committee has prepared materials, rented halls, and lined up speakers. Ángel Pestaña himself has offered to headline the first rally. Now we must decide: to whom do we direct our message?',
        descriptionZh:
          '革命共和工团党（PRRevS）成立后，三十人集团认为选举宣传与街头鼓动同等重要。投票箱是无政府主义运动长期拒绝的武器，但温和派坚持认为：在共和国中，忽视选举就是将阵地拱手让给敌人。\n\n竞选委员会已经准备好了材料、租用了会场并安排了演讲者。安赫尔·佩斯塔尼亚本人也主动提出为首场集会站台。现在我们必须决定：我们的信息应该传达给谁？',
        options
      }
    };
  }
};
