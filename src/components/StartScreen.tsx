import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../game/GameContext';
import { AchievementsModal } from './AchievementsModal';
import { Star } from 'lucide-react';

export const StartScreen = () => {
  const { state, dispatch } = useGame();
  const [showAchievements, setShowAchievements] = useState(false);
  const [showScenarioSelect, setShowScenarioSelect] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'1931' | '1933' | '1936'>('1931');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'normal' | 'hard' | 'historical' | 'sandbox'>('normal');
  const [hasSave, setHasSave] = useState(false);
  const isZh = state.language === 'zh';

  useEffect(() => {
    setHasSave(!!localStorage.getItem('cnt_fai_save'));
  }, []);

  const handleNewGame = () => {
    setShowScenarioSelect(true);
  };

  const handleStartRevolution = () => {
    dispatch({ type: 'START_GAME', payload: { scenario: selectedScenario, difficulty: selectedDifficulty } });
  };

  const handleLoadGame = () => {
    const saved = localStorage.getItem('cnt_fai_save');
    if (saved) {
      dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
    }
  };

  const toggleLanguage = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: isZh ? 'en' : 'zh' });
  };

  return (
    <div className="fixed inset-0 bg-ink flex flex-col items-center justify-center overflow-hidden z-50">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stucco.png')] opacity-20 pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
      }} />

      {/* Diagonal red blocks */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cnt-red rotate-45 opacity-20 mix-blend-multiply pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cnt-red rotate-45 opacity-20 mix-blend-multiply pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showScenarioSelect ? (
          <motion.div
            key="main-menu"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6"
          >
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="font-display text-7xl md:text-9xl text-paper uppercase tracking-tighter leading-none" style={{ textShadow: '4px 4px 0px #c1272d' }}>
                CNT-FAI
              </h1>
              <p className="font-typewriter text-paper/80 text-lg md:text-xl tracking-widest mt-4">
                {isZh ? '西班牙革命 · 1936' : 'THE SPANISH REVOLUTION · 1936'}
              </p>
            </div>

            {/* Image */}
            <div className="mb-12 relative flex justify-center items-center">
              <img src="/img/República Española.png" alt="República Española" className="w-80 md:w-96 lg:w-[28rem] object-contain relative z-10 drop-shadow-[0_0_15px_rgba(193,39,45,0.5)]" />
            </div>

            {/* Menu */}
            <div className="flex flex-col gap-4 w-full max-w-md">
              <MenuButton onClick={handleNewGame} text={isZh ? '开始革命' : 'START REVOLUTION'} primary />
              <MenuButton onClick={handleLoadGame} text={isZh ? '读取档案' : 'LOAD REVOLUTION'} disabled={!hasSave} />
              <MenuButton onClick={() => setShowAchievements(true)} text={isZh ? '成就记录' : 'ACHIEVEMENTS'} />
              <MenuButton onClick={toggleLanguage} text={isZh ? '语言: 中文' : 'LANGUAGE: EN'} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="scenario-select"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col max-w-7xl w-full px-6 h-[85vh]"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-4xl md:text-5xl text-paper uppercase tracking-widest">
                {isZh ? '选择剧本与模式' : 'SELECT SCENARIO & MODE'}
              </h2>
            </div>

            <div className="flex flex-col gap-8 flex-1 min-h-0">
              {/* Top: Scenarios Grid */}
              <div className="flex flex-col gap-4">
                <h3 className="font-typewriter text-cnt-red text-xl uppercase tracking-widest border-b border-cnt-red/30 pb-2 mb-2">
                  {isZh ? '历史节点' : 'SCENARIOS'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ScenarioCard 
                    id="1931"
                    title={isZh ? '1931年4月 - 共和国的黎明' : 'April 1931 - Dawn of the Republic'}
                    description={isZh ? '阿方索十三世退位，第二共和国建立。玩家有充足的时间进行组织建设和政治布局。' : 'Alfonso XIII abdicates, the Second Republic is established. You have time for organizational building and political planning.'}
                    selected={selectedScenario === '1931'}
                    onClick={() => setSelectedScenario('1931')}
                  />

                  <ScenarioCard 
                    id="1933"
                    title={isZh ? '1933年11月 - 黑色两年' : 'November 1933 - The Black Two Years'}
                    description={isZh ? '右翼 CEDA 联盟赢得大选。工人阶级愤怒值极高，CNT-FAI 面临被镇压的风险，需要为即将到来的1934年阿斯图里亚斯矿工起义做准备。' : 'The right-wing CEDA alliance wins the election. Worker anger is high, CNT-FAI faces repression. Prepare for the 1934 Asturias uprising.'}
                    selected={selectedScenario === '1933'}
                    onClick={() => {}}
                    disabled
                  />

                  <ScenarioCard 
                    id="1936"
                    title={isZh ? '1936年7月 - 风暴前夕' : 'July 1936 - Eve of the Storm'}
                    description={isZh ? '人民阵线刚刚上台，右翼军官的政变迫在眉睫。开局即是高压状态，需要立即组织民兵武装保卫共和国并推行社会革命。' : 'The Popular Front has just taken power, a right-wing military coup is imminent. High pressure, organize militias to defend the Republic.'}
                    selected={selectedScenario === '1936'}
                    onClick={() => {}}
                    disabled
                  />
                </div>
              </div>

              {/* Bottom: Difficulty and Actions */}
              <div className="mt-auto flex flex-col md:flex-row items-end gap-8 border-t border-paper/20 pt-6">
                {/* Difficulty (Left) */}
                <div className="flex-1 flex flex-col gap-4 w-full">
                  <h3 className="font-typewriter text-cnt-red text-xl uppercase tracking-widest border-b border-cnt-red/30 pb-2 mb-2">
                    {isZh ? '游戏模式' : 'GAME MODE'}
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <DifficultyCard 
                      id="easy"
                      title={isZh ? '简单模式' : 'Easy Mode'}
                      description={isZh ? '开局3资源2军备。每张卡牌可无消耗放回手牌。' : 'Start with 3 Resources, 2 Armaments. Cards can be returned to hand for free.'}
                      selected={selectedDifficulty === 'easy'}
                      onClick={() => setSelectedDifficulty('easy')}
                    />
                    <DifficultyCard 
                      id="normal"
                      title={isZh ? '标准模式' : 'Normal Mode'}
                      description={isZh ? '开局2资源1军备。标准游戏体验。' : 'Start with 2 Resources, 1 Armament. Standard experience.'}
                      selected={selectedDifficulty === 'normal'}
                      onClick={() => setSelectedDifficulty('normal')}
                    />
                    <DifficultyCard 
                      id="hard"
                      title={isZh ? '困难模式' : 'Hard Mode'}
                      description={isZh ? '开局2资源1军备。铁人机制，无法手动存档。' : 'Start with 2 Resources, 1 Armament. Ironman mode, no manual saving.'}
                      selected={selectedDifficulty === 'hard'}
                      onClick={() => setSelectedDifficulty('hard')}
                    />
                    <DifficultyCard 
                      id="historical"
                      title={isZh ? '历史模式' : 'Historical Mode'}
                      description={isZh ? '开局2资源1军备。历史事件将优先按年份触发，历史成就将有特殊标记。' : 'Start with 2 Resources, 1 Armament. Historical events prioritized by date. Special marker for historical achievements.'}
                      selected={selectedDifficulty === 'historical'}
                      onClick={() => setSelectedDifficulty('historical')}
                      icon={<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    />
                    <DifficultyCard 
                      id="sandbox"
                      title={isZh ? '沙盒模式' : 'Sandbox Mode'}
                      description={isZh ? '开局3资源2军备。可在设置中自由编辑资源与派系，无法获得成就。' : 'Start with 3 Resources, 2 Armaments. Edit resources and factions in settings. No achievements.'}
                      selected={selectedDifficulty === 'sandbox'}
                      onClick={() => setSelectedDifficulty('sandbox')}
                    />
                  </div>
                </div>

                {/* Bottom Actions (Right) */}
                <div className="flex items-center gap-6 pb-2 shrink-0">
                  <button 
                    onClick={() => setShowScenarioSelect(false)}
                    className="font-display text-xl text-paper/60 hover:text-paper uppercase tracking-widest transition-colors"
                  >
                    {isZh ? '返回' : 'BACK'}
                  </button>
                  <button 
                    onClick={handleStartRevolution}
                    className="bg-cnt-red text-paper font-display text-2xl px-10 py-4 uppercase tracking-widest border-2 border-cnt-red hover:bg-transparent hover:text-cnt-red transition-colors shadow-[4px_4px_0px_#f4ecd8] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                  >
                    {isZh ? '确认出击' : 'START'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote */}
      {!showScenarioSelect && (
        <div className="absolute bottom-8 left-8 max-w-sm hidden md:block">
          <p className="font-serif italic text-paper/60 text-sm">
            {isZh ? '"路障封锁了街道，但开启了道路。"' : '"Las barricadas cierran las calles pero abren el camino."'}
          </p>
          {!isZh && (
            <p className="font-serif italic text-paper/40 text-xs mt-1">
              "The barricades close the streets but open the way."
            </p>
          )}
          <p className="font-typewriter text-paper/40 text-xs mt-2">
            — Buenaventura Durruti
          </p>
        </div>
      )}

      <AnimatePresence>
        {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}
      </AnimatePresence>
    </div>
  );
};

const MenuButton = ({ onClick, text, primary, disabled }: { onClick: () => void, text: string, primary?: boolean, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group relative w-full py-4 px-6 font-display text-2xl uppercase tracking-widest text-center transition-all duration-300 overflow-hidden
      ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}
      ${primary ? 'bg-cnt-red text-paper border-2 border-cnt-red shadow-[4px_4px_0px_#f4ecd8]' : 'bg-transparent text-paper border-2 border-paper shadow-[4px_4px_0px_#f4ecd8]'}
    `}
  >
    <span className={`relative z-10 transition-colors duration-300 ${!disabled && !primary ? 'group-hover:text-ink' : ''}`}>{text}</span>
    {!disabled && (
      <div className={`absolute inset-0 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 z-0 ${primary ? 'bg-ink' : 'bg-paper'}`} />
    )}
  </button>
);

const ScenarioCard = ({ id, title, description, selected, onClick, disabled }: { id: string, title: string, description: string, selected: boolean, onClick: () => void, disabled?: boolean }) => (
  <div 
    onClick={disabled ? undefined : onClick}
    className={`relative p-4 border-2 transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed grayscale border-paper/20 bg-ink/50' : 'cursor-pointer'} ${selected ? 'border-cnt-red bg-cnt-red/10' : (!disabled && 'border-paper/30 hover:border-paper/60 hover:bg-paper/5')}`}
  >
    <h4 className="font-display text-2xl text-paper mb-2">{title}</h4>
    <p className="font-serif text-paper/70 text-sm leading-relaxed">{description}</p>
    {disabled && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="transform -rotate-12 border-4 border-cnt-red text-cnt-red font-display text-3xl px-4 py-1 opacity-80 mix-blend-screen">
          IN DEV
        </div>
      </div>
    )}
    {selected && (
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-t-cnt-red border-l-[30px] border-l-transparent">
        <span className="absolute -top-[28px] -left-[14px] text-paper text-xs font-bold">✓</span>
      </div>
    )}
  </div>
);

const DifficultyCard = ({ id, title, description, selected, onClick, icon, disabled }: { id: string, title: string, description: string, selected: boolean, onClick: () => void, icon?: React.ReactNode, disabled?: boolean }) => (
  <div 
    onClick={disabled ? undefined : onClick}
    className={`group relative p-3 border-2 transition-all duration-200 flex items-center justify-center h-16 ${disabled ? 'opacity-50 cursor-not-allowed grayscale border-paper/20 bg-ink/50' : 'cursor-pointer'} ${selected ? 'border-yellow-500 bg-yellow-500/10' : (!disabled && 'border-paper/30 hover:border-paper/60 hover:bg-paper/5')}`}
  >
    <div className="flex items-center gap-2">
      <h4 className="font-display text-xl text-paper m-0">{title}</h4>
      {icon}
    </div>
    
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-ink border border-paper/20 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
      <p className="font-serif text-paper/80 text-xs text-center leading-relaxed">{description}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-paper/20"></div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[3px] border-transparent border-t-ink mt-[-1px]"></div>
    </div>

    {disabled && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="transform -rotate-12 border-2 border-cnt-red text-cnt-red font-display text-xl px-2 py-0.5 opacity-80 mix-blend-screen">
          WIP
        </div>
      </div>
    )}
    {selected && (
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-t-yellow-500 border-l-[24px] border-l-transparent">
        <span className="absolute -top-[22px] -left-[12px] text-paper text-[10px] font-bold">✓</span>
      </div>
    )}
  </div>
);
