import { Card, GameState, GameEvent } from '../types';
import { adjustAllActiveFactionDissent, adjustClassSupport, adjustFactionDissent, adjustFactionDissents, getDissentMultiplier } from '../utils';
import { effectPreviewFromEffect } from '../effectPreview';

type MediaEffect = GameEvent['options'][number]['effect'];

const broadenAppeal: MediaEffect = (state: GameState): Partial<GameState> => {
  const dissentFactor = getDissentMultiplier(state.factions);
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 4 * dissentFactor);
  classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 3 * dissentFactor);
  const factions = adjustFactionDissents(state.factions, { Faistas: 10, Puristas: 10 });

  return {
    resources: state.resources + 1,
    classes,
    factions,
    commercialized_propaganda: state.commercialized_propaganda + 1
  };
};

const strengthenMobilization: MediaEffect = (state: GameState): Partial<GameState> => {
  const dissentFactor = getDissentMultiplier(state.factions);
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', 3 * dissentFactor);
  classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 2 * dissentFactor);

  return {
    resources: state.resources - 1,
    classes,
    campaign_propaganda: state.campaign_propaganda + 1
  };
};

const encourageIdeologicalDebate: MediaEffect = (state: GameState): Partial<GameState> => {
  const factions = adjustAllActiveFactionDissent(state.factions, -6);

  return {
    factions,
    socialism: state.socialism + 1,
    nationalism: state.nationalism + 1,
    pacifism: state.pacifism + 1,
    democratization: state.democratization + 1,
    pro_republic: state.pro_republic + 1,
    ideological_propaganda: state.ideological_propaganda + 1
  };
};

const fundClandestineRadio: MediaEffect = (state: GameState): Partial<GameState> => {
  const dissentFactor = getDissentMultiplier(state.factions);
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 4 * dissentFactor);
  classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 3 * dissentFactor);
  classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', 2 * dissentFactor);
  const factions = adjustFactionDissent(state.factions, 'Faistas', 5);

  return {
    resources: state.resources - 2,
    classes,
    factions,
    radio: 1,
    socialism: state.socialism + 3 * dissentFactor,
    nationalism: state.pacifism > 1
      ? state.nationalism - 3 * dissentFactor
      : state.nationalism,
    pro_republic: state.democratization > 1
      ? state.pro_republic + 3 * dissentFactor
      : state.pro_republic
  };
};

const expandRadioNetwork: MediaEffect = (state: GameState): Partial<GameState> => {
  const dissentFactor = getDissentMultiplier(state.factions);
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 5 * dissentFactor);
  classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 3 * dissentFactor);
  classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', 3 * dissentFactor);

  return {
    resources: state.resources - 1,
    classes,
    radio: state.radio + 1,
    socialism: state.socialism + 3 * dissentFactor,
    nationalism: state.pacifism > 2
      ? state.nationalism - 3 * dissentFactor * (state.pacifism - 2)
      : state.nationalism,
    pro_republic: state.democratization > 2
      ? state.pro_republic + 3 * dissentFactor * (state.democratization - 2)
      : state.pro_republic
  };
};

const expandSelfSufficientRadio: MediaEffect = (state: GameState): Partial<GameState> => {
  const dissentFactor = getDissentMultiplier(state.factions);
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 5 * dissentFactor);
  classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 4 * dissentFactor);
  classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', 4 * dissentFactor);
  classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 3 * dissentFactor);
  classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', 2 * dissentFactor);

  return {
    classes,
    radio: state.radio + 1,
    socialism: state.socialism + 3 * dissentFactor,
    nationalism: state.pacifism > 2
      ? state.nationalism - 3 * dissentFactor * (state.pacifism - 2)
      : state.nationalism,
    pro_republic: state.democratization > 2
      ? state.pro_republic + 3 * dissentFactor * (state.democratization - 2)
      : state.pro_republic
  };
};

const fundAnarchistCinema: MediaEffect = (state: GameState): Partial<GameState> => {
  const dissentFactor = getDissentMultiplier(state.factions);
  let classes = state.classes;
  classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 5 * dissentFactor);
  classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 3 * dissentFactor);
  classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', 2 * dissentFactor);
  classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', dissentFactor);
  const factions = adjustFactionDissent(state.factions, 'Treintistas', 3);

  return {
    resources: state.resources - 3,
    classes,
    factions,
    cinema: 1,
    socialism: state.socialism + 2 * dissentFactor,
    nationalism: state.nationalism - dissentFactor,
    pro_republic: state.democratization > 1
      ? state.pro_republic + 2 * dissentFactor
      : state.pro_republic
  };
};

const waitOnPropaganda: MediaEffect = (): Partial<GameState> => ({});

const preview = (effect: MediaEffect) => (state: GameState) => {
  return effectPreviewFromEffect(state, effect);
};

export const media: Card = {
  id: 'media',
  title: 'Media',
  titleZh: '媒体',
  type: 'Action',
  description: 'Manage our propaganda network and explore new media like radio and cinema.',
  descriptionZh: '管理我们的宣传网络，并探索广播和电影等新媒体。',
  cost: 1,
  condition: (state) => state.propaganda_timer <= 0,
  effect: (state) => {
    const options: GameEvent['options'] = [
      {
        text: 'Broaden Our Appeal',
        textZh: '扩大受众',
        subtitle: 'This might upset ideological purists, but it may bring in more funds and perhaps expose the middle class to libertarian socialist ideas.',
        subtitleZh: '这可能会让意识形态纯粹主义者不满，但它可能带来更多资金，并可能让中产阶级接触到自由社会主义思想。',
        effectPreview: preview(broadenAppeal),
        effect: broadenAppeal
      },
      {
        text: 'Strengthen Revolutionary Mobilization',
        textZh: '加强革命动员',
        subtitle: 'Our newspapers will focus on the revolutionary struggle and union organizing.',
        subtitleZh: '我们的报纸将专注于革命斗争和工会组织。',
        condition: (s: GameState) => s.resources >= 1,
        unavailableSubtitle: () => 'Need at least 1 resource',
        unavailableSubtitleZh: () => '需要至少 1 资源',
        effectPreview: preview(strengthenMobilization),
        effect: strengthenMobilization
      },
      {
        text: 'Encourage Ideological Debate',
        textZh: '鼓励意识形态辩论',
        subtitle: 'There will be space for all tendencies—Treintistas, Cenetistas, Faistas, and Puristas—to air their views.',
        subtitleZh: '所有派别——三十人集团、工团派、无政府主义者和纯粹派——都有空间发表自己的观点。',
        effectPreview: preview(encourageIdeologicalDebate),
        effect: encourageIdeologicalDebate
      },
    ];

    // Radio options
    if (state.radio === 0) {
      options.push({
        text: 'Fund a Clandestine Radio Station',
        textZh: '资助秘密广播电台',
        subtitle: 'Radio can reach those who cannot read, spreading our message across the airwaves.',
        subtitleZh: '广播可以触及那些不识字的人，通过电波传播我们的信息。',
        condition: (s: GameState) => s.resources >= 2,
        unavailableSubtitle: () => 'Need at least 2 resources',
        unavailableSubtitleZh: () => '需要至少 2 资源',
        effectPreview: preview(fundClandestineRadio),
        effect: fundClandestineRadio
      });
    }

    if (state.radio > 0 && state.radio <= 3) {
      options.push({
        text: 'Expand the Radio Network',
        textZh: '扩建广播网络',
        subtitle: 'Expand our reach to more cities and towns.',
        subtitleZh: '将我们的影响力扩展到更多的城镇。',
        condition: (s: GameState) => s.resources >= 1,
        unavailableSubtitle: () => 'Need at least 1 resource',
        unavailableSubtitleZh: () => '需要至少 1 资源',
        effectPreview: preview(expandRadioNetwork),
        effect: expandRadioNetwork
      });
    }

    if (state.radio > 3 && state.radio <= 5) {
      options.push({
        text: 'Expand the Self-Sufficient Radio Network',
        textZh: '扩建自给自足的广播网络',
        subtitle: 'Our network is now large enough to sustain itself through local contributions.',
        subtitleZh: '我们的网络现在已经大到足以通过地方捐助维持自身运转。',
        effectPreview: preview(expandSelfSufficientRadio),
        effect: expandSelfSufficientRadio
      });
    }

    // Cinema option
    if (state.cinema === 0) {
      options.push({
        text: 'Anarchism on the Silver Screen',
        textZh: '银幕上的无政府主义',
        subtitle: 'Cinema is a powerful tool for mass education and inspiration.',
        subtitleZh: '电影是进行大众教育和激励的强大工具。',
        condition: (s: GameState) => s.resources >= 3,
        unavailableSubtitle: () => 'Need at least 3 resources',
        unavailableSubtitleZh: () => '需要至少 3 资源',
        effectPreview: preview(fundAnarchistCinema),
        effect: fundAnarchistCinema
      });
    }

    // Final option
    options.push({
      text: 'Do Nothing for Now',
      textZh: '暂不行动',
      subtitle: 'Sometimes the best action is to wait and see.',
      subtitleZh: '有时最好的行动就是静观其变。',
      effectPreview: preview(waitOnPropaganda),
      effect: waitOnPropaganda
    });

    return {
      propaganda_timer: 6,
      currentEvent: {
        id: 'media_event',
        date: { year: state.year, month: state.month },
        title: 'Media',
        titleZh: '媒体',
        description: `Together, the anarchists have built a propaganda network that spans cities and villages, including printing houses, community newspapers, street speeches and secret broadcasts. Nowadays, emerging media have also entered our field of vision. We can use this network to promote revolutionary propaganda......`,
        descriptionZh: `无政府主义者们已经共同构建了一个遍布城市与乡村的宣传网络，包括印刷所、社区报刊、街头演说与秘密广播。如今，电影这一新兴媒介也进入了我们的视野。我们可以利用这一网络推动革命宣传工作……`,
        options: options,
      }
    };
  },
};

