import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const cnt_third_congress_6: GameEvent = {
  id: 'cnt_third_congress_6',
  title: 'Closing of the Congress',
  titleZh: '大会闭幕',
  description: `After six consecutive days and nights of intense debate, quarreling, compromise, and oaths, the Third Congress of the CNT in 1931 finally drew to a close in Madrid. This was not merely a gathering of laborers, but the largest demonstration of proletarian power in modern Spanish history.

According to the final resolution of the congress, the closing rally (mitin de clausura) would be broadcast nationwide via radio waves for the first time in history. At this moment, outside the textile mills of Barcelona, beside the farmsteads under the scorching Andalusian sun, and at the damp mine shafts of Asturias, thousands of workers and peasants gathered around radios, listening with bated breath to the crackle of the airwaves and the thunderous cheers coming from Madrid.

As the radio waves of the closing rally dissipate into the night sky of the Iberian Peninsula, the CNT Third Congress event chain officially concludes. While bourgeois politicians in Madrid begin drafting their new constitution, the workers have returned to the factories and fields. The silence before the storm will not last long.`,
  descriptionZh: `经过连续六个日夜的激烈发言、辩论、妥协与争吵，1931年的CNT第三次代表大会终于在马德里落下帷幕。这不仅是一场劳工的集会，更是西班牙现代史上最大规模的无产阶级力量展示。

根据大会的最后决议，闭幕集会将史无前例地通过无线电波向全国广播。此刻，在巴塞罗那的纺织厂外，在安达卢西亚烈日下的农庄旁，在阿斯图里亚斯潮湿的矿井口，成千上万的工人和农民正聚集在收音机前，屏息聆听着马德里传来的电波杂音与震耳欲聋的欢呼声。

随着闭幕集会的无线电波消散在伊比利亚半岛的夜空中，CNT第三次代表大会事件链正式结束。资产阶级政客们开始在马德里起草他们的新宪法，而工人们已经回到了工厂和农田。暴风雨前的宁静不会持续太久。`,
  options: [
    {
      text: 'The congress has closed, but the struggle continues.',
      textZh: '大会闭幕了，斗争仍在继续',
      effect: (state) => ({})
    }
  ]
};

export const cnt_third_congress_5: GameEvent = {
  id: 'cnt_third_congress_5',
  title: 'The Constituent Cortes and "Political Poison"',
  titleZh: '制宪会议与“政治毒药”',
  description: `The Republic is preparing for the elections to the Constituent Cortes. Some segments of the working class harbor illusions about the parliament, and a small minority of CNT members have even attempted to run for office. However, the mainstream voice at the congress scoffs at the parliamentary path, maintaining that any government power is inherently oppressive. Delegates emphasize that the CNT must adhere to the principles of anti-parliamentarianism and direct action. Some have even proposed that regulations must be strictly enforced: any union member running for public office should be immediately expelled.`,
  descriptionZh: `共和国正在筹备制宪议会的选举。部分工人阶级对议会抱有幻想，甚至有少数CNT成员试图参选。然而，大会上的主流声音对议会道路嗤之以鼻，认为任何政府权力都是压迫性的。代表们强调，CNT必须坚持反议会主义和直接行动的原则。更有人提议，必须严格执行规定，任何竞选公职的工会成员都应被立即开除。`,
  options: [
    {
      text: 'Reiterate anti-parliamentarianism; revolution is our only means. (Historical)',
      textZh: '重申反议会主义，革命是实现我们目的的唯一手段（历史路线）',
      subtitle: '"Faced with dictatorship or hypocritical democracy, our only answer is the revolutionary general strike!"',
      subtitleZh: '“面对独裁或虚伪的民主，我们唯一的回答是革命总罢工！”',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 5);
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', 10);
        newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 5);
        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 15);
        
        return {
          cnt_boycott_election: true,
          cntVotingRate: Math.max(0, state.cntVotingRate - 8),
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10)
          },
          factions: newFactions,
          currentEvent: cnt_third_congress_6
        };
      }
    },
    {
      text: 'Tacitly allow local participation to exert political influence. (Reformist)',
      textZh: '默许地方参与，施加政治影响（改良派路线）',
      subtitle: '"While we reject the bourgeois state, during the drafting of the new constitution, we must ensure that the bottom-line rights of labor are written into law."',
      subtitleZh: '“虽然我们拒绝资产阶级国家，但在新宪法制定期间，我们必须确保劳工的底线权利被写入法律。”',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 15);
        newFactions.Cenetistas.dissent = Math.min(100, newFactions.Cenetistas.dissent + 5);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 10);
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 15);
        
        return {
          cnt_participate_election: true,
          cntVotingRate: Math.min(100, state.cntVotingRate + 8),
          factions: newFactions,
          currentEvent: cnt_third_congress_6
        };
      }
    },
    {
      text: 'Encourage the proletariat to vote. (Electoralism)',
      textZh: '鼓励无产阶级投票（选举路线）',
      subtitle: '"We must use every tool available, including the ballot box, to defend the working class."',
      subtitleZh: '“我们必须利用一切可用的工具，包括投票箱，来捍卫工人阶级。”',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 25);
        newFactions.Cenetistas.dissent = Math.min(100, newFactions.Cenetistas.dissent + 5);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 10);
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 15);
        
        return {
          cnt_participate_election: true,
          cntVotingRate: Math.min(100, state.cntVotingRate + 50),
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 40)
          },
          factions: newFactions,
          currentEvent: cnt_third_congress_6
        };
      }
    }
  ]
};

export const cnt_third_congress_4: GameEvent = {
  id: 'cnt_third_congress_4',
  title: "The CNT's Battlefield of Opinion",
  titleZh: 'CNT舆论阵地',
  description: `Propaganda is the vanguard of revolution. The sixth item on the congress agenda points out that to compete with bourgeois newspapers, the CNT urgently needs a large-scale national daily based in the capital, Madrid. A newspaper of at least 12 pages could radiate anarchist ideals across the country. However, this requires a massive sum: an estimated 1.17 million pesetas in initial funding. The congress proposes that each member contribute 3 pesetas and that union stamp taxes be increased by 5 centimos. Various local unions, especially those in Catalonia, have expressed grievances, fearing this will drain the lifeblood of regional publications.`,
  descriptionZh: `宣传是革命的先导。大会的第六项议程指出，为了与资产阶级报纸抗衡，CNT迫切需要一份位于首都马德里的全国性大型日报。一份至少12版的报纸能将无政府主义的理念辐射全国。然而，这需要一笔巨款：预计需要高达117万比塞塔的初始资金，大会提议每位会员分摊3比塞塔，并将工会印花税提高5分。各地方工会（尤其是加泰罗尼亚地区）对此颇有微词，认为这会吸干地方出版物的血液。`,
  options: [
    {
      text: 'Approve fundraising to start the "National Daily". (Centralized Propaganda)',
      textZh: '批准集资，创办《全国日报》（集中宣传路线）',
      subtitle: '"We need a powerful mouthpiece! Let the printing presses in Madrid roar, and spread our voice to every corner!"',
      subtitleZh: '“我们需要一个强大的喉舌！让马德里的印刷机轰鸣，把我们的声音传遍每一个角落！”',
      condition: (state) => state.resources >= 3,
      unavailableSubtitleZh: () => '需要至少3资源',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.max(0, newClasses.Obreros.support.CNT_FAI - 5);
        newClasses.Braceros.support.CNT_FAI = Math.max(0, newClasses.Braceros.support.CNT_FAI - 8);
        
        return {
          resources: state.resources - 3,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
            bureaucratization: Math.min(100, state.stats.bureaucratization + 5)
          },
          classes: newClasses,
          currentEvent: cnt_third_congress_5
        };
      }
    },
    {
      text: 'Shelve the national daily to prioritize regional publications. (Local Autonomy)',
      textZh: '搁置全国日报，优先保障各地区域性报刊（地方自治路线）',
      subtitle: '"Catalonia needs its own newspaper, and this newspaper can fully sustain its operations relying on its own resources."',
      subtitleZh: '“加泰罗尼亚需要自己的报纸，而这份报纸完全可以依靠自身资源维持运营。”',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 2);
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 3);
        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 2);
        newFactions.Cenetistas.dissent = Math.min(100, newFactions.Cenetistas.dissent + 2);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 2);
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 2);
        
        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5),
            bureaucratization: Math.max(0, state.stats.bureaucratization - 3)
          },
          factions: newFactions,
          currentEvent: cnt_third_congress_5
        };
      }
    }
  ]
};

export const cnt_third_congress_3: GameEvent = {
  id: 'cnt_third_congress_3',
  title: 'Organizing the Workers of the Land',
  titleZh: '土地劳动者的组织',
  description: `The congress's agenda has turned to the agricultural problems that have long plagued Spain and the worsening unemployment crisis. Delegates point out that the land reforms being brewed by the Provisional Government are extremely weak and "will eventually vanish into thin air." Meanwhile, faced with the crisis of capitalism and overproduction, the working class is suffering. The congress has drafted a set of radical economic demands: the unconditional confiscation of large estates (Latifundios) to be managed collectively by peasant unions, and an immediate demand for a six-hour workday to resolve the unemployment issue.`,
  descriptionZh: `大会的议程转向了困扰西班牙已久的农业问题和日益严重的失业危机。代表们指出，临时政府正在酝酿的土地改革极其软弱，“最终将化为泡影”。同时，面对资本主义的危机和超额生产，工人阶级正在承受苦难。大会起草了一份激进的经济诉求：无偿没收大庄园交由农民工会集体管理，并要求立即实行六小时工作制以解决失业问题。`,
  options: [
    {
      text: 'Issue uncompromising revolutionary demands.',
      textZh: '发布不妥协的革命诉求',
      subtitle: '"We would rather let the capitalists\' profits drop to 15% than tolerate workers starving to death. If our demands are not met, we will confiscate it ourselves!"',
      subtitleZh: '“宁可让资本家的利润降到15%，也绝不容忍工人饿死。如果不满足我们的要求，我们就自己动手没收！”',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.min(100, newClasses.Obreros.support.CNT_FAI + 5);
        newClasses.Braceros.support.CNT_FAI = Math.min(100, newClasses.Braceros.support.CNT_FAI + 8);
        
        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15)
          },
          classes: newClasses,
          currentEvent: cnt_third_congress_4
          // TODO: Trigger event "安达卢西亚的野火"
        };
      }
    },
    {
      text: 'Focus on securing minimum wages and tax relief.',
      textZh: '集中精力争取最低工资与减轻税收',
      subtitle: '"We should proceed step by step, first implementing minimum wage standards in all regions, and boycotting taxes on wages."',
      subtitleZh: '“我们应当循序渐进，先落实各地区的最低工资标准，并抵制对工资征税。”',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 8);
        newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 8);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 10);
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 15);
        
        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 10)
          },
          factions: newFactions,
          currentEvent: cnt_third_congress_4
        };
      }
    },
    {
      text: 'Form an agricultural committee for further study. (Set aside)',
      textZh: '成立农业委员会继续研究（搁置问题）',
      subtitle: '"We should not make hasty decisions without deeply studying the problems of the agricultural regions." (-1 Resource)',
      subtitleZh: '“在没有深入研究农业地区问题时，我们不应该贸然做出决定。” (-1 资源)',
      condition: (state) => state.resources >= 1,
      unavailableSubtitleZh: () => '需要至少1资源',
      effect: (state) => {
        return {
          resources: state.resources - 1,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5)
          },
          currentEvent: cnt_third_congress_4
        };
      }
    }
  ]
};

export const cnt_third_congress_2: GameEvent = {
  id: 'cnt_third_congress_2',
  title: 'CNT Restructuring Plan',
  titleZh: '全国劳工联盟重组计划',
  description: `With the establishment of the Republic, Spanish capitalism is evolving toward more thorough industrial and economic concentration. At the CNT Third Congress in Madrid, the National Committee proposed a major restructuring plan: while retaining the original local single unions, "National Industrial Federations" (Federaciones Nacionales de Industria) would be established. Proponents argue this is a necessary means to counter bourgeois monopolies and eventually take over the national economy. However, traditional anarchists warn that this would undermine the federalist principles of union autonomy and lead to bureaucratic centralization.`,
  descriptionZh: `随着共和国的建立，西班牙的资本主义正在向着更彻底的工业和经济集中发展。在马德里召开的CNT第三次代表大会上，国家委员会提出了一个重大的重组计划：在保留原有地方单一工会的基础上，建立“全国产业联合会”（Federaciones Nacionales de Industria）。支持者认为这是对抗资产阶级垄断、并在未来接管国家经济的必要手段；但传统的无政府主义者则警告，这会破坏工会的联邦制自治原则，导致官僚集权。`,
  options: [
    {
      text: 'Approve the creation of National Industrial Federations. (Historical)',
      textZh: '批准建立全国产业联合会（历史路线）',
      subtitle: '"Only through industrial concentration can the proletariat have equal fighting power when facing the capitalists."',
      subtitleZh: '“只有通过产业集中，无产阶级才能在面对资本家时拥有同等的战斗力。”',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 8);
        newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 5);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 5);
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 5);
        
        return {
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 8)
          },
          factions: newFactions,
          currentEvent: cnt_third_congress_3
        };
      }
    },
    {
      text: 'Reject the Federations and maintain absolute local federalism. (Local Autonomy)',
      textZh: '拒绝全国产业联合会，坚持绝对的地方联邦制（自治路线）',
      subtitle: '"Any top-down national authority is a betrayal of the original intent of anarcho-syndicalism!"',
      subtitleZh: '“任何自上而下的全国性权力机构，都是对无政府工团主义初衷的背叛！”',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 10);
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', 5);
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 5);
        newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 5);
        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 10);
        newFactions.Cenetistas.dissent = Math.min(100, newFactions.Cenetistas.dissent + 5);
        
        return {
          factions: newFactions,
          currentEvent: cnt_third_congress_3
        };
      }
    }
  ]
};

export const cnt_third_congress_1: GameEvent = {
  id: 'cnt_third_congress_1',
  title: 'The Third CNT Congress Opens',
  titleZh: 'CNT第三次代表大会召开',
  description: `The proclamation of the Second Republic has plunged all of Spain into a state of unprecedented fever and anticipation. However, in the eyes of the anarcho-syndicalists of the CNT, the "Democratic Republic" cheered by bourgeois politicians is nothing more than the old machinery of oppression in a fancy new suit.

On June 11, the Third Congress of the CNT grandly opened in Madrid. The venue was packed and thick with smoke. From strike leaders of Catalan textile mills to landless peasants scorched by the Andalusian sun, and coal-dusted miners from Asturias, delegates representing hundreds of thousands of radical workers across the country gathered here. This was the first time since the 1919 Congress of the Comedia that the CNT emerged from the underground status of the dictatorship to demonstrate its vast and formidable power in the light of legality.

But beneath this proud red-and-black flag, undercurrents of conflicting ideologies are clashing fiercely. 

Faced with increasingly large capitalist trusts and the Great Depression sweeping the globe, can traditional, loose local union autonomy still cope with modern class warfare? Faced with the provisional government's sluggish land reform, should we continue to wait and see, or immediately call on the peasants to occupy the estates? Most critically, the upcoming elections for the Constituent Cortes are dangling the bait of power before labor leaders. Should they maintain a pure anti-political line, or compromise with political reality?

The gavel on the podium strikes heavily, the fierce arguments in the hall gradually subside, and all eyes are focused here. Every vote, every speech, and every silence will rewrite the future destiny of Spain.`,
  descriptionZh: `第二共和国的宣告成立让整个西班牙陷入了前所未有的狂热与期盼之中。然而，在全国劳工联盟的无政府工团主义者眼中，资产阶级政客们欢呼的“民主共和国”不过是换了一套精美外衣的旧压迫机器。

6月11日，CNT第三次代表大会在马德里隆重召开。会场内人头攒动，烟雾缭绕。从加泰罗尼亚纺织厂的罢工领袖，到安达卢西亚被烈日炙烤的无地贫农，再到阿斯图里亚斯满面煤灰的矿工，代表着全国数十万激进工人的代表们汇聚于此。这是自1919年喜剧院大会（Congreso de la Comedia）以来，CNT首次摆脱独裁时期的地下状态，在合法的阳光下展现其庞大而骇人的力量。

但在这面骄傲的黑红双色旗下，理念的暗流正在激烈交锋。

面对资本主义日益庞大的垄断托拉斯和席卷全球的大萧条，传统的、松散的地方工会自治是否还能应对现代化的阶级战争？面对临时政府拖泥带水的土地改革，我们是该继续静观其变，还是直接号召农民占领庄园？更致命的是，即将到来的制宪会议选举正在向劳工领袖们抛出权力的诱饵，坚持纯粹的反政治底线，还是向现实的政治妥协？

主席台上的木槌重重敲响，会场内激烈的争吵声渐渐平息，所有人的目光都聚焦于此。每一次投票、每一次发言、每一次沉默，都将改写西班牙未来的命运。`,
  condition: (state) => state.year === 1931 && state.month === 6,
  options: [
    {
      text: 'The congress begins.',
      textZh: '大会开始',
      effect: (state) => ({
        currentEvent: cnt_third_congress_2
      })
    }
  ]
};
