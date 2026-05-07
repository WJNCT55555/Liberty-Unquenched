import { GameEvent } from '../../types';

export const navyDecision: GameEvent = {
  id: 'navy_decision',
  title: 'The Navy Decides the Fate of the Strait',
  titleZh: '共和国海军的抉择',
  description: 'The crews of the Republican Navy face a critical decision: support the Republic, side with the rebels, or follow the anarchist militias. Control of the Strait of Gibraltar will determine whether Franco’s Army of Africa can reach the mainland.',
  descriptionZh: '共和国海军的水兵们面临关键抉择：支持共和国、倒向叛乱者，还是追随无政府主义民兵。直布罗陀海峡的控制权将决定佛朗哥的非洲军团能否抵达本土。',
  condition: (state) => state.civilWarStatus === 'ongoing' && state.sanjurjoStatus === 'dead' && state.francoAfricaControl && state.navyStatus === 'neutral',
   options: [
    {
      text: 'Full Steam Ahead! Block the Strait!',
      textZh: '全速前进，封锁海峡！',
      effect: (state) => ({
        navyStatus: 'republic',
        africaArmyStatus: state.africaArmyStatus === 'nationalist' ? 'delayed' : state.africaArmyStatus
      })
    },
    {
      text: 'Welcome General Franco',
      textZh: '迎接佛朗哥将军',
      condition: (state) => state.francoStatus === 'republic',
      effect: (state) => ({
        africaArmyStatus: 'republic'
      })
    },
    {
      text: 'Wait and See',
      textZh: '继续观望',
      condition: (state) => state.africaArmyStatus === 'nationalist',
      effect: (state) => ({
        navyStatus: 'neutral',
        warProgress: Math.min(100, state.warProgress + 10) // Franco lands
      })
    },
    {
      text: 'The Red Navy Makes Its Own Decision',
      textZh: '红海军有自己的决定',
      // condition: (state) => CNT-FAI infiltrated navy (wip)
      effect: (state) => ({
        navyStatus: 'anarchist',
        africaArmyStatus: state.africaArmyStatus === 'nationalist' ? 'delayed' : state.africaArmyStatus
      })
    }
  ]
};