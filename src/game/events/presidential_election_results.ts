import React from 'react';
import { GameEvent, GameState } from '../types';
import { calculatePresidentialVotes } from '../utils/election';
import { presidentialElectionCampaignMenu } from './presidential_election_campaign_menu';

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

export const presidentialElectionResults: GameEvent = {
  id: 'presidential_election_results',
  title: 'Presidential General Election — First Round Results',
  titleZh: '总统大选第一轮计票结果',
  description: 'The ballots of Spain\'s general election for the presidency are being counted. Under the bicameral design, the Cortes deputies and elector delegations have completed their voting. The results will determine if a direct 2/3 majority can be achieved, or if we must proceed to a secondary runoff.',
  descriptionZh: '大选的第一轮投计票结果已经出炉。在宪法设计下，议会议员票与普选选举人票汇聚在此处。大选第一轮计票将判断是否有人能夺得2/3的绝对多数，否则将举行第二轮简单多数决。',
  condition: (state) => state.cntParticipatePresidential === true && state.presidentElectionRound === 1,
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
      effect: (state) => {
        return {
          presidentElectionRound: 2,
          pendingEvents: [
            { ...presidentialElectionCampaignMenu },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCampaignMenu.id)
          ]
        };
      }
    }
  ]
};

export const presidentialElectionResultsRound2: GameEvent = {
  id: 'presidential_election_results_round2',
  title: 'Presidential General Election — Second Round Runoff Results',
  titleZh: '总统大选第二轮最终计票结果',
  description: 'The final runoff ballots are being tallied. Under the rules of the Second Republic, the candidate with the highest total of combined deputy and elector votes in the second round is elected President. No further stalling is possible.',
  descriptionZh: '第二轮决胜轮的最终投计票工作已经宣告结束。在简单多数制下，得票最高者将直接宣誓就职第二共和国新一任总统，大局已定。',
  condition: (state) => state.cntParticipatePresidential === true && state.presidentElectionRound === 2,
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
