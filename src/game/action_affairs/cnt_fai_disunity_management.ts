import { Card, GameState, GameEvent } from '../types';
import { adjustAllActiveFactionDissent, adjustClassSupport, adjustFactionDissents, isFactionActiveForDissent } from '../utils';

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
      state.factions.Puristas.dissent > 30 ||
      (isFactionActiveForDissent(state.factions, 'Jabalistas') && state.factions.Jabalistas.dissent > 30)
    );
  },

  effect: (state: GameState) => {
    const options: GameEvent['options'] = [];

    // 1. Enforce discipline
    options.push({
      text: 'Enforce revolutionary discipline',
      textZh: '强化纪律',
      subtitle: 'Suppress factional infighting at the cost of alienating our base.',
      subtitleZh: '镇压派系内斗，但这会疏远我们的基层群众。',
      effect: (s: GameState) => {
        let newClasses = s.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', -4);
        newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', -6);
        
        return {
          factions: adjustAllActiveFactionDissent(s.factions, -5),
          classes: newClasses
        };
      },
    });

    // 2. Make concessions to the Treintistas
    options.push({
      text: 'Make concessions to the Treintistas',
      textZh: '向三十人集团让步',
      subtitle: 'Adopt a more pragmatic line.',
      subtitleZh: '或许我们应当采取更务实的路线。',
      condition: (s) => s.factions.Treintistas.dissent > 30,
      unavailableSubtitle: () => 'Requires Treintistas dissent above 30.',
      unavailableSubtitleZh: () => '需要三十人集团分歧度高于 30。',
      effect: (s: GameState) => ({
        factions: adjustFactionDissents(s.factions, { Treintistas: -7, Faistas: 5 })
      }),
    });

    // 3. Make concessions to the Cenetistas
    options.push({
      text: 'Make concessions to the Cenetistas',
      textZh: '向主流工团主义让步',
      subtitle: 'Let us return to orthodox syndicalism.',
      subtitleZh: '让我们回归正统工团主义。',
      condition: (s) => s.factions.Cenetistas.dissent > 30,
      unavailableSubtitle: () => 'Requires Cenetistas dissent above 30.',
      unavailableSubtitleZh: () => '需要主流工团派分歧度高于 30。',
      effect: (s: GameState) => ({
        factions: adjustFactionDissents(s.factions, {
          Cenetistas: -7,
          Treintistas: 2,
          Faistas: 2,
          Puristas: 2,
          ...(isFactionActiveForDissent(s.factions, 'Jabalistas') ? { Jabalistas: 2 } : {})
        })
      }),
    });

    // 4. Make concessions to the Faistas
    options.push({
      text: 'Make concessions to the Faístas',
      textZh: '向无政府主义者让步',
      subtitle: 'We must maintain our anarchist ideals.',
      subtitleZh: '我们应当保持无政府主义理想。',
      condition: (s) => s.factions.Faistas.dissent > 30,
      unavailableSubtitle: () => 'Requires Faístas dissent above 30.',
      unavailableSubtitleZh: () => '需要无政府主义者分歧度高于 30。',
      effect: (s: GameState) => ({
        factions: adjustFactionDissents(s.factions, { Faistas: -7, Treintistas: 5 })
      }),
    });

    // 5. Make concessions to the Puristas
    options.push({
      text: 'Make concessions to the Puristas',
      textZh: '向纯粹派让步',
      subtitle: 'Rejecting all state collaboration is our bottom line.',
      subtitleZh: '拒绝一切国家合作是我们的底线。',
      condition: (s) => s.factions.Puristas.dissent > 30,
      unavailableSubtitle: () => 'Requires Puristas dissent above 30.',
      unavailableSubtitleZh: () => '需要纯粹派分歧度高于 30。',
      effect: (s: GameState) => ({
        factions: adjustFactionDissents(s.factions, { Puristas: -7, Cenetistas: 5, Treintistas: 5 })
      }),
    });

    // 6. Do nothing
    options.push({
      text: 'Let them argue...',
      textZh: '让他们吵吧......',
      subtitle: 'Free debate is the spirit of anarchism.',
      subtitleZh: '自由争辩才是无政府主义的精神。',
      effect: (s: GameState) => ({
        factions: adjustAllActiveFactionDissent(s.factions, 1)
      }),
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
