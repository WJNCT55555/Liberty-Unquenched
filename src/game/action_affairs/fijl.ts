import { Card, GameEvent, GameState } from '../types';
import { effectPreviewFromEffect } from '../effectPreview';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence } from '../utils';
import { isOrganizationEstablished } from '../organizations';

type FijlEffect = GameEvent['options'][number]['effect'];

const FIJL_DESCRIPTION = 'The Federación Ibérica de Juventudes Libertarias is the youngest spark on Iberian soil and one of anarchism’s most untameable thorns. While union bureaucrats compromise with bureaucrats and politicians again and again, FIJL’s youth refuse to yield. They believe revolution has no room for half-measures. Through the long years of white terror, they clamp the force of their youth around tyranny’s throat. “We have nothing, and therefore nothing to fear; dogma belongs in coffins, but fire belongs to the young.”';
const FIJL_DESCRIPTION_ZH = '伊比利亚自由青年联合会是伊比利亚大地上最年轻的火种，也是无政府主义中最难以驯服的一根刺。当工会的官僚们一次又一次的与官僚与政客妥协时，FIJL 的青年们寸步不让。他们坚信革命容不下折中。在漫长的白色恐怖中，用青春死死扼住暴政的咽喉。\n“我们一无所有，因而无所畏惧；教条留给棺木，而烈火属于青年。”';

const preview = (effect: FijlEffect) => (state: GameState) => (
  effectPreviewFromEffect(state, effect)
);

const joinFaistaOrganization: FijlEffect = (state: GameState): Partial<GameState> => ({
  factions: adjustFactionInfluence(state.factions, 'Faistas', 6),
  stats: {
    ...state.stats,
    revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3)
  },
  currentEvent: null
});

const joinCntYouthOrganization: FijlEffect = (state: GameState): Partial<GameState> => ({
  classes: adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 4),
  factions: adjustFactionInfluence(state.factions, 'Cenetistas', 5),
  stats: {
    ...state.stats,
    workerControl: Math.min(100, state.stats.workerControl + 2)
  },
  currentEvent: null
});

const remainIndependent: FijlEffect = (state: GameState): Partial<GameState> => {
  let classes = adjustClassSupport(state.classes, 'Intelectuales', 'CNT_FAI', 3);
  classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 3);

  return {
    classes,
    factions: adjustFactionDissents(state.factions, { Faistas: 3, Cenetistas: 3 }),
    stats: {
      ...state.stats,
      revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 2)
    },
    currentEvent: null
  };
};

const defendAntiStateValues: FijlEffect = (state: GameState): Partial<GameState> => ({
  factions: adjustFactionInfluence(state.factions, 'Puristas', 8),
  stats: {
    ...state.stats,
    republicanAuthority: Math.max(0, state.stats.republicanAuthority - 3),
    revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 4)
  },
  currentEvent: null
});

const marchToTheFront: FijlEffect = (state: GameState): Partial<GameState> => ({
  armedForces: {
    ...state.armedForces,
    militias: {
      ...state.armedForces.militias,
      cntFai: (state.armedForces.militias.cntFai || 0) + 1000
    }
  },
  stats: {
    ...state.stats,
    anarchistMilitia: Math.min(100, state.stats.anarchistMilitia + 5),
    revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3)
  },
  currentEvent: null
});

const fijlEvent = (state: GameState): GameEvent => ({
  id: 'fijl_event',
  date: { year: state.year, month: state.month },
  title: 'Federación Ibérica de Juventudes Libertarias',
  titleZh: '伊比利亚自由青年联合会',
  description: FIJL_DESCRIPTION,
  descriptionZh: FIJL_DESCRIPTION_ZH,
  options: [
    {
      text: 'FIJL should become an internal organization of the FAI.',
      textZh: '伊自青联应该成为FAI的内部组织',
      subtitle: 'Only a forge for the vanguard can keep the revolutionary flame from being quenched by mediocrity.',
      subtitleZh: '唯有先锋的熔炉，革命的烈焰才不会被庸碌浇熄。',
      effectPreview: preview(joinFaistaOrganization),
      effect: joinFaistaOrganization
    },
    {
      text: 'We intend to become the CNT’s youth organization.',
      textZh: '我们意图成为CNT的青年组织',
      subtitle: 'Pour youth power into workshops and the confederal network, building a reserve of proletarian workers.',
      subtitleZh: '青年力量直接注入生产车间与全国工团网络，建立无产阶级劳动者的后备军',
      effectPreview: preview(joinCntYouthOrganization),
      effect: joinCntYouthOrganization
    },
    {
      text: 'Our youth organization should be independent of the FAI and CNT.',
      textZh: '我们的青年组织应该独立于FAI和CNT',
      subtitle: 'A new banner must never be tied to the helm of any old institution.',
      subtitleZh: '新旗帜绝不捆绑在任何老迈的舵轮上。',
      effectPreview: preview(remainIndependent),
      effect: remainIndependent
    },
    {
      text: 'The Red-skins will defend anarchist principles (anti-state values).',
      textZh: '红皮派将捍卫无政府主义的原则（捍卫反国家价值观）',
      subtitle: 'Anyone above the people is an enemy.',
      subtitleZh: '人民之上者皆为敌',
      effectPreview: preview(defendAntiStateValues),
      effect: defendAntiStateValues
    },
    {
      text: 'Set out, young people, for the battlefield.',
      textZh: '出发吧年轻人们，去战场上',
      subtitle: 'Debate cannot save the revolution; only cutting off fascism’s head can answer the martyrs’ blood.',
      subtitleZh: '辩论可救不了革命，唯有斩下法西斯主义的蛇头方能抚平烈士们的鲜血',
      condition: (s: GameState) => s.civilWarStatus === 'ongoing',
      unavailableSubtitle: () => 'The civil war must be ongoing before FIJL volunteers can go to the front.',
      unavailableSubtitleZh: () => '内战进行中时，FIJL志愿者才能奔赴战场。',
      effectPreview: preview(marchToTheFront),
      effect: marchToTheFront
    }
  ]
});

/** Independent action card for FIJL; it is not a branch of Organizations. */
export const fijlCard: Card = {
  id: 'fijl',
  title: 'Federación Ibérica de Juventudes Libertarias',
  titleZh: '伊比利亚自由青年联合会',
  type: 'Action',
  description: FIJL_DESCRIPTION,
  descriptionZh: FIJL_DESCRIPTION_ZH,
  cost: 1,
  condition: (state: GameState) => isOrganizationEstablished(state, 'FIJL') && (state.fijl_timer || 0) <= 0,
  effect: (state: GameState): Partial<GameState> => ({
    fijl_timer: 6,
    currentEvent: fijlEvent(state)
  })
};
