import { Card } from '../types';
import { adjustFactionInfluence } from '../utils';

export const landAndFreedom: Card = {
  id: 'land_and_freedom',
  title: 'Land and Freedom',
  titleZh: '土地与自由',
  type: 'Action',
  description: 'The agrarian question is central to our revolution. We must decide how to reorganize the land and the agricultural economy in the regions we control.',
  descriptionZh: '土地问题是我们革命的核心。我们必须决定如何在我们控制的地区重组土地和农业经济。',
  cost: 1,
  resourceCost: 1,
  effect: (state) => ({
    currentEvent: {
      id: 'land_and_freedom_event',
      date: { year: state.year, month: state.month },
      title: 'Tierra y Libertad',
      titleZh: '土地与自由',
      description: 'The cry of "Tierra y Libertad" echoes across the countryside. The peasants and laborers are looking to the syndicates for leadership. To break the power of the Latifundistas and feed the revolution, we must implement our agrarian vision. But what form should it take? Complete collectivization, voluntary cooperatives, or immediate confiscation by force?',
      descriptionZh: '“土地与自由”的呼声在乡村回荡。农民和劳工作为受压迫者，正指望工会来领导他们。为了打破大地主的权力并为革命提供补给，我们必须实施我们的土地愿景。但这应该采取什么形式？是彻底的集体化、自愿的合作社，还是立即的武力没收（充公）？',
      options: [
        {
          text: 'COLECTIVIZACIONES (Collectivizations)',
          textZh: 'COLECTIVIZACIONES (农业集体化)',
          subtitle: 'Abolish money and property inside the rural collectives. Work according to ability, receive according to need.',
          subtitleZh: '在农村集体中废除货币和私有财产。各尽所能，按需分配。',
          effect: (s) => {
            const overallDissent = 
              (s.factions.Treintistas.influence * s.factions.Treintistas.dissent +
               s.factions.Cenetistas.influence * s.factions.Cenetistas.dissent +
               s.factions.Faistas.influence * s.factions.Faistas.dissent +
               s.factions.Puristas.influence * s.factions.Puristas.dissent) / 100;
            const multiplier = 1 - (overallDissent / 100);
            return {
              stats: {
                ...s.stats,
                workerControl: Math.min(100, s.stats.workerControl + 5),
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 5 * multiplier),
              },
              factions: adjustFactionInfluence(s.factions, 'Cenetistas', 5),
              domesticPolicy: {
                ...s.domesticPolicy,
                land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 3)
              }
            };
          }
        },
        {
          text: 'Cooperativa (Cooperatives)',
          textZh: 'Cooperativa (合作社模式)',
          subtitle: 'Encourage voluntary cooperatives. Maintain some individual plots to appease the moderate peasantry and boost yields.',
          subtitleZh: '鼓励建立自愿的合作社。保留部分个人地块，以安抚温和的农户并提高农业产量。',
          effect: (s) => {
            return {
              factions: adjustFactionInfluence(s.factions, 'Treintistas', 5),
              domesticPolicy: {
                ...s.domesticPolicy,
                land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 5)
              }
            };
          }
        },
        {
          text: 'Incautación (Confiscation)',
          textZh: 'Incautación (直接充公)',
          subtitle: 'Seize the estates of the Latifundistas and the reactionaries immediately to supply our forces.',
          subtitleZh: '立即没收大地主和反动派的庄园，以充实我们的武力和资源。',
          effect: (s) => {
            return {
              armaments: Math.max(0, s.armaments - 1),
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 5),
              },
              factions: adjustFactionInfluence(s.factions, 'Faistas', 5),
              domesticPolicy: {
                ...s.domesticPolicy,
                land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 10)
              }
            };
          }
        }
      ]
    }
  }),
};
