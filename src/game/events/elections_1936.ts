import { GameEvent, Party } from '../types';
import { adjustFactionInfluence, adjustClassSupport, isAtOrAfter } from '../utils';
import { calculateElectionResults } from '../utils/election';
import { formCoalition } from '../utils/coalition';

const election1936Meta = {
  category: 'politics' as const,
  flow: 'inline' as const,
  series: ['elections', 'election_1936'],
  tags: ['election'],
};

export const elections1936: GameEvent = {
  id: '1936_general_elections',
  date: { year: 1936, month: 2 },
  condition: (state) => state.scenario !== '1936' && isAtOrAfter(state, 1936, 2),
  meta: election1936Meta,
  title: '1936 General Elections',
  titleZh: '1936年大选',
  description: 'By early 1936, after the collapse of the Radical-CEDA coalition (Bienio Negro) amidst massive scandals and political instability, general elections have been called. Spain is intensely polarized. On the Left, a broad coalition, the "Popular Front" (Frente Popular), has been forged. They demand immediate amnesty for the tens of thousands of political prisoners jailed after the October 1934 revolution. On the Right, the "National Front" rallies to save Christian civilization from marxism and anarchy. The CNT holds the balance of power. Historically, we advocate for total electoral abstention. But if we abstain, the Right wins and our comrades remain imprisoned. If we support the Popular Front, we can achieve amnesty, but at the cost of class compromise. What shall be our stance?',
  descriptionZh: '1936年初，在经历了一系列丑闻和政治动荡导致激进党-CEDA联合政府（黑色两年）崩溃后，西班牙宣布举行大选。全国局势极度两极分化。在左翼，由社会党、共产党、马统工党及共和派等组成的“人民阵线”（Frente Popular）宣告成立，他们最核心的诉求是立即特赦在1934年十月起义后被捕入狱的数万名政治犯。在右翼，由CEDA、传统主义者、长枪党等组成的“国家阵线”团结在一起，发誓要将基督教文明从马克思主义和无政府状态中拯救出来。CNT再次处于力量的平衡点上：传统的教条要求我们绝对弃权，但如果弃权，右翼获胜，我们的同志就无法出狱。如果支持人民阵线，就能迎来大特赦，但需要进行阶级妥协。我们的立场是什么？',
  options: [
    {
      text: 'Amnesty First! Quietly lift the abstention campaign to free our comrades.',
      textZh: '特赦优先！悄然取消反选举宣传，号召选民投票以释放我们的同志。',
      subtitle: 'Boosts Popular Front turnout significantly. Tens of thousands of workers will vote to empty the prisons.',
      subtitleZh: '大幅推高人民阵线的投票率。数万名工人将为了清空监狱而走向投票箱。',
      effect: (state) => {
        let newClasses = state.classes;
        // Workers mobilize heavily for Left parties
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PSOE', 12);
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PCE', 8);
        if (state.poum_founded) {
          newClasses = adjustClassSupport(newClasses, 'Obreros', 'POUM', 5);
        }
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'PSOE', 10);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'IR', 5);

        // Anarchist purists are displeased with electoral participation
        const newFactions = adjustFactionInfluence(state.factions, 'Faistas', 5);

        return {
          classes: newClasses,
          cntStance: 'cooperate' as const,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 10)
          },
          pendingEvents: [{ ...elections1936Results }, ...state.pendingEvents.filter(e => e.id !== elections1936Results.id)]
        };
      }
    },
    {
      text: 'Absolute Abstention! "No votéis" – The ballot box is the tomb of revolution.',
      textZh: '绝对弃权！“不要投票”——选票箱是革命的坟墓。',
      subtitle: 'Maintains pure anarchist anti-electoral principles. This will likely hand victory to the right-wing National Front.',
      subtitleZh: '维持纯粹的无无政府主义反选举原则。这很可能将胜利拱手让给右翼的国家阵线。',
      effect: (state) => {
        let newClasses = state.classes;
        // Abstention severely drains Left vote share
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PSOE', -15);
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PCE', -10);
        if (state.poum_founded) {
          newClasses = adjustClassSupport(newClasses, 'Obreros', 'POUM', -5);
        }
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'PSOE', -12);

        // Faistas faction is happy
        const newFactions = adjustFactionInfluence(state.factions, 'Faistas', 15);

        return {
          classes: newClasses,
          cntStance: 'oppose' as const,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15)
          },
          pendingEvents: [{ ...elections1936Results }, ...state.pendingEvents.filter(e => e.id !== elections1936Results.id)]
        };
      }
    }
  ]
};

import React from 'react';
import { ParliamentChart } from '../../components/ParliamentChart';
import { PARTY_COLORS } from '../constants';

export const elections1936Results: GameEvent = {
  id: '1936_elections_results',
  meta: election1936Meta,
  title: 'Results of the 1936 General Elections',
  titleZh: '1936年大选结果',
  description: 'The results are in. The nation is fractured down the middle. In a high-stakes climate, millions of citizens flooded the voting booths. The final seat distribution in the Cortes will decide the fate of Spain.',
  descriptionZh: '大选结果已经出炉。整个国家从中间被生生撕裂。在这一场事关命运的高风险角逐中，数百万公民涌入了投票站。议会中的最终席位分配将直接决定西班牙的未来命运。',
  renderContent: (state) => {
    const isZh = state.language === 'zh';
    const cortes = state.cortes || calculateElectionResults(state);
    
    const partyNames: Record<Party, { en: string, zh: string }> = {
      PSOE: { en: 'PSOE', zh: '工人社会党' },
      IR: { en: 'IR', zh: '共和左翼' },
      UR: { en: 'UR', zh: '共和联盟' },
      PCE: { en: 'PCE', zh: '西班牙共产党' },
      PS: { en: 'PS', zh: '工团主义党' },
      FE: { en: 'FE', zh: '长枪党' },
      POUM: { en: 'POUM', zh: '马统工党' },
      AP: { en: 'CEDA', zh: '西班牙自治右翼联盟' },
      CT: { en: 'CT', zh: '传统主义者 (卡洛斯派)' },
      RE: { en: 'RE', zh: '西班牙革新党' },
      DLR: { en: 'DLR', zh: '自由共和右翼' },
      PRR: { en: 'PRR', zh: '共和激进党 (勒鲁派)' },
      ERC: { en: 'ERC', zh: '加泰罗尼亚共和左翼' },
      PNV: { en: 'PNV', zh: '巴斯克民族主义党' },
      Other: { en: 'Other', zh: '其他' },
      PRRevS: { en: 'PRRevS', zh: '革命共和工团党' }
    };

    const partyOrder: Party[] = ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'Other', 'PRRevS'];

    const data = Object.entries(cortes).map(([party, seats]) => ({
      id: party,
      name: isZh ? partyNames[party as Party].zh : partyNames[party as Party].en,
      seats,
      color: PARTY_COLORS[party] || '#9ca3af'
    }))
    .filter(d => d.seats > 0)
    .sort((a, b) => {
      const indexA = partyOrder.indexOf(a.id as Party);
      const indexB = partyOrder.indexOf(b.id as Party);
      const finalIndexA = indexA === -1 ? 999 : indexA;
      const finalIndexB = indexB === -1 ? 999 : indexB;
      return finalIndexA - finalIndexB;
    });
    
    const totalSeats = data.reduce((sum, d) => sum + d.seats, 0);
    const formatPct = (seats: number) => `${Math.round((seats / totalSeats) * 100)}%`;

    const leftSeats = (cortes.PSOE || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PCE || 0) + (cortes.ERC || 0) + (cortes.POUM || 0) + (cortes.PS || 0);
    const rightSeats = (cortes.AP || 0) + (cortes.CT || 0) + (cortes.RE || 0) + (cortes.FE || 0);
    const centerSeats = (cortes.PRR || 0) + (cortes.DLR || 0) + (cortes.Other || 0);

    return React.createElement('div', { className: 'flex flex-col items-center w-full' },
      React.createElement(ParliamentChart, { data, width: 400, height: 200 }),
      
      React.createElement('div', { className: 'w-full mt-6 text-sm font-mono' },
        React.createElement('table', { className: 'w-full text-left border-collapse' },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'border-b border-gray-700' },
              React.createElement('th', { className: 'pb-2 font-medium' }, isZh ? '政党' : 'Party'),
              React.createElement('th', { className: 'pb-2 font-medium' }, isZh ? '席位' : 'Seats'),
              React.createElement('th', { className: 'pb-2 font-medium' }, isZh ? '比例' : 'Share')
            )
          ),
          React.createElement('tbody', null,
            data.map(party => 
              React.createElement('tr', { key: party.id, className: 'border-b border-gray-800/50' },
                React.createElement('td', { className: 'py-2 flex items-center gap-2' },
                  React.createElement('div', { className: 'w-3 h-3 rounded-sm', style: { backgroundColor: party.color } }),
                  React.createElement('span', { className: 'font-bold' }, party.name)
                ),
                React.createElement('td', { className: 'py-2' }, party.seats),
                React.createElement('td', { className: 'py-2' }, formatPct(party.seats))
              )
            )
          )
        ),
        
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h4', { className: 'font-bold mb-3 text-base' }, isZh ? '政治派系力量对比:' : 'Bloc Power:'),
          React.createElement('ul', { className: 'space-y-3' },
            React.createElement('li', null, 
              React.createElement('span', { className: 'font-medium text-red-400' }, isZh ? '人民阵线 (左翼联盟): ' : 'Popular Front (Left Bloc): '),
              `${formatPct(leftSeats)} (${leftSeats} ${isZh ? '席' : 'seats'})`
            ),
            React.createElement('li', null, 
              React.createElement('span', { className: 'font-medium text-blue-400' }, isZh ? '国家阵线 (右翼联盟): ' : 'National Front (Right Bloc): '),
              `${formatPct(rightSeats)} (${rightSeats} ${isZh ? '席' : 'seats'})`
            ),
            React.createElement('li', null, 
              React.createElement('span', { className: 'font-medium text-gray-400' }, isZh ? '中间派: ' : 'Center Bloc: '),
              `${formatPct(centerSeats)} (${centerSeats} ${isZh ? '席' : 'seats'})`
            )
          )
        )
      )
    );
  },
  options: [
    {
      text: 'Form the Popular Front Cabinet! The Left secures power and declares amnesty.',
      textZh: '组建人民阵线内阁！左翼重掌政权并立即颁布大特赦。',
      condition: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const leftSeats = (cortes.PSOE || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PCE || 0) + (cortes.ERC || 0) + (cortes.POUM || 0) + (cortes.PS || 0);
        const rightSeats = (cortes.AP || 0) + (cortes.CT || 0) + (cortes.RE || 0) + (cortes.FE || 0);
        return leftSeats >= rightSeats;
      },
      unavailableSubtitle: (state) => 'Popular Front seats must exceed or equal National Front seats.',
      unavailableSubtitleZh: (state) => '人民阵线席位必须大于或等于国家阵线。',
      effect: (state) => {
        const newCortes = calculateElectionResults(state);
        const updatedMinisters = { ...state.ministers };
        const hist1936: Record<string, string> = {
          labor: 'ERC',
          health: 'ERC',
          justice: 'UR',
          industry: 'Other',
          interior: 'Other',
          war: 'IR',
          agriculture: 'IR',
          finance: 'IR',
          estado: 'UR',
        };
        for (const role of Object.keys(hist1936)) {
          if (updatedMinisters[role as keyof typeof updatedMinisters] !== 'CNT') {
            updatedMinisters[role as keyof typeof updatedMinisters] = hist1936[role] as any;
          }
        }

        const baseState = {
          ...state,
          cortes: newCortes,
          ministers: updatedMinisters,
          government: {
            ...state.government,
            type: 'Popular Front Cabinet',
            typeZh: '人民阵线内阁',
            primeMinister: 'Manuel Azaña',
            primeMinisterZh: '曼努埃尔·阿萨尼亚'
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10)
          }
        };

        const finalState = formCoalition(baseState, 'popular_front');
        return {
          ...finalState,
          currentEvent: null
        };
      }
    },
    {
      text: 'The National Front consolidates. A dark period of reaction begins.',
      textZh: '国家阵线巩固权力。黑暗的反动时期拉开帷幕。',
      condition: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const leftSeats = (cortes.PSOE || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PCE || 0) + (cortes.ERC || 0) + (cortes.POUM || 0) + (cortes.PS || 0);
        const rightSeats = (cortes.AP || 0) + (cortes.CT || 0) + (cortes.RE || 0) + (cortes.FE || 0);
        return rightSeats > leftSeats;
      },
      unavailableSubtitle: (state) => 'National Front seats must exceed Popular Front seats.',
      unavailableSubtitleZh: (state) => '国家阵线席位必须大于人民阵线。',
      effect: (state) => {
        const newCortes = calculateElectionResults(state);
        const updatedMinisters = { ...state.ministers };
        for (const role of Object.keys(updatedMinisters)) {
          if (updatedMinisters[role as keyof typeof updatedMinisters] !== 'CNT') {
            updatedMinisters[role as keyof typeof updatedMinisters] = 'Right';
          }
        }
        return {
          cortes: newCortes,
          cntStance: 'oppose' as const,
          ministers: updatedMinisters,
          government: {
            ...state.government,
            type: 'National Front Government',
            typeZh: '国家阵线政府',
            primeMinister: 'José María Gil-Robles',
            primeMinisterZh: '何塞·玛丽亚·吉尔-罗伯斯'
          },
          domesticPolicy: {
            ...state.domesticPolicy,
            land_reform_progress: Math.max(0, state.domesticPolicy.land_reform_progress - 30),
            max_hours_law: Math.max(0, state.domesticPolicy.max_hours_law - 30),
            min_wage: Math.max(0, state.domesticPolicy.min_wage - 30)
          },
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 30),
            workerControl: Math.max(0, state.stats.workerControl - 15)
          }
        };
      }
    }
  ]
};
