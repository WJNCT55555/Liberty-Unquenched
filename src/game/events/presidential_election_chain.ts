import React from 'react';
import { GameEvent, GameState } from '../types';
import { adjustFactionInfluence } from '../utils';
import { calculatePresidentialVotes } from '../utils/election';

// ==========================================
// 1. MAIN DECISION: THE PRESIDENTIAL ELECTION
// ==========================================
export const presidentialElectionDecision: GameEvent = {
  id: 'presidential_election_decision',
  title: 'The Presidential Election',
  titleZh: '共和国总统选举',
  description: 'Niceto Alcalá-Zamora has been impeached and removed from office. Speaker Diego Martínez Barrio is acting as interim president until a new president is chosen by an electoral college of 940 members — the 470 current deputies of the Cortes and 470 newly elected electors.\n\nThe left-wing camp is split between two camps: Manuel Azaña, representing republican order and stable reforms, and — if the CNT is ready to unleash this beast — Ramón Franco with his radical Iberian federalist dream. In the center stands interim president Martínez Barrio of the moderate democratic wing of the Radical Republicans. On the right, the forces are united under José María Gil-Robles of CEDA.\n\nThe CNT National Committee now faces the first major threshold: shall we intervene and participate in this state election?',
  descriptionZh: '尼塞托·阿尔卡拉-萨莫拉已被弹劾罢免。议长迭戈·马丁内斯·巴里奥将担任临时总统，直至新总统经由940名选举人团成员——470名现任议员加上470名另行普选的选举人——选出。\n\n左翼阵营分裂为两股力量：曼努埃尔·阿萨尼亚代表着共和秩序与渐进改革，而——若CNT准备释放这头野兽——拉蒙·佛朗哥代表着极端联邦派的狂想。在中间地带站着临时总统马丁内斯·巴里奥本人，激进共和党的温和民主翼。右翼则统一在CEDA领袖吉尔-罗伯斯的旗下。\n\n全国委员会现在面临第一道门槛：我们是否介入并参与这场总统大选？',
  condition: (state) => {
    // Only triggers automatically if president has been impeached, civil war hasn't started, and we haven't seen it yet.
    return state.presidentImpeached === true && 
           state.civilWarStatus === 'not_started' && 
           state.presidentElectionSeen === false;
  },
  options: [
    {
      text: 'Abstain. "Aborrecemos a todo gobernante."',
      textZh: '弃权。“我们憎恶任何统治者。”',
      subtitle: 'Stand aside and refuse to participate. The left candidate defaults to Azaña, and the three-way election will be resolved automatically based on current party strengths.',
      subtitleZh: '不参与这场国家政治的角逐。左翼候选人将自动默认为阿萨尼亚，三阵营大选按现有政党力量自动计票。',
      effect: () => {
        return {
          cntParticipatePresidential: false,
          presidentElectionLeftCandidate: 'azana',
          presidentElectionActiveCandidate: null,
          presidentElectionPhase: 'general',
          presidentElectionSeen: true,
          currentEvent: presidentialElectionAutoResolve
        };
      }
    },
    {
      text: 'Participate. The workers deserve a voice.',
      textZh: '参与。工人应当拥有发言权。',
      subtitle: 'Intervene in the election. We must first decide which candidate to support in the left primary — Azaña or Ramón Franco.',
      subtitleZh: '介入选举。首先我们需要决定在左翼初选中支持推举谁出战——阿萨尼亚还是拉蒙·佛朗哥。这会激怒纯洁派和法伊主义者，但温和派感到满意。',
      effect: (state) => {
        let f = { ...state.factions };
        f.Faistas = { ...f.Faistas, dissent: Math.min(100, (f.Faistas?.dissent || 0) + 20) };
        f.Puristas = { ...f.Puristas, dissent: Math.min(100, (f.Puristas?.dissent || 0) + 15) };
        f = adjustFactionInfluence(f, 'Treintistas', 10);
        
        return {
          cntParticipatePresidential: true,
          presidentElectionPhase: 'primary',
          presidentElectionSeen: true,
          factions: f,
          currentEvent: presidentialElectionPrimary
        };
      }
    }
  ]
};

// ==========================================
// 2. PRIMARY SELECTION (LEFT CAMP)
// ==========================================
export const presidentialElectionPrimary: GameEvent = {
  id: 'presidential_election_primary',
  title: 'Left Primary Selection',
  titleZh: '左翼阵营初选',
  description: 'The Left must unite behind a single presidential candidate. Manuel Azaña represents the path of republican order, constitutionalism, and stable governance in cooperation with the PSOE and IR. Ramón Franco, if backed, represents a radical decentralized vision — an Iberian federalist republic that shatters centralized power. Our decision here determines who represents the Left in the three-way general election.',
  descriptionZh: '左翼阵营必须统合在唯一的候选人身后。曼努埃尔·阿萨尼亚代表着共和秩序——渐进改革、宪法框架、与工社党(PSOE)和共和左翼(IR)的稳固联盟。拉蒙·佛朗哥代表着另一条道路——粉碎中央集权、建立伊比利亚联邦、让每一个地区自决。两人的政见截然不同。我们的选择将决定谁代表左翼出战三阵营大选。',
  condition: () => false, // Handled sequentially via currentEvent transitions
  options: [
    {
      text: 'Azaña. The Republic must be reformed, not shattered.',
      textZh: '阿萨尼亚。共和国需要改革，而非粉碎。',
      subtitle: 'A stable left alliance with the PSOE and IR. Predictable and trusted by bourgeois republicans we despise but need.',
      subtitleZh: '与PSOE and IR建立稳定的左翼联盟。行事温和而容易被社会主流及资产阶级共和派接受。会引起法伊主义者的不悦。',
      effect: (state) => {
        let f = { ...state.factions };
        f.Faistas = { ...f.Faistas, dissent: Math.min(100, (f.Faistas?.dissent || 0) + 10) };
        f = adjustFactionInfluence(f, 'Treintistas', 5);
        
        const relations = { ...state.partyRelations };
        relations.IR = Math.min(100, (relations.IR || 0) + 10);
        
        return {
          presidentElectionLeftCandidate: 'azana',
          presidentElectionPhase: 'general',
          factions: f,
          partyRelations: relations,
          currentEvent: presidentialElectionCandidateSelection
        };
      }
    },
    {
      text: 'Ramón Franco. Let the Iberian Eagle fly.',
      textZh: '拉蒙·佛朗哥。让伊比利亚之鹰起飞。',
      subtitle: 'A radical gamble. Federalism, regional autonomy, a Franco against Franco. The establishment will tremble.',
      subtitleZh: '一场激进的豪赌。联邦主义、区域自决、一个“反对佛朗哥的佛朗哥”。建制派会因此而颤抖。但这会让主流温和派感到极度不安。',
      condition: (state) => state.ramonFrancoPresidentUnlocked === true,
      unavailableSubtitle: () => 'Ramón Franco has not unlocked the "Iberian Eagle" campaign journal.',
      unavailableSubtitleZh: () => '拉蒙·佛朗哥尚未完成"伊比利亚之鹰"竞选日志。',
      effect: (state) => {
        let f = { ...state.factions };
        f = adjustFactionInfluence(f, 'Jabalistas', 10);
        f = adjustFactionInfluence(f, 'Treintistas', -5);
        
        const relations = { ...state.partyRelations };
        relations.PSOE = Math.max(-100, (relations.PSOE || 0) - 10);
        
        return {
          presidentElectionLeftCandidate: 'ramon_franco',
          presidentElectionPhase: 'general',
          factions: f,
          partyRelations: relations,
          currentEvent: presidentialElectionCandidateSelection
        };
      }
    }
  ]
};

// ==========================================
// 3. CANDIDATE ENDORSEMENT
// ==========================================
export const presidentialElectionCandidateSelection: GameEvent = {
  id: 'presidential_election_candidate_selection',
  title: 'Endorsing a Presidential Candidate',
  titleZh: '大选候选人背书',
  description: 'With the Left candidate chosen, we now face the three-way general election. The CNT National Committee must decide where our underground networks, street mobs, and workers\' assemblies will throw their support. The Left is our natural class ally — but Diego Martínez Barrio represents the moderate center that refused to bow to CEDA. José María Gil-Robles, on the other hand, is the leader of the authoritarian clerical Right... supporting him would shock our base, but perhaps it is a necessary deal, or a way to provoke the revolution.',
  descriptionZh: '左翼代表已经确定。现在大选迫在眉睫，全国委员会必须决定，将CNT的街头力量、地下组织和工会大会投向三方中的哪一方。左翼是我们的天然阶级盟友——但迭戈·马丁内斯·巴里奥代表了那个拒绝屈服于CEDA的温和共和中间派。而何塞·马利亚·吉尔-罗伯斯则是反动 clerical 右翼的领袖……支持他会彻底震惊我们的基本盘，但也许这是避免更坏结果的交易，或者能磨砺出真正的革命洪流。',
  condition: () => false, // Handled sequentially via currentEvent transitions
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
          currentEvent: presidentialElectionCampaignMenu
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
          currentEvent: presidentialElectionCampaignMenu
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
          currentEvent: presidentialElectionCampaignMenu
        };
      }
    }
  ]
};

// ==========================================
// 4. CAMPAIGN LOBBY & RE-ENTRY MENU
// ==========================================
export const presidentialElectionCampaignMenu: GameEvent = {
  id: 'presidential_election_campaign_menu',
  title: (state) => `Campaign Lobby — Round ${state.presidentElectionRound || 1}`,
  titleZh: (state) => `大选竞选大厅 — 第 ${state.presidentElectionRound || 1} 轮`,
  description: 'The political machine of Spain is operating at its maximum. Behind the closed doors of parliamentary offices, in smoke-filled cafes, and in the restless streets of working-class neighborhoods, the future of the republic is being bought, sold, and negotiated. How will we mobilize our network and resources to swing the vote?',
  descriptionZh: '西班牙的政治机器正在全速运转。在议会大厅关闭的门后、在充满雪茄烟雾的咖啡馆里、以及在工人阶级居民区动荡不宁的街头，共和国的未来正在被交易、说服和妥协。我们该如何动员自己的网络和资源来扭转局势？',
  condition: () => false, // Handled sequentially via currentEvent transitions
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
        if (state.campaignLobbyVisited?.lobby_psoe) return '已游说过PSOE。';
        if (state.presidentElectionActiveCandidate === 'gil_robles') return 'PSOE绝不会支持吉尔-罗伯斯。';
        return '需与PSOE的关系 ≥ 50。';
      },
      effect: (state) => {
        const visited = { ...state.campaignLobbyVisited, lobby_psoe: true };
        
        if ((state.partyRelations.PSOE || 0) < 50) {
          return {
            currentEvent: presidentialElectionCampaignMenu
          };
        }

        return {
          campaignLobbyVisited: visited,
          currentEvent: presidentialElectionCampaignMenu
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
        if (state.campaignLobbyVisited?.lobby_erc) return '已游说过ERC。';
        return '需与ERC的关系 ≥ 40。';
      },
      effect: (state) => {
        if ((state.partyRelations.ERC || 0) < 40) {
          return {
            currentEvent: presidentialElectionCampaignMenu
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_erc: true };
        return {
          campaignLobbyVisited: visited,
          currentEvent: presidentialElectionCampaignMenu
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
            currentEvent: presidentialElectionCampaignMenu
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
          currentEvent: presidentialElectionCampaignMenu
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
            currentEvent: presidentialElectionCampaignMenu
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_resources: true };
        return {
          resources: state.resources - 2,
          campaignLobbyVisited: visited,
          currentEvent: presidentialElectionCampaignMenu
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
            currentEvent: presidentialElectionCampaignMenu
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_r2_martinez_barrio_switch: true };
        return {
          campaignLobbyVisited: visited,
          currentEvent: presidentialElectionCampaignMenu
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
            currentEvent: presidentialElectionCampaignMenu
          };
        }
        const visited = { ...state.campaignLobbyVisited, lobby_r2_gil_robles_allies: true };
        return {
          resources: state.resources - 3,
          campaignLobbyVisited: visited,
          currentEvent: presidentialElectionCampaignMenu
        };
      }
    },
    // --- Option E: Conclude Lobby (Round 1) ---
    {
      text: 'Conclude lobbying. Cast the first round ballots.',
      textZh: '结束游说。举行大选第一轮投计票。',
      condition: (state) => state.presidentElectionRound === 1,
      effect: () => {
        return {
          currentEvent: presidentialElectionResults
        };
      }
    },
    // --- Option H: Conclude Lobby (Round 2) ---
    {
      text: 'Conclude lobbying. Cast the second round ballots.',
      textZh: '结束游说。举行大选第二轮投计票。',
      condition: (state) => state.presidentElectionRound === 2,
      effect: () => {
        return {
          currentEvent: presidentialElectionResultsRound2
        };
      }
    }
  ]
};

// ==========================================
// 5. ELECTION BALLOT RESULTS (FIRST ROUND)
// ==========================================
export const presidentialElectionResults: GameEvent = {
  id: 'presidential_election_results',
  title: 'Presidential General Election — First Round Results',
  titleZh: '总统大选第一轮计票结果',
  description: 'The ballots of Spain\'s general election for the presidency are being counted. Under the bicameral design, the Cortes deputies and elector delegations have completed their voting. The results will determine if a direct 2/3 majority can be achieved, or if we must proceed to a secondary runoff.',
  descriptionZh: '大选的第一轮投计票结果已经出炉。在宪法设计下，议会议员票与普选选举人票汇聚在此处。大选第一轮计票将判断是否有人能夺得2/3的绝对多数，否则将举行第二轮简单多数决。',
  condition: () => false, // Handled sequentially via currentEvent transitions
  renderContent: (state) => renderResultsTable(state, false),
  options: [
    {
      text: 'Conclude Election. The new President is declared.',
      textZh: '确认大选结果。新总统即将宣誓就任。',
      subtitle: 'The candidate has won an absolute 2/3 majority in the first round.',
      subtitleZh: '大选在第一轮取得了突破性的决定性胜利！绝对多数已经达成。',
      condition: (state) => {
        const results = calculatePresidentialVotes(state, state.presidentElectionLeftCandidate || 'azana', state.presidentElectionActiveCandidate);
        return results.hasWinner;
      },
      effect: (state) => {
        const results = calculatePresidentialVotes(state, state.presidentElectionLeftCandidate || 'azana', state.presidentElectionActiveCandidate);
        return getWinnerEffects(state, results.winner!);
      }
    },
    {
      text: 'Proceed to Second Round Runoff Campaigning.',
      textZh: '大选僵局：进入第二轮大选游说与决胜。',
      subtitle: 'No candidate achieved a 2/3 majority. The rules now shift to a simple majority for the final round.',
      subtitleZh: '由于没有人取得2/3的法定绝对多数，大选将进入最终决胜。在第二轮中，取得简单多数票者即直接胜选。',
      condition: (state) => {
        const results = calculatePresidentialVotes(state, state.presidentElectionLeftCandidate || 'azana', state.presidentElectionActiveCandidate);
        return !results.hasWinner;
      },
      effect: () => {
        return {
          presidentElectionRound: 2,
          currentEvent: presidentialElectionCampaignMenu
        };
      }
    }
  ]
};

// ==========================================
// 6. ELECTION BALLOT RESULTS (SECOND ROUND)
// ==========================================
export const presidentialElectionResultsRound2: GameEvent = {
  id: 'presidential_election_results_round2',
  title: 'Presidential General Election — Second Round Runoff Results',
  titleZh: '总统大选第二轮最终计票结果',
  description: 'The final runoff ballots are being tallied. Under the rules of the Second Republic, the candidate with the highest total of combined deputy and elector votes in the second round is elected President. No further stalling is possible.',
  descriptionZh: '第二轮决胜轮的最终投计票工作已经宣告结束。在简单多数制下，得票最高者将直接宣誓就职第二共和国新一任总统，大局已定。',
  condition: () => false, // Handled sequentially via currentEvent transitions
  renderContent: (state) => renderResultsTable(state, true),
  options: [
    {
      text: 'Conclude Election. Install the new President.',
      textZh: '确认大选结果。新总统即将正式就职！',
      subtitle: 'The winner is determined by simple majority and assumes office.',
      subtitleZh: '通过简单多数优势决出了最终胜者，胜选者即日起就任总统职，国家政策和各方关系将产生深远的影响。',
      effect: (state) => {
        const results = calculatePresidentialVotes(state, state.presidentElectionLeftCandidate || 'azana', state.presidentElectionActiveCandidate);
        return getWinnerEffects(state, results.winner!);
      }
    }
  ]
};

// ==========================================
// 7. ABSTENTION RESOLUTION (AUTO RESOLVE)
// ==========================================
export const presidentialElectionAutoResolve: GameEvent = {
  id: 'presidential_election_auto_resolve',
  title: 'Presidential Election: Abstention Path',
  titleZh: '总统选举：弃权路线',
  description: 'The CNT has stood aside, refusing to participate in the presidential election. In our absence, the 470 deputies of the Cortes and the 470 newly elected electors convene to cast their votes based on the prevailing strength of each political party.',
  descriptionZh: 'CNT选择不介入总统选举。议会的议员和另行普选的选举人将按照各党派现有的政治力量自行投票。整个大选在没有工会干涉的情况下进行。',
  condition: () => false, // Handled sequentially via currentEvent transitions
  renderContent: (state) => {
    const isZh = state.language === 'zh';
    const results = calculatePresidentialVotes(state, 'azana', null);
    
    const candidates = [
      { id: 'left', name: isZh ? '曼努埃尔·阿萨尼亚 (左翼)' : 'Manuel Azaña (Left)', dep: results.deputyVotes.left, elec: results.electorVotes.left, tot: results.votes.left },
      { id: 'martinez_barrio', name: isZh ? '迭戈·马丁内斯·巴里奥 (中间派)' : 'Diego Martínez Barrio (Center)', dep: results.deputyVotes.martinez_barrio, elec: results.electorVotes.martinez_barrio, tot: results.votes.martinez_barrio },
      { id: 'gil_robles', name: isZh ? '何塞·马利亚·吉尔-罗伯斯 (右翼)' : 'José María Gil-Robles (Right)', dep: results.deputyVotes.gil_robles, elec: results.electorVotes.gil_robles, tot: results.votes.gil_robles },
    ];
    
    return React.createElement('div', { className: 'w-full mt-4 font-mono text-sm border border-ink p-4 bg-paper' },
      React.createElement('div', { className: 'border-b border-ink pb-2 mb-2 font-bold uppercase text-center' },
        isZh ? '第一轮计票结果 (总计940票)' : 'First Round Voting Results (Total 940)'
      ),
      React.createElement('table', { className: 'w-full text-left' },
        React.createElement('thead', null,
          React.createElement('tr', { className: 'border-b border-ink pb-1' },
            React.createElement('th', { className: 'py-1' }, isZh ? '候选人' : 'Candidate'),
            React.createElement('th', { className: 'py-1 text-right' }, isZh ? '议员票' : 'Deputies'),
            React.createElement('th', { className: 'py-1 text-right' }, isZh ? '选举人' : 'Electors'),
            React.createElement('th', { className: 'py-1 text-right' }, isZh ? '总计' : 'Total'),
            React.createElement('th', { className: 'py-1 text-right' }, isZh ? '比例' : 'Share')
          )
        ),
        React.createElement('tbody', null,
          candidates.map(c => 
            React.createElement('tr', { key: c.id, className: 'border-b border-ink/10' },
              React.createElement('td', { className: 'py-1 font-serif' }, c.name),
              React.createElement('td', { className: 'py-1 text-right' }, c.dep),
              React.createElement('td', { className: 'py-1 text-right' }, c.elec),
              React.createElement('td', { className: 'py-1 text-right font-bold' }, c.tot),
              React.createElement('td', { className: 'py-1 text-right font-bold' }, `${((c.tot / 940) * 100).toFixed(1)}%`)
            )
          )
        )
      ),
      React.createElement('div', { className: 'mt-4 pt-2 border-t border-ink flex flex-col gap-1 text-xs' },
        React.createElement('div', null, 
          isZh 
            ? `需2/3多数：${results.majorityRequired} 票` 
            : `2/3 Majority Required: ${results.majorityRequired} votes`
        ),
        React.createElement('div', { className: 'text-cnt-red font-bold' },
          isZh
            ? '⚠️ 无人达到2/3多数 → 进入第二轮简单多数制。'
            : '⚠️ No one reached 2/3 majority -> Proceed to second round (simple majority).'
        ),
        React.createElement('div', { className: 'text-ink-light italic mt-1' },
          isZh
            ? '历史性退选：由于右翼威胁，马丁内斯·巴里奥宣布退选，并呼吁中间派代表支持阿萨尼亚，确保左翼在第二轮中获得绝对多数。'
            : 'Historical Backing: To block a right-wing takeover, Martínez Barrio retires and endorses Azaña, ensuring an absolute majority for the Left in the second round.'
        )
      )
    );
  },
  options: [
    {
      text: 'Conclude Election. Manuel Azaña is elected President.',
      textZh: '大选尘埃落定。曼努埃尔·阿萨尼亚当选总统。',
      subtitle: 'Manuel Azaña assumes the Presidency. Stability is maintained, but the military reaction is accelerated.',
      subtitleZh: '曼努埃尔·阿萨尼亚就任总统。宪法秩序和改革政策得以维持，但军方的反弹正在加剧。',
      effect: (state) => {
        const stats = { ...state.stats };
        stats.republicanAuthority = Math.min(100, (stats.republicanAuthority || 0) + 5);
        
        const dp = { ...state.domesticPolicy };
        dp.land_reform_progress = Math.min(100, (dp.land_reform_progress || 0) + 15);
        
        const gov = { ...state.government };
        gov.president = 'Manuel Azaña';
        gov.presidentZh = '曼努埃尔·阿萨尼亚';
        
        return {
          government: gov,
          stats,
          domesticPolicy: dp,
          coupProgress: Math.min(100, (state.coupProgress || 0) + 10),
          presidentElectionSeen: true
        };
      }
    }
  ]
};

// ==========================================
// HELPERS FOR RESULTS TABLE RENDERING & WINNER EFFECTS
// ==========================================
function getWinnerEffects(state: GameState, winner: string) {
  const leftCand = state.presidentElectionLeftCandidate || 'azana';
  const finalKey = winner === 'left' ? `left_${leftCand}` : winner;
  
  if (finalKey === 'left_azana') {
    const stats = { ...state.stats };
    stats.republicanAuthority = Math.min(100, (stats.republicanAuthority || 0) + 5);
    
    const dp = { ...state.domesticPolicy };
    dp.land_reform_progress = Math.min(100, (dp.land_reform_progress || 0) + 15);
    
    const gov = { ...state.government };
    gov.president = 'Manuel Azaña';
    gov.presidentZh = '曼努埃尔·阿萨尼亚';
    
    return {
      government: gov,
      stats,
      domesticPolicy: dp,
      coupProgress: Math.min(100, (state.coupProgress || 0) + 10),
      presidentElectionSeen: true
    };
  } else if (finalKey === 'left_ramon_franco') {
    const stats = { ...state.stats };
    stats.tension = Math.min(100, (stats.tension || 0) + 10);
    stats.revolutionaryFervor = Math.min(100, (stats.revolutionaryFervor || 0) + 10);
    
    const dp = { ...state.domesticPolicy };
    dp.regional_autonomy_progress = Math.min(100, (dp.regional_autonomy_progress || 0) + 35);
    
    const rel = { ...state.relations };
    rel.portugal = Math.min(100, (rel.portugal || 0) + 20);
    
    const pr = { ...state.partyRelations };
    pr.PSOE = Math.max(-100, (pr.PSOE || 0) - 15);
    
    const gov = { ...state.government };
    gov.president = 'Ramón Franco';
    gov.presidentZh = '拉蒙·佛朗哥';
    
    return {
      government: gov,
      stats,
      domesticPolicy: dp,
      relations: rel,
      partyRelations: pr,
      coupProgress: Math.min(100, (state.coupProgress || 0) + 25),
      presidentElectionSeen: true
    };
  } else if (finalKey === 'martinez_barrio') {
    const stats = { ...state.stats };
    stats.tension = Math.max(0, (stats.tension || 0) - 5);
    stats.republicanAuthority = Math.min(100, (stats.republicanAuthority || 0) + 10);
    
    const dp = { ...state.domesticPolicy };
    dp.land_reform_progress = Math.min(100, (dp.land_reform_progress || 0) + 5);
    dp.women_suffrage = Math.min(100, (dp.women_suffrage || 0) + 5);
    
    const pr = { ...state.partyRelations };
    pr.PRR = Math.min(100, (pr.PRR || 0) + 20);
    pr.DLR = Math.min(100, (pr.DLR || 0) + 20);
    pr.PSOE = Math.min(100, (pr.PSOE || 0) + 10);
    
    const gov = { ...state.government };
    gov.president = 'Diego Martínez Barrio';
    gov.presidentZh = '迭戈·马丁内斯·巴里奥';
    
    return {
      government: gov,
      stats,
      domesticPolicy: dp,
      partyRelations: pr,
      coupProgress: Math.min(100, (state.coupProgress || 0) + 5),
      presidentElectionSeen: true
    };
  } else {
    // gil_robles
    const stats = { ...state.stats };
    stats.tension = Math.min(100, (stats.tension || 0) + 25);
    stats.revolutionaryFervor = Math.min(100, (stats.revolutionaryFervor || 0) + 30);
    stats.republicanAuthority = Math.max(0, (stats.republicanAuthority || 0) - 30);
    
    const dp = { ...state.domesticPolicy };
    dp.land_reform_progress = Math.max(0, (dp.land_reform_progress || 0) - 35);
    dp.max_hours_law = Math.max(0, (dp.max_hours_law || 0) - 30);
    dp.min_wage = Math.max(0, (dp.min_wage || 0) - 30);
    dp.religion_policy = Math.max(0, (dp.religion_policy || 0) - 35);
    dp.women_suffrage = Math.max(0, (dp.women_suffrage || 0) - 15);
    
    const pr = { ...state.partyRelations };
    pr.PSOE = Math.max(-100, (pr.PSOE || 0) - 35);
    pr.PCE = Math.max(-100, (pr.PCE || 0) - 40);
    pr.IR = Math.max(-100, (pr.IR || 0) - 30);
    
    const gov = { ...state.government };
    gov.president = 'José María Gil-Robles';
    gov.presidentZh = '何塞·马利亚·吉尔-罗伯斯';
    
    return {
      government: gov,
      stats,
      domesticPolicy: dp,
      partyRelations: pr,
      coupProgress: Math.min(100, (state.coupProgress || 0) + 5),
      presidentElectionSeen: true
    };
  }
}

function renderResultsTable(state: GameState, isRound2: boolean) {
  const isZh = state.language === 'zh';
  const leftCand = state.presidentElectionLeftCandidate || 'azana';
  const activeCand = state.presidentElectionActiveCandidate;
  
  const results = calculatePresidentialVotes(state, leftCand, activeCand);
  
  const leftName = leftCand === 'ramon_franco' 
    ? (isZh ? '拉蒙·佛朗哥 (左翼)' : 'Ramón Franco (Left)')
    : (isZh ? '曼努埃尔·阿萨尼亚 (左翼)' : 'Manuel Azaña (Left)');
    
  const candidates = [
    { id: 'left', name: leftName, dep: results.deputyVotes.left, elec: results.electorVotes.left, tot: results.votes.left },
    { id: 'martinez_barrio', name: isZh ? '迭戈·马丁内斯·巴里奥 (中间派)' : 'Diego Martínez Barrio (Center)', dep: results.deputyVotes.martinez_barrio, elec: results.electorVotes.martinez_barrio, tot: results.votes.martinez_barrio },
    { id: 'gil_robles', name: isZh ? '何塞·马利亚·吉尔-罗伯斯 (右翼)' : 'José María Gil-Robles (Right)', dep: results.deputyVotes.gil_robles, elec: results.electorVotes.gil_robles, tot: results.votes.gil_robles },
  ];
  
  return React.createElement('div', { className: 'w-full mt-4 font-mono text-sm border border-ink p-4 bg-paper' },
    React.createElement('div', { className: 'border-b border-ink pb-2 mb-2 font-bold uppercase text-center' },
      isZh 
        ? `${isRound2 ? '第二轮' : '第一轮'}大选计票结果 (总计940票)` 
        : `${isRound2 ? 'Second Round' : 'First Round'} Ballot Counting (Total 940)`
    ),
    React.createElement('table', { className: 'w-full text-left' },
      React.createElement('thead', null,
        React.createElement('tr', { className: 'border-b border-ink pb-1' },
          React.createElement('th', { className: 'py-1' }, isZh ? '候选人' : 'Candidate'),
          React.createElement('th', { className: 'py-1 text-right' }, isZh ? '议员票' : 'Deputies'),
          React.createElement('th', { className: 'py-1 text-right' }, isZh ? '选举人' : 'Electors'),
          React.createElement('th', { className: 'py-1 text-right' }, isZh ? '总计' : 'Total'),
          React.createElement('th', { className: 'py-1 text-right' }, isZh ? '比例' : 'Share')
        )
      ),
      React.createElement('tbody', null,
        candidates.map(c => 
          React.createElement('tr', { key: c.id, className: 'border-b border-ink/10' },
            React.createElement('td', { className: 'py-1 font-serif font-bold' }, c.name),
            React.createElement('td', { className: 'py-1 text-right font-mono' }, c.dep),
            React.createElement('td', { className: 'py-1 text-right font-mono' }, c.elec),
            React.createElement('td', { className: 'py-1 text-right font-mono font-bold' }, c.tot),
            React.createElement('td', { className: 'py-1 text-right font-mono font-bold text-cnt-red' }, `${((c.tot / 940) * 100).toFixed(1)}%`)
          )
        )
      )
    ),
    React.createElement('div', { className: 'mt-4 pt-2 border-t border-ink flex flex-col gap-1 text-xs' },
      React.createElement('div', null, 
        isZh 
          ? `胜选线：${isRound2 ? '简单多数（得票最高者）' : `2/3 绝对多数（即 ${results.majorityRequired} 票）`}` 
          : `Threshold: ${isRound2 ? 'Simple Majority (Highest votes)' : `2/3 Absolute Majority (${results.majorityRequired} votes)`}`
      ),
      React.createElement('div', { className: 'font-bold text-cnt-red mt-1' },
        results.hasWinner
          ? (isZh 
              ? `✅ 恭喜！${results.winner === 'left' ? (leftCand === 'ramon_franco' ? '拉蒙·佛朗哥' : '曼努埃尔·阿萨尼亚') : (results.winner === 'martinez_barrio' ? '迭戈·马丁内斯·巴里奥' : '何塞·马利亚·吉尔-罗伯斯')} 已成功获得法定多数，当选共和国总统！`
              : `✅ Confirmed! ${results.winner === 'left' ? (leftCand === 'ramon_franco' ? 'Ramón Franco' : 'Manuel Azaña') : (results.winner === 'martinez_barrio' ? 'Diego Martínez Barrio' : 'José María Gil-Robles')} has won and is elected President of Spain!`)
          : (isZh
              ? `⚠️ 僵局！第一轮投票中没有任何候选人能够夺得 ${results.majorityRequired} 票的绝对多数。`
              : `⚠️ Deadlock! No candidate has achieved the required absolute majority of ${results.majorityRequired} votes in this ballot.`)
      )
    )
  );
}
