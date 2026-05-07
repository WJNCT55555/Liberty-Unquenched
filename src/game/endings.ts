import { GameState } from './types';

export const ENDINGS = {
  CHILDREN_OF_THE_PEOPLE: 'CHILDREN_OF_THE_PEOPLE',
  POPULAR_FRONT: 'POPULAR_FRONT',
  RUSSIAN_SPAIN: 'RUSSIAN_SPAIN',
  THE_GREAT_PURGE: 'THE_GREAT_PURGE',
  SILENT_REPUBLIC: 'SILENT_REPUBLIC',
  FOR_WHOM_THE_BELL_TOLLS: 'FOR_WHOM_THE_BELL_TOLLS',
  WE_HAVE_PASSED: 'WE_HAVE_PASSED',
};

export const ENDING_DETAILS: Record<string, { title: string; titleZh: string; description: string; descriptionZh: string }> = {
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
    description: 'The year is 1939. Through a series of political maneuvers and preemptive strikes, the Nationalist military coup was foiled before it could ignite a full-scale civil war. The Republic has survived, but it is a hollow victory. The underlying class conflicts, the poverty of the peasants, and the anger of the workers remain unresolved. The CNT-FAI exists in a state of tense limbo, constantly clashing with a paralyzed government. The guns are silent for now, but the powder keg of Spain is still waiting for a spark.',
    descriptionZh: '时间来到1939年。通过一系列政治运作和先发制人的打击，国民军的军事政变在引发全面内战前被挫败了。共和国存活了下来，但这只是一场空洞的胜利。深层的阶级冲突、农民的贫困以及工人的愤怒依然没有得到解决。CNT-FAI 处于一种紧张的停滞状态，不断与瘫痪的政府发生冲突。枪声暂时平息，但西班牙这个火药桶，依然在等待着下一颗火星。'
  },
  [ENDINGS.FOR_WHOM_THE_BELL_TOLLS]: {
    title: 'For Whom the Bell Tolls',
    titleZh: '丧钟为谁而鸣',
    description: 'It is 1939, and the Iberian Peninsula is a bleeding wound. The Spanish Civil War has ground into a horrific, endless stalemate. Trenches scar the landscape, cities have been reduced to rubble by relentless bombing, and a generation of Spaniards has been wiped out. The CNT-FAI fights on desperately, but the initial revolutionary fervor has been replaced by the grim, mechanical reality of total war. There is no victory in sight, only the endless tolling of the bell for the fallen.',
    descriptionZh: '现在是1939年，伊比利亚半岛成了一道不断流血的伤口。西班牙内战陷入了可怕且无休止的僵局。战壕在广袤的土地上留下伤疤，城市在无情的轰炸中化为瓦砾，整整一代西班牙人被抹去。CNT-FAI 仍在绝望地战斗，但最初的革命狂热已被全面战争那冷酷、机械的现实所取代。胜利遥遥无期，只有为阵亡者敲响的丧钟在无尽地回荡。'
  },
  [ENDINGS.WE_HAVE_PASSED]: {
    title: 'We Have Passed (Hemos Pasado)',
    titleZh: '我们已经通过',
    description: 'Madrid has fallen. Barcelona has fallen. The Nationalists have won the civil war, and General Francisco Franco is the absolute dictator of Spain. The cry of "No Pasarán" has been silenced by the fascist boast: "Hemos Pasado" (We Have Passed). Mass executions of CNT-FAI members, unionists, and republicans are taking place in every plaza and bullring. The light of liberty has been extinguished, and a long, dark, and brutal night descends upon Spain. The revolution is buried in mass graves.',
    descriptionZh: '马德里陷落了。巴塞罗那陷落了。国民军赢得了内战，弗朗西斯科·佛朗哥将军成为了西班牙的绝对独裁者。“他们休想通过 (No Pasarán)”的呐喊，被法西斯分子“我们已经通过 (Hemos Pasado)”的狂言彻底粉碎。针对 CNT-FAI 成员、工会分子和共和派的大规模处决正在每一个广场和斗牛场上演。自由之光已然熄灭，漫长、黑暗且残暴的黑夜降临西班牙。革命，被永远埋葬在了万人坑中。'
  },
  GENERIC_WIN: {
    title: 'A Fragile Peace',
    titleZh: '脆弱的和平',
    description: 'The fascist rebellion has been defeated, and the Republic stands. Yet, as the smoke clears, the future remains shrouded in uncertainty. The social revolution was neither a complete triumph nor a total failure; it exists in a fractured state of compromises and half-measures. The CNT-FAI must now navigate a complex post-war political landscape, defending its gains while facing new, insidious threats from within the republican coalition. The war is over, but the struggle for the soul of Spain continues.',
    descriptionZh: '法西斯叛乱被击败，共和国屹立不倒。然而，当硝烟散去，未来依然笼罩在巨大的不确定性中。社会革命既没有取得完全的胜利，也没有遭到彻底的失败；它在妥协与半吊子的改革中呈现出一种破碎的状态。CNT-FAI 现在必须在复杂的战后政治格局中艰难前行，在保卫既得利益的同时，面对来自共和联盟内部新的、隐蔽的威胁。战争结束了，但争夺西班牙灵魂的斗争，仍在继续。'
  }
};

export const checkEndings = (state: GameState): GameState => {
  if (state.isGameOver) return state;

  let triggeredEnding: string | null = null;

  // Calculate overall dissent
  const factions = Object.values(state.factions);
  const totalInfluence = factions.reduce((sum, f) => sum + f.influence, 0);
  const overallDissent = totalInfluence > 0 
    ? factions.reduce((sum, f) => sum + (f.influence * f.dissent), 0) / 100 
    : 0;

  // 1. The Great Purge
  if (state.stats.pceSupport > 80 && state.cntFaiInGovernment) {
    triggeredEnding = ENDINGS.THE_GREAT_PURGE;
  }
  // 2. We Have Passed
  else if (state.civilWarStatus === 'lost') {
    triggeredEnding = ENDINGS.WE_HAVE_PASSED;
  }
  // 3. Russian Spain
  else if (state.civilWarStatus === 'won' && state.moscowGoldTransferred && state.stats.pceSupport > 80 && state.pceInPower && state.pceAcceptsComintern) {
    triggeredEnding = ENDINGS.RUSSIAN_SPAIN;
  }
  // 4. Children of the People
  else if (state.civilWarStatus === 'won' && state.stats.revolutionaryFervor > 80 && overallDissent < 30) {
    triggeredEnding = ENDINGS.CHILDREN_OF_THE_PEOPLE;
  }
  // 5. The Popular Front
  else if (state.civilWarStatus === 'won' && state.stats.revolutionaryFervor < 40 && state.cntFaiInGovernment) {
    triggeredEnding = ENDINGS.POPULAR_FRONT;
  }
  // Generic Win (Fallback if won but no specific condition met)
  else if (state.civilWarStatus === 'won') {
    triggeredEnding = 'GENERIC_WIN';
  }
  // 6. Time limits (1939)
  else if (state.year >= 1939) {
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
