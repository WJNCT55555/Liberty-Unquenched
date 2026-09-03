import React from 'react';
import { useGameActions, useGameSelector, shallowEqual } from '../game/GameContext';
import { motion } from 'motion/react';

export const SuperEvent: React.FC = () => {
  const state = useGameSelector(snapshot => ({
    superEvent: snapshot.superEvent,
    civilWarStatus: snapshot.civilWarStatus,
    language: snapshot.language,
  }), shallowEqual);
  const { dispatch } = useGameActions();
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const baseWidth = 960; // 4:3 Aspect Ratio Base Width
      const baseHeight = 720; // 4:3 Aspect Ratio Base Height
      
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
    image = 'img/Superevents/spanish_civil_war_outbreak.png';
    buttonText = 'To Arms!';
    buttonTextZh = '拿起武器！';
  } else if (state.superEvent === 'spanish_civil_war_ends') {
    if (state.civilWarStatus === 'won') {
      title = 'Republican Victory';
      titleZh = '共和国的胜利';
      quote = '"We have won the war, but we must also win the peace. Let our victory be one of reconciliation, reconstruction, and liberty."';
      quoteZh = '“我们赢得了战争，但我们也必须赢得和平。让我们的胜利成为和解、重建与自由的胜利。”';
      image = 'img/Superevents/republican_victory.png';
      buttonText = 'Long Live the Republic!';
      buttonTextZh = '共和国万岁！';
    } else {
      title = 'Nationalist Victory';
      titleZh = '国民军的胜利';
      quote = '"En el día de hoy, cautivo y desarmado el Ejército Rojo, han alcanzado las tropas nacionales sus últimos objetivos militares. La guerra ha terminado." - Francisco Franco, 1939';
      quoteZh = '“在今天，随着红军被俘并解除武装，国民军已实现了其最后的军事目标。战争宣告结束。” —— 弗朗西斯科·佛朗哥，1939年';
      image = 'img/Superevents/nationalist_victory.png';
      buttonText = 'Vae Victis!';
      buttonTextZh = '战败者之哀！';
    }
  } else if (state.superEvent === 'abdication_alfonso') {
    title = 'Abdication of Alfonso XIII';
    titleZh = '阿方索十三世退位';
    quote = '"I expect to witness the real and proper expression of the collective conscience; when the nation speaks, I will voluntarily suspend the exercise of Royal power and leave Spain, thus acknowledging her as the sole mistress of her own destiny." - Alfonso XIII';
    quoteZh = '“我期待见证集体良知真实且恰当的表达；当国家发声之时，我将主动中止行使王权、离开西班牙，以此承认她是自身命运的唯一主宰。” —— 阿方索十三世';
    image = 'img/Superevents/abdication_alfonso.png';
    buttonText = 'Long Live the Republic!';
    buttonTextZh = '共和国万岁！';
  }

  const isZh = state.language === 'zh';
  const audioPath = `${(import.meta as any).env.BASE_URL || '/'}music/SuperEvent/${state.superEvent}.mp3`;

  const textShadowStyle = {
    textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 4px 12px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.9)'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <audio id="super-event-audio" src={audioPath} autoPlay />
      <motion.div 
        initial={{ opacity: 0, scale: scale * 0.9 }}
        animate={{ opacity: 1, scale: scale }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative shadow-2xl select-none shrink-0 overflow-hidden"
        style={{
          width: '960px',
          height: '720px',
        }}
      >
        {/* Layer 1: Event Image (z-10) */}
        <div 
          className="absolute overflow-hidden rounded-sm z-10"
          style={{
            left: '88.67px',
            top: '175.33px',
            width: '782.67px',
            height: '449.33px',
          }}
        >
          {/* Fallback if image doesn't exist */}
          <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center text-zinc-600 italic text-sm">
            [Image: {image}]
          </div>
          <img 
            src={`${(import.meta as any).env.BASE_URL || '/'}${image.startsWith('/') ? image.slice(1) : image}`} 
            alt={title} 
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Layer 2: Framework Overlay (z-20) */}
        <div 
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          style={{
            backgroundImage: `url(${(import.meta as any).env.BASE_URL || '/'}img/Superevents/Supereventsbox.png)`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Layer 3: Interactive Content Area (z-30) */}
        <div 
          className="absolute z-30"
          style={{
            left: '88.67px',
            top: '175.33px',
            width: '782.67px',
            height: '449.33px',
          }}
        >
          {/* Title Area: keep the heading in the upper part of the image. */}
          <div
            className="absolute inset-x-0 top-7 h-[60px] flex items-center justify-center px-10 text-center"
          >
            <h1 
              style={textShadowStyle}
              className="text-2xl md:text-3xl font-bold text-red-600 uppercase tracking-widest font-display leading-tight"
            >
              {isZh ? titleZh : title}
            </h1>
          </div>
          
          {/* Quote Area: anchor the description to the lower, darkened part of the image. */}
          <div
            className="absolute inset-x-0 bottom-[18px] h-[150px] flex items-end justify-center px-8 overflow-hidden"
          >
            <p 
              style={textShadowStyle}
              className="max-h-full max-w-[660px] overflow-hidden text-base md:text-lg italic text-zinc-100 font-serif leading-relaxed text-center"
            >
              {isZh ? quoteZh : quote}
            </p>
          </div>

        </div>

        {/* Button Area: place the action below the image, in the frame's lower paper margin. */}
        <div
          className="absolute inset-x-0 bottom-[36px] z-30 h-[55px] flex items-center justify-center"
        >
          <button
            onClick={() => dispatch({ type: 'DISMISS_SUPER_EVENT' })}
            type="button"
            className="w-[280px] h-[48px] flex items-center justify-center text-stone-100 hover:text-white hover:brightness-115 active:scale-95 cursor-pointer font-display font-extrabold uppercase transition-all duration-150 relative border-none outline-none bg-transparent"
            style={{
              backgroundImage: `url(${(import.meta as any).env.BASE_URL || '/'}img/Superevents/SupereventButton.png)`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] text-sm tracking-widest font-black px-4 text-center truncate">
              {isZh ? buttonTextZh : buttonText}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
