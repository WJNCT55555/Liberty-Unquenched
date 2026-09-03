import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';
import { isOrganizationEstablished, setOrganizationEstablished } from '../organizations';

const organizationMeta = {
  category: 'cnt' as const,
  flow: 'solo' as const,
  series: ['organizations'],
  tags: ['organization', 'historical'],
};

/** Historical formation of the libertarian youth federation in the 1931 start. */
export const fijlFormation: GameEvent = {
  id: 'fijl_formation',
  meta: organizationMeta,
  date: { year: 1932, month: 1 },
  condition: (state) => (
    state.difficulty === 'historical'
    && state.scenario === '1931'
    && isAtOrAfter(state, 1932, 1)
    && !isOrganizationEstablished(state, 'FIJL')
  ),
  title: 'The FIJL Is Born',
  titleZh: 'FIJL成立',
  description: 'Libertarian youth groups from across Iberia have come together to form the Federación Ibérica de Juventudes Libertarias (FIJL). The new federation gives young militants a common organization for education, solidarity, and action within the CNT-FAI movement.',
  descriptionZh: '来自伊比利亚各地的自由青年团体联合起来，成立伊比利亚自由青年联合会（FIJL）。这个新组织为年轻活动家提供了共同的教育、互助与行动平台，并将其纳入 CNT-FAI 运动。',
  options: [
    {
      text: 'Welcome the new generation into the movement.',
      textZh: '欢迎新一代加入运动。',
      subtitle: 'Recognize the FIJL as the libertarian youth organization of the CNT-FAI.',
      subtitleZh: '承认 FIJL 为 CNT-FAI 的自由青年组织。',
      effect: (state) => ({
        ...setOrganizationEstablished(state, 'FIJL'),
      }),
    },
  ],
};
