import { GameEvent } from '../types';
import { presidentialElectionResults, presidentialElectionResultsRound2 } from './presidential_election_results';

export const presidentialElectionCampaignMenu: GameEvent = {
  id: 'presidential_election_campaign_menu',
  title: (state) => `Campaign Lobby — Round ${state.presidentElectionRound || 1}`,
  titleZh: (state) => `大选竞选大厅 — 第 ${state.presidentElectionRound || 1} 轮`,
  description: 'The political machine of Spain is operating at its maximum. Behind the closed doors of parliamentary offices, in smoke-filled cafes, and in the restless streets of working-class neighborhoods, the future of the republic is being bought, sold, and negotiated. How will we mobilize our network and resources to swing the vote?',
  descriptionZh: '西班牙的政治机器正在全速运转。在议会大厅关闭的门后、在充满雪茄烟雾的咖啡馆里、以及在工人阶级居民区动荡不宁的街头，共和国的未来正在被交易、说服和妥协。我们该如何动员自己的网络和资源来扭转局势？',
  condition: (state) => state.cntParticipatePresidential === true,
  options: [
    // --- Option A: Lobby PSOE ---
    {
      text: (state) => {
        const target = state.presidentElectionActiveCandidate === 'left' 
          ? (state.presidentElectionLeftCandidate === 'ramon_franco' ? 'Left (Ramón Franco)' : 'Left (Manuel Azaña)')
          : 'Center (Martínez Barrio)';
        return `Lobby PSOE to concentrate votes behind ${target}`;
      },
      textZh: (state) => {
        const target = state.presidentElectionActiveCandidate === 'left'
          ? (state.presidentElectionLeftCandidate === 'ramon_franco' ? '左翼 (拉蒙·佛朗哥)' : '左翼 (曼努埃尔·阿萨尼亚)')
          : '中间派 (马丁内斯·巴里奥)';
        return `游说PSOE将选票集中在 ${target} 身上`;
      },
      condition: (state) => {
        return !state.campaignLobbyVisited?.lobby_psoe && 
               state.presidentElectionActiveCandidate !== 'gil_robles';
      },
      unavailableSubtitle: (state) => {
        if (state.campaignLobbyVisited?.lobby_psoe) return 'Already lobbied PSOE.';
        if (state.presidentElectionActiveCandidate === 'gil_robles') return 'PSOE will never back Gil-Robles.';
        return 'Requires PSOE Relations >= 50.';
      },
      unavailableSubtitleZh: (state) => {
        if (state.campaignLobbyVisited?.lobby_psoe) return '已游过PSOE。';
        if (state.presidentElectionActiveCandidate === 'gil_robles') return 'PSOE绝不会支持吉尔-罗伯斯。';
        return '需与PSOE的关系 ≥ 50。';
      },
      // Only clickable if PSOE relations are high enough
      effect: (state) => {
        const visited = { ...state.campaignLobbyVisited, lobby_psoe: true };
        
        // Block option if relations < 50
        if ((state.partyRelations.PSOE || 0) < 50) {
          return {
            pendingEvents: [
              { ...presidentialElectionCampaignMenu },
              ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
            ]
          };
        }

        return {
          campaignLobbyVisited: visited,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    },
    // --- Option B: Lobby ERC ---
    {
      text: 'Lobby ERC (Catalonian Left) to mobilize regional electors',
      textZh: '游说加泰罗尼亚共和左翼 (ERC) 动员地方选举人',
      condition: (state) => {
        return !state.campaignLobbyVisited?.lobby_erc && state.presidentElectionActiveCandidate !== null;
      },
      unavailableSubtitle: (state) => {
        if (state.campaignLobbyVisited?.lobby_erc) return 'Already lobbied ERC.';
        return 'Requires ERC Relations >= 40.';
      },
      unavailableSubtitleZh: (state) => {
        if (state.campaignLobbyVisited?.lobby_erc) return '已游说极右/地方ERC。';
        return '需与ERC的关系 ≥ 40。';
      },
      effect: (state) => {
        if ((state.partyRelations.ERC || 0) < 40) {
          return {
            pendingEvents: [
              { ...presidentialElectionCampaignMenu },
              ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
            ]
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_erc: true };
        return {
          campaignLobbyVisited: visited,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    },
    // --- Option C: Mobilize Streets ---
    {
      text: 'Mobilize workers on the streets for direct campaign pressure (-1 Resource)',
      textZh: '动员工人上街，施加直接选举压力 (-1 资源)',
      condition: (state) => {
        return !state.campaignLobbyVisited?.lobby_street && state.presidentElectionActiveCandidate !== null;
      },
      unavailableSubtitle: (state) => {
        if (state.campaignLobbyVisited?.lobby_street) return 'Already mobilized the streets.';
        return 'Requires at least 1 Resource.';
      },
      unavailableSubtitleZh: (state) => {
        if (state.campaignLobbyVisited?.lobby_street) return '已动员过街头。';
        return '需至少 1 资源。';
      },
      effect: (state) => {
        if ((state.resources || 0) < 1) {
          return {
            pendingEvents: [
              { ...presidentialElectionCampaignMenu },
              ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
            ]
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_street: true };
        const stats = { ...state.stats };
        stats.revolutionaryFervor = Math.min(100, (stats.revolutionaryFervor || 0) + 5);
        stats.workerControl = Math.min(100, (stats.workerControl || 0) + 3);
        
        return {
          resources: state.resources - 1,
          campaignLobbyVisited: visited,
          stats,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    },
    // --- Option D: Win over moderate electors ---
    {
      text: 'Spend resources to lobby and buy off undecided moderate electors (-2 Resources)',
      textZh: '砸资源进行公关游说，收买动摇的中间派选举人 (-2 资源)',
      condition: (state) => {
        return !state.campaignLobbyVisited?.lobby_resources && state.presidentElectionActiveCandidate !== null;
      },
      unavailableSubtitle: (state) => {
        if (state.campaignLobbyVisited?.lobby_resources) return 'Already lobbied moderate electors.';
        return 'Requires at least 2 Resources.';
      },
      unavailableSubtitleZh: (state) => {
        if (state.campaignLobbyVisited?.lobby_resources) return '已游说收买过。';
        return '需至少 2 资源。';
      },
      effect: (state) => {
        if ((state.resources || 0) < 2) {
          return {
            pendingEvents: [
              { ...presidentialElectionCampaignMenu },
              ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
            ]
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_resources: true };
        return {
          resources: state.resources - 2,
          campaignLobbyVisited: visited,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    },
    // --- Option F (Round 2 Only): Convince Martinez Barrio to retire ---
    {
      text: '说服马丁内斯·巴里奥退选背书左翼 / Convince Martínez Barrio to retire and endorse Left',
      textZh: '【第二轮】说服马丁内斯·巴里奥退选背书左翼',
      condition: (state) => {
        return state.presidentElectionRound === 2 && 
               state.presidentElectionActiveCandidate === 'left' &&
               !state.campaignLobbyVisited?.lobby_r2_martinez_barrio_switch;
      },
      unavailableSubtitle: (state) => {
        if (state.presidentElectionRound !== 2) return 'Only available in Round 2.';
        if (state.presidentElectionActiveCandidate !== 'left') return 'Only available if backing Left.';
        if (state.campaignLobbyVisited?.lobby_r2_martinez_barrio_switch) return 'Already convinced.';
        return 'Requires PRR Relations >= 60.';
      },
      unavailableSubtitleZh: (state) => {
        if (state.presidentElectionRound !== 2) return '仅在第二轮可用。';
        if (state.presidentElectionActiveCandidate !== 'left') return '仅在支持左翼时可用。';
        if (state.campaignLobbyVisited?.lobby_r2_martinez_barrio_switch) return '已经说服过。';
        return '需与激进党(PRR)的关系 ≥ 60。';
      },
      effect: (state) => {
        if ((state.partyRelations.PRR || 0) < 60) {
          return {
            pendingEvents: [
              { ...presidentialElectionCampaignMenu },
              ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
            ]
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_r2_martinez_barrio_switch: true };
        return {
          campaignLobbyVisited: visited,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    },
    // --- Option G (Round 2 Only): Buy off Gil-Robles' allies ---
    {
      text: '砸资源收买吉尔-罗伯斯的小党盟友 (-3 Resources) / Buy off Gil-Robles\' allies',
      textZh: '【第二轮】砸资源收买吉尔-罗伯斯的小党盟友 (-3 资源)',
      condition: (state) => {
        return state.presidentElectionRound === 2 && 
               state.presidentElectionActiveCandidate !== 'gil_robles' &&
               !state.campaignLobbyVisited?.lobby_r2_gil_robles_allies;
      },
      unavailableSubtitle: (state) => {
        if (state.presidentElectionRound !== 2) return 'Only available in Round 2.';
        if (state.presidentElectionActiveCandidate === 'gil_robles') return 'Gil-Robles is already your endorsed ally.';
        if (state.campaignLobbyVisited?.lobby_r2_gil_robles_allies) return 'Already bought off.';
        return 'Requires at least 3 Resources.';
      },
      unavailableSubtitleZh: (state) => {
        if (state.presidentElectionRound !== 2) return '仅在第二轮可用。';
        if (state.presidentElectionActiveCandidate === 'gil_robles') return '当你支持吉尔-罗伯斯时，他已经是你的盟友——无需再收买他身边的人。';
        if (state.campaignLobbyVisited?.lobby_r2_gil_robles_allies) return '已经收买过。';
        return '需至少 3 资源。';
      },
      effect: (state) => {
        if ((state.resources || 0) < 3) {
          return {
            pendingEvents: [
              { ...presidentialElectionCampaignMenu },
              ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
            ]
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_r2_gil_robles_allies: true };
        return {
          resources: state.resources - 3,
          campaignLobbyVisited: visited,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    },
    // --- Option E: Conclude Lobby (Round 1) ---
    {
      text: 'Conclude lobbying. Cast the first round ballots.',
      textZh: '结束游说。举行大选第一轮投计票。',
      condition: (state) => state.presidentElectionRound === 1,
      effect: (state) => {
        return {
          pendingEvents: [
            { ...presidentialElectionResults },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionResults.id)
          ]
        };
      }
    },
    // --- Option H: Conclude Lobby (Round 2) ---
    {
      text: 'Conclude lobbying. Cast the second round ballots.',
      textZh: '结束游说。举行大选第二轮投计票。',
      condition: (state) => state.presidentElectionRound === 2,
      effect: (state) => {
        return {
          pendingEvents: [
            { ...presidentialElectionResultsRound2 },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionResultsRound2.id)
          ]
        };
      }
    }
  ]
};
