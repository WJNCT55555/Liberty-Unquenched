import { GameEvent, GameState } from '../../types';
import { MapFaction, Province, Army } from '../../../map/types_map';
import { INITIAL_PROVINCES, INITIAL_ARMIES } from '../../../map/map_constants';

// Helper to project armies based on choice log
export function setupArmiesForCivilWar(state: GameState, isOptionA: boolean, choices: Record<string, string>) {
  let baseArmies = state.armies ? [...state.armies] : [...INITIAL_ARMIES];
  
  const africaStatus = isOptionA ? 'nationalist' : choices['step14']; // 'nationalist' | 'delayed' | 'chaos'
  const navy = isOptionA ? 'republic' : choices['step15']; // 'republic' | 'republic_retreat' | 'anarchist'
  
  let nextArmies = baseArmies.map(army => {
    // 1. Army of Africa
    if (army.id === 'rep_africa') {
      if (isOptionA) {
        return {
          ...army,
          faction: MapFaction.NATIONALIST,
          manpower: 6000,
          maxManpower: 6000,
          morale: 90,
          militarization: 65
        };
      } else {
        if (africaStatus === 'nationalist') {
          const province = (navy === 'republic_retreat') ? 'sevilla' : 'tetouan';
          return {
            ...army,
            faction: MapFaction.NATIONALIST,
            provinceId: province,
            manpower: 6000,
            morale: 90,
            militarization: 65
          };
        } else if (africaStatus === 'delayed') {
          return {
            ...army,
            faction: MapFaction.NATIONALIST,
            manpower: 3000,
            morale: 70,
            militarization: 50
          };
        } else { // chaos
          return {
            ...army,
            faction: MapFaction.NATIONALIST,
            manpower: 1500,
            morale: 60,
            militarization: 45
          };
        }
      }
    }
    
    // 2. Sevilla Division (rep_4)
    if (army.id === 'rep_4') {
      const sevillaNationalist = isOptionA ? true : (choices['step1'] === 'A' || choices['step1'] === 'B' || choices['step1'] === 'C');
      if (sevillaNationalist) {
        return {
          ...army,
          faction: MapFaction.NATIONALIST,
          morale: 80
        };
      } else {
        return {
          ...army,
          faction: MapFaction.REPUBLICAN,
          morale: 85
        };
      }
    }
    
    // 3. Zaragoza Division (rep_5)
    if (army.id === 'rep_5') {
      const zaragozaNationalist = isOptionA ? true : (choices['step3_zaragoza'] === 'A' || choices['step3_zaragoza'] === 'B' || choices['step3_zaragoza'] === 'C');
      if (zaragozaNationalist) {
        return {
          ...army,
          faction: MapFaction.NATIONALIST,
          morale: 80,
          manpower: choices['step3_zaragoza'] === 'C' ? 2500 : 3500
        };
      } else {
        return {
          ...army,
          faction: MapFaction.REPUBLICAN,
          morale: 85
        };
      }
    }

    // 4. Burgos Division (rep_burgos_garrison)
    if (army.id === 'rep_burgos_garrison') {
      return {
        ...army,
        faction: MapFaction.NATIONALIST,
        morale: 80
      };
    }

    // 5. Navarra Division (rep_navarra_garrison)
    if (army.id === 'rep_navarra_garrison') {
      return {
        ...army,
        faction: MapFaction.NATIONALIST,
        morale: 90
      };
    }
    
    return army;
  });

  // Spawn additional armies
  // - 第21团 (Santander)
  const hasRep21 = nextArmies.some(a => a.id === 'rep_21_santander');
  if (!hasRep21) {
    nextArmies.push({
      id: 'rep_21_santander',
      faction: MapFaction.REPUBLICAN,
      provinceId: 'santander',
      movesLeft: 2,
      manpower: 3000,
      maxManpower: 3000,
      composition: { infantry: 2500, artillery: 500, tanks: 0 },
      designedComposition: { infantry: 2500, artillery: 500, tanks: 0 },
      morale: 80,
      militarization: 30
    });
  }

  // - 阿斯图里亚斯矿工纵队
  const asturiasLost = isOptionA ? true : (choices['step9_oviedo'] === 'A');
  const hasMiners = nextArmies.some(a => a.id === 'rep_asturias_miners');
  if (!hasMiners) {
    nextArmies.push({
      id: 'rep_asturias_miners',
      faction: MapFaction.REPUBLICAN,
      provinceId: asturiasLost ? 'madrid' : 'asturias',
      movesLeft: 2,
      manpower: 3500,
      maxManpower: 3500,
      composition: { infantry: 3000, artillery: 500, tanks: 0 },
      designedComposition: { infantry: 3000, artillery: 500, tanks: 0 },
      morale: 95,
      militarization: 25
    });
  }

  // - 马德里民兵
  const hasMadridMilitia = nextArmies.some(a => a.id === 'rep_madrid_militia');
  if (!hasMadridMilitia) {
    nextArmies.push({
      id: 'rep_madrid_militia',
      faction: MapFaction.REPUBLICAN,
      provinceId: 'madrid',
      movesLeft: 2,
      manpower: 4000,
      maxManpower: 4000,
      composition: { infantry: 3500, artillery: 500, tanks: 0 },
      designedComposition: { infantry: 3500, artillery: 500, tanks: 0 },
      morale: 90,
      militarization: 20
    });
  }

  // - 第8步兵师 (Galicia) at coruna
  const hasNat8 = nextArmies.some(a => a.id === 'nat_8_galicia');
  if (!hasNat8) {
    nextArmies.push({
      id: 'nat_8_galicia',
      faction: MapFaction.NATIONALIST,
      provinceId: 'coruna',
      movesLeft: 2,
      manpower: 4000,
      maxManpower: 4000,
      composition: { infantry: 3000, artillery: 1000, tanks: 0 },
      designedComposition: { infantry: 3000, artillery: 1000, tanks: 0 },
      morale: 80,
      militarization: 35
    });
  }

  return nextArmies;
}

// Global choices store in state, let's keep track using custom temporary fields
export const civilWarSetup: GameEvent = {
  id: 'civil_war_setup',
  title: '内战爆发：局势设置',
  titleZh: '内战爆发：局势设置',
  description: '西班牙的天空笼罩在乌云之下。军官团发起了旨在推翻共和国政府的武装叛乱。尽管政变在马德里和巴塞罗那受挫，但在全国引发了骨肉相残的全面冲突。我们该如何应对这场骨肉相残冲突的混乱开局？',
  descriptionZh: '西班牙的天空笼罩在乌云之下。军官团发起了旨在推翻共和国政府的武装叛乱。尽管政变在马德里和巴塞罗那受挫，但在全国引发了骨肉相残的全面冲突。我们该如何应对这场骨肉相残冲突的混乱开局？',
  options: [
    {
      text: '默认历史配置（快速开始）',
      textZh: '默认历史配置（快速开始）',
      subtitle: '直接以1936年历史边界和兵力部署开始内战',
      subtitleZh: '直接以1936年历史边界和兵力部署开始内战',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        const nationalistProvinces = [
          'sevilla', 'cadiz', 'cordoba', 'granada', 'zaragoza', 'huesca', 'teruel', 
          'navarra', 'alava', 'oviedo', 'coruna', 'lugo', 'orense', 'pontevedra', 
          'balears', 'avila', 'burgos', 'rioja', 'palencia', 'segovia', 'soria', 
          'valladolid', 'leon', 'salamanca', 'zamora', 'caceres',
          // colonies and default nationalist zones
          'ceuta', 'melilla', 'laspalmas', 'santacruzdetenerife', 'tetouan', 
          'larache', 'nador', 'chefchaouen', 'alhoceima', 'huelva'
        ];
        
        nationalistProvinces.forEach(id => {
          if (nextProvinces[id]) {
            nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.NATIONALIST };
          }
        });

        const nextArmies = setupArmiesForCivilWar(state, true, {});

        // Apply state updates
        return {
          ...state,
          civilWarStatus: 'ongoing',
          provinces: nextProvinces,
          armies: nextArmies,
          sanjurjoStatus: 'dead',
          francoAfricaControl: true,
          // Stats updates
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 8),
            republicanAuthority: Math.min(100, (state.stats?.republicanAuthority || 0) + 3),
            tension: Math.min(100, (state.stats?.tension || 0) + 8),
          },
          relations: {
            ...state.relations,
            italy: (state.relations?.italy || 0) - 5
          },
          currentEvent: null,
          phase: 'action',
          actionsLeft: 2
        };
      }
    },
    {
      text: '沉浸式内战事件链',
      textZh: '沉浸式内战事件链',
      subtitle: '通过一系列历史事件抉择，亲手塑造内战爆发时的势力边界和军队归属',
      subtitleZh: '通过一系列历史事件抉择，亲手塑造内战爆发时的势力边界和军队归属',
      effect: (state) => {
        // Initialize an empty choices log in state
        return {
          ...state,
          civilWarChainStep: 1,
          currentEvent: civilWarStep1,
          phase: 'event',
          // Reset all provinces and armies to base Republican to start the chain
          provinces: { ...INITIAL_PROVINCES },
          armies: [...INITIAL_ARMIES],
          // Custom log object to track choices
          civilWarChoices: {}
        };
      }
    }
  ]
};

// --- IMMERSIVE EVENTS CHAIN ---

// 1. Sevilla's Trick
export const civilWarStep1: GameEvent = {
  id: 'cw_step1_sevilla_trick',
  title: '七月十八日—塞维利亚的诡计',
  titleZh: '七月十八日—塞维利亚的诡计',
  description: '安达卢西亚首府塞维利亚。凯波·德·利亚诺将军——这位被政府疏忽的阴谋家——用假名潜入城中。他尚未暴露，正密谋夺取广播电台。安达卢西亚的工人没有武器，而省长还在为驻军的忠诚打包票。',
  descriptionZh: '安达卢西亚首府塞维利亚。凯波·德·利亚诺将军——这位被政府疏忽的阴谋家——用假名潜入城中。他尚未暴露，正密谋夺取广播电台。安达卢西亚的工人没有武器，而省长还在为驻军的忠诚打包票。',
  options: [
    {
      text: '尊重地方政府的判断（历史选项）',
      textZh: '尊重地方政府的判断（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['sevilla']) nextProvinces['sevilla'] = { ...nextProvinces['sevilla'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['cadiz']) nextProvinces['cadiz'] = { ...nextProvinces['cadiz'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step1: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 2,
          currentEvent: civilWarStep2Result
        };
      }
    },
    {
      text: '联合UGT，强行发起总罢工！',
      textZh: '联合UGT，强行发起总罢工！',
      condition: (state) => {
        return (state.partyRelations?.PSOE ?? 0) >= 80;
      },
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['sevilla']) nextProvinces['sevilla'] = { ...nextProvinces['sevilla'], owner: MapFaction.NATIONALIST };
        // cadiz stays Republican
        
        const choices = { ...(state as any).civilWarChoices, step1: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 2,
          currentEvent: civilWarStep2Result
        };
      }
    },
    {
      text: '立刻利用我们的电台告知民众政变发生的消息',
      textZh: '立刻利用我们的电台告知民众政变发生的消息',
      condition: (state) => (state.radio || 0) >= 2, // Radio condition representation
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['granada']) nextProvinces['granada'] = { ...nextProvinces['granada'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step1: 'C' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 2,
          currentEvent: civilWarStep2Result
        };
      }
    },
    {
      text: '拉蒙佛朗哥已经确保老战友利亚诺继续忠于共和',
      textZh: '拉蒙佛朗哥已经确保老战友利亚诺继续忠于共和',
      condition: (state) => state.activeAdvisors?.some(a => a?.id === 'Ramón Franco') || false,
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step1: 'D' };
        return {
          ...state,
          civilWarChoices: choices,
          civilWarChainStep: 2,
          currentEvent: civilWarStep2Result
        };
      }
    }
  ]
};

// 2. Sevilla Result
export const civilWarStep2Result: GameEvent = {
  id: 'cw_step2_sevilla_result',
  title: '塞维利亚的诡计：结果',
  titleZh: '塞维利亚的诡计：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step1 || 'A';
    if (choice === 'A') {
      return '利亚诺顺利夺取广播电台，用谎言控制了全城。塞维利亚和加迪斯落入叛军之手——安达卢西亚首府成为叛军在南方最重要的据点。';
    } else if (choice === 'B') {
      return 'UGT和CNT罕见联手，安达卢西亚工人拿到了武器。塞维利亚陷入巷战。利亚诺的诡计被部分挫败——加迪斯和维尔瓦留在了共和国手中。';
    } else if (choice === 'C') {
      return 'CNT单方面发动总罢工。塞维利亚郊区出现了武装抵抗，但缺乏协调。格拉纳达陷落，共和国权威因CNT的独走而受损。安达卢西亚陷入混乱。';
    } else {
      return '拉蒙·佛朗哥的干预奏效了。利亚诺将军公开重申对共和国的忠诚，塞维利亚驻军按兵不动。安达卢西亚首府——连同它的广播电台 and 行政机构——完整留在共和国手中。叛军在南方失去了最关键的第一个据点。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 3,
          currentEvent: civilWarStep3
        };
      }
    }
  ]
};

// 3. Andalusia's Two Ends
export const civilWarStep3: GameEvent = {
  id: 'cw_step3_andalusia_ends',
  title: '七月十七至十八日—安达卢西亚的两端',
  titleZh: '七月十七至十八日—安达卢西亚的两端',
  description: '安达卢西亚陷入两面夹击。西端——马拉加。帕特克索特将军的叛军在七月十八日晚占领了市中心，但次日清晨却做出了匪夷所思的决定：命令叛军撤回兵营。工人抓住了这个千载难逢的机会。东端——科尔多瓦和格拉纳达。同日下午六点，科尔多瓦驻军举起了叛旗；格拉纳达的突击卫队参与叛乱。工人未获武器——这是安达卢西亚最黑暗的时刻。',
  descriptionZh: '安达卢西亚陷入两面夹击。西端——马拉加。帕特克索特将军的叛军在七月十八日晚占领了市中心，但次日清晨却做出了匪夷所思的决定：命令叛军撤回兵营。工人抓住了这个千载难逢的机会。东端——科尔多瓦和格拉纳达。同日下午六点，科尔多瓦驻军举起了叛旗；格拉纳达的突击卫队参与叛乱。工人未获武器——这是安达卢西亚最黑暗的时刻。',
  options: [
    {
      text: '静观其变（历史选项）',
      textZh: '静观其变（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['malaga']) nextProvinces['malaga'] = { ...nextProvinces['malaga'], owner: MapFaction.REPUBLICAN };
        if (nextProvinces['cordoba']) nextProvinces['cordoba'] = { ...nextProvinces['cordoba'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['granada']) nextProvinces['granada'] = { ...nextProvinces['granada'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step3: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 4,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 3)
          },
          currentEvent: civilWarStep4Result
        };
      }
    },
    {
      text: '调马拉加工人南下驰援科尔多瓦',
      textZh: '调马拉加工人南下驰援科尔多瓦',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['malaga']) nextProvinces['malaga'] = { ...nextProvinces['malaga'], owner: MapFaction.REPUBLICAN };
        // Cordoba is contested - stays Republican but highly vulnerable
        if (nextProvinces['cordoba']) nextProvinces['cordoba'] = { ...nextProvinces['cordoba'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step3: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 4,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 5)
          },
          currentEvent: civilWarStep4Result
        };
      }
    },
    {
      text: '安达卢西亚仍然在燃烧',
      textZh: '安达卢西亚仍然在燃烧',
      condition: (state) => state.activeAdvisors?.some(a => a?.id === 'Pedro Vallina') || false,
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['malaga']) nextProvinces['malaga'] = { ...nextProvinces['malaga'], owner: MapFaction.REPUBLICAN };
        if (nextProvinces['granada']) nextProvinces['granada'] = { ...nextProvinces['granada'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step3: 'C' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 4,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 8),
            republicanAuthority: Math.max(0, (state.stats?.republicanAuthority || 0) - 10)
          },
          currentEvent: civilWarStep4Result
        };
      }
    }
  ]
};

// 4. Andalusia Result
export const civilWarStep4Result: GameEvent = {
  id: 'cw_step4_andalusia_result',
  title: '安达卢西亚：结果',
  titleZh: '安达卢西亚：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step3 || 'A';
    if (choice === 'A') {
      return '马拉加工人用汽油和勇气包围了兵营。被烟熏得半死的叛军向突击警察缴械投降——马拉加牢牢掌握在人民手中。但科尔多瓦和格拉纳达的工人未获武装，安达卢西亚内陆的粮仓落入叛军之手。';
    } else if (choice === 'B') {
      return '部分马拉加工人南下，与科尔多瓦周边农村的CNT农民并肩作战。马拉加勉强守住但防守薄弱，科尔多瓦陷入巷战。安达卢西亚两面都在苦苦支撑——代价高昂的抉择。';
    } else {
      return 'CNT的总罢工席卷安达卢西亚。马拉加工人自主解放了城市——共和国权威遭到严重削弱。科尔多瓦城市陷落，但广袤农村变成了无政府主义游击区。安达卢西亚在混乱中燃烧。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 5,
          currentEvent: civilWarStep5
        };
      }
    }
  ]
};

// 5. Zaragoza's Trust Crisis
export const civilWarStep5: GameEvent = {
  id: 'cw_step5_zaragoza_trust',
  title: '七月十八日—萨拉戈萨的信任危机',
  titleZh: '七月十八日—萨拉戈萨的信任危机',
  description: '萨拉戈萨，阿拉贡首府，CNT的北方堡垒。当地驻军指挥官卡瓦内利亚斯将军自称忠于共和国，并承诺"提防法西斯活动"。CNT萨拉戈萨分会的领导人正在与他谈判。但三十公里外的兵营里，长枪党徒和乡绅正被秘密编入叛军。',
  descriptionZh: '萨拉戈萨，阿拉贡首府，CNT的北方堡垒。当地驻军指挥官卡瓦内利亚斯将军自称忠于共和国，并承诺"提防法西斯活动"。CNT萨拉戈萨分会的领导人正在与他谈判。但三十公里外的兵营里，长枪党徒和乡绅正被秘密编入叛军。',
  options: [
    {
      text: '接受将军的保证，回家吧工人们（历史选项）',
      textZh: '接受将军的保证，回家吧工人们（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['zaragoza']) nextProvinces['zaragoza'] = { ...nextProvinces['zaragoza'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['huesca']) nextProvinces['huesca'] = { ...nextProvinces['huesca'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['teruel']) nextProvinces['teruel'] = { ...nextProvinces['teruel'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step3_zaragoza: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 6,
          currentEvent: civilWarStep6Result
        };
      }
    },
    {
      text: '不听保证，立即发动总罢工抢占先机',
      textZh: '不听保证，立即发动总罢工抢占先机',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['zaragoza']) nextProvinces['zaragoza'] = { ...nextProvinces['zaragoza'], owner: MapFaction.NATIONALIST };
        // huesca & teruel stay Republican
        if (nextProvinces['huesca']) nextProvinces['huesca'] = { ...nextProvinces['huesca'], owner: MapFaction.REPUBLICAN };
        if (nextProvinces['teruel']) nextProvinces['teruel'] = { ...nextProvinces['teruel'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step3_zaragoza: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 6,
          currentEvent: civilWarStep6Result
        };
      }
    },
    {
      text: '表面接受，秘密部署武装工人',
      textZh: '表面接受，秘密部署武装工人',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['zaragoza']) nextProvinces['zaragoza'] = { ...nextProvinces['zaragoza'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['huesca']) nextProvinces['huesca'] = { ...nextProvinces['huesca'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['teruel']) nextProvinces['teruel'] = { ...nextProvinces['teruel'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step3_zaragoza: 'C' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 6,
          currentEvent: civilWarStep6Result
        };
      }
    }
  ]
};

// 6. Zaragoza Result
export const civilWarStep6Result: GameEvent = {
  id: 'cw_step6_zaragoza_result',
  title: '萨拉戈萨的信任危机：结果',
  titleZh: '萨拉戈萨的信任危机：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step3_zaragoza || 'A';
    if (choice === 'A') {
      return '卡瓦内利亚斯露出了真面目。萨拉戈萨和阿拉贡大部落入叛军之手。三万名有组织的CNT工人发现自己手无寸铁地面对机关枪。这是CNT在北方最惨痛的失败。';
    } else if (choice === 'B') {
      return 'CNT抢先发动总罢工。萨拉戈萨陷入巷战，阿拉贡东部留在了共和国手中。当地CNT成员激增，阿拉贡防卫委员会随即成立，民兵士气高涨。';
    } else {
      return '表面谈判、暗中部署的策略取得了一定成效。萨拉戈萨街头爆发混战，叛军付出了额外的伤亡代价，但最终仍占领了城市。这场伏击让叛军意识到了阿拉贡工人的激烈反抗。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 7,
          currentEvent: civilWarStep7
        };
      }
    }
  ]
};

// 7. Midnight of Old Castile
export const civilWarStep7: GameEvent = {
  id: 'cw_step7_old_castile',
  title: '七月十九日—旧卡斯蒂利亚的午夜',
  titleZh: '七月十九日—旧卡斯蒂利亚的午夜',
  description: '旧卡斯蒂利亚。在巴利亚多利德和布尔戈斯，叛乱在深夜骤然爆发。更可怕的是，国民卫队与突击卫队携手加入了起义，甚至在睡梦中逮捕了当地的工人领袖。工人们发现本该保护他们的警察已全部倒戈，这是旧卡斯蒂利亚最彻底的背叛。',
  descriptionZh: '旧卡斯蒂利亚。在巴利亚多利德和布尔戈斯，叛乱在深夜骤然爆发。更可怕的是，国民卫队与突击卫队携手加入了起义，甚至在睡梦中逮捕了当地的工人领袖。工人们发现本该保护他们的警察已全部倒戈，这是旧卡斯蒂利亚最彻底的背叛。',
  options: [
    {
      text: '接受现实，让我们做好战斗准备（历史选项）',
      textZh: '接受现实，让我们做好战斗准备（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        const castile = ['avila', 'burgos', 'rioja', 'palencia', 'segovia', 'soria', 'valladolid', 'leon', 'salamanca', 'zamora', 'caceres'];
        castile.forEach(id => {
          if (nextProvinces[id]) nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.NATIONALIST };
        });
        
        const choices = { ...(state as any).civilWarChoices, step4_castile: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 8,
          currentEvent: civilWarStep8Result
        };
      }
    },
    {
      text: '工厂抢运机器、炸毁桥梁，焦土撤退',
      textZh: '工厂抢运机器、炸毁桥梁，焦土撤退',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        const castile = ['avila', 'burgos', 'rioja', 'palencia', 'segovia', 'soria', 'valladolid', 'leon', 'salamanca', 'zamora', 'caceres'];
        castile.forEach(id => {
          if (nextProvinces[id]) nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.NATIONALIST };
        });
        
        const choices = { ...(state as any).civilWarChoices, step4_castile: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 8,
          stats: {
            ...state.stats,
            republicanAuthority: Math.max(0, (state.stats?.republicanAuthority || 0) - 5)
          },
          currentEvent: civilWarStep8Result
        };
      }
    }
  ]
};

// 8. Old Castile Result
export const civilWarStep8Result: GameEvent = {
  id: 'cw_step8_old_castile_result',
  title: '旧卡斯蒂利亚的午夜：结果',
  titleZh: '旧卡斯蒂利亚的午夜：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step4_castile || 'A';
    if (choice === 'A') {
      return '巴利亚多利德和布尔戈斯在午夜的风中举起了叛旗。工人组织未作抵抗——CNT领导人在睡梦中被国民卫队逮捕。旧卡斯蒂利亚完整落入叛军之手。';
    } else {
      return '机器被拆卸运往南方，铁路桥梁在炸药声中崩塌。布尔戈斯的叛军缴获了一座空城。CNT的工业遗产和骨干得以保存，但焦土政策也给沿途留下了沉重的阴影。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 9,
          currentEvent: civilWarStep9
        };
      }
    }
  ]
};

// 9. Carlist Crusade of Navarre
export const civilWarStep9: GameEvent = {
  id: 'cw_step9_navarra',
  title: '七月十九日—纳瓦拉的十字军',
  titleZh: '七月十九日—纳瓦拉的十字军',
  description: '纳瓦拉——卡洛斯派的传统堡垒——热情地欢迎了叛军。红色的贝雷帽与绿色的十字臂章随处可见，成千上万的"呼啸兵"（Requetés）自愿军背着行囊从山上涌入城市，支持莫拉将军发起保卫信仰的圣战，准备向马德里进军。',
  descriptionZh: '纳瓦拉——卡洛斯派的传统堡垒——热情地欢迎了叛军。红色的贝雷帽与绿色的十字臂章随处可见，成千上万的"呼啸兵"（Requetés）自愿军背着行囊从山上涌入城市，支持莫拉将军发起保卫信仰的圣战，准备向马德里进军。',
  options: [
    {
      text: '纳瓦拉的呼啸兵将为基督君王作战（历史选项）',
      textZh: '纳瓦拉的呼啸兵将为基督君王作战（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['navarra']) nextProvinces['navarra'] = { ...nextProvinces['navarra'], owner: MapFaction.NATIONALIST };
        
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChainStep: 10,
          stats: {
            ...state.stats,
            tension: Math.min(100, (state.stats?.tension || 0) + 8)
          },
          currentEvent: civilWarStep10Result
        };
      }
    }
  ]
};

// 10. Navarre Result
export const civilWarStep10Result: GameEvent = {
  id: 'cw_step10_navarra_result',
  title: '纳瓦拉的卡洛斯派十字军：结果',
  titleZh: '纳瓦拉的卡洛斯派十字军：结果',
  description: '纳瓦拉的呼啸兵如潮水般涌入莫拉的部队。红色贝雷帽成为叛军在北方战场最令人生畏的标志。布尔戈斯和潘普洛纳变成了国民军的精神首都——十字军的热忱在此燃烧得最为炽烈。但这股极端的卡洛斯圣战狂热也让同属叛军的世俗长枪党感到戒备。',
  descriptionZh: '纳瓦拉的呼啸兵如潮水般涌入莫拉的部队。红色贝雷帽成为叛军在北方战场最令人生畏的标志。布尔戈斯和潘普洛纳变成了国民军的精神首都——十字军的热忱在此燃烧得最为炽烈。但这股极端的卡洛斯圣战狂热也让同属叛军的世俗长枪党感到戒备。',
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 11,
          currentEvent: civilWarStep11
        };
      }
    }
  ]
};

// 11. Basque's Choice
export const civilWarStep11: GameEvent = {
  id: 'cw_step11_basque',
  title: '七月十八至二十一日—巴斯克的抉择',
  titleZh: '七月十八至二十一日—巴斯克的抉择',
  description: '巴斯克地区。毕尔巴鄂驻军首领犹豫不决，而巴斯克民族主义党（PNV）公开发表广播与宣言全力谴责政变，支持共和国。但在圣塞瓦斯蒂安，洛约拉兵营的叛军突然发动起义，国民警卫队倒戈并强攻全劳联大楼，局势万分危急。',
  descriptionZh: '巴斯克地区。毕尔巴鄂驻军首领犹豫不决，而巴斯克民族主义党（PNV）公开发表广播与宣言全力谴责政变，支持共和国。但在圣塞瓦斯蒂安，洛约拉兵营的叛军突然发动起义，国民警卫队倒戈并强攻全劳联大楼，局势万分危急。',
  options: [
    {
      text: '信任巴斯克民族主义党领导',
      textZh: '信任巴斯克民族主义党领导',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['vizcaya']) nextProvinces['vizcaya'] = { ...nextProvinces['vizcaya'], owner: MapFaction.REPUBLICAN };
        if (nextProvinces['guipuzcoa']) nextProvinces['guipuzcoa'] = { ...nextProvinces['guipuzcoa'], owner: MapFaction.REPUBLICAN };
        if (nextProvinces['alava']) nextProvinces['alava'] = { ...nextProvinces['alava'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step5_basque: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 12,
          currentEvent: civilWarStep12Result
        };
      }
    },
    {
      text: 'CNT主导圣塞瓦斯蒂安抵抗，包围洛约拉兵营',
      textZh: 'CNT主导圣塞瓦斯蒂安抵抗，包围洛约拉兵营',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['vizcaya']) nextProvinces['vizcaya'] = { ...nextProvinces['vizcaya'], owner: MapFaction.REPUBLICAN };
        if (nextProvinces['guipuzcoa']) nextProvinces['guipuzcoa'] = { ...nextProvinces['guipuzcoa'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step5_basque: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 12,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 8),
            republicanAuthority: Math.max(0, (state.stats?.republicanAuthority || 0) - 5)
          },
          currentEvent: civilWarStep12Result
        };
      }
    },
    {
      text: '毕尔巴鄂工人趁驻军犹豫抢先夺取重工业区',
      textZh: '毕尔巴鄂工人趁驻军犹豫抢先夺取重工业区',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['vizcaya']) nextProvinces['vizcaya'] = { ...nextProvinces['vizcaya'], owner: MapFaction.REPUBLICAN };
        if (nextProvinces['guipuzcoa']) nextProvinces['guipuzcoa'] = { ...nextProvinces['guipuzcoa'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step5_basque: 'C' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 12,
          stats: {
            ...state.stats,
            republicanAuthority: Math.max(0, (state.stats?.republicanAuthority || 0) - 8)
          },
          currentEvent: civilWarStep12Result
        };
      }
    }
  ]
};

// 12. Basque Result
export const civilWarStep12Result: GameEvent = {
  id: 'cw_step12_basque_result',
  title: '巴斯克的抉择：结果',
  titleZh: '巴斯克的抉择：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step5_basque || 'A';
    if (choice === 'A') {
      return 'PNV的广播和公报稳住了巴斯克。毕尔巴鄂驻军继续按兵不动，桑坦德兵营投降。圣塞瓦斯蒂安的工人和巴斯克民族主义者并肩作战，洛约拉兵营在月底前被攻克。巴斯克完整留在共和国手中。';
    } else if (choice === 'B') {
      return '圣塞瓦斯蒂安变成了第二个巴塞罗那。CNT工人没有等待PNV的指令，直接包围了洛约拉兵营并用装甲列车炮击，强攻下国民警卫队守备。这极大地展示了无产阶级的革命力量，但PNV对CNT的擅自行动深感不满。';
    } else {
      return '工人在驻军犹豫不决的危急关头迅速占领了毕尔巴鄂的所有钢铁厂和造船厂。当军官们终于决定行动时，发现工厂大门紧锁、顶楼排满枪口。重工业生产资料在革命中完整保留——但这究竟是人民的胜利还是危险的夺权苗头？马德里政府忧心忡忡。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 13,
          currentEvent: civilWarStep13
        };
      }
    }
  ]
};

// 13. Barcelona Barricades
export const civilWarStep13: GameEvent = {
  id: 'cw_step13_barcelona',
  title: '七月十九日—巴塞罗那街垒',
  titleZh: '七月十九日—巴塞罗那街垒',
  description: '加泰罗尼亚的黎明。七月十九日破晓，戈戴德将军率领叛军企图一举夺取巴塞罗那。但他面对的不是一盘散沙——CNT-FAI已经武装了三万名工人。杜鲁蒂、加西亚·奥利弗和阿斯卡索指挥着武装工人与突击卫队并肩冲锋。',
  descriptionZh: '加泰罗尼亚的黎明。七月十九日破晓，戈戴德将军率领叛军企图一举夺取巴塞罗那。但他面对的不是一盘散沙——CNT-FAI已经武装了三万名工人。杜鲁蒂、加西亚·奥利弗 and 阿斯卡索指挥着武装工人与突击卫队并肩冲锋。',
  options: [
    {
      text: '筑起街垒，与突击卫队协同行动（历史选项）',
      textZh: '筑起街垒，与突击卫队协同行动（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        const cat = ['barcelona', 'gerona', 'lerida', 'tarragona'];
        cat.forEach(id => {
          if (nextProvinces[id]) nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.REPUBLICAN };
        });
        
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChainStep: 14,
          currentEvent: civilWarStep14Result
        };
      }
    }
  ]
};

// 14. Barcelona Result
export const civilWarStep14Result: GameEvent = {
  id: 'cw_step14_barcelona_result',
  title: '巴塞罗那街垒：结果',
  titleZh: '巴塞罗那街垒：结果',
  description: '工人的冲锋与突击卫队的火力相互配合。政变军官戈戴德下午在电台宣布投降。巴塞罗那守住了，但革命被「规范」了——全劳联和UGT分享权力，加泰罗尼亚反法西斯民兵中央委员会成立。共和国在加泰罗尼亚的权威得以保留。',
  descriptionZh: '工人的冲锋与突击卫队的火力相互配合。政变军官戈戴德下午在电台宣布投降。巴塞罗那守住了，但革命被「规范」了——全劳联和UGT分享权力，加泰罗尼亚反法西斯民兵中央委员会成立。共和国在加泰罗尼亚的权威得以保留。',
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 15,
          currentEvent: civilWarStep15
        };
      }
    }
  ]
};

// 15. Madrid Montana Barracks
export const civilWarStep15: GameEvent = {
  id: 'cw_step15_madrid',
  title: '七月十九日—马德里蒙塔尼亚兵营',
  titleZh: '七月十九日—马德里蒙塔尼亚兵营',
  description: '马德里。范胡尔将军（Fanjul）坐镇蒙塔尼亚兵营——叛军在首都的主要据点。但他犹豫了，没有趁夜突围，而是向外面的群众开火。这一公开挑衅激起了全城的怒火。社会党希尔中校在炮兵公园向群众发放了五千支步枪。',
  descriptionZh: '马德里。范胡尔将军（Fanjul）坐镇蒙塔尼亚兵营——叛军在首都的主要据点。但他犹豫了，没有趁夜突围，而是向外面的群众开火。这一公开挑衅激起了全城的怒火。社会党希尔中校在炮兵公园向群众发放了五千支步枪。',
  options: [
    {
      text: '强攻蒙塔尼亚兵营（历史选项）',
      textZh: '强攻蒙塔尼亚兵营（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['madrid']) nextProvinces['madrid'] = { ...nextProvinces['madrid'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step8_madrid: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 16,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 5)
          },
          currentEvent: civilWarStep16Result
        };
      }
    },
    {
      text: '围而不攻，用炮兵和航空兵逼迫投降',
      textZh: '围而不攻，用炮兵 and 航空兵逼迫投降',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['madrid']) nextProvinces['madrid'] = { ...nextProvinces['madrid'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step8_madrid: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 16,
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, (state.stats?.republicanAuthority || 0) + 3)
          },
          currentEvent: civilWarStep16Result
        };
      }
    },
    {
      text: '分兵支援瓜达拉哈拉和托莱多',
      textZh: '分兵支援瓜达拉哈拉和托莱多',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['madrid']) nextProvinces['madrid'] = { ...nextProvinces['madrid'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step8_madrid: 'C' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 16,
          currentEvent: civilWarStep16Result
        };
      }
    }
  ]
};

// 16. Madrid Result
export const civilWarStep16Result: GameEvent = {
  id: 'cw_step16_madrid_result',
  title: '马德里蒙塔尼亚兵营：结果',
  titleZh: '马德里蒙塔尼亚兵营：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step8_madrid || 'A';
    if (choice === 'A') {
      return '数千名武装工人高喊着口号冲进兵营大院，全歼了叛军。范胡尔将军被俘，随后在军事审判后被处决。马德里兵营的沦陷标志着政变在首都彻底破产。';
    } else if (choice === 'B') {
      return '在强大的炮火和战机轰鸣声中，孤立无援的叛军在两天后升起了白旗。范胡尔被俘。共和国在马德里维护了法纪和权威，避免了惨重的平民伤亡。';
    } else {
      return '马德里工人在攻克兵营的同时，组织了一支由忠诚军官带领的纵队直扑瓜达拉哈拉与托莱多，巩固了首都周边的战略屏障。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 17,
          currentEvent: civilWarStep17
        };
      }
    }
  ]
};

// 17. Oviedo's Betrayal
export const civilWarStep17: GameEvent = {
  id: 'cw_step17_oviedo',
  title: '七月十九日—奥维耶多的背叛',
  titleZh: '七月十九日—奥维耶多的背叛',
  description: '阿斯图里亚斯，矿工的家园。驻军首领阿兰达上校口头上坚称对政府效忠，甚至主张派矿工纵队坐火车前去增援马德里。然而，就在三千名大意无备的矿工登上火车出发后，阿兰达露出了狰狞的面目：他立刻下令封锁省会，宣布归顺叛军，将大炮架向了市政厅。',
  descriptionZh: '阿斯图里亚斯，矿工的家园。驻军首领阿兰达上校口头上坚称对政府效忠，甚至主张派矿工纵队坐火车前去增援马德里。然而，就在三千名大意无备的矿工登上火车出发后，阿兰达露出了狰狞的面目：他立刻下令封锁省会，宣布归顺叛军，将大炮架向了市政厅。',
  options: [
    {
      text: '矿工登上火车，支援马德里（历史选项）',
      textZh: '矿工登上火车，支援马德里（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['oviedo']) nextProvinces['oviedo'] = { ...nextProvinces['oviedo'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step9_oviedo: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 18,
          currentEvent: civilWarStep18Result
        };
      }
    },
    {
      text: '矿工留下，保卫阿斯图里亚斯',
      textZh: '矿工留下，保卫阿斯图里亚斯',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['oviedo']) nextProvinces['oviedo'] = { ...nextProvinces['oviedo'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step9_oviedo: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 18,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 5)
          },
          currentEvent: civilWarStep18Result
        };
      }
    },
    {
      text: '一半矿工南下，一半留守',
      textZh: '一半矿工南下，一半留守',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['oviedo']) nextProvinces['oviedo'] = { ...nextProvinces['oviedo'], owner: MapFaction.REPUBLICAN };
        
        const choices = { ...(state as any).civilWarChoices, step9_oviedo: 'C' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 18,
          currentEvent: civilWarStep18Result
        };
      }
    }
  ]
};

// 18. Oviedo Result
export const civilWarStep18Result: GameEvent = {
  id: 'cw_step18_oviedo_result',
  title: '奥维耶多的背叛：结果',
  titleZh: '奥维耶多的背叛：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step9_oviedo || 'A';
    if (choice === 'A') {
      return '矿工们在路上得知阿兰达叛变，愤怒地返身包围了奥维耶多，并在特鲁比亚缴获了大量军械。马德里得到了一支极其勇猛的生力军，但阿斯图里亚斯也陷入了艰苦的围城僵局中。';
    } else if (choice === 'B') {
      return '矿工们没有被谎言蒙蔽，坚定地选择留下。阿兰达的阴谋一露头就被粉碎，奥维耶多及整个阿斯图里亚斯完整地留在了人民手中。但这导致首都少了一支威名赫赫的精锐增援。';
    } else {
      return '矿工们决定分兵应对。在一场血腥的持续三天的巷战之后，共和国夺回了奥维耶多的控制权，保住了本地工业，同时也对马德里输送了一定数目的北方法系军人。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 19,
          currentEvent: civilWarStep19
        };
      }
    }
  ]
};

// 19. Struggle in Galicia
export const civilWarStep19: GameEvent = {
  id: 'cw_step19_galicia',
  title: '七月十九日—加利西亚的抗争',
  titleZh: '七月十九日—加利西亚的抗争',
  description: '西班牙西北角的加利西亚拥有极其现代化的费罗尔军港（Ferrol）以及拉科鲁尼亚等出海口。在这里，第8步兵师发起叛乱，而维哥的工会和费罗尔的海军军械厂工人正在筑起防线，企图保住这条大西洋大后方的生命补给线。',
  descriptionZh: '西班牙西北角的加利西亚拥有极其现代化的费罗尔军港（Ferrol）以及拉科鲁尼亚等出海口。在这里，第8步兵师发起叛乱，而维哥的工会和费罗尔的海军军械厂工人正在筑起防线，企图保住这条大西洋大后方的生命补给线。',
  options: [
    {
      text: '尊重军方命令，工人不抵抗（历史选项）',
      textZh: '尊重军方命令，工人不抵抗（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        const galicia = ['coruna', 'lugo', 'orense', 'pontevedra'];
        galicia.forEach(id => {
          if (nextProvinces[id]) nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.NATIONALIST };
        });
        
        const choices = { ...(state as any).civilWarChoices, step10_galicia: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 20,
          currentEvent: civilWarStep20Result
        };
      }
    },
    {
      text: '集中力量保卫费罗尔军港，与水兵联合夺取军械库',
      textZh: '集中力量保卫费罗尔军港，与水兵联合夺取军械库',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['coruna']) nextProvinces['coruna'] = { ...nextProvinces['coruna'], owner: MapFaction.REPUBLICAN }; // Coruna/Ferrol
        if (nextProvinces['lugo']) nextProvinces['lugo'] = { ...nextProvinces['lugo'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['orense']) nextProvinces['orense'] = { ...nextProvinces['orense'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['pontevedra']) nextProvinces['pontevedra'] = { ...nextProvinces['pontevedra'], owner: MapFaction.NATIONALIST };
        
        const choices = { ...(state as any).civilWarChoices, step10_galicia: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 20,
          currentEvent: civilWarStep20Result
        };
      }
    },
    {
      text: '重点保卫维哥港及沿海走廊，保障海上补给',
      textZh: '重点保卫维哥港及沿海走廊，保障海上补给',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['coruna']) nextProvinces['coruna'] = { ...nextProvinces['coruna'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['lugo']) nextProvinces['lugo'] = { ...nextProvinces['lugo'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['orense']) nextProvinces['orense'] = { ...nextProvinces['orense'], owner: MapFaction.NATIONALIST };
        if (nextProvinces['pontevedra']) nextProvinces['pontevedra'] = { ...nextProvinces['pontevedra'], owner: MapFaction.REPUBLICAN }; // Vigo coastal
        
        const choices = { ...(state as any).civilWarChoices, step10_galicia: 'C' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 20,
          stats: {
            ...state.stats,
            bureaucratization: Math.max(0, (state.stats?.bureaucratization || 0) - 3)
          },
          currentEvent: civilWarStep20Result
        };
      }
    }
  ]
};

// 20. Galicia Result
export const civilWarStep20Result: GameEvent = {
  id: 'cw_step20_galicia_result',
  title: '加利西亚的抗争：结果',
  titleZh: '加利西亚的抗争：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step10_galicia || 'A';
    if (choice === 'A') {
      return '加利西亚在两天内完全沦陷。费罗尔军港——西班牙最现代化、防守最坚固的战略母港完整地落入叛军手中，共和国在比斯开湾北段的局势被完全孤立。';
    } else if (choice === 'B') {
      return '费罗尔的码头工人和水兵成功控制了这一关键的海军母港，阻击了叛军。虽然内陆三省仍丢掉了，但这极大地振奋了西北的反法西斯武装，犹如一座在大雾中坚守的灯塔。';
    } else {
      return '维哥等大西洋沿岸走廊被工人英勇地守住。这是一条通往外界的生命走廊，但鉴于周边已被保皇叛军包围，这条狭长的海岸线时常处于炮火的致命威胁下。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 21,
          currentEvent: civilWarStep21
        };
      }
    }
  ]
};

// 21. Valencia's Silence
export const civilWarStep21: GameEvent = {
  id: 'cw_step21_valencia',
  title: '七月十九至二十日—瓦伦西亚的静默',
  titleZh: '七月十九至二十日—瓦伦西亚的静默',
  description: '列万特首府瓦伦西亚。政变的叛乱阴谋暗中流传，第3步兵师蠢蠢欲动，省长和军官各执一词。全劳联与人民阵线正对峙胶着，城市中的政治真空和武装分配问题导致了全城的死静。三方势力彼此角力，剑拔弩张。',
  descriptionZh: '列万特首府瓦伦西亚。政变的叛乱阴谋暗中流传，第3步兵师蠢蠢欲动，省长和军官各执一词。全劳联与人民阵线正对峙胶着，城市中的政治真空和武装分配问题导致了全城的死静。三方势力彼此角力，剑拔弩张。',
  options: [
    {
      text: '与军队对峙，维持总罢工施压但不进攻兵营（历史选项）',
      textZh: '与军队对峙，维持总罢工施压但不进攻兵营（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        const levante = ['valencia', 'castellon', 'alicante'];
        levante.forEach(id => {
          if (nextProvinces[id]) nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.REPUBLICAN };
        });
        
        const choices = { ...(state as any).civilWarChoices, step11_valencia: 'A' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 22,
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, (state.stats?.republicanAuthority || 0) + 3)
          },
          currentEvent: civilWarStep22Result
        };
      }
    },
    {
      text: 'CNT强行进攻兵营，不给叛军犹豫的时间',
      textZh: 'CNT强行进攻兵营，不给叛军犹豫的时间',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        const levante = ['valencia', 'castellon', 'alicante'];
        levante.forEach(id => {
          if (nextProvinces[id]) nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.REPUBLICAN };
        });
        
        const choices = { ...(state as any).civilWarChoices, step11_valencia: 'B' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 22,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 8),
            republicanAuthority: Math.max(0, (state.stats?.republicanAuthority || 0) - 10)
          },
          currentEvent: civilWarStep22Result
        };
      }
    },
    {
      text: '与马丁内斯·巴里奥代表团合作，寻求合法解决',
      textZh: '与马丁内斯·巴里奥代表团合作，寻求合法解决',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        const levante = ['valencia', 'castellon', 'alicante'];
        levante.forEach(id => {
          if (nextProvinces[id]) nextProvinces[id] = { ...nextProvinces[id], owner: MapFaction.REPUBLICAN };
        });
        
        const choices = { ...(state as any).civilWarChoices, step11_valencia: 'C' };
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChoices: choices,
          civilWarChainStep: 22,
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, (state.stats?.republicanAuthority || 0) + 8)
          },
          currentEvent: civilWarStep22Result
        };
      }
    }
  ]
};

// 22. Valencia Result
export const civilWarStep22Result: GameEvent = {
  id: 'cw_step22_valencia_result',
  title: '瓦伦西亚的静默：结果',
  titleZh: '瓦伦西亚的静默：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step11_valencia || 'A';
    if (choice === 'A') {
      return '军队被迫留在兵营内保持沉默。市民日夜监视着兵营的一举一动，在僵持中，瓦伦西亚整体上安全地保持在共和国治下。';
    } else if (choice === 'B') {
      return 'CNT的强攻在城中卷起了可怕的革命狂热。兵营被愤怒的群众彻底摧毁。列万特重归共和，但政府在本地的基层管理架构也丧失殆尽。';
    } else {
      return '温和理性的谈判促成了兵营士兵的就地裁撤，多名叛乱军官被隔离看管。巴伦西亚保留了完整的合法宪政权威，是难能可贵的有序范例。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 23,
          currentEvent: civilWarStep23
        };
      }
    }
  ]
};

// 23. Fall of Balearic Islands
export const civilWarStep23: GameEvent = {
  id: 'cw_step23_balears',
  title: '七月十九至二十日—巴利阿里群岛的陷落',
  titleZh: '七月十九至二十日—巴利阿里群岛的陷落',
  description: '地中海上的巴利阿里群岛。马略卡岛驻军首先举起叛旗，控制了全岛。梅诺卡岛由于共和水兵们的英勇制止得以留在政府手中。帕尔马港升起了起义红黄旗，意大利法西斯随即开始以此为基地派遣战机和远征军支援叛军。这严重威胁了地中海沿岸的安全。',
  descriptionZh: '地中海上的巴利阿里群岛。马略卡岛驻军首先举起叛旗，控制了全岛。梅诺卡岛由于共和水兵们的英勇制止得以留在政府手中。帕尔马港升起了起义红黄旗，意大利法西斯随即开始以此为基地派遣战机和远征军支援叛军。这严重威胁了地中海沿岸的安全。',
  options: [
    {
      text: '巴利阿里群岛大部陷落——叛军获得了地中海上的堡垒（历史选项）',
      textZh: '巴利阿里群岛大部陷落——叛军获得了地中海上的堡垒（历史选项）',
      effect: (state) => {
        const nextProvinces = { ...state.provinces };
        if (nextProvinces['balears']) nextProvinces['balears'] = { ...nextProvinces['balears'], owner: MapFaction.NATIONALIST };
        
        return {
          ...state,
          provinces: nextProvinces,
          civilWarChainStep: 24,
          relations: {
            ...state.relations,
            italy: (state.relations?.italy || 0) - 5
          },
          currentEvent: civilWarStep24Result
        };
      }
    }
  ]
};

// 24. Balearic Result
export const civilWarStep12_2Result = 'cw_step24_balears_result';
export const civilWarStep24Result: GameEvent = {
  id: civilWarStep12_2Result,
  title: '巴利阿里群岛的陷落：结果',
  titleZh: '巴利阿里群岛的陷落：结果',
  description: '马略卡岛和伊比萨岛的抵抗迅速被扑灭。意大利的萨伏亚-马切蒂轰炸机在马略卡机场降落，使地中海航线落入敌手。但唯有梅诺卡岛仍如磐石般拒绝倒戈，扼守着共和国地中海最关键的前哨阵地。',
  descriptionZh: '马略卡岛和伊比萨岛的抵抗迅速被扑灭。意大利的萨伏亚-马切蒂轰炸机在马略卡机场降落，使地中海航线落入敌手。但唯有梅诺卡岛仍如磐石般拒绝倒戈，扼守着共和国地中海最关键的前哨阵地。',
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 25,
          currentEvent: civilWarStep25
        };
      }
    }
  ]
};

// 25. Sanjurjo's Flight
export const civilWarStep25: GameEvent = {
  id: 'cw_step25_sanjurjo',
  title: '七月二十日—桑胡尔霍的飞行',
  titleZh: '七月二十日—桑胡尔霍的飞行',
  description: '政变的总策划者、传奇将领桑胡尔霍（"里夫之狮"）计划从葡萄牙埃什托里尔机场起飞，前往布尔戈斯亲自主持叛军联合军事政府。然而，他坚称要携带巨大的豪华军礼服皮箱登机，这超重了安萨尔多双翼机的额定运载极限。',
  descriptionZh: '政变的总策划者、传奇将领桑胡尔霍（"里夫之狮"）计划从葡萄牙埃什托里尔机场起飞，前往布尔戈斯亲自主持叛军联合军事政府。然而，他坚称要携带巨大的豪华军礼服皮箱登机，这超重了安萨尔多双翼机的额定运载极限。',
  options: [
    {
      text: '里夫之狮的陨落（历史选项）',
      textZh: '里夫之狮的陨落（历史选项）',
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step13: 'A' };
        return {
          ...state,
          sanjurjoStatus: 'dead',
          civilWarChoices: choices,
          civilWarChainStep: 26,
          currentEvent: civilWarStep26Result
        };
      }
    },
    {
      text: '桑胡尔霍安全抵达布尔戈斯',
      textZh: '桑胡尔霍安全抵达布尔戈斯',
      condition: (state) => state.activeAdvisors?.some(a => a?.id === 'Ramón Franco') || false,
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step13: 'B' };
        return {
          ...state,
          sanjurjoStatus: 'alive',
          civilWarChoices: choices,
          civilWarChainStep: 26,
          currentEvent: civilWarStep26Result
        };
      }
    }
  ]
};

// 26. Sanjurjo Result
export const civilWarStep26Result: GameEvent = {
  id: 'cw_step26_sanjurjo_result',
  title: '桑胡尔霍的飞行：结果',
  titleZh: '桑胡尔霍的飞行：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step13 || 'A';
    if (choice === 'A') {
      return '因无法强行起飞，飞机坠毁于葡萄牙近郊的灌木丛中并起火。桑胡尔霍不幸遇难，"里夫之狮"就此陨落。叛军群龙无首，莫拉与佛朗哥开始互相角力。';
    } else {
      return '强行说服卸载掉沉重的军装行李后，飞机惊险滑行起飞并安然降落于布尔戈斯。桑胡尔霍一下机便受到山呼海啸的欢呼，迅速统合了政变高层，莫拉与佛朗哥只得唯命是从。活着的领袖远比死去的象征能产生千百倍的影响力！';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        const choice = (state as any).civilWarChoices?.step13 || 'A';
        // If not historical dead, skip Franco takes over (Step 27/28) and go directly to Navy (Step 29)
        if (choice === 'B') {
          return {
            ...state,
            civilWarChainStep: 29,
            currentEvent: civilWarStep29
          };
        } else {
          return {
            ...state,
            civilWarChainStep: 27,
            currentEvent: civilWarStep27
          };
        }
      }
    }
  ]
};

// 27. Franco Takes Over African Army
export const civilWarStep27: GameEvent = {
  id: 'cw_step27_franco_africa',
  title: '七月二十日—佛朗哥接管非洲军团',
  titleZh: '七月二十日—佛朗哥接管非洲军团',
  description: '西属摩洛哥。桑胡尔霍之死令国民军高层大受震动。佛朗哥将军飞抵得土安，准备接管西班牙最强悍、最具杀伤力的精锐：非洲殖民军。三万五千名训练有素的外籍军团和摩尔人士兵，正手握武器，等待宣誓向谁效忠。',
  descriptionZh: '西属摩洛哥。桑胡尔霍之死令国民军高层大受震动。佛朗哥将军飞抵得土安，准备接管西班牙最强悍、最具杀伤力的精锐：非洲殖民军。三万五千名训练有素的外籍军团和摩尔人士兵，正手握武器，等待宣誓向谁效忠。',
  options: [
    {
      text: '佛朗哥宣誓领导国民起义（历史选项）',
      textZh: '佛朗哥宣誓领导国民起义（历史选项）',
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step14: 'nationalist' };
        return {
          ...state,
          francoAfricaControl: true,
          civilWarChoices: choices,
          civilWarChainStep: 28,
          currentEvent: civilWarStep28Result
        };
      }
    },
    {
      text: '佛朗哥犹豫观望，派系内斗',
      textZh: '佛朗哥犹豫观望，派系内斗',
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step14: 'delayed' };
        return {
          ...state,
          francoAfricaControl: true,
          civilWarChoices: choices,
          civilWarChainStep: 28,
          currentEvent: civilWarStep28Result
        };
      }
    },
    {
      text: '摩洛哥民族主义者趁乱起义',
      textZh: '摩洛哥民族主义者趁乱起义',
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step14: 'chaos' };
        return {
          ...state,
          francoAfricaControl: true,
          civilWarChoices: choices,
          civilWarChainStep: 28,
          currentEvent: civilWarStep28Result
        };
      }
    }
  ]
};

// 28. Franco Result
export const civilWarStep28Result: GameEvent = {
  id: 'cw_step28_franco_result',
  title: '佛朗哥接管非洲军团：结果',
  titleZh: '佛朗哥接管非洲军团：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step14 || 'nationalist';
    if (choice === 'nationalist') {
      return '佛朗哥公开重申国民军领袖立场，发表慷慨陈词的广播，赢得了非洲军团的绝对效忠。这支致命的铁锤即将跨越地中海直捣马德里。';
    } else if (choice === 'delayed') {
      return '由于佛朗哥作风极度多疑、迟疑，未能完全服众。各师团长开始为了各自利益互不听命。非洲军团耽搁在得土安陷入无谓的政治内耗，浪费了极其宝贵的机会。';
    } else {
      return '得土安当地被重税和压迫折磨的摩洛哥民族派趁权力交接发起武装反叛，高呼里夫人的自立，导致非洲军团不得不分身镇压，枪口转向，深陷殖民地泥沼。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 29,
          currentEvent: civilWarStep29
        };
      }
    }
  ]
};

// 29. Republican Navy's Decision
export const civilWarStep29: GameEvent = {
  id: 'cw_step29_navy',
  title: '七月二十日—共和国海军的抉择',
  titleZh: '七月二十日—共和国海军的抉择',
  description: '直布罗陀海峡。绝大多数海军高级军官支持政变，但工人出身的基层水手和机舱工人展现了惊人的凝聚力，在听到广播后发动武装起义，迅速制服或处决了倒戈军官，夺回了战列舰和巡洋舰的控制权。海军的站位至关重要。',
  descriptionZh: '直布罗陀海峡。绝大多数海军高级军官支持政变，但工人出身的基层水手和机舱工人展现了惊人的凝聚力，在听到广播后发动武装起义，迅速制服或处决了倒戈军官，夺回了战列舰和巡洋舰的控制权。海军的站位至关重要。',
  options: [
    {
      text: '全速前进，封锁海峡！（历史选项）',
      textZh: '全速前进，封锁海峡！（历史选项）',
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step15: 'republic' };
        return {
          ...state,
          civilWarChoices: choices,
          civilWarChainStep: 30,
          currentEvent: civilWarStep30Result
        };
      }
    },
    {
      text: '海军官兵一致决定撤回穆尔西亚修整',
      textZh: '海军官兵一致决定撤回穆尔西亚修整',
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step15: 'republic_retreat' };
        return {
          ...state,
          civilWarChoices: choices,
          civilWarChainStep: 30,
          stats: {
            ...state.stats,
            republicanAuthority: Math.min(100, (state.stats?.republicanAuthority || 0) + 5)
          },
          currentEvent: civilWarStep30Result
        };
      }
    },
    {
      text: '红海军有自己的决定',
      textZh: '红海军有自己的决定',
      effect: (state) => {
        const choices = { ...(state as any).civilWarChoices, step15: 'anarchist' };
        return {
          ...state,
          civilWarChoices: choices,
          civilWarChainStep: 30,
          stats: {
            ...state.stats,
            bureaucratization: Math.max(0, (state.stats?.bureaucratization || 0) - 5),
            revolutionaryFervor: Math.min(100, (state.stats?.revolutionaryFervor || 0) + 5)
          },
          currentEvent: civilWarStep30Result
        };
      }
    }
  ]
};

// 30. Navy Result
export const civilWarStep30Result: GameEvent = {
  id: 'cw_step30_navy_result',
  title: '海军起义：结果',
  titleZh: '海军起义：结果',
  description: '正在加载结果...',
  descriptionZh: '正在加载结果...',
  renderContent: (state) => {
    const choice = (state as any).civilWarChoices?.step15 || 'republic';
    if (choice === 'republic') {
      return '几乎所有主力舰队的控制权被起义水兵夺取。海峡完全被强大的共和舰队封锁，非洲军团无法直接跨越风浪海峡登陆，政变的闪击战图谋宣告落空。';
    } else if (choice === 'republic_retreat') {
      return '由于水手在缺乏指挥和后勤压力下选择回到军港补给、修正，直布罗陀海峡防守洞开，国民军的非洲军团获得了长驱直入的渡海安全权。';
    } else {
      return '水兵委员会公开升起红黑旗，宣布舰队处于无政府工团委员会直接执掌下，将独立炮击一切法西斯沿海阵地，展现了无与伦比的自主意愿。';
    }
  },
  options: [
    {
      text: '继续',
      textZh: '继续',
      effect: (state) => {
        return {
          ...state,
          civilWarChainStep: 31,
          currentEvent: civilWarStep31
        };
      }
    }
  ]
};

// 31. Summary and Complete Setup
export const civilWarStep31: GameEvent = {
  id: 'cw_step31_summary',
  title: '七月二十日晚—内战开幕',
  titleZh: '七月二十日晚—内战开幕',
  description: '军事政变未能一举颠覆共和，但和平时代就此决裂。无数的街垒被铸起，战线已然明确。无数人的命运，无论将军还是水兵、工人和农民，都被狂风巨浪撕扯，被推入前所未有的漩涡。残酷的内战拉开了序幕。',
  descriptionZh: '军事政变未能一举颠覆共和，但和平时代就此决裂。无数的街垒被铸起，战线已然明确。无数人的命运，无论将军还是水兵、工人和农民，都被狂风巨浪撕扯，被推入前所未有的漩涡。残酷的内战拉开了序幕。',
  options: [
    {
      text: '内战开始了',
      textZh: '内战开始了',
      effect: (state) => {
        const choices = (state as any).civilWarChoices || {};
        
        // Final touch-up of the provinces
        const finalProvinces = { ...state.provinces };
        
        // Ensure default neutral/Portuguese/Spanish colonies are set appropriately if not modified
        const colonies = ['ceuta', 'melilla', 'laspalmas', 'santacruzdetenerife', 'tetouan', 'larache', 'nador', 'chefchaouen', 'alhoceima', 'huelva'];
        colonies.forEach(id => {
          if (finalProvinces[id]) {
            finalProvinces[id] = { ...finalProvinces[id], owner: MapFaction.NATIONALIST };
          }
        });

        // Set the final armies list
        const finalArmies = setupArmiesForCivilWar(state, false, choices);

        return {
          ...state,
          civilWarStatus: 'ongoing',
          provinces: finalProvinces,
          armies: finalArmies,
          currentEvent: null,
          phase: 'action',
          actionsLeft: 2
        };
      }
    }
  ]
};
