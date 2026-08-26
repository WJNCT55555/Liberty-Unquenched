import React, { useState } from 'react';
import { X, Scale } from 'lucide-react';
import { GameState, Party, PoliticalActor } from '../game/types';
import { calculateElectionResults } from '../game/utils';
import { getPartyColor, getPartyName } from '../game/partyNames';
import { ParliamentChart } from './ParliamentChart';
import {
  getEffectiveLawStance,
  getLegalActorSeats,
  getLegalStanceActors,
  getPartyLawSatisfaction,
  getParliamentWeightedLawSatisfaction,
  LAW_DEFINITIONS,
  LawCategory,
} from '../game/lawStances';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  isZh: boolean;
}

const CATEGORY_LABELS: Record<LawCategory, { zh: string; en: string }> = {
  economy: { zh: '社会经济', en: 'Socio Economics' },
  society: { zh: '社会权利', en: 'Social Rights' },
  security: { zh: '社会安全', en: 'Social Security' },
};

const STANCE_META = {
  strongly_support: { zh: '强烈支持', en: 'Strongly support', className: 'text-emerald-800' },
  support: { zh: '支持', en: 'Support', className: 'text-emerald-700' },
  neutral: { zh: '中立', en: 'Neutral', className: 'text-ink/70' },
  oppose: { zh: '反对', en: 'Oppose', className: 'text-orange-800' },
  strongly_oppose: { zh: '强烈反对', en: 'Strongly oppose', className: 'text-red-800' },
} as const;

const formatSatisfaction = (value: number) => `${value > 0 ? '+' : ''}${value}`;

const satisfactionTone = (value: number) => {
  if (value >= 60) return 'text-emerald-800';
  if (value >= 20) return 'text-emerald-700';
  if (value <= -60) return 'text-red-800';
  if (value <= -20) return 'text-orange-800';
  return 'text-ink/70';
};

const categoryOrder: LawCategory[] = ['economy', 'society', 'security'];

export const LawStanceModal: React.FC<Props> = ({ isOpen, onClose, state, isZh }) => {
  const [selectedActor, setSelectedActor] = useState<PoliticalActor>('PSOE');

  if (!isOpen) return null;

  const cortes = (state.cortes || calculateElectionResults(state)) as Record<Party, number>;
  const totalSeats = Object.values(cortes).reduce((sum, seats) => sum + seats, 0);
  const actors = getLegalStanceActors(state, cortes);
  const actor = actors.includes(selectedActor) ? selectedActor : actors[0];
  const satisfaction = actor ? getPartyLawSatisfaction(state, actor) : null;
  const parliamentSatisfaction = getParliamentWeightedLawSatisfaction(state, cortes);
  const parliamentChartData = Object.entries(cortes)
    .filter(([, seats]) => seats > 0)
    .sort(([, seatsA], [, seatsB]) => seatsB - seatsA)
    .map(([party, seats]) => ({
      id: party,
      name: getPartyName(state, party as Party, isZh, true),
      seats,
      color: getPartyColor(state, party as Party),
    }));
  const chartPartyIds = new Set(parliamentChartData.map(item => item.id));
  const selectableLegendEntries = [
    ...parliamentChartData.map(item => ({
      id: item.id,
      actor: item.id === 'PRRevS' ? 'CNT_FAI' as PoliticalActor : (actors.includes(item.id as PoliticalActor) ? item.id as PoliticalActor : undefined),
      name: item.name,
      seats: item.seats,
      color: item.color,
    })),
    ...actors
      .filter(politicalActor => politicalActor === 'CNT_FAI' ? !chartPartyIds.has('PRRevS') : !chartPartyIds.has(politicalActor))
      .map(politicalActor => ({
        id: `actor-${politicalActor}`,
        actor: politicalActor,
        name: actorLabelPlaceholder(politicalActor),
        seats: getLegalActorSeats(state, politicalActor, cortes),
        color: getPartyColor(state, politicalActor),
      })),
  ];

  function actorLabelPlaceholder(politicalActor: PoliticalActor) {
    const name = getPartyName(state, politicalActor, isZh, true);
    return politicalActor === 'CNT_FAI' && state.isPRRevSFormed ? 'CNT/PRRevS' : name;
  }

  const actorLabel = (politicalActor: PoliticalActor, short = false) => {
    const name = getPartyName(state, politicalActor, isZh, short);
    if (politicalActor === 'CNT_FAI' && state.isPRRevSFormed) {
      return short ? 'CNT/PRRevS' : `${name}（CNT-FAI法律立场）`;
    }
    return name;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-6">
      <div className="bg-paper border-2 border-ink w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl">
        <div className="border-b-2 border-ink/30 p-4 flex items-center justify-between bg-ink/5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Scale className="w-6 h-6 text-cnt-red shrink-0" />
            <div className="min-w-0">
              <h2 className="font-typewriter text-xl md:text-2xl font-bold truncate">
                {isZh ? '法律立场矩阵与议会满意度' : 'Legal Stance Matrix & Parliamentary Satisfaction'}
              </h2>
              <p className="text-[10px] md:text-xs text-ink/60 mt-0.5">
                {isZh ? '法律为行，法律等级为列；点击政党切换其支持表格。' : 'Laws are rows and levels are columns; select a party to view its table.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-ink/10 border border-transparent hover:border-ink shrink-0" aria-label={isZh ? '关闭' : 'Close'}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-halftone space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-ink/25 bg-paper p-3">
              <div className="text-[9px] uppercase text-ink-light font-bold">{isZh ? '议会席位' : 'Cortes Seats'}</div>
              <div className="font-mono font-bold text-xl">{totalSeats} / 470</div>
              <div className="text-[10px] text-ink/60">{isZh ? '通过门槛：236席' : 'Majority: 236 seats'}</div>
            </div>
            <div className="border border-ink/25 bg-paper p-3">
              <div className="text-[9px] uppercase text-ink-light font-bold">{isZh ? '议会法律满意度' : 'Parliamentary satisfaction'}</div>
              <div className={`font-mono font-bold text-xl ${satisfactionTone(parliamentSatisfaction)}`}>{formatSatisfaction(parliamentSatisfaction)}</div>
              <div className="text-[10px] text-ink/60">{isZh ? '按纳入计算的席位加权' : 'Weighted by included seats'}</div>
            </div>
            <div className="border border-ink/25 bg-paper p-3 col-span-2">
              <div className="text-[9px] uppercase text-ink-light font-bold mb-1">{isZh ? '计算规则' : 'Calculation rule'}</div>
              <div className="text-[11px] leading-relaxed text-ink/75">
                {isZh ? '强烈支持 +2，支持 +1，中立 0，反对 -1，强烈反对 -2。PRRevS 与 Other 不拥有独立法律立场。' : 'Strongly support +2, support +1, neutral 0, oppose -1, strongly oppose -2. PRRevS and Other have no independent legal stance.'}
              </div>
            </div>
          </div>

          <section className="border-2 border-ink bg-paper p-4">
            <div className="border-b border-ink/20 pb-3 mb-3">
              <h3 className="font-typewriter text-lg font-bold">{isZh ? '议会席位图与政党选择' : 'Parliamentary Seat Chart & Party Selection'}</h3>
              <p className="text-[10px] text-ink/60 mt-1">{isZh ? '点击右侧图例中的政党，切换其法律立场表格。' : 'Click a party in the legend to switch its legal stance table.'}</p>
            </div>
            <div className="flex flex-col lg:flex-row gap-5 items-center">
              <div className="w-full lg:w-3/5 flex justify-center overflow-hidden">
                {parliamentChartData.length > 0 ? (
                  <ParliamentChart data={parliamentChartData} width={460} height={220} />
                ) : (
                  <div className="text-center py-8 text-ink/45 font-typewriter text-sm">
                    {isZh ? '议会目前没有有效席位数据' : 'No active parliamentary seat data'}
                  </div>
                )}
              </div>
              <div className="w-full lg:w-2/5 grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {selectableLegendEntries.map(item => {
                  const isSelected = item.actor !== undefined && item.actor === actor;
                  const content = (
                    <>
                      <span className="w-2.5 h-2.5 shrink-0 border border-ink/15" style={{ backgroundColor: item.color }} />
                      <span className="truncate flex-1 text-left">{item.name}</span>
                      <span className="font-bold shrink-0">{item.seats}{isZh ? '席' : 'S'}</span>
                    </>
                  );
                  if (item.actor === undefined) {
                    return <div key={item.id} className="flex items-center gap-1.5 px-1.5 py-1 text-[10px] font-mono text-ink/55">{content}</div>;
                  }
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedActor(item.actor!)}
                      className={`flex items-center gap-1.5 px-1.5 py-1 text-[10px] font-mono border text-left ${isSelected ? 'border-cnt-red bg-cnt-red/10 text-cnt-red' : 'border-transparent hover:border-ink/30'}`}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {actor && satisfaction && (
            <section className="border-2 border-ink bg-paper p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-typewriter text-lg font-bold">{actorLabel(actor)}</h3>
                </div>
                <div className={`font-mono font-bold text-2xl ${satisfactionTone(satisfaction.overall)}`}>{formatSatisfaction(satisfaction.overall)} / 100</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categoryOrder.map(category => (
                  <div key={category} className="border border-ink/15 p-2">
                    <div className="text-[9px] text-ink-light uppercase font-bold">{isZh ? CATEGORY_LABELS[category].zh : CATEGORY_LABELS[category].en}</div>
                    <div className={`font-mono font-bold ${satisfactionTone(satisfaction.byCategory[category])}`}>{formatSatisfaction(satisfaction.byCategory[category])}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="border-2 border-ink bg-paper">
            <div className="border-b-2 border-ink/20 px-4 py-3 bg-ink/5">
              <h3 className="font-typewriter text-lg font-bold">{isZh ? '法律立场表格' : 'Legal Stance Table'}</h3>
              <p className="text-[10px] text-ink/60 mt-1">{isZh ? '当前法律等级使用浅色高亮；立场分数保留用于未来法案支持计算。' : 'The current level is highlighted; stance scores remain available for future bill support calculations.'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ink/25 bg-ink/[0.03]">
                    <th className="sticky left-0 z-10 bg-paper text-left p-2 min-w-[220px] font-typewriter">{isZh ? '法律（当前等级）' : 'Law (current level)'}</th>
                    {[0, 1, 2, 3, 4].map(level => <th key={level} className="p-2 min-w-[130px] text-center font-mono">L{level}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {LAW_DEFINITIONS.map(definition => {
                    const currentLevel = Math.max(0, Math.min(definition.levels.length - 1, Number(state.domesticPolicy[definition.id] || 0)));
                    return (
                      <tr key={definition.id} className="border-b border-ink/10 hover:bg-ink/[0.02]">
                        <td className="sticky left-0 z-10 bg-paper p-2 align-top">
                          <div className="flex items-start gap-1.5 text-left w-full">
                            <span>
                              <span className="block font-bold font-typewriter">{isZh ? definition.name.zh : definition.name.en}</span>
                              <span className="block text-[10px] text-cnt-red font-mono mt-0.5">{isZh ? `当前 L${currentLevel}：${definition.levels[currentLevel].name.zh}` : `Current L${currentLevel}: ${definition.levels[currentLevel].name.en}`}</span>
                            </span>
                          </div>
                        </td>
                        {[0, 1, 2, 3, 4].map(level => {
                          const levelDefinition = definition.levels[level];
                          if (!levelDefinition) return <td key={level} className="p-2 text-center text-ink/20">—</td>;
                          const stance = getEffectiveLawStance(state, actor!, definition.id, level);
                          const meta = STANCE_META[stance];
                          return (
                            <td key={level} className={`p-2 text-center ${level === currentLevel ? 'bg-amber-100/60' : ''}`}>
                              <div title={`${levelDefinition.name.en}: ${isZh ? meta.zh : meta.en}`} className={`mx-auto flex items-center justify-center w-[112px] h-9 font-typewriter font-bold text-[11px] ${meta.className}`}>
                                {isZh ? meta.zh : meta.en}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
