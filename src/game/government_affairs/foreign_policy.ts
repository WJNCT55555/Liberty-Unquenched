import { Card, GameState, GameEvent } from '../types';
import { adjustClassSupport, adjustFactionDissents, withCurrentDate } from '../utils';

const concludeForeignPolicy = (changes: Partial<GameState>): Partial<GameState> => ({
  ...changes,
  international_relations_timer: 2,
  currentEvent: null
});

export const gibraltarQuestionEvent: GameEvent = {
  id: 'gibraltar_question_event',
  title: 'The Gibraltar Question',
  titleZh: '直布罗陀主权与边防协商',
  description: 'The sovereign British outpost of Gibraltar stands at the gateway of Spain. Our diplomats have raised negotiations concerning border controls, shipping neutrality, and joint defense arrangements. However, any concession to the British empire will deeply divide our factions.',
  descriptionZh: '英国的直系前哨直布罗陀耸立在西班牙的咽喉地带。我们的外交团队就边控、海运中立和共同防御协议提出了谈判。然而，任何对大英帝国的妥协都将在我们内部的无政府工团主义各派系中引发生意想不到的分裂。',
  options: [
    {
      text: 'Compromise on transit and guarantee British commercial interests',
      textZh: '在过境边防上做出妥协，确保大英帝国的贸易利益',
      subtitle: 'Improves relations with the UK and brings dynamic foreign exchange, but severely angers anarchist purists.',
      subtitleZh: '改善英西关系并注入急需的外汇，但这会引发无政府主义纯粹派的强烈愤慨。',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Puristas: 10,
          Faistas: 5
        });
        return concludeForeignPolicy({
          factions: newFactions,
          relations: {
            ...state.relations,
            uk: Math.min(100, state.relations.uk + 8)
          },
          foreign_exchange: Math.min(1000, (state.foreign_exchange ?? 180) + 10),
          gibraltar_resolved: true
        });
      }
    },
    {
      text: 'Assert Spanish sovereignty and demand demilitarization',
      textZh: '宣示西班牙主权，抗议自决抗英要求撤军',
      subtitle: 'Rallies the anarchist purists (FAI) and boosts revolutionary fervor, but catastrophically damages relations with Great Britain.',
      subtitleZh: '凝聚FAI无政府纯粹派并提高革命热情，但会破坏英西外交关系。',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -5,
          Puristas: -8
        });
        return concludeForeignPolicy({
          factions: newFactions,
          relations: {
            ...state.relations,
            uk: Math.max(0, state.relations.uk - 15)
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 8)
          },
          gibraltar_resolved: true
        });
      }
    },
    {
      text: 'Cancel and return',
      textZh: '取消并返回',
      subtitle: 'Leave the Gibraltar question unresolved and return to the UK talks.',
      subtitleZh: '暂不处理直布罗陀问题，返回英国谈判页面。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(negotiateUKEvent, state)
      })
    }
  ]
};

export const negotiateUKEvent: GameEvent = {
  id: 'negotiate_uk',
  title: 'Negotiate with the United Kingdom',
  titleZh: '与英国进行谈判',
  description: 'The Court of St James remains highly skeptical of our revolutionary governance. Negotiating with London is a path fraught with compromise.',
  descriptionZh: '圣詹姆斯宫（英国朝廷）对我们的革命政权深怀戒心。与伦敦方面的接触和妥协无异于与虎谋皮。',
  options: [
    {
      text: 'Attempt to improve diplomatic relations',
      textZh: '尝试改善与英国的外交关系',
      subtitle: 'The British government is extremely hostile to libertarian communism; efforts yield minimal success.',
      subtitleZh: '英国政府对自由意志共产主义极为敌视，外交努力收效甚微',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Puristas: 5,
          Cenetistas: 2
        });
        return concludeForeignPolicy({
          factions: newFactions,
          relations: {
            ...state.relations,
            uk: Math.min(100, state.relations.uk + 3)
          }
        });
      }
    },
    {
      text: 'Negotiate the national debt with British creditors',
      textZh: '谈判与英国的外债问题',
      subtitle: '-1 Budget -- Dispatch a financial commissioner to the City of London to request an extension of WWI-era debt maturities.',
      subtitleZh: '-1 预算 -- 派遣财政专员赴伦敦金融城，请求延长一战遗留债务的偿还期限',
      condition: (state) => state.budget >= 1 && state.relations.uk >= 30 && (state.public_debt ?? 500) >= 200,
      unavailableSubtitle: () => 'Insufficient budget (needs 1), UK-Spanish relations below 30, or public debt below 200M.',
      unavailableSubtitleZh: () => '预算不足（需要1）、英西关系低于30、或公共债务未达200M暂无谈判筹码',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Puristas: 4,
          Faistas: 2
        });
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 1),
          public_debt: Math.max(0, (state.public_debt ?? 500) - 35),
          foreign_exchange: Math.min(1000, (state.foreign_exchange ?? 180) + 5),
          coalition_dissent: (state.coalition_dissent || 0) + 1,
          factions: newFactions,
          relations: {
            ...state.relations,
            uk: Math.min(100, state.relations.uk + 4)
          }
        });
      }
    },
    {
      text: 'Raise the Gibraltar Question',
      textZh: '谈谈直布罗陀问题',
      subtitle: 'Open a focused negotiation over Gibraltar, border controls, and British shipping guarantees.',
      subtitleZh: '进入直布罗陀、边境管控与英国航运保证的专项谈判。',
      condition: (state) => !state.gibraltar_resolved,
      unavailableSubtitle: () => 'The Gibraltar question has already been settled.',
      unavailableSubtitleZh: () => '直布罗陀问题已经处理完毕。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(gibraltarQuestionEvent, state)
      })
    },
    {
      text: 'Return to Foreign Policy menu',
      textZh: '返回外交政策主菜单',
      subtitle: 'Leave the UK talks and return to the foreign policy council.',
      subtitleZh: '离开英国谈判，返回外交政策主菜单。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(foreignPolicyEvent, state)
      })
    }
  ]
};

export const negotiateFranceEvent: GameEvent = {
  id: 'negotiate_france',
  title: 'Negotiate with France',
  titleZh: '与法国进行谈判',
  description: 'France, share a long Pyrenean border and a mutual dread of fascist surrounding, is our closest democratic counterpart.',
  descriptionZh: '同享比利牛斯边界、同怀保家卫国对敌恐惧的法国，是我们最亲密也是关系最危险的民主邻邦。',
  options: [
    {
      text: 'Improve diplomatic relations',
      textZh: '改善与法国的外交关系',
      subtitle: 'Use routine diplomatic channels to improve French relations and conclude this policy review.',
      subtitleZh: '通过常规外交渠道改善法国关系，并结束本次外交政策评议。',
      effect: (state) => concludeForeignPolicy({
        relations: {
          ...state.relations,
          france: Math.min(100, state.relations.france + 5)
        }
      })
    },
    {
      text: 'Propose an Iberian-French Anti-Fascist Front',
      textZh: '我们可否建立一个伊比利亚-法兰西反法西斯联合阵线',
      subtitle: '-2 Budget -- Formally conclude a mutual defense pact with Blum’s Popular Front government to coordinate against German/Italian intervention.',
      subtitleZh: '-2 预算 -- 正式与法国人民阵线政府缔结反法西斯共同防御协定，协调对德意干涉的联合应对',
      condition: (state) => state.budget >= 2 && state.relations.france >= 55 && state.year >= 1936 && state.civilWarStatus === 'ongoing',
      unavailableSubtitle: () => 'Requires: 2 Budget, France relations >= 55, year >= 1936, and an active Civil War.',
      unavailableSubtitleZh: () => '预算不足（需要2）、法西关系低于55、法国人民阵线尚未执政(1936前)或内战未爆发',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -3,
          Puristas: -2
        });
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 2),
          armaments: state.armaments + 1,
          foreign_exchange: Math.min(1000, (state.foreign_exchange ?? 180) + 5),
          coalition_dissent: (state.coalition_dissent || 0) + 2,
          factions: newFactions,
          relations: {
            ...state.relations,
            france: Math.min(100, state.relations.france + 8),
            germany: Math.max(0, state.relations.germany - 5),
            italy: Math.max(0, state.relations.italy - 5)
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 2)
          }
        });
      }
    },
    {
      text: 'Smuggle arms through Pyrenean union syndicates networks',
      textZh: '动用跨境工会网络走私法国军火',
      subtitle: '-2 Resources -- Leverage CGT and border syndicates to smuggle light weapons right past the Non-Intervention Committee.',
      subtitleZh: '-2 资源 -- 通过法国总工会(CGT)及比利牛斯山边境工会网络，在"不干涉委员会"眼皮下走私轻武器与弹药',
      condition: (state) => state.resources >= 2 && state.civilWarStatus === 'ongoing',
      unavailableSubtitle: () => 'Requires 2 Resources and an active Civil War.',
      unavailableSubtitleZh: () => '资源不足（需要2）或内战尚未爆发，和平时期无需军火走私',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -3,
          Puristas: -2
        });
        return concludeForeignPolicy({
          resources: Math.max(0, state.resources - 2),
          armaments: state.armaments + 2,
          coalition_dissent: (state.coalition_dissent || 0) + 2,
          factions: newFactions,
          relations: {
            ...state.relations,
            france: Math.min(100, state.relations.france + 2)
          }
        });
      }
    },
    {
      text: 'Secure Andorra as a republic line of life',
      textZh: '确保安道尔——比利牛斯山间的共和生命线',
      subtitle: '-1 Budget -- Coordinate with co-princes and Bishop of Urgell to plug Nationalist smuggling gaps and open refugee passage.',
      subtitleZh: '-1 预算 -- 与法国共管当局及乌赫尔主教协商，阻止安道尔沦为国民军走私枢纽，开辟难民安全走廊',
      condition: (state) => state.budget >= 1 && state.civilWarStatus === 'ongoing' && !state.andorra_secured,
      unavailableSubtitle: () => 'Requires 1 Budget, active Civil War, and Andorra not yet secured.',
      unavailableSubtitleZh: () => '预算不足（需要1）、内战未爆发、或安道尔通道已确保',
      effect: (state) => concludeForeignPolicy({
        budget: Math.max(0, state.budget - 1),
        relations: {
          ...state.relations,
          france: Math.min(100, state.relations.france + 3)
        },
        andorra_secured: true,
        coalition_dissent: (state.coalition_dissent || 0) + 1,
        armedForces: {
          ...state.armedForces,
          militias: {
            ...state.armedForces.militias,
            cntFai: (state.armedForces.militias.cntFai || 0) + 2000
          }
        }
      })
    },
    {
      text: 'Return to Foreign Policy menu',
      textZh: '返回外交政策主菜单',
      subtitle: 'Leave the French talks and return to the foreign policy council.',
      subtitleZh: '离开法国谈判，返回外交政策主菜单。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(foreignPolicyEvent, state)
      })
    }
  ]
};

export const negotiateUSAEvent: GameEvent = {
  id: 'negotiate_usa',
  title: 'Negotiate with the United States',
  titleZh: '与美国进行谈判',
  description: 'The massive industrial resources and oil supplies of the United States are critical, yet American business lobbies skew conservative.',
  descriptionZh: '美国庞大的工业产出和石油补给至关重要，但美国企业界的游说偏心保守主义，需要进行多边周旋。',
  options: [
    {
      text: 'Improve relations with the United States',
      textZh: '改善与美国的关系',
      subtitle: 'Use cautious diplomatic outreach to improve relations with Washington.',
      subtitleZh: '通过谨慎外交接触改善与华盛顿的关系。',
      effect: (state) => concludeForeignPolicy({
        relations: {
          ...state.relations,
          usa: Math.min(100, state.relations.usa + 4)
        }
      })
    },
    {
      text: 'Negotiate debt and petroleum embargo issues',
      textZh: '谈判战债与石油禁运问题',
      subtitle: '-1 Budget -- Dispatch a special envoy to Washington to persuade petroleum giants to halt rebel fueling and renegotiate WWI debts.',
      subtitleZh: '-1 预算 -- 派遣财政特使赴华盛顿，试图说服美孚石油等巨头停止向叛军提供燃料，并重新协商一战遗留战债',
      condition: (state) => state.budget >= 1 && (state.public_debt ?? 500) >= 300 && state.relations.usa >= 35,
      unavailableSubtitle: () => 'Requires 1 Budget, public debt >= 300M, and USA relations >= 35.',
      unavailableSubtitleZh: () => '预算不足（需要1）、公共债务低于300无谈判筹码、或美西关系恶劣',
      effect: (state) => concludeForeignPolicy({
        budget: Math.max(0, state.budget - 1),
        public_debt: Math.max(0, (state.public_debt ?? 500) - 25),
        relations: {
          ...state.relations,
          usa: Math.min(100, state.relations.usa + 3)
        },
        foreign_exchange: Math.min(1000, (state.foreign_exchange ?? 180) + 3)
      })
    },
    {
      text: 'Leverage Ramón Franco’s aviator prestige to acquire aircrafts',
      textZh: '利用拉蒙·弗朗哥的声望购买美国民用飞机',
      subtitle: '-2 Budget -- The Atlantic aviator hero tours America, lobbying Lockheed and others to ship dual-use planes under "civilian aviation" tags.',
      subtitleZh: '-2 预算 -- "横渡大西洋的英雄"访美，以"民用航空"名义游说洛克希德等厂商向西班牙出口双用途飞机',
      condition: (state) => state.budget >= 2 && state.relations.usa >= 40 && !state.usa_total_embargo,
      unavailableSubtitle: () => 'Requires: 2 Budget, USA relations >= 40, and no active general US arms embargo.',
      unavailableSubtitleZh: () => '预算不足（需要2）、美西关系低于40、或美国已启动全面禁运',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -2
        });
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 2),
          relations: {
            ...state.relations,
            usa: Math.min(100, state.relations.usa + 4)
          },
          armaments: state.armaments + 3,
          coalition_dissent: (state.coalition_dissent || 0) + 1,
          factions: newFactions
        });
      }
    },
    {
      text: 'Send Ramón Franco on an aviation diplomacy tour of Latin America',
      textZh: '让拉蒙·弗朗哥出访拉美',
      subtitle: 'The hero Aviator is immensely popular, breaking his brother (Francisco)’s narrative of orthodox Catholic authority.',
      subtitleZh: '航空英雄身份在美洲极具号召力，借此打破其兄长(弗朗哥)的"天主教正统"政治宣传',
      condition: (state) => state.relations.usa >= 30,
      unavailableSubtitle: () => 'Requires USA relations >= 30.',
      unavailableSubtitleZh: () => '美西关系低于30，出访缺乏外交基础',
      effect: (state) => concludeForeignPolicy({
        relations: {
          ...state.relations,
          usa: Math.min(100, state.relations.usa + 2),
          mexico: Math.min(100, state.relations.mexico + 4),
          internationalSocialists: Math.min(100, state.relations.internationalSocialists + 3)
        },
        stats: {
          ...state.stats,
          republicanAuthority: Math.min(100, state.stats.republicanAuthority + 2)
        }
      })
    },
    {
      text: 'Return to Foreign Policy menu',
      textZh: '返回外交政策主菜单',
      subtitle: 'Leave the American talks and return to the foreign policy council.',
      subtitleZh: '离开美国谈判，返回外交政策主菜单。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(foreignPolicyEvent, state)
      })
    }
  ]
};

export const negotiateSovietEvent: GameEvent = {
  id: 'negotiate_soviet',
  title: 'Negotiate with the Soviet Union',
  titleZh: '与苏联进行谈判',
  description: 'The Kremlin holds military keys, but Stalinist security interference deeply triggers domestic anarchist purists.',
  descriptionZh: '克里姆林宫掌握着宝贵重武器的进货渠道，但追求正统共产主义的干预会严重触怒国内无政府纯粹派。',
  options: [
    {
      text: 'Initiate diplomatic contact with the Stalinist bureaucracy with heavy heart',
      textZh: '忍痛与斯大林主义官僚进行外交接触',
      subtitle: 'Critical for heavy armaments, but severely alienates FAI purists.',
      subtitleZh: '这对获取重武器至关重要，但极易激怒党内无政府主义纯粹派（FAI）',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: 5,
          Puristas: 4
        });
        return concludeForeignPolicy({
          factions: newFactions,
          coalition_dissent: Math.max(0, (state.coalition_dissent || 0) - 1),
          relations: {
            ...state.relations,
            ussr: Math.min(100, state.relations.ussr + 5)
          }
        });
      }
    },
    {
      text: 'Request Soviet military assistance',
      textZh: '请求苏联军事援助',
      subtitle: '-2 Budget -- Obtain T-26 tanks and military advisors, but allow NKVD operatives on Spanish ground.',
      subtitleZh: '-2 预算 -- 获得T-26坦克与军事顾问团，但必须允许内务人民委员部（NKVD）踏上西班牙土地',
      condition: (state) => state.budget >= 2,
      unavailableSubtitle: () => 'Requires 2 Budget.',
      unavailableSubtitleZh: () => '预算不足（需要 2）',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: 7,
          Puristas: 5
        });
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PCE', 3);
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 2),
          tankResearchProgress: Math.min(100, state.tankResearchProgress + 15),
          factions: newFactions,
          relations: {
            ...state.relations,
            ussr: Math.min(100, state.relations.ussr + 6)
          },
          classes: newClasses
        });
      }
    },
    {
      text: 'Purchase Soviet heavy weapons with the Republic Gold Reserves',
      textZh: '动用"共和国黄金储备"购买苏联重装备',
      subtitle: '-3 Budget, -150 Gold -- Transfer bullion to Moscow as down-payment for advanced aircrafts and ammunition.',
      subtitleZh: '-3 预算 -150 黄金 -- 将黄金运往莫斯科（首期付款），换取飞机与急需的弹药',
      condition: (state) => state.budget >= 3 && state.gold_reserves >= 150 && !state.moscowGoldTransferred,
      unavailableSubtitle: () => 'Requires: 3 Budget, 150 Gold, and Moscow gold transfer not yet completed.',
      unavailableSubtitleZh: () => '预算不足（需要3）、黄金储备低于150M、或莫斯科黄金已转移',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: 6,
          Puristas: 5
        });
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PCE', 5);
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 3),
          gold_reserves: Math.max(0, state.gold_reserves - 150),
          moscowGoldTransferred: true,
          tankResearchProgress: Math.min(100, state.tankResearchProgress + 25),
          armaments: state.armaments + 4,
          factions: newFactions,
          relations: {
            ...state.relations,
            ussr: Math.min(100, state.relations.ussr + 5)
          },
          classes: newClasses
        });
      }
    },
    {
      text: 'Conclude mineral-for-petroleum trade agreement',
      textZh: '签署贸易协定，以有色金属换取苏联石油',
      subtitle: '-1 Budget -- Barter strategic non-ferrous metals for Caucasus oil to cure rear-guard fuel starvations.',
      subtitleZh: '-1 预算 -- 以钨矿等战略矿产换取巴库石油，缓解后方的"燃料饥荒"',
      condition: (state) => state.budget >= 1,
      unavailableSubtitle: () => 'Requires 1 Budget.',
      unavailableSubtitleZh: () => '预算不足（需要 1）',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: 2
        });
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 1),
          resources: state.resources + 1,
          economy_growth: state.economy_growth + 0.5,
          factions: newFactions,
          relations: {
            ...state.relations,
            ussr: Math.min(100, state.relations.ussr + 3)
          }
        });
      }
    },
    {
      text: 'Publicly denounce the Moscow Purge Trials',
      textZh: '公开谴责莫斯科大审判',
      subtitle: 'Stand by libertarian conscience, condemning Stalin’s purge. WARNING: Deeply severs Soviet military channels!',
      subtitleZh: '坚守无政府工团主义良知，谴责斯大林对老布尔什维克的迫害。注意：这会彻底切断苏援！',
      condition: (state) => state.year >= 1936 && state.month >= 8,
      unavailableSubtitle: () => 'Trials have not occurred yet (before August 1936).',
      unavailableSubtitleZh: () => '莫斯科审判尚未发生(1936年8月前)或我们选择保持外交沉默',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -10,
          Puristas: -8
        });
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PCE', -5);
        return concludeForeignPolicy({
          factions: newFactions,
          classes: newClasses,
          relations: {
            ...state.relations,
            ussr: Math.max(0, state.relations.ussr - 50),
            internationalSocialists: Math.max(0, state.relations.internationalSocialists - 5)
          }
        });
      }
    },
    {
      text: 'Return to Foreign Policy menu',
      textZh: '返回外交政策主菜单',
      subtitle: 'Leave the Soviet talks and return to the foreign policy council.',
      subtitleZh: '离开苏联谈判，返回外交政策主菜单。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(foreignPolicyEvent, state)
      })
    }
  ]
};

export const negotiateGermanyEvent: GameEvent = {
  id: 'negotiate_germany',
  title: 'Relations with Germany',
  titleZh: '与德国进行谈判',
  description: 'Berlin’s National Socialist regime is deeply hostile, but surface restrains could forestall premature military interventions.',
  descriptionZh: '柏林的国家社会主义政权怀有根本性的敌意，但表面上的克制也许能推迟或软化帝国主义侵吞。',
  options: [
    {
      text: 'Maintain superficial diplomatic constraints with Berlin',
      textZh: '尝试与柏林维持表面上的外交克制',
      subtitle: 'Extremely risky; anti-fascist radicals will view any dialogue with the Nazis as betrayal.',
      subtitleZh: '在纳粹掌权的背景下，任何对德接触都极其危险，激进反法西斯派会视我们为叛徒',
      condition: (state) => state.year >= 1933,
      unavailableSubtitle: () => 'German Nazi regime has not yet taken power (before 1933).',
      unavailableSubtitleZh: () => '魏玛共和国尚存(1933年前)，暂无需与纳粹政权进行特殊外交克制',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: 4,
          Puristas: 3
        });
        return concludeForeignPolicy({
          factions: newFactions,
          relations: {
            ...state.relations,
            germany: Math.min(100, state.relations.germany + 2),
            ussr: Math.max(0, state.relations.ussr - 3)
          }
        });
      }
    },
    {
      text: 'Sponsor the German underground resistance efforts (FAUD)',
      textZh: '秘密资助德国自由工人联盟(FAUD)等地下抵抗组织',
      subtitle: '-1 Budget -- Fulfill proletarian internationalist duties to back anti-Nazi operations.',
      subtitleZh: '-1 预算 -- 秘密资助德国自由工人联盟等地下抵抗组织，资助反纳粹地下活动',
      condition: (state) => state.budget >= 1,
      unavailableSubtitle: () => 'Requires 1 Budget.',
      unavailableSubtitleZh: () => '预算不足（需要 1）',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -5,
          Puristas: -4,
          Cenetistas: -3
        });
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 1),
          factions: newFactions,
          relations: {
            ...state.relations,
            germany: Math.max(0, state.relations.germany - 6),
            internationalSocialists: Math.min(100, state.relations.internationalSocialists + 4)
          }
        });
      }
    },
    {
      text: 'Return to Foreign Policy menu',
      textZh: '返回外交政策主菜单',
      subtitle: 'Leave the German file and return to the foreign policy council.',
      subtitleZh: '离开德国议题，返回外交政策主菜单。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(foreignPolicyEvent, state)
      })
    }
  ]
};

export const focusLatinAmericaEvent: GameEvent = {
  id: 'focus_latin_america',
  title: 'Focus on Latin America',
  titleZh: '让我们目光转向拉美',
  description: 'The Spanish-speaking world shares deep cultural bonds; Mexico offers highly loyal revolutionary support.',
  descriptionZh: '西语世界共享深邃的文化纽带，其中卡德纳斯治理下的墨西哥更是对我们倾囊相助。',
  options: [
    {
      text: 'Strengthen ties with the Hispanic world',
      textZh: '加强与西语裔世界的纽带',
      subtitle: 'Cultivate cultural and diplomatic ties with Mexico and the wider socialist diaspora.',
      subtitleZh: '加强与墨西哥及更广泛社会主义流亡网络的文化与外交纽带。',
      effect: (state) => concludeForeignPolicy({
        relations: {
          ...state.relations,
          mexico: Math.min(100, state.relations.mexico + 5),
          internationalSocialists: Math.min(100, state.relations.internationalSocialists + 3)
        }
      })
    },
    {
      text: 'Export anarcho-syndicalist revolution to South America',
      textZh: '向拉美输出无政府工团主义革命',
      subtitle: '-1 Budget -- Dispatch organizers; this will provoke strong Pan-Americanist (US) diplomatic blowback.',
      subtitleZh: '-1 预算 -- 派遣组织员前往南美，这会遭到泛美主义（美国）的强烈反弹',
      condition: (state) => state.budget >= 1,
      unavailableSubtitle: () => 'Requires 1 Budget.',
      unavailableSubtitleZh: () => '预算不足（需要 1）',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -4
        });
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 1),
          coalition_dissent: (state.coalition_dissent || 0) + 2,
          factions: newFactions,
          relations: {
            ...state.relations,
            mexico: Math.min(100, state.relations.mexico + 3),
            usa: Math.max(0, state.relations.usa - 4)
          }
        });
      }
    },
    {
      text: 'Deepen the fraternity alliance with Cárdenas’ Mexico',
      textZh: '深化与墨西哥卡德纳斯政府的兄弟同盟',
      subtitle: 'Mexico is our stalwart comrade, directly shipping about 20,000 rifles to the Republican camp.',
      subtitleZh: '墨西哥是我们最坚定的革命盟友，他们不离不弃——卡德纳斯总统直接向共和国输送约2万支步枪',
      condition: (state) => state.relations.mexico < 90,
      unavailableSubtitle: () => 'Mexico relations are already at 90 or higher.',
      unavailableSubtitleZh: () => '墨西哥关系已经达到 90 或更高。',
      effect: (state) => concludeForeignPolicy({
        armaments: state.armaments + 1,
        foreign_exchange: Math.min(1000, (state.foreign_exchange ?? 180) + 3),
        relations: {
          ...state.relations,
          mexico: Math.min(100, state.relations.mexico + 10),
          internationalSocialists: Math.min(100, state.relations.internationalSocialists + 2)
        }
      })
    },
    {
      text: 'Fund the Argentine Regional Workers Federation (FORA)',
      textZh: '资助阿根廷地区工人联合会（FORA）',
      subtitle: '-1 Budget -- Support our staunchest anarchist anti-dictatorial allies in South America.',
      subtitleZh: '-1 预算 -- 支持我们在南美洲最坚定的无政府主义反独裁战友',
      condition: (state) => state.budget >= 1,
      unavailableSubtitle: () => 'Requires 1 Budget.',
      unavailableSubtitleZh: () => '预算不足（需要 1）',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -4,
          Puristas: -3,
          Cenetistas: -2
        });
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 1),
          factions: newFactions
        });
      }
    },
    {
      text: 'Mobilize Latin American diaspora of International Brigades',
      textZh: '动员国际无产阶级组建"国际纵队"拉美营',
      subtitle: 'Call upon anti-fascist volunteers from Argentina, Cuba, and Mexico; brings substantial manpower and monetary flows.',
      subtitleZh: '呼吁美洲的反法西斯志愿者与流亡者前来参战——阿根廷、古巴、墨西哥的侨民捐款与人力的洪流',
      condition: (state) => state.civilWarStatus === 'ongoing' && !state.latin_american_diaspora_mobilized,
      unavailableSubtitle: () => 'Requires an active Civil War and the diaspora not already mobilized.',
      unavailableSubtitleZh: () => '需要内战已经爆发，且拉美侨民尚未被动员。',
      effect: (state) => concludeForeignPolicy({
        latin_american_diaspora_mobilized: true,
        budget: state.budget + 3,
        coalition_dissent: (state.coalition_dissent || 0) + 1,
        relations: {
          ...state.relations,
          usa: Math.max(0, state.relations.usa - 3)
        },
        armedForces: {
          ...state.armedForces,
          militias: {
            ...state.armedForces.militias,
            cntFai: (state.armedForces.militias.cntFai || 0) + 5000
          }
        }
      })
    },
    {
      text: 'Return to Foreign Policy menu',
      textZh: '返回外交政策主菜单',
      subtitle: 'Leave the Latin America agenda and return to the foreign policy council.',
      subtitleZh: '离开拉美议题，返回外交政策主菜单。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(foreignPolicyEvent, state)
      })
    }
  ]
};

export const discussPortugalEvent: GameEvent = {
  id: 'discuss_portugal',
  title: 'The Iberian Neighbor: Portugal',
  titleZh: '谈谈我们的半岛邻居——葡萄牙',
  description: 'Our neighbor under Salazar’s "Estado Novo" right-wing regime is deeply hostile to our libertarian experiment.',
  descriptionZh: '我们身处萨拉查"新国家"右翼专政统治下的邻邦，对任何自由主义变革都极其敌视和戒备。',
  options: [
    {
      text: 'Maintain superficial diplomatic protocols with Salazar regime',
      textZh: '尝试与萨拉查独裁政权虚与委蛇',
      subtitle: 'Highly challenging; Catholic and traditionalist elements are fiercely hostiles to us.',
      subtitleZh: '极其困难，天主教传统与萨拉查"新国家"体制对共和国西班牙根深蒂固的敌视',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: 3
        });
        return concludeForeignPolicy({
          factions: newFactions,
          relations: {
            ...state.relations,
            portugal: Math.min(100, state.relations.portugal + 3)
          }
        });
      }
    },
    {
      text: 'Sponsor Portuguese CGT and plot to overthrow Salazar',
      textZh: '资助葡萄牙全国工会联合会（CGT）并策划颠覆萨拉查',
      subtitle: '-1 Budget -- Open a second Iberian struggle front! Overthrow right-wing Salazar to safeguard our western rear.',
      subtitleZh: '-1 预算 -- 开辟伊比利亚第二战场！通过无政府主义网络推翻右翼独裁，解除后顾之忧',
      condition: (state) => state.budget >= 1,
      unavailableSubtitle: () => 'Requires 1 Budget.',
      unavailableSubtitleZh: () => '预算不足（需要 1）',
      effect: (state) => {
        const newFactions = adjustFactionDissents(state.factions, {
          Faistas: -5,
          Puristas: -4
        });
        return concludeForeignPolicy({
          budget: Math.max(0, state.budget - 1),
          covert_ops_portugal: (state.covert_ops_portugal || 0) + 2,
          factions: newFactions,
          relations: {
            ...state.relations,
            portugal: Math.max(0, state.relations.portugal - 5)
          }
        });
      }
    },
    {
      text: 'Return to Foreign Policy menu',
      textZh: '返回外交政策主菜单',
      subtitle: 'Leave the Portuguese agenda and return to the foreign policy council.',
      subtitleZh: '离开葡萄牙议题，返回外交政策主菜单。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(foreignPolicyEvent, state)
      })
    }
  ]
};

export const foreignPolicyEvent: GameEvent = {
  id: 'foreign_policy_event',
  title: 'Foreign Policy Council',
  titleZh: '外交政策评议大议会',
  description: 'Now that we control Foreign Policy, we can direct diplomatic channels to advance our struggle or secure vital trade and loans.',
  descriptionZh: '既然我们控制了外交局势，我们就能引导其去推进工团主义。全国劳工联盟（CNT）必须在大国制衡与推进革命中寻求极具风险的微弱平衡。',
  options: [
    {
      text: 'Negotiate with the United Kingdom',
      textZh: '与英国进行谈判',
      subtitle: 'Open the UK file: debt, Gibraltar, and relations with London.',
      subtitleZh: '打开英国议题：债务、直布罗陀与伦敦关系。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(negotiateUKEvent, state)
      })
    },
    {
      text: 'Negotiate with France',
      textZh: '与法国进行谈判',
      subtitle: 'Open the French file: anti-fascist coordination, arms channels, and Andorra.',
      subtitleZh: '打开法国议题：反法西斯协作、军火通道与安道尔。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(negotiateFranceEvent, state)
      })
    },
    {
      text: 'Negotiate with the United States',
      textZh: '与美国进行谈判',
      subtitle: 'Open the American file: debt, petroleum, aircraft, and hemispheric diplomacy.',
      subtitleZh: '打开美国议题：债务、石油、飞机与美洲外交。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(negotiateUSAEvent, state)
      })
    },
    {
      text: 'Negotiate with the Soviet Union',
      textZh: '与苏联进行谈判',
      subtitle: 'Open the Soviet file: arms, gold, trade, and ideological consequences.',
      subtitleZh: '打开苏联议题：军备、黄金、贸易与意识形态后果。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(negotiateSovietEvent, state)
      })
    },
    {
      text: 'Negotiate with Germany',
      textZh: '与德国进行谈判',
      subtitle: 'Open the German file: official restraint or underground resistance support.',
      subtitleZh: '打开德国议题：官方克制或地下抵抗援助。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(negotiateGermanyEvent, state)
      })
    },
    {
      text: 'Turn our attention to Latin America',
      textZh: '让我们目光转向拉美',
      subtitle: 'Open the Latin America file: Mexico, diaspora, and anarchist networks.',
      subtitleZh: '打开拉美议题：墨西哥、侨民与无政府主义网络。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(focusLatinAmericaEvent, state)
      })
    },
    {
      text: 'Address options regarding Portugal',
      textZh: '谈谈在我们半岛上的邻居——葡萄牙',
      subtitle: 'Open the Portuguese file: Salazar, CGT contacts, and Iberian security.',
      subtitleZh: '打开葡萄牙议题：萨拉查、CGT 联系与伊比利亚安全。',
      effect: (state: GameState) => ({
        currentEvent: withCurrentDate(discussPortugalEvent, state)
      })
    },
    {
      text: 'Maintain general policies with no sudden adjustments',
      textZh: '我们暂时不调整我们的外交政策',
      subtitle: 'End the foreign policy council and trigger the standard diplomatic cooldown.',
      subtitleZh: '结束外交政策评议，并触发标准外交冷却。',
      effect: () => concludeForeignPolicy({})
    }
  ]
};

export const foreignPolicy: Card = {
  id: 'foreign_policy',
  title: 'Foreign Policy',
  titleZh: '外交政策',
  type: 'Government',
  description: 'Being in control of Foreign Policy, we can direct it to advance our policies, whether that is aiding our socialist allies in the East, or negotiating debts to alleviate the current economic situation. (Requires CNT in control of the Ministry of State)',
  descriptionZh: '掌握外交政策，我们可以引导其推进我们的政策。作为全国劳工联盟（CNT），我们将不得不在维持资产阶级共和国的国际生存与推进全球工团主义革命之间找到危险的平衡。（需要CNT掌管国务部/外交）',
  cost: 1,
  condition: (state: GameState) => {
    return state.cntStance === 'govern' && state.ministers.estado === 'CNT' && (state.international_relations_timer || 0) <= 0;
  },
  effect: (state: GameState) => {
    return {
      currentEvent: withCurrentDate(foreignPolicyEvent, state)
    };
  }
};
