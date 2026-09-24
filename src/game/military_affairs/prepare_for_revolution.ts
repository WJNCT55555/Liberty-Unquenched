import { Card, GameEvent, GameState, PrepareRevolutionUses } from '../types';
import { effectPreviewFromEffect } from '../effectPreview';
import { isOrganizationActive } from '../organizations';
import {
  adjustMilitarization,
  adjustMilitarizations,
  getMilitarization
} from '../rules/militarization';

type PrepareRevolutionEffect = GameEvent['options'][number]['effect'];
type ReactionaryMilitiaGroup = 'requetes' | 'falange';

const DESCRIPTION = 'The CNT and the FAI aim to destroy the state, capitalism and militarism. The anarchists must prepare for the coming social revolution.';
const DESCRIPTION_ZH = 'CNT 与 FAI 的目标是摧毁国家、资本主义和军国主义，无政府主义者必须为即将到来的社会革命做准备。';

/** Every lever is paid for out of the confederation's paramilitary stock. */
const ARMAMENT_COST = 1;
const MILITIA_MILITARIZATION_GAIN = 2;
const OFFICER_LOYALTY_GAIN = 3;
const REACTIONARY_MILITARIZATION_LOSS = 2;
/** Peacetime preparation only: the columns can be drilled no further than this. */
const PEACETIME_MILITARIZATION_CEILING = 40;
/** Each lever may be pulled three times over the whole programme: nine pulls in total. */
const MAX_USES_PER_LEVER = 3;
const LEVERS: Array<keyof PrepareRevolutionUses> = ['militiaUses', 'armyUses', 'sabotageUses'];
const PREPARE_REVOLUTION_COOLDOWN = 4;

/**
 * The right-wing militias this card can sabotage. The armed entities belong to the
 * militia organisations, not to the parties, so a Falange that never raised its
 * first line has nothing to sabotage. The Carlist Requeté exists in every scenario.
 */
const REACTIONARY_MILITIAS: Array<{ organization: 'REQUETE_MILITIA' | 'FALANGE_MILITIA'; group: ReactionaryMilitiaGroup }> = [
  { organization: 'REQUETE_MILITIA', group: 'requetes' },
  { organization: 'FALANGE_MILITIA', group: 'falange' }
];

const preview = (effect: PrepareRevolutionEffect) => (state: GameState) => (
  effectPreviewFromEffect(state, effect)
);

const currentUses = (state: GameState): PrepareRevolutionUses => ({
  militiaUses: state.prepareRevolution?.militiaUses ?? 0,
  armyUses: state.prepareRevolution?.armyUses ?? 0,
  sabotageUses: state.prepareRevolution?.sabotageUses ?? 0
});

const remainingUses = (state: GameState, lever: keyof PrepareRevolutionUses): number => (
  MAX_USES_PER_LEVER - currentUses(state)[lever]
);

/** Once all nine pulls are spent the programme is over and the card leaves the deck. */
const hasUsesLeft = (state: GameState): boolean => {
  const uses = currentUses(state);
  return LEVERS.some((lever) => uses[lever] < MAX_USES_PER_LEVER);
};

const reactionaryMilitarizationLosses = (state: GameState): Partial<Record<ReactionaryMilitiaGroup, number>> => {
  const losses: Partial<Record<ReactionaryMilitiaGroup, number>> = {};
  REACTIONARY_MILITIAS.forEach(({ organization, group }) => {
    if (isOrganizationActive(state, organization)) losses[group] = -REACTIONARY_MILITARIZATION_LOSS;
  });
  return losses;
};

const hasExistingReactionaryMilitia = (state: GameState): boolean => (
  REACTIONARY_MILITIAS.some(({ organization }) => isOrganizationActive(state, organization))
);

/** Peacetime-only card, so the militia rate always stops at the preparation ceiling. */
const armTheMilitias: PrepareRevolutionEffect = (state: GameState): Partial<GameState> => {
  const uses = currentUses(state);

  return {
    armaments: state.armaments - ARMAMENT_COST,
    ...adjustMilitarization(state, 'cnt', MILITIA_MILITARIZATION_GAIN, PEACETIME_MILITARIZATION_CEILING),
    prepareRevolution: { ...uses, militiaUses: uses.militiaUses + 1 },
    currentEvent: prepareForRevolutionEvent(state)
  };
};

const winOverTheArmedForces: PrepareRevolutionEffect = (state: GameState): Partial<GameState> => {
  const uses = currentUses(state);

  return {
    armaments: state.armaments - ARMAMENT_COST,
    stats: {
      ...state.stats,
      armyLoyalty: Math.min(100, state.stats.armyLoyalty + OFFICER_LOYALTY_GAIN)
    },
    prepareRevolution: { ...uses, armyUses: uses.armyUses + 1 },
    currentEvent: prepareForRevolutionEvent(state)
  };
};

const sabotageTheReactionaries: PrepareRevolutionEffect = (state: GameState): Partial<GameState> => {
  const uses = currentUses(state);

  return {
    armaments: state.armaments - ARMAMENT_COST,
    ...adjustMilitarizations(state, reactionaryMilitarizationLosses(state)),
    prepareRevolution: { ...uses, sabotageUses: uses.sabotageUses + 1 },
    currentEvent: prepareForRevolutionEvent(state)
  };
};

/** Concluding the preparation is a decision of its own: the card still enters cooldown. */
const concludePreparation: PrepareRevolutionEffect = (): Partial<GameState> => ({
  prepare_revolution_timer: PREPARE_REVOLUTION_COOLDOWN,
  currentEvent: null
});

const prepareForRevolutionEvent = (state: GameState): GameEvent => ({
  id: 'prepare_revolution_event',
  date: { year: state.year, month: state.month },
  title: 'Prepare for Revolution',
  titleZh: '准备革命',
  description: 'The confederation can pull three levers before the storm breaks, each of them paid for in armaments and each of them good for three pulls over the whole programme. Conclude when the work is done.',
  descriptionZh: '在风暴来临之前，联合会可以动用三种手段：每种都要消耗军备，每种在这场革命准备中总共只能实施三次。准备完成后请结束本次准备。',
  options: [
    {
      text: (state: GameState) => `Arm the Militias (-1 Armament, ${remainingUses(state, 'militiaUses')}/3 left)`,
      textZh: (state: GameState) => `武装民兵（-1 军备，剩余 ${remainingUses(state, 'militiaUses')}/3 次）`,
      subtitle: 'CNT militia militarization +2, never above 40 while the country is at peace. Spend paramilitary stock to put rifles into confederal hands.',
      subtitleZh: 'CNT 民兵军事化率 +2；和平时期最高只能提升到 40。消耗准军事储备，把步枪交到联合民兵手中。',
      condition: (state: GameState) => state.armaments >= ARMAMENT_COST
        && getMilitarization(state, 'cnt') < PEACETIME_MILITARIZATION_CEILING
        && currentUses(state).militiaUses < MAX_USES_PER_LEVER,
      unavailableSubtitle: (state: GameState) => {
        if (state.armaments < ARMAMENT_COST) return 'Requires 1 armament.';
        if (getMilitarization(state, 'cnt') >= PEACETIME_MILITARIZATION_CEILING) {
          return `CNT militia militarization is already at ${PEACETIME_MILITARIZATION_CEILING}.`;
        }
        return 'This lever has already been pulled three times in this preparation.';
      },
      unavailableSubtitleZh: (state: GameState) => {
        if (state.armaments < ARMAMENT_COST) return '需要至少 1 军备。';
        if (getMilitarization(state, 'cnt') >= PEACETIME_MILITARIZATION_CEILING) {
          return `CNT 民兵军事化率已经达到 ${PEACETIME_MILITARIZATION_CEILING}。`;
        }
        return '该手段在这场革命准备中已经用过三次。';
      },
      effectPreview: preview(armTheMilitias),
      effect: armTheMilitias
    },
    {
      text: (state: GameState) => `Win Over the Armed Forces (-1 Armament, ${remainingUses(state, 'armyUses')}/3 left)`,
      textZh: (state: GameState) => `争取武装部队（-1 军备，剩余 ${remainingUses(state, 'armyUses')}/3 次）`,
      subtitle: 'Officer loyalty +3. Money and favours for the officers who would otherwise march with the coup.',
      subtitleZh: '军官忠诚度 +3。用金钱与人情拉拢那些本可能随政变而去的军官。',
      condition: (state: GameState) => state.armaments >= ARMAMENT_COST
        && currentUses(state).armyUses < MAX_USES_PER_LEVER,
      unavailableSubtitle: (state: GameState) => state.armaments < ARMAMENT_COST
        ? 'Requires 1 armament.'
        : 'This lever has already been pulled three times in this programme.',
      unavailableSubtitleZh: (state: GameState) => state.armaments < ARMAMENT_COST
        ? '需要至少 1 军备。'
        : '该手段在这场革命准备中已经用过三次。',
      effectPreview: preview(winOverTheArmedForces),
      effect: winOverTheArmedForces
    },
    {
      text: (state: GameState) => `Sabotage the Reactionaries (-1 Armament, ${remainingUses(state, 'sabotageUses')}/3 left)`,
      textZh: (state: GameState) => `破坏反动派（-1 军备，剩余 ${remainingUses(state, 'sabotageUses')}/3 次）`,
      subtitle: 'Militarization −2 for every right-wing militia that already exists: the Carlist Requeté and the Falangist first line.',
      subtitleZh: '所有已经存在的右翼民兵（卡洛斯派雷盖特与长枪党一线）军事化率 −2。',
      condition: (state: GameState) => state.armaments >= ARMAMENT_COST
        && currentUses(state).sabotageUses < MAX_USES_PER_LEVER
        && hasExistingReactionaryMilitia(state),
      unavailableSubtitle: (state: GameState) => {
        if (state.armaments < ARMAMENT_COST) return 'Requires 1 armament.';
        if (!hasExistingReactionaryMilitia(state)) return 'No right-wing militia organisation exists yet.';
        return 'This lever has already been pulled three times in this programme.';
      },
      unavailableSubtitleZh: (state: GameState) => {
        if (state.armaments < ARMAMENT_COST) return '需要至少 1 军备。';
        if (!hasExistingReactionaryMilitia(state)) return '目前还没有成立任何右翼民兵组织。';
        return '该手段在这场革命准备中已经用过三次。';
      },
      effectPreview: preview(sabotageTheReactionaries),
      effect: sabotageTheReactionaries
    },
    {
      text: 'Conclude the Preparation',
      textZh: '结束准备',
      subtitle: 'Close the preparation and let the card enter cooldown.',
      subtitleZh: '结束本次准备，卡牌进入冷却。',
      effectPreview: preview(concludePreparation),
      effect: concludePreparation
    }
  ]
});

export const prepareForRevolution: Card = {
  id: 'prepare_for_revolution',
  title: 'Prepare for Revolution',
  titleZh: '准备革命',
  type: 'Military',
  description: DESCRIPTION,
  descriptionZh: DESCRIPTION_ZH,
  cost: 1,
  // Peacetime preparation of the confederal militia: the defence committees must
  // exist, the country must not be at war yet, and the programme must still have
  // one of its nine pulls left.
  condition: (state: GameState) => state.civilWarStatus === 'not_started'
    && isOrganizationActive(state, 'DC')
    && (state.prepare_revolution_timer || 0) <= 0
    && hasUsesLeft(state),
  effect: (state: GameState): Partial<GameState> => ({
    // The programme counters are global: the card only opens the menu, and the menu
    // spends one pull of a lever each time it is used.
    currentEvent: prepareForRevolutionEvent(state)
  })
};
