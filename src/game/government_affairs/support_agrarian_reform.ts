import { Card } from '../types';
import { adjustFactionInfluence, adjustClassSupport } from '../utils';

export const supportAgrarianReform: Card = {
  id: 'support agrarian reform',
  title: 'Support Agrarian Reform',
  titleZh: '支持土地改革',
  type: 'Government',
  description: 'Support the Republic\'s agrarian reform to improve relations with IR and PSOE.',
  descriptionZh: '支持共和国的土地改革，改善与共和左翼(IR)和工人社会党(PSOE)的关系。',
  cost: 1,
  effect: (state) => {
    let newClasses = state.classes;
    newClasses = adjustClassSupport(newClasses, 'Braceros', 'IR', 10);
    newClasses = adjustClassSupport(newClasses, 'Braceros', 'PSOE', 5);
    newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', -15);
    return {
      classes: newClasses,
      factions: adjustFactionInfluence(state.factions, 'Treintistas', 10)
    };
  },
};
