import type { GameEvent } from '../types';
import { getDueGeneralElectionKind } from '../rules/electionSchedule';
import { adjustClassSupport } from '../utils';
import {
  generalElectionCampaignOptions,
  generalElectionResultDescription,
  generalElectionResultOptions,
  renderGeneralElectionResults,
} from './general_election';

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

const election1933CampaignOptions: GameEvent['options'] = [
  {
    ...generalElectionCampaignOptions[0],
    text: 'Abstain! "Frente a las urnas, revolución social" (Against the ballot boxes, social revolution!)',
    textZh: '弃权！“不要投票箱，要社会革命！”',
    subtitle: 'A massive abstention campaign will likely lead to a right-wing victory.',
    subtitleZh: '大规模的弃权运动很可能导致右翼获胜。',
    effect: (state) => {
      let classes = adjustClassSupport(state.classes, 'Obreros', 'PSOE', -30);
      classes = adjustClassSupport(classes, 'Braceros', 'PSOE', -25);
      classes = adjustClassSupport(classes, 'PequenaBurguesia', 'IR', -15);
      classes = adjustClassSupport(classes, 'PequenaBurguesia', 'AP', 20);
      classes = adjustClassSupport(classes, 'Labradores', 'AP', 25);
      classes = adjustClassSupport(classes, 'Clero', 'AP', 20);
      classes = adjustClassSupport(classes, 'Latifundistas', 'AP', 15);
      return {
        ...generalElectionCampaignOptions[0].effect({ ...state, classes }),
        classes,
      };
    },
  },
  {
    ...generalElectionCampaignOptions[1],
    text: 'The threat of CEDA is too great. Issue a quiet directive to vote against the right.',
    textZh: 'CEDA 的威胁太大了。发布一个安静的指示，投票反对右翼。',
    subtitle: 'Betrays our anti-electoral stance but might prevent a reactionary government.',
    subtitleZh: '背叛了我们的反选举立场，但可能会阻止一个反动政府的出现。',
  },
  ...generalElectionCampaignOptions.slice(2),
];

/** Historical presentation root, now gated by the canonical election schedule. */
export const elections1933: GameEvent = {
  id: 'elections_1933',
  meta: election1933Meta,
  date: { year: 1933, month: 11 },
  condition: (state) => state.scenario === '1931'
    && getDueGeneralElectionKind(state) === 'historical_1933',
  title: '1933 General Elections',
  titleZh: '1933年大选',
  description: 'The first elected coalition has collapsed and President Alcalá-Zamora has dissolved the Cortes. CEDA is mobilizing a united right while the republican left is fragmented. This historical 1933 contest occurs only when the first government crisis actually produced the first presidential dissolution; a stable legislature instead serves its term and votes in 1935.',
  descriptionZh: '首届民选执政联盟已经瓦解，阿尔卡拉-萨莫拉总统解散了议会。CEDA 正在动员统一的右翼，而共和左翼则陷入分裂。只有第一次政府危机确实引发第一次总统解散时，才会举行这场历史性的1933年大选；如果议会保持稳定，则会完成任期并在1935年举行选举。',
  options: election1933CampaignOptions,
};

/** Save-compatible legacy result id; new campaigns enter general_election_results. */
export const elections1933Results: GameEvent = {
  id: 'elections_1933_results',
  meta: election1933LeafMeta,
  condition: () => false,
  title: 'Results of the 1933 General Elections',
  titleZh: '1933年大选结果',
  description: generalElectionResultDescription.en,
  descriptionZh: generalElectionResultDescription.zh,
  renderContent: renderGeneralElectionResults,
  options: generalElectionResultOptions,
};
