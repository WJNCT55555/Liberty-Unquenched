import type { GameEvent } from '../types';
import { earlyGeneralElectionResults } from './early_general_election';

const presidentialDissolutionMeta = {
  category: 'politics' as const,
  flow: 'inline.root' as const,
  series: ['government_crisis', 'elections'],
  tags: ['election', 'external'],
};

export const presidentialDissolutionOfCortes: GameEvent = {
  id: 'presidential_dissolution_of_cortes',
  meta: presidentialDissolutionMeta,
  condition: () => false,
  title: 'The President Dissolves the Cortes!',
  titleZh: '总统宣布解散议会！',
  description: 'With the collapse of the governing coalition, the legislative chamber has descended into paralysis. The President has dissolved the Cortes and decreed an early general election. Spain is again thrown into an electoral campaign, and only the result at the ballot box may establish the next governing coalition.',
  descriptionZh: '随着执政联盟崩溃，议会陷入瘫痪。总统宣布解散议会并提前举行大选。西班牙再次进入选举周期，下一届执政联盟只能由投票结果产生。',
  options: [
    {
      text: 'Acknowledge the presidential decree and prepare for early elections.',
      textZh: '接受总统法令，动员群众积极筹备大选。',
      subtitle: 'The President has used his constitutional prerogative. This increases political tension across the country.',
      subtitleZh: '总统行使了宪法特权，这让全国的政治局势更加紧绷和动荡。',
      effect: (state) => {
        const nextCount = state.dissolutionCount + 1;
        const canImpeach = nextCount >= 2;

        return {
          governmentCrisis: null,
          earlyElectionInProgress: true,
          dissolutionCount: nextCount,
          impeachPresidentAvailable: state.impeachPresidentAvailable || canImpeach,
          pendingEvents: [
            { ...earlyGeneralElectionResults },
            ...state.pendingEvents.filter(e => e.id !== earlyGeneralElectionResults.id)
          ]
        };
      }
    }
  ]
};
