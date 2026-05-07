import { Card, GameState, GameEvent } from '../types';

export const militaryPolicy: Card = {
  id: 'military_policy',
  title: 'Military Policy',
  titleZh: '军事政策',
  type: 'Government',
  description: 'With the CNT holding the Ministry of War, we must decide our approach towards the army and defense.',
  descriptionZh: '由于CNT控制了战争部（国防部），我们必须决定对军队和国防的政策。',
  cost: 1, // Add standard action point cost if applicable
  condition: (state) => state.isCNTInGovernment && state.ministers.war === 'CNT' && (state.military_policy_timer || 0) <= 0,
  effect: (state: GameState) => {
    return {
      currentEvent: {
        id: 'military_policy_event',
        title: 'Military Policy',
        titleZh: '军事政策',
        description: 'With the CNT holding the Ministry of War, we must decide our approach towards the army and defense.',
        descriptionZh: '由于CNT控制了战争部（国防部），我们必须决定对军队和国防的政策。',
        options: [
          {
            text: 'Increase Funding',
            textZh: '增加军费',
            subtitle: 'The military and right-wing parties are pleasantly surprised by the increased funding. This causes great controversy among our supporters, and our neighbors are worried.',
            subtitleZh: '军方和右翼政党对增加军费感到惊喜。这在我们的支持中引发了极大的争议，我们的邻国也对此忧心忡忡。',
            effect: (s: GameState) => ({
              military_policy_timer: 6,
              stats: {
                ...s.stats,
                armyLoyalty: Math.min(100, s.stats.armyLoyalty + 5),
              },
              armedForces: {
                ...s.armedForces,
                regularArmy: {
                  ...s.armedForces.regularArmy,
                  manpower: s.armedForces.regularArmy.manpower + 20000
                }
              },
              factions: {
                ...s.factions,
                Faistas: {
                  ...s.factions.Faistas,
                  dissent: Math.min(100, s.factions.Faistas.dissent + 5)
                }
              },
              partyRelations: {
                ...s.partyRelations,
                PCE: Math.max(-100, s.partyRelations.PCE - 5)
              },
              relations: {
                ...s.relations,
                portugal: Math.max(-100, s.relations.portugal - 5),
                france: Math.max(-100, s.relations.france - 5)
              }
            })
          },
          {
            text: 'Decrease Funding',
            textZh: '削减军费',
            subtitle: 'The military has fewer guns and soldiers, and many demobilized soldiers have joined right-wing paramilitaries.',
            subtitleZh: '军方的枪支和士兵都减少了，许多复员士兵已经加入了右翼准军事组织。',
            effect: (s: GameState) => ({
              military_policy_timer: 6,
              coupProgress: (s.coupProgress || 0) + 1,
              stats: {
                ...s.stats,
                armyLoyalty: Math.max(0, s.stats.armyLoyalty - 3)
              }
            })
          },
          {
            text: 'Reassign Disloyal Officers',
            textZh: '分配不忠的军官',
            subtitle: 'By reassigning officers suspected of disloyalty to the Republic, we can temporarily disrupt rebellion plans.',
            subtitleZh: '通过分配被怀疑对共和国不够忠诚的军官，可以暂时打乱叛乱的部署。',
            effect: (s: GameState) => ({
              military_policy_timer: 6,
              coupProgress: Math.max(0, (s.coupProgress || 0) - 1),
              stats: {
                ...s.stats,
                armyLoyalty: Math.max(0, s.stats.armyLoyalty - 5)
              }
            })
          },
          {
            text: 'Maintain Current Policy',
            textZh: '维持现有军事策略',
            subtitle: '',
            subtitleZh: '无',
            effect: (s: GameState) => ({
              military_policy_timer: 6
            })
          }
        ]
      }
    };
  }
};
