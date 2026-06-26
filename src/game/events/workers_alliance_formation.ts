import { GameEvent } from '../types';

export const workersAllianceFormation: GameEvent = {
  id: 'workers_alliance_formation',
  title: 'Formation of the Workers\' Alliance',
  titleZh: '工人联盟宣告成立',
  description: 'Through tireless efforts and common class interest, the CNT and the socialist organizations have joined hands in the Workers\' Alliance (Alianza Obrera). A united proletariat stands ready to defend the social revolution and defeat any reactionary coup!',
  descriptionZh: '通过不懈的努力和共同的阶级利益，全国劳工联盟（CNT）与社会主义组织在“工人联盟”（Alianza Obrera）中携起手来。一个团结的无产阶级已经做好了准备，捍卫社会革命并击败任何反动的军事政变！',
  condition: (state) => false, // This is triggered directly by the journal complete effect, so it does not need a monthly condition
  options: [
    {
      text: 'Long live the Workers\' Alliance! Uníos Hermanos Proletarios!',
      textZh: '工人联盟万岁！联合无产阶级兄弟！',
      effect: (state) => ({})
    }
  ]
};
