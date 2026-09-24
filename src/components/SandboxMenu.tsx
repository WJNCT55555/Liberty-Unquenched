import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameActions, useGameSnapshotWhen } from '../game/GameContext';
import { X, Plus, Minus } from 'lucide-react';
import type { CoalitionId, CoalitionMember, Faction } from '../game/types';
import { isRepublicanPartyEligible } from '../game/politicalEligibility';
import { MapFaction } from '../map/types_map';
import { COALITION_DEFS } from '../game/coalitions';
import { formCoalition, formRulingCoalitionFromSandbox } from '../game/utils';
import { FACTION_NAMES } from '../game/labels';
import { getPartyName } from '../game/partyNames';
import { getOrganizationsForOwner, isOrganizationEstablished, isOrganizationVisible, setOrganizationEstablished } from '../game/organizations';
import type { OrganizationId } from '../game/types';
import type { ArmyIdentity } from '../map/types_map';
import { getMilitarization, MILITARIZATION_DISPLAY_ORDER, MILITARIZATION_GROUP_INFO } from '../game/rules/militarization';
import {
  OWNERSHIP_COLORS,
  OWNERSHIP_LABELS,
  getControlCeilings,
  getPrivateShare,
  getSocializedShare,
  getWorkersShare,
  transferControlShare,
} from '../game/rules/controlShares';
import type { OwnershipSector } from '../game/types';

type CoalitionRole = 'ruling' | 'opposition';

/** 沙盒里的两张饼，顺序与侧边栏、经济改造面板一致：土地在前。 */
const OWNERSHIP_PIE_SECTORS: Array<{ key: OwnershipSector; label: string; labelZh: string }> = [
  { key: 'land', label: 'Land', labelZh: '土地' },
  { key: 'industry', label: 'Industry', labelZh: '生产资料' },
];

const ORGANIZATION_TYPE_LABELS = {
  union: { en: 'Union', zh: '工会' },
  political: { en: 'Political', zh: '政治组织' },
  youth: { en: 'Youth', zh: '青年组织' },
  women: { en: 'Women', zh: '女性组织' },
  agricultural: { en: 'Agricultural', zh: '农业组织' },
  militia: { en: 'Militia', zh: '民兵组织' },
} as const;

export const SandboxMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [coalitionRole, setCoalitionRole] = useState<CoalitionRole>('opposition');
  const [selectedCoalitionId, setSelectedCoalitionId] = useState<CoalitionId | null>(null);
  const state = useGameSnapshotWhen(isOpen);
  const { dispatch } = useGameActions();
  const isZh = state?.language === 'zh';

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-sandbox-menu', handleOpen);
    return () => window.removeEventListener('open-sandbox-menu', handleOpen);
  }, []);

  if (!isOpen || !state) return null;

  const handleEdit = (key: string, value: any) => {
    dispatch({ type: 'SANDBOX_EDIT', payload: { [key]: value } });
  };

  const handleOrganizationEdit = (id: OrganizationId, established: boolean) => {
    dispatch({
      type: 'SANDBOX_EDIT',
      payload: setOrganizationEstablished(state, id, established),
    });
  };

  const handleFactionEdit = (faction: Faction, key: 'influence' | 'dissent', value: number) => {
    const newFactions = { ...state.factions };
    newFactions[faction] = { ...newFactions[faction], [key]: Math.max(0, Math.min(100, value)) };
    dispatch({ type: 'SANDBOX_EDIT', payload: { factions: newFactions } });
  };

  const handleMilitarizationEdit = (group: ArmyIdentity, value: number) => {
    dispatch({
      type: 'SANDBOX_EDIT',
      payload: {
        militarization: {
          ...state.militarization,
          [group]: Math.max(0, Math.min(100, value))
        }
      }
    });
  };

  const handleMapResourceEdit = (faction: MapFaction, key: string, value: number) => {
    if (!state.mapResources) return;
    const nextMapResources = { ...state.mapResources };
    if (nextMapResources[faction]) {
      nextMapResources[faction] = {
        ...nextMapResources[faction],
        [key]: Math.max(0, value)
      };
      dispatch({ type: 'SANDBOX_EDIT', payload: { mapResources: nextMapResources } });
    }
  };

  const handleStatEdit = (key: string, value: number) => {
    dispatch({
      type: 'SANDBOX_EDIT',
      payload: {
        stats: {
          ...state.stats,
          [key]: value
        }
      }
    });
  };

  /**
   * 所有权滑杆：把某一个桶设成滑杆值，差额交给 `transferControlShare` 配平
   * （进方全额、其余桶按比例出）。沙盒刻意**不走**上限检查，也不走
   * `applyEconomicOption` 的计数器记账 —— 这里是调试工具，不是玩法入口。
   */
  const handleOwnershipEdit = (sector: OwnershipSector, key: string, value: number) => {
    const current = (state.controlShares?.[sector] as Record<string, number> | undefined)?.[key] ?? 0;
    const delta = value - current;
    if (!delta) return;
    dispatch({ type: 'SANDBOX_EDIT', payload: transferControlShare(state, sector, { [key]: delta }) });
  };

  const handleMinisterChange = (role: string, value: any) => {
    const newMinisters = { ...state.ministers, [role]: value };
    const extraPayload: any = { ministers: newMinisters };
    const anyCNT = Object.values(newMinisters).some(v => v === 'CNT');
    if (anyCNT) {
      extraPayload.cntStance = 'govern';
    }
    dispatch({ type: 'SANDBOX_EDIT', payload: extraPayload });
  };

  const ministerRoles = [
    { role: 'labor', labelZh: '劳动部长', labelEn: 'Labor Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
    { role: 'health', labelZh: '卫生部长', labelEn: 'Health Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
    { role: 'justice', labelZh: '司法部长', labelEn: 'Justice Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
    { role: 'industry', labelZh: '工业部长', labelEn: 'Industry Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
    { role: 'interior', labelZh: '内政部长', labelEn: 'Interior Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
    { role: 'war', labelZh: '陆军部长', labelEn: 'War Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
    { role: 'agriculture', labelZh: '农业部长', labelEn: 'Agriculture Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
    { role: 'finance', labelZh: '财政部长', labelEn: 'Finance Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
    { role: 'estado', labelZh: '国务部长 (外交)', labelEn: 'Estado Minister', options: ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT', 'Other'] },
  ] as const;

  const factionNames = FACTION_NAMES;
  const activeCoalitions = state.activeCoalitions || [];
  const selectedActiveCoalition = activeCoalitions.find(c => c.activeId === selectedCoalitionId)
    || activeCoalitions.find(c => c.activeId === state.rulingCoalition)
    || activeCoalitions[0];

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

              {/* Command Points Debug Adjustment */}
              {state.mapResources && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-ink/10 pt-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1 text-cnt-red">
                      {isZh ? '共和军指挥点' : 'Republican Command Points'}
                    </h3>
                    <div className="flex items-center justify-between bg-ink/5 p-3">
                      <button 
                        onClick={() => handleMapResourceEdit(MapFaction.REPUBLICAN, 'commandPoints', Math.max(0, (state.mapResources?.[MapFaction.REPUBLICAN]?.commandPoints ?? 0) - 1))} 
                        className="p-2 hover:bg-ink hover:text-paper transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="font-display text-2xl">{state.mapResources?.[MapFaction.REPUBLICAN]?.commandPoints ?? 0}</span>
                      <button 
                        onClick={() => handleMapResourceEdit(MapFaction.REPUBLICAN, 'commandPoints', (state.mapResources?.[MapFaction.REPUBLICAN]?.commandPoints ?? 0) + 1)} 
                        className="p-2 hover:bg-ink hover:text-paper transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1 text-ink/70">
                      {isZh ? '国民军指挥点' : 'Nationalist Command Points'}
                    </h3>
                    <div className="flex items-center justify-between bg-ink/5 p-3">
                      <button 
                        onClick={() => handleMapResourceEdit(MapFaction.NATIONALIST, 'commandPoints', Math.max(0, (state.mapResources?.[MapFaction.NATIONALIST]?.commandPoints ?? 0) - 1))} 
                        className="p-2 hover:bg-ink hover:text-paper transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="font-display text-2xl">{state.mapResources?.[MapFaction.NATIONALIST]?.commandPoints ?? 0}</span>
                      <button 
                        onClick={() => handleMapResourceEdit(MapFaction.NATIONALIST, 'commandPoints', (state.mapResources?.[MapFaction.NATIONALIST]?.commandPoints ?? 0) + 1)} 
                        className="p-2 hover:bg-ink hover:text-paper transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Sandbox Fiscal Controls */}
              <div className="flex flex-col gap-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                  {isZh ? '沙盒财政调试' : 'Sandbox Fiscal Controls'}
                </h3>
                <label className="flex items-center gap-3 bg-ink/5 p-4 cursor-pointer hover:bg-ink/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={state.sandboxManualTaxAdjustmentEnabled || false}
                    onChange={(e) => handleEdit('sandboxManualTaxAdjustmentEnabled', e.target.checked)}
                    className="w-5 h-5 accent-cnt-red cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-display text-lg">
                      {isZh ? '开启手动调整税收与军费' : 'Enable Manual Tax & Military-Spending Adjustment'}
                    </span>
                    <span className="font-mono text-xs text-ink/75">
                      {isZh
                        ? '开启后，财政模态框中会显示 -5、-1、+1、+5 税率按钮与军费调节按钮。'
                        : 'When enabled, the Finance modal shows -5, -1, +1, and +5 tax-rate buttons plus military-spending adjusters.'}
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-3 bg-ink/5 p-4 cursor-pointer hover:bg-ink/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={state.sandboxSovereignInterventionsEnabled || false}
                    onChange={(e) => handleEdit('sandboxSovereignInterventionsEnabled', e.target.checked)}
                    className="w-5 h-5 accent-cnt-red cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-display text-lg">
                      {isZh ? '显示国库紧急干预行动' : 'Show Emergency Sovereign Interventions'}
                    </span>
                    <span className="font-mono text-xs text-ink/75">
                      {isZh
                        ? '开启后，财政模态框才会显示抛售黄金、发行公债和紧急军购三个调试行动。'
                        : 'Shows the three debug actions for selling gold, issuing bonds, and emergency arms imports in the Finance modal.'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Sandbox Organization Controls */}
              <div className="flex flex-col gap-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                  {isZh ? '沙盒组织控制' : 'Sandbox Organization Controls'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-ink/5 p-4">
                  {getOrganizationsForOwner('CNT_FAI')
                    .filter((definition) => isOrganizationVisible(definition.id))
                    .map((definition) => {
                    const established = isOrganizationEstablished(state, definition.id);
                    const typeLabel = ORGANIZATION_TYPE_LABELS[definition.type][isZh ? 'zh' : 'en'];
                    return (
                      <label
                        key={definition.id}
                        className="flex items-start gap-3 border border-ink/10 p-3 cursor-pointer hover:bg-ink/10 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={established}
                          onChange={(e) => handleOrganizationEdit(definition.id, e.target.checked)}
                          className="mt-0.5 w-5 h-5 shrink-0 accent-cnt-red cursor-pointer"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-display text-sm font-bold leading-tight">
                            {isZh ? definition.nameZh : definition.name}
                          </span>
                          <span className="font-mono text-[10px] text-ink/65">
                            {definition.abbreviation} · {typeLabel}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="font-mono text-xs text-ink/65 leading-relaxed">
                  {isZh
                    ? '勾选即可立即启用组织，取消勾选即可关闭组织；关联的武装实体状态会同步更新。'
                    : 'Toggle each organization on or off immediately. Linked armed-entity state stays synchronized.'}
                </p>
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
                        checked={state.cntStance === 'govern'}
                        onChange={(e) => handleEdit('cntStance', e.target.checked ? 'govern' : 'oppose')}
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
                          value={currentVal || 'Other'}
                          onChange={(e) => handleMinisterChange(role, e.target.value)}
                          className="bg-paper text-ink border border-ink/30 px-2 py-1.5 font-sans text-sm shortcut-focus outline-none focus:border-cnt-red transition-all cursor-pointer"
                        >
                          {options.filter(opt => isRepublicanPartyEligible(state, (opt === 'CNT' ? 'CNT_FAI' : opt) as CoalitionMember)).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt === 'CNT'
                                ? (isZh ? 'CNT（无政府工团）' : 'CNT')
                                : getPartyName(state, opt as any, isZh, true)}
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

              {/* Revolutionary Stats Controls */}
              <div className="flex flex-col gap-4 border-t border-ink/10 pt-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1 text-cnt-red">
                  {isZh ? '革命与社会控制' : 'Revolutionary & Social Control'}
                </h3>
                
                <div className="flex flex-col gap-4 bg-ink/5 p-4 rounded-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm font-typewriter">
                      <span>{isZh ? '革命热情 (0-100)' : 'Revolutionary Fervor (0-100)'}</span>
                      <span className="font-bold text-cnt-red">{state.stats.revolutionaryFervor}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={state.stats.revolutionaryFervor}
                      onChange={(e) => handleStatEdit('revolutionaryFervor', parseInt(e.target.value))}
                      className="w-full accent-cnt-red"
                    />
                  </div>

                  <div className="flex flex-col gap-2 border-t border-ink/10 pt-3">
                    <div className="flex justify-between text-sm font-typewriter">
                      <span>{isZh ? '生产资料归属（两张六分饼）' : 'Ownership of production (two six-part pies)'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-ink/75 leading-snug">
                      {isZh
                        ? '12 个桶各自独立可调；每次改动由 transferControlShare 配平，六项之和恒为 100。这里不检查社会化上限，也不写计数器。'
                        : 'All twelve buckets are independently adjustable; every change is balanced by transferControlShare so the six parts always sum to 100. Ceilings and counters are deliberately bypassed here.'}
                    </span>
                    {OWNERSHIP_PIE_SECTORS.map((sector) => {
                      const shares = (state.controlShares?.[sector.key] ?? {}) as Record<string, number>;
                      const ceilings = getControlCeilings(state);
                      const workers = getWorkersShare(state, sector.key);
                      return (
                        <div key={sector.key} className="flex flex-col gap-1 border-t border-ink/10 pt-2 first:border-t-0 first:pt-0">
                          <div className="flex justify-between text-[11px] font-typewriter font-bold uppercase">
                            <span>{isZh ? sector.labelZh : sector.label}</span>
                            <span className="tabular-nums">
                              {isZh ? '劳动者' : 'Workers'} {workers}%
                              {' · '}
                              {isZh ? '社会化' : 'Socialized'} {getSocializedShare(state, sector.key)}%
                              {' · '}
                              {isZh ? '私人' : 'Private'} {getPrivateShare(state, sector.key)}%
                              {' · '}
                              {isZh ? '上限' : 'Ceiling'} {ceilings[sector.key]}%
                            </span>
                          </div>
                          {OWNERSHIP_LABELS[sector.key].map((entry) => {
                            const value = shares[entry.key] ?? 0;
                            return (
                              <div key={entry.key} className="flex flex-col gap-0.5">
                                <div className="flex justify-between text-[10px] font-typewriter">
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 border border-ink/50 shrink-0"
                                      style={{ backgroundColor: OWNERSHIP_COLORS[sector.key][entry.key] }}
                                    />
                                    {isZh ? entry.labelZh : entry.label}
                                  </span>
                                  <span className="font-bold text-cnt-red tabular-nums">{value}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0" max="100"
                                  value={value}
                                  onChange={(e) => handleOwnershipEdit(sector.key, entry.key, parseInt(e.target.value))}
                                  className="w-full accent-cnt-red"
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    <span className="text-[10px] font-mono text-ink/60 leading-snug">
                      {isZh
                        ? '注意：工人控制程度不再是可写的标尺，它由这两张饼派生（国有制不计入劳动者份额），因此这里没有它的滑杆。'
                        : 'Note: workers\' control is no longer a writable gauge — it is derived from these two pies (state ownership does not count as workers\' share), so it has no slider here.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Militarization Sandbox Control */}
              <div className="flex flex-col gap-4 border-t border-ink/10 pt-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                  {isZh ? '调试: 军事化率' : 'Debug: Militarization'}
                </h3>

                <div className="flex flex-col gap-3 bg-ink/5 p-4 rounded-sm">
                  <span className="text-[10px] font-mono text-ink/75 leading-snug">
                    {isZh
                      ? '军事化率 = 名义人力中真正能当兵的比例，同时也是线性战斗乘数。同派系全部队共享；此处直接改写，不走 adjustMilitarization。'
                      : 'Militarization = the share of nominal manpower that functions as soldiers, and the linear combat multiplier. Shared by the whole force group; edited directly here, bypassing adjustMilitarization.'}
                  </span>

                  {MILITARIZATION_DISPLAY_ORDER.map((group) => {
                    const info = MILITARIZATION_GROUP_INFO[group];
                    const rate = getMilitarization(state, group);
                    return (
                      <div key={group} className="flex flex-col gap-1 border-t border-ink/10 pt-2 first:border-t-0 first:pt-0">
                        <div className="flex justify-between text-sm font-typewriter">
                          <span>{isZh ? info.zh : info.en}</span>
                          <span className="font-bold text-cnt-red">{Math.round(rate)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0" max="100"
                          step="1"
                          value={Math.round(rate)}
                          onChange={(e) => handleMilitarizationEdit(group, parseInt(e.target.value, 10))}
                          className="w-full accent-cnt-red"
                        />
                      </div>
                    );
                  })}

                  <div className="flex flex-col gap-2 border-t border-ink/10 pt-3">
                    <span className="text-[10px] font-bold text-ink-light uppercase">
                      {isZh ? '军事化路线（正式流程由内战事件写入）' : 'Militarization route (normally written by the civil-war event)'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {([
                        ['none', isZh ? '未选择' : 'Unchosen'],
                        ['popular_army', isZh ? '人民军' : 'People\'s Army'],
                        ['militia_autonomy', isZh ? '民兵自治' : 'Militia Autonomy']
                      ] as const).map(([path, label]) => (
                        <button
                          key={path}
                          onClick={() => handleEdit('militarizationPaths', {
                            ...state.militarizationPaths,
                            chosen: path
                          })}
                          className={`py-1 px-2.5 text-[10px] font-mono border transition-all ${
                            state.militarizationPaths?.chosen === path
                              ? 'border-cnt-red bg-cnt-red text-paper'
                              : 'border-ink/40 hover:bg-ink hover:text-paper'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coup Progress Sandbox Control */}
              <div className="flex flex-col gap-4 border-t border-ink/10 pt-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                  {isZh ? '调试: 政变进度控制' : 'Debug: Coup Progress Control'}
                </h3>
                
                <div className="flex flex-col gap-4 bg-ink/5 p-4 rounded-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.coupSystemActive}
                      onChange={(e) => {
                        handleEdit('coupSystemActive', e.target.checked);
                        if (!e.target.checked) {
                          handleEdit('coupProgress', 0);
                        }
                      }}
                      className="w-5 h-5 accent-cnt-red cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-sm">
                        {isZh ? '激活政变机制' : 'Activate Coup System'}
                      </span>
                      <span className="font-mono text-xs text-ink/75">
                        {isZh ? '开启后，将启用每月政变进度累积和阶段政变事件（1933和1936剧本默认开启）' : 'Enables monthly coup progress and milestone coup events (enabled by default in 1933/1936 scenarios)'}
                      </span>
                    </div>
                  </label>

                  <div className="flex flex-col gap-1 border-t border-ink/10 pt-3">
                    <div className="flex justify-between text-sm font-typewriter">
                      <span>{isZh ? '当前政变进度' : 'Current Coup Progress'}</span>
                      <span className="font-bold text-cnt-red">{state.coupProgress}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      step="1"
                      disabled={!state.coupSystemActive}
                      value={state.coupProgress}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        handleEdit('coupProgress', val);
                      }}
                      className="w-full accent-cnt-red disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-1">
                      <span>0% (稳定/Stable)</span>
                      <span>50% (暗流/Tension)</span>
                      <span>100% (爆发/Uprising)</span>
                    </div>
                  </div>

                  {/* Reset triggers buttons */}
                  <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-3">
                    <span className="text-[10px] font-bold text-ink-light uppercase w-full">
                      {isZh ? '重置政变里程碑事件触发状态（可重新触发事件）' : 'Reset Coup Milestone Trigger Flags'}
                    </span>
                    <button
                      onClick={() => {
                        dispatch({
                          type: 'SANDBOX_EDIT',
                          payload: {
                            coupTriggered10: false,
                            coupTriggered20: false,
                            coupTriggered30: false,
                            coupTriggered40: false,
                            coupTriggered50: false,
                            coupTriggered60: false,
                            coupTriggered70: false,
                            coupTriggered80: false,
                            coupTriggered90: false,
                            coupTriggered100: false,
                          }
                        });
                      }}
                      className="py-1 px-2.5 text-[10px] font-mono border border-ink/40 hover:bg-ink hover:text-paper transition-all"
                    >
                      {isZh ? '一键重置所有触发标记' : 'Reset All Milestone Flags'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Asturias Revolution Sandbox Control */}
              <div className="flex flex-col gap-4 border-t border-ink/10 pt-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1 text-cnt-red">
                  {isZh ? '调试: 阿斯图里亚斯革命' : 'Debug: Asturias Revolution'}
                </h3>
                
                <div className="flex flex-col gap-4 bg-ink/5 p-4 rounded-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.forceAsturiasRevolutionNextMonth || false}
                      onChange={(e) => handleEdit('forceAsturiasRevolutionNextMonth', e.target.checked)}
                      className="w-5 h-5 accent-cnt-red cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-sm">
                        {isZh ? '下月强行触发阿斯图里亚斯革命' : 'Force Asturias Revolution Next Month'}
                      </span>
                      <span className="font-mono text-xs text-ink/75">
                        {isZh ? '开启后，下个月度回合转换时将无视条件直接触发阿斯图里亚斯革命起义事件。' : 'Directly bypasses all requirements to trigger the Asturias Revolution event at the start of next month.'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Coalition Sandbox Controls */}
              <div className="flex flex-col gap-4 border-t border-ink/10 pt-4">
                <h3 className="font-typewriter text-lg uppercase tracking-widest border-b border-ink/20 pb-1">
                  {isZh ? '调试: 联盟与执政地位' : 'Debug: Alliances & Governing Status'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coalition selectors */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-ink/70">
                      {isZh ? '强行组建联盟（选择地位）' : 'Force Coalition Formation (Choose Status)'}
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => setCoalitionRole('ruling')}
                        className={`p-2 border text-[10px] font-mono text-center uppercase tracking-wide transition-all ${
                          coalitionRole === 'ruling' ? 'bg-ink text-paper border-ink font-bold' : 'border-ink/40 hover:bg-ink/5'
                        }`}
                      >
                        {isZh ? '执政联盟' : 'Governing'}
                      </button>
                      <button
                        onClick={() => setCoalitionRole('opposition')}
                        className={`p-2 border text-[10px] font-mono text-center uppercase tracking-wide transition-all ${
                          coalitionRole === 'opposition' ? 'bg-ink text-paper border-ink font-bold' : 'border-ink/40 hover:bg-ink/5'
                        }`}
                      >
                        {isZh ? '非执政联盟' : 'Non-governing'}
                      </button>
                    </div>
                    <p className="text-[10px] text-ink/60 leading-relaxed">
                      {coalitionRole === 'ruling'
                        ? (isZh ? '将该联盟设为当前执政联盟，并结束当前政府危机/提前选举状态。' : 'Installs this coalition as the ruling government and clears any government crisis or early-election state.')
                        : (isZh ? '保留当前执政联盟，仅新增一个非执政政治联盟。' : 'Keeps the current government and adds a non-governing political alliance.')}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {COALITION_DEFS.filter(def => def.id !== 'popular_front_wartime' && def.members.every(member => isRepublicanPartyEligible(state, member))).map(def => {
                        const isActive = activeCoalitions.some(c => c.activeId === def.id);
                        const isRuling = state.rulingCoalition === def.id;
                        return (
                        <button 
                          key={def.id}
                          onClick={() => {
                            const res = coalitionRole === 'ruling'
                              ? formRulingCoalitionFromSandbox(state, def.id)
                              : formCoalition(state, def.id);
                            dispatch({ type: 'SANDBOX_EDIT', payload: res });
                            setSelectedCoalitionId(def.id);
                          }}
                          className={`p-2 border text-[11px] font-mono text-left uppercase tracking-wide hover:bg-ink hover:text-paper transition-all ${
                            isActive ? 'bg-ink text-paper border-ink font-bold' : 'border-ink bg-transparent'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span>{isZh ? def.nameZh : def.name}</span>
                            {isActive && (
                              <span className="text-[9px] tracking-normal whitespace-nowrap">
                                {isRuling ? (isZh ? '执政' : 'RULING') : (isZh ? '非执政' : 'OPPOSITION')}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                      })}
                      {activeCoalitions.length > 0 && (
                        <button 
                          onClick={() => {
                            dispatch({
                              type: 'SANDBOX_EDIT',
                              payload: {
                                activeCoalitions: [],
                                rulingCoalition: null,
                                governmentCrisis: null,
                                earlyElectionInProgress: false,
                              },
                            });
                          }}
                          className="p-2 border border-dashed border-cnt-red text-[11px] font-mono text-center uppercase tracking-wide text-cnt-red hover:bg-cnt-red hover:text-paper hover:border-solid transition-all mt-1"
                        >
                          {isZh ? '解散当前联盟' : 'Dissolve Current Coalition'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Coalition Attributes */}
                  <div className="flex flex-col gap-3 bg-ink/5 p-3 rounded-sm text-xs font-typewriter">
                    <span className="font-bold border-b border-ink/10 pb-1 mb-1">
                      {isZh ? '活跃联盟微调' : 'Active Alliance Parameters'}
                    </span>

                    {selectedActiveCoalition ? (
                      <div className="flex flex-col gap-3">
                        {activeCoalitions.length > 1 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-ink/60 uppercase">
                              {isZh ? '选择要调整的活跃联盟' : 'Select an active coalition to adjust'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {activeCoalitions.map(coalition => {
                                const def = COALITION_DEFS.find(item => item.id === coalition.activeId);
                                const isRuling = state.rulingCoalition === coalition.activeId;
                                return (
                                  <button
                                    key={coalition.activeId}
                                    onClick={() => setSelectedCoalitionId(coalition.activeId)}
                                    className={`px-2 py-1 border text-[9px] font-mono uppercase transition-all ${
                                      coalition.activeId === selectedActiveCoalition.activeId
                                        ? 'bg-ink text-paper border-ink font-bold'
                                        : 'border-ink/30 hover:bg-ink/5'
                                    }`}
                                  >
                                    {def ? (isZh ? def.nameZh : def.name) : coalition.activeId}
                                    {' · '}
                                    {isRuling ? (isZh ? '执政' : 'Ruling') : (isZh ? '非执政' : 'Opposition')}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span>{isZh ? '联盟团结度 (0-100)' : 'Cohesion (0-100)'}</span>
                            <span className="font-bold">{selectedActiveCoalition.cohesion}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0" max="100"
                            value={selectedActiveCoalition.cohesion}
                            onChange={(e) => {
                              const cohesionVal = parseInt(e.target.value);
                              dispatch({ 
                                type: 'SANDBOX_EDIT', 
                                payload: { 
                                  activeCoalitions: activeCoalitions.map(c => c.activeId === selectedActiveCoalition.activeId ? { ...c, cohesion: cohesionVal } : c)
                                } 
                              });
                            }}
                            className="w-full accent-cnt-red"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span>{isZh ? '对CNT态度 (进度条: 0-100)' : 'CNT Attitude (Bar scale: 0-100)'}</span>
                            <span className="font-bold">{selectedActiveCoalition.cntAttitude} (➡️ {Math.round((selectedActiveCoalition.cntAttitude + 100) / 2)}/100)</span>
                          </div>
                          <input 
                            type="range"
                            min="-100" max="100"
                            value={selectedActiveCoalition.cntAttitude}
                            onChange={(e) => {
                              const attVal = parseInt(e.target.value);
                              dispatch({ 
                                type: 'SANDBOX_EDIT', 
                                payload: { 
                                  activeCoalitions: activeCoalitions.map(c => c.activeId === selectedActiveCoalition.activeId ? { ...c, cntAttitude: attVal } : c)
                                } 
                              });
                            }}
                            className="w-full accent-cnt-red"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-20 text-ink/40 text-center uppercase tracking-wider text-[10px] leading-relaxed">
                        {isZh ? '当前无活跃执政党联盟\n请在左侧强制组建一个。' : 'No active coalition.\nSelect one from the left to start fine-tuning.'}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 border-t border-ink/10 pt-2 mt-1">
                      <span className="text-[10px] font-bold text-ink-light uppercase">
                        {isZh ? '切换CNT工会立场 (反对/合作/执政)' : 'CNT Factions Stance'}
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {['oppose', 'cooperate', 'govern'].map(stance => (
                          <button
                            key={stance}
                            onClick={() => {
                              dispatch({
                                type: 'SANDBOX_EDIT',
                                payload: {
                                  cntStance: stance as any
                                }
                              });
                            }}
                            className={`py-1 text-[10px] font-bold uppercase rounded-sm border ${
                              state.cntStance === stance
                                ? 'bg-ink text-paper border-ink'
                                : 'bg-transparent border-ink/30 hover:bg-ink/5'
                            }`}
                          >
                            {stance}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
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
