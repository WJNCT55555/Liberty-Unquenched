import { GameEvent } from '../types';
import { adjustFactionInfluence } from '../utils';
import { presidentialElectionCandidateSelection } from './presidential_election_candidate_selection';

export const presidentialElectionPrimary: GameEvent = {
  id: 'presidential_election_primary',
  title: 'Left Primary Selection',
  titleZh: '左翼阵营初选',
  description: 'The Left must unite behind a single presidential candidate. Manuel Azaña represents the path of republican order, constitutionalism, and stable governance in cooperation with the PSOE and IR. Ramón Franco, if backed, represents a radical decentralized vision — an Iberian federalist republic that shatters centralized power. Our decision here determines who represents the Left in the three-way general election.',
  descriptionZh: '左翼阵营必须统合在唯一的候选人身后。曼努埃尔·阿萨尼亚代表着共和秩序——渐进改革、宪法框架、与工社党(PSOE)和共和左翼(IR)的稳固联盟。拉蒙·佛朗哥代表着另一条道路——粉碎中央集权、建立伊比利亚联邦、让每一个地区自决。两人的政见截然不同。我们的选择将决定谁代表左翼出战三阵营大选。',
  condition: (state) => state.presidentElectionPhase === 'primary',
  options: [
    {
      text: 'Azaña. The Republic must be reformed, not shattered.',
      textZh: '阿萨尼亚。共和国需要改革，而非粉碎。',
      subtitle: 'A stable left alliance with the PSOE and IR. Predictable and trusted by bourgeois republicans we despise but need.',
      subtitleZh: '与PSOE和IR建立稳定的左翼联盟。行事温和而容易被社会主流及资产阶级共和派接受。会引起法伊主义者的不悦。',
      effect: (state) => {
        let f = { ...state.factions };
        f.Faistas = { ...f.Faistas, dissent: Math.min(100, (f.Faistas?.dissent || 0) + 10) };
        f = adjustFactionInfluence(f, 'Treintistas', 5);
        
        const relations = { ...state.partyRelations };
        relations.IR = Math.min(100, (relations.IR || 0) + 10);
        
        return {
          presidentElectionLeftCandidate: 'azana',
          presidentElectionPhase: 'general',
          factions: f,
          partyRelations: relations,
          pendingEvents: [
            { ...presidentialElectionCandidateSelection },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCandidateSelection.id)
          ]
        };
      }
    },
    {
      text: 'Ramón Franco. Let the Iberian Eagle fly.',
      textZh: '拉蒙·佛朗哥。让伊比利亚之鹰起飞。',
      subtitle: 'A radical gamble. Federalism, regional autonomy, a Franco against Franco. The establishment will tremble.',
      subtitleZh: '一场激进的豪赌。联邦主义、区域自决、一个“反对佛朗哥的佛朗哥”。建制派会因此而颤抖。但这会让主流温和派感到极度不安。',
      condition: (state) => state.ramonFrancoPresidentUnlocked === true,
      unavailableSubtitle: () => 'Ramón Franco has not unlocked the "Iberian Eagle" campaign journal.',
      unavailableSubtitleZh: () => '拉蒙·佛朗哥尚未完成"伊比利亚之鹰"竞选日志。',
      effect: (state) => {
        let f = { ...state.factions };
        f = adjustFactionInfluence(f, 'Jabalistas', 10);
        f = adjustFactionInfluence(f, 'Treintistas', -5);
        
        const relations = { ...state.partyRelations };
        relations.PSOE = Math.max(-100, (relations.PSOE || 0) - 10);
        
        return {
          presidentElectionLeftCandidate: 'ramon_franco',
          presidentElectionPhase: 'general',
          factions: f,
          partyRelations: relations,
          pendingEvents: [
            { ...presidentialElectionCandidateSelection },
            ...state.pendingEvents.filter(e => e.id !== presidentialElectionCandidateSelection.id)
          ]
        };
      }
    }
  ]
};
