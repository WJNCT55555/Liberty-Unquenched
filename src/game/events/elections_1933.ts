import React from 'react';
import type { GameEvent, Party, MinisterParty } from '../types';
import { adjustFactionInfluence, adjustClassSupport, isAtOrAfter } from '../utils';
import { calculateElectionResults } from '../utils/election';
import { formCoalition } from '../utils/coalition';
import { ParliamentChart } from '../../components/ParliamentChart';
import { PARTY_COLORS } from '../constants';
import { getPartyName } from '../partyNames';

const election1933Meta = {
  category: 'politics' as const,
  flow: 'inline.root' as const,
  series: ['elections', 'election_1933'],
  tags: ['election'],
};

const election1933LeafMeta = {
  ...election1933Meta,
  flow: 'inline.leaf' as const,
};

export const elections1933: GameEvent = {
  id: 'elections_1933',
  meta: election1933Meta,
  date: { year: 1933, month: 11 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1933, 11),
  title: '1933 General Elections',
  titleZh: '1933年大选',
  description: 'With the collapse of the Republican-Socialist coalition, President Alcalá-Zamora has dissolved the Cortes and called for new elections. The political landscape has shifted dramatically since 1931. The right, now united under CEDA, is mobilizing aggressively. The left is fragmented, with the PSOE running alone in many districts. Women will vote for the first time in national elections. Once again, the CNT must decide: do we abstain, or do we intervene to stop the reactionary tide?',
  descriptionZh: '随着共和-社会党联盟的崩溃，阿尔卡拉-萨莫拉总统解散了议会并呼吁举行新的选举。自 1931 年以来，政治格局发生了巨大的变化。现在在 CEDA 领导下团结起来的右翼正在积极动员。左翼则四分五裂，PSOE 在许多选区单独参选。妇女将首次在全国大选中投票。CNT 再一次必须做出决定：我们是弃权，还是干预以阻止反动浪潮？',
  options: [
    {
      text: 'Abstain! "Frente a las urnas, revolución social" (Against the ballot boxes, social revolution!)',
      textZh: '弃权！“不要投票箱，要社会革命！”',
      subtitle: 'A massive abstention campaign will likely lead to a right-wing victory.',
      subtitleZh: '大规模的弃权运动很可能导致右翼获胜。',
      effect: (state) => {
        let newClasses = state.classes;
        // Massive abstention hurts the left severely
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PSOE', -15);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'IR', -5);
        
        // Right wing consolidates further due to clear path
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'AP', 10);
        newClasses = adjustClassSupport(newClasses, 'Clero', 'AP', 10);

        return {
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Faistas', 15),
          stats: { 
            ...state.stats, 
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15)
          },
          pendingEvents: [{ ...elections1933Results }, ...state.pendingEvents.filter(e => e.id !== elections1933Results.id)]
        };
      },
    },
    {
      text: 'The threat of CEDA is too great. Issue a quiet directive to vote against the right.',
      textZh: 'CEDA 的威胁太大了。发布一个安静的指示，投票反对右翼。',
      subtitle: 'Betrays our anti-electoral stance but might prevent a reactionary government.',
      subtitleZh: '背叛了我们的反选举立场，但可能会阻止一个反动政府的出现。',
      effect: (state) => {
        let newClasses = state.classes;
        // Supporting the left mitigates their losses
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'PSOE', 10);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'IR', 5);
        
        return {
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Treintistas', 10),
          stats: { 
            ...state.stats, 
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 10)
          },
          pendingEvents: [{ ...elections1933Results }, ...state.pendingEvents.filter(e => e.id !== elections1933Results.id)]
        };
      },
    },
  ],
};

export const elections1933Results: GameEvent = {
  id: 'elections_1933_results',
  meta: election1933LeafMeta,
  title: 'Results of the 1933 General Elections',
  titleZh: '1933年大选结果',
  description: 'The results are in. The electoral system, designed to reward broad coalitions, has this time severely punished the divided left and rewarded the united right. CEDA has emerged as the largest party in the Cortes, followed closely by Lerroux\'s Radicals. The socialists have suffered a catastrophic defeat in terms of seats, despite maintaining significant popular support. Spain has swung sharply to the right.',
  descriptionZh: '结果出来了。旨在奖励广泛联盟的选举制度，这次严厉惩罚了分裂的左翼，并奖励了团结的右翼。CEDA 成为议会第一大党，紧随其后的是勒鲁的激进党。尽管社会党人保持了相当的民众支持，但他们在席位上遭遇了灾难性的失败。西班牙急剧向右转。',
  renderContent: (state) => {
    const isZh = state.language === 'zh';
    const cortes = calculateElectionResults(state);
    
    
    const partyOrder: Party[] = ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'Other', 'PRRevS'];

    const data = Object.entries(cortes).map(([party, seats]) => ({
      id: party,
      name: getPartyName(state, party as Party, isZh),
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

    const rightSeats = cortes.AP + cortes.CT + cortes.RE;
    const centerRightSeats = cortes.DLR + cortes.AP;
    const leftSeats = cortes.PSOE + cortes.IR + cortes.UR + cortes.PCE + cortes.PS + cortes.POUM;

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
              React.createElement('span', { className: 'font-medium' }, isZh ? '右翼 (CEDA 等): ' : 'Right (CEDA, etc): '),
              `${formatPct(rightSeats)} (${rightSeats} ${isZh ? '席' : 'seats'})`
            ),
            React.createElement('li', null, 
              React.createElement('span', { className: 'font-medium' }, isZh ? '中右翼联盟 (激进党 + CEDA): ' : 'Center-Right (PRR + CEDA): '),
              `${formatPct(centerRightSeats)} (${centerRightSeats} ${isZh ? '席' : 'seats'})`
            ),
            React.createElement('li', null, 
              React.createElement('span', { className: 'font-medium' }, isZh ? '左翼 (社会党、共和左翼): ' : 'Left (PSOE, IR): '),
              `${formatPct(leftSeats)} (${leftSeats} ${isZh ? '席' : 'seats'})`
            )
          )
        )
      )
    );
  },
  options: [
    {
      text: (state) => {
        const cortes = calculateElectionResults(state);
        const centerRightSeats = (cortes.DLR || 0) + (cortes.AP || 0);
        const totalSeats = Object.values(cortes).reduce((sum, s) => sum + s, 0) || 1;
        const pct = Math.round((centerRightSeats / totalSeats) * 100);
        return `A dark period begins. The "Bienio Negro" is upon us. (Radical-CEDA: ${pct}%)`;
      },
      textZh: (state) => {
        const cortes = calculateElectionResults(state);
        const centerRightSeats = (cortes.DLR || 0) + (cortes.AP || 0);
        const totalSeats = Object.values(cortes).reduce((sum, s) => sum + s, 0) || 1;
        const pct = Math.round((centerRightSeats / totalSeats) * 100);
        return `一段黑暗时期开始了。“黑色两年”（Bienio Negro）降临了。（激进党-CEDA得票率：${pct}%）`;
      },
      effect: (state) => {
        const newCortes = calculateElectionResults(state);
        
        // Kick the CNT out of government and assign the historical Radical-CEDA ministers
        const min = { ...state.ministers };
        const hist1933: Record<string, string> = {
          labor: 'PRR',
          health: 'PRR',
          justice: 'Other',
          industry: 'Other',
          interior: 'Other',
          war: 'PRR',
          agriculture: 'Other',
          finance: 'PRR',
          estado: 'Other',
        };
        for (const role of Object.keys(hist1933)) {
          min[role as keyof typeof min] = hist1933[role] as MinisterParty;
        }

        const baseState = {
          ...state,
          cortes: newCortes,
          cntStance: 'oppose' as const,
          ministers: min,
          government: {
            ...state.government,
            type: 'Radical-CEDA Government',
            typeZh: '激进党-CEDA 政府',
            primeMinister: 'Alejandro Lerroux',
            primeMinisterZh: '亚历杭德罗·勒鲁'
          },
          // CEDA and Radicals roll back reforms
          domesticPolicy: {
            ...state.domesticPolicy,
            land_reform_progress: Math.max(0, state.domesticPolicy.land_reform_progress - 20),
            max_hours_law: Math.max(0, state.domesticPolicy.max_hours_law - 20),
            min_wage: Math.max(0, state.domesticPolicy.min_wage - 20)
          },
          stats: {
            ...state.stats,
            workerControl: Math.max(0, state.stats.workerControl - 10)
          }
        };

        const finalState = formCoalition(baseState, 'ceda_radical', true);

        return {
          cortes: finalState.cortes,
          cntStance: finalState.cntStance,
          ministers: finalState.ministers,
          government: finalState.government,
          domesticPolicy: finalState.domesticPolicy,
          stats: finalState.stats,
          rulingCoalition: finalState.rulingCoalition,
          activeCoalitions: finalState.activeCoalitions,
          coalitionHistory: finalState.coalitionHistory
        };
      }
    }
  ]
};
