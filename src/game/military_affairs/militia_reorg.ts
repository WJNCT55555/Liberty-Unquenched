import { Card } from '../types';
import { adjustFactionDissent } from '../utils';

export const militiaReorg: Card = {
  id: 'militia_reorg',
  title: 'Militia Reorganization',
  titleZh: '民兵整编',
  type: 'Military',
  description: 'Adjust the organization of the militias.',
  descriptionZh: '调整民兵组织模式。',
  cost: 1,
  condition: (state) => state.civilWarStatus !== 'not_started' && state.militiaReorgTimer <= 0,
  effect: (state) => ({
    militiaReorgTimer: 1, // 4 weeks = 1 month
    currentEvent: {
      id: 'militia_reorg_event',
      date: { year: state.year, month: state.month },
      title: 'Militia Reorganization',
      titleZh: '民兵整编',
      description: 'The war demands constant adaptation. How should we organize our militias?',
      descriptionZh: '战争需要不断适应。我们应该如何组织我们的民兵？',
      options: [
        {
          text: 'Regular Training (-1 Armament)',
          textZh: '正规化训练 （-1军备）',
          subtitle: 'Spend equipment to drill the militia into a smaller but more capable fighting force.',
          subtitleZh: '投入军备训练民兵，使队伍规模缩小但战斗力更强。',
          condition: (s) => s.armaments >= 1,
          unavailableSubtitle: () => 'Need at least 1 armament.',
          unavailableSubtitleZh: () => '需要至少 1 军备。',
          effect: (s) => {
            return {
              armaments: s.armaments - 1,
              militiaCombatPower: s.militiaCombatPower + 5,
              armedForces: {
                ...s.armedForces,
                militias: {
                  ...s.armedForces.militias,
                  cntFai: Math.max(0, s.armedForces.militias.cntFai - 250)
                }
              },
              factions: adjustFactionDissent(s.factions, 'Puristas', 5)
            };
          }
        },
        {
          text: 'Recruit Militia (-1 Armament)',
          textZh: '招募民兵 （-1军备）',
          subtitle: 'Issue weapons broadly and bring more volunteers into the CNT-FAI militia.',
          subtitleZh: '广泛发放武器，让更多志愿者加入CNT-FAI民兵。',
          condition: (s) => s.armaments >= 1,
          unavailableSubtitle: () => 'Need at least 1 armament.',
          unavailableSubtitleZh: () => '需要至少 1 军备。',
          effect: (s) => {
            return {
              armaments: s.armaments - 1,
              armedForces: {
                ...s.armedForces,
                militias: {
                  ...s.armedForces.militias,
                  cntFai: s.armedForces.militias.cntFai + 1000
                }
              },
              factions: adjustFactionDissent(s.factions, 'Puristas', -5)
            };
          }
        },
        {
          text: 'Establish Assault Battalions (-1 Armament)',
          textZh: '建立突击营 （-1军备）',
          subtitle: 'Concentrate scarce weapons into elite assault units for decisive attacks.',
          subtitleZh: '将稀缺军备集中给精锐突击部队，用于决定性攻势。',
          condition: (s) => s.armaments >= 2,
          unavailableSubtitle: () => 'Need at least 2 armaments.',
          unavailableSubtitleZh: () => '需要至少 2 军备。',
          effect: (s) => {
            return {
              armaments: s.armaments - 2,
              militiaCombatPower: s.militiaCombatPower + 15,
              factions: adjustFactionDissent(s.factions, 'Puristas', 10)
            };
          }
        },
        {
          text: 'We do not intend to intervene in militia affairs',
          textZh: '我们不打算插手民兵事务',
          subtitle: 'Leave the militia structure unchanged for now.',
          subtitleZh: '暂时维持民兵组织现状。',
          effect: (s) => ({})
        }
      ]
    }
  }),
};
