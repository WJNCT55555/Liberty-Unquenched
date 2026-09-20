/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProvinceMap } from './ProvinceMap';
import { MapFaction as Faction } from './types_map';
import { useGameActions, useGameSelector, useMapRuntimeState } from '../game/GameContext';
import { areRecruitmentPoolViewsEqual, selectMapRecruitmentPools } from '../game/selectors';
import { Sidebar } from './Sidebar';
import { WarSummary } from './WarSummary';
import { getPlayerMapFaction, getMapFactionName } from './rules/factions';

export const MapView: React.FC = () => {
  const gameState = useMapRuntimeState();
  const { dispatch } = useGameActions();
  const recruitmentPools = useGameSelector(selectMapRecruitmentPools, areRecruitmentPoolViewsEqual);
  const isZh = gameState.language === 'zh';
  const [showWarSummary, setShowWarSummary] = useState(false);

  const provinces = gameState.provinces;
  const armies = gameState.armies;
  const selectedProvinceId = gameState.mapSelectedProvinceId;
  const selectedArmyId = gameState.mapSelectedArmyId;
  const selectedArmyIds = gameState.mapSelectedArmyIds;
  const playerFaction = getPlayerMapFaction(gameState);

  const selectProvince = (id: string | null) => {
    dispatch({ type: 'SELECT_MAP_PROVINCE', payload: id });
  };

  const selectArmy = (id: string | null, isShift: boolean = false) => {
    dispatch({ type: 'SELECT_MAP_ARMY', payload: { armyId: id, isShift } });
  };

  const moveArmy = (armyId: string, targetProvinceId: string) => {
    dispatch({ type: 'MOVE_MAP_ARMY', payload: { armyId, targetProvinceId } });
  };

  const currentPlayer = gameState.mapCurrentPlayer;
  const aiFaction = gameState.activeWar === 'asturias_war' ? Faction.REPUBLICAN : Faction.NATIONALIST;
  const isPlayerTurn = currentPlayer === playerFaction && !gameState.iberianDefense?.playerDefeated && !gameState.iberianDefense?.winner;
  const isAiTurn = gameState.iberianDefense ? !isPlayerTurn && !gameState.iberianDefense.winner : currentPlayer === aiFaction;
  const commandPoints = gameState.mapResources[playerFaction].commandPoints;
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
          {gameState.iberianDefense ? getMapFactionName(playerFaction, isZh) : isZh ? '战略形势图' : 'Strategic Map View'}
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
                ? (gameState.iberianDefense ? '结束委员会回合 → 两方 AI' : gameState.activeWar === 'asturias_war' ? '结束工人联盟回合' : '结束共和军回合')
                : (gameState.iberianDefense ? 'End Committee Turn → AI Turns' : gameState.activeWar === 'asturias_war' ? 'End Workers Turn' : 'End Republican Turn')}
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
        <fieldset disabled={!isPlayerTurn || gameState.phase !== 'war'} className="contents"><Sidebar
          state={gameState}
          recruitmentPools={recruitmentPools}
          onSelectProvince={selectProvince}
          onSelectArmy={selectArmy}
          onRecruitArmy={(provinceId, composition, sourceEntityId) => dispatch({ type: 'RECRUIT_MAP_ARMY', payload: { provinceId, composition, sourceEntityId } })}
          onReinforceArmy={(armyId) => dispatch({ type: 'REINFORCE_MAP_ARMY', payload: { armyId } })}
          onMergeArmies={() => dispatch({ type: 'MERGE_MAP_ARMIES' })}
          onDisbandArmies={() => dispatch({ type: 'DISBAND_MAP_ARMIES' })}
          onSplitArmy={(armyId, composition) => dispatch({ type: 'SPLIT_MAP_ARMY', payload: { armyId, composition } })}
          onBuildBuilding={(provinceId, buildingType) => dispatch({ type: 'BUILD_MAP_BUILDING', payload: { provinceId, buildingType } })}
          lang={isZh ? 'zh' : 'en'}
        /></fieldset>
      </div>

      {showWarSummary && (
        <WarSummary
          provinces={provinces}
          armies={armies}
          resources={gameState.mapResources}
          isZh={isZh}
          onClose={() => setShowWarSummary(false)}
          activeWar={gameState.activeWar || undefined}
          iberianDefense={gameState.iberianDefense}
        />
      )}
    </div>
  );
};
