import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';
import { calculateElectionResults } from '../utils/election';

export const elections1933: GameEvent = {
  id: '1933_general_elections',
  date: { year: 1933, month: 11 },
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
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        // Massive abstention hurts the left severely
        newClasses.Obreros.support.PSOE -= 15;
        newClasses.PequenaBurguesia.support.IR -= 5;
        
        // Right wing consolidates further due to clear path
        newClasses.Latifundistas.support.AP += 10;
        newClasses.Clero.support.AP += 10;

        return {
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Faistas', 15),
          stats: { 
            ...state.stats, 
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15),
            popularFrontUnity: Math.max(0, state.stats.popularFrontUnity - 15)
          },
          pendingEvents: [{ ...elections1933Results }, ...state.pendingEvents]
        };
      },
    },
    {
      text: 'The threat of CEDA is too great. Issue a quiet directive to vote against the right.',
      textZh: 'CEDA 的威胁太大了。发布一个安静的指示，投票反对右翼。',
      subtitle: 'Betrays our anti-electoral stance but might prevent a reactionary government.',
      subtitleZh: '背叛了我们的反选举立场，但可能会阻止一个反动政府的出现。',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        // Supporting the left mitigates their losses
        newClasses.Obreros.support.PSOE += 10;
        newClasses.PequenaBurguesia.support.IR += 5;
        
        return {
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Treintistas', 10),
          stats: { 
            ...state.stats, 
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 10),
            popularFrontUnity: Math.min(100, state.stats.popularFrontUnity + 10)
          },
          pendingEvents: [{ ...elections1933Results }, ...state.pendingEvents]
        };
      },
    },
  ],
};

import React from 'react';
import { Party } from '../types';
import { ParliamentChart } from '../../components/ParliamentChart';
import { PARTY_COLORS } from '../constants';

export const elections1933Results: GameEvent = {
  id: '1933_elections_results',
  title: 'Results of the 1933 General Elections',
  titleZh: '1933年大选结果',
  description: 'The results are in. The electoral system, designed to reward broad coalitions, has this time severely punished the divided left and rewarded the united right. CEDA has emerged as the largest party in the Cortes, followed closely by Lerroux\'s Radicals. The socialists have suffered a catastrophic defeat in terms of seats, despite maintaining significant popular support. Spain has swung sharply to the right.',
  descriptionZh: '结果出来了。旨在奖励广泛联盟的选举制度，这次严厉惩罚了分裂的左翼，并奖励了团结的右翼。CEDA 成为议会第一大党，紧随其后的是勒鲁的激进党。尽管社会党人保持了相当的民众支持，但他们在席位上遭遇了灾难性的失败。西班牙急剧向右转。',
  renderContent: (state) => {
    const isZh = state.language === 'zh';
    const cortes = state.cortes || calculateElectionResults(state);
    
    const partyNames: Record<Party, { en: string, zh: string }> = {
      PSOE: { en: 'PSOE', zh: '工人社会党' },
      IR: { en: 'IR', zh: '共和左翼' },
      UR: { en: 'UR', zh: '共和联盟' },
      PCE: { en: 'PCE', zh: '共产党' },
      PS: { en: 'PS', zh: '工团主义党' },
      FE: { en: 'FE', zh: '长枪党' },
      POUM: { en: 'POUM', zh: '马统工党' },
      AP: { en: 'CEDA', zh: 'CEDA' }, // In 1933 AP is part of CEDA
      CT: { en: 'CT', zh: '传统主义者' },
      RE: { en: 'RE', zh: '西班牙革新' },
      DLR: { en: 'PRR', zh: '激进党' }, // Merged PRR logic with DLR for simplicity
      Other: { en: 'Other', zh: '其他' }
    };

    const data = Object.entries(cortes).map(([party, seats]) => ({
      id: party,
      name: isZh ? partyNames[party as Party].zh : partyNames[party as Party].en,
      seats,
      color: PARTY_COLORS[party] || '#9ca3af'
    })).filter(d => d.seats > 0);
    
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
      text: 'A dark period begins. The "Bienio Negro" is upon us.',
      textZh: '一段黑暗时期开始了。“黑色两年”（Bienio Negro）降临了。',
      effect: (state) => {
        const newCortes = calculateElectionResults(state);
        
        // Ensure CNT is kicked out of government if they were in it
        let min = state.ministers;
        if (min.labor === 'CNT') min.labor = 'PSOE';
        if (min.health === 'CNT') min.health = 'PSOE';
        if (min.justice === 'CNT') min.justice = 'PSOE';
        if (min.industry === 'CNT') min.industry = 'PSOE';
        if (min.interior === 'CNT') min.interior = 'IR';

        return {
          cortes: newCortes,
          isCNTInGovernment: false,
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
            tension: Math.min(100, state.stats.tension + 15),
            workerControl: Math.max(0, state.stats.workerControl - 10)
          }
        };
      }
    }
  ]
};
