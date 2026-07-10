import { GameEvent } from '../types';

const cntMilitaryMeta = {
  category: 'cnt' as const,
  flow: 'solo' as const,
  tags: ['military'],
};

export const defenseCommitteeFormation: GameEvent = {
  id: 'defense_committee_formation',
  meta: cntMilitaryMeta,
  title: 'Establishment of the Defense Committee',
  titleZh: '防御委员会成立',
  description: 'There can be no revolution without preparation. We have to put an end to the prejudice in favor of improvisation. This error, involving confidence in the creative instinct of the masses, has caused us to pay a heavy price. We cannot obtain by means of a process of spontaneous generation the indispensable means necessary for waging war on a State that has experience, heavy weaponry, and a greater capacity for offensive and defensive combat.',
  descriptionZh: '“没有准备，就没有革命。我们必须结束对即兴发挥的偏见。盲目信任群众创造性本能的错误，让我们付出了沉重的代价。我们无法通过自发的手段，获得对一个拥有经验、重型武器以及更强攻防战斗能力的国家发动战争所必不可少的工具。”',
  condition: (state) => {
    const tension = state.stats?.tension ?? 0;
    const fervor = state.stats?.revolutionaryFervor ?? 0;
    const puristas = state.factions?.Puristas?.influence ?? 0;
    const faistas = state.factions?.Faistas?.influence ?? 0;
    return !state.militaryDeckEnabled && tension > 60 && fervor > 70 && state.cntStance !== 'govern' && (puristas + faistas) > 60;
  },
  options: [
    {
      text: 'Organize the defense committees and coordinate our militia forces.',
      textZh: '组织防御委员会，并协调我们的民兵力量。',
      effect: (state) => ({
        militaryDeckEnabled: true
      })
    }
  ]
};
