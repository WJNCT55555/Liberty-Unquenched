import { GameEvent } from '../../types';

export const cataloniaDefense: GameEvent = {
  id: 'catalonia_defense',
  title: 'The Catalan Uprising',
  titleZh: '保卫加泰罗尼亚',
  description: 'Anarchist militias erect barricades across Barcelona. Security forces join the resistance; Assault Guards share weapons with the anarchist defenders. Anarchist leaders meet with Lluís Companys, president of the Generalitat.',
  descriptionZh: '无政府主义民兵在巴塞罗那各处设立路障。安全部队加入抵抗；突击警卫与无政府主义守军共享武器。无政府主义领袖会见加泰罗尼亚政府主席孔帕尼斯。',
  condition: (state) => state.civilWarStatus === 'ongoing' && state.cataloniaControl === 'republic',
  options: [
    {
      text: 'The Anarchists Seize Power!',
      textZh: '无政府主义者夺取政权！',
      effect: (state) => ({
        cataloniaControl: 'cnt_fai',
        stats: { ...state.stats, workerControl: state.stats.workerControl + 20 },
        regions: {
          ...state.regions,
          catalonia: { ...state.regions.catalonia, control: 100 }
        }
      })
    },
    {
      text: 'Temporary Alliance with Companys',
      textZh: '无政府主义者与孔帕尼斯暂时结盟',
      effect: (state) => ({
        cataloniaControl: 'committee',
        stats: { ...state.stats, popularFrontUnity: state.stats.popularFrontUnity + 10 },
        regions: {
          ...state.regions,
          catalonia: { ...state.regions.catalonia, control: 100 }
        }
      })
    }
  ]
};
