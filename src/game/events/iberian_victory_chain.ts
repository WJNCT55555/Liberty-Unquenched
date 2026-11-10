import type { GameEvent, GameState, Party, PartyAlias } from '../types';
import { ensureLawAtLeast } from '../rules/lawChange';
import { applyUnionShareDelta } from '../unions';
import {
  ALL_PARTIES, LEFT_REPUBLICAN_PARTIES, RIGHT_WING_PARTIES,
  excludeParties,
} from '../rules/postwarPolitics';

/**
 * Settlement chain for the Iberian Defence Committee's total victory: the CNT has
 * split from Madrid, defeated the Nationalists, the Carlists and the Republic, and
 * now has to decide what the new Iberian order is. Triggered by `checkEndings` when
 * the Committee is the last camp standing; `IBERIAN_COMMITTEE_VICTORY` is deferred
 * until `iberianSettlement.completedAt` is written by the final node.
 */

const meta = {
  category: 'politics' as const,
  series: ['iberian', 'revolution_settlement'],
  tags: ['politics'],
};

const nextEvent = (event: GameEvent, patch: Partial<GameState> = {}): Partial<GameState> => ({
  ...patch,
  currentEvent: event,
});

const settlementPatch = (state: GameState, patch: Partial<NonNullable<GameState['iberianSettlement']>>): Partial<GameState> => ({
  iberianSettlement: {
    ...(state.iberianSettlement ?? { startedAt: { year: state.year, month: state.month } }),
    ...patch,
  },
});

export const beginIberianSettlement = (state: GameState): Partial<GameState> => (
  state.iberianSettlement
    ? {}
    : {
        iberianSettlement: { startedAt: { year: state.year, month: state.month } },
        currentEvent: iberianVictoryPrologue,
        phase: 'event',
      }
);

const PARTY_ALIASES: Partial<Record<Party, PartyAlias>> = {
  PSOE: { en: 'UGT (General Union of Workers)', zh: '劳动者总工会 (UGT)', shortEn: 'UGT', shortZh: 'UGT' },
  PNV: { en: 'STV (Basque Workers’ Solidarity)', zh: '巴斯克工人团结工会 (STV)', shortEn: 'STV', shortZh: 'STV' },
  POUM: { en: 'FOUS (United Workers’ Syndicalist Federation)', zh: '工团统一工人联合会 (FOUS)', shortEn: 'FOUS', shortZh: 'FOUS' },
  ERC: { en: 'ERC-LU (Left Union of Catalan Tenant Farmers)', zh: '加泰罗尼亚左翼佃农联合会 (ERC-LU)', shortEn: 'ERC-LU', shortZh: 'ERC-LU' },
};

export const iberianVictoryPrologue: GameEvent = {
  id: 'iberian_victory_prologue',
  meta: { ...meta, flow: 'inline.root' },
  title: 'The Death of the Nation',
  titleZh: '国家之死',
  description: 'Zaragoza, the Plaza del Pilar and the hall of the Confederal Plenum. In May 1936 the CNT held its historic national congress in this city and drew the utopian blueprint of “libertarian communism” on paper; then the civil war came and Zaragoza fell to the rebels. Now the red-and-black flag flies at last from the bell tower by the Ebro. There is no presidential address and no anthem; the government ministries have been sealed by revolutionary committees. Yet the mood in the hall is not pure carnival — the delegates who survived the May Days barricades of 1937 and then won three years of total war alone still carry the smell of gunpowder and hunger. Jaime Balius, theorist of the “Friends of Durruti”, limps to the rostrum on a cane and points at the militia patrolling outside: “Comrades! We bled on the barricades in May — we must not disarm ourselves out of petty-bourgeois tenderness!” Federica Montseny rises at once: “Balius! If the revolutionary defence committees become a new government above the free communes, how are we different from the Bolsheviks? The state is dead, comrades — the state is dead! Do you remember? Here we cautiously approved libertarian communism as the blueprint for Spain’s future society. Are we now to smash our own consensus with our own hands?” Across the hall, Diego Abad de Santillán and Juan Peiró look grave.',
  descriptionZh: '萨拉戈萨，皮拉尔广场与邦联全国全会会场。1936年5月，正是在这座城市，CNT 召开了历史性的全国代表大会，在纸上描绘了“自由共产主义”的乌托邦蓝图；随后内战爆发，萨拉戈萨陷落于叛军之手。如今，红黑双色旗终于插上了埃布罗河畔的钟楼。没有总统致辞，没有国歌奏响，各个政府部委大楼已被革命委员会贴上封条。但会场内的气氛却并非只有狂欢——经历过1937年五月巴塞罗那街垒血战、又独自打赢三年全面内战的代表们，身上还带着硝烟与饥饿的气息。“杜鲁蒂之友”的理论家海梅·巴利乌斯拄着拐杖走上讲台，他指着窗外巡逻的民兵高喊：“同志们！我们在五月的街垒上流血，绝不可以因为小资产阶级的温情脉脉而解除自己的武装！……”台下的费代丽卡·蒙特塞尼立刻起身反驳：“巴利乌斯！如果革命防卫委员会变成了凌驾于自由公社之上的新政府，那我们和布尔什维克又有什么区别？国家已经死了，同志们，国家已死！曾记否？我们在此谨慎的批准了自由意志共产主义作为西班牙未来社会的蓝图，如今难道我们要亲手粉碎我们曾经的共识和决定吗！”而在会场另一侧，迭戈·阿巴德·德·圣蒂良与胡安·佩罗神色严峻。',
  options: [{
    text: 'Strike the gavel: convene the first post-war Confederal Plenum!',
    textZh: '敲响木槌，召开战后第一届全国邦联特别全会！',
    subtitle: 'Now the anarchists must answer how to build the new world.',
    subtitleZh: '“现在，无政府主义者必须回答如何建设新世界。”',
    effect: () => nextEvent(iberianBirthOfFreedom),
  }],
};

export const iberianBirthOfFreedom: GameEvent = {
  id: 'iberian_birth_of_freedom',
  meta: { ...meta, flow: 'inline.node' },
  title: 'The Birth of Freedom',
  titleZh: '自由诞生',
  description: 'The supreme assembly that will decide Iberia’s fate meets in Zaragoza’s grand theatre. Huge portraits of Buenaventura Durruti, Francisco Ascaso and Camillo Berneri hang above the hall. Delegates from more than three thousand industrial unions and free communes across the peninsula pack the seats. Outside, members of the Friends of Durruti and the revolutionary committees stand guard with rifles.',
  descriptionZh: '决定伊比利亚命运的最高会议在萨拉戈萨的大剧院内召开。会场上方悬挂着布埃纳文图拉·杜鲁蒂、弗朗西斯科·阿斯卡索与卡米洛·贝尔内里的巨幅肖像。来自全半岛三千多个产业工会与自由公社的代表把会场挤得水泄不通。门外杜鲁提之友会和革命委员会的成员正持枪警戒。',
  options: [
    {
      text: 'Carry out the Zaragoza Programme: build the Iberian Federation of Free Municipal Communes!',
      textZh: '践行《萨拉戈萨纲领》，建立伊比利亚自由市镇公社邦联！',
      subtitle: 'The ideal of libertarian communism is in bloom.',
      subtitleZh: '“自由意志共产主义的理想正绽放！”',
      effect: state => nextEvent(iberianFuneralOfMoney, settlementPatch(state, {
        regime: 'free_commune_federation', variant: 'municipal_federation',
      })),
    },
    {
      text: 'Forge a modern syndicalist machine: the National Confederation of Industry as an economic federation!',
      textZh: '铸就现代工团机器，建立全国产业联合会经济邦联！',
      subtitle: 'Replace state bureaucracy with scientific statistics.',
      subtitleZh: '“用科学统计取代国家官僚！”',
      effect: state => nextEvent(iberianFuneralOfMoney, settlementPatch(state, {
        regime: 'free_commune_federation', variant: 'industrial_federation',
      })),
    },
    {
      text: 'Continue the iron hand of the May barricades: establish the National Revolutionary Committee!',
      textZh: '延续五月街垒的铁腕，确立全国革命委员会体制！',
      subtitle: 'The great standard-bearer leads firmly; sweep away every ghost and monster.',
      subtitleZh: '“伟大旗手，坚定领导！横扫一切牛鬼蛇神”',
      effect: state => nextEvent(iberianFuneralOfMoney, settlementPatch(state, {
        regime: 'revolutionary_committee',
      })),
    },
  ],
};

export const iberianFuneralOfMoney: GameEvent = {
  id: 'iberian_funeral_of_money',
  meta: { ...meta, flow: 'inline.node' },
  title: 'The Funeral of Money',
  titleZh: '货币的葬礼',
  description: 'In Fraga in Aragon and in village squares across Andalusia, excited crowds throw bundles of old Republican pesetas, bank bonds and land deeds onto roaring bonfires. Old people and children dance around the flames, shouting: “Money is dead — exploitation is over forever!” In Barcelona, Bilbao and Oviedo, with no ministry commissioners to obstruct them, the red-and-black flags of the CNT fly over every mine, steelworks and power station. In the late-night streets of Madrid, small shopkeepers… But when the bonfires die down, the harsh practical questions face the National Economic Plenum: Asturian miners need Valencian oranges and wheat; Barcelona’s textile mills need imported cotton from Britain and France and steel from the Bay of Biscay. With the capitalists and the state treasury destroyed, how should heavy industry be organized? With the hated old currency abolished, how are millions of workers and peasants to distribute the fruits of their labour?',
  descriptionZh: '在阿拉贡的弗拉加与安达卢西亚的村庄广场上，激动的人群正把成捆的旧共和国比塞塔纸币、银行债券与地契扔进熊熊燃烧的篝火。老人与孩子们围着火堆跳舞，高喊着：“金钱已死，剥削永远结束了！”；在巴塞罗那、毕尔巴鄂与奥维耶多，没有了政府部委特派员的掣肘，CNT 的红黑旗帜已经插遍了每一座矿井、炼钢厂与发电站；在马德里深夜街头，小市民在街……然而，当篝火熄灭后，严酷的现实问题摆在了全国经济全会的面前：阿斯图里亚斯的矿工需要瓦伦西亚的柑橘与小麦，巴塞罗那的纺织厂需要英法的进口棉花与比斯开湾的钢铁。在彻底消灭了资本家与国家财政部之后，重工业应当如何组织生产？在废除了万恶的旧货币之后，千万工农之间又该如何分配劳动果实？',
  options: [
    {
      text: 'Create the National Economic Committee and coordinate through the industrial unions.',
      textZh: '成立全国经济委员会，推行产业工会统筹',
      subtitle: 'The National Confederation of Industry takes over all heavy industry.',
      subtitleZh: '“由全国产业联合会接管全部重工业”',
      effect: state => nextEvent(iberianFinalReckoning, settlementPatch(state, { economy: 'union_coordination' })),
    },
    {
      text: 'Decree the Total Socialization Act and hand industry to the unions.',
      textZh: '颁布《全面社会化法令》，移交产业工会集体自管',
      subtitle: 'The mines belong to the miners, the factories to the workers!',
      subtitleZh: '“矿山属于矿工，工厂属于工人！”',
      condition: state => state.iberianSettlement?.regime === 'free_commune_federation',
      unavailableSubtitle: () => 'Requires the Free Commune Federation.',
      unavailableSubtitleZh: () => '需要已确立自由公社联邦政体。',
      effect: state => nextEvent(iberianFinalReckoning, settlementPatch(state, { economy: 'total_socialization' })),
    },
    {
      text: 'Let an economic committee formed by the Revolutionary Committee run the economy for now.',
      textZh: '由革命委员会组建经济委员会暂时执掌经济',
      subtitle: 'Grasp revolution, promote production; dig deep and store grain.',
      subtitleZh: '“抓革命，促生产。深挖洞 广积粮”',
      condition: state => state.iberianSettlement?.regime === 'revolutionary_committee',
      unavailableSubtitle: () => 'Requires the National Revolutionary Committee.',
      unavailableSubtitleZh: () => '需要已确立革命军事委员会政体。',
      effect: state => nextEvent(iberianFinalReckoning, settlementPatch(state, { economy: 'committee_directive' })),
    },
  ],
};

export const iberianFinalReckoning: GameEvent = {
  id: 'iberian_final_reckoning',
  meta: { ...meta, flow: 'inline.node' },
  title: 'The Final Reckoning',
  titleZh: '总清算',
  description: 'On the walls of Barcelona’s Laietana the dense bullet holes of May 1937 are still visible. There the old Republic’s politicians, the Catalan nationalist police and the Stalinists opened fire on anarchist workers in the May barricades, and were finally crushed by the furious confederal militia. Now it is not only Franco’s fascists but the old government bureaucrats, the secret police (SIM) and bourgeois politicians who shot the revolution in the back who are in the cells. In this red-and-black Iberia, where the state machine and parliament have been torn out by the roots, no traditional party that exists to “contest state power” has soil left to stand on. Facing the political remains of the old era — and the few revolutionary allies who bled beside the CNT in May, such as the POUM and the left-wing UGT rank and file — the plenum must pass final judgement.',
  descriptionZh: '巴塞罗那莱埃塔纳大街的墙面上，至今还留着1937年五月那场生死决战的密集弹孔。在这里，旧共和国的政客、加泰罗尼亚民族主义警察与斯大林主义者在五月的街垒战中向无政府主义工人开了枪，并最终在反扑中被愤怒的邦联民兵彻底击溃。如今，不仅是佛朗哥的法西斯党徒，连同那些曾在五月事件中背刺革命的旧政府官僚、秘密警察（SIM）与资产阶级政客，都已成为阶下囚。在这个国家机器与议会制度已经被连根拔起的红黑伊比利亚，任何以“争夺国家政权”为目的的传统政党都失去了存在的土壤。面对旧时代的政治遗骸，以及曾在五月街垒上与 CNT 并肩流血的少数革命盟友（如 POUM 与左翼 UGT 基层工人），全会必须做出最终的裁决。',
  options: [
    {
      text: 'Remember the blood of the May barricades; defend the principles of freedom!',
      textZh: '铭记五月街垒的鲜血，捍卫自由原则！',
      subtitle: 'Let them go their own way.',
      subtitleZh: '“随他们去吧”',
      effect: state => nextEvent(iberianArmyQuestion, {
        ...excludeParties(state, ALL_PARTIES.filter(party => party !== 'POUM' && party !== 'PS')),
        ...settlementPatch(state, { partyPolicy: 'free_principles' }),
      }),
    },
    {
      text: 'Abolish the empty shells of all parties!',
      textZh: '废除一切政党躯壳！',
      subtitle: 'Abolish every party name; merge into the new society as unions and cooperatives!',
      subtitleZh: '“取缔一切政党名号，以产业工会与合作社的身份融入新社会！”',
      effect: state => nextEvent(iberianArmyQuestion, {
        ...excludeParties(state, [...RIGHT_WING_PARTIES, ...LEFT_REPUBLICAN_PARTIES]),
        partyAliases: { ...state.partyAliases, ...PARTY_ALIASES },
        ...settlementPatch(state, { partyPolicy: 'party_shells' }),
      }),
    },
    {
      text: 'All power to the CNT and the Revolutionary Committees!',
      textZh: '一切权力归于全劳联和革命委员会！',
      subtitle: 'Dissolve every old party and parallel union; all Iberian workers unite under the red-and-black flag!',
      subtitleZh: '“解散一切旧政党与平行工会，全伊比利亚的劳动者团结在红黑旗下！”',
      effect: state => {
        const ugtShare = state.unionShare?.UGT ?? 0;
        return nextEvent(iberianArmyQuestion, {
          ...excludeParties(state, ALL_PARTIES),
          ...applyUnionShareDelta(state, { CNT: ugtShare, UGT: -ugtShare }),
          ...settlementPatch(state, { partyPolicy: 'cnt_only' }),
        });
      },
    },
  ],
};

export const iberianArmyQuestion: GameEvent = {
  id: 'iberian_army_question',
  meta: { ...meta, flow: 'inline.leaf' },
  title: 'Red Army or Black Army?',
  titleZh: '红军还是黑军？',
  description: 'The Militarization Decree was torn to shreds in the flames. Madrid and Burgos were taken by the Iron Column under the red-and-black skull flag, the reborn Durruti Column, the Ortiz Column and the battle-hardened confederal militia divisions of Cipriano Mera. With the civil war over, this legendary army that once swore “never to wear a regular uniform for a single day” stands at a historical crossroads. On one side, delegates of the radical anarchist Iron Column bang the table and demand the highest anarchist oath be fulfilled at once: smash the last prison, dissolve any permanent general staff, and return the weapons to every local commune. On the other, Jaime Balius of the Friends of Durruti and Mera, a militia commander who survived brutal trench warfare, warn the plenum: British and French imperialism and exiled remnants are watching from beyond the Pyrenees. If the million-strong army is broken up into village guerrillas now, the free communes will bleed dry in the next imperialist intervention.',
  descriptionZh: '《民兵军事化法令》早在熊熊烈火中就被撕得粉碎。攻克马德里与布尔戈斯的是高举红黑骷髅旗的“铁纵队（Columna de Hierro）”、浴火重生的“杜鲁蒂纵队”、奥尔蒂斯纵队以及西普里亚诺·梅拉麾下身经百战的邦联民兵师团。随着内战结束，这支曾发誓“绝不穿一天正规军军服”的传奇大军站在了历史的十字路口。一方面，由激进无政府主义者组成的“铁纵队”代表在大会上拍案怒吼，要求立刻兑现无政府主义的最高誓言：砸碎最后一座监狱，解散任何常设军事参谋部，让武器回归每一个地方公社；另一方面，“杜鲁蒂之友”的海梅·巴柳斯与经历过残酷阵地战的民兵指挥官梅拉则警告全会：英法帝国主义与流亡残匪正在比利牛斯山外虎视眈眈，如果此刻把百万大军拆散成各自为战的乡村游击队，自由公社将在下一次帝国主义干涉中流尽鲜血！',
  options: [
    {
      text: 'Long live the Revolutionary Committees!',
      textZh: '革命委员会万岁！',
      subtitle: 'All power to the Revolutionary Committees.',
      subtitleZh: '“一切权力归革命委员会”',
      condition: state => state.iberianSettlement?.regime === 'revolutionary_committee',
      unavailableSubtitle: () => 'Requires the National Revolutionary Committee.',
      unavailableSubtitleZh: () => '需要政体为革命委员会。',
      effect: state => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          militia_legality_law: ensureLawAtLeast(state, 'militia_legality_law', 4),
          army_reform_law: ensureLawAtLeast(state, 'army_reform_law', 4),
          security_corps_law: ensureLawAtLeast(state, 'security_corps_law', 4),
          public_order_law: ensureLawAtLeast(state, 'public_order_law', 4),
        },
        ...settlementPatch(state, {
          military: 'committee_command', completedAt: { year: state.year, month: state.month },
        }),
        currentEvent: null,
      }),
    },
    {
      text: 'Dissolve the standing army; keep only the confederal militia and local defence committees.',
      textZh: '解散常备军体制，只保留邦联民兵与地方防卫委员会',
      subtitle: 'A people in arms is the strongest shield of the commune.',
      subtitleZh: '“武装起来的人民本身就是公社最坚固的盾牌！”',
      effect: state => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          militia_legality_law: ensureLawAtLeast(state, 'militia_legality_law', 4),
          army_reform_law: ensureLawAtLeast(state, 'army_reform_law', 4),
          security_corps_law: ensureLawAtLeast(state, 'security_corps_law', 4),
          public_order_law: ensureLawAtLeast(state, 'public_order_law', 4),
        },
        ...settlementPatch(state, {
          military: 'confederal_militia', completedAt: { year: state.year, month: state.month },
        }),
        currentEvent: null,
      }),
    },
    {
      text: 'The rise of the Black Army!',
      textZh: '黑军崛起',
      subtitle: 'Weapons — not for conquest, only to break chains!',
      subtitleZh: '“武器，不为征服，只为打破枷锁！”',
      effect: state => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          militia_legality_law: ensureLawAtLeast(state, 'militia_legality_law', 4),
          army_reform_law: ensureLawAtLeast(state, 'army_reform_law', 4),
          // The Black Army keeps the security corps question open; only public order is settled.
          public_order_law: ensureLawAtLeast(state, 'public_order_law', 4),
        },
        ...settlementPatch(state, {
          military: 'black_army', completedAt: { year: state.year, month: state.month },
        }),
        currentEvent: null,
      }),
    },
  ],
};

export const IBERIAN_SETTLEMENT_EVENTS: GameEvent[] = [
  iberianVictoryPrologue,
  iberianBirthOfFreedom,
  iberianFuneralOfMoney,
  iberianFinalReckoning,
  iberianArmyQuestion,
];
