import { Card, GameState, GameEvent } from '../types';

export const cntFaiDisunityManagement: Card = {
  id: 'cnt_fai_disunity_management',
  title: 'Resolve Factional Strife',
  titleZh: '同志间的分歧',
  type: 'Action',
  description: 'Internal divisions among comrades have reached an irreconcilable point. We must convene a meeting to ease the contradictions between our factions.',
  descriptionZh: '同志间的内部分歧已经到达不可调和的地步，以至于我们必须召开一次会议缓和同志之间的矛盾。',
  cost: 1,

  condition: (state) => {
    return (
      state.factions.Treintistas.dissent > 50 ||
      state.factions.Cenetistas.dissent > 30 ||
      state.factions.Faistas.dissent > 30 ||
      state.factions.Puristas.dissent > 30
    );
  },

  effect: (state: GameState) => {
    const options: GameEvent['options'] = [];

    // 1. 强制纪律
    options.push({
      text: 'Enforce revolutionary discipline',
      textZh: '强化纪律',
      subtitle: 'Suppress factional infighting at the cost of alienating our base.',
      subtitleZh: '镇压派系内斗，但这会疏远我们的基层群众。',
      effect: (s: GameState) => {
        const newFactions = JSON.parse(JSON.stringify(s.factions));
        const newClasses = JSON.parse(JSON.stringify(s.classes));
        
        newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 5);
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 5);
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 5);
        newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 5);
        
        newClasses.Obreros.support.CNT_FAI = Math.max(0, newClasses.Obreros.support.CNT_FAI - 4);
        newClasses.Braceros.support.CNT_FAI = Math.max(0, newClasses.Braceros.support.CNT_FAI - 6);
        
        return {
          factions: newFactions,
          classes: newClasses
        };
      },
    });

    // 2. 向 Treintistas 让步
    options.push({
      text: 'Make concessions to the Treintistas',
      textZh: '向三十人集团让步',
      subtitle: 'Adopt a more pragmatic line.',
      subtitleZh: '或许我们应当采取更务实的路线。',
      condition: (s) => s.factions.Treintistas.dissent > 30,
      effect: (s: GameState) => {
        const newFactions = JSON.parse(JSON.stringify(s.factions));
        newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 7);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 5);
        return { factions: newFactions };
      },
    });

    // 3. 向 Cenetistas 让步
    options.push({
      text: 'Make concessions to the Cenetistas',
      textZh: '向主流工团主义让步',
      subtitle: 'Let us return to orthodox syndicalism.',
      subtitleZh: '让我们回归正统工团主义。',
      condition: (s) => s.factions.Cenetistas.dissent > 30,
      effect: (s: GameState) => {
        const newFactions = JSON.parse(JSON.stringify(s.factions));
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 7);
        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 2);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 2);
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 2);
        return { factions: newFactions };
      },
    });

    // 4. 向 Faístas 让步
    options.push({
      text: 'Make concessions to the Faístas',
      textZh: '向无政府主义者让步',
      subtitle: 'We must maintain our anarchist ideals.',
      subtitleZh: '我们应当保持无政府主义理想。',
      condition: (s) => s.factions.Faistas.dissent > 30,
      effect: (s: GameState) => {
        const newFactions = JSON.parse(JSON.stringify(s.factions));
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 7);
        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 5);
        return { factions: newFactions };
      },
    });

    // 5. 向 Puristas 让步
    options.push({
      text: 'Make concessions to the Puristas',
      textZh: '向纯粹派让步',
      subtitle: 'Rejecting all state collaboration is our bottom line.',
      subtitleZh: '拒绝一切国家合作是我们的底线。',
      condition: (s) => s.factions.Puristas.dissent > 30,
      effect: (s: GameState) => {
        const newFactions = JSON.parse(JSON.stringify(s.factions));
        newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 7);
        newFactions.Cenetistas.dissent = Math.min(100, newFactions.Cenetistas.dissent + 5);
        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 5);
        return { factions: newFactions };
      },
    });

    // 6. 无所作为
    options.push({
      text: 'Let them argue...',
      textZh: '让他们吵吧......',
      subtitle: 'Free debate is the spirit of anarchism.',
      subtitleZh: '自由争辩才是无政府主义的精神。',
      effect: (s: GameState) => {
        const newFactions = JSON.parse(JSON.stringify(s.factions));
        newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 1);
        newFactions.Cenetistas.dissent = Math.min(100, newFactions.Cenetistas.dissent + 1);
        newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 1);
        newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 1);
        return { factions: newFactions };
      },
    });

    return {
      currentEvent: {
        id: 'cnt_fai_disunity_management_event',
        date: { year: state.year, month: state.month },
        title: 'Resolve Factional Strife',
        titleZh: '同志间的分歧',
        description: 'Internal divisions among comrades have reached an irreconcilable point. We must convene a meeting to ease the contradictions between our factions.',
        descriptionZh: '同志间的内部分歧已经到达不可调和的地步，以至于我们必须召开一次会议缓和同志之间的矛盾。',
        options: options
      }
    };
  },
};
