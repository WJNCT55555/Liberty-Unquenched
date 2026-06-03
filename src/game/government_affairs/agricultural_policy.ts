import { Card, GameState } from '../types';
import { adjustFactionInfluence } from '../utils';

export const agriculturalPolicy: Card = {
  id: 'agricultural_policy',
  title: 'Agricultural Policy',
  titleZh: '农业政策',
  type: 'Government',
  description: 'Although agricultural policy has historically not been the specialty of the CNT, this area urgently requires policy leadership.',
  descriptionZh: '尽管农业政策历来不是全劳联（CNT）的专长，但这一领域迫切需要政策。',
  cost: 1,
  condition: (state: GameState) => {
    const isGov = state.isCNTInGovernment;
    const isMinister = state.ministers.agriculture === 'CNT' || state.agriculture_minister_party === 'CNT';
    const isTimerZero = (state.agricultural_policy_timer || 0) === 0;
    return isGov && isMinister && isTimerZero;
  },
  effect: (state: GameState) => {
    return {
      currentEvent: {
        id: 'agricultural_policy_event',
        title: 'Agricultural Policy',
        titleZh: '农业政策',
        description: 'With the CNT holding the Ministry of Agriculture, we must determine our course of agrarian action to satisfy the starving peasantry while keeping the government stable.',
        descriptionZh: '随着全劳联（CNT）重掌农业部，我们必须制定切实的农村政策，在满足饥饿农民需求的同时维持内阁政局的稳定。',
        options: [
          {
            text: 'Promote Peasant Collectivization',
            textZh: '大力推广农民集体化',
            subtitle: 'Directly empower peasant unions to organize collective farms. This maximizes land reform and socialist fervor, but alienates yeomen and landowners.',
            subtitleZh: '直接授权农民工会组织集体农庄。这将极大推进土地改革并推高社会主义热情，但会引发自耕农和地主势力的强烈抵制。',
            effect: (s: GameState) => {
              const newClasses = JSON.parse(JSON.stringify(s.classes));
              if (newClasses.Braceros) {
                newClasses.Braceros.support.CNT_FAI = Math.min(100, (newClasses.Braceros.support.CNT_FAI || 0) + 15);
              }
              if (newClasses.Labradores) {
                newClasses.Labradores.support.CNT_FAI = Math.max(0, (newClasses.Labradores.support.CNT_FAI || 0) - 10);
              }
              return {
                agricultural_policy_timer: 6,
                classes: newClasses,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 15)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 10),
                  workerControl: Math.min(100, s.stats.workerControl + 12),
                }
              };
            }
          },
          {
            text: 'Enforce Fixed Minimum Rural Wages',
            textZh: '推行农村固定最低保障工资',
            subtitle: 'Enforce modern wage guarantees inside the rural sectors. Elevates the peasantry standard of living cooperatively through republican laws.',
            subtitleZh: '在农业部门全面强制执行保障性最低工资。通过共和国法律框架，有条不紊地提高劳工与佃农的生活水平。',
            effect: (s: GameState) => {
              const newClasses = JSON.parse(JSON.stringify(s.classes));
              if (newClasses.Braceros) {
                newClasses.Braceros.support.CNT_FAI = Math.min(100, (newClasses.Braceros.support.CNT_FAI || 0) + 8);
              }
              const newFactions = adjustFactionInfluence(s.factions, 'Treintistas', 8);
              return {
                agricultural_policy_timer: 6,
                classes: newClasses,
                factions: newFactions,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  min_wage: Math.min(100, s.domesticPolicy.min_wage + 10)
                },
                stats: {
                  ...s.stats,
                  economy: Math.min(100, s.stats.economy + 5),
                  popularFrontUnity: Math.min(100, s.stats.popularFrontUnity + 4)
                }
              };
            }
          },
          {
            text: 'Maintain Moderate Paced Rural Reforms',
            textZh: '采取温和渐进的农村改革',
            subtitle: 'Ensure minimal disruption to food production and safeguard the coalition by coordinating reforms with moderate Republican parties.',
            subtitleZh: '与温和的共和派政党协商步调，最大程度避免日常粮食生产混乱，稳固内阁合作。然而这会被激进派视为投降。',
            effect: (s: GameState) => {
              const newFactions = JSON.parse(JSON.stringify(s.factions));
              newFactions.Faistas.dissent = Math.min(100, newFactions.Faistas.dissent + 10);
              newFactions.Puristas.dissent = Math.min(100, newFactions.Puristas.dissent + 10);
              return {
                agricultural_policy_timer: 6,
                factions: newFactions,
                stats: {
                  ...s.stats,
                  popularFrontUnity: Math.min(100, s.stats.popularFrontUnity + 10),
                }
              };
            }
          }
        ]
      }
    };
  }
};
