import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const melchorRodriguez: Advisor = {
  id: 'Melchor Rodríguez García',
  name: 'Melchor Rodríguez García',
  nameZh: '梅尔乔·罗德里格斯·加西亚',
  faction: 'None',
  description: 'The legendary "Red Angel" (El Ángel Rojo) and Director of Prisons in Madrid. A moderate, deeply principled anarchist who strictly stopped extrajudicial violence and saved thousands of lives of political enemies based on unconditional human rights.',
  descriptionZh: '传奇的马德里“红色天使”。温和、崇高、极具原则的无政府主义学者。他在出任战时司法和管教事务代表时，顶住极左狂热压力制止法外极刑，以无条的人道底线挽救了上万被俘右翼战俘与保守市民的生命。',
  image: 'img/Joan_Peiró.png',
  actions: [
    {
      id: 'melchor_red_angel',
      title: 'The Red Angel Intervention',
      titleZh: '践行人道底线救赎',
      subtitle: 'Enforce strict legal framework inside prisons over summary execution impulses.',
      subtitleZh: '以绝对原则铁面驻守军政看守所，坚决制止极端复仇和法外乱民冲击。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        stats: {
          ...state.stats,
          armyLoyalty: Math.min(100, state.stats.armyLoyalty + 6)
        }
      }),
      description: 'By standing in front of prison gates and risking our own lives to forbid illegal firing squads, we proved that anarchism values life and justice above blind hatred.',
      descriptionZh: '坚忍执守看守所大门，哪怕亲冒飞弹，也一怒挡阻狂热法外队。此举不仅止息了野蛮残杀，也向世人证明了真正的无政府主义珍视尊严，进而化解了部分军官对工会的绝对敌意。',
    },
    {
      id: 'melchor_prison_transparency',
      title: 'Legal Detention Standards',
      titleZh: '规范羁押与秩序标准',
      subtitle: 'Overhaul detention system with registry inspection and human hygiene rules.',
      subtitleZh: '对收押名单实行规范簿籍登记，杜绝夜间“被失踪”，提供体面卫生口粮。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Cenetistas.dissent = Math.max(0, newFactions.Cenetistas.dissent - 10);
        newFactions = adjustFactionInfluence(newFactions, 'Cenetistas', 5);
        return {
          advisorActionTimer: 6,
          factions: newFactions
        };
      },
      description: 'By registering all detainees openly and establishing transparent standard operating rules, we converted lawless jails into orderly facilities.',
      descriptionZh: '通过严格式样簿记与开放外界探监，规范化管理看守所，完全扫除了莫须有夜间捕杀，极大稳固了大众心中的社会稳定感。',
    },
    {
      id: 'melchor_civilian_relief',
      title: 'Humanitarian Evacuations',
      titleZh: '保驾人道疏散长廊',
      subtitle: 'Secure mutual coordinates with international bodies for child and civilian relief.',
      subtitleZh: '协同红十字会等国际机构，对孤儿、妇孺与避难非战斗员开放安全避难廊道。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        resources: state.resources + 5,
        stats: {
          ...state.stats
        }
      }),
      description: 'By aligning with international relief committees, we generated safe civilian corridors and acquired critical medicine shipments in trade.',
      descriptionZh: '通过与国际救济团队密切协调，建立对儿童与妇孺开放的人道隔离空域和疏散廊道，换取了急需的外来药品和民生物资。',
    }
  ]
};
