/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Province, MapFaction as Faction, GameState, Army } from './types_map';
import { FACTION_COLORS, UI_COLORS, getCombatWidth, getSupplyLimit, PROVINCE_CULTURES, PROVINCE_REGIONS, getCultureGridCoords, getProvinceName } from './map_constants';
import { Shield, Target, ScrollText, MapPin, Swords, Plus, Minus, Info, Flame, Users, Crosshair, Building, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BASE_URL = (import.meta as any).env?.BASE_URL || '/';

const getTerrainImgPath = (terrain: string) => {
  const t = (terrain || '').toLowerCase();
  const base = BASE_URL;
  if (t.includes('urban')) return `${base}date/Terrain/Terrain_urban.png`;
  if (t.includes('plain')) return `${base}date/Terrain/Terrain_plains.png`;
  if (t.includes('forest')) return `${base}date/Terrain/Terrain_forest.png`;
  if (t.includes('mountain')) return `${base}date/Terrain/Terrain_mountain.png`;
  if (t.includes('hill')) return `${base}date/Terrain/Terrain_hills.png`;
  return `${base}date/Terrain/Terrain_plains.png`;
};

interface CultureBoxProps {
  label: string;
  value: string;
  color?: string;
}

const CultureBox: React.FC<CultureBoxProps> = ({ label, value, color }) => {
  return (
    <div className="relative w-full select-none flex flex-col justify-center h-[42px] px-3 py-1 bg-[#FAF6EC] border border-[#1E1C1A] rounded-none shadow-[2px_2px_0_0_rgba(30,28,26,0.1)]">
      {/* Inner fine border to create double-line archival detail */}
      <div className="absolute inset-[2.5px] border border-[#1E1C1A]/20 pointer-events-none" />
      
      {/* Corner printed cross ticks mimicking 1930s registration crop marks */}
      <div className="absolute top-[1.5px] left-[1.5px] w-[5px] h-[5px] border-t border-l border-[#A62626]/80 pointer-events-none" />
      <div className="absolute top-[1.5px] right-[1.5px] w-[5px] h-[5px] border-t border-r border-[#A62626]/80 pointer-events-none" />
      <div className="absolute bottom-[1.5px] left-[1.5px] w-[5px] h-[5px] border-b border-l border-[#A62626]/80 pointer-events-none" />
      <div className="absolute bottom-[1.5px] right-[1.5px] w-[5px] h-[5px] border-b border-r border-[#A62626]/80 pointer-events-none" />

      {/* Floating print label */}
      <div className="absolute left-[8px] -top-[5px] bg-[#FAF6EC] px-1 text-[7.5px] font-sans font-black uppercase tracking-[0.2em] text-[#A62626] leading-none z-10 select-none">
        {label}
      </div>

      {/* Main text content matching reference typography */}
      <div className="relative text-[14px] font-serif font-black tracking-wider truncate mt-0.5 select-text" style={{ color: color || '#1E1C1A' }}>
        {value}
      </div>

      {/* Delicate printer tick mark on right end */}
      <div className="absolute right-[6px] top-1/2 -translate-y-1/2 w-1 h-1 bg-[#A62626]/80 pointer-events-none rounded-none rotate-45" />
    </div>
  );
};

interface CultureIconBoxProps {
  color: string;
  provId?: string;
  cultureGroup?: string;
}

const CultureIconBox: React.FC<CultureIconBoxProps> = ({ color, provId, cultureGroup }) => {
  const coords = provId ? getCultureGridCoords(provId, cultureGroup) : null;

  return (
    <div className="relative w-[101px] h-[105px] bg-[#FAF6EC] border border-[#1E1C1A] flex items-center justify-center p-2 rounded-none shadow-[2px_2px_0_0_rgba(30,28,26,0.1)]">
      {/* Corner printed crosses for registration */}
      <div className="absolute top-[1.5px] left-[1.5px] w-[6px] h-[6px] border-t border-l border-[#A62626] pointer-events-none" />
      <div className="absolute top-[1.5px] right-[1.5px] w-[6px] h-[6px] border-t border-r border-[#A62626] pointer-events-none" />
      <div className="absolute bottom-[1.5px] left-[1.5px] w-[6px] h-[6px] border-b border-l border-[#A62626] pointer-events-none" />
      <div className="absolute bottom-[1.5px] right-[1.5px] w-[6px] h-[6px] border-b border-r border-[#A62626] pointer-events-none" />

      {/* Inner margin line */}
      <div className="absolute inset-[3px] border border-[#1E1C1A]/15 pointer-events-none" />

      {/* Interior box with a warm paper backdrop */}
      <div className="w-full bg-[#EFE8D4] border border-[#1E1C1A]/40 rounded-none flex items-center justify-center p-2 z-10 relative overflow-hidden" style={{ height: '83.667px' }}>
        <div className="absolute inset-0.5 border border-dashed border-[#1E1C1A]/10 pointer-events-none" />
        
        {coords ? (
          <div className="w-[72px] h-[72px] flex items-center justify-center overflow-hidden pointer-events-none">
            <div 
              style={{
                backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                backgroundSize: '300% 500%',
                backgroundPosition: `${coords.col * 50}% ${coords.row * 25}%`,
                width: '72px',
                height: '72px',
                backgroundRepeat: 'no-repeat',
              }}
              title={coords.name}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-none flex items-center justify-center text-white font-extrabold border-2 border-[#1E1C1A] shadow-md"
               style={{ backgroundColor: color }}>
            <Users size={22} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

const RegionsBox: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => {
  return (
    <div className="relative w-full select-none flex flex-col justify-center h-[42px] px-3 py-1 bg-[#FAF6EC] border border-[#1E1C1A] rounded-none shadow-[2px_2px_0_0_rgba(30,28,26,0.1)]">
      {/* Inner double border archival line */}
      <div className="absolute inset-[2.5px] border border-[#1E1C1A]/20 pointer-events-none" />
      
      {/* Corner crops */}
      <div className="absolute top-[1.5px] left-[1.5px] w-[5px] h-[5px] border-t border-l border-[#A62626]/80 pointer-events-none" />
      <div className="absolute top-[1.5px] right-[1.5px] w-[5px] h-[5px] border-t border-r border-[#A62626]/80 pointer-events-none" />
      <div className="absolute bottom-[1.5px] left-[1.5px] w-[5px] h-[5px] border-b border-l border-[#A62626]/80 pointer-events-none" />
      <div className="absolute bottom-[1.5px] right-[1.5px] w-[5px] h-[5px] border-b border-r border-[#A62626]/80 pointer-events-none" />

      {/* Floating print label */}
      <div className="absolute left-[8px] -top-[5px] bg-[#FAF6EC] px-1 text-[7.5px] font-sans font-black uppercase tracking-[0.2em] text-[#A62626] leading-none z-10 select-none">
        {label}
      </div>

      <div className="relative text-[14px] font-serif font-black tracking-wider truncate mt-0.5 select-text" style={{ color: color || '#1E1C1A' }}>
        {value}
      </div>
    </div>
  );
};

const ControlBox: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => {
  return (
    <div className="relative w-full select-none flex flex-col justify-center h-[52px] px-3 py-1 bg-[#FAF6EC] border border-[#1E1C1A] rounded-none shadow-[2px_2px_0_0_rgba(30,28,26,0.1)]">
      {/* Inner archival line */}
      <div className="absolute inset-[2.5px] border border-[#1E1C1A]/20 pointer-events-none" />
      
      {/* Corner crops */}
      <div className="absolute top-[1.5px] left-[1.5px] w-[5px] h-[5px] border-t border-l border-[#A62626]/80 pointer-events-none" />
      <div className="absolute top-[1.5px] right-[1.5px] w-[5px] h-[5px] border-t border-r border-[#A62626]/80 pointer-events-none" />
      <div className="absolute bottom-[1.5px] left-[1.5px] w-[5px] h-[5px] border-b border-l border-[#A62626]/80 pointer-events-none" />
      <div className="absolute bottom-[1.5px] right-[1.5px] w-[5px] h-[5px] border-b border-r border-[#A62626]/80 pointer-events-none" />

      {/* Floating label */}
      <div className="absolute left-[8px] -top-[5px] bg-[#FAF6EC] px-1 text-[7.5px] font-sans font-black uppercase tracking-[0.2em] text-[#A62626] leading-none z-10 select-none">
        {label}
      </div>

      <div className="relative text-[13px] font-serif font-black uppercase tracking-widest text-center mt-1.5 truncate z-10" style={{ color: color || '#1E1C1A' }}>
        {value}
      </div>
    </div>
  );
};

const FlagBox: React.FC<{ faction: Faction }> = ({ faction }) => {
  const renderFlag = () => {
    switch (faction) {
      case Faction.REPUBLICAN:
        return (
          <div className="flex flex-col w-12 h-8 border border-[#1E1C1A] shadow-sm overflow-hidden relative rounded-none">
            <div className="bg-[#C63B2B] h-1/3 w-full" />
            <div className="bg-[#E5B53B] h-1/3 w-full" />
            <div className="bg-[#5F2D51] h-1/3 w-full" />
          </div>
        );
      case Faction.NATIONALIST:
        return (
          <div className="flex flex-col w-12 h-8 border border-[#1E1C1A] shadow-sm overflow-hidden relative rounded-none">
            <div className="bg-[#C63B2B] h-1/4 w-full" />
            <div className="bg-[#E5B53B] h-2/4 w-full" />
            <div className="bg-[#C63B2B] h-1/4 w-full" />
          </div>
        );
      case Faction.PORTUGAL:
        return (
          <div className="flex w-12 h-8 border border-[#1E1C1A] shadow-sm overflow-hidden relative rounded-none">
            <div className="bg-[#1C4E2D] w-[40%] h-full" />
            <div className="bg-[#C63B2B] w-[60%] h-full" />
          </div>
        );
      default:
        return (
          <div className="flex w-12 h-8 border border-[#1E1C1A] bg-[#FAF5E6] justify-center items-center shadow-sm relative overflow-hidden rounded-none">
            <div className="absolute w-[140%] h-[1px] bg-[#1E1C1A]/40 rotate-[22deg]" />
            <div className="absolute w-[140%] h-[1px] bg-[#1E1C1A]/40 -rotate-[22deg]" />
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-full min-h-[52px] flex items-center justify-center bg-[#FAF6EC] border border-[#1E1C1A] rounded-none shadow-[2px_2px_0_0_rgba(30,28,26,0.1)]">
      {/* Corner printed crosses for registration */}
      <div className="absolute top-[1.5px] left-[1.5px] w-1.5 h-1.5 border-t border-l border-[#A62626] pointer-events-none" />
      <div className="absolute top-[1.5px] right-[1.5px] w-1.5 h-1.5 border-t border-r border-[#A62626] pointer-events-none" />
      <div className="absolute bottom-[1.5px] left-[1.5px] w-1.5 h-1.5 border-b border-l border-[#A62626] pointer-events-none" />
      <div className="absolute bottom-[1.5px] right-[1.5px] w-1.5 h-1.5 border-b border-r border-[#A62626] pointer-events-none" />

      {/* Ink inner dashed guide border */}
      <div className="absolute inset-[3px] border border-dashed border-[#1E1C1A]/10 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center transform scale-110">
        {renderFlag()}
      </div>
    </div>
  );
};

const ProvinceParamCapsule: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
  return (
    <div className="flex items-center w-full gap-1 tracking-tight select-none font-sans">
      {/* Slanted Capsule Label */}
      <div className="flex-1 min-h-[22px] flex items-center bg-[#FAF5E6] px-1.5 py-0.5 border border-[#1E1C1A] font-bold text-[7.5px] text-[#1E1C1A] uppercase tracking-wider rounded-none leading-tight"
           style={{
             clipPath: 'polygon(0% 3px, 3px 0%, 100% 0%, 100% 100%, 3px 100%, 0% calc(100% - 3px))'
           }}>
        {label}
      </div>
      {/* Double rounded/notched Capsule numeric Value */}
      <div className="min-w-[48px] px-1.5 min-h-[22px] flex items-center justify-center bg-[#FAF5E6] border border-[#1E1C1A] font-black text-[9px] text-[#A62626] rounded-none text-center shrink-0"
           style={{
             clipPath: 'polygon(0% 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%)'
           }}>
        {value}
      </div>
    </div>
  );
};

const CapsuleStat: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  return (
    <div className="flex items-center w-full gap-1 tracking-tight select-none font-sans">
      {/* Slanted Capsule Label */}
      <div className="flex-1 min-h-[22px] flex items-center bg-[#FAF5E6] px-1.5 py-0.5 border border-[#1E1C1A] font-bold text-[7.5px] text-[#1E1C1A] uppercase tracking-wider rounded-none leading-tight"
           style={{
             clipPath: 'polygon(0% 3px, 3px 0%, 100% 0%, 100% 100%, 3px 100%, 0% calc(100% - 3px))'
           }}>
        {label}
      </div>
      {/* Double rounded/notched Capsule numeric Value */}
      <div className="w-10 min-h-[22px] flex items-center justify-center bg-[#FAF5E6] border border-[#1E1C1A] font-black text-[10px] text-[#A62626] rounded-none text-center shrink-0"
           style={{
             clipPath: 'polygon(0% 0%, calc(100% - 3px) 0%, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%)'
           }}>
        {value}
      </div>
    </div>
  );
};

const GarrisonBadge: React.FC<{ count: number }> = ({ count }) => {
  return (
    <div className="relative w-11 h-11 flex flex-col items-center justify-center bg-[#FAF6EC] rounded-none border border-[#1E1C1A] shadow-sm shrink-0">
      {/* Accent corner points */}
      <div className="absolute top-0.5 left-0.5 text-[6px] text-[#A62626]/60 leading-none select-none pointer-events-none">+</div>
      <div className="absolute top-0.5 right-0.5 text-[6px] text-[#A62626]/60 leading-none select-none pointer-events-none">+</div>
      <div className="absolute bottom-0.5 left-0.5 text-[6px] text-[#A62626]/60 leading-none select-none pointer-events-none">+</div>
      <div className="absolute bottom-0.5 right-0.5 text-[6px] text-[#A62626]/60 leading-none select-none pointer-events-none">+</div>

      {/* Decorative dashed boundary line */}
      <div className="absolute inset-[2.5px] border border-dashed border-[#1E1C1A]/15 pointer-events-none" />

      {/* Command Emblem */}
      <Swords size={12} className="text-[#A62626] drop-shadow-none" />
      
      {/* Numeric Indicator */}
      <span className="text-[10px] font-sans font-black text-[#1E1C1A] leading-none bg-[#1E1C1A]/5 px-1 mt-0.5 rounded-none select-none">
        {count}
      </span>
    </div>
  );
};

const StrategicValueBadge: React.FC<{ value: number }> = ({ value }) => {
  return (
    <div className="relative w-11 h-11 flex flex-col items-center justify-center bg-[#FAF6EC] rounded-none border border-[#1E1C1A] shadow-sm shrink-0">
      {/* Accent corner points */}
      <div className="absolute top-0.5 left-0.5 text-[6px] text-[#A62626]/60 leading-none select-none pointer-events-none">+</div>
      <div className="absolute top-0.5 right-0.5 text-[6px] text-[#A62626]/60 leading-none select-none pointer-events-none">+</div>
      <div className="absolute bottom-0.5 left-0.5 text-[6px] text-[#A62626]/60 leading-none select-none pointer-events-none">+</div>
      <div className="absolute bottom-0.5 right-0.5 text-[6px] text-[#A62626]/60 leading-none select-none pointer-events-none">+</div>

      {/* Decorative dashed boundary line */}
      <div className="absolute inset-[2.5px] border border-dashed border-[#1E1C1A]/15 pointer-events-none" />

      {/* Target icon */}
      <Target size={12} className="text-[#A62626] drop-shadow-none" />
      
      {/* Numeric Indicator */}
      <span className="text-[9px] font-sans font-black text-[#1E1C1A] mt-0.5 leading-none select-none">
        ★{value}
      </span>
    </div>
  );
};

const FortificationBox: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div className="relative w-full select-none flex flex-col justify-center h-[52px] px-3 py-1 bg-[#FAF6EC] border border-[#1E1C1A] rounded-none shadow-[2px_2px_0_0_rgba(30,28,26,0.1)]">
      {/* Inner line */}
      <div className="absolute inset-[2.5px] border border-[#1E1C1A]/20 pointer-events-none" />
      
      {/* Corner crops */}
      <div className="absolute top-[1.5px] left-[1.5px] w-[5px] h-[5px] border-t border-l border-[#A62626]/80 pointer-events-none" />
      <div className="absolute top-[1.5px] right-[1.5px] w-[5px] h-[5px] border-t border-r border-[#A62626]/80 pointer-events-none" />
      <div className="absolute bottom-[1.5px] left-[1.5px] w-[5px] h-[5px] border-b border-l border-[#A62626]/80 pointer-events-none" />
      <div className="absolute bottom-[1.5px] right-[1.5px] w-[5px] h-[5px] border-b border-r border-[#A62626]/80 pointer-events-none" />

      {/* Floating print label */}
      <div className="absolute left-[8px] -top-[5px] bg-[#FAF6EC] px-1 text-[7.5px] font-sans font-black uppercase tracking-[0.2em] text-[#A62626] leading-none z-10 select-none">
        {label}
      </div>

      <div className="relative text-[14px] font-serif font-black text-[#1E1C1A] tracking-wider truncate mt-1.5 uppercase select-text">
        {value}
      </div>
    </div>
  );
};
const Rivet: React.FC = () => (
  <span className="text-[10px] text-[#A62626] font-bold select-none inline-block leading-none">★</span>
);

const CardCorners: React.FC = () => (
  <>
    {/* Thin inner offset border layer */}
    <div className="absolute inset-1 border border-[#1E1C1A]/10 pointer-events-none z-10" />
    
    {/* Printed registration crop corners */}
    <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-[#A62626]/65 pointer-events-none z-10" />
    <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-[#A62626]/65 pointer-events-none z-10" />
    <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-[#A62626]/65 pointer-events-none z-10" />
    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-[#A62626]/65 pointer-events-none z-10" />
    
    {/* Micro registration marks (⊕) near the corners */}
    <span className="absolute top-1.5 left-1.5 text-[6.5px] text-[#A62626]/50 font-sans font-black select-none pointer-events-none leading-none z-10">⊕</span>
    <span className="absolute top-1.5 right-1.5 text-[6.5px] text-[#A62626]/50 font-sans font-black select-none pointer-events-none leading-none z-10">⊕</span>
    <span className="absolute bottom-1.5 left-1.5 text-[6.5px] text-[#A62626]/50 font-sans font-black select-none pointer-events-none leading-none z-10">⊕</span>
    <span className="absolute bottom-1.5 right-1.5 text-[6.5px] text-[#A62626]/50 font-sans font-black select-none pointer-events-none leading-none z-10">⊕</span>
  </>
);

interface SidebarProps {
  state: GameState;
  onExecuteOffensive: (id: string) => void;
  onSelectProvince: (id: string | null) => void;
  onRecruitArmy: (provinceId: string, composition: { infantry: number; artillery: number; tanks: number }) => void;
  onReinforceArmy: (armyId: string) => void;
  onSelectArmy: (id: string | null, isShift?: boolean) => void;
  onMergeArmies: () => void;
  onDisbandArmies: () => void;
  onSplitArmy: (armyId: string, composition: { infantry: number; artillery: number; tanks: number }) => void;
  onBuildBuilding: (provinceId: string, buildingType: 'barracks' | 'fortress' | 'recruitingOffice' | 'ammoFactory') => void;
  lang: 'en' | 'zh';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  state, 
  onExecuteOffensive, 
  onSelectProvince, 
  onRecruitArmy, 
  onReinforceArmy,
  onSelectArmy,
  onMergeArmies,
  onDisbandArmies,
  onSplitArmy,
  onBuildBuilding,
  lang = 'en'
}) => {
  const getFactionName = (faction: Faction) => {
    if (lang === 'zh') {
      if (faction === Faction.REPUBLICAN) return '共和国';
      if (faction === Faction.NATIONALIST) return '国民军';
      if (faction === Faction.PORTUGAL) return '葡萄牙';
      if (faction === Faction.WORKERS_ALLIANCE) return '工人联盟自治政府';
      return '中立';
    }
    if (faction === Faction.REPUBLICAN) return 'Republicans';
    if (faction === Faction.NATIONALIST) return 'Nationalists';
    if (faction === Faction.PORTUGAL) return 'Portugal';
    if (faction === Faction.WORKERS_ALLIANCE) return "Workers' Alliance";
    return 'Neutral';
  };

  const getCultureName = (cultureEn: string) => {
    if (lang === 'zh') {
      const c = cultureEn.toLowerCase();
      if (c.includes('castilian')) return '卡斯蒂利亚';
      if (c.includes('leonese')) return '莱昂';
      if (c.includes('catalan')) return '加泰罗尼亚';
      if (c.includes('basque')) return '巴斯克';
      if (c.includes('galician')) return '加利西亚';
      if (c.includes('andalusian')) return '安达卢西亚';
      if (c.includes('valencia')) return '巴伦西亚';
      if (c.includes('aragon')) return '阿拉贡';
      if (c.includes('asturia')) return '阿斯图里亚斯';
      if (c.includes('portuguese')) return '葡萄牙';
      if (c.includes('moroccan') || c.includes('berber')) return '摩洛哥与柏柏尔';
      if (c.includes('canarian')) return '加那利';
      return cultureEn;
    }
    return cultureEn;
  };

  const getRegionName = (regionEn: string) => {
    if (lang === 'zh') {
      const r = regionEn.toLowerCase();
      if (r.includes('galicia')) return '加利西亚';
      if (r.includes('asturias')) return '阿斯图里亚斯';
      if (r.includes('old castile')) return '旧卡斯蒂利亚';
      if (r.includes('leon')) return '莱昂';
      if (r.includes('basque')) return '巴斯克地区';
      if (r.includes('navarre')) return '纳瓦拉';
      if (r.includes('aragon')) return '阿拉贡';
      if (r.includes('catalonia')) return '加泰罗尼亚';
      if (r.includes('balearic')) return '巴利阿里群岛';
      if (r.includes('valencia')) return '巴伦西亚';
      if (r.includes('murcia')) return '穆尔西亚';
      if (r.includes('andalusia')) return '安达卢西亚';
      if (r.includes('extremadura')) return '埃斯特雷马杜拉';
      if (r.includes('new castile')) return '新卡斯蒂利亚';
      if (r.includes('canaries') || r.includes('canary')) return '加那利群岛';
      if (r.includes('morocco')) return '摩洛哥保护国';
      if (r.includes('portugal')) return '葡萄牙';
      return regionEn;
    }
    return regionEn;
  };

  const selectedProvince = state.selectedProvinceId ? state.provinces[state.selectedProvinceId] : null;
  const selectedArmy = state.selectedArmyId ? state.armies.find(a => a.id === state.selectedArmyId) : null;

  // Multi-selection calculations
  const selectedArmies = state.armies.filter(a => state.selectedArmyIds.includes(a.id));
  const isMultipleSelected = selectedArmies.length > 1;

  // Recruitment formulation state
  const [recruitInf, setRecruitInf] = useState(2000); // 2000 soldiers step
  const [recruitArt, setRecruitArt] = useState(1000);
  const [recruitTnk, setRecruitTnk] = useState(1);
  const [provinceTab, setProvinceTab] = useState<'info' | 'buildings' | 'mobilize'>('info');
  const [selectedSlotType, setSelectedSlotType] = useState<string | null>(null);
  const [activeEmptySlotIdx, setActiveEmptySlotIdx] = useState<number | null>(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);

  // Split army sliders state
  const [splitInf, setSplitInf] = useState(0);
  const [splitArt, setSplitArt] = useState(0);
  const [splitTnk, setSplitTnk] = useState(0);
  const [isSplitting, setIsSplitting] = useState(false);

  // Reset split states when selected army shifts
  useEffect(() => {
    setSplitInf(0);
    setSplitArt(0);
    setSplitTnk(0);
    setIsSplitting(false);
  }, [state.selectedArmyId]);

  // Reset counters when selected province shifts
  useEffect(() => {
    setRecruitInf(2000);
    setRecruitArt(1000);
    setRecruitTnk(1);
    setProvinceTab('info');
    setSelectedSlotType(null);
    setActiveEmptySlotIdx(null);
    setHoveredBuildingId(null);
  }, [state.selectedProvinceId]);

  // Calculations for mobilize costs
  const reqManpower = recruitInf + recruitArt + recruitTnk;
  const reqSupplies = Math.floor(recruitInf * 0.03 + recruitArt * 0.06 + recruitTnk * 1.2);
  const reqIndustry = Math.floor(recruitArt * 0.04 + recruitTnk * 0.08);
  const reqTankReserve = recruitTnk;

  const playerRes = state.resources[state.currentPlayer];
  const hasEnoughManpower = (playerRes?.manpower || 0) >= reqManpower;
  const hasEnoughSupplies = (playerRes?.supplies || 0) >= reqSupplies;
  const hasEnoughIndustry = (playerRes?.industrialCapacity || 0) >= reqIndustry;
  const hasEnoughTankReserve = (playerRes?.tankReserve || 0) >= reqTankReserve;
  const hasRecruitingOffice = !!(selectedProvince?.buildings?.recruitingOffice && selectedProvince.buildings.recruitingOffice > 0);
  const canMobilize = reqManpower > 0 && hasEnoughManpower && hasEnoughSupplies && hasEnoughIndustry && hasEnoughTankReserve && hasRecruitingOffice;

  const handleMobilize = () => {
    if (!selectedProvince) return;
    onRecruitArmy(selectedProvince.id, {
      infantry: recruitInf,
      artillery: recruitArt,
      tanks: recruitTnk
    });
    // Reset selection counters
    setRecruitInf(2000);
    setRecruitArt(1000);
    setRecruitTnk(1);
  };

  const isArmyReinforceable = selectedArmy && 
    state.provinces[selectedArmy.provinceId]?.owner === state.currentPlayer;

  return (
    <aside className="w-80 h-full bg-[#FAF6EC] border-l-[5px] border-l-[#1E1C1A] flex flex-col overflow-hidden text-[#1E1C1A] font-serif select-none relative">
      {/* Details Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-5 z-20 scrollbar-thin scrollbar-thumb-[#A62626]/60 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          {isMultipleSelected ? (
            <motion.div
              key="multi-army"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-[#FAF6EC] border-4 border-double border-[#1E1C1A] p-2 text-[#1E1C1A] shadow-[4px_4px_0_0_rgba(30,28,26,0.15)] relative overflow-hidden rounded-none">
                <div className="border border-[#1E1C1A]/10 p-3.5 space-y-4 relative bg-[#FAF6EC]">
                  <CardCorners />

                  <div className="border-b-2 border-double border-[#1E1C1A]/65 pb-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[#A62626] uppercase font-serif text-[10px] font-bold tracking-widest">
                      <Swords size={11} className="text-[#A62626]" /> {lang === 'zh' ? '多军团联合指挥' : 'MULTI-DIVISION COMMAND'}
                    </div>
                    <h2 className="text-xl font-serif font-bold italic text-[#1E1C1A] mt-1">
                      {lang === 'zh' ? `已选师团数 (${selectedArmies.length})` : `Selected Stacks (${selectedArmies.length})`}
                    </h2>
                    <div className="text-[10px] font-serif text-[#1E1C1A]/70 uppercase font-bold tracking-wider mt-0.5">
                      {lang === 'zh' ? `集结于 ${getProvinceName(state.provinces[selectedArmies[0].provinceId], 'zh')}` : `Concentrated in ${state.provinces[selectedArmies[0].provinceId]?.name}`}
                    </div>
                  </div>

                  {(() => {
                    const totalManpower = selectedArmies.reduce((sum, a) => sum + a.manpower, 0);
                    const totalMaxManpower = selectedArmies.reduce((sum, a) => sum + (a.maxManpower || a.manpower), 0);
                    const totalInf = selectedArmies.reduce((sum, a) => sum + a.composition.infantry, 0);
                    const totalArt = selectedArmies.reduce((sum, a) => sum + a.composition.artillery, 0);
                    const totalTnk = selectedArmies.reduce((sum, a) => sum + a.composition.tanks, 0);

                    const avgMorale = totalManpower > 0 
                      ? Math.round(selectedArmies.reduce((sum, a) => sum + a.morale * a.manpower, 0) / totalManpower)
                      : Math.round(selectedArmies.reduce((sum, a) => sum + a.morale, 0) / selectedArmies.length);
                    
                    const avgMilitarization = totalManpower > 0 
                      ? Math.round(selectedArmies.reduce((sum, a) => sum + a.militarization * a.manpower, 0) / totalManpower)
                      : Math.round(selectedArmies.reduce((sum, a) => sum + a.militarization, 0) / selectedArmies.length);
                    
                    const minMoves = Math.min(...selectedArmies.map(a => a.movesLeft));
                    const sameFaction = selectedArmies.every(a => a.faction === state.currentPlayer);

                    return (
                      <div className="space-y-4">
                        {/* Combined Ratings */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-serif">
                          <DetailBox label={lang === 'zh' ? '控制阵营' : 'Control'} value={getFactionName(selectedArmies[0].faction)} color={FACTION_COLORS[selectedArmies[0].faction]} />
                          <DetailBox label={lang === 'zh' ? '行动步数' : 'Move Action Limit'} value={`${minMoves}/2`} />
                          <DetailBox label={lang === 'zh' ? '平均士气' : 'Weighted Morale'} value={`${avgMorale}%`} />
                          <DetailBox label={lang === 'zh' ? '平均军事化度' : 'Weighted Mil.'} value={`${avgMilitarization}%`} />
                        </div>

                        {/* Combined Composition segments */}
                        <div className="bg-[#FAF6EC] p-3 border border-[#1E1C1A]/25 space-y-3.5 relative shadow-sm rounded-none">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1C1A] flex justify-between border-b border-[#1E1C1A]/20 pb-1.5 font-serif">
                            <span>{lang === 'zh' ? '联合兵力' : 'Combined Strength'}</span>
                            <span className="font-serif text-[10px] text-[#1E1C1A]/70">
                              {lang === 'zh' ? `${totalManpower.toLocaleString()} / ${totalMaxManpower.toLocaleString()} 兵员` : `${totalManpower.toLocaleString()} / ${totalMaxManpower.toLocaleString()} Soldiers`}
                            </span>
                          </h3>

                          {totalManpower > 0 && (
                            <div className="w-full h-4 overflow-hidden flex bg-[#EFE8D4] border border-[#1E1C1A] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)] rounded-none">
                              <div 
                                className="bg-[#2C5E3B] h-full border-r border-[#1B3D23] transition-all duration-500" 
                                style={{ width: `${(totalInf / totalManpower) * 100}%` }} 
                                title={`Infantry: ${totalInf}`}
                              />
                              <div 
                                className="bg-[#AC6428] h-full border-r border-[#703F17] transition-all duration-500" 
                                style={{ width: `${(totalArt / totalManpower) * 100}%` }} 
                                title={`Artillery: ${totalArt}`}
                              />
                              <div 
                                className="bg-[#3B4C7C] h-full transition-all duration-500" 
                                style={{ width: `${(totalTnk / totalManpower) * 100}%` }} 
                                title={`Tanks: ${totalTnk}`}
                              />
                            </div>
                          )}

                          <div className="space-y-2 text-xs font-serif">
                            <div className="flex justify-between items-center text-[#2C5E3B] font-bold border-b border-dashed border-[#1E1C1A]/15 pb-1">
                              <div className="flex items-center gap-1.5"><Users size={12} className="opacity-80 text-[#2C5E3B]" /> {lang === 'zh' ? '步兵' : 'Infantry'} </div>
                              <span className="font-bold">{totalInf.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#AC6428] font-bold border-b border-dashed border-[#1E1C1A]/15 pb-1">
                              <div className="flex items-center gap-1.5"><Crosshair size={12} className="opacity-80 text-[#AC6428]" /> {lang === 'zh' ? '炮兵' : 'Artillery'}</div>
                              <span className="font-bold">{totalArt.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#3B4C7C] font-bold pb-0.5">
                              <div className="flex items-center gap-1.5"><Flame size={12} className="opacity-80 text-[#3B4C7C]" /> {lang === 'zh' ? '坦克' : 'Tanks'}</div>
                              <span className="font-bold">{totalTnk.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* List of Divisions in Selection */}
                        <div className="bg-[#FAF6EC] p-3 border border-[#1E1C1A]/25 space-y-2 rounded-none">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1C1A] font-serif border-b border-[#1E1C1A]/20 pb-1">
                            {lang === 'zh' ? `已选师团明细 (${selectedArmies.length})` : `Selected Sub-Divisions (${selectedArmies.length})`}
                          </h4>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#1E1C1A]/45">
                            {selectedArmies.map(a => (
                              <div key={a.id} className="flex justify-between items-center p-1.5 bg-[#FAF6EC] border border-[#1E1C1A]/15 rounded-none text-[10px] font-serif hover:bg-[#FAF6EC] transition-all">
                                <div className="flex items-center gap-1.5">
                                  <input 
                                    type="checkbox" 
                                    checked={true} 
                                    onChange={() => onSelectArmy(a.id, true)}
                                    className="rounded-none border-[#1E1C1A] text-[#A62626] focus:ring-[#A62626] cursor-pointer bg-[#FAF6EC]"
                                  />
                                  <span className="font-bold text-[#1E1C1A]">{lang === 'zh' ? `${a.id.slice(-4).toUpperCase()} 师` : `Div. ${a.id.slice(-4).toUpperCase()}`}</span>
                                </div>
                                <div className="text-[#1E1C1A]/80 font-bold flex gap-2">
                                  <span>{a.manpower.toLocaleString()}{lang === 'zh' ? ' 人' : ' Soldiers'}</span>
                                  <span className="text-[#A62626]">★{a.morale}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Merge Action Panel */}
                        {sameFaction ? (
                          <div className="bg-[#EFE8D4] border border-[#1E1C1A]/35 p-3 rounded-none space-y-2.5">
                            <div className="text-[11px] text-[#1E1C1A] leading-relaxed flex gap-1.5 font-serif font-bold">
                              <Info size={14} className="shrink-0 text-[#A62626] mt-0.5" />
                              <span>
                                {lang === 'zh' ? (
                                  <>合并操作会将所有士兵和装备整合至 <strong>{selectedArmies[0].id.slice(-4).toUpperCase()} 师</strong>。士气和经验水平将进行数学加权平衡计算。</>
                                ) : (
                                  <>Merging will consolidate all soldiers and equipment into <strong>Div. {selectedArmies[0].id.slice(-4).toUpperCase()}</strong>. Morale and experience will be mathematically balanced.</>
                                )}
                              </span>
                            </div>
                            <button
                              onClick={onMergeArmies}
                              className="w-full py-2 bg-[#A62626] hover:bg-[#C23131] border border-[#1E1C1A] text-[#FAF6EC] font-serif italic font-bold uppercase tracking-wider text-xs transition-all shadow-[2px_2px_0_0_rgba(30,28,26,1)] rounded-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                            >
                              {lang === 'zh' ? '合并选中部队' : 'Merge Selected Stacks'}
                            </button>

                            {selectedArmies[0].faction === state.currentPlayer && (
                              <button
                                onClick={onDisbandArmies}
                                className="w-full py-2 bg-[#8C3A35] hover:bg-[#A64A45] border border-[#1E1C1A] text-[#FAF6EC] font-serif italic font-bold uppercase tracking-wider text-xs transition-all shadow-[2px_2px_0_0_rgba(30,28,26,1)] rounded-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none mt-2"
                              >
                                {lang === 'zh' ? '解散选中部队 (全额收回人员坦克)' : 'Disband Selected Force Stacks'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-[#8C3A35]/15 rounded-none border border-[#8C3A35]/30 text-[10px] font-serif text-[#8C3A35] italic text-center">
                            {lang === 'zh' ? '⚠️ 无法合并属于不同阵营的部队。' : '⚠️ Cannot merge forces belonging to different factions.'}
                          </div>
                        )}

                        <button
                          onClick={() => onSelectArmy(null)}
                          className="w-full bg-[#EFE8D4] border border-[#1E1C1A] text-[#1E1C1A] py-2 text-xs font-serif font-bold hover:bg-[#E2D9C2] transition-all uppercase tracking-wider shadow-[2px_2px_0_0_rgba(30,28,26,1)] rounded-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          {lang === 'zh' ? `取消选择 (${selectedArmies.length})` : `Deselect Selection (${selectedArmies.length})`}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          ) : selectedArmy ? (
            <motion.div
              key={`army-${selectedArmy.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-[#FAF6EC] border-4 border-double border-[#1E1C1A] p-2 text-[#1E1C1A] shadow-[4px_4px_0_0_rgba(30,28,26,0.15)] relative overflow-hidden rounded-none">
                <div className="border border-[#1E1C1A]/10 p-3.5 space-y-4 relative bg-[#FAF6EC]">
                  <CardCorners />

                  <div className="border-b-2 border-double border-[#1E1C1A]/65 pb-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[#A62626] uppercase font-serif text-[10px] font-bold tracking-widest">
                      <Swords size={11} className="text-[#A62626]" /> {lang === 'zh' ? '大本营师团报告' : 'DIVISION STATUS'}
                    </div>
                    <h2 className="text-xl font-serif font-bold italic text-[#1E1C1A] mt-1">
                      {lang === 'zh' ? `${selectedArmy.id.slice(-4).toUpperCase()} 师` : `Div. ${selectedArmy.id.slice(-4).toUpperCase()}`}
                    </h2>
                    <div className="text-[10px] font-serif text-[#1E1C1A]/70 uppercase font-bold tracking-wider mt-0.5">
                      {lang === 'zh' ? `驻扎于 ${getProvinceName(state.provinces[selectedArmy.provinceId], 'zh')}` : `Stationed in ${state.provinces[selectedArmy.provinceId]?.name}`}
                    </div>
                  </div>

                  {/* Combat Ratings */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-serif">
                    <DetailBox label={lang === 'zh' ? '控制阵营' : 'Control'} value={getFactionName(selectedArmy.faction)} color={FACTION_COLORS[selectedArmy.faction]} />
                    <DetailBox label={lang === 'zh' ? '可动用步数' : 'Action Moves'} value={`${selectedArmy.movesLeft}/2`} />
                    <DetailBox label={lang === 'zh' ? '士气精神' : 'Morale Spirit'} value={`${selectedArmy.morale}%`} />
                    <DetailBox label={lang === 'zh' ? '军事化度' : 'Militarization'} value={`${selectedArmy.militarization}%`} />
                  </div>

                  {/* Composition Segment Card */}
                  <div className="bg-[#FAF6EC] p-3 border border-[#1E1C1A]/25 space-y-3.5 relative shadow-sm rounded-none">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1C1A] flex justify-between border-b border-[#1E1C1A]/20 pb-1.5 font-serif">
                      <span>{lang === 'zh' ? '编制明细' : 'Composition'}</span>
                      <span className="font-serif text-[10px] text-[#1E1C1A]/70">
                        {lang === 'zh' ? `${selectedArmy.manpower.toLocaleString()} / ${(selectedArmy.maxManpower || selectedArmy.manpower).toLocaleString()} 兵员` : `${selectedArmy.manpower.toLocaleString()} / ${(selectedArmy.maxManpower || selectedArmy.manpower).toLocaleString()} Soldiers`}
                      </span>
                    </h3>

                    {/* Micro Segment Bar */}
                    {selectedArmy.manpower > 0 && (
                      <div className="w-full h-4 overflow-hidden flex bg-[#EFE8D4] border border-[#1E1C1A] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)] rounded-none">
                        <div 
                           className="bg-[#2C5E3B] h-full border-r border-[#1B3D23] transition-all duration-500" 
                           style={{ width: `${(selectedArmy.composition.infantry / selectedArmy.manpower) * 100}%` }} 
                           title={`Infantry: ${selectedArmy.composition.infantry}`}
                        />
                        <div 
                           className="bg-[#AC6428] h-full border-r border-[#703F17] transition-all duration-500" 
                           style={{ width: `${(selectedArmy.composition.artillery / selectedArmy.manpower) * 100}%` }} 
                           title={`Artillery: ${selectedArmy.composition.artillery}`}
                        />
                        <div 
                           className="bg-[#3B4C7C] h-full transition-all duration-500" 
                           style={{ width: `${(selectedArmy.composition.tanks / selectedArmy.manpower) * 100}%` }} 
                           title={`Tanks: ${selectedArmy.composition.tanks}`}
                        />
                      </div>
                    )}

                    {/* Breakdown List */}
                    <div className="space-y-2 text-xs font-serif">
                      <div className="flex justify-between items-center text-[#2C5E3B] font-bold border-b border-dashed border-[#1E1C1A]/15 pb-1">
                        <div className="flex items-center gap-1.5"><Users size={12} className="opacity-80 text-[#2C5E3B]" /> {lang === 'zh' ? '步兵' : 'Infantry'} </div>
                        <span className="font-bold">
                          {selectedArmy.composition.infantry.toLocaleString()} / {(selectedArmy.designedComposition?.infantry ?? selectedArmy.composition.infantry).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#AC6428] font-bold border-b border-dashed border-[#1E1C1A]/15 pb-1">
                        <div className="flex items-center gap-1.5"><Crosshair size={12} className="opacity-80 text-[#AC6428]" /> {lang === 'zh' ? '炮兵' : 'Artillery'}</div>
                        <span className="font-bold">
                          {selectedArmy.composition.artillery.toLocaleString()} / {(selectedArmy.designedComposition?.artillery ?? selectedArmy.composition.artillery).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[#3B4C7C] font-bold pb-0.5">
                        <div className="flex items-center gap-1.5"><Flame size={12} className="opacity-80 text-[#3B4C7C]" /> {lang === 'zh' ? '坦克' : 'Tanks'}</div>
                        <span className="font-bold">
                          {selectedArmy.composition.tanks.toLocaleString()} / {(selectedArmy.designedComposition?.tanks ?? selectedArmy.composition.tanks).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tactical Reinforcement Panel */}
                  {isArmyReinforceable ? (
                    (() => {
                      const designedComp = selectedArmy.designedComposition || selectedArmy.composition;
                      const maxInfRestored = Math.max(0, Math.floor((designedComp.infantry - selectedArmy.composition.infantry) * 0.5));
                      const maxArtRestored = Math.max(0, Math.floor((designedComp.artillery - selectedArmy.composition.artillery) * 0.5));
                      const maxTnkRestored = Math.max(0, Math.floor((designedComp.tanks - selectedArmy.composition.tanks) * 0.5));

                      const totalMaxRestored = maxInfRestored + maxArtRestored + maxTnkRestored;
                      
                      let scale = 1.0;
                      const targetManpower = totalMaxRestored;
                      const targetSupplies = Math.floor(maxInfRestored * 0.03 + maxArtRestored * 0.06 + maxTnkRestored * 1.2);
                      const targetIndustrial = Math.floor(maxArtRestored * 0.04 + maxTnkRestored * 0.08);
                      const targetTankReserve = maxTnkRestored;

                      const clientManpower = playerRes?.manpower || 0;
                      const clientSupplies = playerRes?.supplies || 0;
                      const clientIndustrial = playerRes?.industrialCapacity || 0;
                      const clientTankReserve = playerRes?.tankReserve || 0;

                      if (targetManpower > 0) {
                        if (clientManpower < targetManpower) scale = Math.min(scale, clientManpower / targetManpower);
                        if (clientSupplies < targetSupplies) scale = Math.min(scale, clientSupplies / targetSupplies);
                        if (clientIndustrial < targetIndustrial) scale = Math.min(scale, clientIndustrial / targetIndustrial);
                        if (clientTankReserve < targetTankReserve) scale = Math.min(scale, clientTankReserve / targetTankReserve);
                      }

                      const actualInf = Math.floor(maxInfRestored * scale);
                      const actualArt = Math.floor(maxArtRestored * scale);
                      const actualTnk = Math.floor(maxTnkRestored * scale);
                      const actualTotal = actualInf + actualArt + actualTnk;

                      const costManpower = actualTotal;
                      const costSupplies = Math.floor(actualInf * 0.03 + actualArt * 0.06 + actualTnk * 1.2);
                      const costIndustrial = Math.floor(actualArt * 0.04 + actualTnk * 0.08);
                      const costTankReserve = actualTnk;

                      const hasCasualties = (selectedArmy.maxManpower || selectedArmy.manpower) > selectedArmy.manpower;
                      const canAffordSupplement = actualTotal > 0 && 
                        clientManpower >= costManpower && 
                        clientSupplies >= costSupplies && 
                        clientIndustrial >= costIndustrial &&
                        clientTankReserve >= costTankReserve;

                      return (
                        <div className="bg-[#FAF6EC] p-3 border border-[#1E1C1A]/25 space-y-3 relative shadow-sm rounded-none">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1C1A] font-serif border-b border-[#1E1C1A]/20 pb-1.5">
                            {lang === 'zh' ? '师团整补与兵员补给' : 'Personnel Reinforcement'}
                          </h4>
                          <p className="text-[10px] text-[#1E1C1A]/70 leading-tight font-serif italic">
                            {lang === 'zh' ? '补充已损失师团兵力的 50%，并在动员集结时提升部队士气 20%。' : 'Replenish up to 50% of lost division troops and rally military morale by 20%.'}
                          </p>

                          {!hasCasualties ? (
                            <div className="p-2 bg-[#2C5E3B]/10 text-[#2C5E3B] border border-[#2C5E3B]/30 text-[10px] font-serif text-center font-bold rounded-none">
                              {lang === 'zh' ? '✓ 师团已处于 100% 满编状态' : '✓ Division is already at 100% full strength'}
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1">
                              {/* Troop replenish prognosis */}
                              <div className="bg-[#FAF6EC] p-2 border border-[#1E1C1A]/25 text-[10px] space-y-1 font-serif rounded-none">
                                <div className="text-[9px] uppercase tracking-wider font-bold text-[#A62626]">{lang === 'zh' ? '预计整补明细：' : 'Estimated Supplementation:'}</div>
                                <div className="flex justify-between text-[#2C5E3B] border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span>{lang === 'zh' ? '整补步兵：' : 'Infantry Recruits:'}</span>
                                  <span className="font-bold">+{actualInf.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[#AC6428] border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span>{lang === 'zh' ? '整补炮兵：' : 'Artillery Recruits:'}</span>
                                  <span className="font-bold">+{actualArt.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[#3B4C7C] border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span>{lang === 'zh' ? '整补装甲兵：' : 'Tank Crew Recruits:'}</span>
                                  <span className="font-bold">+{actualTnk.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-dashed border-[#1E1C1A]/20 my-1" />
                                <div className="flex justify-between font-bold text-[#1E1C1A]">
                                  <span>{lang === 'zh' ? '整补兵力总计：' : 'Total Supplements:'}</span>
                                  <span>+{actualTotal.toLocaleString()}{lang === 'zh' ? ' 人' : ' troops'}</span>
                                </div>
                                <div className="flex justify-between text-[#A62626] font-bold">
                                  <span>{lang === 'zh' ? '重整后士气目标：' : 'Morale Boosted Target:'}</span>
                                  <span>{selectedArmy.morale}% ➔ {Math.min(100, Math.floor(selectedArmy.morale * 1.2))}%</span>
                                </div>
                              </div>

                              {/* Cost list details */}
                              <div className="bg-[#FAF6EC] p-2 border border-[#1E1C1A]/25 text-[10px] space-y-1 font-serif rounded-none">
                                <div className="text-[9px] uppercase tracking-wider font-bold text-[#1E1C1A]/70">{lang === 'zh' ? '行动资源消耗账单：' : 'Operation Resource Cost Bill:'}</div>
                                <div className="flex justify-between border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span className={clientManpower < costManpower ? 'text-[#A62626] font-bold' : 'text-[#DA944E]'}>
                                    {lang === 'zh' ? '征召人力：' : 'Manpower Recruits:'}
                                  </span>
                                  <span className="font-bold">{costManpower} / {clientManpower.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span className={clientSupplies < costSupplies ? 'text-[#A62626] font-bold' : 'text-[#879D3E]'}>
                                    {lang === 'zh' ? '后勤物资：' : 'Materials Supplies:'}
                                  </span>
                                  <span className="font-bold">{costSupplies} / {clientSupplies}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span className={clientIndustrial < costIndustrial ? 'text-[#A62626] font-bold' : 'text-[#6D8A4E]'}>
                                    {lang === 'zh' ? '工业产能：' : 'Industrial Capacity:'}
                                  </span>
                                  <span className="font-bold">{costIndustrial} / {clientIndustrial}</span>
                                </div>
                                <div className="flex justify-between pb-0.5">
                                  <span className={clientTankReserve < costTankReserve ? 'text-[#A62626] font-bold' : 'text-[#7D5EA3]'}>
                                    {lang === 'zh' ? '坦克储备：' : 'Tank Reserve:'}
                                  </span>
                                  <span className="font-bold">{costTankReserve} / {clientTankReserve}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => onReinforceArmy(selectedArmy.id)}
                                disabled={!canAffordSupplement}
                                className="w-full py-2 bg-[#2C5E3B] hover:bg-[#377549] disabled:bg-[#FAF6EC] disabled:text-[#1E1C1A]/40 disabled:border-[#1E1C1A]/20 disabled:shadow-none border border-[#1E1C1A] text-[#FAF6EC] font-bold uppercase tracking-wider text-[11px] rounded-none transition-all shadow-[2px_2px_0_0_rgba(30,28,26,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                              >
                                {lang === 'zh' ? '执行整补行动' : 'Execute Supplement Action'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : selectedArmy && (
                    <div className="p-3 bg-[#8C3A35]/15 rounded-none border border-[#8C3A35]/30 text-[10px] font-serif text-[#8C3A35] italic text-center">
                      {lang === 'zh' ? '⚠️ 师团必须驻留于我方控制区域或省份以整补兵员。' : '⚠️ Division must be located inside friendly-controlled provinces to mobilize reinforcements.'}
                    </div>
                  )}

                  {/* Show other armies in same province for easy shift-clicking */}
                  {(() => {
                    const armiesInSameProvince = state.armies.filter(
                      a => a.provinceId === selectedArmy.provinceId && a.id !== selectedArmy.id
                    );
                    if (armiesInSameProvince.length === 0) return null;

                    return (
                      <div className="bg-[#FAF6EC] p-3 border border-[#1E1C1A]/25 space-y-2 rounded-none relative">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1C1A] font-serif border-b border-[#1E1C1A]/15 pb-1 flex justify-between items-center bg-transparent">
                          <span>{lang === 'zh' ? '同省集结部队' : 'Stacked Force Units'}</span>
                        </h3>
                        <p className="text-[9px] text-[#1E1C1A]/70 leading-tight font-serif italic">
                          {lang === 'zh' ? '勾选下列师团以便进行多选合并。' : 'Check below to multi-select and merge regiments together into one division stack.'}
                        </p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#1E1C1A]/45 pt-1">
                          {/* Current Sele */}
                          <div className="flex justify-between items-center p-1.5 bg-[#FAF6EC] border border-[#1E1C1A]/20 rounded-none text-[10px] font-serif">
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="checkbox" 
                                checked={true} 
                                disabled={selectedArmy.faction !== state.currentPlayer}
                                onChange={() => onSelectArmy(selectedArmy.id, true)}
                                className="rounded-none border-[#1E1C1A] text-[#A62626] focus:ring-[#A62626] bg-[#FAF6EC]"
                              />
                              <span className="font-bold text-[#2C5E3B]">{lang === 'zh' ? `${selectedArmy.id.slice(-4).toUpperCase()} 师` : `Div. ${selectedArmy.id.slice(-4).toUpperCase()}`}</span>
                            </div>
                            <span className="text-[#2C5E3B] font-bold font-sans">{selectedArmy.manpower.toLocaleString()}{lang === 'zh' ? ' 人' : ' Soldiers'}</span>
                          </div>

                          {/* Stacked partners */}
                          {armiesInSameProvince.map(a => (
                            <div key={a.id} className="flex justify-between items-center p-1.5 bg-[#FAF6EC] border border-[#1E1C1A]/15 rounded-none text-[10px] font-serif hover:bg-[#FAF6EC] transition-all">
                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="checkbox" 
                                  checked={false} 
                                  disabled={a.faction !== state.currentPlayer}
                                  onChange={() => onSelectArmy(a.id, true)}
                                  className="rounded-none border-[#1E1C1A] text-[#A62626] focus:ring-[#A62626] cursor-pointer bg-[#FAF6EC]"
                                />
                                <span className="font-bold text-[#1E1C1A]">{lang === 'zh' ? `${a.id.slice(-4).toUpperCase()} 师` : `Div. ${a.id.slice(-4).toUpperCase()}`}</span>
                              </div>
                              <span className="text-[#1E1C1A]/80 font-bold font-serif font-sans">{a.manpower.toLocaleString()}{lang === 'zh' ? ' 人' : ' Soldiers'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {selectedArmy.faction === state.currentPlayer && (
                    <div className="mb-2.5">
                      {!isSplitting ? (
                        <button
                          onClick={() => {
                            setSplitInf(0);
                            setSplitArt(0);
                            setSplitTnk(0);
                            setIsSplitting(true);
                          }}
                          className="w-full bg-[#FAF6EC] hover:bg-[#EBE4D5] text-[#1E1C1A] border border-[#1E1C1A] py-2 text-xs font-serif font-bold transition-all uppercase tracking-wider shadow-[2px_2px_0_0_rgba(30,28,26,1)] rounded-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none mb-1 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Building size={12} className="text-[#A62626]" />
                          {lang === 'zh' ? '进行部队拆分' : 'Split Division'}
                        </button>
                      ) : (
                        <div className="bg-[#FAF6EC]/80 border border-[#1E1C1A]/20 p-2.5 space-y-3 mb-1 animate-fadeIn">
                          <div className="flex justify-between items-center pb-1 border-b border-[#1E1C1A]/10">
                            <span className="text-[10px] font-serif font-bold text-[#A62626] uppercase tracking-wider block">
                              {lang === 'zh' ? '⚔️ 拆分新部队分配' : '⚔️ ALLOCATE SPLIT UNITS'}
                            </span>
                            <button
                              onClick={() => setIsSplitting(false)}
                              className="text-[9px] font-bold text-gray-400 hover:text-red-700 cursor-pointer"
                            >
                              {lang === 'zh' ? '取消' : 'Cancel'}
                            </button>
                          </div>

                          <div className="space-y-2">
                            {selectedArmy.composition.infantry > 0 && (
                              <MobilizeAdjuster
                                label={lang === 'zh' ? '步兵' : 'Infantry'}
                                value={splitInf}
                                onChange={(val) => setSplitInf(Math.min(selectedArmy.composition.infantry, val))}
                                color="text-[#2C5E3B]"
                                icon={<Users size={12} />}
                                lang={lang}
                                step={100}
                                min={0}
                                max={selectedArmy.composition.infantry}
                              />
                            )}

                            {selectedArmy.composition.artillery > 0 && (
                              <MobilizeAdjuster
                                label={lang === 'zh' ? '炮兵' : 'Artillery'}
                                value={splitArt}
                                onChange={(val) => setSplitArt(Math.min(selectedArmy.composition.artillery, val))}
                                color="text-[#AC6428]"
                                icon={<Crosshair size={12} />}
                                lang={lang}
                                step={50}
                                min={0}
                                max={selectedArmy.composition.artillery}
                              />
                            )}

                            {selectedArmy.composition.tanks > 0 && (
                              <MobilizeAdjuster
                                label={lang === 'zh' ? '坦克' : 'Tanks'}
                                value={splitTnk}
                                onChange={(val) => setSplitTnk(Math.min(selectedArmy.composition.tanks, val))}
                                color="text-[#3B4C7C]"
                                icon={<Flame size={12} />}
                                lang={lang}
                                step={1}
                                min={0}
                                max={selectedArmy.composition.tanks}
                                unit={lang === 'zh' ? '辆' : 'Tanks'}
                              />
                            )}
                          </div>

                          {(() => {
                            const newSplitTotal = splitInf + splitArt + splitTnk;
                            const remainingTotal = selectedArmy.manpower - newSplitTotal;
                            const isValidSplit = newSplitTotal > 0 && remainingTotal > 0;

                            return (
                              <div className="space-y-2 pt-1 border-t border-dashed border-[#1E1C1A]/10 text-[9.5px]">
                                <div className="grid grid-cols-2 gap-2 text-center">
                                  <div className="bg-[#FAF6EC] p-1.5 border border-[#8B7355]/20">
                                    <div className="text-gray-500 font-sans">{lang === 'zh' ? '留在原部队' : 'Kept in Parent'}</div>
                                    <div className="font-bold text-[#1E1C1A]">{remainingTotal.toLocaleString()} {lang === 'zh' ? '人' : 'Soldiers'}</div>
                                  </div>
                                  <div className="bg-[#A62626]/5 p-1.5 border border-[#A62626]/20">
                                    <div className="text-[#A62626] font-semibold">{lang === 'zh' ? '拆入新部队' : 'Split off'}</div>
                                    <div className="font-bold text-[#A37841]">{newSplitTotal.toLocaleString()} {lang === 'zh' ? '人' : 'Soldiers'}</div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isValidSplit) {
                                      onSplitArmy(selectedArmy.id, {
                                        infantry: splitInf,
                                        artillery: splitArt,
                                        tanks: splitTnk
                                      });
                                      setIsSplitting(false);
                                    }
                                  }}
                                  disabled={!isValidSplit}
                                  className={`w-full py-2 border text-[11px] font-serif font-extrabold uppercase tracking-widest text-center rounded-none shadow-[1px_1px_0_0_rgba(30,28,26,1)] transition-all ${
                                    isValidSplit
                                      ? 'bg-[#A62626] hover:bg-[#C23131] text-[#FAF6EC] border-[#1E1C1A] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                                      : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed shadow-none opacity-40'
                                  }`}
                                >
                                  {lang === 'zh' ? '确认拆分部队' : 'Confirm Split Division'}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedArmy.faction === state.currentPlayer && (
                    <button
                      onClick={onDisbandArmies}
                      className="w-full bg-[#8C3A35] hover:bg-[#A64A45] text-[#FAF6EC] border border-[#1E1C1A] py-2 text-xs font-serif font-bold transition-all uppercase tracking-wider shadow-[2px_2px_0_0_rgba(30,28,26,1)] rounded-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none mb-1"
                    >
                      {lang === 'zh' ? '解散当前部队 (全额收回人员坦克)' : 'Disband Current Division'}
                    </button>
                  )}

                  <button
                    onClick={() => onSelectArmy(null)}
                    className="w-full bg-[#EFE8D4] border border-[#1E1C1A] text-[#1E1C1A] py-2 text-xs font-serif font-bold hover:bg-[#E2D9C2] transition-colors uppercase tracking-wider shadow-[2px_2px_0_0_rgba(30,28,26,1)] rounded-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    {lang === 'zh' ? '解除部队选择' : 'Deselect Division'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : selectedProvince ? (
            <motion.div
              key={selectedProvince.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-[#FAF6EC] border-4 border-double border-[#1E1C1A] p-2 text-[#1E1C1A] shadow-[4px_4px_0_0_rgba(30,28,26,0.15)] relative overflow-hidden rounded-none">
                <div className="border border-[#1E1C1A]/10 p-3.5 space-y-4 relative bg-[#FAF6EC]">
                  <CardCorners />

                  {/* Beautiful Retro-Dossier Strategic Header / Pamphlet style */}
                  <div className="relative pb-2 mb-1 text-center font-serif">
                    <div className="absolute -top-1 left-2 pointer-events-none"><Rivet /></div>
                    <div className="absolute -top-1 right-2 pointer-events-none"><Rivet /></div>
                    <h2 className="text-3xl font-serif font-black italic text-[#1E1C1A] mt-2 mb-1.5 tracking-wide select-text uppercase">
                      {lang === 'zh' ? getProvinceName(selectedProvince, 'zh') : selectedProvince.name}
                    </h2>
                  </div>

                  {/* Retro Terrain Scenic Banner Visualizer */}
                  {(() => {
                    const terrainImgUrl = getTerrainImgPath(selectedProvince.terrain);
                    return (
                      <div className="relative border-t-2 border-b-2 border-black/80 py-0.5 my-2.5 overflow-hidden">
                        <div className="w-full relative overflow-hidden bg-[#FAF6EC] flex items-center justify-center" style={{ aspectRatio: '206.5/35' }}>
                          <img 
                            src={terrainImgUrl} 
                            alt={selectedProvince.terrain} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // Elegant blueprint fallback if image is loading / empty
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Toggle buttons for tabs */}
                  {selectedProvince.owner === state.currentPlayer && (
                    <div className="flex flex-col gap-2">
                      {provinceTab !== 'info' ? (
                        <button
                          onClick={() => setProvinceTab('info')}
                          className="w-full py-1.5 bg-[#EFE8D4] hover:bg-[#E2D9C2] border border-[#1E1C1A] text-xs font-serif font-black text-[#1E1C1A] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-none shadow-[1.5px_1.5px_0_0_rgba(30,28,26,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          ◀ {lang === 'zh' ? '返回行省战略情报面板' : 'Return to State Intelligence'}
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setProvinceTab('buildings')}
                            className="py-1.5 bg-[#EFE8D4] hover:bg-[#E2D9C2] border border-[#1E1C1A] text-[10px] font-serif font-black text-[#1E1C1A] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-none shadow-[2px_2px_0_0_rgba(30,28,26,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                          >
                            <Building size={11} className="text-[#A62626]" />
                            {lang === 'zh' ? '建筑控制中心' : 'Architecture'}
                          </button>
                          <button
                            onClick={() => setProvinceTab('mobilize')}
                            className="py-1.5 bg-[#EFE8D4] hover:bg-[#E2D9C2] border border-[#1E1C1A] text-[10px] font-serif font-black text-[#1E1C1A] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-none shadow-[2px_2px_0_0_rgba(30,28,26,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                          >
                            <Users size={11} className="text-[#2C5E3B]" />
                            {lang === 'zh' ? '师团动员集结' : 'Mobilization Office'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {provinceTab === 'info' ? (
                    <div className="space-y-4 pt-1 animate-fadeIn">
                      {/* Retro Dossier UI Custom Frames Grid (Row 1, Row 2, Row 3) */}
                      {(() => {
                        const provId = selectedProvince.id.toLowerCase();
                        const cultureObj = PROVINCE_CULTURES[provId];
                        const regionObj = PROVINCE_REGIONS[provId];
                        
                        const cultureName = cultureObj ? cultureObj.nameEn : 'Castilian';
                        const cultureColor = cultureObj?.color || '#B56C51';
                        
                        const regionName = regionObj ? regionObj.nameEn : 'Neutral';
                        const regionColor = regionObj?.color || '#1E1C1A';

                        const armiesInProvince = state.armies.filter(a => a.provinceId === selectedProvince.id);

                        // Map owner faction label
                        let factionLabel = 'NEUTRAL';
                        if (selectedProvince.owner === Faction.REPUBLICAN) factionLabel = 'REPUBLICAN';
                        if (selectedProvince.owner === Faction.NATIONALIST) factionLabel = 'NATIONALIST';
                        if (selectedProvince.owner === Faction.PORTUGAL) factionLabel = 'PORTUGAL';

                        return (
                          <div className="space-y-3.5 pt-1">
                            {/* Reference Layout: Vertical Stack of Culture & Regions on left with large CultureIconBox on right */}
                            <div className="flex gap-3 items-stretch">
                              {/* Left Column (Culture & Regions) */}
                              <div className="flex-1 flex flex-col gap-3.5 justify-between h-[98px]">
                                <CultureBox label={lang === 'zh' ? '文化归属' : 'Culture'} value={getCultureName(cultureName)} color={cultureColor} />
                                <RegionsBox label={lang === 'zh' ? '行政大区' : 'Regions'} value={getRegionName(regionName)} color={regionColor} />
                              </div>
                              
                              {/* Right Column (Seal Frame) */}
                              <div className="w-[101px] flex shrink-0">
                                <CultureIconBox color={cultureColor} provId={provId} cultureGroup={cultureObj?.group} />
                              </div>
                            </div>

                            {/* Fortification below with spacer to keep horizontal width aligned */}
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <FortificationBox label={lang === 'zh' ? '防御工事' : 'Fortification'} value={lang === 'zh' ? `${selectedProvince.fortification} 级` : `LVL ${selectedProvince.fortification}`} />
                              </div>
                              <div className="w-[101px] shrink-0" />
                            </div>

                            {/* Row 3: Control Status & Flag Icon, horizontally aligned */}
                            <div className="flex gap-3 items-stretch">
                              <div className="flex-1">
                                <ControlBox label={lang === 'zh' ? '当前控制' : 'Control'} value={getFactionName(selectedProvince.owner)} color={FACTION_COLORS[selectedProvince.owner]} />
                              </div>
                              <div className="w-[101px] shrink-0 flex items-stretch">
                                <FlagBox faction={selectedProvince.owner} />
                              </div>
                            </div>

                            {/* Row 4: Statistics & Value Badges */}
                            <div className="flex gap-1.5 items-center justify-between">
                              {/* Left: Industrial Weight & Sector Manpower capsules */}
                              <div className="flex flex-col gap-1.5 flex-1 pr-1">
                                <CapsuleStat label={lang === 'zh' ? '产业权重' : 'Industrial Weight'} value={selectedProvince.industry} />
                                <CapsuleStat label={lang === 'zh' ? '行省后备兵' : 'Sector Manpower'} value={selectedProvince.manpower} />
                              </div>

                              {/* Right: Garrison Army Count & Strategic Value stars */}
                              <div className="flex gap-1.5 items-center shrink-0">
                                <GarrisonBadge count={armiesInProvince.length} />
                                <StrategicValueBadge value={selectedProvince.strategicValue} />
                              </div>
                            </div>

                            {/* Row 5: Supply Limit & Combat Width */}
                            {(() => {
                              const limit = getSupplyLimit(selectedProvince);
                              const width = getCombatWidth(selectedProvince.terrain as any || 'plains');
                              
                              const currManpower = armiesInProvince.reduce((sum, a) => sum + a.manpower, 0);
                              const excess = currManpower > limit;
                              
                              return (
                                <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#1E1C1A]/10 mt-1">
                                  <div className="flex gap-1.5 items-center">
                                    <ProvinceParamCapsule 
                                      label={lang === 'zh' ? '补给上限' : 'Supply Limit'} 
                                      value={`${currManpower > 0 ? (currManpower / 1000).toFixed(1) + 'k/' : ''}${(limit / 1000).toFixed(0)}k`} 
                                    />
                                    <ProvinceParamCapsule 
                                      label={lang === 'zh' ? '战场战宽' : 'Combat Width'} 
                                      value={(width / 1000).toFixed(0) + 'k'} 
                                    />
                                  </div>
                                  {excess && (
                                    <div className="text-[7.5px] text-[#A62626] font-sans font-bold uppercase tracking-wider animate-pulse flex items-center gap-1 bg-[#A62626]/10 px-1 py-1 border border-[#A62626]/20 mt-0.5">
                                      <Flame size={10} className="text-[#A62626]" />
                                      {lang === 'zh' ? '⚠️ 补给过载：部队将遭严重损耗惩罚及士气崩溃' : '⚠️ OUT OF SUPPLY: SEVERE TROOP ATTRITION & MORALE COLLAPSE'}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}

                      {/* Province Garrison section showing stationed divisions */}
                      {(() => {
                        const armiesInProvince = state.armies.filter(a => a.provinceId === selectedProvince.id);
                        if (armiesInProvince.length === 0) return null;

                        return (
                          <div className="bg-[#FAF6EC] p-3 border border-[#1E1C1A]/25 space-y-2 rounded-none relative">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1C1A] font-serif border-b border-[#1E1C1A]/15 pb-1.5 flex justify-between items-center bg-transparent">
                              <span>{lang === 'zh' ? `驻防防线力量 (${armiesInProvince.length})` : `Garrison Forces (${armiesInProvince.length})`}</span>
                            </h3>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#1E1C1A]/45 pt-1">
                              {armiesInProvince.map(a => (
                                <button
                                  key={a.id}
                                  onClick={() => onSelectArmy(a.id)}
                                  className="w-full flex justify-between items-center p-2 bg-[#FAF6EC] hover:bg-[#FAF6EC] border border-[#1E1C1A]/15 rounded-none text-[10px] font-serif transition-colors text-left cursor-pointer"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Swords size={10} className={a.faction === state.currentPlayer ? 'text-[#2C5E3B]' : 'text-[#8C3A35]'} />
                                    <span className="font-bold text-[#1E1C1A]">{lang === 'zh' ? `${a.id.slice(-4).toUpperCase()} 师` : `Div. ${a.id.slice(-4).toUpperCase()}`}</span>
                                    <span className="text-[8px] px-1 rounded-none border border-black/10 font-serif font-bold uppercase text-[#1E1C1A]" style={{ color: FACTION_COLORS[a.faction] }}>
                                      {getFactionName(a.faction)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[#1E1C1A]/70 font-bold font-serif">
                                    <span>{a.manpower.toLocaleString()} {lang === 'zh' ? '士兵' : 'Soldiers'}</span>
                                    <span className="text-[#A62626]">★{a.morale}%</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}


                    </div>
                  ) : provinceTab === 'mobilize' ? (
                    <div className="space-y-4 pt-1 animate-fadeIn">
                      {/* Mobilization Section with Recruiting Office checking block */}
                      {selectedProvince.owner === state.currentPlayer ? (
                        <div className="bg-[#FAF6EC] p-3 border border-[#1E1C1A]/25 space-y-3 relative shadow-sm rounded-none">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1C1A] font-serif border-b border-[#1E1C1A]/20 pb-1.5 flex justify-between items-center bg-transparent">
                            <span>{lang === 'zh' ? '动员集结新师团' : 'Mobilize New Division'}</span>
                            <span className="text-[8px] font-serif px-1.5 py-0.5 bg-[#FAF6EC] border border-[#1E1C1A] text-[#A62626] font-bold rounded-none uppercase tracking-wide">
                              {lang === 'zh' ? '大本营编制器' : 'EU4 COMPOSER'}
                            </span>
                          </h3>
                          
                          {hasRecruitingOffice ? (
                            <>
                              {/* Selectors and adjusters */}
                              <div className="space-y-3">
                                <MobilizeAdjuster 
                                  label={lang === 'zh' ? '步兵' : 'Infantry'} 
                                  value={recruitInf} 
                                  onChange={setRecruitInf} 
                                  color="text-[#2C5E3B]"
                                  icon={<Users size={12} />}
                                  lang={lang}
                                />
                                <MobilizeAdjuster 
                                  label={lang === 'zh' ? '炮兵' : 'Artillery'} 
                                  value={recruitArt} 
                                  onChange={setRecruitArt} 
                                  color="text-[#AC6428]"
                                  icon={<Crosshair size={12} />}
                                  lang={lang}
                                />
                                <MobilizeAdjuster 
                                  label={lang === 'zh' ? '坦克' : 'Tanks'} 
                                  value={recruitTnk} 
                                  onChange={setRecruitTnk} 
                                  color="text-[#3B4C7C]"
                                  icon={<Flame size={12} />}
                                  lang={lang}
                                  step={1}
                                  min={1}
                                  max={500}
                                  unit={lang === 'zh' ? '辆' : 'Tanks'}
                                />
                              </div>

                              {/* Operational Requirements and resources check */}
                              <div className="pt-2 border-t border-dashed border-[#1E1C1A]/20 font-serif text-[10px] space-y-1 bg-[#FAF6EC] p-2 rounded-none">
                                <span className="text-[9px] font-bold text-[#1E1C1A]/70 block uppercase tracking-wide">
                                  {lang === 'zh' ? '动员预算与资源开销：' : 'Operational Resource Cost Bill:'}
                                </span>
                                <div className="flex justify-between border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span className={!(playerRes?.manpower && playerRes.manpower >= reqManpower) ? 'text-[#A62626] font-bold' : 'text-[#DA944E]'}>
                                    {lang === 'zh' ? '动员后备兵：' : 'Manpower Recruits:'}
                                  </span>
                                  <span className="font-bold">{reqManpower.toLocaleString()} / {(playerRes?.manpower || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span className={!(playerRes?.supplies && playerRes.supplies >= reqSupplies) ? 'text-[#A62626] font-bold' : 'text-[#879D3E]'}>
                                    {lang === 'zh' ? '军事补给品：' : 'Material Supplies:'}
                                  </span>
                                  <span className="font-bold">{reqSupplies} / {playerRes?.supplies || 0}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-[#1E1C1A]/10 pb-0.5">
                                  <span className={!(playerRes?.industrialCapacity && playerRes.industrialCapacity >= reqIndustry) ? 'text-[#A62626] font-bold' : 'text-[#6D8A4E]'}>
                                    {lang === 'zh' ? '工业分配额：' : 'Industrial Capacity:'}
                                  </span>
                                  <span className="font-bold">{reqIndustry} / {playerRes?.industrialCapacity || 0}</span>
                                </div>
                                <div className="flex justify-between pb-0.5">
                                  <span className={!(playerRes?.tankReserve && playerRes.tankReserve >= reqTankReserve) ? 'text-[#A62626] font-bold' : 'text-[#7D5EA3]'}>
                                    {lang === 'zh' ? '坦克储备额：' : 'Tank Reserve:'}
                                  </span>
                                  <span className="font-bold">{reqTankReserve} / {playerRes?.tankReserve || 0}</span>
                                </div>
                              </div>

                              {/* Mobilize trigger button */}
                              <button
                                onClick={handleMobilize}
                                disabled={!canMobilize}
                                className="w-full py-2.5 bg-[#A62626] hover:bg-[#C23131] disabled:bg-[#FAF6EC] disabled:text-[#1E1C1A]/40 disabled:border-[#1E1C1A]/20 disabled:cursor-not-allowed border border-[#1E1C1A] font-serif italic text-[#FAF6EC] font-bold uppercase tracking-wider text-xs rounded-none transition-all shadow-[2px_2px_0_0_rgba(30,28,26,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                              >
                                {lang === 'zh' ? '下达征召动员令' : 'Mobilize Force'}
                              </button>
                            </>
                          ) : (
                            <div className="p-3.5 bg-[#8C3A35]/5 border border-[#8C3A35]/30 text-[10px] font-serif text-[#8C3A35] leading-relaxed space-y-2.5">
                              <p className="font-black uppercase tracking-widest text-[#8C3A35] flex items-center gap-1.5 leading-none">
                                <Info size={11} /> {lang === 'zh' ? '缺少后备征兵动员大厅' : 'RECRUITMENT OFFICE REQUIRED'}
                              </p>
                              <p className="text-[9.5px]">
                                {lang === 'zh' 
                                  ? '⚠️ 对不起，当前大区缺乏「后备征兵办公室」(Oficina de Reclutamiento)。您需要首先进入建筑控制中心，在这里规划并建成 Level 1 的征兵办设施，方能进行作战编制的动员与招募。'
                                  : '⚠️ Tactical warning: This sector currently lacks a Recruitment Office. You must first construct a Level 1 Recruiting Office in the Province Architecture Center to enable the mobilization and recruitment of division forces.'}
                              </p>
                              <button
                                onClick={() => setProvinceTab('buildings')}
                                className="w-full bg-[#8C3A35] text-[#FAF6EC] py-1.5 text-[8.5px] font-black uppercase tracking-widest hover:bg-[#a6403b] transition-colors rounded-none cursor-pointer border border-[#1E1C1A] shadow-[1.5px_1.5px_0_0_rgba(30,28,26,1)]"
                              >
                                {lang === 'zh' ? '进入建筑控制中心规划建设' : 'Open Architecture Center'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-[#8C3A35]/15 rounded-none border border-[#8C3A35]/30 text-[10px] font-serif text-[#8C3A35] italic text-center">
                          {lang === 'zh' ? '⚠️ 无法在非我方控制的中立或敌占行省进行军事动员集结。' : '⚠️ Cannot spawn military segments in province owned by neutral or enemy command structures.'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1 animate-fadeIn">
                      {/* HOI4 / EU4 Style Building Slots Panel */}
                      {(() => {
                        const b = selectedProvince.buildings || { barracks: 0, fortress: 0, recruitingOffice: 0, ammoFactory: 0 };
                        const builtTypes = (Object.keys(b) as Array<keyof typeof b>).filter(key => b[key] > 0);
                        const maxBuildingSlots = Math.max(builtTypes.length, Math.min(4, Math.max(1, Math.floor((selectedProvince.industry + selectedProvince.strategicValue * 5) / 15))));
                        
                        const slots = Array.from({ length: maxBuildingSlots }).map((_, idx) => {
                          if (idx < builtTypes.length) {
                            return { occupied: true, type: builtTypes[idx], level: b[builtTypes[idx]] };
                          }
                          return { occupied: false };
                        });

                        const slotsUsed = builtTypes.length;

                        // Unified definitions of the four buildings
                        const buildingDefinitions = [
                          {
                            id: 'barracks',
                            name: lang === 'zh' ? '兵营' : 'Barracks',
                            max: 1,
                            desc: lang === 'zh' ? '防线力量整编：只有预先设置兵营的行省才能在最初游戏剧本开启中分配与自动部署守土驻防师（Garrison Forces）。' : 'Only provinces structured with barracks can initially allocate starting garrison battalions on state setup.',
                            restrict: lang === 'zh' ? '无特殊建筑条件限制' : 'None',
                            cost: { supplies: 120, ic: 80, manpower: 0 },
                            checkRestriction: () => true,
                            IconComponent: Building,
                            designBg: 'bg-[#EFE8D4]'
                          },
                          {
                            id: 'fortress',
                            name: lang === 'zh' ? '要塞防线' : 'Fortress Lines',
                            max: 3,
                            desc: lang === 'zh' ? '阵地工事防御：提供该行省防御等级 +1/+2/+3 级，且驻防军队遭受突击时核心战斗力量系数提高 ×1.10/×1.20/×1.30 倍。' : 'Fortification lines +1/+2/+3, multiplying defending division active power output by x1.10 / x1.20 / x1.30.',
                            restrict: lang === 'zh' ? '无特殊限制（最高可建造与升级至 3 级）' : 'None. Maximum upgrade level 3',
                            cost: (lvl: number) => {
                              if (lvl === 1) return { supplies: 150, ic: 100, manpower: 0 };
                              if (lvl === 2) return { supplies: 250, ic: 180, manpower: 0 };
                              return { supplies: 400, ic: 280, manpower: 0 };
                            },
                            checkRestriction: () => true,
                            IconComponent: Shield,
                            designBg: 'bg-[#FAF6EC]/90'
                          },
                          {
                            id: 'recruitingOffice',
                            name: lang === 'zh' ? '后备征兵动员办' : 'Recruitment Office',
                            max: 1,
                            desc: lang === 'zh' ? '兵员招募集结处：进行作战力量新编的必须基地。拥有征兵所的行省才可以随时开展军事力量的新编动员。' : 'Central enlistment office. Must have a recruitment office to mobilize and train brand-new division regiments in this province.',
                            restrict: lang === 'zh' ? '仅限大本营评估后「行省战略价值」 (Strategic Value) ≥ 4 的行省建造' : 'Only erectable in central sectors with strategic value of score 4 or higher',
                            cost: { supplies: 100, ic: 60, manpower: 30 },
                            checkRestriction: () => selectedProvince.strategicValue >= 4,
                            IconComponent: Users,
                            designBg: 'bg-[#DAE2DC]'
                          },
                          {
                            id: 'ammoFactory',
                            name: lang === 'zh' ? '前线军火制造厂' : 'Munitions Factory',
                            max: 2,
                            desc: lang === 'zh' ? '前线重工制造车间：每回合开始时会为您的政权产出高额的额外军事补给品：1 级产生 +10 Supplies/turn，2 级产生 +20 Supplies/turn。' : 'Heavy munitions factory. Produces extra strategic supplies for your command structure every turn: +10 supplies at Lvl 1; +20 supplies at Lvl 2.',
                            restrict: lang === 'zh' ? '由于重化工配套，仅能在「城市」 (Urban) 地貌的工业化都市中兴建' : 'Can only be manufactured in highly populated urban districts',
                            cost: (lvl: number) => {
                              if (lvl === 1) return { supplies: 200, ic: 150, manpower: 0 };
                              return { supplies: 300, ic: 220, manpower: 0 };
                            },
                            checkRestriction: () => selectedProvince.terrain === 'urban',
                            IconComponent: Wrench,
                            designBg: 'bg-[#D6E0EC]'
                          }
                        ];

                        const slotLimitReached = builtTypes.length >= maxBuildingSlots;

                        // Click handlers for interactive strategy slots
                        const handleSlotClick = (slotIdx: number, slot: any) => {
                          if (slot.occupied && slot.type) {
                            if (selectedSlotType === slot.type) {
                              setSelectedSlotType(null);
                            } else {
                              setSelectedSlotType(slot.type);
                              setActiveEmptySlotIdx(null);
                              setHoveredBuildingId(null);
                            }
                          } else {
                            if (activeEmptySlotIdx === slotIdx) {
                              setActiveEmptySlotIdx(null);
                              setHoveredBuildingId(null);
                            } else {
                              setActiveEmptySlotIdx(slotIdx);
                              setSelectedSlotType(null);
                              setHoveredBuildingId(null);
                            }
                          }
                        };

                        const currentEmptySlotSelected = activeEmptySlotIdx !== null;
                        const hoveredBuilding = buildingDefinitions.find(item => item.id === hoveredBuildingId);
                        const activeBuiltBuilding = buildingDefinitions.find(item => item.id === selectedSlotType);

                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-[#1E1C1A]/5 p-2 border border-[#1E1C1A]/15 rounded-none font-serif text-[10.5px]">
                              <span className="font-black text-[#1E1C1A]/85 uppercase tracking-wider flex items-center gap-1.5">
                                <Building size={12} className="text-[#A62626]" />
                                {lang === 'zh' ? `建筑槽位分配 (${slotsUsed}/${maxBuildingSlots})` : `PROVINCE SLOTS ALLOCATION (${slotsUsed}/${maxBuildingSlots})`}
                              </span>
                              
                              {/* HOI4 style square slot lights */}
                              <div className="flex gap-1">
                                {Array.from({ length: maxBuildingSlots }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-3 h-3 border border-[#1E1C1A] transition-all duration-300 ${
                                      idx < slotsUsed 
                                        ? 'bg-[#A62626] shadow-[inset_1px_1px_0_rgba(255,255,255,0.25)]' 
                                        : 'bg-[#FAF6EC] border-dashed border-[#1E1C1A]/40'
                                    }`}
                                    title={idx < slotsUsed ? 'Occupied' : 'Available'}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* 2x2 Grid representing tactile slot buttons */}
                            <div className="grid grid-cols-2 gap-2">
                              {slots.map((slot, idx) => {
                                if (slot.occupied && slot.type) {
                                  const type = slot.type;
                                  const level = slot.level;
                                  const def = buildingDefinitions.find(item => item.id === type) || buildingDefinitions[0];
                                  const isSelected = selectedSlotType === type;

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => handleSlotClick(idx, slot)}
                                      className={`p-2 border rounded-none transition-all duration-200 text-left relative flex flex-col justify-between h-[68px] cursor-pointer group ${
                                        isSelected 
                                          ? 'border-[#A62626] bg-[#FAF6EC] shadow-[inset_0_0_8px_rgba(166,38,38,0.15)] ring-1 ring-[#A62626]/40' 
                                          : 'border-[#1E1C1A]/20 hover:border-[#1E1C1A]/45 hover:shadow-sm ' + def.designBg
                                      }`}
                                    >
                                      {/* Slot Header */}
                                      <div className="flex justify-between items-start gap-1 w-full">
                                        <div className="flex flex-col">
                                          <span className="text-[9.5px] font-black font-serif text-[#1E1C1A] leading-tight block truncate max-w-[90px]">
                                            {def.name}
                                          </span>
                                          <span className="text-[7.5px] font-sans text-black/50 uppercase tracking-widest leading-none mt-0.5">
                                            {type}
                                          </span>
                                        </div>
                                        <def.IconComponent size={13} className={isSelected ? 'text-[#A62626]' : 'text-black/50 group-hover:text-black transition-colors'} />
                                      </div>

                                      {/* Level Indicator circles */}
                                      <div className="flex items-center justify-between w-full mt-1 border-t border-dashed border-[#1E1C1A]/10 pt-1">
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: def.max }).map((_, lIdx) => (
                                            <span 
                                              key={lIdx} 
                                              className={`w-1.5 h-1.5 rounded-full border border-black/30 ${
                                                lIdx < level ? 'bg-[#2C5E3B]' : 'bg-black/5'
                                              }`} 
                                            />
                                          ))}
                                        </div>
                                        <span className="text-[8px] font-mono text-[#2C5E3B] font-black bg-white px-1 leading-none border border-black/10">
                                          LV {level}/{def.max}
                                        </span>
                                      </div>
                                      
                                      {/* Active Highlight Marker */}
                                      {isSelected && (
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-[#A62626]" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                                      )}
                                    </button>
                                  );
                                } else {
                                  const isSelected = activeEmptySlotIdx === idx;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => handleSlotClick(idx, slot)}
                                      className={`p-2.5 border text-left flex flex-col justify-center items-center h-[68px] cursor-pointer transition-all rounded-none relative group ${
                                        isSelected 
                                          ? 'border-[#A62626] bg-[#FAF6EC] shadow-[inset_0_0_8px_rgba(166,38,38,0.1)] ring-1 ring-[#A62626]/20'
                                          : 'border-dashed border-[#1E1C1A]/15 bg-[#FAF6EC]/50 hover:border-[#1E1C1A]/40'
                                      }`}
                                    >
                                      {/* Pattern overlay representing blueprints plotting paper */}
                                      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,28,26,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(30,28,26,0.03)_1px,transparent_1px)] bg-[size:5px_5px] opacity-70 pointer-events-none group-hover:opacity-100 transition-opacity" />
                                      
                                      <Plus size={14} className={`transition-all mb-1 z-10 ${isSelected ? 'text-[#A62626] scale-110' : 'text-[#1E1C1A]/40 group-hover:text-[#A62626] group-hover:scale-110'}`} />
                                      <span className={`text-[8.5px] font-serif font-black uppercase tracking-widest leading-none z-10 ${isSelected ? 'text-[#A62626]' : 'text-[#1E1C1A]/45 group-hover:text-[#1E1C1A]'}`}>
                                        {lang === 'zh' ? (isSelected ? '正规划建设' : '建设新设施 [空]') : (isSelected ? 'PLANNING ARCH' : 'EMPTY SLOT [PLAN]')}
                                      </span>
                                      <span className="text-[7px] text-[#1E1C1A]/35 tracking-tight font-sans z-10 block mt-0.5 leading-none">
                                        {lang === 'zh' ? (isSelected ? '点击关闭蓝图选项' : '点击选择可用蓝图') : (isSelected ? 'Click to close choices' : 'Click to show choices')}
                                      </span>
                                    </button>
                                  );
                                }
                              })}
                            </div>

                            {/* Active Slot Workspace */}
                            <div className="mt-4 space-y-3 relative">
                              {/* 1. VACANT SLOT FLOW: SHOW BLUEPRINT DROPDOWN ON SELECT */}
                              {currentEmptySlotSelected && (
                                <div className="space-y-3 relative">
                                  {/* Blueprint select catalog drop down select */}
                                  <div className="bg-[#FAF6EC] border border-[#1E1C1A]/20 p-2.5 rounded-none relative">
                                    <div className="text-[9.5px] uppercase font-black tracking-wider text-[#A62626] font-serif border-b border-dashed border-[#1E1C1A]/15 pb-1 flex justify-between items-center mb-2">
                                      <span className="flex items-center gap-1">
                                        <ScrollText size={11.5} className="text-[#A62626]" />
                                        {lang === 'zh' ? `选择要兴建的行省地利设施` : `CONSTRUCTION BLUEPRINTS`}
                                      </span>
                                    </div>

                                    {(() => {
                                      // Get only buildings that are brand new (lvl = 0)
                                      const availableDesigns = buildingDefinitions.filter(item => b[item.id as keyof typeof b] === 0);

                                      if (availableDesigns.length === 0) {
                                        return (
                                          <div className="text-center py-4 text-[9px] text-[#EFE8D4] font-serif italic">
                                            {lang === 'zh' ? '无可用新型地利项目开工' : 'No new facility types available to build.'}
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="grid grid-cols-2 gap-1.5 relative">
                                          {availableDesigns.map(item => {
                                            const IconComponent = item.IconComponent;
                                            const isHovered = hoveredBuildingId === item.id;

                                            // Calculate build eligibility
                                            const cost = typeof item.cost === 'function' ? item.cost(1) : item.cost;
                                            const meetsRestriction = item.checkRestriction();
                                            const stateRes = state.resources[state.currentPlayer];
                                            const hasResource = stateRes 
                                              ? (stateRes.supplies >= cost.supplies && 
                                                 stateRes.industrialCapacity >= cost.ic && 
                                                 stateRes.manpower >= cost.manpower)
                                              : false;

                                            const canBuild = meetsRestriction && hasResource && !slotLimitReached;

                                            return (
                                              <button
                                                key={item.id}
                                                onMouseEnter={() => setHoveredBuildingId(item.id)}
                                                onMouseLeave={() => setHoveredBuildingId(null)}
                                                onClick={() => {
                                                  if (canBuild) {
                                                    onBuildBuilding(selectedProvince.id, item.id as any);
                                                    setActiveEmptySlotIdx(null); // retract after building
                                                    setHoveredBuildingId(null);
                                                  }
                                                }}
                                                className={`p-2 border text-left flex items-center justify-between transition-all duration-200 rounded-none group h-12 relative ${
                                                  !canBuild 
                                                    ? 'bg-[#FAF6EC]/40 border-[#1E1C1A]/10 opacity-60 cursor-not-allowed'
                                                    : isHovered
                                                      ? 'bg-[#A62626] border-[#1E1C1A] text-[#FAF6EC] shadow-sm cursor-pointer'
                                                      : 'bg-[#FAF6EC] hover:bg-[#EFE8D4] border-[#1E1C1A]/15 text-[#1E1C1A] cursor-pointer'
                                                }`}
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <IconComponent size={12} className={isHovered ? 'text-[#FAF6EC]' : 'text-[#A62626]'} />
                                                  <div className="flex flex-col min-w-0">
                                                    <span className="text-[9px] font-black font-serif leading-none truncate block">
                                                      {item.name}
                                                    </span>
                                                    <span className={`text-[6.5px] font-mono leading-none mt-0.5 truncate block ${isHovered ? 'text-[#FAF6EC]/60' : 'text-black/40'}`}>
                                                      {item.id}
                                                    </span>
                                                  </div>
                                                </div>
                                                <Plus size={10} className={isHovered ? 'text-[#FAF6EC]' : 'text-black/20 group-hover:text-[#A62626]'} />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}

                                    {/* Floating building information tooltip popup (absolutely positioned above the dropdown list) */}
                                    {hoveredBuilding && (() => {
                                      const item = hoveredBuilding;
                                      const cost = typeof item.cost === 'function' ? item.cost(1) : item.cost;
                                      const meetsRestriction = item.checkRestriction();
                                      const stateRes = state.resources[state.currentPlayer];
                                      const hasResource = stateRes 
                                        ? (stateRes.supplies >= cost.supplies && 
                                           stateRes.industrialCapacity >= cost.ic && 
                                           stateRes.manpower >= cost.manpower)
                                        : false;

                                      const canBuild = meetsRestriction && hasResource && !slotLimitReached;

                                      return (
                                        <div className="absolute right-0 bottom-[105%] left-0 bg-[#FAF6EC] border-2 border-[#A62626] p-3 rounded-none shadow-2xl z-[100] animate-fadeIn pointer-events-none">
                                          {/* Vintage corners decoration inside tooltip */}
                                          <div className="absolute inset-[1px] border border-[#A62626]/20" />
                                          <div className="absolute top-[1.5px] left-[1.5px] w-[5px] h-[5px] border-t border-l border-[#A62626]" />
                                          <div className="absolute top-[1.5px] right-[1.5px] w-[5px] h-[5px] border-t border-r border-[#A62626]" />
                                          <div className="absolute bottom-[1.5px] left-[1.5px] w-[5px] h-[5px] border-b border-l border-[#A62626]" />
                                          <div className="absolute bottom-[1.5px] right-[1.5px] w-[5px] h-[5px] border-b border-r border-[#A62626]" />

                                          <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                              <div className="p-1 border border-[#A62626]/35 bg-[#A62626]/5 text-[#A62626] shrink-0">
                                                <item.IconComponent size={12} />
                                              </div>
                                              <div>
                                                <h4 className="text-[10px] font-black font-serif text-[#1E1C1A] leading-tight">
                                                  {item.name}
                                                </h4>
                                                <span className="text-[7px] font-sans text-black/50 uppercase tracking-widest leading-none block">
                                                  {item.id} - {lang === 'zh' ? '可建等级 1' : 'LEVEL 1 CONSTRUCTION'}
                                                </span>
                                              </div>
                                            </div>

                                            <p className="text-[9px] text-[#1E1C1A]/80 leading-relaxed font-sans font-medium">
                                              {item.desc}
                                            </p>

                                            <div className="text-[8px] font-serif border-t border-dashed border-[#1E1C1A]/10 pt-1 flex items-center justify-between">
                                              <span>{lang === 'zh' ? '要求限制条件：' : 'Requirements:'}</span>
                                              <span className={`font-black ${meetsRestriction ? 'text-[#2C5E3B]' : 'text-[#8C3A35] underline'}`}>
                                                {item.restrict}
                                              </span>
                                            </div>

                                            {slotLimitReached && (
                                              <div className="text-[8px] font-sans text-[#8C3A35] font-black uppercase tracking-wider bg-[#8C3A35]/5 p-0.5 border border-dashed border-[#8C3A35]/20 leading-none text-center">
                                                ⚠️ {lang === 'zh' ? '行省可用插槽位已满' : 'PROVINCE SLOTS ARE FULL'}
                                              </div>
                                            )}

                                            <div className="bg-[#FAF6EC]/80 border border-[#1E1C1A]/15 p-1 px-1.5 rounded-none font-serif text-[8.5px] text-[#1E1C1A]/85 flex gap-2 justify-between">
                                              <span className={stateRes && stateRes.supplies >= cost.supplies ? 'text-[#1E1C1A]' : 'text-[#8C3A35] font-black underline'}>
                                                🧰 {lang === 'zh' ? `补给: ${cost.supplies}` : `Supplies: ${cost.supplies}`}
                                              </span>
                                              <span className={stateRes && stateRes.industrialCapacity >= cost.ic ? 'text-[#1E1C1A]' : 'text-[#8C3A35] font-black underline'}>
                                                ⚙️ {lang === 'zh' ? `工业: ${cost.ic}` : `IC: ${cost.ic}`}
                                              </span>
                                              {cost.manpower > 0 && (
                                                <span className={stateRes && stateRes.manpower >= cost.manpower ? 'text-[#1E1C1A]' : 'text-[#8C3A35] font-black underline'}>
                                                  🎖️ {lang === 'zh' ? `动员力: ${cost.manpower}` : `Manpower: ${cost.manpower}`}
                                                </span>
                                              )}
                                            </div>

                                            <div className="text-[7.5px] font-sans text-center text-black/40 italic leading-none pt-0.5">
                                              {canBuild 
                                                ? (lang === 'zh' ? '✓ 可建设：点击列表中建筑进行动工建置' : '✓ Click item in dropdown to start building')
                                                : (lang === 'zh' ? '✗ 无法建造：未达成所需条件或资源额度不足' : '✗ Cannot build: conditions or resources insufficient')}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

                              {/* 2. OCCUPIED SLOT FLOW: SHOW UPGRADE DOSSIER */}
                              {selectedSlotType && activeBuiltBuilding && (() => {
                                const item = activeBuiltBuilding;
                                const currentLevel = b[item.id as keyof typeof b] || 0;
                                const isMaxed = currentLevel >= item.max;
                                const nextLvl = currentLevel + 1;
                                const cost = typeof item.cost === 'function' ? item.cost(nextLvl) : item.cost;
                                const meetsRestriction = item.checkRestriction();
                                
                                const stateRes = state.resources[state.currentPlayer];
                                const hasResource = stateRes 
                                  ? (stateRes.supplies >= cost.supplies && 
                                     stateRes.industrialCapacity >= cost.ic && 
                                     stateRes.manpower >= cost.manpower)
                                  : false;

                                const canBuild = !isMaxed && meetsRestriction && hasResource;

                                return (
                                  <div className="bg-[#FAF6EC] border border-[#2C5E3B] p-3 relative rounded-none shadow-md animate-fadeIn">
                                    {/* Decorative double borders for prestige projects */}
                                    <div className="absolute inset-[1px] border border-[#2C5E3B]/20 pointer-events-none" />
                                    <div className="absolute top-[1.5px] left-[1.5px] w-[5px] h-[5px] border-t border-l border-[#2C5E3B] pointer-events-none" />
                                    <div className="absolute top-[1.5px] right-[1.5px] w-[5px] h-[5px] border-t border-r border-[#2C5E3B] pointer-events-none" />
                                    <div className="absolute bottom-[1.5px] left-[1.5px] w-[5px] h-[5px] border-b border-l border-[#2C5E3B] pointer-events-none" />
                                    <div className="absolute bottom-[1.5px] right-[1.5px] w-[5px] h-[5px] border-b border-r border-[#2C5E3B] pointer-events-none" />

                                    {/* Level Tag indicator */}
                                    <span className="absolute top-2.5 right-2.5 text-[8px] font-mono font-black tracking-widest text-[#2C5E3B] bg-white border border-[#2C5E3B]/40 px-1 leading-none">
                                      {lang === 'zh' ? `已建: ${currentLevel}级 / 最高${item.max}级` : `ACTIVE: LVL ${currentLevel}/${item.max}`}
                                    </span>

                                    <div className="space-y-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 border border-[#2C5E3B]/30 bg-[#2C5E3B]/5 text-[#2C5E3B] shrink-0">
                                          <item.IconComponent size={14} />
                                        </div>
                                        <div>
                                          <h4 className="text-[10.5px] font-black font-serif text-[#1E1C1A] leading-tight">
                                            {item.name}
                                          </h4>
                                          <span className="text-[7.5px] font-sans text-black/44 uppercase tracking-widest leading-none">
                                            {item.id} - {lang === 'zh' ? '规划升级中' : 'ENGINEERING STATUS'}
                                          </span>
                                        </div>
                                      </div>

                                      <p className="text-[9.2px] text-[#1E1C1A]/75 leading-relaxed font-sans font-medium">
                                        {item.desc}
                                      </p>

                                      {!isMaxed ? (
                                        <>
                                          {/* Upgrade constraints */}
                                          <div className="text-[8.5px] font-serif border-t border-dashed border-[#1E1C1A]/10 pt-2 flex items-center justify-between">
                                            <span>{lang === 'zh' ? '升级限制条件：' : 'Upgrade requirements:'}</span>
                                            <span className={`font-black ${meetsRestriction ? 'text-[#2C5E3B]' : 'text-[#8C3A35] underline'}`}>
                                              {item.restrict}
                                            </span>
                                          </div>

                                          {/* Resources Cost Panel */}
                                          <div className="bg-[#FAF6EC]/80 border border-[#1E1C1A]/15 p-1 px-1.5 rounded-none font-serif text-[8.5px] text-[#1E1C1A]/85 flex gap-2 justify-between">
                                            <span className={stateRes && stateRes.supplies >= cost.supplies ? 'text-[#1E1C1A]' : 'text-[#8C3A35] font-black underline'}>
                                              {lang === 'zh' ? `🧰 补给需求: ${cost.supplies}` : `🧰 Supplies: ${cost.supplies}`}
                                            </span>
                                            <span className={stateRes && stateRes.industrialCapacity >= cost.ic ? 'text-[#1E1C1A]' : 'text-[#8C3A35] font-black underline'}>
                                              {lang === 'zh' ? `⚙️ 工业需求: ${cost.ic}` : `⚙️ IC: ${cost.ic}`}
                                            </span>
                                            {cost.manpower > 0 && (
                                              <span className={stateRes && stateRes.manpower >= cost.manpower ? 'text-[#1E1C1A]' : 'text-[#8C3A35] font-black underline'}>
                                                {lang === 'zh' ? `🎖️ 动员力: ${cost.manpower}` : `🎖️ Manpower: ${cost.manpower}`}
                                              </span>
                                            )}
                                          </div>

                                          <div className="pt-0.5">
                                            <button
                                              onClick={() => onBuildBuilding(selectedProvince.id, item.id as any)}
                                              disabled={!canBuild}
                                              className={`w-full py-1.5 px-3 border text-[8.5px] font-serif font-black uppercase tracking-widest transition-all rounded-none cursor-pointer ${
                                                canBuild 
                                                  ? "bg-[#2C5E3B] text-white border-black shadow-[1.5px_1.5px_0_0_rgba(30,28,26,1)] hover:bg-[#3d7a4f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none" 
                                                  : "bg-[#EFE8D4] border-[#1E1C1A]/15 text-[#1E1C1A]/35 cursor-not-allowed"
                                              }`}
                                            >
                                              {lang === 'zh' ? `批准升级行省工程线 (Lv ${currentLevel} → Lv ${nextLvl})` : `APPROVE ENGINEERING EXPANSION (LVL ${currentLevel} → ${nextLvl})`}
                                            </button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 p-2 text-center text-[#2C5E3B] font-serif font-bold text-[9px] uppercase tracking-wider">
                                          ✓ {lang === 'zh' ? '该特区工程已落成至最高等级（无法再作升级）' : 'State infrastructure reaches highest maximum.'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* 3. DEFAULT PLACEHOLDER: NO SELECTION OR ACTIVE PROCESS */}
                              {!selectedSlotType && activeEmptySlotIdx === null && (
                                <div className="text-center py-7 border border-dashed border-[#1E1C1A]/20 bg-[#FAF6EC]/50 flex flex-col items-center justify-center p-4">
                                  <Building size={20} className="mb-2 opacity-50 text-[#A62626]" />
                                  <span className="text-[10px] font-serif font-bold text-[#1E1C1A] uppercase tracking-widest">
                                    {lang === 'zh' ? '行省军事工程总控制台' : 'MILITARY INFRASTRUCTURE WORKSPACE'}
                                  </span>
                                  <p className="text-[8px] font-sans text-black/50 tracking-normal mt-1 max-w-[210px] leading-relaxed">
                                    {lang === 'zh' ? '💡 请选择点击上方任意建筑插槽：点选「空插槽」来展示可用蓝图展开地利新设；点选「已建设设施」可以聚焦审批对其等级的进一步扩建。' : '💡 Select any building slot above. Choose a vacant slot to plan fresh infrastructure, or select an occupied slot to construct a level upgrade.'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <button
                    onClick={() => onSelectProvince(null)}
                    className="w-full bg-[#EFE8D4] border border-[#1E1C1A] text-[#1E1C1A] py-2 text-xs font-serif font-bold hover:bg-[#E2D9C2] transition-colors uppercase tracking-wider shadow-[2px_2px_0_0_rgba(30,28,26,1)] rounded-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    {lang === 'zh' ? '关闭行省窗口' : 'Close Province Details'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col space-y-4 py-2 w-full">
              {/* Standard instructions placeholder */}
              <div className="flex flex-col items-center justify-center text-[#A62626]/50 space-y-3.5 py-6 text-center px-4 border border-dashed border-[#1E1C1A]/15 bg-[#FAF6EC]/50">
                <ScrollText size={36} className="opacity-30 stroke-[1.5] text-[#A62626]" />
                <p className="text-[9.5px] font-serif italic uppercase tracking-wider leading-relaxed max-w-[210px] text-[#1E1C1A]/70">
                  {lang === 'zh' ? '💡 请选择地图上的任一行省或军队，以下达战术行动。' : '💡 Click any province or army division on the map to issue tactical commands.'}
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

interface MobilizeAdjusterProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  color: string;
  icon: React.ReactNode;
  lang?: string;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}

const MobilizeAdjuster: React.FC<MobilizeAdjusterProps> = ({ 
  label, 
  value, 
  onChange, 
  color, 
  icon, 
  lang,
  step = 1000,
  min = 0,
  max = 8000,
  unit
}) => {
  const displayUnit = unit || (lang === 'zh' ? '士兵' : 'Soldiers');
  return (
    <div className="flex flex-col space-y-1.5 bg-[#FAF6EC]/40 p-2 border border-[#8B7355]/20 rounded-sm">
      <div className="flex justify-between items-center text-xs font-serif">
        <span className={`font-bold flex items-center gap-1.5 ${color}`}>
          {icon} {label}
        </span>
        <span className="font-serif font-bold text-[#2C241E] bg-[#FAF6EC]/80 px-2 py-0.5 rounded-sm border border-[#8B7355]/30">
          {(value).toLocaleString()} {displayUnit}
        </span>
      </div>
      <div className="flex items-center gap-3 animate-none">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="p-1 rounded-sm bg-[#FAF6EC] text-[#2C241E] hover:bg-[#EBE4D5] disabled:opacity-30 transition-all font-bold border border-[#8B7355]/40 hover:border-[#8B7355] h-7 w-7 flex items-center justify-center shadow-sm cursor-pointer"
        >
          <Minus size={12} />
        </button>
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[#A37841] bg-[#E1D9C5] rounded-sm h-1.5 appearance-none cursor-pointer border border-[#8B7355]/30 focus:outline-none focus:ring-1 focus:ring-[#A37841]/50"
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="p-1 rounded-sm bg-[#FAF6EC] text-[#2C241E] hover:bg-[#EBE4D5] disabled:opacity-30 transition-all font-bold border border-[#8B7355]/40 hover:border-[#8B7355] h-7 w-7 flex items-center justify-center shadow-sm cursor-pointer"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
};

const DetailBox = ({ label, value, color }: { label: string, value: string, color?: string }) => (
  <div className="bg-[#FAF6EC]/90 p-1.5 rounded-sm border border-[#8B7355]/40 text-center relative overflow-hidden flex flex-col justify-between h-14 shadow-sm">
    <div className="absolute top-1 left-1"><span className="w-1 h-1 rounded-full bg-[#A87E43]/40" /></div>
    <div className="absolute top-1 right-1"><span className="w-1 h-1 rounded-full bg-[#A87E43]/40" /></div>
    <div className="text-[9px] font-serif text-[#6B5A49] uppercase tracking-wider font-bold leading-none">{label}</div>
    <div className="text-xs font-serif font-extrabold uppercase truncate tracking-tight pb-0.5" style={{ color: color || '#2C241E' }}>{value}</div>
  </div>
);

