/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProvinceMap } from './ProvinceMap';
import { MapFaction as Faction, Province, Army } from './types_map';
import { INITIAL_PROVINCES, INITIAL_ARMIES } from './map_constants';
import { useGameActions, useMapState } from '../game/GameContext';
import { Sidebar } from './Sidebar';
import { WarSummary } from './WarSummary';

export const MapView: React.FC = () => {
  const gameState = useMapState();
  const { dispatch } = useGameActions();
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
      [Faction.NEUTRAL]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 },
      [Faction.UNITED_KINGDOM]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 },
      [Faction.ANDORRA]: { manpower: 0, industrialCapacity: 0, commandPoints: 0, supplies: 0, tankReserve: 0 }
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
  const playerFaction = gameState.activeWar === 'asturias_war' ? Faction.WORKERS_ALLIANCE : Faction.REPUBLICAN;
  const aiFaction = gameState.activeWar === 'asturias_war' ? Faction.REPUBLICAN : Faction.NATIONALIST;
  const isPlayerTurn = currentPlayer === playerFaction;
  const isAiTurn = currentPlayer === aiFaction;
  const commandPoints = gameState.mapResources?.[playerFaction]?.commandPoints ?? 0;
  const selectedArmy = armies.find((army) => army.id === selectedArmyId);
  const canMoveSelectedArmy = Boolean(
    gameState.phase === 'war' &&
    isPlayerTurn &&
    commandPoints > 0 &&
    selectedArmy?.faction === playerFaction
  );

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (gameState.phase === 'war' && isAiTurn) {
      setCountdown(5);
    } else {
      setCountdown(null);
    }
  }, [isAiTurn, gameState.phase]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      dispatch({ type: 'NEXT_PHASE' });
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, dispatch]);

  return (
    <div className="flex-1 flex flex-col p-4 w-full h-full relative overflow-hidden bg-halftone">
      {/* Unframed map heading: retain the title and controls without the old header panel. */}
      <div className="shrink-0 min-h-[42px] mb-2 flex items-center justify-between gap-4 px-1">
        <h2 className="font-display text-2xl md:text-3xl uppercase text-ink opacity-95 tracking-widest leading-none">
          {isZh ? '战略形势图' : 'Strategic Map View'}
        </h2>

        <div className="flex flex-wrap justify-end gap-1.5">
          {gameState.phase === 'war' && isPlayerTurn && (
            <button
              onClick={() => {
                dispatch({ type: 'END_MAP_PLAYER_TURN' });
              }}
              className="px-3 py-1.5 bg-[#2D3748] text-[#F7FAFC] text-[10px] uppercase tracking-wider font-bold border-2 border-[#1A202C] hover:bg-[#1A202C] transition-colors cursor-pointer shadow-sm"
            >
              {isZh 
                ? (gameState.activeWar === 'asturias_war' ? '结束工人联盟回合' : '结束共和军回合') 
                : (gameState.activeWar === 'asturias_war' ? 'End Workers Turn' : 'End Republican Turn')}
            </button>
          )}
          {gameState.phase === 'war' && isAiTurn && (
            <button
              onClick={() => {
                dispatch({ type: 'NEXT_PHASE' });
              }}
              className="px-3 py-1.5 bg-[#A62626] text-white text-[10px] uppercase tracking-wider font-bold border-2 border-[#801B1B] hover:bg-red-800 transition-colors animate-pulse cursor-pointer shadow-sm"
            >
              {isZh 
                ? `退出地图，进入事件阶段 (${countdown ?? 0}s)` 
                : `Exit Map & Proceed (${countdown ?? 0}s)`}
            </button>
          )}
          {gameState.activeWar && (
            <button
              onClick={() => setShowWarSummary(true)}
              className="px-3 py-1.5 bg-purple-700 text-white text-[10px] uppercase tracking-wider font-bold border border-purple-800 hover:bg-purple-800 transition-colors cursor-pointer shadow-sm"
            >
              {isZh ? '战争形势概览' : 'War Summary'}
            </button>
          )}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MAP_VIEW' })}
            className="px-3 py-1.5 bg-ink text-paper text-[10px] uppercase tracking-wider font-bold border border-ink hover:bg-paper hover:text-ink transition-colors cursor-pointer shadow-sm"
          >
            {isZh ? '关闭地图' : 'Close Map'}
          </button>
        </div>
      </div>
      
      {/* 4:3 Map Area and Sidebar container */}
      <div className="flex-1 flex gap-1 min-h-0 relative select-none bg-paper border-print p-1 rounded-sm shadow-md overflow-hidden">
        {/* Map Canvas */}
        <div className="flex-1 min-w-0 min-h-0 relative flex items-start justify-end">
          <ProvinceMap
            provinces={provinces}
            armies={armies}
            selectedId={selectedProvinceId}
            selectedArmyId={selectedArmyId}
            selectedArmyIds={selectedArmyIds}
            onSelect={selectProvince}
            onSelectArmy={selectArmy}
            onMoveArmy={moveArmy}
            canMoveSelectedArmy={canMoveSelectedArmy}
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
          activeWar={gameState.activeWar || undefined}
        />
      )}
    </div>
  );
};
