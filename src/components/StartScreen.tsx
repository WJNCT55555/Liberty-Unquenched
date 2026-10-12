import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameActions, useGameSelector } from '../game/GameContext';
import { AchievementsModal } from './AchievementsModal';
import { Star } from 'lucide-react';
import { SaveManagerModal } from './SaveManagerModal';
import { readSaveLibrary } from '../game/saveGame';
import './StartScreen.css';

const selectionAsset = (name: string) =>
  `${(import.meta as any).env.BASE_URL || '/'}img/UI/start_selection_parts/${name}`;
const startBackground = `${(import.meta as any).env.BASE_URL || '/'}img/UI/bg_start.png`;

const selectionBoardStyle = {
  '--selection-background': `url("${selectionAsset('wood_background_v2.png')}")`,
  '--selection-scenario': `url("${selectionAsset('scenario_frame.png')}")`,
  '--selection-party': `url("${selectionAsset('party_frame.png')}")`,
  '--selection-mode': `url("${selectionAsset('mode_button.png')}")`,
  '--selection-start': `url("${selectionAsset('start_button.png')}")`,
  '--selection-back': `url("${selectionAsset('back_button.png')}")`,
  '--selection-marker': `url("${selectionAsset('selection_marker.png')}")`,
} as React.CSSProperties;

export const StartScreen = () => {
  const language = useGameSelector(state => state.language);
  const { dispatch } = useGameActions();
  const [showAchievements, setShowAchievements] = useState(false);
  const [showScenarioSelect, setShowScenarioSelect] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'1931' | '1933' | '1936'>('1931');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'normal' | 'hard' | 'historical' | 'sandbox'>('normal');
  const [hasSave, setHasSave] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const isZh = language === 'zh';

  useEffect(() => {
    const refresh = () => {
      const library = readSaveLibrary();
      setHasSave(Boolean(library.autosave || library.manualSlots.some((slot) => slot.record)));
    };
    refresh();
    window.addEventListener('cnt-fai-save-library-changed', refresh);
    return () => window.removeEventListener('cnt-fai-save-library-changed', refresh);
  }, []);

  const handleNewGame = () => {
    setShowScenarioSelect(true);
  };

  const handleStartRevolution = () => {
    dispatch({ type: 'START_GAME', payload: { scenario: selectedScenario, difficulty: selectedDifficulty } });
  };

  const handleLoadGame = () => {
    setShowSaveManager(true);
  };

  const toggleLanguage = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: isZh ? 'en' : 'zh' });
  };

  return (
    <div className={`fixed inset-0 bg-ink flex flex-col items-center justify-center overflow-hidden z-50 ${!showScenarioSelect ? 'start-screen-home' : ''}`}>
      {!showScenarioSelect && (
        <div className="start-screen-home__backdrop" aria-hidden="true">
          <img
            className="start-screen-home__map"
            src={startBackground}
            alt=""
            fetchPriority="high"
            draggable={false}
          />
          <div className="start-screen-home__shade" />
        </div>
      )}
      {showScenarioSelect && (
        <div className="start-screen-selection__backdrop" aria-hidden="true">
          <img src={startBackground} alt="" draggable={false} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {!showScenarioSelect ? (
          <motion.div
            key="main-menu"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="start-screen-home__content"
            lang={isZh ? 'zh-Hans' : 'en'}
          >
            {/* Title */}
            <div className="start-screen-home__heading">
              <h1 className={`start-screen-home__title ${isZh ? 'start-screen-home__title--zh' : ''}`}>
                {isZh ? '自由未烬' : <><span>Liberty</span>{' '}<span>Unquenched</span></>}
              </h1>
              <p className="start-screen-home__subtitle">
                {isZh ? '西班牙大革命 · 1931–1939' : 'THE SPANISH REVOLUTION · 1931–1939'}
              </p>
            </div>

            {/* Flag collage */}
            <div className="start-screen-home__flag">
              <img
                src={`${(import.meta as any).env.BASE_URL || '/'}img/UI/flag_collage.png`}
                alt={isZh ? '西班牙革命旗帜拼贴' : 'Collage of Spanish Revolution flags'}
                draggable={false}
              />
            </div>

            {/* Menu */}
            <nav className="start-screen-home__menu" aria-label={isZh ? '主菜单' : 'Main menu'}>
              <MenuButton onClick={handleNewGame} text={isZh ? '开始革命' : 'START REVOLUTION'} primary />
              <MenuButton onClick={handleLoadGame} text={isZh ? '读取档案' : 'LOAD REVOLUTION'} disabled={!hasSave} />
              <MenuButton onClick={() => setShowAchievements(true)} text={isZh ? '成就记录' : 'ACHIEVEMENTS'} />
              <MenuButton onClick={toggleLanguage} text={isZh ? '语言: 中文' : 'LANGUAGE: EN'} />
            </nav>
          </motion.div>
        ) : (
          <motion.section
            key="scenario-select"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="scenario-select"
            style={selectionBoardStyle}
            lang={isZh ? 'zh-Hans' : 'en'}
            aria-label={isZh ? '选择剧本与模式' : 'Select scenario and mode'}
          >
            <h2 className="scenario-select__heading">
              {isZh ? '选择剧本与模式' : 'SELECT SCENARIO & MODE'}
            </h2>

            <div className="scenario-select__scenarios" role="group" aria-label={isZh ? '历史节点' : 'Scenarios'}>
              <ScenarioCard
                id="1931"
                date={isZh ? '1931年4月' : 'April 1931'}
                title={isZh ? '共和国的黎明' : 'Dawn of the Republic'}
                plaqueLabel={isZh ? '1931·4·共和国黎明' : '1931·4·Republic Dawn'}
                description={isZh ? '阿方索十三世退位，第二共和国建立。你有时间进行组织建设和政治布局。' : 'Alfonso XIII abdicates and the Second Republic begins. You have time to organize and plan.'}
                selected={selectedScenario === '1931'}
                onClick={() => setSelectedScenario('1931')}
              />
              <ScenarioCard
                id="1933"
                date={isZh ? '1933年11月' : 'November 1933'}
                title={isZh ? '黑色两年' : 'The Black Two Years'}
                plaqueLabel={isZh ? '1933·11·黑色两年' : '1933·11·Black Years'}
                description={isZh ? 'CEDA 赢得大选，工人阶级怒火高涨。CNT-FAI 面临镇压，并须准备迎接阿斯图里亚斯起义。' : 'CEDA wins the election. CNT-FAI faces repression as worker anger rises before the Asturias uprising.'}
                selected={selectedScenario === '1933'}
                onClick={() => setSelectedScenario('1933')}
              />
              <ScenarioCard
                id="1936"
                date={isZh ? '1936年7月' : 'July 1936'}
                title={isZh ? '风暴前夕' : 'Eve of the Storm'}
                plaqueLabel={isZh ? '1936·7·风暴前夕' : '1936·7·Eve of Storm'}
                description={isZh ? '人民阵线刚刚上台，军事政变迫在眉睫。立即组织民兵保卫共和国，推动社会革命。' : 'The Popular Front is in power and a coup is imminent. Organize militias to defend the Republic.'}
                selected={selectedScenario === '1936'}
                onClick={() => setSelectedScenario('1936')}
              />
            </div>

            <div className="scenario-select__parties" role="group" aria-label={isZh ? '政党选择，尚未开放' : 'Party selection, coming soon'}>
              {[0, 1, 2].map((slot) => <div className="scenario-select__party" key={slot} aria-hidden="true" />)}
            </div>

            <div className="scenario-select__controls" role="group" aria-label={isZh ? '游戏模式与操作' : 'Game modes and actions'}>
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
                description={isZh ? '开局2资源1军备。历史事件优先按年份触发，历史成就有特殊标记。' : 'Start with 2 Resources, 1 Armament. Historical events follow their dates and achievements get a special mark.'}
                selected={selectedDifficulty === 'historical'}
                onClick={() => setSelectedDifficulty('historical')}
                icon={<Star aria-hidden="true" />}
              />
              <DifficultyCard
                id="sandbox"
                title={isZh ? '沙盒模式' : 'Sandbox Mode'}
                description={isZh ? '开局3资源2军备。可自由编辑资源与派系，无法获得成就。' : 'Start with 3 Resources, 2 Armaments. Edit resources and factions; achievements are disabled.'}
                selected={selectedDifficulty === 'sandbox'}
                onClick={() => setSelectedDifficulty('sandbox')}
              />
              <button type="button" className="scenario-select__back" onClick={() => setShowScenarioSelect(false)}>
                {isZh ? '返回' : 'BACK'}
              </button>
              <button type="button" className="scenario-select__start" onClick={handleStartRevolution}>
                {isZh ? '开始游戏' : 'START'}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSaveManager && (
          <SaveManagerModal
            isOpen={showSaveManager}
            onClose={() => setShowSaveManager(false)}
            isZh={isZh}
            canSaveManual={false}
            canLoadManual
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const MenuButton = ({ onClick, text, primary, disabled }: { onClick: () => void, text: string, primary?: boolean, disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`start-screen-home__button ${primary ? 'start-screen-home__button--primary' : ''}`}
  >
    {text}
  </button>
);

const ScenarioCard = ({ id, date, title, plaqueLabel, description, selected, onClick }: {
  id: '1931' | '1933' | '1936';
  date: string;
  title: string;
  plaqueLabel: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`scenario-select__scenario${selected ? ' is-selected' : ''}`}
    aria-pressed={selected}
    aria-label={`${date} · ${title}。${description}`}
    onClick={onClick}
  >
    <span className="scenario-select__scene-window">
      <img src={`${(import.meta as any).env.BASE_URL || '/'}img/SCENARIOS/${id}.png`} alt="" draggable={false} />
    </span>
    <strong className="scenario-select__scenario-title">{plaqueLabel}</strong>
    <span className="scenario-select__scenario-copy">
      <span className="scenario-select__scenario-description">{description}</span>
    </span>
    {selected && <span className="scenario-select__selected-marker" aria-hidden="true" />}
  </button>
);

const DifficultyCard = ({ id, title, description, selected, onClick, icon }: {
  id: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) => (
  <button
    type="button"
    data-mode={id}
    className={`scenario-select__mode${selected ? ' is-selected' : ''}`}
    aria-pressed={selected}
    aria-label={`${title}。${description}`}
    onClick={onClick}
  >
    <span className="scenario-select__mode-label">{title}{icon}</span>
    <span className="scenario-select__tooltip" aria-hidden="true">{description}</span>
  </button>
);
