import type { GameEvent } from '../../types';
import { activateJournal } from '../../rules/journalEvents';

/**
 * 土地集体化日志的开始事件（经济改造方案 §13、工人控制度改造方案 §4.6）。
 *
 * 入口条件**两侧都要成立**（方案 §13）：土地改革已经走到一半 —— 地先分下去，
 * 才谈得上"分到的地怎么种" —— 并且玩家已经在集体化上投过至少一次
 * （自愿或强制，两条路都算）。土地改革**完成**自然也满足"过半"。
 *
 * 之所以不再让"投过一次集体化"单独开门：这本日志的失败条件是土地改革本身失败
 * （见 journal/land_collectivization.ts），在土改毫无进展时就开门，等于发一本
 * 随时会被拆掉的日志给玩家。
 */
export const landCollectivizationStart: GameEvent = {
  id: 'land_collectivization_start',
  meta: { category: 'cnt', flow: 'solo', series: ['economy', 'land'], tags: ['journal'] },
  condition: (state) => (
    state.journal?.['journal_land_collectivization']?.status === 'inactive'
    && (
      state.journal?.['journal_land_reform']?.status === 'completed'
      || (state.domesticPolicy?.land_reform_progress ?? 0) >= 50
    )
    && (
      (state.land_forced_collectivization ?? 0) >= 1
      || (state.land_voluntary_collectivization ?? 0) >= 1
    )
  ),
  title: 'The Fields Must Be Worked Together',
  titleZh: '田要一起种',
  description: 'Redistribution is done: the estates are broken up and the tenants have their deeds. It has changed nothing about how the land is farmed. A hundred smallholders with a hundred opinions cannot buy a threshing machine, cannot hold a price, and cannot be planned for. The syndicates of Aragon have begun pooling the plots themselves — do the villages do this, or does the movement decide that the agrarian question is settled and stop?',
  descriptionZh: '重新分配已经完成：庄园被拆散，佃农拿到了地契。但这没有改变土地怎么种。一百个各持己见的小农买不起一台脱粒机、撑不住一个价格，也没法被纳入计划。阿拉贡的工团已经开始自己把地块合起来——是让村庄自己做这件事，还是由运动宣布农业问题已经解决、就此停下？',
  options: [
    {
      text: 'Pool the land. The village works it as one holding.',
      textZh: '把土地合起来。全村作为一个经营单位来种。',
      subtitle: 'Opens the Collectivization of the Land journal: agricultural collectives must reach 65% of the land.',
      subtitleZh: '开启「土地集体化」日志：农业集体必须占到全部土地的 65%。',
      effect: (state) => ({
        ...activateJournal(state, 'journal_land_collectivization')
      })
    },
    {
      text: 'Leave the plots as they are. Redistribution was enough.',
      textZh: '维持小块经营。重新分配已经够了。',
      subtitle: 'The journal stays closed; the countryside keeps its smallholders — and its votes.',
      subtitleZh: '日志不开启；乡村保留它的自耕农，也保留它的选票。',
      effect: () => ({})
    }
  ]
};

/**
 * 完成事件（`completionEventId`）。数值由日志的 `onComplete` 结算，这里只叙事
 * 与确认一个需要玩家点头的状态转换：是否把集体农庄写进运动的农业纲领。
 */
export const landCollectivizationComplete: GameEvent = {
  id: 'land_collectivization_complete',
  meta: { category: 'cnt', flow: 'inline.leaf', series: ['economy', 'land'], tags: ['journal'] },
  condition: () => false,
  title: 'The Boundaries Come Up',
  titleZh: '界石拔掉了',
  description: 'Two thirds of the land of the districts we hold is now worked in common. It did not happen by decree: village by village, the assemblies voted to take up the boundary stones, and the syndicate sent a mechanic and a bookkeeper. The machine stations work across four villages. The harvest is reckoned once, in one ledger, by men who will eat what it yields.\n\nThe yeomanry did not all agree, and the ones who did not agree have not forgotten.',
  descriptionZh: '在我们控制的地区，三分之二的土地现在共同经营。这不是靠法令完成的：一个村一个村地，大会投票决定拔掉界石，工团派来一名机械师和一名记账员。农机站在四个村之间轮转。收成只核算一次，记在一个账本上，由将要吃这些粮食的人记。\n\n自耕农并不都同意，而不同意的人没有忘记。',
  options: [
    {
      text: 'Write the collective farm into the movement\'s agrarian programme.',
      textZh: '把集体农庄写进运动的农业纲领。',
      subtitle: 'Makes collectivization the confederation\'s official line. The yeomanry\'s distrust hardens into opposition.',
      subtitleZh: '把集体化定为联合会的正式路线。自耕农的不信任会固化为敌意。',
      effect: (state) => ({
        classes: state.classes,
        stats: {
          ...state.stats,
          bureaucratization: Math.min(100, state.stats.bureaucratization + 4),
        }
      })
    },
    {
      text: 'Keep it as the practice of the villages. Say nothing.',
      textZh: '让它保持为村庄自己的做法。什么也不说。',
      subtitle: 'No programme, no new enemies; the collectives stay the peasants\' own business.',
      subtitleZh: '不立纲领，不制造新敌人；集体农庄仍然是农民自己的事。',
      effect: () => ({})
    }
  ]
};

/**
 * 失败事件（`failureEventId`）：土地改革本身失败，集体化失去依托。
 */
export const landCollectivizationAbandoned: GameEvent = {
  id: 'land_collectivization_abandoned',
  meta: { category: 'cnt', flow: 'inline.leaf', series: ['economy', 'land'], tags: ['journal'] },
  condition: () => false,
  title: 'The Collectives Are Unwound',
  titleZh: '集体农庄被拆散',
  description: 'The reform collapsed, and the collectives rested on it. The deeds that were issued are being contested in the courts, the machine stations have been sold to pay for the compensation the Republic promised, and the villages that pooled their land are being told to divide it again. The syndicates will not be able to organize the countryside for a long time.',
  descriptionZh: '改革垮了，而集体农庄建立在它之上。已经发出去的地契正在法院里被争夺，农机站被卖掉以偿付共和国承诺的补偿，而那些把土地合起来的村庄正被要求重新分地。工团在很长一段时间里都无法再组织乡村。',
  options: [
    {
      text: 'Note it and go back to the villages.',
      textZh: '记下这件事，回到村庄去。',
      effect: () => ({})
    }
  ]
};
