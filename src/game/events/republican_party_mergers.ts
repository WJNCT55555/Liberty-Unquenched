import { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';

const politicsMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
};

/** Acción Republicana becomes Izquierda Republicana while retaining one IR identity. */
export const formationOfIzquierdaRepublicana: GameEvent = {
  id: 'formation_of_izquierda_republicana',
  meta: politicsMeta,
  date: { year: 1934, month: 4 },
  condition: (state) => (
    state.scenario !== '1936' &&
    !state.ir_formed &&
    isAtOrAfter(state, 1934, 4)
  ),
  title: 'Acción Republicana Becomes Izquierda Republicana',
  titleZh: '共和行动改组为共和左翼',
  description: 'Acción Republicana and its allied republican forces have reorganized as Izquierda Republicana. The change of name marks a broader left-republican coalition, but it remains the same political force in our simulation.',
  descriptionZh: '共和行动及其共和派盟友完成改组，成立共和左翼。名称变化代表更广泛的左翼共和主义联合，但在本游戏中仍属于同一个党派身份。',
  options: [
    {
      text: 'Recognize the new republican left.',
      textZh: '承认新的共和左翼。',
      effect: () => ({ ir_formed: true })
    }
  ]
};

/** The Radical Socialist Republican phase becomes Unión Republicana. */
export const formationOfUnionRepublicana: GameEvent = {
  id: 'formation_of_union_republicana',
  meta: politicsMeta,
  date: { year: 1934, month: 9 },
  condition: (state) => (
    state.scenario !== '1936' &&
    !state.ur_formed &&
    isAtOrAfter(state, 1934, 9)
  ),
  title: 'The Radical Socialist Republicans Become Unión Republicana',
  titleZh: '激进社会共和党改组为共和联盟',
  description: 'The Radical Socialist Republican current has reorganized as Unión Republicana. Its electoral and coalition identity remains the same UR force, but its new name reflects the broader republican union formed during the political realignment of 1934.',
  descriptionZh: '激进社会共和党完成改组，成为共和联盟。它在选举、支持度和联盟系统中仍属于同一个 UR 党派身份，但新名称体现了 1934 年政治重组后的共和派联合。',
  options: [
    {
      text: 'Welcome the republican union.',
      textZh: '欢迎共和联盟。',
      effect: () => ({ ur_formed: true })
    }
  ]
};
