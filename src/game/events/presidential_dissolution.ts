import { GameEvent } from '../types';
import { elections1933 } from './elections_1933';
import { elections1936 } from './elections_1936';

export const presidentialDissolutionOfCortes: GameEvent = {
  id: 'presidential_dissolution_of_cortes',
  title: 'President Alcalá-Zamora Dissolves the Cortes!',
  titleZh: '阿尔卡拉-萨莫拉总统宣布解散议会！',
  description: 'With the collapse of the governing coalition, the legislative chamber has descended into complete paralysis. Exercising his constitutional authority under the Constitution of 1931, President Niceto Alcalá-Zamora has dissolved the Cortes and decreed early general elections. Spain is once again thrown into an intense electoral campaign, with polarized social forces preparing for a showdown at the ballot boxes.',
  descriptionZh: '随着执政联盟的崩溃，议会陷入了彻底的瘫痪。尼塞托·阿尔卡拉-萨莫拉总统行使1931年宪法赋予他的权力，正式宣布解散议会并提前举行大选。西班牙再次被推入激烈的选举浪潮中，社会各界政治力量纷纷重整旗鼓，准备在选票箱前一决胜负。',
  condition: (state) => {
    return state.coalition_just_dissolved && !state.civilWarStatus && state.civilWarStatus !== 'ongoing';
  },
  options: [
    {
      text: 'Acknowledge the presidential decree and prepare for early elections.',
      textZh: '接受总统法令，动员群众积极筹备大选。',
      subtitle: 'The President has used his constitutional prerogative. This increases political tension across the country.',
      subtitleZh: '总统行使了宪法特权，这让全国的政治局势更加紧绷和动荡。',
      effect: (state) => {
        const nextCount = state.dissolutionCount + 1;
        const canImpeach = nextCount >= 2;
        
        // Choose which elections event to schedule
        // If we are before or in 1933, schedule 1933 elections. Otherwise, schedule 1936 elections.
        const electionEvent = state.year <= 1933 ? elections1933 : elections1936;

        return {
          coalition_just_dissolved: false,
          dissolutionCount: nextCount,
          impeachPresidentAvailable: state.impeachPresidentAvailable || canImpeach,
          stats: {
            ...state.stats,
            tension: Math.min(100, state.stats.tension + 8)
          },
          pendingEvents: [
            { ...electionEvent },
            ...state.pendingEvents.filter(e => e.id !== electionEvent.id)
          ]
        };
      }
    }
  ]
};
