import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';
import { ensureLawAtLeast } from '../rules/lawChange';

const lawMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  tags: ['law'],
};

/**
 * 混合陪审团法（1931 年 11 月）。
 *
 * 两个选项都要把 `union_status` 提到 L2「混合陪审团」，但这一步**不能无条件写成 2**：
 * 如果该法律已经在 3 级以上（集体谈判或工人委员会），同一条历史新闻就不该把它拉回去。
 * 因此这里用 `ensureLawAtLeast`（「至少到 2 级」），与全项目的法律写入约定一致：
 * 改法律只有政府卡与事件可以做，且每次都先读当前等级。
 */
export const juradosMixtos: GameEvent = {
  id: 'jurados_mixtos',
  meta: lawMeta,
  date: { year: 1931, month: 11 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1931, 11),
  title: 'Jurados Mixtos',
  titleZh: '混合陪审团',
  description: 'First, resolve potential conflicts and disputes between workers and employers, whether these conflicts and disputes are personal or collective in nature, as well as strikes or stoppages resulting from these; second, regulate working conditions in factories and workshops—including working hours, wages, dismissals, and work conditions—covering various industries and professions; finally, check compliance with social laws, agreements reached by juries themselves, and approved collective labor agreements.',
  descriptionZh: '首先，解决工人与雇主之间潜在的冲突和纠纷，无论是个人性质还是集体性质的冲突和纠纷，以及由此引起的罢工或停工；其次，规范工厂和作坊的工作条件——包括工作时间、工资、解雇和工作条件——涵盖各种行业和职业；最后，检查对社会法律、陪审团本身达成的协议以及批准的集体劳动协议的遵守情况。',
  options: [
    {
      text: 'This places workers under the rule of the state and the bourgeoisie, destroying the foundation of their resistance.',
      textZh: '这使工人置于国家和资产阶级的统治之下，摧毁了他们抵抗的基础。',
      subtitle: 'We vehemently oppose state intervention. Enacts the Mixed Jury Law, but decreases our relationship with the PSOE by 15.',
      subtitleZh: '我们强烈反对国家的干预。颁布《混合陪审团法》，但会降低与社会党(PSOE)的联合关系 15。',
      effect: (state) => {
        return {
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, state.partyRelations.PSOE - 15)
          },
          domesticPolicy: {
            ...state.domesticPolicy,
            mixed_jury_cnt_opposed: true,
            union_status: ensureLawAtLeast(state, 'union_status', 2)
          }
        };
      }
    },
    {
      text: 'Perhaps we should also join the Mixed Jury.',
      textZh: '也许我们也应该加入混合陪审团。',
      subtitle: 'Accept state mediation to secure legal protections for workers. Enacts the Mixed Jury Law without immediate political backlash.',
      subtitleZh: '接受国家调解以争取法律保护。颁布《混合陪审团法》，不引起与社会党(PSOE)的直接内部摩擦。',
      effect: (state) => {
        return {
          domesticPolicy: {
            ...state.domesticPolicy,
            mixed_jury_cnt_opposed: false,
            union_status: ensureLawAtLeast(state, 'union_status', 2)
          }
        };
      }
    }
  ]
};
