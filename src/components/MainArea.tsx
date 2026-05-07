import React from 'react';
import { useGame } from '../game/GameContext';
import { Card, GameEvent } from '../game/types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { EventBoard } from './EventBoard';

export const MainArea = () => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';

  return (
    <div className="flex-1 flex flex-col p-8 relative overflow-y-auto bg-halftone">
      
      {/* Header for Phase */}
      <div className="absolute top-8 right-8 text-right">
        <h2 className="font-display text-5xl uppercase text-ink opacity-20 tracking-widest">
          {state.phase === 'event' 
            ? (isZh ? '事件阶段' : 'Event Phase') 
            : (isZh ? '行动阶段' : 'Action Phase')}
        </h2>
        {state.phase === 'action' && (
          <p className="font-typewriter text-lg font-bold text-cnt-red">
            {isZh ? `剩余行动点: ${state.actionsLeft}` : `Actions Remaining: ${state.actionsLeft}`}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {state.currentEvent ? (
          <EventModal key="event" event={state.currentEvent} />
        ) : state.phase === 'event' && state.pendingEvents.length > 0 ? (
          <EventBoard key="event-board" />
        ) : state.phase === 'action' ? (
          <motion.div 
            key="action"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-center items-center gap-8 w-full"
          >
            <div className="flex flex-col items-center gap-12 w-full max-w-7xl">
              {/* Decks (Top Layer) */}
              <div className="flex flex-row gap-8 justify-center">
                <DeckView type="Action" />
                <DeckView type="Governmental" />
                {state.civilWarStatus !== 'not_started' && (
                  <DeckView type="Military" />
                )}
              </div>
              
              {/* Hand (Middle Layer) */}
              <div className="w-full flex justify-center">
                <div className="flex flex-row flex-wrap justify-center gap-6">
                  {state.hand.map((card) => (
                    <CardView key={card.id} card={card} />
                  ))}
                  {/* Empty slots placeholders */}
                  {Array.from({ length: (state.difficulty === 'hard' ? 3 : 4) - state.hand.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-2 border-dashed border-ink opacity-20 w-48 aspect-[2/3] flex items-center justify-center">
                      <span className="font-typewriter text-sm uppercase tracking-widest text-center">
                        {isZh ? '空手牌槽' : 'Empty Slot'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {state.actionsLeft === 0 && (
              <button
                onClick={() => dispatch({ type: 'NEXT_PHASE' })}
                className="mt-8 px-8 py-4 bg-cnt-red text-paper font-display text-2xl uppercase tracking-widest border-print hover:bg-ink transition-colors"
              >
                {isZh ? '结束回合' : 'End Turn'}
              </button>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const EventModal: React.FC<{ event: GameEvent }> = ({ event }) => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="m-auto bg-paper border-print p-8 max-w-2xl shadow-2xl relative z-10"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-cnt-red"></div>
      <h3 className="font-display text-4xl uppercase mb-4 text-ink leading-none">
        {isZh && event.titleZh ? event.titleZh : event.title}
      </h3>
      <div className="max-h-[40vh] overflow-y-auto mb-8 border-l-4 border-ink pl-4">
        <p className="font-serif text-xl leading-relaxed italic">
          {isZh && event.descriptionZh ? event.descriptionZh : event.description}
        </p>
        {event.renderContent && (
          <div className="mt-6">
            {event.renderContent(state)}
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-4">
        {event.options.map((opt, idx) => {
          const isAvailable = !opt.condition || opt.condition(state);
          return (
            <button
              key={idx}
              disabled={!isAvailable}
              onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: opt.effect })}
              className={cn(
                "text-left p-4 border transition-colors font-typewriter text-sm uppercase tracking-wider relative group overflow-hidden",
                isAvailable 
                  ? "border-ink hover:bg-ink hover:text-paper" 
                  : "border-ink-light opacity-50 cursor-not-allowed"
              )}
            >
              <div className="relative z-10 flex flex-col">
                <span className="font-bold">
                  {isZh && opt.textZh ? opt.textZh : opt.text}
                </span>
                {(opt.subtitle || opt.subtitleZh) && isAvailable && (
                  <span className="text-xs mt-1 normal-case font-serif italic opacity-80">
                    {isZh && opt.subtitleZh ? opt.subtitleZh : opt.subtitle}
                  </span>
                )}
                {!isAvailable && (
                  <span className="text-[10px] text-cnt-red mt-1 normal-case font-serif italic">
                    {isZh && opt.unavailableSubtitleZh 
                      ? opt.unavailableSubtitleZh(state) 
                      : opt.unavailableSubtitle 
                        ? opt.unavailableSubtitle(state) 
                        : (isZh ? '条件未满足' : 'Condition not met')}
                  </span>
                )}
              </div>
              {isAvailable && (
                <div className="absolute inset-0 bg-cnt-red transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-0 opacity-20"></div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

const DeckView: React.FC<{ type: 'Action' | 'Governmental' | 'Military' }> = ({ type }) => {
  const { state, dispatch } = useGame();
  const isZh = state.language === 'zh';
  const handLimit = state.difficulty === 'hard' ? 3 : 4;
  const canDraw = state.hand.length < handLimit;
  
  const typeName = isZh 
    ? (type === 'Action' ? '行动卡牌' : type === 'Governmental' ? '政府卡牌' : '武装卡牌')
    : (type === 'Action' ? 'Action Deck' : type === 'Governmental' ? 'Gov Deck' : 'Mil Deck');

  const getBgColor = () => {
    if (type === 'Action') return "bg-cnt-red border-ink text-paper";
    if (type === 'Governmental') return "bg-ink border-cnt-red text-paper";
    return "bg-amber-900 border-ink text-paper"; // Military deck color
  };

  return (
    <button
      onClick={() => dispatch({ type: 'DRAW_CARD', payload: type })}
      disabled={!canDraw}
      className={cn(
        "w-48 aspect-[2/3] border-2 flex flex-col items-center justify-center p-4 transition-all relative overflow-hidden",
        getBgColor(),
        canDraw ? "hover:-translate-y-2 hover:shadow-xl cursor-pointer" : "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')]"></div>
      <span className="font-display text-2xl text-center relative z-10 leading-none">{typeName}</span>
      <span className="font-typewriter text-[10px] mt-4 opacity-80 uppercase tracking-widest relative z-10">
        {isZh ? '点击抽取' : 'Draw Card'}
      </span>
    </button>
  );
};

  const CardView: React.FC<{ card: Card }> = ({ card }) => {
    const { state, dispatch } = useGame();
    const isZh = state.language === 'zh';
    const isPlayable = state.actionsLeft >= card.cost && 
                       (card.resourceCost === undefined || state.resources >= card.resourceCost) &&
                       (card.armamentCost === undefined || state.armaments >= card.armamentCost) &&
                       (card.condition === undefined || card.condition(state));
  
    const typeName = isZh 
      ? (card.type === 'Action' ? '行动事务' : card.type === 'Military' ? '武装事务' : '政府事务')
      : card.type;
  
    return (
      <motion.div
        whileHover={isPlayable ? { y: -10, rotate: -2 } : {}}
        className={cn(
          "bg-paper p-6 flex flex-col w-48 aspect-[2/3] relative shadow-lg transition-opacity",
          card.type === 'Action' ? "border-print-red" : "border-print",
          !isPlayable && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="font-typewriter text-[10px] uppercase tracking-widest bg-ink text-paper px-2 py-1">
            {typeName}
          </span>
          <div className="flex flex-col items-end gap-1">
            <span className="font-display text-xl">{card.cost} AP</span>
            {card.resourceCost !== undefined && card.resourceCost > 0 && (
              <span className="font-typewriter text-xs text-yellow-600">{card.resourceCost} {isZh ? '资源' : 'Res'}</span>
            )}
            {card.armamentCost !== undefined && card.armamentCost > 0 && (
              <span className="font-typewriter text-xs text-gray-600">{card.armamentCost} {isZh ? '军备' : 'Arm'}</span>
            )}
          </div>
        </div>
        
        <h4 className="font-display text-2xl uppercase mb-2 leading-tight">
          {isZh && card.titleZh ? card.titleZh : card.title}
        </h4>
        
        <div className="w-full h-px bg-ink opacity-20 mb-4"></div>
        
        <p className="font-serif text-sm flex-1">
          {isZh && card.descriptionZh ? card.descriptionZh : card.description}
        </p>
        
        <button
          disabled={!isPlayable}
          onClick={() => dispatch({ type: 'PLAY_CARD', payload: card })}
          className="mt-4 w-full py-2 border border-ink font-typewriter text-xs uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          {isZh ? '打出卡牌' : 'Play Card'}
        </button>
      </motion.div>
    );
  };
