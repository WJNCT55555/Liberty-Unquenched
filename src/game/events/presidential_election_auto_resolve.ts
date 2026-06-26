import React from 'react';
import { GameEvent } from '../types';
import { calculatePresidentialVotes } from '../utils/election';

export const presidentialElectionAutoResolve: GameEvent = {
  id: 'presidential_election_auto_resolve',
  title: 'Presidential Election: Abstention Path',
  titleZh: '总统选举：弃权路线',
  description: 'The CNT has stood aside, refusing to participate in the presidential election. In our absence, the 470 deputies of the Cortes and the 470 newly elected electors convene to cast their votes based on the prevailing strength of each political party.',
  descriptionZh: 'CNT选择不介入总统选举。议会的议员和另行普选的选举人将按照各党派现有的政治力量自行投票。整个大选在没有工会干涉的情况下进行。',
  condition: (state) => state.cntParticipatePresidential === false,
  renderContent: (state) => {
    const isZh = state.language === 'zh';
    
    // Auto-resolve defaults leftCandidate to 'azana' and activeCandidate to null
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
