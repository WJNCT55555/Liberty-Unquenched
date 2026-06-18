import { Card, GameState } from '../types';
import { adjustFactionInfluence } from '../utils';

export const laborRights: Card = {
  id: 'labor_rights',
  title: 'Labor Rights',
  titleZh: '劳工权利',
  type: 'Government',
  description: 'With control of the Labor Ministry, we can set national standards for labor. Our supporters expect us to enforce a 40-hour work week and enforce safety regulations, as well as fully fund the unemployment insurance program.',
  descriptionZh: '通过控制劳工部，我们可以制定国家劳工标准。我们的支持者期望我们实行40小时工作周、执行安全法规，并全额资资助失业保险计划。',
  cost: 1,
  condition: (state: GameState) => {
    const isGov = state.cntStance === 'govern';
    const isMinister = state.ministers.labor === 'CNT' || state.labor_minister_party === 'CNT';
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
              const newClasses = JSON.parse(JSON.stringify(s.classes));
              let newFactions = JSON.parse(JSON.stringify(s.factions));
              
              newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 5);
              newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 5);
              newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 5);
              newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 5);
              
              const overallDissent = (newFactions.Treintistas.dissent + newFactions.Cenetistas.dissent + newFactions.Faistas.dissent + newFactions.Puristas.dissent) / 400;
              const bonus = Math.round(7 * (1 - overallDissent));
              if (newClasses.Obreros) {
                newClasses.Obreros.support.CNT_FAI = Math.min(100, Math.max(0, (newClasses.Obreros.support.CNT_FAI || 0) + bonus));
              }
              
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
            effect: (s: GameState) => {
              const newClasses = JSON.parse(JSON.stringify(s.classes));
              let newFactions = JSON.parse(JSON.stringify(s.factions));
              
              newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 5);
              newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 5);
              newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 5);
              
              const overallDissent = (newFactions.Treintistas.dissent + newFactions.Cenetistas.dissent + newFactions.Faistas.dissent + newFactions.Puristas.dissent) / 400;
              const bonus = Math.round(6 * (1 - overallDissent));
              if (newClasses.Obreros) {
                newClasses.Obreros.support.CNT_FAI = Math.min(100, Math.max(0, (newClasses.Obreros.support.CNT_FAI || 0) + bonus));
              }
              
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
            effect: (s: GameState) => {
              const newClasses = JSON.parse(JSON.stringify(s.classes));
              let newFactions = JSON.parse(JSON.stringify(s.factions));
              
              newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 5);
              newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 2);
              
              const overallDissent = (newFactions.Treintistas.dissent + newFactions.Cenetistas.dissent + newFactions.Faistas.dissent + newFactions.Puristas.dissent) / 400;
              const bonus = Math.round(5 * (1 - overallDissent));
              if (newClasses.Obreros) {
                newClasses.Obreros.support.CNT_FAI = Math.min(100, Math.max(0, (newClasses.Obreros.support.CNT_FAI || 0) + bonus));
              }
              
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
