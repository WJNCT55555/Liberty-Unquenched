import { CoalitionDef, GameState, Party } from './types';

// Check if a party exists or is active (some parties are founded via choices / events)
export const COALITION_DEFS: CoalitionDef[] = [
  {
    id: 'provisional_government',
    name: 'Provisional Government',
    nameZh: '临时看守政府',
    members: ['PSOE', 'IR', 'UR', 'DLR', 'PRR', 'ERC'],
    minSeatShare: 0.0,
    canForm: (state: GameState) => state.year === 1931 && state.month < 11,
    dissolveThreshold: 10
  },
  {
    id: 'republican_socialist',
    name: 'Republican-Socialist Coalition',
    nameZh: '共和-社会党联合',
    members: ['PSOE', 'IR', 'UR', 'DLR'],
    minSeatShare: 0.45,
    canForm: (state: GameState) => state.civilWarStatus === 'not_started',
    dissolveThreshold: 20
  },
  {
    id: 'popular_front',
    name: "Popular Front",
    nameZh: '人民阵线',
    members: ['PSOE', 'PCE', 'IR', 'UR', 'POUM', 'PS', 'ERC'],
    minSeatShare: 0.45,
    canForm: (state: GameState) => {
      // Popular Front requires either tension to be high or specific triggers
      return state.stats.tension >= 30;
    },
    dissolveThreshold: 15
  },
  {
    id: 'ceda_radical',
    name: 'CEDA-Radical Coalition',
    nameZh: 'CEDA-激进党联盟',
    members: ['AP', 'DLR', 'PRR'],
    minSeatShare: 0.45,
    canForm: (state: GameState) => state.civilWarStatus === 'not_started',
    dissolveThreshold: 20
  },
  {
    id: 'workers_alliance',
    name: "Workers' Alliance",
    nameZh: '工人联盟',
    members: ['PSOE', 'CNT_FAI', 'PCE', 'POUM'],
    minSeatShare: 0.0, // A trade union/revolutionary pact rather than strict parliamentary gov
    canForm: (state: GameState) => state.stats.revolutionaryFervor >= 40,
    dissolveThreshold: 10
  },
  {
    id: 'national_front',
    name: 'National Front',
    nameZh: '国民阵线',
    members: ['FE', 'CT', 'RE', 'AP'],
    minSeatShare: 0.35,
    canForm: (state: GameState) => state.civilWarStatus === 'ongoing' || state.stats.tension >= 60,
    dissolveThreshold: 25
  }
];
