import React from 'react';
import { useGameSelector } from '../game/GameContext';
import {
  areEconomyReformViewModelsEqual,
  selectEconomyReformViewModel,
  type EconomyReformViewModel,
} from '../game/selectors';
import { getJournalEntryDef } from '../game/journal';
import { ECONOMY_REFORM_CAPS } from '../game/rules/economyReforms';
import { OWNERSHIP_COLORS, OWNERSHIP_LABELS } from '../game/rules/controlShares';
import type { OwnershipSector } from '../game/types';
import { Wrench, Landmark, Factory, ShieldAlert } from 'lucide-react';

/**
 * 经济改造面板（docs/经济改造方案.md §8.3、工人控制度改造方案 §6.3）。
 *
 * 只读：18 个计数器的当前值（有上限的显示 n/上限，农业五项显示纯数字）、六条路线的
 * 进度条与完成状态、**两张所有权饼的当前读数**、顾问推动进度，以及当前暂停的月度宏观修正接口。
 *
 * 三条硬性显示规则：
 *  1. **不显示"经济改造提供月资源"**——本方案没有这条收益，出现即实现错误；
 *  2. 农业五项**不造阶段名**，只显示数字；
 *  3. **不显示"经济改造指数/总量"**——计数器是一本流水账，不是分数；把 18 个数字
 *     加成一个数只会鼓励玩家去刷分，而不是去看饼图。
 */

/** 计数器分组。农业五项无上限，因此在渲染时按 `ECONOMY_REFORM_CAPS` 判定。 */
const COUNTER_GROUPS: Array<{
  key: string;
  label: string;
  labelZh: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  counters: Array<{ key: string; label: string; labelZh: string }>;
}> = [
  {
    key: 'agriculture',
    label: 'Agriculture',
    labelZh: '农业',
    icon: Wrench,
    counters: [
      { key: 'agricultural_cooperative', label: 'Agricultural cooperatives', labelZh: '农业合作社' },
      { key: 'land_requisition', label: 'Land requisition', labelZh: '农村土地征用' },
      { key: 'land_redemption', label: 'Land redemption', labelZh: '农村土地赎买' },
      { key: 'land_voluntary_collectivization', label: 'Voluntary collectivization', labelZh: '自愿集体化' },
      { key: 'land_forced_collectivization', label: 'Forced collectivization', labelZh: '强制集体化' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    labelZh: '金融',
    icon: Landmark,
    counters: [
      { key: 'currency_abolition', label: 'Abolition of money', labelZh: '废除货币' },
      { key: 'private_bank_seizure', label: 'Bank deposits seized', labelZh: '没收私营银行储蓄' },
      { key: 'mutual_credit_network', label: 'Mutual credit', labelZh: '地方互助信贷' },
      { key: 'credit_exchange_committee', label: 'Credit & exchange committee', labelZh: '信用与兑换委员会' },
    ],
  },
  {
    key: 'industry',
    label: 'Industry',
    labelZh: '工业',
    icon: Factory,
    counters: [
      { key: 'rail_nationalization', label: 'Railways nationalized', labelZh: '铁路系统国有化' },
      { key: 'coal_nationalization', label: 'Coal nationalized', labelZh: '煤炭国有化' },
      { key: 'industrial_cooperative', label: 'Industrial cooperatives', labelZh: '工业合作社' },
      { key: 'foreign_capital_seizure', label: 'Foreign capital seized', labelZh: '外资没收' },
      { key: 'supply_coordination_network', label: 'Supply coordination', labelZh: '工团物资调控网络' },
    ],
  },
  {
    key: 'wartime',
    label: 'Wartime',
    labelZh: '战时',
    icon: ShieldAlert,
    counters: [
      { key: 'wartime_requisition', label: 'Wartime requisition', labelZh: '战时农业强制征发' },
      { key: 'family_rationing', label: 'Family ration books', labelZh: '家庭口粮本配给制' },
      { key: 'war_industry_conversion', label: 'War industry conversion', labelZh: '军工紧急转产改组' },
      { key: 'wartime_trade_monopoly', label: 'Wartime trade monopoly', labelZh: '战时外贸垄断' },
    ],
  },
];

const STATUS_LABEL: Record<string, [string, string]> = {
  inactive: ['Not started', '未开启'],
  active: ['In progress', '推进中'],
  completed: ['Achieved', '已完成'],
  failed: ['Overtaken', '已被取代'],
};

const formatGraph = (value: number): string => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;

/** 两张饼的阅读顺序与侧边栏一致：土地在前，生产资料在后。 */
const OWNERSHIP_SECTORS: Array<{ key: OwnershipSector; label: string; labelZh: string }> = [
  { key: 'land', label: 'Land', labelZh: '土地' },
  { key: 'industry', label: 'Industry', labelZh: '生产资料' },
];

/**
 * 一张饼的只读读数：六项份额 + 四个门槛读数。
 *
 * 四个合计值不是装饰：自由公社路线看**劳动者**（土地 ≥60、生产资料 ≥55），
 * 工团主义路线看**社会化 ≥70 且国有 ≥25**（工人控制度改造方案 §5.1）。
 * **社会化上限**则是战前那道天花板（§4.2），它解释了"为什么战前怎么推都翻不了盘"。
 */
const OwnershipColumn: React.FC<{
  sector: OwnershipSector;
  label: string;
  shares: Record<string, number>;
  summary: { workers: number; socialized: number; private: number; ceiling: number };
  isZh: boolean;
}> = ({ sector, label, shares, summary, isZh }) => (
  <div className="border-2 border-ink/40 p-2 bg-paper">
    <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 pb-1 border-b border-ink/20">
      {label}
    </div>
    {OWNERSHIP_LABELS[sector].map((entry) => (
      <div key={entry.key} className="flex items-center gap-1.5 py-[1px]">
        <span
          className="w-2 h-2 border border-ink/50 shrink-0"
          style={{ backgroundColor: OWNERSHIP_COLORS[sector][entry.key] }}
        />
        <span className="text-[10px] font-typewriter opacity-80 flex-1 leading-tight">
          {isZh ? entry.labelZh : entry.label}
        </span>
        <span className="text-[10px] font-bold font-typewriter tabular-nums">
          {shares[entry.key] ?? 0}%
        </span>
      </div>
    ))}
    <div className="mt-1.5 pt-1.5 border-t border-ink/20 text-[9px] font-typewriter space-y-0.5">
      <div className="flex justify-between">
        <span>{isZh ? '劳动者' : 'Workers'}</span>
        <span className="font-bold tabular-nums">{summary.workers}%</span>
      </div>
      <div className="flex justify-between">
        <span>{isZh ? '社会化' : 'Socialized'}</span>
        <span className="font-bold tabular-nums">{summary.socialized}%</span>
      </div>
      <div className="flex justify-between">
        <span>{isZh ? '私人' : 'Private'}</span>
        <span className="font-bold tabular-nums">{summary.private}%</span>
      </div>
      <div className="flex justify-between opacity-70">
        <span>{isZh ? '社会化上限' : 'Ceiling'}</span>
        <span className="font-bold tabular-nums">{summary.ceiling}%</span>
      </div>
    </div>
  </div>
);

const CounterRow: React.FC<{
  label: string;
  value: number;
  cap?: number;
  isZh: boolean;
}> = ({ label, value, cap, isZh }) => (
  <div className="flex items-baseline justify-between gap-2 py-0.5">
    <span className="text-[10px] font-typewriter opacity-80 leading-tight">{label}</span>
    <span className={`text-[11px] font-bold font-typewriter tabular-nums ${value > 0 ? 'text-ink' : 'text-ink/40'}`}>
      {cap === undefined ? value : `${value}/${cap}`}
    </span>
  </div>
);

const RouteRow: React.FC<{
  journalId: string;
  progress: number;
  status: string;
  isZh: boolean;
}> = ({ journalId, progress, status, isZh }) => {
  const def = getJournalEntryDef(journalId);
  if (!def) return null;
  const [statusEn, statusZh] = STATUS_LABEL[status] ?? [status, status];
  const tone = status === 'completed'
    ? 'text-green-700'
    : status === 'failed'
      ? 'text-cnt-red'
      : status === 'active'
        ? 'text-ink'
        : 'text-ink/40';
  return (
    <div className="mb-2.5">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[11px] font-bold uppercase leading-tight">
          {isZh ? def.titleZh : def.title}
        </span>
        <span className={`text-[9px] font-typewriter font-bold uppercase shrink-0 ${tone}`}>
          {isZh ? statusZh : statusEn}
        </span>
      </div>
      <div className="w-full bg-ink/10 h-2 border border-ink/40 overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ${status === 'failed' ? 'bg-cnt-red/60' : 'bg-ink'}`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      <div className="text-[9px] font-typewriter opacity-60 mt-0.5 leading-tight">
        {isZh ? def.successConditionZh : def.successCondition}
      </div>
    </div>
  );
};

const EconomyReformBody: React.FC<{ model: EconomyReformViewModel; isZh: boolean }> = ({ model, isZh }) => {
  const { counters, pushes, pushLimits, graphs, journal } = model;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {COUNTER_GROUPS.map((group) => {
          const Icon = group.icon;
          const active = group.counters.some(({ key }) => (counters as Record<string, number>)[key] > 0);
          return (
            <div
              key={group.key}
              className={`border-2 border-ink/40 p-2 ${active ? 'bg-paper' : 'bg-paper-dark/40'}`}
            >
              <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-ink/20">
                <Icon size={12} className={active ? 'text-ink' : 'text-ink/40'} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isZh ? group.labelZh : group.label}
                </span>
              </div>
              {group.counters.map(({ key, label, labelZh }) => (
                <CounterRow
                  key={key}
                  label={isZh ? labelZh : label}
                  value={(counters as Record<string, number>)[key] ?? 0}
                  cap={(ECONOMY_REFORM_CAPS as Record<string, number>)[key]}
                  isZh={isZh}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="border-2 border-ink/40 bg-paper-dark/40 p-2">
        <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5">
          {isZh ? '计数器月度经济影响（已停用）' : 'Counter monthly effects (paused)'}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-typewriter">
          <div className="flex justify-between"><span>{isZh ? '增长目标' : 'Growth target'}</span><span className="font-bold tabular-nums">{formatGraph(graphs.growthGraph)}</span></div>
          <div className="flex justify-between"><span>{isZh ? '通胀目标' : 'Inflation target'}</span><span className="font-bold tabular-nums">{formatGraph(graphs.inflationGraph)}</span></div>
          <div className="flex justify-between"><span>{isZh ? '月度外汇' : 'Monthly FX'}</span><span className="font-bold tabular-nums">{formatGraph(graphs.foreignExchangeGraph)}</span></div>
          <div className="flex justify-between"><span>{isZh ? '月度财政' : 'Monthly treasury'}</span><span className="font-bold tabular-nums">{formatGraph(graphs.budgetGraph)}</span></div>
        </div>
        {graphs.consumptionTaxBaseFactor < 1 && (
          <div className="mt-1.5 pt-1.5 border-t border-ink/20 text-[10px] font-typewriter text-cnt-red font-bold">
            {isZh
              ? `货币已废除：消费税税基 ×${graphs.consumptionTaxBaseFactor}（共和国的征税能力被放弃）`
              : `Money abolished: consumption tax base ×${graphs.consumptionTaxBaseFactor} (the Republic's tax capacity given up)`}
          </div>
        )}
        <div className="mt-1.5 pt-1.5 border-t border-ink/20 text-[10px] font-typewriter opacity-60">
          {isZh
            ? '经济改造计数器只记录进度，不自动修正宏观经济；行动本身的即时效果仍生效。'
            : 'Reform counters only track progress and add no automatic macro modifiers. Direct action effects still apply.'}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider mb-2 pb-1 border-b-2 border-ink/20">
          {isZh ? '六条经济路线' : 'The six economic routes'}
        </div>
        {model.routeJournalIds.map((journalId) => (
          <RouteRow
            key={journalId}
            journalId={journalId}
            progress={model.progressById[journalId] ?? 0}
            status={journal?.[journalId]?.status ?? 'inactive'}
            isZh={isZh}
          />
        ))}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2 mb-2 pb-1 border-b-2 border-ink/20">
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {isZh ? '生产资料归属' : 'Ownership of production'}
          </span>
          <span className="text-[9px] font-typewriter opacity-60 shrink-0">
            {isZh ? '计数器不自动转移所有权' : 'Counters do not transfer ownership'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {OWNERSHIP_SECTORS.map((sector) => (
            <OwnershipColumn
              key={sector.key}
              sector={sector.key}
              label={isZh ? sector.labelZh : sector.label}
              shares={model.ownership[sector.key] as unknown as Record<string, number>}
              summary={model.ownershipSummary[sector.key]}
              isZh={isZh}
            />
          ))}
        </div>
        <div className="mt-1.5 text-[9px] font-typewriter opacity-60 leading-tight">
          {isZh
            ? '计数器仅用于完成判定；生产资料归属只由明确的行动效果、事件和其他所有权规则改变。'
            : 'Counters only determine completion. Explicit action effects, events, and other ownership rules can change these shares.'}
        </div>
      </div>

      <div className="border-t-2 border-ink/20 pt-2 text-[10px] font-typewriter space-y-0.5">
        <div className="flex justify-between">
          <span>{isZh ? '佩罗：推动合作社方案' : 'Peiró: cooperative programme'}</span>
          <span className="font-bold tabular-nums">{pushes.cooperative}/{pushLimits.cooperative}</span>
        </div>
        <div className="flex justify-between">
          <span>{isZh ? '桑蒂利安：推动有机工团方案' : 'Santillán: organic programme'}</span>
          <span className="font-bold tabular-nums">{pushes.organic}/{pushLimits.organic}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * `dense` 用于塞进 `EconomyModal`（那里已经有自己的标题与折叠层级）；
 * 默认布局用于 `JournalPanel` 的独立抽屉。
 */
export const EconomyReformPanel: React.FC<{ dense?: boolean }> = ({ dense = false }) => {
  const model = useGameSelector(selectEconomyReformViewModel, areEconomyReformViewModelsEqual);
  const isZh = model.language === 'zh';

  if (dense) return <EconomyReformBody model={model} isZh={isZh} />;

  return (
    <div className="border-2 border-ink bg-paper p-3 shadow-[3px_3px_0px_#141414]">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-ink/20">
        <Wrench size={14} />
        <h4 className="font-bold text-sm uppercase tracking-wider flex-1">
          {isZh ? '经济改造' : 'Economic Reform'}
        </h4>
        <span className="text-[9px] font-typewriter opacity-60 uppercase">
          {isZh ? '生产关系' : 'Production relations'}
        </span>
      </div>
      <EconomyReformBody model={model} isZh={isZh} />
    </div>
  );
};
