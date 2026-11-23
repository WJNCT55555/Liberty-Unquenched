import React, { useState } from 'react';
import {
  X,
  Landmark,
  CalendarDays,
  Info,
} from 'lucide-react';
import type {
  GameState,
  Party,
  OrganizationId,
  OrganizationState,
  OrganizationType,
  SocialClass,
} from '../game/types';
import { COALITION_DEFS } from '../game/coalitions';
import { getPartySupport } from '../game/parties';
import { getPartyColor, getPartyName } from '../game/partyNames';
import { getPartyDescription } from '../game/partyProfiles';
import { getEffectiveCortes, getVacantCortesSeats, isRepublicanPartyPresent } from '../game/politicalEligibility';
import { calculateElectionResults, getCoalitionMembers } from '../game/utils';
import { CLASS_COLORS, CLASS_INFO } from '../game/constants';
import {
  ORGANIZATION_DEFINITIONS,
  getOrganizationIcon,
  isOrganizationActive,
} from '../game/organizations';
import {
  PARTY_IDEOLOGIES,
  PARTY_ORDER,
  getPartyIconPath,
  getRelationTier,
  type PartyKey,
} from '../game/partyDirectory';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  isZh: boolean;
}

type OrgStatus = NonNullable<OrganizationState['status']>;

const ORG_TYPE_LABELS: Record<OrganizationType, { zh: string; en: string }> = {
  union: { zh: '工会', en: 'Union' },
  political: { zh: '政治组织', en: 'Political' },
  youth: { zh: '青年组织', en: 'Youth' },
  women: { zh: '女性组织', en: 'Women' },
  agricultural: { zh: '农业组织', en: 'Agricultural' },
  militia: { zh: '民兵组织', en: 'Militia' },
  command: { zh: '指挥机构', en: 'Command' },
};

const ORG_STATUS_LABELS: Record<OrgStatus, { zh: string; en: string }> = {
  unformed: { zh: '未成立', en: 'Not established' },
  active: { zh: '活跃', en: 'Active' },
  integrated: { zh: '已整合', en: 'Integrated' },
  dissolved: { zh: '已解散', en: 'Dissolved' },
};

const ORG_STATUS_COLORS: Record<OrgStatus, string> = {
  active: '#1f573a',
  unformed: '#8a8175',
  integrated: '#9c7321',
  dissolved: '#5d574e',
};

const getOrgStatus = (organization?: OrganizationState): OrgStatus =>
  organization?.status ?? (organization?.established ? 'active' : 'unformed');

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#51335c]';

const PartySeal: React.FC<{
  state: GameState;
  party: PartyKey;
  isZh: boolean;
  size: number;
  muted?: boolean;
}> = ({ state, party, isZh, size, muted = false }) => {
  const [failed, setFailed] = useState(false);
  const path = getPartyIconPath(state, party);
  const color = getPartyColor(state, party);
  const shortName = getPartyName(state, party, isZh, true);
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';

  return (
    <span
      className={`parties-page__seal ${muted ? 'parties-page__seal--muted' : ''}`}
      style={{ width: size, height: size, '--seal-color': color } as React.CSSProperties}
    >
      {path && !failed ? (
        <img
          src={`${baseUrl}${path.replace(/^\/+/, '')}`}
          alt=""
          aria-hidden="true"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="px-0.5 text-center font-typewriter font-bold leading-none"
          style={{ color, fontSize: Math.max(7, Math.round(size * 0.17)) }}
        >
          {shortName}
        </span>
      )}
    </span>
  );
};

const OrganizationSeal: React.FC<{
  state: GameState;
  definition: (typeof ORGANIZATION_DEFINITIONS)[number];
  isZh: boolean;
  size: number;
  active: boolean;
}> = ({ state, definition, isZh, size, active }) => {
  const [failed, setFailed] = useState(false);
  const owner = state.organizations?.[definition.id]?.affiliatedOwner ?? definition.owner;
  const color = getPartyColor(state, owner);
  const path = getOrganizationIcon(state, definition.id);
  const label = definition.id === definition.owner
    ? getPartyName(state, definition.owner, isZh, true)
    : definition.abbreviation;
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';

  return (
    <span
      className={`parties-page__seal ${active ? '' : 'parties-page__seal--muted'}`}
      style={{ width: size, height: size, '--seal-color': color } as React.CSSProperties}
    >
      {path && !failed ? (
        <img
          src={`${baseUrl}${path.replace(/^\/+/, '')}`}
          alt=""
          aria-hidden="true"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="px-0.5 text-center font-typewriter font-bold leading-none"
          style={{ color, fontSize: Math.max(7, Math.round(size * 0.17)) }}
        >
          {label}
        </span>
      )}
    </span>
  );
};

export const PartiesOrganizationsModal: React.FC<Props> = ({ isOpen, onClose, state, isZh }) => {
  const [selectedParty, setSelectedParty] = useState<PartyKey>('CNT_FAI');
  const [selectedOrgId, setSelectedOrgId] = useState<OrganizationId | null>(null);

  if (!isOpen) return null;

  const allOrganizations = ORGANIZATION_DEFINITIONS;
  const activeOrgCount = allOrganizations.filter(definition => isOrganizationActive(state, definition.id)).length;

  const chamberSeats = (state.polity?.type === 'free_commune_federation'
    ? state.polity.congressSeats
    : state.polity?.type === 'council_republic'
      ? state.polity.cecSeats
      : undefined) as Record<string, number> | undefined;

  const effectiveCortes = getEffectiveCortes(state, state.cortes || calculateElectionResults(state));
  const vacantSeats = getVacantCortesSeats(state);
  const totalSeats = chamberSeats
    ? Object.values(chamberSeats).reduce((sum, count) => sum + count, 0)
    : Object.values(effectiveCortes).reduce((sum, count) => sum + count, 0) + vacantSeats;

  const seatOf = (party: PartyKey): number => {
    if (chamberSeats) {
      const key = party === 'CNT_FAI'
        ? (state.organizations?.PRRevS?.established ? 'PRRevS' : 'CNT')
        : party;
      return chamberSeats[key] ?? 0;
    }
    if (party === 'CNT_FAI') {
      return state.organizations?.PRRevS?.established ? (effectiveCortes.PRRevS ?? 0) : 0;
    }
    return effectiveCortes[party as Party] ?? 0;
  };

  const supportOf = (party: PartyKey): number => (
    party === 'CNT_FAI' && state.organizations?.PRRevS?.established
      ? getPartySupport(state, 'PRRevS')
      : getPartySupport(state, party)
  );

  const presentParties = PARTY_ORDER.filter(party => (
    party === 'CNT_FAI' || isRepublicanPartyPresent(state, party)
  ));
  const effectiveParty = presentParties.includes(selectedParty) ? selectedParty : presentParties[0];

  const coalitionByParty = new Map<PartyKey, { id: string; name: string; isRuling: boolean }>();
  for (const coalition of state.activeCoalitions ?? []) {
    const definition = COALITION_DEFS.find(item => item.id === coalition.activeId);
    if (!definition) continue;
    const isRuling = state.rulingCoalition === coalition.activeId;
    for (const member of getCoalitionMembers(state, coalition) as PartyKey[]) {
      const existing = coalitionByParty.get(member);
      if (!existing || isRuling) {
        coalitionByParty.set(member, {
          id: definition.id,
          name: isZh ? definition.nameZh : definition.name,
          isRuling,
        });
      }
    }
  }

  const actualOwnerOf = (definition: (typeof ORGANIZATION_DEFINITIONS)[number]): PartyKey => (
    (state.organizations?.[definition.id]?.affiliatedOwner ?? definition.owner) as PartyKey
  );

  const partyOrganizations = effectiveParty
    ? allOrganizations.filter(definition => actualOwnerOf(definition) === effectiveParty)
    : [];
  const activePartyOrganizations = partyOrganizations.filter(definition => isOrganizationActive(state, definition.id)).length;
  const selectedOrganization = partyOrganizations.find(definition => definition.id === selectedOrgId) ?? null;

  const partyRelation = effectiveParty === 'CNT_FAI'
    ? null
    : (state.partyRelations?.[effectiveParty as Exclude<Party, 'PRRevS'>] ?? 0);
  const relationTier = partyRelation !== null ? getRelationTier(partyRelation) : null;

  const partySupport = effectiveParty ? supportOf(effectiveParty) : 0;
  const partySeats = effectiveParty ? seatOf(effectiveParty) : 0;
  const partySeatPct = totalSeats > 0 ? (partySeats / totalSeats) * 100 : 0;
  const partyCoalition = effectiveParty ? coalitionByParty.get(effectiveParty) : undefined;

  const classRows = (() => {
    if (!effectiveParty) return [] as { classId: SocialClass; share: number }[];
    return (Object.keys(state.classes) as SocialClass[])
      .map(classId => {
        const supportMap = state.classes[classId]?.support as Record<string, number> | undefined;
        const values = Object.values(supportMap ?? {});
        const total = values.reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0) || 1;
        const raw = supportMap?.[effectiveParty] ?? 0;
        return { classId, share: (raw / total) * 100, raw };
      })
      .filter(row => row.raw > 0)
      .sort((left, right) => right.share - left.share)
      .slice(0, 4)
      .map(({ classId, share }) => ({ classId, share }));
  })();

  const coalitionBadge = (party: PartyKey) => {
    const coalition = coalitionByParty.get(party);
    if (coalition) {
      return {
        label: coalition.isRuling ? (isZh ? '执政联盟' : 'Governing') : (isZh ? '在野联盟' : 'Opposition'),
        color: coalition.isRuling ? '#7d2226' : '#51335c',
      };
    }
    if (party === 'CNT_FAI' && !state.organizations?.PRRevS?.established) {
      return { label: isZh ? '院外运动' : 'Extra-parliamentary', color: '#5d574e' };
    }
    return { label: isZh ? '未结盟' : 'Non-aligned', color: '#8a8175' };
  };

  const partySeatLabel = (party: PartyKey) => {
    if (party === 'CNT_FAI' && !state.organizations?.PRRevS?.established) {
      return isZh ? '院外' : 'EXT';
    }
    return isZh ? `${seatOf(party)} 席` : `${seatOf(party)} seats`;
  };

  const selectParty = (party: PartyKey) => {
    setSelectedParty(party);
    setSelectedOrgId(null);
  };

  const selectedPartyIndex = presentParties.indexOf(effectiveParty);
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';
  const dossierMark = (path?: string) => (
    path ? `url("${baseUrl}${path.replace(/^\/+/, '')}")` : 'none'
  );
  const partyMark = effectiveParty ? dossierMark(getPartyIconPath(state, effectiveParty)) : 'none';

  const selectedOrgStatus = selectedOrganization
    ? getOrgStatus(state.organizations?.[selectedOrganization.id])
    : null;
  const selectedOrgActive = selectedOrganization
    ? isOrganizationActive(state, selectedOrganization.id)
    : false;
  const selectedOrgEstablished = selectedOrganization
    ? state.organizations?.[selectedOrganization.id]?.establishedAt
    : undefined;

  return (
    <div className="law-page game-modal-backdrop parties-page fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="law-page__window flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden">
        <div className="law-page__tricolor shrink-0" aria-hidden="true" />

        <header className="shrink-0 border-b-[3px] border-double border-[#524c44] bg-[#f0e9da] px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[24px] font-bold uppercase leading-none tracking-[0.06em] text-[#211f1c] md:text-[30px]">
                {isZh ? '政治力量与组织登记册' : 'Political Forces & Organizations Register'}
              </h2>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#5d574e]">
                <span>{isZh ? `${state.year}年${state.month}月` : `${state.month}/${state.year}`}</span>
                <span className="h-3 w-px bg-[#8a8175]" aria-hidden="true" />
                <span>{isZh ? `${presentParties.length} 个政治力量` : `${presentParties.length} political forces`}</span>
                <span className="h-3 w-px bg-[#8a8175]" aria-hidden="true" />
                <span>{isZh ? `${allOrganizations.length} 个组织` : `${allOrganizations.length} organizations`}</span>
                <span className="h-3 w-px bg-[#8a8175]" aria-hidden="true" />
                <span>{isZh ? `${activeOrgCount} 个活跃` : `${activeOrgCount} active`}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`shrink-0 border border-[#524c44] bg-[#dcd2bc] p-1.5 text-[#211f1c] transition-colors hover:bg-[#d0c3a8] ${focusRing}`}
              aria-label={isZh ? '关闭' : 'Close'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="law-page__sheet min-h-0 flex-1 p-3 md:p-4">
          <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
            <aside className="flex min-h-0 w-full max-h-[42vh] shrink-0 flex-col border border-[#524c44] bg-[#f0e9da] lg:max-h-none lg:w-[350px] xl:w-[375px]">
              <div className="shrink-0 border-b border-[#524c44] border-t-2 border-t-[#51335c] bg-[#e6decb] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.22em] text-[#51335c]">
                      Índice de fuerzas políticas
                    </div>
                    <h3 className="mt-1 font-serif text-[15px] font-bold leading-none text-[#211f1c]">
                      {isZh ? '政治力量索引' : 'Political Forces Index'}
                    </h3>
                  </div>
                  <span className="font-mono text-[9px] text-[#5d574e]">{presentParties.length}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-[#524c44]/25 bg-[#ede3cd] px-3 py-1 font-typewriter text-[7px] uppercase tracking-[0.16em] text-[#5d574e]">
                <span>{isZh ? '政治力量' : 'Political force'}</span>
                <span>{isZh ? '民意 / 席位' : 'Support / seats'}</span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {presentParties.map(party => {
                  const selected = party === effectiveParty;
                  const color = getPartyColor(state, party);
                  const support = supportOf(party);
                  return (
                    <button
                      key={party}
                      type="button"
                      onClick={() => selectParty(party)}
                      data-selected={selected ? 'true' : 'false'}
                      aria-pressed={selected}
                      className={`parties-page__row flex w-full items-center gap-2.5 border-b border-[#524c44]/15 border-l-[3px] px-3 py-2 text-left transition-colors ${focusRing} ${
                        selected ? 'bg-[#fdfaf3]' : 'hover:bg-[#f7f2e7]'
                      }`}
                      style={{ borderLeftColor: color }}
                    >
                      <PartySeal state={state} party={party} isZh={isZh} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[13px] font-bold leading-tight text-[#211f1c]">
                          {getPartyName(state, party, isZh, true)}
                        </span>
                        <span className="mt-0.5 block truncate text-[8px] leading-none text-[#5d574e]">
                          {isZh ? PARTY_IDEOLOGIES[party].zh : PARTY_IDEOLOGIES[party].en}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono text-[10.5px] font-bold leading-none text-[#211f1c]">
                          {support.toFixed(1)}%
                        </span>
                        <span className="mt-1 block font-mono text-[7.5px] uppercase leading-none text-[#5d574e]">
                          {partySeatLabel(party)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-0 md:pr-0.5">
              {effectiveParty && (
                <article
                  className="law-page__card parties-page__dossier min-h-full px-4 pb-4 pt-5 md:px-5 md:pb-5"
                  style={{ '--dossier-mark': partyMark } as React.CSSProperties}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-[4px]"
                    style={{ backgroundColor: getPartyColor(state, effectiveParty) }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-start gap-4">
                    <PartySeal key={effectiveParty} state={state} party={effectiveParty} isZh={isZh} size={96} />
                    <div className="min-w-0 flex-1">
                      <div className="font-typewriter text-[8px] uppercase leading-none tracking-[0.22em] text-[#8a8175]">
                        {isZh ? '政治力量卷宗' : 'Political force dossier'}
                        {' · '}
                        {String(selectedPartyIndex + 1).padStart(2, '0')}/{String(presentParties.length).padStart(2, '0')}
                      </div>
                      <h3 className="mt-1.5 font-serif text-[30px] font-bold leading-none text-[#211f1c]">
                        {getPartyName(state, effectiveParty, isZh, true)}
                      </h3>
                      <p className="mt-1.5 text-[10px] leading-snug text-[#5d574e]">
                        {getPartyName(state, effectiveParty, isZh)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="border border-[#524c44]/50 bg-[#f0e9da] px-1.5 py-0.5 text-[8.5px] font-semibold text-[#3c3832]">
                          {isZh ? PARTY_IDEOLOGIES[effectiveParty].zh : PARTY_IDEOLOGIES[effectiveParty].en}
                        </span>
                        <span
                          className="border px-1.5 py-0.5 font-typewriter text-[8px] font-bold uppercase tracking-[0.08em]"
                          style={{
                            color: coalitionBadge(effectiveParty).color,
                            borderColor: coalitionBadge(effectiveParty).color,
                          }}
                        >
                          {coalitionBadge(effectiveParty).label}
                        </span>
                      </div>
                      {partyCoalition && (
                        <p className="mt-2 flex items-center gap-1.5 text-[9.5px] text-[#5d574e]">
                          <Landmark className="h-3 w-3 shrink-0" />
                          {isZh ? '当前联盟：' : 'Current alliance: '}
                          <span className="font-semibold text-[#211f1c]">{partyCoalition.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#524c44]/25 pt-3">
                    <p className="font-serif text-[13px] leading-relaxed text-[#3c3832]">
                      {getPartyDescription(state, effectiveParty, isZh)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="border border-[#524c44]/35 bg-[#f0e9da] px-2.5 py-2">
                      <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                        {isZh ? '民意支持' : 'Public support'}
                      </div>
                      <div className="mt-1 font-mono text-[18px] font-bold leading-none text-[#211f1c]">
                        {partySupport.toFixed(1)}%
                      </div>
                      <div className="mt-1 text-[7.5px] text-[#8a8175]">{isZh ? '全国' : 'Nationwide'}</div>
                    </div>
                    <div className="border border-[#524c44]/35 bg-[#f0e9da] px-2.5 py-2">
                      <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                        {isZh ? '议会席位' : 'Cortes seats'}
                      </div>
                      <div className="mt-1 font-mono text-[18px] font-bold leading-none text-[#211f1c]">
                        {effectiveParty === 'CNT_FAI' && !state.organizations?.PRRevS?.established ? '—' : partySeats}
                      </div>
                      <div className="mt-1 text-[7.5px] text-[#8a8175]">
                        {effectiveParty === 'CNT_FAI' && !state.organizations?.PRRevS?.established
                          ? (isZh ? '院外组织' : 'Extra-parliamentary')
                          : `${partySeatPct.toFixed(1)}% ${isZh ? '席位' : 'of chamber'}`}
                      </div>
                    </div>
                    <div className="border border-[#524c44]/35 bg-[#f0e9da] px-2.5 py-2">
                      <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                        {isZh ? '与 CNT 关系' : 'Relation to CNT'}
                      </div>
                      <div
                        className="mt-1 font-mono text-[18px] font-bold leading-none"
                        style={{ color: relationTier?.color ?? '#5d574e' }}
                      >
                        {partyRelation === null ? '—' : partyRelation}
                      </div>
                      <div className="mt-1 text-[7.5px]" style={{ color: relationTier?.color ?? '#5d574e' }}>
                        {relationTier ? (isZh ? relationTier.zh : relationTier.en) : (isZh ? '本组织' : 'Own movement')}
                      </div>
                    </div>
                    <div className="border border-[#524c44]/35 bg-[#f0e9da] px-2.5 py-2">
                      <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                        {isZh ? '旗下组织' : 'Organizations'}
                      </div>
                      <div className="mt-1 font-mono text-[18px] font-bold leading-none text-[#211f1c]">
                        {partyOrganizations.length}
                      </div>
                      <div className="mt-1 text-[7.5px] text-[#8a8175]">
                        {isZh ? `${activePartyOrganizations} 个活跃` : `${activePartyOrganizations} active`}
                      </div>
                    </div>
                  </div>

                  <section className="mt-3 border border-[#524c44]/35 bg-[#f0e9da] p-3">
                    <div className="flex items-baseline justify-between gap-2 border-b border-[#524c44]/20 pb-1.5">
                      <h4 className="font-typewriter text-[8px] uppercase tracking-[0.16em] text-[#51335c]">
                        {isZh ? '社会基础' : 'Class base'}
                      </h4>
                      <span className="text-[7px] text-[#8a8175]">
                        {isZh ? '各阶级内支持份额' : 'Share within each class'}
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-2">
                      {classRows.length === 0 && (
                        <p className="py-2 text-center text-[9px] text-[#8a8175]">
                          {isZh ? '暂无阶级支持数据。' : 'No class support recorded.'}
                        </p>
                      )}
                      {classRows.map(row => (
                        <div key={row.classId} className="grid grid-cols-[70px_minmax(0,1fr)_34px] items-center gap-2">
                          <span className="flex min-w-0 items-center gap-1">
                            <span className="h-1.5 w-1.5 shrink-0" style={{ backgroundColor: CLASS_COLORS[row.classId] }} />
                            <span className="truncate text-[9px] leading-none text-[#3c3832]">
                              {isZh ? CLASS_INFO[row.classId].nameZh : CLASS_INFO[row.classId].nameEn}
                            </span>
                          </span>
                          <span className="h-2 overflow-hidden border border-[#524c44]/40 bg-[#e6decb]">
                            <span
                              className="block h-full"
                              style={{ width: `${Math.min(100, row.share)}%`, backgroundColor: CLASS_COLORS[row.classId] }}
                            />
                          </span>
                          <span className="text-right font-mono text-[8px] text-[#5d574e]">
                            {row.share.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="mt-3 border border-[#524c44]/35 bg-[#f0e9da] p-3">
                    <div className="flex items-baseline justify-between gap-2 border-b border-[#524c44]/20 pb-1.5">
                      <h4 className="font-typewriter text-[8px] uppercase tracking-[0.16em] text-[#51335c]">
                        {isZh ? '附属组织' : 'Affiliated organizations'}
                      </h4>
                      <span className="font-mono text-[8px] text-[#8a8175]">
                        {activePartyOrganizations}/{partyOrganizations.length}
                      </span>
                    </div>
                    {partyOrganizations.length === 0 ? (
                      <p className="py-3 text-[9px] leading-relaxed text-[#8a8175]">
                        {isZh ? '该政治力量目前没有登记组织。' : 'No organizations registered under this political force.'}
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
                        {partyOrganizations.map(definition => {
                          const status = getOrgStatus(state.organizations?.[definition.id]);
                          const active = isOrganizationActive(state, definition.id);
                          const selected = definition.id === selectedOrgId;
                          const abbreviation = definition.id === definition.owner
                            ? getPartyName(state, definition.owner, isZh, true)
                            : definition.abbreviation;
                          const name = isZh ? definition.nameZh : definition.name;
                          const effect = isZh ? definition.monthlyEffectTextZh : definition.monthlyEffectText;
                          return (
                            <button
                              key={definition.id}
                              type="button"
                              onClick={() => setSelectedOrgId(selected ? null : definition.id)}
                              data-selected={selected ? 'true' : 'false'}
                              aria-pressed={selected}
                              title={`${name} · ${isZh ? ORG_STATUS_LABELS[status].zh : ORG_STATUS_LABELS[status].en} · ${effect}`}
                              className={`parties-page__row flex w-[70px] shrink-0 flex-col items-center border px-1 py-1.5 transition-colors ${focusRing} ${
                                selected
                                  ? 'border-[#51335c] bg-[#fdfaf3]'
                                  : 'border-[#524c44]/25 bg-[#f7f2e7] hover:border-[#524c44] hover:bg-[#fdfaf3]'
                              }`}
                            >
                              <OrganizationSeal state={state} definition={definition} isZh={isZh} size={32} active={active} />
                              <span className="mt-1 w-full truncate text-center font-typewriter text-[7.5px] font-bold leading-none text-[#211f1c]">
                                {abbreviation}
                              </span>
                              <span
                                className="mt-1 h-1.5 w-1.5 rounded-full border border-[#2a2723]"
                                style={{ backgroundColor: ORG_STATUS_COLORS[status] }}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedOrganization && selectedOrgStatus && (
                      <div className="mt-2 border border-[#524c44]/30 bg-[#f7f2e7] p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-serif text-[13px] font-bold leading-tight text-[#211f1c]">
                              {isZh ? selectedOrganization.nameZh : selectedOrganization.name}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] text-[#5d574e]">
                              <span>{isZh ? ORG_TYPE_LABELS[selectedOrganization.type].zh : ORG_TYPE_LABELS[selectedOrganization.type].en}</span>
                              <span>·</span>
                              <span style={{ color: ORG_STATUS_COLORS[selectedOrgStatus] }}>
                                {isZh ? ORG_STATUS_LABELS[selectedOrgStatus].zh : ORG_STATUS_LABELS[selectedOrgStatus].en}
                              </span>
                              {selectedOrgEstablished && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <CalendarDays className="h-2.5 w-2.5" />
                                    {isZh
                                      ? `${selectedOrgEstablished.year}年${selectedOrgEstablished.month}月`
                                      : `${selectedOrgEstablished.year}-${String(selectedOrgEstablished.month).padStart(2, '0')}`}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedOrgId(null)}
                            className={`shrink-0 border border-[#8a8175]/60 p-0.5 text-[#5d574e] hover:border-[#524c44] ${focusRing}`}
                            aria-label={isZh ? '收起组织档案' : 'Close organization record'}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        <div className="mt-2 border-t border-[#524c44]/20 pt-1.5">
                          <span className="font-typewriter text-[7px] uppercase tracking-[0.14em] text-[#755118]">
                            {isZh ? '月度效果' : 'Monthly effect'}
                          </span>
                          <p className="mt-1 font-mono text-[10px] leading-relaxed text-[#3c3832]">
                            {isZh ? selectedOrganization.monthlyEffectTextZh : selectedOrganization.monthlyEffectText}
                          </p>
                          {!selectedOrgActive && (
                            <p className="mt-1 text-[8px] text-[#7d2226]">
                              {isZh ? '仅在组织活跃时结算。' : 'Settles only while the organization is active.'}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 border-t border-[#524c44]/20 pt-1.5">
                          <span className="font-typewriter text-[7px] uppercase tracking-[0.14em] text-[#51335c]">
                            {isZh ? '组织能力' : 'Capability'}
                          </span>
                          <p className="mt-1 text-[9px] leading-relaxed text-[#3c3832]">
                            {(isZh ? selectedOrganization.capabilityTextZh : selectedOrganization.capabilityText)
                              || (isZh ? '无特别能力记录。' : 'No special capability recorded.')}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <p className="flex items-center gap-1.5 text-[7.5px] uppercase tracking-[0.12em] text-[#8a8175]">
                      <Info className="h-2.5 w-2.5" />
                      {isZh ? '登记册会随局势与组织成立情况更新' : 'The register follows the current political situation'}
                    </p>
                    <span
                      className="parties-page__stamp shrink-0"
                      style={{ color: getPartyColor(state, effectiveParty) }}
                    >
                      {isZh ? '登记在册' : 'Registered'}
                    </span>
                  </div>
                </article>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
