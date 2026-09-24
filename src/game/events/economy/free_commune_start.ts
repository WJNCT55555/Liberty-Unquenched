import type { GameEvent } from '../../types';
import { activateJournal } from '../../rules/journalEvents';

/**
 * 自由公社路线的开始事件（docs/经济改造方案.md §5.2）。
 *
 * 草案要求"任一开局均自带此日志"，但日志不能自我激活（事件—日志—事件契约第 1 条），
 * 所以由月结管线在开局月强制入队（`rules/monthlyPipeline.ts` 的
 * `forceFreeCommuneStartNextMonth`），这里的事件只有一个确认选项。
 */
export const economyFreeCommuneStart: GameEvent = {
  id: 'economy_free_commune_start',
  meta: { category: 'cnt', flow: 'solo', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'The Land Question Is Already Decided',
  titleZh: '土地问题其实已经定了',
  description: 'Long before the Cortes gets round to a land law, the villages have been deciding the question themselves: estates occupied, boundaries redrawn, harvests taken in common. Nobody in Madrid ordered it. Nobody in Madrid can stop it. The National Committee can either claim this movement or watch it happen without a name. "Tierra y Libertad" is on every wall already — the only question is whether the confederation is willing to be responsible for what it means.',
  descriptionZh: '在议会想起要立土地法之前很久，村庄们就已经自己把问题解决了：庄园被占、地界重划、收成归公。马德里没有人下令，也没有人拦得住。全国委员会要么认领这场运动，要么看着它在没有名字的情况下发生。「土地与自由」已经写满了每一面墙——唯一的问题是，联合会愿不愿意为它的含义负责。',
  options: [
    {
      text: 'Take responsibility. The land belongs to those who work it.',
      textZh: '认领它。土地属于耕种它的人。',
      effect: (state) => ({
        ...activateJournal(state, 'journal_economy_free_commune')
      })
    }
  ]
};
