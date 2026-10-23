import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';
import { changeLaws } from '../rules/lawChange';

const lawMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  tags: ['law'],
};

/**
 * 离婚合法化（1932 年）。
 *
 * 西班牙第二共和国的《离婚法》于 1932 年 2 月由制宪议会通过，同年 3 月生效，
 * 用"双方合意或一方请求即可解除婚姻"取代了天主教"婚姻不可解除"的原则；民事登记
 * 与民事婚姻在此之前已由 1931 年宪法确立。
 *
 * 这是**女性权利等级表 L1 → L2 的唯一入口**：`womens_rights` 的三个剧本开局是
 * L0（1931 剧本）与 L1（1933、1936 剧本），L1 之后再无内容能推进——
 * 而 L3「女性堕胎权」由 `health_reform` 卡的堕胎合法化路线接续。本事件补上断掉的
 * 这一级。
 *
 * 写法与全项目一致：单选项、只改法律等级、不附带任何数值效果；法律写入统一走
 * `rules/lawChange.ts`（这里用 `changeLaws` 的 `up` 意图，逐级上升而非绝对赋值）。
 */
export const divorceLaw1932: GameEvent = {
  id: 'divorce_law_1932',
  meta: lawMeta,
  date: { year: 1932, month: 2 },
  condition: (state) => isAtOrAfter(state, 1932, 2),
  title: 'The Divorce Law',
  titleZh: '离婚法',
  description: 'The Constituent Cortes has passed the Divorce Law. Marriage is no longer indissoluble: a civil court can dissolve it at the request of both spouses, or of one on stated grounds, and the Church has no standing in the matter or in the register. The Republic has separated a sacrament from a civil status. Bishops, conservative deputies and a good part of the military have taken note; so have the women who have been writing to the ministry for a year.',
  descriptionZh: '制宪议会通过了《离婚法》。婚姻不再是不可解除的：民事法院可以应当事双方的请求、或依一方提出的法定理由判决解除，而教会在这件事上和民事登记上都没有发言权。共和国把一桩圣事与一种民事身份分开了。主教们、保守派议员和相当一部分军官都记下了这件事；一年来一直在向部里写信的那些女性也记下了。',
  options: [
    {
      text: 'A civil status can be dissolved by a civil court.',
      textZh: '民事身份由民事法庭解除。',
      subtitle: 'Women’s Rights advance one level.',
      subtitleZh: '女性权利提升一级。',
      effect: (state) => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          ...changeLaws(state, { womens_rights: 'up' }),
        },
      }),
    },
  ],
};
