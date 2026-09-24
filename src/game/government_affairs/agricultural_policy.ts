import { Card, GameState } from '../types';
import { adjustFactionDissents, adjustFactionInfluence, adjustClassSupport } from '../utils';
import { clampLawLevel } from '../lawStances';
import { getEconomyCounter } from '../rules/economyReforms';
import { applyControlInfluence, applyEconomicOption } from '../rules/controlShares';
import { MapFaction } from '../../map/types_map';

export const agriculturalPolicy: Card = {
  id: 'agricultural_policy',
  title: 'Agricultural Policy',
  titleZh: '农业政策',
  type: 'Government',
  description: 'Although agricultural policy has historically not been the specialty of the CNT, this area urgently requires policy leadership.',
  descriptionZh: '尽管农业政策历来不是全劳联（CNT）的专长，但这一领域迫切需要政策。',
  cost: 1,
  condition: (state: GameState) => {
    const isGov = state.cntStance === 'govern';
    const isMinister = state.ministers.agriculture === 'CNT';
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
        date: { year: state.year, month: state.month },
        options: [
          {
            text: 'Promote Peasant Collectivization',
            textZh: '大力推广农民集体化',
            subtitle: 'Directly empower peasant unions to organize collective farms. This maximizes land reform and socialist fervor, but alienates yeomen and landowners.',
            subtitleZh: '直接授权农民工会组织集体农庄。这将极大推进土地改革并推高社会主义热情，但会引发自耕农和地主势力的强烈抵制。',
            effect: (s: GameState) => {
              let newClasses = s.classes;
              newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 15);
              newClasses = adjustClassSupport(newClasses, 'Labradores', 'CNT_FAI', -10);
              return {
                agricultural_policy_timer: 6,
                classes: newClasses,
                // Peasant collectivization is a rural ownership transfer
                // (docs/工人控制度改造方案.md §4.5 #5).
                ...applyControlInfluence(s, 6, { land: 1, industry: 0 }),
                domesticPolicy: {
                  ...s.domesticPolicy,
                  land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 15)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 10),

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
              let newClasses = s.classes;
              newClasses = adjustClassSupport(newClasses, 'Braceros', 'CNT_FAI', 8);
              const newFactions = adjustFactionInfluence(s.factions, 'Treintistas', 8);
              return {
                agricultural_policy_timer: 6,
                classes: newClasses,
                factions: newFactions,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  min_wage: clampLawLevel('min_wage', s.domesticPolicy.min_wage + 1)
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
              const newFactions = adjustFactionDissents(s.factions, {
                Faistas: 10,
                Puristas: 10
              });
              return {
                agricultural_policy_timer: 6,
                factions: newFactions
              };
            }
          },
          // Economy reform: the four peacetime and two wartime agrarian levers
          // (docs/经济改造方案.md §6.5). The five agricultural counters are uncapped, so
          // these conditions only check whether acting still makes sense — never a cap.
          {
            text: 'Organize agricultural cooperatives.',
            textZh: '组织农业合作社',
            subtitle: 'Purchasing societies, shared machinery and a cooperative warehouse in every district that will have one. Requires 1 resource.',
            subtitleZh: '在每个愿意的区建立采购社、共用机械与合作社仓库。需要 1 资源。',
            condition: (s: GameState) => s.resources >= 1,
            unavailableSubtitle: () => 'Requires 1 resource.',
            unavailableSubtitleZh: () => '需要 1 资源。',
            effect: (s: GameState) => {
              const next = { ...s, ...applyEconomicOption(s, 'agricultural_cooperative') } as GameState;
              const level = getEconomyCounter(next, 'agricultural_cooperative');
              let classes = adjustClassSupport(s.classes, 'Braceros', 'CNT_FAI', 2);
              classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', 1);
              if (level >= 3) {
                classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 4);
              }
              if (level >= 5) {
                classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', 3);
              }
              return {
                resources: s.resources - 1,
                agricultural_policy_timer: 6,
                ...applyEconomicOption(s, 'agricultural_cooperative'),
                classes
              };
            }
          },
          {
            text: 'Buy the land instead of seizing it.',
            textZh: '以赎买方式取得土地',
            subtitle: 'Compensated expropriation of the great estates. Expensive, slow, and the only version the yeomanry will not shoot at. Costs 3M.',
            subtitleZh: '对大庄园实行有补偿的征收。昂贵、缓慢，也是自耕农唯一不会朝它开枪的版本。花费 3M。',
            condition: (s: GameState) => s.budget >= 3,
            unavailableSubtitle: () => 'Requires 3M in the treasury.',
            unavailableSubtitleZh: () => '需要国库现金 3M。',
            effect: (s: GameState) => {
              let classes = adjustClassSupport(s.classes, 'Labradores', 'CNT_FAI', 5);
              classes = adjustClassSupport(classes, 'Latifundistas', 'CNT_FAI', -2);
              return {
                budget: Math.max(0, s.budget - 3),
                agricultural_policy_timer: 6,
                ...applyEconomicOption(s, 'land_redemption'),
                domesticPolicy: {
                  ...s.domesticPolicy,
                  land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 5)
                },
                classes
              };
            }
          },
          {
            text: 'Promote voluntary collectivization.',
            textZh: '推行自愿集体化',
            subtitle: 'Farms that choose to merge do so with their own hands on the deed. Requires 1 resource.',
            subtitleZh: '选择合并的农户，地契由他们自己按手印。需要 1 资源。',
            condition: (s: GameState) => s.resources >= 1,
            unavailableSubtitle: () => 'Requires 1 resource.',
            unavailableSubtitleZh: () => '需要 1 资源。',
            effect: (s: GameState) => {
              const next = { ...s, ...applyEconomicOption(s, 'land_voluntary_collectivization') } as GameState;
              const level = getEconomyCounter(next, 'land_voluntary_collectivization');
              let classes = adjustClassSupport(s.classes, 'Braceros', 'CNT_FAI', 5);
              classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', -1);
              return {
                resources: s.resources - 1,
                agricultural_policy_timer: 6,
                ...applyEconomicOption(s, 'land_voluntary_collectivization'),
                factions: level >= 3 ? adjustFactionInfluence(s.factions, 'Faistas', 4) : s.factions,
                domesticPolicy: {
                  ...s.domesticPolicy,
                  land_reform_progress: Math.min(100, s.domesticPolicy.land_reform_progress + 4)
                },
                classes
              };
            }
          },
          {
            text: 'Requisition the harvest for the front.',
            textZh: '为前线征发收成',
            subtitle: 'Wartime only. Fixed prices, armed collection parties, and a countryside that will remember both.',
            subtitleZh: '仅限战时。固定价格、武装征发队，以及一个会把这两样都记住的乡村。',
            condition: (s: GameState) => getEconomyCounter(s, 'wartime_requisition') < 1
              && s.civilWarStatus === 'ongoing',
            unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'wartime_requisition') >= 1
              ? 'Requisition is already in force.'
              : 'Only available while the civil war is ongoing.'),
            unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'wartime_requisition') >= 1
              ? '强制征发已经在实行。'
              : '仅在内战进行中可用。'),
            effect: (s: GameState) => {
              let classes = adjustClassSupport(s.classes, 'Braceros', 'CNT_FAI', 5);
              classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', -8);
              return {
                agricultural_policy_timer: 6,
                ...applyEconomicOption(s, 'wartime_requisition'),
                classes
              };
            }
          },
          {
            text: 'Issue family ration books.',
            textZh: '推行家庭口粮本配给',
            subtitle: 'Wartime only. Every household gets a book; the black market gets a price list. Adds 120 supplies to the war stock.',
            subtitleZh: '仅限战时。每家一本，黑市得到一份价目表。战时军需 +120 补给。',
            condition: (s: GameState) => getEconomyCounter(s, 'family_rationing') < 1
              && s.civilWarStatus === 'ongoing',
            unavailableSubtitle: (s: GameState) => (getEconomyCounter(s, 'family_rationing') >= 1
              ? 'Ration books are already issued.'
              : 'Only available while the civil war is ongoing.'),
            unavailableSubtitleZh: (s: GameState) => (getEconomyCounter(s, 'family_rationing') >= 1
              ? '口粮本已经发行。'
              : '仅在内战进行中可用。'),
            effect: (s: GameState) => {
              const warFaction = s.iberianDefense ? MapFaction.IBERIAN_DEFENSE : MapFaction.REPUBLICAN;
              const stock = s.mapResources?.[warFaction];
              return {
                agricultural_policy_timer: 6,
                // Ration books redistribute food, not title deeds: no ownership transfer.
                ...(stock
                  ? {
                      mapResources: {
                        ...s.mapResources,
                        [warFaction]: { ...stock, supplies: stock.supplies + 120 }
                      }
                    }
                  : {}),
                classes: adjustClassSupport(s.classes, 'PequenaBurguesia', 'CNT_FAI', -3)
              };
            }
          }
        ]
      }
    };
  }
};
