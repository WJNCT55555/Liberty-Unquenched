import { GameEvent } from '../types';
import { adjustFactionInfluence, adjustClassSupport } from '../utils';

export const generalStrikeFails: GameEvent = {
  id: 'general_strike_fails',
  title: 'The Collapsed Strike: General Strike Fails',
  titleZh: '瓦解的罢工：总罢工失败',
  description:
    'The call for an all-out, nation-wide revolutionary general strike has collapsed. Though many of our core comrades responded courageously in Barcelona and Saragossa, the reformist UGT unions refused to mobilize, condemning the action as an "extremist adventure." The state deployed maximum military force and police elements to occupy railways, ports, and key utilities. Left isolated and facing brutal repression, the striking workers were forced to lock themselves back in or return to work. Our bold initiative lies shattered, delivering a devastating blow to our worker confidence and organizational authority.',
  descriptionZh:
    '宣告全国范围革命性总罢工的决定在国家机器与改良派的联合抵制下宣告失败。尽管在巴塞罗那和萨拉戈萨，我们最坚定的同志不畏强权、筑垒响应，但具有改良主义倾向的社会党总工会（UGT）却断然拒绝参与，甚至发表公开谴责，声称这是“无无政府主义的危险投机”。政府随即下达戒严令，派遣大批陆军连队和突击卫队荷枪实弹占领了铁路、港口和各电力厂枢纽。在一片被孤立、被围剿、弹尽粮绝的境地下，多地的罢工工人只得宣告撤退或被捕。这起雄心勃勃的激进大行动遗憾退场，极大幅度地挫伤了工人们的战斗信念和 CNT 的威严值。',
  options: [
    {
      text: 'A bitter setback... We must lick our wounds and reorganize.',
      textZh: '一次沉痛的折卷……我们必须退却、舔舐伤口并重新整顿。',
      effect: (state) => {
        return {
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 30)
          }
        };
      }
    }
  ]
};

export const casasViejas2Insurrection: GameEvent = {
  id: 'casas_viejas_2_insurrection',
  title: 'The Ashes of Seisdedos: Insurrection Massacre',
  titleZh: '塞斯德多斯的余烬：起义惨案',
  description:
    'Our call for revolutionary solidarity further inflamed the barricaded peasants in Casas Viejas, but the government’s response was savage. Assault Guards under Captain Rojas besieged the cottage of Francisco Cruzado, known as "Seisdedos." When Seisdedos and his comrades refused to surrender, the guards set fire to the straw-roofed cabin. As the family and defenders rushed out to escape the roaring flames, they were shot dead in cold blood. Afterwards, the guards rounded up other local suspects, led them to the smoking ashes of the cabin, and executed them summarily. In total, 24 villagers lie dead, their bodies a grim monument to state brutality.\n\nSpain is struck by profound horror and fury. Azaña’s cabinet is on the defensive, accused of ordering Captain Rojas to take no prisoners. The working class is filled with boiling indignation. We must choose how to utilize this tragedy to make the state pay.',
  descriptionZh:
    '我们号召革命声援的决定更坚定了卡萨斯-维耶哈斯村筑垒雇农的斗志，但政府的干预则是极其野蛮的。突击卫队在罗哈斯上尉率领下包围了外号“六指”（Seisdedos）的弗朗西斯科·克鲁萨多的茅屋。当塞斯德多斯和他的同志拒绝投降时，守卫放火点燃了草屋顶。当家人和抵抗者为逃避熊熊大火冲出茅屋时，迎接他们的是冰冷的子弹。随后，卫队逮捕了其他当地嫌疑人，将他们带到茅屋未熄的灰烬前集体枪决。总共24位村民惨死，他们的遗体成为国家暴政的冷酷见证。\n\n全西班牙陷入了深深的震惊与愤怒中。阿萨尼亚内阁因被指控下达“不留活口”的指令而深陷政治危机。工人阶级胸中燃着熊熊怒火。我们必须决定如何利用这一惨剧去发起反击。',
  options: [
    {
      text: 'Declare an all-out, nation-wide revolutionary general strike to shatter the cabinet!',
      textZh: '宣告全国范围的革命总罢工，一举粉碎内阁！',
      subtitle: 'Massive rise in revolutionary fervor and worker control; catastrophic relations with reformist parties and a major blow to state stability. Triggers structural response.',
      subtitleZh: '革命热情与工人控制度极大幅度提升；与改良派政党关系受到灾难性打击，并沉重打击国家体制稳定性。弹出总罢工结果子事件。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 15);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 20);
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PSOE', -10);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'PSOE', -15);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'CNT_FAI', -10);

        let min = { ...state.ministers };
        if (min.labor === 'CNT') min.labor = 'PSOE';
        if (min.health === 'CNT') min.health = 'PSOE';
        if (min.justice === 'CNT') min.justice = 'PSOE';
        if (min.industry === 'CNT') min.industry = 'PSOE';
        if (min.interior === 'CNT') min.interior = 'IR';
        if (min.agriculture === 'CNT') min.agriculture = 'PSOE';
        if (min.finance === 'CNT') min.finance = 'PSOE';
        if (min.estado === 'CNT') min.estado = 'PSOE';

        return {
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 25),
            workerControl: Math.min(100, state.stats.workerControl + 12),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 20),
            economy: Math.max(0, state.stats.economy - 10)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, state.partyRelations.PSOE - 25),
            IR: Math.max(-100, state.partyRelations.IR - 25)
          },
          factions: adjustFactionInfluence(state.factions, 'Faistas', 15),
          cntStance: 'oppose' as const,
          agriculture_minister_party: min.agriculture,
          labor_minister_party: min.labor,
          finance_minister_party: min.finance || 'PSOE',
          estado_minister_party: min.estado || 'PSOE',
          ministers: min,
          activeCoalition: state.activeCoalition ? {
            ...state.activeCoalition,
            cohesion: 10,
            memberContributions: {
              ...state.activeCoalition.memberContributions,
              PSOE: 10,
              IR: 10,
              UR: 10,
              DLR: 10
            }
          } : null,
          currentEvent: generalStrikeFails
        };
      }
    },
    {
      text: 'Denounce the "Socialist murders" in our newspapers and focus on union expansion rather than immediate strikes.',
      textZh: '在报纸上对“社会党刽子手”进行最强烈的口头声讨，将力量集中在工会扩张而非立即罢工。',
      subtitle: 'Boosts CNT influence and revolutionary fervor moderately without immediate risk of full economic paralysis.',
      subtitleZh: '温和提升 CNT 影响力和革命热情，避免直接导致全面经济瘫痪的风险。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 8);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 12);

        let min = { ...state.ministers };
        if (min.labor === 'CNT') min.labor = 'PSOE';
        if (min.health === 'CNT') min.health = 'PSOE';
        if (min.justice === 'CNT') min.justice = 'PSOE';
        if (min.industry === 'CNT') min.industry = 'PSOE';
        if (min.interior === 'CNT') min.interior = 'IR';
        if (min.agriculture === 'CNT') min.agriculture = 'PSOE';
        if (min.finance === 'CNT') min.finance = 'PSOE';
        if (min.estado === 'CNT') min.estado = 'PSOE';

        return {
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 12),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 10)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, state.partyRelations.PSOE - 15),
            IR: Math.max(-100, state.partyRelations.IR - 10)
          },
          factions: adjustFactionInfluence(state.factions, 'Cenetistas', 10),
          cntStance: 'oppose' as const,
          agriculture_minister_party: min.agriculture,
          labor_minister_party: min.labor,
          finance_minister_party: min.finance || 'PSOE',
          estado_minister_party: min.estado || 'PSOE',
          ministers: min,
          activeCoalition: state.activeCoalition ? {
            ...state.activeCoalition,
            cohesion: 10,
            memberContributions: {
              ...state.activeCoalition.memberContributions,
              PSOE: 10,
              IR: 10,
              UR: 10,
              DLR: 10
            }
          } : null
        };
      }
    }
  ]
};

export const casasViejas2Crackdown: GameEvent = {
  id: 'casas_viejas_2_crackdown',
  title: 'The Blood of Casas Viejas: Preventive Slaughter',
  titleZh: '卡萨斯-维耶哈斯之血：防范性杀戮',
  description:
    'Despite the CNT’s efforts to advocate for localized action and avoid a militarized showdown, local state forces acted with horrific preemptive brutality. Captain Rojas’s Assault Guards, determined to extinguish any spark of anarchism, stormed the village. They surrounded Seisdedos’s cottage, set it ablaze, and ruthlessly shot the occupants running for their lives. Over a dozen other villagers, who were simply hiding in their homes, were rounded up and executed against the cemetery wall. In all, 24 lives were taken.\n\nThe massacre has shattered the ideological moral ground of the Republican-Socialist government. Even though we urged caution, our comrades’ blood stains the hands of Premier Azaña. The working class is filled with a boiling indignation. How do we wield this popular fury to shatter the coalition?',
  descriptionZh:
    '尽管全劳联（CNT）努力主张局部直接行动并避免武装对抗，地方的国家武装力量却采取了极其残酷的防范性暴行。旨在扑灭无政府主义一切火花的突击卫队罗哈斯上尉包围了塞斯德多斯的草屋。他们放火焚烧，冷酷地开枪打死了冲出火海逃生的农民。另有十几位仅是在家躲避的无辜村民也被强行搜捕，并被国民警卫队押至墓地围墙处集体枪决。总计有24个无辜生命被夺走。\n\n这场屠杀彻底粉碎了共和-社会党联合政府的纲领和道德根基。虽然我们主张了克制，但同志们的鲜血依然染红了阿萨尼亚首相之手。工人阶级胸中燃着熊熊怒火。我们该如何动员并引导这股民间怒潮，一举将这个虚伪的共和-社会党联盟击至粉碎？',
  options: [
    {
      text: 'Expose the atrocity and demand the immediate resignation of the Azaña Cabinet.',
      textZh: '揭露这起骇人暴行，要求阿萨尼亚内阁立即集体引咎辞职。',
      subtitle: 'Severely damages Republican authority, shifts public opinion, and elevates Puristas alignment.',
      subtitleZh: '大幅削弱共和当局权威，扭转社会公众舆论，并极大提高净化派的政治存在感。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 12);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 15);
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PSOE', -8);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'PSOE', -12);

        let min = { ...state.ministers };
        if (min.labor === 'CNT') min.labor = 'PSOE';
        if (min.health === 'CNT') min.health = 'PSOE';
        if (min.justice === 'CNT') min.justice = 'PSOE';
        if (min.industry === 'CNT') min.industry = 'PSOE';
        if (min.interior === 'CNT') min.interior = 'IR';
        if (min.agriculture === 'CNT') min.agriculture = 'PSOE';
        if (min.finance === 'CNT') min.finance = 'PSOE';
        if (min.estado === 'CNT') min.estado = 'PSOE';

        return {
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 15)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, state.partyRelations.PSOE - 20),
            IR: Math.max(-100, state.partyRelations.IR - 20)
          },
          factions: adjustFactionInfluence(state.factions, 'Puristas', 12),
          cntStance: 'oppose' as const,
          agriculture_minister_party: min.agriculture,
          labor_minister_party: min.labor,
          finance_minister_party: min.finance || 'PSOE',
          estado_minister_party: min.estado || 'PSOE',
          ministers: min,
          activeCoalition: state.activeCoalition ? {
            ...state.activeCoalition,
            cohesion: 10,
            memberContributions: {
              ...state.activeCoalition.memberContributions,
              PSOE: 10,
              IR: 10,
              UR: 10,
              DLR: 10
            }
          } : null
        };
      }
    },
    {
      text: 'Leverage the outrage to declare a 24-hour national protest strike.',
      textZh: '借助舆论愤慨，在全国范围内宣布进行一次为期24小时的抗议总罢工。',
      subtitle: 'A heavy blows to government authority and stable economy; boosts CNT solidarity across all internal groups.',
      subtitleZh: '对政府威信与经济稳定造成沉重打击；大幅凝聚 CNT 内部各派系的团结。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 10);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 10);

        let min = { ...state.ministers };
        if (min.labor === 'CNT') min.labor = 'PSOE';
        if (min.health === 'CNT') min.health = 'PSOE';
        if (min.justice === 'CNT') min.justice = 'PSOE';
        if (min.industry === 'CNT') min.industry = 'PSOE';
        if (min.interior === 'CNT') min.interior = 'IR';
        if (min.agriculture === 'CNT') min.agriculture = 'PSOE';
        if (min.finance === 'CNT') min.finance = 'PSOE';
        if (min.estado === 'CNT') min.estado = 'PSOE';

        return {
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 18),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 12),
            economy: Math.max(0, state.stats.economy - 5)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, state.partyRelations.PSOE - 15),
            IR: Math.max(-100, state.partyRelations.IR - 15)
          },
          factions: adjustFactionInfluence(state.factions, 'Cenetistas', 12),
          cntStance: 'oppose' as const,
          agriculture_minister_party: min.agriculture,
          labor_minister_party: min.labor,
          finance_minister_party: min.finance || 'PSOE',
          estado_minister_party: min.estado || 'PSOE',
          ministers: min,
          activeCoalition: state.activeCoalition ? {
            ...state.activeCoalition,
            cohesion: 10,
            memberContributions: {
              ...state.activeCoalition.memberContributions,
              PSOE: 10,
              IR: 10,
              UR: 10,
              DLR: 10
            }
          } : null
        };
      }
    }
  ]
};

export const casasViejas2Peace: GameEvent = {
  id: 'casas_viejas_2_peace',
  title: 'The Truce of Casas Viejas: A Compromised Peace',
  titleZh: '卡萨斯-维耶哈斯的休战：充满妥协的和平',
  description:
    'Thanks to the desperate behind-the-scenes lobbying by our labor ministers and PRRevS deputies inside the state apparatus, an outright slaughter was averted. The Ministry of the Interior issued an emergency direct order to Captain Rojas to freeze his assault and halt the guards. A joint delegation comprising CNT representatives and government negotiators was dispatched to Casas Viejas. After a tense, nerve-wracking standoff, Seisdedos and his family agreed to surrender in exchange for a full civilian trial, local amnesty for uninvolved villagers, and immediate, binding hearings on local land expropriation.\n\nWhile this pragmatic compromise saved lives and prevented the total collapse of our legal presence, many radical elements, particularly the *Faistas*, are absolutely furious. They accuse the leadership of "class collaboration" and of acting as "firefighters for the bourgeois state" when they should have fueled the revolutionary flames. The internal cracks in our movement are widening.',
  descriptionZh:
    '幸而依靠全劳联（CNT）在政府中的劳动部长以及PRRevS议员在国家机器幕后的紧急交涉，一场彻头彻尾的血腥屠杀才得以避免。内政部下达紧急指令，责令罗哈斯上尉暂停攻击并原地待命。随后一个由 CNT 代表与政府高级谈判代表组成的联合小组火速赶往卡萨斯-维耶哈斯村。在让人屏气凝神的对峙后，“六指”塞斯德多斯和他的同志们同意交出武器，换取公开、平等的平民法庭审判，并保证不对无辜村民进行报复，同时要求立即就该片区的土地纠纷展开听证会。\n\n虽然这一务实的妥协保全了无辜性命，也维护了我们合法的参政空间，但 CNT 内部的激进派（尤其是法伊主义派 *Faistas*）对此感到彻底愤怒。他们愤怒指责领导层在应该点燃革命雄火时却成了“资产阶级国家的消防员”，犯下了卑鄙的“阶级妥协罪”。我们组织内部的裂痕正在迅速扩大。',
  options: [
    {
      text: 'Defend the compromise: pragmatism saved the lives of our comrades and extended our legal foothold.',
      textZh: '为妥协辩解：务实主义挽救了同志们的生命，并扩大了我们的合法立足点。',
      subtitle: 'Strengthens Treintistas influence; reduces stress and revolutionary fervor, but substantially increases Faistas dissent.',
      subtitleZh: '巩固三十人派（Treintistas）的影响力；降低社会局势动荡度，但也大幅度推高野兽派（Faistas）的内部异议值。',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Faistas.dissent = Math.min(100, (newFactions.Faistas.dissent || 0) + 20);
        newFactions.Puristas.dissent = Math.min(100, (newFactions.Puristas.dissent || 0) + 15);
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 15);

        return {
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 10),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 10)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.min(100, state.partyRelations.PSOE + 10),
            IR: Math.min(100, state.partyRelations.IR + 10)
          }
        };
      }
    },
    {
      text: 'Pacify the radicals by securing immediate land deeds for the local village council, showing that cooperation delivers tangible fruit.',
      textZh: '安抚激进派：立刻敦促内阁向当地村自治会发放土地所有权证书，力证合作执政确能取得实质成果。',
      subtitle: 'Slightly raises agrarian support and CNT unity; requires budget allocation to compensate the landowners.',
      subtitleZh: '小幅提升基层雇农支持度和 CNT 的团结度；需要消耗财政预算用以赔偿土地贵族。',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Faistas.dissent = Math.min(100, (newFactions.Faistas.dissent || 0) + 8);
        newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 10);

        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 15);
        newClasses = adjustClassSupport(newClasses, 'Labradores', 'CNT_FAI', 8);

        return {
          factions: newFactions,
          classes: newClasses,
          budget: Math.max(0, state.budget - 1),
          domesticPolicy: {
            ...state.domesticPolicy,
            land_reform_progress: Math.min(100, state.domesticPolicy.land_reform_progress + 5)
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 3)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.min(100, state.partyRelations.PSOE + 5),
            IR: Math.min(100, state.partyRelations.IR + 5)
          }
        };
      }
    }
  ]
};

export const casasViejas1: GameEvent = {
  id: 'casas_viejas_1',
  title: 'The Fire of Casas Viejas: Outbreak',
  titleZh: '卡萨斯-维耶哈斯之火：暴动爆发',
  description:
    'In the dry, sun-baked hills of Andalusia, under the blazing shadow of massive latifundia estates, the small village of Casas Viejas has reached its boiling point. Frustrated by the Agonizingly slow pace of land reform under the Republican-Socialist government, local landless peasants and CNT braceros have declared Comunismo Libertario.\n\nThey have cut the telegraph lines, surrounded the localized Civil Guard post, and proudly raised the red-and-black anarchist flag over the village square. In Madrid, Prime Minister Manuel Azaña and his cabinet are under massive pressure from landowners and conservatives. They have labeled this event as "rebellious criminality" and ordered a powerful dispatch of Assault Guards from Cadiz to suppress the village. The air is thick with anticipation of gunshots. How does the National Committee of the CNT respond?',
  descriptionZh:
    '在安达卢西亚干旱炎热的山丘上，在庞大贵族庄园残暴阴影的笼罩下，卡萨斯-维耶哈斯这个小村庄已达到了沸点。出于对共和-社会党内阁极度拖沓的土地改革的不满，当地失去土地的雇农与 CNT 组织人员共同宣布建立“自由共产主义”政权。\n\n他们切断了电话，包围了当地的国民警卫队，并在村庄广场上高高升起了两色的无政府主义红黑旗。在马德里，首相曼努埃尔·阿萨尼亚和他的内阁正承受着来自土地贵族和保守派的极高限度施压。他们将此时定性为“反叛性质刑事犯罪”，并调派了驻守在加的斯的精锐突击卫队开赴该村。激烈的流血冲突一触即发。全劳联（CNT）全国委员会应如何做出反应？',
  image: 'agrarian_strike',
  condition: (state) =>
    !state.isCasasViejasTriggered &&
    state.government.type === 'Republican-Socialist Cabinet' &&
    state.domesticPolicy.land_reform_progress < 80 &&
    (state.year > 1933 || (state.year === 1933 && state.month >= 1)),
  options: [
    {
      text: 'Call for nationwide solidarity and prepare for armed resistance! Let the revolution spread!',
      textZh: '号召全国大声援，做好武装抵抗准备！让火星变成燎原大火！',
      subtitle: 'Massively ignites revolutionary expectations, but commits our resources to a physical clash with Madrid.',
      subtitleZh: '最大限度地点燃革命期望，但也将我们的全部资源卷入与马德里中央政权的直接抗衡中。',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 10);
        newFactions = adjustFactionInfluence(newFactions, 'Puristas', 10);
        newFactions.Treintistas.dissent = Math.min(100, (newFactions.Treintistas.dissent || 0) + 15);

        return {
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 5)
          },
          isCasasViejasTriggered: true,
          currentEvent: casasViejas2Insurrection
        };
      }
    },
    {
      text: 'Advocate for cautioned, localized direct action and land occupation, avoiding a frontal military clash.',
      textZh: '主张局部克制性的直接行动和占领土地，极力避免同正规武装发生正面军事冲突。',
      subtitle: 'Boosts moderate syndicalists; prepares local defense but stays short of full insurrection.',
      subtitleZh: '振奋稳健派联合工会力量；组织局部自卫但极力克制全面武装起义爆发。',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 10);
        newFactions.Faistas.dissent = Math.min(100, (newFactions.Faistas.dissent || 0) + 12);
        newFactions.Puristas.dissent = Math.min(100, (newFactions.Puristas.dissent || 0) + 12);

        return {
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 3)
          },
          isCasasViejasTriggered: true,
          currentEvent: casasViejas2Crackdown
        };
      }
    },
    {
      text: 'Leverage our coalition position within the cabinet to demand immediate withdrawal of guards and initiate negotiations.',
      textZh: '通过联合内阁中的席位，紧急抗议并强硬要求突击卫队撤退，启动妥协谈判。',
      subtitle: 'Only available if PRRevS is formed and we participate in government. Achieves a peaceful truce, but radically increases faistas rage.',
      subtitleZh: '仅在PRRevS成立且我们进入政府联合执政时可选。达成了和平休战，但大幅激化极左翼内部怒火。',
      condition: (state) => state.isPRRevSFormed && state.cntStance === 'govern',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Treintistas', 15);
        newFactions.Faistas.dissent = Math.min(100, (newFactions.Faistas.dissent || 0) + 20);
        newFactions.Puristas.dissent = Math.min(100, (newFactions.Puristas.dissent || 0) + 20);

        return {
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 10),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 3)
          },
          isCasasViejasTriggered: true,
          currentEvent: casasViejas2Peace
        };
      }
    }
  ]
};
