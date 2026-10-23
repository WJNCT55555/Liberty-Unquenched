import { Advisor } from '../types';

export const franciscoAscaso: Advisor = {
  id: 'Francisco Ascaso',
  name: 'Francisco Ascaso',
  nameZh: '弗朗西斯科·阿斯卡索',
  faction: 'Faistas',
  description: 'Anarchist militant and key member of "Los Solidarios" alongside Durruti. Known for his unflinching bravery, he died leading the heroic assault on the Atarazanas barracks in Barcelona during the July 1936 uprising.',
  descriptionZh: '无政府主义铁血战士、“团结者”的核心骨干、杜鲁蒂最亲密的手足战友。以无比的英勇著称，在1936年7月巴塞罗那战役中，他在率众冲锋强攻阿塔拉萨纳斯兵营时壮烈牺牲。',
  image: 'img/Advisors/Francisco_Ascaso.png',
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
    }
  ]
};
