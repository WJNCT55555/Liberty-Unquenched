import type { GameEvent } from '../types';
import { adjustClassSupport, isAtOrAfter } from '../utils';
import { isOrganizationEstablished, setOrganizationEstablished } from '../organizations';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

export const maocFormation: GameEvent = {
  id: 'maoc_formation',
  meta: newsMeta,
  date: { year: 1933, month: 1 },
  condition: (state) =>
    state.scenario !== '1936'
    && isAtOrAfter(state, 1933, 1)
    && !isOrganizationEstablished(state, 'MAOC'),
  title: 'The Founding of the MAOC',
  titleZh: '工农反法西斯民兵（MAOC）成立',
  description: 'Answering the growth of fascist violence, the Communist Party of Spain has founded the Antifascist Workers\' and Peasants\' Militias (MAOC). Organized in the workplaces and in the countryside, these militia detachments are meant to meet the Falange\'s street squads and to give the Party a physical force of its own — independent of the Republican security forces, and independent of us.',
  descriptionZh: '面对法西斯暴力的增长，西班牙共产党成立了工农反法西斯民兵（MAOC）。这些民兵以工厂和乡村为单位组织起来，意在对抗长枪党的街头小队，并让共产党拥有一支自己的实体力量——既不依赖共和国的治安机构，也不依赖我们。',
  options: [
    {
      text: 'So the Communists are arming themselves too.',
      textZh: '共产党人也在武装自己了。',
      subtitle: 'Founds the MAOC and raises PCE support among workers by 3.',
      subtitleZh: '成立工农反法西斯民兵（MAOC），并提高产业工人对 PCE 的支持 3 点。',
      effect: (state) => ({
        classes: adjustClassSupport(state.classes, 'Obreros', 'PCE', 3),
        ...setOrganizationEstablished(state, 'MAOC'),
      }),
    },
  ],
};
