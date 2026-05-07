import React from 'react';
import { useGame } from '../game/GameContext';
import { motion } from 'motion/react';

export const SuperEvent: React.FC = () => {
  const { state, dispatch } = useGame();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border-2 border-red-800 p-6 max-w-3xl w-full text-center shadow-2xl shadow-red-900/50"
      >
        <h1 className="text-4xl font-bold text-red-600 mb-6 uppercase tracking-widest">
          {isZh ? titleZh : title}
        </h1>
        
        <div className="relative w-full h-80 mb-6 border border-zinc-700 overflow-hidden bg-zinc-800 flex items-center justify-center">
          {/* Fallback if image doesn't exist */}
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 italic">
            [Image: {image}]
          </div>
          <img 
            src={image} 
            alt={title} 
            className="relative z-10 w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
            onError={(e) => {
              // Hide broken image icon
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="mb-8">
          <p className="text-xl italic text-zinc-300 font-serif">
            {isZh ? quoteZh : quote}
          </p>
        </div>

        <button
          onClick={() => dispatch({ type: 'DISMISS_SUPER_EVENT' })}
          className="px-8 py-3 bg-red-800 hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-colors border border-red-600"
        >
          {isZh ? buttonTextZh : buttonText}
        </button>
      </motion.div>
    </div>
  );
};
