import type { GameEvent, GameState } from '../types';
import { adjustClassSupport, isAtOrAfter } from '../utils';
import { isOrganizationEstablished, setOrganizationEstablished } from '../organizations';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

/** The Falange's own organizations only exist once the party itself does. */
const falangeExists = (state: GameState) => state.fe_founded || isOrganizationEstablished(state, 'FE');

/** October 1931: Ramiro Ledesma and Onésimo Redondo merge their groups into the JONS. */
export const jonsFormation: GameEvent = {
  id: 'jons_formation',
  meta: newsMeta,
  date: { year: 1931, month: 10 },
  condition: (state) => !isOrganizationEstablished(state, 'JONS') && isAtOrAfter(state, 1931, 10),
  title: 'The Juntas de Ofensiva Nacional-Sindicalista',
  titleZh: '国家工团主义进攻委员会成立',
  description: 'Ramiro Ledesma Ramos\'s La Conquista del Estado and Onésimo Redondo\'s Juntas Castellanas de Actuación Hispánica have merged into the Juntas de Ofensiva Nacional-Sindicalista. The JONS are not a parliamentary party but a tiny, violent sect of students and clerks who preach the conquest of the state by a national-syndicalist dictatorship. They despise the Republic, and they despise us.',
  descriptionZh: '拉米罗·莱德斯马·拉莫斯的《国家征服》与奥内西莫·雷东多的"卡斯蒂利亚西班牙行动委员会"合并，成立国家工团主义进攻委员会（JONS）。JONS 不是议会政党，而是一个由学生与职员组成的微小而暴力的派别，鼓吹以国家工团主义专政夺取国家。他们仇视共和国，也仇视我们。',
  options: [
    {
      text: 'Another fascist sect. Let them waste away.',
      textZh: '又一个法西斯小宗派。让他们自行消亡吧。',
      subtitle: 'Founds the JONS and raises its support among students and the petty bourgeoisie by 2.',
      subtitleZh: '成立 JONS，并提高知识分子与小资产阶级对极右的支持 2 点。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Intelectuales', 'FE', 2);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'FE', 2);

        return {
          classes: newClasses,
          ...setOrganizationEstablished(state, 'JONS'),
        };
      },
    },
  ],
};

/** November 1933: the Falange's student union. */
export const seuFormation: GameEvent = {
  id: 'seu_formation',
  meta: newsMeta,
  date: { year: 1933, month: 11 },
  condition: (state) =>
    !isOrganizationEstablished(state, 'SEU')
    && isAtOrAfter(state, 1933, 11)
    && falangeExists(state),
  title: 'The Sindicato Español Universitario',
  titleZh: '西班牙大学生联合会成立',
  description: 'The Falange has founded the Sindicato Español Universitario, a student organization meant to break the left\'s hold on the universities by force. Its members are few but organized, and they have learned that a lecture hall can be silenced with fists and pistols as easily as with arguments.',
  descriptionZh: '长枪党成立了西班牙大学生联合会（SEU），一个旨在以暴力打破左翼在大学中主导地位的学生组织。其成员不多，但组织严密，而且他们已经学会：让一间讲堂沉默，用拳头和手枪和用论辩一样容易。',
  options: [
    {
      text: 'They are organizing the universities.',
      textZh: '他们正在组织大学。',
      subtitle: 'Founds the SEU and raises fascist support among students by 3.',
      subtitleZh: '成立 SEU，并提高知识分子对极右的支持 3 点。',
      effect: (state) => ({
        classes: adjustClassSupport(state.classes, 'Intelectuales', 'FE', 3),
        ...setOrganizationEstablished(state, 'SEU'),
      }),
    },
  ],
};

/** June 1934: the Falange's women's section. */
export const seccionFemeninaFormation: GameEvent = {
  id: 'seccion_femenina_formation',
  meta: newsMeta,
  date: { year: 1934, month: 6 },
  condition: (state) =>
    !isOrganizationEstablished(state, 'SECCION_FEMENINA')
    && isAtOrAfter(state, 1934, 6)
    && falangeExists(state),
  title: 'The Sección Femenina',
  titleZh: '妇女部成立',
  description: 'Under Pilar Primo de Rivera, the Falange has created its women\'s section. It does not send women to the barricades: it organizes them to nurse the wounded, raise funds, run the movement\'s social work and raise the next generation of militants. It is small now, and it will outlive the men who founded it.',
  descriptionZh: '在皮拉尔·普里莫·德·里维拉的领导下，长枪党成立了妇女部。它不把女性送上街垒，而是组织她们照料伤员、筹措经费、主持运动的社会工作，并培养下一代战士。它现在很小，但它会比创建它的那些男人活得更久。',
  options: [
    {
      text: 'Even the Falange is organizing women.',
      textZh: '连长枪党都在组织女性了。',
      subtitle: 'Founds the Sección Femenina.',
      subtitleZh: '成立妇女部。',
      effect: (state) => ({
        ...setOrganizationEstablished(state, 'SECCION_FEMENINA'),
      }),
    },
  ],
};
