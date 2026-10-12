import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Info, Network } from 'lucide-react';
import { ORGANIZATION_DEFINITIONS, getOrganizationIcon, isOrganizationActive, type OrganizationDefinition } from '../game/organizations';
import { getPartyColor, getPartyName, PARTY_NAMES_MAPPING } from '../game/partyNames';
import { getPartyDescription } from '../game/partyProfiles';
import type { GameState, OrganizationOwner, OrganizationState, OrganizationType } from '../game/types';

const TYPE_LABELS: Record<OrganizationType, { zh: string; en: string }> = {
  union: { zh: '工会', en: 'Union' },
  political: { zh: '政治组织', en: 'Political organization' },
  youth: { zh: '青年组织', en: 'Youth organization' },
  women: { zh: '女性组织', en: 'Women’s organization' },
  agricultural: { zh: '农业组织', en: 'Agricultural organization' },
  militia: { zh: '民兵组织', en: 'Militia' },
  command: { zh: '指挥机构', en: 'Command body' },
};

type OrganizationStatus = NonNullable<OrganizationState['status']>;

const STATUS_LABELS: Record<OrganizationStatus, { zh: string; en: string }> = {
  unformed: { zh: '未成立', en: 'Not established' },
  active: { zh: '活跃', en: 'Active' },
  integrated: { zh: '已整合', en: 'Integrated' },
  dissolved: { zh: '已解散', en: 'Dissolved' },
};

const STATUS_DOTS: Record<OrganizationStatus, string> = {
  active: 'bg-green-700 border-green-900/30',
  unformed: 'bg-paper border-ink/40',
  integrated: 'bg-amber-600 border-amber-800/30',
  dissolved: 'bg-ink/35 border-ink/30',
};

const getStatus = (organization?: OrganizationState): OrganizationStatus =>
  organization?.status ?? (organization?.established ? 'active' : 'unformed');

const getAbbreviation = (definition: OrganizationDefinition, state: GameState) =>
  definition.id === definition.owner ? getPartyName(state, definition.owner, false, true) : definition.abbreviation;

const OrganizationEmblem = ({ path, abbreviation, color, active }: { path?: string; abbreviation: string; color: string; active: boolean }) => {
  const [failedPath, setFailedPath] = useState<string>();
  const showImage = path && failedPath !== path;
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';

  return (
    <span className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-ink/20 bg-paper shadow-[inset_0_0_0_4px_#e8ddc3,0_2px_3px_#2b2b2b15] transition-transform duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:group-focus-visible:-translate-y-1 ${active ? '' : 'opacity-55 grayscale'}`}>
      {showImage ? (
        <img src={`${baseUrl}${path.replace(/^\/+/, '')}`} alt="" aria-hidden="true" className="h-[60px] w-[60px] object-contain" onError={() => setFailedPath(path)} />
      ) : (
        <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-dashed px-1 font-typewriter text-xs font-bold leading-tight" style={{ borderColor: color, color }}>{abbreviation}</span>
      )}
    </span>
  );
};

type OpenOrganization = { definition: OrganizationDefinition; anchor: HTMLButtonElement };

const OrganizationTooltip: React.FC<{ open: OpenOrganization; state: GameState; isZh: boolean }> = ({ open, state, isZh }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>();
  const { definition, anchor } = open;
  const language = isZh ? 'zh' : 'en';
  const organization = state.organizations?.[definition.id];
  const status = getStatus(organization);
  const active = isOrganizationActive(state, definition.id);
  const color = getPartyColor(state, definition.owner);
  const capability = isZh ? definition.capabilityTextZh : definition.capabilityText;

  useLayoutEffect(() => {
    if (!ref.current) return;
    const badge = anchor.getBoundingClientRect();
    const tooltip = ref.current.getBoundingClientRect();
    const below = badge.bottom + 10;
    const top = below + tooltip.height <= window.innerHeight - 12 ? below : badge.top - tooltip.height - 10;
    setPosition({
      top: Math.max(12, Math.min(top, window.innerHeight - tooltip.height - 12)),
      left: Math.max(12, Math.min(badge.left + badge.width / 2 - tooltip.width / 2, window.innerWidth - tooltip.width - 12)),
    });
  }, [anchor, definition, isZh, state]);

  // The portal keeps the description clear of the politics panel's scroll clipping.
  return createPortal(
    <div ref={ref} id={`organization-tooltip-${definition.id}`} role="tooltip" className="pointer-events-none fixed z-[100] w-80 max-w-[calc(100vw-24px)] border border-ink/60 bg-paper p-4 text-ink shadow-[4px_4px_0_#2b2b2b30]" style={{ ...position, visibility: position ? 'visible' : 'hidden', borderTop: `3px solid ${color}` }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-typewriter text-base font-bold">{getAbbreviation(definition, state)}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-light">
          <span className={`h-2 w-2 rounded-full border ${STATUS_DOTS[status]}`} />
          {STATUS_LABELS[status][language]}
        </span>
      </div>
      <p className="text-sm font-bold leading-relaxed">{isZh ? definition.nameZh : definition.name}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-light">{TYPE_LABELS[definition.type][language]} · {getPartyName(state, definition.owner, isZh, true)}</p>
      {organization?.established && organization.establishedAt && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-light">
          <CalendarDays className="h-3 w-3 shrink-0" />
          {isZh ? `成立于 ${organization.establishedAt.year} 年 ${organization.establishedAt.month} 月` : `Established ${organization.establishedAt.year}-${String(organization.establishedAt.month).padStart(2, '0')}`}
        </p>
      )}
      <div className="mt-3 border-t border-ink/20 pt-3">
        <p className="mb-1 text-xs font-bold">{isZh ? '月度效果' : 'Monthly effect'}</p>
        <p className="text-xs leading-relaxed">{isZh ? definition.monthlyEffectTextZh : definition.monthlyEffectText}</p>
        {!active && <p className="mt-1.5 text-[11px] leading-relaxed text-ink-light">{isZh ? '当前不生效，仅在组织活跃时结算。' : 'Currently inactive. Applies only while the organization is active.'}</p>}
      </div>
      {capability && <p className="mt-3 border-t border-ink/10 pt-2 text-xs leading-relaxed text-ink-light"><span className="font-bold">{isZh ? '组织能力：' : 'Capability: '}</span>{capability}</p>}
    </div>,
    document.body,
  );
};

export const PoliticalOrganizations = ({ state, isZh }: { state: GameState; isZh: boolean }) => {
  const [open, setOpen] = useState<OpenOrganization | null>(null);
  const language = isZh ? 'zh' : 'en';
  const owners: OrganizationOwner[] = [...new Set<OrganizationOwner>([
    ...ORGANIZATION_DEFINITIONS.map(definition => definition.owner),
    ...(Object.keys(PARTY_NAMES_MAPPING) as OrganizationOwner[]).filter(owner => owner !== 'PRRevS'),
  ])];
  const activeCount = ORGANIZATION_DEFINITIONS.filter(definition => isOrganizationActive(state, definition.id)).length;

  useEffect(() => {
    if (!open) return;
    const dismiss = () => setOpen(null);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <section className="lg:col-span-12 border-2 border-ink bg-paper p-4 shadow-sm sm:p-5" aria-labelledby="political-organizations-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink/60 pb-3">
        <div>
          <h3 id="political-organizations-title" className="flex items-center gap-2 font-typewriter text-lg font-bold">
            <Network className="h-5 w-5 text-ink-light" />
            {isZh ? '政治力量与组织' : 'Political forces & organizations'}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-light"><Info className="h-3 w-3" />{isZh ? '悬浮或点按徽章，查看组织档案与月度效果' : 'Hover or tap an emblem for its profile and monthly effects'}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs font-bold">{isZh ? `${owners.length} 个政治力量 · ${ORGANIZATION_DEFINITIONS.length} 个组织 · ${activeCount} 个活跃` : `${owners.length} forces · ${ORGANIZATION_DEFINITIONS.length} organizations · ${activeCount} active`}</p>
          <div className="mt-2 flex flex-wrap justify-end gap-x-3 gap-y-1 text-[10px] text-ink-light">
            {(Object.keys(STATUS_LABELS) as OrganizationStatus[]).map(status => (
              <span key={status} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full border ${STATUS_DOTS[status]}`} />{STATUS_LABELS[status][language]}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {owners.map(owner => {
          const definitions = ORGANIZATION_DEFINITIONS.filter(definition => definition.owner === owner);
          const color = getPartyColor(state, owner);
          const groupActiveCount = definitions.filter(definition => isOrganizationActive(state, definition.id)).length;
          return (
            <article key={owner} data-political-force={owner} className="min-w-0 w-full border border-ink/20 bg-ink/[0.02] px-3 pb-3 pt-3 sm:px-4">
              <div className="mb-3 border-b border-ink/15 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h4 className="border-l-[3px] pl-2 font-typewriter text-sm font-bold leading-relaxed" style={{ borderColor: color }}>{getPartyName(state, owner, isZh)}</h4>
                  <span className="shrink-0 pt-0.5 font-mono text-[10px] text-ink-light">{isZh ? `${definitions.length} 个组织 · ${groupActiveCount} 个活跃` : `${definitions.length} organizations · ${groupActiveCount} active`}</span>
                </div>
                <p className="mt-2 pl-2.5 text-xs leading-relaxed text-ink-light" data-political-force-description>{getPartyDescription(state, owner, isZh)}</p>
              </div>
              <p className="mb-1.5 pl-2 text-[10px] font-bold tracking-wider text-ink-light">{isZh ? '旗下组织' : 'Affiliated organizations'}</p>
              {definitions.length === 0 && <p className="px-2 py-3 text-xs text-ink-light">{isZh ? '暂无登记组织。' : 'No registered organizations.'}</p>}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {definitions.map(definition => {
                  const active = isOrganizationActive(state, definition.id);
                  const status = getStatus(state.organizations?.[definition.id]);
                  const selected = open?.definition.id === definition.id;
                  const abbreviation = getAbbreviation(definition, state);
                  const name = isZh ? definition.nameZh : definition.name;
                  return (
                    <button key={definition.id} type="button" data-organization-id={definition.id} data-organization-status={status} aria-label={`${name} · ${STATUS_LABELS[status][language]}`} aria-describedby={selected ? `organization-tooltip-${definition.id}` : undefined}
                      onMouseEnter={event => setOpen({ definition, anchor: event.currentTarget })} onMouseLeave={() => setOpen(null)} onFocus={event => setOpen({ definition, anchor: event.currentTarget })} onBlur={() => setOpen(null)} onClick={event => setOpen({ definition, anchor: event.currentTarget })}
                      className={`group flex w-[88px] shrink-0 flex-col items-center rounded-sm border px-1 pb-1.5 pt-2 text-ink transition-colors hover:bg-paper focus-visible:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected ? 'bg-paper border-ink/25' : 'border-transparent'}`}>
                      <span className="relative">
                        <OrganizationEmblem path={getOrganizationIcon(state, definition.id)} abbreviation={abbreviation} color={color} active={active} />
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-paper ring-1 ring-ink/15 ${STATUS_DOTS[status]}`} />
                      </span>
                      <span className={`mt-2 w-full break-words text-center font-typewriter text-[11px] font-bold leading-tight ${active ? 'text-ink' : 'text-ink-light'}`}>{abbreviation}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
      {open && <OrganizationTooltip key={open.definition.id} open={open} state={state} isZh={isZh} />}
    </section>
  );
};
