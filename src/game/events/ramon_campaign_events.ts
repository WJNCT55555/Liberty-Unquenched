import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const ramonCampaignEvent1: GameEvent = {
  id: 'ramon_campaign_event_1',
  title: 'The Legend Takes Off: Ramón Franco’s Aerial Campaign',
  titleZh: '传奇启航：拉蒙·佛朗哥的空中竞选',
  description: 'Taking to the skies in his famous seaplane "Plus Ultra", Ramón Franco lands in regional capitals across Spain, addressing cheering crowds directly from the airfield. He demands a complete dismantling of centralized power, advocating for an "Iberian Union of Free Republics". He calls on the workers and regionalists to unite under the PRRevS banner.',
  descriptionZh: '拉蒙·佛朗哥驾驶着他名震天下的“至高无上”号水上飞机，在西班牙各地区首府上空翱翔并降落。在跑道旁，他直接向欢呼雀跃的群众发表了激昂的演讲，要求彻底废除集权制，组建“自由共和国的伊比利亚联盟”。他号召工人和地方自治主义者共同团结在革命工团党（PRRevS）的旗帜下。',
  options: [
    {
      text: 'The skies belong to the federation! Collect regional support.',
      textZh: '天空属于联邦！动员各地的自治力量。',
      effect: (state) => {
        let newFactions = adjustFactionInfluence(state.factions, 'Jabalistas', 5);
        return {
          factions: newFactions,
          domesticPolicy: {
            ...state.domesticPolicy,
            regional_autonomy_progress: Math.min(100, state.domesticPolicy.regional_autonomy_progress + 10)
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5)
          }
        };
      }
    }
  ]
};

export const ramonCampaignEvent2: GameEvent = {
  id: 'ramon_campaign_event_2',
  title: 'The Rebel’s Broadside: Confronting the Center',
  titleZh: '叛逆者的炮轰：正面对决集权制',
  description: 'As the campaign gains momentum, Ramón Franco publishes a fiery manifesto in radical newspapers, accusing the Madrid political elite of treating Spain’s historical regions as colonies. "Gibraltar, Porto, Barcelona, and Seville must all be sovereign nodes of our federation!" His extreme ideas spark furious debates in the press, but deep-seated federalist feelings are stirred.',
  descriptionZh: '随着竞选活动进入白热化，拉蒙·佛朗哥在激进派报纸上发表了猛烈的宣言，指责马德里的政治精英将西班牙的历史区域当作殖民地对待：“直布罗陀、波尔图、巴塞罗那和塞维利亚，都应当成为我们伊比利亚联邦的主权节点！”他极端的言论在媒体上引发了轩然大波，但也唤醒了深藏在民间的联邦主义情怀。',
  options: [
    {
      text: 'Dismantle Madrid’s tyranny! Forge ahead.',
      textZh: '粉碎马德里的暴政！继续向前推进。',
      effect: (state) => {
        return {
          stats: {
            ...state.stats,
            tension: Math.min(100, state.stats.tension + 8),
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 8),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 5)
          }
        };
      }
    }
  ]
};

export const ramonCampaignEvent3: GameEvent = {
  id: 'ramon_campaign_event_3',
  title: 'A Bold Union: The Final Rally in Barcelona',
  titleZh: '宏伟同盟：最后的巴塞罗那誓师大会',
  description: 'The final campaign rally takes place in Barcelona, organized jointly by the CNT and the regionalist Esquerra Republicana de Catalunya (ERC). Tens of thousands fill the arena. Ramón Franco stands shoulder-to-shoulder with Lluís Companys, promising that a PRRevS presidency will guarantee Catalonia’s absolute self-determination as a sovereign state within the Iberian Federation.',
  descriptionZh: '最后的竞选动员誓师大会在巴塞罗那举行，由全国劳工联盟（CNT）与加泰罗尼亚共和左翼（ERC）联合举办。数以万计的人涌入会场。拉蒙·佛朗哥与路易斯·孔帕尼斯并肩而立，庄严承诺：革命共和工团党（PRRevS）领袖竞逐总统，将绝对保障加泰罗尼亚在伊比利亚联邦内作为主权国家的完全自决权。',
  options: [
    {
      text: 'Forward to an Iberian Federation! Raise the banners of unity.',
      textZh: '向着伊比利亚联邦，进军！高举团结的旗帜。',
      effect: (state) => {
        return {
          partyRelations: {
            ...state.partyRelations,
            ERC: Math.min(100, (state.partyRelations?.ERC ?? 50) + 12)
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
            tension: Math.min(100, state.stats.tension + 5)
          }
        };
      }
    }
  ]
};
