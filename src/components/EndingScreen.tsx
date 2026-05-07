import React, { useState, useEffect } from 'react';
import { useGame } from '../game/GameContext';
import { ENDING_DETAILS } from '../game/endings';
import { ACHIEVEMENTS } from '../game/achievements';
import { motion } from 'motion/react';

const TypewriterText = ({ text, delay = 0 }: { text: string, delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 40); // Typing speed
    return () => clearInterval(timer);
  }, [text, started]);

  return <span>{displayedText}{started && displayedText.length < text.length ? <span className="animate-pulse">_</span> : ''}</span>;
};

export const EndingScreen = () => {
  const { state } = useGame();
  
  if (!state.isGameOver || !state.ending) return null;

  const isZh = state.language === 'zh';
  const endingDetail = ENDING_DETAILS[state.ending];

  if (!endingDetail) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-sm p-4 md:p-8 overflow-hidden">
      {/* Background noise/vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.9) 100%)',
      }} />

      <motion.div 
        initial={{ opacity: 0, y: -50, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ type: "spring", damping: 14, stiffness: 90 }}
        className="relative max-w-3xl w-full bg-paper shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-[12px] border-ink p-2 max-h-full overflow-y-auto"
      >
        {/* Halftone texture overlay */}
        <div className="absolute inset-0 bg-halftone opacity-5 pointer-events-none mix-blend-multiply" />

        {/* Inner red border */}
        <div className="border-[4px] border-cnt-red p-6 md:p-8 relative overflow-hidden h-full flex flex-col">
          
          {/* Diagonal graphic elements (Constructivist style) */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cnt-red rotate-45 opacity-20 mix-blend-multiply pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ink rotate-45 opacity-10 mix-blend-multiply pointer-events-none" />
          <div className="absolute top-1/4 -left-10 w-32 h-4 bg-ink rotate-[-15deg] opacity-20 mix-blend-multiply pointer-events-none" />
          <div className="absolute bottom-1/3 -right-10 w-48 h-6 bg-cnt-red rotate-[25deg] opacity-20 mix-blend-multiply pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex flex-col items-center mb-6">
            <h1 className="font-display text-6xl md:text-8xl uppercase tracking-tighter text-ink leading-none text-center mix-blend-multiply opacity-90" style={{ transform: 'scaleY(1.15)' }}>
              {isZh ? '历史的审判' : 'THE VERDICT'}
            </h1>
            <div className="w-full h-2 bg-cnt-red mt-4 mb-1.5" />
            <div className="w-full h-1 bg-ink" />
          </div>

          {/* The Stamp (Ending Title) */}
          <motion.div 
            initial={{ scale: 4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 150, damping: 12 }}
            className="relative z-20 my-4 self-center transform rotate-[-4deg]"
          >
            <div className="border-[6px] border-cnt-red px-8 py-3 inline-block bg-paper/80 backdrop-blur-sm shadow-lg">
              <h2 className="font-display text-4xl md:text-6xl text-cnt-red uppercase tracking-widest leading-none" style={{ textShadow: '2px 2px 0px rgba(193,39,45,0.2)' }}>
                {isZh ? endingDetail.titleZh : endingDetail.title}
              </h2>
            </div>
          </motion.div>

          {/* Typewriter Description */}
          <div className="relative z-10 mt-4 mb-8 flex-grow">
            <div className="bg-paper-dark/40 p-5 md:p-6 border-l-[4px] border-ink font-typewriter text-base md:text-lg leading-relaxed text-ink/90 min-h-[140px] shadow-inner">
              <TypewriterText text={isZh ? endingDetail.descriptionZh : endingDetail.description} delay={1200} />
            </div>
          </div>

          {/* Achievements Unlocked This Run */}
          {state.unlockedAchievementsThisRun && state.unlockedAchievementsThisRun.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 }}
              className="relative z-10 mb-8 border-t-[4px] border-ink pt-4"
            >
              <h3 className="font-display text-2xl text-cnt-red mb-3 uppercase tracking-widest">
                {isZh ? '本次行动解锁成就' : 'Achievements Unlocked'}
              </h3>
              <div className="flex flex-wrap gap-3">
                {state.unlockedAchievementsThisRun.map(id => {
                  const ach = ACHIEVEMENTS.find(a => a.id === id);
                  if (!ach) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 bg-paper-dark border-2 border-ink p-2 shadow-[2px_2px_0px_#141414]">
                      {ach.icon.endsWith('.png') ? (
                        <img src={ach.icon} alt={ach.title.en} className="w-12 h-12 object-contain shrink-0" />
                      ) : (
                        <span className="text-2xl shrink-0">{ach.icon}</span>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-sm leading-tight text-ink">{isZh ? ach.title.zh : ach.title.en}</span>
                        <span className="text-[10px] opacity-80 leading-tight text-ink/80">{isZh ? ach.description.zh : ach.description.en}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Footer / Action */}
          <div className="relative z-10 mt-auto flex flex-col md:flex-row justify-between items-center md:items-end border-t-[4px] border-ink pt-4 gap-4">
            <div className="font-typewriter text-[10px] md:text-xs text-ink-light uppercase tracking-widest text-center md:text-left">
              <p className="font-bold text-ink">ARCHIVE REF: CNT-FAI-193X</p>
              <p>STATUS: <span className="text-cnt-red font-bold">CLASSIFIED</span></p>
              <p className="opacity-60 mt-1">AUTHORIZED PERSONNEL ONLY</p>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="group relative px-8 py-4 bg-ink text-paper font-display text-xl md:text-2xl uppercase tracking-widest overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[3px_3px_0px_#c1272d]"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-ink">{isZh ? '重演历史' : 'VOLVER A JUGAR'}</span>
              <div className="absolute inset-0 bg-paper transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
