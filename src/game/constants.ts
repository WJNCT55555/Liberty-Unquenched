import { Party, SocialClass } from './types';

export const PARTY_COLORS: Record<string, string> = {
  CNT_FAI: '#cc0000',
  PSOE: '#EF1C27',
  IR: '#ffcc00',
  UR: '#1e3a8a',
  PCE: '#AC0621',
  PS: '#4b5563',
  FE: '#1e3a8a',
  POUM: '#b91c1c',
  AP: '#166534',
  CT: '#FFFFFF',
  RE: '#16166B',
  DLR: '#AC0621',
  Other: '#9ca3af'
};

export const CLASS_COLORS: Record<SocialClass, string> = {
  Obreros: '#ef4444',
  Braceros: '#f97316',
  Labradores: '#eab308',
  PequenaBurguesia: '#3b82f6',
  Intelectuales: '#8b5cf6',
  Burguesia: '#1e40af',
  Latifundistas: '#581c87',
  Clero: '#fcd34d'
};

export const CLASS_INFO: Record<SocialClass, { nameEn: string, nameZh: string, pop: number, appealZh: string, sensitiveZh: string, descriptionZh?: string, descriptionEn?: string }> = {
  Obreros: { nameEn: 'Obreros', nameZh: '产业工人', pop: 25, appealZh: '工人控制工厂、八小时工作制、反对斯大林主义控制', sensitiveZh: '与共产党合作、工会统一', descriptionZh: '城市工厂、矿山与铁路的蓝领劳动者，他们住在烟雾与煤灰浸透的城郊，他们苦苦等待，等待一个用总罢工烧毁旧世界契约机会。', descriptionEn: 'Blue-collar workers in urban factories, mines, and railways. Living in smog and soot-soaked suburbs, they bitterly wait for the opportunity to burn the old world\'s contracts with a general strike.' },
  Braceros: { nameEn: 'Braceros', nameZh: '雇农', pop: 30, appealZh: '土地没收与集体化、废除债务', sensitiveZh: '与中农冲突、强制集体化', descriptionZh: '他们是南方大庄园上沉默的影子。随麦浪迁徙，日结工资，夜宿沟渠。名下没有田产，胃里只有饥饿。他们既不敬畏法律，也不再迷信天堂，因为地狱就在他们劳作的烈日下。', descriptionEn: 'The silent shadows on the great southern estates. Migrating with the wheat waves, paid by the day, sleeping in ditches. With no land to their name, their stomachs hold only hunger. They neither revere the law nor believe in heaven anymore, for hell is right under the scorching sun where they toil.' },
  Labradores: { nameEn: 'Labradores', nameZh: '自耕农', pop: 14, appealZh: '保护私有产权、稳定市场', sensitiveZh: '集体化、革命暴力', descriptionZh: '他们早已习惯秩序，也拥有对上帝和圣母的虔诚。面对任何可能夺走他们唯一的财产的革命，他们会向上帝祈祷，然后毫不犹豫的扣动扳机。', descriptionEn: 'They have long been accustomed to order and possess a deep devotion to God and the Virgin. Faced with any revolution that might take away their only property, they will pray to God and then pull the trigger without hesitation.' },
  Latifundistas: { nameEn: 'Latifundistas', nameZh: '土地贵族', pop: 1, appealZh: '保护土地私有制', sensitiveZh: '反对土地改革、反对社会主义革命、支持君主制', descriptionZh: '他们的人数少到可以在一场晚宴中聚齐，他们的土地却广袤到马匹奔跑一日也难穷尽。他们是风暴的根源，还是在风暴中最先被烧毁的干柴。', descriptionEn: 'Their numbers are so few they could all gather at a single dinner party, yet their lands are so vast a horse could not cross them in a day. They are the root of the storm, and the dry tinder that will burn first when it arrives.' },
  PequenaBurguesia: { nameEn: 'Pequeña Burguesía', nameZh: '小资产阶级', pop: 12, appealZh: '恢复秩序、保护宗教', sensitiveZh: '无政府主义混乱、反宗教行为', descriptionZh: '城市夹缝中精打细算的小店主、手工业者、个体户。他们嫉妒资产阶级的客厅，也恐惧无产阶级的街道，当混乱威胁到微薄积蓄时，他们便会毫不留情的逃往哪怕是最反动者的阵营。', descriptionEn: 'Penny-pinching shopkeepers, artisans, and self-employed individuals caught in the urban cracks. They envy the bourgeoisie\'s living rooms and fear the proletariat\'s streets. When chaos threatens their meager savings, they will ruthlessly flee to the camp of even the most reactionary forces.' },
  Intelectuales: { nameEn: 'Intelectuales', nameZh: '知识分子', pop: 5, appealZh: '言论自由、反法西斯、教育改革', sensitiveZh: '反智倾向、斯大林主义渗透', descriptionZh: '教师、律师、医生、记者、大学教授。他们是整个国家的大脑，在几近四肢瘫痪的西班牙，共和、君主、教会、革命、共产、法西斯、民主、秩序……在千条未来道路中，他们与西班牙本身一样迷茫。', descriptionEn: 'Teachers, lawyers, doctors, journalists, and university professors. They are the brain of the nation. In a nearly paralyzed Spain, amidst a thousand future paths—republic, monarchy, church, revolution, communism, fascism, democracy, order—they are as lost as Spain itself.' },
  Burguesia: { nameEn: 'Burguesía', nameZh: '工业资产阶级', pop: 5, appealZh: '自治、保护产业、镇压工人占领', sensitiveZh: '工厂占领、集体化', descriptionZh: '铁路、矿山与纺织厂的主人。他们清楚地知道自己的敌人是谁。也同样知道，无论是什么样的招牌，谁驾驭了金钱，谁就是西班牙的主人。', descriptionEn: 'The masters of railways, mines, and textile mills. They know exactly who their enemies are. They also know that no matter the signboard, whoever harnesses the money is the master of Spain.' },
  Clero: { nameEn: 'Clero', nameZh: '天主教会', pop: 8, appealZh: '保护宗教场所、停止迫害', sensitiveZh: '反教权暴力、无神论宣传', descriptionZh: '在每一座村庄的中心，教堂总是最高的建筑。神在人间的代理人们管理着通往天堂的门票，也掌握着民间社会的准则——教育、婚姻与死亡的话语权。面临着无神论者的渎神行径他们将会毫不犹豫的反抗一切敌基督者。', descriptionEn: 'In the center of every village, the church is always the tallest building. God\'s representatives on earth manage the tickets to heaven and control the norms of civil society—the discourse on education, marriage, and death. Faced with the blasphemous acts of atheists, they will resist all antichrists without hesitation.' },
};
