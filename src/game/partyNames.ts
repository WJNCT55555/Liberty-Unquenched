import { GameState } from './types';
import { Party } from './parties';
import { isOrganizationEstablished } from './organizations';

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
  PSOE: { en: 'PSOE', zh: 'PSOE' },
  IR: { en: 'IR', zh: 'IR' },
  UR: { en: 'UR', zh: 'UR' },
  PCE: { en: 'PCE', zh: 'PCE' },
  PS: { en: 'PS', zh: 'PS' },
  FE: { en: 'FE', zh: 'FE' },
  POUM: { en: 'POUM', zh: 'POUM' },
  AP: { en: 'CEDA', zh: 'CEDA' },
  CT: { en: 'CT', zh: 'CT' },
  RE: { en: 'RE', zh: 'RE' },
  DLR: { en: 'DLR', zh: 'DLR' },
  PRR: { en: 'PRR', zh: 'PRR' },
  ERC: { en: 'ERC', zh: 'ERC' },
  PNV: { en: 'PNV', zh: 'PNV' },
  Other: { en: 'Other', zh: '其他' },
  PRRevS: { en: 'PRRevS', zh: 'PRRevS' }
};

type PartyNameState = Pick<GameState, 'year' | 'month' | 'ceda_formed' | 'ir_formed' | 'ur_formed' | 'falange_jons' | 'organizations'>;

export function getPartyName(state: PartyNameState, party: Party | 'CNT_FAI', isZh: boolean, short: boolean = false): string {
  // Acción Popular reorganizes as CEDA in March 1933 while retaining one AP
  // identity in the underlying party key.
  if (party === 'AP' && !state.ceda_formed) {
    return isZh
      ? (short ? 'AP' : '人民行动党 (AP)')
      : (short ? 'AP' : 'AP (Popular Action)');
  }

  // Acción Republicana became Izquierda Republicana in April 1934. Keep the
  // underlying IR party key so support, relations, seats, and coalitions do
  // not split across two technical parties.
  if (party === 'IR' && !state.ir_formed) {
    return isZh
      ? (short ? 'AR' : '共和行动 (AR)')
      : (short ? 'AR' : 'AR (Republican Action)');
  }

  // The Radical Socialist Republican phase became Unión Republicana in
  // September 1934. It likewise remains one underlying UR party identity.
  if (party === 'UR' && !state.ur_formed) {
    return isZh
      ? (short ? 'PRRS' : '激进社会共和党 (PRRS)')
      : (short ? 'PRRS' : 'PRRS (Radical Socialist Republican Party)');
  }

  // PRRevS logic for CNT_FAI
  if (party === 'CNT_FAI' && isOrganizationEstablished(state, 'PRRevS')) {
    return isZh 
      ? (short ? 'PRRevS' : '革命共和工团党 (PRRevS)') 
      : (short ? 'PRRevS' : 'PRRevS (Revolutionary Republican Syndicalist Party)');
  }

  // Falange logic for FE
  if (party === 'FE' && state.falange_jons) {
    return isZh
      ? (short ? 'FEJONS' : '长枪党 (FE de las JONS)')
      : (short ? 'FEJONS' : 'FE de las JONS (Falange Española de las JONS)');
  }

  const mapping = short ? PARTY_NAMES_SHORT_MAPPING : PARTY_NAMES_MAPPING;
  return isZh ? mapping[party].zh : mapping[party].en;
}

import { PARTY_COLORS } from './parties';

export function getPartyColor(state: GameState, party: Party | 'CNT_FAI'): string {
  if (party === 'CNT_FAI' && isOrganizationEstablished(state, 'PRRevS')) {
    return PARTY_COLORS['PS'] || '#4b5563'; // Use PS color for PRRevS based on SidePanel
  }
  return PARTY_COLORS[party] || '#9ca3af';
}
