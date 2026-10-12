import type { GameState, Party } from './types';
import { isOrganizationEstablished } from './organizations';

const PARTY_DESCRIPTIONS: Record<Party | 'CNT_FAI', { en: string; zh: string }> = {
  CNT_FAI: {
    en: 'An anarcho-syndicalist labour movement that remains outside ordinary parliamentary party politics.',
    zh: '无政府工团主义劳工运动，通常不以普通议会党派身份参政。'
  },
  PSOE: {
    en: 'A socialist parliamentary party rooted in the organised labour movement and reformist republican politics.',
    zh: '扎根于有组织劳工运动的社会主义议会党派，主张通过共和制度推进改革。'
  },
  IR: {
    en: 'A left-republican party advocating secular democracy, civil reform, and a stronger republican state.',
    zh: '主张世俗民主、公民改革与强化共和国家的左翼共和党。'
  },
  UR: {
    en: 'A moderate republican force built around liberal constitutionalism and parliamentary compromise.',
    zh: '以自由宪政与议会妥协为核心的温和共和派力量。'
  },
  PCE: {
    en: 'A Marxist-Leninist communist party seeking disciplined revolutionary organisation and central coordination.',
    zh: '追求严密革命组织与集中协调的马克思列宁主义共产主义政党。'
  },
  PS: {
    en: 'A syndicalist party that attempts to bring organised labour politics into parliamentary government.',
    zh: '试图将有组织的工人政治带入议会政府的工团主义政党。'
  },
  FE: {
    en: 'A fascist and national-syndicalist movement hostile to liberal republican pluralism.',
    zh: '反对自由共和多元主义的法西斯与国家工团主义运动。'
  },
  POUM: {
    en: 'An anti-Stalinist Marxist party combining revolutionary socialism with opposition to communist centralism.',
    zh: '结合革命社会主义与反对共产主义集权路线的反斯大林主义马克思主义政党。'
  },
  AP: {
    en: 'A Catholic conservative right-wing force that later reorganises under the CEDA name.',
    zh: '天主教保守派右翼力量，后来以 CEDA 名义完成重组。'
  },
  CT: {
    en: 'A traditionalist Carlist movement defending Catholic monarchy, regional privileges, and social hierarchy.',
    zh: '维护天主教君主制、地方传统权利与社会等级秩序的卡洛斯传统主义运动。'
  },
  RE: {
    en: 'An Alfonsist monarchist party seeking restoration of the Bourbon monarchy.',
    zh: '主张波旁王朝复辟的阿方索派君主主义政党。'
  },
  DLR: {
    en: 'A liberal republican right grouping positioned between conservative and radical republican currents.',
    zh: '位于保守共和派与激进共和派之间的自由共和右翼力量。'
  },
  PRR: {
    en: 'A centrist-radical republican party built around parliamentary liberalism and pragmatic coalition politics.',
    zh: '以议会自由主义与务实联盟政治为基础的中间派激进共和党。'
  },
  ERC: {
    en: 'A Catalan left-republican party combining social reform with Catalan national self-government.',
    zh: '结合社会改革与加泰罗尼亚民族自治诉求的左翼共和党。'
  },
  PNV: {
    en: 'A Basque Christian-democratic and nationalist party seeking regional autonomy through constitutional politics.',
    zh: '通过宪政政治争取地区自治的巴斯克基督教民主与民族主义政党。'
  },
  Other: {
    en: 'Independent deputies, local lists, and minor political forces outside the principal party blocs.',
    zh: '不属于主要党派集团的独立议员、地方名单与小型政治力量。'
  },
  PRRevS: {
    en: 'A revolutionary republican syndicalist party formed by the CNT-FAI movement to pursue organised labour’s demands through parliamentary politics.',
    zh: '由 CNT-FAI 运动走向议会政治后形成的革命共和工团主义政党，尝试通过参政推进工人组织的诉求。'
  }
};

export const getPartyDescription = (state: Pick<GameState, 'organizations'>, party: Party | 'CNT_FAI', isZh: boolean): string => {
  const profile = party === 'CNT_FAI' && isOrganizationEstablished(state, 'PRRevS') ? 'PRRevS' : party;
  return PARTY_DESCRIPTIONS[profile][isZh ? 'zh' : 'en'];
};
