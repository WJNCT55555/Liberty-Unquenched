import { Card, GameEvent, GameState } from '../types';
import { effectPreviewFromEffect } from '../effectPreview';
import { adjustFactionDissent } from '../utils';
import { adjustCntMilitiaManpower, isOrganizationActive } from '../organizations';
import { adjustMilitarization } from '../rules/militarization';

type MilitiaReorgEffect = GameEvent['options'][number]['effect'];

const preview = (effect: MilitiaReorgEffect) => (state: GameState) => (
  effectPreviewFromEffect(state, effect)
);

const regularTraining: MilitiaReorgEffect = (state: GameState): Partial<GameState> => ({
  armaments: state.armaments - 1,
  factions: adjustFactionDissent(state.factions, 'Puristas', 5),
  ...adjustMilitarization(state, 'cnt', 5),
  ...adjustCntMilitiaManpower(state, -250),
  currentEvent: null,
});

const recruitMilitia: MilitiaReorgEffect = (state: GameState): Partial<GameState> => ({
  armaments: state.armaments - 1,
  factions: adjustFactionDissent(state.factions, 'Puristas', -5),
  ...adjustCntMilitiaManpower(state, 1000),
  currentEvent: null,
});

const establishAssaultBattalions: MilitiaReorgEffect = (state: GameState): Partial<GameState> => ({
  armaments: state.armaments - 1,
  factions: adjustFactionDissent(state.factions, 'Puristas', 10),
  ...adjustMilitarization(state, 'cnt', 8),
  currentEvent: null,
});

/** 不花军备的慢速路线：只花时间，以及最反军事化的同志们的耐心。 */
const drillTheMilitia: MilitiaReorgEffect = (state: GameState): Partial<GameState> => ({
  factions: adjustFactionDissent(state.factions, 'Faistas', 4),
  ...adjustMilitarization(state, 'cnt', 2),
  currentEvent: null,
});

/**
 * 主动退一步。这条选项对**武装民兵**路线是必需的：它的失败条件是 CNT 军事化率
 * 超过 60，所以玩家需要一条把组织度压回去的路，否则练过头就没有退路。
 */
const leaveThemAlone: MilitiaReorgEffect = (state: GameState): Partial<GameState> => ({
  stats: {
    ...state.stats,
    revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 1),
  },
  ...adjustMilitarization(state, 'cnt', -1),
  currentEvent: null,
});

/** Declining to intervene still consumes the card and starts the militia review cooldown. */
const leaveMilitiaAlone: MilitiaReorgEffect = (): Partial<GameState> => ({
  currentEvent: null,
});

const militiaReorgEvent = (state: GameState): GameEvent => ({
  id: 'militia_reorg_event',
  date: { year: state.year, month: state.month },
  title: 'Militia Reorganization',
  titleZh: '民兵整编',
  description: 'The war demands constant adaptation. How should we organize our militias?',
  descriptionZh: '战争需要不断适应。我们应该如何组织我们的民兵？',
  options: [
    {
      text: 'Regular Training (-1 Armament)',
      textZh: '正规化训练（-1 军备）',
      subtitle: 'Militia manpower −250, CNT militarization +5, Puristas dissent +5. Spend equipment to drill the militia into a smaller but more capable fighting force.',
      subtitleZh: '民兵人力 −250，CNT 军事化率 +5，纯粹派不满度 +5。投入军备训练民兵，使队伍规模缩小但战斗力更强。',
      condition: (state: GameState) => state.armaments >= 1,
      unavailableSubtitle: () => 'Need at least 1 armament.',
      unavailableSubtitleZh: () => '需要至少 1 军备。',
      effectPreview: preview(regularTraining),
      effect: regularTraining,
    },
    {
      text: 'Recruit Militia (-1 Armament)',
      textZh: '招募民兵（-1 军备）',
      subtitle: 'Militia manpower +1000, Puristas dissent −5. Issue weapons broadly and bring more volunteers into the CNT-FAI militia.',
      subtitleZh: '民兵人力 +1000，纯粹派不满度 −5。广泛发放武器，让更多志愿者加入CNT-FAI民兵。',
      condition: (state: GameState) => state.armaments >= 1,
      unavailableSubtitle: () => 'Need at least 1 armament.',
      unavailableSubtitleZh: () => '需要至少 1 军备。',
      effectPreview: preview(recruitMilitia),
      effect: recruitMilitia,
    },
    {
      text: 'Establish Assault Battalions (-1 Armament)',
      textZh: '建立突击营（-1 军备）',
      subtitle: 'CNT militarization +8, Puristas dissent +10. Concentrate scarce weapons into elite assault units for decisive attacks.',
      subtitleZh: 'CNT 军事化率 +8，纯粹派不满度 +10。将稀缺军备集中给精锐突击部队，用于决定性攻势。',
      condition: (state: GameState) => state.armaments >= 1,
      unavailableSubtitle: () => 'Need at least 1 armament.',
      unavailableSubtitleZh: () => '需要至少 1 军备。',
      effectPreview: preview(establishAssaultBattalions),
      effect: establishAssaultBattalions,
    },
    {
      text: 'Drill the Confederal Militia',
      textZh: '操练联合民兵',
      subtitle: 'CNT militarization +2, Faistas dissent +4. No equipment spent — only time, and the patience of the most anti-militarist comrades.',
      subtitleZh: 'CNT 军事化率 +2，无政府主义者不满度 +4。不消耗军备，只消耗时间，以及最反军事化的同志们的耐心。',
      effectPreview: preview(drillTheMilitia),
      effect: drillTheMilitia,
    },
    {
      text: 'Leave the militia to their own devices',
      textZh: '让民兵自行其是',
      subtitle: 'CNT militarization −1, revolutionary fervor +1. The columns keep their own way of doing things.',
      subtitleZh: 'CNT 军事化率 −1，革命热情 +1。各纵队继续按自己的方式行事。',
      effectPreview: preview(leaveThemAlone),
      effect: leaveThemAlone,
    },
    {
      text: 'We do not intend to intervene in militia affairs',
      textZh: '我们不打算插手民兵事务',
      subtitle: 'Leave the militia structure unchanged for now; the review still enters cooldown.',
      subtitleZh: '暂时维持民兵组织现状；整编审查仍会进入冷却。',
      effectPreview: preview(leaveMilitiaAlone),
      effect: leaveMilitiaAlone,
    }
  ]
});

export const militiaReorg: Card = {
  id: 'militia_reorg',
  title: 'Militia Reorganization',
  titleZh: '民兵整编',
  type: 'Military',
  description: 'Adjust the organization of the militias.',
  descriptionZh: '调整民兵组织模式。',
  cost: 1,
  condition: (state: GameState) => state.civilWarStatus !== 'not_started'
    && (state.militia_reorg_timer || 0) <= 0
    && isOrganizationActive(state, 'DC'),
  effect: (state: GameState): Partial<GameState> => ({
    // The whole card is one month of militia work, so every visible option shares this cooldown.
    militia_reorg_timer: 1,
    currentEvent: militiaReorgEvent(state),
  }),
};
