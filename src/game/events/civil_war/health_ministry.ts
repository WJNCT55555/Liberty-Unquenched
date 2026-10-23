import type { GameEvent, GameState } from '../../types';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence } from '../../utils';

/**
 * 战时改组：卫生与社会援助部从劳动部分出，蒙特塞尼出任部长。
 *
 * 史实上「Sanidad y Asistencia Social」并不是与共和国一同诞生的部：1936 年 9 月组成
 * 拉尔戈·卡瓦列罗内阁，11 月 4 日改组时它才从劳动部分出来，首任部长是 CNT 的蒙特塞尼
 * ——西班牙历史上第一位女性内阁成员。**这两件事是同一场谈判的两半**：战时人民阵线的
 * 成立本身就把部长职位重新划了一遍。
 *
 * 因此本事件不按固定月份触发。若内战提前爆发，那次改组同样提前；用 `1936 年 11 月`
 * 作闸门会凭空造出一段几个月的空窗期，而那段空窗在史实上只是「9 月组阁、11 月改组」
 * 之间的两个月。现在的条件是：战时协定已经落定、该部尚未成立，下一个月即由编排层
 * 入队（见 `rules/monthlyPipeline.ts` 的定时事件筛选）。
 *
 * 在此之前 `rules/wartimeCoalition.ts` 让 `health` 与 `labor` 同党，所以内阁面板不会
 * 提前出现一个尚未成立的部。
 */

/** 战时政府是否由 CNT 入阁。阁外合作路线拿不到部长职位，但仍可就这个部表态。 */
const cntHoldsOffice = (state: GameState): boolean => state.cntStance === 'govern';

export const healthMinistry: GameEvent = {
  id: 'health_ministry',
  meta: { category: 'politics', flow: 'solo', series: ['civil_war', 'health_ministry'] },
  condition: (state) =>
    state.civilWarStatus === 'ongoing'
    && Boolean(state.wartimePowerArrangement)
    && !state.wartimeSanidadMinistry,
  title: 'A Ministry of Health and Social Assistance',
  titleZh: '卫生与社会援助部成立',
  description: 'The wartime cabinet has split health and social assistance out of the Labor ministry and given them a department of their own. Hospitals, child evacuation, refugee relief and the transfusion service now answer to one minister. The anarchist press has spent twenty years explaining why ministries are cages; the mothers queuing outside the maternity wards have not read it. Taking the portfolio means the confederation signs its name to the state’s relief rolls. Refusing it means the communists will.',
  descriptionZh: '战时内阁把卫生与社会援助从劳动部里拆出来，单设一个部。医院、儿童疏散、难民救济与输血服务从此归一位部长统辖。无政府主义的报纸花了二十年解释部委就是笼子；在产房外排队的母亲们没读过这些。接下这个部，意味着联合会把自己的名字签在国家救济名册上。拒绝它，签名的就会是共产党人。',
  options: [
    {
      text: 'Take the ministry. Federica Montseny will sign the decrees.',
      textZh: '接下这个部，由蒙特塞尼签署政令。',
      subtitle: 'Costs 2 resources to open the relief and evacuation services at once. Republican authority and popular relief rise, the Puristas call it class collaboration, and the confederation acquires an address in every provincial capital.',
      subtitleZh: '花费 2 资源立即开办救济与疏散服务。共和国权威与民众救济上升，纯粹派称之为阶级合作，而联合会从此在每个省会都有一个门牌号。',
      condition: (state) => cntHoldsOffice(state) && state.resources >= 2,
      unavailableSubtitle: (state: GameState) => (cntHoldsOffice(state)
        ? 'Requires 2 resources.'
        : 'Only a CNT inside the cabinet can take the portfolio.'),
      unavailableSubtitleZh: (state: GameState) => (cntHoldsOffice(state)
        ? '需要 2 资源。'
        : '只有入阁的 CNT 才能取得该部部长职位。'),
      effect: (state) => {
        let factions = adjustFactionDissents(state.factions, {
          Puristas: 10,
          Faistas: 5,
          Cenetistas: -6,
          Treintistas: -5,
        });
        factions = adjustFactionInfluence(factions, 'Cenetistas', 3);
        let classes = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 4);
        classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 2);

        return {
          resources: Math.max(0, state.resources - 2),
          wartimeSanidadMinistry: true,
          ministers: { ...state.ministers, health: 'CNT' as const },
          factions,
          classes,
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 5),
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 3),
          },
          partyRelations: {
            ...state.partyRelations,
            PCE: Math.max(-100, (state.partyRelations.PCE || 0) - 6),
          },
        };
      },
    },
    {
      text: 'Take the ministry, but only under a written front agreement.',
      textZh: '接下这个部，但要以一份书面阵线协定为前提。',
      subtitle: 'Hospitals, the evacuation of children and the relief rolls are run jointly with the socialists and the communists. The rivalry over who feeds Madrid becomes an open argument instead of a silent one, and both sides of it are on paper.',
      subtitleZh: '医院、儿童疏散与救济名册由社会党人和共产党人共同管理。围绕「谁在供养马德里」的争夺从暗中较劲变成公开争论，而且两边都落在纸面上。',
      condition: cntHoldsOffice,
      unavailableSubtitle: () => 'Only a CNT inside the cabinet can take the portfolio.',
      unavailableSubtitleZh: () => '只有入阁的 CNT 才能取得该部部长职位。',
      effect: (state) => {
        const factions = adjustFactionDissents(state.factions, {
          Puristas: 5,
          Faistas: 2,
          Cenetistas: -4,
          Treintistas: -4,
        });
        let classes = adjustClassSupport(state.classes, 'Obreros', 'CNT_FAI', 2);
        classes = adjustClassSupport(classes, 'Obreros', 'PCE', 2);

        return {
          wartimeSanidadMinistry: true,
          ministers: { ...state.ministers, health: 'CNT' as const },
          factions,
          classes,
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 3),
          },
          partyRelations: {
            ...state.partyRelations,
            PCE: Math.min(100, (state.partyRelations.PCE || 0) + 5),
            PSOE: Math.min(100, (state.partyRelations.PSOE || 0) + 3),
          },
        };
      },
    },
    {
      text: 'No minister. The unions and the neighbourhood committees will do it themselves.',
      textZh: '不设部长。工会与街区委员会自己来办。',
      subtitle: 'Refuse the portfolio: relief through union and neighbourhood committees, answerable to the people they serve rather than to a ministry. Revolutionary fervor rises and the base approves, but republican authority falls — the right reads the refusal as the Republic losing its grip, and the warehouses that only a state can requisition stay out of reach for now.',
      subtitleZh: '拒绝这个部：救济由工会与街区委员会承办，向被救济的人负责，而不是向部里负责。革命热情上升、基层认可，但共和国权威下降——右翼把这次拒绝读成共和国正在失去掌控，而只有国家才征调得动的仓库暂时仍不在手上。',
      effect: (state) => {
        const factions = adjustFactionDissents(state.factions, {
          Puristas: -12,
          Faistas: -8,
          Cenetistas: 6,
          Treintistas: 5,
        });
        return {
          wartimeSanidadMinistry: true,
          factions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 5),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 4),
          },
        };
      },
    },
    {
      text: 'Let the communists have it. They will organize the hospitals better than we will.',
      textZh: '让共产党人拿去。他们办医院比我们强。',
      subtitle: 'Hand the relief apparatus to the PCE. Republican authority rises and the front holds, but the party that runs the blood banks also runs the casualty lists, and it will remember who gave it the keys.',
      subtitleZh: '把救济机器交给 PCE。共和国权威上升、阵线维持，但管血库的党也管着伤亡名单，而且它会记住是谁把钥匙交出来的。',
      effect: (state) => {
        let classes = adjustClassSupport(state.classes, 'Obreros', 'PCE', 4);
        classes = adjustClassSupport(classes, 'PequenaBurguesia', 'PCE', 2);
        const factions = adjustFactionDissents(state.factions, { Faistas: -5, Puristas: -6, Cenetistas: 4, Treintistas: 3 });

        return {
          wartimeSanidadMinistry: true,
          ministers: { ...state.ministers, health: 'PCE' as const },
          classes,
          factions,
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 4),
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 2),
          },
          partyRelations: {
            ...state.partyRelations,
            PCE: Math.min(100, (state.partyRelations.PCE || 0) + 12),
          },
        };
      },
    },
  ],
};
