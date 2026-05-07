import { Card, GameState, GameEvent } from '../types';

const getOverallDissent = (state: GameState) => {
  const totalInfluence = Object.values(state.factions).reduce((acc, f) => acc + f.influence, 0);
  if (totalInfluence === 0) return 0;
  return Object.values(state.factions).reduce((acc, f) => acc + (f.influence * f.dissent), 0) / totalInfluence;
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
        text: 'Make our publications more accessible by broadening their appeal beyond militant circles.',
        textZh: '通过扩大受众范围，使我们的出版物超越激进圈子，从而更易获得。',
        subtitle: 'This might upset ideological purists, but it may bring in more funds and perhaps expose the middle class to libertarian socialist ideas.',
        subtitleZh: '这可能会让意识形态纯粹主义者不满，但它可能带来更多资金，并可能让中产阶级接触到自由社会主义思想。',
        effect: (s: GameState) => {
          const dissentFactor = 1 - (getOverallDissent(s) / 100);
          const newClasses = JSON.parse(JSON.stringify(s.classes));
          newClasses.PequenaBurguesia.support.CNT_FAI += 4 * dissentFactor;
          newClasses.Intelectuales.support.CNT_FAI += 3 * dissentFactor;
          
          const newFactions = JSON.parse(JSON.stringify(s.factions));
          newFactions.Faistas.dissent += 10;
          newFactions.Puristas.dissent += 10;
          
          return {
            resources: s.resources + 1,
            commercialized_propaganda: s.commercialized_propaganda + 1,
            classes: newClasses,
            factions: newFactions,
          };
        },
      },
      {
        text: 'The purpose of our propaganda is to strengthen revolutionary mobilization.',
        textZh: '我们宣传的目的是加强革命动员。',
        subtitle: 'Our newspapers will focus on the revolutionary struggle and union organizing.',
        subtitleZh: '我们的报纸将专注于革命斗争和工会组织。',
        effect: (s: GameState) => {
          const dissentFactor = 1 - (getOverallDissent(s) / 100);
          const newClasses = JSON.parse(JSON.stringify(s.classes));
          newClasses.Obreros.support.CNT_FAI += 4 * dissentFactor;
          newClasses.Braceros.support.CNT_FAI += 2 * dissentFactor;
          
          return {
            resources: s.resources - 1,
            campaign_propaganda: s.campaign_propaganda + 1,
            classes: newClasses,
          };
        },
      },
      {
        text: 'We will have vibrant ideological debate within our publications.',
        textZh: '我们将在出版物中进行充满活力的意识形态辩论。',
        subtitle: 'There will be space for all tendencies—Treintistas, Cenetistas, Faistas, and Puristas—to air their views.',
        subtitleZh: '所有派别——三十人集团、工团派、无政府主义者和纯粹派——都有空间发表自己的观点。',
        effect: (s: GameState) => {
          const newFactions = JSON.parse(JSON.stringify(s.factions));
          newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 6);
          newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 6);
          newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 6);
          newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 6);
          
          return { 
            factions: newFactions,
            socialism: s.socialism + 1,
            nationalism: s.nationalism + 1,
            pacifism: s.pacifism + 1,
            democratization: s.democratization + 1,
            pro_republic: s.pro_republic + 1,
            ideological_propaganda: s.ideological_propaganda + 1,
          };
        },
      },
    ];

    // Radio Options
    if (state.radio === 0) {
      options.push({
        text: 'Why not fund a clandestine radio station? (-2 resources)',
        textZh: '为什么不资助一个秘密广播电台呢？ (-2 资源)',
        subtitle: 'Radio can reach those who cannot read, spreading our message across the airwaves.',
        subtitleZh: '广播可以触及那些不识字的人，通过电波传播我们的信息。',
        condition: (s: GameState) => s.resources >= 2,
        unavailableSubtitle: (s: GameState) => 'Need at least 2 resources',
        unavailableSubtitleZh: (s: GameState) => '需要至少 2 资源',
        effect: (s: GameState) => {
          const dissentFactor = 1 - (getOverallDissent(s) / 100);
          const newClasses = JSON.parse(JSON.stringify(s.classes));
          newClasses.PequenaBurguesia.support.CNT_FAI += 4 * dissentFactor;
          newClasses.Intelectuales.support.CNT_FAI += 3 * dissentFactor;
          newClasses.Obreros.support.CNT_FAI += 2 * dissentFactor;
          
          const newFactions = JSON.parse(JSON.stringify(s.factions));
          newFactions.Faistas.dissent += 5;
          
          return {
            radio: 1,
            resources: s.resources - 2,
            classes: newClasses,
            factions: newFactions,
            socialism: s.socialism + 3 * dissentFactor,
            nationalism: s.pacifism > 1 ? s.nationalism - 3 * dissentFactor : s.nationalism,
            pro_republic: s.democratization > 1 ? s.pro_republic + 3 * dissentFactor : s.pro_republic,
          };
        },
      });
    }

    if (state.radio > 0 && state.radio <= 3) {
      options.push({
        text: 'We must keep on building up our radio network. (-1 resources)',
        textZh: '我们必须继续建立我们的广播网络。 (-1 资源)',
        subtitle: 'Expand our reach to more cities and towns.',
        subtitleZh: '将我们的影响力扩展到更多的城镇。',
        condition: (s: GameState) => s.resources >= 1,
        unavailableSubtitle: (s: GameState) => 'Need at least 1 resource',
        unavailableSubtitleZh: (s: GameState) => '需要至少 1 资源',
        effect: (s: GameState) => {
          const dissentFactor = 1 - (getOverallDissent(s) / 100);
          const newClasses = JSON.parse(JSON.stringify(s.classes));
          newClasses.PequenaBurguesia.support.CNT_FAI += 5 * dissentFactor;
          newClasses.Intelectuales.support.CNT_FAI += 3 * dissentFactor;
          newClasses.Obreros.support.CNT_FAI += 3 * dissentFactor;
          
          return {
            radio: s.radio + 1,
            resources: s.resources - 1,
            classes: newClasses,
            socialism: s.socialism + 3 * dissentFactor,
            nationalism: s.pacifism > 2 ? s.nationalism - 3 * dissentFactor * (s.pacifism - 2) : s.nationalism,
            pro_republic: s.democratization > 2 ? s.pro_republic + 3 * dissentFactor * (s.democratization - 2) : s.pro_republic,
          };
        },
      });
    }

    if (state.radio > 3 && state.radio <= 5 && state.year <= 1931) {
      options.push({
        text: 'We must keep on building up our radio network. (Self-sufficient)',
        textZh: '我们必须继续建立我们的广播网络。 (自给自足)',
        subtitle: 'Our network is now large enough to sustain itself through local contributions.',
        subtitleZh: '我们的网络现在已经大到足以通过地方捐助维持自身运转。',
        effect: (s: GameState) => {
          const dissentFactor = 1 - (getOverallDissent(s) / 100);
          const newClasses = JSON.parse(JSON.stringify(s.classes));
          newClasses.PequenaBurguesia.support.CNT_FAI += 5 * dissentFactor;
          newClasses.Intelectuales.support.CNT_FAI += 4 * dissentFactor;
          newClasses.Obreros.support.CNT_FAI += 4 * dissentFactor;
          newClasses.Braceros.support.CNT_FAI += 3 * dissentFactor;
          newClasses.Labradores.support.CNT_FAI += 2 * dissentFactor;
          
          return {
            radio: s.radio + 1,
            classes: newClasses,
            socialism: s.socialism + 3 * dissentFactor,
            nationalism: s.pacifism > 2 ? s.nationalism - 3 * dissentFactor * (s.pacifism - 2) : s.nationalism,
            pro_republic: s.democratization > 2 ? s.pro_republic + 3 * dissentFactor * (s.democratization - 2) : s.pro_republic,
          };
        },
      });
    }

    if (state.radio > 3 && (state.radio >= 6 || state.year >= 1932) && state.radio <= 9) {
      options.push({
        text: 'We should keep on supporting our radio network. (-1 resources)',
        textZh: '我们应该继续支持我们的广播网络。 (-1 资源)',
        subtitle: 'Maintain and upgrade our existing infrastructure to ensure clear signals.',
        subtitleZh: '维护并升级我们现有的基础设施，以确保信号清晰。',
        condition: (s: GameState) => s.resources >= 1,
        unavailableSubtitle: (s: GameState) => 'Need at least 1 resource',
        unavailableSubtitleZh: (s: GameState) => '需要至少 1 资源',
        effect: (s: GameState) => {
          const dissentFactor = 1 - (getOverallDissent(s) / 100);
          const newClasses = JSON.parse(JSON.stringify(s.classes));
          newClasses.PequenaBurguesia.support.CNT_FAI += 3 * dissentFactor;
          newClasses.Intelectuales.support.CNT_FAI += 2 * dissentFactor;
          newClasses.Obreros.support.CNT_FAI += 3 * dissentFactor;
          newClasses.Braceros.support.CNT_FAI += 2 * dissentFactor;
          newClasses.Labradores.support.CNT_FAI += 2 * dissentFactor;
          
          return {
            radio: s.radio + 1,
            resources: s.resources - 1,
            classes: newClasses,
            socialism: s.socialism + 2 * dissentFactor,
            nationalism: s.pacifism > 2 ? s.nationalism - 2 * dissentFactor * (s.pacifism - 2) : s.nationalism,
            pro_republic: s.democratization > 2 ? s.pro_republic + 2 * dissentFactor * (s.democratization - 2) : s.pro_republic,
          };
        },
      });
    }

    // Cinema Option
    if (state.cinema === 0) {
      options.push({
        text: 'Anarchism on the Silver Screen (-3 resources)',
        textZh: '银幕上的无政府主义 (-3 资源)',
        subtitle: 'Cinema is a powerful tool for mass education and inspiration.',
        subtitleZh: '电影是进行大众教育和激励的强大工具。',
        condition: (s: GameState) => s.resources >= 3,
        unavailableSubtitle: (s: GameState) => 'Need at least 3 resources',
        unavailableSubtitleZh: (s: GameState) => '需要至少 3 资源',
        effect: (s: GameState) => {
          const dissentFactor = 1 - (getOverallDissent(s) / 100);
          const newClasses = JSON.parse(JSON.stringify(s.classes));
          newClasses.Intelectuales.support.CNT_FAI += 5 * dissentFactor;
          newClasses.PequenaBurguesia.support.CNT_FAI += 3 * dissentFactor;
          newClasses.Obreros.support.CNT_FAI += 2 * dissentFactor;
          newClasses.Braceros.support.CNT_FAI += 1 * dissentFactor;
          
          const newFactions = JSON.parse(JSON.stringify(s.factions));
          newFactions.Treintistas.dissent += 3;
          
          return {
            cinema: 1,
            resources: s.resources - 3,
            classes: newClasses,
            factions: newFactions,
            socialism: s.socialism + 2 * dissentFactor,
            nationalism: s.nationalism - 1 * dissentFactor,
            pro_republic: s.democratization > 1 ? s.pro_republic + 2 * dissentFactor : s.pro_republic,
          };
        },
      });
    }

    // Final Option
    options.push({
      text: 'We should not do anything with propaganda at the moment.',
      textZh: '目前我们不应该对宣传采取任何行动。',
      subtitle: 'Sometimes the best action is to wait and see.',
      subtitleZh: '有时最好的行动就是静观其变。',
      effect: (s: GameState) => ({}),
    });

    return {
      actionsLeft: state.actionsLeft + 1,
      propaganda_timer: 6,
      currentEvent: {
        id: 'media_event',
        title: 'Media',
        titleZh: '媒体',
        description: `Together, the anarchists have built a propaganda network that spans cities and villages, including printing houses, community newspapers, street speeches and secret broadcasts. Nowadays, emerging media have also entered our field of vision. We can use this network to promote revolutionary propaganda......`,
        descriptionZh: `无政府主义者们已经共同构建了一个遍布城市与乡村的宣传网络，包括印刷所、社区报刊、街头演说与秘密广播。如今，电影这一新兴媒介也进入了我们的视野。我们可以利用这一网络推动革命宣传工作……`,
        options: options,
      }
    };
  },
};

