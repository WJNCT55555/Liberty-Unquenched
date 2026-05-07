import { GameEvent } from '../types';

export const foundingOfFalange: GameEvent = {
  id: 'Founding of Falange Española',
  date: { year: 1933, month: 10 },
  title: 'The Founding of Falange Española',
  titleZh: '西班牙长枪党的成立',
  description: `José Antonio Primo de Rivera, son of the former dictator, has officially founded the Falange Española at the Teatro de la Comedia in Madrid. Denouncing both liberal capitalism and Marxist socialism, he advocates for a totalitarian, national-syndicalist state. The fascist threat in Spain is no longer just a fringe idea; it is now an organized political force.`,
  descriptionZh: `前独裁者之子何塞·安东尼奥·普里莫·德里维拉在马德里喜剧剧院正式宣告成立“西班牙长枪党”。他同时谴责自由资本主义与马克思社会主义，主张建立一个极权主义的国家工团主义政权。西班牙的法西斯威胁不再仅仅是边缘思想，它现在已成为一股有组织的政治力量。`,
  options: [
    {
      text: 'Let us wait and see',
      textZh: '让我们静观其变',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        
        // FE gains some initial support from the Aristocracy, Middle Class, and Church
        newClasses.Latifundistas.support.FE = Math.min(100, newClasses.Latifundistas.support.FE + 10);
        newClasses.PequenaBurguesia.support.FE = Math.min(100, newClasses.PequenaBurguesia.support.FE + 5);
        newClasses.Clero.support.FE = Math.min(100, newClasses.Clero.support.FE + 5);
        
        return {
          classes: newClasses,
          fe_founded: true
        };
      }
    }
  ]
};
