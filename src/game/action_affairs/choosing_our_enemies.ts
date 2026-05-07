import { Card, GameState, GameEvent } from '../types';

export const cntChooseEnemies: Card = {
  id: 'choosing_our_enemies',
  title: 'Choosing Our Enemies',
  titleZh: '选择我们的敌人',
  type: 'Action',
  description:
    'In every revolution, clarity about the adversary is half the battle. The CNT must decide which political force to target as our main enemy in propaganda campaigns, street actions, and alliance negotiations. This choice will resonate through the entire labor movement, affecting internal unity, cross-party relations, and the pace of social upheaval.',
  descriptionZh:
    '每一次革命中，认清敌人便是胜利的一半。CNT 必须在宣传运动、街头行动和联盟谈判中，确定我们将主要打击哪一股政治势力。这一选择将响彻整个劳工运动，影响内部团结、跨党派关系以及社会动荡的进程。',
  cost: 1,

  condition: (state) => state.choose_enemies_timer <= 0,

  effect: (state: GameState) => {
    const options: GameEvent['options'] = [];

    // 选项1：极右翼——君主派、天主教会和法西斯主义这是我们的敌人
    options.push({
      text: 'The Far Right — Monarchists, the Church, and Fascists are our enemies',
      textZh: '极右翼——君主派、天主教会和法西斯主义这是我们的敌人',
      subtitle: 'A united front against all reactionary forces.',
      subtitleZh: '建立反对一切反动势力的统一战线。',
      effect: (s: GameState) => {
        const newPartyRelations = { ...s.partyRelations };
        const newFactions = JSON.parse(JSON.stringify(s.factions));
        const newStats = { ...s.stats };

        newPartyRelations.PCE = Math.min(100, Math.max(-100, newPartyRelations.PCE + 10));
        if (s.poum_founded) {
          newPartyRelations.POUM = Math.min(100, Math.max(-100, (newPartyRelations.POUM || 0) + 10));
        }
        newPartyRelations.PSOE = Math.min(100, Math.max(-100, newPartyRelations.PSOE + 5));
        newPartyRelations.CT = Math.min(100, Math.max(-100, newPartyRelations.CT - 5));
        newPartyRelations.RE = Math.min(100, Math.max(-100, newPartyRelations.RE - 5));
        if (s.falange_jons) {
          newPartyRelations.FE = Math.min(100, Math.max(-100, newPartyRelations.FE - 5));
        }

        newStats.armyLoyalty = Math.max(0, Math.min(100, newStats.armyLoyalty - 5));
        
        newFactions.Faistas.dissent = Math.max(0, Math.min(100, newFactions.Faistas.dissent - 3));
        newFactions.Cenetistas.dissent = Math.max(0, Math.min(100, newFactions.Cenetistas.dissent - 3));
        
        newStats.revolutionaryFervor = Math.min(100, newStats.revolutionaryFervor + 3);
        
        return {
          partyRelations: newPartyRelations,
          factions: newFactions,
          stats: newStats,
          coup_progress: Math.max(0, Math.min(100, s.stats.tension - 2)),
          choose_enemies_timer: 18
        };
      },
    });

    // 选项2：君主派与天主教右翼——复辟派是我们的敌人
    options.push({
      text: 'Monarchists & Catholic Right',
      textZh: '君主派与天主教右翼——复辟派是我们的敌人',
      subtitle: 'Strike at the centuries-old oppressors — the Church and the Crown.',
      subtitleZh: '打击数个世纪以来的压迫者——教会与王冠。',
      effect: (s: GameState) => {
        const newPartyRelations = { ...s.partyRelations };
        const newStats = { ...s.stats };

        newPartyRelations.PCE = Math.min(100, Math.max(-100, newPartyRelations.PCE + 5));
        if (s.poum_founded) {
          newPartyRelations.POUM = Math.min(100, Math.max(-100, (newPartyRelations.POUM || 0) + 5));
        }
        newPartyRelations.PSOE = Math.min(100, Math.max(-100, newPartyRelations.PSOE + 3));
        newPartyRelations.IR = Math.min(100, Math.max(-100, newPartyRelations.IR + 3));
        newPartyRelations.CT = Math.min(100, Math.max(-100, newPartyRelations.CT - 8));
        newPartyRelations.RE = Math.min(100, Math.max(-100, newPartyRelations.RE - 8));

        newStats.armyLoyalty = Math.max(0, Math.min(100, newStats.armyLoyalty - 2));

        return {
          partyRelations: newPartyRelations,
          stats: newStats,
          choose_enemies_timer: 18
        };
      },
    });

    // 选项3：全力打击法西斯分子
    options.push({
      text: 'Strike the Fascists with full force',
      textZh: '全力打击法西斯分子',
      subtitle: 'Fascism is the immediate threat to the working class.',
      subtitleZh: '法西斯主义是工人阶级面临的直接威胁。',
      effect: (s: GameState) => {
        const newPartyRelations = { ...s.partyRelations };
        const newStats = { ...s.stats };

        newPartyRelations.PCE = Math.min(100, Math.max(-100, newPartyRelations.PCE + 8));
        newPartyRelations.PSOE = Math.min(100, Math.max(-100, newPartyRelations.PSOE + 8));
        if (s.falange_jons) {
          newPartyRelations.FE = Math.min(100, Math.max(-100, newPartyRelations.FE - 5));
        }

        newStats.armyLoyalty = Math.max(0, Math.min(100, newStats.armyLoyalty - 2));

        return {
          partyRelations: newPartyRelations,
          stats: newStats,
          choose_enemies_timer: 18
        };
      },
    });

    // 选项4：议会中的资产阶级共和派
    options.push({
      text: 'The Bourgeois Republicans in Parliament',
      textZh: '议会中的资产阶级共和派',
      subtitle: 'Expose their fake republicanism and break their electoral influence.',
      subtitleZh: '揭露他们虚伪的共和主义，打破他们的选举影响力。',
      effect: (s: GameState) => {
        const newPartyRelations = { ...s.partyRelations };
        const newFactions = JSON.parse(JSON.stringify(s.factions));

        newPartyRelations.IR = Math.min(100, Math.max(-100, newPartyRelations.IR - 6));
        newPartyRelations.UR = Math.min(100, Math.max(-100, newPartyRelations.UR - 10));
        newPartyRelations.PSOE = Math.min(100, Math.max(-100, newPartyRelations.PSOE - 5));

        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 5);

        return {
          partyRelations: newPartyRelations,
          factions: newFactions,
          choose_enemies_timer: 18
        };
      },
    });

    // 选项5：斯大林主义者与西班牙共产党
    options.push({
      text: 'Stalinists & PCE',
      textZh: '斯大林主义者与西班牙共产党',
      subtitle: 'Denounce their authoritarian methods and compete for working-class leadership.',
      subtitleZh: '谴责他们的威权手段，争夺工人阶级的领导权。',
      effect: (s: GameState) => {
        const newPartyRelations = { ...s.partyRelations };

        newPartyRelations.PCE = Math.min(100, Math.max(-100, newPartyRelations.PCE - 15));
        if (s.poum_founded) {
          newPartyRelations.POUM = Math.min(100, Math.max(-100, (newPartyRelations.POUM || 0) + 5));
        }
        newPartyRelations.PSOE = Math.min(100, Math.max(-100, newPartyRelations.PSOE + 3));
        newPartyRelations.IR = Math.min(100, Math.max(-100, newPartyRelations.IR + 3));

        return {
          partyRelations: newPartyRelations,
          choose_enemies_timer: 18
        };
      },
    });

    // 选项6：所有布尔什维克
    options.push({
      text: 'All Bolsheviks',
      textZh: '所有布尔什维克',
      subtitle: 'Marxist authoritarianism is a betrayal of the revolution.',
      subtitleZh: '马克思主义的威权主义是对革命的背叛。',
      effect: (s: GameState) => {
        const newPartyRelations = { ...s.partyRelations };

        newPartyRelations.PCE = Math.min(100, Math.max(-100, newPartyRelations.PCE - 15));
        if (s.poum_founded) {
          newPartyRelations.POUM = Math.min(100, Math.max(-100, (newPartyRelations.POUM || 0) - 15));
        }
        newPartyRelations.PSOE = Math.min(100, Math.max(-100, newPartyRelations.PSOE - 3));
        newPartyRelations.IR = Math.min(100, Math.max(-100, newPartyRelations.IR + 3));

        return {
          partyRelations: newPartyRelations,
          choose_enemies_timer: 18
        };
      },
    });

    // 选项7：所有暴力机器的合作者都是我们的敌人
    options.push({
      text: 'All collaborators of the state apparatus are our enemies',
      textZh: '所有暴力机器的合作者都是我们的敌人',
      subtitle: 'No compromise with the state, regardless of its color.',
      subtitleZh: '无论国家机器是什么颜色，绝不妥协。',
      effect: (s: GameState) => {
        const newPartyRelations = { ...s.partyRelations };
        const newFactions = JSON.parse(JSON.stringify(s.factions));

        newPartyRelations.PCE = Math.min(100, Math.max(-100, newPartyRelations.PCE - 5));
        if (s.poum_founded) {
          newPartyRelations.POUM = Math.min(100, Math.max(-100, (newPartyRelations.POUM || 0) - 3));
        }
        newPartyRelations.PSOE = Math.min(100, Math.max(-100, newPartyRelations.PSOE - 6));
        newPartyRelations.IR = Math.min(100, Math.max(-100, newPartyRelations.IR - 8));
        newPartyRelations.UR = Math.min(100, Math.max(-100, newPartyRelations.UR - 10));
        newPartyRelations.CT = Math.min(100, Math.max(-100, newPartyRelations.CT - 6));
        newPartyRelations.RE = Math.min(100, Math.max(-100, newPartyRelations.RE - 6));
        if (s.falange_jons) {
          newPartyRelations.FE = Math.min(100, Math.max(-100, newPartyRelations.FE - 3));
        }

        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 5);
        newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 5);

        return {
          partyRelations: newPartyRelations,
          factions: newFactions,
          choose_enemies_timer: 18
        };
      },
    });

    // 选项8：我们的内部敌人——亲政府的改良派
    options.push({
      text: 'Our internal enemies — the pro-government reformists',
      textZh: '我们的内部敌人——亲政府的改良派',
      subtitle: 'Purge the union of those who would compromise with the state.',
      subtitleZh: '清除工会中那些企图与国家妥协的人。',
      effect: (s: GameState) => {
        const newFactions = JSON.parse(JSON.stringify(s.factions));

        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 5);
        newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 3);

        return {
          factions: newFactions,
          choose_enemies_timer: 18
        };
      },
    });

    // 选项9：我们的内部敌人——反共和的革命派
    options.push({
      text: 'Our internal enemies — the anti-republican revolutionaries',
      textZh: '我们的内部敌人——反共和的革命派',
      subtitle: 'We must silence the extremists who threaten our gains.',
      subtitleZh: '我们必须让那些威胁我们成果的极端分子闭嘴。',
      effect: (s: GameState) => {
        const newFactions = JSON.parse(JSON.stringify(s.factions));

        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 5);
        newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 3);

        return {
          factions: newFactions,
          choose_enemies_timer: 18
        };
      },
    });

    // 选项10：让我们晚点再讨论这个问题
    options.push({
      text: 'Let us discuss this later',
      textZh: '让我们晚点再讨论这个问题',
      subtitle: 'We are not ready to make this decision yet.',
      subtitleZh: '我们还没有准备好做出这个决定。',
      effect: (s: GameState) => {
        return {
          // 不设置冷却时间，或者设置较短的冷却时间？
          // 按照要求，可能只是跳过
        };
      },
    });

    return {
      currentEvent: {
        id: 'choosing_our_enemies_event',
        date: { year: state.year, month: state.month },
        title: 'Choosing Our Enemies',
        titleZh: '选择我们的敌人',
        description:
          'In every revolution, clarity about the adversary is half the battle. The CNT must decide which political force to target as our main enemy in propaganda campaigns, street actions, and alliance negotiations. This choice will resonate through the entire labor movement, affecting internal unity, cross-party relations, and the pace of social upheaval.',
        descriptionZh:
          '每一次革命中，认清敌人便是胜利的一半。CNT 必须在宣传运动、街头行动和联盟谈判中，确定我们将主要打击哪一股政治势力。这一选择将响彻整个劳工运动，影响内部团结、跨党派关系以及社会动荡的进程。',
        options: options,
      },
    };
  },
};
