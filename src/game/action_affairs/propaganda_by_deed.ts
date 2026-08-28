import { AssassinationTarget, Card, Faction, GameEvent, GameState, SocialClass } from '../types';
import {
  adjustClassSupport,
  adjustFactionDissent,
  adjustFactionDissents,
  adjustFactionInfluence,
  getDissentMultiplier
} from '../utils';
import type { ClassPoliticalForce } from '../utils';
import {
  armamentPreview,
  classSupportPreview,
  effectLine,
  factionDissentPreview,
  factionInfluencePreview,
  resourcePreview,
  statPreview,
  textPreview
} from '../effectPreview';

const PROPAGANDA_BY_DEED_COOLDOWN = 8;
const ASSASSINATION_SUCCESS_BASE = 65;
const SUCCESS_BASE_PENALTY = 8;
const FAILURE_BASE_PENALTY = 3;
const TRAINING_COST = 2;
const TRAINING_PER_TARGET = 15;
const TRAINING_PER_TARGET_CAP = 30;
const TRAINING_GENERAL = 5;
const TRAINING_GENERAL_CAP = 10;
const HARDLINER_INFLUENCE_THRESHOLD = 80;

type TargetId = AssassinationTarget;
type WeaponId = 'bomb' | 'gunman' | 'knife';
type ClassSupportDelta = [SocialClass, ClassPoliticalForce, number];

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const clampRelation = (value: number) => Math.max(-100, Math.min(100, value));

const adjustClassSupports = (
  classes: GameState['classes'],
  deltas: ClassSupportDelta[]
): GameState['classes'] => {
  return deltas.reduce((updatedClasses, [targetClass, targetForce, delta]) => {
    return adjustClassSupport(updatedClasses, targetClass, targetForce, delta);
  }, classes);
};

const influenceThenDissent = (
  factions: GameState['factions'],
  targetFaction: Faction,
  influenceDelta: number,
  dissentDeltas: Partial<Record<Faction, number>>
): GameState['factions'] => {
  const influencedFactions = adjustFactionInfluence(factions, targetFaction, influenceDelta);
  return adjustFactionDissents(influencedFactions, dissentDeltas);
};

interface TargetDef {
  id: TargetId;
  nameEn: string;
  nameZh: string;
  flavorEn: string;
  flavorZh: string;
  modifier: number;
  isDead: (s: GameState) => boolean;
  gate: (s: GameState) => boolean;
  gateUnavailableEn: string;
  gateUnavailableZh: string;
  success: (s: GameState) => Partial<GameState>;
  failure: (s: GameState) => Partial<GameState>;
  successPreviewEn: string;
  successPreviewZh: string;
  failurePreviewEn: string;
  failurePreviewZh: string;
}

const TARGETS: Record<TargetId, TargetDef> = {
  franco: {
    id: 'franco',
    nameEn: 'Francisco Franco',
    nameZh: '弗朗西斯科·佛朗哥',
    flavorEn: 'The rising star of the Africanist officers, groomed by the state itself.',
    flavorZh: '非洲军团军官中的新星，被国家亲自栽培。',
    // Francisco Franco, the future dictator — not to be confused with his brother
    // Ramón Franco, the aviator, advisor, and presidential candidate.
    modifier: -10,
    isDead: (s: GameState) => s.francoStatus === 'dead',
    gate: (s: GameState) => s.year < 1935,
    gateUnavailableEn: 'Francisco Franco must be struck down before 1935, while he is still a rising officer.',
    gateUnavailableZh: '必须在1935年前除掉弗朗西斯科·佛朗哥，趁他还只是崭露头角的军官。',
    success: (s: GameState): Partial<GameState> => {
      const factions = influenceThenDissent(s.factions, 'Faistas', 2, { Faistas: -3 });

      return {
        francoStatus: 'dead',
        coupProgress: clampPercent((s.coupProgress || 0) - 20),
        factions,
        stats: {
          ...s.stats,
          armyLoyalty: Math.max(0, s.stats.armyLoyalty - 4)
        },
        relations: {
          ...s.relations,
          uk: Math.max(0, s.relations.uk - 5),
          france: Math.max(0, s.relations.france - 5)
        }
      };
    },
    failure: (s: GameState): Partial<GameState> => {
      const factions = adjustFactionDissent(s.factions, 'Faistas', 3);

      return {
        coupProgress: clampPercent((s.coupProgress || 0) + 5),
        factions,
        stats: {
          ...s.stats,
          armyLoyalty: Math.min(100, s.stats.armyLoyalty + 2)
        },
        resources: Math.max(0, s.resources - 1)
      };
    },
    successPreviewEn: 'Francisco Franco dies; the coup loses its strongest general.',
    successPreviewZh: '弗朗西斯科·佛朗哥死亡；政变失去最强将领。',
    failurePreviewEn: 'The attempt fails; the army closes ranks around Francisco Franco.',
    failurePreviewZh: '行动失败；军队在弗朗西斯科·佛朗哥周围抱团。'
  },
  queipo: {
    id: 'queipo',
    nameEn: 'Gonzalo Queipo de Llano',
    nameZh: '贡萨洛·凯波·德·利亚诺',
    flavorEn: 'The Andalusian conspirator who plots to seize Seville.',
    flavorZh: '密谋夺取塞维利亚的安达卢西亚阴谋家。',
    modifier: -10,
    isDead: (s: GameState) => s.queipoStatus === 'dead',
    gate: (s: GameState) => s.stats.tension > 50,
    gateUnavailableEn: 'The situation must be tense enough for our operatives to move in Seville.',
    gateUnavailableZh: '局势必须足够紧张，我们的行动人员才能在塞维利亚活动。',
    success: (s: GameState): Partial<GameState> => {
      return {
        queipoStatus: 'dead',
        coupProgress: clampPercent((s.coupProgress || 0) - 10),
        stats: {
          ...s.stats,
          armyLoyalty: Math.max(0, s.stats.armyLoyalty - 2)
        },
        pro_republic: clampPercent(s.pro_republic + 2)
      };
    },
    failure: (s: GameState): Partial<GameState> => {
      return {
        stats: {
          ...s.stats,
          armyLoyalty: Math.min(100, s.stats.armyLoyalty + 2),
          workerControl: Math.max(0, s.stats.workerControl - 3)
        },
        resources: Math.max(0, s.resources - 1)
      };
    },
    successPreviewEn: 'Queipo de Llano dies; Seville stays quiet.',
    successPreviewZh: '凯波·德·利亚诺死亡；塞维利亚保持平静。',
    failurePreviewEn: 'The attempt fails; the Seville garrison goes on alert.',
    failurePreviewZh: '行动失败；塞维利亚驻军进入警戒。'
  },
  sanjurjo: {
    id: 'sanjurjo',
    nameEn: 'José Sanjurjo',
    nameZh: '何塞·桑胡尔霍',
    flavorEn: 'The general of the Civil Guard, feted by the monarchists.',
    flavorZh: '国民卫队将军，保王党人的宠儿。',
    modifier: -5,
    isDead: (s: GameState) => s.sanjurjoStatus === 'dead',
    gate: () => true,
    gateUnavailableEn: '',
    gateUnavailableZh: '',
    success: (s: GameState): Partial<GameState> => {
      return {
        sanjurjoStatus: 'dead',
        coupProgress: clampPercent((s.coupProgress || 0) - 15),
        stats: {
          ...s.stats,
          armyLoyalty: Math.max(0, s.stats.armyLoyalty - 4)
        },
        partyRelations: {
          ...s.partyRelations,
          RE: clampRelation((s.partyRelations.RE || 0) - 5)
        }
      };
    },
    failure: (s: GameState): Partial<GameState> => {
      return {
        stats: {
          ...s.stats,
          armyLoyalty: Math.min(100, s.stats.armyLoyalty + 2),
          workerControl: Math.max(0, s.stats.workerControl - 2)
        },
        resources: Math.max(0, s.resources - 1)
      };
    },
    successPreviewEn: 'Sanjurjo dies; the 1932 plot is decapitated.',
    successPreviewZh: '桑胡尔霍死亡；1932年密谋群龙无首。',
    failurePreviewEn: 'The attempt fails; the Civil Guard hunts our people.',
    failurePreviewZh: '行动失败；国民卫队追捕我们的人。'
  },
  sotelo: {
    id: 'sotelo',
    nameEn: 'José Calvo Sotelo',
    nameZh: '何塞·卡尔沃·索特洛',
    flavorEn: 'The firebrand of the Right, the loudest voice for reaction.',
    flavorZh: '右翼的旗手，反动派最响亮的声音。',
    modifier: 0,
    isDead: (s: GameState) => s.calvoSoteloStatus === 'dead',
    gate: (s: GameState) => s.ceda_formed || s.year >= 1933,
    gateUnavailableEn: 'The Right has not yet consolidated around a single firebrand.',
    gateUnavailableZh: '右翼尚未围绕一个旗手完成整合。',
    success: (s: GameState): Partial<GameState> => {
      return {
        calvoSoteloStatus: 'dead',
        // His death gives the generals their casus belli while silencing the firebrand.
        coupProgress: clampPercent((s.coupProgress || 0) + 15),
        partyRelations: {
          ...s.partyRelations,
          AP: clampRelation((s.partyRelations.AP || 0) - 8),
          RE: clampRelation((s.partyRelations.RE || 0) - 8),
          CT: clampRelation((s.partyRelations.CT || 0) - 8),
          FE: clampRelation((s.partyRelations.FE || 0) - 8)
        },
        pro_republic: Math.max(0, s.pro_republic - 2)
      };
    },
    failure: (s: GameState): Partial<GameState> => {
      return {
        partySupport: {
          ...s.partySupport,
          AP: clampPercent((s.partySupport.AP || 0) + 2)
        },
        pro_republic: Math.max(0, s.pro_republic - 3),
        resources: Math.max(0, s.resources - 1)
      };
    },
    successPreviewEn: 'Sotelo dies; the Right loses its firebrand — but the generals gain their pretext.',
    successPreviewZh: '索特洛死亡；右翼失去旗手——但将军们得到了借口。',
    failurePreviewEn: 'The attempt fails; the Right turns his survival into a rallying cry.',
    failurePreviewZh: '行动失败；右翼把他的幸存变成集结号。'
  },
  primo: {
    id: 'primo',
    nameEn: 'José Antonio Primo de Rivera',
    nameZh: '何塞·安东尼奥·普里莫·德·里维拉',
    flavorEn: 'The aristocratic founder of the Falange.',
    flavorZh: '长枪党的贵族创始人。',
    modifier: -5,
    isDead: (s: GameState) => s.primoDeRiveraStatus === 'dead',
    gate: (s: GameState) => s.fe_founded,
    gateUnavailableEn: 'The Falange must exist before we can strike its leader.',
    gateUnavailableZh: '必须等到长枪党成立，我们才能对其领袖下手。',
    success: (s: GameState): Partial<GameState> => {
      return {
        primoDeRiveraStatus: 'dead',
        partySupport: {
          ...s.partySupport,
          FE: clampPercent((s.partySupport.FE || 0) - 25)
        },
        fe_leadership_crisis: true
      };
    },
    failure: (s: GameState): Partial<GameState> => {
      return {
        partySupport: {
          ...s.partySupport,
          FE: clampPercent((s.partySupport.FE || 0) + 3)
        },
        stats: {
          ...s.stats,
          workerControl: Math.max(0, s.stats.workerControl - 2)
        },
        resources: Math.max(0, s.resources - 1)
      };
    },
    successPreviewEn: 'Primo de Rivera dies; the Falange is decapitated.',
    successPreviewZh: '德里维拉死亡；长枪党群龙无首。',
    failurePreviewEn: 'The attempt fails; Falangist thugs take to the streets.',
    failurePreviewZh: '行动失败；长枪党暴徒走上街头。'
  },
  ramiro: {
    id: 'ramiro',
    nameEn: 'Ramiro Ledesma Ramos',
    nameZh: '拉米罗·莱德斯马·拉莫斯',
    flavorEn: 'The violent ideologue of the JONS, the movement\'s razor tongue.',
    flavorZh: 'JONS的暴力理论家，运动的锋利舌头。',
    modifier: 10,
    isDead: (s: GameState) => s.ramiroLedesmaStatus === 'dead',
    gate: (s: GameState) => s.falange_jons,
    gateUnavailableEn: 'The JONS must have merged with the Falange before its ideologue can be struck down.',
    gateUnavailableZh: '必须等到JONS并入长枪党，才能除掉其理论家。',
    success: (s: GameState): Partial<GameState> => {
      return {
        ramiroLedesmaStatus: 'dead',
        falange_jons: false,
        partySupport: {
          ...s.partySupport,
          FE: clampPercent((s.partySupport.FE || 0) - 10)
        }
      };
    },
    failure: (s: GameState): Partial<GameState> => {
      return {
        stats: {
          ...s.stats,
          workerControl: Math.max(0, s.stats.workerControl - 2)
        },
        resources: Math.max(0, s.resources - 1)
      };
    },
    successPreviewEn: 'Ledesma Ramos dies; the JONS is dissolved.',
    successPreviewZh: '莱德斯马·拉莫斯死亡；JONS被解散。',
    failurePreviewEn: 'The attempt fails; JONS militants smash union offices.',
    failurePreviewZh: '行动失败；JONS激进分子打砸工会办公室。'
  },
  zamora: {
    id: 'zamora',
    nameEn: 'Niceto Alcalá-Zamora',
    nameZh: '尼塞托·阿尔卡拉-萨莫拉',
    flavorEn: 'The conservative Catholic who holds the presidency.',
    flavorZh: '执掌总统职位的保守派天主教徒。',
    modifier: -10,
    isDead: (s: GameState) => s.zamoraStatus === 'dead',
    gate: (s: GameState) => s.government.president === 'Niceto Alcalá-Zamora',
    gateUnavailableEn: 'He must still hold the presidency.',
    gateUnavailableZh: '他必须仍在任总统。',
    success: (s: GameState): Partial<GameState> => {
      return {
        zamoraStatus: 'dead',
        // Reuse the impeachment flag: it disables the impeachment card and lets the
        // presidential election chain trigger automatically next month.
        isPresidentImpeached: true,
        government: {
          ...s.government,
          // Martinez Barrio served as interim president during the presidential election process.
          president: 'Diego Martínez Barrio',
          presidentZh: '迭戈·马丁内斯·巴里奥'
        },
        partyRelations: {
          ...s.partyRelations,
          PSOE: clampRelation((s.partyRelations.PSOE || 0) - 5),
          IR: clampRelation((s.partyRelations.IR || 0) - 5)
        },
        stats: {
          ...s.stats,
          workerControl: Math.max(0, s.stats.workerControl - 5)
        },
        pro_republic: Math.max(0, s.pro_republic - 8),
        resources: Math.max(0, s.resources - 2)
      };
    },
    failure: (s: GameState): Partial<GameState> => {
      return {
        stats: {
          ...s.stats,
          workerControl: Math.max(0, s.stats.workerControl - 4)
        },
        pro_republic: Math.max(0, s.pro_republic - 2),
        resources: Math.max(0, s.resources - 1)
      };
    },
    successPreviewEn: 'Alcalá-Zamora dies; the Republic enters a constitutional crisis.',
    successPreviewZh: '阿尔卡拉-萨莫拉死亡；共和国陷入宪政危机。',
    failurePreviewEn: 'The attempt fails; the state answers with martial law.',
    failurePreviewZh: '行动失败；国家以戒严回应。'
  },
  alfonso: {
    id: 'alfonso',
    nameEn: 'Alfonso XIII',
    nameZh: '阿方索十三世',
    flavorEn: 'The exiled king, plotting his restoration from abroad.',
    flavorZh: '流亡的国王，在异国谋划复辟。',
    modifier: -20,
    isDead: (s: GameState) => s.alfonsoXIIIStatus === 'dead',
    gate: (s: GameState) => s.resources >= 5,
    gateUnavailableEn: 'A foreign operation in exile requires at least 5 resources.',
    gateUnavailableZh: '海外流亡地的行动需要至少 5 点资源。',
    success: (s: GameState): Partial<GameState> => {
      return {
        alfonsoXIIIStatus: 'dead',
        relations: {
          ...s.relations,
          uk: Math.max(0, s.relations.uk - 5),
          france: Math.max(0, s.relations.france - 5),
          italy: Math.max(0, s.relations.italy - 5)
        },
        partyRelations: {
          ...s.partyRelations,
          RE: clampRelation((s.partyRelations.RE || 0) - 8)
        },
        pro_republic: clampPercent(s.pro_republic + 2),
        nationalism: clampPercent(s.nationalism + 3)
      };
    },
    failure: (s: GameState): Partial<GameState> => {
      return {
        relations: {
          ...s.relations,
          uk: Math.max(0, s.relations.uk - 3),
          france: Math.max(0, s.relations.france - 3)
        },
        pro_republic: Math.max(0, s.pro_republic - 1),
        resources: Math.max(0, s.resources - 3)
      };
    },
    successPreviewEn: 'Alfonso XIII dies in exile; monarchists are enraged.',
    successPreviewZh: '阿方索十三世死于流亡；保王党震怒。',
    failurePreviewEn: 'The attempt fails; our operatives are arrested abroad.',
    failurePreviewZh: '行动失败；我们的行动人员在国外被捕。'
  }
};

interface WeaponDef {
  id: WeaponId;
  nameEn: string;
  nameZh: string;
  subtitleEn: string;
  subtitleZh: string;
  modifier: number;
  captureRisk: number;
  collateralRisk: number;
  resourcesCost: number;
  armamentsCost: number;
  condition: (s: GameState) => boolean;
  unavailableEn: string;
  unavailableZh: string;
}

const WEAPONS: Record<WeaponId, WeaponDef> = {
  bomb: {
    id: 'bomb',
    nameEn: 'Bomb',
    nameZh: '炸弹',
    subtitleEn: 'A bomb thrown into the heart of power — the surest instrument, and the bloodiest.',
    subtitleZh: '向权力的心脏投掷炸弹——最稳妥的工具，也最血腥。',
    modifier: 25,
    captureRisk: 0.2,
    collateralRisk: 0.3,
    resourcesCost: 2,
    armamentsCost: 0,
    condition: (s: GameState) => s.resources >= 2,
    unavailableEn: 'Requires 2 resources.',
    unavailableZh: '需要 2 点资源。'
  },
  gunman: {
    id: 'gunman',
    nameEn: 'Gunman',
    nameZh: '枪手',
    subtitleEn: 'A pistolero closes in at close range. Cleaner than a bomb, deadlier than a knife.',
    subtitleZh: '枪手近距离逼近。比炸弹干净，比匕首致命。',
    modifier: 15,
    captureRisk: 0.4,
    collateralRisk: 0,
    resourcesCost: 1,
    armamentsCost: 1,
    condition: (s: GameState) => s.resources >= 1 && s.armaments >= 1,
    unavailableEn: 'Requires 1 resource and 1 armament.',
    unavailableZh: '需要 1 点资源和 1 点军备。'
  },
  knife: {
    id: 'knife',
    nameEn: 'Knife',
    nameZh: '匕首',
    subtitleEn: 'A knife in the crowd. Free, silent — and the most likely to end in capture.',
    subtitleZh: '人群中一把匕首。免费、无声——也最可能以被捕告终。',
    modifier: 5,
    captureRisk: 0.6,
    collateralRisk: 0,
    resourcesCost: 0,
    armamentsCost: 0,
    condition: () => true,
    unavailableEn: '',
    unavailableZh: ''
  }
};

const successChance = (s: GameState, targetId: TargetId, weaponModifier: number): number => {
  const target = TARGETS[targetId];
  const tensionPenalty = 0.2 * (s.stats?.tension || 0);
  const training =
    (s.assassination_training?.[targetId] || 0) +
    (s.assassination_training_general || 0);

  return Math.max(5, Math.min(95, Math.round(
    (s.assassination_success_base || ASSASSINATION_SUCCESS_BASE) +
    target.modifier - tensionPenalty + weaponModifier + training
  )));
};

export const propagandaByDeed: Card = {
  id: 'propaganda_by_deed',
  title: 'Propaganda by the Deed',
  titleZh: '以行动宣传',
  type: 'Action',
  description: 'The doctrine of propaganda by the deed burns in the hearts of the hardliners: where words fail, the pistol speaks. The pistoleros of Los Solidarios sharpen their knives, the Faistas call for action, and the Puristas quote Bakunin. One bullet can rewrite history — or bring the full weight of the state down upon the movement.',
  descriptionZh: '"以行动宣传"的信条在强硬派心中燃烧：当语言失效时，手枪便会开口。团结社的枪手们磨利了刀刃，无政府主义者呼吁行动，纯粹派引用巴枯宁。一颗子弹可以改写历史——也可能让国家的全部重压砸向运动。',
  cost: 1,
  condition: (state: GameState) => {
    return (state.propaganda_by_deed_timer || 0) <= 0 && state.civilWarStatus === 'not_started';
  },
  effect: (state: GameState): Partial<GameState> => {
    let mainEvent: GameEvent;
    let buildTargetMenu: () => GameEvent;
    let buildMethodMenu: (targetId: TargetId) => GameEvent;
    let buildTrainingMenu: () => GameEvent;

    const buildSuccessEvent = (targetId: TargetId): GameEvent => {
      const target = TARGETS[targetId];

      return {
        id: `deed_success_${targetId}`,
        date: { year: state.year, month: state.month },
        title: 'The Deed Is Done',
        titleZh: '行动已成',
        description: `The world wakes to the news: ${target.nameEn} is dead. In the factories and the fields, workers whisper the name of the CNT-FAI; in the salons of Madrid, the state vows revenge. The deed has been done — now the movement must decide how to wield it.`,
        descriptionZh: `世界醒来便听到消息：${target.nameZh}死了。在工厂和田野里，工人们低声念着CNT-FAI的名字；在马德里的客厅里，国家发誓复仇。行动已经完成——现在运动必须决定如何运用它。`,
        options: [
          {
            text: 'Proclaim the deed from every rooftop.',
            textZh: '在每一座屋顶上宣告这一行动。',
            subtitle: 'Claim responsibility openly. The deed becomes legend, inspiring workers and peasants — but the state answers with mass arrests and closures.',
            subtitleZh: '公开承认责任。行动成为传奇，鼓舞工人和农民——但国家将以大规模逮捕和查封回应。',
            effectPreview: (s: GameState) => {
              const df = getDissentMultiplier(s.factions);

              return [
                classSupportPreview(s, 'Obreros', 'CNT_FAI', 5 * df),
                classSupportPreview(s, 'Braceros', 'CNT_FAI', 3 * df),
                factionInfluencePreview('Faistas', 2),
                factionDissentPreview('Faistas', -3),
                factionDissentPreview('Treintistas', 8),
                statPreview(s, 'revolutionaryFervor', 8 * df),
                effectLine('Ideological propaganda', '意识形态宣传', 2),
                effectLine('Pro-Republic sentiment', '亲共和国倾向', -5, { reverseTone: true }),
                textPreview('End current event', '结束当前事件')
              ];
            },
            effect: (s: GameState): Partial<GameState> => {
              const df = getDissentMultiplier(s.factions);
              const classes = adjustClassSupports(s.classes, [
                ['Obreros', 'CNT_FAI', 5 * df],
                ['Braceros', 'CNT_FAI', 3 * df]
              ]);
              let factions = adjustFactionInfluence(s.factions, 'Faistas', 2);
              factions = adjustFactionDissents(factions, { Faistas: -3, Treintistas: 8 });

              return {
                classes,
                factions,
                partyRelations: {
                  ...s.partyRelations,
                  PSOE: clampRelation((s.partyRelations.PSOE || 0) - 5),
                  IR: clampRelation((s.partyRelations.IR || 0) - 5)
                },
                stats: {
                  ...s.stats,
                  revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 8 * df),
                  workerControl: Math.max(0, s.stats.workerControl - 3)
                },
                ideological_propaganda: (s.ideological_propaganda || 0) + 2,
                pro_republic: Math.max(0, s.pro_republic - 5),
                currentEvent: null
              };
            }
          },
          {
            text: 'Deny everything. Let the deed speak for itself.',
            textZh: '否认一切。让行动自己说话。',
            subtitle: 'Keep our hands clean in public. The repression is lighter, but the hardliners grumble that we dare not own our own deeds.',
            subtitleZh: '在公众面前保持双手干净。镇压会轻一些，但强硬派抱怨我们不敢承认自己的行动。',
            effectPreview: (s: GameState) => {
              return [
                factionDissentPreview('Faistas', 5),
                statPreview(s, 'revolutionaryFervor', 3 * getDissentMultiplier(s.factions)),
                effectLine('Pro-Republic sentiment', '亲共和国倾向', -2, { reverseTone: true }),
                textPreview('End current event', '结束当前事件')
              ];
            },
            effect: (s: GameState): Partial<GameState> => {
              const factions = adjustFactionDissent(s.factions, 'Faistas', 5);

              return {
                factions,
                stats: {
                  ...s.stats,
                  revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 3 * getDissentMultiplier(s.factions))
                },
                pro_republic: Math.max(0, s.pro_republic - 2),
                currentEvent: null
              };
            }
          }
        ]
      };
    };

    const buildMartyrEvent = (targetId: TargetId): GameEvent => {
      const target = TARGETS[targetId];

      return {
        id: `deed_martyr_${targetId}`,
        date: { year: state.year, month: state.month },
        title: 'A Comrade Falls',
        titleZh: '一位同志倒下',
        description: `The attempt on ${target.nameEn} failed and our comrade was taken alive. The Guardia Civil extracts a confession with steel and fire; the prisons fill with our people. But the movement has its martyr — and martyrs recruit.`,
        descriptionZh: `刺杀${target.nameZh}的行动失败了，我们的同志被活捉。国民卫队用钢铁与烈火逼供；监狱里挤满了我们的人。但运动有了自己的烈士——而烈士最能招募新血。`,
        options: [
          {
            text: 'Their blood waters the seeds of revolution.',
            textZh: '他们的鲜血浇灌革命的种子。',
            subtitle: 'Honor the fallen comrade and rebuild. The state has won this round — the struggle continues.',
            subtitleZh: '悼念牺牲的同志并重整旗鼓。国家赢了这一回合——斗争仍在继续。',
            effect: (): Partial<GameState> => {
              return {
                currentEvent: null
              };
            }
          }
        ]
      };
    };

    const buildFailureEvent = (targetId: TargetId): GameEvent => {
      const target = TARGETS[targetId];

      return {
        id: `deed_failure_${targetId}`,
        date: { year: state.year, month: state.month },
        title: 'The Deed Fails',
        titleZh: '行动失败',
        description: `The attempt on ${target.nameEn} failed. Our people melt back into the crowds, but the state is awake now — watchers on every corner, informers in every tavern. ${target.nameEn} lives, and the movement must answer for the blood already shed.`,
        descriptionZh: `刺杀${target.nameZh}的行动失败了。我们的人消失在人群中，但国家已经警觉——每个街角都有暗探，每间酒馆都有告密者。${target.nameZh}还活着，运动必须为已经流下的血付出代价。`,
        options: [
          {
            text: 'Regroup and live to fight another day.',
            textZh: '重新集结，来日再战。',
            subtitle: 'The struggle continues. Today was a setback, not a defeat.',
            subtitleZh: '斗争还在继续。今天只是挫折，不是失败。',
            effect: (): Partial<GameState> => {
              return {
                currentEvent: null
              };
            }
          }
        ]
      };
    };

    buildMethodMenu = (targetId: TargetId): GameEvent => {
      const target = TARGETS[targetId];
      const methodOptions: GameEvent['options'] = [];

      (Object.keys(WEAPONS) as WeaponId[]).forEach((weaponId) => {
        const weapon = WEAPONS[weaponId];

        methodOptions.push({
          text: `${weapon.nameEn}: strike ${target.nameEn} (≈${successChance(state, targetId, weapon.modifier)}% chance)`,
          textZh: `${weapon.nameZh}：刺杀${target.nameZh}（成功率约${successChance(state, targetId, weapon.modifier)}%）`,
          subtitle: weapon.subtitleEn,
          subtitleZh: weapon.subtitleZh,
          condition: weapon.condition,
          ...(weapon.id === 'knife'
            ? {}
            : {
                unavailableSubtitle: () => weapon.unavailableEn,
                unavailableSubtitleZh: () => weapon.unavailableZh
              }),
          effectPreview: (s: GameState) => {
            const chance = successChance(s, targetId, weapon.modifier);
            const lines = [
              textPreview(`Assassination success chance: ${chance}%.`, `暗杀成功率：${chance}%。`)
            ];

            if (weapon.resourcesCost > 0) lines.push(resourcePreview(-weapon.resourcesCost));
            if (weapon.armamentsCost > 0) lines.push(armamentPreview(-weapon.armamentsCost));
            if (weapon.collateralRisk > 0) {
              lines.push(textPreview(
                `Collateral risk: ${Math.round(weapon.collateralRisk * 100)}%.`,
                `误伤风险：${Math.round(weapon.collateralRisk * 100)}%。`,
                'negative'
              ));
            }
            lines.push(textPreview(target.successPreviewEn, target.successPreviewZh, 'positive'));
            lines.push(textPreview(target.failurePreviewEn, target.failurePreviewZh, 'negative'));

            return lines;
          },
          effect: (s: GameState): Partial<GameState> => {
            const chance = successChance(s, targetId, weapon.modifier);
            const succeeded = Math.random() < chance / 100;
            const captured = !succeeded && Math.random() < weapon.captureRisk;
            const collateral = weapon.collateralRisk > 0 && Math.random() < weapon.collateralRisk;

            const applied = succeeded ? target.success(s) : target.failure(s);
            const newBase = Math.max(
              0,
              (s.assassination_success_base || ASSASSINATION_SUCCESS_BASE) -
                (succeeded ? SUCCESS_BASE_PENALTY : FAILURE_BASE_PENALTY)
            );

            let result: Partial<GameState> = {
              ...applied,
              assassination_success_base: newBase,
              ...(weapon.resourcesCost > 0
                ? { resources: Math.max(0, (applied.resources ?? s.resources) - weapon.resourcesCost) }
                : {}),
              ...(weapon.armamentsCost > 0
                ? { armaments: Math.max(0, (applied.armaments ?? s.armaments) - weapon.armamentsCost) }
                : {})
            };

            if (collateral) {
              const factions = adjustFactionDissent(result.factions || s.factions, 'Puristas', 5);
              result = {
                ...result,
                factions,
                relations: {
                  ...(result.relations || s.relations),
                  uk: Math.max(0, (result.relations?.uk ?? s.relations.uk) - 3),
                  france: Math.max(0, (result.relations?.france ?? s.relations.france) - 3)
                },
                pro_republic: Math.max(0, (result.pro_republic ?? s.pro_republic) - 5)
              };
            }

            if (succeeded) {
              result.currentEvent = buildSuccessEvent(targetId);
            } else if (captured) {
              const factions = adjustFactionInfluence(result.factions || s.factions, 'Faistas', 3);
              result = {
                ...result,
                factions,
                stats: {
                  ...(result.stats || s.stats),
                  revolutionaryFervor: clampPercent(
                    (result.stats?.revolutionaryFervor ?? s.stats.revolutionaryFervor) + 6
                  ),
                  anarchistMilitia: clampPercent(
                    (result.stats?.anarchistMilitia ?? s.stats.anarchistMilitia) + 3
                  )
                },
                resources: Math.max(0, (result.resources ?? s.resources) - 1),
                currentEvent: buildMartyrEvent(targetId)
              };
            } else {
              result.currentEvent = buildFailureEvent(targetId);
            }

            return result;
          }
        });
      });

      methodOptions.push({
        text: 'Reconsider. Choose another approach.',
        textZh: '重新考虑。选择另一种方式。',
        subtitle: 'Return to the target list without committing to an attempt.',
        subtitleZh: '返回目标列表，暂不行动。',
        effect: (): Partial<GameState> => {
          return {
            currentEvent: buildTargetMenu()
          };
        }
      });

      return {
        id: `deed_method_menu_${targetId}`,
        date: { year: state.year, month: state.month },
        title: 'Choose the Instrument',
        titleZh: '选择工具',
        description: `Choose the instrument. ${target.nameEn} must be struck down — the weapon decides the odds and the cost.`,
        descriptionZh: `选择工具。${target.nameZh}必须被除掉——武器决定成功率与代价。`,
        options: methodOptions
      };
    };

    buildTargetMenu = (): GameEvent => {
      const targetOptions: GameEvent['options'] = [];

      (Object.keys(TARGETS) as TargetId[]).forEach((targetId) => {
        const target = TARGETS[targetId];

        targetOptions.push({
          text: `Assassinate ${target.nameEn}.`,
          textZh: `刺杀${target.nameZh}。`,
          subtitle: target.flavorEn,
          subtitleZh: target.flavorZh,
          condition: (s: GameState) => {
            return !target.isDead(s) && target.gate(s);
          },
          unavailableSubtitle: (s: GameState) => {
            return target.isDead(s)
              ? `${target.nameEn} is already dead.`
              : target.gateUnavailableEn;
          },
          unavailableSubtitleZh: (s: GameState) => {
            return target.isDead(s)
              ? `${target.nameZh}已死。`
              : target.gateUnavailableZh;
          },
          effectPreview: (s: GameState) => {
            const chance = successChance(s, targetId, 0);

            return [
              textPreview(
                `Assassination success chance: ${chance}% (before weapon choice).`,
                `暗杀成功率：${chance}%（武器选择前）。`
              ),
              textPreview(target.successPreviewEn, target.successPreviewZh, 'positive'),
              textPreview(target.failurePreviewEn, target.failurePreviewZh, 'negative')
            ];
          },
          effect: (): Partial<GameState> => {
            return {
              currentEvent: buildMethodMenu(targetId)
            };
          }
        });
      });

      targetOptions.push({
        text: 'Reconsider. The pistol is not the answer today.',
        textZh: '重新考虑。今天手枪不是答案。',
        subtitle: 'Return to the main decision.',
        subtitleZh: '返回主决策。',
        effect: (): Partial<GameState> => {
          return {
            currentEvent: mainEvent
          };
        }
      });

      return {
        id: 'deed_target_menu',
        date: { year: state.year, month: state.month },
        title: 'Choose the Target',
        titleZh: '选择目标',
        description: 'The operatives are ready. The success chance depends on the movement\'s preparation, the state\'s vigilance expressed through social tension, and the weapon chosen. Every attempt — successful or not — makes the next one harder.',
        descriptionZh: '行动人员已经就绪。成功率取决于运动的准备、国家透过社会紧张所表现的警觉，以及所选用的武器。每一次行动——无论成败——都会让下一次更难。',
        options: targetOptions
      };
    };

    buildTrainingMenu = (): GameEvent => {
      const trainingOptions: GameEvent['options'] = [];

      (Object.keys(TARGETS) as TargetId[]).forEach((targetId) => {
        const target = TARGETS[targetId];
        const current = state.assassination_training?.[targetId] || 0;
        const capped = current >= TRAINING_PER_TARGET_CAP;

        trainingOptions.push({
          text: `Train against ${target.nameEn}. (-${TRAINING_COST} resources)`,
          textZh: `针对${target.nameZh}进行特训。(-${TRAINING_COST} 资源)`,
          subtitle: capped
            ? 'This target is already fully prepared.'
            : `The target's assassination success chance increases by ${TRAINING_PER_TARGET}.`,
          subtitleZh: capped
            ? '该目标已充分准备。'
            : `该目标的暗杀成功率提升 ${TRAINING_PER_TARGET}。`,
          condition: (s: GameState) => {
            return s.resources >= TRAINING_COST && !capped;
          },
          unavailableSubtitle: () => {
            return capped
              ? 'This target is already fully prepared.'
              : `Requires ${TRAINING_COST} resources.`;
          },
          unavailableSubtitleZh: () => {
            return capped
              ? '该目标已充分准备。'
              : `需要 ${TRAINING_COST} 点资源。`;
          },
          effectPreview: () => {
            return [
              resourcePreview(-TRAINING_COST),
              textPreview(
                `Target success chance modifier: +${TRAINING_PER_TARGET}.`,
                `目标成功率修正：+${TRAINING_PER_TARGET}。`
              ),
              textPreview('End current event', '结束当前事件')
            ];
          },
          effect: (s: GameState): Partial<GameState> => {
            return {
              resources: Math.max(0, s.resources - TRAINING_COST),
              assassination_training: {
                ...(s.assassination_training || {}),
                [targetId]: Math.min(TRAINING_PER_TARGET_CAP, current + TRAINING_PER_TARGET)
              },
              currentEvent: null
            };
          }
        });
      });

      const generalCapped = (state.assassination_training_general || 0) >= TRAINING_GENERAL_CAP;

      trainingOptions.push({
        text: `General training for the whole movement. (-${TRAINING_COST} resources)`,
        textZh: `全运动通用训练。(-${TRAINING_COST} 资源)`,
        subtitle: generalCapped
          ? 'The movement is already fully prepared.'
          : `All targets' assassination success chance increases by ${TRAINING_GENERAL}.`,
        subtitleZh: generalCapped
          ? '运动已充分准备。'
          : `所有目标的暗杀成功率提升 ${TRAINING_GENERAL}。`,
        condition: (s: GameState) => {
          return s.resources >= TRAINING_COST && !generalCapped;
        },
        unavailableSubtitle: () => {
          return generalCapped
            ? 'The movement is already fully prepared.'
            : `Requires ${TRAINING_COST} resources.`;
        },
        unavailableSubtitleZh: () => {
          return generalCapped
            ? '运动已充分准备。'
            : `需要 ${TRAINING_COST} 点资源。`;
        },
        effectPreview: () => {
          return [
            resourcePreview(-TRAINING_COST),
            textPreview(
              `All-target success chance modifier: +${TRAINING_GENERAL}.`,
              `全目标成功率修正：+${TRAINING_GENERAL}。`
            ),
            textPreview('End current event', '结束当前事件')
          ];
        },
        effect: (s: GameState): Partial<GameState> => {
          return {
            resources: Math.max(0, s.resources - TRAINING_COST),
            assassination_training_general: Math.min(
              TRAINING_GENERAL_CAP,
              (s.assassination_training_general || 0) + TRAINING_GENERAL
            ),
            currentEvent: null
          };
        }
      });

      trainingOptions.push({
        text: 'Reconsider. Return to the main decision.',
        textZh: '重新考虑。返回主决策。',
        subtitle: 'Leave without spending resources.',
        subtitleZh: '不消耗资源直接离开。',
        effect: (): Partial<GameState> => {
          return {
            currentEvent: mainEvent
          };
        }
      });

      return {
        id: 'deed_training_menu',
        date: { year: state.year, month: state.month },
        title: 'Prepare the Pistoleros',
        titleZh: '训练枪手',
        description: 'Targeted training and general preparation raise the odds of future operations. Each preparation costs 2 resources and ends this decision.',
        descriptionZh: '针对性训练与通用准备将提升未来行动的成功率。每次准备消耗 2 点资源并结束本次决策。',
        options: trainingOptions
      };
    };

    mainEvent = {
      id: 'propaganda_by_deed_event',
      date: { year: state.year, month: state.month },
      title: 'Propaganda by the Deed',
      titleZh: '以行动宣传',
      description: 'The National Committee debates the doctrine of propaganda by the deed. The pistoleros of Los Solidarios sharpen their knives; the Faistas call for the pistol to speak where words have failed; the Puristas quote Bakunin. One bullet can rewrite history — or bring the full weight of the state down upon the movement. The hardliners demand action, the moderates beg for restraint, and the state watches every street corner.',
      descriptionZh: '全国委员会就"以行动宣传"的信条展开辩论。团结社的枪手们磨利了刀刃；无政府主义者呼吁在语言失效之处让手枪开口；纯粹派引用巴枯宁。一颗子弹可以改写历史——也可能让国家的全部重压砸向运动。强硬派要求行动，温和派恳求克制，而国家注视着每一个街角。',
      options: [
        {
          text: 'Launch an assassination campaign.',
          textZh: '发动暗杀行动。',
          subtitle: 'The pistoleros of Los Solidarios are ready. Requires the hardliners to dominate the movement.',
          subtitleZh: '团结社的枪手们已经准备好。需要强硬派主导运动。',
          condition: (s: GameState) => {
            return (
              (s.factions.Faistas?.influence || 0) +
                (s.factions.Puristas?.influence || 0) >
              HARDLINER_INFLUENCE_THRESHOLD
            );
          },
          unavailableSubtitle: () => {
            return 'Requires the combined influence of the Faistas and Puristas to exceed 80.';
          },
          unavailableSubtitleZh: () => {
            return '需要无政府主义者与纯粹派的影响力之和大于80。';
          },
          effect: (): Partial<GameState> => {
            return {
              currentEvent: buildTargetMenu()
            };
          }
        },
        {
          text: `Train the pistoleros. (-${TRAINING_COST} resources)`,
          textZh: `训练枪手。(-${TRAINING_COST} 资源)`,
          subtitle: 'Prepare for future operations: targeted training raises a chosen target\'s success chance.',
          subtitleZh: '为未来的行动做准备：针对性训练提升指定目标的成功率。',
          condition: (s: GameState) => {
            return s.resources >= TRAINING_COST;
          },
          unavailableSubtitle: () => {
            return `Requires ${TRAINING_COST} resources.`;
          },
          unavailableSubtitleZh: () => {
            return `需要 ${TRAINING_COST} 点资源。`;
          },
          effect: (): Partial<GameState> => {
            return {
              currentEvent: buildTrainingMenu()
            };
          }
        },
        {
          text: 'Reject the pistol. Pure propaganda only.',
          textZh: '拒绝手枪。只做纯宣传。',
          subtitle: 'The pen and the word are our weapons. The hardliners are disappointed, but the movement stays clean before the law.',
          subtitleZh: '笔与言语才是我们的武器。强硬派会失望，但运动在法律面前保持清白。',
          effectPreview: (s: GameState) => {
            const df = getDissentMultiplier(s.factions);

            return [
              classSupportPreview(s, 'Obreros', 'CNT_FAI', 4 * df),
              classSupportPreview(s, 'Braceros', 'CNT_FAI', 3 * df),
              classSupportPreview(s, 'Intelectuales', 'CNT_FAI', 2 * df),
              statPreview(s, 'revolutionaryFervor', 4 * df),
              factionDissentPreview('Faistas', 3),
              factionDissentPreview('Treintistas', -3),
              effectLine('Ideological propaganda', '意识形态宣传', 1),
              textPreview('End current event', '结束当前事件')
            ];
          },
          effect: (s: GameState): Partial<GameState> => {
            const df = getDissentMultiplier(s.factions);
            const classes = adjustClassSupports(s.classes, [
              ['Obreros', 'CNT_FAI', 4 * df],
              ['Braceros', 'CNT_FAI', 3 * df],
              ['Intelectuales', 'CNT_FAI', 2 * df]
            ]);
            const factions = adjustFactionDissents(s.factions, {
              Faistas: 3,
              Treintistas: -3
            });

            return {
              classes,
              factions,
              stats: {
                ...s.stats,
                revolutionaryFervor: clampPercent(s.stats.revolutionaryFervor + 4 * df)
              },
              ideological_propaganda: (s.ideological_propaganda || 0) + 1,
              currentEvent: null
            };
          }
        },
        {
          text: 'The moment is not right. Postpone.',
          textZh: '时机不对。暂缓行动。',
          subtitle: 'Preserve our strength. The hardliners grumble at the inaction.',
          subtitleZh: '保存实力。强硬派对不作为颇有微词。',
          effectPreview: () => {
            return [
              factionDissentPreview('Faistas', 3),
              textPreview('End current event', '结束当前事件')
            ];
          },
          effect: (s: GameState): Partial<GameState> => {
            const factions = adjustFactionDissent(s.factions, 'Faistas', 3);

            return {
              factions,
              currentEvent: null
            };
          }
        }
      ]
    };

    return {
      propaganda_by_deed_timer: PROPAGANDA_BY_DEED_COOLDOWN,
      currentEvent: mainEvent
    };
  }
};
