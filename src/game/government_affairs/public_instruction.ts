import { Card, GameState } from '../types';
import { adjustFactionDissents, adjustFactionInfluence, adjustClassSupport } from '../utils';
import { changeLaws } from '../rules/lawChange';

/**
 * 公共教育部（Ministerio de Instrucción Pública y Bellas Artes）。
 *
 * 这个部在 1931 年 4 月的临时政府里就已经存在，并在此前的版本中完全缺席：玩家可以
 * 通过宪法事件把 `education_institutions` 推上去，却没有任何机构对这件事负责。本卡把
 * 该法律等级交给部长权限来驱动，与「劳工权利」卡对 `max_hours_law` 的做法一致。
 *
 * 卡内四条路线对应四种真实的共和国教育政治：
 *   1. 教育使团（Misiones Pedagógicas，1931 年 5 月设立）——派往乡村的巡回教师、
 *      流动图书馆与电影放映；
 *   2. 农村图书馆与识字（María Moliner 的图书馆工作是可用的人物入口）；
 *   3. 理性主义课程与工会学苑——CNT 自己的教育路线，与国立学校争夺同一批工人；
 *   4. 「学校休战」——为保住世俗学校而在宗教课程上让一步，历史上未能达成，但它
 *      是当时确实摆在桌面上的选项。
 */
export const publicInstruction: Card = {
  id: 'public_instruction',
  title: 'Public Instruction',
  titleZh: '公共教育',
  type: 'Government',
  description: 'The Republic has held the Public Instruction ministry since April 1931, and every teacher in Spain knows what it has not done. With the portfolio in our hands we can decide which school the Republic actually pays for — the one in the village, the one in the factory, or the one behind the church door.',
  descriptionZh: '共和国自 1931 年 4 月起就握着公共教育部，而西班牙的每一位教师都清楚它没做成什么。这个部掌握在我们手里时，我们可以决定共和国真正出钱办的是哪一种学校——村里的、工厂里的，还是教堂门后的那一种。',
  cost: 1,
  condition: (state: GameState) => (
    state.cntStance === 'govern'
    && state.ministers.education === 'CNT'
    && (state.education_policy_timer || 0) <= 0
  ),
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: {
      id: 'public_instruction_event',
      title: 'Public Instruction',
      titleZh: '公共教育',
      description: 'The ministry has one budget and three queues at its door: the villages that have never had a school, the unions that want their own, and the bishops who want theirs back.',
      descriptionZh: '教育部只有一份预算，门口却排着三支队伍：从来没有过学校的村庄、想要自己办学的工会，以及想把学校要回去的主教们。',
      date: { year: state.year, month: state.month },
      options: [
        {
          text: 'Send the Pedagogical Missions into the countryside.',
          textZh: '把教育使团派往乡村',
          subtitle: 'Traveling teachers, a circulating library and a cinema reel in every village that will receive them. Peasants and schoolteachers come over to us, the Church notes every station, and the officer corps notes the budget.',
          subtitleZh: '巡回教师、流动书箱和一台电影放映机，送往每一个愿意接待的村庄。农民与教师向我们靠拢，教会会记下每一站，军官团则会记下这笔预算。',
          effect: (s: GameState): Partial<GameState> => {
            let factions = adjustFactionDissents(s.factions, { Puristas: 4, Treintistas: -3 });
            factions = adjustFactionInfluence(factions, 'Treintistas', 3);
            let classes = adjustClassSupport(s.classes, 'Braceros', 'CNT_FAI', 3);
            classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', 2);
            classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 2);
            classes = adjustClassSupport(classes, 'Clero', 'CNT_FAI', -2);

            return {
              education_policy_timer: 8,
              factions,
              classes,
              coupProgress: (s.coupProgress || 0) + 1,
              stats: {
                ...s.stats,
                republicanAuthority: Math.min(100, s.stats.republicanAuthority + 3),
              },
            };
          },
        },
        {
          text: 'Build the rural library service and teach adults to read.',
          textZh: '建立农村图书馆并扫除成年文盲',
          subtitle: 'Costs 1 resource. Libraries, night classes and a literacy drive in the villages the missions reached. Slow, unglamorous, and the only education that reaches adults who will never sit in a classroom again. It does not push the school system past where the Republic has already taken it.',
          subtitleZh: '花费 1 资源。在使团到过的村庄设图书馆、开夜校、办扫盲班。缓慢、不好看，却是唯一能触及再也进不了教室的成年人的教育。它不会把学制推到共和国尚未走到的位置。',
          condition: (s: GameState) => s.resources >= 1,
          unavailableSubtitle: () => 'Requires 1 resource.',
          unavailableSubtitleZh: () => '需要 1 资源。',
          effect: (s: GameState): Partial<GameState> => {
            let classes = adjustClassSupport(s.classes, 'Braceros', 'CNT_FAI', 4);
            classes = adjustClassSupport(classes, 'Obreros', 'CNT_FAI', 2);
            const factions = adjustFactionDissents(s.factions, { Faistas: -4, Puristas: -4, Cenetistas: -3 });

            return {
              resources: s.resources - 1,
              education_policy_timer: 8,
              factions,
              classes,
              domesticPolicy: {
                ...s.domesticPolicy,
                ...changeLaws(s, { education_institutions: { atLeast: 1 } }),
              },
            };
          },
        },
        {
          text: 'Fund the rationalist schools and the union athenaeums instead.',
          textZh: '转而资助理性主义学校与工会学苑',
          subtitle: 'The ministry pays the confederation’s own schools rather than the state’s: rationalist teaching, no catechism, and the curriculum written by the union that runs the classroom. Raises the education system to "Modern Education".',
          subtitleZh: '教育部出钱办联合会自己的学校，而不是国家的学校：理性主义教学、不设教义问答，课程由办学的工会自己写。将教育制度推进到 L3「现代教育」。',
          condition: (s: GameState) => (
            s.ateneos_established >= 1
            && s.domesticPolicy.education_institutions >= 1
            && s.domesticPolicy.education_institutions < 3
          ),
          unavailableSubtitle: (s: GameState) => (
            s.ateneos_established < 1
              ? 'Requires at least one athenaeum.'
              : 'Requires the education system at levels 1–2.'
          ),
          unavailableSubtitleZh: (s: GameState) => (
            s.ateneos_established < 1
              ? '需要至少一座学苑。'
              : '需要教育制度处于 1—2 级。'
          ),
          effect: (s: GameState): Partial<GameState> => {
            let factions = adjustFactionDissents(s.factions, { Puristas: -6, Faistas: -4, Treintistas: 6 });
            factions = adjustFactionInfluence(factions, 'Puristas', 4);
            factions = adjustFactionInfluence(factions, 'Faistas', 3);
            const classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', 5);

            return {
              education_policy_timer: 8,
              factions,
              classes,
              domesticPolicy: {
                ...s.domesticPolicy,
                ...changeLaws(s, { education_institutions: { atLeast: 3 } }),
              },
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 6),
                republicanAuthority: Math.max(0, s.stats.republicanAuthority - 2),
              },
            };
          },
        },
        {
          text: 'Offer the Church a school truce.',
          textZh: '向教会提出「学校休战」',
          subtitle: 'Costs 2M. Religious instruction stays, in exchange for state inspection, a common curriculum and the reopening of the schools the orders had closed. The quiet option, and the one our own base will not forgive.',
          subtitleZh: '花费 2M。宗教课程保留，换取国家视察权、统一课程，以及修会重新开放此前停办的学校。安静的那条路，也是我们自己的群众不会原谅的那条。',
          condition: (s: GameState) => s.budget >= 2,
          unavailableSubtitle: () => 'Requires 2M in the treasury.',
          unavailableSubtitleZh: () => '需要国库现金 2M。',
          effect: (s: GameState): Partial<GameState> => {
            const factions = adjustFactionDissents(s.factions, { Faistas: 12, Puristas: 15, Treintistas: -6 });
            let classes = adjustClassSupport(s.classes, 'Clero', 'CNT_FAI', 2);
            classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 1);
            classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', -1);

            return {
              budget: Math.max(0, s.budget - 2),
              education_policy_timer: 12,
              factions,
              classes,
              coupProgress: Math.max(0, (s.coupProgress || 0) - 2),
              stats: {
                ...s.stats,
                republicanAuthority: Math.min(100, s.stats.republicanAuthority + 6),
                revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 5),
              },
            };
          },
        },
      ],
    },
  }),
};
