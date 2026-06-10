import { Card, GameState } from '../types';
import { adjustFactionInfluence } from '../utils';

export const laborAffairs: Card = {
  id: 'labor_affairs',
  title: 'Labor Affairs',
  titleZh: '劳工事务',
  type: 'Government',
  description: 'Industrial hubs in Catalonia are ablaze with labor unrest. Employers have initiated a major lockout, trying to force workers to accept further cuts in wages and benefits. The Ministry of Labor must intervene to arbitrate the industrial conflict.',
  descriptionZh: '工业重镇加泰罗尼亚正燃起劳工骚乱之火。雇主们发起了一场大规模停工，试图迫使工人在工资和福利上接受更多削减。劳工部亟需出面仲裁劳资冲突。',
  cost: 1,
  condition: (state: GameState) => {
    const isGov = state.isCNTInGovernment;
    const isMinister = state.ministers.labor === 'CNT' || state.labor_minister_party === 'CNT';
    const isTimerZero = (state.labor_affairs_timer || 0) <= 0;
    return isGov && isMinister && isTimerZero;
  },
  effect: (state: GameState) => {
    return {
      currentEvent: {
        id: 'labor_affairs_event',
        title: 'Labor Affairs',
        titleZh: '劳工事务',
        description: 'Industrial hubs in Catalonia are ablaze with labor unrest. Employers have initiated a major lockout, trying to force workers to accept further cuts in wages and benefits. The Ministry of Labor must intervene to arbitrate the industrial conflict.',
        descriptionZh: '工业重镇加泰罗尼亚正燃起劳工骚乱之火。雇主们发起了一场大规模停工，试图迫使工人在工资和福利上接受更多削减。劳工部亟需出面仲裁劳资冲突。',
        options: [
          {
            text: 'Support labor in their demands',
            textZh: '支持工人们的诉求',
            subtitle: 'Directly back the striking federations against the lockout. Elevates CNT popularity among urban workers but alienates the bourgeoisie and small business owners.',
            subtitleZh: '直接支持罢工联合会，反抗资方的闭厂停工。这将提升CNT在城市工人中的威望，但会彻底激怒资产阶级和小企业主。',
            effect: (s: GameState) => {
              const newClasses = JSON.parse(JSON.stringify(s.classes));
              const newFactions = JSON.parse(JSON.stringify(s.factions));
              
              if (newClasses.Obreros) {
                newClasses.Obreros.support.CNT_FAI = Math.min(100, (newClasses.Obreros.support.CNT_FAI || 0) + 10);
              }
              if (newClasses.Burguesia) {
                newClasses.Burguesia.support.CNT_FAI = Math.max(0, (newClasses.Burguesia.support.CNT_FAI || 0) - 10);
              }
              if (newClasses.PequenaBurguesia) {
                newClasses.PequenaBurguesia.support.CNT_FAI = Math.max(0, (newClasses.PequenaBurguesia.support.CNT_FAI || 0) - 5);
              }
              
              newFactions.Faistas.dissent = Math.max(0, (newFactions.Faistas.dissent || 0) - 5);
              newFactions.Cenetistas.dissent = Math.max(0, (newFactions.Cenetistas.dissent || 0) - 5);
              
              return {
                labor_affairs_timer: 10,
                classes: newClasses,
                factions: newFactions,
                stats: {
                  ...s.stats,
                  workerControl: Math.min(100, s.stats.workerControl + 8),
                  revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 5)
                }
              };
            }
          },
          {
            text: 'Support the employers in their demands',
            textZh: '支持雇主的诉求',
            subtitle: 'Compromise with the business owners to end the lockouts and strikes swiftly. This pleases moderate ministers but Outrages the anarchist base.',
            subtitleZh: '与雇主达成共识，迅速扭转停工及罢工浪潮。这会取悦温和内阁，但会让无政府主义基本盘深感背叛。',
            effect: (s: GameState) => {
              const newClasses = JSON.parse(JSON.stringify(s.classes));
              const newFactions = JSON.parse(JSON.stringify(s.factions));
              
              if (newClasses.Obreros) {
                newClasses.Obreros.support.CNT_FAI = Math.max(0, (newClasses.Obreros.support.CNT_FAI || 0) - 12);
              }
              if (newClasses.Burguesia) {
                newClasses.Burguesia.support.CNT_FAI = Math.min(100, (newClasses.Burguesia.support.CNT_FAI || 0) + 12);
              }
              if (newClasses.PequenaBurguesia) {
                newClasses.PequenaBurguesia.support.CNT_FAI = Math.min(100, (newClasses.PequenaBurguesia.support.CNT_FAI || 0) + 6);
              }
              
              newFactions.Faistas.dissent = Math.min(100, (newFactions.Faistas.dissent || 0) + 15);
              newFactions.Puristas.dissent = Math.min(100, (newFactions.Puristas.dissent || 0) + 15);
              newFactions.Cenetistas.dissent = Math.min(100, (newFactions.Cenetistas.dissent || 0) + 10);
              
              return {
                labor_affairs_timer: 10,
                classes: newClasses,
                factions: newFactions,
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 5)
                }
              };
            }
          },
          {
            text: 'Try to strike a compromise between the sides',
            textZh: '在劳资双方之间寻求妥协',
            subtitle: 'Arbitrate a balanced compromise, offering minor wage increases if the unions immediately call off the strike. A pragmatic path.',
            subtitleZh: '进行公正中介，提出适度提薪以促使各行各业即刻复工。这是高度务实、顾全大局的方案。',
            effect: (s: GameState) => {
              const newClasses = JSON.parse(JSON.stringify(s.classes));
              const newFactions = JSON.parse(JSON.stringify(s.factions));
              
              if (newClasses.Obreros) {
                newClasses.Obreros.support.CNT_FAI = Math.min(100, (newClasses.Obreros.support.CNT_FAI || 0) + 4);
              }
              if (newClasses.Burguesia) {
                newClasses.Burguesia.support.CNT_FAI = Math.max(0, (newClasses.Burguesia.support.CNT_FAI || 0) - 3);
              }
              if (newClasses.PequenaBurguesia) {
                newClasses.PequenaBurguesia.support.CNT_FAI = Math.min(100, (newClasses.PequenaBurguesia.support.CNT_FAI || 0) + 3);
              }
              
              newFactions.Treintistas.dissent = Math.max(0, (newFactions.Treintistas.dissent || 0) - 8);
              newFactions.Cenetistas.dissent = Math.max(0, (newFactions.Cenetistas.dissent || 0) - 2);
              
              return {
                labor_affairs_timer: 10,
                classes: newClasses,
                factions: newFactions,
                stats: {
                  ...s.stats
                }
              };
            }
          }
        ]
      }
    };
  }
};
