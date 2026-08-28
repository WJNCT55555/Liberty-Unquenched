import type { CoalitionDef } from './types';

// Check if a party exists or is active (some parties are founded via choices / events)
export const COALITION_DEFS: CoalitionDef[] = [
  {
    id: 'provisional_government',
    name: 'Provisional Government',
    nameZh: '临时看守政府',
    members: ['PSOE', 'IR', 'UR', 'DLR', 'PRR', 'ERC'],
    dissolveThreshold: 10
  },
  {
    id: 'republican_socialist',
    name: 'Republican-Socialist Coalition',
    nameZh: '共和-社会党联合',
    members: ['PSOE', 'IR', 'UR', 'DLR'],
    dissolveThreshold: 20
  },
  {
    id: 'republican_coalition',
    name: 'Republican Coalition',
    nameZh: '共和派联盟',
    members: ['ERC', 'IR', 'UR', 'PRR', 'DLR'],
    dissolveThreshold: 20
  },
  {
    id: 'popular_front',
    name: "Popular Front",
    nameZh: '人民阵线',
    members: ['PSOE', 'PCE', 'IR', 'UR', 'POUM', 'PS', 'ERC'],
    dissolveThreshold: 15
  },
  {
    id: 'ceda_radical',
    name: 'CEDA-Radical Coalition',
    nameZh: 'CEDA-激进党联盟',
    members: ['AP', 'DLR', 'PRR'],
    dissolveThreshold: 20
  },
  {
    id: 'workers_alliance',
    name: "Workers' Alliance",
    nameZh: '工人联盟',
    members: ['PSOE', 'CNT_FAI', 'PCE', 'POUM'],
    dissolveThreshold: 10
  },
  {
    id: 'national_front',
    name: 'National Front',
    nameZh: '国民阵线',
    members: ['FE', 'CT', 'RE', 'AP'],
    dissolveThreshold: 25
  }
];
