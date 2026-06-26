import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';
import { presidentialElectionCampaignMenu } from './presidential_election_campaign_menu';

export const presidentialElectionCandidateSelection: GameEvent = {
  id: 'presidential_election_candidate_selection',
  title: 'Endorsing a Presidential Candidate',
  titleZh: '大选候选人背书',
  description: 'With the Left candidate chosen, we now face the three-way general election. The CNT National Committee must decide where our underground networks, street mobs, and workers\' assemblies will throw their support. The Left is our natural class ally — but Diego Martínez Barrio represents the moderate center that refused to bow to CEDA. José María Gil-Robles, on the other hand, is the leader of the authoritarian clerical Right... supporting him would shock our base, but perhaps it is a necessary deal, or a way to provoke the revolution.',
  descriptionZh: '左翼代表已经确定。现在大选迫在眉睫，全国委员会必须决定，将CNT的街头力量、地下组织和工会大会投向三方中的哪一方。左翼是我们的天然阶级盟友——但迭戈·马丁内斯·巴里奥代表了那个拒绝屈服于CEDA的温和共和中间派。而何塞·马利亚·吉尔-罗伯斯则是反动 clerical 右翼的领袖……支持他会彻底震惊我们的基本盘，但也许这是避免更坏结果的交易，或者能磨砺出真正的革命洪流。',
  condition: (state) => state.presidentElectionPhase === 'general' && state.cntParticipatePresidential === true,
  options: [
    {
      text: (state) => `Support the Left — [${state.presidentElectionLeftCandidate === 'ramon_franco' ? 'Ramón Franco' : 'Manuel Azaña'}].`,
      textZh: (state) => `支持左翼—— [${state.presidentElectionLeftCandidate === 'ramon_franco' ? '拉蒙·佛朗哥' : '曼努埃尔·阿萨尼亚'}]。`,
      subtitle: 'The disciplined choice. Our votes will strengthen the reformist bloc against right-wing reaction.',
      subtitleZh: '有纪律的选择。我们的选票将强化改革派阵营，用以阻击右翼反动势力。法伊派对此保持一贯的克制态度。',
      effect: (state) => {
        const f = { ...state.factions };
        f.Faistas = { ...f.Faistas, dissent: Math.min(100, (f.Faistas?.dissent || 0) + 5) };
        
        return {
          presidentElectionActiveCandidate: 'left',
          factions: f,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    },
    {
      text: 'Support Diego Martínez Barrio — the Democratic Center.',
      textZh: '支持迭戈·马丁内斯·巴里奥——民主中间派。',
      subtitle: 'Leader of the PRR\'s democratic wing. Refused to follow Lerroux into CEDA\'s embrace. Sometimes the middle is where the Republic survives.',
      subtitleZh: '激进党民主翼的领袖，拒绝同勒鲁一块投入CEDA怀抱。他坐在极端之间——有时中间派就是共和国得以维系的关键。纯洁派和法伊派对此极度不满。',
      effect: (state) => {
        let f = { ...state.factions };
        f.Faistas = { ...f.Faistas, dissent: Math.min(100, (f.Faistas?.dissent || 0) + 15) };
        f.Puristas = { ...f.Puristas, dissent: Math.min(100, (f.Puristas?.dissent || 0) + 10) };
        f = adjustFactionInfluence(f, 'Treintistas', 5);
        
        const relations = { ...state.partyRelations };
        relations.PRR = Math.min(100, (relations.PRR || 0) + 15);
        relations.DLR = Math.min(100, (relations.DLR || 0) + 15);
        
        return {
          presidentElectionActiveCandidate: 'martinez_barrio',
          factions: f,
          partyRelations: relations,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    },
    {
      text: 'Support José María Gil-Robles (CEDA) — a pact with the Devil.',
      textZh: '支持何塞·马利亚·吉尔-罗伯斯（CEDA）——与魔鬼的交易。',
      subtitle: 'The unthinkable. Back the Catholic authoritarian to prevent something worse, or to sharpen the revolution against a clear enemy.',
      subtitleZh: '不可想象之事。支持天主教威权主义者以阻止更坏的结局，或者是为了用外部大敌磨砺工人的革命斗志。我们的纯洁派和法伊派会彻底暴怒！',
      effect: (state) => {
        let f = { ...state.factions };
        f.Faistas = { ...f.Faistas, dissent: Math.min(100, (f.Faistas?.dissent || 0) + 50) };
        f.Puristas = { ...f.Puristas, dissent: Math.min(100, (f.Puristas?.dissent || 0) + 45) };
        f = adjustFactionInfluence(f, 'Treintistas', -10);
        
        const relations = { ...state.partyRelations };
        relations.PSOE = Math.max(-100, (relations.PSOE || 0) - 30);
        relations.PCE = Math.max(-100, (relations.PCE || 0) - 35);
        
        const stats = { ...state.stats };
        stats.workerControl = Math.max(0, (stats.workerControl || 0) - 10);
        
        return {
          presidentElectionActiveCandidate: 'gil_robles',
          factions: f,
          partyRelations: relations,
          stats,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    }
  ]
};
