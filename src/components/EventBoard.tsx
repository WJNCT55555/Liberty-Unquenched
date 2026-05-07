import React from 'react';
import { useGame } from '../game/GameContext';
import { motion } from 'motion/react';

export const EventBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';

  if (state.pendingEvents.length === 0 || state.currentEvent) return null;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="m-auto bg-paper border-print p-8 max-w-2xl w-full shadow-2xl relative z-10"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-cnt-red"></div>
      <h2 className="font-display text-4xl uppercase mb-4 text-ink leading-none">
        {isZh ? '事件看板' : 'Event Board'}
      </h2>
      
      <p className="font-serif text-xl leading-relaxed mb-8 border-l-4 border-ink pl-4 italic">
        {isZh ? '本月发生了以下事件，请逐一处理：' : 'The following events occurred this month. Please handle them one by one:'}
      </p>

      <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-2">
        {state.pendingEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => dispatch({ type: 'SELECT_EVENT', payload: { eventId: event.id } })}
            className="w-full text-left p-4 bg-transparent border-2 border-ink hover:bg-ink hover:text-paper transition-colors flex justify-between items-center group"
          >
            <span className="font-display text-xl uppercase tracking-widest">
              {isZh && event.titleZh ? event.titleZh : event.title}
            </span>
            <span className="font-typewriter text-sm tracking-widest">
              {isZh ? '查看' : 'VIEW'} &rarr;
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
