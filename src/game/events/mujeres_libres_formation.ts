import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';
import { isOrganizationEstablished, setOrganizationEstablished } from '../organizations';

const organizationMeta = {
  category: 'cnt' as const,
  flow: 'solo' as const,
  series: ['organizations'],
  tags: ['organization', 'historical'],
};

/** Historical formation of Mujeres Libres in April 1936. */
export const mujeresLibresFormation: GameEvent = {
  id: 'mujeres_libres_formation',
  meta: organizationMeta,
  date: { year: 1936, month: 4 },
  condition: (state) => (
    state.difficulty === 'historical'
    && state.scenario !== '1936'
    && isAtOrAfter(state, 1936, 4)
    && !isOrganizationEstablished(state, 'ML')
  ),
  title: 'Mujeres Libres Organizes',
  titleZh: '自由女性组织成立',
  description: 'Women activists in the libertarian movement have founded Mujeres Libres. The organization creates an independent space for women to build solidarity, literacy, and practical skills while taking an active role in the social revolution.',
  descriptionZh: '自由主义运动中的女性活动家成立了自由女性组织（Mujeres Libres）。这个组织为女性提供了建立团结、扫盲和实践技能的独立空间，并鼓励她们积极参与社会革命。',
  options: [
    {
      text: 'Recognize Mujeres Libres as part of the movement.',
      textZh: '承认自由女性组织加入运动。',
      subtitle: 'Give Mujeres Libres an organized place within the CNT-FAI movement.',
      subtitleZh: '在 CNT-FAI 运动中确立自由女性组织的组织地位。',
      effect: (state) => ({
        ...setOrganizationEstablished(state, 'ML'),
      }),
    },
  ],
};
