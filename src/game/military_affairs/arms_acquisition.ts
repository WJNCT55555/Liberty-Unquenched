import { Card, GameEvent, GameState } from '../types';
import { resourcePreview, textPreview } from '../effectPreview';
import { randomChance } from '../rules/rng';

const frenchOperationCount = (state: GameState): number => (
  Math.max(0, Math.floor(state.covert_ops_france ?? 0))
);

const borderSuccessChance = (state: GameState): number => (
  Math.min(90, 50 + frenchOperationCount(state) * 10)
);

const armsAcquisitionEvent = (state: GameState): GameEvent => ({
  id: 'arms_acquisition_event',
  date: { year: state.year, month: state.month },
  title: 'Arms Acquisition',
  titleZh: '军备获取',
  description: 'Our contacts in France may help move weapons across the border.',
  descriptionZh: '我们在法国的联系网络或许能帮助武器越过边境。',
  options: [
    {
      text: 'Try to Obtain Weapons from the French Border',
      textZh: '尝试从法国边境获取武器',
      subtitle: 'Spend 1 resource. Success chance is 50% + 10% per covert operation in France, up to 90%; on success gain 1 armament plus one per operation.',
      subtitleZh: '消耗1资源。成功率为50%加上每次法国秘密行动提供的10%，最高90%；成功时获得1加法国秘密行动次数的军备。',
      condition: (current: GameState) => current.resources >= 1,
      unavailableSubtitle: () => 'Requires 1 resource.',
      unavailableSubtitleZh: () => '需要至少1资源。',
      effectPreview: (current: GameState) => {
        const chance = borderSuccessChance(current);
        const gain = 1 + frenchOperationCount(current);

        return [
          resourcePreview(-1),
          textPreview(`Success chance: ${chance}%.`, `成功率：${chance}%。`),
          textPreview(
            `Success: gain ${gain} armament${gain === 1 ? '' : 's'}. Failure: gain no armaments.`,
            `成功：获得${gain}军备；失败：不获得军备。`
          )
        ];
      },
      effect: (current: GameState): Partial<GameState> => {
        const gain = randomChance(borderSuccessChance(current) / 100)
          ? 1 + frenchOperationCount(current)
          : 0;

        return {
          resources: current.resources - 1,
          armaments: current.armaments + gain,
          currentEvent: null
        };
      }
    }
  ]
});

export const armsAcquisition: Card = {
  id: 'arms_acquisition',
  title: 'Arms Acquisition',
  titleZh: '军备获取',
  type: 'Military',
  description: 'Seek weapons through our contacts near the French border.',
  descriptionZh: '通过法国边境附近的联系网络寻求武器。',
  cost: 1,
  // Each attempt already spends an action point and a resource; no separate timer is needed.
  condition: (state: GameState) => state.resources >= 1,
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: armsAcquisitionEvent(state)
  })
};
