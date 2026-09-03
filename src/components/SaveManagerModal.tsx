import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Download, HardDrive, Pencil, Save, Trash2, X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useGame } from '../game/GameContext';
import {
  clearManualSaveSlot,
  readSaveLibrary,
  renameManualSaveSlot,
  writeManualSave,
  type SaveLibrary,
  type SaveRecord,
} from '../game/saveGame';

interface SaveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isZh: boolean;
  canSaveManual: boolean;
  canLoadManual: boolean;
}

const difficultyLabels = {
  easy: ['Easy', '简单'],
  normal: ['Normal', '标准'],
  hard: ['Hard', '困难'],
  historical: ['Historical', '历史'],
  sandbox: ['Sandbox', '沙盒'],
} as const;

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  isOpen,
  onClose,
  isZh,
  canSaveManual,
  canLoadManual,
}) => {
  const { state, loadSave } = useGame();
  const [library, setLibrary] = useState<SaveLibrary>(() => readSaveLibrary());
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLibrary(readSaveLibrary());
    const refresh = () => setLibrary(readSaveLibrary());
    window.addEventListener('cnt-fai-save-library-changed', refresh);
    return () => window.removeEventListener('cnt-fai-save-library-changed', refresh);
  }, [isOpen]);

  const locale = isZh ? 'zh-CN' : 'en-US';
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }), [locale]);

  if (!isOpen) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2600);
  };

  const loadRecord = (record: SaveRecord) => {
    const result = loadSave(record.snapshot);
    if (!result.ok && 'error' in result) {
      showMessage(isZh ? `读取失败：${result.error}` : `Load failed: ${result.error}`);
      return;
    }
    onClose();
  };

  const saveToSlot = (slotId: string) => {
    try {
      setLibrary(writeManualSave(slotId, state));
      showMessage(isZh ? '存档已写入。' : 'Game saved.');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : (isZh ? '保存失败。' : 'Save failed.'));
    }
  };

  const beginRename = (slotId: string, currentName: string) => {
    setEditingSlotId(slotId);
    setDraftName(currentName);
  };

  const finishRename = (slotId: string) => {
    try {
      setLibrary(renameManualSaveSlot(slotId, draftName));
      setEditingSlotId(null);
      showMessage(isZh ? '槽位已重命名。' : 'Slot renamed.');
    } catch (error) {
      showMessage(error instanceof Error ? error.message : (isZh ? '重命名失败。' : 'Rename failed.'));
    }
  };

  const deleteSlot = (slotId: string) => {
    const confirmed = window.confirm(isZh ? '确定清空这个存档槽位吗？' : 'Clear this save slot?');
    if (!confirmed) return;
    setLibrary(clearManualSaveSlot(slotId));
    showMessage(isZh ? '槽位已清空。' : 'Slot cleared.');
  };

  const formatRecord = (record: SaveRecord) => {
    const difficulty = difficultyLabels[record.summary.difficulty];
    return `${record.summary.year}.${String(record.summary.month).padStart(2, '0')} · ${record.summary.scenario} · ${isZh ? difficulty[1] : difficulty[0]}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/70 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        className="bg-paper text-ink border-print w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col relative"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-5 md:p-7 border-b-2 border-ink flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wider">
              {isZh ? '存档管理' : 'Save Archives'}
            </h2>
            <p className="font-typewriter text-xs opacity-60 mt-1">
              {isZh ? '自动存档可随时读取；手动槽位可以重命名。' : 'Autosaves are loadable; manual slots can be renamed.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:text-cnt-red transition-colors" aria-label={isZh ? '关闭' : 'Close'}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 md:p-7 overflow-y-auto space-y-5">
          <section>
            <h3 className="font-display text-xl uppercase tracking-widest mb-2 flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-cnt-red" />
              {isZh ? '自动存档' : 'Autosave'}
            </h3>
            <div className="border-2 border-ink p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-ink/5">
              {library.autosave ? (
                <>
                  <div className="min-w-0">
                    <div className="font-display text-xl">{isZh ? '最近的自动存档' : 'Latest Autosave'}</div>
                    <div className="font-typewriter text-xs mt-1">{formatRecord(library.autosave)}</div>
                    <div className="font-typewriter text-[11px] opacity-55 mt-1">{dateFormatter.format(new Date(library.autosave.savedAt))}</div>
                  </div>
                  <button
                    onClick={() => loadRecord(library.autosave!)}
                    className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-ink text-paper hover:bg-cnt-red transition-colors font-typewriter uppercase"
                  >
                    <Download className="w-4 h-4" />
                    {isZh ? '读取' : 'Load'}
                  </button>
                </>
              ) : (
                <div className="font-typewriter text-sm opacity-55">
                  {isZh ? '进入游戏后会自动建立，并在状态变化后更新。' : 'Created after entering a game and updated after state changes.'}
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="font-display text-xl uppercase tracking-widest mb-2 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cnt-red" />
              {isZh ? '手动存档槽位' : 'Manual Save Slots'}
            </h3>
            {!canSaveManual && state.screen === 'game' && (
              <p className="font-typewriter text-xs text-cnt-red mb-3">
                {isZh ? '当前模式采用铁人规则：只能读取自动存档，不能写入或读取手动档。' : 'Ironman rules: only the autosave can be loaded; manual saves are locked.'}
              </p>
            )}
            <div className="space-y-3">
              {library.manualSlots.map((slot) => (
                <div key={slot.id} className="border-2 border-ink/80 p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {editingSlotId === slot.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') finishRename(slot.id);
                            if (event.key === 'Escape') setEditingSlotId(null);
                          }}
                          maxLength={40}
                          autoFocus
                          className="w-full bg-transparent border-b-2 border-ink px-1 py-0.5 font-display text-xl outline-none focus:border-cnt-red"
                        />
                        <button onClick={() => finishRename(slot.id)} className="p-1 hover:text-cnt-red" aria-label={isZh ? '确认重命名' : 'Confirm rename'}>
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xl truncate">{slot.name}</span>
                        <button onClick={() => beginRename(slot.id, slot.name)} className="p-1 opacity-55 hover:opacity-100 hover:text-cnt-red" aria-label={isZh ? '重命名' : 'Rename'}>
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {slot.record ? (
                      <>
                        <div className="font-typewriter text-xs mt-1">{formatRecord(slot.record)}</div>
                        <div className="font-typewriter text-[11px] opacity-55 mt-1">{dateFormatter.format(new Date(slot.record.savedAt))}</div>
                      </>
                    ) : (
                      <div className="font-typewriter text-xs opacity-45 mt-1">{isZh ? '空槽位' : 'Empty slot'}</div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {canSaveManual && (
                      <button
                        onClick={() => saveToSlot(slot.id)}
                        className="flex items-center gap-1.5 px-3 py-2 border-2 border-ink hover:bg-ink hover:text-paper transition-colors font-typewriter text-xs uppercase"
                      >
                        <Save className="w-4 h-4" />
                        {slot.record ? (isZh ? '覆盖' : 'Overwrite') : (isZh ? '保存' : 'Save')}
                      </button>
                    )}
                    {slot.record && canLoadManual && (
                      <button
                        onClick={() => loadRecord(slot.record!)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-ink text-paper hover:bg-cnt-red transition-colors font-typewriter text-xs uppercase"
                      >
                        <Download className="w-4 h-4" />
                        {isZh ? '读取' : 'Load'}
                      </button>
                    )}
                    {slot.record && canSaveManual && (
                      <button
                        onClick={() => deleteSlot(slot.id)}
                        className="p-2 border-2 border-cnt-red text-cnt-red hover:bg-cnt-red hover:text-paper transition-colors"
                        aria-label={isZh ? '清空槽位' : 'Clear slot'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {message && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-cnt-red text-paper px-4 py-2 font-typewriter text-sm shadow-lg max-w-[90%] text-center">
            {message}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
