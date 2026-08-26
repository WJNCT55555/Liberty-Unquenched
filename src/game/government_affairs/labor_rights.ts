import { Card, GameState } from '../types';
import { adjustFactionDissents, adjustFactionInfluence, adjustClassSupport, getDissentMultiplier } from '../utils';
import { clampLawLevel } from '../lawStances';

export const laborRights: Card = {
  id: 'labor_rights',
  title: 'Labor Rights',
  titleZh: '劳工权利',
  type: 'Government',
  description: 'With control of the Labor Ministry, we can choose between enforcing the urban workweek, extending strict national protection, shortening hours further, or improving industrial safety.',
  descriptionZh: '通过控制劳工部，我们可以在落实城市工时、建立全国严格保障、进一步缩短工时和改善工业安全之间确定政策重点。',
  cost: 1,
  condition: (state: GameState) => {
    const isGov = state.cntStance === 'govern';
    const isMinister = state.ministers.labor === 'CNT';
    const isTimerZero = (state.labor_rights_timer || 0) <= 0;
    return isGov && isMinister && isTimerZero;
  },
  effect: (state: GameState): Partial<GameState> => {
    return {
      currentEvent: {
        id: 'labor_rights_event',
        title: 'Labor Rights',
        titleZh: '劳工权利',
        description: 'The Labor Ministry can concentrate its authority on one enforceable labor standard. Which reform should receive inspectors, decrees, and political capital?',
        descriptionZh: '劳工部可以将行政权力集中于一项可执行的劳工标准。我们应当将劳工检查、政令和政治资本投向哪项改革？',
        date: { year: state.year, month: state.month },
        options: [
          {
            text: 'Prioritize enforcement of the urban 40-hour workweek',
            textZh: '优先保障城市40小时工作制落实',
            subtitle: 'Concentrate inspectors in industrial cities and establish the urban 40-hour workweek at level 2.',
            subtitleZh: '将劳工检查力量集中在工业城市，将最高工时法落实为 L2“城市40小时工作制”。',
            condition: (s: GameState) => {
              return s.domesticPolicy.max_hours_law < 2;
            },
            unavailableSubtitle: () => 'The urban 40-hour workweek is already in force or has been surpassed.',
            unavailableSubtitleZh: () => '城市40小时工作制已经实施，或已被更严格的法律取代。',
            effect: (s: GameState): Partial<GameState> => {
              let factions = adjustFactionDissents(s.factions, {
                Treintistas: -3,
                Cenetistas: -3
              });
              factions = adjustFactionInfluence(factions, 'Treintistas', 4);
              const workerSupport = Math.round(4 * getDissentMultiplier(factions));
              const classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', workerSupport);

              return {
                labor_rights_timer: 10,
                classes,
                factions,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  max_hours_law: clampLawLevel('max_hours_law', 2)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 2)
                },
                currentEvent: null
              };
            }
          },
          {
            text: 'Guarantee a strict 40-hour workweek nationwide',
            textZh: '全面保障严格的40小时工作制',
            subtitle: 'Use national enforcement powers to establish the strict 40-hour workweek at level 3.',
            subtitleZh: '运用全国性执法权力，将最高工时法提升为 L3“严格40小时工作制”。',
            condition: (s: GameState) => {
              return s.domesticPolicy.max_hours_law < 3;
            },
            unavailableSubtitle: () => 'A strict 40-hour workweek is already in force or has been surpassed.',
            unavailableSubtitleZh: () => '严格40小时工作制已经实施，或已被更短工时取代。',
            effect: (s: GameState): Partial<GameState> => {
              let factions = adjustFactionDissents(s.factions, {
                Treintistas: -5,
                Cenetistas: -5
              });
              factions = adjustFactionInfluence(factions, 'Cenetistas', 5);
              factions = adjustFactionInfluence(factions, 'Treintistas', 5);
              const workerSupport = Math.round(7 * getDissentMultiplier(factions));
              const classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', workerSupport);

              return {
                labor_rights_timer: 10,
                classes,
                factions,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  max_hours_law: clampLawLevel('max_hours_law', 3)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 5)
                },
                currentEvent: null
              };
            }
          },
          {
            text: 'Shorten the workweek below 40 hours',
            textZh: '进一步缩短工时至40小时以下',
            subtitle: 'Advance from the strict 40-hour standard to the 36-hour workweek at level 4.',
            subtitleZh: '在严格40小时工作制的基础上，将最高工时法提升为 L4“36小时工作制”。',
            condition: (s: GameState) => {
              return s.domesticPolicy.max_hours_law === 3;
            },
            unavailableSubtitle: () => 'Requires the strict 40-hour workweek at level 3.',
            unavailableSubtitleZh: () => '需要最高工时法正好处于 L3“严格40小时工作制”。',
            effect: (s: GameState): Partial<GameState> => {
              let factions = adjustFactionDissents(s.factions, {
                Treintistas: -5,
                Cenetistas: -5
              });
              factions = adjustFactionInfluence(factions, 'Cenetistas', 5);
              const workerSupport = Math.round(6 * getDissentMultiplier(factions));
              const classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', workerSupport);

              return {
                labor_rights_timer: 10,
                classes,
                factions,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  max_hours_law: clampLawLevel('max_hours_law', 4)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 8)
                },
                currentEvent: null
              };
            }
          },
          {
            text: 'Enact and enforce safety regulations',
            textZh: '制定并执行安全法规',
            subtitle: 'Raise workplace safety by one legal level through inspections and enforceable industrial standards.',
            subtitleZh: '通过劳工检查和可执行的工业标准，将工作环境安全法提升一级。',
            condition: (s: GameState) => {
              return s.domesticPolicy.workplace_safety < 4;
            },
            unavailableSubtitle: () => 'Workplace safety is already at its maximum level.',
            unavailableSubtitleZh: () => '工作环境安全法已达到最高等级。',
            effect: (s: GameState): Partial<GameState> => {
              let factions = adjustFactionDissents(s.factions, {
                Cenetistas: -5
              });
              factions = adjustFactionInfluence(factions, 'Cenetistas', 2);
              const workerSupport = Math.round(5 * getDissentMultiplier(factions));
              const classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', workerSupport);

              return {
                labor_rights_timer: 10,
                classes,
                factions,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  workplace_safety: clampLawLevel('workplace_safety', s.domesticPolicy.workplace_safety + 1)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 5)
                },
                currentEvent: null
              };
            }
          }
        ]
      }
    };
  }
};
