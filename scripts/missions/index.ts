import type { MissionSpec } from '../mission/types';
import { ENDINGS } from '../../src/game/endings';
import { getSocializedShare, getStateShare } from '../../src/game/rules/controlShares';

/**
 * 任务清单。
 *
 * 每个任务都声明 `expect`：CI 只按它判定，避免"跑完了但没人看结果"。
 *  - `pass`：目标必须达成；
 *  - `unreachable`：必须给出**结构性**不可达的证据（见 engine.proveUnreachable）；
 *  - `any`：只要求跑完不报错，用于探路与量月数（报告里仍打印缺口）。
 */
export const MISSIONS: MissionSpec[] = [
  {
    id: 'collectivize-1936',
    title: 'Collectivize the land (1936, greedy)',
    titleZh: '土地集体化到 65%（1936·贪婪策略）',
    scenario: '1936',
    difficulty: 'normal',
    seed: 1,
    months: 48,
    goals: [{ kind: 'journal', id: 'journal_land_collectivization' }],
    policy: { kind: 'greedy' },
    expect: 'pass',
    notes: 'Headline reachability test: the journal needs 65% of the land pie in collectives.',
    notesZh: '关键可达性测试：这本日志要求土地饼里的农业集体达到 65%。',
  },
  {
    id: 'collectivize-1936-script',
    title: 'Collectivize the land (1936, fixed route)',
    titleZh: '土地集体化到 65%（1936·固定路线）',
    scenario: '1936',
    difficulty: 'normal',
    seed: 1,
    months: 48,
    goals: [{ kind: 'journal', id: 'journal_land_collectivization' }],
    policy: {
      kind: 'script',
      steps: [
        // 「强制集体化」：集体 +8、土改进度 +10，同时满足日记开始条件里的"投过一次"。
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        // 土改过半（≥50）之后，开始事件才会被事件板调度；这里再推一把进度。
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
        { card: 'land_and_freedom', optionMatch: 'Collectivize by force' },
      ],
    },
    expect: 'pass',
    notes: 'Same goal through an explicit route: shows the script policy and the minimum month count.',
    notesZh: '同一目标走显式路线：用来演示 script 策略并量出最短月数。',
  },
  {
    id: 'prrevs-syndicalist-1931',
    title: 'Build the PRRevS, complete the syndicalist route, reach an ending',
    titleZh: '建立 PRRevS、走完温和工团路线、抵达一个结局（1931 长局）',
    scenario: '1931',
    // **必须用 historical**：1931/1933 两个剧本的内战只在 historical 难度下于 1936·7 触发
    // （见 rules/phaseOrchestrator.ts 的 Civil War Trigger）。普通难度下战争不会来，
    // 游戏在 1939 年以"沉默的共和国"和平结局收场，而温和工团路线需要战时的社会化上限。
    difficulty: 'historical',
    seed: 11,
    months: 120,
    goals: [
      { kind: 'achievement', id: 'A_SIN_PARTIDO' },
      { kind: 'journal', id: 'journal_economy_syndicalist' },
      { kind: 'flag', id: 'ending-reached', label: 'An ending is reached', labelZh: '抵达一个结局', test: (state) => Boolean(state.ending) },
    ],
    // 长链条没有梯度就走不动：入阁 → 拿部委 → 建党建到 4 级 → 工业接管 → 土地改革。
    // 权重高的几条是 PRRevS 的关键路径：丢了"入阁"或"三十人集团"，整条链条就断了。
    milestones: [
      { kind: 'flag', id: 'm-cnt-in-government', label: 'CNT enters the government', labelZh: 'CNT 入阁', test: (state) => state.cntStance === 'govern', weight: 4 },
      { kind: 'flag', id: 'm-industry-ministry', label: 'CNT holds the Industry ministry', labelZh: 'CNT 掌工业部', test: (state) => state.ministers.industry === 'CNT', weight: 3 },
      { kind: 'flag', id: 'm-pestana', label: 'Pestaña is an active advisor', labelZh: '佩斯塔尼亚在任', test: (state) => (state.activeAdvisors ?? []).some(advisor => advisor?.id === 'Ángel Pestaña'), weight: 3 },
      { kind: 'counter', id: 'prrevsConstructionLevel', atLeast: 1, weight: 2 },
      { kind: 'counter', id: 'prrevsConstructionLevel', atLeast: 2, weight: 2 },
      { kind: 'counter', id: 'prrevsConstructionLevel', atLeast: 3, weight: 2 },
      { kind: 'counter', id: 'prrevsConstructionLevel', atLeast: 4, weight: 2 },
      { kind: 'flag', id: 'm-bureaucratisation', label: 'Bureaucratisation >= 50', labelZh: '官僚化达到 50', test: (state) => state.stats.bureaucratization >= 50, weight: 2 },
      { kind: 'flag', id: 'm-treintistas', label: 'Treintistas influence > 60', labelZh: '三十人集团影响 > 60', test: (state) => state.factions.Treintistas.influence > 60, weight: 4 },
      { kind: 'counter', id: 'land_requisition', atLeast: 1 },
      { kind: 'flag', id: 'm-land-reform', label: 'Land reform journal completed', labelZh: '土地改革日志完成', test: (state) => state.journal?.['journal_land_reform']?.status === 'completed' },
      { kind: 'counter', id: 'rail_nationalization', atLeast: 1 },
      { kind: 'counter', id: 'rail_nationalization', atLeast: 3 },
      { kind: 'counter', id: 'coal_nationalization', atLeast: 2 },
      { kind: 'counter', id: 'industrial_cooperative', atLeast: 3 },
      { kind: 'counter', id: 'foreign_capital_seizure', atLeast: 2 },
      { kind: 'flag', id: 'm-war', label: 'The civil war has started', labelZh: '内战已爆发', test: (state) => state.civilWarStatus === 'ongoing' || Boolean(state.activeWar) },
      { kind: 'flag', id: 'm-industry-socialized', label: 'Industry socialized >= 70%', labelZh: '工业社会化 ≥ 70%', test: (state) => getSocializedShare(state, 'industry') >= 70 },
      { kind: 'flag', id: 'm-industry-state', label: 'State ownership >= 25%', labelZh: '工业国有制 ≥ 25%', test: (state) => getStateShare(state, 'industry') >= 25 },
    ],
    // 1931 选举后的「部长分配」是自定义界面（`options: []`）：15 点筹码，工业和农业各 10/5。
    customResolutions: {
      minister_allocation: (state) => ({
        leverage: Math.max(0, (state.leverage ?? 15) - 15),
        ministers: { ...state.ministers, industry: 'CNT', agriculture: 'CNT' },
        currentEvent: null,
      }),
    },
    advisorPlan: ['Ángel Pestaña'],
    policy: { kind: 'greedy' },
    expect: 'any',
    notes: 'Long-chain probe: the syndicalist route needs the Industry ministry and the wartime ceiling (pre-war socialization is capped at 16%).',
    notesZh: '长链条探路：温和工团路线要工业部，而且工业社会化在战前被上限压在 16%，所以必须打到内战期间；结局需要战争分出胜负，当前脚本没有军事策略，因此本任务用 any 观察它能走到哪一步。',
  },
  {
    id: 'wartime-routes-exclusive',
    title: 'Both wartime routes (proved impossible)',
    titleZh: '战时两条路线同时完成（证明不可达）',
    scenario: '1936',
    difficulty: 'normal',
    seed: 1,
    months: 6,
    goals: [
      { kind: 'journal', id: 'journal_economy_war_effort' },
      { kind: 'journal', id: 'journal_economy_revolutionary_war' },
    ],
    policy: { kind: 'greedy' },
    expect: 'unreachable',
    notes: 'The two wartime routes exclude each other by design, so no run can complete both.',
    notesZh: '战时两条路线在规则上互斥，任何一局都不可能同时完成（原来挂在「六条路」成就上，该成就因此已删除）。',
  },
  {
    id: 'money-ends-1931-probe',
    title: 'Abolish money (1931 probe)',
    titleZh: '废除货币（1931 探路）',
    scenario: '1931',
    difficulty: 'normal',
    seed: 7,
    months: 36,
    goals: [{ kind: 'achievement', id: 'A_MONEY_ENDS' }],
    policy: { kind: 'greedy' },
    expect: 'any',
    notes: 'Probe: the card that abolishes money needs the CNT to hold the Finance ministry.',
    notesZh: '探路：废除货币的卡要求 CNT 掌握财政部，任务会如实报告卡在哪一步。',
  },
  {
    id: 'may-days-1936-probe',
    title: 'May Days outcome (1936 probe)',
    titleZh: '五月事件走向（1936 探路）',
    scenario: '1936',
    difficulty: 'normal',
    seed: 3,
    months: 24,
    goals: [{
      kind: 'flag',
      id: 'may-days-settled',
      label: 'May Days reaches a settlement',
      labelZh: '五月事件产生结算',
      test: (state) => Boolean(state.mayDays?.settlement),
    }],
    policy: { kind: 'greedy' },
    expect: 'any',
    notes: 'Integration probe: drives the war phases and the mandatory May Days chain.',
    notesZh: '集成探路：会走战争阶段与强制的五月事件链。',
  },
];

export const findMission = (id: string): MissionSpec | undefined => MISSIONS.find(mission => mission.id === id);

export { ENDINGS };
