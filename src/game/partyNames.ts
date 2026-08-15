import { GameState } from './types';
import { Party } from './parties';

// Unified party names translation mapping
export const PARTY_NAMES_MAPPING: Record<Party | 'CNT_FAI', { en: string; zh: string }> = {
  CNT_FAI: { en: 'CNT-FAI (National Confederation of Labor - Iberian Anarchist Federation)', zh: '全国劳工联盟-伊比利亚无政府主义联合 (CNT-FAI)' },
  PSOE: { en: 'PSOE (Spanish Socialist Workers\' Party)', zh: '西班牙工人社会党 (PSOE)' },
  IR: { en: 'IR (Left Republican)', zh: '共和左翼 (IR)' },
  UR: { en: 'UR (Republican Union)', zh: '共和联盟 (UR)' },
  PCE: { en: 'PCE (Communist Party of Spain)', zh: '西班牙共产党 (PCE)' },
  PS: { en: 'PS (Syndicalist Party)', zh: '工团主义党 (PS)' },
  FE: { en: 'FE (Falange Española)', zh: '西班牙长枪党 (FE)' },
  POUM: { en: 'POUM (Workers\' Party of Marxist Unification)', zh: '马克思主义统一工人党 (POUM)' },
  AP: { en: 'CEDA (Spanish Confederation of Autonomous Right-wing Groups)', zh: '西班牙自治右翼联盟 (CEDA / AP)' },
  CT: { en: 'CT (Traditionalist Communion)', zh: '传统主义者合一会 (CT)' },
  RE: { en: 'RE (Spanish Renovation)', zh: '西班牙革新党 (RE)' },
  DLR: { en: 'DLR (Liberal Republican Right)', zh: '自由共和右翼 (DLR)' },
  PRR: { en: 'PRR (Radical Republican Party)', zh: '共和激进党 (PRR)' },
  ERC: { en: 'ERC (Republican Left of Catalonia)', zh: '加泰罗尼亚共和左翼 (ERC)' },
  PNV: { en: 'PNV (Basque Nationalist Party)', zh: '巴斯克民族主义党 (PNV)' },
  Other: { en: 'Other Parties / Independents', zh: '其他党派与独立人士' },
  PRRevS: { en: 'PRRevS (Revolutionary Republican Syndicalist Party)', zh: '革命共和工团党 (PRRevS)' }
};

export const PARTY_NAMES_SHORT_MAPPING: Record<Party | 'CNT_FAI', { en: string; zh: string }> = {
  CNT_FAI: { en: 'CNT-FAI', zh: 'CNT-FAI' },
  PSOE: { en: 'PSOE', zh: '工人社会党' },
  IR: { en: 'IR', zh: '共和左翼' },
  UR: { en: 'UR', zh: '共和联盟' },
  PCE: { en: 'PCE', zh: '西共' },
  PS: { en: 'PS', zh: '工团党' },
  FE: { en: 'FE', zh: '长枪党' },
  POUM: { en: 'POUM', zh: '马统工党' },
  AP: { en: 'CEDA', zh: 'CEDA' },
  CT: { en: 'CT', zh: '传统主义者' },
  RE: { en: 'RE', zh: '西班牙革新' },
  DLR: { en: 'DLR', zh: '自由共和右翼' },
  PRR: { en: 'PRR', zh: '激进党' },
  ERC: { en: 'ERC', zh: '加泰共和左翼' },
  PNV: { en: 'PNV', zh: '巴斯克民族党' },
  Other: { en: 'Other', zh: '其他' },
  PRRevS: { en: 'PRRevS', zh: '革命共和工团党' }
};

export function getPartyName(state: GameState, party: Party | 'CNT_FAI', isZh: boolean, short: boolean = false): string {
  // PRRevS logic for CNT_FAI
  if (party === 'CNT_FAI' && state.isPRRevSFormed) {
    return isZh 
      ? (short ? 'PRRevS' : '革命共和工团党 (PRRevS)') 
      : (short ? 'PRRevS' : 'PRRevS (Revolutionary Republican Syndicalist Party)');
  }

  // Falange logic for FE
  if (party === 'FE' && state.falange_jons) {
    return isZh
      ? (short ? 'FE de las JONS' : '长枪党 (FE de las JONS)')
      : (short ? 'FE de las JONS' : 'FE de las JONS (Falange Española de las JONS)');
  }

  const mapping = short ? PARTY_NAMES_SHORT_MAPPING : PARTY_NAMES_MAPPING;
  return isZh ? mapping[party].zh : mapping[party].en;
}

import { PARTY_COLORS } from './parties';

export function getPartyColor(state: GameState, party: Party | 'CNT_FAI'): string {
  if (party === 'CNT_FAI' && state.isPRRevSFormed) {
    return PARTY_COLORS['PS'] || '#4b5563'; // Use PS color for PRRevS based on SidePanel
  }
  return PARTY_COLORS[party] || '#9ca3af';
}
