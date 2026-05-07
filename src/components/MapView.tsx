import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../game/GameContext';
import { cn } from '../lib/utils';

interface Region {
  id: string;
  name: string;
  nameEn: string;
  offset: number; // X offset in the sprite sheet
}

const REGIONS: Region[] = [
  { id: 'andalusia', name: '安达露西亚', nameEn: 'Andalusia', offset: 960 },
  { id: 'aragon', name: '阿拉贡', nameEn: 'Aragon', offset: 1920 },
  { id: 'catalonia', name: '加泰罗尼亚', nameEn: 'Catalonia', offset: 2880 },
    { id: 'valencia', name: '巴伦西亚', nameEn: 'Valencia', offset: 3840 }, 
  { id: 'asturias', name: '阿斯图里亚斯', nameEn: 'Asturias', offset: 4800 },  
];

const SPRITE_WIDTH = 960;
const SPRITE_HEIGHT = 720; // Assuming standard 4:3, adjust if different

export const MapView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state } = useGame();
  const isZh = state.language === 'zh';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/img/map/spritestext.png';
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvasRef.current = canvas;
        setIsLoaded(true);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isLoaded || !canvasRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = SPRITE_WIDTH / rect.width;
    const scaleY = SPRITE_HEIGHT / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    setMousePos({ x: e.clientX, y: e.clientY });

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let found: Region | null = null;
    
    // Check regions in reverse order (top-most layer first if they overlap)
    for (let i = REGIONS.length - 1; i >= 0; i--) {
      const region = REGIONS[i];
      // Sample the alpha channel at the region's offset
      const pixel = ctx.getImageData(region.offset + x, y, 1, 1).data;
      if (pixel[3] > 10) { // Alpha > 10 means we hit the shape
        found = region;
        break;
      }
    }

    setHoveredRegion(found);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ink/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
    >
      <div className="relative w-full max-w-5xl aspect-[4/3] bg-paper border-4 border-ink shadow-2xl overflow-hidden cursor-crosshair"
           ref={containerRef}
           onMouseMove={handleMouseMove}
           onMouseLeave={() => setHoveredRegion(null)}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-ink text-paper p-2 hover:bg-cnt-red transition-colors font-display text-xl"
        >
          {isZh ? '关闭' : 'CLOSE'} ×
        </button>

        {/* Base Map */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-contain"
          style={{ 
            backgroundImage: `url(/img/map/spritestext.png)`,
            backgroundPosition: '0 0',
            backgroundSize: `${600}% 100%` // 6 frames total
          }}
        />

        {/* Region Layers (Static coloring based on control) */}
        {REGIONS.map(region => {
          const control = state.regions[region.id]?.control ?? 100;
          let bgColor = 'bg-cnt-red'; // Default Republican
          if (control === 0) bgColor = 'bg-[#00008b]'; // Nationalist (Deep Blue)
          else if (control > 0 && control < 100) bgColor = 'bg-contested-stripes';

          // For a 6-frame sprite sheet (0 to 5), the percentage positions are:
          // 0%, 20%, 40%, 60%, 80%, 100%
          const positionPercentage = (region.offset / SPRITE_WIDTH) * 20;

          return (
            <div 
              key={`layer-${region.id}`}
              className={cn("absolute inset-0 pointer-events-none opacity-80", bgColor)}
              style={{ 
                maskImage: `url(/img/map/spritestext.png)`,
                WebkitMaskImage: `url(/img/map/spritestext.png)`,
                maskSize: `600% 100%`,
                WebkitMaskSize: `600% 100%`,
                maskPosition: `${positionPercentage}% 0`,
                WebkitMaskPosition: `${positionPercentage}% 0`,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat'
              }}
            />
          );
        })}

        {/* Hover Highlight Layer */}
        <AnimatePresence>
          {hoveredRegion && (
            <motion.div 
              key={hoveredRegion.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white mix-blend-overlay pointer-events-none"
              style={{ 
                maskImage: `url(/img/map/spritestext.png)`,
                WebkitMaskImage: `url(/img/map/spritestext.png)`,
                maskSize: `600% 100%`,
                WebkitMaskSize: `600% 100%`,
                maskPosition: `${(hoveredRegion.offset / SPRITE_WIDTH) * 20}% 0`,
                WebkitMaskPosition: `${(hoveredRegion.offset / SPRITE_WIDTH) * 20}% 0`,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat'
              }}
            />
          )}
        </AnimatePresence>

        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/80 z-40">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-ink border-t-cnt-red rounded-full animate-spin"></div>
              <span className="font-typewriter text-sm uppercase tracking-widest animate-pulse">
                {isZh ? '正在展开地图...' : 'Unrolling Map...'}
              </span>
            </div>
          </div>
        )}

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredRegion && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="fixed pointer-events-none z-[110] bg-ink text-paper px-4 py-3 shadow-xl border border-paper/20 min-w-[200px]"
              style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
            >
              <div className="font-display text-2xl leading-none mb-2 border-b border-paper/20 pb-1">
                {isZh ? hoveredRegion.name : hoveredRegion.nameEn}
              </div>
              
              <div className="space-y-1 font-typewriter text-xs">
                <div className="flex justify-between gap-4">
                  <span className="opacity-60">{isZh ? '归属:' : 'Allegiance:'}</span>
                  <span className={cn(
                    "font-bold",
                    state.regions[hoveredRegion.id]?.control === 100 ? "text-cnt-red" : 
                    state.regions[hoveredRegion.id]?.control === 0 ? "text-blue-400" : "text-yellow-400"
                  )}>
                    {state.regions[hoveredRegion.id]?.control === 100 ? (isZh ? '共和派' : 'Republican') :
                     state.regions[hoveredRegion.id]?.control === 0 ? (isZh ? '国民派' : 'Nationalist') :
                     (isZh ? '争夺区' : 'Contested')}
                  </span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <span className="opacity-60">{isZh ? '控制度:' : 'Control:'}</span>
                  <span>{state.regions[hoveredRegion.id]?.control ?? 100}%</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-paper/10 font-typewriter text-[9px] uppercase tracking-widest opacity-40">
                {isZh ? '点击查看战区详情' : 'Click for Strategic Intel'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 bg-paper/90 border-2 border-ink p-4 shadow-lg z-30 max-w-xs">
          <h5 className="font-display text-xl mb-2 border-b border-ink pb-1 uppercase">
            {isZh ? '战情图例' : 'War Map Legend'}
          </h5>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-typewriter">
              <div className="w-4 h-4 bg-cnt-red border border-ink"></div>
              <span>{isZh ? '共和军控制区' : 'Republican Control'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-typewriter">
              <div className="w-4 h-4 bg-[#00008b] border border-ink"></div>
              <span>{isZh ? '国民军控制区' : 'Nationalist Control'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-typewriter">
              <div className="w-4 h-4 bg-contested-stripes border border-ink"></div>
              <span>{isZh ? '内战交战区' : 'Contested Area'}</span>
            </div>
            <p className="text-[10px] font-serif italic mt-2 opacity-70">
              {isZh ? '“只有通过斗争，我们才能赢得自由。”' : '"Only through struggle can we win our freedom."'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
