import { Card } from '../types';

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
          condition: (s) => s.armaments >= 1 && s.tankResearchProgress < 100,
          unavailableSubtitle: (s) => s.tankResearchProgress >= 100 ? 'Research completed' : 'Need at least 1 Armament',
          unavailableSubtitleZh: (s) => s.tankResearchProgress >= 100 ? '研发已完成' : '需要至少 1 军备',
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
                options: [{ text: 'Continue', textZh: '继续', effect: (st) => ({}) }]
              }
            };
          }
        },
        {
          text: 'Accelerate R&D (Cost: 2 Armament, RNG Progress)',
          textZh: '加速坦克研发（消耗2军备 → 杜鲁提之友派分歧+5；随机进度）',
          condition: (s) => s.armaments >= 2 && s.tankResearchProgress > 0 && s.tankResearchProgress < 100,
          unavailableSubtitle: (s) => s.tankResearchProgress === 0 ? 'Research not started' : s.tankResearchProgress >= 100 ? 'Research completed' : 'Need at least 2 Armaments',
          unavailableSubtitleZh: (s) => s.tankResearchProgress === 0 ? '研发尚未开始' : s.tankResearchProgress >= 100 ? '研发已完成' : '需要至少 2 军备',
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
              factions: {
                ...s.factions,
                Puristas: { ...s.factions.Puristas, dissent: Math.min(100, s.factions.Puristas.dissent + 5) }
              },
              currentEvent: {
                id: 'tank_accel_report',
                date: { year: s.year, month: s.month },
                title: 'Tank R&D Report',
                titleZh: '坦克研发汇报',
                description: `Our tank research progress is at ${newProgress}%. Our research this time was a ${success ? 'success' : 'failure'}, but regardless, some comrades seem to have complaints about our scientific research.`,
                descriptionZh: `我们坦克的研发进度为${newProgress}%，我们这次的研发${success ? '成功' : '失败'}了，但无论成功还是失败我们一部分同志对我们的科研似乎颇有微词。`,
                options: [{ text: 'Continue', textZh: '继续', effect: (st) => ({}) }]
              }
            };
          }
        },
        {
          text: 'Combat Test (Cost: 1 Resource, RNG based on difficulty)',
          textZh: '实战测试（消耗1资源 → 随机结果取决于难度）',
          condition: (s) => s.resources >= 1 && s.tankResearchProgress >= 100,
          unavailableSubtitle: (s) => s.tankResearchProgress < 100 ? 'Research progress must be at least 100%' : 'Need at least 1 Resource',
          unavailableSubtitleZh: (s) => s.tankResearchProgress < 100 ? '坦克研发进度需不小于100' : '需要至少 1 资源',
          effect: (s) => {
            const roll = Math.random() * 100;
            let success = false;
            let newState: any = { resources: s.resources - 1 };

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
                newState.factions = {
                  ...s.factions,
                  Faistas: { ...s.factions.Faistas, dissent: Math.min(100, s.factions.Faistas.dissent + 5) },
                  Puristas: { ...s.factions.Puristas, dissent: Math.min(100, s.factions.Puristas.dissent + 10) }
                };
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

            console.log(`[Tank Combat Test] Success: ${success}, Difficulty: ${s.difficulty}`);
            if (success) {
              newState.tankResearchCompleted = true;
              newState.hasArmoredCars = true;
              newState.militiaCombatPower = s.militiaCombatPower + 10;
              newState.factions = {
                ...s.factions,
                Treintistas: { ...s.factions.Treintistas, dissent: Math.max(0, s.factions.Treintistas.dissent - 5) },
                Cenetistas: { ...s.factions.Cenetistas, dissent: Math.max(0, s.factions.Cenetistas.dissent - 5) },
                Faistas: { ...s.factions.Faistas, dissent: Math.max(0, s.factions.Faistas.dissent - 5) },
                Puristas: { ...s.factions.Puristas, dissent: Math.max(0, s.factions.Puristas.dissent - 5) }
              };
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
                options: [{ text: 'Continue', textZh: '继续', effect: (st) => ({}) }]
              }
            };
          }
        },
        {
          text: 'Cancel',
          textZh: '取消',
          effect: (s: any) => ({
            tankTimer: 0,
            hand: [...s.hand, anarchyTanks]
          })
        }
      ]
    }
  }),
};
