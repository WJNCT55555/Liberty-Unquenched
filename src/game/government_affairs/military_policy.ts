import { Card, GameState } from '../types';
import { adjustFactionDissent } from '../utils';
import { ECONOMIC_RULES, clampMilitarySpending } from '../rules/economy';

export const militaryPolicy: Card = {
  id: 'military_policy',
  title: 'Military Policy',
  titleZh: '军事政策',
  type: 'Government',
  description: 'With the CNT holding the Ministry of War, we must decide our approach towards the army and defense.',
  descriptionZh: '由于CNT控制了战争部（国防部），我们必须决定对军队和国防的政策。',
  cost: 1,
  condition: (state) => state.cntStance === 'govern' && state.ministers.war === 'CNT' && (state.military_policy_timer || 0) <= 0,
  effect: (state: GameState) => {
    return {
      currentEvent: {
        id: 'military_policy_event',
        title: 'Military Policy',
        titleZh: '军事政策',
        description: 'With the CNT holding the Ministry of War, we must decide our approach towards the army and defense.',
        descriptionZh: '由于CNT控制了战争部（国防部），我们必须决定对军队和国防的政策。',
        date: { year: state.year, month: state.month },
        options: [
          {
            text: 'Increase Funding',
            textZh: '增加军费',
            subtitle: 'Military spending rises permanently. The military and right-wing parties are pleasantly surprised, this causes great controversy among our supporters, and our neighbors are worried.',
            subtitleZh: '军事开支将永久提高。军方和右翼政党对此感到惊喜，这在我们的支持者中引发了极大的争议，我们的邻国也对此忧心忡忡。',
            effect: (s: GameState): Partial<GameState> => ({
              military_policy_timer: 6,
              stats: {
                ...s.stats,
                armyLoyalty: Math.min(100, s.stats.armyLoyalty + 5),
              },
              factions: adjustFactionDissent(s.factions, 'Faistas', 5),
              partyRelations: {
                ...s.partyRelations,
                PCE: Math.max(-100, s.partyRelations.PCE - 5)
              },
              relations: {
                ...s.relations,
                portugal: Math.max(-100, s.relations.portugal - 5),
                france: Math.max(-100, s.relations.france - 5)
              },
              military_spending: clampMilitarySpending(
                (s.military_spending ?? ECONOMIC_RULES.defaults.militarySpending) + 1
              )
            })
          },
          {
            text: 'Decrease Funding',
            textZh: '削减军费',
            subtitle: 'Military spending falls permanently. The military has fewer guns and soldiers, and many demobilized soldiers have joined right-wing paramilitaries.',
            subtitleZh: '军事开支将永久降低。军方的枪支和士兵都减少了，许多复员士兵已经加入了右翼准军事组织。',
            effect: (s: GameState): Partial<GameState> => ({
              military_policy_timer: 6,
              coupProgress: (s.coupProgress || 0) + 1,
              stats: {
                ...s.stats,
                armyLoyalty: Math.max(0, s.stats.armyLoyalty - 3)
              },
              military_spending: clampMilitarySpending(
                (s.military_spending ?? ECONOMIC_RULES.defaults.militarySpending) - 1
              )
            })
          },
          {
            text: 'Reassign Disloyal Officers',
            textZh: '分配不忠的军官',
            subtitle: 'By reassigning officers suspected of disloyalty to the Republic, we can disrupt rebellion plans and set the coup back substantially, at the cost of the officer corps\' goodwill.',
            subtitleZh: '通过调离被怀疑对共和国不忠的军官，我们可以打乱叛乱部署、使政变进度大幅后退，代价是军官团的好感。',
            effect: (s: GameState): Partial<GameState> => ({
              military_policy_timer: 6,
              coupProgress: Math.max(0, (s.coupProgress || 0) - 5),
              stats: {
                ...s.stats,
                armyLoyalty: Math.max(0, s.stats.armyLoyalty - 5)
              }
            })
          },
          {
            text: 'Maintain Current Policy',
            textZh: '维持现有军事策略',
            subtitle: 'Avoid any new military directive for now; the War Ministry review still enters cooldown.',
            subtitleZh: '暂不发布新的军事指令；战争部政策审查仍会进入冷却。',
            effect: (s: GameState) => ({
              military_policy_timer: 6
            })
          }
        ]
      }
    };
  }
};
