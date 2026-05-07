import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume2, VolumeX, Radio, Disc3, Star, X, List, Music } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../game/GameContext';

export type PlayMode = 'list' | 'loop' | 'random';
export type PlaylistName = 'Republicana' | 'Nacional';

export interface Track {
  title: string;
  src: string;
}

export const PLAYLISTS: Record<PlaylistName, Track[]> = {
  Republicana: [
    { title: 'A las Barricadas', src: '/music/Republicana-A las Barricadas.mp3' },
    { title: 'Hijos del Pueblo', src: '/music/Republicana-Hijos del Pueblo.mp3' },
    { title: 'Himno de Riego', src: '/music/Republicana-Himno de Riego.mp3' },
    { title: 'Lied der Internationalen Brigaden', src: '/music/Republicana-Lied der Internationalen Brigaden.mp3' }
  ],
  Nacional: [
    { title: '¡Ya hemos pasao! (remastered)', src: '/music/Nacional-¡Ya hemos pasao! (remastered).mp3' },
    { title: 'Tómala Sí Un Día, Tómala Sí Un Dos', src: '/music/Nacional-Tómala Sí Un Día,Tómala Sí Un Dos.mp3' }
  ]
};

interface MusicContextType {
  currentPlaylist: PlaylistName;
  currentTrackIndex: number;
  isPlaying: boolean;
  playMode: PlayMode;
  volume: number;
  progress: number;
  duration: number;
  setPlaylist: (name: PlaylistName) => void;
  setTrack: (index: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setPlayMode: (mode: PlayMode) => void;
  setVolume: (vol: number) => void;
  seek: (time: number) => void;
  currentTrack: Track;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistName>('Republicana');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('list');
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = PLAYLISTS[currentPlaylist][currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.src;
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          setIsPlaying(false);
        });
      }
    }
  }, [currentPlaylist, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    if (playMode === 'loop') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (playMode === 'random') {
      const nextIndex = Math.floor(Math.random() * PLAYLISTS[currentPlaylist].length);
      setCurrentTrackIndex(nextIndex);
    } else {
      // list mode
      const nextIndex = currentTrackIndex + 1;
      if (nextIndex < PLAYLISTS[currentPlaylist].length) {
        setCurrentTrackIndex(nextIndex);
      } else {
        setCurrentTrackIndex(0);
        setIsPlaying(false);
      }
    }
  };

  const nextTrack = () => {
    if (playMode === 'random') {
      setCurrentTrackIndex(Math.floor(Math.random() * PLAYLISTS[currentPlaylist].length));
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % PLAYLISTS[currentPlaylist].length);
    }
  };

  const prevTrack = () => {
    if (playMode === 'random') {
      setCurrentTrackIndex(Math.floor(Math.random() * PLAYLISTS[currentPlaylist].length));
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + PLAYLISTS[currentPlaylist].length) % PLAYLISTS[currentPlaylist].length);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const setPlaylist = (name: PlaylistName) => {
    if (name !== currentPlaylist) {
      setCurrentPlaylist(name);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    }
  };

  return (
    <MusicContext.Provider value={{
      currentPlaylist, currentTrackIndex, isPlaying, playMode, volume, progress, duration,
      setPlaylist, setTrack: setCurrentTrackIndex, togglePlay: () => setIsPlaying(!isPlaying),
      nextTrack, prevTrack, setPlayMode, setVolume, seek, currentTrack
    }}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        className="hidden"
      />
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};

export const MusicPlayerUI = ({ onClose }: { onClose?: () => void }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  const {
    currentPlaylist, currentTrackIndex, isPlaying, playMode, volume, progress, duration,
    setPlaylist, setTrack, togglePlay, nextTrack, prevTrack, setPlayMode, setVolume, seek, currentTrack
  } = useMusic();

  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const cyclePlayMode = () => {
    const modes: PlayMode[] = ['list', 'loop', 'random'];
    const nextIndex = (modes.indexOf(playMode) + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  const getModeIcon = () => {
    switch (playMode) {
      case 'loop': return <Repeat1 className="w-4 h-4" />;
      case 'random': return <Shuffle className="w-4 h-4" />;
      default: return <Repeat className="w-4 h-4" />;
    }
  };

  const getModeTooltip = () => {
    if (isZh) {
      switch (playMode) {
        case 'loop': return '单曲循环';
        case 'random': return '随机播放';
        default: return '列表循环';
      }
    } else {
      switch (playMode) {
        case 'loop': return 'Single Loop';
        case 'random': return 'Random Play';
        default: return 'List Play';
      }
    }
  };

  // Calculate rotation for volume knob (0 to 270 degrees)
  const volumeRotation = volume * 270 - 135;

  const Screw = ({ className }: { className?: string }) => (
    <div className={cn("w-2.5 h-2.5 rounded-full bg-[#2A1A12] relative flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]", className)}>
      <div className="w-full h-[1px] bg-[#4A3B32] rotate-45"></div>
    </div>
  );

  const Corner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const posClasses = {
      tl: 'top-0 left-0 rounded-br-xl rounded-tl-xl border-r-[3px] border-b-[3px]',
      tr: 'top-0 right-0 rounded-bl-xl rounded-tr-xl border-l-[3px] border-b-[3px]',
      bl: 'bottom-0 left-0 rounded-tr-xl rounded-bl-xl border-r-[3px] border-t-[3px]',
      br: 'bottom-0 right-0 rounded-tl-xl rounded-br-xl border-l-[3px] border-t-[3px]',
    };
    return (
      <div className={cn("absolute w-10 h-10 bg-[#C89F5A] border-[#2A1A12] z-20", posClasses[position])}>
         <Screw className={cn("absolute", 
           position === 'tl' ? 'top-2 left-2' : 
           position === 'tr' ? 'top-2 right-2' : 
           position === 'bl' ? 'bottom-2 left-2' : 'bottom-2 right-2'
         )} />
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start max-w-fit mx-auto w-full justify-center">
      {/* Main Radio */}
      <div className={cn(
        "bg-[#7A4B3A] p-3 md:p-4 rounded-2xl border-[3px] border-[#2A1A12] shadow-[8px_8px_0px_rgba(42,26,18,0.5)] relative flex flex-col w-full max-w-2xl transition-all duration-500",
        "flex-shrink-0"
      )}>
        {/* Wood Texture Lines (Subtle) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-xl">
           <svg width="100%" height="100%">
             <filter id="wood">
               <feTurbulence type="fractalNoise" baseFrequency="0.01 0.1" numOctaves="3" result="noise" />
               <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" in="noise" />
             </filter>
             <rect width="100%" height="100%" filter="url(#wood)" />
           </svg>
        </div>

        <Corner position="tl" />
        <Corner position="tr" />
        <Corner position="bl" />
        <Corner position="br" />

        {/* Inner Panel */}
        <div className="bg-[#4A3B32] rounded-xl border-[3px] border-[#2A1A12] p-4 md:p-6 relative z-10 flex flex-col gap-5">
          
          <Screw className="absolute top-3 left-3" />
          <Screw className="absolute top-3 right-3" />
          <Screw className="absolute bottom-3 left-3" />
          <Screw className="absolute bottom-3 right-3" />

          {/* Top Section: Display Window */}
          <div className="bg-[#382B24] rounded-lg border-[3px] border-[#C89F5A] p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)] mx-2 mt-2">
            
            {/* Header */}
            <div className="flex justify-between items-start relative z-10 mb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#E87A30]" />
                <span className="font-typewriter text-[#E87A30] text-sm uppercase tracking-widest font-bold">
                  {isZh ? '秘密电台' : 'RADIO CLANDESTINA'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    isPlaylistOpen ? "text-[#E87A30]" : "text-[#A89F91] hover:text-[#E87A30]"
                  )}
                  title={isZh ? '播放列表' : 'Playlist'}
                >
                  <List className="w-6 h-6" />
                </button>
                {onClose && (
                  <button onClick={onClose} className="text-[#A89F91] hover:text-[#E87A30] transition-colors p-1">
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="relative z-10 flex-1 flex flex-col justify-center mt-2">
              <div className="font-typewriter text-3xl text-[#E8DCC4] truncate font-bold drop-shadow-md">
                {currentTrack.title}
              </div>
              <div className="font-typewriter text-[#E8DCC4] text-sm mt-3 flex justify-between opacity-80">
                <span className="uppercase">{currentPlaylist}</span>
                <span>{formatTime(progress)} / {formatTime(duration)}</span>
              </div>
            </div>

            {/* Tuning Dial (Progress) */}
            <div className="mt-4 relative z-10">
              <div className="flex justify-between px-2 mb-2 opacity-30">
                {[...Array(11)].map((_, i) => (
                  <div key={i} className="w-0.5 h-2 bg-[#E8DCC4]"></div>
                ))}
              </div>
              <div 
                className="h-2 bg-[#1A0F0D] rounded-full cursor-pointer relative border border-[#2A1A12]"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  seek(pos * duration);
                }}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-[#E87A30] rounded-full pointer-events-none"
                  style={{ width: `${(progress / duration) * 100}%` }}
                ></div>
                {/* Key Thumb */}
                <svg width="14" height="28" viewBox="0 0 12 24" className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 drop-shadow-[0_2px_0_#2A1A12] pointer-events-none" style={{ left: `${(progress / duration) * 100}%` }}>
                  <path d="M6 0 C8.2 0 10 1.8 10 4 C10 6.2 8.2 8 6 8 L6 18 L9 18 L9 20 L6 20 L6 22 L9 22 L9 24 L4 24 L4 8 C1.8 8 0 6.2 0 4 C0 1.8 1.8 0 6 0 Z M6 2 C4.9 2 4 2.9 4 4 C4 5.1 4.9 6 6 6 C7.1 6 8 5.1 8 4 C8 2.9 7.1 2 6 2 Z" fill="#C89F5A" stroke="#2A1A12" strokeWidth="1"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Middle Section: Art Deco Speaker Grille */}
          <div className="h-24 bg-[#382B24] rounded-lg border-[3px] border-[#2A1A12] relative overflow-hidden mx-2 shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)]">
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 80">
              <defs>
                <pattern id="grille-mesh" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M 6 0 L 0 6 M 0 0 L 6 6" fill="none" stroke="#2A1A12" strokeWidth="1" opacity="0.6"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grille-mesh)" />
              
              <g fill="none" stroke="#C89F5A" strokeWidth="3" strokeLinecap="round">
                {/* Left Curves */}
                <path d="M 180 80 L 180 40 Q 180 10 10 10" />
                <path d="M 190 80 L 190 50 Q 190 20 10 20" />
                <path d="M 170 80 L 170 30 Q 170 5 10 5" opacity="0.5" />
                {/* Right Curves */}
                <path d="M 220 80 L 220 40 Q 220 10 390 10" />
                <path d="M 210 80 L 210 50 Q 210 20 390 20" />
                <path d="M 230 80 L 230 30 Q 230 5 390 5" opacity="0.5" />
                {/* Center Pillar */}
                <line x1="195" y1="0" x2="195" y2="80" />
                <line x1="205" y1="0" x2="205" y2="80" />
              </g>
            </svg>
          </div>

          {/* Bottom Section: Controls */}
          <div className="flex justify-between items-end px-4 pb-2 relative z-10">
            
            {/* Left: Volume Knob */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Ticks */}
                {[...Array(21)].map((_, i) => (
                  <div key={i} className="absolute w-0.5 h-1.5 bg-[#C89F5A]" style={{ transform: `rotate(${i * 13.5 - 135}deg) translateY(-36px)` }}></div>
                ))}
                {/* Knob */}
                <div className="w-16 h-16 rounded-full bg-[#C89F5A] border-[3px] border-[#2A1A12] flex items-center justify-center shadow-[0_4px_0_#2A1A12] relative">
                  <div className="w-10 h-10 rounded-full bg-[#382B24] border-[3px] border-[#2A1A12] relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                    <motion.div 
                      className="absolute inset-0 pointer-events-none"
                      animate={{ rotate: volumeRotation }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#E8DCC4]"></div>
                    </motion.div>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              <span className="font-typewriter text-[#C89F5A] text-[10px] uppercase font-bold tracking-widest mt-1">
                {isZh ? '音量' : 'VOLUME'}
              </span>
            </div>

            {/* Center: Playback Buttons */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={prevTrack} className="w-12 h-10 bg-[#382B24] border-[3px] border-[#2A1A12] rounded-lg flex items-center justify-center shadow-[0_4px_0_#2A1A12] active:shadow-[0_0px_0_#2A1A12] active:translate-y-[4px] transition-all text-[#E8DCC4] hover:bg-[#4A3B32]">
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              
              <button onClick={togglePlay} className="w-14 h-12 bg-[#382B24] border-[3px] border-[#2A1A12] rounded-lg flex items-center justify-center shadow-[0_4px_0_#2A1A12] active:shadow-[0_0px_0_#2A1A12] active:translate-y-[4px] transition-all text-[#E8DCC4] hover:bg-[#4A3B32]">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>
              
              <button onClick={nextTrack} className="w-12 h-10 bg-[#382B24] border-[3px] border-[#2A1A12] rounded-lg flex items-center justify-center shadow-[0_4px_0_#2A1A12] active:shadow-[0_0px_0_#2A1A12] active:translate-y-[4px] transition-all text-[#E8DCC4] hover:bg-[#4A3B32]">
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Right: Band & Mode */}
            <div className="flex flex-col gap-3 w-32 mb-1">
              <div className="relative">
                {/* Decorative flourishes */}
                <svg className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-6 text-[#C89F5A] pointer-events-none" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M 10 10 Q 30 20 50 10 Q 70 0 90 10" />
                  <path d="M 20 15 Q 50 25 80 15" opacity="0.5" />
                </svg>
                
                <div className="flex bg-[#382B24] p-1 rounded-md border-[3px] border-[#C89F5A] w-full shadow-[0_2px_0_#2A1A12] relative z-10">
                  <button
                    onClick={() => setPlaylist('Republicana')}
                    className={cn(
                      "flex-1 py-1 text-[10px] font-typewriter uppercase font-bold transition-colors rounded-sm",
                      currentPlaylist === 'Republicana' ? "bg-[#C89F5A] text-[#2A1A12]" : "text-[#C89F5A] hover:text-[#E8DCC4]"
                    )}
                  >
                    REP
                  </button>
                  <button
                    onClick={() => setPlaylist('Nacional')}
                    className={cn(
                      "flex-1 py-1 text-[10px] font-typewriter uppercase font-bold transition-colors rounded-sm",
                      currentPlaylist === 'Nacional' ? "bg-[#C89F5A] text-[#2A1A12]" : "text-[#C89F5A] hover:text-[#E8DCC4]"
                    )}
                  >
                    NAC
                  </button>
                </div>
                <div className="text-center mt-1">
                  <span className="font-typewriter text-[#C89F5A] text-[8px] uppercase font-bold tracking-widest bg-[#4A3B32] px-2 relative z-10">BAND</span>
                </div>
              </div>

              <button 
                onClick={cyclePlayMode}
                title={getModeTooltip()}
                className="w-full py-1.5 bg-[#C24A3A] border-[3px] border-[#2A1A12] rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_0_#2A1A12] active:shadow-[0_0px_0_#2A1A12] active:translate-y-[4px] transition-all text-[#E8DCC4] hover:bg-[#D35A4A] relative z-10 mt-1"
              >
                {getModeIcon()}
                <span className="font-typewriter text-[10px] uppercase font-bold">
                  {playMode === 'list' ? 'SEQ' : playMode === 'loop' ? 'RPT' : 'RND'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Playlist */}
      <AnimatePresence>
        {isPlaylistOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: -20 }}
            animate={{ width: 320, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -20 }}
            className="bg-[#7A4B3A] border-[3px] border-[#2A1A12] rounded-2xl shadow-[8px_8px_0px_rgba(42,26,18,0.5)] overflow-hidden flex flex-col h-[520px] w-full md:w-[320px] relative z-20 flex-shrink-0 p-3"
          >
            <div className="bg-[#4A3B32] border-[3px] border-[#2A1A12] rounded-xl flex-1 flex flex-col overflow-hidden relative">
              <Corner position="tl" />
              <Corner position="tr" />
              
              <div className="p-4 bg-[#382B24] border-b-[3px] border-[#2A1A12] flex justify-between items-center relative z-30">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-[#E87A30]" />
                  <span className="font-typewriter text-[#E8DCC4] text-sm uppercase font-bold tracking-widest">
                    {isZh ? '播放列表' : 'Playlist'}
                  </span>
                </div>
                <button onClick={() => setIsPlaylistOpen(false)} className="text-[#C89F5A] hover:text-[#E87A30] transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 bg-[#4A3B32] relative z-10">
                <div className="space-y-2">
                  {PLAYLISTS[currentPlaylist].map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTrack(idx)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 group border-[3px]",
                        currentTrackIndex === idx 
                          ? "bg-[#382B24] border-[#C89F5A] shadow-[0_2px_0_#2A1A12]" 
                          : "bg-[#382B24] border-[#2A1A12] hover:border-[#E87A30] hover:shadow-[0_2px_0_#2A1A12]"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-[2px]",
                        currentTrackIndex === idx 
                          ? "bg-[#C89F5A] text-[#2A1A12] border-[#2A1A12]" 
                          : "bg-[#4A3B32] text-[#E8DCC4] border-[#2A1A12]"
                      )}>
                        {currentTrackIndex === idx && isPlaying ? (
                          <div className="flex gap-1 items-end h-3">
                            <div className="w-1 h-full bg-[#2A1A12] animate-pulse"></div>
                            <div className="w-1 h-1/2 bg-[#2A1A12] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1 h-3/4 bg-[#2A1A12] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "font-typewriter text-sm truncate font-bold",
                          currentTrackIndex === idx ? "text-[#C89F5A]" : "text-[#E8DCC4]"
                        )}>
                          {track.title}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#382B24] border-t-[3px] border-[#2A1A12] flex justify-between items-center relative z-30">
                <span className="font-typewriter text-xs text-[#C89F5A] uppercase font-bold">
                  {currentPlaylist}
                </span>
                <span className="font-typewriter text-xs text-[#C89F5A] font-bold">
                  {PLAYLISTS[currentPlaylist].length} TRACKS
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
