import { GameState } from './types';
import { MapFaction } from '../map/types_map';
import { beginIberianSettlement } from './events/iberian_victory_chain';
import { isJournalCompleted } from './rules/economyReforms';
import { getCoalitionMembers } from './utils/coalition';

/** National population-weighted support; the purge check uses strict >. */
export const PCE_ENDING_THRESHOLDS = { greatPurge: 75 } as const;

export const ENDINGS = {
  THE_REVOLUTION_BETRAYED: 'THE_REVOLUTION_BETRAYED',
  LAND_AND_FREEDOM: 'LAND_AND_FREEDOM',
  SYNDICATE_DREAM: 'SYNDICATE_DREAM',
  REVOLUTION_WITHOUT_END: 'REVOLUTION_WITHOUT_END',
  CHILDREN_OF_THE_PEOPLE: 'CHILDREN_OF_THE_PEOPLE',
  POPULAR_FRONT: 'POPULAR_FRONT',
  RUSSIAN_SPAIN: 'RUSSIAN_SPAIN',
  THE_GREAT_PURGE: 'THE_GREAT_PURGE',
  SILENT_REPUBLIC: 'SILENT_REPUBLIC',
  FOR_WHOM_THE_BELL_TOLLS: 'FOR_WHOM_THE_BELL_TOLLS',
  ASTURIAS_WAR_LOST: 'ASTURIAS_WAR_LOST',
  WE_HAVE_PASSED: 'WE_HAVE_PASSED',
} as const;

export const ENDING_DETAILS: Record<string, { title: string; titleZh: string; description: string; descriptionZh: string }> = {
  [ENDINGS.THE_REVOLUTION_BETRAYED]: {
    title: 'The Revolution Betrayed', titleZh: '被背叛的革命',
    description: 'The Republic has won the war, and the revolution has lost it. With the Nationalists and the Carlists broken, the only enemy left was the movement that had saved the Republic. Madrid demanded the disarmament of the militias, the dissolution of the committees, and the surrender of Barcelona. When the CNT-FAI refused, the Republican army did what Franco’s columns could not: it entered the city and broke the revolution. The men and women who held the barricades in July 1936 are now arrested by the state they defended. Fascism was defeated, and the revolution was betrayed by its own side.',
    descriptionZh: '共和国赢得了战争，革命却输掉了一切。国民军与卡洛斯派相继崩溃之后，唯一剩下的敌人，是那个曾拯救过共和国的运动。马德里要求解散民兵、撤销委员会、交出巴塞罗那。CNT-FAI 拒绝之后，共和军完成了佛朗哥的纵队没能完成的事：开进城市，击碎革命。1936 年 7 月守在街垒上的那些人，如今被他们曾保卫的国家逮捕。法西斯被击败了，革命却被自己的阵营出卖。',
  },
  [ENDINGS.LAND_AND_FREEDOM]: {
    title: 'Land and Freedom', titleZh: '土地与自由',
    description: 'The war is over, and the state has quietly become unnecessary. Across Aragon, Andalusia and the Levante the land is held by those who work it; the collectives federate village by village, region by region, until the confederation of communes is a power in its own right. Money survives only at the edges; the trains and the mines answer to the workers who run them. Madrid still exists on paper, but the peasants and the syndicates have stopped asking it for permission. This is not a victory of barricades — it is the slower, stranger victory of a world that has learned to live without its masters.',
    descriptionZh: '战争结束了，国家却在不知不觉间变得不再必要。阿拉贡、安达卢西亚与黎凡特，土地归耕作者所有；集体农庄一个村一个村、一个地区一个地区地结成联邦，直到公社联邦本身成为一种权力。货币只在边缘地带苟延；铁路与矿井听命于经营它们的工人。马德里在纸面上仍然存在，但农民与工团已经不再向它请示。这不是街垒的胜利，而是一个学会在没有主人之后继续生活的世界，所取得的更缓慢、也更奇怪的胜利。',
  },
  [ENDINGS.SYNDICATE_DREAM]: {
    title: 'The Syndicate Is No Dream', titleZh: '工团非梦',
    description: 'It did not look like a revolution. There was no storming of ministries, no red flag over the Bank of Spain, no decree abolishing the state. There was a congress, a federation of industries, a party, a law on collective bargaining — and then one morning the people who had run the railways and the pits under workers’ committees were running them under a ministry letterhead that carried their own names. The purists call it absorption. The moderates call it the only way an anarcho-syndicalist movement survives contact with a modern economy. Both are describing the same fact: the confederation now manages Spanish industry, and it does so from inside the Republic it once refused to enter.',
    descriptionZh: '它看起来不像革命。没有人攻占部会，没有红旗插上西班牙银行，也没有废除国家的法令。只有一次代表大会、一个产业联合会、一个党、一条集体谈判的法律——然后某个早上，那些在工人委员会下经营铁路与矿井的人，开始在一张印着自己名字的部会信纸上经营它们。纯粹派把这称作被吸收。温和派把这称作一个无政府工团主义运动与现代经济接触后唯一可能的活法。两边描述的是同一个事实：联合会现在管理着西班牙的工业，而且是从它一度拒绝进入的共和国**内部**管理。',
  },
  [ENDINGS.REVOLUTION_WITHOUT_END]: {
    title: 'The Revolution Does Not End', titleZh: '革命不止',
    description: 'May 1940. The war is over, but the committee has not dissolved itself. There are no elections, no constitution, no return to the Republic; the revolutionary committees still meet in theaters and factory halls, and the red-and-black militia is the only law that reaches the villages. What began as an emergency has become the system. The Committee calls this permanent revolution; its critics call it a permanent committee. Either way, no one has been allowed to end the revolution — and so it does not end.',
    descriptionZh: '1940 年 5 月。战争结束了，委员会却没有解散。没有选举，没有宪法，也没有回到共和国；革命委员会仍在剧院与工厂大厅里开会，红黑民兵是唯一能抵达村庄的法律。最初作为紧急状态建立的东西，如今成了制度本身。委员会把这称作“继续革命”；批评者把这称作“永远的委员会”。无论如何，没有人被允许结束这场革命——于是它不会结束。',
  },
  [ENDINGS.CHILDREN_OF_THE_PEOPLE]: {
    title: 'Children of the People',
    titleZh: '人民之子',
    description: 'The fascist threat has been crushed beneath the boots of the working class. The social revolution has triumphed in its purest form, and the CNT-FAI stands united as the vanguard of a new world. Across the Iberian Peninsula, the state apparatus has been dismantled, replaced by a free federation of syndicates and agricultural communes. Factories are run by those who toil in them, and the land belongs to those who work it. The anarchist dream, forged in blood and solidarity, has finally become a reality. We are the children of the people, and we have inherited the earth.',
    descriptionZh: '法西斯的威胁已被工人阶级的铁靴彻底粉碎。社会革命以最纯粹的形式取得了胜利，CNT-FAI 作为新世界的先锋保持着空前的团结。在整个伊比利亚半岛，旧的国家机器已被拆除，取而代之的是自由的工团与农业公社联邦。工厂由劳作者管理，土地归耕作者所有。那个在鲜血与团结中锻造的无政府主义梦想，终于化为现实。我们是人民之子，我们继承了这片大地。'
  },
  [ENDINGS.POPULAR_FRONT]: {
    title: 'The Popular Front',
    titleZh: '人民阵线',
    description: 'The Republic has won the war, but the revolution has been lost. In the name of anti-fascist unity, the CNT-FAI was slowly integrated into the very state apparatus it once swore to destroy. The barricades have been dismantled, the militias regularized, and the collectivized factories returned to their former owners or state bureaucrats. We defeated Franco, but the fruits of our struggle were swallowed by politicians and reformists. The anarchist movement survives, but only as a marginalized shadow within a bourgeois republic.',
    descriptionZh: '共和国赢得了战争，但革命却失败了。在“反法西斯统一战线”的名义下，CNT-FAI 被缓慢而无情地整合进了它曾经发誓要摧毁的国家机器中。街垒被拆除，民兵被正规化，集体化的工厂被交还给前所有者或国家官僚。我们击败了佛朗哥，但斗争的果实却被政客和改良主义者吞噬。无政府主义运动虽然幸存，但已沦为资产阶级共和国中一个被彻底边缘化的幽灵。'
  },
  [ENDINGS.RUSSIAN_SPAIN]: {
    title: 'Russian Spain',
    titleZh: '俄属西班牙',
    description: 'Victory has been achieved, but the Spanish Republic is no more. With the transfer of the Moscow Gold, the Soviet Union bought the soul of our resistance. The PCE, acting as the absolute puppet of the Comintern, has seized total control of the state. The black and red flags of the CNT-FAI have been torn down, replaced by the rigid orthodoxy of Stalinism. Our comrades who fought on the front lines are now disappearing into secret prisons. Spain has become a Soviet satellite, a cold and paranoid police state.',
    descriptionZh: '胜利已经到来，但那个西班牙共和国已不复存在。随着莫斯科黄金的转移，苏联买下了我们抵抗运动的灵魂。作为共产国际绝对傀儡的西班牙共产党（PCE）已经夺取了国家的全面控制权。CNT-FAI 的红黑旗帜被撕毁，取而代之的是斯大林主义僵硬的正统观念。那些曾在前线浴血奋战的同志，如今正一个个消失在秘密监狱中。西班牙沦为了苏联的卫星国，一个冰冷而偏执的警察国家。'
  },
  [ENDINGS.THE_GREAT_PURGE]: {
    title: 'The Great Purge',
    titleZh: '大清洗',
    description: 'The revolution devours its own children. The PCE\'s influence grew too vast, and the Stalinists struck with ruthless efficiency. Utilizing the state power that the CNT-FAI naively helped legitimize, the secret police launched a sudden and devastating purge. You and the entire anarchist leadership have been arrested, branded as "Trotskyist-Fascist saboteurs" in show trials. The revolution is dead, strangled not by Franco\'s troops, but by the very "allies" we fought alongside. The dream ends in a cold cell.',
    descriptionZh: '革命吞噬了它自己的孩子。PCE 的势力膨胀到了无法控制的地步，斯大林主义者以冷酷的效率发动了袭击。利用 CNT-FAI 天真地帮助合法化的国家权力，秘密警察发动了一场突然而毁灭性的大清洗。你和整个无政府主义领导层遭到逮捕，在作秀公审中被诬蔑为“托派-法西斯破坏分子”。革命死了，不是被佛朗哥的军队绞杀，而是死在我们曾并肩作战的“盟友”手中。梦想在一间冰冷的牢房中终结。'
  },
  [ENDINGS.SILENT_REPUBLIC]: {
    title: 'The Silent Republic',
    titleZh: '寂静的共和',
    description: 'The year is 1940. Through a series of political maneuvers and preemptive strikes, the Nationalist military coup was foiled before it could ignite a full-scale civil war. The Republic has survived, but it is a hollow victory. The underlying class conflicts, the poverty of the peasants, and the anger of the workers remain unresolved. The CNT-FAI exists in a state of tense limbo, constantly clashing with a paralyzed government. The guns are silent for now, but the powder keg of Spain is still waiting for a spark.',
    descriptionZh: '时间来到 1940 年 5 月。通过一系列政治运作和先发制人的打击，国民军的军事政变在引发全面内战前被挫败了。共和国存活了下来，但这只是一场空洞的胜利。深层的阶级冲突、农民的贫困以及工人的愤怒依然没有得到解决。CNT-FAI 处于一种紧张的停滞状态，不断与瘫痪的政府发生冲突。枪声暂时平息，但西班牙这个火药桶，依然在等待着下一颗火星。'
  },
  [ENDINGS.FOR_WHOM_THE_BELL_TOLLS]: {
    title: 'For Whom the Bell Tolls',
    titleZh: '丧钟为谁而鸣',
    description: 'It is May 1940, and the Iberian Peninsula is a bleeding wound. The Spanish Civil War has ground into a horrific, endless stalemate. Trenches scar the landscape, cities have been reduced to rubble by relentless bombing, and a generation of Spaniards has been wiped out. The CNT-FAI fights on desperately, but the initial revolutionary fervor has been replaced by the grim, mechanical reality of total war. There is no victory in sight, only the endless tolling of the bell for the fallen.',
    descriptionZh: '现在是 1940 年 5 月，伊比利亚半岛成了一道不断流血的伤口。西班牙内战陷入了可怕且无休止的僵局。战壕在广袤的土地上留下伤疤，城市在无情的轰炸中化为瓦砾，整整一代西班牙人被抹去。CNT-FAI 仍在绝望地战斗，但最初的革命狂热已被全面战争那冷酷、机械的现实所取代。胜利遥遥无期，只有为阵亡者敲响的丧钟在无尽地回荡。'
  },
  [ENDINGS.ASTURIAS_WAR_LOST]: {
    title: 'Elegy for the Asturian Workers',
    titleZh: '阿斯图里亚斯工人的挽歌',
    description: 'Due to severe suppression by government and reactionary forces, the Workers\' Alliance Autonomous Government in Asturias has fallen. Thousands of armed workers and miners fell, and the uprising ended in defeat. The national labor movement suffers a severe blow, and our revolution is drowned in blood.',
    descriptionZh: '由于反动派和政府军的联合残酷镇压，工人联盟自治政府在阿斯图里亚斯的革命阵地不幸失陷。成千上万的工人武装成员和矿工战士牺牲，起义宣告失败。全国的工人运动陷入低谷，我们的革命被淹没在血泊之中。'
  },
  [ENDINGS.WE_HAVE_PASSED]: {
    title: 'We Have Passed (Hemos Pasado)',
    titleZh: '我们已经通过',
    description: 'The war is over, and the Republic has fallen. Whether the field belongs to Franco’s rebel junta, a divided rebel command, or the Carlists, the result for the revolution is the same. The CNT-FAI is outlawed, its committees are dissolved, and its militants are hunted through every plaza and bullring. The cry of "No Pasarán" has been answered with the fascist boast "Hemos Pasado" (We Have Passed). The light of liberty has been extinguished, and a long, dark, and brutal night descends upon Spain. The revolution is buried in mass graves.',
    descriptionZh: '战争结束了，共和国倒下了。无论战场属于佛朗哥的叛军军政委员会、彼此分裂的叛军，还是卡洛斯派，革命得到的结果都一样：CNT-FAI 被宣布非法，委员会被解散，其成员在每一座广场与斗牛场遭到追捕。“他们休想通过 (No Pasarán)”的呐喊，被法西斯分子“我们已经通过 (Hemos Pasado)”的狂言彻底粉碎。自由之光已然熄灭，漫长、黑暗且残暴的黑夜降临西班牙。革命，被永远埋葬在了万人坑中。'
  },
  GENERIC_WIN: {
    title: 'A Fragile Peace',
    titleZh: '脆弱的和平',
    description: 'The fascist rebellion has been defeated, and the Republic stands. Yet, as the smoke clears, the future remains shrouded in uncertainty. The social revolution was neither a complete triumph nor a total failure; it exists in a fractured state of compromises and half-measures. The CNT-FAI must now navigate a complex post-war political landscape, defending its gains while facing new, insidious threats from within the republican coalition. The war is over, but the struggle for the soul of Spain continues.',
    descriptionZh: '法西斯叛乱被击败，共和国屹立不倒。然而，当硝烟散去，未来依然笼罩在巨大的不确定性中。社会革命既没有取得完全的胜利，也没有遭到彻底的失败；它在妥协与半吊子的改革中呈现出一种破碎的状态。CNT-FAI 现在必须在复杂的战后政治格局中艰难前行，在保卫既得利益的同时，面对来自共和联盟内部新的、隐蔽的威胁。战争结束了，但争夺西班牙灵魂的斗争，仍在继续。'
  }
};

/** Campaigns saved before the ending rework still carry these ids. */
const LEGACY_LOSS_ENDINGS = new Set([
  'NATIONALIST_JUNTA_VICTORY', 'DIVIDED_REBEL_VICTORY', 'CARLIST_VICTORY',
]);

/** True while a Nationalist or Carlist camp still holds territory. */
const rightWingCampsRemain = (state: GameState): boolean =>
  Object.values(state.provinces ?? {}).some(province =>
    province.owner === MapFaction.NATIONALIST || province.owner === MapFaction.CARLIST);

/**
 * A defeated Committee has exactly one player-facing ending: the Revolution Betrayed.
 *
 * That ending is reserved for the Republic's own betrayal — the right-wing camps are
 * gone, the Republic is the last camp standing, and it was the Republic that took
 * Barcelona. Every other Committee defeat falls into the single "We Have Passed" loss
 * ending, together with the former Nationalist, divided-rebel and Carlist victories.
 */
const committeeDefeatEnding = (state: GameState): string => {
  const campaign = state.iberianDefense;
  if (!campaign) return ENDINGS.WE_HAVE_PASSED;
  const defeatedByRepublic = (campaign.eliminations ?? []).some(elimination =>
    elimination.faction === MapFaction.IBERIAN_DEFENSE
    && elimination.recipient === MapFaction.REPUBLICAN);
  const republicIsLastCamp = campaign.winner === MapFaction.REPUBLICAN || !rightWingCampsRemain(state);
  return defeatedByRepublic && republicIsLastCamp
    ? ENDINGS.THE_REVOLUTION_BETRAYED
    : ENDINGS.WE_HAVE_PASSED;
};

/** A free-commune regime can be established by any of the three postwar settlements.
 *  The most recent settlement wins: an earlier Asturias regime must not survive a
 *  later parliamentary/federal settlement. */
const hasFreeCommuneRegime = (state: GameState): boolean => {
  const regime = state.postwarSettlement
    ? state.postwarSettlement.regime
    : state.iberianSettlement
      ? state.iberianSettlement.regime
      : state.asturiasVictory?.regime;
  return regime === 'free_commune_federation';
};

/** The game's final settlement checkpoint: May 1940. */
const isMay1940 = (state: GameState): boolean =>
  state.year > 1940 || (state.year === 1940 && state.month >= 5);

const hasRevolutionaryCommitteeRegime = (state: GameState): boolean =>
  state.iberianSettlement?.regime === 'revolutionary_committee';

/** Parliament or council republic, as chosen by the Asturias/Republican settlement. */
const hasParliamentaryOrCouncilRegime = (state: GameState): boolean => {
  const regime = state.postwarSettlement?.regime ?? state.asturiasVictory?.regime;
  return regime === 'parliamentary_republic' || regime === 'council_republic';
};

/** The Council Republic is a playable post-war regime, not a May 1940 epilogue. */
const hasCouncilRegime = (state: GameState): boolean => {
  const regime = state.postwarSettlement?.regime ?? state.asturiasVictory?.regime;
  return regime === 'council_republic';
};

/** The PCE is the only party in the cabinet (or in the ruling coalition). */
const hasPceOnlyGovernment = (state: GameState): boolean => {
  const cabinet = Object.values(state.ministers ?? {});
  const cabinetOnlyPce = cabinet.length > 0 && cabinet.every(party => party === 'PCE');
  const ruling = state.activeCoalitions?.find(coalition => coalition.activeId === state.rulingCoalition);
  const coalitionMembers = ruling ? getCoalitionMembers(state, ruling) : [];
  const coalitionOnlyPce = coalitionMembers.length === 1 && coalitionMembers[0] === 'PCE';
  return cabinetOnlyPce || coalitionOnlyPce;
};

export const checkEndings = (state: GameState): GameState => {
  // Legacy saves: fold the retired loss screens into the single "We Have Passed"
  // ending, and restore the old Committee defeat as the Revolution Betrayed when the
  // Republic was the camp that finished it.
  if (state.ending && LEGACY_LOSS_ENDINGS.has(state.ending)) {
    return { ...state, isGameOver: true, ending: ENDINGS.WE_HAVE_PASSED };
  }
  if (state.ending === 'IBERIAN_MADRID_VICTORY') {
    return { ...state, isGameOver: true, ending: ENDINGS.THE_REVOLUTION_BETRAYED };
  }
  if (state.ending === 'IBERIAN_COMMITTEE_DEFEAT') {
    return { ...state, isGameOver: true, ending: committeeDefeatEnding(state) };
  }
  // The Defense Committee victory screen was retired; re-evaluate old saves under
  // the free-commune / revolutionary-committee / generic rules.
  if (state.ending === 'IBERIAN_COMMITTEE_VICTORY') {
    return checkEndings({ ...state, ending: null, isGameOver: false });
  }
  if (state.isGameOver) return state;

  const freeCommuneRegime = hasFreeCommuneRegime(state);
  const landAndFreedom = freeCommuneRegime
    && isJournalCompleted(state, 'journal_economy_free_commune');
  const syndicalistDream = isJournalCompleted(state, 'journal_economy_syndicalist');

  if (state.iberianDefense) {
    const campaign = state.iberianDefense;
    if (campaign.playerDefeated
      || campaign.eliminated.includes(MapFaction.IBERIAN_DEFENSE)
      || (campaign.winner && campaign.winner !== MapFaction.IBERIAN_DEFENSE)) {
      return { ...state, isGameOver: true, ending: committeeDefeatEnding(state) };
    }
    const winner = campaign.winner;
    if (!winner) return state;
    // The Committee's total victory opens its own settlement chain first.
    if (!state.iberianSettlement) return { ...state, ...beginIberianSettlement(state) };
    if (!state.iberianSettlement.completedAt) return state;
    if (!isMay1940(state)) return state;
    if (hasRevolutionaryCommitteeRegime(state)) {
      return { ...state, isGameOver: true, ending: ENDINGS.REVOLUTION_WITHOUT_END };
    }
    if (freeCommuneRegime) {
      return {
        ...state,
        isGameOver: true,
        ending: landAndFreedom ? ENDINGS.LAND_AND_FREEDOM : ENDINGS.CHILDREN_OF_THE_PEOPLE,
      };
    }
    return { ...state, isGameOver: true, ending: 'GENERIC_WIN' };
  }

  let triggeredEnding: string | null = null;

  // A Republican victory won without the CNT splitting runs the postwar settlement
  // chain first; the political ending is evaluated once that chain completes.
  if (state.civilWarStatus === 'won' && state.postwarSettlement && !state.postwarSettlement.completedAt) {
    return state;
  }

  // 1. The Great Purge
  if (state.partySupport['PCE'] > PCE_ENDING_THRESHOLDS.greatPurge && state.cntStance === 'govern') {
    triggeredEnding = ENDINGS.THE_GREAT_PURGE;
  }
  else if (state.wars?.asturias_war === 'lost') {
    triggeredEnding = ENDINGS.ASTURIAS_WAR_LOST;
  }
  // 2. We Have Passed — the single defeat ending, whoever the rebels are.
  else if (state.civilWarStatus === 'lost') {
    triggeredEnding = ENDINGS.WE_HAVE_PASSED;
  }
  // 3. Russian Spain: a PCE-only government inside a parliamentary or council
  // republic, with the Comintern line accepted and the Moscow gold transferred.
  else if (state.civilWarStatus === 'won'
    && state.moscowGoldTransferred
    && state.pceAcceptsComintern
    && hasParliamentaryOrCouncilRegime(state)
    && hasPceOnlyGovernment(state)) {
    triggeredEnding = ENDINGS.RUSSIAN_SPAIN;
  }
  // 4. The Popular Front is still an immediate political settlement. It is skipped
  // when a free-commune regime or the syndicalist journal owns the ending instead.
  else if (state.civilWarStatus === 'won' && state.stats.revolutionaryFervor < 40
    && state.cntStance === 'govern' && !freeCommuneRegime && !syndicalistDream) {
    triggeredEnding = ENDINGS.POPULAR_FRONT;
  }
  // 5. Free Commune Federation: Land and Freedom when the free-commune economic
  // route is complete; Children of the People is the regime's fallback ending.
  // Both wait for the May 1940 checkpoint.
  else if (state.civilWarStatus === 'won' && isMay1940(state) && freeCommuneRegime) {
    triggeredEnding = landAndFreedom ? ENDINGS.LAND_AND_FREEDOM : ENDINGS.CHILDREN_OF_THE_PEOPLE;
  }
  // 6. The Syndicate Is No Dream — the moderate syndicalist economic route.
  else if (state.civilWarStatus === 'won' && isMay1940(state) && syndicalistDream) {
    triggeredEnding = ENDINGS.SYNDICATE_DREAM;
  }
  // 7. The Council Republic continues past the generic May 1940 checkpoint;
  // its own peacetime crisis/ending layer is still being built.
  else if (state.civilWarStatus === 'won' && isMay1940(state) && hasCouncilRegime(state)) {
    return state;
  }
  // 8. Generic Win (Fallback if won but no specific condition met)
  else if (state.civilWarStatus === 'won' && isMay1940(state)) {
    triggeredEnding = 'GENERIC_WIN';
  }
  // 9. Time limits (May 1940)
  else if (isMay1940(state)) {
    if (state.civilWarStatus === 'not_started') {
      triggeredEnding = ENDINGS.SILENT_REPUBLIC;
    } else if (state.civilWarStatus === 'ongoing') {
      triggeredEnding = ENDINGS.FOR_WHOM_THE_BELL_TOLLS;
    }
  }

  if (triggeredEnding) {
    return {
      ...state,
      isGameOver: true,
      ending: triggeredEnding
    };
  }

  return state;
};
