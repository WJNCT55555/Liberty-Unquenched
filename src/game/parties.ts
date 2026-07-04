import { GameState, SocialClass } from './types';
import { CLASS_INFO } from './constants';

export type Party = 'POUM' | 'PCE' | 'PSOE' | 'PS' | 'ERC' | 'IR' | 'UR' | 'PNV' | 'PRR' | 'DLR' | 'AP' | 'RE' | 'CT' | 'FE' | 'Other' | 'PRRevS';

export const PARTY_COLORS: Record<string, string> = {
  CNT_FAI: '#cc0000',
  POUM: '#b91c1c',
  PCE: '#AC0621',
  PSOE: '#EF1C27',
  PS: '#4b5563',
  ERC: '#fb923c',
  IR: '#ffcc00',
  UR: '#1e3a8a',
  PNV: '#0d9488',
  PRR: '#a21caf',
  DLR: '#6366f1',
  AP: '#166534',
  RE: '#16166B',
  CT: '#854d0e',
  FE: '#111827',
  Other: '#9ca3af',
  PRRevS: '#cc0000'
};

export const INITIAL_CLASSES: Record<SocialClass, { support: Record<'CNT_FAI' | Exclude<Party, 'PRRevS'>, number> }> = {
  Obreros: { support: { CNT_FAI: 35, POUM: 0, PCE: 5, PSOE: 50, PS: 0, ERC: 2, IR: 5, UR: 0, PNV: 0, PRR: 0, DLR: 0, AP: 0, RE: 0, CT: 0, FE: 0, Other: 3 } },
  Braceros: { support: { CNT_FAI: 25, POUM: 0, PCE: 0, PSOE: 50, PS: 0, ERC: 0, IR: 10, UR: 0, PNV: 0, PRR: 0, DLR: 0, AP: 0, RE: 0, CT: 0, FE: 0, Other: 15 } },
  Labradores: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 5, IR: 10, UR: 20, PNV: 5, PRR: 15, DLR: 0, AP: 5, CT: 5, RE: 0, FE: 0, Other: 35 } },
  Latifundistas: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 5, PNV: 0, PRR: 0, DLR: 0, AP: 35, CT: 35, RE: 25, FE: 0, Other: 0 } },
  PequenaBurguesia: { support: { CNT_FAI: 2, POUM: 0, PCE: 0, PSOE: 5, PS: 0, ERC: 10, IR: 25, UR: 3, PNV: 5, PRR: 40, DLR: 0, AP: 10, CT: 0, RE: 0, FE: 0, Other: 0 } },
  Intelectuales: { support: { CNT_FAI: 5, POUM: 0, PCE: 0, PSOE: 15, PS: 0, ERC: 10, IR: 25, UR: 10, PNV: 0, PRR: 0, DLR: 15, AP: 5, CT: 0, RE: 0, FE: 0, Other: 15 } },
  Burguesia: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 10, IR: 10, UR: 5, PNV: 5, PRR: 35, DLR: 20, AP: 5, RE: 5, CT: 0, FE: 0, Other: 5 } },
  Clero: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 5, PNV: 5, PRR: 15, DLR: 0, AP: 35, CT: 20, RE: 5, FE: 0, Other: 15 } },
};

export const SCENARIO_1933_CLASSES: Record<SocialClass, { support: Record<'CNT_FAI' | Exclude<Party, 'PRRevS'>, number> }> = {
  Obreros: { support: { CNT_FAI: 38, POUM: 0, PCE: 4, PSOE: 42, PS: 0, ERC: 2, IR: 3, UR: 0, PNV: 1, PRR: 5, DLR: 0, AP: 1, RE: 0, CT: 0, FE: 1, Other: 3 } },
  Braceros: { support: { CNT_FAI: 30, POUM: 0, PCE: 2, PSOE: 42, PS: 0, ERC: 0, IR: 6, UR: 0, PNV: 0, PRR: 5, DLR: 0, AP: 3, RE: 0, CT: 2, FE: 0, Other: 10 } },
  Labradores: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 2, PS: 0, ERC: 4, IR: 5, UR: 12, PNV: 4, PRR: 22, DLR: 0, AP: 18, RE: 3, CT: 8, FE: 1, Other: 21 } },
  Latifundistas: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 2, PNV: 0, PRR: 5, DLR: 0, AP: 45, RE: 20, CT: 25, FE: 3, Other: 0 } },
  PequenaBurguesia: { support: { CNT_FAI: 1, POUM: 0, PCE: 0, PSOE: 4, PS: 0, ERC: 6, IR: 15, UR: 3, PNV: 3, PRR: 38, DLR: 0, AP: 22, RE: 2, CT: 2, FE: 4, Other: 0 } },
  Intelectuales: { support: { CNT_FAI: 4, POUM: 0, PCE: 2, PSOE: 12, PS: 0, ERC: 10, IR: 25, UR: 8, PNV: 2, PRR: 10, DLR: 12, AP: 10, RE: 0, CT: 0, FE: 1, Other: 4 } },
  Burguesia: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 5, IR: 6, UR: 4, PNV: 3, PRR: 35, DLR: 13, AP: 20, RE: 8, CT: 2, FE: 2, Other: 2 } },
  Clero: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 2, PNV: 4, PRR: 10, DLR: 0, AP: 45, RE: 8, CT: 22, FE: 3, Other: 6 } },
};

export const SCENARIO_1936_CLASSES: Record<SocialClass, { support: Record<'CNT_FAI' | Exclude<Party, 'PRRevS'>, number> }> = {
  Obreros: { support: { CNT_FAI: 34, POUM: 4, PCE: 10, PSOE: 36, PS: 2, ERC: 2, IR: 4, UR: 0, PNV: 1, PRR: 2, DLR: 0, AP: 1, RE: 0, CT: 0, FE: 2, Other: 2 } },
  Braceros: { support: { CNT_FAI: 28, POUM: 1, PCE: 5, PSOE: 40, PS: 1, ERC: 0, IR: 8, UR: 0, PNV: 0, PRR: 2, DLR: 0, AP: 4, RE: 0, CT: 2, FE: 1, Other: 8 } },
  Labradores: { support: { CNT_FAI: 1, POUM: 0, PCE: 1, PSOE: 5, PS: 0, ERC: 5, IR: 8, UR: 8, PNV: 5, PRR: 8, DLR: 1, AP: 22, RE: 5, CT: 10, FE: 3, Other: 18 } },
  Latifundistas: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 1, PNV: 0, PRR: 2, DLR: 0, AP: 45, RE: 18, CT: 24, FE: 8, Other: 2 } },
  PequenaBurguesia: { support: { CNT_FAI: 2, POUM: 1, PCE: 2, PSOE: 8, PS: 1, ERC: 8, IR: 22, UR: 5, PNV: 4, PRR: 13, DLR: 2, AP: 20, RE: 3, CT: 2, FE: 6, Other: 1 } },
  Intelectuales: { support: { CNT_FAI: 6, POUM: 5, PCE: 5, PSOE: 18, PS: 1, ERC: 10, IR: 28, UR: 8, PNV: 2, PRR: 4, DLR: 4, AP: 6, RE: 0, CT: 0, FE: 2, Other: 1 } },
  Burguesia: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 1, PS: 0, ERC: 8, IR: 8, UR: 5, PNV: 4, PRR: 18, DLR: 8, AP: 25, RE: 10, CT: 2, FE: 5, Other: 6 } },
  Clero: { support: { CNT_FAI: 0, POUM: 0, PCE: 0, PSOE: 0, PS: 0, ERC: 0, IR: 0, UR: 1, PNV: 5, PRR: 5, DLR: 0, AP: 46, RE: 8, CT: 24, FE: 6, Other: 5 } },
};

export const INITIAL_PARTY_RELATIONS: Record<Exclude<Party, 'PRRevS'>, number> = {
  POUM: 50,
  PCE: 50,
  PSOE: 60,
  PS: 50,
  ERC: 55,
  IR: 50,
  UR: 40,
  PNV: 40,
  PRR: 35,
  DLR: 30,
  AP: 10,
  RE: 0,
  CT: 0,
  FE: 30,
  Other: 50,
};

/**
 * Calculates support percentage for a specific party dynamically based on class popular ratios
 */
export function getPartySupport(state: GameState, party: 'CNT_FAI' | Party): number {
  if (party === 'PRRevS') {
    if (!state.isPRRevSFormed) return 0;
    const cntSupport = getPartySupport(state, 'CNT_FAI');
    const rate = state.cntVotingRate !== undefined ? state.cntVotingRate : 0;
    return Number((cntSupport * (rate / 100)).toFixed(2));
  }
  
  let totalSupport = 0;
  for (const classId in state.classes) {
    const classData = state.classes[classId as SocialClass];
    if (!classData || !classData.support) continue;
    
    const pop = CLASS_INFO[classId as SocialClass]?.pop / 100 || 0.125;
    const classTotalPoints = Object.values(classData.support).reduce((sum, val) => sum + val, 0) || 1;
    const relativePercent = ((classData.support[party as 'CNT_FAI' | Exclude<Party, 'PRRevS'>] || 0) / classTotalPoints) * 100;
    totalSupport += pop * relativePercent;
  }
  return Number(totalSupport.toFixed(2));
}

/**
 * Recalculates all parties' support values in bulk
 */
export function updatePartySupport(state: GameState): Record<Party, number> {
  const support: Partial<Record<Party, number>> = {};
  const parties: Party[] = ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'Other', 'PRRevS'];
  parties.forEach(p => {
    support[p] = getPartySupport(state, p);
  });
  return support as Record<Party, number>;
}
