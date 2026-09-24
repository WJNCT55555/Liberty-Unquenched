import type { GameEvent } from '../../types';

/**
 * 战时两条经济路线的失败事件（docs/经济改造方案.md §5.7①、§7.3）。
 *
 * 唯一的失败原因：对方先完成。两个事件都**只叙事**——日志的 `onFail` 返回空补丁，
 * 输掉这场内部竞争本身就是代价（该路线的 activeEffect 持续收益归零）。
 */

export const economyWarEffortConceded: GameEvent = {
  id: 'economy_war_effort_conceded',
  meta: { category: 'war', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'The Committees Are Absorbed',
  titleZh: '统筹委员会被并吞',
  description: 'The militarized boards got there first. The distribution committees still exist on paper, but their chairmen now sit in an office that answers to the general staff, and the price they set is the price the staff needs. Nobody dissolved them. They simply stopped being the body that decides.\n\nThe unions will remember this. So will the men who argued that a war economy should be run by the people who eat the bread, not by the people who fire the guns.',
  descriptionZh: '军事化生产委员会先做出了成绩。分配委员会在纸面上仍然存在，但他们的主席如今坐在一间向总参谋部负责的办公室里，他们定的价格就是参谋部需要的价格。没有人解散他们。他们只是不再是要做决定的那个机构了。\n\n工会会记住这件事。那些主张"战时经济应当由吃面包的人来管、而不是由开炮的人来管"的人也会记住。',
  options: [
    {
      text: 'Note it and move on. The front comes first.',
      textZh: '记下这件事，继续往前走。前线优先。',
      effect: () => ({})
    }
  ]
};

export const economyRevolutionaryWarConceded: GameEvent = {
  id: 'economy_revolutionary_war_conceded',
  meta: { category: 'war', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  condition: () => false,
  title: 'The Boards Yield the Floor',
  titleZh: '生产委员会让位',
  description: 'The coordination committees got there first. The militaried boards keep their officers and their production schedules, but the question of who sets the priorities has been settled in the unions\' favour: requisition, rationing and the single foreign trade office now run the war economy, and the staff is informed rather than consulted.\n\nThe Communists will call it a defeat for the war effort. The FAI will call it a victory for the revolution. Both will be partly right, which is what a compromise looks like in a war.',
  descriptionZh: '统筹委员会先做出了成绩。军事化生产委员会保留了他们的军官与生产计划，但"谁定优先级"这个问题已经以工会的胜利告终：征发、配给与那个唯一的对外贸易衙门现在掌管着战时经济，而参谋部是被通知的，不是被咨询的。\n\n共产党会把这称作战争努力的失败。FAI 会把这称作革命的胜利。两边都对了一半——战争里的妥协就是这个样子。',
  options: [
    {
      text: 'Note it and move on. The unions run the rear.',
      textZh: '记下这件事，继续往前走。后方归工会。',
      effect: () => ({})
    }
  ]
};
