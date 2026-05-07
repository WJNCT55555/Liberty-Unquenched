import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';
import { elections1931Results } from './elections_1931_results';

export const generalElections1931: GameEvent = {
  id: '1931_general_elections',
  date: { year: 1931, month: 6 },
  title: '1931 General Elections',
  titleZh: '1931年大选',
  description: 'The provisional government has called for general elections to form a Constituent Cortes. This is the first truly democratic election in Spanish history, and the stakes are incredibly high. The left-wing coalition, led by the PSOE and the Republican Action (IR), is poised for a massive victory. The right-wing is disorganized and demoralized after the fall of the monarchy. For the CNT, the question is whether to maintain our traditional abstentionist stance or to tacitly support the left to ensure the defeat of the reactionaries.',
  descriptionZh: '临时政府呼吁举行大选以组成制宪议会。这是西班牙历史上第一次真正民主的选举，利害攸关。由西班牙工人社会党（PSOE）和共和行动党（IR）领导的左翼联盟势必取得巨大胜利。右翼在君主制垮台后组织涣散、士气低落。对于CNT来说，问题在于是否要维持我们传统的弃权立场，还是默许支持左翼以确保反动派的失败。',
  options: [
    {
      text: 'Abstain! The ballot box is a trap for the working class.',
      textZh: '弃权！投票箱是工人阶级的陷阱。',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        // Abstention hurts the left slightly, but maintains ideological purity
        newClasses.Obreros.support.PSOE -= 5;
        newClasses.PequenaBurguesia.support.IR -= 5;
        return {
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Faistas', 10),
          stats: { 
            ...state.stats, 
            revolutionaryFervor: state.stats.revolutionaryFervor + 5,
            republican_socialist_coalition_power: state.stats.republican_socialist_coalition_power - 10
          },
          pendingEvents: [{ ...elections1931Results }, ...state.pendingEvents]
        };
      },
    },
    {
      text: 'Tacitly encourage voting for the Republican-Socialist coalition.',
      textZh: '默许鼓励投票给共和-社会党联盟。',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        // Supporting the left boosts their support but angers the radicals
        newClasses.Obreros.support.PSOE += 10;
        newClasses.PequenaBurguesia.support.IR += 10;
        return {
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Treintistas', 10),
          stats: { 
            ...state.stats, 
            revolutionaryFervor: state.stats.revolutionaryFervor - 5,
            republican_socialist_coalition_power: state.stats.republican_socialist_coalition_power + 15
          },
          pendingEvents: [{ ...elections1931Results }, ...state.pendingEvents]
        };
      },
    },
  ],
};
