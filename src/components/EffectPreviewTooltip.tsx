import React from 'react';
import { EffectPreviewLine } from '../game/types';
import { formatEffectPreviewLine } from '../game/effectPreview';
import { cn } from '../lib/utils';

interface EffectPreviewTooltipProps {
  lines: EffectPreviewLine[];
  isZh: boolean;
}

export const EffectPreviewTooltip: React.FC<EffectPreviewTooltipProps> = ({ lines, isZh }) => {
  if (lines.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-0 top-full z-40 mt-2 hidden w-full max-w-[calc(100vw-3rem)] border border-ink bg-paper p-3 text-ink shadow-[3px_3px_0_0_rgba(30,28,26,1)] group-hover:block xl:left-full xl:top-1/2 xl:ml-3 xl:mt-0 xl:w-72 xl:-translate-y-1/2">
      <div className="mb-2 border-b border-ink/20 pb-1 font-typewriter text-[10px] uppercase tracking-widest text-ink/60">
        {isZh ? '选项效果' : 'Option Effects'}
      </div>
      <div className="flex flex-col gap-1.5">
        {lines.map((line, index) => (
          <div
            key={`${formatEffectPreviewLine(line, isZh)}-${index}`}
            className={cn(
              'flex items-start justify-between gap-3 font-mono text-[11px] leading-snug normal-case tracking-normal',
              line.tone === 'positive' && 'text-green-700',
              line.tone === 'negative' && 'text-cnt-red',
              line.tone === 'neutral' && 'text-ink'
            )}
          >
            <span>{formatEffectPreviewLine(line, isZh)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
