import { Card } from '../types';
import { adjustFactionInfluence } from '../utils';

export const internationalContacts: Card = {
  id: 'international_contacts',
  title: 'International Contacts',
  titleZh: '国际联系',
  type: 'Action',
  description: 'Hand in hand with revolutionary syndicalist and anarchist forces from all countries.',
  descriptionZh: '与各国革命工团主义及无政府主义力量携手。',
  cost: 1,
  condition: (state) => state.international_relations_timer <= 0,
  effect: (state) => {
    const totalDissent = Object.values(state.factions).reduce((acc, f) => acc + f.dissent, 0) / 400;
    
    return {
      actionsLeft: state.actionsLeft + 1,
      international_relations_timer: 9,
      currentEvent: {
        id: 'international_contacts_event',
        date: { year: state.year, month: state.month },
        title: 'International Contacts',
        titleZh: '国际联系',
        description: 'In the International Workers\' Association (AIT) and various revolutionary syndicalist networks, we can establish contacts with brother organizations outside the Iberian Peninsula and even around the world, draw on struggle experience, and strive for true allies in the anti-fascist united front.',
        descriptionZh: '在国际工人协会（AIT）及各地革命工团主义网络中，我们可以与伊比利亚半岛之外、乃至全世界的兄弟组织建立联系，汲取斗争经验，争取反法西斯统一战线中的真正同盟。',
        options: [
          {
            text: 'Contact French syndicalists',
            textZh: '联系法国工团主义者',
            subtitle: 'Contact the CGT-SR and other French syndicalist groups to coordinate anti-fascist efforts.',
            subtitleZh: '联系法国总工会-革命工团派（CGT-SR）及其他工团主义团体，共同对抗法西斯主义在欧洲的扩张。',
            condition: (s) => s.resources >= 1,
            effect: (s) => ({
              resources: s.resources - 1,
              relations: {
                ...s.relations,
                france: Math.min(100, s.relations.france + 5),
                internationalSocialists: Math.min(100, s.relations.internationalSocialists + 3),
              },
              factions: adjustFactionInfluence(s.factions, 'Cenetistas', 5),
              covert_ops_france: s.covert_ops_france + 1
            })
          },
          {
            text: 'Establish underground network with Portuguese anarchists',
            textZh: '建立葡萄牙地下网络',
            subtitle: 'Strengthen ties with the CGTP and Portuguese anarchists to support the Iberian movement.',
            subtitleZh: '加强与葡萄牙总工会（CGTP）及无政府主义者的联系，支撑伊比利亚自由共产主义运动。',
            condition: (s) => s.resources >= 1,
            effect: (s) => ({
              resources: s.resources - 1,
              relations: {
                ...s.relations,
                portugal: Math.max(0, s.relations.portugal - 5),
              },
              factions: adjustFactionInfluence(
                adjustFactionInfluence(s.factions, 'Faistas', 5),
                'Puristas',
                Math.round(5 * (1 - totalDissent))
              ),
              covert_ops_portugal: s.covert_ops_portugal + 1
            })
          },
          {
            text: 'Contact German and Italian anti-fascist underground',
            textZh: '接触德意反法西斯组织',
            subtitle: 'Learn clandestine tactics from those fighting Hitler and Mussolini\'s regimes.',
            subtitleZh: '从对抗希特勒和墨索里尼政权的斗争中学习秘密组织与街头战术，并接纳流亡同志。',
            condition: (s) => s.resources >= 1,
            effect: (s) => ({
              resources: s.resources - 1,
              relations: {
                ...s.relations,
                italy: Math.max(0, s.relations.italy - 10),
                germany: Math.max(0, s.relations.germany - 10),
              },
              factions: adjustFactionInfluence(
                adjustFactionInfluence(s.factions, 'Faistas', 5),
                'Cenetistas',
                Math.round(3 * (1 - totalDissent))
              ),
              armedForces: {
                ...s.armedForces,
                militias: {
                  ...s.armedForces.militias,
                  cntFai: s.armedForces.militias.cntFai + 150
                }
              }
            })
          },
          {
            text: 'Exchange with Latin American federations',
            textZh: '与拉丁美洲组织交流',
            subtitle: 'Connect with organizations like the FORA in Argentina to build international solidarity.',
            subtitleZh: '与阿根廷FORA等拉丁美洲组织建立联系，获取国际声援与物资通道。',
            condition: (s) => s.resources >= 2,
            effect: (s) => ({
              resources: s.resources - 2,
              relations: {
                ...s.relations,
                mexico: Math.min(100, s.relations.mexico + 5),
                internationalSocialists: Math.min(100, s.relations.internationalSocialists + 5),
              },
              factions: adjustFactionInfluence(
                adjustFactionInfluence(
                  adjustFactionInfluence(s.factions, 'Faistas', 3),
                  'Puristas',
                  3
                ),
                'Cenetistas',
                2
              )
            })
          },
          {
            text: 'Try to contact American IWW',
            textZh: '尝试接触美国IWW',
            subtitle: 'Reach out to the "Wobblies" across the Atlantic, though their influence is waning.',
            subtitleZh: '跨越大西洋联系“世界产业工人”，尽管他们的影响力正在减弱。',
            condition: (s) => s.resources >= 1,
            effect: (s) => ({
              resources: s.resources - 1
            })
          },
          {
            text: 'Cautiously observe Profintern\'s attitude',
            textZh: '观察赤色职工国际',
            subtitle: 'Evaluate potential cooperation with Soviet-aligned labor organizations.',
            subtitleZh: '评估与苏联结盟的劳工组织合作的可能性，这可能会引起党内纯粹派的疑虑。',
            condition: (s) => s.resources >= 1,
            effect: (s) => {
              const newFactions = JSON.parse(JSON.stringify(s.factions));
              newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 5);
              
              return {
                resources: s.resources - 1,
                relations: {
                  ...s.relations,
                  ussr: Math.min(100, s.relations.ussr + 5),
                },
                partyRelations: {
                  ...s.partyRelations,
                  PCE: Math.min(100, s.partyRelations.PCE + 5),
                  POUM: Math.min(100, s.partyRelations.POUM + 5),
                },
                factions: newFactions
              };
            }
          },
          {
            text: 'Pack bags, contact international comrades in IWA–AIT',
            textZh: '联系国际工人协会',
            subtitle: 'Deepen our involvement in the AIT to unify the global anarchist movement.',
            subtitleZh: '深化我们在国际工人协会（AIT）中的参与，统一全球无政府主义运动。',
            condition: (s) => s.resources >= 1,
            effect: (s) => {
              const newFactions = JSON.parse(JSON.stringify(s.factions));
              newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 5);
              newFactions.Puristas.dissent = Math.max(0, newFactions.Puristas.dissent - 5);
              newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 5);
              newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 3);
              
              return {
                resources: s.resources - 1,
                relations: {
                  ...s.relations,
                  internationalSocialists: Math.min(100, s.relations.internationalSocialists + 8),
                },
                factions: newFactions
              };
            }
          },
          {
            text: 'We do not need to expand international contacts now',
            textZh: '暂不扩大联系',
            subtitle: 'Focus our energy on domestic affairs for the time being.',
            subtitleZh: '暂时将精力集中在伊比利亚半岛内部事务上。',
            effect: () => ({})
          }
        ]
      }
    };
  },
};
