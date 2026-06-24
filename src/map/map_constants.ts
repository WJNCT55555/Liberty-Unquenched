/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapFaction as Faction, Province } from './types_map';

// Comprehensive listing of Spanish provinces with historical ownership in April 1931
export const INITIAL_PROVINCES: { [key: string]: Province } = {
  // --- REPUBLICAN ZONE (April 1931, Second Republic just proclaimed) ---
  madrid: {
    id: 'madrid', name: 'Madrid', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 120, industry: 100, strategicValue: 10, terrain: 'urban', fortification: 2
  },
  barcelona: {
    id: 'barcelona', name: 'Barcelona', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 110, industry: 120, strategicValue: 10, terrain: 'urban', fortification: 1
  },
  valencia: {
    id: 'valencia', name: 'Valencia', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 80, industry: 60, strategicValue: 8, terrain: 'plains', fortification: 0
  },
  vizcaya: {
    id: 'vizcaya', name: 'Vizcaya', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 50, industry: 80, strategicValue: 7, terrain: 'urban', fortification: 1
  },
  guipuzcoa: {
    id: 'guipuzcoa', name: 'Guipúzcoa', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 40, industry: 50, strategicValue: 6, terrain: 'mountains', fortification: 0
  },
  asturias: {
    id: 'asturias', name: 'Asturias', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 60, industry: 70, strategicValue: 6, terrain: 'mountains', fortification: 1
  },
  santander: {
    id: 'santander', name: 'Santander', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 40, industry: 30, strategicValue: 5, terrain: 'mountains', fortification: 0
  },
  murcia: {
    id: 'murcia', name: 'Murcia', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 50, industry: 40, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  malaga: {
    id: 'malaga', name: 'Malaga', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 50, industry: 30, strategicValue: 6, terrain: 'urban', fortification: 0
  },
  alicante: {
    id: 'alicante', name: 'Alicante', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 45, industry: 35, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  gerona: {
    id: 'gerona', name: 'Gerona', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 30, industry: 10, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  lerida: {
    id: 'lerida', name: 'Lérida', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 30, industry: 15, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  tarragona: {
    id: 'tarragona', name: 'Tarragona', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 35, industry: 20, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  badajoz: {
    id: 'badajoz', name: 'Badajoz', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 45, industry: 15, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  almeria: {
    id: 'almeria', name: 'Almería', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 30, industry: 10, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  jaen: {
    id: 'jaen', name: 'Jaén', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 40, industry: 15, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  castellon: {
    id: 'castellon', name: 'Castellón', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 35, industry: 15, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  albacete: {
    id: 'albacete', name: 'Albacete', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 30, industry: 10, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  ciudadreal: {
    id: 'ciudadreal', name: 'Ciudad Real', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 35, industry: 10, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  cuenca: {
    id: 'cuenca', name: 'Cuenca', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 25, industry: 5, strategicValue: 3, terrain: 'mountains', fortification: 0
  },
  guadalajara: {
    id: 'guadalajara', name: 'Guadalajara', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 25, industry: 10, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  toledo: {
    id: 'toledo', name: 'Toledo', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 40, industry: 15, strategicValue: 6, terrain: 'plains', fortification: 2
  },

  // Navarra, Burgos, Álava, La Rioja — conservative/Carlist areas, but
  // under Republican administration in April 1931.
  navarra: {
    id: 'navarra', name: 'Navarra', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 60, industry: 20, strategicValue: 7, terrain: 'mountains', fortification: 2
  },
  burgos: {
    id: 'burgos', name: 'Burgos', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 40, industry: 20, strategicValue: 7, terrain: 'plains', fortification: 1
  },
  alava: {
    id: 'alava', name: 'Álava', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 30, industry: 25, strategicValue: 5, terrain: 'mountains', fortification: 0
  },
  rioja: {
    id: 'rioja', name: 'La Rioja', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 35, industry: 20, strategicValue: 5, terrain: 'plains', fortification: 0
  },

  // --- REPUBLICAN ZONE (continued) ---
  sevilla: {
    id: 'sevilla', name: 'Sevilla', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 90, industry: 50, strategicValue: 8, terrain: 'urban', fortification: 1
  },
  coruna: {
    id: 'coruna', name: 'La Coruña', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 50, industry: 30, strategicValue: 6, terrain: 'mountains', fortification: 0
  },
  lugo: {
    id: 'lugo', name: 'Lugo', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 35, industry: 10, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  orense: {
    id: 'orense', name: 'Orense', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 30, industry: 10, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  pontevedra: {
    id: 'pontevedra', name: 'Pontevedra', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 45, industry: 20, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  leon: {
    id: 'leon', name: 'León', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 45, industry: 25, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  zamora: {
    id: 'zamora', name: 'Zamora', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 30, industry: 10, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  salamanca: {
    id: 'salamanca', name: 'Salamanca', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 40, industry: 15, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  avila: {
    id: 'avila', name: 'Ávila', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 25, industry: 5, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  segovia: {
    id: 'segovia', name: 'Segovia', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 25, industry: 10, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  valladolid: {
    id: 'valladolid', name: 'Valladolid', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 50, industry: 40, strategicValue: 6, terrain: 'plains', fortification: 0
  },
  palencia: {
    id: 'palencia', name: 'Palencia', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 30, industry: 15, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  soria: {
    id: 'soria', name: 'Soria', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 20, industry: 5, strategicValue: 3, terrain: 'plains', fortification: 0
  },
  zaragoza: {
    id: 'zaragoza', name: 'Zaragoza', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 70, industry: 40, strategicValue: 8, terrain: 'urban', fortification: 1
  },
  huesca: {
    id: 'huesca', name: 'Huesca', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 25, industry: 10, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  teruel: {
    id: 'teruel', name: 'Teruel', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 20, industry: 5, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  caceres: {
    id: 'caceres', name: 'Cáceres', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 40, industry: 10, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  cadiz: {
    id: 'cadiz', name: 'Cádiz', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 50, industry: 30, strategicValue: 7, terrain: 'urban', fortification: 1
  },
  huelva: {
    id: 'huelva', name: 'Huelva', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 35, industry: 20, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  cordoba: {
    id: 'cordoba', name: 'Córdoba', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 60, industry: 20, strategicValue: 6, terrain: 'plains', fortification: 0
  },
  granada: {
    id: 'granada', name: 'Granada', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 50, industry: 20, strategicValue: 6, terrain: 'urban', fortification: 1
  },
  balears: {
    id: 'balears', name: 'Islas Baleares', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 30, industry: 10, strategicValue: 6, terrain: 'plains', fortification: 1
  },
  oviedo: {
    id: 'oviedo', name: 'Oviedo', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 20, industry: 10, strategicValue: 4, terrain: 'urban', fortification: 2
  },
  ceuta: {
    id: 'ceuta', name: 'Ceuta', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 15, industry: 5, strategicValue: 6, terrain: 'urban', fortification: 1
  },
  melilla: {
    id: 'melilla', name: 'Melilla', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 15, industry: 5, strategicValue: 6, terrain: 'urban', fortification: 1
  },
  laspalmas: {
    id: 'laspalmas', name: 'Las Palmas', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 30, industry: 10, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  santacruzdetenerife: {
    id: 'santacruzdetenerife', name: 'Santa Cruz de Tenerife', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 30, industry: 10, strategicValue: 5, terrain: 'mountains', fortification: 0
  },
  // --- SPANISH MOROCCO (Protectorate, under Republican administration in 1931) ---
  tetouan: {
    id: 'tetouan', name: 'Tétouan', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 40, industry: 15, strategicValue: 8, terrain: 'mountains', fortification: 1
  },
  larache: {
    id: 'larache', name: 'Larache', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 30, industry: 10, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  nador: {
    id: 'nador', name: 'Nador', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 35, industry: 10, strategicValue: 5, terrain: 'mountains', fortification: 0
  },
  chefchaouen: {
    id: 'chefchaouen', name: 'Chefchaouen', owner: Faction.REPUBLICAN,
    isCoastal: false, manpower: 25, industry: 5, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  alhoceima: {
    id: 'alhoceima', name: 'Al Hoceïma', owner: Faction.REPUBLICAN,
    isCoastal: true, manpower: 30, industry: 10, strategicValue: 6, terrain: 'mountains', fortification: 0
  },

  // --- PORTUGAL (Ditadura Nacional, soon to become Estado Novo in 1933) ---
  lisboa: {
    id: 'lisboa', name: 'Lisboa', owner: Faction.PORTUGAL,
    isCoastal: true, manpower: 100, industry: 80, strategicValue: 10, terrain: 'urban', fortification: 1
  },
  porto: {
    id: 'porto', name: 'Porto', owner: Faction.PORTUGAL,
    isCoastal: true, manpower: 80, industry: 70, strategicValue: 8, terrain: 'urban', fortification: 0
  },
  setubal: {
    id: 'setubal', name: 'Setúbal', owner: Faction.PORTUGAL,
    isCoastal: true, manpower: 40, industry: 50, strategicValue: 6, terrain: 'plains', fortification: 0
  },
  coimbra: {
    id: 'coimbra', name: 'Coimbra', owner: Faction.PORTUGAL,
    isCoastal: true, manpower: 35, industry: 20, strategicValue: 5, terrain: 'mountains', fortification: 0
  },
  faro: {
    id: 'faro', name: 'Faro', owner: Faction.PORTUGAL,
    isCoastal: true, manpower: 30, industry: 15, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  beja: {
    id: 'beja', name: 'Beja', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 25, industry: 10, strategicValue: 3, terrain: 'plains', fortification: 0
  },
  evora: {
    id: 'evora', name: 'Évora', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 25, industry: 10, strategicValue: 3, terrain: 'plains', fortification: 0
  },
  portalegre: {
    id: 'portalegre', name: 'Portalegre', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 20, industry: 5, strategicValue: 3, terrain: 'mountains', fortification: 0
  },
  aveiro: {
    id: 'aveiro', name: 'Aveiro', owner: Faction.PORTUGAL,
    isCoastal: true, manpower: 45, industry: 30, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  braga: {
    id: 'braga', name: 'Braga', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 50, industry: 40, strategicValue: 6, terrain: 'mountains', fortification: 0
  },
  braganca: {
    id: 'braganca', name: 'Bragança', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 20, industry: 5, strategicValue: 3, terrain: 'mountains', fortification: 0
  },
  castelobranco: {
    id: 'castelobranco', name: 'Castelo Branco', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 25, industry: 10, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
  guarda: {
    id: 'guarda', name: 'Guarda', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 20, industry: 5, strategicValue: 3, terrain: 'mountains', fortification: 0
  },
  leiria: {
    id: 'leiria', name: 'Leiria', owner: Faction.PORTUGAL,
    isCoastal: true, manpower: 40, industry: 25, strategicValue: 5, terrain: 'plains', fortification: 0
  },
  santarem: {
    id: 'santarem', name: 'Santarém', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 35, industry: 20, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  vianadocastelo: {
    id: 'vianadocastelo', name: 'Viana do Castelo', owner: Faction.PORTUGAL,
    isCoastal: true, manpower: 30, industry: 15, strategicValue: 4, terrain: 'plains', fortification: 0
  },
  vilareal: {
    id: 'vilareal', name: 'Vila Real', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 25, industry: 10, strategicValue: 3, terrain: 'mountains', fortification: 0
  },
  viseu: {
    id: 'viseu', name: 'Viseu', owner: Faction.PORTUGAL,
    isCoastal: false, manpower: 30, industry: 15, strategicValue: 4, terrain: 'mountains', fortification: 0
  },
};

// Chinese names for all provinces
export const PROVINCE_NAMES_ZH: { [key: string]: string } = {
  madrid: '马德里', barcelona: '巴塞罗那', valencia: '瓦伦西亚',
  vizcaya: '比斯开', guipuzcoa: '吉普斯夸', asturias: '阿斯图里亚斯',
  santander: '桑坦德', murcia: '穆尔西亚', malaga: '马拉加',
  alicante: '阿利坎特', gerona: '赫罗纳', lerida: '莱里达',
  tarragona: '塔拉戈纳', badajoz: '巴达霍斯', almeria: '阿尔梅里亚',
  jaen: '哈恩', castellon: '卡斯特利翁', albacete: '阿尔瓦塞特',
  ciudadreal: '雷阿尔城', cuenca: '昆卡', guadalajara: '瓜达拉哈拉',
  toledo: '托莱多', navarra: '纳瓦拉', burgos: '布尔戈斯',
  alava: '阿拉瓦', rioja: '拉里奥哈', sevilla: '塞维利亚',
  coruna: '拉科鲁尼亚', lugo: '卢戈', orense: '奥伦塞',
  pontevedra: '蓬特韦德拉', leon: '莱昂', zamora: '萨莫拉',
  salamanca: '萨拉曼卡', avila: '阿维拉', segovia: '塞哥维亚',
  valladolid: '巴利亚多利德', palencia: '帕伦西亚', soria: '索里亚',
  zaragoza: '萨拉戈萨', huesca: '韦斯卡', teruel: '特鲁埃尔',
  caceres: '卡塞雷斯', cadiz: '加的斯', huelva: '韦尔瓦',
  cordoba: '科尔多瓦', granada: '格拉纳达', balears: '巴利阿里群岛',
  oviedo: '奥维耶多', ceuta: '休达', melilla: '梅利利亚',
  laspalmas: '拉斯帕尔马斯', santacruzdetenerife: '圣克鲁斯-德特内里费',
  tetouan: '得土安', larache: '拉腊什', nador: '纳祖尔',
  chefchaouen: '舍夫沙万', alhoceima: '胡塞马',
  lisboa: '里斯本', porto: '波尔图', setubal: '塞图巴尔',
  coimbra: '科英布拉', faro: '法鲁', beja: '贝雅',
  evora: '埃武拉', portalegre: '波塔莱格雷', aveiro: '阿威罗',
  braga: '布拉加', braganca: '布拉干萨', castelobranco: '布朗库堡',
  guarda: '瓜达', leiria: '莱里亚', santarem: '圣塔伦',
  vianadocastelo: '维亚纳堡', vilareal: '雷阿尔城(葡)', viseu: '维塞乌',
};

// Helper: get province display name based on language
// Accepts either a full Province object (with id) or a minimal {name, nameZh} object
export function getProvinceName(province: { name: string; nameZh?: string; id?: string } | undefined, lang: 'en' | 'zh'): string {
  if (!province) return '';
  if (lang === 'zh') return province.nameZh || (province.id && PROVINCE_NAMES_ZH[province.id]) || PROVINCE_NAMES_ZH[(province.name || '').toLowerCase()] || province.name;
  return province.name;
}

export const PROVINCE_ADJACENCY: { [key: string]: string[] } = {
  madrid: ['toledo', 'guadalajara', 'cuenca', 'avila', 'segovia'],
  barcelona: ['tarragona', 'lerida', 'gerona'],
  valencia: ['castellon', 'alicante', 'cuenca', 'teruel', 'albacete'],
  sevilla: ['huelva', 'cadiz', 'malaga', 'cordoba', 'badajoz'],
  burgos: ['santander', 'vizcaya', 'alava', 'rioja', 'soria', 'segovia', 'valladolid', 'palencia'],
  vizcaya: ['santander', 'guipuzcoa', 'alava', 'burgos'],
  zaragoza: ['huesca', 'lerida', 'tarragona', 'teruel', 'guadalajara', 'soria', 'rioja', 'navarra'],
  badajoz: ['caceres', 'toledo', 'ciudadreal', 'cordoba', 'sevilla', 'huelva', 'evora'],
  toledo: ['madrid', 'avila', 'caceres', 'badajoz', 'ciudadreal', 'cuenca'],
  burgos_adjacent: ['burgos'], // Helper
  // Add more systematically for core regions
  huelva: ['sevilla', 'badajoz', 'faro', 'beja'],
  cadiz: ['sevilla', 'malaga'],
  malaga: ['cadiz', 'sevilla', 'cordoba', 'granada'],
  granada: ['malaga', 'cordoba', 'jaen', 'almeria', 'murcia'],
  cordoba: ['badajoz', 'sevilla', 'malaga', 'granada', 'jaen', 'ciudadreal'],
  jaen: ['cordoba', 'granada', 'almeria', 'murcia', 'albacete', 'ciudadreal'],
  almeria: ['granada', 'jaen', 'murcia'],
  murcia: ['almeria', 'jaen', 'albacete', 'alicante'],
  alicante: ['valencia', 'albacete', 'murcia'],
  albacete: ['valencia', 'cuenca', 'ciudadreal', 'jaen', 'murcia', 'alicante'],
  ciudadreal: ['toledo', 'badajoz', 'cordoba', 'jaen', 'albacete', 'cuenca'],
  cuenca: ['madrid', 'guadalajara', 'teruel', 'valencia', 'albacete', 'ciudadreal', 'toledo'],
  guadalajara: ['madrid', 'segovia', 'soria', 'zaragoza', 'teruel', 'cuenca'],
  segovia: ['madrid', 'avila', 'valladolid', 'burgos', 'guadalajara'],
  avila: ['madrid', 'segovia', 'valladolid', 'salamanca', 'caceres', 'toledo'],
  caceres: ['avila', 'salamanca', 'badajoz', 'toledo', 'portalegre', 'castelobranco'],
  salamanca: ['avila', 'valladolid', 'zamora', 'caceres', 'guarda'],
  zamora: ['salamanca', 'valladolid', 'leon', 'orense', 'braganca'],
  valladolid: ['segovia', 'avila', 'salamanca', 'zamora', 'leon', 'palencia', 'burgos'],
  palencia: ['burgos', 'valladolid', 'leon', 'santander'],
  leon: ['palencia', 'valladolid', 'zamora', 'orense', 'lugo', 'asturias', 'santander'],
  asturias: ['leon', 'lugo', 'santander', 'oviedo'],
  santander: ['asturias', 'leon', 'palencia', 'burgos', 'vizcaya'],
  guipuzcoa: ['vizcaya', 'alava', 'navarra'],
  alava: ['vizcaya', 'guipuzcoa', 'navarra', 'rioja', 'burgos'],
  navarra: ['guipuzcoa', 'alava', 'rioja', 'zaragoza', 'huesca'],
  rioja: ['burgos', 'alava', 'navarra', 'zaragoza', 'soria'],
  soria: ['burgos', 'rioja', 'zaragoza', 'guadalajara'],
  huesca: ['navarra', 'zaragoza', 'lerida'],
  lerida: ['huesca', 'zaragoza', 'tarragona', 'barcelona', 'gerona'],
  gerona: ['barcelona', 'lerida'],
  tarragona: ['barcelona', 'lerida', 'zaragoza', 'teruel', 'castellon'],
  teruel: ['zaragoza', 'tarragona', 'castellon', 'valencia', 'cuenca', 'guadalajara'],
  castellon: ['tarragona', 'teruel', 'valencia'],
  coruna: ['lugo', 'pontevedra'],
  lugo: ['coruna', 'orense', 'leon', 'asturias', 'pontevedra'],
  orense: ['lugo', 'pontevedra', 'zamora', 'leon', 'braganca', 'vilareal', 'braga'],
  pontevedra: ['coruna', 'lugo', 'orense', 'vianadocastelo'],

  // --- PORTUGAL PROVINCES ADJACENCIES ---
  lisboa: ['leiria', 'santarem', 'setubal'],
  porto: ['vianadocastelo', 'braga', 'vilareal', 'viseu', 'aveiro'],
  setubal: ['lisboa', 'santarem', 'evora', 'beja'],
  coimbra: ['aveiro', 'viseu', 'castelobranco', 'leiria', 'santarem'],
  faro: ['beja', 'huelva'],
  beja: ['setubal', 'evora', 'badajoz', 'huelva', 'faro'],
  evora: ['santarem', 'portalegre', 'beja', 'setubal', 'badajoz'],
  portalegre: ['castelobranco', 'santarem', 'evora', 'caceres', 'badajoz'],
  aveiro: ['porto', 'viseu', 'coimbra'],
  braga: ['vianadocastelo', 'porto', 'vilareal', 'orense'],
  braganca: ['vilareal', 'viseu', 'guarda', 'orense', 'zamora', 'salamanca'],
  castelobranco: ['guarda', 'viseu', 'coimbra', 'santarem', 'portalegre', 'caceres'],
  guarda: ['braganca', 'viseu', 'castelobranco', 'salamanca'],
  leiria: ['coimbra', 'santarem', 'lisboa'],
  santarem: ['leiria', 'coimbra', 'castelobranco', 'portalegre', 'evora', 'setubal', 'lisboa'],
  vianadocastelo: ['braga', 'porto', 'pontevedra'],
  vilareal: ['braga', 'porto', 'viseu', 'braganca', 'orense'],
  viseu: ['porto', 'vilareal', 'braganca', 'guarda', 'coimbra', 'castelobranco', 'aveiro'],
};

// April 1931: The Army is still unified under the Republic.
// The Army of Africa (in Morocco) is Republican; conservative strongholds
// have only small militias (Requetés / traditionalist volunteers).
export const INITIAL_ARMIES = [
  // --- Republican Armies (loyal to the Second Republic) ---
  { id: 'rep_1', faction: Faction.REPUBLICAN, provinceId: 'madrid', movesLeft: 2, manpower: 5000, maxManpower: 5000, composition: { infantry: 3000, artillery: 1500, tanks: 500 }, designedComposition: { infantry: 3000, artillery: 1500, tanks: 500 }, morale: 80, militarization: 40 },
  { id: 'rep_2', faction: Faction.REPUBLICAN, provinceId: 'barcelona', movesLeft: 2, manpower: 4500, maxManpower: 4500, composition: { infantry: 3000, artillery: 1000, tanks: 500 }, designedComposition: { infantry: 3000, artillery: 1000, tanks: 500 }, morale: 85, militarization: 35 },
  { id: 'rep_3', faction: Faction.REPUBLICAN, provinceId: 'valencia', movesLeft: 2, manpower: 3000, maxManpower: 3000, composition: { infantry: 2000, artillery: 1000, tanks: 0 }, designedComposition: { infantry: 2000, artillery: 1000, tanks: 0 }, morale: 75, militarization: 30 },
  { id: 'rep_4', faction: Faction.REPUBLICAN, provinceId: 'sevilla', movesLeft: 2, manpower: 4000, maxManpower: 4000, composition: { infantry: 2500, artillery: 1000, tanks: 500 }, designedComposition: { infantry: 2500, artillery: 1000, tanks: 500 }, morale: 70, militarization: 35 },
  { id: 'rep_5', faction: Faction.REPUBLICAN, provinceId: 'zaragoza', movesLeft: 2, manpower: 3500, maxManpower: 3500, composition: { infantry: 2500, artillery: 1000, tanks: 0 }, designedComposition: { infantry: 2500, artillery: 1000, tanks: 0 }, morale: 70, militarization: 30 },
  // Army of Africa: elite colonial force, still under Republican command in 1931
  { id: 'rep_africa', faction: Faction.REPUBLICAN, provinceId: 'tetouan', movesLeft: 2, manpower: 6000, maxManpower: 6000, composition: { infantry: 4000, artillery: 1500, tanks: 500 }, designedComposition: { infantry: 4000, artillery: 1500, tanks: 500 }, morale: 85, militarization: 65 },
  // --- Local Garrison Forces (formerly conservative militias, now under Republic in 1931) ---
  { id: 'rep_navarra_garrison', faction: Faction.REPUBLICAN, provinceId: 'navarra', movesLeft: 2, manpower: 2500, maxManpower: 2500, composition: { infantry: 2000, artillery: 500, tanks: 0 }, designedComposition: { infantry: 2000, artillery: 500, tanks: 0 }, morale: 60, militarization: 25 },
  { id: 'rep_burgos_garrison', faction: Faction.REPUBLICAN, provinceId: 'burgos', movesLeft: 2, manpower: 2000, maxManpower: 2000, composition: { infantry: 1500, artillery: 500, tanks: 0 }, designedComposition: { infantry: 1500, artillery: 500, tanks: 0 }, morale: 55, militarization: 20 },
];

// --- Cultural & Regional Classification (for map display layers) ---
export type CultureGroup = 
  | 'castilian' 
  | 'catalan' 
  | 'basque' 
  | 'galician' 
  | 'andalusian' 
  | 'valencia' 
  | 'aragonese' 
  | 'asturian' 
  | 'portuguese' 
  | 'moroccan_berber' 
  | 'canarian'
  | 'leonese';

export const PROVINCE_CULTURES: Record<string, { group: CultureGroup; nameCn: string; nameEn: string; color: string }> = {
  madrid: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  burgos: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  salamanca: { group: 'leonese', nameCn: '莱昂', nameEn: 'Leonese', color: '#9E305C' },
  valladolid: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  segovia: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  avila: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  soria: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  palencia: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  cuenca: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  guadalajara: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  toledo: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  ciudadreal: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  albacete: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  rioja: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  leon: { group: 'leonese', nameCn: '莱昂', nameEn: 'Leonese', color: '#9E305C' },
  zamora: { group: 'leonese', nameCn: '莱昂', nameEn: 'Leonese', color: '#9E305C' },

  barcelona: { group: 'catalan', nameCn: '加泰罗尼亚', nameEn: 'Catalan', color: '#E09F3E' },
  gerona: { group: 'catalan', nameCn: '加泰罗尼亚', nameEn: 'Catalan', color: '#E09F3E' },
  lerida: { group: 'catalan', nameCn: '加泰罗尼亚', nameEn: 'Catalan', color: '#E09F3E' },
  tarragona: { group: 'catalan', nameCn: '加泰罗尼亚', nameEn: 'Catalan', color: '#E09F3E' },
  balears: { group: 'catalan', nameCn: '加泰罗尼亚', nameEn: 'Catalan', color: '#E09F3E' },

  vizcaya: { group: 'basque', nameCn: '巴斯克', nameEn: 'Basque', color: '#4E8752' },
  guipuzcoa: { group: 'basque', nameCn: '巴斯克', nameEn: 'Basque', color: '#4E8752' },
  alava: { group: 'basque', nameCn: '巴斯克', nameEn: 'Basque', color: '#4E8752' },
  navarra: { group: 'basque', nameCn: '巴斯克', nameEn: 'Basque', color: '#4E8752' },

  coruna: { group: 'galician', nameCn: '加利西亚', nameEn: 'Galician', color: '#4D8093' },
  lugo: { group: 'galician', nameCn: '加利西亚', nameEn: 'Galician', color: '#4D8093' },
  orense: { group: 'galician', nameCn: '加利西亚', nameEn: 'Galician', color: '#4D8093' },
  pontevedra: { group: 'galician', nameCn: '加利西亚', nameEn: 'Galician', color: '#4D8093' },

  sevilla: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  malaga: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  cadiz: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  huelva: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  cordoba: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  granada: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  jaen: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  almeria: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  badajoz: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },
  caceres: { group: 'andalusian', nameCn: '安达卢西亚', nameEn: 'Andalusian', color: '#8E9F76' },

  valencia: { group: 'valencia', nameCn: '巴伦西亚', nameEn: 'Valencia', color: '#E5A93B' },
  alicante: { group: 'valencia', nameCn: '巴伦西亚', nameEn: 'Valencia', color: '#E5A93B' },
  castellon: { group: 'valencia', nameCn: '巴伦西亚', nameEn: 'Valencia', color: '#E5A93B' },
  murcia: { group: 'valencia', nameCn: '巴伦西亚', nameEn: 'Valencia', color: '#E5A93B' },
  zaragoza: { group: 'aragonese', nameCn: '阿拉贡', nameEn: 'Aragonese', color: '#DDA72F' },
  huesca: { group: 'aragonese', nameCn: '阿拉贡', nameEn: 'Aragonese', color: '#DDA72F' },
  teruel: { group: 'aragonese', nameCn: '阿拉贡', nameEn: 'Aragonese', color: '#DDA72F' },

  asturias: { group: 'asturian', nameCn: '阿斯图里亚斯', nameEn: 'Asturias', color: '#4A7A6E' },
  santander: { group: 'castilian', nameCn: '卡斯蒂利亚', nameEn: 'Castilian', color: '#B56C51' },
  oviedo: { group: 'asturian', nameCn: '阿斯图里亚斯', nameEn: 'Asturias', color: '#4A7A6E' },

  lisboa: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  porto: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  setubal: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  coimbra: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  faro: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  beja: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  evora: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  portalegre: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  aveiro: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  braga: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  braganca: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  castelobranco: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  guarda: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  leiria: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  santarem: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  vianadocastelo: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  vilareal: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },
  viseu: { group: 'portuguese', nameCn: '葡萄牙', nameEn: 'Portuguese', color: '#5E8075' },

  tetouan: { group: 'moroccan_berber', nameCn: '摩洛哥-柏柏尔', nameEn: 'Moroccan-Berber', color: '#BCA374' },
  larache: { group: 'moroccan_berber', nameCn: '摩洛哥-柏柏尔', nameEn: 'Moroccan-Berber', color: '#BCA374' },
  nador: { group: 'moroccan_berber', nameCn: '摩洛哥-柏柏尔', nameEn: 'Moroccan-Berber', color: '#BCA374' },
  chefchaouen: { group: 'moroccan_berber', nameCn: '摩洛哥-柏柏尔', nameEn: 'Moroccan-Berber', color: '#BCA374' },
  alhoceima: { group: 'moroccan_berber', nameCn: '摩洛哥-柏柏尔', nameEn: 'Moroccan-Berber', color: '#BCA374' },
  ceuta: { group: 'moroccan_berber', nameCn: '摩洛哥-柏柏尔', nameEn: 'Moroccan-Berber', color: '#BCA374' },
  melilla: { group: 'moroccan_berber', nameCn: '摩洛哥-柏柏尔', nameEn: 'Moroccan-Berber', color: '#BCA374' },

  laspalmas: { group: 'canarian', nameCn: '加那利', nameEn: 'Canarian', color: '#5A9AD4' },
  santacruzdetenerife: { group: 'canarian', nameCn: '加那利', nameEn: 'Canarian', color: '#5A9AD4' },
};

export function getCultureGridCoords(provId: string, cultureGroup?: string, lang: 'en' | 'zh' = 'en'): { col: number; row: number; name: string } {
  const id = provId.toLowerCase();
  const isZh = lang === 'zh';
  
  if (id === 'leon' || id === 'zamora' || id === 'salamanca') {
    return { col: 1, row: 2, name: isZh ? '莱昂' : 'León' };
  }
  
  switch (cultureGroup) {
    case 'castilian':
      return { col: 0, row: 0, name: isZh ? '卡斯蒂利亚' : 'Castile' };
    case 'galician':
      return { col: 1, row: 0, name: isZh ? '加利西亚' : 'Galicia' };
    case 'basque':
      return { col: 2, row: 0, name: isZh ? '巴斯克' : 'Basque' };
    case 'catalan':
      return { col: 0, row: 1, name: isZh ? '加泰罗尼亚' : 'Catalonia' };
    case 'andalusian':
      return { col: 1, row: 1, name: isZh ? '安达卢西亚' : 'Andalusia' };
    case 'portuguese':
      return { col: 2, row: 1, name: isZh ? '葡萄牙' : 'Portugal' };
    case 'asturian':
      return { col: 0, row: 2, name: isZh ? '阿斯图里亚斯' : 'Asturians' };
    case 'leonese':
      return { col: 1, row: 2, name: isZh ? '莱昂' : 'León' };
    case 'moroccan_berber':
    case 'morocco':
      return { col: 2, row: 2, name: isZh ? '摩尔人' : 'Moors' };
    case 'aragonese':
      return { col: 0, row: 3, name: isZh ? '阿拉贡' : 'Aragonese' };
    case 'valencia':
    case 'valencian':
      return { col: 1, row: 3, name: isZh ? '巴伦西亚' : 'Valencian' };
    case 'canarian':
      return { col: 2, row: 3, name: isZh ? '加那利' : 'Canarian' };
    default:
      return { col: 0, row: 0, name: isZh ? '卡斯蒂利亚' : 'Castile' };
  }
}

export const PROVINCE_REGIONS: Record<string, { group: string; nameCn: string; nameEn: string; color: string }> = {
  coruna: { group: 'galicia', nameCn: '加利西亚', nameEn: 'Galicia', color: '#3F889D' },
  lugo: { group: 'galicia', nameCn: '加利西亚', nameEn: 'Galicia', color: '#3F889D' },
  orense: { group: 'galicia', nameCn: '加利西亚', nameEn: 'Galicia', color: '#3F889D' },
  pontevedra: { group: 'galicia', nameCn: '加利西亚', nameEn: 'Galicia', color: '#3F889D' },

  asturias: { group: 'asturias', nameCn: '阿斯图里亚斯', nameEn: 'Asturias', color: '#2E7969' },
  oviedo: { group: 'asturias', nameCn: '阿斯图里亚斯', nameEn: 'Asturias', color: '#2E7969' },

  santander: { group: 'old_castile', nameCn: '老卡斯蒂利亚', nameEn: 'Old Castile', color: '#A66A51' },
  burgos: { group: 'old_castile', nameCn: '老卡斯蒂利亚', nameEn: 'Old Castile', color: '#A66A51' },
  rioja: { group: 'old_castile', nameCn: '老卡斯蒂利亚', nameEn: 'Old Castile', color: '#A66A51' },
  soria: { group: 'old_castile', nameCn: '老卡斯蒂利亚', nameEn: 'Old Castile', color: '#A66A51' },
  segovia: { group: 'old_castile', nameCn: '老卡斯蒂利亚', nameEn: 'Old Castile', color: '#A66A51' },
  avila: { group: 'old_castile', nameCn: '老卡斯蒂利亚', nameEn: 'Old Castile', color: '#A66A51' },
  palencia: { group: 'old_castile', nameCn: '老卡斯蒂利亚', nameEn: 'Old Castile', color: '#A66A51' },
  valladolid: { group: 'old_castile', nameCn: '老卡斯蒂利亚', nameEn: 'Old Castile', color: '#A66A51' },

  leon: { group: 'leon', nameCn: '莱昂', nameEn: 'León', color: '#8C513E' },
  zamora: { group: 'leon', nameCn: '莱昂', nameEn: 'León', color: '#8C513E' },
  salamanca: { group: 'leon', nameCn: '莱昂', nameEn: 'León', color: '#8C513E' },

  vizcaya: { group: 'basque', nameCn: '巴斯克地区', nameEn: 'Basque Country', color: '#488E4F' },
  guipuzcoa: { group: 'basque', nameCn: '巴斯克地区', nameEn: 'Basque Country', color: '#488E4F' },
  alava: { group: 'basque', nameCn: '巴斯克地区', nameEn: 'Basque Country', color: '#488E4F' },

  navarra: { group: 'navarra', nameCn: '纳瓦拉', nameEn: 'Navarre', color: '#7CA47F' },

  zaragoza: { group: 'aragon', nameCn: '阿拉贡', nameEn: 'Aragon', color: '#BCA32B' },
  huesca: { group: 'aragon', nameCn: '阿拉贡', nameEn: 'Aragon', color: '#BCA32B' },
  teruel: { group: 'aragon', nameCn: '阿拉贡', nameEn: 'Aragon', color: '#BCA32B' },

  barcelona: { group: 'catalonia', nameCn: '加泰罗尼亚', nameEn: 'Catalonia', color: '#C46B4E' },
  gerona: { group: 'catalonia', nameCn: '加泰罗尼亚', nameEn: 'Catalonia', color: '#C46B4E' },
  lerida: { group: 'catalonia', nameCn: '加泰罗尼亚', nameEn: 'Catalonia', color: '#C46B4E' },
  tarragona: { group: 'catalonia', nameCn: '加泰罗尼亚', nameEn: 'Catalonia', color: '#C46B4E' },

  balears: { group: 'balearic', nameCn: '巴利阿里群岛', nameEn: 'Balearic Islands', color: '#DE9273' },

  valencia: { group: 'valencia', nameCn: '巴伦西亚', nameEn: 'Valencia', color: '#DF9E3C' },
  alicante: { group: 'valencia', nameCn: '巴伦西亚', nameEn: 'Valencia', color: '#DF9E3C' },
  castellon: { group: 'valencia', nameCn: '巴伦西亚', nameEn: 'Valencia', color: '#DF9E3C' },

  murcia: { group: 'murcia', nameCn: '穆尔西亚', nameEn: 'Murcia', color: '#E1B26E' },
  albacete: { group: 'murcia', nameCn: '穆尔西亚', nameEn: 'Murcia', color: '#E1B26E' },

  sevilla: { group: 'andalusia', nameCn: '安达卢西亚', nameEn: 'Andalusia', color: '#719E5A' },
  malaga: { group: 'andalusia', nameCn: '安达卢西亚', nameEn: 'Andalusia', color: '#719E5A' },
  cadiz: { group: 'andalusia', nameCn: '安达卢西亚', nameEn: 'Andalusia', color: '#719E5A' },
  huelva: { group: 'andalusia', nameCn: '安达卢西亚', nameEn: 'Andalusia', color: '#719E5A' },
  cordoba: { group: 'andalusia', nameCn: '安达卢西亚', nameEn: 'Andalusia', color: '#719E5A' },
  granada: { group: 'andalusia', nameCn: '安达卢西亚', nameEn: 'Andalusia', color: '#719E5A' },
  jaen: { group: 'andalusia', nameCn: '安达卢西亚', nameEn: 'Andalusia', color: '#719E5A' },
  almeria: { group: 'andalusia', nameCn: '安达卢西亚', nameEn: 'Andalusia', color: '#719E5A' },

  badajoz: { group: 'extremadura', nameCn: '埃斯特雷马杜拉', nameEn: 'Extremadura', color: '#547A46' },
  caceres: { group: 'extremadura', nameCn: '埃斯特雷马杜拉', nameEn: 'Extremadura', color: '#547A46' },

  madrid: { group: 'new_castile', nameCn: '新卡斯蒂利亚', nameEn: 'New Castile', color: '#B8535A' },
  cuenca: { group: 'new_castile', nameCn: '新卡斯蒂利亚', nameEn: 'New Castile', color: '#B8535A' },
  guadalajara: { group: 'new_castile', nameCn: '新卡斯蒂利亚', nameEn: 'New Castile', color: '#B8535A' },
  toledo: { group: 'new_castile', nameCn: '新卡斯蒂利亚', nameEn: 'New Castile', color: '#B8535A' },
  ciudadreal: { group: 'new_castile', nameCn: '新卡斯蒂利亚', nameEn: 'New Castile', color: '#B8535A' },

  laspalmas: { group: 'canaries', nameCn: '加那利群岛', nameEn: 'Canaries', color: '#5082CD' },
  santacruzdetenerife: { group: 'canaries', nameCn: '加那利群岛', nameEn: 'Canaries', color: '#5082CD' },

  tetouan: { group: 'morocco', nameCn: '西属摩洛哥', nameEn: 'Morocco Protectorate', color: '#C5AC7E' },
  larache: { group: 'morocco', nameCn: '西属摩洛哥', nameEn: 'Morocco Protectorate', color: '#C5AC7E' },
  nador: { group: 'morocco', nameCn: '西属摩洛哥', nameEn: 'Morocco Protectorate', color: '#C5AC7E' },
  chefchaouen: { group: 'morocco', nameCn: '西属摩洛哥', nameEn: 'Morocco Protectorate', color: '#C5AC7E' },
  alhoceima: { group: 'morocco', nameCn: '西属摩洛哥', nameEn: 'Morocco Protectorate', color: '#C5AC7E' },
  ceuta: { group: 'morocco', nameCn: '西属摩洛哥', nameEn: 'Morocco Protectorate', color: '#C5AC7E' },
  melilla: { group: 'morocco', nameCn: '西属摩洛哥', nameEn: 'Morocco Protectorate', color: '#C5AC7E' },

  lisboa: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  porto: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  setubal: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  coimbra: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  faro: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  beja: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  evora: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  portalegre: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  aveiro: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  braga: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  braganca: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  castelobranco: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  guarda: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  leiria: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  santarem: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  vianadocastelo: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  vilareal: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
  viseu: { group: 'portugal', nameCn: '葡萄牙', nameEn: 'Portugal', color: '#508E8F' },
};

export const FACTION_COLORS = {
  [Faction.REPUBLICAN]: '#6F4C8E', // Desaturated Purple (Historical look)
  [Faction.NATIONALIST]: '#E2B04E', // Earthy Yellow (Historical look)
  [Faction.PORTUGAL]: '#738C6C', // Sage Green
  [Faction.NEUTRAL]: '#D4C9B3', // Beige/Parchment
};

export const UI_COLORS = {
  paper: '#E6E2D3',
  ocean: '#9EBAC1', // More distinct light blue ocean
  ink: '#2A2621',
  accent: '#A67C52', // Brassy/Bronze
};

export const MAJOR_CITIES = [
  { name: 'Madrid', nameZh: '马德里', coords: [-3.7038, 40.4168], isCapital: true },
  { name: 'Barcelona', nameZh: '巴塞罗那', coords: [2.1734, 41.3851] },
  { name: 'Valencia', nameZh: '瓦伦西亚', coords: [-0.3763, 39.4699] },
  { name: 'Sevilla', nameZh: '塞维利亚', coords: [-5.9845, 37.3891] },
  { name: 'Zaragoza', nameZh: '萨拉戈萨', coords: [-0.8891, 41.6488] },
  { name: 'Bilbao', nameZh: '毕尔巴鄂', coords: [-2.9350, 43.2630] },
  { name: 'Málaga', nameZh: '马拉加', coords: [-4.4203, 36.7213] },
  { name: 'Lisboa', nameZh: '里斯本', coords: [-9.1393, 38.7223], isCapital: true },
  { name: 'Porto', nameZh: '波尔图', coords: [-8.6291, 41.1579] },
  { name: 'A Coruña', nameZh: '拉科鲁尼亚', coords: [-8.4115, 43.3623] },
  { name: 'Burgos', nameZh: '布尔戈斯', coords: [-3.6969, 42.3439] },
  { name: 'Granada', nameZh: '格拉纳达', coords: [-3.5986, 37.1773] },
  { name: 'Cartagena', nameZh: '卡塔赫纳', coords: [-0.9821, 37.6051] },
  { name: 'Badajoz', nameZh: '巴达霍斯', coords: [-6.9706, 38.8794] },
  { name: 'Oviedo', nameZh: '奥维耶多', coords: [-5.8448, 43.3614] },
  { name: 'Palma', nameZh: '帕尔马', coords: [2.6502, 39.5696] },
];

export function getCombatWidth(terrain: 'urban' | 'plains' | 'mountains' | 'forest'): number {
  switch (terrain) {
    case 'mountains':
      return 2000;
    case 'urban':
      return 3000;
    case 'forest':
      return 4500;
    case 'plains':
    default:
      return 6000;
  }
}

export function getSupplyLimit(province: {
  isCoastal: boolean;
  strategicValue: number;
  terrain?: 'urban' | 'plains' | 'mountains' | 'forest';
  buildings?: { barracks?: number; fortress?: number; recruitingOffice?: number; ammoFactory?: number };
}): number {
  let baseLimit = 10000; // default for plains
  if (province.terrain) {
    switch (province.terrain) {
      case 'urban':
        baseLimit = 12000;
        break;
      case 'plains':
        baseLimit = 10000;
        break;
      case 'forest':
        baseLimit = 8000;
        break;
      case 'mountains':
        baseLimit = 6000;
        break;
    }
  }

  const coastalBonus = province.isCoastal ? 3000 : 0;
  const barracksLevel = province.buildings?.barracks || 0;
  const barracksBonus = barracksLevel * 4000;
  const strategicBonus = province.strategicValue * 500;

  return baseLimit + coastalBonus + barracksBonus + strategicBonus;
}
