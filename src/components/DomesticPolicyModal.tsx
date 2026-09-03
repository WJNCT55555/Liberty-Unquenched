import React, { useState } from 'react';
import { GameState } from '../game/types';
import { ShieldAlert, BookOpen, Scaling, Hammer, Sprout, Heart, Baby, Book, X, Languages, Users, ShieldCheck, Swords, Crosshair, UserCheck } from 'lucide-react';
import { POLICY_DEFINITIONS, getPolicyEffectLines, type PolicyCategory, type PolicyDefinition } from '../game/rules/policyDefinitions';

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
  economy: POLICY_DEFINITIONS
    .filter(policy => policy.category === 'economy')
    .map(policy => ({ ...policy, icon: POLICY_ICONS[policy.id] })),
  society: POLICY_DEFINITIONS
    .filter(policy => policy.category === 'society')
    .map(policy => ({ ...policy, icon: POLICY_ICONS[policy.id] })),
  security: POLICY_DEFINITIONS
    .filter(policy => policy.category === 'security')
    .map(policy => ({ ...policy, icon: POLICY_ICONS[policy.id] })),
};

const getLawIconFilename = (policyId: PolicyDefinition['id'], level: number): string => `${policyId}_${level}.png`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  isZh: boolean;
}

export const DomesticPolicyModal: React.FC<Props> = ({ isOpen, onClose, state, isZh }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyViewDefinition | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-paper border-2 border-ink w-full max-w-5xl md:h-[80vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="border-b-2 border-ink border-opacity-30 p-4 flex justify-between items-center bg-ink/5">
          <div className="flex items-center gap-4">
            {activePolicy && (
              <button 
                onClick={() => setActivePolicy(null)}
                className="flex items-center gap-1 text-sm font-bold bg-ink text-paper px-3 py-1 hover:bg-ink-light transition-colors"
              >
                <span>{isZh ? '返回' : 'Back'}</span>
              </button>
            )}
            <h2 className="font-typewriter text-2xl font-bold">
              {activePolicy 
                ? (isZh ? activePolicy.name.zh : activePolicy.name.en) 
                : (isZh ? '国内政策法案' : 'Domestic Policies')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-ink/10 transition-colors border border-transparent hover:border-ink"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {!activePolicy ? (
            <>
              {/* Overview Mode: Left Column - Economy */}
              <div className="flex-1 border-r-0 md:border-r-2 border-ink border-opacity-30 p-6 overflow-y-auto flex flex-col gap-6">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <Hammer className="w-6 h-6 text-ink-light" />
                  {isZh ? '社会经济' : 'Socioeconomics'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.economy.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevel = policy.levels.find(l => l.level === currentValue);
                    const currentLevelName = currentLevel?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex gap-4 bg-transparent hover:bg-ink hover:text-paper group"
                      >
                        {/* Current Law Icon on Left */}
                        <div className="flex-shrink-0 w-12 h-12 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm relative group-hover:border-paper/20">
                          <img 
                            src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(policy.id, currentLevel?.level ?? 0)}`}
                            alt={policy.levels.find(l => l.level === currentValue)?.name.en || ''}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ display: 'none' }}
                            onLoad={(e) => {
                              e.currentTarget.style.display = 'block';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'none';
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="flex items-center justify-center text-ink/40 group-hover:text-paper/60 w-full h-full">
                            {policy.icon}
                          </div>
                        </div>

                        {/* Content on Right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold font-typewriter text-lg group-hover:text-paper truncate">
                              {isZh ? policy.name.zh : policy.name.en}
                            </span>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              {policy.levels.map((lvl) => (
                                <div 
                                  key={lvl.level} 
                                  className={`w-3 h-3 rounded-full border border-ink/20 ${
                                    lvl.level === currentValue 
                                      ? 'bg-cnt-red group-hover:bg-paper' 
                                      : (lvl.level < currentValue 
                                          ? 'bg-ink/40 group-hover:bg-paper/40'
                                          : 'bg-transparent group-hover:bg-paper/10')
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-ink-light group-hover:text-paper/80 mt-1 truncate">
                            {isZh ? currentLevelName?.zh : currentLevelName?.en}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overview Mode: Right Column - Society */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-ink/5">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <Book className="w-6 h-6 text-ink-light" />
                  {isZh ? '社会权利' : 'Social Rights'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.society.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevel = policy.levels.find(l => l.level === currentValue);
                    const currentLevelName = currentLevel?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex gap-4 bg-paper hover:bg-ink hover:text-paper group shadow-sm"
                      >
                        {/* Current Law Icon on Left */}
                        <div className="flex-shrink-0 w-12 h-12 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm relative group-hover:border-paper/20">
                          <img 
                            src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(policy.id, currentLevel?.level ?? 0)}`}
                            alt={policy.levels.find(l => l.level === currentValue)?.name.en || ''}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ display: 'none' }}
                            onLoad={(e) => {
                              e.currentTarget.style.display = 'block';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'none';
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="flex items-center justify-center text-ink/40 group-hover:text-paper/60 w-full h-full">
                            {policy.icon}
                          </div>
                        </div>

                        {/* Content on Right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold font-typewriter text-lg group-hover:text-paper truncate">
                              {isZh ? policy.name.zh : policy.name.en}
                            </span>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              {policy.levels.map((lvl) => (
                                <div 
                                  key={lvl.level} 
                                  className={`w-3 h-3 rounded-full border border-ink/20 ${
                                    lvl.level === currentValue 
                                      ? 'bg-cnt-red group-hover:bg-paper' 
                                      : (lvl.level < currentValue 
                                          ? 'bg-ink/40 group-hover:bg-paper/40'
                                          : 'bg-transparent group-hover:bg-paper/10')
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-ink-light group-hover:text-paper/80 mt-1 truncate">
                            {isZh ? currentLevelName?.zh : currentLevelName?.en}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overview Mode: Right Column - Security */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-ink/5 border-l-0 md:border-l-2 border-ink border-opacity-30">
                <h3 className="font-typewriter text-xl font-bold mb-2 flex items-center gap-2 border-b-2 border-ink pb-2">
                  <ShieldCheck className="w-6 h-6 text-ink-light" />
                  {isZh ? '社会安全' : 'Social Security'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POLICIES_DEF.security.map((policy) => {
                    const currentValue = state.domesticPolicy[policy.id];
                    const currentLevel = policy.levels.find(l => l.level === currentValue);
                    const currentLevelName = currentLevel?.name;

                    return (
                      <button
                        key={policy.id}
                        onClick={() => setActivePolicy(policy)}
                        className="text-left p-4 border border-ink transition-all flex gap-4 bg-paper hover:bg-ink hover:text-paper group shadow-sm"
                      >
                        {/* Current Law Icon on Left */}
                        <div className="flex-shrink-0 w-12 h-12 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm relative group-hover:border-paper/20">
                          <img 
                            src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(policy.id, currentLevel?.level ?? 0)}`}
                            alt={policy.levels.find(l => l.level === currentValue)?.name.en || ''}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ display: 'none' }}
                            onLoad={(e) => {
                              e.currentTarget.style.display = 'block';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'none';
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="flex items-center justify-center text-ink/40 group-hover:text-paper/60 w-full h-full">
                            {policy.icon}
                          </div>
                        </div>

                        {/* Content on Right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold font-typewriter text-lg group-hover:text-paper truncate">
                              {isZh ? policy.name.zh : policy.name.en}
                            </span>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              {policy.levels.map((lvl) => (
                                <div 
                                  key={lvl.level} 
                                  className={`w-3 h-3 rounded-full border border-ink/20 ${
                                    lvl.level === currentValue 
                                      ? 'bg-cnt-red group-hover:bg-paper' 
                                      : (lvl.level < currentValue 
                                          ? 'bg-ink/40 group-hover:bg-paper/40'
                                          : 'bg-transparent group-hover:bg-paper/10')
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-ink-light group-hover:text-paper/80 mt-1 truncate">
                            {isZh ? currentLevelName?.zh : currentLevelName?.en}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Detail Mode: Single Column */
            <div className="w-full p-6 md:p-10 flex flex-col overflow-y-auto bg-ink/5 relative items-center">
              <div className="w-full max-w-3xl">
                <div className="flex items-center gap-4 mb-10 border-b-2 border-ink/20 pb-6">
                  <div className="p-4 bg-ink text-paper rounded-sm shadow-md">
                    {activePolicy.icon}
                  </div>
                  <h3 className="font-typewriter text-4xl font-bold">
                    {isZh ? activePolicy.name.zh : activePolicy.name.en}
                  </h3>
                </div>

                <div className="flex flex-col gap-6 relative isolate">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-6 bottom-6 w-1 bg-ink/10 -z-10" />

                  {activePolicy.levels.map((lvl) => {
                    const isCurrent = state.domesticPolicy[activePolicy.id] === lvl.level;
                    const effectLines = getPolicyEffectLines(activePolicy.id, lvl.level, state, isZh);
                    
                    return (
                      <div 
                        key={lvl.level} 
                        className={`flex items-start gap-6 p-6 border-2 transition-colors ${
                          isCurrent 
                            ? 'border-ink bg-paper shadow-xl scale-[1.02] z-10' 
                            : 'border-transparent hover:border-ink/30 hover:bg-paper/50'
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0 relative">
                          <div className="relative w-14 h-14 bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden rounded-sm">
                            <img 
                              src={`${(import.meta as any).env.BASE_URL || '/'}img/Law/${getLawIconFilename(activePolicy.id, lvl.level)}`}
                              alt={lvl.name.en}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{ display: 'none' }}
                              onLoad={(e) => {
                                e.currentTarget.style.display = 'block';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'none';
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="flex items-center justify-center text-ink/40 w-full h-full">
                              {activePolicy.icon}
                            </div>
                          </div>
                          
                          {/* Level badge */}
                          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs bg-paper ${
                            isCurrent ? 'border-cnt-red text-cnt-red shadow-sm' : 'border-ink/20 text-ink-light'
                          }`}>
                            {lvl.level}
                          </div>
                        </div>
                        <div className="flex flex-col flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`font-typewriter font-bold text-2xl ${isCurrent ? 'text-cnt-red' : ''}`}>
                              {isZh ? lvl.name.zh : lvl.name.en}
                            </span>
                            {isCurrent && (
                              <span className="text-sm border-2 px-3 py-1 border-cnt-red text-cnt-red font-bold uppercase tracking-widest bg-cnt-red/10 animate-pulse">
                                {isZh ? '当前生效' : 'Active'}
                              </span>
                            )}
                          </div>
                          <p className={`text-base leading-relaxed ${isCurrent ? 'text-ink font-medium' : 'text-ink-light'}`}>
                            {isZh ? lvl.description.zh : lvl.description.en}
                          </p>
                          {effectLines.length > 0 && (
                            <div className="mt-2.5 p-3 bg-ink/5 border-l-4 border-cnt-red text-xs font-mono flex flex-col gap-1">
                              <span className="font-bold text-ink uppercase tracking-wider">
                                {isZh ? '■ 月度效果:' : '■ Monthly Effect:'}
                              </span>
                              <div className="text-ink-light leading-relaxed flex flex-col gap-1">
                                {effectLines.map((line, idx) => (
                                  <div key={idx} className="flex items-start gap-1">
                                    <span className="text-cnt-red">•</span>
                                    <span>{line}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
