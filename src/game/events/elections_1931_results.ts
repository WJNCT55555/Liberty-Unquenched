import React from 'react';
import { GameEvent, Party } from '../types';
import { ParliamentChart } from '../../components/ParliamentChart';
import { calculateElectionResults } from '../utils/election';
import { PARTY_COLORS } from '../constants';

export const elections1931Results: GameEvent = {
  id: '1931_elections_results',
  title: 'Results of the 1931 General Elections',
  titleZh: '1931年大选结果',
  description: 'The votes have been counted. The Republican-Socialist Conjunction has secured a resounding victory, ensuring that the Constituent Cortes will have a strong left-leaning mandate to draft the new constitution. However, the exact composition of the parliament depends heavily on the turnout of the working class.',
  descriptionZh: '选票已经清点完毕。共和-社会党联盟取得了压倒性的胜利，确保了制宪议会将拥有强大的左倾授权来起草新宪法。然而，议会的确切组成在很大程度上取决于工人阶级的投票率。',
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
      AP: { en: 'AP', zh: '人民行动党' },
      CT: { en: 'CT', zh: '传统主义者' },
      RE: { en: 'RE', zh: '西班牙革新' },
      DLR: { en: 'DLR', zh: '自由共和右翼' },
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

    const repSocSeats = cortes.PSOE + cortes.IR;
    const repSeats = cortes.IR + cortes.UR + cortes.DLR;

    return React.createElement('div', { className: 'flex flex-col items-center w-full' },
      React.createElement(ParliamentChart, { data, width: 400, height: 200 }),
      
      // Legend Table
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
        
        // Potential Coalitions
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h4', { className: 'font-bold mb-3 text-base' }, isZh ? '潜在执政联盟:' : 'Potential coalitions:'),
          React.createElement('ul', { className: 'space-y-3' },
            React.createElement('li', null, 
              React.createElement('span', { className: 'font-medium' }, isZh ? '共和-社会党联盟 (PSOE + IR): ' : 'Republican-Socialist (PSOE + IR): '),
              `${formatPct(repSocSeats)} (${repSocSeats} ${isZh ? '席' : 'seats'})`
            ),
            React.createElement('li', null, 
              React.createElement('span', { className: 'font-medium' }, isZh ? '共和联盟 (IR + UR + DLR): ' : 'Republican Coalition (IR + UR + DLR): '),
              `${formatPct(repSeats)} (${repSeats} ${isZh ? '席' : 'seats'})`
            )
          )
        )
      )
    );
  },
  options: [
    {
      text: 'A new era begins, but the state remains our enemy.',
      textZh: '一个新时代开始了，但国家依然是我们的敌人。',
      effect: (state) => {
        const newCortes = calculateElectionResults(state);
        
        const repSocSeats = newCortes.PSOE + newCortes.IR;
        const repSeats = newCortes.IR + newCortes.UR + newCortes.DLR;
        const isRepSoc = repSocSeats >= repSeats;
        
        // Trigger cabinet formation if CNT tacitly supported
        const cntSupported = state.stats.republican_socialist_coalition_power > 50;

        let nextEvents = state.pendingEvents;
        let govType = state.government.type;
        let govTypeZh = state.government.typeZh;
        let pm = state.government.primeMinister;
        let pmZh = state.government.primeMinisterZh;

        if (isRepSoc) {
          govType = 'Republican-Socialist Cabinet';
          govTypeZh = '共和-社会党内阁';
          pm = 'Manuel Azaña';
          pmZh = '曼努埃尔·阿萨尼亚';
          if (cntSupported) {
            nextEvents = [{ ...cabinetFormation1931 }, ...state.pendingEvents];
          } else {
            nextEvents = [{ ...leftCabinetExcludesCNT }, ...state.pendingEvents];
          }
        } else {
          govType = 'Republican Cabinet';
          govTypeZh = '共和派内阁';
          pm = 'Alejandro Lerroux';
          pmZh = '亚历杭德罗·勒鲁';
          nextEvents = [{ ...republicanCabinet1931 }, ...state.pendingEvents];
        }

        return {
          cortes: newCortes,
          government: {
            ...state.government,
            type: govType,
            typeZh: govTypeZh,
            primeMinister: pm,
            primeMinisterZh: pmZh
          },
          stats: {
            ...state.stats
          },
          pendingEvents: nextEvents
        };
      }
    }
  ]
};

export const republicanCabinet1931: GameEvent = {
  id: '1931_republican_cabinet',
  title: 'The Republican Cabinet',
  titleZh: '共和派内阁',
  description: 'The centrist and left-republican parties have formed a bourgeois government, excluding the socialists. Alejandro Lerroux has been appointed Prime Minister. This government is committed to a capitalist republic and will likely oppose our revolutionary goals.',
  descriptionZh: '中间派和左翼共和党人组成了一个资产阶级政府，将社会党人排除在外。亚历杭德罗·勒鲁被任命为总理。这个政府致力于建立一个资本主义共和国，很可能会反对我们的革命目标。',
  options: [
    {
      text: 'We must prepare to defend ourselves against bourgeois reaction.',
      textZh: '我们必须准备好保卫自己，反对资产阶级的反动。',
      effect: (state) => ({
        stats: { ...state.stats, revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10) }
      })
    }
  ]
};

export const leftCabinetExcludesCNT: GameEvent = {
  id: '1931_left_cabinet_excludes_cnt',
  title: 'Azaña Forms Government',
  titleZh: '阿萨尼亚组建政府',
  description: 'The Republican-Socialist coalition has secured a majority. However, due to our abstention and hostility during the elections, they have no intention of including the CNT in their plans. We are firmly in the opposition.',
  descriptionZh: '共和-社会党联盟获得了多数席位。然而，由于我们在选举期间的弃权和敌对态度，他们无意将 CNT 纳入他们的计划。我们坚定地处于反对派的立场。',
  options: [
    {
      text: 'They will soon feel the power of the organized working class.',
      textZh: '他们很快就会感受到有组织的工人阶级的力量。',
      effect: (state) => ({
        stats: { ...state.stats, revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5) }
      })
    }
  ]
};

export const cabinetFormation1931: GameEvent = {
  id: '1931_cabinet_formation',
  title: 'The Republican-Socialist Cabinet',
  titleZh: '共和-社会党内阁',
  description: 'With a massive majority secured thanks to the tacit support of the CNT, Manuel Azaña and Largo Caballero have approached our leadership. They recognize that without our workers, their mandate would be weak. In an unprecedented move, they have offered the CNT a place in the cabinet to ensure labor peace during the drafting of the constitution.',
  descriptionZh: '由于 CNT 的默许支持，曼努埃尔·阿萨尼亚和拉尔戈·卡巴列罗获得了压倒性的多数席位。他们意识到，如果没有我们的工人，他们的授权将是脆弱的。在一个史无前例的举动中，他们向 CNT 提供了一个内阁席位，以确保在起草宪法期间的劳工和平。',
  options: [
    {
      text: 'Refuse. We will offer external toleration only.',
      textZh: '拒绝。我们只提供外部支持。',
      subtitle: 'Maintains our anarchist principles but limits our direct power.',
      subtitleZh: '维持我们的无政府主义原则，但限制了我们的直接权力。',
      effect: (state) => {
        return {
          stats: {
            ...state.stats,
            workerControl: state.stats.workerControl + 5
          }
        };
      }
    },
    {
      text: 'Accept the offer. We must secure our gains from within.',
      textZh: '接受提议。我们必须从内部巩固我们的成果。',
      subtitle: 'This will cause massive outrage among the radical Faistas.',
      subtitleZh: '这将引起激进的无政府主义者（Faistas）的极大愤怒。',
      effect: (state) => {
        const newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Faistas.dissent += 30;
        newFactions.Puristas.dissent += 20;
        
        return {
          factions: newFactions,
          leverage: 15, // Starting leverage for ministries
          isCNTInGovernment: true,
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 20)
          },
          pendingEvents: [{ ...ministerAllocation }, ...state.pendingEvents]
        };
      }
    }
  ]
};

export const ministerAllocation: GameEvent = {
  id: 'minister_allocation',
  title: 'Ministerial Allocation',
  titleZh: '部长分配',
  description: 'We have agreed to join the cabinet. We now have political leverage to demand specific ministries. The more powerful the ministry, the more leverage it requires. What shall we demand?',
  descriptionZh: '我们同意加入内阁。我们现在拥有政治筹码来要求特定的部长职位。部门越强大，需要的筹码就越多。我们要要求什么？',
  renderContent: (state) => {
    const isZh = state.language === 'zh';
    return React.createElement('div', { className: 'font-mono text-lg font-bold text-cnt-red' }, 
      isZh ? `当前筹码: ${state.leverage}` : `Current Leverage: ${state.leverage}`
    );
  },
  options: [
    {
      text: 'Demand the Ministry of Labor (Cost: 5 Leverage)',
      textZh: '要求劳工部（花费：5 筹码）',
      condition: (state) => state.leverage >= 5 && state.ministers.labor !== 'CNT',
      effect: (state) => ({
        leverage: state.leverage - 5,
        ministers: { ...state.ministers, labor: 'CNT' },
        stats: { ...state.stats, workerControl: state.stats.workerControl + 15 },
        pendingEvents: [{ ...ministerAllocation }, ...state.pendingEvents]
      })
    },
    {
      text: 'Demand the Ministry of Health & Social Assistance (Cost: 5 Leverage)',
      textZh: '要求卫生与社会援助部（花费：5 筹码）',
      condition: (state) => state.leverage >= 5 && state.ministers.health !== 'CNT',
      effect: (state) => ({
        leverage: state.leverage - 5,
        ministers: { ...state.ministers, health: 'CNT' },
        stats: { ...state.stats, revolutionaryFervor: state.stats.revolutionaryFervor + 10 },
        pendingEvents: [{ ...ministerAllocation }, ...state.pendingEvents]
      })
    },
    {
      text: 'Demand the Ministry of Justice (Cost: 10 Leverage)',
      textZh: '要求司法部（花费：10 筹码）',
      condition: (state) => state.leverage >= 10 && state.ministers.justice !== 'CNT',
      effect: (state) => ({
        leverage: state.leverage - 10,
        ministers: { ...state.ministers, justice: 'CNT' },
        stats: { ...state.stats },
        pendingEvents: [{ ...ministerAllocation }, ...state.pendingEvents]
      })
    },
    {
      text: 'Demand the Ministry of Industry (Cost: 10 Leverage)',
      textZh: '要求工业部（花费：10 筹码）',
      condition: (state) => state.leverage >= 10 && state.ministers.industry !== 'CNT',
      effect: (state) => ({
        leverage: state.leverage - 10,
        ministers: { ...state.ministers, industry: 'CNT' },
        stats: { ...state.stats, economy: state.stats.economy - 5, workerControl: state.stats.workerControl + 20 },
        pendingEvents: [{ ...ministerAllocation }, ...state.pendingEvents]
      })
    },
    {
      text: 'Demand the Ministry of Interior (Cost: 15 Leverage)',
      textZh: '要求内政部（花费：15 筹码）',
      condition: (state) => state.leverage >= 15 && state.ministers.interior !== 'CNT',
      effect: (state) => ({
        leverage: state.leverage - 15,
        ministers: { ...state.ministers, interior: 'CNT' },
        stats: { ...state.stats, armyLoyalty: Math.max(0, state.stats.armyLoyalty - 10) },
        pendingEvents: [{ ...ministerAllocation }, ...state.pendingEvents]
      })
    },
    {
      text: 'We are satisfied with our current ministries. Conclude negotiations.',
      textZh: '我们对目前的部长职位感到满意。结束谈判。',
      effect: (state) => ({
        // Just proceed, no new events added
      })
    }
  ]
};
