import { Card, GameEvent, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissent, adjustFactionDissents, adjustFactionInfluence } from '../utils';
import { media } from './media';
import { isOrganizationEstablished, setOrganizationEstablished } from '../organizations';

const fijlOrganizationEvent = (state: GameState): GameEvent => ({
  id: 'fijl_event',
  date: { year: state.year, month: state.month },
  title: 'Federación Ibérica de Juventudes Libertarias',
  titleZh: '伊比利亚自由青年联合会',
  description: 'The FIJL coordinates libertarian youth circles across Iberia. Its branches focus on education, solidarity, and preparing a new generation to take responsibility for the movement.',
  descriptionZh: 'FIJL在伊比利亚各地协调自由青年团体。各地分支专注于教育、互助，并培养能够为运动承担责任的新一代。',
  options: [
    {
      text: 'Give the youth federation room to organize.',
      textZh: '让青年联合会放手组织。',
      subtitle: 'The FIJL continues its long-term work; it has no additional recurring numerical effect.',
      subtitleZh: 'FIJL继续开展长期工作；暂无额外的持续数值效果。',
      effect: (): Partial<GameState> => ({ currentEvent: null }),
    },
  ],
});

/** Spotlight card for the FIJL. It is only available after the organization is established. */
export const fijlCard: Card = {
  id: 'fijl',
  title: 'Federación Ibérica de Juventudes Libertarias',
  titleZh: '伊比利亚自由青年联合会',
  type: 'Action',
  description: 'Coordinate the FIJL’s youth branches and give libertarian activists a shared space for education and solidarity.',
  descriptionZh: '协调 FIJL 的青年分支，为自由主义活动家提供共同的教育与互助空间。',
  cost: 1,
  condition: (state: GameState) => isOrganizationEstablished(state, 'FIJL') && state.organizations_timer <= 0,
  effect: (state: GameState): Partial<GameState> => ({
    organizations_timer: 6,
    currentEvent: fijlOrganizationEvent(state),
  }),
};

export const organizationsCard: Card = {
  id: 'organizations',
  title: 'Confederal Organizations',
  titleZh: '组织',
  type: 'Action',
  description: 'Anarchism is not only a distant vision; it is also a way of life, as well as a scaffold for revolution. Through our vast network of union branches, cultural centers, and mutual aid groups, we provide support to the working class where the bourgeois state fails.',
  descriptionZh: '无政府主义不仅是一种遥远的愿景；更是一种生活方式，同时也是革命的脚手架。通过我们庞大的工会分会、文化中心和互助团体网络，我们在资产阶级国家失败的地方为工人阶级提供支持。',
  cost: 1,
  condition: (state) => state.organizations_timer <= 0,
  effect: (state: GameState) => ({
    organizations_timer: 6,
    currentEvent: {
      id: 'organizations_decision',
      date: { year: state.year, month: state.month },
      title: 'Confederal Organizations',
      titleZh: '组织',
      description: 'The union is building the new society within the shell of the old. Where should we allocate our resources?',
      descriptionZh: '工会在旧社会的躯壳内建设新社会。我们应该将资源分配到哪里？',
      options: [
        {
          text: 'Fund Media & Publishers (-1 Resource)',
          textZh: '资助我们的媒体和无政府主义出版社 (-1 资源)',
          subtitle: 'Spread our ideas through the printed word and trigger Media options immediately.',
          subtitleZh: '通过印刷品传播我们的理念，直接跳转并触发媒体活动。',
          condition: (s: GameState) => s.resources >= 1,
          unavailableSubtitle: () => 'Need at least 1 resource.',
          unavailableSubtitleZh: () => '资源不足。',
          effect: (s: GameState) => {
            const mediaResult = media.effect(s);
            return {
              resources: s.resources - 1,
              // Intentionally bypasses the media cooldown so this funding action can jump directly into Media options.
              propaganda_timer: 0,
              currentEvent: mediaResult.currentEvent
            };
          }
        },
        {
          text: 'Fortify Strike Funds (-1 Resource)',
          textZh: '巩固抵抗基金和互助网络 (-1 资源)',
          subtitle: 'Provide a safety net for striking workers and their families.',
          subtitleZh: '为罢工工人及其家属提供安全网，增强群众的斗争底气。',
          condition: (s: GameState) => s.resources >= 1,
          unavailableSubtitle: () => 'Need at least 1 resource.',
          unavailableSubtitleZh: () => '资源不足。',
          effect: (s: GameState) => {
            const dissentModifier = 1 - ((s.stats.tension || 0) / 100); 
            const supportGain = Math.floor(5 * dissentModifier);

            let newClasses = s.classes;
            newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', supportGain);
            newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', supportGain);

            return {
              resources: s.resources - 1,
              classes: newClasses
            };
          }
        },
        {
          text: 'Expand Ateneos Libertarios (-1 Resource)',
          textZh: '扩展自由雅典学院 (-1 资源)',
          subtitle: 'Cultural centers to educate the workers and reduce factionalism.',
          subtitleZh: '建立文化中心以教育工人，通过文化认同减少内部派系分歧。',
          condition: (s: GameState) => s.resources >= 1,
          unavailableSubtitle: () => 'Need at least 1 resource.',
          unavailableSubtitleZh: () => '资源不足。',
          effect: (s: GameState) => {
            const newFactions = adjustFactionDissents(s.factions, { Faistas: -6, Treintistas: -6, Cenetistas: -6 });

            return {
              resources: s.resources - 1,
              factions: newFactions,
              ateneos_established: (s.ateneos_established || 0) + 1
            };
          }
        },
        {
          text: 'Arm Comités de Defensa (-1 Resource)',
          textZh: '武装防卫委员会 (-1 资源)',
          subtitle: 'Prepare our defense committees for the inevitable conflict with the state.',
          subtitleZh: '让我们的防卫委员会为与国家机器之间不可避免的冲突做好准备。',
          condition: (s: GameState) => s.resources >= 1,
          unavailableSubtitle: () => 'Need at least 1 resource.',
          unavailableSubtitleZh: () => '资源不足。',
          effect: (s: GameState) => {
            const newFactions = adjustFactionDissent(s.factions, 'Treintistas', 6);

            return {
              resources: s.resources - 1,
              factions: newFactions,
              ...setOrganizationEstablished(s, 'DC'),
              armedForces: {
                ...s.armedForces,
                militias: {
                  ...s.armedForces.militias,
                  cntFai: (s.armedForces.militias.cntFai || 0) + 1000
                }
              }
            };
          }
        },
        ...(isOrganizationEstablished(state, 'FIJL')
          ? [{
              text: 'Turn our attention to our youth organization.',
              textZh: '将目光转向我们的青年组织',
              subtitle: 'Move directly to the Federación Ibérica de Juventudes Libertarias card.',
              subtitleZh: '直接转入伊比利亚自由青年联合会卡牌。',
              effect: (s: GameState): Partial<GameState> => {
                const result = fijlCard.effect(s);
                return {
                  ...result,
                  currentEvent: result.currentEvent || null,
                };
              },
            }]
          : [{
              text: 'Establish FIJL Youth (-2 Resources)',
              textZh: '推动自由青年联合会(FIJL)成立 (-2 资源)',
              subtitle: 'Mobilize the next generation of anarchists.',
              subtitleZh: '动员下一代无政府主义者，为组织注入新鲜血液。',
              condition: (s: GameState) => s.resources >= 2,
              unavailableSubtitle: () => 'Need at least 2 resources.',
              unavailableSubtitleZh: () => '需要至少 2 资源。',
              effect: (s: GameState) => {
                let newFactions = adjustFactionInfluence(s.factions, 'Faistas', 5);
                newFactions = adjustFactionDissent(newFactions, 'Treintistas', 3);

                return {
                  resources: s.resources - 2,
                  factions: newFactions,
                  ...setOrganizationEstablished(s, 'FIJL'),
                  armedForces: {
                    ...s.armedForces,
                    militias: {
                      ...s.armedForces.militias,
                      cntFai: (s.armedForces.militias.cntFai || 0) + 500
                    }
                  },
                };
              }
            }]),
        ...(!isOrganizationEstablished(state, 'ML') ? [{
              text: 'Establish Mujeres Libres (-2 Resources)',
              textZh: '推动自由妇女组织(Mujeres Libres)成立 (-2 资源)',
              subtitle: 'Empower women and challenge the reactionary influence of the Church. Once established, the independent Mujeres Libres action card becomes available.',
              subtitleZh: '赋予妇女权利，挑战教会的保守影响，扩大我们的社会基础。成立后，独立的自由女性行动卡牌将可用。',
              condition: (s: GameState) => s.resources >= 2,
              unavailableSubtitle: () => 'Need at least 2 resources.',
              unavailableSubtitleZh: () => '需要至少 2 资源。',
              effect: (s: GameState) => {
                let newClasses = s.classes;

                newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 5);
                newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 3);
                newClasses = adjustClassSupport(newClasses, 'Clero', 'CNT_FAI', -5);

                return {
                  resources: s.resources - 2,
                  classes: newClasses,
                  ...setOrganizationEstablished(s, 'ML'),
                };
              }
            }] : []),
        {
          text: 'Do nothing',
          textZh: '当前不分配资金给任何项目',
          subtitle: 'Conserve our resources for now.',
          subtitleZh: '暂时保留资源，静待时机。',
          effect: (s: GameState) => ({})
        }
      ]
    }
  })
};
