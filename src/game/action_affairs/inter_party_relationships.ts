import { Card, GameState, GameEvent } from '../types';

export const cntInterPartyRelationships: Card = {
  id: 'inter_party_relationships',
  title: 'Inter-Party Relationships',
  titleZh: '与政党之间的关系',
  type: 'Action',
  description:
    'The CNT, being deemed as an anarchist union, is viewed with varied degrees of suspicion and distrust by the political parties of Spain. Still, it enjoys significant influence among the working class, especially in the urban industrial areas and is not without common ground with the parties in Spain. While the right-wing parties hate us as godless arrogant peasants, the left-wing and Republican forces might be worth courting, if we need allies in the Cortes and Generalitat.',
  descriptionZh:
    'CNT 作为一个无政府主义工会，被西班牙各政党以不同程度的怀疑与不信任看待。不过，它在工人阶级中（尤其是城市工业区）仍拥有巨大影响力，并且与西班牙各政党并非没有共同点。尽管右翼政党视我们为不信神的傲慢农民，但如果我们想在议会和加泰罗尼亚政府中寻找盟友，左翼和共和派力量或许值得争取。',
  cost: 1,

  condition: (state) => state.inter_party_relationships_timer <= 0,

  effect: (state: GameState) => {
    const options: GameEvent['options'] = [];

    const overallDissent = (state.factions.Treintistas.dissent + state.factions.Cenetistas.dissent + state.factions.Faistas.dissent + state.factions.Puristas.dissent) / 400;
    const multiplier = 1 - overallDissent;

    // 选项1：加强与温和的共和激进党及自由共和右翼的联系
    if (state.resources >= 1) {
      options.push({
        text: 'Strengthen our bonds with the moderate Republican Radical Party and the Liberal-Republican Right.',
        textZh: '加强与温和的共和激进党及自由共和右翼的联系',
        subtitle: 'The moderate centrists of the Partido Republicano Radical and Derecha Liberal Republicano',
        subtitleZh: '温和中间派的共和激进党与自由共和右翼',
        effect: (s: GameState) => {
          const newPartyRelations = { ...s.partyRelations };
          const newFactions = JSON.parse(JSON.stringify(s.factions));

          newPartyRelations.UR = Math.min(100, Math.max(-100, newPartyRelations.UR + 5 * multiplier));
          newPartyRelations.DLR = Math.min(100, Math.max(-100, newPartyRelations.DLR + 5 * multiplier));

          newFactions.Faistas.dissent = Math.min(100, Math.max(0, newFactions.Faistas.dissent + 5));
          newFactions.Puristas.dissent = Math.min(100, Math.max(0, newFactions.Puristas.dissent + 8));

          const newStats = { ...s.stats };
          newStats.revolutionaryFervor = Math.max(0, newStats.revolutionaryFervor - 8);

          return {
            resources: s.resources - 1,
            partyRelations: newPartyRelations,
            factions: newFactions,
            stats: newStats,
            inter_party_relationships_timer: 6
          };
        },
      });
    }

    // 选项2：加强与共和左翼联系
    if (state.resources >= 1) {
      options.push({
        text: 'Strengthen ties with the Republican Left',
        textZh: '加强与共和左翼联系',
        subtitle: 'Opposition to the far-right is our common ground with the Republican Left',
        subtitleZh: '对极右翼的反对是我们与共和左翼的共同诉求',
        effect: (s: GameState) => {
          const newPartyRelations = { ...s.partyRelations };
          const newFactions = JSON.parse(JSON.stringify(s.factions));

          newPartyRelations.IR = Math.min(100, Math.max(-100, newPartyRelations.IR + 7 * multiplier));

          newFactions.Faistas.dissent = Math.min(100, Math.max(0, newFactions.Faistas.dissent + 3));
          newFactions.Puristas.dissent = Math.min(100, Math.max(0, newFactions.Puristas.dissent + 5));

          return {
            resources: s.resources - 1,
            partyRelations: newPartyRelations,
            factions: newFactions,
            inter_party_relationships_timer: 6
          };
        },
      });
    }

    // 选项3：尝试动用我们再UGT中的人脉
    if (state.resources >= 1) {
      options.push({
        text: 'Try to use our connections in the UGT',
        textZh: '尝试动用我们在UGT中的人脉',
        subtitle: 'The UGT is a workers\' union like us, perhaps we can use this relationship to improve our ties with the PSOE',
        subtitleZh: 'UGT与我们同属工人工团，或许我们可以凭借这一层关系改善我们与PSOE的关系',
        effect: (s: GameState) => {
          const newPartyRelations = { ...s.partyRelations };

          newPartyRelations.PSOE = Math.min(100, Math.max(-100, newPartyRelations.PSOE + 7 * multiplier));

          return {
            resources: s.resources - 1,
            partyRelations: newPartyRelations,
            inter_party_relationships_timer: 6
          };
        },
      });
    }

    // 选项4：或许我们应该与革命马克思主义者合作
    if (state.resources >= 1) {
      options.push({
        text: 'Perhaps we should cooperate with the revolutionary Marxists',
        textZh: '或许我们应该与革命马克思主义者合作',
        subtitle: 'A united front of the proletariat',
        subtitleZh: '无产阶级的统一战线',
        effect: (s: GameState) => {
          const newPartyRelations = { ...s.partyRelations };
          const newFactions = JSON.parse(JSON.stringify(s.factions));

          newPartyRelations.PCE = Math.min(100, Math.max(-100, newPartyRelations.PCE + 6 * multiplier));
          if (s.poum_founded) {
            newPartyRelations.POUM = Math.min(100, Math.max(-100, newPartyRelations.POUM + 8 * multiplier));
          }

          newFactions.Treintistas.dissent = Math.min(100, Math.max(0, newFactions.Treintistas.dissent + 5));

          return {
            resources: s.resources - 1,
            partyRelations: newPartyRelations,
            factions: newFactions,
            inter_party_relationships_timer: 6
          };
        },
      });
    }

    // 选项5：改善与工团党的联系 (如果 PS 成立)
    if (state.ps_founded && state.resources >= 1) {
      options.push({
        text: 'Improve ties with the Syndicalist Party',
        textZh: '改善与工团党（PS）的联系',
        subtitle: 'The Syndicalist Party shares our roots, we should work closer together',
        subtitleZh: '工团党与我们同宗同源，我们应该更紧密地合作',
        effect: (s: GameState) => {
          const newPartyRelations = { ...s.partyRelations };

          newPartyRelations.PS = Math.min(100, Math.max(-100, newPartyRelations.PS + 7 * multiplier));

          return {
            resources: s.resources - 1,
            partyRelations: newPartyRelations,
            inter_party_relationships_timer: 6
          };
        },
      });
    }

    // 选项6：让我们晚点再讨论这个问题
    options.push({
      text: 'Anarchists do not need hypocritical deals to make friends',
      textZh: '无政府主义者不需要虚伪的交易换取朋友',
      subtitle: 'Let us discuss this later',
      subtitleZh: '让我们晚点再讨论这个问题',
      effect: (s: GameState) => {
        return {};
      },
    });

    return {
      currentEvent: {
        id: 'inter_party_relationships_event',
        date: { year: state.year, month: state.month },
        title: 'Inter-Party Relationships',
        titleZh: '与政党之间的关系',
        description:
          'The CNT, being deemed as an anarchist union, is viewed with varied degrees of suspicion and distrust by the political parties of Spain. Still, it enjoys significant influence among the working class, especially in the urban industrial areas and is not without common ground with the parties in Spain. While the right-wing parties hate us as godless arrogant peasants, the left-wing and Republican forces might be worth courting, if we need allies in the Cortes and Generalitat.',
        descriptionZh:
          'CNT 作为一个无政府主义工会，被西班牙各政党以不同程度的怀疑与不信任看待。不过，它在工人阶级中（尤其是城市工业区）仍拥有巨大影响力，并且与西班牙各政党并非没有共同点。尽管右翼政党视我们为不信神的傲慢农民，但如果我们想在议会和加泰罗尼亚政府中寻找盟友，左翼和共和派力量或许值得争取。',
        options: options,
      },
    };
  },
};
