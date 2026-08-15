import type { Faction } from './types';

/** Canonical display names for CNT-FAI internal factions. */
export const FACTION_NAMES: Record<Faction, { en: string; zh: string }> = {
  Treintistas: { en: 'Treintistas', zh: '三十人集团' },
  Cenetistas: { en: 'Cenetistas', zh: '工团派' },
  Faistas: { en: 'Faistas', zh: '无政府主义者' },
  Puristas: { en: 'Puristas', zh: '纯粹派' },
  Jabalistas: { en: 'Jabalistas', zh: '野猪议员' },
};
