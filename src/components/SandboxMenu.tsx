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

  const handleMinisterChange = (role: string, value: any) => {
    const newMinisters = { ...state.ministers, [role]: value };
    const extraPayload: any = { ministers: newMinisters };
    const anyCNT = Object.values(newMinisters).some(v => v === 'CNT');
    if (anyCNT) {
      extraPayload.isCNTInGovernment = true;
    }
    if (role === 'labor') extraPayload.labor_minister_party = value;
    if (role === 'agriculture') extraPayload.agriculture_minister_party = value;
    if (role === 'finance') extraPayload.finance_minister_party = value;
    dispatch({ type: 'SANDBOX_EDIT', payload: extraPayload });
  };

  const ministerRoles = [
    { role: 'labor', labelZh: '劳动部长', labelEn: 'Labor Minister', options: ['PSOE', 'CNT', 'IR', 'PRR', 'Right'] },
    { role: 'health', labelZh: '卫生部长', labelEn: 'Health Minister', options: ['PSOE', 'CNT', 'IR', 'PRR', 'Right'] },
    { role: 'justice', labelZh: '司法部长', labelEn: 'Justice Minister', options: ['PSOE', 'CNT', 'IR', 'PRR', 'Right'] },
    { role: 'industry', labelZh: '工业部长', labelEn: 'Industry Minister', options: ['PSOE', 'CNT', 'IR', 'PRR', 'Right'] },
    { role: 'interior', labelZh: '内政部长', labelEn: 'Interior Minister', options: ['PSOE', 'CNT', 'IR', 'PRR', 'Right'] },
    { role: 'war', labelZh: '陆军部长', labelEn: 'War Minister', options: ['PSOE', 'CNT', 'IR', 'PRR', 'Right'] },
    { role: 'agriculture', labelZh: '农业部长', labelEn: 'Agriculture Minister', options: ['PSOE', 'CNT', 'IR', 'PRR', 'Right', 'Other'] },
    { role: 'finance', labelZh: '财政部长', labelEn: 'Finance Minister', options: ['PSOE', 'CNT', 'IR', 'PRR', 'Right', 'Other'] },
  ] as const;

  const factionNames: Record<Faction, { en: string, zh: string }> = {
    Treintistas: { en: 'Treintistas', zh: '三十人集团' },
    Cenetistas: { en: 'Cenetistas', zh: '工团分子' },
    Faistas: { en: 'Faistas', zh: '无政府主义者' },
    Puristas: { en: 'Puristas', zh: '纯粹派' },
    Jabalistas: { en: 'Jabalistas', zh: '野猪议员' }
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

              {/* Sandbox Card Options */}
              <div className="flex flex-col gap-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                  {isZh ? '沙盒卡牌规则' : 'Sandbox Card Rules'}
                </h3>
                <label className="flex items-center gap-3 bg-ink/5 p-4 cursor-pointer hover:bg-ink/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={state.sandboxCardChoiceEnabled || false}
                    onChange={(e) => handleEdit('sandboxCardChoiceEnabled', e.target.checked)}
                    className="w-5 h-5 accent-cnt-red cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-display text-lg">
                      {isZh ? '开启自选卡牌模式' : 'Enable Card Inspector / Selection Mode'}
                    </span>
                    <span className="font-mono text-xs text-ink/75">
                      {isZh ? '启用后，点击三个牌库（行动、政府、武装）时将弹出所有卡牌面板供手选加入手牌。' : 'When enabled, clicking a card deck opens a panel of all available cards in that deck for you to select, rather than drawing randomly.'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Cabinet Ministers Adjustment */}
              <div className="flex flex-col gap-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                  {isZh ? '内阁部长编制调整' : 'Cabinet Ministers Adjustment'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-ink/5 p-4">
                  {/* First item: CNT Government status */}
                  <div className="md:col-span-2 border-b border-ink/10 pb-3 mb-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.isCNTInGovernment || false}
                        onChange={(e) => handleEdit('isCNTInGovernment', e.target.checked)}
                        className="w-5 h-5 accent-cnt-red cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="font-display font-bold">
                          {isZh ? 'CNT 参与执政/入阁' : 'CNT Participating in Government'}
                        </span>
                        <span className="font-mono text-xs text-ink/75">
                          {isZh ? '开启后，即可直接执行那些需要“CNT入阁/执政”的内阁法案政策。' : 'Directly triggers conditions permitting CNT government policy execution.'}
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Dropdowns for all 8 ministers */}
                  {ministerRoles.map(({ role, labelZh, labelEn, options }) => {
                    const currentVal = state.ministers[role];
                    return (
                      <div key={role} className="flex flex-col gap-1 border-r border-b border-ink/10 pr-2 pb-2">
                        <label className="font-display text-sm font-semibold tracking-wide">
                          {isZh ? labelZh : labelEn}
                        </label>
                        <select
                          value={currentVal || 'Right'}
                          onChange={(e) => handleMinisterChange(role, e.target.value)}
                          className="bg-paper text-ink border border-ink/30 px-2 py-1.5 font-sans text-sm shortcut-focus outline-none focus:border-cnt-red transition-all cursor-pointer"
                        >
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === 'CNT' && (isZh ? 'CNT (无政府工团)' : 'CNT')}
                              {opt === 'PSOE' && (isZh ? 'PSOE (社会党)' : 'PSOE')}
                              {opt === 'IR' && (isZh ? 'IR (共和左翼)' : 'IR')}
                              {opt === 'PRR' && (isZh ? 'PRR (激进共和党)' : 'PRR')}
                              {opt === 'Right' && (isZh ? 'Right (保守右翼)' : 'Right')}
                              {opt === 'Other' && (isZh ? 'Other (其他第三方)' : 'Other')}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
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

              {/* Debug Section / Trigger Endings */}
              <div className="flex flex-col gap-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1 text-cnt-red">
                  {isZh ? '调试: 触发结局' : 'Debug: Trigger Endings'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button onClick={() => { dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'CHILDREN_OF_THE_PEOPLE' }); setIsOpen(false); }} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper font-typewriter uppercase tracking-wide">
                    {isZh ? '人民之子' : 'Children of the People'}
                  </button>
                  <button onClick={() => { dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'POPULAR_FRONT' }); setIsOpen(false); }} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper font-typewriter uppercase tracking-wide">
                    {isZh ? '人民阵线' : 'Popular Front'}
                  </button>
                  <button onClick={() => { dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'RUSSIAN_SPAIN' }); setIsOpen(false); }} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper font-typewriter uppercase tracking-wide">
                    {isZh ? '俄属西班牙' : 'Russian Spain'}
                  </button>
                  <button onClick={() => { dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'THE_GREAT_PURGE' }); setIsOpen(false); }} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper font-typewriter uppercase tracking-wide">
                    {isZh ? '大清洗' : 'The Great Purge'}
                  </button>
                  <button onClick={() => { dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'SILENT_REPUBLIC' }); setIsOpen(false); }} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper font-typewriter uppercase tracking-wide">
                    {isZh ? '寂静的共和' : 'Silent Republic'}
                  </button>
                  <button onClick={() => { dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'FOR_WHOM_THE_BELL_TOLLS' }); setIsOpen(false); }} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper font-typewriter uppercase tracking-wide">
                    {isZh ? '丧钟为谁而鸣' : 'For Whom the Bell Tolls'}
                  </button>
                  <button onClick={() => { dispatch({ type: 'DEBUG_TRIGGER_ENDING', payload: 'WE_HAVE_PASSED' }); setIsOpen(false); }} className="p-2 border border-ink text-xs hover:bg-ink hover:text-paper font-typewriter uppercase tracking-wide justify-self-center col-span-2 md:col-span-1 w-full">
                    {isZh ? '我们已经通过' : 'We Have Passed'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
