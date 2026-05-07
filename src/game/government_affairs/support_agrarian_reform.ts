import { Card } from '../types';
import { adjustFactionInfluence } from '../utils';

export const supportAgrarianReform: Card = {
  id: 'support agrarian reform',
  title: 'Support Agrarian Reform',
  titleZh: '支持土地改革',
  type: 'Government',
  description: 'Support the Republic\'s agrarian reform to improve relations with IR and PSOE.',
  descriptionZh: '支持共和国的土地改革，改善与共和左翼(IR)和工人社会党(PSOE)的关系。',
  cost: 1,
  effect: (state) => {
    const newClasses = JSON.parse(JSON.stringify(state.classes));
    newClasses.Braceros.support.IR += 10;
    newClasses.Braceros.support.PSOE += 5;
    newClasses.Braceros.support.CNT_FAI -= 15;
    return {
      classes: newClasses,
      factions: adjustFactionInfluence(state.factions, 'Treintistas', 10)
    };
  },
};
