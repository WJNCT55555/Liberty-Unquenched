import React, { useState } from 'react';
import { GameEvent, Party, GameState } from '../types';
import { ParliamentChart } from '../../components/ParliamentChart';
import { calculateElectionResults } from '../utils/election';
import { PARTY_COLORS } from '../constants';
import { useGame } from '../GameContext';
import { cn } from '../../lib/utils';
import { formCoalition } from '../utils/coalition';

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
      PRR: { en: 'PRR', zh: '激进共和党' },
      ERC: { en: 'ERC', zh: '加泰罗尼亚共和左翼' },
      Other: { en: 'Other', zh: '其他' },
      PRRevS: { en: 'PRRevS', zh: '革命共和工团党' }
    };

    const partyOrder: Party[] = ['PS', 'PRRevS', 'POUM', 'PCE', 'PSOE', 'ERC', 'IR', 'UR', 'PRR', 'DLR', 'AP', 'FE', 'RE', 'CT', 'Other'];

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
        )
      )
    );
  },
  options: [
    {
      text: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const seats = (cortes.PSOE || 0) + (cortes.IR || 0) + (cortes.ERC || 0) + (cortes.PRR || 0) + (cortes.UR || 0);
        return `Republican-Socialist Coalition (PSOE + IR + ERC + PRR + UR) Wins (${seats} seats)`;
      },
      textZh: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const seats = (cortes.PSOE || 0) + (cortes.IR || 0) + (cortes.ERC || 0) + (cortes.PRR || 0) + (cortes.UR || 0);
        return `共和-社会党联盟（PSOE + IR + ERC + PRR + UR）获胜（${seats}席）`;
      },
      effect: (state) => {
        const newCortes = calculateElectionResults(state);
        const cntSupported = state.cntStance === 'cooperate';

        let nextEvents = state.pendingEvents;
        let govType = 'Republican-Socialist Cabinet';
        let govTypeZh = '共和-社会党内阁';
        let pm = 'Manuel Azaña';
        let pmZh = '曼努埃尔·阿萨尼亚';

        if (cntSupported) {
          nextEvents = [{ ...cabinetFormation1931 }, ...state.pendingEvents.filter(e => e.id !== cabinetFormation1931.id)];
        } else {
          nextEvents = [{ ...leftCabinetExcludesCNT }, ...state.pendingEvents.filter(e => e.id !== leftCabinetExcludesCNT.id)];
        }

        const baseState = {
          ...state,
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

        // Directly activate the 'republican_socialist' coalition!
        const finalState = formCoalition(baseState, 'republican_socialist');
        return {
          ...finalState,
          currentEvent: null
        };
      }
    },
    {
      text: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const seats = (cortes.ERC || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PRR || 0) + (cortes.DLR || 0);
        return `Republican Coalition (ERC + IR + UR + PRR + DLR) Wins (${seats} seats)`;
      },
      textZh: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const seats = (cortes.ERC || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PRR || 0) + (cortes.DLR || 0);
        return `共和联盟（ERC + IR + UR + PRR + DLR）获胜（${seats}席）`;
      },
      condition: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const seats = (cortes.ERC || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PRR || 0) + (cortes.DLR || 0);
        return seats > 235;
      },
      unavailableSubtitle: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const seats = (cortes.ERC || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PRR || 0) + (cortes.DLR || 0);
        return `Requires a majority of seats (> 235). Current: ${seats} seats.`;
      },
      unavailableSubtitleZh: (state) => {
        const cortes = state.cortes || calculateElectionResults(state);
        const seats = (cortes.ERC || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PRR || 0) + (cortes.DLR || 0);
        return `需要席位过半（> 235席）。当前：${seats}席。`;
      },
      effect: (state) => {
        const newCortes = calculateElectionResults(state);
        let nextEvents = [{ ...republicanCabinet1931 }, ...state.pendingEvents.filter(e => e.id !== republicanCabinet1931.id)];
        let govType = 'Republican Cabinet';
        let govTypeZh = '共和派内阁';
        let pm = 'Alejandro Lerroux';
        let pmZh = '亚历杭德罗·勒鲁';

        return {
          cortes: newCortes,
          government: {
            ...state.government,
            type: govType,
            typeZh: govTypeZh,
            primeMinister: pm,
            primeMinisterZh: pmZh
          },
          pendingEvents: nextEvents
        };
      }
    }
  ]
};

export const republicanCabinet1931: GameEvent = {
  id: '1931_republican_cabinet',
  title: (state) => {
    const cortes = state.cortes || calculateElectionResults(state);
    const seats = (cortes.ERC || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PRR || 0) + (cortes.DLR || 0);
    return `Republican Coalition (ERC + IR + UR + PRR + DLR) Wins (${seats} seats)`;
  },
  titleZh: (state) => {
    const cortes = state.cortes || calculateElectionResults(state);
    const seats = (cortes.ERC || 0) + (cortes.IR || 0) + (cortes.UR || 0) + (cortes.PRR || 0) + (cortes.DLR || 0);
    return `共和联盟（ERC + IR + UR + PRR + DLR）获胜（${seats}席）`;
  },
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
      effect: (state) => {
        return {
          stats: { ...state.stats, revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5) }
        };
      }
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
          cntStance: 'govern' as const,
          factions: newFactions,
          leverage: 15, // Starting leverage for ministries
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 20)
          },
          pendingEvents: [{ ...ministerAllocation }, ...state.pendingEvents.filter(e => e.id !== ministerAllocation.id)]
        };
      }
    }
  ]
};

const MinisterSelectionComponent: React.FC<{ state: GameState }> = ({ state }) => {
  const { dispatch } = useGame();
  const isZh = state.language === 'zh';
  const initialLeverage = state.leverage ?? 15;

  const ministriesList = [
    {
      id: 'labor',
      name: 'Ministry of Labor',
      nameZh: '劳工部',
      cost: 5,
      description: 'Significantly increases Worker Control (+15)',
      descriptionZh: '显著提高工人控制量 (+15)',
    },
    {
      id: 'agriculture',
      name: 'Ministry of Agriculture',
      nameZh: '农业部',
      cost: 5,
      description: 'Increases Worker Control (+5)',
      descriptionZh: '提高工人控制量 (+5)',
    },
    {
      id: 'health',
      name: 'Ministry of Health & Social Assistance',
      nameZh: '卫生与社会援助部',
      cost: 5,
      description: 'Increases Revolutionary Fervor (+10)',
      descriptionZh: '提升革命热情 (+10)',
    },
    {
      id: 'finance',
      name: 'Ministry of Finance',
      nameZh: '财政部',
      cost: 10,
      description: 'Increases Worker Control (+5)',
      descriptionZh: '提高工人控制量 (+5)',
    },
    {
      id: 'justice',
      name: 'Ministry of Justice',
      nameZh: '司法部',
      cost: 10,
      description: 'Secures anarchist influence in judiciary branch',
      descriptionZh: '掌控司法体系统领权',
    },
    {
      id: 'industry',
      name: 'Ministry of Industry',
      nameZh: '工业部',
      cost: 10,
      description: 'Greatly increases Worker Control (+20)',
      descriptionZh: '极大提高工人控制量 (+20)',
    },
    {
      id: 'interior',
      name: 'Ministry of Interior',
      nameZh: '内政部',
      cost: 15,
      description: 'Controls state security, but lowers Army Loyalty (-10)',
      descriptionZh: '掌管安全防务，但会削减军官忠诚度 (-10)',
    },
    {
      id: 'estado',
      name: 'Ministry of State',
      nameZh: '国务部',
      cost: 5,
      description: 'Allows playing Foreign Policy cards. (+5 Revolutionary Fervor)',
      descriptionZh: '可全盘掌控我国外交政策。提升革命热情 (+5)',
    },
  ];

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const totalCost = ministriesList.reduce((sum, m) => {
    return sum + (selected[m.id] ? m.cost : 0);
  }, 0);

  const remainingLeverage = initialLeverage - totalCost;
  const isOverLimit = remainingLeverage < 0;

  const handleToggle = (id: string) => {
    setSelected(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFinalize = () => {
    if (isOverLimit) return;

    dispatch({
      type: 'RESOLVE_EVENT',
      payload: (currentState) => {
        const newMinisters = { ...currentState.ministers };
        let workerControlDelta = 0;
        let revFervorDelta = 0;
        let armyLoyaltyDelta = 0;

        // Apply selected ministries
        if (selected.labor) {
          newMinisters.labor = 'CNT';
          workerControlDelta += 15;
        }
        if (selected.industry) {
          newMinisters.industry = 'CNT';
          workerControlDelta += 20;
        }
        if (selected.agriculture) {
          newMinisters.agriculture = 'CNT';
          workerControlDelta += 5;
        }
        if (selected.finance) {
          newMinisters.finance = 'CNT';
          workerControlDelta += 5;
        }
        if (selected.health) {
          newMinisters.health = 'CNT';
          revFervorDelta += 10;
        }
        if (selected.justice) {
          newMinisters.justice = 'CNT';
        }
        if (selected.interior) {
          newMinisters.interior = 'CNT';
          armyLoyaltyDelta -= 10;
        }
        if (selected.estado) {
          newMinisters.estado = 'CNT';
          revFervorDelta += 5;
        }

        return {
          leverage: currentState.leverage - totalCost,
          labor_minister_party: selected.labor ? 'CNT' : currentState.labor_minister_party,
          agriculture_minister_party: selected.agriculture ? 'CNT' : currentState.agriculture_minister_party,
          finance_minister_party: selected.finance ? 'CNT' : currentState.finance_minister_party,
          estado_minister_party: selected.estado ? 'CNT' : currentState.estado_minister_party,
          ministers: newMinisters,
          stats: {
            ...currentState.stats,
            workerControl: Math.min(100, currentState.stats.workerControl + workerControlDelta),
            revolutionaryFervor: Math.min(100, currentState.stats.revolutionaryFervor + revFervorDelta),
            armyLoyalty: Math.max(0, currentState.stats.armyLoyalty + armyLoyaltyDelta),
          },
          currentEvent: null,
        };
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="font-sans text-sm font-bold border-b border-ink/20 pb-2 mb-2 flex justify-between items-center text-ink flex-wrap gap-2">
        <span className="font-display uppercase tracking-widest text-base">
          {isZh ? '内阁阁员谈判协商' : 'Cabinet Negotiation'}
        </span>
        <span className={`font-mono px-3 py-1 border font-bold text-xs ${isOverLimit ? 'border-cnt-red bg-cnt-red text-paper' : 'border-ink bg-ink text-paper'}`}>
          {isZh ? `剩余筹码: ${remainingLeverage} / ${initialLeverage}` : `Leverage Left: ${remainingLeverage} / ${initialLeverage}`}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {ministriesList.map((m) => {
          const isChecked = !!selected[m.id];
          return (
            <button
              key={m.id}
              onClick={() => handleToggle(m.id)}
              className={cn(
                "text-left p-4 border transition-colors font-typewriter text-sm uppercase tracking-wider relative group overflow-hidden w-full flex flex-col cursor-pointer",
                isChecked 
                  ? "border-ink bg-ink text-paper block" 
                  : "border-ink hover:bg-ink hover:text-paper bg-transparent text-ink block"
              )}
            >
              <div className="relative z-10 flex flex-col w-full">
                <span className="font-bold flex items-center gap-2">
                  <span>{isChecked ? '☑' : '☐'}</span>
                  <span>
                    {isZh 
                      ? `要求${m.nameZh}（花费：${m.cost} 筹码）` 
                      : `Demand the ${m.name} (Cost: ${m.cost} Leverage)`}
                  </span>
                </span>
                <span className={cn(
                  "text-xs mt-1 normal-case font-serif italic opacity-80",
                  isChecked ? "text-paper" : "text-ink-light group-hover:text-paper"
                )}>
                  {isZh ? m.descriptionZh : m.description}
                </span>
              </div>
              {!isChecked && (
                <div className="absolute inset-0 bg-cnt-red transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-0 opacity-20"></div>
              )}
            </button>
          );
        })}
      </div>

      {isOverLimit && (
        <div className="text-xs text-cnt-red font-bold font-typewriter text-center animate-pulse mt-2 uppercase tracking-wider">
          {isZh 
            ? '⚠ 政治资源筹码不足！请取消勾选某些部门以继续。' 
            : '⚠ Not enough leverage! Deselect some ministries to proceed.'}
        </div>
      )}

      <button
        disabled={isOverLimit}
        onClick={handleFinalize}
        className={cn(
          "w-full mt-4 py-4 border transition-all font-typewriter text-sm uppercase tracking-wider relative group overflow-hidden text-center",
          !isOverLimit 
            ? "border-cnt-red bg-cnt-red text-paper hover:bg-ink hover:text-paper cursor-pointer font-bold" 
            : "border-ink-light opacity-50 cursor-not-allowed text-ink-light"
        )}
      >
        <span className="relative z-10">
          {isZh ? '确认组合内阁并结束政合谈判' : 'CONCLUDE CABINET FORMULATION & SUBMIT'}
        </span>
      </button>
    </div>
  );
};

export const ministerAllocation: GameEvent = {
  id: 'minister_allocation',
  title: 'Ministerial Allocation',
  titleZh: '部长分配',
  description: 'We have agreed to join the cabinet. We now have political leverage to demand specific ministries. The more powerful the ministry, the more leverage it requires. What shall we demand?',
  descriptionZh: '我们同意加入内阁。我们现在拥有政治筹码来要求特定的部长职位。部门越强大，需要的筹码就越多。我们要要求什么？',
  renderContent: (state) => {
    return <MinisterSelectionComponent state={state} />;
  },
  options: []
};
