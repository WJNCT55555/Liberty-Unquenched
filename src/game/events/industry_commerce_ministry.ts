import type { GameEvent } from '../types';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence, isAtOrAfter } from '../utils';

/**
 * 1933 年 12 月：工业与商业从劳动部体系中分出，成立 `Ministerio de Industria y
 * Comercio`；同月公共工程部由 Fomento 改组为 Obras Públicas。
 *
 * 史实上勒鲁的激进—CEDA 政府在 1933 年 12 月做了这次机构扩张。此前版本里
 * `ministers.industry` 这个字段从 1931 年 4 月起就存在，等于让一个三年后才会设立的部
 * 提前办公。
 *
 * 这个事件本身不改任何部委归属（剧本已经把 `industry`、`commerce`、`publicWorks`
 * 写好了），它做两件事：
 *   1. 把这次机构扩张摆到台面上，让玩家以 CNT 的视角作出反应；
 *   2. 用国家机器扩张的代价（官僚化、政变进度）表示"多一个部"不是免费的。
 *
 * 战时人民阵线成立时这两个口会再次分开：`industry` 归工业、`commerce` 归商业
 * （史实为佩罗与洛佩斯·桑切斯），见 `rules/wartimeCoalition.ts`。
 *
 * 1936 剧本从内战开局，这个节点已经过去，因此与 1934 年的两次共和派改组一样排除
 * 该剧本（见 `republican_party_mergers.ts` 的同类写法）。
 */
const politicsMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
};

export const industryCommerceMinistry: GameEvent = {
  id: 'industry_commerce_ministry',
  meta: politicsMeta,
  date: { year: 1933, month: 12 },
  condition: (state) => state.scenario !== '1936' && isAtOrAfter(state, 1933, 12),
  title: 'A Ministry for Industry and Commerce',
  titleZh: '工业与商业部成立',
  description: 'The Lerroux government has split industry and commerce out of the Labor ministry and given them a department of their own; the old Fomento ministry is reorganized the same month into Public Works. The decree is short, the staffing is not: a new ministry means new directorates, new inspectors and a new set of men who will decide which factory gets its coal and which road gets repaired. It is meant to reassure the employers and the Republic’s creditors that production is in safe hands. Whether it is a lever or a cage depends on who ends up holding it.',
  descriptionZh: '勒鲁政府把工业与商业从劳动部里拆出来，单设一个部；同月旧制的发展部（Fomento）改组为公共工程部。政令很短，编制却不短：一个新部意味着新的司局、新的视察员，以及一批决定哪家工厂能拿到煤、哪条公路先修的人。它的用意是让雇主和共和国的债权人相信生产掌握在可靠的人手里。它是杠杆还是笼子，取决于最后谁握着它。',
  options: [
    {
      text: 'Another office will not feed anyone. The committees run the plants already.',
      textZh: '多一个衙门不会让任何人吃饱。工厂本来就由委员会在管。',
      subtitle: 'Refuse the new apparatus outright. Revolutionary fervor rises and the Faistas gain, but the state now has a dedicated machine for industrial questions and we are not in it.',
      subtitleZh: '直接否认这套新机器。革命热情上升、无政府主义者获益，但国家从此有了一个专管工业问题的机器，而我们不在里面。',
      effect: (state) => {
        let factions = adjustFactionDissents(state.factions, { Faistas: -8, Puristas: -5, Treintistas: 5, Cenetistas: 3 });
        factions = adjustFactionInfluence(factions, 'Faistas', 5);
        let classes = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 3);
        classes = adjustClassSupport(classes, 'Burguesia', 'CNT_FAI', -1);

        return {
          factions,
          classes,
          coupProgress: (state.coupProgress || 0) + 1,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 6),
            bureaucratization: Math.max(0, state.stats.bureaucratization - 3),
          },
        };
      },
    },
    {
      text: 'Let them build it. Then put our own people behind its desks.',
      textZh: '让他们建。然后把我们的人放进去坐那些桌子。',
      subtitle: 'Contest the new ministry from inside: cadre, files and inspectors. Bureaucratization and republican authority both rise, the Treintistas approve, and the Faistas call it a desk revolution.',
      subtitleZh: '从内部争夺这个新部：干部、档案与视察员。官僚化与共和国权威同时上升，三十人集团认可，无政府主义者则称之为「办公桌革命」。',
      effect: (state) => {
        let factions = adjustFactionDissents(state.factions, { Treintistas: -6, Cenetistas: -4, Faistas: 8, Puristas: 6 });
        factions = adjustFactionInfluence(factions, 'Cenetistas', 4);

        return {
          factions,
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 5),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 3),
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 2),
          },
        };
      },
    },
    {
      text: 'Say nothing. Winter is coming and the pits have to keep producing.',
      textZh: '不作声。冬天要来了，矿井得继续出煤。',
      subtitle: 'Take no position on the decree. The right consolidates around the new apparatus and the employers breathe easier.',
      subtitleZh: '对这道政令不表态。右翼围绕新机构进一步整合，雇主们松了一口气。',
      effect: (state) => {
        let classes = adjustClassSupport(state.classes, 'Burguesia', 'AP', 3);
        classes = adjustClassSupport(classes, 'Latifundistas', 'AP', 2);
        const factions = adjustFactionDissents(state.factions, { Puristas: -4, Faistas: -3, Treintistas: 3 });

        return {
          classes,
          factions,
          partyRelations: {
            ...state.partyRelations,
            AP: Math.min(100, (state.partyRelations.AP || 0) + 4),
            PRR: Math.min(100, (state.partyRelations.PRR || 0) + 3),
          },
          stats: {
            ...state.stats,
            bureaucratization: Math.min(100, state.stats.bureaucratization + 3),
          },
          coupProgress: (state.coupProgress || 0) + 1,
        };
      },
    },
  ],
};
