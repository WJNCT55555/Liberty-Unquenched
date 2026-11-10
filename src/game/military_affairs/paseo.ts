import { Card, GameEvent, GameState } from '../types';
import { textPreview } from '../effectPreview';

const PASEO_COOLDOWN = 8;

const paseoEvent = (state: GameState): GameEvent => ({
  id: 'paseo_event',
  date: { year: state.year, month: state.month },
  title: 'Paseo',
  titleZh: '散步',
  description: 'In the turmoil behind the lines, a name is brought before the militia. Who, if anyone, will be taken away tonight?',
  descriptionZh: '后方局势动荡，一个名字被送到民兵面前。今晚，是否有人会被带走？',
  options: [
    {
      text: 'Ramiro Ledesma Ramos',
      textZh: '拉米罗·莱德斯马',
      subtitle: 'Ramiro Ledesma Ramos dies. Paseo enters an 8-month cooldown.',
      subtitleZh: '拉米罗·莱德斯马·拉莫斯死亡。散步进入8个月冷却。',
      condition: (current: GameState) => current.ramiroLedesmaStatus === 'alive',
      unavailableSubtitle: () => 'Ramiro Ledesma Ramos is already dead.',
      unavailableSubtitleZh: () => '拉米罗·莱德斯马·拉莫斯已经死亡。',
      effectPreview: () => [
        textPreview('Ramiro Ledesma Ramos dies.', '拉米罗·莱德斯马·拉莫斯死亡。')
      ],
      effect: (): Partial<GameState> => {
        return {
          ramiroLedesmaStatus: 'dead',
          currentEvent: null
        };
      }
    },
    {
      text: 'We do not intend to take anyone for a walk tonight',
      textZh: '今晚我们不打算带任何人散步',
      subtitle: 'No additional effect. Paseo enters an 8-month cooldown.',
      subtitleZh: '无额外效果。散步进入8个月冷却。',
      effect: (): Partial<GameState> => {
        return { currentEvent: null };
      }
    }
  ]
});

export const paseo: Card = {
  id: 'paseo',
  title: 'Paseo',
  titleZh: '散步',
  type: 'Military',
  description: 'Decide whether to take a prisoner for a paseo behind the lines.',
  descriptionZh: '决定是否在后方将一名囚犯带去“散步”。',
  cost: 1,
  condition: (state: GameState) => state.civilWarStatus === 'ongoing'
    && (state.paseo_timer || 0) <= 0
    && state.ramiroLedesmaStatus === 'alive',
  effect: (state: GameState): Partial<GameState> => {
    return {
      paseo_timer: PASEO_COOLDOWN,
      currentEvent: paseoEvent(state)
    };
  }
};
