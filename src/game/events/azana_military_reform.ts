import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';

const militaryReformMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  tags: ['law', 'military'],
};

export const azanaMilitaryReform: GameEvent = {
  id: 'azana_military_reform',
  meta: militaryReformMeta,
  date: { year: 1931, month: 5 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1931, 5),
  title: "Azaña's Military Reform",
  titleZh: '阿萨尼亚军事改革',
  description: 'As Minister of War, Manuel Azaña has launched a broad program to modernize the armed forces and place them firmly under civilian Republican authority. Voluntary retirement is offered to surplus officers, the oversized command structure is reduced, and the old military administration is reorganized. The reform promises a smaller and more professional army, but resentment is already spreading through conservative officers and the Africanist corps.',
  descriptionZh: '陆军部长曼努埃尔·阿萨尼亚开始推行一系列军事改革，以实现军队现代化，并将武装力量置于共和国文官政府的牢固控制之下。政府允许冗余军官自愿带薪退役，缩减臃肿的指挥体系，并重组旧有军事行政机构。这项改革有望建立一支规模更小、更专业的军队，但保守军官与非洲派军官的不满也正在蔓延。',
  options: [
    {
      text: 'The barracks must answer to the Republic.',
      textZh: '军营必须服从共和国。',
      subtitle: 'Advances the Army Reform Law by one level, up to L4.',
      subtitleZh: '军队改革法提升一级，最高不超过L4。',
      effect: (state) => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          army_reform_law: Math.min(4, state.domesticPolicy.army_reform_law + 1),
        },
      }),
    },
  ],
};
