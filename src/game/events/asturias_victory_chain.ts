import type { GameEvent, GameState, LawId, Party } from '../types';
import { getPartySupport } from '../parties';
import { isOrganizationEstablished } from '../organizations';
import { getCoalitionMembers } from '../utils/coalition';
import { ensureLawAtLeast } from '../rules/lawChange';
import {
  ALL_PARTIES, LEFT_REPUBLICAN_PARTIES, REGIONAL_PARTIES, RIGHT_WING_PARTIES,
  excludeParties, mergePartySupport,
} from '../rules/postwarPolitics';

/**
 * Post-victory settlement of the Asturias war.
 *
 * The chain replaces the old one-click `asturias_war_victory` reward. It is pushed
 * directly by `rules/warStatus.ts` and then advances through `currentEvent`: prologue →
 * regime → industry → parties → army/militia. The only persisted results are the
 * `asturiasVictory` record, party eligibility/aliases, legislation and coalition state.
 */

const meta = {
  category: 'politics' as const,
  series: ['asturias', 'revolution_settlement'],
  tags: ['politics'],
};

const nextEvent = (state: GameState, event: GameEvent, patch: Partial<GameState> = {}): Partial<GameState> => ({
  ...patch,
  currentEvent: event,
});

const regimePatch = (state: GameState, regime: NonNullable<GameState['asturiasVictory']>['regime']): Partial<GameState> => ({
  asturiasVictory: { ...(state.asturiasVictory ?? { regime }), regime },
});

const raiseLaws = (state: GameState, levels: Partial<Record<LawId, number>>): GameState['domesticPolicy'] => {
  const domesticPolicy = { ...state.domesticPolicy };
  for (const [law, level] of Object.entries(levels) as Array<[LawId, number]>) {
    domesticPolicy[law] = ensureLawAtLeast(state, law, level);
  }
  return domesticPolicy;
};

export const asturiasVictoryPrologue: GameEvent = {
  id: 'asturias_victory_prologue',
  meta: { ...meta, flow: 'inline.root' },
  title: 'Victory of Dynamite and Coal Dust',
  titleZh: '雷管与煤灰之胜',
  description: 'Madrid, the Puerta del Sol and the old Interior Ministry. Cold autumn rain washes the cobbles, but it cannot quench the fire burning in the city. Three days ago an armoured train carrying the Asturian miners’ Red Guard broke the last government line and entered the northern station, its whistle screaming; the right-wing cabinet has scattered. The square is packed. Miners from Mieres and Langreo still wear coal-blackened work clothes, dynamite cartridges roped across their chests. Beside them stand CNT militia in red-and-black caps from Barcelona and Zaragoza, and Madrid railway strikers with red armbands. A huge banner hangs from the Ministry balcony, painted in blood-red letters with the slogan born on the barricades of Oviedo: “¡U.H.P.! — Uníos, Hermanos Proletarios!” In the old minister’s office, muddy boots stand on an expensive Persian carpet. The Asturian commander throws a bullet-scarred mining helmet onto the mahogany table, then turns to help Francisco Largo Caballero, just released from prison by the workers. Joaquín Maurín holds a thick bundle of telegrams from Barcelona, Bilbao and Seville: “The barricades are won, comrades, but the real test has only begun. The workers’ committees and union delegates from across the country are here. What kind of new power are we going to build on this land?”',
  descriptionZh: '马德里，太阳门广场与原内政部大楼。寒冷的秋雨冲刷着马德里街头的石板路，却浇不灭整座城市沸腾的烈火。三天前，当满载阿斯图里亚斯矿工赤卫队的铁甲列车冲破政府军最后的防线、鸣着凄厉的长笛驶入北方火车站时，共和派右翼内阁便已作鸟兽散。此时此刻，太阳门广场上人山人海。来自米耶雷斯与兰格雷奥的矿工们还穿着被煤灰染黑的工装，胸前挂着一排排用粗麻绳捆扎的矿山雷管；他们的身旁，是戴着红黑双色船形帽的巴塞罗那与萨拉戈萨邦联民兵，以及手臂上缠着红布条的马德里铁路罢工工人。一面硕大的横幅从内政部的阳台上垂下，上面用鲜红的油漆刷着那句在奥维耶多街垒中诞生的神圣口号——“¡U.H.P.!（无产阶级兄弟联合起来！）”。在原内政部部长办公室里，昂贵的波斯地毯上踩满了沾着泥巴与煤渣的军靴。阿斯图里亚斯起义指挥官将一顶布满弹痕的矿工安全帽扔在红木长桌上，转头前去搀扶刚刚从监狱被工人迎出的弗朗西斯科·拉尔戈·卡巴列罗；站在窗边的何塞·玛丽亚·马丁内斯则焦急地等待正与赶来会师的布埃纳文图拉·杜鲁蒂。听到佩尼亚的话，马丁内斯转过身，正准备拍拍腰间的步枪枪托时，华金·毛林手里拿着厚厚一沓来自巴塞罗那、毕尔巴鄂与塞维利亚的罢工委员会急电：“同志们，街垒的战斗已经赢了，但真正的考验刚刚开始。全国各地的工农委员会与产业工会代表已经抵达马德里——在十月革命的烈火彻底吞噬旧秩序之后，我们究竟要在这片土地上建立怎样的新政权？”',
  options: [{
    text: 'Convene the Oviedo–Madrid National Workers’ Alliance Victory Congress!',
    textZh: '召开奥维耶多-马德里全国工人同盟胜利代表大会！',
    subtitle: 'The miners’ dynamite has shattered the old world; history will now be written by the workers themselves.',
    subtitleZh: '“矿工的雷管已经炸碎了旧世界，历史将由劳动者亲手书写！”',
    effect: state => nextEvent(state, workersAllianceVictory),
  }],
};

export const workersAllianceVictory: GameEvent = {
  id: 'workers_alliance_victory',
  meta: { ...meta, flow: 'inline.node' },
  title: 'The Victory of the Workers’ Alliance',
  titleZh: '工人联盟的胜利',
  description: 'The broken spire of Oviedo Cathedral still smokes, but the century-old gloom over the Iberian Peninsula has been blasted apart by the miners’ dynamite. From the black pitheads of Mieres to the barricades of Barcelona’s Laietana and the cheers of the Puerta del Sol, the slogan written in blood — “Uníos, Hermanos Proletarios!” — has become a victory song across the country. The parliament of bankers, priests and Radical politicians has been taken over by the Red Guard and the confederal militia. Workers’ and peasants’ delegates, still covered in coal dust and gunpowder, push open the gilded doors and tread on torn republican decrees and royalist flags. The old world has collapsed in the fire of October. Amid the deafening “Internationale” and “A las Barricadas”, history has handed the pen to the victors: what new world shall we forge on this blood-soaked land?',
  descriptionZh: '奥维耶多大教堂残破的尖顶仍在冒着青烟，笼罩在伊比利亚半岛上空的百年阴霾已被矿工手中的雷管彻底炸碎。从米耶雷斯漆黑的煤矿井口，到巴塞罗那莱埃塔纳大街的街垒，再到马德里太阳门广场的欢呼声浪，那句曾用鲜血书写的口号——“无产阶级兄弟联合起来（¡U.H.P.！）”——如今化作了响彻全境的胜利凯歌。昔日属于银行家、教士与激进党政客的议会大厦已被赤卫队与邦联民兵接管。满身煤灰与火药味的工农代表们推开镀金的大门，脚下是撕碎的旧共和国法令与保皇党旗帜。旧世界已经在十月的烈火中坍塌，而在震耳欲聋的《国际歌》与《走上街垒》的合唱声中，历史将笔交到了胜利者手中：在这片被鲜血浸透的土地上，我们将铸造怎样的新世界？',
  options: [
    {
      text: 'The workers’ socialist republic stands firm!',
      textZh: '工人社会主义共和国屹立不倒！',
      subtitle: 'A red fortress of the proletariat raised on the ruins of the old state.',
      subtitleZh: '“旧国家的废墟上铸就无产阶级的红色堡垒。”',
      effect: state => nextEvent(state, industryTakeover, regimePatch(state, 'council_republic')),
    },
    {
      text: 'The free commune federation will bring liberation to the workers!',
      textZh: '自由公社联邦将为工人带来解放！',
      subtitle: 'The dawn of libertarian communism has arrived.',
      subtitleZh: '“自由共产主义的曙光已经降临！”',
      condition: state => getPartySupport(state, 'CNT_FAI') > 75,
      unavailableSubtitle: () => 'Requires CNT-FAI national support above 75%.',
      unavailableSubtitleZh: () => '需要 CNT-FAI 全国支持率大于 75%。',
      effect: state => nextEvent(state, industryTakeover, regimePatch(state, 'free_commune_federation')),
    },
    {
      text: 'The Iberian Federal Republic will guarantee freedom for every region!',
      textZh: '伊比利亚联邦共和国将为各地区自由提供保障！',
      subtitle: 'A left-wing federal republic breaks Madrid’s centralism and unites nations and workers freely.',
      subtitleZh: '“一个打碎马德里集权、各民族与劳动者自由联合的左翼联邦共和国熠熠生辉！”',
      condition: state => isOrganizationEstablished(state, 'PRRevS')
        && state.activeAdvisors.some(advisor => advisor?.faction === 'Jabalistas' || advisor?.faction === 'Treintistas')
        && (state.partyRelations.PSOE ?? 0) > 80
        && (state.partyRelations.ERC ?? 0) > 70,
      unavailableSubtitle: () => 'Requires the PRRevS, a Jabalí or Treintista advisor, PSOE relations above 80 and ERC relations above 70.',
      unavailableSubtitleZh: () => '需要 PRRevS 已成立、顾问栏中有“野猪派”或“三十人派”顾问、CNT 与 PSOE 关系大于 80、CNT 与 ERC 关系大于 70。',
      effect: state => nextEvent(state, industryTakeover, regimePatch(state, 'federal_republic')),
    },
  ],
};

export const industryTakeover: GameEvent = {
  id: 'asturias_industry_takeover',
  meta: { ...meta, flow: 'inline.node' },
  title: 'Mines and Heavy Industry Taken Over',
  titleZh: '矿山与重工业接管',
  description: 'The first blood of the October revolution was spilled deep in the Asturian coal seams and beside the blazing blast furnaces of the Bay of Biscay. With the British mining magnates, the King’s aristocratic shareholders and the Basque financial oligarchs fleeing north of the Pyrenees, the vast industrial machine has fallen briefly silent. In Oviedo, Bilbao and Sabadell, workers have already painted “People’s Property” on the factory gates, and improvised workers’ patrols guard the furnaces and locomotives day and night. Yet revolutionary enthusiasm alone cannot refine steel, still less dispatch a railway network across the peninsula. Facing mines, arsenals and heavy industry that must be restarted, the economic commissions in Madrid and the industrial union delegates argue across the table: should the means of production belong to a unified workers’ state, or pass directly to the unions on the shop floor?',
  descriptionZh: '十月革命的第一滴血，流在阿斯图里亚斯的煤层深处与比斯开湾炽热的高炉旁。随着英国矿业大亨、阿方索国王的贵族股东以及巴斯克金融寡头狼狈逃往比利牛斯山以北，庞大的工业机器陷入了短暂的轰鸣停滞。在奥维耶多、毕尔巴鄂与萨瓦德尔，工人们已经用红漆在厂门上刷下了“人民财产”的字样，自发组织的工人纠察队正日夜看守着高炉与机车。然而，单凭革命的热情无法提炼钢铁，更无法调度横跨半岛的铁路网。面对急需恢复运转的矿井、兵工厂与重工业命脉，马德里的经济部委与各地的产业工会代表在会议桌上展开了激烈的交锋——生产资料究竟应当归属于统一的工人国家，还是直接交给第一线的产业工会？',
  options: [
    {
      text: 'Create the Supreme Economic Council and collectivize under the state.',
      textZh: '成立最高国民经济委员会，推行集中国有化',
      subtitle: 'Mines, steel and railways must be planned by the workers’ state as a whole.',
      subtitleZh: '“矿山、钢铁与铁路必须收归工人国家统一规划。”',
      condition: state => state.asturiasVictory?.regime === 'council_republic'
        || state.asturiasVictory?.regime === 'federal_republic',
      unavailableSubtitle: () => 'Requires the Council Republic or the Federal Republic.',
      unavailableSubtitleZh: () => '需要已确立委员会共和国政体或联邦共和国政体。',
      effect: state => nextEvent(state, partyFates, {
        asturiasVictory: { ...(state.asturiasVictory ?? { regime: 'council_republic' }), economy: 'state_plan' },
      }),
    },
    {
      text: 'Decree the Total Socialization Act and hand industry to the unions.',
      textZh: '颁布《全面社会化法令》，移交产业工会集体自管',
      subtitle: 'The mines belong to the miners, the factories to the workers!',
      subtitleZh: '“矿山属于矿工，工厂属于工人！”',
      condition: state => state.asturiasVictory?.regime === 'free_commune_federation'
        || state.asturiasVictory?.regime === 'federal_republic',
      unavailableSubtitle: () => 'Requires the Free Commune Federation or the Federal Republic.',
      unavailableSubtitleZh: () => '需要已确立自治公社政体（自由公社联邦）或联邦共和国政体。',
      effect: state => nextEvent(state, partyFates, {
        asturiasVictory: { ...(state.asturiasVictory ?? { regime: 'free_commune_federation' }), economy: 'union_self_management' },
      }),
    },
  ],
};

export const partyFates: GameEvent = {
  id: 'asturias_party_fates',
  meta: { ...meta, flow: 'inline.node' },
  title: 'The Fate of the Parties',
  titleZh: '各政党的命运',
  description: 'The parliament hall that once echoed with bourgeois speeches and dirty deals is empty but for the guards’ footsteps. Gil-Robles’s clerical fascists, Lerroux’s corrupt Radical bureaucrats, and the street thugs of the monarchists and the Falange have all been swept into history’s dustbin as counter-revolutionary criminals. Yet a stack of awkward lists still lies before the revolutionary tribunal: what is to be done with the left-wing middle-class republicans who wavered during the old Republic, the Basque and Catalan regionalists, and the dissident socialist groups that never fully joined the Workers’ Alliance? Or, now that the workers hold power directly, does the party itself — that old political shell — have any reason to exist at all?',
  descriptionZh: '昔日充斥着资产阶级政客冗长演说与肮脏交易的议会大厅，如今只有卫兵沉重的脚步声在回荡。吉尔·罗伯斯的教权法西斯分子、勒鲁瓦腐败透顶的激进党官僚、以及保皇党与长枪党的街头暴徒，都已经作为反革命罪犯被扫进了历史的垃圾堆。但革命的法庭前仍摆放着一叠棘手的名单：那些曾在旧共和国时期摇摆不定的左翼中产阶级共和党人、巴斯克与加泰罗尼亚的地方民族主义者，以及那些并未完全并入工人联盟的异见社会主义团体，应当如何在新秩序中自处？甚或说，在劳动者已经直接掌握权力的今天，“政党”这一旧时代的政治躯壳本身，是否还有继续存在的必要？',
  options: [
    {
      text: 'Forge a broad left-democratic front.',
      textZh: '铸就广泛的左翼民主阵线',
      subtitle: 'Allow left republicans and regional parties to exist.',
      subtitleZh: '“允许左翼共和派与地方党派存在。”',
      effect: state => nextEvent(state, armyOrMilitia, {
        ...excludeParties(state, [...RIGHT_WING_PARTIES, 'UR']),
        classes: mergePartySupport(state, 'UR', 'IR'),
        asturiasVictory: { ...(state.asturiasVictory ?? { regime: 'council_republic' }), partyPolicy: 'broad_front' },
      }),
    },
    {
      text: 'End bourgeois republican politics and ally with the regions.',
      textZh: '终结资产阶级共和政治，联合地方自治力量',
      subtitle: 'Azaña and his soft-handed intellectuals have no place left to stand.',
      subtitleZh: '“阿萨尼亚那帮软弱的书生已经没有立足之地了！”',
      effect: state => nextEvent(state, armyOrMilitia, {
        ...excludeParties(state, [...RIGHT_WING_PARTIES, ...LEFT_REPUBLICAN_PARTIES]),
        asturiasVictory: { ...(state.asturiasVictory ?? { regime: 'council_republic' }), partyPolicy: 'workers_with_regions' },
      }),
    },
    {
      text: 'Keep only the proletarian parties.',
      textZh: '只保留无产阶级政党',
      subtitle: 'Neither the bourgeois gentlemen of Madrid nor the regionalist opportunists of Bilbao and Barcelona will touch the workers’ power.',
      subtitleZh: '“马德里的资产阶级老爷，还是毕尔巴鄂与巴塞罗那的地方民族主义投机客，都休想再染指工人的政权！”',
      effect: state => nextEvent(state, armyOrMilitia, {
        ...excludeParties(state, [...RIGHT_WING_PARTIES, ...LEFT_REPUBLICAN_PARTIES, ...REGIONAL_PARTIES]),
        asturiasVictory: { ...(state.asturiasVictory ?? { regime: 'council_republic' }), partyPolicy: 'workers_only' },
      }),
    },
    {
      text: 'Establish the absolute dictatorship of the Workers’ Alliance.',
      textZh: '确立工人联盟的绝对排他专政',
      subtitle: 'Those who stood by while the barricades bled have no right to share the victory feast. Outside the Alliance, no party is legal.',
      subtitleZh: '“在十月街垒流血时袖手旁观的人，没有资格在胜利的宴席上分一杯羹！联盟之外，再无合法政党！”',
      effect: state => {
        const coalition = state.activeCoalitions.find(item => item.activeId === 'workers_alliance');
        const members = coalition ? getCoalitionMembers(state, coalition) : [];
        const allowed = new Set(members.filter((member): member is Party => member !== 'CNT_FAI'));
        const banned = ALL_PARTIES.filter(party => !allowed.has(party));
        return nextEvent(state, armyOrMilitia, {
          ...excludeParties(state, banned),
          asturiasVictory: { ...(state.asturiasVictory ?? { regime: 'council_republic' }), partyPolicy: 'alliance_dictatorship' },
        });
      },
    },
    {
      text: 'Parties are breeding grounds for bureaucrats and careerists!',
      textZh: '政党是滋生官僚与野心家的温床！',
      subtitle: 'Abolish all parties; all power to the workers’ committees and the syndicates!',
      subtitleZh: '“废除一切政党，一切权力归工人委员会与工团辛迪加！”',
      condition: state => state.asturiasVictory?.regime === 'free_commune_federation'
        || state.asturiasVictory?.regime === 'federal_republic',
      unavailableSubtitle: () => 'Requires the Free Commune Federation or the Federal Republic.',
      unavailableSubtitleZh: () => '需要已确立自治公社政体（自由公社联邦）或联邦共和国政体。',
      effect: state => nextEvent(state, armyOrMilitia, {
        ...excludeParties(state, ALL_PARTIES, ['PSOE', 'PNV', 'POUM', 'ERC']),
        partyAliases: {
          ...state.partyAliases,
          PSOE: { en: 'UGT (General Union of Workers)', zh: '劳动者总工会 (UGT)', shortEn: 'UGT', shortZh: 'UGT' },
          PNV: { en: 'STV (Basque Workers’ Solidarity)', zh: '巴斯克工人团结工会 (STV)', shortEn: 'STV', shortZh: 'STV' },
          POUM: { en: 'FOUS (United Workers’ Syndicalist Federation)', zh: '工团统一工人联合会 (FOUS)', shortEn: 'FOUS', shortZh: 'FOUS' },
          ERC: { en: 'ERC-LU (Left Union of Catalan Tenant Farmers)', zh: '加泰罗尼亚左翼佃农联合会 (ERC-LU)', shortEn: 'ERC-LU', shortZh: 'ERC-LU' },
        },
        asturiasVictory: { ...(state.asturiasVictory ?? { regime: 'free_commune_federation' }), partyPolicy: 'no_parties' },
      }),
    },
  ],
};

export const armyOrMilitia: GameEvent = {
  id: 'asturias_army_or_militia',
  meta: { ...meta, flow: 'inline.leaf' },
  title: 'People’s Army or Militia?',
  titleZh: '人民军还是民兵？',
  description: 'This revolution was won by miners with dynamite roped to their chests, railway workers who tore up the tracks, and mutinous soldiers who turned their rifles on reactionary officers. The civil war is over, but Madrid and Barcelona are still armed camps: UGT Red Guards with red armbands, CNT confederal militia columns under red-and-black flags, and the former Republican regulars who swore loyalty to the revolution all share the same barracks. Remnants of the Army of Africa still watch from exile, and the imperial powers mass on the frontier. Yet the argument over who will hold the guns has reached the point of bayonets: should we follow the October example and forge militia and old army into a disciplined regular Red Army under central command? Or smash the standing army and the officer corps altogether, and entrust the defence of the revolution to the self-armed free militia?',
  descriptionZh: '这场革命是由手握粗麻绳捆绑雷管的矿工、撬毁铁轨的铁路工人、以及调转枪口击毙反动军官的起义士兵共同赢下的。如今，内战的硝烟虽已散去，但马德里与巴塞罗那的街头依然武装林立：佩戴红袖标的 UGT 工农赤卫队、挥舞红黑三角旗的 CNT 邦联民兵纵队，以及宣誓效忠革命的原共和国起义正规军，正混杂在同一座军营之中。流亡海外的非洲军团残余仍在虎视眈眈，欧洲的帝国主义列强更在边境陈兵。然而，关于“谁来握紧枪杆子”的争论已经到了刺刀见红的地步：我们是应当借鉴十月革命的经验，将民兵与旧军队熔铸为一支纪律严明、服从中央指挥的正规工农红军？还是彻底砸碎常备军与军官团的枷锁，将保卫革命的神圣职责完全交给自我武装的自由民兵？',
  options: [
    {
      text: 'Long live the People’s Army!',
      textZh: '人民军万岁！',
      subtitle: 'Without iron discipline there is no stable revolution!',
      subtitleZh: '“没有铁的纪律，就没有稳固的革命！”',
      condition: state => state.asturiasVictory?.regime !== 'free_commune_federation',
      unavailableSubtitle: () => 'The Free Commune Federation will not accept a standing army.',
      unavailableSubtitleZh: () => '自治公社政体（自由公社联邦）不会接受常备军。',
      effect: state => ({
        domesticPolicy: raiseLaws(state, {
          militia_legality_law: 4,
          army_reform_law: 3,
          security_corps_law: 3,
          // "Social security" in the event text maps to the public-order law level.
          public_order_law: 3,
        }),
        asturiasVictory: {
          ...(state.asturiasVictory ?? { regime: 'council_republic' }),
          military: 'people_army',
          completedAt: { year: state.year, month: state.month },
        },
        currentEvent: null,
      }),
    },
    {
      text: 'Dissolve the standing army; keep only the confederal militia and local defence committees.',
      textZh: '解散常备军体制，只保留邦联民兵与地方防卫委员会',
      subtitle: 'A people in arms is the strongest shield of the commune.',
      subtitleZh: '“武装起来的人民本身就是公社最坚固的盾牌！”',
      effect: state => ({
        domesticPolicy: raiseLaws(state, {
          militia_legality_law: 4,
          army_reform_law: 4,
          security_corps_law: 4,
          public_order_law: 4,
        }),
        asturiasVictory: {
          ...(state.asturiasVictory ?? { regime: 'council_republic' }),
          military: 'militia',
          completedAt: { year: state.year, month: state.month },
        },
        currentEvent: null,
      }),
    },
  ],
};

/**
 * Compatibility shim: saves made while the retired one-click victory screen was open
 * still reference `asturias_war_victory`. The definition stays restorable but is never
 * scheduled again; its only option now hands over to the new prologue without the old
 * fervor/armament/resource rewards.
 */
export const legacyAsturiasWarVictory: GameEvent = {
  id: 'asturias_war_victory',
  meta: { ...meta, flow: 'inline.leaf' },
  title: 'Victory of the Workers’ Alliance Government!',
  titleZh: '工人联盟自治政府胜利！',
  description: 'A magnificent proletarian victory that shakes the entire nation! The Workers’ Alliance Autonomous Government has repelled the reactionary forces and secured red Asturias. The working class is exultant — and the question of what comes next can no longer be postponed.',
  descriptionZh: '这是一次震动全国的伟大无产阶级武装胜利！工人联盟自治政府不仅彻底击退了反动派守军，还稳固了对红色阿斯图里亚斯苏维埃的控制！全国工人阶级欢欣鼓舞——而“接下来要建立什么”的问题，已经无法再拖延。',
  options: [{
    text: 'Long live the Red Proletarian Power!',
    textZh: '无产阶级红色政权万岁！',
    subtitle: 'The war is won; the settlement of the revolution begins.',
    subtitleZh: '战争已经胜利，革命的安排现在开始。',
    effect: () => ({ currentEvent: asturiasVictoryPrologue }),
  }],
};

export const ASTURIAS_VICTORY_EVENTS: GameEvent[] = [
  asturiasVictoryPrologue,
  workersAllianceVictory,
  industryTakeover,
  partyFates,
  armyOrMilitia,
  legacyAsturiasWarVictory,
];
