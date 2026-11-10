import type { GameEvent, GameState, OrganizationId } from '../types';
import { isOrganizationEstablished } from '../organizations';
import { setLawLevel } from '../rules/lawChange';
import { mergeMilitiaPoolsIntoStateArmy } from '../rules/armyPools';
import {
  LEFT_REPUBLICAN_PARTIES, REGIONAL_PARTIES, RIGHT_WING_PARTIES,
  excludeParties, mergePartySupport,
} from '../rules/postwarPolitics';

/**
 * Postwar settlement for a Republican civil-war victory in which the CNT did NOT
 * split into the Iberian Defence Committee. Triggered by `nationalist_surrender`
 * and the Carlist-collapse branch of `warStatus`; `checkEndings` defers the normal
 * political endings until `postwarSettlement.completedAt` is written by the final
 * node.
 */

const meta = {
  category: 'politics' as const,
  series: ['civil_war', 'postwar_settlement'],
  tags: ['politics'],
};

const nextEvent = (event: GameEvent, patch: Partial<GameState> = {}): Partial<GameState> => ({
  ...patch,
  currentEvent: event,
});

export const beginPostwarSettlement = (state: GameState): Partial<GameState> => (
  state.postwarSettlement
    ? {}
    : {
        postwarSettlement: { startedAt: { year: state.year, month: state.month } },
        currentEvent: postwarPrologue,
        phase: 'event',
      }
);

export const postwarPrologue: GameEvent = {
  id: 'postwar_cabinet_prologue',
  meta: { ...meta, flow: 'inline.root' },
  title: 'The Last Wartime Cabinet',
  titleZh: '最后一届战时内阁',
  description: 'Spring 1939, Madrid: the bullet-scarred cabinet room of the Prime Minister’s office. Outside, the Castellana is packed with citizens celebrating victory and wounded soldiers leaning on crutches. Trucks carry the injured and captured weapons down the street; lovers — lovers separated by the war — workers and farmers’ daughters, young people turned into soldiers and nurses, embrace one another. But beyond the cheering crowd lie the scorched earth of the University City, ploughing by heavy guns; widows queueing for black bread; and a bridge collapsed in half. Inside the cabinet room the smoke is thick — half of it drifting in from the bonfires where the street is burning fascist flags and other cloth trophies. Indalecio Prieto taps the table, as if to cover his hoarse voice: “Comrades, Burgos has fallen… the war… is over…” Across from him Justice Minister Juan García Oliver grips a brass belt buckle and slams it on the table like a trigger: “The war is over, gentlemen. Or is our revolution finished too? Look out of the window — at those young men on crutches. Did they bleed so that the old republican bureaucrats or Moscow’s advisers could sit back down in the masters’ chairs?” Industry Minister Juan Peiró pushes up his glasses and murmurs: “The war is over… the war is over… where is this state, cast from the blood of the Popular Front and the syndicates, going now?”',
  descriptionZh: '1939年春，马德里，布满弹孔的总理府会议室。窗外，卡斯特利亚纳大道上挤满了庆祝胜利的市民与拄着拐杖的伤兵。卡车拉着伤员、缴获的武装驶过街头，相爱的人们，相爱但因战争分别的人们，工人、农户的女儿……倏而因战争转为战士和护士的年轻人们，正相拥在一起。但只要视线越过欢呼的人群，就能看到大学城被重炮犁平的焦土、排着长队等待配给黑面包的寡妇，以及坍塌过半的大桥。会议室里，烟雾缭绕，一半是街头忘乎所以的人们焚烧法西斯旗帜和其他布匹战利品的篝火那飘来的。因达莱西奥·普列托敲了敲桌子，仿佛要为了掩盖他声音沙哑：“同志们，布尔戈斯已经陷落……战争……结束了……”坐在他对面的司法部长胡安·加西亚·奥利弗手心握着一块铜制腰带扣，重重拍在桌面上，像突然扣动扳机一样：“战争结束了，先生。还是说我们的革命也一起玩完了？往窗外看看，看看哪些拄着拐杖的青年人们，他们是为了让共和党的旧官僚或者莫斯科的顾问重新坐回老爷椅上，才在这里流血流泪吗？”工业部长胡安·佩罗推了推眼镜，语气沉稳低声念叨：“战争结束了……战争结束了……这个用人民阵线与工团鲜血浇铸的政权，究竟要走向何方？”',
  options: [{
    text: 'Convene the National Postwar Reconstruction and Committees Congress!',
    textZh: '召开全国战后重建与各委员会代表大会！',
    subtitle: 'From the trenches of Madrid to the barricades of Barcelona, the survivors will decide what the new Spain looks like.',
    subtitleZh: '“从马德里的战壕到巴塞罗那的街垒，活下来的人将共同决定新西班牙的模样。”',
    effect: () => nextEvent(antifascistFrontFate),
  }],
};

export const antifascistFrontFate: GameEvent = {
  id: 'postwar_antifascist_front',
  meta: { ...meta, flow: 'inline.node' },
  title: 'The Fate of the Anti-Fascist Front',
  titleZh: '反法西斯阵线的命运',
  description: 'The glass dome of the Madrid parliament shattered in the bombing two years ago; workers have stretched huge red and red-black canvas over the opening. Sunlight filters through in a blood-red glow, illuminating a gathering unlike any before: gloomy left-republican lawyers, Basque nationalists in berets, UGT miners with red neckerchiefs, militia commanders in leather jackets, and the CNT and FAI delegations arguing across half the chamber. Some delegates — Santillán, Montseny — have still not arrived because of the transport crisis. With the fascist threat gone, the historic gulf between parliamentary institutions, soviet committees and anarchist free communes can no longer be hidden behind “wartime unity”. Every factory and field in Spain is waiting for the result of this congress — or for a new insurrection.',
  descriptionZh: '马德里议会大厦的玻璃穹顶在两年前的轰炸中震碎，如今工人们用巨大的红布与红黑双色帆布暂时遮蔽了天顶。阳光透过帆布洒下血红色的光晕，照亮了大厅里空前绝后的代表阵容：愁容满面的左翼共和派律师、戴贝雷帽的巴斯克民族主义者、手握红色领巾的 UGT 矿工代表、身着皮夹克的民兵指挥官，以及占据了整整半边会场喋喋不休的 CNT和FAI成员。还有许多代表，例如桑蒂利安、蒙特赛尼等仍然因为交通原因未能赶到现场。如今，法西斯的威胁已经灰飞烟灭，横亘在议会制度、苏维埃委员会与无政府自由公社之间的历史鸿沟，再也无法用“战时团结”来掩盖。全西班牙的工厂与田野都在等待这场大会的结果，或者是一场新的暴乱......',
  options: [
    {
      text: 'The workers’ parliamentary republic will secure the fruits of anti-fascist victory!',
      textZh: '工人议会共和国将巩固反法西斯胜利果实！',
      subtitle: 'The Popular Front’s blood has washed away the weakness of the old constitution.',
      subtitleZh: '“人民阵线的浴血奋战洗刷了旧宪法的软弱！”',
      effect: state => nextEvent(postwarIndustry, {
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), regime: 'parliamentary_republic' },
      }),
    },
    {
      text: 'The workers’ socialist republic stands firm!',
      textZh: '工人社会主义共和国屹立不倒！',
      subtitle: 'A red fortress of the proletariat raised on the ruins of the old state.',
      subtitleZh: '“旧国家的废墟上铸就无产阶级的红色堡垒。”',
      effect: state => nextEvent(postwarIndustry, {
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), regime: 'council_republic' },
      }),
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
      effect: state => nextEvent(postwarIndustry, {
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), regime: 'federal_republic' },
      }),
    },
  ],
};

export const postwarIndustry: GameEvent = {
  id: 'postwar_industry_settlement',
  meta: { ...meta, flow: 'inline.node' },
  title: 'Mines, Heavy Industry and the Wartime Collectivization Legacy',
  titleZh: '矿山、重工业与战时集体化遗产',
  description: 'To keep the front supplied with tens of millions of bullets a month, Spain’s economy underwent an unprecedented transformation: in Catalonia and Aragon workers took over textile mills, trams and farms; inside the central government, Industry Minister Juan Peiró and the Finance Ministry issued emergency decrees placing strategic mines, the power grid and foreign heavy industry under state intervention. Now the guns are silent and the war economy must convert to peacetime construction. At the Bilbao steelworks, the Río Tinto copper mines and the Catalan hydroelectric station Peiró himself planned, ministry commissioners and union management committees both present takeover papers. Should wartime “state intervention” harden into a permanent state-planned economy, or retire and hand all heavy industry and collective farms to the unions and communes?',
  descriptionZh: '内战期间，为了支撑前线每月数千万发子弹的消耗，西班牙的经济经历了一场史无前例的改造：在加泰罗尼亚与阿拉贡，工人们自发接管了纺织厂、有轨电车与农庄；而在中央政府内部，出任工业部长的胡安·佩罗与财政部先后颁布了一系列战时紧急法令，对战略矿山、电力网与外资重工业实施了国家干预与接管。如今，前线的硝烟散去，战时军工体系面临向和平建设的全面转型。在毕尔巴鄂的炼钢厂、里奥廷托的铜矿以及佩罗曾亲自规划的加泰罗尼亚水电站里，部委特派员与工会管理委员会同时拿出了接管文件——战时的“国家干预”究竟应当固化为永久的国有计划经济，还是应当功成身退，将全部重工业与集体农庄徹底移交给工会与公社？',
  options: [
    {
      text: 'Create the Supreme Economic Council and collectivize under the state.',
      textZh: '成立最高国民经济委员会，推行集中国有化',
      subtitle: 'Mines, steel and railways must be planned by the workers’ state as a whole.',
      subtitleZh: '“矿山、钢铁与铁路必须收归工人国家统一规划。”',
      condition: state => state.postwarSettlement?.regime === 'council_republic'
        || state.postwarSettlement?.regime === 'federal_republic',
      unavailableSubtitle: () => 'Requires the Council Republic or the Federal Republic.',
      unavailableSubtitleZh: () => '需要已确立委员会共和国政体或联邦共和国政体。',
      effect: state => nextEvent(postwarParties, {
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), economy: 'state_plan' },
      }),
    },
    {
      text: 'Decree the Total Socialization Act and hand industry to the unions.',
      textZh: '颁布《全面社会化法令》，移交产业工会集体自管',
      subtitle: 'The mines belong to the miners, the factories to the workers!',
      subtitleZh: '“矿山属于矿工，工厂属于工人！”',
      condition: state => state.postwarSettlement?.regime === 'free_commune_federation'
        || state.postwarSettlement?.regime === 'federal_republic',
      unavailableSubtitle: () => 'Requires the Free Commune Federation (autonomous commune) or the Federal Republic.',
      unavailableSubtitleZh: () => '需要已确立自治公社政体（自由公社联邦）或联邦共和国政体。',
      effect: state => nextEvent(postwarParties, {
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), economy: 'union_self_management' },
      }),
    },
    {
      text: 'Leave the wartime mixed economy to parliament and collective bargaining.',
      textZh: '把战时混合体制留给议会与集体谈判',
      subtitle: 'State intervention and union self-management coexist until the new legislature decides.',
      subtitleZh: '“国家干预与工会自管并存，交由新议会立法决定。”',
      effect: state => nextEvent(postwarParties, {
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), economy: 'mixed_economy' },
      }),
    },
  ],
};

export const postwarParties: GameEvent = {
  id: 'postwar_party_fates',
  meta: { ...meta, flow: 'inline.node' },
  title: 'The Fate of the Parties',
  titleZh: '各政党的命运',
  description: 'Outside the Model Prison in Madrid, the People’s Revolutionary Tribunal founded by former CNT justice minister Juan García Oliver is holding the last public trials of war criminals. Bankers who financed the rebels, clerical politicians who served as a “fifth column” in the rear, and Carlist and Falangist officers with workers’ blood on their hands are marched before the dock by armed militia. No one in the Republic objects to rooting out this fascist cancer. But once the courtroom doors close, the real political storm begins. Three years of civil war tested not only the enemy but the fractures inside the Popular Front: what place will the moderate republicans who tried to compromise with the rebels in July 1936, the Basque (PNV) and Catalan (ERC) regionalists who fought Franco while guarding their own property, and the left-wing workers’ parties that faced each other in the May Days have in the new order? And now that the unions have taken over half the social functions of Spain, should the party itself still exist?',
  descriptionZh: '马德里示范监狱外的广场上，由原 CNT 司法部长胡安·加西亚·奥利弗创立的“人民革命法庭”正在进行最后一批战犯公审。曾为叛军提供资助的银行大亨、在后方充当“第五纵队”的教权派政客、以及手上沾满工农鲜血的卡洛斯派与长枪党军官，正被荷枪实弹的民兵押上审判席。对于彻底铲除这些右翼法西斯毒瘤，整个共和国没有任何人提出异议。然而，当法庭的铁门关闭后，真正的政治风暴才刚刚开始。三年的内战不仅检验了敌我，也暴露了人民阵线内部的裂痕：那些在1936年7月曾企图与叛军妥协的温和共和派、在战争中既抗击佛朗哥又时刻护卫自身私有财产的巴斯克（PNV）与加泰罗尼亚（ERC）地方民族党派、以及在“五月事件”中曾剑拔弩张的各左翼工人政党，在战后的新秩序中应当处于什么位置？甚至，当工会已经接管了半个西班牙的社会职能，“政党”本身是否还应该存在？',
  options: [
    {
      text: 'Forge a broad left-democratic front.',
      textZh: '铸就广泛的左翼民主阵线',
      subtitle: 'Allow left republicans and regional parties to exist.',
      subtitleZh: '“允许左翼共和派与地方党派存在。”',
      effect: state => nextEvent(veteransReturn, {
        ...excludeParties(state, [...RIGHT_WING_PARTIES, 'UR']),
        classes: mergePartySupport(state, 'UR', 'IR'),
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), partyPolicy: 'broad_front' },
      }),
    },
    {
      text: 'End bourgeois republican politics and ally with the regions.',
      textZh: '终结资产阶级共和政治，联合地方自治力量',
      subtitle: 'Azaña and his soft-handed intellectuals have no place left to stand.',
      subtitleZh: '“阿萨尼亚那帮软弱的书生已经没有立足之地了！”',
      effect: state => nextEvent(veteransReturn, {
        ...excludeParties(state, [...RIGHT_WING_PARTIES, ...LEFT_REPUBLICAN_PARTIES]),
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), partyPolicy: 'workers_with_regions' },
      }),
    },
    {
      text: 'Keep only the proletarian parties.',
      textZh: '只保留无产阶级政党',
      subtitle: 'Neither the bourgeois gentlemen of Madrid nor the regionalist opportunists of Bilbao and Barcelona will touch the workers’ power.',
      subtitleZh: '“马德里的资产阶级老爷，还是毕尔巴鄂与巴塞罗那的地方民族主义投机客，都休想再染指工人的政权！”',
      effect: state => nextEvent(veteransReturn, {
        ...excludeParties(state, [...RIGHT_WING_PARTIES, ...LEFT_REPUBLICAN_PARTIES, ...REGIONAL_PARTIES]),
        postwarSettlement: { ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }), partyPolicy: 'workers_only' },
      }),
    },
  ],
};

const MILITIA_ORGANIZATIONS: OrganizationId[] = [
  'DC', 'PSOE_MILITIA', 'MAOC', 'FIFTH_REGIMENT', 'POUM_MILITIA',
];

export const veteransReturn: GameEvent = {
  id: 'postwar_veterans_return',
  meta: { ...meta, flow: 'inline.leaf' },
  title: 'The Veterans’ Return: Reorganizing the People’s Army, Mixed Brigades and Confederal Militia',
  titleZh: '老兵的归途——人民军、混合旅与邦联民兵的整编',
  description: 'The platforms of Madrid’s Atocha station are packed. Special trains hiss white steam as they carry thousands of weathered front-line soldiers home. But the mood on the platform is suffocating: on one side stand the Republican People’s Army and the elite Assault Guard in crisp khaki, wearing red stars and rank insignia, under General Staff command; on the other are anarchist veterans who, though they accepted the “26th Division” (the old Durruti Column) and “28th Division” (the old Ascaso Column) during the war, tore off their insignia on the day it ended and put their red-and-black scarves and workers’ overalls back on. In autumn 1936 the CNT swallowed the bitter Militarization Decree to stop Franco’s Army of Africa; countless free fighters bled under regular-army discipline. Now the war is won, and the veterans of the 26th Division and the Iron Column stand outside the Defence Ministry with polished Mausers, demanding the promised dissolution of the standing army and the Assault Guard. The professional officers of the General Staff and the Communist commissars warn bluntly: disbanding the regular army in a Europe ringed by fascism is slow suicide.',
  descriptionZh: '马德里阿托查火车站的站台上人山人海，专列喷着白色的蒸汽，将成千上万名饱经风霜的前线将士送回后方。但站台上的气氛却微妙得令人窒息：一边是身穿笔挺卡其布军装、佩戴五角红星与军衔领章、由总参谋部统一指挥的共和国人民军与精锐突击卫队；另一边则是虽然在战时接受了“第26师（原杜鲁蒂纵队）”、“第28师（原阿斯卡索纵队）”番号，却在战争结束当天就扯掉军衔、重新换上黑红双色围巾与工人背带裤的无政府主义老兵。1936年秋，为了挡住佛朗哥的非洲军团，CNT 含泪接受了惨痛的《民兵军事化法令》，无数自由战士在正规军的军纪下流血牺牲。如今战争已经赢下，第26师与“铁纵队”的老兵们正手握擦得锃亮的毛瑟步枪围在国防部大楼外高喊口号——他们要求立刻兑现战前承诺，解散常备军与突击卫队；而总参谋部的职业军官与共产党政委则严词警告：在法西斯环伺的欧洲，解散正规军无异于慢性自杀！',
  options: [{
    text: 'Elegy for the militia!',
    textZh: '民兵的哀歌！',
    subtitle: 'No more barricades — and no more revolution.',
    subtitleZh: '“再无街垒，也再无革命”',
    effect: state => {
      const organizations = { ...state.organizations };
      for (const id of MILITIA_ORGANIZATIONS) {
        const current = organizations[id];
        if (current?.established) organizations[id] = { ...current, status: 'dissolved' };
      }
      return {
        ...mergeMilitiaPoolsIntoStateArmy(state),
        organizations,
        domesticPolicy: {
          ...state.domesticPolicy,
          // The regular army absorbs the militia pools; the militia legality ladder is broken.
          militia_legality_law: setLawLevel(state, 'militia_legality_law', 0),
          army_reform_law: setLawLevel(state, 'army_reform_law', 3),
          security_corps_law: setLawLevel(state, 'security_corps_law', 3),
          public_order_law: setLawLevel(state, 'public_order_law', 3),
        },
        postwarSettlement: {
          ...(state.postwarSettlement ?? { startedAt: { year: state.year, month: state.month } }),
          military: 'reserve_army',
          completedAt: { year: state.year, month: state.month },
        },
        currentEvent: null,
      };
    },
  }],
};

export const POSTWAR_SETTLEMENT_EVENTS: GameEvent[] = [
  postwarPrologue,
  antifascistFrontFate,
  postwarIndustry,
  postwarParties,
  veteransReturn,
];
