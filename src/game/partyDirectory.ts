import type { GameState, Party } from './types';
import { isOrganizationEstablished } from './organizations';

export type PartyKey = Party | 'CNT_FAI';

/**
 * Stable display order for the register. The index is deliberately flat: the
 * UI no longer groups political forces into ideological families.
 */
export const PARTY_ORDER: readonly PartyKey[] = [
  'CNT_FAI',
  'PSOE',
  'PCE',
  'POUM',
  'PS',
  'IR',
  'UR',
  'ERC',
  'PRR',
  'DLR',
  'PNV',
  'AP',
  'RE',
  'CT',
  'FE',
  'Other',
];

export const PARTY_IDEOLOGIES: Record<PartyKey, { zh: string; en: string }> = {
  CNT_FAI: { en: 'Anarcho-Syndicalism', zh: '无政府工团主义' },
  PSOE: { en: 'Socialism', zh: '社会民主主义 / 社会主义' },
  IR: { en: 'Left Republicanism', zh: '左翼共和主义' },
  UR: { en: 'Moderate Republicanism', zh: '温和共和主义' },
  PCE: { en: 'Marxism-Leninism', zh: '共产主义（马列主义）' },
  PS: { en: 'Revolutionary Syndicalism', zh: '工团主义参政派' },
  FE: { en: 'Fascism / National Syndicalism', zh: '法西斯主义 / 国家工团主义' },
  FET: { en: 'Falangist-Traditionalist Movement', zh: '长枪党—传统主义运动' },
  POUM: { en: 'Anti-Stalinist Marxism', zh: '反斯大林主义马克思主义' },
  AP: { en: 'Catholic Conservatism', zh: '天主教保守主义 / 右翼自治' },
  CT: { en: 'Carlist Traditionalism', zh: '卡洛斯传统主义 / 保王派' },
  RE: { en: 'Alfonsist Monarchism', zh: '阿方索派君主主义' },
  DLR: { en: 'Liberal Republicanism', zh: '自由共和主义 / 中间派' },
  PRR: { en: 'Radical Republicanism', zh: '激进共和主义 / 中间派' },
  ERC: { en: 'Catalan Left Nationalism', zh: '加泰罗尼亚左翼民族主义' },
  PNV: { en: 'Basque Christian Democracy', zh: '巴斯克基督教民主与民族主义' },
  Other: { en: 'Independents & Minor Lists', zh: '独立人士与地方小党' },
  PRRevS: { en: 'Revolutionary Syndicalism', zh: '革命共和工团参政派' },
};

const PARTY_ICON_FILES: Partial<Record<PartyKey, string>> = {
  CNT_FAI: 'CNT-FAI.png',
  CT: 'CT.png',
  DLR: 'DLR.png',
  ERC: 'ERC.png',
  FE: 'FE.png',
  FET: 'JONS.png',
  IR: 'IR.png',
  PCE: 'PCE.png',
  POUM: 'POUM.png',
  PRR: 'PRR.png',
  PS: 'PS.png',
  PSOE: 'PSOE.png',
  PNV: 'PNV.png',
  RE: 'RE.png',
  AP: 'AP.png',
  Other: 'independents.png',
};

type PartyIconState = Pick<GameState, 'ceda_formed' | 'ur_formed' | 'falange_jons' | 'organizations'>;

/** Mirrors the politics overview's emblem choices, with the PRRevS seal when
 *  the CNT has formed its parliamentary party. */
export const getPartyIconPath = (state: PartyIconState, party: PartyKey): string | undefined => {
  if (party === 'CNT_FAI' && isOrganizationEstablished(state, 'PRRevS')) {
    return '/img/Organization/PRRevS_Emblem.png';
  }
  if (party === 'PRRevS') return '/img/Organization/PRRevS_Emblem.png';

  const iconFile = party === 'AP'
    ? (state.ceda_formed ? 'CEDA.png' : 'AP.png')
    : party === 'UR'
      ? (state.ur_formed ? 'UR.png' : 'PRRS.png')
      : party === 'FE' && state.falange_jons
        ? 'JONS.png'
        : PARTY_ICON_FILES[party];

  return iconFile ? `/img/Party/${iconFile}` : undefined;
};

export interface RelationTier {
  min: number;
  zh: string;
  en: string;
  color: string;
}

export const RELATION_TIERS: readonly RelationTier[] = [
  { min: 80, zh: '盟友', en: 'Ally', color: '#1f573a' },
  { min: 60, zh: '友好', en: 'Friendly', color: '#3f6212' },
  { min: 40, zh: '谨慎', en: 'Wary', color: '#9c7321' },
  { min: 20, zh: '紧张', en: 'Tense', color: '#b45309' },
  { min: -Infinity, zh: '敌对', en: 'Hostile', color: '#7d2226' },
];

export const getRelationTier = (score: number): RelationTier =>
  RELATION_TIERS.find(tier => score >= tier.min) ?? RELATION_TIERS[RELATION_TIERS.length - 1];
