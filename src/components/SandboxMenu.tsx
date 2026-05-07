import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../game/GameContext';
import { X, Plus, Minus } from 'lucide-react';
import { Faction } from '../game/types';

export const SandboxMenu = () => {
  const { state, dispatch } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const isZh = state.language === 'zh';

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-sandbox-menu', handleOpen);
    return () => window.removeEventListener('open-sandbox-menu', handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleEdit = (key: string, value: any) => {
    dispatch({ type: 'SANDBOX_EDIT', payload: { [key]: value } });
  };

  const handleFactionEdit = (faction: Faction, key: 'influence' | 'dissent', value: number) => {
    const newFactions = { ...state.factions };
    newFactions[faction] = { ...newFactions[faction], [key]: Math.max(0, Math.min(100, value)) };
    dispatch({ type: 'SANDBOX_EDIT', payload: { factions: newFactions } });
  };

  const factionNames: Record<Faction, { en: string, zh: string }> = {
    Treintistas: { en: 'Treintistas', zh: '三十人集团' },
    Cenetistas: { en: 'Cenetistas', zh: '工团分子' },
    Faistas: { en: 'Faistas', zh: '无政府主义者' },
    Puristas: { en: 'Puristas', zh: '纯粹派' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 md:p-8"
          onClick={() => setIsOpen(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-paper text-ink border-print p-6 md:p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 hover:text-cnt-red transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="font-display text-3xl md:text-4xl uppercase mb-6 border-b-2 border-ink pb-2 text-center text-cnt-red">
              {isZh ? '沙盒工具' : 'Sandbox Options'}
            </h2>
            
            <div className="flex flex-col gap-8">
              {/* Resources & Armaments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                    {isZh ? '资源' : 'Resources'}
                  </h3>
                  <div className="flex items-center justify-between bg-ink/5 p-3">
                    <button onClick={() => handleEdit('resources', Math.max(0, state.resources - 1))} className="p-2 hover:bg-ink hover:text-paper transition-colors"><Minus className="w-5 h-5" /></button>
                    <span className="font-display text-2xl">{state.resources}</span>
                    <button onClick={() => handleEdit('resources', state.resources + 1)} className="p-2 hover:bg-ink hover:text-paper transition-colors"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                    {isZh ? '军备' : 'Armaments'}
                  </h3>
                  <div className="flex items-center justify-between bg-ink/5 p-3">
                    <button onClick={() => handleEdit('armaments', Math.max(0, state.armaments - 1))} className="p-2 hover:bg-ink hover:text-paper transition-colors"><Minus className="w-5 h-5" /></button>
                    <span className="font-display text-2xl">{state.armaments}</span>
                    <button onClick={() => handleEdit('armaments', state.armaments + 1)} className="p-2 hover:bg-ink hover:text-paper transition-colors"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              {/* Factions */}
              <div className="flex flex-col gap-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                  {isZh ? '内部派系' : 'Internal Factions'}
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {(Object.keys(factionNames) as Faction[]).map(faction => (
                    <div key={faction} className="flex flex-col gap-3 bg-ink/5 p-4">
                      <h4 className="font-display text-xl">{isZh ? factionNames[faction].zh : factionNames[faction].en}</h4>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm font-typewriter">
                          <span>{isZh ? '影响力' : 'Influence'}</span>
                          <span>{state.factions[faction].influence}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={state.factions[faction].influence}
                          onChange={(e) => handleFactionEdit(faction, 'influence', parseInt(e.target.value))}
                          className="w-full accent-cnt-red"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm font-typewriter">
                          <span>{isZh ? '分歧度' : 'Dissent'}</span>
                          <span>{state.factions[faction].dissent}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={state.factions[faction].dissent}
                          onChange={(e) => handleFactionEdit(faction, 'dissent', parseInt(e.target.value))}
                          className="w-full accent-cnt-red"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
