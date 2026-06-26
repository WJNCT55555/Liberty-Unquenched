import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';
import { presidentialElectionPrimary } from './presidential_election_primary';
import { presidentialElectionAutoResolve } from './presidential_election_auto_resolve';

export const presidentialElectionDecision: GameEvent = {
  id: 'presidential_election_decision',
  title: 'The Presidential Election',
  titleZh: '共和国总统选举',
  description: 'Niceto Alcalá-Zamora has been impeached and removed from office. Speaker Diego Martínez Barrio is acting as interim president until a new president is chosen by an electoral college of 940 members — the 470 current deputies of the Cortes and 470 newly elected electors.\n\nThe left-wing camp is split between two camps: Manuel Azaña, representing republican order and stable reforms, and — if the CNT is ready to unleash this beast — Ramón Franco with his radical Iberian federalist dream. In the center stands interim president Martínez Barrio of the moderate democratic wing of the Radical Republicans. On the right, the forces are united under José María Gil-Robles of CEDA.\n\nThe CNT National Committee now faces the first major threshold: shall we intervene and participate in this state election?',
  descriptionZh: '尼塞托·阿尔卡拉-萨莫拉已被弹劾罢免。议长迭戈·马丁内斯·巴里奥将担任临时总统，直至新总统经由940名选举人团成员——470名现任议员加上470名另行普选的选举人——选出。\n\n左翼阵营分裂为两股力量：曼努埃尔·阿萨尼亚代表着共和秩序与渐进改革，而——若CNT准备释放这头野兽——拉蒙·佛朗哥代表着极端联邦派的狂想。在中间地带站着临时总统马丁内斯·巴里奥本人，激进共和党的温和民主翼。右翼则统一在CEDA领袖吉尔-罗伯斯的旗下。\n\n全国委员会现在面临第一道门槛：我们是否介入并参与这场总统大选？',
  condition: (state) => {
    return state.presidentImpeached === true && 
           state.civilWarStatus === 'not_started' && 
           state.presidentElectionSeen === false;
  },
  options: [
    {
      text: 'Abstain. "Aborrecemos a todo gobernante."',
      textZh: '弃权。“我们憎恶任何统治者。”',
      subtitle: 'Stand aside and refuse to participate. The left candidate defaults to Azaña, and the three-way election will be resolved automatically based on current party strengths.',
      subtitleZh: '不参与这场国家政治的角逐。左翼候选人将自动默认为阿萨尼亚，三阵营大选按现有政党力量自动计票。',
      effect: (state) => {
        return {
          cntParticipatePresidential: false,
          presidentElectionLeftCandidate: 'azana',
          presidentElectionActiveCandidate: null,
          presidentElectionPhase: 'general',
          presidentElectionSeen: true,
          pendingEvents: [
            { ...presidentialElectionAutoResolve },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionAutoResolve.id)
          ]
        };
      }
    },
    {
      text: 'Participate. The workers deserve a voice.',
      textZh: '参与。工人应当拥有发言权。',
      subtitle: 'Intervene in the election. We must first decide which candidate to support in the left primary — Azaña or Ramón Franco.',
      subtitleZh: '介入选举。首先我们需要决定在左翼初选中支持推举谁出战——阿萨尼亚还是拉蒙·佛朗哥。这会激怒纯洁派和法伊主义者，但温和派感到满意。',
      effect: (state) => {
        let f = { ...state.factions };
        f.Faistas = { ...f.Faistas, dissent: Math.min(100, (f.Faistas?.dissent || 0) + 20) };
        f.Puristas = { ...f.Puristas, dissent: Math.min(100, (f.Puristas?.dissent || 0) + 15) };
        f = adjustFactionInfluence(f, 'Treintistas', 10);
        
        return {
          cntParticipatePresidential: true,
          presidentElectionPhase: 'primary',
          presidentElectionSeen: true,
          factions: f,
          pendingEvents: [
            { ...presidentialElectionPrimary },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionPrimary.id)
          ]
        };
      }
    }
  ]
};
