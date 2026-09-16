import type { GameEvent } from '../types';
import { adjustClassSupport, isAtOrAfter } from '../utils';
import { isOrganizationEstablished, setOrganizationEstablished } from '../organizations';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

/**
 * Acción Nacional is founded on 29 April 1931, days after the 1931 scenario opens.
 * Acción Popular (1932) and CEDA (March 1933) are later names of this same party —
 * those are rename events, so this is the only event that creates the organization.
 */
export const accionNacionalFormation: GameEvent = {
  id: 'accion_nacional_formation',
  meta: newsMeta,
  date: { year: 1931, month: 5 },
  condition: (state) =>
    state.scenario === '1931'
    && isAtOrAfter(state, 1931, 5)
    && !isOrganizationEstablished(state, 'AP'),
  title: 'The Founding of Acción Nacional',
  titleZh: '国民行动成立',
  description: 'Under Ángel Herrera Oria and the Asociación Católica de Propagandistas, Catholic activists have founded Acción Nacional: a lay, confessional movement that intends to fight the Republic\'s secular legislation in the name of religion, property and order. It is not yet a mass party, but it has money, newspapers and the parishes — and it is the seed from which a much larger reactionary force will grow.',
  descriptionZh: '在安赫尔·埃雷拉·奥里亚与天主教宣传协会的推动下，天主教活动家成立了"国民行动"（Acción Nacional）：一个平信徒的、信仰本位的运动，以宗教、财产与秩序之名对抗共和国的世俗立法。它还不是群众性政党，但它有钱、有报纸、有教区——而一场规模大得多的反动力量正由此发芽。',
  options: [
    {
      text: 'The Catholics are organising too.',
      textZh: '天主教徒也开始组织起来了。',
      subtitle: 'Founds Acción Nacional and raises its support among the clergy and great landowners by 5.',
      subtitleZh: '成立国民行动，并提高天主教会与贵族大地主对它的支持 5 点。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Clero', 'AP', 5);
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'AP', 5);

        return {
          classes: newClasses,
          ...setOrganizationEstablished(state, 'AP'),
        };
      },
    },
  ],
};
