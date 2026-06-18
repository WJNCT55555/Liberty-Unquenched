/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProvinceMap } from './ProvinceMap';
import { MapFaction as Faction, Province, Army } from './types_map';
import { INITIAL_PROVINCES, INITIAL_ARMIES } from './map_constants';
import { useGame } from '../game/GameContext';

export const MapView: React.FC = () => {
  const { state: gameState, dispatch } = useGame();
  const isZh = gameState.language === 'zh';

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

  return (
    <div className="flex-1 flex flex-col p-6 w-full h-full relative overflow-hidden bg-halftone">
      {/* Header */}
      <div className="mb-3 flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl md:text-3xl uppercase text-ink opacity-95 tracking-widest leading-none">
            {isZh ? '战略形势图' : 'Strategic Map View'}
          </h2>
          <p className="font-typewriter text-xs text-ink/60 mt-1 leading-none">
            {isZh 
              ? '左键点击选择省份与军队，在军队选中状态下右键点击相邻省份进行移动' 
              : 'Left-click to select provinces/armies. Right-click adjacent province to move selected army'}
          </p>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MAP_VIEW' })}
          className="px-4 py-2 bg-ink text-paper text-xs uppercase tracking-wider font-bold border border-ink hover:bg-paper hover:text-ink transition-colors"
        >
          {isZh ? '关闭地图' : 'Close Map'}
        </button>
      </div>
      
      {/* 4:3 Map Area */}
      <div className="flex-1 min-h-0 relative select-none bg-paper border-print p-1 rounded-sm shadow-md">
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
    </div>
  );
};
