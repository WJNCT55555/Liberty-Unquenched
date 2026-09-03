import React, { useState } from 'react';
import { X } from 'lucide-react';
import { GameState, Party, PoliticalActor } from '../game/types';
import { calculateElectionResults } from '../game/utils';
import { getPartyColor, getPartyName } from '../game/partyNames';
import { isOrganizationEstablished } from '../game/organizations';
import { ParliamentChart } from './ParliamentChart';
import {
  getEffectiveLawStance,
  getEffectiveLawStanceScore,
  getLegalActorSeats,
  getLegalStanceActors,
  getParliamentWeightedLawSatisfaction,
  getPartyLawSatisfaction,
  LAW_DEFINITIONS,
  LawCategory,
} from '../game/lawStances';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  isZh: boolean;
}

const CATEGORY_LABELS: Record<LawCategory, { zh: string; en: string; index: string }> = {
  economy: { zh: '社会经济', en: 'Socio Economics', index: 'I' },
  society: { zh: '社会权利', en: 'Social Rights', index: 'II' },
  security: { zh: '社会安全', en: 'Social Security', index: 'III' },
};

const STANCE_META = {
  strongly_support: { zh: '强烈支持', en: 'Strongly support', className: 'text-[#14532d]' },
  support: { zh: '支持', en: 'Support', className: 'text-[#3f6212]' },
  neutral: { zh: '中立', en: 'Neutral', className: 'text-[#514b40]' },
  oppose: { zh: '反对', en: 'Oppose', className: 'text-[#b45309]' },
  strongly_oppose: { zh: '强烈反对', en: 'Strongly oppose', className: 'text-[#b91c1c]' },
} as const;

const categoryOrder: LawCategory[] = ['economy', 'society', 'security'];
const reportBorder = 'border-[#39342a]';
const formatSigned = (value: number) => `${value > 0 ? '+' : ''}${value}`;

const satisfactionTone = (value: number) => {
  if (value >= 35) return 'text-[#14532d]';
  if (value >= 10) return 'text-[#3f6212]';
  if (value <= -35) return 'text-[#b91c1c]';
  if (value <= -10) return 'text-[#b45309]';
  return 'text-[#514b40]';
};

export const LawStanceModal: React.FC<Props> = ({ isOpen, onClose, state, isZh }) => {
  const [selectedActor, setSelectedActor] = useState<PoliticalActor>('PSOE');

  if (!isOpen) return null;

  const cortes = (state.cortes || calculateElectionResults(state)) as Record<Party, number>;
  const totalSeats = Object.values(cortes).reduce((sum, seats) => sum + seats, 0);
  const actors = getLegalStanceActors(state, cortes);
  const actor = actors.includes(selectedActor) ? selectedActor : actors[0];
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
      actor: item.id === 'PRRevS'
        ? 'CNT_FAI' as PoliticalActor
        : (actors.includes(item.id as PoliticalActor) ? item.id as PoliticalActor : undefined),
      name: item.name,
      seats: item.seats,
      color: item.color,
    })),
    ...actors
      .filter(politicalActor => politicalActor === 'CNT_FAI'
        ? !chartPartyIds.has('PRRevS')
        : !chartPartyIds.has(politicalActor))
      .map(politicalActor => ({
        id: `actor-${politicalActor}`,
        actor: politicalActor,
        name: getActorLabel(politicalActor, true),
        seats: getLegalActorSeats(state, politicalActor, cortes),
        color: getPartyColor(state, politicalActor),
      })),
  ];

  function getActorLabel(politicalActor: PoliticalActor, short = false) {
    const name = getPartyName(state, politicalActor, isZh, short);
    if (politicalActor === 'CNT_FAI' && isOrganizationEstablished(state, 'PRRevS')) {
      return short ? 'CNT/PRRevS' : `${name} / PRRevS`;
    }
    return name;
  }

  const parliamentSatisfaction = getParliamentWeightedLawSatisfaction(state, cortes);
  const satisfactionRows = actors.map(politicalActor => ({
    actor: politicalActor,
    score: getPartyLawSatisfaction(state, politicalActor).overall,
    seats: getLegalActorSeats(state, politicalActor, cortes),
  }));

  const renderLawTable = (category: LawCategory) => {
    const definitions = LAW_DEFINITIONS.filter(definition => definition.category === category);
    const levelCount = Math.max(...definitions.map(definition => definition.levels.length));
    const minWidth = category === 'security' ? 'min-w-[640px]' : 'min-w-[760px]';

    return (
      <section
        key={category}
        className={`grid grid-cols-[82px_minmax(0,1fr)] border-b-2 ${reportBorder} bg-[#f1e8d2] last:border-b-0 md:grid-cols-[104px_minmax(0,1fr)]`}
      >
        <div className={`flex flex-col items-center justify-center border-r-2 ${reportBorder} bg-[#ddd0b2] px-2 py-3 text-center`}>
          <span className="font-mono text-[10px] font-bold">{CATEGORY_LABELS[category].index}.</span>
          <h3 className="mt-1 font-serif text-xs font-bold leading-tight md:text-sm">
            {isZh ? CATEGORY_LABELS[category].zh : CATEGORY_LABELS[category].en}
          </h3>
          <span className="mt-2 font-typewriter text-[7px] uppercase tracking-[0.12em] text-[#6b6254]">
            {isZh ? '分类' : 'Section'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full ${minWidth} table-fixed border-collapse text-[11px]`}>
            <thead>
              <tr className={`border-b-2 ${reportBorder}`}>
                <th className={`w-12 border-r ${reportBorder} bg-[#e4d7b9] px-1.5 py-2 text-center font-typewriter text-[9px] uppercase tracking-widest`}>
                  {isZh ? '等级' : 'Level'}
                </th>
                {definitions.map(definition => (
                  <th
                    key={definition.id}
                    className={`border-r ${reportBorder} bg-[#e8ddc3] px-2 py-2 text-left font-serif text-xs font-bold last:border-r-0`}
                  >
                    <span className="block">{isZh ? definition.name.zh : definition.name.en}</span>
                    <span className="mt-0.5 block font-typewriter text-[7px] font-normal uppercase tracking-[0.1em] text-[#665e50]">
                      {definition.id.replaceAll('_', ' ')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: levelCount }, (_, level) => (
                <tr key={level} className={`border-b ${reportBorder} last:border-b-0`}>
                  <th className={`border-r ${reportBorder} bg-[#e4d7b9] px-1.5 py-2.5 text-center align-middle font-typewriter text-xs font-bold`}>
                    L{level}
                  </th>
                  {definitions.map(definition => {
                    const levelDefinition = definition.levels[level];
                    if (!levelDefinition) {
                      return (
                        <td key={definition.id} className={`border-r ${reportBorder} bg-[#e9dfc8] px-2 py-2.5 text-center text-[#8a806d] last:border-r-0`}>
                          —
                        </td>
                      );
                    }

                    const currentLevel = Math.max(
                      0,
                      Math.min(definition.levels.length - 1, Number(state.domesticPolicy[definition.id] || 0))
                    );
                    const stance = getEffectiveLawStance(state, actor, definition.id, level);
                    const stanceScore = getEffectiveLawStanceScore(state, actor, definition.id, level);
                    const stanceMeta = STANCE_META[stance];
                    const isCurrent = level === currentLevel;

                    return (
                      <td
                        key={definition.id}
                        className={`relative border-r ${reportBorder} px-2 py-2 align-top last:border-r-0 ${isCurrent ? 'bg-[#d9c58f]' : 'bg-[#f1e8d2]'}`}
                      >
                        <div className="min-h-[48px]">
                          <div className="pr-8 font-serif text-[11px] font-semibold leading-tight text-[#27231d]">
                            {isZh ? levelDefinition.name.zh : levelDefinition.name.en}
                          </div>
                          <div className={`mt-1.5 font-typewriter text-[10px] font-bold ${stanceMeta.className}`}>
                            {isZh ? stanceMeta.zh : stanceMeta.en}
                            <span className="ml-1 font-mono text-[9px]">({formatSigned(stanceScore)})</span>
                          </div>
                          {isCurrent && (
                            <span className="absolute right-1.5 top-1.5 rotate-[-2deg] border border-[#7b2e28] px-1 py-0.5 font-typewriter text-[7px] font-bold uppercase tracking-wider text-[#7b2e28]">
                              {isZh ? '现行' : 'In force'}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-2 md:p-5">
      <div className={`flex h-[95vh] w-full max-w-[1500px] flex-col border-[3px] ${reportBorder} bg-[#ece2c8] bg-halftone shadow-[8px_8px_0_rgba(0,0,0,0.45)]`}>
        <header className={`shrink-0 border-b-[3px] ${reportBorder} bg-[#e5d8ba] px-4 py-3 md:px-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 text-center">
              <div className="font-typewriter text-[9px] uppercase tracking-[0.28em] text-[#5b5346]">
                República Española · Boletín estadístico
              </div>
              <h2 className="mt-1 font-serif text-xl font-bold uppercase tracking-[0.08em] text-[#27231d] md:text-2xl">
                {isZh ? '共和国法律与政党意见统计公报' : 'Statistical Bulletin of Laws and Party Opinion'}
              </h2>
              <div className="mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 font-typewriter text-[9px] uppercase tracking-widest text-[#5b5346]">
                <span>{isZh ? `${state.year}年${state.month}月` : `${state.month}/${state.year}`}</span>
                <span>{isZh ? `议会登记席位 ${totalSeats}` : `Registered Cortes seats ${totalSeats}`}</span>
                <span>{isZh ? `第 ${state.scenario} 年情景档案` : `Scenario archive ${state.scenario}`}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`shrink-0 border ${reportBorder} bg-transparent p-1 text-[#302b24] hover:bg-[#d7c9a9]`}
              aria-label={isZh ? '关闭' : 'Close'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#ece2c8] bg-halftone px-3 py-4 md:px-6 md:py-5">
          <section className={`border-2 ${reportBorder} bg-[#f1e8d2]`}>
            <div className={`border-b-2 ${reportBorder} bg-[#e4d7b9] px-3 py-2`}>
              <h3 className="font-serif text-base font-bold uppercase tracking-wide">
                {isZh ? '议会席位登记与党派选择' : 'Cortes Seat Register and Party Selection'}
              </h3>
            </div>

            <div className="grid items-center gap-4 p-3 lg:grid-cols-[minmax(420px,0.9fr)_minmax(500px,1.1fr)]">
              <div className="flex min-h-[260px] w-full items-center justify-center overflow-visible">
                {parliamentChartData.length > 0 ? (
                  <ParliamentChart data={parliamentChartData} width={520} height={260} />
                ) : (
                  <div className="py-12 text-center font-typewriter text-xs text-[#6b6254]">
                    {isZh ? '议会目前没有有效席位数据' : 'No active parliamentary seat data'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 xl:grid-cols-4">
                {selectableLegendEntries.map(item => {
                  const isSelected = item.actor !== undefined && item.actor === actor;
                  const content = (
                    <>
                      <span className="h-2.5 w-2.5 shrink-0 border border-[#39342a]" style={{ backgroundColor: item.color }} />
                      <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
                      <span className="shrink-0 font-mono font-bold">
                        {item.actor === 'CNT_FAI' && item.seats === 0 ? (isZh ? '院外' : 'EXT') : item.seats}
                      </span>
                    </>
                  );

                  if (item.actor === undefined) {
                    return (
                      <div key={item.id} className="flex items-center gap-1.5 border-b border-[#7b725f]/40 px-1 py-1.5 font-typewriter text-[10px] text-[#817765] opacity-70">
                        {content}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedActor(item.actor!)}
                      className={`flex items-center gap-1.5 border-b px-1 py-1.5 font-typewriter text-[10px] transition-colors ${
                        isSelected
                          ? 'border-[#7b2e28] bg-[#ded0ad] font-bold text-[#7b2e28]'
                          : 'border-[#7b725f]/40 text-[#302b24] hover:bg-[#e4d7b9]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-[190px_minmax(0,1fr)] gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className={`self-start border-2 ${reportBorder} bg-[#e8ddc3]`}>
              <div className={`border-b-2 ${reportBorder} bg-[#ddd0b2] px-2 py-2`}>
                <h3 className="font-serif text-sm font-bold leading-tight">
                  {isZh ? '现行法律体系满意度' : 'Satisfaction with Laws in Force'}
                </h3>
                <div className="mt-1 font-typewriter text-[7px] uppercase tracking-[0.12em] text-[#665e50]">
                  {isZh ? '负100 至 正100' : 'Index from -100 to +100'}
                </div>
              </div>

              <div className={`border-b-2 ${reportBorder} bg-[#d9c58f] px-2 py-2.5`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-serif text-xs font-bold">{isZh ? '议会综合' : 'Cortes Total'}</span>
                  <span className={`font-mono text-base font-black ${satisfactionTone(parliamentSatisfaction)}`}>
                    {formatSigned(parliamentSatisfaction)}
                  </span>
                </div>
                <div className="mt-1 h-1 border border-[#514b40] bg-[#eee4cc]">
                  <div
                    className={`h-full ${parliamentSatisfaction < 0 ? 'bg-[#b91c1c]' : 'bg-[#3f6212]'}`}
                    style={{ width: `${Math.abs(parliamentSatisfaction)}%` }}
                  />
                </div>
              </div>

              <div className="divide-y divide-[#7b725f]/50">
                {satisfactionRows.map(item => {
                  const isSelected = item.actor === actor;
                  return (
                    <button
                      key={item.actor}
                      onClick={() => setSelectedActor(item.actor)}
                      className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5 text-left ${
                        isSelected ? 'bg-[#d9c58f]' : 'hover:bg-[#e1d4b6]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-typewriter text-[9px] font-bold text-[#302b24]">
                          {getActorLabel(item.actor, true)}
                        </span>
                        <span className="block font-typewriter text-[7px] uppercase tracking-wide text-[#746b5b]">
                          {item.actor === 'CNT_FAI' && item.seats === 0
                            ? (isZh ? '议会外' : 'Extra-parliamentary')
                            : (isZh ? `${item.seats} 席` : `${item.seats} seats`)}
                        </span>
                      </span>
                      <span className={`font-mono text-xs font-black ${satisfactionTone(item.score)}`}>
                        {formatSigned(item.score)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="min-w-0">
              <div className={`flex min-h-[42px] flex-wrap items-baseline justify-between gap-2 border-2 border-b-0 ${reportBorder} bg-[#ded0ad] px-3 py-2`}>
                <div className="font-serif text-sm font-bold text-[#27231d] md:text-base">
                  {getActorLabel(actor)}
                </div>
                <div className="font-typewriter text-[8px] uppercase tracking-[0.12em] text-[#5b5346]">
                  {isZh ? '法律等级立场登记' : 'Position by statutory level'}
                </div>
              </div>
              <div className={`border-2 ${reportBorder}`}>
                {categoryOrder.map(renderLawTable)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
