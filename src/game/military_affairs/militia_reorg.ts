import { Card } from '../types';

export const militiaReorg: Card = {
  id: 'militia_reorg',
  title: 'Militia Reorganization',
  titleZh: '民兵整编',
  type: 'Military',
  description: 'Adjust the organization of the militias.',
  descriptionZh: '调整民兵组织模式。',
  cost: 0,
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
          text: 'Regular Training (Cost: 1 Armament, +5 Militarization, -250 Militia, +5 Durruti Dissent)',
          textZh: '正规化训练（消耗1军备 → 民兵军事化程度增加5，民兵人数-250，杜鲁提之友派分歧+5）',
          effect: (s) => {
            if (s.armaments < 1) return {};
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
              factions: {
                ...s.factions,
                Puristas: { ...s.factions.Puristas, dissent: Math.min(100, s.factions.Puristas.dissent + 5) }
              }
            };
          }
        },
        {
          text: 'Recruit Militia (Cost: 1 Armament, +1000 Militia, -5 Durruti Dissent)',
          textZh: '招募民兵（消耗1军备 → 民兵人数增加1000，杜鲁提之友分歧-5）',
          effect: (s) => {
            if (s.armaments < 1) return {};
            return {
              armaments: s.armaments - 1,
              armedForces: {
                ...s.armedForces,
                militias: {
                  ...s.armedForces.militias,
                  cntFai: s.armedForces.militias.cntFai + 1000
                }
              },
              factions: {
                ...s.factions,
                Puristas: { ...s.factions.Puristas, dissent: Math.max(0, s.factions.Puristas.dissent - 5) }
              }
            };
          }
        },
        {
          text: 'Establish Assault Battalions (Cost: 2 Armament, +15 Combat Power, +10 Durruti Dissent)',
          textZh: '建立突击营（消耗2军备 → 民兵战斗力+15，但杜鲁提之友派分歧+10）',
          effect: (s) => {
            if (s.armaments < 2) return {};
            return {
              armaments: s.armaments - 2,
              militiaCombatPower: s.militiaCombatPower + 15,
              factions: {
                ...s.factions,
                Puristas: { ...s.factions.Puristas, dissent: Math.min(100, s.factions.Puristas.dissent + 10) }
              }
            };
          }
        },
        {
          text: 'Cancel',
          textZh: '取消',
          effect: (s: any) => ({
            militiaReorgTimer: 0,
            hand: [...s.hand, militiaReorg]
          })
        }
      ]
    }
  }),
};
