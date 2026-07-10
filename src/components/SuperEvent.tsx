import React from 'react';
import { useGame } from '../game/GameContext';
import { motion } from 'motion/react';

export const SuperEvent: React.FC = () => {
  const { state, dispatch } = useGame();
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const baseWidth = 768; // 4:3 Aspect Ratio Base Width
      const baseHeight = 576; // 4:3 Aspect Ratio Base Height
      
      const padding = 24; // Page margin padding
      const scaleX = (width - padding) / baseWidth;
      const scaleY = (height - padding) / baseHeight;
      const newScale = Math.min(1, scaleX, scaleY);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!state.superEvent) return null;

  let title = '';
  let titleZh = '';
  let quote = '';
  let quoteZh = '';
  let image = '';
  let buttonText = '';
  let buttonTextZh = '';

  if (state.superEvent === 'spanish_civil_war') {
    title = 'The Spanish Civil War';
    titleZh = '西班牙内战';
    quote = '"No pasarán!" - Dolores Ibárruri';
    quoteZh = '“他们绝不能通过！” - 多洛雷斯·伊巴露丽';
    image = '/img/SuperEvent/spanish_civil_war.jpg'; // Path as requested
    buttonText = 'To Arms!';
    buttonTextZh = '拿起武器！';
  } else if (state.superEvent === 'spanish_civil_war_ends') {
    title = 'The War is Over';
    titleZh = '战争结束';
    quote = 'The guns have fallen silent.';
    quoteZh = '枪炮声已经平息。';
    image = '/img/SuperEvent/spanish_civil_war_ends.jpg';
    buttonText = 'A New Era';
    buttonTextZh = '新纪元';
  } else if (state.superEvent === 'abdication_alfonso') {
    title = 'Abdication of Alfonso XIII';
    titleZh = '阿方索十三世退位';
    quote = '"I expect to witness the real and proper expression of the collective conscience; when the nation speaks, I will voluntarily suspend the exercise of Royal power and leave Spain, thus acknowledging her as the sole mistress of her own destiny." - Alfonso XIII';
    quoteZh = '“我期待见证集体良知真实且恰当的表达；当国家发声之时，我将主动中止行使王权、离开西班牙，以此承认她是自身命运的唯一主宰。” —— 阿方索十三世';
    image = '/img/SuperEvent/abdication_alfonso.jpg';
    buttonText = 'Long Live the Republic!';
    buttonTextZh = '共和国万岁！';
  }

  const isZh = state.language === 'zh';
  const audioPath = `${(import.meta as any).env.BASE_URL || '/'}music/SuperEvent/${state.superEvent}.mp3`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <audio id="super-event-audio" src={audioPath} autoPlay />
      <motion.div 
        initial={{ opacity: 0, scale: scale * 0.9 }}
        animate={{ opacity: 1, scale: scale }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative shadow-2xl flex flex-col select-none shrink-0"
        style={{
          width: '768px',
          height: '576px',
          backgroundImage: `url(${(import.meta as any).env.BASE_URL || '/'}img/Superevents/Supereventsbox.png)`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Top Spacer to push content past the newspaper masthead */}
        <div className="h-[125px] shrink-0" />

        {/* Title Area */}
        <div className="h-[55px] flex items-center justify-center px-12 z-10 shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold text-red-600 uppercase tracking-widest drop-shadow-sm font-display leading-tight">
            {isZh ? titleZh : title}
          </h1>
        </div>
        
        {/* Image Area */}
        <div className="h-[210px] flex items-center justify-center px-16 z-10 shrink-0 mt-2">
          <div className="relative w-[380px] h-full border border-zinc-700/50 overflow-hidden bg-zinc-950/80 flex items-center justify-center">
            {/* Fallback if image doesn't exist */}
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 italic text-sm">
              [Image: {image}]
            </div>
            <img 
              src={`${(import.meta as any).env.BASE_URL || '/'}${image.startsWith('/') ? image.slice(1) : image}`} 
              alt={title} 
              className="relative z-10 w-full h-full object-cover opacity-85 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Quote Area */}
        <div className="flex-1 flex items-center justify-center px-16 z-10 py-3 overflow-hidden">
          <p className="text-base md:text-lg italic text-zinc-200 font-serif leading-relaxed drop-shadow-md text-center max-w-[500px]">
            {isZh ? quoteZh : quote}
          </p>
        </div>

        {/* Button Area */}
        <div className="h-[65px] flex items-start justify-center z-10 pb-[25px] shrink-0">
          <button
            onClick={() => dispatch({ type: 'DISMISS_SUPER_EVENT' })}
            className="px-8 py-2.5 bg-red-950/80 hover:bg-red-900 active:bg-red-950 text-white font-bold uppercase tracking-wider transition-all duration-200 border border-red-800 text-sm cursor-pointer shadow-lg hover:shadow-red-900/30 active:scale-95"
          >
            {isZh ? buttonTextZh : buttonText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
