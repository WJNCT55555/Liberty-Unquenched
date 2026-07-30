import { GameEvent } from '../types';
import { adjustFactionInfluence, adjustClassSupport, isAtOrAfter } from '../utils';

const cntFourthCongressMeta = {
  category: 'cnt' as const,
  flow: 'inline' as const,
  series: ['cnt_congress_1936'], // assuming 1936
};

// Event 8
export const cnt_fourth_congress_8: GameEvent = {
  id: 'cnt_fourth_congress_8',
  meta: cntFourthCongressMeta,
  title: 'Closing of the Congress',
  titleZh: '大会闭幕',
  description: `After a long and intense debate, the Congress has finally reached a consensus. In order to announce the victory of the Congress and the vision of the revolution to the whole country, the National Committee originally planned to hold a grand closing rally and broadcast it to the whole of Spain via radio. However, the Azaña government, fearing the power of the workers, explicitly refused to authorize the broadcast! Even more outrageously, the telephone company took advantage of the situation and demanded exorbitant transmission fees equivalent to long-distance calls.`,
  descriptionZh: `经过漫长而激烈的辩论，代表大会终于达成了共识。为了向全国宣告大会的胜利和革命的愿景，全国委员会原计划举行一场盛大的闭幕集会，并通过电台向整个西班牙广播。然而，阿萨尼亚政府忌惮工人的力量，明确拒绝授权广播！更令人愤慨的是，电话公司也趁火打劫，索要与长途电话同等的高昂传输费用。`,
  options: [
    {
      text: 'Negotiate with the government for broadcast permission',
      textZh: '与政府斡旋获得广播集会许可',
      subtitle: 'We will make the results of the Congress public via broadcast.',
      subtitleZh: '我们将通过广播将大会结果公之于众。',
      condition: (state) => state.cntStance === 'govern' && (state.government.president === 'Manuel Azaña' || state.government.president === 'Ramón Franco'),
      effect: (state) => ({})
    },
    {
      text: 'Use the telephone for transmission (10 Resources)',
      textZh: '使用电话进行传播（10资源）',
      subtitle: 'Or try negotiating with the telephone company?',
      subtitleZh: '或者试试与电话公司谈判？',
      condition: (state) => state.resources >= 10,
      effect: (state) => ({
        resources: state.resources - 10
      })
    },
    {
      text: 'Utilize our nationwide radio network!',
      textZh: '利用我们遍布全国的电台网络！',
      subtitle: 'A single spark can start a prairie fire.',
      subtitleZh: '星星之火，可以燎原。',
      condition: (state) => (state.radio || 0) >= 3,
      effect: (state) => ({})
    },
    {
      text: 'We are helpless',
      textZh: '我们束手无策',
      subtitle: 'We have made the necessary representations for the broadcast of the rally: the government will not authorize the broadcast of this rally; moreover, the local radio station does not have the capacity to rebroadcast it; and the telephone company charges us the same as for international long-distance calls. Therefore, we cannot achieve our goal.',
      subtitleZh: '我们已为集会的广播事宜进行了必要的交涉：政府不会授权广播此次集会；而且本地的电台没有能力转播；电话公司向我们收取的费用与国际长途电话相同。因此，我们无法实现目标。',
      effect: (state) => ({})
    }
  ]
};

// Event 6
export const cnt_fourth_congress_6: GameEvent = {
  id: 'cnt_fourth_congress_6',
  meta: cntFourthCongressMeta,
  title: 'Drawing the Blueprint',
  titleZh: '构绘蓝图',
  description: `If the revolution succeeds tomorrow, how will society function? At the Congress, delegates leaning towards pure anarchism engaged in fierce debates with those leaning towards syndicalism. We must lay the foundation for the new society, but we must never turn it into a rigid dogma.`,
  descriptionZh: `如果明天革命成功，社会将如何运转？大会上，偏向纯粹无政府主义的代表与偏向工团主义的代表展开了激烈的辩论。我们必须为新社会奠定基石，但绝不能将其变成僵化的教条。`,
  options: [
    {
      text: 'Libertarian communism means the guarantee of freedom.',
      textZh: '自由意志共产主义意味着对自由的保障。',
      subtitle: 'The working class and all its fellow travelers take over and run the economic foundation of society, thereby transforming it according to social justice.',
      subtitleZh: '工人阶级及所有其同路人接管和运营社会的经济基础，从而依照社会正义对其进行改造。',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 8);
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 8);
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 8);
        newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 8);
        return {
          factions: newFactions,
          currentEvent: cnt_fourth_congress_8
        };
      }
    },
    {
      text: 'Individual sovereignty first.',
      textZh: '个人主权优先。',
      subtitle: 'The goal of anarchism is the abolition of the exploitation of man by man.',
      subtitleZh: '无政府主义的目标就是废除人对人的剥削。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          bureaucratization: Math.max(0, (state.stats.bureaucratization || 0) - 10)
        },
        currentEvent: cnt_fourth_congress_8
      })
    },
    {
      text: 'Long live the organic syndicates!',
      textZh: '有机工团万岁！',
      subtitle: 'The unions will become the nerve center of the revolutionary economy.',
      subtitleZh: '工会将会成为革命经济的神经中枢。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          bureaucratization: Math.min(100, (state.stats.bureaucratization || 0) + 5)
        },
        currentEvent: cnt_fourth_congress_8
      })
    }
  ]
};

// Event 5
export const cnt_fourth_congress_5: GameEvent = {
  id: 'cnt_fourth_congress_5',
  meta: cntFourthCongressMeta,
  title: 'Revolutionary Alliance',
  titleZh: '革命联盟',
  description: `Since the Asturias uprising, the facts have proved that the proletariat possesses unstoppable revolutionary power, but only if they are united. The Congress believes that the two largest workers' organizations in Spain—UGT and CNT—must be united. But can we accept the politician-like style of the UGT?`,
  descriptionZh: `自阿斯图里亚斯起义以来，事实证明无产阶级具备不可阻挡的革命力量，但前提是必须团结。大会认为，必须将西班牙最大的两个工人组织——UGT和CNT联合起来。但我们能接受UGT的政客作风吗？`,
  options: [
    {
      text: 'The UGT must explicitly acknowledge the failure of the parliamentary system and cease cooperation with the current regime.',
      textZh: 'UGT必须明确承认议会制度的失败，并停止对当前政权的合作',
      subtitle: 'Make this a prerequisite for signing the revolutionary alliance pact.',
      subtitleZh: '以此作为签署革命联盟公约的先决条件。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3)
        },
        currentEvent: cnt_fourth_congress_6
      })
    },
    {
      text: 'Set aside political differences and establish an anti-fascist united front.',
      textZh: '搁置政治分歧，建立反法西斯统一战线。',
      subtitle: 'If we force the UGT to abandon the political sphere, it would undoubtedly be a direct death sentence for the revolutionary alliance.',
      subtitleZh: '如果强迫UGT放弃政治领域，无疑是直接宣判革命联盟的死刑。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5)
        },
        currentEvent: cnt_fourth_congress_6
      })
    }
  ]
};

// Event 4
export const cnt_fourth_congress_4: GameEvent = {
  id: 'cnt_fourth_congress_4',
  meta: cntFourthCongressMeta,
  title: 'Agrarian Reform',
  titleZh: '土地改革',
  description: `After fully listening to the opinions, reports, and comments of the various peasant delegations at this special Congress of the CNT. The agriculture from one end of Spain to the other is so vastly different. We increasingly feel that without overturning all the values of the existing social system through revolutionary liberation, it is impossible to solve the problem immediately. Undoubtedly, those of us who live off the land share a common aspiration: the liberation of the land and ourselves.`,
  descriptionZh: `在充分听取本次全国劳工联合会特别大会的各农民代表团的意见、报告和评论后。从西班牙一端到另一端的乡土，其农业的差异如此之大。我们愈发感到，不通过革命解放来颠覆现存社会制度的所有价值，就不可能立刻解决问题。毫无疑问，我们这些靠土地为生的人有一个共同的愿望，就是土地和我们自身的解放。`,
  options: [
    {
      text: 'Insist on radical uncompensated expropriation and collectivization.',
      textZh: '坚持激进的无偿征用与集体化。',
      subtitle: 'Expropriate land over 50 hectares without compensation, and confiscate livestock, farm tools, machinery, and seeds in the hands of landlords.',
      subtitleZh: '无偿征用超过50公顷的土地，没收地主手中的牲畜、农具、机械和种子。',
      effect: (state) => {
        let newClasses = adjustClassSupport(state.classes, 'Braceros', 'CNT_FAI', 5);
        newClasses = adjustClassSupport(newClasses, 'Labradores', 'CNT_FAI', -5);
        let newPartyRelations = { ...state.partyRelations };
        newPartyRelations.PNV = Math.max(0, (newPartyRelations.PNV || 0) - 5);
        newPartyRelations.ERC = Math.max(0, (newPartyRelations.ERC || 0) - 5);
        return {
          classes: newClasses,
          partyRelations: newPartyRelations,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 2)
          },
          currentEvent: cnt_fourth_congress_5
        };
      }
    },
    {
      text: 'Adopt a flexible, multi-layered land policy.',
      textZh: '采取灵活的多层次土地政策。',
      subtitle: 'Respect the priority purchasing rights of tenant farmers and sharecroppers, focusing on cracking down on the latifundia system.',
      subtitleZh: '尊重佃农和分成农的优先购买权，重点打击大庄园制。',
      effect: (state) => {
        let newClasses = adjustClassSupport(state.classes, 'Labradores', 'CNT_FAI', 3);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 2);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'CNT_FAI', 3);
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', -5);
        return {
          classes: newClasses,
          factions: newFactions,
          currentEvent: cnt_fourth_congress_5
        };
      }
    },
    {
      text: 'Prioritize maintaining the status quo, focusing on the labor rights of agricultural workers.',
      textZh: '优先维护现状，专注于农业工人的劳动权益。',
      subtitle: 'Prioritize promoting rural employment, wage guarantees, and labor protection.',
      subtitleZh: '优先推动农村就业、工资保障和劳动保护。',
      effect: (state) => {
        let newClasses = adjustClassSupport(state.classes, 'Braceros', 'CNT_FAI', -5);
        return {
          classes: newClasses,
          currentEvent: cnt_fourth_congress_5
        };
      }
    }
  ]
};

// Event 3
export const cnt_fourth_congress_3: GameEvent = {
  id: 'cnt_fourth_congress_3',
  meta: cntFourthCongressMeta,
  title: 'The Coming Storm',
  titleZh: '山雨欲来',
  description: `Given that Spain is in a clear revolutionary situation, if the CNT does not strive to defend the freedoms stripped away by various governments of the right and left, its actions will be confined to the ebb and flow of political tides. Therefore, it is necessary to reach a consensus on action to strike deeply at the repressive laws that infringe on freedom.

Acknowledging the failure of the current democratic system and believing that the current political and social situation cannot be resolved within parliament—the National Confederation of Labor must reaffirm its apolitical principles and publicly declare the invalidity and failure of the parliamentary system.

The regional government of Catalonia, due to its nationalist nature, may cause the CNT to clash with the union organizations fostered by that government; the provocations initiated by fascists are becoming increasingly alarming, and the CNT cannot stand idly by as the underground terrorist conspiracy develops; it must clarify its stance on fascism. The international political-social situation, severely worsened by forced unemployment, clearly indicates that it will inevitably and tragically slide into a new war. This leads us to believe that only the organized power of the proletariat can hope to achieve positive results to avoid disaster.

To this end, we propose:`,
  descriptionZh: `鉴于西班牙正处于明确的革命形势中，如果CNT不努力捍卫被左右翼各届政府所剥夺的自由，其行动将局限于政治潮流的涨落之中。因此，有必要达成一致行动，深入打击所侵犯自由的镇压型法律。

承认当前民主制度的失败，并认为当前的政治和社会形势无法在议会内解决——全国劳工联合会必须重申其非政治原则，公开表明议会制度的无效和失败。

加泰罗尼亚地方政府因其民族主义性质，可能会使全国劳工联合会与该政府所扶植的工会组织发生冲突；法西斯分子发起的挑衅正变得日益令人担忧，全国劳工联合会不能漠然旁观地下恐怖阴谋的发展，必须明确其对法西斯主义的立场；国际政治-社会形势，因强迫性失业而严重恶化，清楚地表明它将不可避免地、悲剧性地滑向一场新的战争。这使我们相信，只有组织起来的无产阶级力量，才能指望取得积极成果来避免灾难。

为此，我们提议：`,
  options: [
    {
      text: 'Organize and prepare for a revolutionary general strike.',
      textZh: '组织起来，准备革命总罢工。',
      subtitle: 'Reaffirm our anti-political stance, always ready to use the general strike to fight fascism and foreign aggression.',
      subtitleZh: '重申反政治立场，时刻准备以总罢工为手段，对抗法西斯主义和外来侵略。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15)
        },
        currentEvent: cnt_fourth_congress_4
      })
    },
    {
      text: 'Launch an extensive propaganda campaign on the rostrum and in the press.',
      textZh: '在讲坛和报刊上展开广泛的宣传运动。',
      subtitle: 'Without participating in parliament, create the necessary public opinion atmosphere to force the government to make concessions.',
      subtitleZh: '在不参与议会的前提下，营造必要的舆论氛围，迫使政府做出让步。',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 5);
        return {
          factions: newFactions,
          currentEvent: cnt_fourth_congress_4
        };
      }
    },
    {
      text: 'Direct and decisive intervention in the fight against fascism.',
      textZh: '直接而果断的干预反对法西斯主义的斗争',
      subtitle: 'Engage fascists in the streets, workshops, factories, and any workplace!',
      subtitleZh: '在街头、车间、工厂和任何工作场所与法西斯分子交战！',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5)
        },
        coupProgress: Math.min(100, (state.coupProgress || 0) + 3),
        currentEvent: cnt_fourth_congress_4
      })
    }
  ]
};

// Event 2
export const cnt_fourth_congress_2: GameEvent = {
  id: 'cnt_fourth_congress_2',
  meta: cntFourthCongressMeta,
  title: 'Unemployment and Poverty',
  titleZh: '失业与贫困',
  description: `The Congress agenda enters the core socio-economic issues. The development of machinery should have freed humanity from arduous labor, but under the capitalist system, it has brought mass unemployment and starvation. Faced with millions of unemployed workers without income, the Congress must put forward the CNT's specific program of struggle. What means should be used to fight the poverty looming over the proletariat?`,
  descriptionZh: `大会议程进入社会经济核心议题。机器的发展本应将人类从繁重劳动中解放，但在资本主义制度下，它却带来了大规模的失业与饥饿。面对数百万没有收入的失业者，大会必须提出CNT的具体斗争纲领。应该用什么手段与笼罩在无产阶级头上的贫困作斗争？`,
  options: [
    {
      text: 'The misery of the working class can only be ended by revolution.',
      textZh: '工人阶级苦难唯有革命来终结。',
      subtitle: 'Fight for a 36-hour workweek and minimum wage guarantees to alleviate the suffering caused by forced unemployment.',
      subtitleZh: '争取36小时工作制最低工资保障缓解强迫失业带来的苦难',
      effect: (state) => {
        let newClasses = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 8);
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', 8);
        return {
          classes: newClasses,
          factions: newFactions,
          currentEvent: cnt_fourth_congress_3
        };
      }
    },
    {
      text: 'Both fists and roses.',
      textZh: '既是拳头，亦是玫瑰',
      subtitle: 'Fight for massive state subsidies for public works.',
      subtitleZh: '争取国家大规模公共工程补贴。',
      effect: (state) => {
        let newClasses = adjustClassSupport(state.classes, 'PequenaBurguesia', 'CNT_FAI', 3);
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 5);
        return {
          classes: newClasses,
          factions: newFactions,
          unemployment_rate: Math.max(0, (state.unemployment_rate || 0) - 1),
          currentEvent: cnt_fourth_congress_3
        };
      }
    },
    {
      text: 'Seize the factories!',
      textZh: '夺取工厂！',
      subtitle: 'Unions should immediately take over closed factories and always be prepared for a general strike.',
      subtitleZh: '工会应立刻接管被关闭的工厂，并时刻为总罢工做准备。',
      effect: (state) => {
        let newClasses = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 4);
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', 5);
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 3);
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 3);
        return {
          classes: newClasses,
          factions: newFactions,
          currentEvent: cnt_fourth_congress_3
        };
      }
    }
  ]
};

// Event 1
export const cnt_fourth_congress_1: GameEvent = {
  id: 'cnt_fourth_congress_1',
  meta: cntFourthCongressMeta,
  title: 'Lost Lambs',
  titleZh: '迷途羔羊',
  description: `Spain is on the brink of profound social revolution, and internal rifts urgently need to be healed. Since the establishment of the Republic, due to different understandings of the revolutionary line, some unions known as the "opposition" broke away from the CNT. Now, to prepare for the coming storm, the Congress must decide how to deal with these splintered comrades.`,
  descriptionZh: `西班牙正处于深刻的社会革命边缘，内部的裂痕亟待弥合。自共和国成立以来，由于对革命路线的理解不同，一些被称为“反对派”的工会脱离了全劳联。现在，为了应对即将到来的风暴，大会必须决定如何处理这些分裂出去的同志。`,
  options: [
    {
      text: 'United we stand, divided we fall.',
      textZh: '团结则存，分裂则亡。',
      subtitle: 'Readmit them based on respect for past agreements.',
      subtitleZh: '基于尊重过往协议，重新接纳他们。',
      effect: (state) => {
        let newClasses = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 5);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'CNT_FAI', 3);
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 10);
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 3);
        return {
          classes: newClasses,
          factions: newFactions,
          currentEvent: cnt_fourth_congress_2
        };
      }
    },
    {
      text: 'Seek unity through struggle, and unity will survive; seek unity through concession, and unity will perish.',
      textZh: '以斗争求团结，则团结存；以退让求团结，则团结亡。',
      subtitle: 'They can only return if they thoroughly admit their mistakes and accept dissolution.',
      subtitleZh: '只有他们彻底承认错误并接受解散，才能回归。',
      effect: (state) => {
        let newClasses = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', -3);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'CNT_FAI', -5);
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Cenetistas.dissent = Math.min(100, newFactions.Cenetistas.dissent + 9);
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', 5);
        return {
          classes: newClasses,
          factions: newFactions,
          currentEvent: cnt_fourth_congress_2
        };
      }
    }
  ]
};

// Main event
export const cnt_fourth_congress_0: GameEvent = {
  id: 'cnt_fourth_congress_0',
  date: { year: 1936, month: 5 },
  condition: (state) => isAtOrAfter(state, 1936, 5),
  meta: cntFourthCongressMeta,
  title: 'The Fourth Congress of the CNT Convenes',
  titleZh: 'CNT第四次代表大会召开',
  description: `May 1, 1936, Zaragoza. Hundreds of delegates gathered together, representing over a million proletarians across the Iberian Peninsula, officially kicking off the Fourth Congress of the CNT. But before discussing the grand blueprint of the revolution, the Congress must first set the tone. Thousands of comrades are still suffering in capitalist prisons at home and abroad; the Congress unanimously approved the proposal of the National Committee to send greetings to all social prisoners, and even to all so-called common prisoners throughout the world, wishing them an early freedom.`,
  descriptionZh: `1936年5月1日，萨拉戈萨。数以百计的代表齐聚一堂，代表着伊比利亚半岛上百万名无产阶级，CNT第四次代表大会正式拉开帷幕。但在讨论宏大的革命蓝图之前，大会必须首先确立基调。成千上万的同志仍在国内外资本主义的监狱中受苦；大会一致通过了全国委员会的提议，同意向全世界所有社会囚犯，甚至所有所谓的普通囚犯致以问候，祝愿他们早日获得自由。`,
  options: [
    {
      text: 'Salute to all the oppressed! The Congress begins.',
      textZh: '向所有被压迫者致敬！大会开始',
      subtitle: 'Oppressed peoples of the world, unite!',
      subtitleZh: '全世界被压迫的人民，联合起来！',
      effect: (state) => ({
        currentEvent: cnt_fourth_congress_1
      })
    }
  ]
};
