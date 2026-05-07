import { Card } from '../types';

export const aragonFront: Card = {
  id: 'aragon_front',
  title: 'Aragon Front',
  titleZh: '阿拉贡前线',
  type: 'Military',
  description: 'The Aragon Regional Defense Council is the most radical libertarian socialist experiment on Spanish soil.',
  descriptionZh: '由全国劳工联合会-伊比利亚无政府主义者联合会主导的阿拉贡地区防务委员会，是西班牙土地上最激进的自由社会主义实验。',
  cost: 0,
  condition: (state) => state.aragonCouncilExists && state.aragonTimer <= 0,
  effect: (state) => ({
    aragonTimer: state.aragonTimer + 3,
    actionsLeft: state.actionsLeft + 1,
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
          textZh: '民兵招募：招募并训练更多民兵志愿者进入前线。',
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
              options: [{ text: 'Continue', textZh: '继续', effect: (st) => ({}) }]
            }
          })
        },
        {
          text: 'Restore Discipline (+5 Militarization, +5 Durruti Dissent, +3 FAIstas Dissent)',
          textZh: '整顿纪律：整顿前线无政府主义民兵的纪律。',
          effect: (s) => ({
            militiaCombatPower: s.militiaCombatPower + 5,
            factions: {
              ...s.factions,
              Puristas: { ...s.factions.Puristas, dissent: Math.min(100, s.factions.Puristas.dissent + 5) },
              Faistas: { ...s.factions.Faistas, dissent: Math.min(100, s.factions.Faistas.dissent + 3) }
            },
            currentEvent: {
              id: 'aragon_discipline_result',
              date: { year: s.year, month: s.month },
              title: 'Restore Discipline',
              titleZh: '整顿纪律',
              description: 'We enhanced our combat effectiveness through military discipline and proletarian solidarity.',
              descriptionZh: '我们通过整顿军事纪律和无产阶级团结增强我们的战斗力。',
              options: [{ text: 'Continue', textZh: '继续', effect: (st) => ({}) }]
            }
          })
        },
        {
          text: 'Advance Front (WIP)',
          textZh: '推进前线：对国民军发动一起军事行动。(WIP)',
          effect: (s) => ({})
        },
        {
          text: 'Land Revolution (WIP)',
          textZh: '土地革命：强制没收土地并建立农业合作社。(WIP)',
          effect: (s) => ({})
        },
        {
          text: 'Negotiate with Church (+Church Support, +Yeoman Support, -Poor Peasant Support)',
          textZh: '与教会谈判协议：与当地乡村中的教会谈判达成互不侵犯协议。',
          effect: (s) => ({
            classes: {
              ...s.classes,
              Church: { support: { ...s.classes.Clero.support, CNT_FAI: Math.min(100, s.classes.Clero.support.CNT_FAI + 10) } },
              Yeoman: { support: { ...s.classes.Labradores.support, CNT_FAI: Math.min(100, s.classes.Labradores.support.CNT_FAI + 10) } },
              PoorPeasants: { support: { ...s.classes.Braceros.support, CNT_FAI: Math.max(0, s.classes.Braceros.support.CNT_FAI - 10) } }
            },
            currentEvent: {
              id: 'aragon_church_result',
              date: { year: s.year, month: s.month },
              title: 'Negotiate with Rural Church',
              titleZh: '与乡村教会谈判协议',
              description: 'We are making progress with the Aragon clergy on a local non-aggression pact, ensuring they will not actively support the Nationalists in exchange for protecting church buildings and limited worship, though this displeases many peasants...',
              descriptionZh: '我们正在与阿拉贡神职人员就一项地方性互不侵犯协议取得进展，以保护教堂建筑和有限礼拜活动为条件，确保他们不会积极支持国民党，虽然这让许多农民不满......',
              options: [{ text: 'Continue', textZh: '继续', effect: (st) => ({}) }]
            }
          })
        },
        {
          text: 'Eradicate (No new policy)',
          textZh: '根除：无需新政策。',
          effect: (s) => ({})
        },
        ...(state.difficulty !== 'historical' && state.difficulty !== 'hard' ? [{
          text: 'Return to hand',
          textZh: '放回手牌',
          effect: (s: any) => ({
            aragonTimer: Math.max(0, s.aragonTimer - 3),
            actionsLeft: Math.max(0, s.actionsLeft - 1),
            hand: [...s.hand, aragonFront]
          })
        }] : []),
        {
          text: 'Cancel advisor action',
          textZh: '取消顾问行动',
          effect: (s) => ({
            aragonTimer: Math.max(0, s.aragonTimer - 3),
            actionsLeft: Math.max(0, s.actionsLeft - 1),
            hand: [...s.hand, aragonFront]
          })
        }
      ]
    }
  }),
};
