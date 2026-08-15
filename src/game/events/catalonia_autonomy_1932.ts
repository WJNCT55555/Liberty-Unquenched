import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';

const lawMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  tags: ['law'],
};

export const cataloniaAutonomy1932: GameEvent = {
  id: 'catalonia_autonomy_1932',
  meta: lawMeta,
  date: { year: 1932, month: 9 },
  condition: (state) => isAtOrAfter(state, 1932, 9) && state.government.type === 'Republican-Socialist Cabinet',
  title: 'Estatuto de Autonomía de Cataluña de 1932',
  titleZh: '1932年加泰罗尼亚自治法令',
  description: 'The Cortes Generales of the Spanish Republic has approved the Statute of Autonomy of Catalonia (Estatuto de Nuria). This landmark legislation establishes the Generalitat of Catalonia as the regional self-governing body, featuring its own parliament, executive council, and special jurisdiction over local finance, civil law, and police. While Catalan is recognized as a co-official language alongside Castilian, the statute has sparked immense pride in Barcelona, and deep resentment among centralist conservatives.',
  descriptionZh: '西班牙共和国议会正式表决通过了《加泰罗尼亚自治法令》（又称努里亚法令）。这一极其重要的历史性法案正式设立了加泰罗尼亚自治政府（Generalitat），赋予其专属议会、行政委员，以及在地方财政、民法、治安管制等领域的高度自主权。同时，加泰罗尼亚语同卡斯蒂利亚语被列为共同官方语言。此极大地鼓舞了巴塞罗那的世俗大众，但也引发了马德里保守主义集权阶层的深度愤慨与抗议。',
  options: [
    {
      text: 'A victory for regional autonomy and federalism under the Republic.',
      textZh: '地方自治与联邦主义在共和国治下结出的胜利果实。',
      effect: (state) => ({
        regionalStatuses: {
          ...state.regionalStatuses,
          catalonia: 'autonomy'
        },
        partyRelations: {
          ...state.partyRelations,
          ERC: Math.min(100, (state.partyRelations.ERC || 0) + 15)
        }
      })
    }
  ]
};
