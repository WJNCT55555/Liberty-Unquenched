import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const aurelioFernandez: Advisor = {
  id: 'Aurelio Fernández Sánchez',
  name: 'Aurelio Fernández Sánchez',
  nameZh: '奥雷利奥·费尔南德斯·桑切斯',
  faction: 'None',
  description: 'A key militant of the FAI and member of "Los Solidarios". He played a major role in the defense committees of Barcelona and directed the revolutionary public order and intelligence services during the uprising.',
  descriptionZh: 'FAI的关键战术成员，“团结者”的核心干骨。他在巴塞罗那总工会防御委员会（Comitès de Defensa）中扮演主导角色，并在起义胜利后负责筹建战时革命治安与调查情报事务（Servicios de Investigación）。',
  image: 'img/Advisors/Aurelio_Fernandez_Sanchez.png',
  actions: [
    {
      id: 'aurelio_defense_committees',
      title: 'Defense Committees Intelligence',
      titleZh: '统筹防御治安侦察',
      subtitle: 'Mobilize secret intelligence networks to preempt sabotage and military movements.',
      subtitleZh: '依托总工会侦察科与街区自卫网络，提前探知保皇军官与右翼破坏分子的异动。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 6);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            anarchistMilitia: Math.min(100, state.stats.anarchistMilitia + 8),
            armyLoyalty: Math.min(100, state.stats.armyLoyalty + 3)
          }
        };
      },
      description: 'By organizing a central command of intelligence under the defense committees, we have intercepted several conspiratorial letters among anti-republican garrisons.',
      descriptionZh: '通过在防御委员会下设立集中的调查科网络，我们截获了若干反动军官的密信，提前挫败了部分国民卫队的密谋破坏行为。',
    },
    {
      id: 'aurelio_patrol_control',
      title: 'Revolutionary Patrols',
      titleZh: '部署人民治安巡逻',
      subtitle: 'Reorganize local union patrols to police streets and control fifth-column subversions.',
      subtitleZh: '编组本港和主要劳动街区纠察警卫突击队，压制暗杀事件并肃清内贼。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10)
        }
      }),
      description: 'By substituting standard, untrusted municipal police with armed workers from the Patrol Control (Patrullas de Control), we restored order while preserving revolutionary authority.',
      descriptionZh: '以治安巡逻队（Patrullas de Control）的武装工人取代名存实亡的旧警宪，在强力压制右翼第五纵队暗害活动的同时间接树立了革命的无产阶级秩序。',
    },
    {
      id: 'aurelio_militia_requisition',
      title: 'Direct Armaments Mobilization',
      titleZh: '战术工业与防务募捐',
      subtitle: 'Initiate targeted union requisitions to supply frontline militia columns.',
      subtitleZh: '动员各行会行使紧急征调，全力筹建保障远征民兵支队所需的大量后勤。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        armaments: state.armaments + 15,
        resources: state.resources + 3,
        stats: {
          ...state.stats,
          workerControl: Math.min(100, state.stats.workerControl + 5)
        }
      }),
      description: 'Our radical requisition actions on metalwork sectors turned private warehouses into dynamic armaments hubs, providing immediate ammunition to the front.',
      descriptionZh: '我们强力组织各金属和五金街区行会转产，将私营金属库直接化为前线急需的防御设施与弹药保障基地，大大充实了武器库。',
    }
  ]
};
