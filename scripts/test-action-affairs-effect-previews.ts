import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import { media } from '../src/game/action_affairs/media';
import { syndicateExpansion } from '../src/game/action_affairs/syndicate_expansion';
import { getOptionEffectPreview } from '../src/game/effectPreview';
import { INITIAL_STATE } from '../src/game/GameContext';
import type { Card, EffectPreviewLine, GameEvent, GameState } from '../src/game/types';

const cloneData = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const buildState = (overrides: Partial<GameState> = {}): GameState => ({
  ...INITIAL_STATE,
  factions: cloneData(INITIAL_STATE.factions),
  classes: cloneData(INITIAL_STATE.classes),
  stats: { ...INITIAL_STATE.stats },
  currentEvent: null,
  ...overrides
});

const withUniformDissent = (state: GameState, dissent: number): GameState => ({
  ...state,
  factions: Object.fromEntries(
    Object.entries(state.factions).map(([faction, values]) => [
      faction,
      { ...values, dissent }
    ])
  ) as GameState['factions']
});

const openCardEvent = (card: Card, state: GameState): { state: GameState; event: GameEvent } => {
  const result = card.effect(state);
  ok(result.currentEvent, `${card.id} must open an event`);
  return {
    event: result.currentEvent,
    state: { ...state, ...result, currentEvent: result.currentEvent }
  };
};

const optionText = (option: GameEvent['options'][number], state: GameState): string => (
  typeof option.text === 'function' ? option.text(state) : option.text
);

const findOption = (event: GameEvent, state: GameState, text: string) => {
  const option = event.options.find((candidate) => optionText(candidate, state) === text);
  ok(option, `missing option: ${text}`);
  return option;
};

const assertBilingual = (lines: EffectPreviewLine[], context: string) => {
  lines.forEach((line, index) => {
    if (line.text !== undefined || line.textZh !== undefined) {
      ok(line.text && line.textZh, `${context} preview line ${index + 1} must have bilingual text`);
    } else {
      ok(line.label && line.labelZh, `${context} preview line ${index + 1} must have bilingual labels`);
    }
  });
};

const assertExplicitPreviewMatchesEffect = (
  state: GameState,
  option: GameEvent['options'][number],
  context: string
) => {
  ok(option.effectPreview, `${context} must define effectPreview`);
  const actual = option.effectPreview(state);
  const fallbackOption = { ...option, effectPreview: undefined };
  const expected = getOptionEffectPreview(state, fallbackOption);
  deepStrictEqual(actual, expected, `${context} preview must be derived from its actual effect`);
  assertBilingual(actual, context);
};

const valueFor = (lines: EffectPreviewLine[], label: string): number | undefined => (
  lines.find((line) => line.label === label)?.value
);

const assertClose = (actual: number | undefined, expected: number, context: string) => {
  ok(actual !== undefined, `${context} must be present`);
  ok(Math.abs(actual - expected) < 0.005, `${context}: expected ${expected}, received ${actual}`);
};

const mediaVariants = [
  buildState({ resources: 3, radio: 0, cinema: 0 }),
  buildState({ resources: 3, radio: 2, cinema: 1 }),
  buildState({ resources: 0, radio: 4, cinema: 1 })
];

for (const variant of mediaVariants) {
  const opened = openCardEvent(media, variant);
  opened.event.options.forEach((option) => {
    assertExplicitPreviewMatchesEffect(opened.state, option, `media / ${optionText(option, opened.state)}`);
  });
}

const syndicateOpened = openCardEvent(syndicateExpansion, buildState());
syndicateOpened.event.options.forEach((option) => {
  assertExplicitPreviewMatchesEffect(
    syndicateOpened.state,
    option,
    `syndicate expansion / ${optionText(option, syndicateOpened.state)}`
  );
});

const zeroDissentOpened = openCardEvent(media, withUniformDissent(buildState({ resources: 3 }), 0));
const halfDissentOpened = openCardEvent(media, withUniformDissent(buildState({ resources: 3 }), 50));
const zeroMobilization = findOption(zeroDissentOpened.event, zeroDissentOpened.state, 'Strengthen Revolutionary Mobilization');
const halfMobilization = findOption(halfDissentOpened.event, halfDissentOpened.state, 'Strengthen Revolutionary Mobilization');
assertClose(
  valueFor(zeroMobilization.effectPreview!(zeroDissentOpened.state), 'Obreros support for CNT-FAI'),
  3,
  'media worker-support preview at zero dissent'
);
assertClose(
  valueFor(halfMobilization.effectPreview!(halfDissentOpened.state), 'Obreros support for CNT-FAI'),
  1.5,
  'media worker-support preview at 50% dissent'
);

const zeroSyndicate = openCardEvent(syndicateExpansion, withUniformDissent(buildState(), 0));
const halfSyndicate = openCardEvent(syndicateExpansion, withUniformDissent(buildState(), 50));
const zeroUrban = findOption(zeroSyndicate.event, zeroSyndicate.state, 'Urban Factories');
const halfUrban = findOption(halfSyndicate.event, halfSyndicate.state, 'Urban Factories');
assertClose(
  valueFor(zeroUrban.effectPreview!(zeroSyndicate.state), 'Obreros support for CNT-FAI'),
  3,
  'syndicate worker-support preview at zero dissent'
);
assertClose(
  valueFor(halfUrban.effectPreview!(halfSyndicate.state), 'Obreros support for CNT-FAI'),
  3,
  'unscaled syndicate worker-support preview at 50% dissent'
);

const noResources = openCardEvent(media, buildState({ resources: 0, radio: 0, cinema: 0 }));
const enoughResources = openCardEvent(media, buildState({ resources: 3, radio: 0, cinema: 0 }));
const resourceCases = [
  ['Strengthen Revolutionary Mobilization', -1],
  ['Fund a Clandestine Radio Station', -2],
  ['Anarchism on the Silver Screen', -3]
] as const;

for (const [text, expectedCost] of resourceCases) {
  const unavailable = findOption(noResources.event, noResources.state, text);
  const available = findOption(enoughResources.event, enoughResources.state, text);
  equal(unavailable.condition?.(noResources.state), false, `${text} must be unavailable without resources`);
  equal(available.condition?.(enoughResources.state), true, `${text} must be available with resources`);
  assertClose(valueFor(available.effectPreview!(enoughResources.state), 'Resources'), expectedCost, `${text} resource preview`);
}

const paidRadio = openCardEvent(media, buildState({ resources: 1, radio: 2, cinema: 1 }));
const paidRadioOption = findOption(paidRadio.event, paidRadio.state, 'Expand the Radio Network');
equal(paidRadioOption.condition?.(paidRadio.state), true, 'paid radio expansion must accept 1 resource');
assertClose(valueFor(paidRadioOption.effectPreview!(paidRadio.state), 'Resources'), -1, 'paid radio expansion resource preview');

const selfSufficientRadio = openCardEvent(media, buildState({ resources: 0, radio: 4, cinema: 1 }));
const selfSufficientOption = findOption(
  selfSufficientRadio.event,
  selfSufficientRadio.state,
  'Expand the Self-Sufficient Radio Network'
);
equal(selfSufficientOption.condition, undefined, 'self-sufficient radio expansion must not require resources');
equal(
  valueFor(selfSufficientOption.effectPreview!(selfSufficientRadio.state), 'Resources'),
  undefined,
  'self-sufficient radio expansion must not preview a resource cost'
);

console.log('Action-affairs effect preview tests passed.');
