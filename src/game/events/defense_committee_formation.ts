import type { GameEvent } from '../types';
import { isOrganizationEstablished, setOrganizationEstablished } from '../organizations';
import { isAnyWarOngoing } from '../rules/republicCrisis';

const cntMilitaryMeta = {
  category: 'cnt' as const,
  flow: 'solo' as const,
  tags: ['military'],
};

export const defenseCommitteeFormation: GameEvent = {
  id: 'defense_committee_formation',
  meta: cntMilitaryMeta,
  condition: (state) => {
    if (isOrganizationEstablished(state, 'DC')) return false;

    // 新触发条件：当下正处于战争状态（阿斯图里亚斯战争进行中，或内战进行中）
    // ——"没有准备，就没有革命"的教训已经用血换来，防御委员会直接排队成立，
    // 不再看紧张度／革命热情，也不要求 CNT 处于反对派立场。
    // 注意：只看"是否在战争中"，战后再回头看结果不触发（won/lost/failed 不算）。
    if (isAnyWarOngoing(state)) return true;

    // 旧路径：和平期的自我准备（1934·11 起 + 高紧张 + 高热情 + 非参政 + 两派主导）
    const tension = state.stats?.tension ?? 0;
    const fervor = state.stats?.revolutionaryFervor ?? 0;
    const puristas = state.factions?.Puristas?.influence ?? 0;
    const faistas = state.factions?.Faistas?.influence ?? 0;
    const historicalWindow = state.year > 1934 || (state.year === 1934 && state.month >= 11);
    return historicalWindow && tension > 60 && fervor > 70 && state.cntStance !== 'govern' && (puristas + faistas) > 60;
  },
  title: 'Establishment of the Defense Committee',
  titleZh: '防御委员会成立',
  description: 'There can be no revolution without preparation. We have to put an end to the prejudice in favor of improvisation. This error, involving confidence in the creative instinct of the masses, has caused us to pay a heavy price. We cannot obtain by means of a process of spontaneous generation the indispensable means necessary for waging war on a State that has experience, heavy weaponry, and a greater capacity for offensive and defensive combat.',
  descriptionZh: '“没有准备，就没有革命。我们必须结束对即兴发挥的偏见。盲目信任群众创造性本能的错误，让我们付出了沉重的代价。我们无法通过自发的手段，获得对一个拥有经验、重型武器以及更强攻防战斗能力的国家发动战争所必不可少的工具。”',
  options: [
    {
      text: 'Organize the defense committees and coordinate our militia forces.',
      textZh: '组织防御委员会，并协调我们的民兵力量。',
      effect: (state) => ({
        ...setOrganizationEstablished(state, 'DC'),
      })
    }
  ]
};
