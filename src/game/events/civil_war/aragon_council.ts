import { GameEvent } from '../../types';

export const aragonCouncil: GameEvent = {
  id: 'aragon_council',
title: 'Formation of the Aragon Defense Council',
  titleZh: '阿拉贡地区防卫委员会成立',
  description: 'In the wake of the failed military uprising, anarchist militias establish the Aragon Defense Council in the eastern territories. This autonomous body claims control over local militias, economy, and collective agriculture.',
  descriptionZh: '在军事起义失败后，无政府主义民兵在东部地区成立阿拉贡地区防卫委员会。这一自治机构声称控制地方民兵、经济和集体农业。',
  condition: (state) => state.civilWarStatus === 'ongoing' && !state.aragonCouncilExists,
  options: [
    {
      text: '承认委员会',
      textZh: '承认委员会',
      effect: (state) => ({
        aragonCouncilExists: true,
        stats: { ...state.stats, revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15) }
      })
    }
  ]
};
