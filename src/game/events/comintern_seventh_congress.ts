import type { GameEvent } from '../types';
import { isAtOrAfter } from '../utils';

export const cominternSeventhCongress: GameEvent = {
  id: 'comintern_seventh_congress',
  meta: { category: 'news', flow: 'solo' },
  date: { year: 1935, month: 8 },
  condition: (state) => state.scenario !== '1936'
    && isAtOrAfter(state, 1935, 8)
    && !state.pceAcceptsComintern,
  title: 'The Seventh Congress of the Communist International',
  titleZh: '共产国际第七次代表大会',
  description: 'Meeting in Moscow, the Seventh Congress of the Communist International calls for an anti-fascist popular front. Communist parties are urged to cooperate with socialist parties and other anti-fascist forces, and to reach smallholders and the urban middle classes. The Spanish Communist Party adopts this strategy, seeking a broader alliance against fascism in Spain.',
  descriptionZh: '共产国际第七次代表大会在莫斯科召开，提出建立反法西斯人民阵线。共产党应与社会党及其他反法西斯力量合作，并争取自耕农和城市中产阶级。西班牙共产党接受这一战略，转向在西班牙组织更广泛的反法西斯联盟。',
  options: [
    {
      text: 'The Spanish Communist Party adopts the anti-fascist popular-front strategy.',
      textZh: '西班牙共产党转向反法西斯人民阵线战略',
      subtitle: 'Records PCE acceptance of the Comintern line.',
      subtitleZh: '记录 PCE 已接受共产国际路线。',
      effect: () => ({ pceAcceptsComintern: true }),
    },
  ],
};
