import type { GameEvent, GameState } from '../../types';

/**
 * 废除货币（docs/经济改造方案.md §7.5）。
 *
 * 由「财政手段」卡「废除货币」选项的**第三级**推入（选项效果里写 `currentEvent`）。
 * 需要玩家确认的状态转换写在这里；计数器与月度修正已经在选项效果里落账，本事件不重复结算。
 */
export const currencyAbolished: GameEvent = {
  id: 'currency_abolished',
  meta: { category: 'cnt', flow: 'inline.leaf', series: ['economy'], tags: ['journal'] },
  // 只由卡牌选项推入，不参与事件板调度。
  condition: () => false,
  title: 'The End of Money',
  titleZh: '货币的终结',
  description: 'Catalonia has been paying wages in vouchers for a year; Aragon settles accounts in kind and records the difference on a page. Between them they cover most of the industrial economy the confederation actually controls. The question on the table is no longer whether this works in a village, but whether the National Committee is prepared to say out loud that the peseta is finished — knowing that the Republic\'s collectors will find nothing left to tax in the districts that follow us.',
  descriptionZh: '加泰罗尼亚已经用工资券发了一年薪水；阿拉贡以实物结账，差额记在一页纸上。两者合起来，覆盖了联合会实际掌握的工业经济的绝大部分。摆在桌上的问题不再是"这在村里行不行得通"，而是全国委员会是否准备公开宣布比塞塔已经作废——同时清楚：凡是跟着我们走的地区，共和国的税务员将再也收不到东西。',
  options: [
    {
      text: 'Declare it. Money is abolished in the liberated districts.',
      textZh: '就这样宣布。在解放区废除货币。',
      subtitle: 'Irreversible. The Republic loses much of its consumption tax base in the districts we hold.',
      subtitleZh: '不可逆。共和国在我们控制的地区失去大部分消费税税基。',
      effect: (): Partial<GameState> => ({
        // 唯一的写入口：消费税税基乘数与"已经废除货币"的旗标都由这里决定
        //（`rules/economyReforms.ts` 读 counters >= 3 **且** 本旗标，见方案 §7.5）。
        currency_abolished_declared: true
      })
    },
    {
      text: 'Keep the peseta for external settlement only.',
      textZh: '保留比塞塔，但只用于对外结算。',
      subtitle: 'Protects the Republic\'s tax base. The three levels already spent are not refunded, and this question will not be raised again.',
      subtitleZh: '保住共和国的税基。已经投入的推进不会退回，此问题也不再提出。',
      effect: (): Partial<GameState> => ({})
    }
  ]
};
