import type { CoalitionId, GameEvent, GameState, MinisterParty, Party } from '../types';
import { calculateElectionResults, formRulingCoalitionFromElection } from '../utils';

const earlyElectionLeafMeta = {
  category: 'politics' as const,
  flow: 'inline.leaf' as const,
  series: ['government_crisis', 'elections', 'early_election'],
  tags: ['election', 'external'],
};

type EarlyElectionOutcome = {
  coalitionId: CoalitionId;
  coalitionName: string;
  coalitionNameZh: string;
  seats: number;
  governmentType: string;
  governmentTypeZh: string;
  primeMinister: string;
  primeMinisterZh: string;
  ministerParty: MinisterParty;
  cntStance: GameState['cntStance'];
};

const sumSeats = (cortes: Record<Party, number>, parties: Party[]) =>
  parties.reduce((sum, party) => sum + (cortes[party] || 0), 0);

function calculateEarlyElectionOutcome(state: GameState): EarlyElectionOutcome {
  const cortes = calculateElectionResults(state);
  const leftSeats = sumSeats(cortes, ['PSOE', 'PCE', 'IR', 'UR', 'POUM', 'PS', 'ERC']);
  const centerRightSeats = sumSeats(cortes, ['PRR', 'DLR', 'AP']);
  const nationalFrontSeats = sumSeats(cortes, ['FE', 'CT', 'RE', 'AP']);

  if (leftSeats >= centerRightSeats && leftSeats >= nationalFrontSeats) {
    const usePopularFront = state.year >= 1935 || state.crossroads_choice === 'popular_front';
    return {
      coalitionId: usePopularFront ? 'popular_front' : 'republican_socialist',
      coalitionName: usePopularFront ? 'Popular Front' : 'Republican-Socialist Coalition',
      coalitionNameZh: usePopularFront ? '人民阵线' : '共和—社会党联盟',
      seats: leftSeats,
      governmentType: usePopularFront ? 'Popular Front Cabinet' : 'Republican-Socialist Cabinet',
      governmentTypeZh: usePopularFront ? '人民阵线内阁' : '共和—社会党内阁',
      primeMinister: 'Manuel Azaña',
      primeMinisterZh: '曼努埃尔·阿萨尼亚',
      ministerParty: usePopularFront ? 'IR' : 'PSOE',
      cntStance: 'cooperate',
    };
  }

  if (centerRightSeats >= nationalFrontSeats) {
    return {
      coalitionId: 'ceda_radical',
      coalitionName: 'CEDA-Radical Coalition',
      coalitionNameZh: 'CEDA—激进党联盟',
      seats: centerRightSeats,
      governmentType: 'Radical-CEDA Government',
      governmentTypeZh: '激进党—CEDA政府',
      primeMinister: 'Alejandro Lerroux',
      primeMinisterZh: '亚历杭德罗·勒鲁',
      ministerParty: 'PRR',
      cntStance: 'oppose',
    };
  }

  return {
    coalitionId: 'national_front',
    coalitionName: 'National Front',
    coalitionNameZh: '国家阵线',
    seats: nationalFrontSeats,
    governmentType: 'National Front Government',
    governmentTypeZh: '国家阵线政府',
    primeMinister: 'José María Gil-Robles',
    primeMinisterZh: '何塞·玛丽亚·吉尔-罗伯斯',
    ministerParty: 'AP',
    cntStance: 'oppose',
  };
}

export const earlyGeneralElectionResults: GameEvent = {
  id: 'early_general_election_results',
  meta: earlyElectionLeafMeta,
  condition: () => false,
  title: 'Results of the Early General Election',
  titleZh: '提前大选结果',
  description: 'The votes have been counted. The electoral result now determines which coalition may form the next government; no monthly system may appoint a governing coalition in its place.',
  descriptionZh: '选票已经清点完毕。选举结果将决定由哪个联盟组建下一届政府；月度系统无权代替选举任命执政联盟。',
  options: [
    {
      text: (state) => {
        const outcome = calculateEarlyElectionOutcome(state);
        return `${outcome.coalitionName} wins the election and forms a government (${outcome.seats} seats).`;
      },
      textZh: (state) => {
        const outcome = calculateEarlyElectionOutcome(state);
        return `${outcome.coalitionNameZh}赢得选举并组建政府（${outcome.seats}席）。`;
      },
      subtitle: 'Confirm the electoral result and install the elected governing coalition.',
      subtitleZh: '确认选举结果，并由获胜联盟依法组阁。',
      effect: (state) => {
        const outcome = calculateEarlyElectionOutcome(state);
        const newCortes = calculateElectionResults(state);
        const ministers = { ...state.ministers };

        for (const role of Object.keys(ministers)) {
          ministers[role as keyof typeof ministers] = outcome.ministerParty;
        }

        const baseState: GameState = {
          ...state,
          cortes: newCortes,
          cntStance: outcome.cntStance,
          ministers,
          government: {
            ...state.government,
            type: outcome.governmentType,
            typeZh: outcome.governmentTypeZh,
            primeMinister: outcome.primeMinister,
            primeMinisterZh: outcome.primeMinisterZh,
          },
        };

        const finalState = formRulingCoalitionFromElection(baseState, outcome.coalitionId);
        return {
          ...finalState,
          currentEvent: null,
        };
      },
    },
  ],
};
