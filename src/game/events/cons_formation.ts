import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';
import { isOrganizationEstablished, setOrganizationEstablished } from '../organizations';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

export const consFormation: GameEvent = {
  id: 'cons_formation',
  meta: newsMeta,
  date: { year: 1934, month: 6 },
  condition: (state) =>
    state.scenario !== '1936'
    && isAtOrAfter(state, 1934, 6)
    && !isOrganizationEstablished(state, 'CONS')
    && (state.fe_founded || isOrganizationEstablished(state, 'FE')),
  title: 'The Falange Found a Labour Central',
  titleZh: '长枪党成立国家工团工会组织',
  description: 'The Falange has created the National-Syndicalist Labour Central (CONS), an attempt to draw workers away from the class unions and into a national-syndicalist organisation that preaches harmony between labour and capital under a totalitarian state. Its membership is tiny, and the great unions treat it with contempt. But the idea it represents — that the workers can be organised on the employers\' side — is not going to disappear on its own.',
  descriptionZh: '长枪党成立了国家工团工会组织（CONS），试图把工人从阶级工会中拉走，纳入一个鼓吹在极权国家之下劳资和谐的"国家工团主义"组织。它的成员微不足道，各大工会对它嗤之以鼻。但它所代表的那种想法——工人可以被组织到雇主那一边去——不会自己消失。',
  options: [
    {
      text: 'A rival union of the Falange. Note it.',
      textZh: '长枪党的对手工会。记下它。',
      subtitle: 'Founds the CONS.',
      subtitleZh: '成立国家工团工会组织（CONS）。',
      effect: (state) => ({
        ...setOrganizationEstablished(state, 'CONS'),
      }),
    },
  ],
};
