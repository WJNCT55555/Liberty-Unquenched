import type { GameEvent, GameState } from '../types';
import { adjustClassSupport, isAtOrAfter } from '../utils';
import { isOrganizationEstablished, setOrganizationEstablished, setOrganizationStatus } from '../organizations';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

/**
 * April 1936: the socialist and communist youth merge into the JSU. Both
 * predecessors are absorbed, so the event integrates them in the same step.
 */
export const jsuFormation: GameEvent = {
  id: 'jsu_formation',
  meta: newsMeta,
  date: { year: 1936, month: 4 },
  condition: (state) => !isOrganizationEstablished(state, 'JSU') && isAtOrAfter(state, 1936, 4),
  title: 'The Unified Socialist Youth',
  titleZh: '统一社会主义青年成立',
  description: 'The socialist Juventudes Socialistas and the communist Juventudes Comunistas have merged into the Juventudes Socialistas Unificadas. For the first time the youth of the two workers\' parties march under one organization, and it is the Communists who set its tone. The young are tired of the quarrels of their elders.',
  descriptionZh: '社会主义青年（JJSS）与共产主义青年（UJCE）合并为统一社会主义青年（JSU）。两支工人政党的青年第一次在同一组织下前进，而决定其基调的是共产党人。年轻人已经厌倦了长辈们的争吵。',
  options: [
    {
      text: 'The youth have united. Where does that leave us?',
      textZh: '青年们联合起来了。那我们呢？',
      subtitle: 'Founds the JSU, absorbing the JJSS and the UJCE; raises socialist support among workers by 3.',
      subtitleZh: '成立 JSU，同时并入 JJSS 与 UJCE；提高产业工人对社会主义者的支持 3 点。',
      effect: (state: GameState) => {
        const withJsu = { ...state, ...setOrganizationEstablished(state, 'JSU') };
        const withJjss = { ...withJsu, ...setOrganizationStatus(withJsu, 'JJSS', 'integrated') };
        const withUjce = { ...withJjss, ...setOrganizationStatus(withJjss, 'UJCE', 'integrated') };

        return {
          classes: adjustClassSupport(state.classes, 'Obreros', 'PSOE', 3),
          organizations: withUjce.organizations,
        };
      },
    },
  ],
};

/** June 1933: the communist women's movement, renamed Mujeres Antifascistas in 1936. */
export const mujeresAntifascistasFormation: GameEvent = {
  id: 'mujeres_antifascistas_formation',
  meta: newsMeta,
  date: { year: 1933, month: 6 },
  condition: (state) =>
    !isOrganizationEstablished(state, 'MUJERES_ANTIFASCISTAS')
    && isAtOrAfter(state, 1933, 6)
    && isOrganizationEstablished(state, 'PCE'),
  title: 'Women Against War and Fascism',
  titleZh: '妇女反战反法西斯组织成立',
  description: 'The Communist Party has launched a women\'s movement, Women Against War and Fascism, to bring working women into the political struggle: against rearmament, against fascism, and for the defence of the Republic. It will later take the name Mujeres Antifascistas. Its base is small, but it reaches women the unions mostly do not.',
  descriptionZh: '共产党发起了一个妇女运动——"妇女反战反法西斯"，把劳动妇女带入政治斗争：反对扩军、反对法西斯、保卫共和国。它后来改称"反法西斯妇女"。它的基础很小，但它触及了许多工会触及不到的女性。',
  options: [
    {
      text: 'A women\'s front of the Communists.',
      textZh: '共产党人的妇女阵线。',
      subtitle: 'Founds the women\'s movement and raises communist support among workers by 2.',
      subtitleZh: '成立该妇女组织，并提高产业工人对共产党的支持 2 点。',
      effect: (state) => ({
        classes: adjustClassSupport(state.classes, 'Obreros', 'PCE', 2),
        ...setOrganizationEstablished(state, 'MUJERES_ANTIFASCISTAS'),
      }),
    },
  ],
};

/** ⚠️ Early 1932: the Basque Nationalist Party's youth wing. */
export const egiFormation: GameEvent = {
  id: 'egi_formation',
  meta: newsMeta,
  date: { year: 1932, month: 1 },
  condition: (state) =>
    !isOrganizationEstablished(state, 'EGI')
    && isAtOrAfter(state, 1932, 1)
    && isOrganizationEstablished(state, 'PNV'),
  title: 'Euzko Gaztedi Indarra',
  titleZh: '巴斯克青年成立',
  description: 'The Basque Nationalist Party has organized its young members into Euzko Gaztedi Indarra, a youth wing devoted to the language, the faith and the Basque fatherland. It is not a militia, and it is not on our side of any barricade — but in a Republic that has promised autonomy and delivered little, it will grow.',
  descriptionZh: '巴斯克民族主义党把青年成员组织为"巴斯克青年"（EGI），一个献身于语言、信仰与巴斯克祖国的青年组织。它不是民兵，也不在街垒的任何一边属于我们——但在这个承诺了自治却兑现甚少的共和国里，它会成长。',
  options: [
    {
      text: 'The Basques are organizing their youth.',
      textZh: '巴斯克人在组织自己的青年。',
      subtitle: 'Founds Euzko Gaztedi Indarra.',
      subtitleZh: '成立巴斯克青年。',
      effect: (state) => ({
        ...setOrganizationEstablished(state, 'EGI'),
      }),
    },
  ],
};

/** September 1935: the POUM's youth wing, formed alongside the party itself. */
export const jciFormation: GameEvent = {
  id: 'jci_formation',
  meta: newsMeta,
  date: { year: 1935, month: 9 },
  condition: (state) =>
    !isOrganizationEstablished(state, 'JCI')
    && isAtOrAfter(state, 1935, 9)
    && isOrganizationEstablished(state, 'POUM'),
  title: 'The Iberian Communist Youth',
  titleZh: '伊比利亚共产主义青年成立',
  description: 'With the POUM founded, its young militants have organized as the Juventudes Comunistas Ibéricas. They are hostile to the official Communist Youth and to Moscow, and they are the most reliable recruiting ground the POUM has. When the POUM militia forms, this is where its cadre will come from.',
  descriptionZh: '随着 POUM 成立，其青年成员组织为伊比利亚共产主义青年（JCI）。他们敌视正统共产主义青年与莫斯科，也是 POUM 最可靠的招募来源。当 POUM 民兵组建时，其骨干将来自这里。',
  options: [
    {
      text: 'The POUM has its own youth now.',
      textZh: 'POUM 现在有了自己的青年组织。',
      subtitle: 'Founds the Iberian Communist Youth.',
      subtitleZh: '成立伊比利亚共产主义青年。',
      effect: (state) => ({
        ...setOrganizationEstablished(state, 'JCI'),
      }),
    },
  ],
};
