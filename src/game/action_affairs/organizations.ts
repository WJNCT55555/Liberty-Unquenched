import { Card, GameState } from '../types';
import { adjustFactionInfluence } from '../utils';

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
      title: 'Confederal Organizations',
      titleZh: '组织',
      description: 'The union is building the new society within the shell of the old. Where should we allocate our resources?',
      descriptionZh: '工会在旧社会的躯壳内建设新社会。我们应该将资源分配到哪里？',
      options: [
        {
          text: 'Fund Media & Publishers (-1 Resource)',
          textZh: '资助我们的媒体和无政府主义出版社 (-1 资源)',
          subtitle: 'Spread our ideas through the printed word.',
          subtitleZh: '通过印刷品传播我们的理念，重置宣传计时器。',
          condition: (s: GameState) => s.resources >= 1,
          unavailableSubtitleZh: () => '资源不足。',
          effect: (s: GameState) => ({
            resources: s.resources - 1,
            propaganda_timer: 0
          })
        },
        {
          text: 'Fortify Strike Funds (-1 Resource)',
          textZh: '巩固抵抗基金和互助网络 (-1 资源)',
          subtitle: 'Provide a safety net for striking workers and their families.',
          subtitleZh: '为罢工工人及其家属提供安全网，增强群众的斗争底气。',
          condition: (s: GameState) => s.resources >= 1,
          unavailableSubtitleZh: () => '资源不足。',
          effect: (s: GameState) => {
            const newClasses = JSON.parse(JSON.stringify(s.classes));
            const dissentModifier = 1 - ((s.stats.tension || 0) / 100); 
            const supportGain = Math.floor(5 * dissentModifier);

            newClasses.Braceros.support.CNT_FAI = Math.min(100, newClasses.Braceros.support.CNT_FAI + supportGain);
            newClasses.Obreros.support.CNT_FAI = Math.min(100, newClasses.Obreros.support.CNT_FAI + supportGain);

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
          unavailableSubtitleZh: () => '资源不足。',
          effect: (s: GameState) => {
            const newFactions = JSON.parse(JSON.stringify(s.factions));
            
            newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 6);
            newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 6);
            newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 6);

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
          unavailableSubtitleZh: () => '资源不足。',
          effect: (s: GameState) => {
            const newFactions = JSON.parse(JSON.stringify(s.factions));
            newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 6);

            return {
              resources: s.resources - 1,
              factions: newFactions,
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
        {
          text: 'Establish FIJL Youth (-2 Resources)',
          textZh: '推动自由青年联合会(FIJL)成立 (-2 资源)',
          subtitle: 'Mobilize the next generation of anarchists.',
          subtitleZh: '动员下一代无政府主义者，为组织注入新鲜血液。',
          condition: (s: GameState) => s.resources >= 2 && !s.fijl_established,
          unavailableSubtitleZh: () => '资源不足或已成立。',
          effect: (s: GameState) => {
            let newFactions = JSON.parse(JSON.stringify(s.factions));
            
            newFactions = adjustFactionInfluence(newFactions, 'Faistas', 5);
            newFactions.Treintistas.dissent = Math.min(100, newFactions.Treintistas.dissent + 3);

            return {
              resources: s.resources - 2,
              factions: newFactions,
              armedForces: {
                ...s.armedForces,
                militias: {
                  ...s.armedForces.militias,
                  cntFai: (s.armedForces.militias.cntFai || 0) + 500
                }
              },
              fijl_established: true
            };
          }
        },
        {
          text: 'Establish Mujeres Libres (-2 Resources)',
          textZh: '推动自由妇女组织(Mujeres Libres)成立 (-2 资源)',
          subtitle: 'Empower women and challenge the reactionary influence of the Church.',
          subtitleZh: '赋予妇女权利，挑战教会的保守影响，扩大我们的社会基础。',
          condition: (s: GameState) => s.resources >= 2 && !s.mujeres_libres_established,
          unavailableSubtitleZh: () => '资源不足或已成立。',
          effect: (s: GameState) => {
            const newClasses = JSON.parse(JSON.stringify(s.classes));

            newClasses.Braceros.support.CNT_FAI = Math.min(100, newClasses.Braceros.support.CNT_FAI + 5);
            newClasses.Obreros.support.CNT_FAI = Math.min(100, newClasses.Obreros.support.CNT_FAI + 3);
            newClasses.Clero.support.CNT_FAI = Math.max(0, newClasses.Clero.support.CNT_FAI - 5);

            return {
              resources: s.resources - 2,
              classes: newClasses,
              mujeres_libres_established: true
            };
          }
        },
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
