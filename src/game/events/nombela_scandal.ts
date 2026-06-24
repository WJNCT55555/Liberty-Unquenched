import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';

export const nombelaScandal: GameEvent = {
  id: 'nombela_scandal',
  title: 'The Nombela Scandal',
  titleZh: '隆贝拉丑闻事件',
  description: 'Hot on the heels of the notorious Straperla roulette scandal, a second, even more devastating corruption bombshell has rocked the Radical-CEDA coalition. Antonio Nombela, a high-ranking civil servant in the colonies department, has publicly denounced Prime Minister Alejandro Lerroux’s cabinet. Nombela claims he was summarily dismissed after refusing to sign off on a fraudulent government indemnity of over 2.2 million pesetas to a West African shipping company owned by Antonio Tayá—a payout actively championed by Lerroux’s close political associates.\n\nNow, Nombela has presented damning written evidence of bribery and corruption directly to the Cortes. The public is absolutely furious, and the moral authority of Lerroux’s Radicals is irreversibly shattered. CEDA, led by Gil-Robles, is desperately trying to distance itself, while President Alcalá-Zamora is under massive pressure from the left and moderate republicans to dissolve the corrupt parliament altogether. How does the National Committee of the CNT capitalize on this major crisis?',
  descriptionZh: '继极具恶名的“斯查佩拉”（Straperla）轮盘赌贿赂丑闻爆发后，又一枚更具破坏力的腐败炸弹彻底引爆，将“激进党-CEDA”右翼执政党团推向了覆灭的边缘。殖民地事务部高级文官安东尼奥·隆贝拉（Antonio Nombela）发表公开声明，指控首相亚历杭德罗·勒鲁的内阁中饱私囊。隆贝拉透露，因其拒绝签字批准一笔支付给西非航运公司老板安东尼奥·塔亚、数额高达220万比塞塔的欺诈性政府赔偿金，他本人遭到了政府的免职。而这笔巨额赔偿是由勒鲁关系极近的政治同伙在幕后积极推动运转的。\n\n如今，隆贝拉已将受贿及官员腐败的关键书面罪证呈送至西班牙国会。全西班牙社会群情激愤，勒鲁麾下激进党的政权道德标准彻底破产。吉尔-罗夫莱斯领导的CEDA由于担心被波及，正竭力与其撇清干系；而阿尔卡拉-萨莫拉总统更是承受着来自左翼和温和派共和主义者的排山倒海般的压力，要求彻底解散这届腐败横行的议会。全劳联（CNT）全国委员会将如何在这场空前的反动政权合法性危机中采取行动？',
  condition: (state) => 
    state.year === 1935 && 
    state.month === 11 && 
    state.government.type === 'Radical-CEDA Government',
  options: [
    {
      text: 'Expose the decay of the bourgeois state! Prepare the workers for revolutionary action.',
      textZh: '揭露资产阶级国家的腐朽本质！动员并准备工人们发起革命性直接行动。',
      subtitle: 'Massively increases revolutionary fervor and worker control, but damages relations with moderate political entities.',
      subtitleZh: '大幅提高革命热情与工人控制度，但会对与温和派政治各方的关系造成损害。',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Obreros.support.CNT_FAI = Math.min(100, (newClasses.Obreros.support.CNT_FAI || 0) + 8);
        newClasses.Braceros.support.CNT_FAI = Math.min(100, (newClasses.Braceros.support.CNT_FAI || 0) + 8);

        return {
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15),
            workerControl: Math.min(100, state.stats.workerControl + 8),
            republicanAuthority: Math.max(0, state.stats.republicanAuthority - 12)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.max(-100, state.partyRelations.PSOE - 10),
            IR: Math.max(-100, state.partyRelations.IR - 15)
          },
          factions: adjustFactionInfluence(adjustFactionInfluence(state.factions, 'Faistas', 10), 'Puristas', 10)
        };
      }
    },
    {
      text: 'Form a tactical understanding with Left Republicans to demand immediate elections.',
      textZh: '同左翼共和派达成战术默契，共同强烈要求解散议会并立即举行大选。',
      subtitle: 'Boosts political relations and coordinates anti-right voting, but raises dissent among purist factions.',
      subtitleZh: '提升与主流左翼党派的政治协作关系，但会计及提升内部纯粹主义派系的不满。',
      effect: (state) => {
        let newFactions = JSON.parse(JSON.stringify(state.factions));
        newFactions.Faistas.dissent = Math.min(100, (newFactions.Faistas.dissent || 0) + 10);
        newFactions.Puristas.dissent = Math.min(100, (newFactions.Puristas.dissent || 0) + 10);
        newFactions = adjustFactionInfluence(adjustFactionInfluence(newFactions, 'Treintistas', 12), 'Cenetistas', 8);

        return {
          factions: newFactions,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 5),
            republicanAuthority: Math.min(100, state.stats.republicanAuthority + 5)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.min(100, state.partyRelations.PSOE + 15),
            IR: Math.min(100, state.partyRelations.IR + 15)
          }
        };
      }
    },
    {
      text: 'Leverage the crisis to organize massive rent strikes and rural agrarian struggles.',
      textZh: '借机动员各层，在重点农村连带发动大规模抗缴地租与农产品罢工斗争。',
      subtitle: 'Gains extensive support among landless peasants, but slightly strains economic indicators.',
      subtitleZh: '在底层失地雇农中赢得极高的威望与动员支持，但会让经济指标小幅下滑。',
      effect: (state) => {
        const newClasses = JSON.parse(JSON.stringify(state.classes));
        newClasses.Braceros.support.CNT_FAI = Math.min(100, (newClasses.Braceros.support.CNT_FAI || 0) + 15);
        newClasses.Labradores.support.CNT_FAI = Math.min(100, (newClasses.Labradores.support.CNT_FAI || 0) + 8);

        return {
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 8),
            economy: Math.max(0, state.stats.economy - 3)
          },
          factions: adjustFactionInfluence(state.factions, 'Puristas', 12)
        };
      }
    }
  ]
};
