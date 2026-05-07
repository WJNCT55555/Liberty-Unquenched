import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Lock, Star } from 'lucide-react';
import { ACHIEVEMENTS, getUnlockedGlobalAchievements, getUnlockedHistoricalAchievements } from '../game/achievements';
import { useGame } from '../game/GameContext';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  const unlockedIds = getUnlockedGlobalAchievements();
  const historicalIds = getUnlockedHistoricalAchievements();

  const completedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-paper-dark border-4 border-ink shadow-[8px_8px_0px_#141414] flex flex-col p-1"
      >
        <div className="flex flex-col h-full border-2 border-ink bg-paper overflow-hidden">
          
          {/* Header */}
          <div className="bg-ink text-paper py-2 px-4 flex justify-between items-center shrink-0 border-b-2 border-cnt-red">
            <Trophy size={24} className="text-cnt-red opacity-80" />
            <h2 className="font-display text-2xl md:text-3xl uppercase tracking-widest text-center flex-1 mt-1">
              {isZh ? '成就' : 'Achievements'}
            </h2>
            <Trophy size={24} className="text-cnt-red opacity-80" />
          </div>

          {/* Progress Bar */}
          <div className="py-2 px-4 border-b-2 border-ink bg-paper-dark shrink-0">
            <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-widest font-typewriter">
              <span>{isZh ? '完成进度' : 'Completion Progress'}</span>
              <span>{completedCount} / {totalCount} ({progressPercentage}%)</span>
            </div>
            <div className="h-1.5 w-full bg-ink/10 border border-ink overflow-hidden">
              <motion.div 
                className="h-full bg-cnt-red"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Achievement List */}
          <div className="overflow-y-auto flex-1 bg-[url('https://www.transparenttextures.com/patterns/stucco.png')]">
            <div className="flex flex-col">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = unlockedIds.includes(ach.id);
                const isHistorical = historicalIds.includes(ach.id);
                
                return (
                  <div 
                    key={ach.id} 
                    className={`relative border-b-2 border-ink last:border-b-0 transition-all duration-300 flex items-stretch min-h-[72px]
                      ${isUnlocked 
                        ? 'bg-paper' 
                        : 'bg-paper-dark/50 opacity-80 grayscale'
                      }`}
                  >
                    {/* Icon Box (Left) */}
                    <div className={`w-20 shrink-0 flex items-center justify-center border-r-2 border-ink text-3xl
                      ${isUnlocked ? 'bg-paper-dark' : 'bg-ink/5'}`}>
                      {isUnlocked ? (
                        ach.icon.endsWith('.png') ? (
                          <img src={ach.icon} alt="icon" className="w-16 h-16 object-contain filter drop-shadow-md" />
                        ) : (
                          ach.icon
                        )
                      ) : <Lock size={24} className="text-ink/50" />}
                    </div>
                    
                    {/* Text Box (Middle) */}
                    <div className="flex-1 flex flex-col justify-center p-3">
                      <h3 className={`font-serif font-bold text-xl leading-tight mb-1 tracking-wide ${isUnlocked ? 'text-cnt-red' : 'text-ink/60'}`}>
                        {isZh ? ach.title.zh : ach.title.en}
                      </h3>
                      <p className={`text-sm leading-snug font-typewriter ${isUnlocked ? 'text-ink/90' : 'text-ink/50'}`}>
                        {isZh ? ach.description.zh : ach.description.en}
                      </p>
                    </div>

                    {/* Checkbox Box (Right) */}
                    <div className="w-16 shrink-0 flex items-center justify-center">
                      <div className={`w-6 h-6 border-2 border-ink flex items-center justify-center transition-colors relative ${isUnlocked ? 'bg-ink' : 'bg-transparent'}`}>
                        {isUnlocked && (
                          <div className="absolute -top-3 -right-3 flex gap-1 transform rotate-12">
                            {isHistorical && (
                              <div className="w-5 h-5 bg-yellow-500 border border-ink rounded-full flex items-center justify-center shadow-sm" title={isZh ? "历史模式解锁" : "Unlocked in Historical Mode"}>
                                <Star size={10} className="text-ink fill-ink" />
                              </div>
                            )}
                          </div>
                        )}
                        {isUnlocked && <span className="text-paper font-bold font-typewriter text-lg leading-none">✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="py-2 px-4 border-t-2 border-ink bg-paper-dark shrink-0 flex justify-center items-center">
            <button
              onClick={onClose}
              className="px-12 py-2 border-2 border-ink bg-paper text-ink font-display text-lg uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors shadow-[3px_3px_0px_#141414] active:translate-y-1 active:shadow-none"
            >
              {isZh ? '关闭' : 'Close'}
            </button>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
};
