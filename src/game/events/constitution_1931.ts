import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const constitution1931: GameEvent = {
  id: '1931_constitution',
  date: { year: 1931, month: 12 },
  title: 'The Constitution of 1931',
  titleZh: '1931年宪法',
  description: 'The Constituent Cortes has finally approved the new Constitution of the Spanish Republic. It is a highly progressive document, establishing a "democratic republic of workers of all classes," introducing women\'s suffrage, civil marriage, and allowing for the expropriation of private property for social utility. However, its fierce anti-clerical articles have deeply alienated the Church and the right-wing. Furthermore, the accompanying "Law for the Defense of the Republic" gives the government sweeping powers to suspend civil liberties and crush strikes—a direct threat to the CNT.',
  descriptionZh: '制宪议会最终批准了西班牙共和国的新宪法。这是一份高度进步的文件，建立了一个“各阶级劳动者的民主共和国”，引入了妇女选举权、世俗婚姻，并允许为了社会利益征用私有财产。然而，其强烈的反教权条款深深地疏远了教会和右翼。此外，随附的《保卫共和国法》赋予了政府暂停公民自由和镇压罢工的广泛权力——这对CNT构成了直接威胁。',
  options: [
    {
      text: 'It is just another bourgeois chain. Prepare for direct action.',
      textZh: '这只是另一条资产阶级的锁链。准备直接行动。',
      effect: (state) => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          women_suffrage: state.domesticPolicy.women_suffrage + 1,
          religion_policy: state.domesticPolicy.religion_policy + 2,
          education_institutions: state.domesticPolicy.education_institutions + 1,
          nationalisation_progress: state.domesticPolicy.nationalisation_progress + 1
        },
        stats: {
          ...state.stats,         
          revolutionaryFervor: state.stats.revolutionaryFervor + 10
        },
        factions: adjustFactionInfluence(state.factions, 'Faistas', 10)
      })
    },
    {
      text: 'We must use the new legal framework to expand our syndicates.',
      textZh: '我们必须利用新的法律框架来扩大我们的工会。',
      effect: (state) => ({
        domesticPolicy: {
          ...state.domesticPolicy,
          women_suffrage: state.domesticPolicy.women_suffrage + 1,
          religion_policy: state.domesticPolicy.religion_policy + 2,
          education_institutions: state.domesticPolicy.education_institutions + 1,
          nationalisation_progress: state.domesticPolicy.nationalisation_progress + 1
        },
        stats: {
          ...state.stats,
          revolutionaryFervor: state.stats.revolutionaryFervor - 5,
          workerControl: state.stats.workerControl + 5,
          republican_socialist_coalition_power: state.stats.republican_socialist_coalition_power + 5
        },
        factions: adjustFactionInfluence(state.factions, 'Treintistas', 10)
      })
    }
  ]
};
