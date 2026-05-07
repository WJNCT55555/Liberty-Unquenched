import React, { useState } from 'react';
import { useGame } from '../game/GameContext';
import { cn } from '../lib/utils';
import { Calendar, Coins, ShieldAlert, Zap, Factory, Settings, Save, Download, Globe, X, Trophy, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AchievementsModal } from './AchievementsModal';
import { useMusic, MusicPlayerUI } from './MusicPlayer';

export const TopBar = () => {
  const { state, dispatch } = useGame();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { isPlaying } = useMusic();

  const isZh = state.language === 'zh';

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthNamesZh = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const monthName = isZh ? monthNamesZh[state.month - 1] : monthNamesEn[state.month - 1];
  const isHardOrHistorical = state.difficulty === 'historical' || state.difficulty === 'hard';
  const isSandbox = state.difficulty === 'sandbox';

  const handleSave = () => {
    if (isHardOrHistorical) return;
    localStorage.setItem('cnt_fai_save', JSON.stringify(state));
    setMessage(isZh ? '游戏已保存！' : 'Game Saved!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLoad = () => {
    if (isHardOrHistorical) return;
    const saved = localStorage.getItem('cnt_fai_save');
    if (saved) {
      dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
      setMessage(isZh ? '游戏已读取！' : 'Game Loaded!');
      setTimeout(() => {
        setMessage('');
        setIsSettingsOpen(false);
      }, 1500);
    } else {
      setMessage(isZh ? '未找到存档！' : 'No save found!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleLanguage = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: isZh ? 'en' : 'zh' });
  };

  return (
    <>
      <div className="w-full border-b border-ink/20 bg-ink text-paper p-3 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-md relative z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="font-display text-3xl uppercase tracking-widest text-cnt-red leading-none">
              CNT-FAI
            </h1>
            <span className="font-typewriter text-[10px] tracking-widest uppercase opacity-70">
              {isZh ? '全国委员会' : 'Comité Nacional'}
            </span>
          </div>
          
          <div className="h-10 w-px bg-paper opacity-20 hidden sm:block"></div>
          
          <div className="flex items-center gap-3 font-serif text-xl">
            <Calendar className="w-5 h-5 text-cnt-red opacity-80" />
            <span className="tracking-wide">{isZh ? `${state.year}年 ${monthName}` : `${monthName} ${state.year}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8 font-typewriter text-sm overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto justify-start lg:justify-end hide-scrollbar">
          <div className="flex gap-4 md:gap-6">
            <StatItem icon={<Coins className="w-4 h-4 opacity-70" />} label={isZh ? '经济' : 'Economy'} value={state.stats.economy} />
            <StatItem icon={<Factory className="w-4 h-4 opacity-70" />} label={isZh ? '工人控制' : 'Worker Control'} value={state.stats.workerControl} />
          </div>
          
          <div className="h-8 w-px bg-paper opacity-20 hidden md:block"></div>
          
          <div className="flex gap-4 md:gap-6">
            <ResourceItem icon={<Coins className="w-4 h-4 text-yellow-500" />} label={isZh ? '资源' : 'Resources'} value={state.resources} />
            <ResourceItem icon={<ShieldAlert className="w-4 h-4 text-gray-400" />} label={isZh ? '军备' : 'Armaments'} value={state.armaments} />
          </div>

          <div className="h-8 w-px bg-paper opacity-20 hidden md:block"></div>
          
          <button 
            onClick={() => setIsAchievementsOpen(true)}
            className="p-2 hover:bg-paper/10 hover:text-cnt-red transition-colors rounded-full flex-shrink-0"
            title={isZh ? '成就' : 'Achievements'}
          >
            <Trophy className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-paper/10 hover:text-cnt-red transition-colors rounded-full flex-shrink-0 relative"
            title={isZh ? '设置' : 'Settings'}
          >
            <Settings className="w-5 h-5" />
            {isPlaying && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-cnt-red rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-8"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-paper text-ink border-print p-8 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 hover:text-cnt-red transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="font-display text-4xl uppercase mb-6 border-b-2 border-ink pb-2 text-center">
                {isZh ? '游戏设置' : 'Settings'}
              </h2>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsRadioOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-3 p-4 border-2 border-ink hover:bg-ink hover:text-paper transition-colors font-typewriter text-lg uppercase tracking-wider relative"
                >
                  <Radio className="w-6 h-6" />
                  {isZh ? '秘密电台' : 'Radio Clandestina'}
                  {isPlaying && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-cnt-red rounded-full animate-pulse" />
                  )}
                </button>

                <button 
                  onClick={() => setIsAchievementsOpen(true)}
                  className="w-full flex items-center justify-center gap-3 p-4 border-2 border-ink hover:bg-ink hover:text-paper transition-colors font-typewriter text-lg uppercase tracking-wider"
                >
                  <Trophy className="w-6 h-6" />
                  {isZh ? '查看成就' : 'View Achievements'}
                </button>

                <button 
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-center gap-3 p-4 border-2 border-ink hover:bg-ink hover:text-paper transition-colors font-typewriter text-lg uppercase tracking-wider"
                >
                  <Globe className="w-6 h-6" />
                  {isZh ? 'Language: English' : '语言: 中文'}
                </button>

                <button 
                  onClick={isHardOrHistorical ? undefined : handleSave}
                  disabled={isHardOrHistorical}
                  className={`w-full flex items-center justify-center gap-3 p-4 border-2 border-ink transition-colors font-typewriter text-lg uppercase tracking-wider ${isHardOrHistorical ? 'opacity-50 cursor-not-allowed grayscale bg-ink/10' : 'hover:bg-ink hover:text-paper'}`}
                >
                  <Save className="w-6 h-6" />
                  {isZh ? (isHardOrHistorical ? '当前模式禁用存档' : '保存游戏') : (isHardOrHistorical ? 'Save Disabled' : 'Save Game')}
                </button>

                <button 
                  onClick={isHardOrHistorical ? undefined : handleLoad}
                  disabled={isHardOrHistorical}
                  className={`w-full flex items-center justify-center gap-3 p-4 border-2 border-ink transition-colors font-typewriter text-lg uppercase tracking-wider ${isHardOrHistorical ? 'opacity-50 cursor-not-allowed grayscale bg-ink/10' : 'hover:bg-ink hover:text-paper'}`}
                >
                  <Download className="w-6 h-6" />
                  {isZh ? (isHardOrHistorical ? '当前模式禁用读档' : '读取游戏') : (isHardOrHistorical ? 'Load Disabled' : 'Load Game')}
                </button>

                {isSandbox && (
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false);
                      // We will dispatch a custom event or open a sandbox modal.
                      // Let's just use a window event for now to open the SandboxMenu component.
                      window.dispatchEvent(new CustomEvent('open-sandbox-menu'));
                    }}
                    className="w-full flex items-center justify-center gap-3 p-4 border-2 border-cnt-red text-cnt-red hover:bg-cnt-red hover:text-paper transition-colors font-typewriter text-lg uppercase tracking-wider"
                  >
                    <Settings className="w-6 h-6" />
                    {isZh ? '沙盒工具' : 'Sandbox Options'}
                  </button>
                )}
              </div>

              {/* Debug Section */}
              <div className="mt-8 border-t-2 border-ink pt-4">
                <h3 className="font-typewriter text-sm uppercase tracking-widest mb-4 text-center text-cnt-red">
                  {isZh ? '调试: 触发结局' : 'Debug: Trigger Endings'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'CHILDREN_OF_THE_PEOPLE' })} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper">人民之子</button>
                  <button onClick={() => dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'POPULAR_FRONT' })} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper">人民阵线</button>
                  <button onClick={() => dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'RUSSIAN_SPAIN' })} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper">俄属西班牙</button>
                  <button onClick={() => dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'THE_GREAT_PURGE' })} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper">大清洗</button>
                  <button onClick={() => dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'SILENT_REPUBLIC' })} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper">寂静的共和</button>
                  <button onClick={() => dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'FOR_WHOM_THE_BELL_TOLLS' })} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper">丧钟为谁而鸣</button>
                  <button onClick={() => dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'WE_HAVE_PASSED' })} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper">我们已经通过</button>
                </div>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-3 bg-cnt-red text-paper text-center font-typewriter font-bold"
                >
                  {message}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAchievementsOpen && (
          <AchievementsModal onClose={() => setIsAchievementsOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRadioOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setIsRadioOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-lg w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <MusicPlayerUI onClose={() => setIsRadioOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const StatItem = ({ icon, label, value, isAlert }: { icon: React.ReactNode; label: string; value: number; isAlert?: boolean }) => (
  <div className="flex flex-col items-center">
    <div className={cn("flex items-center gap-1.5 mb-1", isAlert ? "text-cnt-red animate-pulse" : "")}>
      {icon}
      <span className="font-mono text-lg tracking-tight">{value}%</span>
    </div>
    <span className="text-[9px] uppercase tracking-widest opacity-60">{label}</span>
  </div>
);

const ResourceItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="font-mono text-lg tracking-tight">{value}</span>
    </div>
    <span className="text-[9px] uppercase tracking-widest opacity-60">{label}</span>
  </div>
);
