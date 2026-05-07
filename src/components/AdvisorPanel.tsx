import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { Advisor, AdvisorAction } from '../game/types';
import { cn } from '../lib/utils';
import { UserPlus, X, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdvisorPanel = () => {
  const { state, dispatch } = useGame();
  const [isPoolOpen, setIsPoolOpen] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const isZh = state.language === 'zh';

  const factionNames: Record<string, string> = {
    Treintistas: '三十人集团',
    Cenetistas: '工团派',
    Faistas: '无政府主义者',
    AmigosDeDurruti: '杜鲁蒂之友',
    Puristas: '纯粹派'
  };

  const handleActionClick = (action: AdvisorAction) => {
    if (action.condition(state) && state.actionsLeft > 0) {
      dispatch({ 
        type: 'RESOLVE_EVENT', 
        payload: (s) => {
          const newState = action.effect(s);
          return {
            ...newState,
            actionsLeft: s.actionsLeft - 1 // Advisor actions cost 1 AP
          };
        }
      });
      setSelectedAdvisor(null);
    }
  };

  return (
    <>
      <div className="h-48 border-t-2 border-ink bg-[#e6e2d6] p-4 flex justify-center gap-6 items-center shadow-[inset_0_8px_16px_rgba(0,0,0,0.1)] relative overflow-hidden">
        
        {/* 3 Active Advisor Slots */}
        {state.activeAdvisors.map((advisor, idx) => {
          const rotations = ['-rotate-2', 'rotate-1', '-rotate-1'];
          const rot = rotations[idx % rotations.length];
          const isAvailable = advisor ? advisor.actions.some(a => a.condition(state) && state.actionsLeft > 0) : false;

          return (
            <div 
              key={idx} 
              className={cn(
                "aspect-[2/3] h-full border-2 border-ink relative flex flex-col items-center p-2 group transition-all duration-200",
                advisor 
                  ? `bg-paper shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-2 hover:shadow-[6px_8px_0px_0px_rgba(26,26,26,1)] cursor-pointer ${rot}` 
                  : "border-dashed border-ink/40 bg-transparent hover:bg-ink/5"
              )}
              onClick={() => advisor && setSelectedAdvisor(advisor)}
            >
              {advisor ? (
                <>
                  {/* Faction Stamp */}
                  <div className="absolute -top-2 -left-2 bg-ink text-paper text-[8px] font-typewriter px-1.5 py-0.5 border border-ink shadow-[2px_2px_0px_0px_rgba(204,0,0,1)] z-20 transform -rotate-6">
                    {isZh ? factionNames[advisor.faction] : advisor.faction}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'REMOVE_ADVISOR', payload: { slotIndex: idx } });
                    }}
                    className="absolute -top-2 -right-2 bg-paper border-2 border-ink w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cnt-red hover:text-paper z-20 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {advisor.image && (
                    <div className="w-20 aspect-[3/4] border-2 border-ink mb-1 flex-shrink-0 bg-paper-dark overflow-hidden relative">
                      <img 
                        src={advisor.image} 
                        alt={advisor.name} 
                        className={cn(
                          "w-full h-full object-cover transition-all duration-500",
                          isAvailable 
                            ? "grayscale-0 contrast-100 sepia-0 mix-blend-normal" 
                            : "grayscale contrast-150 sepia-[.2] mix-blend-multiply"
                        )}
                        referrerPolicy="no-referrer" 
                      />
                      {/* Paperclip effect */}
                      <div className="absolute -top-1 -right-1 w-4 h-6 border-2 border-ink rounded-full opacity-50 transform rotate-45"></div>
                    </div>
                  )}
                  
                  <h4 className="font-display text-sm text-center leading-tight uppercase">
                    {isZh && advisor.nameZh ? advisor.nameZh : advisor.name}
                  </h4>
                </>
              ) : (
                <div className="text-ink-light opacity-40 flex flex-col items-center justify-center h-full w-full relative z-10">
                  <UserPlus className="w-8 h-8 mb-2" />
                  <span className="font-typewriter text-xs uppercase tracking-widest border-b border-dotted border-ink-light">
                    {isZh ? '待任命' : 'PENDING'}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        <div className="h-full w-0.5 bg-ink opacity-20 mx-2"></div>

        {/* 4th Slot: Advisor Pool */}
        <div 
          onClick={() => setIsPoolOpen(true)}
          className="aspect-[2/3] h-full border-2 border-ink bg-paper-dark relative flex flex-col justify-center items-center p-2 cursor-pointer transition-all shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] group"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-ink"></div>
          <Users className="w-8 h-8 mb-1 text-ink group-hover:text-cnt-red transition-colors" />
          <h4 className="font-display text-sm text-center leading-tight uppercase tracking-widest">
            {isZh ? '档案柜' : 'DOSSIERS'}
          </h4>
          <span className="font-typewriter text-[10px] mt-1 bg-ink text-paper px-1.5 py-0.5">
            {state.advisorPool.length} {isZh ? '份' : 'FILES'}
          </span>
        </div>
      </div>

      {/* Advisor Pool Modal */}
      <AnimatePresence>
        {isPoolOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-8"
            onClick={() => setIsPoolOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#f4f1ea] border-2 border-ink p-8 max-w-5xl w-full max-h-[85vh] overflow-y-auto relative shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsPoolOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 border-2 border-ink bg-paper flex items-center justify-center hover:bg-cnt-red hover:text-paper transition-colors shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-end justify-between border-b-4 border-ink pb-4 mb-8">
                <h2 className="font-display text-5xl uppercase leading-none">
                  {isZh ? '人事档案柜' : 'PERSONNEL FILES'}
                </h2>
                <div className="font-typewriter text-sm bg-ink text-paper px-2 py-1">
                  CONFIDENTIAL
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.advisorPool.map((advisor) => (
                  <div 
                    key={advisor.id}
                    className="border-2 border-ink bg-paper p-4 flex flex-col relative cursor-pointer transition-all duration-200 group shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]"
                    onClick={() => {
                      const emptySlot = state.activeAdvisors.findIndex(a => a === null);
                      if (emptySlot !== -1) {
                        dispatch({ type: 'ADD_ADVISOR', payload: { advisor, slotIndex: emptySlot } });
                        setIsPoolOpen(false);
                      } else {
                        alert(isZh ? "没有空闲的顾问席位！请先解雇一名顾问。" : "No empty advisor slots! Dismiss an advisor first.");
                      }
                    }}
                  >
                    {/* Faction Badge */}
                    <div className="absolute top-0 right-0 bg-ink text-paper text-[10px] font-typewriter px-2 py-1 border-b-2 border-l-2 border-ink">
                      {isZh ? factionNames[advisor.faction] : advisor.faction}
                    </div>

                    <div className="flex gap-4 mb-3">
                      {advisor.image && (
                        <div className="w-16 aspect-[3/4] border-2 border-ink flex-shrink-0 bg-paper-dark overflow-hidden">
                          <img 
                            src={advisor.image} 
                            alt={advisor.name} 
                            className="w-full h-full object-cover grayscale contrast-150 sepia-[.2] mix-blend-multiply" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      )}
                      <div className="flex flex-col justify-center pr-16">
                        <h4 className="font-display text-2xl leading-tight uppercase group-hover:text-cnt-red transition-colors">
                          {isZh && advisor.nameZh ? advisor.nameZh : advisor.name}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="font-typewriter text-xs opacity-90 leading-relaxed line-clamp-4 border-t border-ink/20 pt-2">
                      {isZh && advisor.descriptionZh ? advisor.descriptionZh : advisor.description}
                    </div>
                  </div>
                ))}
                
                {state.advisorPool.length === 0 && (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-ink/30 bg-paper-dark">
                    <div className="font-typewriter text-lg uppercase tracking-widest opacity-50">
                      {isZh ? '档案柜为空' : 'CABINET EMPTY'}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advisor Details Modal */}
      <AnimatePresence>
        {selectedAdvisor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-8"
            onClick={() => setSelectedAdvisor(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10, rotate: -1 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.95, y: 10, rotate: 1 }}
              className="bg-[#f4f1ea] border-2 border-ink p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto relative flex flex-col md:flex-row gap-8 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Secret Stamp */}
              <div className="absolute top-4 right-12 border-4 border-cnt-red text-cnt-red font-display text-2xl uppercase rotate-12 px-3 py-1 opacity-30 pointer-events-none">
                {isZh ? '机密档案' : 'CONFIDENTIAL'}
              </div>

              <button 
                onClick={() => setSelectedAdvisor(null)}
                className="absolute top-4 right-4 w-8 h-8 border-2 border-ink bg-paper flex items-center justify-center hover:bg-cnt-red hover:text-paper transition-colors shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              {selectedAdvisor.image && (
                <div className="w-full md:w-1/3 flex-shrink-0 relative">
                  <div className="border-2 border-ink bg-white p-2 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transform -rotate-2">
                    <img 
                      src={selectedAdvisor.image} 
                      alt={selectedAdvisor.name} 
                      className="w-full aspect-[3/4] object-cover grayscale contrast-150 sepia-[.2] mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                    <div className="mt-2 font-typewriter text-[10px] text-center uppercase border-t border-ink/30 pt-1">
                      FIG. 1 - {isZh && selectedAdvisor.nameZh ? selectedAdvisor.nameZh : selectedAdvisor.name}
                    </div>
                  </div>
                  {/* Tape effect */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/50 backdrop-blur-sm border border-ink/10 rotate-2"></div>
                </div>
              )}
              
              <div className="flex-1 flex flex-col">
                <div className="border-b-2 border-ink pb-4 mb-4">
                  <h2 className="font-display text-5xl uppercase leading-none mb-2">
                    {isZh && selectedAdvisor.nameZh ? selectedAdvisor.nameZh : selectedAdvisor.name}
                  </h2>
                  <div className="flex gap-2 items-center">
                    <span className="bg-ink text-paper font-typewriter text-xs uppercase px-2 py-0.5">
                      {isZh ? '派系 / FACTION' : 'FACTION'}
                    </span>
                    <span className="font-typewriter text-sm font-bold">
                      {isZh ? factionNames[selectedAdvisor.faction] : selectedAdvisor.faction}
                    </span>
                  </div>
                </div>
                
                <div className="font-typewriter text-sm opacity-90 leading-relaxed mb-8 relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-ink/10"></div>
                  <p className="whitespace-pre-line">
                    {isZh && selectedAdvisor.descriptionZh ? selectedAdvisor.descriptionZh : selectedAdvisor.description}
                  </p>
                </div>

                {selectedAdvisor.actions.length > 0 && (
                  <div>
                    <h3 className="font-display text-xl uppercase border-b border-ink mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      {isZh ? '执行指令 (消耗 1 AP)' : 'EXECUTIVE DIRECTIVES (1 AP)'}
                    </h3>
                    <div className="flex flex-col gap-4">
                      {selectedAdvisor.actions.map(action => {
                        const canAfford = state.actionsLeft > 0;
                        const meetsCondition = action.condition(state);
                        const isAvailable = canAfford && meetsCondition;
                        
                        return (
                          <div key={action.id} className="relative">
                            <button
                              onClick={() => handleActionClick(action)}
                              disabled={!isAvailable}
                              className={cn(
                                "w-full text-left p-4 border-2 transition-all duration-200 relative group bg-paper",
                                isAvailable 
                                  ? "border-ink shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] cursor-pointer active:shadow-none active:translate-y-1.5 active:translate-x-1.5" 
                                  : "border-ink/40 opacity-70 cursor-not-allowed"
                              )}
                            >
                              <div className="font-display text-2xl mb-1 group-hover:text-cnt-red transition-colors">
                                {isZh && action.titleZh ? action.titleZh : action.title}
                              </div>
                              <div className="font-typewriter text-xs opacity-80">
                                {isZh && action.subtitleZh ? action.subtitleZh : action.subtitle}
                              </div>
                            </button>

                            {/* Unavailable Stamp */}
                            {!isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                                <div className="border-4 border-cnt-red text-cnt-red font-display text-3xl uppercase rotate-[-10deg] px-4 py-1 opacity-80 bg-paper/80 backdrop-blur-sm shadow-sm">
                                  {isZh ? '条件不符' : 'UNAVAILABLE'}
                                  <div className="text-[10px] font-typewriter text-center mt-1 border-t border-cnt-red pt-1">
                                    {!meetsCondition 
                                      ? (isZh && action.unavailableSubtitleZh ? action.unavailableSubtitleZh(state) : action.unavailableSubtitle ? action.unavailableSubtitle(state) : (isZh ? '前置条件未满足' : 'Prerequisites not met'))
                                      : (isZh ? '行动点数不足' : 'Insufficient AP')}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
