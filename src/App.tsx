/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameProvider } from './game/GameContext';
import { TopBar } from './components/TopBar';
import { SidePanel } from './components/SidePanel';
import { MainArea } from './components/MainArea';
import { AdvisorPanel } from './components/AdvisorPanel';
import { JournalPanel } from './components/JournalPanel';
import { EndingScreen } from './components/EndingScreen';
import { StartScreen } from './components/StartScreen';
import { SuperEvent } from './components/SuperEvent';
import { SandboxMenu } from './components/SandboxMenu';
import { useGame } from './game/GameContext';
import { Toaster } from 'sonner';

const GameContent = () => {
  const { state } = useGame();

  if (state.screen === 'start') {
    return <StartScreen />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-paper text-ink font-serif overflow-hidden">
      <Toaster position="top-center" richColors />
      <TopBar />
      <SandboxMenu />
      <div className="flex flex-1 overflow-hidden">
        <SidePanel />
        <div className="flex-1 flex flex-col relative">
          <MainArea />
          <AdvisorPanel />
          <JournalPanel />
          <EndingScreen />
          <SuperEvent />
        </div>
      </div>
    </div>
  );
};

import { MusicProvider } from './components/MusicPlayer';

export default function App() {
  return (
    <GameProvider>
      <MusicProvider>
        <GameContent />
      </MusicProvider>
    </GameProvider>
  );
}
