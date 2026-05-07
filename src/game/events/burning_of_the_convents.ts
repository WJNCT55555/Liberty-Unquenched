import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const burningConvents: GameEvent = {
  id: 'burning of the convents',
  date: { year: 1931, month: 5 },
  title: 'The May Riots: Burning of the Convents',
  titleZh: '五月骚乱：焚烧修道院',
  description: 
    'The air in Madrid is thick with the scent of incense and charred timber. What began as a skirmish between monarchists and republicans has spiraled into a wave of anti-clerical iconoclasm. From the capital to Malaga, convents are being looted and set ablaze. The government faces a harrowing dilemma: to intervene forcefully is to protect the symbols of the "Old Order," but to stand by is to invite anarchy and alienate the pious middle class.',
  descriptionZh: 
    '马德里的空气中弥漫着沉香与木材烧焦的味道。起初只是君主派与共和派之间的街头冲突，如今已演变成一场席卷全国的反教权圣像破坏运动。从首都到马拉加，一座座修道院在火光中摇曳坍塌。政府陷入了痛苦的进退两难：强力干预意味着保护“旧秩序”的象征，而袖手旁观则会诱发无政府主义乱局，并彻底疏远虔诚的中产阶级。',
  options: [
    {
      text: 'Condemn the Violence and Restore Order',
      textZh: '谴责暴力并恢复秩序',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        // 争取中产阶级和教会的支持，但会引起激进派不满
        newClasses.Clero.support.IR += 5;
        newClasses.Clero.support.UR -= 5;
        newClasses.PequenaBurguesia.support.IR += 5;
        newClasses.PequenaBurguesia.support.CNT_FAI -= 5;
        return {
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Cenetistas', 10),
        };
      },
    },
    {
      text: '"All the convents in Spain are not worth the life of a single Republican"',
      textZh: '“全西班牙的修道院也抵不上一个共和主义者的性命”',
      effect: (state) => ({
        // 引用阿萨尼亚的名言，大幅增加革命热情，讨好激进势力
        stats: { ...state.stats, revolutionaryFervor: state.stats.revolutionaryFervor + 15 },
        factions: adjustFactionInfluence(state.factions, 'Faistas', 10),
      }),
    },
  ],
};
