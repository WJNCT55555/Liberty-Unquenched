import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const franciscoAscaso: Advisor = {
  id: 'Francisco Ascaso',
  name: 'Francisco Ascaso',
  nameZh: '弗朗西斯科·阿斯卡索',
  faction: 'Faistas',
  description: 'Anarchist militant and key member of "Los Solidarios" alongside Durruti. Known for his unflinching bravery, he died leading the heroic assault on the Atarazanas barracks in Barcelona during the July 1936 uprising.',
  descriptionZh: '无政府主义铁血战士、“团结者”的核心骨干、杜鲁蒂最亲密的手足战友。以无比的英勇著称，在1936年7月巴塞罗那战役中，他在率众冲锋强攻阿塔拉萨纳斯兵营时壮烈牺牲。',
  image: 'img/Advisors/Juan_Garcia_Oliver.png',
  actions: [
    {
      id: 'ascaso_clandestine_network',
      title: 'Clandestine Armaments',
      titleZh: '地下武装整备',
      subtitle: 'Utilize underground contacts to secure arms cash and ammunition lines.',
      subtitleZh: '通过地下渠道秘密筹措枪支器械与弹药存量。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0 && state.resources >= 2,
      effect: (state) => ({
        advisorActionTimer: 6,
        resources: state.resources - 2,
        armaments: state.armaments + 25,
        stats: {
          ...state.stats,
          anarchistMilitia: Math.min(100, state.stats.anarchistMilitia + 5)
        }
      }),
      description: 'By spending reserves on underground channels, we have distributed a massive quantity of pistols and carbines to neighborhood defense cadres.',
      descriptionZh: '将部分公积储备拨给地下采购渠道，为各街区自卫委员会与劳动纠察哨分发了大量手枪和卡宾短枪。',
    },
    {
      id: 'ascaso_insurrectionary_call',
      title: 'Insurrectionary Agitation',
      titleZh: '革命先锋动员',
      subtitle: 'Mobilize workers through aggressive street action and anti-state strikes.',
      subtitleZh: '进行强力罢工和街头战斗组织，拉升工人群体的绝对反抗信念。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Faistas', 8);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15)
          }
        };
      },
      description: 'The state has tremors when the workers march. Outright confrontation forces the ruling classes to yield, rallying workers across the country.',
      descriptionZh: '工人在街头前进时反动国家便暴露出懦弱性，绝对的直接对决逼迫统治集团节节败退，更激发了全国劳动大众的联合斗志。',
    },
    {
      id: 'ascaso_defense_drills',
      title: 'Ready Shock Columns',
      titleZh: '决死防区合练',
      subtitle: 'Train local defense groups in urban combat and barricade maneuvers.',
      subtitleZh: '指导基层各防线民兵与行动小组突击合练，极大提升决死御侮战力。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          anarchistMilitia: Math.min(100, state.stats.anarchistMilitia + 12),
          armyLoyalty: Math.max(0, state.stats.armyLoyalty - 5)
        }
      }),
      description: 'Barricades and urban guerrilla tactics are perfected. The military staff watches with deep paranoia as unions assemble forces that mock standard garrisons.',
      descriptionZh: '精心研习了设障垒、断通衢等都市巷战战术。正规军大本营深感不安，因为发现我们自发的街区防务力量远超普通驻屯警备军。',
    }
  ]
};
