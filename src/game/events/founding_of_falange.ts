import type { GameEvent } from '../types';
import { adjustClassSupport, isAtOrAfter } from '../utils';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

export const foundingOfFalange: GameEvent = {
  id: 'founding_of_falange',
  meta: newsMeta,
  date: { year: 1933, month: 10 },
  condition: (state) => isAtOrAfter(state, 1933, 10) && !state.fe_founded,
  title: 'The Founding of Falange Española',
  titleZh: '西班牙长枪党的成立',
  description: `José Antonio Primo de Rivera, son of the former dictator, has officially founded the Falange Española at the Teatro de la Comedia in Madrid. Denouncing both liberal capitalism and Marxist socialism, he advocates for a totalitarian, national-syndicalist state. The fascist threat in Spain is no longer just a fringe idea; it is now an organized political force.`,
  descriptionZh: `前独裁者之子何塞·安东尼奥·普里莫·德里维拉在马德里喜剧剧院正式宣告成立“西班牙长枪党”。他同时谴责自由资本主义与马克思社会主义，主张建立一个极权主义的国家工团主义政权。西班牙的法西斯威胁不再仅仅是边缘思想，它现在已成为一股有组织的政治力量。`,
  options: [
    {
      text: 'Let us wait and see',
      textZh: '让我们静观其变',
      subtitle: 'Founds Falange and increases FE support among landowners, the small bourgeoisie, and the clergy.',
      subtitleZh: '成立长枪党，并提高贵族大地主、小资产阶级和天主教会对长枪党（FE）的支持。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'FE', 10);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'FE', 5);
        newClasses = adjustClassSupport(newClasses, 'Clero', 'FE', 5);

        return {
          classes: newClasses,
          fe_founded: true,
        };
      },
    },
  ],
};
