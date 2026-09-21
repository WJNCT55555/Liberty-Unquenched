import type { GameEvent } from '../types';

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
  description: 'With the collapse of the governing coalition, the legislative chamber has descended into paralysis. The President has dissolved the Cortes and decreed an early general election for the date already recorded in the constitutional calendar. Spain enters a caretaker period; the election result will establish the next governing coalition.',
  descriptionZh: '随着执政联盟崩溃，议会陷入瘫痪。总统宣布解散议会，并按照宪政日程中已经记录的日期提前举行大选。西班牙进入看守期；下一届执政联盟将由选举结果产生。',
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
        };
      }
    }
  ]
};
