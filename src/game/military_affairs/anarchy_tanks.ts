import { Card, GameEvent, GameState } from '../types';
import {
  armamentPreview,
  eventPreview,
  factionDissentPreview,
  effectPreviewFromEffect,
  resourcePreview,
  textPreview
} from '../effectPreview';
import { adjustFactionDissent, adjustFactionDissents } from '../utils';
import { adjustCntMilitiaManpower, isOrganizationActive } from '../organizations';
import { adjustMilitarizations } from '../rules/militarization';

type AnarchyTanksEffect = GameEvent['options'][number]['effect'];

const DESCRIPTION = 'Research anarchist tanks to defend our frontlines.';
const DESCRIPTION_ZH = '研发无政府主义坦克。';

const preview = (effect: AnarchyTanksEffect) => (state: GameState) => (
  effectPreviewFromEffect(state, effect)
);

/** Result reports only acknowledge numbers the option already applied. */
const acknowledgeReport: AnarchyTanksEffect = (): Partial<GameState> => ({
  currentEvent: null,
});

const researchReport = (state: GameState, progress: number): GameEvent => ({
  id: 'tank_rd_report',
  date: { year: state.year, month: state.month },
  title: 'Tank R&D Report',
  titleZh: '坦克研发汇报',
  description: `Our tank research progress is at ${progress}%.`,
  descriptionZh: `我们坦克的研发进度为${progress}%。`,
  options: [
    {
      text: 'Continue',
      textZh: '继续',
      subtitle: 'Return to the workshop after reviewing the research report.',
      subtitleZh: '查看研发报告后返回工坊。',
      effectPreview: preview(acknowledgeReport),
      effect: acknowledgeReport,
    }
  ]
});

const acceleratedResearchReport = (
  state: GameState,
  progress: number,
  succeeded: boolean,
): GameEvent => ({
  id: 'tank_accel_report',
  date: { year: state.year, month: state.month },
  title: 'Tank R&D Report',
  titleZh: '坦克研发汇报',
  description: `Our tank research progress is at ${progress}%. Our research this time was a ${succeeded ? 'success' : 'failure'}, but regardless, some comrades seem to have complaints about our scientific research.`,
  descriptionZh: `我们坦克的研发进度为${progress}%，我们这次的研发${succeeded ? '成功' : '失败'}了，但无论成功还是失败,我们一部分同志对我们的科研似乎颇有微词。`,
  options: [
    {
      text: 'Continue',
      textZh: '继续',
      subtitle: 'Return to the workshop after reviewing the accelerated research report.',
      subtitleZh: '查看加速研发报告后返回工坊。',
      effectPreview: preview(acknowledgeReport),
      effect: acknowledgeReport,
    }
  ]
});

const combatTestReport = (state: GameState, succeeded: boolean): GameEvent => ({
  id: 'tank_test_report',
  date: { year: state.year, month: state.month },
  title: 'Combat Test Report',
  titleZh: '实战测试汇报',
  description: succeeded
    ? 'Our tank combat test was a success! This will greatly deter the enemy.'
    : 'Our tank project failed, which aroused the anger of our comrades, who accused us of using precious revolutionary resources on meaningless things.',
  descriptionZh: succeeded
    ? '我们坦克的实战成功！这将极大的震慑敌人。'
    : '我们的坦克计划失败了，这激起了我们同志的怒火，他们指责我们将宝贵的革命资源运用在无意义的事情上。',
  options: [
    {
      text: 'Continue',
      textZh: '继续',
      subtitle: 'Return to the workshop after reviewing the combat test report.',
      subtitleZh: '查看实战测试报告后返回工坊。',
      effectPreview: preview(acknowledgeReport),
      effect: acknowledgeReport,
    }
  ]
});

const fundTankResearch: AnarchyTanksEffect = (state: GameState): Partial<GameState> => {
  const progress = Math.min(100, state.tankResearchProgress + 25);

  return {
    armaments: state.armaments - 1,
    tankResearchProgress: progress,
    currentEvent: researchReport(state, progress),
  };
};

const accelerateTankResearch: AnarchyTanksEffect = (state: GameState): Partial<GameState> => {
  const roll = Math.random() * 100;
  const progressChange = roll < 50 ? 50 : roll < 75 ? 25 : roll < 90 ? 0 : -25;
  const succeeded = roll < 75;
  const progress = Math.min(100, Math.max(0, state.tankResearchProgress + progressChange));

  return {
    armaments: state.armaments - 2,
    tankResearchProgress: progress,
    factions: adjustFactionDissent(state.factions, 'Puristas', 5),
    currentEvent: acceleratedResearchReport(state, progress, succeeded),
  };
};

const runCombatTest: AnarchyTanksEffect = (state: GameState): Partial<GameState> => {
  const roll = Math.random() * 100;
  const successChance = state.difficulty === 'easy' || state.difficulty === 'sandbox'
    ? 75
    : state.difficulty === 'hard'
      ? 30
      : 50;
  const succeeded = roll < successChance;

  if (succeeded) {
    return {
      resources: state.resources - 1,
      tankResearchCompleted: true,
      hasArmoredCars: true,
      factions: adjustFactionDissents(state.factions, {
        Treintistas: -5,
        Cenetistas: -5,
        Faistas: -5,
        Puristas: -5
      }),
      // Armour is the one thing every militia respects: the CNT's own columns
      // and the PCE's both take the lesson.
      ...adjustMilitarizations(state, { cnt: 6, pce: 6 }),
      currentEvent: combatTestReport(state, true),
    };
  }

  const failure: Partial<GameState> = {
    resources: state.resources - 1,
    ...adjustCntMilitiaManpower(state, -1000),
  };

  if (state.difficulty === 'hard') {
    return {
      ...failure,
      tankResearchProgress: 0,
      factions: adjustFactionDissents(state.factions, { Faistas: 5, Puristas: 10 }),
      currentEvent: combatTestReport(state, false),
    };
  }

  // Easy and sandbox mode lose the men but keep the blueprints.
  const progressLoss = state.difficulty === 'easy' || state.difficulty === 'sandbox'
    ? {}
    : { tankResearchProgress: Math.max(0, state.tankResearchProgress - 25) };

  return {
    ...failure,
    ...progressLoss,
    currentEvent: combatTestReport(state, false),
  };
};

/** Shelving the program still consumes the card and starts the tank project cooldown. */
const postponeTankProgram: AnarchyTanksEffect = (): Partial<GameState> => ({
  currentEvent: null,
});

const anarchyTanksEvent = (state: GameState): GameEvent => ({
  id: 'anarchy_tanks_event',
  date: { year: state.year, month: state.month },
  title: 'Anarchy? Tanks?!',
  titleZh: '无政府？ 坦克？！',
  description: 'Against the fascist offensives on the battlefield, we inevitably need some new weapons to defend our frontlines...',
  descriptionZh: '针对在战场上法西斯分子的攻势，我们势必需要一些新武器来保卫我们的战线......',
  options: [
    {
      text: 'Tank R&D (Cost: 1 Armament, +25 Progress)',
      textZh: '坦克研发（消耗 1 军备，进度 +25）',
      subtitle: 'Invest armaments into a steady engineering program for armored vehicles.',
      subtitleZh: '投入军备，稳步推进装甲车辆工程研发。',
      condition: (state: GameState) => state.armaments >= 1 && state.tankResearchProgress < 100,
      unavailableSubtitle: (state: GameState) => state.tankResearchProgress >= 100 ? 'Research completed' : 'Need at least 1 Armament',
      unavailableSubtitleZh: (state: GameState) => state.tankResearchProgress >= 100 ? '研发已完成' : '需要至少 1 军备',
      effectPreview: preview(fundTankResearch),
      effect: fundTankResearch,
    },
    {
      text: 'Accelerate R&D (Cost: 2 Armaments, RNG Progress)',
      textZh: '加速坦克研发（消耗 2 军备，进度随机）',
      subtitle: 'Push the engineers harder with more resources, accepting unpredictable results.',
      subtitleZh: '投入更多资源催促工程团队，但结果将更不可预测。',
      condition: (state: GameState) => state.armaments >= 2 && state.tankResearchProgress > 0 && state.tankResearchProgress < 100,
      unavailableSubtitle: (state: GameState) => state.tankResearchProgress === 0 ? 'Research not started' : state.tankResearchProgress >= 100 ? 'Research completed' : 'Need at least 2 Armaments',
      unavailableSubtitleZh: (state: GameState) => state.tankResearchProgress === 0 ? '研发尚未开始' : state.tankResearchProgress >= 100 ? '研发已完成' : '需要至少 2 军备',
      effectPreview: () => [
        armamentPreview(-2),
        textPreview(
          'RNG: +50 progress (50%), +25 progress (25%), no progress (15%), or -25 progress (10%).',
          '随机：+50进度(50%)、+25进度(25%)、无进度(15%)、或-25进度(10%)。'
        ),
        factionDissentPreview('Puristas', 5),
        eventPreview('Tank R&D Report', '坦克研发汇报')
      ],
      effect: accelerateTankResearch,
    },
    {
      text: 'Combat Test (Cost: 1 Resource, RNG based on difficulty)',
      textZh: '实战测试（消耗 1 资源，成功率随难度变化）',
      subtitle: 'Send the prototype to the front and let battlefield conditions decide its value.',
      subtitleZh: '将原型车送上前线，让战场检验它的价值。',
      condition: (state: GameState) => state.resources >= 1 && state.tankResearchProgress >= 100,
      unavailableSubtitle: (state: GameState) => state.tankResearchProgress < 100 ? 'Research progress must be at least 100%' : 'Need at least 1 Resource',
      unavailableSubtitleZh: (state: GameState) => state.tankResearchProgress < 100 ? '坦克研发进度需不小于100' : '需要至少 1 资源',
      // The test is a coin flip, so the preview spells out both outcomes instead
      // of previewing deltas that only land on one of them.
      effectPreview: (state: GameState) => {
        const successChance = state.difficulty === 'easy' || state.difficulty === 'sandbox'
          ? 75
          : state.difficulty === 'hard'
            ? 30
            : 50;
        const failureLine = state.difficulty === 'hard'
          ? textPreview(
              'Failure: tank progress resets to 0, CNT-FAI militia -1000, Faistas dissent +5, Puristas dissent +10.',
              '失败：坦克进度归零，CNT-FAI民兵 -1000，无政府主义者不满 +5，纯粹派不满 +10。',
              'negative'
            )
          : state.difficulty === 'easy' || state.difficulty === 'sandbox'
            ? textPreview(
                'Failure: CNT-FAI militia -1000.',
                '失败：CNT-FAI民兵 -1000。',
                'negative'
              )
            : textPreview(
                'Failure: tank progress -25, CNT-FAI militia -1000.',
                '失败：坦克进度 -25，CNT-FAI民兵 -1000。',
                'negative'
              );

        return [
          resourcePreview(-1),
          textPreview(`Success chance: ${successChance}%.`, `成功率：${successChance}%。`),
          textPreview(
            'Success: armored cars unlocked, CNT and PCE militarization +6, Treintistas/Cenetistas/Faistas/Puristas dissent −5.',
            '成功：解锁装甲车辆，CNT 与 PCE 军事化率 +6，三十人集团／工团派／无政府主义者／纯粹派不满度 −5。',
            'positive'
          ),
          failureLine,
          eventPreview('Combat Test Report', '实战测试汇报')
        ];
      },
      effect: runCombatTest,
    },
    {
      text: 'We will postpone the tank program for now',
      textZh: '我们暂时搁置坦克计划',
      subtitle: 'Leave the project untouched and preserve our remaining resources; the program still enters cooldown.',
      subtitleZh: '暂不推进项目，保留剩余资源；坦克项目仍会进入冷却。',
      effectPreview: preview(postponeTankProgram),
      effect: postponeTankProgram,
    }
  ]
});

export const anarchyTanks: Card = {
  id: 'anarchy_tanks',
  title: 'Anarchy? Tanks?!',
  titleZh: '无政府？ 坦克？！',
  type: 'Military',
  description: DESCRIPTION,
  descriptionZh: DESCRIPTION_ZH,
  cost: 1,
  condition: (state: GameState) => state.civilWarStatus !== 'not_started'
    && (state.anarchy_tanks_timer || 0) <= 0
    && !state.tankResearchCompleted
    && isOrganizationActive(state, 'DC'),
  effect: (state: GameState): Partial<GameState> => ({
    // Every visible option consumes the card, so the cooldown belongs to the card itself.
    anarchy_tanks_timer: 6,
    currentEvent: anarchyTanksEvent(state),
  }),
};
