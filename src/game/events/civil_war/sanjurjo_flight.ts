import { GameEvent } from '../../types';

export const francoAfrica: GameEvent = {
  id: 'franco_africa',
  title: 'Franco Takes Command of the African Legion',
  titleZh: '佛朗哥接管非洲军团',
  description: 'After the death of Sanjurjo, the military conspiracy looks to General Francisco Franco to lead the Army of Africa. His decision will determine the fate of Spain.',
  descriptionZh: '桑胡尔霍死后，军事阴谋集团将目光投向弗朗西斯科·佛朗哥将军，希望他领导非洲军团。他的决定将决定西班牙的命运。',
  options: [
    {
      text: 'The Fascist Monster from North Africa',
      textZh: '来自北非的法西斯怪物',
      effect: (state) => ({
        francoStatus: 'nationalist',
        africaArmyStatus: 'nationalist',
        francoAfricaControl: true
      })
    },
    {
      text: 'General Franco Stands with the People',
      textZh: '佛朗哥将军忠于人民',
      condition: (state) => state.francoStatus === 'republic',
      effect: (state) => ({
        africaArmyStatus: 'neutral',
        francoAfricaControl: true
      })
    }
  ]
};

export const sanjurjoFlight: GameEvent = {
  id: 'sanjurjo_flight',
  title: 'General Sanjurjo Flies to Spain',
  titleZh: '桑胡尔霍将军飞向西班牙',
  description: 'General José Sanjurjo, the designated leader of the military uprising, dies in a plane crash while attempting to fly from Portugal to Spain. His death throws the conspiracy into disarray.',
  descriptionZh: '原定领导军事起义的何塞·桑胡尔霍将军在试图从葡萄牙飞往西班牙时因飞机失事身亡。他的死使阴谋陷入混乱。',
  condition: (state) => state.civilWarStatus === 'ongoing' && state.sanjurjoStatus === 'alive',
  options: [
    {
      text: 'The Lion of the Rif Falls',
      textZh: '里夫之狮陨落',
      effect: (state) => ({
        sanjurjoStatus: 'dead',
        currentEvent: francoAfrica
      })
    }
  ]
};
