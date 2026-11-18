import { Advisor } from '../types';
import { armsAcquisition } from '../military_affairs/arms_acquisition';

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
      subtitle: 'Open the Arms Acquisition decision immediately, ignoring its current cooldown; the card then goes on cooldown as usual.',
      subtitleZh: '直接进入「军备获取」决策，无视其当前冷却；进入后该卡照常进入冷却。',
      unavailableSubtitle: (state) => state.resources < 1
        ? 'Requires at least 1 resource.'
        : `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => state.resources < 1
        ? '需要至少 1 资源。'
        : `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0 && state.resources >= 1,
      effect: (state) => {
        const result = armsAcquisition.effect(state);

        return {
          advisorActionTimer: 6,
          // The entry ignores whatever cooldown the card is under, then locks it again:
          // the advisor route spends the card's timer just like playing the card does.
          arms_acquisition_timer: 6,
          currentEvent: result.currentEvent
        };
      },
      description: 'The underground channels are open: weapons can be bought across the French border this month, whatever the ministry has decreed.',
      descriptionZh: '地下渠道已经打开：不管部里怎么规定，这个月总能从法国边境买到武器。',
    }
  ]
};
