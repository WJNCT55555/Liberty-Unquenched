import React, { useState } from 'react';
import {
  X,
  Users,
  Network,
  Landmark,
  CalendarDays,
  ChevronRight,
  ShieldCheck,
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

type Mode = 'parties' | 'organizations';
type OrgStatus = NonNullable<OrganizationState['status']>;
type OrgTypeFilter = 'all' | OrganizationType;

const ORG_TYPE_ORDER: OrganizationType[] = ['union', 'political', 'youth', 'women', 'agricultural', 'militia', 'command'];

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
  const [mode, setMode] = useState<Mode>('parties');
  const [selectedParty, setSelectedParty] = useState<PartyKey>('CNT_FAI');
  const [selectedOrgId, setSelectedOrgId] = useState<OrganizationId>('CNT');
  const [orgType, setOrgType] = useState<OrgTypeFilter>('all');

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

  const organizationsOf = (owner: PartyKey) => allOrganizations.filter(
    definition => actualOwnerOf(definition) === owner,
  );

  const partyOrganizations = effectiveParty ? organizationsOf(effectiveParty) : [];
  const activePartyOrganizations = partyOrganizations.filter(definition => isOrganizationActive(state, definition.id)).length;

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

  const filteredOrganizations = orgType === 'all'
    ? allOrganizations
    : allOrganizations.filter(definition => definition.type === orgType);

  const selectedOrganization = filteredOrganizations.find(definition => definition.id === selectedOrgId)
    ?? filteredOrganizations[0]
    ?? allOrganizations[0];

  const organizationGroups = (() => {
    const owners = [
      ...PARTY_ORDER,
      ...Array.from(new Set(filteredOrganizations.map(actualOwnerOf)))
        .filter(owner => !PARTY_ORDER.includes(owner)),
    ] as PartyKey[];
    return owners
      .map(owner => ({
        owner,
        organizations: filteredOrganizations.filter(definition => actualOwnerOf(definition) === owner),
      }))
      .filter(group => group.organizations.length > 0);
  })();

  const selectedOrganizationOwner = selectedOrganization ? actualOwnerOf(selectedOrganization) : 'CNT_FAI';
  const selectedOrganizationStatus = selectedOrganization ? getOrgStatus(state.organizations?.[selectedOrganization.id]) : 'unformed';
  const selectedOrganizationActive = selectedOrganization ? isOrganizationActive(state, selectedOrganization.id) : false;
  const siblingOrganizations = selectedOrganization
    ? allOrganizations.filter(definition => (
      definition.id !== selectedOrganization.id
      && actualOwnerOf(definition) === selectedOrganizationOwner
    ))
    : [];

  const selectOrganization = (id: OrganizationId) => {
    setSelectedOrgId(id);
    setOrgType('all');
  };

  const goToOwnerParty = (owner: PartyKey) => {
    if (!presentParties.includes(owner)) return;
    setSelectedParty(owner);
    setMode('parties');
  };

  const partySeatLabel = (party: PartyKey) => {
    if (party === 'CNT_FAI' && !state.organizations?.PRRevS?.established) {
      return isZh ? '院外' : 'EXT';
    }
    return isZh ? `${seatOf(party)} 席` : `${seatOf(party)} seats`;
  };

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

  const selectedPartyIndex = presentParties.indexOf(effectiveParty);
  const selectedOrgIndex = allOrganizations.findIndex(definition => definition.id === selectedOrganization?.id);
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';
  const dossierMark = (path?: string) => (
    path ? `url("${baseUrl}${path.replace(/^\/+/, '')}")` : 'none'
  );
  const partyMark = effectiveParty ? dossierMark(getPartyIconPath(state, effectiveParty)) : 'none';
  const organizationMark = selectedOrganization ? dossierMark(getOrganizationIcon(state, selectedOrganization.id)) : 'none';

  return (
    <div className="law-page law-page__backdrop parties-page fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="law-page__window flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden">
        <div className="law-page__tricolor shrink-0" aria-hidden="true" />

        <header className="shrink-0 border-b-[3px] border-double border-[#524c44] bg-[#f0e9da] px-4 py-3 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="font-typewriter text-[9px] uppercase leading-none tracking-[0.3em] text-[#51335c]">
                Fuerzas políticas y organizaciones · Registro 1931
              </div>
              <h2 className="mt-2 font-serif text-[23px] font-bold uppercase leading-none tracking-[0.06em] text-[#211f1c] md:text-[29px]">
                {isZh ? '政治力量与组织登记册' : 'Political Forces & Organizations Register'}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#5d574e]">
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

        <div className="shrink-0 border-b border-[#524c44] bg-[#e6decb] px-3 pt-2 md:px-5">
          <div className="flex flex-wrap items-end gap-1" role="tablist" aria-label={isZh ? '登记册视图' : 'Register view'}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'parties'}
              onClick={() => setMode('parties')}
              className={`flex items-center gap-2 border px-3.5 py-2 font-serif text-[13px] font-bold transition-colors ${focusRing} ${
                mode === 'parties'
                  ? 'border-[#2a2723] border-b-[#f0e9da] bg-[#f0e9da] text-[#211f1c]'
                  : 'border-[#524c44]/35 bg-[#dcd2bc]/60 text-[#5d574e] hover:bg-[#e9dfc9]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{isZh ? '政治力量' : 'Forces'}</span>
              <span className="border border-current px-1 font-mono text-[8px] leading-none">{presentParties.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'organizations'}
              onClick={() => setMode('organizations')}
              className={`flex items-center gap-2 border px-3.5 py-2 font-serif text-[13px] font-bold transition-colors ${focusRing} ${
                mode === 'organizations'
                  ? 'border-[#2a2723] border-b-[#f0e9da] bg-[#f0e9da] text-[#211f1c]'
                  : 'border-[#524c44]/35 bg-[#dcd2bc]/60 text-[#5d574e] hover:bg-[#e9dfc9]'
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>{isZh ? '组织' : 'Organizations'}</span>
              <span className="border border-current px-1 font-mono text-[8px] leading-none">{allOrganizations.length}</span>
            </button>
            <span className="ml-auto hidden pb-2 font-typewriter text-[7px] uppercase tracking-[0.18em] text-[#5d574e] sm:block">
              {isZh ? '档案索引 · 选择条目查看卷宗' : 'Archive index · select an entry for its dossier'}
            </span>
          </div>
        </div>

        <div className="law-page__sheet min-h-0 flex-1 p-3 md:p-4">
          <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
            <aside className="flex min-h-0 w-full max-h-[42vh] shrink-0 flex-col border border-[#524c44] bg-[#f0e9da] lg:max-h-none lg:w-[350px] xl:w-[375px]">
              <div className="shrink-0 border-b border-[#524c44] border-t-2 border-t-[#51335c] bg-[#e6decb] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.22em] text-[#51335c]">
                      {mode === 'parties' ? 'Índice de fuerzas políticas' : 'Índice de organizaciones'}
                    </div>
                    <h3 className="mt-1 font-serif text-[15px] font-bold leading-none text-[#211f1c]">
                      {mode === 'parties'
                        ? (isZh ? '政治力量索引' : 'Political Forces Index')
                        : (isZh ? '组织索引' : 'Organization Index')}
                    </h3>
                  </div>
                  <span className="font-mono text-[9px] text-[#5d574e]">
                    {mode === 'parties' ? presentParties.length : filteredOrganizations.length}
                  </span>
                </div>
                {mode === 'organizations' && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setOrgType('all')}
                      className={`border px-1.5 py-0.5 font-sans text-[8px] font-semibold transition-colors ${focusRing} ${
                        orgType === 'all'
                          ? 'border-[#51335c] bg-[#51335c] text-[#f7f2e7]'
                          : 'border-[#524c44]/40 bg-[#f0e9da] text-[#3c3832] hover:border-[#524c44]'
                      }`}
                    >
                      {isZh ? '全部' : 'All'} {allOrganizations.length}
                    </button>
                    {ORG_TYPE_ORDER.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrgType(type)}
                        className={`border px-1.5 py-0.5 font-sans text-[8px] font-semibold transition-colors ${focusRing} ${
                          orgType === type
                            ? 'border-[#51335c] bg-[#51335c] text-[#f7f2e7]'
                            : 'border-[#524c44]/40 bg-[#f0e9da] text-[#3c3832] hover:border-[#524c44]'
                        }`}
                      >
                        {isZh ? ORG_TYPE_LABELS[type].zh : ORG_TYPE_LABELS[type].en}
                        {' '}{allOrganizations.filter(definition => definition.type === type).length}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {mode === 'parties' ? (
                  <>
                    <div className="flex items-center justify-between gap-2 border-b border-[#524c44]/25 bg-[#ede3cd] px-3 py-1 font-typewriter text-[7px] uppercase tracking-[0.16em] text-[#5d574e]">
                      <span>{isZh ? '政治力量' : 'Political force'}</span>
                      <span>{isZh ? '民意 / 席位' : 'Support / seats'}</span>
                    </div>
                    {presentParties.map(party => {
                      const selected = party === effectiveParty;
                      const color = getPartyColor(state, party);
                      const support = supportOf(party);
                      return (
                        <button
                          key={party}
                          type="button"
                          onClick={() => setSelectedParty(party)}
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
                  </>
                ) : (
                  organizationGroups.map(group => {
                    const ownerColor = getPartyColor(state, group.owner);
                    const activeCount = group.organizations.filter(definition => isOrganizationActive(state, definition.id)).length;
                    return (
                      <section key={group.owner}>
                        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-y border-[#524c44]/20 bg-[#e6decb]/95 px-2.5 py-1.5 backdrop-blur-[1px]">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <PartySeal state={state} party={group.owner} isZh={isZh} size={18} />
                            <span className="truncate font-typewriter text-[8px] font-bold uppercase tracking-[0.08em] text-[#3c3832]">
                              {getPartyName(state, group.owner, isZh, true)}
                            </span>
                          </span>
                          <span className="font-mono text-[8px] text-[#8a8175]">{activeCount}/{group.organizations.length}</span>
                        </header>
                        {group.organizations.map(definition => {
                          const selected = definition.id === selectedOrganization?.id;
                          const status = getOrgStatus(state.organizations?.[definition.id]);
                          const active = isOrganizationActive(state, definition.id);
                          const name = isZh ? definition.nameZh : definition.name;
                          return (
                            <button
                              key={definition.id}
                              type="button"
                              onClick={() => setSelectedOrgId(definition.id)}
                              data-selected={selected ? 'true' : 'false'}
                              aria-pressed={selected}
                              className={`parties-page__row flex w-full items-center gap-2.5 border-b border-[#524c44]/15 border-l-[3px] px-3 py-2 text-left transition-colors ${focusRing} ${
                                selected ? 'bg-[#fdfaf3]' : 'hover:bg-[#f7f2e7]'
                              }`}
                              style={{ borderLeftColor: ownerColor }}
                            >
                              <OrganizationSeal state={state} definition={definition} isZh={isZh} size={30} active={active} />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="truncate font-typewriter text-[9.5px] font-bold leading-none text-[#211f1c]">
                                    {definition.id === definition.owner
                                      ? getPartyName(state, definition.owner, isZh, true)
                                      : definition.abbreviation}
                                  </span>
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full border" style={{ backgroundColor: ORG_STATUS_COLORS[status], borderColor: '#2a2723' }} />
                                  {definition.uiVisibility === 'internal' && (
                                    <span className="shrink-0 border border-[#8a8175] px-0.5 font-typewriter text-[6px] uppercase leading-none text-[#5d574e]">
                                      {isZh ? '内' : 'I'}
                                    </span>
                                  )}
                                </span>
                                <span className="mt-1 block truncate text-[8.5px] leading-none text-[#5d574e]">{name}</span>
                              </span>
                              <ChevronRight className="h-3 w-3 shrink-0 text-[#8a8175]" />
                            </button>
                          );
                        })}
                      </section>
                    );
                  })
                )}
              </div>
            </aside>

            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-0 md:pr-0.5">
              {mode === 'parties' && effectiveParty && (
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

                  <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <section className="border border-[#524c44]/35 bg-[#f0e9da] p-3">
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

                    <section className="border border-[#524c44]/35 bg-[#f0e9da] p-3">
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
                        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {partyOrganizations.map(definition => {
                            const active = isOrganizationActive(state, definition.id);
                            return (
                              <button
                                key={definition.id}
                                type="button"
                                onClick={() => {
                                  selectOrganization(definition.id);
                                  setMode('organizations');
                                }}
                                className={`flex min-w-0 items-center gap-2 border border-[#524c44]/25 bg-[#f7f2e7] px-1.5 py-1 text-left transition-colors hover:border-[#524c44] hover:bg-[#fdfaf3] ${focusRing}`}
                              >
                                <OrganizationSeal state={state} definition={definition} isZh={isZh} size={24} active={active} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-typewriter text-[8px] font-bold leading-none text-[#211f1c]">
                                    {definition.id === definition.owner
                                      ? getPartyName(state, definition.owner, isZh, true)
                                      : definition.abbreviation}
                                  </span>
                                  <span className="mt-1 block truncate text-[7.5px] leading-none text-[#5d574e]">
                                    {isZh ? definition.nameZh : definition.name}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>

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

              {mode === 'organizations' && selectedOrganization && (
                <article
                  className="law-page__card parties-page__dossier min-h-full px-4 pb-4 pt-5 md:px-5 md:pb-5"
                  style={{ '--dossier-mark': organizationMark } as React.CSSProperties}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-[4px]"
                    style={{ backgroundColor: getPartyColor(state, selectedOrganizationOwner) }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-start gap-4">
                    <OrganizationSeal
                      key={selectedOrganization.id}
                      state={state}
                      definition={selectedOrganization}
                      isZh={isZh}
                      size={96}
                      active={selectedOrganizationActive}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-typewriter text-[8px] uppercase leading-none tracking-[0.22em] text-[#8a8175]">
                        {isZh ? '组织卷宗' : 'Organization dossier'}
                        {' · '}
                        {String(selectedOrgIndex + 1).padStart(2, '0')}/{String(allOrganizations.length).padStart(2, '0')}
                      </div>
                      <h3 className="mt-1.5 font-serif text-[30px] font-bold leading-none text-[#211f1c]">
                        {selectedOrganization.id === selectedOrganization.owner
                          ? getPartyName(state, selectedOrganization.owner, isZh, true)
                          : selectedOrganization.abbreviation}
                        <span className="ml-2 align-middle font-sans text-[10px] font-normal normal-case text-[#5d574e]">
                          {isZh ? ORG_TYPE_LABELS[selectedOrganization.type].zh : ORG_TYPE_LABELS[selectedOrganization.type].en}
                        </span>
                      </h3>
                      <p className="mt-1.5 text-[10px] leading-snug text-[#5d574e]">
                        {isZh ? selectedOrganization.nameZh : selectedOrganization.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className="flex items-center gap-1 border px-1.5 py-0.5 font-typewriter text-[8px] font-bold uppercase tracking-[0.08em]"
                          style={{
                            color: ORG_STATUS_COLORS[selectedOrganizationStatus],
                            borderColor: ORG_STATUS_COLORS[selectedOrganizationStatus],
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full border border-[#2a2723]"
                            style={{ backgroundColor: ORG_STATUS_COLORS[selectedOrganizationStatus] }}
                          />
                          {isZh ? ORG_STATUS_LABELS[selectedOrganizationStatus].zh : ORG_STATUS_LABELS[selectedOrganizationStatus].en}
                        </span>
                        {selectedOrganization.uiVisibility === 'internal' && (
                          <span className="border border-[#8a8175] px-1.5 py-0.5 font-typewriter text-[7px] uppercase tracking-[0.08em] text-[#5d574e]">
                            {isZh ? '内部组织' : 'Internal'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => goToOwnerParty(selectedOrganizationOwner)}
                          className={`flex items-center gap-1 border border-[#524c44]/40 bg-[#f0e9da] px-1.5 py-0.5 text-[8px] text-[#3c3832] transition-colors ${presentParties.includes(selectedOrganizationOwner) ? 'hover:border-[#524c44] hover:bg-[#fdfaf3]' : 'cursor-default opacity-80'} ${focusRing}`}
                        >
                          <PartySeal key={selectedOrganizationOwner} state={state} party={selectedOrganizationOwner} isZh={isZh} size={16} />
                          {getPartyName(state, selectedOrganizationOwner, isZh, true)}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="border border-[#524c44]/35 bg-[#f0e9da] px-2.5 py-2">
                      <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                        {isZh ? '组织类型' : 'Category'}
                      </div>
                      <div className="mt-1 font-serif text-[13px] font-bold leading-none text-[#211f1c]">
                        {isZh ? ORG_TYPE_LABELS[selectedOrganization.type].zh : ORG_TYPE_LABELS[selectedOrganization.type].en}
                      </div>
                    </div>
                    <div className="border border-[#524c44]/35 bg-[#f0e9da] px-2.5 py-2">
                      <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                        {isZh ? '状态' : 'Status'}
                      </div>
                      <div className="mt-1 font-serif text-[13px] font-bold leading-none" style={{ color: ORG_STATUS_COLORS[selectedOrganizationStatus] }}>
                        {isZh ? ORG_STATUS_LABELS[selectedOrganizationStatus].zh : ORG_STATUS_LABELS[selectedOrganizationStatus].en}
                      </div>
                    </div>
                    <div className="border border-[#524c44]/35 bg-[#f0e9da] px-2.5 py-2">
                      <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                        {isZh ? '成立时间' : 'Established'}
                      </div>
                      <div className="mt-1 flex items-center gap-1 font-mono text-[11px] font-bold leading-none text-[#211f1c]">
                        <CalendarDays className="h-3 w-3 text-[#8a8175]" />
                        {state.organizations?.[selectedOrganization.id]?.establishedAt
                          ? (isZh
                            ? `${state.organizations[selectedOrganization.id]!.establishedAt!.year}年${state.organizations[selectedOrganization.id]!.establishedAt!.month}月`
                            : `${state.organizations[selectedOrganization.id]!.establishedAt!.year}-${String(state.organizations[selectedOrganization.id]!.establishedAt!.month).padStart(2, '0')}`)
                          : (isZh ? '未登记' : 'Not recorded')}
                      </div>
                    </div>
                    <div className="border border-[#524c44]/35 bg-[#f0e9da] px-2.5 py-2">
                      <div className="font-typewriter text-[7px] uppercase leading-none tracking-[0.14em] text-[#5d574e]">
                        {isZh ? '归属' : 'Owner'}
                      </div>
                      <div className="mt-1 truncate font-serif text-[13px] font-bold leading-none text-[#211f1c]">
                        {getPartyName(state, selectedOrganizationOwner, isZh, true)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <section className="border border-[#9c7321]/50 border-l-[3px] border-l-[#9c7321] bg-[#f0e9da] p-3">
                      <h4 className="font-typewriter text-[8px] uppercase tracking-[0.16em] text-[#755118]">
                        {isZh ? '月度效果' : 'Monthly effect'}
                      </h4>
                      <p className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-[#3c3832]">
                        {isZh ? selectedOrganization.monthlyEffectTextZh : selectedOrganization.monthlyEffectText}
                      </p>
                      {!selectedOrganizationActive && (
                        <p className="mt-1.5 text-[8.5px] leading-relaxed text-[#7d2226]">
                          {isZh ? '仅在组织活跃时结算。' : 'Settles only while the organization is active.'}
                        </p>
                      )}
                    </section>
                    <section className="border border-[#51335c]/40 border-l-[3px] border-l-[#51335c] bg-[#f0e9da] p-3">
                      <h4 className="font-typewriter text-[8px] uppercase tracking-[0.16em] text-[#51335c]">
                        {isZh ? '组织能力' : 'Capability'}
                      </h4>
                      <p className="mt-1.5 text-[10px] leading-relaxed text-[#3c3832]">
                        {(isZh ? selectedOrganization.capabilityTextZh : selectedOrganization.capabilityText)
                          || (isZh ? '无特别能力记录。' : 'No special capability recorded.')}
                      </p>
                    </section>
                  </div>

                  <div className="mt-4 border-t border-[#524c44]/25 pt-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-typewriter text-[8px] uppercase tracking-[0.16em] text-[#51335c]">
                        {isZh ? '同党其他组织' : 'Other organizations of this force'}
                      </h4>
                      <span className="font-mono text-[8px] text-[#8a8175]">{siblingOrganizations.length}</span>
                    </div>
                    {siblingOrganizations.length === 0 ? (
                      <p className="mt-2 text-[9px] text-[#8a8175]">
                        {isZh ? '暂无其他登记组织。' : 'No other registered organizations.'}
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {siblingOrganizations.map(definition => {
                          const active = isOrganizationActive(state, definition.id);
                          return (
                            <button
                              key={definition.id}
                              type="button"
                              onClick={() => setSelectedOrgId(definition.id)}
                              className={`flex items-center gap-1.5 border border-[#524c44]/25 bg-[#f7f2e7] px-1.5 py-1 transition-colors hover:border-[#524c44] hover:bg-[#fdfaf3] ${focusRing}`}
                              title={isZh ? definition.nameZh : definition.name}
                            >
                              <OrganizationSeal state={state} definition={definition} isZh={isZh} size={24} active={active} />
                              <span className="font-typewriter text-[8px] font-bold leading-none text-[#211f1c]">
                                {definition.id === definition.owner
                                  ? getPartyName(state, definition.owner, isZh, true)
                                  : definition.abbreviation}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <p className="flex items-center gap-1.5 text-[7.5px] uppercase tracking-[0.12em] text-[#8a8175]">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      {isZh ? '组织档案 · 登记册' : 'Organization record · register'}
                    </p>
                    <span
                      className="parties-page__stamp shrink-0"
                      style={{ color: getPartyColor(state, selectedOrganizationOwner) }}
                    >
                      {isZh ? '验讫' : 'Verified'}
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
