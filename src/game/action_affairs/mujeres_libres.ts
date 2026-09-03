import { Card, GameEvent, GameState } from '../types';
import { effectPreviewFromEffect } from '../effectPreview';
import { adjustClassSupport } from '../utils';
import { isOrganizationEstablished } from '../organizations';

type MujeresLibresEffect = GameEvent['options'][number]['effect'];

const MUJERES_LIBRES_DESCRIPTION = 'For too long, even in the eyes of the most radical male revolutionaries, “the anarchist utopia stops at the doorstep.” But women across Iberia are ready to raise their fists and shape the hot clay with their own hands: a new world born from suffering. If factories, hospitals, schools, and barricades need hands, there is no reason to surrender women’s future. Women active in the movement have formed an independent organization to develop their abilities and political struggle, because they have seen too many demands left unconsidered by their comrades. Mujeres Libres may still be small, but soon a whole generation of restless, disoriented young women in factories, fields, and universities will be ready to turn their concerns into action.';
const MUJERES_LIBRES_DESCRIPTION_ZH = '长久以来，哪怕在最激进的男性革命者眼中，“无政府主义乌托邦也止步于家门口”。但对于伊比利亚的妇女们而言，她们已经迫不及待高举拳头，用双手塑造那滚烫的黏土——一个从痛苦中诞生的新世界。既然工厂、医院、学堂和街垒需要双手，那么女性的未来就绝无退让的道理。许多积极参与运动的女性成立一个专门的组织，以充分发展她们的能力和政治斗争，因为她们看到许多诉求未被同志们考虑。尽管现在自由女性可能还很弱小，但很快我们将迎来一整群在工厂、田野和大学中焦躁不安、迷失方向的女性青年，渴望将关切转化为行动方案。';

const preview = (effect: MujeresLibresEffect) => (state: GameState) => (
  effectPreviewFromEffect(state, effect)
);

const awakenWomenToFreedom: MujeresLibresEffect = (state: GameState): Partial<GameState> => {
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 3);
  classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', 2);
  classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 2);

  return {
    classes,
    ideological_propaganda: (state.ideological_propaganda || 0) + 1,
    stats: {
      ...state.stats,
      revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 2)
    },
    currentEvent: null
  };
};

const organizeWomenAtWork: MujeresLibresEffect = (state: GameState): Partial<GameState> => ({
  classes: adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 4),
  unemployment_rate: Math.max(0, (state.unemployment_rate || 0) - 0.5),
  stats: {
    ...state.stats,
    workerControl: Math.min(100, state.stats.workerControl + 2)
  },
  currentEvent: null
});

const provideLaborEducation: MujeresLibresEffect = (state: GameState): Partial<GameState> => {
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', 2);
  classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 2);
  classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 2);

  return {
    classes,
    unemployment_rate: Math.max(0, (state.unemployment_rate || 0) - 1),
    stats: {
      ...state.stats,
      workerControl: Math.min(100, state.stats.workerControl + 1)
    },
    currentEvent: null
  };
};

const buildRuralWomenCollectives: MujeresLibresEffect = (state: GameState): Partial<GameState> => {
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 3);
  classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', 3);

  return {
    classes,
    stats: {
      ...state.stats,
      workerControl: Math.min(100, state.stats.workerControl + 1)
    },
    currentEvent: null
  };
};

const mujeresLibresEvent = (state: GameState): GameEvent => ({
  id: 'mujeres_libres_event',
  date: { year: state.year, month: state.month },
  title: 'Mujeres Libres',
  titleZh: '自由女性',
  description: MUJERES_LIBRES_DESCRIPTION,
  descriptionZh: MUJERES_LIBRES_DESCRIPTION_ZH,
  options: [
    {
      text: 'Propaganda to awaken women’s conscience of freedom.',
      textZh: '唤醒女性对自由的良知的宣传',
      subtitle: 'Use broadcasts, travelling libraries, and propaganda tours to spread women’s liberation.',
      subtitleZh: '通过广播、流动图书馆和宣传巡回活动进行宣传，以推广女性解放的理念。',
      effectPreview: preview(awakenWomenToFreedom),
      effect: awakenWomenToFreedom
    },
    {
      text: 'Workplaces and employment.',
      textZh: '工作场所和就业',
      subtitle: 'Women’s participation in economic life is central to emancipation: any job a man can do, a woman can do too.',
      subtitleZh: '女性参与经济活动是女性解放的核心组成部分，任何男性做的工作，女性也不遑多让。',
      effectPreview: preview(organizeWomenAtWork),
      effect: organizeWomenAtWork
    },
    {
      text: 'Labor education.',
      textZh: '劳动教育',
      subtitle: 'Teach working-class women to read and help them enter the labor market.',
      subtitleZh: '通过工人阶级妇女识字，帮助她们过渡到劳动力市场。',
      effectPreview: preview(provideLaborEducation),
      effect: provideLaborEducation
    },
    {
      text: 'Take the work into the countryside.',
      textZh: '走进西班牙农村',
      subtitle: 'Organizers and activists travel rural Spain, building collectives, supporting local women, and raising their standing.',
      subtitleZh: '组织者和积极分子走遍西班牙农村地区，建立农村集体，支持当地妇女，提升农村妇女地位。',
      effectPreview: preview(buildRuralWomenCollectives),
      effect: buildRuralWomenCollectives
    }
  ]
});

/** Independent action card for Mujeres Libres; it is not a branch of Organizations. */
export const mujeresLibresCard: Card = {
  id: 'mujeres_libres',
  title: 'Mujeres Libres',
  titleZh: '自由女性',
  type: 'Action',
  description: MUJERES_LIBRES_DESCRIPTION,
  descriptionZh: MUJERES_LIBRES_DESCRIPTION_ZH,
  cost: 1,
  condition: (state: GameState) => isOrganizationEstablished(state, 'ML') && state.organizations_timer <= 0,
  effect: (state: GameState): Partial<GameState> => ({
    organizations_timer: 6,
    currentEvent: mujeresLibresEvent(state)
  })
};
