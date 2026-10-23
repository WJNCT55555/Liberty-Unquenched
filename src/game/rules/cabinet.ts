/**
 * 内阁部委的**唯一权威表**。
 *
 * 在本次改动之前，同一份名单在五处各写了一遍（`SidePanel.tsx` 的部长行与
 * `DEPT_INFO_PACK`、`DomesticPoliticsModal.tsx` 的 `MINISTRIES_DEF`、入阁谈判菜单、
 * `SandboxMenu.tsx`），名字互不一致——仅「卫生」一项就有三种译名。新增一个部委字段
 * 意味着要同时改五处，漏一处就是玩家在不同面板看到不同机构。
 *
 * 现在 UI 只读这里，不再自行定义名称。字段名（`labor`、`education`…）是稳定 key，
 * **显示名随年份变化**：1931 年的 labor 是「劳动与福利部」，1935 年前后才是
 * 「劳动、卫生与福利部」；独立的卫生部、商业部要到 1930 年代中后期才存在。
 *
 * 史实依据与待查证清单见 `docs/部门设置史实评审2026-10-15.md`。
 */
import type { Faction, GameState, Ministers } from '../types';

export type CabinetField = keyof Ministers;

/** 中英文双语文本对。 */
export interface CabinetTextPair {
  en: string;
  zh: string;
}

/** 每个部委的完整描述。`legacyNames` 记录同一机构在不同年份的正式名称。 */
export interface CabinetDepartmentInfo {
  /** 当前年份适用的名称（默认项）。 */
  name: CabinetTextPair;
  /** 历史名称，按起始年份升序排列；取不晚于当前年份的最后一项。 */
  legacyNames?: { fromYear: number; name: CabinetTextPair }[];
  spanishName: string;
  focus: CabinetTextPair;
}

/**
 * 部委顺序即 UI 显示顺序：先政治与安全，再经济与建设，最后教育与外交。
 * `finance`/`estado` 在类型上是可选字段，此处仍列出，缺失时按 `Other` 显示。
 */
export const CABINET_FIELDS: readonly CabinetField[] = [
  'labor',
  'health',
  'justice',
  'industry',
  'commerce',
  'interior',
  'war',
  'agriculture',
  'education',
  'publicWorks',
  'finance',
  'estado',
] as const;

export const CABINET: Record<CabinetField, CabinetDepartmentInfo> = {
  labor: {
    name: { en: 'Ministry of Labor and Welfare', zh: '劳动与福利部' },
    legacyNames: [{
      fromYear: 1935,
      name: { en: 'Ministry of Labor, Health and Welfare', zh: '劳动、卫生与福利部' },
    }],
    spanishName: 'Ministerio de Trabajo, Sanidad y Previsión',
    focus: {
      en: 'Maintains industrial peace and arbitrates strikes. A CNT Labor Minister can pass humane 40-hour workweeks and safety standards, directly building union legitimacy. Until the wartime reshuffle splits it out, this ministry also carries the health administration.',
      zh: '负责维护工业生产稳定、裁决大范围停工与工人大罢工。CNT部长在位时，可发布历史性的「四十小时工作周」与工业安全章程，极大抬升工会统摄力。在战时改组把卫生拆出去之前，卫生行政也归此部管辖。',
    },
  },
  health: {
    name: { en: 'Ministry of Health and Social Assistance', zh: '卫生与社会援助部' },
    spanishName: 'Ministerio de Sanidad y Asistencia Social',
    focus: {
      en: 'Hospitals, child evacuation, refugee relief and the blood-transfusion service. The ministry did not exist before the wartime reshuffle: until then its functions sat inside the Labor ministry. Federica Montseny took it as the first woman to hold a Spanish cabinet post.',
      zh: '掌管医院体系、儿童疏散、难民救济与前线输血服务。该部在战时改组之前并不存在，此前其职能属于劳动部；蒙特塞尼出任首任部长，是西班牙历史上第一位女性内阁成员。',
    },
  },
  justice: {
    name: { en: 'Ministry of Justice', zh: '司法部' },
    spanishName: 'Ministerio de Justicia',
    focus: {
      en: 'Oversees criminal courts, legal code amendments, and general amnesty. Critical to legally shield collective acquisitions and release political prisoners.',
      zh: '执掌司法裁决、法案宪法修订以及发布国家特赦令。是解除地主司法纠缠、在法律上确认工人强占土地房屋有效、并赦免革命战士的防护盾。',
    },
  },
  industry: {
    name: { en: 'Ministry of Industry', zh: '工业部' },
    spanishName: 'Ministerio de Industria',
    focus: {
      en: 'Pits, mills, metalworks and the war plants. The portfolio was created in December 1933, when industry was split away from commerce; before that both sat inside one ministry. Directs raw material allocations for weapons production.',
      zh: '管辖矿井、纺织、冶金与兵工生产。该部于 1933 年 12 月才从「工业与商业部」中拆出，此前两者同属一个部。决定战时军事供应链的原材料配给。',
    },
  },
  commerce: {
    name: { en: 'Ministry of Commerce', zh: '商业部' },
    spanishName: 'Ministerio de Comercio',
    focus: {
      en: 'The customs houses, the bills of lading and the shops. Whoever holds this portfolio decides what leaves Spain and what comes back — and therefore whether a blockade is a sentence or a bargaining position. CNT held it in 1936.',
      zh: '海关、提单与商铺。掌握这个部的人决定什么离开西班牙、什么回来——因此也决定封锁是一纸判决还是一个谈判筹码。1936 年该部由 CNT 掌管。',
    },
  },
  interior: {
    // 面板上写「内政部（民政）」，让读者一眼看出它对应的是 Gobernación 而不是别国的
    // 内政部；事件与卡牌的散文里仍沿用「内政部」，不逐句改成拗口的全称。
    name: { en: 'Ministry of the Interior (Gobernación)', zh: '内政部（民政）' },
    spanishName: 'Ministerio de la Gobernación',
    focus: {
      en: 'Commands the municipal security forces, assault guards, and public order. The primary shield to suppress coup attempts, dismantle spy cells, and patrol urban stability.',
      zh: '调遣国民警卫队、突击警卫队并操持全境公共秩序。是刺探右翼军官暗谋、实施定点逮捕、压制反革命暴动及战时清特务的关键安全堡垒。',
    },
  },
  war: {
    name: { en: 'Ministry of War', zh: '战争部' },
    legacyNames: [{
      fromYear: 1936,
      name: { en: 'Ministry of War (with Navy and Air)', zh: '战争部（兼海军与航空）' },
    }],
    spanishName: 'Ministerio de la Guerra',
    focus: {
      en: 'Governs troop enlistments, heavy weapons factories, and regular army command. Critical for central military policy cards to reform defensive chains against reactionary forces. The navy and air arms were attached to this portfolio from November 1936.',
      zh: '统御国防陆海军编制、战训以及国防预算，是把持合法重武装力量的最终底牌，可极大增强抵抗叛乱叛军的战备。1936 年 11 月起海军与航空也归此部统辖。',
    },
  },
  agriculture: {
    name: { en: 'Ministry of Agriculture', zh: '农业部' },
    spanishName: 'Ministerio de Agricultura',
    focus: {
      en: 'Overlooks land reforms, estate expropriations, and grain distribution. A CNT Agriculture Minister enables collective farming card selections to mobilize rural laborers.',
      zh: '农牧业事务及土地改革，决定西班牙境内数百万饥饿的无地日雇农对政权的态度。CNT部长在位时可执行大农场征收。',
    },
  },
  education: {
    name: { en: 'Ministry of Public Instruction', zh: '公共教育部' },
    spanishName: 'Ministerio de Instrucción Pública y Bellas Artes',
    focus: {
      en: 'Schools, teachers, the Pedagogical Missions and the rural library service. This is the department that carries the Republic’s secular-school programme, and therefore the one that collides with the Church, with the teaching orders and with the CNT’s own rationalist athenaeums.',
      zh: '掌管学校、教师队伍、教育使团与农村图书馆体系。它是共和国世俗学校纲领的执行机构，因此必然与教会、修会教师以及全劳联自己的理性主义学苑发生碰撞。',
    },
  },
  publicWorks: {
    name: { en: 'Ministry of Public Works (Fomento)', zh: '公共工程部（发展部）' },
    legacyNames: [{
      fromYear: 1933,
      name: { en: 'Ministry of Public Works', zh: '公共工程部' },
    }],
    /** 1931 年为 Fomento，1933 年 12 月改组为 Obras Públicas。 */
    spanishName: 'Ministerio de Fomento / Obras Públicas',
    focus: {
      en: 'Railways, roads, ports, telegraphs and the great hydraulic schemes. In 1931 this was still the old Fomento ministry; from December 1933 it is Obras Públicas. Nothing moves to the front — men, coal, grain or shells — without passing through it.',
      zh: '铁路、公路、港口、电报与大型水利。1931 年它仍是旧制的发展部（Fomento），1933 年 12 月起改称公共工程部。无论是人、煤、粮食还是炮弹，运到前线都要经过这个部。',
    },
  },
  finance: {
    name: { en: 'Ministry of Finance', zh: '财政部' },
    spanishName: 'Ministerio de Hacienda',
    focus: {
      en: 'Oversees public budget, tax rates, tariff levels, and national currency/gold reserves. Excellent for implementing libertarian communist wealth redistribution policies.',
      zh: '主管国家预算、所得税税率、海陆关税与国家金库/外汇储备。是在财政层面上贯彻自由共产主义、重塑社会分配机制、实现财富再分配的最强工具。',
    },
  },
  estado: {
    name: { en: 'Ministry of State (Foreign Affairs)', zh: '国务部（外交）' },
    spanishName: 'Ministerio de Estado',
    focus: {
      en: 'Foreign policy, embassies and international negotiations.',
      zh: '外交政策、驻外使团与国际谈判。',
    },
  },
};

/** 返回该部委在当前游戏年份适用的名称。 */
export const getDepartmentName = (field: CabinetField, year: number): CabinetTextPair => {
  const info = CABINET[field];
  const applicable = (info.legacyNames ?? []).filter(entry => year >= entry.fromYear);
  return applicable.length > 0 ? applicable[applicable.length - 1].name : info.name;
};

/**
 * 内阁名单的短标签（`[en, zh]`），供五月事件、战时权力安排等表格使用。
 * 与 `getDepartmentName` 的区别是这里刻意不随年份变化：这些界面比较的是「同一批职位」
 * 的前后变化，标签必须稳定，否则同一张表里会出现两个不同名字。
 */
export const CABINET_OFFICE_LABELS: Record<CabinetField, [string, string]> = {
  labor: ['Labour', '劳动'],
  health: ['Health', '卫生'],
  justice: ['Justice', '司法'],
  industry: ['Industry', '工业'],
  commerce: ['Commerce', '商业'],
  interior: ['Interior', '内政'],
  war: ['War', '战争'],
  agriculture: ['Agriculture', '农业'],
  education: ['Public instruction', '公共教育'],
  publicWorks: ['Public works', '公共工程'],
  finance: ['Finance', '财政'],
  estado: ['Foreign affairs', '外交'],
};

/**
 * 部长职务标签（`[en, zh]`），供沙盒等需要"人"而不是"部"的地方使用。
 * 与 `CABINET_OFFICE_LABELS`（部门名）区分：一个是「公共工程」，一个是「公共工程部长」。
 */
export const CABINET_MINISTER_LABELS: Record<CabinetField, CabinetTextPair> = {
  labor: { en: 'Labor Minister', zh: '劳动部长' },
  health: { en: 'Health Minister', zh: '卫生部长' },
  justice: { en: 'Justice Minister', zh: '司法部长' },
  industry: { en: 'Industry Minister', zh: '工业部长' },
  commerce: { en: 'Commerce Minister', zh: '商业部长' },
  interior: { en: 'Interior Minister (Gobernación)', zh: '内政部长' },
  war: { en: 'War Minister', zh: '战争部长' },
  agriculture: { en: 'Agriculture Minister', zh: '农业部长' },
  education: { en: 'Public Instruction Minister', zh: '公共教育部长' },
  publicWorks: { en: 'Public Works Minister', zh: '公共工程部长' },
  finance: { en: 'Finance Minister', zh: '财政部长' },
  estado: { en: 'State Minister (Foreign Affairs)', zh: '国务部长（外交）' },
};

/** 读取某部委的部长党派；可选字段缺失或存档来自旧版本时回退 `Other`。 */
export const getMinisterParty = (state: GameState, field: CabinetField) =>
  state.ministers[field] ?? 'Other';

/**
 * 「某党掌某部」的可读后果说明。
 *
 * 这一层此前只有展示用文案（`PARTY_INFLUENCE_INFO`），现在改写成逐部委的**权限说明**，
 * 与 `docs/部门设置史实评审2026-10-15.md` §B2 的方向一致：先让面板说的话是真的，
 * 再逐步把数值效果接上。
 */
export interface MinisterOfficeEffect {
  dissent?: Partial<Record<Faction, number>>;
  text: CabinetTextPair;
}

export const MINISTER_OFFICE_EFFECTS: Partial<Record<CabinetField, MinisterOfficeEffect>> = {
  education: {
    dissent: { Treintistas: -4, Puristas: 6 },
    text: {
      en: 'A CNT minister opens the Public Instruction card: the Pedagogical Missions, the rural library service and the rationalist curriculum. Puristas read every school decree as the state swallowing the revolution.',
      zh: 'CNT 部长在位时开放「公共教育」政府卡：教育使团、农村图书馆与理性主义课程。纯粹派则把每一道办学政令都读成国家吞掉革命。',
    },
  },
  health: {
    dissent: { Puristas: 6 },
    text: {
      en: 'After November 1936 a CNT minister can direct hospitals, child evacuation and relief — the one portfolio the movement held while claiming to abolish ministries.',
      zh: '1936 年 11 月之后，CNT 部长可以调动医院、儿童疏散与救济——这是运动一边宣称要废除部委、一边实际掌握的那个部。',
    },
  },
  industry: {
    text: {
      en: 'A CNT minister can hand the pits, the mills and the foreign-owned plants to the syndicates one section at a time.',
      zh: 'CNT 部长可以一段一段地把矿井、纺织厂与外资工厂交给工团。',
    },
  },
  commerce: {
    text: {
      en: 'A CNT minister can put foreign trade under a single office and turn the blockade into a bargaining position.',
      zh: 'CNT 部长可以把对外贸易收进一个衙门，把封锁变成谈判筹码。',
    },
  },
  publicWorks: {
    text: {
      en: 'A CNT minister can collectivize the railways and the ports, and decides what actually reaches the front.',
      zh: 'CNT 部长可以推动铁路与港口的集体化，并决定究竟有多少物资真正到达前线。',
    },
  },
  labor: {
    text: {
      en: 'A CNT minister can set the workweek and workplace safety, and removes the ministry’s resistance to strike demands.',
      zh: 'CNT 部长可以设定工时与工作安全标准，并取消部里对罢工诉求的阻力。',
    },
  },
  interior: {
    text: {
      en: 'A CNT minister commands the police corps and can drive the Security Corps Law ladder.',
      zh: 'CNT 部长调遣警察力量，并可推动治安机关法的分级改革。',
    },
  },
  war: {
    text: {
      en: 'A CNT minister opens the Military Policy card: funding, officer reassignment and army drills.',
      zh: 'CNT 部长开放「军事政策」卡：军费、军官调离与整军演习。',
    },
  },
  agriculture: {
    text: {
      en: 'A CNT minister can expropriate the great estates and organize collective farming.',
      zh: 'CNT 部长可以征收大地产并组织集体农庄。',
    },
  },
  finance: {
    text: {
      en: 'A CNT minister can rewrite the tax drafts and begin dismantling the banks and the peseta.',
      zh: 'CNT 部长可以改写税率草案，并开始拆解银行与比塞塔。',
    },
  },
  estado: {
    text: {
      en: 'A CNT minister conducts the foreign negotiations and controls wartime trade policy.',
      zh: 'CNT 部长主持对外谈判，并掌握战时贸易政策。',
    },
  },
  justice: {
    text: {
      en: 'The portfolio that shields or dissolves the revolutionary tribunals, and the one the CNT held in November 1936.',
      zh: '这个部决定革命法庭是被保护还是被解散，也正是 CNT 在 1936 年 11 月拿到的那一个。',
    },
  },
};
