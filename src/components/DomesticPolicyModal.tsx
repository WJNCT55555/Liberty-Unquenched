import React, { useState } from 'react';
import { GameState } from '../game/types';
import { ShieldAlert, BookOpen, Scaling, Hammer, Sprout, Heart, Baby, Book, X, ArrowLeft, Languages, Users, ShieldCheck, Swords, Crosshair, UserCheck } from 'lucide-react';
import { LAW_DEFINITIONS, getPolicyEffectLines, type PolicyCategory, type PolicyDefinition } from '../game/rules/policyDefinitions';
import {
  getLaborPressureCampaign,
  getLaborPressureResistance,
  getLaborPressureThreshold,
  LABOR_PRESSURE_LABELS,
} from '../game/rules/laborPressure';
import { HerculesRail } from './HerculesRail';

type PolicyViewDefinition = PolicyDefinition & { icon: React.ReactNode };

const POLICY_ICONS: Record<PolicyDefinition['id'], React.ReactNode> = {
  max_hours_law: <Scaling className="w-5 h-5" />,
  min_wage: <BookOpen className="w-5 h-5" />,
  workplace_safety: <ShieldAlert className="w-5 h-5" />,
  union_status: <Users className="w-5 h-5" />,
  land_law: <Sprout className="w-5 h-5" />,
  political_rights: <Baby className="w-5 h-5" />,
  womens_rights: <Users className="w-5 h-5" />,
  religion_policy: <Heart className="w-5 h-5" />,
  education_institutions: <Book className="w-5 h-5" />,
  language_policy: <Languages className="w-5 h-5" />,
  public_order_law: <ShieldCheck className="w-5 h-5" />,
  security_corps_law: <Crosshair className="w-5 h-5" />,
  army_reform_law: <Swords className="w-5 h-5" />,
  militia_legality_law: <UserCheck className="w-5 h-5" />,
};

export const POLICIES_DEF: Record<PolicyCategory, PolicyViewDefinition[]> = {
  economy: LAW_DEFINITIONS
    .filter(policy => policy.category === 'economy')
    .map(policy => ({ ...policy, icon: POLICY_ICONS[policy.id] })),
  society: LAW_DEFINITIONS
    .filter(policy => policy.category === 'society')
    .map(policy => ({ ...policy, icon: POLICY_ICONS[policy.id] })),
  security: LAW_DEFINITIONS
    .filter(policy => policy.category === 'security')
    .map(policy => ({ ...policy, icon: POLICY_ICONS[policy.id] })),
};

const CATEGORY_META: Record<PolicyCategory, { zh: string; en: string; icon: React.ReactNode }> = {
  economy: { zh: '社会经济', en: 'Socioeconomics', icon: <Hammer className="h-4 w-4" /> },
  society: { zh: '社会权利', en: 'Social Rights', icon: <Book className="h-4 w-4" /> },
  security: { zh: '社会安全', en: 'Social Security', icon: <ShieldCheck className="h-4 w-4" /> },
};

const categoryOrder: PolicyCategory[] = ['economy', 'society', 'security'];
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#51335c]';

const getLawIconFilename = (policyId: PolicyDefinition['id'], level: number): string => `${policyId}_${level}.png`;

const getCurrentLevelValue = (state: GameState, policy: PolicyDefinition): number =>
  Math.max(0, Math.min(policy.levels.length - 1, Number(state.domesticPolicy[policy.id] ?? 0)));

const LawIcon: React.FC<{
  policyId: PolicyDefinition['id'];
  level: number;
  fallback: React.ReactNode;
  className?: string;
}> = ({ policyId, level, fallback, className = '' }) => {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`law-page__icon text-[#3c3832] ${className}`}>
      {!failed && (
        <img
          src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(policyId, level)}`}
          alt=""
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <span className="flex h-full w-full items-center justify-center [&_svg]:h-6 [&_svg]:w-6">{fallback}</span>
      )}
    </span>
  );
};

const LawPips: React.FC<{ levels: PolicyDefinition['levels']; current: number }> = ({ levels, current }) => (
  <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
    {levels.map(level => (
      <span
        key={level.level}
        className={`law-page__pip ${
          level.level < current
            ? 'law-page__pip--past'
            : level.level === current
              ? 'law-page__pip--current'
              : ''
        }`}
      />
    ))}
  </span>
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  isZh: boolean;
}

export const DomesticPolicyModal: React.FC<Props> = ({ isOpen, onClose, state, isZh }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyViewDefinition | null>(null);
  const pressure = getLaborPressureCampaign(state);
  const pressureResistance = pressure
    ? getLaborPressureResistance(state, pressure.lawId, pressure.targetLevel)
    : null;

  if (!isOpen) return null;

  const activeLevelValue = activePolicy ? getCurrentLevelValue(state, activePolicy) : 0;

  const renderPolicyCard = (policy: PolicyViewDefinition) => {
    const levelValue = getCurrentLevelValue(state, policy);
    const levelDefinition = policy.levels.find(level => level.level === levelValue) ?? policy.levels[0];
    const effectLines = getPolicyEffectLines(policy.id, levelValue, state, isZh);
    const primaryEffect = effectLines[0] ?? '';

    return (
      <button
        key={policy.id}
        type="button"
        onClick={() => setActivePolicy(policy)}
        className="law-page__card law-page__card--interactive p-3"
      >
        <div className="flex gap-3">
          <LawIcon
            key={`${policy.id}-${levelValue}`}
            policyId={policy.id}
            level={levelValue}
            fallback={policy.icon}
            className="w-[60px] self-stretch"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-sans text-[11px] font-semibold leading-none tracking-[0.06em] text-[#5d574e]">
                {isZh ? policy.name.zh : policy.name.en}
              </span>
              <LawPips levels={policy.levels} current={levelValue} />
            </div>
            <h4 className="mt-1.5 font-serif text-[17px] font-bold leading-snug text-[#211f1c]">
              {isZh ? levelDefinition.name.zh : levelDefinition.name.en}
            </h4>
            <div className="mt-auto pt-2">
              <div className="law-page__hairline" />
              <div
                className="mt-1.5 flex items-center gap-1.5"
                title={effectLines.join(isZh ? '；' : '; ')}
              >
                <span className="h-1.5 w-1.5 shrink-0 bg-[#9c7321]" aria-hidden="true" />
                <span className="truncate font-mono text-[10.5px] leading-relaxed text-[#3c3832]">
                  {primaryEffect}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const renderCategoryPanel = (category: PolicyCategory) => {
    const meta = CATEGORY_META[category];

    return (
      <section
        key={category}
        className="flex min-w-0 flex-col border border-[#524c44] bg-[#f0e9da]"
      >
        <header className="flex items-center gap-2.5 border-b border-[#524c44] border-t-2 border-t-[#51335c] bg-[#e6decb] px-3 py-2">
          <span className="law-page__icon h-7 w-7 text-[#3c3832]">{meta.icon}</span>
          <h3 className="truncate font-serif text-[16px] font-bold leading-none text-[#211f1c]">
            {isZh ? meta.zh : meta.en}
          </h3>
        </header>
        <div className="flex flex-1 flex-col gap-2 p-2.5">
          {POLICIES_DEF[category].map(renderPolicyCard)}
        </div>
      </section>
    );
  };

  const renderLevelCard = (levelDefinition: PolicyDefinition['levels'][number]) => {
    if (!activePolicy) return null;

    const isCurrent = levelDefinition.level === activeLevelValue;
    const effectLines = getPolicyEffectLines(activePolicy.id, levelDefinition.level, state, isZh);

    return (
      <article
        key={`${activePolicy.id}-${levelDefinition.level}`}
        className={`law-page__card p-3 ${isCurrent ? 'law-page__card--current' : ''}`}
        aria-current={isCurrent ? 'true' : undefined}
      >
        <div className="flex gap-3">
          <LawIcon
            policyId={activePolicy.id}
            level={levelDefinition.level}
            fallback={activePolicy.icon}
            className="h-16 w-16"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-typewriter text-[9px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                  {isZh ? `等级 L${levelDefinition.level}` : `Level ${levelDefinition.level}`}
                </div>
                <h4 className="mt-1 font-serif text-[20px] font-bold leading-tight text-[#211f1c]">
                  {isZh ? levelDefinition.name.zh : levelDefinition.name.en}
                </h4>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <LawPips levels={activePolicy.levels} current={activeLevelValue} />
                {isCurrent && (
                  <span className="border border-[#c1272d] bg-[#f7f2e7] px-1.5 py-0.5 font-typewriter text-[8px] font-bold uppercase leading-none tracking-[0.1em] text-[#c1272d]">
                    {isZh ? '当前生效' : 'Active'}
                  </span>
                )}
              </div>
            </div>
            <p className={`mt-2 text-[12.5px] leading-relaxed ${isCurrent ? 'text-[#211f1c]' : 'text-[#3c3832]'}`}>
              {isZh ? levelDefinition.description.zh : levelDefinition.description.en}
            </p>

            {effectLines.length > 0 && (
              <div className="mt-3">
                <div className="law-page__hairline" />
                <div className="mt-2">
                  <div className="font-typewriter text-[9px] uppercase leading-none tracking-[0.18em] text-[#8a8175]">
                    {isZh ? '月度效果' : 'Monthly effect'}
                  </div>
                  <div className="mt-1.5 grid gap-1">
                    {effectLines.map((line, index) => (
                      <div key={index} className="flex items-start gap-1.5">
                        <span className="mt-[5px] h-1 w-1 shrink-0 bg-[#9c7321]" aria-hidden="true" />
                        <span className="font-mono text-[10.5px] leading-relaxed text-[#3c3832]">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="law-page law-page__backdrop fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="law-page__window flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden">
        <div className="law-page__tricolor shrink-0" aria-hidden="true" />

        <header className="shrink-0 border-b-[3px] border-double border-[#524c44] bg-[#f0e9da] px-4 py-3 md:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {activePolicy && (
                <button
                  type="button"
                  onClick={() => setActivePolicy(null)}
                  className={`flex shrink-0 items-center gap-1.5 border border-[#524c44] bg-[#dcd2bc] px-2.5 py-1.5 text-[11px] font-semibold text-[#211f1c] transition-colors hover:bg-[#d0c3a8] ${focusRing}`}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{isZh ? '返回' : 'Back'}</span>
                </button>
              )}
              {activePolicy && (
                <LawIcon
                  key={`${activePolicy.id}-${activeLevelValue}`}
                  policyId={activePolicy.id}
                  level={activeLevelValue}
                  fallback={activePolicy.icon}
                  className="h-12 w-12"
                />
              )}
              <div className="min-w-0">
                {activePolicy && (
                  <div className="font-typewriter text-[8px] uppercase leading-none tracking-[0.24em] text-[#51335c]">
                    {isZh ? CATEGORY_META[activePolicy.category].zh : CATEGORY_META[activePolicy.category].en}
                  </div>
                )}
                <h2
                  className={`truncate font-serif font-bold leading-tight text-[#211f1c] ${
                    activePolicy ? 'mt-1 text-[20px] md:text-[24px]' : 'text-[21px] md:text-[26px]'
                  }`}
                >
                  {activePolicy
                    ? (isZh ? activePolicy.name.zh : activePolicy.name.en)
                    : (isZh ? '国内政策法案' : 'Domestic Policies')}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`shrink-0 border border-[#524c44] bg-[#dcd2bc] p-1.5 text-[#211f1c] transition-colors hover:bg-[#d0c3a8] ${focusRing}`}
              aria-label={isZh ? '关闭' : 'Close'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {pressure && pressureResistance && (
          <div className="shrink-0 border-b border-[#9c7321] bg-[#ece0c4] px-4 py-2.5">
            <div className="text-[11px] font-semibold leading-relaxed text-[#755118]">
              {isZh ? '议会外劳工诉求：' : 'Labor demand outside parliament: '}
              {isZh ? LABOR_PRESSURE_LABELS[pressure.lawId].zh : LABOR_PRESSURE_LABELS[pressure.lawId].en}
              {' '}L{state.domesticPolicy[pressure.lawId]} → L{pressure.targetLevel}
              {' · '}{pressure.points}/{getLaborPressureThreshold(state, pressure.lawId, pressure.targetLevel)}
            </div>
            <div className="mt-0.5 text-[10.5px] leading-relaxed text-[#5d574e]">
              {isZh
                ? `议会阻力 +${pressureResistance.parliament}；劳工部长阻力 +${pressureResistance.ministry}。${state.governmentCrisis || state.earlyElectionInProgress ? '政府危机期间暂停结算与衰减。' : '闲置六个月损失 1 点；达标后下月结算。'}`
                : `Cortes resistance +${pressureResistance.parliament}; labor minister resistance +${pressureResistance.ministry}. ${state.governmentCrisis || state.earlyElectionInProgress ? 'Settlement and decay pause during a government crisis.' : 'Lose 1 point after six idle months; resolve next month when ready.'}`}
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <HerculesRail side="left" />
          <div className="law-page__sheet min-h-0 flex-1 overflow-y-auto px-3 py-3.5 md:px-4 md:py-4">
            {activePolicy ? (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-2.5">
                {activePolicy.levels.map(renderLevelCard)}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {categoryOrder.map(renderCategoryPanel)}
              </div>
            )}
          </div>
          <HerculesRail side="right" />
        </div>
      </div>
    </div>
  );
};
