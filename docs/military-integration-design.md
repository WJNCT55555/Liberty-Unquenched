# 《自由未烬》军事系统整合设计文档

**军备·民兵（战前修正） × 人民阵线战时联盟 × 内战决裂与三方化**

- 版本：v1.1（设计定稿，待实现）
- 状态：设计文档 —— 非代码改动
- 范围：本期 = 1936 内战线（西班牙内战）；阿斯图里亚斯（1934 早战线）后置，引擎预留参数位
- 关联源码基线：当前 `main` 工作区（React 19 + TS 5.8，逻辑全在浏览器端）

---

## 目录

1. [背景与问题](#1-背景与问题)
2. [目标与非目标](#2-目标与非目标)
3. [设计原则](#3-设计原则)
4. [术语表](#4-术语表)
5. [整体方案](#5-整体方案)
6. [支柱详设 A–F](#6-支柱详设-af)
7. [涉及改动的现有模块（文件级清单）](#7-涉及改动的现有模块文件级清单)
8. [分期修改计划（Phase A / B / C）](#8-分期修改计划phase-a--b--c)
9. [实施步骤（先后顺序与每步验证）](#9-实施步骤先后顺序与每步验证)
10. [数值占位与校准清单](#10-数值占位与校准清单)
11. [兼容性、测试与风险](#11-兼容性测试与风险)
12. [Backlog（未来扩展）](#12-backlog未来扩展)
13. [附录：锁定决策总表](#13-附录锁定决策总表)

---

## 1. 背景与问题

### 1.1 现状摘要（来自源码审阅）

游戏存在五层并行军事/准军事子系统，挂在同一个扁平的 `GameState` 上（`src/game/types.ts`）：

| 层 | 代表 | 现状问题 |
|---|---|---|
| L1 议会/军心政治 | `stats.armyLoyalty`、`coupProgress`、`armedForces.regularArmy/guardia*`、`ministers.war` | 只决定"打不打" |
| L2 CNT 地下军事 | `resources/armaments`、`armedForces.militias.*`、`militiaCombatPower`、`tankResearch*`、`internationalBrigades` | **几乎不被战争消费**（成就与展示之外零读取） |
| L3 国家财政 | `budget/gold/debt/fx/military_spending` | 只折算 `armyLoyalty` 与宏观支出，与地图经济无通道 |
| L4 地图战略 | `mapResources/provinces/armies/mapCurrentPlayer/activeWar` | 自成一体的棋盘 |
| L5 战争叙事 | `civilWarStatus/wars/superEvent/civilWarChoices` | 靠事件链与后置归一化驱动 |

关键审阅结论（细节见《军事系统架构与设计审阅报告》）：

1. **零通道**：L2（五年备战）与 L4（内战地图）不互通——内战开局军队是硬编码常量（`civil_war_setup.ts:25-203` 等），对 `armedForces/militiaCombatPower/armaments/tankResearch/internationalBrigades` 零引用。
2. **身份错位**：玩家是 CNT-FAI，战时却指挥"整个共和国/工人联盟"这一多党派国家，民兵没有落点。
3. **三份实现**：征募/整编/建设的费用与校验在 `costs.ts` → `mapReducer.ts` → `GameContext.executeAiTurn` → `Sidebar.tsx` 复制 4 次，已有口径漂移（士气整编 UI"×1.2" vs reducer"+20"等）。
4. **事件直写地图**：`asturias_revolution.ts`、`civil_war_setup.ts` 直接整块覆写 `provinces/armies`，绕过地图 reducer 守卫；三处"谁叛变"省份名单靠手抄保持。
5. **地图图论缺陷**：13 个省无邻接（摩洛哥、巴利阿里、加那利、oviedo 单向等），`rep_africa`（非洲军团 6000 人）被困 tetouan 无法入场。
6. **坦克储备单漏斗**：月度仅共和国 +1（`monthlyPipeline.ts:48`），AI normal/hard 编制含 50/150 坦克导致 AI 招募永远被静默否决（实测 0 RECRUIT）。
7. **反馈缺失**：`mapHistory`（战报）全工程无渲染；`WarSummary` 不展示胜负条件。
8. **阿斯图里亚斯胜利条件失真**（攻占马德里/马拉加/萨拉戈萨/巴伦西亚）且路线不可达（Bug 报告 B-04）。

### 1.2 本方案要解决什么

把 L2（军备/民兵，主要作为**战前修正**）真正接进"两场内战"，同时为"国民军/共和军内部派系纠葛"建立系统骨架，并把玩家身份从"总参谋部"改为"联盟中的革命成分"。

---

## 2. 目标与非目标

### 目标

- G1 战前军备-民兵积累在 1936 内战中**持续可感知、可消耗、可回溯**（不是一次性结算）。
- G2 战争期间共和阵营呈现"多党派联盟"结构：单位带党派身份、各党有自己的预备兵池与装备池。
- G3 内部分歧可度量、可积累、可爆发：平时人民阵线不和延续到战时，凝聚（分歧）成为系统化变量。
- G4 决裂（历史式五月事件 / 架空式主动革命）有结构性地图后果：历史收敛或革命三方化。
- G5 三方化（伊比利亚防御委员会 / 马德里政府 / 国民军）可完整跑通（回合、经济、胜负、结局）。
- G6 保留现有开局机制：事件链（快速开局=历史驻防快照；沉浸链=逐事件抉择）锚定真实驻防。
- G7 覆盖范围可控：先做 1936 内战线，阿斯图里亚斯后置；引擎为两战共用留参数位。

### 非目标（本期不做）

- 不写实"各国 AI 外交/内政全模拟"；国民军内部只做里程碑与事件，不开放给玩家操作。
- 不做跨阵营"倒戈/投诚"（列入 Backlog）。
- 不改单位制建模（师级/纵队级抽象维持现状）。
- 不做 AI 的"友军自治"（见决策 #1：纯全指挥，无软约束层）。

---

## 3. 设计原则

1. **主体原则**：玩家是联盟中的革命成分而非国家本身。地图单位全部带**党派身份**（Contingent Identity）；分裂前你指挥共和阵营全体，分裂后你指挥"伊比利亚防御委员会"。
2. **路线互斥**：十字路口 A（工人联盟/起义）→ 阿斯图里亚斯早战；B（反法西斯同盟/人民阵线）→ 1936 内战。一局只走一条战争线，两场战争不相交。
3. **军备-民兵 = 战争的血库**：各党派民兵 = 该党派前线部队的**预备兵池＋装备池**，训练/补充/扩编/事件建队都从这里扣。
4. **战时联盟 = 平时人民阵线的延续**：议会机制在战时冻结，PF 联盟（成员按路线门控含 CNT）继续存在，战前积怨结转成战时 cohesion。
5. **决裂 = 系统化高潮**：全指挥 → 凝聚力失衡 →（被动 PCE 逼宫 / 主动玩家革命）→ 历史收敛 或 革命三方化；无休战、大逃杀到底。

---

## 4. 术语表

| 术语 | 含义 |
|---|---|
| Contingent / 成分 | 一支部队所属的党派武装身份（政府军、CNT、UGT、POUM、PCE、国际纵队…） |
| 预备兵池 | 某党派战前/战中积累的民兵后备人力（战时不再是一次性常数，而是持续消耗源） |
| 装备池 | 由 L2 `armaments`/研究折算的某党派可用重装备额度（炮/装甲/补给） |
| 战时联盟 | 战争期间继续运转的 `popular_front` 联盟实例；成员贡献度=武装份额 |
| 凝聚力 cohesion | 现有 `CoalitionState.cohesion`；战时=成员贡献度失衡与事件的函数（低=高内耗） |
| 失衡基线 | 每月由"兵刃份额 vs 话语权"失衡自动产生的凝聚力下降项 |
| 决裂 | 共和阵营内部爆发（五月事件型被动 / 主动革命型），二选一收敛或分裂 |
| 三方化 | 地图出现第三阵营：伊比利亚防御委员会（玩家）/ 马德里政府（AI）/ 国民军（AI） |
| 大逃杀 | 三方各自为战，任何一方首都被占且 SV 跌破阈值即投降出局，其版图转交"占领其首都者"，直至唯一胜者 |

---

## 5. 整体方案

### 5.1 概念模型：两根正交的轴

- **身份轴（Identity）**：所有单位带党派/成分身份（数据＋行为挂钩），解决"民兵往哪放"。
- **指挥轴（Command）**：独立于身份轴。定案为**纯全指挥**：分裂前玩家指挥共和阵营全部单位；分裂后指挥委员会。不做软约束层；指挥权只在决裂事件上整体易手。

### 5.2 主线流程

```
战前（L2 积累）
   │  十字路口/1936大选 → 决定路线与 CNT 是否入 PF（路线互斥）
   ▼
1936-07 内战爆发（沿用现有事件链锚定历史驻防）
   │  链尾注入（不推翻驻防）：
   │   · 各党派武装登记为预备兵池+装备池；地图单位打党派身份
   │   · popular_front（战时联盟）按路线含 CNT；成员贡献度=武装份额初值
   ▼
战争主体（全指挥）
   │  每月：事件→行动(2AP)→战争→月结
   │   · 补充/训练/扩编/事件建队 = 消耗对应党派预备兵池＋装备池
   │   · 月结：cohesion = 现值 + 失衡基线 + 事件Δ（现有事件库驱动摩擦）
   ▼
决裂（两型）
   ├─ 被动：内战已爆发 & PCE(partySupport+旗标)≥阈值 & cohesion≤阈值（历史锚 1937-05）
   │        → ①接受整编（一锤定音的历史收敛） ②抵抗（硬门槛，不足→被镇压；足→升级分裂）
   └─ 主动：条件链满足（保有自主兵刃∧后方控制∧革命热情/民意∧预备池足）→ 直接革命分裂
   ▼
三方化（伊比利亚防御委员会 / 马德里政府 / 国民军）
   │  每月：玩家(委员会) → 马德里政府 AI → 国民军 AI（各 1 回合）
   │  各自为战、无休战；版图随占领变化
   ▼
投降/出局（首都+SV 双条件）→ 出局方版图转交首都占领者 → 大逃杀至唯一胜者
   ▼
结局（增量扩展：内部胜者定方向）
```

### 5.3 新增/改造的数据结构总览（设计级）

| 结构 | 说明 | 与现有字段关系 |
|---|---|---|
| `Army.identity/contingent` | 单位党派身份 | 扩展 `types_map.Army` |
| `MapFaction.IBERIAN_DEFENSE` | 第三阵营 | 扩展 `types_map.MapFaction` |
| 各党派预备兵池＋装备度 | 战争的"血库" | `armedForces.militias` 语义升级＋装备度字段 |
| 战时贡献度（含 CNT_FAI） | 联盟成员权重 | `CoalitionState.memberContributions` 扩展或专用字段 |
| 失衡基线/cohesion 战时公式 | 分歧度 | 现有 `updateCoalitions` 战时分支 |
| `warRuntime`（可选切片） | 决裂状态机/三方化运行数据/摩擦标记 | `GameState` 可选字段，平时为空 |
| 新事件集 | 动员/军援/被动决裂/主动革命/委员会成立/投降 | `INITIAL_EVENTS` 常规注册 |

---

## 6. 支柱详设 A–F

### 支柱 A：路线与战争入口（1936 线）

- **CNT 入 PF 的门控**（复用既有选项）：
  - 十字路口选 B（`crossroads_uprising_alliance.ts:48-80`）或 1936 大选"支持人民阵线"（`elections_1936.ts`）→ `CNT_FAI` 成为 `popular_front` 正式成员；
  - 弃权/起义路线 → 不入盟，走早战线（阿斯图里亚斯，后置）；
  - 需改：`coalitions.ts` `popular_front.members` 支持按门控含 `CNT_FAI`（注意 `updateCoalitions` 已支持 CNT_FAI 成员按 `getPartySupport` 计权重，`coalition.ts:18-29`；但 `memberContributions` 类型仅 `Record<Party, number>`，需扩展 CNT_FAI 槽位，见 B-2）。
- **战争爆发沿用现有事件链**：快速开局（历史驻防快照）与沉浸链（31 节点逐事件）**保留**；新逻辑只在"链尾"注入预备池、装备度与党派身份。

### 支柱 B：党派身份与预备兵池

| 党派/极 | 预备兵池来源（现成字段） | 说明 |
|---|---|---|
| CNT-FAI | `armedForces.militias.cntFai`（＋maoc） | 纵队：高士气、低重装 |
| UGT/PSOE | `militias.ugt` | 工会营 |
| POUM | `militias.poum` | 小型、政治性强 |
| 政府军 | `regularArmy/guardiaNacional/guardiaAsalto` | "国家/内阁"极（重装备），见支柱 C |
| 国际纵队 | `internationalBrigades` | 事件分批增援 |

规则（已定）：

1. **地图单位带党派身份**（`identity`），战斗、士气、整编、事件均挂钩。
2. **训练/补充/扩编/事件建民兵部队均消耗对应党派预备兵池**；池空则无兵可补（允许少量"志愿自发"事件小幅回补）。
3. **L2 军备 → 装备池**：`armaments` 经动员/军援事件转为对应党派的装备度（炮/装甲/补给），决定单位编制上限；`tankResearchCompleted + hasArmoredCars` → 委员会/政府军装甲可用。
4. **现有武装卡重定义**：
   - `militia_reorg`：正规化 = 把 2–3 支低质量纵队合编成 1 支高军事化师（降自主、耗军备）；扩编 = 消耗预备池＋军备在地图建纵队；
   - `anarchy_tanks` 完成态接通地图坦克可用性；
   - `aragon_front` 效果指向阿拉贡区域民兵池与战区。
5. **无自动转化**：民兵预备池不自动变前线单位，一切产出靠训练/事件卡（见决策 #21）。

### 支柱 C：战时人民阵线联盟与凝聚力

- **载体**：沿用 `popular_front` 联盟实例（成员含 CNT_FAI 按支柱 A 门控）；战争期间**议会/选举机制冻结**（现有月结事件队列在内战期间已暂停大选链，`monthlyPipeline.ts:115-122`；需新增 `checkCoalitionDissolve` 的"战时出口"——解散不再导向政府危机/重选，而是转"决裂结算"）。
- **成员贡献度（战时权重）**：
  - CNT-FAI = 民兵池＋控制区（加泰/阿拉贡/莱万特旗标）；
  - PCE = `partySupport.PCE`＋`pceInPower/moscowGoldTransferred/pceAcceptsComintern` 渗透修正；
  - UGT/POUM/ERC = 各自池与控制旗标（`cataloniaControl`、`regionalStatuses` 等）；
  - **政府军 = "国家/内阁"极，参与失衡计算**：权重 = `ministers.war` 持有党加权 ×（1＋PCE 渗透修正）。
- **cohesion 公式（已定）**：月度 = 现值 ＋ **失衡基线**（兵刃份额 vs 话语权的失衡 → 内耗）＋ **事件 Δ**；事件/卡牌通过 `adjustMemberContribution`（`coalition.ts:139-158`）与新增战时 Δ 修改贡献度。
- **摩擦期**：不新增专用月度小事件，**复用现有事件库**（大会、镇压、退阁、军事政策、外援等）驱动凝聚力升降；危机选项沿用"改阁/退阁/让步/镇压"等既有语义。

### 支柱 D：决裂系统

- **分歧度展示**：UI 以"战时联盟凝聚力/内部分歧度"条呈现（低凝聚力 → 红条警告 + 触发条件提示）。
- **被动决裂（五月事件型）**：
  - 触发 = 内战已爆发 && `partySupport.PCE ≥ 阈值(默认50)` && 相关旗标（`pceInPower`/`moscowGoldTransferred`）成立 && `cohesion ≤ 阈值(≈ dissolveThreshold 15 附近)`；历史模式额外锚定 1937-05 起可触发。
  - 事件选项（两向）：
    - ① **接受整编/让权** → 历史收敛：CNT 军权上缴、单位整编入人民军、cohesion 回升、革命度大跌；**一锤定音，无二次地图级决裂**（后续斯大林派渗透走"俄属西班牙/大清洗"等政治结局路径）。
    - ② **抵抗** → 需硬门槛（CNT 兵刃份额 / 后方控制 / 预备池）；**不足 → 自动被镇压**（CNT 弱化，仿真实五月事件结局）；足 → 升级进入三方化（可接"抢先发动"主动事件）。
- **主动革命（架空线）**：
  - 条件链：保有自主兵刃（未全面整编）∧ 后方控制（加泰等）∧ 革命热情/民意高 ∧ 预备池充足；未满足灰置并提示缺口；
  - 满足 → 直接成立"伊比利亚防御委员会"进入三方化。

### 支柱 E：三方化（伊比利亚防御委员会）

- **新地图阵营**：`MapFaction.IBERIAN_DEFENSE`，显示名"伊比利亚防御委员会 / Iberian Defense Committee"；首府巴塞罗那。
- **构成**：分裂事件内决定是否与 POUM / PSOE 左翼结盟或独走（各自带兵刃/贡献加入）。
- **版图（分裂瞬间）**：加泰罗尼亚＋瓦伦西亚＋阿拉贡三地区内当时属共和军的地块 ＋ **委员会民兵单位所在省份**（单位与省一并改属新阵营）。
- **指挥切换**：玩家转为委员会指挥官；马德里政府阵营交 AI（复用现有 AI 逻辑以 REPUBLICAN 敌对身份运行）；国民军 AI 不变。
- **回合**：每月战争段 = 玩家(委员会) → 马德里政府 AI → 国民军 AI，各 1 回合（2 CP/月）；月度收入沿用 `calculateMonthlyMapStage`（天然按阵营从所辖省产出，新阵营加键即可）。
- **关系**：全面互开战、无休战（国民军坐收渔利属允许后果）。
- **投降/出局（首都＋SV 双条件）**：

| 阵营 | 首都 | SV 阈值（默认，可调） |
|---|---|---|
| 国民军 | 布尔戈斯 | < 60 |
| 马德里政府 | 马德里 | < 50 |
| 伊比利亚防御委员会 | 巴塞罗那 | < 50 |

- 出局方版图**转交"占领其首都的一方"**；大逃杀至唯一胜者（若国民军先亡，两左翼继续内争）。

### 支柱 F：结局扩展（增量）

- 委员会最终统一 → 革命类结局变体（人民之子方向）；
- 马德里政府最终统一 → 人民阵线/俄属西班牙方向；
- 国民军最终统一 → `WE_HAVE_PASSED`（不变）；
- 1939 年仍未分胜负 → 现有"丧钟为谁而鸣"样式 ＋ 三方僵局变体（1–2 个新结局）。
- 内部胜者决定"左翼胜利"的叙述方向；`endings.ts` 增量扩展，不重写现有结局。

---

## 7. 涉及改动的现有模块（文件级清单）

> "阶段"列 = 该改动落在 Phase A/B/C（见第 8 节）；"★" = 关键改动。

| 文件/模块 | 阶段 | 改动内容 |
|---|---|---|
| `src/map/types_map.ts` | A★/C | `MapFaction` 增 `IBERIAN_DEFENSE`；`Army` 增 `identity/contingent`（optional）；必要时 `ResourceSet` 语义注释 |
| `src/map/map_constants.ts` | A/C★ | `FACTION_COLORS` 加新阵营；`INITIAL_PROVINCES/INITIAL_ARMIES` 相关默认；**修复邻接孤岛**（摩洛哥/岛屿/oviedo 渡海或事件，C 期或独立修复项）；开战注入入口函数（可选放这里或新 `rules/warSetup.ts`） |
| `src/game/types.ts` | A/B★/C | `GameState` 增 optional `warRuntime`（决裂状态机/三方化运行数据/摩擦标记）；`armedForces` 相关装备度字段（optional）；联盟贡献度类型支持 CNT_FAI；结局/flag 扩展 |
| `src/game/coalitions.ts` | B★ | `popular_front.members` 按门控含 `CNT_FAI`（门控逻辑在事件侧） |
| `src/game/utils/coalition.ts` | B★ | `memberContributions` 支持 CNT_FAI 槽位（类型/默认 80/初始化）；`checkCoalitionDissolve` **战时出口**（civilWarStatus==='ongoing' 时解散 → 决裂结算而非政府危机/重选） |
| `src/game/rules/monthlyPipeline.ts` | B | 月结挂接"战时失衡基线 + 事件Δ"；确保内战期间选举/解散链完全冻结 |
| `src/game/GameContext.tsx` | A/B/C★ | `INITIAL_STATE` 默认值；NEXT_PHASE 月度管线调用新阶段；`executeAiTurn` 收敛为复用 reducer action（顺带修三份实现问题）；三方回合顺序/`mapCurrentPlayer` 轮转；三方化指挥切换 |
| `src/game/reducers/mapReducer.ts` | A/C | `REINFORCE/RECRUIT` 支持"党派池 vs 全国池"双路径；`MERGE` 加同省/身份校验（顺带修跨省瞬移合兵）；守卫收编/补充的阵营一致性 |
| `src/game/events/civil_war/civil_war_setup.ts` | A★/C | 链尾（快速开局与沉浸链收尾）改为"驻防照旧 + 注入预备池/身份/装备度"的统一函数；分裂相关起始条件读取 |
| `src/game/events/nationalist_surrender.ts` / `republican_surrender.ts` | C★ | 泛化为"首都＋SV"三阵营通用投降事件（含委员会版）；内战内部胜负结算 |
| `src/game/events/catalonia_defense.ts`、`aragon_council.ts` | C | 升级为"委员会/后方区域"相关 actor 初始状态 |
| `src/game/military_affairs/militia_reorg.ts`、`anarchy_tanks.ts`、`aragon_front.ts` | A★ | 效果重定向到地图单位/预备兵池/装备池 |
| `src/game/events/elections_1936.ts`、`crossroads_uprising_alliance.ts` | B | 联动：选人民阵线路线时把 CNT_FAI 挂入 popular_front（含 `cntStance`、贡献度初值） |
| `src/game/endings.ts` | C★ | 增量扩展：内部胜者分支＋三方僵局结局 |
| `src/game/saveGame.ts` / `reducers/saveReducer.ts` | A/C | 新增普通字段整包序列化天然兼容；旧档默认兜底（optional + 读取归一化）；如需破坏性变更则 bump `SAVE_FORMAT_VERSION` |
| `src/game/effectPreview.ts` | B/C | 新字段预览行（凝聚力/分歧度/预备池等） |
| `src/map/Sidebar.tsx`、`MapView.tsx`、`ProvinceMap.tsx`、`WarSummary.tsx` | A/B/C | 单位身份与预备池显示；分歧度/胜条件 UI；三方回合与阵营指示；战报渲染（修复 `mapHistory` 无渲染）；`WarSummary` 显示投降条件与进度 |
| `src/components/MainArea.tsx`、`SidePanel.tsx`、`SuperEvent.tsx` | A/B/C | 战时联盟/派系势力板块；新事件呈现 |
| `scripts/test-*.ts` / `package.json` | 全程 | 新增规则测试（转化器/失衡公式/决裂条件/投降判定） |
| 新增 `src/game/rules/warRuntime*.ts`（建议） | A/B/C | 预备池、装备池、战时凝聚力、决裂状态机、版图划分等纯函数（单测友好） |
| 新增事件文件（`events/civil_war/rupture*.ts` 等） | B/C | 被动/主动决裂、委员会成立、动员/军援事件 |

---

## 8. 分期修改计划（Phase A / B / C）

### Phase A —— 预备兵池 + 单位党派身份（无分裂，纯全指挥玩法不变）

- 目标：民兵"活"起来；不开任何分裂内容；可玩性/数值基线不受损。
- 范围：
  1. 单位带 `identity`；开局（链尾）登记各党派预备兵池与装备度。
  2. 补充/训练/扩编/事件建队消耗对应池（政府军走"国家池"）。
  3. `armaments`→装备池转换；武装卡重定义到地图。
  4. 地图孤岛邻接修复（非洲军团等）作为独立小步并入。
- 验收：
  - 1936 一局（全指挥）可玩；CNT 预备池的起落全程可感知、可在 UI 看到、可回溯；
  - 旧存档可读；`npm run lint && build && test:rules && test:save-system` 通过；
  - headless 复跑：内战首月 AI 有征兵/整编行为（修复坦克储备静默否决问题，见 R-2）。

### Phase B —— 战时人民阵线联盟与凝聚力（议会冻结、分歧可见）

- 目标：cohesion 成为战争主变量；摩擦期完全复用现有事件库。
- 范围：
  1. PF 含 CNT_FAI（路线门控）；议会/选举机制战时冻结（解散→决裂结算出口）。
  2. 战时贡献度公式（含政府军="国家/内阁"极）＋失衡基线＋事件Δ；月结挂接。
  3. 摩擦期事件映射与 UI 分歧度显示。
- 验收：
  - headless 多路线跑到 1937：凝聚力曲线可解释（事件→贡献度→cohesion 因果可追踪）；
  - 分歧可被玩家选择推高/推低；内战时绝不触发总统/议会大选链。

### Phase C —— 决裂与三方化

- 目标：五月事件式决裂可复现；革命三方化可通关；结局扩展上线。
- 范围：
  1. 决裂状态机与两型触发（被动：PCE+cohesion、历史锚 1937-05；主动：条件链）。
  2. 被动决裂事件（接受/抵抗+硬门槛+被镇压）；主动革命事件。
  3. 委员会成立与版图划分、构成选项（POUM/PSOE 结盟或独走）。
  4. 指挥切换（玩家→委员会；马德里政府 AI 激活）与三方回合。
  5. 三方投降/出局（首都＋SV）与版图转交；`checkWarStatus`/投降事件泛化。
  6. 结局增量扩展。
- 验收：
  - 历史收敛线与革命三方化线都能打完整局；
  - 三方化后每月三方各 1 回合、收入/招募正常；出局方版图正确转交首都占领者；
  - 三种最终胜利者（委员会/政府/国民军）都能触发对应结局。

---

## 9. 实施步骤（先后顺序与每步验证）

> 约定：每步后跑 `npm run lint`；涉及规则/数据的行为另加/跑 `scripts/test-*.ts`；涉及存档的跑 `test:save-system`。

### 第 0 步 S0：类型与数据地基（无玩法变化）

1. **S0.1** `types_map.ts`：`MapFaction` 增 `IBERIAN_DEFENSE`（先不启用）；`FACTION_COLORS` 加色。
2. **S0.2** `types_map.ts`：`Army` 增 `identity?: 'gov'|'cnt'|'ugt'|'poum'|'pce'|'intl'`；`GameContext.tsx` 各 Army 构造点与 `INITIAL_STATE` 默认（缺省 = 'gov'）。
3. **S0.3** `types.ts`：`GameState` 增 `warRuntime?`（空实现类型占位）＋各池/装备度 optional 字段骨架。
4. **S0.4** `saveGame.ts`：核对新增字段走整包 JSON（无需白名单），加读取默认归一化函数（仿 `normalizeOrganizationState`）；跑 `test:save-system`。
5. 验证：build/lint 通过；旧档读取正常。

### Phase A 步骤

6. **A.1** 新增纯函数模块（建议 `src/game/rules/warPools.ts`）：预备池/装备池的登记、查询、扣减、回补（读取 `armedForces`，含 regularArmy 国家池）＋单测。
7. **A.2** `civil_war_setup.ts` 链尾统一函数：驻防照旧 + 为每支部队打身份 + 生成池初值（快速开局与沉浸链共用）。
8. **A.3** `mapReducer.ts` + `Sidebar.tsx`：REINFORCE/RECRUIT 双路径（身份→党派池；否则→国家池）；UI 显示身份与池余量；`effectPreview` 补行。
9. **A.4** `military_affairs/*` 重定义到地图/池；`GameContext.executeAiTurn` 复用 reducer action（收敛重复实现）。
10. **A.5** 地图孤岛邻接修复（或"非洲军团渡峡"事件）＋ AI 招募编制随坦克储备裁剪（修静默否决）。
11. **A.6** `mapHistory` 战报渲染 + `WarSummary` 补"我方/敌方预备池、各党派前线师数"板块。
12. 验证：headless 模拟 1936 内战 6–12 个月：池的收支、补充路径、AI 行为回归；Phase A 验收清单。

### Phase B 步骤

13. **B.1** `coalitions.ts` + `coalition.ts`：`popular_front.members` 支持 CNT_FAI；`memberContributions` 扩展 CNT_FAI 槽位（类型、初始化 80、`adjustMemberContribution` 支持）。
14. **B.2** 事件联动：十字路口 B / 1936 PF 胜组阁时把 CNT_FAI 挂入 PF 成员并初始化贡献度（`cntStance/ministers` 联动）。
15. **B.3** `coalition.ts`：`checkCoalitionDissolve` 战时出口（`civilWarStatus==='ongoing'` → 不产生政府危机/大选，进入"决裂结算"标记）；月度事件队列再次确认无选举链。
16. **B.4** 新纯函数 `warCohesion.ts`：战时贡献度（含政府军=国家/内阁极）、失衡基线、事件Δ；挂接 `monthlyPipeline`。
17. **B.5** 摩擦期事件映射表（现有事件→对成员贡献度/cohesion 的 Δ）；UI 分歧度条（`SidePanel`/`Sidebar`）。
18. 验证：headless 多路线至 1937：cohesion 曲线可解释；内战中无选举链；Phase B 验收清单。

### Phase C 步骤

19. **C.1** `warRuntime` 决裂状态机（none → friction → triggered(passive/active) → converged | split）＋触发判定纯函数。
20. **C.2** 被动决裂事件（接受整编 → 收敛结算：整编、cohesion 回升、革命度大跌、一锤定音；抵抗 → 硬门槛 → 被镇压 or 升级）。
21. **C.3** 主动革命事件（条件链灰置/提示；成功 → 直接分裂）。
22. **C.4** 委员会成立与版图划分函数：三地区共和控制地＋委员会民兵所在省 → 归属 `IBERIAN_DEFENSE`；构成选项（POUM/PSOE 左翼/独走）。
23. **C.5** 指挥切换与三方回合：玩家→委员会；马德里政府 AI（复用 AI 跑 REPUBLICAN 敌对）；月循环三方各 1 回合适配（`mapCurrentPlayer` 轮转、`mapReducer` 守卫、月度收入新键）。
24. **C.6** 投降/出局：首都＋SV 通用判定；`nationalist_surrender/republican_surrender` 泛化＋委员会版；出局版图转交首都占领者；`checkWarStatus` 收口。
25. **C.7** `endings.ts` 增量扩展（内部胜者方向＋三方僵局）。
26. **C.8** UI：阵营选择/回合指示/投降条件进度/分裂宣传画面；`WarSummary` 显示三方目标。
27. **C.9** 平衡回归：headless 多路线 + 手动 UI 通关历史收敛线与革命线。
28. 验证：Phase C 验收清单；存档升级检查（旧档→新档字段兜底）。

---

## 10. 数值占位与校准清单

| 数值 | 默认 | 校准方法 |
|---|---|---|
| 被动决裂 PCE 阈值 | `partySupport.PCE ≥ 50` | headless 扫不同路线 |
| cohesion 决裂阈值 | ≈ `dissolveThreshold`（popular_front=15）附近 | 同上 |
| 历史锚 | 1937-05（仅 historical/含内战条件） | 事件日期 |
| 抵抗硬门槛 | CNT 兵刃份额/后方控制/预备池 三者系数（待标定） | Phase C 实测 |
| SV 投降阈值 | 国民<60、政府<50、委员会<50 | 大逃杀平衡实测 |
| 预备兵池→单位换算 | 一支 3k–4k 师对应 ~8k–12k 池（先 1:2.5–3） | Phase A 实测 |
| AI 招募坦克裁剪 | 编制坦克数 ≤ 当前坦克储备 | 直接修复 |
| 失衡基线系数 | 月度 cohesion 下降 0–3（与失衡度挂钩） | Phase B 实测 |

---

## 11. 兼容性、测试与风险

### 兼容性

- 新增 GameState 字段全部 optional；旧档经读取归一化兜底（仿 `organizations` 模式）。
- `SAVE_FORMAT_VERSION` 仅在破坏性变更时 bump（预期可不 bump）。
- `MapFaction` 新成员只出现在 1936 内战的"分裂后"局；分裂前与旧局不受影响。

### 工程纪律（沿用审阅结论）

1. **事件禁止直写地图状态**：省份归属类事件只改政治结果，兵力一律走统一生成函数/reducer。
2. **单一规则源**：费用/校验收敛到 `costs.ts` 与领域函数；`executeAiTurn` 只做规划、派发与玩家相同的 action。
3. **所有新增纯函数配 `scripts/test-*`**：转化器、失衡公式、决裂条件、投降判定必须确定性用例覆盖。
4. **UI 与 reducer 双轨漂移**：改动同一处规则时同步两侧（如整编士气口径）。

### 主要风险

| 风险 | 缓解 |
|---|---|
| 三方化改动面大（回合/胜负/经济/存档） | 分期：C 期独立开关，不开分裂时与现状等价 |
| 预备池引入可能造成补充断流 | 保留"志愿回补"事件与默认下限 |
| cohesion 失衡过强 → 每局必决裂 | 基线系数低起步，用 headless 扫曲线再定标 |
| 旧存档字段缺失 | optional + 归一化读取（S0.4 先行） |
| 路线互斥破坏（两战冲突） | 十字路口与战争入口加显式互斥门，加测试 |

---

## 12. Backlog（未来扩展）

- **倒戈/投诚事件**（跨阵营、低概率、受凝聚力与战况影响；含"政府军单位在委员会控制区转投"）——设计已定原则，暂不制作。
- **阿斯图里亚斯早战线（1934）接入**：同一套预备兵池/战时联盟引擎参数化复用（联盟=工人联盟 CNT+UGT；无三方化，分歧后果=溃散/劝降类事件）。
- 国民军内部深度：统一法令（1937-04）、CTV/秃鹰军团抵达里程碑（挂 `relations.germany/italy`）、非洲军团渡峡事件。
- 三方化内部次级分歧（委员会内部路线斗争）——当前定案为统一，预留扩展位。

---

## 13. 附录：锁定决策总表

| # | 决策点 | 定案 |
|---|---|---|
| 1 | 战争指挥模型 | 纯全指挥，无软约束层；分裂后玩家指挥委员会，政府交 AI |
| 2 | 分裂形态 | 历史收敛 / 革命三方化双机制，事件分支 |
| 3 | 决裂类型 | 被动（PCE+cohesion，历史锚 1937-05）＋主动（条件链革命） |
| 4 | 三方关系 | 全面互开战、无休战 |
| 5 | 预备兵池 | 补充与扩编都吃本党派预备池＋装备池 |
| 6 | 范围 | 先做 1936 内战线；阿斯图里亚斯后置 |
| 7 | 战时联盟载体 | 沿用人前阵线实例（含 CNT，入盟按路线门控）；议会机制冻结 |
| 8 | PCE 度量 | 现有 `partySupport.PCE`＋旗标 |
| 9 | 主动门槛 | 条件链，未满足灰置提示 |
| 10 | 摩擦期 | 复用现有事件库，不新增专用小事件 |
| 11 | 路线互斥 | 十字路口 A→早战 / B→1936 内战，一局一战 |
| 12 | cohesion 公式 | 失衡基线＋事件Δ；政府军="国家/内阁"极参与失衡 |
| 13 | 五月事件选项 | 两向：接受整编（一锤定音，无二次地图决裂）/ 抵抗（硬门槛，不足自动被镇压） |
| 14 | CNT 革命派内部 | 完全统一，不设次级分歧 |
| 15 | 委员会构成/首都 | 构成由分裂事件决定（POUM/PSOE 左翼或独走）；首府巴塞罗那 |
| 16 | 委员会版图 | 加泰+瓦伦西亚+阿拉贡的共和控制地 ＋ 委员会民兵所在省 |
| 17 | 投降/出局 | 首都＋SV 双条件（国民=布尔戈斯&SV<60；政府=马德里&SV<50；委员会=巴塞罗那&SV<50） |
| 18 | 大逃杀 | 跌破阈值即出局；版图转交"占领首都者"；至唯一胜者 |
| 19 | 回合 | 每月三方各 1 回合 |
| 20 | 结局 | 增量扩展，内部胜者定方向；1939 加三方僵局变体 |
| 21 | 动员节奏 | 训练/建队消耗预备池；事件卡建民兵同吃池；无自动转化 |
| 22 | 倒戈 | 暂不制作，列入 Backlog |
| 23 | 阵营命名 | `IBERIAN_DEFENSE` / 伊比利亚防御委员会 |
