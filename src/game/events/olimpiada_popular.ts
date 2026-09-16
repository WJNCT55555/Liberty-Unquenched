import type { GameEvent, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence, isAtOrAfter } from '../utils';

const olimpiadaMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
  series: ['olimpiada_popular'],
  tags: ['historical', 'flavor', 'catalonia', 'anti_fascist'],
};

/** Both nodes share the organising committee called in March 1936 by the Generalitat. */
const gamesWereOrganised = (state: GameState) => {
  return state.rulingCoalition === 'popular_front'
    && state.regionalStatuses?.catalonia === 'autonomy';
};

/**
 * The People's Olympiad (Olimpíada Popular) was to open at the Estadi de Montjuïc
 * on 19 July 1936 as the workers' answer to the Berlin Games. It fires inside the
 * 1936 summer window — in the historical timetable, the last peaceful month before
 * the rising — so the player decides how the CNT-FAI enters an anti-fascist mass
 * festival it did not organise itself.
 */
export const olimpiadaPopular: GameEvent = {
  id: 'olimpiada_popular',
  meta: olimpiadaMeta,
  date: { year: 1936, month: 6 },
  condition: (state: GameState) => {
    // The games need both halves of the February 1936 settlement: a Popular Front
    // cabinet in Madrid that boycotts Berlin, and the Generalitat in Barcelona
    // that hosts the counter-games. A Republic at war has already lost them.
    const isPeacefulRepublic = state.civilWarStatus === 'not_started' && !state.activeWar;
    // The counter-games belong to the summer of 1936: after August the Berlin
    // reference and the festival itself are historically meaningless.
    const isGamesSummer = state.year === 1936 && state.month >= 6 && state.month <= 8;

    return state.scenario !== '1936'
      && isPeacefulRepublic
      && isGamesSummer
      && gamesWereOrganised(state);
  },
  title: 'Olimpíada Popular: Barcelona\'s Counter-Olympiad',
  titleZh: '人民奥林匹克：巴塞罗那的反向奥运',
  description: `The hotels of the 1929 Exposition are being emptied of tourists and filled with athletes. Hitler's Berlin is polishing its stadiums for August; Madrid and Barcelona have answered together. After the Popular Front's victory in February, the Comitè Català pro-Esport Popular has called the workers of Europe to a counter-Olympiad — the Olimpíada Popular, 19–26 July, at the Estadi de Montjuïc — and the government in Madrid has let it be known that Spain will send no team to Berlin. Six thousand athletes from some fifty nations have registered: French railwaymen, Belgian miners, Czechoslovak gymnasts, Jewish teams with no flag to march behind, German and Italian exiles who cannot go home, and Basques, Galicians and Catalans who will parade as nations the Olympic flag has never recognised. Most of them were sent by unions, workers' clubs and left-wing groups rather than by any ministry. The organising committee, sheltered by the Generalitat, has asked our unions to send athletes and to raise the black-and-red flag beside the others in the opening parade. Our own movement is not of one mind: some comrades call the games a spectacle of the Republican state, others answer that the workers of Europe are already packing their bags. Companys has sent word that he would be honoured. What shall the National Committee reply?`,
  descriptionZh: `1929 年博览会的旅馆正在清空游客、填满运动员。希特勒的柏林正在为八月擦亮体育场；马德里与巴塞罗那给出了共同的回答。人民阵线二月获胜之后，加泰罗尼亚支持人民体育委员会向欧洲的工人发出了号召：人民奥林匹克运动会，7 月 19 日至 26 日，蒙锥克体育场；马德里政府也已表明，西班牙不会派队前往柏林。来自约五十个国家的六千名运动员已经报名——法国铁路工人、比利时矿工、捷克斯洛伐克体操选手、没有国旗可打的犹太队伍、回不了家的德国与意大利流亡者，以及将以奥运旗帜从未承认过的民族名义入场的巴斯克人、加利西亚人和加泰罗尼亚人。他们大多由工会、工人俱乐部与左翼团体选派，而不是由任何部会派出。得到加泰罗尼亚自治政府庇护的筹委会，请求我们的工会派出运动员，并让黑红旗帜在开幕式队列中与其它旗帜并列。我们运动内部并非众口一词：有同志说这不过是共和国的体育景观，也有人回答：欧洲的工人已经在收拾行囊了。孔帕尼斯捎话来说，他将引以为荣。全国委员会该如何答复？`,
  options: [
    {
      text: 'Send our athletes — under our own black-and-red banners.',
      textZh: '派出我们的运动员——但只打我们自己的黑红旗帜。',
      subtitle: 'Join the anti-fascist games and take the tribune beside the left. +5 International Socialists, +5 ERC and +3 PSOE relations, +4 revolutionary fervor; Cenetistas dissent −3, Puristas dissent +4.',
      subtitleZh: '加入这场反法西斯赛事，在左翼身旁占据讲台。国际社会主义者 +5，ERC 关系 +5、PSOE 关系 +3，革命热情 +4；工团派异议 −3，纯粹派异议 +4。',
      effect: (state: GameState): Partial<GameState> => {
        const classes = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 2);
        const factions = adjustFactionDissents(state.factions, { Cenetistas: -3, Puristas: 4 });

        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 4),
          },
          classes,
          factions,
          partyRelations: {
            ...state.partyRelations,
            ERC: Math.min(100, state.partyRelations.ERC + 5),
            PSOE: Math.min(100, state.partyRelations.PSOE + 3),
          },
          relations: {
            ...state.relations,
            internationalSocialists: Math.min(100, state.relations.internationalSocialists + 5),
          },
          currentEvent: null,
        };
      },
    },
    {
      text: 'No parade behind the Republic\'s podium. Boycott the games.',
      textZh: '我们不为共和国的看台列队。抵制这场赛事。',
      subtitle: 'Denounce the Olympiad as a state spectacle and keep the movement clean. Faistas influence +6, Puristas dissent −3; ERC −5 and PSOE −3 relations, +3 revolutionary fervor; Cenetistas dissent +5, Treintistas dissent +3.',
      subtitleZh: '谴责这场国家景观，保持运动的纯洁。无政府主义者影响力 +6，纯粹派异议 −3；ERC 关系 −5、PSOE 关系 −3，革命热情 +3；工团派异议 +5，三十人集团异议 +3。',
      effect: (state: GameState): Partial<GameState> => {
        // Only the Faistas gain influence here: the helper redistributes it from every
        // other faction, so a second influence gain in the same option would net out
        // to less than its advertised number. The purists are rewarded with dissent.
        const influenceShift = adjustFactionInfluence(state.factions, 'Faistas', 6);
        const factions = adjustFactionDissents(influenceShift, {
          Puristas: -3,
          Cenetistas: 5,
          Treintistas: 3,
        });

        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 3),
          },
          factions,
          partyRelations: {
            ...state.partyRelations,
            ERC: Math.max(0, state.partyRelations.ERC - 5),
            PSOE: Math.max(0, state.partyRelations.PSOE - 3),
          },
          currentEvent: null,
        };
      },
    },
    {
      text: 'Open our ateneos and canteens — make it a workers\' festival, not a state ceremony.',
      textZh: '敞开我们的雅典学苑与食堂——把它办成工人阶级的节庆，而不是国家的典礼。',
      subtitle: 'Spend 1 resource to host the visiting delegations ourselves: +1 Ateneo Libertario, +8 International Socialists, +5 revolutionary fervor, lower dissent across all factions.',
      subtitleZh: '消耗 1 资源，由我们自己接待来访代表团：自由雅典学苑 +1，国际社会主义者 +8，革命热情 +5，并降低各派系异议。',
      condition: (state: GameState) => {
        return state.resources >= 1;
      },
      unavailableSubtitle: () => 'Requires 1 resource.',
      unavailableSubtitleZh: () => '需要 1 资源。',
      effect: (state: GameState): Partial<GameState> => {
        const classes = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 2);
        const factions = adjustFactionDissents(state.factions, {
          Faistas: -5,
          Cenetistas: -5,
          Puristas: -3,
          Treintistas: -3,
        });

        return {
          resources: state.resources - 1,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
          },
          classes,
          factions,
          relations: {
            ...state.relations,
            internationalSocialists: Math.min(100, state.relations.internationalSocialists + 8),
          },
          ateneos_established: (state.ateneos_established || 0) + 1,
          currentEvent: null,
        };
      },
    },
  ],
};

/**
 * The wartime aftermath. The games were cancelled as the rising began, the frontier
 * was shut, and a few hundred of the athletes already in Barcelona never left:
 * roughly 200 of them joined the workers' militias (Beevor, The Battle for Spain).
 */
export const olimpiadaPopularStranded: GameEvent = {
  id: 'olimpiada_popular_stranded',
  meta: olimpiadaMeta,
  date: { year: 1936, month: 8 },
  condition: (state: GameState) => {
    // The Comitè Català pro-Esport Popular issued its call in March 1936. A war that
    // had already begun before that call means these games were never organised here.
    const warBegan = state.civilWarSetupCompletedAt;
    const gamesHadBeenCalled = !warBegan || isAtOrAfter(warBegan, 1936, 3);

    return state.civilWarStatus === 'ongoing'
      && isAtOrAfter(state, 1936, 8)
      && gamesHadBeenCalled;
  },
  title: 'The Athletes Who Stayed',
  titleZh: '留下来的运动员',
  description: `Montjuïc stands empty. The People's Olympiad was to open on 19 July; on the 19th it was the columns that marched down the Diagonal. The delegations that had already reached Barcelona — Frenchmen, Belgians, Czechs, Danes, Hungarians, Americans, the German and Italian exiles, the Jewish teams — are stranded: the frontier is shut, the shipping lines have stopped, and nobody's money is worth anything. Most of them are trying to get out through France. A few hundred have refused to leave. They came to fight fascism with a javelin and a stopwatch; now they are asking us for rifles and a place in the columns. Some comrades say a foreigner with a rifle is worth two propagandists. Others answer that the Republic does not conscript its guests, and that a hundred witnesses who reach Paris and London alive will do more for us than a hundred dead volunteers. What shall we do with the athletes who stayed?`,
  descriptionZh: `蒙锥克体育场空着。人民奥林匹克原定 7 月 19 日开幕；而 19 日那天，走在对角线大道上的是纵队。已经抵达巴塞罗那的外国代表团——法国人、比利时人、捷克人、丹麦人、匈牙利人、美国人，还有德国与意大利流亡者和犹太队伍——全部滞留：边境关闭、航线停摆，谁的钱都不值钱了。大多数人正设法取道法国离开。另有数百人拒绝走。他们本是带着标枪和秒表来反抗法西斯的，如今却向我们要枪、要一个进入纵队的位置。有同志说，一个拿枪的外国人抵得上两个宣传家；也有同志说，共和国不会征召自己的客人，一百个活着回到巴黎和伦敦的见证人，比一百个死掉的志愿者更有用。我们该如何处置这些留下来的运动员？`,
  options: [
    {
      text: 'Give the volunteers rifles and a place in the columns.',
      textZh: '给这些志愿者发枪，让他们加入纵队。',
      subtitle: 'Spend 1 armament to put the volunteers into the militia columns. +8 International Socialists, +6 revolutionary fervor.',
      subtitleZh: '消耗 1 点军备，把这些志愿者编入民兵纵队。国际社会主义者 +8，革命热情 +6。',
      condition: (state: GameState) => {
        return state.armaments >= 1;
      },
      unavailableSubtitle: () => 'Requires 1 armament.',
      unavailableSubtitleZh: () => '需要 1 点军备。',
      effect: (state: GameState): Partial<GameState> => {
        return {
          armaments: state.armaments - 1,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 6),
          },
          relations: {
            ...state.relations,
            internationalSocialists: Math.min(100, state.relations.internationalSocialists + 8),
          },
          currentEvent: null,
        };
      },
    },
    {
      text: 'Put them on the road to the frontier — and let them tell Europe what they saw.',
      textZh: '送他们上路去边境——让他们把亲眼所见告诉欧洲。',
      subtitle: 'Help the delegations reach France. +4 France and +2 UK relations, +4 International Socialists, +2 republican authority.',
      subtitleZh: '帮助各国代表团取道法国离开。法国关系 +4、英国关系 +2，国际社会主义者 +4，共和国权威 +2。',
      effect: (state: GameState): Partial<GameState> => {
        return {
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 2),
          },
          relations: {
            ...state.relations,
            france: Math.min(100, state.relations.france + 4),
            uk: Math.min(100, state.relations.uk + 2),
            internationalSocialists: Math.min(100, state.relations.internationalSocialists + 4),
          },
          currentEvent: null,
        };
      },
    },
  ],
};
