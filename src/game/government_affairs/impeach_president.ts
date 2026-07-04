import { Card, GameState } from '../types';
import { presidentialElectionDecision } from '../events';

export const impeachPresident: Card = {
  id: 'impeach_president',
  title: 'Impeach President Alcalá-Zamora',
  titleZh: '弹劾阿尔卡拉-萨莫拉总统',
  type: 'Government',
  description: 'Under Article 81 of the Constitution of 1931, the newly elected Cortes has the power to examine the second dissolution of parliament decreed by the President. If the assembly finds the dissolution was unjustified, they can vote to impeach and remove him from office.',
  descriptionZh: '根据1931年宪法第81条，新选出的议会有权审查总统第二次解散议会的决定。如果议会认定第二次解散是不必要的或没有正当理由，则可以通过投票弹劾并罢免总统。由于总统已经两次解散了议会，我们现在可以行使这一宪法权力。',
  cost: 1,
  condition: (state) => {
    return state.impeachPresidentAvailable &&
       !state.isPresidentImpeached &&
       state.civilWarStatus === 'not_started';
  },
  effect: (state: GameState) => {
    return {
      currentEvent: {
        id: 'impeach_president_event',
        title: 'Impeachment of President Alcalá-Zamora',
        titleZh: '弹劾阿尔卡拉-萨莫拉总统',
        description: 'The newly elected Cortes is now in session to debate the constitutionality of the President\'s second dissolution of parliament. On the Left, representatives from the PSOE, PCE, and Left Republicans strongly advocate for his dismissal, accusing him of overstepping his constitutional bounds and showing bias. On the Right, the opposition views this as a partisan attempt to capture the highest office in Spain. As part of the government, how will we vote on this impeachment?',
        descriptionZh: '新当选的议会正在举行会议，辩论总统第二次解散议会是否符合宪法。在左翼，来自工人社会党（PSOE）、共产党（PCE）以及左翼共和派的代表强烈主张将其罢免，指责他逾越了宪法界限并表现出党派偏见。在右翼，反对派将这视为左翼为了夺取国家最高权力而进行的党派阴谋。作为联合政府的参与方，我们将如何投下这一票？',
        options: [
          {
            text: 'Vote to Impeach! Remove him from office and elect Manuel Azaña.',
            textZh: '投票赞成弹劾！将他罢免并推选曼努埃尔·阿萨尼亚。',
            subtitle: 'Alcalá-Zamora is successfully removed. Left parties are ecstatic, but the Right is outraged by what they see as a constitutional coup, driving tension and coup progress higher.',
            subtitleZh: '阿尔卡拉-萨莫拉被成功罢免。左翼各党欣喜若狂，但右翼则对这场被他们视为“温和宪法政变”的罢免感到愤怒，这会导致政治局势急剧紧绷，叛乱准备加速。',
            effect: (s: GameState) => {
              const currentRelations = { ...s.partyRelations };
              currentRelations.PSOE = Math.min(100, (currentRelations.PSOE ?? 0) + 10);
              currentRelations.IR = Math.min(100, (currentRelations.IR ?? 0) + 12);
              currentRelations.AP = Math.max(-100, (currentRelations.AP ?? 0) - 15);
              
              return {
                isPresidentImpeached: true,
                government: {
                  ...s.government,
                  president: 'Diego Martínez Barrio',
                  presidentZh: '迭戈·马丁内斯·巴里奥'
                },
                partyRelations: currentRelations,
                coupProgress: (s.coupProgress || 0) + 1,
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 10)
                },
                currentEvent: presidentialElectionDecision
              };
            }
          },
          {
            text: 'Vote to Abstain or Oppose. Maintain constitutional stability.',
            textZh: '投弃权或反对票。维持宪法稳定。',
            subtitle: 'The impeachment fail to secure the necessary majority. Alcalá-Zamora remains President. This placates the Right and reduces coup tension, but disappoints our radical left allies.',
            subtitleZh: '罢免案未能通过。阿尔卡拉-萨莫拉继续担任总统。这缓和了右翼的情绪，降低了政变风险，但让我们的左翼盟友感到失望。',
            effect: (s: GameState) => {
              const currentRelations = { ...s.partyRelations };
              currentRelations.PSOE = Math.max(-100, (currentRelations.PSOE ?? 0) - 8);
              currentRelations.IR = Math.max(-100, (currentRelations.IR ?? 0) - 8);
              currentRelations.AP = Math.min(100, (currentRelations.AP ?? 0) + 10);

              return {
                partyRelations: currentRelations
              };
            }
          }
        ]
      }
    };
  }
};
