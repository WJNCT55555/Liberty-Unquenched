import type { GameEvent } from '../types';
import { getDueGeneralElectionKind } from '../rules/electionSchedule';
import {
  generalElectionCampaignOptions,
  generalElectionResultDescription,
  generalElectionResultOptions,
  renderGeneralElectionResults,
} from './general_election';

const election1936Meta = {
  category: 'politics' as const,
  flow: 'inline.root' as const,
  series: ['elections', 'election_1936'],
  tags: ['election'],
};

const election1936LeafMeta = {
  ...election1936Meta,
  flow: 'inline.leaf' as const,
};

// Preserve the historical option order and labels so pending events from older
// saves restore to the same effects before the new PRRevS choices are appended.
const election1936CampaignOptions: GameEvent['options'] = [
  {
    ...generalElectionCampaignOptions[1],
    text: 'Amnesty First! Quietly lift the abstention campaign to free our comrades.',
    textZh: '特赦优先！悄然取消反选举宣传，号召选民投票以释放我们的同志。',
    subtitle: 'Boosts Popular Front turnout significantly. Tens of thousands of workers will vote to empty the prisons.',
    subtitleZh: '大幅推高人民阵线的投票率。数万名工人将为了清空监狱而走向投票箱。',
  },
  {
    ...generalElectionCampaignOptions[0],
    text: 'Absolute Abstention! "No votéis" – The ballot box is the tomb of revolution.',
    textZh: '绝对弃权！“不要投票”——选票箱是革命的坟墓。',
    subtitle: 'Maintains pure anarchist anti-electoral principles. This will likely hand victory to the right-wing National Front.',
    subtitleZh: '维持纯粹的无政府主义反选举原则。这很可能将胜利拱手让给右翼的国家阵线。',
  },
  ...generalElectionCampaignOptions.slice(2),
];

/** Historical presentation root for the second constitutional dissolution. */
export const elections1936: GameEvent = {
  id: 'elections_1936',
  meta: election1936Meta,
  date: { year: 1936, month: 2 },
  condition: (state) => state.scenario !== '1936'
    && getDueGeneralElectionKind(state) === 'historical_1936',
  title: '1936 General Elections',
  titleZh: '1936年大选',
  description: 'The Radical-CEDA coalition has collapsed after the second constitutional crisis. Spain is polarized between the Popular Front and the National Front, while CNT and a possible PRRevS hold potentially decisive votes. This historical February 1936 contest occurs only after the second dissolution; alternative governments retain their own election calendar.',
  descriptionZh: '第二次宪政危机后，激进党—CEDA 联盟已经瓦解。西班牙在人民阵线与国民阵线之间严重极化，而 CNT 以及可能存在的 PRRevS 掌握着足以决定结果的选票。只有发生第二次议会解散时，才会举行这场历史性的1936年2月大选；架空政府将继续遵循自己的选举日程。',
  options: election1936CampaignOptions,
};

/** Save-compatible legacy result id; new campaigns enter general_election_results. */
export const elections1936Results: GameEvent = {
  id: 'elections_1936_results',
  meta: election1936LeafMeta,
  condition: () => false,
  title: 'Results of the 1936 General Elections',
  titleZh: '1936年大选结果',
  description: generalElectionResultDescription.en,
  descriptionZh: generalElectionResultDescription.zh,
  renderContent: renderGeneralElectionResults,
  options: generalElectionResultOptions,
};
