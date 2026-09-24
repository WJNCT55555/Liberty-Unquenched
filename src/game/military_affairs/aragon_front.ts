import { Card, GameEvent, GameState } from '../types';
import { effectPreviewFromEffect } from '../effectPreview';
import { adjustClassSupport, adjustFactionDissents } from '../utils';
import { adjustCntMilitiaManpower, isOrganizationActive } from '../organizations';
import { adjustMilitarization } from '../rules/militarization';

type AragonFrontEffect = GameEvent['options'][number]['effect'];

const DESCRIPTION = 'The Aragon Regional Defense Council is the most radical libertarian socialist experiment on Spanish soil.';
const DESCRIPTION_ZH = '由全国劳工联合会-伊比利亚无政府主义者联合会主导的阿拉贡地区防务委员会，是西班牙土地上最激进的自由社会主义实验。';

const preview = (effect: AragonFrontEffect) => (state: GameState) => (
  effectPreviewFromEffect(state, effect)
);

/** Result reports only acknowledge numbers the option already applied. */
const acknowledgeReport: AragonFrontEffect = (): Partial<GameState> => ({
  currentEvent: null,
});

const recruitmentReport = (state: GameState): GameEvent => ({
  id: 'aragon_recruitment_result',
  date: { year: state.year, month: state.month },
  title: 'Militia Strength',
  titleZh: '民兵实力',
  description: 'We expanded the militia by absorbing new volunteers from collectivized villages and retraining workers.',
  descriptionZh: '我们通过吸纳来自集体化村庄的新志愿者和再培训工人，扩大了民兵队伍。',
  options: [
    {
      text: 'Continue',
      textZh: '继续',
      subtitle: 'Return to the front after reviewing the recruitment report.',
      subtitleZh: '查看招募报告后返回前线。',
      effectPreview: preview(acknowledgeReport),
      effect: acknowledgeReport,
    }
  ]
});

const disciplineReport = (state: GameState): GameEvent => ({
  id: 'aragon_discipline_result',
  date: { year: state.year, month: state.month },
  title: 'Restore Discipline',
  titleZh: '整顿纪律',
  description: 'We enhanced our combat effectiveness through military discipline and proletarian solidarity.',
  descriptionZh: '我们通过整顿军事纪律和无产阶级团结增强我们的战斗力。',
  options: [
    {
      text: 'Continue',
      textZh: '继续',
      subtitle: 'Return to the front after reviewing the discipline report.',
      subtitleZh: '查看纪律整顿报告后返回前线。',
      effectPreview: preview(acknowledgeReport),
      effect: acknowledgeReport,
    }
  ]
});

const churchNegotiationReport = (state: GameState): GameEvent => ({
  id: 'aragon_church_result',
  date: { year: state.year, month: state.month },
  title: 'Negotiate with Rural Church',
  titleZh: '与乡村教会谈判协议',
  description: 'We are making progress with the Aragon clergy on a local non-aggression pact, ensuring they will not actively support the Nationalists in exchange for protecting church buildings and limited worship, though this displeases many peasants...',
  descriptionZh: '我们正在与阿拉贡神职人员就一项地方性互不侵犯协议取得进展，以保护教堂建筑和有限礼拜活动为条件，确保他们不会积极支持国民党，虽然这让许多农民不满......',
  options: [
    {
      text: 'Continue',
      textZh: '继续',
      subtitle: 'Return to the front after reviewing the church negotiations.',
      subtitleZh: '查看教会谈判结果后返回前线。',
      effectPreview: preview(acknowledgeReport),
      effect: acknowledgeReport,
    }
  ]
});

const recruitMilitia: AragonFrontEffect = (state: GameState): Partial<GameState> => ({
  ...adjustCntMilitiaManpower(state, 500),
  currentEvent: recruitmentReport(state),
});

const restoreDiscipline: AragonFrontEffect = (state: GameState): Partial<GameState> => {
  const factions = adjustFactionDissents(state.factions, { Puristas: 5, Faistas: 3 });

  return {
    factions,
    ...adjustMilitarization(state, 'cnt', 5),
    currentEvent: disciplineReport(state),
  };
};

const negotiateWithChurch: AragonFrontEffect = (state: GameState): Partial<GameState> => {
  let classes = adjustClassSupport(state.classes, 'Clero', 'CNT_FAI', 10);
  classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', 10);
  classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', -10);

  return {
    classes,
    currentEvent: churchNegotiationReport(state),
  };
};

/** Declining to act in Aragon still consumes the card and starts the Aragon cooldown. */
const takeNoAragonAction: AragonFrontEffect = (): Partial<GameState> => ({
  currentEvent: null,
});

const aragonFrontEvent = (state: GameState): GameEvent => ({
  id: 'aragon_front_event',
  date: { year: state.year, month: state.month },
  title: 'Aragon Front',
  titleZh: '阿拉贡前线',
  description: `${DESCRIPTION}\n\nWe can implement policies in Aragon.`,
  descriptionZh: `${DESCRIPTION_ZH}\n\n我们可以在阿拉贡推行政策。`,
  options: [
    {
      text: 'Militia Recruitment (+500 Militia)',
      textZh: '民兵招募（+500 民兵）',
      subtitle: 'Draw volunteers from collectivized villages to reinforce the CNT-FAI columns.',
      subtitleZh: '从集体化村庄中吸纳志愿者，补强CNT-FAI纵队。',
      effectPreview: preview(recruitMilitia),
      effect: recruitMilitia,
    },
    {
      text: 'Restore Discipline',
      textZh: '整顿纪律',
      subtitle: 'CNT militarization +5, Puristas dissent +5, Faistas dissent +3. Tighten front-line coordination at the cost of angering the most anti-militarist comrades.',
      subtitleZh: 'CNT 军事化率 +5，纯粹派不满度 +5，无政府主义者不满度 +3。加强前线协同，但会激怒最反军事化的同志。',
      effectPreview: preview(restoreDiscipline),
      effect: restoreDiscipline,
    },
    {
      text: 'Negotiate with Church',
      textZh: '与教会谈判',
      subtitle: 'Clero support +10, Labradores support +10, Braceros support −10. Trade limited protections for rural clergy in exchange for local neutrality.',
      subtitleZh: '天主教会支持 +10，自耕农支持 +10，雇农支持 −10。以有限保护乡村神职人员换取地方中立。',
      effectPreview: preview(negotiateWithChurch),
      effect: negotiateWithChurch,
    },
    {
      text: 'We will not do anything in Aragon for now',
      textZh: '我们暂时不在阿拉贡做任何事',
      subtitle: 'Leave the front unchanged and let the Aragon council continue its current course; the Aragon review still enters cooldown.',
      subtitleZh: '暂不改变前线政策，让阿拉贡委员会维持当前路线；阿拉贡事务仍会进入冷却。',
      effectPreview: preview(takeNoAragonAction),
      effect: takeNoAragonAction,
    }
  ]
});

export const aragonFront: Card = {
  id: 'aragon_front',
  title: 'Aragon Front',
  titleZh: '阿拉贡前线',
  type: 'Military',
  description: DESCRIPTION,
  descriptionZh: DESCRIPTION_ZH,
  cost: 1,
  condition: (state: GameState) => state.aragonCouncilExists
    && (state.aragon_front_timer || 0) <= 0
    && isOrganizationActive(state, 'DC'),
  effect: (state: GameState): Partial<GameState> => ({
    // Every visible option consumes the card, so the cooldown belongs to the card itself.
    aragon_front_timer: 3,
    currentEvent: aragonFrontEvent(state),
  }),
};
