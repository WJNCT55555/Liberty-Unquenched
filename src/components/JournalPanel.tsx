import React, { useState, useEffect } from 'react';
import { useGame } from '../game/GameContext';
import { getJournalEntryDef } from '../game/journal';
import { ChevronRight, ChevronDown, Bookmark, AlertTriangle, GripVertical, CheckCircle2, XCircle } from 'lucide-react';

export const JournalPanel: React.FC = () => {
  const { state } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const entryIds = Object.keys(state.journal || {});

  // Update order when new entries appear
  useEffect(() => {
    setOrder(prev => {
      const newOrder = [...prev];
      for (const id of entryIds) {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      }
      return newOrder.filter(id => entryIds.includes(id));
    });
  }, [entryIds.join(',')]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Make the drag ghost image semi-transparent
    const target = e.target as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    setOrder(prev => {
      const newOrder = [...prev];
      const draggedIdx = newOrder.indexOf(draggedId);
      const targetIdx = newOrder.indexOf(targetId);
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedId);
      return newOrder;
    });
  };

  const renderEntry = (id: string) => {
    const entryState = state.journal[id];
    if (!entryState) return null;
    
    const def = getJournalEntryDef(entryState.id);
    if (!def) return null;

    const isZh = state.language === 'zh';
    const title = isZh ? def.titleZh : def.title;
    const description = isZh ? def.descriptionZh : def.description;
    const isExpanded = expandedIds.has(id);
    const fileCode = def.id.split('_').pop()?.substring(0, 6).toUpperCase() || 'DOC';

    return (
      <div 
        key={entryState.id} 
        draggable
        onDragStart={(e) => handleDragStart(e, id)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, id)}
        className={`relative mb-6 border-2 border-ink bg-paper shadow-[4px_4px_0px_#141414] group transition-all ${draggedId === id ? 'opacity-50 blur-sm scale-95' : 'hover:-translate-y-1 hover:shadow-[6px_6px_0px_#141414] cursor-pointer'}`}
        onClick={(e) => toggleExpand(id, e)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-paper-dark border-r-2 border-ink flex flex-col items-center py-3 cursor-grab active:cursor-grabbing text-ink/40 hover:text-ink/80 transition-colors">
          <GripVertical size={16} />
        </div>

        <div className="pl-8 p-4">
          <div className="absolute top-0 right-0 w-8 h-8 bg-paper-dark border-b-2 border-l-2 border-ink flex items-center justify-center shadow-[-2px_2px_0px_rgba(0,0,0,0.1)]">
              <span className="text-[8px] font-typewriter opacity-50 -rotate-45">{fileCode}</span>
          </div>

          <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-ink/20">
            <Bookmark size={14} className={entryState.status === 'active' ? 'text-ink fill-ink' : 'text-ink/30'} />
            <span className="font-typewriter text-[10px] font-bold uppercase tracking-widest opacity-80 flex-1">
              {isZh ? `档案编号 :: ${fileCode}` : `DOSSIER :: ${fileCode}`}
            </span>
            {isExpanded ? <ChevronDown size={18} className="text-ink/50" /> : <ChevronRight size={18} className="text-ink/50" />}
          </div>

          <h4 className="font-bold text-lg leading-tight uppercase pr-6 mb-2">{title}</h4>
          
          {entryState.status !== 'active' && (
            <div className={`mt-2 mb-2 w-max px-2 py-0.5 text-[10px] font-bold uppercase font-typewriter border-2 ${
              entryState.status === 'completed' ? 'text-green-700 border-green-700 bg-green-50' : 'text-cnt-red border-cnt-red bg-red-50'
            }`}>
              {isZh ? (entryState.status === 'completed' ? '已解决' : '已失败') : entryState.status}
            </div>
          )}

          {isExpanded && (
            <div className="mt-4 pt-2 border-t-2 border-dotted border-ink/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm opacity-85 mb-4 leading-relaxed font-serif text-justify border-l-2 border-ink/20 pl-2">
                  {description}
              </p>

              {(def.successCondition || def.failureCondition) && (
                <div className="mb-4 space-y-3 p-3 bg-paper-dark/50 border-2 border-ink/20 text-xs font-typewriter">
                  {def.successCondition && (
                    <div>
                      <div className="flex items-center gap-1.5 text-green-700 font-bold mb-1">
                        <CheckCircle2 size={14} />
                        <span>{isZh ? '达成条件' : 'SUCCESS CONDITION'}</span>
                      </div>
                      <div className="pl-5 opacity-90">{isZh ? def.successConditionZh : def.successCondition}</div>
                      <div className="pl-5 opacity-70 mt-0.5 text-green-700/80">» {isZh ? def.successEffectDescZh : def.successEffectDesc}</div>
                    </div>
                  )}
                  {def.failureCondition && (
                    <div className={def.successCondition ? 'pt-2 border-t border-ink/10' : ''}>
                      <div className="flex items-center gap-1.5 text-cnt-red font-bold mb-1">
                        <XCircle size={14} />
                        <span>{isZh ? '失败条件' : 'FAILURE CONDITION'}</span>
                      </div>
                      <div className="pl-5 opacity-90">{isZh ? def.failureConditionZh : def.failureCondition}</div>
                      <div className="pl-5 opacity-70 mt-0.5 text-cnt-red/80">» {isZh ? def.failureEffectDescZh : def.failureEffectDesc}</div>
                    </div>
                  )}
                </div>
              )}

              {def.hasProgress && entryState.status === 'active' && (
                <div className="mb-2 bg-paper-dark p-2 border-2 border-ink/30">
                  <div className="flex justify-between text-[10px] font-typewriter uppercase tracking-widest mb-1.5 font-bold">
                    <span>{isZh ? '进展' : 'PROGRESS'}</span>
                    <span>{Math.round((def.getProgress ? def.getProgress(state, entryState) : entryState.progress) / (def.progressMax || 100) * 100)}%</span>
                  </div>
                  <div className="w-full bg-ink/10 h-3 border border-ink relative overflow-hidden p-[1px]">
                    <div className="absolute inset-0 flex justify-between px-1 opacity-20 pointer-events-none">
                      {[...Array(10)].map((_, i) => <div key={i} className="w-px h-full bg-ink" />)}
                    </div>
                    <div 
                      className="bg-ink h-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${Math.min(100, Math.max(0, ((def.getProgress ? def.getProgress(state, entryState) : entryState.progress) / (def.progressMax || 100)) * 100))}%`,
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)'
                      }}
                    />
                  </div>
                </div>
              )}

              {entryState.status === 'active' && def.activeEffect && (
                <div className="mt-3 p-2 text-[11px] flex gap-2 border border-ink/20 bg-ink/5">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-ink/70" />
                  <span className="font-typewriter leading-tight opacity-90 font-bold">
                      {isZh ? def.activeEffect.descriptionZh : def.activeEffect.description}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`absolute right-0 top-16 bottom-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex ${
        isOpen ? "translate-x-0" : "translate-x-[380px]"
      }`}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-[42px] top-12 w-[42px] h-36 bg-paper border-l-2 border-y-2 border-ink flex flex-col items-center justify-center hover:bg-paper-dark cursor-pointer shadow-[-4px_4px_0px_rgba(20,20,20,1)] z-50 transition-colors"
      >
        <div style={{ writingMode: 'vertical-rl' }} className="font-typewriter tracking-widest font-bold uppercase text-ink flex items-center justify-center h-full text-sm">
          {isOpen ? <ChevronRight size={18} className="translate-x-0.5 rotate-[90deg] mb-3 opacity-60" /> : <ChevronRight size={18} className="translate-x-0.5 -rotate-90 mt-3 opacity-60" />}
          {state.language === 'zh' ? '档案记录' : 'JOURNAL'}
        </div>
      </button>

      <div className="w-[380px] bg-paper relative border-l-2 border-ink flex flex-col h-full shadow-[-8px_0_25px_-5px_rgba(0,0,0,0.3)]">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="p-6 border-b-2 border-ink bg-paper-dark relative z-10 shrink-0">
          <div className="font-typewriter text-[10px] text-ink/60 uppercase tracking-widest mb-2 border-b border-ink/20 inline-block pb-1">
            {state.language === 'zh' ? '社会与政治议题' : 'Social & Political Issues'}
          </div>
          <h3 className="font-bold text-3xl uppercase tracking-wider font-heading">
            {state.language === 'zh' ? '局势纪要' : 'Situation Log'}
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
          {order.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 opacity-40 border-2 border-dashed border-ink/30 p-6 bg-paper-dark m-2">
              <Bookmark size={32} className="mb-3 text-ink" />
              <p className="font-typewriter text-sm tracking-widest uppercase font-bold text-center">
                {state.language === 'zh' ? '尚无记录' : 'NO RECORDS FOUND'}
              </p>
            </div>
          ) : (
            order.map(renderEntry)
          )}
        </div>
      </div>
    </div>
  );
};

