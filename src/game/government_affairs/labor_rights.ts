import { Card, GameState } from '../types';
import { adjustFactionDissents, adjustFactionInfluence, adjustClassSupport } from '../utils';

export const laborRights: Card = {
  id: 'labor_rights',
  title: 'Labor Rights',
  titleZh: '劳工权利',
  type: 'Government',
  description: 'With control of the Labor Ministry, we can set national standards for labor. Our supporters expect us to enforce a 40-hour work week and enforce safety regulations, as well as fully fund the unemployment insurance program.',
  descriptionZh: '通过控制劳工部，我们可以制定国家劳工标准。我们的支持者期望我们实行40小时工作周、执行安全法规，并全额资助失业保险计划。',
  cost: 1,
  condition: (state: GameState) => {
    const isGov = state.cntStance === 'govern';
    const isMinister = state.ministers.labor === 'CNT';
    const isTimerZero = (state.labor_rights_timer || 0) <= 0;
    return isGov && isMinister && isTimerZero;
  },
  effect: (state: GameState) => {
    return {
      currentEvent: {
        id: 'labor_rights_event',
        title: 'Labor Rights',
        titleZh: '劳工权利',
        description: 'With control of the Labor Ministry, we can set national standards for labor. Our supporters expect us to enforce a 40-hour work week and enforce safety regulations, as well as fully fund the unemployment insurance program.',
        descriptionZh: '通过控制劳工部，我们可以制定国家劳工标准。我们的支持者期望我们实行40小时工作周、执行安全法规，并全额资助失业保险计划。',
        options: [
          {
            text: 'Enforce the 40-hour work week',
            textZh: '强制执行40小时工作周',
            subtitle: 'Enforce the standard 40-hour work week nationwide to guarantee humane hours and build union legitimacy.',
            subtitleZh: '在全国范围内推行40小时工作周制度，促进保障性标准，提升工会权威。',
            effect: (s: GameState) => {
              let newClasses = s.classes;
              let newFactions = adjustFactionDissents(s.factions, {
                Treintistas: -5,
                Cenetistas: -5
              });
              newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 5);
              newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 5);
              
              const overallDissent = (newFactions.Treintistas.dissent + newFactions.Cenetistas.dissent + newFactions.Faistas.dissent + newFactions.Puristas.dissent) / 400;
              const bonus = Math.round(7 * (1 - overallDissent));
              newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', bonus);
              
              return {
                labor_rights_timer: 10,
                factions: newFactions,
                classes: newClasses,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  max_hours_law: Math.min(4, s.domesticPolicy.max_hours_law + 1)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 5)
                }
              };
            }
          },
          {
            text: 'Shorten work hours less than 40 hours',
            textZh: '进一步缩短工时至40小时以下',
            subtitle: 'Could we induce more hiring and reduce unemployment by reducing work hours?',
            subtitleZh: '我们能通过减少工时来促使更多招聘并降低失业率吗？',
            condition: (s: GameState) => s.domesticPolicy.max_hours_law === 3,
            unavailableSubtitle: () => 'Requires the maximum-hours law to be exactly level 3.',
            unavailableSubtitleZh: () => '需要最高工时法律等级正好为 3。',
            effect: (s: GameState) => {
              let newClasses = s.classes;
              let newFactions = adjustFactionDissents(s.factions, {
                Treintistas: -5,
                Cenetistas: -5
              });
              newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 5);
              
              const overallDissent = (newFactions.Treintistas.dissent + newFactions.Cenetistas.dissent + newFactions.Faistas.dissent + newFactions.Puristas.dissent) / 400;
              const bonus = Math.round(6 * (1 - overallDissent));
              newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', bonus);
              
              return {
                labor_rights_timer: 10,
                factions: newFactions,
                classes: newClasses,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  max_hours_law: Math.min(4, s.domesticPolicy.max_hours_law + 1)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 8)
                }
              };
            }
          },
          {
            text: 'Develop and enforce safety regulations',
            textZh: '制定并执行安全法规',
            subtitle: 'Enforce strict industrial safety standards to save worker lives on the shop floor.',
            subtitleZh: '强制执行严格的工业安全法规，旨在保护危险岗位工人的生命和健康安全。',
            condition: (s: GameState) => s.domesticPolicy.workplace_safety <= 3,
            unavailableSubtitle: () => 'Workplace safety law is already above level 3.',
            unavailableSubtitleZh: () => '工作环境安全法律等级已经高于 3。',
            effect: (s: GameState) => {
              let newClasses = s.classes;
              let newFactions = adjustFactionDissents(s.factions, {
                Cenetistas: -5
              });
              newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 2);
              
              const overallDissent = (newFactions.Treintistas.dissent + newFactions.Cenetistas.dissent + newFactions.Faistas.dissent + newFactions.Puristas.dissent) / 400;
              const bonus = Math.round(5 * (1 - overallDissent));
              newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', bonus);
              
              return {
                labor_rights_timer: 10,
                factions: newFactions,
                classes: newClasses,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  workplace_safety: Math.min(4, s.domesticPolicy.workplace_safety + 1)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 5)
                }
              };
            }
          }
        ]
      }
    };
  }
};
