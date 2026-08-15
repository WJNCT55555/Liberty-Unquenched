import { Card } from '../types';
import { adjustClassSupport, adjustFactionDissents } from '../utils';

export const aragonFront: Card = {
  id: 'aragon_front',
  title: 'Aragon Front',
  titleZh: '阿拉贡前线',
  type: 'Military',
  description: 'The Aragon Regional Defense Council is the most radical libertarian socialist experiment on Spanish soil.',
  descriptionZh: '由全国劳工联合会-伊比利亚无政府主义者联合会主导的阿拉贡地区防务委员会，是西班牙土地上最激进的自由社会主义实验。',
  cost: 1,
  condition: (state) => state.aragonCouncilExists && state.aragonTimer <= 0,
  effect: (state) => ({
    aragonTimer: state.aragonTimer + 3,
    currentEvent: {
      id: 'aragon_front_event',
      date: { year: state.year, month: state.month },
      title: 'Aragon Front',
      titleZh: '阿拉贡前线',
      description: 'The Aragon Regional Defense Council is the most radical libertarian socialist experiment on Spanish soil. Its agricultural collectivization, worker-controlled militias, and direct democracy are both a beacon of revolution and a thorn in the side of the central Republican government. Voices here range from the Durruti Column to local federations, alongside the challenges of Stalinist infiltration.\n\nWe can implement policies in Aragon.',
      descriptionZh: '由全国劳工联合会-伊比利亚无政府主义者联合会主导的阿拉贡地区防务委员会，是西班牙土地上最激进的自由社会主义实验。其农业集体化、工人控制的民兵组织及直接民主制度，既是革命的灯塔，也是共和中央政府的眼中钉。这里的声音来自杜鲁蒂纵队、地方联合会，以及斯大林主义持续渗透带来的挑战。\n\n我们可以在阿拉贡推行政策。',
      image: 'img/aragon.jpg',
      options: [
        {
          text: 'Militia Recruitment (+500 Militia)',
          textZh: '民兵招募（+500 民兵）：招募并训练更多民兵志愿者进入前线。',
          subtitle: 'Draw volunteers from collectivized villages to reinforce the CNT-FAI columns.',
          subtitleZh: '从集体化村庄中吸纳志愿者，补强CNT-FAI纵队。',
          effect: (s) => ({
            armedForces: {
              ...s.armedForces,
              militias: {
                ...s.armedForces.militias,
                cntFai: s.armedForces.militias.cntFai + 500
              }
            },
            currentEvent: {
              id: 'aragon_recruitment_result',
              date: { year: s.year, month: s.month },
              title: 'Militia Strength',
              titleZh: '民兵实力',
              description: 'We expanded the militia by absorbing new volunteers from collectivized villages and retraining workers.',
              descriptionZh: '我们通过吸纳来自集体化村庄的新志愿者和再培训工人，扩大了民兵队伍。',
              options: [{
                text: 'Continue',
                textZh: '继续',
                subtitle: 'Return to the front after reviewing the recruitment report.',
                subtitleZh: '查看招募报告后返回前线。',
                effect: (st) => ({})
              }]
            }
          })
        },
        {
          text: 'Restore Discipline (+5 Combat Power, +5 Puristas Dissent, +3 Faistas Dissent)',
          textZh: '整顿纪律（+5 战斗力，+5 纯粹派不满度，+3 无政府主义者不满度）：整顿前线无政府主义民兵的纪律。',
          subtitle: 'Tighten front-line coordination at the cost of angering the most anti-militarist comrades.',
          subtitleZh: '加强前线协同，但会激怒最反军事化的同志。',
          effect: (s) => ({
            militiaCombatPower: s.militiaCombatPower + 5,
            factions: adjustFactionDissents(s.factions, { Puristas: 5, Faistas: 3 }),
            currentEvent: {
              id: 'aragon_discipline_result',
              date: { year: s.year, month: s.month },
              title: 'Restore Discipline',
              titleZh: '整顿纪律',
              description: 'We enhanced our combat effectiveness through military discipline and proletarian solidarity.',
              descriptionZh: '我们通过整顿军事纪律和无产阶级团结增强我们的战斗力。',
              options: [{
                text: 'Continue',
                textZh: '继续',
                subtitle: 'Return to the front after reviewing the discipline report.',
                subtitleZh: '查看纪律整顿报告后返回前线。',
                effect: (st) => ({})
              }]
            }
          })
        },
        {
          text: 'Negotiate with Church (+Church Support, +Yeoman Support, -Poor Peasant Support)',
          textZh: '与教会谈判协议：与当地乡村中的教会谈判达成互不侵犯协议。',
          subtitle: 'Trade limited protections for rural clergy in exchange for local neutrality.',
          subtitleZh: '以有限保护乡村神职人员换取地方中立。',
          effect: (s) => ({
            classes: (() => {
              let newClasses = s.classes;
              newClasses = adjustClassSupport(newClasses, 'Clero', 'CNT_FAI', 10);
              newClasses = adjustClassSupport(newClasses, 'Labradores', 'CNT_FAI', 10);
              newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', -10);
              return newClasses;
            })(),
            currentEvent: {
              id: 'aragon_church_result',
              date: { year: s.year, month: s.month },
              title: 'Negotiate with Rural Church',
              titleZh: '与乡村教会谈判协议',
              description: 'We are making progress with the Aragon clergy on a local non-aggression pact, ensuring they will not actively support the Nationalists in exchange for protecting church buildings and limited worship, though this displeases many peasants...',
              descriptionZh: '我们正在与阿拉贡神职人员就一项地方性互不侵犯协议取得进展，以保护教堂建筑和有限礼拜活动为条件，确保他们不会积极支持国民党，虽然这让许多农民不满......',
              options: [{
                text: 'Continue',
                textZh: '继续',
                subtitle: 'Return to the front after reviewing the church negotiations.',
                subtitleZh: '查看教会谈判结果后返回前线。',
                effect: (st) => ({})
              }]
            }
          })
        },
        {
          text: 'We will not do anything in Aragon for now',
          textZh: '我们暂时不在阿拉贡做任何事',
          subtitle: 'Leave the front unchanged and let the Aragon council continue its current course.',
          subtitleZh: '暂不改变前线政策，让阿拉贡委员会维持当前路线。',
          effect: (s) => ({})
        }
      ]
    }
  }),
};
