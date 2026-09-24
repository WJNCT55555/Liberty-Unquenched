import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import { media } from '../src/game/action_affairs/media';
import { syndicateExpansion } from '../src/game/action_affairs/syndicate_expansion';
import { organizationsCard } from '../src/game/action_affairs/organizations';
import { landAndFreedom } from '../src/game/action_affairs/land_and_freedom';
import { mujeresLibresCard } from '../src/game/action_affairs/mujeres_libres';
import { fijlCard } from '../src/game/action_affairs/fijl';
import { prrevsCampaigning } from '../src/game/action_affairs/prrevs_campaigning';
import { propagandaByDeed } from '../src/game/action_affairs/propaganda_by_deed';
import { aragonFront } from '../src/game/military_affairs/aragon_front';
import { militiaReorg } from '../src/game/military_affairs/militia_reorg';
import { anarchyTanks } from '../src/game/military_affairs/anarchy_tanks';
import { prepareForRevolution } from '../src/game/military_affairs/prepare_for_revolution';
import { INITIAL_MILITARIZATION } from '../src/game/rules/militarization';
import { getOptionEffectPreview } from '../src/game/effectPreview';
import { PRE_START_STATE } from '../src/game/scenarios';
import { INITIAL_CLASSES } from '../src/game/parties';
import { getDefaultOrganizationState } from '../src/game/organizations';
import type { Card, EffectPreviewLine, GameEvent, GameState } from '../src/game/types';

const cloneData = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const buildState = (overrides: Partial<GameState> = {}): GameState => ({
  ...PRE_START_STATE,
  factions: cloneData(PRE_START_STATE.factions),
  classes: cloneData(INITIAL_CLASSES),
  stats: { ...PRE_START_STATE.stats },
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

const optionTextZh = (option: GameEvent['options'][number], state: GameState): string | undefined => {
  const value = option.textZh;
  if (value === undefined) return undefined;
  return typeof value === 'function' ? value(state) : value;
};

const findOption = (event: GameEvent, state: GameState, text: string) => {
  const option = event.options.find((candidate) => optionText(candidate, state) === text);
  ok(option, `missing option: ${text}`);
  return option;
};

/** Options whose title carries live state (remaining uses) are matched by prefix. */
const findOptionStartingWith = (event: GameEvent, state: GameState, prefix: string) => {
  const option = event.options.find((candidate) => optionText(candidate, state).startsWith(prefix));
  ok(option, `missing option starting with: ${prefix}`);
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

const notEstablishedOrganizations = openCardEvent(
  organizationsCard,
  buildState({ resources: 3 })
);
ok(
  notEstablishedOrganizations.event.options.some((option) => optionText(option, notEstablishedOrganizations.state) === 'Establish FIJL Youth (-2 Resources)'),
  'FIJL establishment option must be visible before the organization is established'
);
ok(
  notEstablishedOrganizations.event.options.some((option) => optionText(option, notEstablishedOrganizations.state) === 'Establish Mujeres Libres (-2 Resources)'),
  'Mujeres Libres establishment option must be visible before the organization is established'
);
ok(
  !notEstablishedOrganizations.event.options.some((option) => optionText(option, notEstablishedOrganizations.state) === 'Turn our attention to our youth organization.'),
  'FIJL spotlight option must stay hidden before the organization is established'
);
const organizationRouteLabels = [
  'Open Land and Freedom (-1 Resource)',
  'Open Mujeres Libres',
  'Open FIJL Youth',
  'Open PRRevS Electoral Campaign'
] as const;
organizationRouteLabels.forEach((label) => {
  ok(
    !notEstablishedOrganizations.event.options.some((option) => optionText(option, notEstablishedOrganizations.state) === label),
    `${label} must stay hidden before its organization is established`
  );
});

const establishedOrganizations = openCardEvent(
  organizationsCard,
  buildState({
    organizations: {
      ...cloneData(getDefaultOrganizationState('1931')),
      FNA: { established: true },
      FIJL: { established: true },
      ML: { established: true },
      PRRevS: { established: true },
    },
    resources: 2,
    mujeres_libres_timer: 4,
    fijl_timer: 4,
    prrevs_campaign_timer: 4,
  })
);
ok(
  !establishedOrganizations.event.options.some((option) => optionText(option, establishedOrganizations.state) === 'Establish FIJL Youth (-2 Resources)'),
  'FIJL establishment option must be hidden after the organization is established'
);
ok(
  !establishedOrganizations.event.options.some((option) => optionText(option, establishedOrganizations.state) === 'Establish Mujeres Libres (-2 Resources)'),
  'Mujeres Libres establishment option must be hidden after the organization is established'
);
ok(
  !establishedOrganizations.event.options.some((option) => optionText(option, establishedOrganizations.state) === 'Turn our attention to our youth organization.'),
  'FIJL must not be nested in the Organizations card'
);
ok(
  !establishedOrganizations.event.options.some((option) => optionText(option, establishedOrganizations.state) === 'Turn to the strength of Iberian women.'),
  'Mujeres Libres must not be nested in the Organizations card'
);
organizationRouteLabels.forEach((label) => {
  const option = findOption(establishedOrganizations.event, establishedOrganizations.state, label);
  equal(option.condition?.(establishedOrganizations.state), label === 'Open Land and Freedom (-1 Resource)' ? true : undefined, `${label} visibility route condition`);
});
const landRoute = findOption(establishedOrganizations.event, establishedOrganizations.state, 'Open Land and Freedom (-1 Resource)');
const landRouteResult = landRoute.effect(establishedOrganizations.state);
equal(landRouteResult.currentEvent?.id, landAndFreedom.effect(establishedOrganizations.state).currentEvent?.id, 'FNA route must open Land and Freedom');
equal(landRouteResult.resources, 1, 'FNA route must pay Land and Freedom resource cost');
const mujeresRouteResult = findOption(establishedOrganizations.event, establishedOrganizations.state, 'Open Mujeres Libres').effect(establishedOrganizations.state);
equal(mujeresRouteResult.currentEvent?.id, 'mujeres_libres_event', 'ML route must open Mujeres Libres');
equal(mujeresRouteResult.mujeres_libres_timer, 0, 'ML route must bypass the standalone card cooldown');
const fijlRouteResult = findOption(establishedOrganizations.event, establishedOrganizations.state, 'Open FIJL Youth').effect(establishedOrganizations.state);
equal(fijlRouteResult.currentEvent?.id, 'fijl_event', 'FIJL route must open the FIJL card');
equal(fijlRouteResult.fijl_timer, 0, 'FIJL route must bypass the standalone card cooldown');
const prrevsRouteResult = findOption(establishedOrganizations.event, establishedOrganizations.state, 'Open PRRevS Electoral Campaign').effect(establishedOrganizations.state);
equal(prrevsRouteResult.currentEvent?.id, prrevsCampaigning.effect(establishedOrganizations.state).currentEvent?.id, 'PRRevS route must open the electoral campaign card');
equal(prrevsRouteResult.prrevs_campaign_timer, 0, 'PRRevS route must bypass the campaign cooldown');

const mujeresLibresOpened = openCardEvent(
  mujeresLibresCard,
  buildState({
    unemployment_rate: 8,
    organizations: {
      ...cloneData(getDefaultOrganizationState('1931')),
      ML: { established: true }
    }
  })
);
equal(mujeresLibresOpened.event.options.length, 4, 'Mujeres Libres must expose four decision options');
ok(
  mujeresLibresCard.descriptionZh?.startsWith('长久以来，哪怕在最激进的男性革命者眼中'),
  'Mujeres Libres card must use the requested Chinese description'
);
const mujeresOptionTitles = [
  'Propaganda to awaken women’s conscience of freedom.',
  'Workplaces and employment.',
  'Labor education.',
  'Take the work into the countryside.'
];
mujeresLibresOpened.event.options.forEach((option) => {
  assertExplicitPreviewMatchesEffect(
    mujeresLibresOpened.state,
    option,
    `Mujeres Libres / ${optionText(option, mujeresLibresOpened.state)}`
  );
});
mujeresOptionTitles.forEach((title) => {
  const option = findOption(mujeresLibresOpened.event, mujeresLibresOpened.state, title);
  ok(option.textZh, `${title} must have Chinese text`);
  ok(option.subtitle, `${title} must have an English subtitle`);
  ok(option.subtitleZh, `${title} must have a Chinese subtitle`);
  equal(option.effect(mujeresLibresOpened.state).currentEvent, null, `${title} must close the event`);
});
assertClose(
  valueFor(
    findOption(mujeresLibresOpened.event, mujeresLibresOpened.state, 'Workplaces and employment.').effectPreview!(mujeresLibresOpened.state),
    'Unemployment'
  ),
  -0.5,
  'Mujeres Libres workplace option unemployment preview'
);
assertClose(
  valueFor(
    findOption(mujeresLibresOpened.event, mujeresLibresOpened.state, 'Labor education.').effectPreview!(mujeresLibresOpened.state),
    'Unemployment'
  ),
  -1,
  'Mujeres Libres education option unemployment preview'
);

const womenReadyWhileOrganizationsCool = {
  ...establishedOrganizations.state,
  organizations_timer: 4,
  mujeres_libres_timer: 0
};
ok(
  mujeresLibresCard.condition?.(womenReadyWhileOrganizationsCool),
  'Mujeres Libres must remain playable while the Organizations card is cooling down'
);
const womenCoolingWhileOrganizationsReady = {
  ...establishedOrganizations.state,
  organizations_timer: 0,
  mujeres_libres_timer: 4
};
equal(
  mujeresLibresCard.condition?.(womenCoolingWhileOrganizationsReady),
  false,
  'Mujeres Libres must observe its own cooldown'
);
const womenCardResult = mujeresLibresCard.effect(womenReadyWhileOrganizationsCool);
equal(womenCardResult.mujeres_libres_timer, 6, 'Mujeres Libres must set its own cooldown');
equal(womenCardResult.organizations_timer, undefined, 'Mujeres Libres must not set the Organizations cooldown');

const fijlOpened = openCardEvent(
  fijlCard,
  buildState({
    organizations: {
      ...cloneData(getDefaultOrganizationState('1931')),
      FIJL: { established: true }
    }
  })
);
equal(fijlOpened.event.options.length, 5, 'FIJL must expose five decision options');
ok(
  fijlCard.descriptionZh?.startsWith('伊比利亚自由青年联合会是伊比利亚大地上最年轻的火种'),
  'FIJL card must use the requested Chinese description'
);
fijlOpened.event.options.forEach((option) => {
  assertExplicitPreviewMatchesEffect(
    fijlOpened.state,
    option,
    `FIJL / ${optionText(option, fijlOpened.state)}`
  );
  ok(option.textZh, `FIJL option ${optionText(option, fijlOpened.state)} must have Chinese text`);
  ok(option.subtitle && option.subtitleZh, `FIJL option ${optionText(option, fijlOpened.state)} must have bilingual subtitles`);
});
const frontOption = findOption(fijlOpened.event, fijlOpened.state, 'Set out, young people, for the battlefield.');
equal(frontOption.condition?.(fijlOpened.state), false, 'FIJL battlefield option must wait for the civil war');
equal(
  frontOption.condition?.({ ...fijlOpened.state, civilWarStatus: 'ongoing' }),
  true,
  'FIJL battlefield option must unlock during the civil war'
);
const fijlReadyWhileOrganizationsCool = {
  ...establishedOrganizations.state,
  organizations_timer: 4,
  fijl_timer: 0
};
ok(
  fijlCard.condition?.(fijlReadyWhileOrganizationsCool),
  'FIJL must remain playable while the Organizations card is cooling down'
);
const fijlCoolingWhileOrganizationsReady = {
  ...establishedOrganizations.state,
  organizations_timer: 0,
  fijl_timer: 4
};
equal(
  fijlCard.condition?.(fijlCoolingWhileOrganizationsReady),
  false,
  'FIJL must observe its own cooldown'
);
const fijlCardResult = fijlCard.effect(fijlReadyWhileOrganizationsCool);
equal(fijlCardResult.fijl_timer, 6, 'FIJL must set its own cooldown');
equal(fijlCardResult.organizations_timer, undefined, 'FIJL must not set the Organizations cooldown');

const propagandaOpened = openCardEvent(
  propagandaByDeed,
  buildState({ propaganda_timer: 4 })
);
const strikeSpotlight = findOption(propagandaOpened.event, propagandaOpened.state, 'Use a strike as our propaganda.');
const mediaSpotlight = findOption(propagandaOpened.event, propagandaOpened.state, 'Let the weapon of criticism lead social change.');
equal(strikeSpotlight.effect(propagandaOpened.state).currentEvent?.id, 'strike_event', 'Propaganda by the Deed strike branch must open the Strike card');
const mediaBranch = mediaSpotlight.effect(propagandaOpened.state);
equal(mediaBranch.currentEvent?.id, 'media_event', 'Propaganda by the Deed criticism branch must open the Media card');
equal(mediaBranch.propaganda_timer, 0, 'Propaganda by the Deed criticism branch must bypass the Media cooldown');
ok(fijlCard.condition?.({ ...establishedOrganizations.state, organizations_timer: 0, fijl_timer: 0 }), 'FIJL card should be playable after FIJL is established');
ok(mujeresLibresCard.condition?.({ ...establishedOrganizations.state, organizations_timer: 0, mujeres_libres_timer: 0 }), 'Mujeres Libres card should be playable after it is established');

// Military affairs cards follow the same preview contract as action affairs: every
// visible option owns an explicit preview derived from the callback it executes, and
// the Chinese option text stays parallel to the English one instead of merging the
// description into the title line.
const militaryState = buildState({
  year: 1936,
  month: 7,
  civilWarStatus: 'ongoing',
  aragonCouncilExists: true,
  armaments: 3,
  resources: 3,
  tankResearchProgress: 50,
  organizations: cloneData(getDefaultOrganizationState('1936')),
});

const aragonOpened = openCardEvent(aragonFront, militaryState);
const aragonOptionTitles = [
  'Militia Recruitment (+500 Militia)',
  'Restore Discipline',
  'Negotiate with Church',
  'We will not do anything in Aragon for now',
] as const;
equal(aragonOpened.event.options.length, aragonOptionTitles.length, 'Aragon Front must expose four decision options');
aragonOptionTitles.forEach((title) => {
  const option = findOption(aragonOpened.event, aragonOpened.state, title);
  const textZh = optionTextZh(option, aragonOpened.state);
  ok(textZh, `Aragon Front / ${title} must have Chinese text`);
  ok(
    !textZh?.includes('：'),
    `Aragon Front / ${title} must keep its Chinese option title parallel to the English one`
  );
  ok(option.subtitle && option.subtitleZh, `Aragon Front / ${title} must have bilingual subtitles`);
  assertExplicitPreviewMatchesEffect(aragonOpened.state, option, `Aragon Front / ${title}`);
});
equal(
  aragonFront.effect({ ...militaryState, aragon_front_timer: 0 }).aragon_front_timer,
  3,
  'Playing the Aragon Front must set its own three-month cooldown'
);
const disciplineResult = findOption(aragonOpened.event, aragonOpened.state, 'Restore Discipline').effect(aragonOpened.state);
equal(
  disciplineResult.factions?.Puristas.dissent,
  aragonOpened.state.factions.Puristas.dissent + 5,
  'Restoring discipline must raise Puristas dissent by 5'
);
equal(
  disciplineResult.factions?.Faistas.dissent,
  aragonOpened.state.factions.Faistas.dissent + 3,
  'Restoring discipline must raise Faistas dissent by 3'
);
equal(
  disciplineResult.militarization?.cnt,
  INITIAL_MILITARIZATION.cnt + 5,
  'Restoring discipline must raise the CNT force group rate by 5'
);
const aragonRecruitment = findOption(
  aragonOpened.event,
  aragonOpened.state,
  'Militia Recruitment (+500 Militia)'
).effect(aragonOpened.state);
equal(
  aragonRecruitment.armedForces?.entityPools.cnt_defense_committees?.manpower,
  500,
  'Militia Recruitment must add 500 defence-committee manpower'
);
equal(
  findOption(aragonOpened.event, aragonOpened.state, 'We will not do anything in Aragon for now')
    .effect(aragonOpened.state).currentEvent,
  null,
  'Declining to act in Aragon must still close the event'
);

const militiaReorgOpened = openCardEvent(militiaReorg, militaryState);
const militiaReorgOptionTitles = [
  'Regular Training (-1 Armament)',
  'Recruit Militia (-1 Armament)',
  'Establish Assault Battalions (-1 Armament)',
  // 军事训练卡已并入本卡：这两条选项原来属于独立的 `military_training`。
  'Drill the Confederal Militia',
  'Leave the militia to their own devices',
  'We do not intend to intervene in militia affairs',
] as const;
equal(
  militiaReorgOpened.event.options.length,
  militiaReorgOptionTitles.length,
  'Militia Reorganization must expose six decision options'
);
militiaReorgOptionTitles.forEach((title) => {
  const option = findOption(militiaReorgOpened.event, militiaReorgOpened.state, title);
  const textZh = optionTextZh(option, militiaReorgOpened.state);
  ok(textZh, `Militia Reorganization / ${title} must have Chinese text`);
  ok(
    !textZh?.includes('：'),
    `Militia Reorganization / ${title} must keep its Chinese option title parallel to the English one`
  );
  ok(option.subtitle && option.subtitleZh, `Militia Reorganization / ${title} must have bilingual subtitles`);
  assertExplicitPreviewMatchesEffect(militiaReorgOpened.state, option, `Militia Reorganization / ${title}`);
});
equal(
  militiaReorg.effect(militaryState).militia_reorg_timer,
  1,
  'Playing Militia Reorganization must set its own cooldown'
);
const recruitMilitiaResult = findOption(
  militiaReorgOpened.event,
  militiaReorgOpened.state,
  'Recruit Militia (-1 Armament)'
).effect(militiaReorgOpened.state);
equal(recruitMilitiaResult.armaments, militaryState.armaments - 1, 'Recruiting militia must spend 1 armament');
equal(
  recruitMilitiaResult.armedForces?.entityPools.cnt_defense_committees?.manpower,
  1000,
  'Recruiting militia must add 1000 defence-committee manpower'
);
equal(
  findOption(militiaReorgOpened.event, militiaReorgOpened.state, 'Recruit Militia (-1 Armament)')
    .condition?.(buildState({ armaments: 0 })),
  false,
  'Recruiting militia must be unavailable without armaments'
);

const anarchyTanksOpened = openCardEvent(anarchyTanks, militaryState);
const anarchyTanksOptionTitles = [
  'Tank R&D (Cost: 1 Armament, +25 Progress)',
  'Accelerate R&D (Cost: 2 Armaments, RNG Progress)',
  'Combat Test (Cost: 1 Resource, RNG based on difficulty)',
  'We will postpone the tank program for now',
] as const;
equal(anarchyTanksOpened.event.options.length, anarchyTanksOptionTitles.length, 'Anarchy? Tanks?! must expose four decision options');
anarchyTanksOptionTitles.forEach((title) => {
  const option = findOption(anarchyTanksOpened.event, anarchyTanksOpened.state, title);
  const textZh = optionTextZh(option, anarchyTanksOpened.state);
  ok(textZh, `Anarchy? Tanks?! / ${title} must have Chinese text`);
  ok(
    !textZh?.includes('：'),
    `Anarchy? Tanks?! / ${title} must keep its Chinese option title parallel to the English one`
  );
  ok(option.subtitle && option.subtitleZh, `Anarchy? Tanks?! / ${title} must have bilingual subtitles`);
  ok(option.effectPreview, `Anarchy? Tanks?! / ${title} must define effectPreview`);
  assertBilingual(option.effectPreview(militaryState), `Anarchy? Tanks?! / ${title}`);
});
// Only the deterministic options may be compared against their derived preview; the
// two RNG options deliberately preview both outcomes instead of one roll.
['Tank R&D (Cost: 1 Armament, +25 Progress)', 'We will postpone the tank program for now'].forEach((title) => {
  assertExplicitPreviewMatchesEffect(
    anarchyTanksOpened.state,
    findOption(anarchyTanksOpened.event, anarchyTanksOpened.state, title),
    `Anarchy? Tanks?! / ${title}`
  );
});
equal(
  anarchyTanks.effect(militaryState).anarchy_tanks_timer,
  6,
  'Playing Anarchy? Tanks?! must set its own six-month cooldown'
);
const tankResearchResult = findOption(
  anarchyTanksOpened.event,
  anarchyTanksOpened.state,
  'Tank R&D (Cost: 1 Armament, +25 Progress)'
).effect(anarchyTanksOpened.state);
equal(tankResearchResult.armaments, militaryState.armaments - 1, 'Tank R&D must spend 1 armament');
equal(tankResearchResult.tankResearchProgress, 75, 'Tank R&D must add 25 research progress');
equal(tankResearchResult.currentEvent?.id, 'tank_rd_report', 'Tank R&D must open the research report');

// Prepare for Revolution is a peacetime military menu card: the same event re-opens
// after every lever pull and the three-pull limit is a global programme counter, so
// the war gate, the armament cost and the nine-pull budget are all exercised here.
const revolutionState = buildState({
  civilWarStatus: 'not_started',
  armaments: 5,
  organizations: {
    ...cloneData(getDefaultOrganizationState('1931')),
    DC: { established: true, status: 'active' as const },
  },
});
const applyOption = (state: GameState, option: GameEvent['options'][number]): GameState => (
  { ...state, ...option.effect(state) } as GameState
);

const prepareOpened = openCardEvent(prepareForRevolution, revolutionState);
const prepareOptionTitles = [
  'Arm the Militias',
  'Win Over the Armed Forces',
  'Sabotage the Reactionaries',
  'Conclude the Preparation',
] as const;
equal(
  prepareOpened.event.options.length,
  prepareOptionTitles.length,
  'Prepare for Revolution must expose three levers and a conclusion'
);
prepareOptionTitles.forEach((title) => {
  const option = findOptionStartingWith(prepareOpened.event, prepareOpened.state, title);
  ok(optionTextZh(option, prepareOpened.state), `Prepare for Revolution / ${title} must have Chinese text`);
  ok(option.subtitle && option.subtitleZh, `Prepare for Revolution / ${title} must have bilingual subtitles`);
  assertExplicitPreviewMatchesEffect(prepareOpened.state, option, `Prepare for Revolution / ${title}`);
});
ok(
  optionText(
    findOptionStartingWith(prepareOpened.event, prepareOpened.state, 'Arm the Militias'),
    prepareOpened.state
  ).includes('3/3 left'),
  'The militia lever must show how many global pulls are left'
);

const armTheMilitias = findOptionStartingWith(prepareOpened.event, prepareOpened.state, 'Arm the Militias');
const armTheMilitiasResult = armTheMilitias.effect(revolutionState);
equal(armTheMilitiasResult.armaments, 4, 'Arming the militias must spend 1 armament');
equal(
  armTheMilitiasResult.militarization?.cnt,
  INITIAL_MILITARIZATION.cnt + 2,
  'Arming the militias must raise the CNT force group rate by 2'
);
equal(armTheMilitiasResult.prepareRevolution?.militiaUses, 1, 'Arming the militias must count one pull');
equal(
  armTheMilitiasResult.currentEvent?.id,
  'prepare_revolution_event',
  'Every lever must return to the preparation menu'
);
equal(
  armTheMilitias.condition?.(buildState({ armaments: 0, organizations: cloneData(getDefaultOrganizationState('1931')) })),
  false,
  'Arming the militias must be unavailable without armaments'
);
equal(
  armTheMilitias.condition?.({
    ...revolutionState,
    militarization: { ...INITIAL_MILITARIZATION, cnt: 40 },
  }),
  false,
  'Arming the militias must be unavailable once the CNT rate reaches 40'
);
equal(
  armTheMilitias.condition?.({ ...revolutionState, prepareRevolution: { militiaUses: 3, armyUses: 0, sabotageUses: 0 } }),
  false,
  'Arming the militias must stop after three pulls in the whole programme'
);

const cappedMilitarization = armTheMilitias.effect({
  ...revolutionState,
  militarization: { ...INITIAL_MILITARIZATION, cnt: 39 },
});
equal(
  cappedMilitarization.militarization?.cnt,
  40,
  'Peacetime drilling must stop the militia rate at 40'
);
equal(
  prepareForRevolution.condition?.({ ...revolutionState, civilWarStatus: 'ongoing' }),
  false,
  'Prepare for Revolution must be unplayable once the country is at war'
);
equal(
  prepareForRevolution.condition?.({
    ...revolutionState,
    organizations: {
      ...cloneData(getDefaultOrganizationState('1931')),
      DC: { established: false, status: 'unformed' as const },
    },
  }),
  false,
  'Prepare for Revolution must require the defence committees'
);

const threePulls = [0, 1, 2].reduce<GameState>(
  (state) => applyOption(state, armTheMilitias),
  revolutionState
);
equal(threePulls.prepareRevolution?.militiaUses, 3, 'Three pulls must be counted');
equal(threePulls.armaments, 2, 'Three pulls must spend three armaments');
equal(
  armTheMilitias.condition?.(threePulls),
  false,
  'A fourth pull of the same lever must be unavailable'
);
equal(
  prepareForRevolution.effect(threePulls).prepareRevolution,
  undefined,
  'Playing the card must not reset the global programme counters'
);
equal(
  prepareForRevolution.condition?.(threePulls),
  true,
  'The card must stay playable while other levers still have pulls left'
);
equal(
  prepareForRevolution.condition?.({
    ...threePulls,
    prepareRevolution: { militiaUses: 3, armyUses: 3, sabotageUses: 3 },
  }),
  false,
  'The card must leave the deck once all nine pulls are spent'
);

const winOverTheArmedForces = findOptionStartingWith(
  prepareOpened.event,
  prepareOpened.state,
  'Win Over the Armed Forces'
);
const officerResult = winOverTheArmedForces.effect(revolutionState);
equal(officerResult.armaments, 4, 'Winning over the armed forces must spend 1 armament');
equal(
  officerResult.stats?.armyLoyalty,
  revolutionState.stats.armyLoyalty + 3,
  'Winning over the armed forces must raise officer loyalty by 3'
);
equal(officerResult.prepareRevolution?.armyUses, 1, 'Winning over the armed forces must count one pull');
equal(
  winOverTheArmedForces.condition?.({ ...revolutionState, prepareRevolution: { militiaUses: 0, armyUses: 3, sabotageUses: 0 } }),
  false,
  'Winning over the armed forces must stop after three pulls in the whole programme'
);

const sabotage = findOptionStartingWith(prepareOpened.event, prepareOpened.state, 'Sabotage the Reactionaries');
const requeteOnly = sabotage.effect(revolutionState);
equal(requeteOnly.armaments, 4, 'Sabotage must spend 1 armament');
equal(
  requeteOnly.militarization?.requetes,
  INITIAL_MILITARIZATION.requetes - 2,
  'The Carlist militia must lose 2 militarization'
);
equal(
  requeteOnly.militarization?.falange,
  INITIAL_MILITARIZATION.falange,
  'The Falange must keep its rate while its first line does not exist'
);
equal(requeteOnly.prepareRevolution?.sabotageUses, 1, 'Sabotage must count one pull');
const falangeRaised = {
  ...revolutionState,
  organizations: {
    ...cloneData(getDefaultOrganizationState('1931')),
    FALANGE_MILITIA: { established: true, status: 'active' as const },
  },
};
equal(sabotage.condition?.(falangeRaised), true, 'Sabotage must be available while a right-wing militia exists');
const bothMilitias = sabotage.effect(falangeRaised);
equal(
  bothMilitias.militarization?.falange,
  INITIAL_MILITARIZATION.falange - 2,
  'The Falange first line must lose 2 militarization once it exists'
);
equal(
  sabotage.condition?.({
    ...revolutionState,
    organizations: {
      ...cloneData(getDefaultOrganizationState('1931')),
      REQUETE_MILITIA: { established: false, status: 'unformed' as const },
      FALANGE_MILITIA: { established: false, status: 'unformed' as const },
    },
  }),
  false,
  'Sabotage must be unavailable when no right-wing militia has been raised'
);

const conclude = findOption(prepareOpened.event, prepareOpened.state, 'Conclude the Preparation');
const concluded = conclude.effect(revolutionState);
equal(concluded.prepare_revolution_timer, 4, 'Concluding must set the four-month cooldown');
equal(
  concluded.prepareRevolution,
  undefined,
  'Concluding must leave the global programme counters alone'
);
equal(concluded.currentEvent, null, 'Concluding must close the event');
equal(
  prepareForRevolution.condition?.({ ...revolutionState, prepare_revolution_timer: 0 }),
  true,
  'Prepare for Revolution must be playable at peace, with the defence committees, off cooldown'
);
equal(
  prepareForRevolution.condition?.({ ...revolutionState, prepare_revolution_timer: 4 }),
  false,
  'Prepare for Revolution must observe its own cooldown'
);
equal(prepareForRevolution.type, 'Military', 'Prepare for Revolution must be a military card');

console.log('Action-affairs effect preview tests passed.');
