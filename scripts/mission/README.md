# Mission Runner（带任务的无头试玩）

一句话：**给脚本一个目标（成就 / 日志 / 结局 / 计数器），它自己玩，最后告诉你达成了没有、
用了几个月、以及没达成时差在哪。**

```bash
npm run mission -- --list                       # 看所有任务
npm run mission -- --id collectivize-1936       # 跑一条，打印报告
npm run mission -- --all                        # 跑全部，按各任务声明的 expect 判定
npm run mission -- --id collectivize-1936 --json        # 机器可读
npm run mission -- --id collectivize-1936 --policy beam --width 3 --months 60
npm run test:missions                           # CI 入口（含随机性可复现的元测试）
```

## 它为什么能跑

游戏本身是"纯函数 + 固定步骤"，脚本走的就是玩家走的那条路：

| 环节 | 用的东西 |
| --- | --- |
| 开局 | `createScenarioState(scenario, difficulty, 'zh')`（与 `START_GAME` 同源） |
| 打牌 | `gameReducer(state, { type: 'PLAY_CARD', payload: card })` —— reducer 不要求卡在手牌里，所以路线由策略决定，不由洗牌决定 |
| 顾问行动 | `RESOLVE_EVENT` + 扣 1 AP（与 `AdvisorPanel` 完全一致） |
| 事件 | `SELECT_EVENT` / `RESOLVE_EVENT`（选项就是 `option.effect`） |
| 过月 | `NEXT_PHASE` → 月结 / 战争阶段（**注意**：还有待处理事件时 `advancePhase` 会拒绝推进，所以每步之后都要把事件清干净） |
| 判定 | 成就用 `achievementConditions.ts`（纯函数表）、日志用 `state.journal[id].status`、结局用 `state.ending` |

随机性：所有 `Math.random` 都收口到 `src/game/rules/rng.ts`，任务用固定 seed
（`setRng(createSeededRng(seed))`），同一个 seed 必然跑出同一局——
`test-missions.ts` 里有一条元测试专门盯这件事。

## 三种策略

| 策略 | 怎么走 | 适合 |
| --- | --- | --- |
| `script` | 按给定步骤打（卡 id + 选项下标或文本匹配） | 固化"通关路线"、写回归用的最短路线 |
| `greedy` | 每个行动点枚举所有可用行动，各模拟到事件解决完，取目标分最高的一个；分数不再提升就放弃这个月的剩余 AP | 通用：完成某条日志、拿某个成就 |
| `beam` | 每月保留 `width` 条最优路线 | 需要绕路的局面（贪心会被局部最优卡住） |

## 目标的四种写法

```ts
goals: [
  { kind: 'journal', id: 'journal_land_collectivization' },      // 完成某本日志
  { kind: 'achievement', id: 'A_MONEY_ENDS' },                   // 解锁某成就
  { kind: 'ending', id: ENDINGS.POPULAR_FRONT },                 // 走到某个结局
  { kind: 'counter', id: 'rail_nationalization', atLeast: 3 },   // 某计数器到 N
  { kind: 'flag', id: 'x', test: (s) => Boolean(s.mayDays?.settlement) }, // 自定义
]
```

`expect` 决定 CI 怎么判：`pass`（必须达成）、`unreachable`（必须给出**结构性**证据）、
`any`（只要求跑完不报错，用来看缺口报告）。

## 长链条任务：里程碑、自定义事件、顾问计划

长链条目标（入阁 → 拿部委 → 建党 → 国有化 → 完成日志）中间每一步都不是目标，
但少了梯度，贪心策略在第一步就会停下。三个钩子解决这件事：

```ts
milestones: [
  { kind: 'flag', id: 'm-cnt-in-government', labelZh: 'CNT 入阁',
    test: (s) => s.cntStance === 'govern', weight: 4 },   // weight 默认 1
],
/** 由自定义界面结算的事件（`options: []`），例如 1931 选举后的「部长分配」 */
customResolutions: {
  minister_allocation: (state) => ({ leverage: 0, ministers: { ...state.ministers, industry: 'CNT' }, currentEvent: null }),
},
/** 需要常驻的顾问：有空位就上任，没位子就换掉一个不在计划里的顾问 */
advisorPlan: ['Ángel Pestaña'],
```

- **里程碑只进分数，不进判定**（`missionScore = 目标均分 + 0.35 × 里程碑加权均分`），
  报告里单独一节列出达成情况；
- **自定义事件结算**必须由任务显式声明，通用策略绝不替玩家做这种决定；
- 引擎会自动点掉**超级事件**（`superEvent`，例如 1936·7 的"内战爆发"全屏通告），
  并在轨迹里留一行 `super-event:spanish_civil_war`——不点掉它，`civilWarSetup` 永远不会入队，
  1931／1933 的长局会一路和平到 1939 年。

## 报告里有什么

- **verdict**：`passed` / `timeout` / `unreachable` / `error`；
- **缺口清单**：每个目标的状态、进度、相关份额读数、以及涉及的计数器次数；
- **受阻的推进手段**（最有用的部分）：那些"本来能推进目标、但 condition 不满足"的卡与
  顾问行动。例如探路任务会直接告诉你"`fiscal_measures` 本可推进废除货币，但打不出来（条件未满足）"；
- **局面读数**：日期、阶段、内战状态、结局、资源/军备；
- **行动轨迹**：每月做了什么、每一步之后的目标分。

## 结构性不可达怎么证明

不是"搜不到就说不可达"。`engine.proveUnreachable` 会构造状态去问日志自己的
`checkStatus`：若"日志 A 已完成"会让"日志 B"返回 `failed`，两者就不可能同时完成。
`wartime-routes-exclusive` 任务就是这么证明战时两条路线无法同时完成的
（原先挂在成就「六条路」上，该成就因此已删除）。

## 已知边界

- 需要**部委**才能打的卡（财政手段、工业与商业、商业与贸易、农业政策）要求
  `cntStance === 'govern'` **且**对应部委是 CNT；而战时内阁虽然给 CNT 部长席位，
  并不会把 `cntStance` 改成 `govern`——两者的口径不一致，见下面"跑出来的结论"。
- 1931／1933 的内战只在 `historical` 难度下按 1936·7 触发；普通难度下不会爆发内战，
  1939 年以"沉默的共和国"和平结局收场（`endings.ts` 的时间上限）。需要战时上限的
  目标必须用 `historical`。
- 战争地图（`phase: 'war'`）目前只做"结束回合"，没有军事策略；结局类任务因此只能探路。
- 每月行动上限取 `actionsLeft`；沙盒式预置（`SANDBOX_EDIT`）默认不允许使用。

## 跑出来的结论（`prrevs-syndicalist-1931`，2026 年那次）

脚本能走到：入阁（1931 选举）→ 工业部＋农业部 → 佩斯塔尼亚在任 → PRRevS 建设 4 级 →
官僚化 ≥50 → 铁路国有化 ×3、煤炭 ×2、外资没收 ≥2 → 工业国有制 25%、工业社会化 38% →
内战爆发 → 抵达结局。**走不完的是 PRRevS 本身与温和工团日志**，卡在三处：

1. **战前工业社会化上限 16%，路线必须等到内战**；而普通难度下 1931／1933 根本没有内战；
2. **政府危机（`centralize`）会把 CNT 逐出内阁并把 `cntStance` 降级为 `cooperate`**
   ——之后 `industry_policy`、PRRevS、所有部委卡一起锁死，脚本无法避免（事件驱动）；
   此时 `ministers` 里仍可能写着 `CNT`，与 `cntStance` 自相矛盾；
3. PRRevS 需要"三十人集团影响 > 60"，而所有顾问行动共享同一个 6 个月冷却，
   与"建设党（4 次）"互相排队。

