import { Advisor } from '../types';
import { adjustFactionInfluence } from '../utils';

export const eduardoBarriobero: Advisor = {
  id: 'Eduardo Barriobero',
  name: 'Eduardo Barriobero',
  nameZh: '爱德华多·巴里奥贝罗',
  faction: 'Jabalistas',
  description: 'A brilliant federal republican lawyer and lawyer-militant of the CNT. He served as defense counsel for hundreds of persecuted workers and later headed the revolutionary CNT Juridical Office in Barcelona during 1936.',
  descriptionZh: '才华横溢的联邦共和派律师兼总工会斗士。他曾免费为数以百计的被迫害工人辩护，并于1936年夏天在加泰罗尼亚主持革命的总工会司法事务部。',
  image: 'img/Advisors/Eduardo_Barriobero.png',
  actions: [
    {
      id: 'barriobero_legal_defense',
      title: 'Pro-Bono Legal Defense',
      titleZh: '劳工诉讼与法律援助',
      subtitle: 'Stand as defense counsel for political prisoners and strike organizers.',
      subtitleZh: '为因罢工、抗税、集会而入狱的底层政治犯和工会干部提供全免法庭辩护。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Faistas.dissent = Math.max(0, newFactions.Faistas.dissent - 6);
        newFactions.Jabalistas.dissent = Math.max(0, newFactions.Jabalistas.dissent - 6);
        return {
          advisorActionTimer: 6,
          factions: newFactions
        };
      },
      description: 'By dismantling bogus police charges and organizing highly coordinated courtroom defenses, we have secured the amnesty and release of countless comrades.',
      descriptionZh: '通过严丝合缝的司法博弈，戳穿反动警宪的莫须有罪状，我们从资产阶级监狱中成功营救并特赦了大量被捕好汉。',
    },
    {
      id: 'barriobero_radical_municipalism',
      title: 'Free Municipal Canton',
      titleZh: '强推自由市镇建制',
      subtitle: 'Forge direct links between local agrarian councils and municipal trade syndicates.',
      subtitleZh: '串联地方农业互助委员会与区里工会，绕过中央各阶级部门实行底层联合。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions = adjustFactionInfluence(newFactions, 'Jabalistas', 6);
        return {
          advisorActionTimer: 6,
          factions: newFactions,
          stats: {
            ...state.stats,
            workerControl: Math.min(100, state.stats.workerControl + 10)
          }
        };
      },
      description: 'By integrating municipal councils with our syndicates, we bypass bureaucratic ministries and implement true economic federalism.',
      descriptionZh: '绕开了繁琐的官僚主义中央部门，促成地方各市镇基层社委会与生产行会的无中间人接合，大大强化了劳工控局。',
    },
    {
      id: 'barriobero_peoples_justice',
      title: 'CNT Juridical Committees',
      titleZh: '组建人民革命法庭',
      subtitle: 'Prosecute corrupt elite judges and secure revolutionary law and order.',
      subtitleZh: '建立总工会司法纠察委员会，铲除军阀余孽与贪污司法官。',
      unavailableSubtitle: (state) => `${state.advisorActionTimer} months before next advisor action.`,
      unavailableSubtitleZh: (state) => `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`,
      condition: (state) => state.advisorActionTimer <= 0,
      effect: (state) => ({
        advisorActionTimer: 6,
        armaments: state.armaments + 10,
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 12)
        }
      }),
      description: 'Through robust popular courts, we have broken the monopoly of corrupt state courts and safeguarded our revolutionary institutions.',
      descriptionZh: '彻底击碎了法绅士绅集团的垄断性司法控制。组建透明、决绝的人民法庭惩办反动保皇势力，极大地巩固和树立了无产阶级的法治自豪感。',
    }
  ]
};
