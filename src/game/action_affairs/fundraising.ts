import { Card, GameState } from '../types';

export const fundraising: Card = {
  id: 'fundraising',
  title: 'Fundraising',
  titleZh: '筹款',
  type: 'Action',
  description: 'For better or for worse, the CNT‑FAI cannot function without resources.',
  descriptionZh: '无论好坏，CNT-FAI没有资源就无法运转。',
  cost: 1,
  condition: (state) => state.fundraising_timer <= 0,
  effect: (state) => ({
    fundraising_timer: 6,
    currentEvent: {
      id: 'fundraising_event',
      date: { year: state.year, month: state.month },
      title: 'Fundraising',
      titleZh: '筹款',
      description: 'The revolution cannot be bought, but it must be sustained. Printing presses, strike funds, and community kitchens all require resources. Our primary source of income is the dues paid by our dedicated members. We must balance the urgent need for funds with the economic reality of the working class. High dues provide more power to the organization but strain the loyalty of those struggling to survive; low dues foster unity but limit our ability to act.',
      descriptionZh: '革命不能被收买，但必须得到维持。印刷机、罢工基金和社区食堂都需要资源。我们的主要收入来源是忠实成员缴纳的会费。我们必须在紧迫的资金需求与工人阶级的经济现实之间取得平衡。高额会费为组织提供更多力量，但会透支挣扎求生者的忠诚；低额会费促进团结，但限制了我们的行动能力。',
      options: [
        {
          text: `Maintain our current contributions (+${state.dues} resources)`,
          textZh: `维持当前会费 (+${state.dues} 资源)`,
          subtitle: 'Keep the current level of contributions from our members.',
          subtitleZh: '保持现有的会员缴费水平，维持组织基本运转。',
          effect: (s) => ({
            resources: s.resources + s.dues
          })
        },
        {
          text: `Reduce contributions (+${state.dues - 1} resources, -8 dissent all factions)`,
          textZh: `降低会费 (+${state.dues - 1} 资源, 所有派系分歧 -8)`,
          subtitle: 'Relieve the burden on workers to foster unity and reduce dissent.',
          subtitleZh: '减轻工人负担以促进团结，大幅降低各派系内部的分歧。',
          condition: (s) => s.dues > 1,
          unavailableSubtitle: (s) => 'Dues already at minimum',
          unavailableSubtitleZh: (s) => '会费已达最低限度',
          effect: (s: GameState) => {
            const newDues = s.dues - 1;
            return {
              dues: newDues,
              resources: s.resources + newDues,
              factions: {
                Treintistas: { ...s.factions.Treintistas, dissent: Math.max(0, s.factions.Treintistas.dissent - 8) },
                Cenetistas: { ...s.factions.Cenetistas, dissent: Math.max(0, s.factions.Cenetistas.dissent - 8) },
                Faistas: { ...s.factions.Faistas, dissent: Math.max(0, s.factions.Faistas.dissent - 8) },
                Puristas: { ...s.factions.Puristas, dissent: Math.max(0, s.factions.Puristas.dissent - 8) }
              }
            };
          }
        },
        {
          text: `Increase contributions (+${state.dues + 1} resources, lose support)`,
          textZh: `提高会费 (+${state.dues + 1} 资源, 失去支持)`,
          subtitle: 'Demand more from our members to fund urgent projects, at the risk of losing support.',
          subtitleZh: '要求会员增加贡献以资助紧急项目，但这可能会损害我们的群众基础。',
          condition: (s) => s.dues <= 4,
          unavailableSubtitle: (s) => 'Dues already at maximum',
          unavailableSubtitleZh: (s) => '会费已达最高限度',
          effect: (s: GameState) => {
            const newDues = s.dues + 1;
            const supportLoss = newDues >= 5 ? 3 * newDues : 3;
            const newClasses = JSON.parse(JSON.stringify(s.classes));
            newClasses.Obreros.support.CNT_FAI = Math.max(0, newClasses.Obreros.support.CNT_FAI - supportLoss);
            newClasses.Braceros.support.CNT_FAI = Math.max(0, newClasses.Braceros.support.CNT_FAI - supportLoss);
            return {
              dues: newDues,
              resources: s.resources + newDues,
              classes: newClasses
            };
          }
        }
      ]
    }
  })
};
