import { Card, GameState } from '../types';
import { adjustFactionDissent, adjustFactionDissents } from '../utils';
import {
  armamentPreview,
  effectLine,
  eventPreview,
  factionDissentPreview,
  resourcePreview,
  textPreview
} from '../effectPreview';

export const anarchyTanks: Card = {
  id: 'anarchy_tanks',
  title: 'Anarchy? Tanks?!',
  titleZh: '无政府？ 坦克？！',
  type: 'Military',
  description: 'Research anarchist tanks to defend our frontlines.',
  descriptionZh: '研发无政府主义坦克。',
  cost: 1,
  condition: (state) => state.civilWarStatus !== 'not_started' && state.tankTimer <= 0 && !state.tankResearchCompleted,
  effect: (state) => ({
    tankTimer: 6,
    currentEvent: {
      id: 'anarchy_tanks_event',
      date: { year: state.year, month: state.month },
      title: 'Anarchy? Tanks?!',
      titleZh: '无政府？ 坦克？！',
      description: 'Against the fascist offensives on the battlefield, we inevitably need some new weapons to defend our frontlines...',
      descriptionZh: '针对在战场上法西斯分子的攻势，我们势必需要一些新武器来保卫我们的战线......',
      options: [
        {
          text: 'Tank R&D (Cost: 1 Armament, +25 Progress)',
          textZh: '坦克研发（消耗1军备 → 坦克研发进度增加25）',
          subtitle: 'Invest armaments into a steady engineering program for armored vehicles.',
          subtitleZh: '投入军备，稳步推进装甲车辆工程研发。',
          condition: (s) => s.armaments >= 1 && s.tankResearchProgress < 100,
          unavailableSubtitle: (s) => s.tankResearchProgress >= 100 ? 'Research completed' : 'Need at least 1 Armament',
          unavailableSubtitleZh: (s) => s.tankResearchProgress >= 100 ? '研发已完成' : '需要至少 1 军备',
          effectPreview: () => [
            armamentPreview(-1),
            effectLine('Tank research progress', '坦克研发进度', 25),
            eventPreview('Tank R&D Report', '坦克研发汇报')
          ],
          effect: (s) => {
            const newProgress = Math.min(100, s.tankResearchProgress + 25);
            return {
              armaments: s.armaments - 1,
              tankResearchProgress: newProgress,
              currentEvent: {
                id: 'tank_rd_report',
                date: { year: s.year, month: s.month },
                title: 'Tank R&D Report',
                titleZh: '坦克研发汇报',
                description: `Our tank research progress is at ${newProgress}%.`,
                descriptionZh: `我们坦克的研发进度为${newProgress}%。`,
                options: [{
                  text: 'Continue',
                  textZh: '继续',
                  subtitle: 'Return to the workshop after reviewing the research report.',
                  subtitleZh: '查看研发报告后返回工坊。',
                  effect: (st) => ({})
                }]
              }
            };
          }
        },
        {
          text: 'Accelerate R&D (Cost: 2 Armament, RNG Progress)',
          textZh: '加速坦克研发（消耗2军备）',
          subtitle: 'Push the engineers harder with more resources, accepting unpredictable results.',
          subtitleZh: '投入更多资源催促工程团队，但结果将更不可预测。',
          condition: (s) => s.armaments >= 2 && s.tankResearchProgress > 0 && s.tankResearchProgress < 100,
          unavailableSubtitle: (s) => s.tankResearchProgress === 0 ? 'Research not started' : s.tankResearchProgress >= 100 ? 'Research completed' : 'Need at least 2 Armaments',
          unavailableSubtitleZh: (s) => s.tankResearchProgress === 0 ? '研发尚未开始' : s.tankResearchProgress >= 100 ? '研发已完成' : '需要至少 2 军备',
          effectPreview: () => [
            armamentPreview(-2),
            textPreview(
              'RNG: +50 progress (50%), +25 progress (25%), no progress (15%), or -25 progress (10%).',
              '随机：+50进度(50%)、+25进度(25%)、无进度(15%)、或-25进度(10%)。'
            ),
            factionDissentPreview('Puristas', 5),
            eventPreview('Tank R&D Report', '坦克研发汇报')
          ],
          effect: (s) => {
            const roll = Math.random() * 100;
            let progressChange = 0;
            let success = true;
            if (roll < 50) progressChange = 50;
            else if (roll < 75) progressChange = 25;
            else if (roll < 90) { progressChange = 0; success = false; }
            else { progressChange = -25; success = false; }

            const newProgress = Math.min(100, Math.max(0, s.tankResearchProgress + progressChange));

            return {
              armaments: s.armaments - 2,
              tankResearchProgress: newProgress,
              factions: adjustFactionDissent(s.factions, 'Puristas', 5),
              currentEvent: {
                id: 'tank_accel_report',
                date: { year: s.year, month: s.month },
                title: 'Tank R&D Report',
                titleZh: '坦克研发汇报',
                description: `Our tank research progress is at ${newProgress}%. Our research this time was a ${success ? 'success' : 'failure'}, but regardless, some comrades seem to have complaints about our scientific research.`,
                descriptionZh: `我们坦克的研发进度为${newProgress}%，我们这次的研发${success ? '成功' : '失败'}了，但无论成功还是失败,我们一部分同志对我们的科研似乎颇有微词。`,
                options: [{
                  text: 'Continue',
                  textZh: '继续',
                  subtitle: 'Return to the workshop after reviewing the accelerated research report.',
                  subtitleZh: '查看加速研发报告后返回工坊。',
                  effect: (st) => ({})
                }]
              }
            };
          }
        },
        {
          text: 'Combat Test (Cost: 1 Resource, RNG based on difficulty)',
          textZh: '实战测试（消耗1资源）',
          subtitle: 'Send the prototype to the front and let battlefield conditions decide its value.',
          subtitleZh: '将原型车送上前线，让战场检验它的价值。',
          condition: (s) => s.resources >= 1 && s.tankResearchProgress >= 100,
          unavailableSubtitle: (s) => s.tankResearchProgress < 100 ? 'Research progress must be at least 100%' : 'Need at least 1 Resource',
          unavailableSubtitleZh: (s) => s.tankResearchProgress < 100 ? '坦克研发进度需不小于100' : '需要至少 1 资源',
          effectPreview: (s) => {
            const successChance = s.difficulty === 'easy' || s.difficulty === 'sandbox'
              ? 75
              : s.difficulty === 'hard'
                ? 30
                : 50;
            const failureLine = s.difficulty === 'hard'
              ? textPreview(
                  'Failure: tank progress resets to 0, CNT-FAI militia -1000, Faistas dissent +5, Puristas dissent +10.',
                  '失败：坦克进度归零，CNT-FAI民兵 -1000，FAI派不满 +5，纯粹派不满 +10。',
                  'negative'
                )
              : s.difficulty === 'easy' || s.difficulty === 'sandbox'
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
              textPreview('Success: armored cars unlocked.', '成功：解锁装甲车辆。', 'positive'),
              effectLine('Militia combat power', '民兵战斗力', 10),
              factionDissentPreview('Treintistas', -5),
              factionDissentPreview('Cenetistas', -5),
              factionDissentPreview('Faistas', -5),
              factionDissentPreview('Puristas', -5),
              failureLine,
              eventPreview('Combat Test Report', '实战测试汇报')
            ];
          },
          effect: (s) => {
            const roll = Math.random() * 100;
            let success = false;
            const newState: Partial<GameState> = { resources: s.resources - 1 };

            if (s.difficulty === 'easy' || s.difficulty === 'sandbox') {
              if (roll < 75) success = true;
              else {
                newState.armedForces = {
                  ...s.armedForces,
                  militias: { ...s.armedForces.militias, cntFai: Math.max(0, s.armedForces.militias.cntFai - 1000) }
                };
              }
            } else if (s.difficulty === 'hard') {
              if (roll < 30) success = true;
              else {
                newState.tankResearchProgress = 0;
                newState.armedForces = {
                  ...s.armedForces,
                  militias: { ...s.armedForces.militias, cntFai: Math.max(0, s.armedForces.militias.cntFai - 1000) }
                };
                newState.factions = adjustFactionDissents(s.factions, { Faistas: 5, Puristas: 10 });
              }
            } else { // normal / historical
              if (roll < 50) success = true;
              else {
                newState.tankResearchProgress = Math.max(0, s.tankResearchProgress - 25);
                newState.armedForces = {
                  ...s.armedForces,
                  militias: { ...s.armedForces.militias, cntFai: Math.max(0, s.armedForces.militias.cntFai - 1000) }
                };
              }
            }

            if (success) {
              newState.tankResearchCompleted = true;
              newState.hasArmoredCars = true;
              newState.militiaCombatPower = s.militiaCombatPower + 10;
              newState.factions = adjustFactionDissents(s.factions, {
                Treintistas: -5,
                Cenetistas: -5,
                Faistas: -5,
                Puristas: -5
              });
            }

            return {
              ...newState,
              currentEvent: {
                id: 'tank_test_report',
                date: { year: s.year, month: s.month },
                title: 'Combat Test Report',
                titleZh: '实战测试汇报',
                description: success ? 'Our tank combat test was a success! This will greatly deter the enemy.' : 'Our tank project failed, which aroused the anger of our comrades, who accused us of using precious revolutionary resources on meaningless things.',
                descriptionZh: success ? '我们坦克的实战成功！这将极大的震慑敌人。' : '我们的坦克计划失败了，这激起了我们同志的怒火，他们指责我们将宝贵的革命资源运用在无意义的事情上。',
                options: [{
                  text: 'Continue',
                  textZh: '继续',
                  subtitle: 'Return to the workshop after reviewing the combat test report.',
                  subtitleZh: '查看实战测试报告后返回工坊。',
                  effect: (st) => ({})
                }]
              }
            };
          }
        },
        {
          text: 'We will postpone the tank program for now',
          textZh: '我们暂时搁置坦克计划',
          subtitle: 'Leave the project untouched and preserve our remaining resources.',
          subtitleZh: '暂不推进项目，保留剩余资源。',
          effect: (s) => ({})
        }
      ]
    }
  }),
};
