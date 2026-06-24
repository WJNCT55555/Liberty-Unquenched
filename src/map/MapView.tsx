/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProvinceMap } from './ProvinceMap';
import { MapFaction as Faction, Province, Army } from './types_map';
import { INITIAL_PROVINCES, INITIAL_ARMIES } from './map_constants';
import { useGame } from '../game/GameContext';
import { Sidebar } from './Sidebar';
import { WarSummary } from './WarSummary';

export const MapView: React.FC = () => {
  const { state: gameState, dispatch } = useGame();
  const isZh = gameState.language === 'zh';
  const [showWarSummary, setShowWarSummary] = useState(false);

  const provinces = gameState.provinces || INITIAL_PROVINCES;
  const armies = gameState.armies || INITIAL_ARMIES;
  const selectedProvinceId = gameState.mapSelectedProvinceId || null;
  const selectedArmyId = gameState.mapSelectedArmyId || null;
  const selectedArmyIds = gameState.mapSelectedArmyIds || [];

  const selectProvince = (id: string | null) => {
    dispatch({ type: 'SELECT_MAP_PROVINCE', payload: id });
  };

  const selectArmy = (id: string | null, isShift: boolean = false) => {
    dispatch({ type: 'SELECT_MAP_ARMY', payload: { armyId: id, isShift } });
  };

  const moveArmy = (armyId: string, targetProvinceId: string) => {
    dispatch({ type: 'MOVE_MAP_ARMY', payload: { armyId, targetProvinceId } });
  };

  // Build the complete map-specific GameState expected by the Sidebar props
  const sidebarState = {
    turn: gameState.month || 1, // mapping calendar month/turn to game turn
    date: `${gameState.year}-${gameState.month}`,
    currentPlayer: gameState.mapCurrentPlayer || Faction.REPUBLICAN,
    resources: gameState.mapResources || {
      [Faction.REPUBLICAN]: { manpower: 15000, industrialCapacity: 100, commandPoints: 2, supplies: 8000, tankReserve: 10 },
      [Faction.NATIONALIST]: { manpower: 12000, industrialCapacity: 80, commandPoints: 2, supplies: 6000, tankReserve: 5 },
      [Faction.PORTUGAL]: { manpower: 5000, industrialCapacity: 30, commandPoints: 2, supplies: 3000, tankReserve: 0 },
      [Faction.NEUTRAL]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 }
    },
    provinces: provinces,
    armies: armies,
    selectedProvinceId: selectedProvinceId,
    selectedArmyId: selectedArmyId,
    selectedArmyIds: selectedArmyIds,
    history: gameState.mapHistory || [],
    aiConfig: gameState.mapAiConfig || { enabled: true, aiFaction: Faction.NATIONALIST, difficulty: 'normal' as const }
  };

  const currentPlayer = gameState.mapCurrentPlayer || Faction.REPUBLICAN;
  const repCP = gameState.mapResources?.[Faction.REPUBLICAN]?.commandPoints ?? 0;

  return (
    <div className="flex-1 flex flex-col p-6 w-full h-full relative overflow-hidden bg-halftone">
      {/* Header */}
      <div className="mb-3 flex justify-between items-center bg-paper/60 backdrop-blur-sm p-4 border border-print/20 rounded-md shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl md:text-3xl uppercase text-ink opacity-95 tracking-widest leading-none">
              {isZh ? '战略形势图' : 'Strategic Map View'}
            </h2>
            {gameState.phase === 'war' && (
              <span className={`px-2.5 py-1 text-xs font-mono font-bold tracking-wider uppercase border-2 ${
                currentPlayer === Faction.REPUBLICAN 
                  ? 'bg-[#E3D9C4] text-[#801B1B] border-[#801B1B]' 
                  : 'bg-[#1C2833] text-[#E5E8E8] border-[#A6ACAF]'
              }`}>
                {currentPlayer === Faction.REPUBLICAN 
                  ? (isZh ? `共和军回合 (玩家) | 指挥点: ${repCP}` : `REPUBLICAN TURN (PLAYER) | CP: ${repCP}`)
                  : (isZh ? '国民军回合 (AI) | 已结束交战' : 'NATIONALIST TURN (AI) | ACTIONS COMPLETED')
                }
              </span>
            )}
          </div>
          <p className="font-typewriter text-xs text-ink/60 mt-1.5 leading-none">
            {currentPlayer === Faction.REPUBLICAN
              ? (isZh 
                ? '【玩家回合】左键点击选择省份与军队，在军队选中状态下右键点击相邻省份进行移动。每次移动消耗 1 指挥点。' 
                : '[PLAYER TURN] Left-click to select armies, right-click adjacent province to move. Consumes 1 Command Point.')
              : (isZh
                ? '【AI回合结束】国民军（AI）已执行完战术决策与交战，请点击右上角按钮进入下个月事件阶段。'
                : '[AI TURN ENDED] Nationalists have finished actions. Click top-right button to proceed to next month.')
            }
          </p>
        </div>
        <div className="flex gap-2">
          {gameState.phase === 'war' && currentPlayer === Faction.REPUBLICAN && (
            <button
              onClick={() => {
                dispatch({ type: 'END_MAP_PLAYER_TURN' });
              }}
              className="px-4 py-2 bg-[#2D3748] text-[#F7FAFC] text-xs uppercase tracking-wider font-bold border-2 border-[#1A202C] hover:bg-[#1A202C] transition-colors"
            >
              {isZh ? '结束共和军回合' : 'End Republican Turn'}
            </button>
          )}
          {gameState.phase === 'war' && currentPlayer === Faction.NATIONALIST && (
            <button
              onClick={() => {
                dispatch({ type: 'NEXT_PHASE' });
                dispatch({ type: 'TOGGLE_MAP_VIEW' });
              }}
              className="px-4 py-2 bg-[#A62626] text-white text-xs uppercase tracking-wider font-bold border-2 border-[#801B1B] hover:bg-red-800 transition-colors animate-pulse"
            >
              {isZh ? '退出地图，进入事件阶段' : 'Exit Map & Proceed'}
            </button>
          )}
          <button
            onClick={() => setShowWarSummary(true)}
            className="px-4 py-2 bg-purple-700 text-white text-xs uppercase tracking-wider font-bold border border-purple-800 hover:bg-purple-800 transition-colors"
          >
            {isZh ? '战争形势概览' : 'War Summary'}
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MAP_VIEW' })}
            className="px-4 py-2 bg-ink text-paper text-xs uppercase tracking-wider font-bold border border-ink hover:bg-paper hover:text-ink transition-colors"
          >
            {isZh ? '关闭地图' : 'Close Map'}
          </button>
        </div>
      </div>
      
      {/* 4:3 Map Area and Sidebar container */}
      <div className="flex-1 flex gap-4 min-h-0 relative select-none bg-paper border-print p-1 rounded-sm shadow-md overflow-hidden">
        {/* Map Canvas */}
        <div className="flex-1 min-h-0 relative">
          <ProvinceMap
            provinces={provinces}
            armies={armies}
            selectedId={selectedProvinceId}
            selectedArmyId={selectedArmyId}
            selectedArmyIds={selectedArmyIds}
            onSelect={selectProvince}
            onSelectArmy={selectArmy}
            onMoveArmy={moveArmy}
            lang={isZh ? 'zh' : 'en'}
          />
        </div>

        {/* Sidebar Component */}
        <Sidebar
          state={sidebarState}
          onSelectProvince={selectProvince}
          onSelectArmy={selectArmy}
          onRecruitArmy={(provinceId, composition) => dispatch({ type: 'RECRUIT_MAP_ARMY', payload: { provinceId, composition } })}
          onReinforceArmy={(armyId) => dispatch({ type: 'REINFORCE_MAP_ARMY', payload: { armyId } })}
          onMergeArmies={() => dispatch({ type: 'MERGE_MAP_ARMIES' })}
          onDisbandArmies={() => dispatch({ type: 'DISBAND_MAP_ARMIES' })}
          onSplitArmy={(armyId, composition) => dispatch({ type: 'SPLIT_MAP_ARMY', payload: { armyId, composition } })}
          onBuildBuilding={(provinceId, buildingType) => dispatch({ type: 'BUILD_MAP_BUILDING', payload: { provinceId, buildingType } })}
          onExecuteOffensive={(id) => console.log('execute offensive', id)}
          lang={isZh ? 'zh' : 'en'}
        />
      </div>

      {showWarSummary && (
        <WarSummary
          provinces={provinces}
          armies={armies}
          resources={gameState.mapResources || sidebarState.resources}
          isZh={isZh}
          onClose={() => setShowWarSummary(false)}
        />
      )}
    </div>
  );
};
