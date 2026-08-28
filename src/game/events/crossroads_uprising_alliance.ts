import type { GameEvent } from '../types';
import { adjustFactionInfluence, formCoalition } from '../utils';

const uhpAsturiasMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  series: ['asturias', 'uhp'],
  tags: ['journal'],
};

export const crossroadsUprisingAlliance: GameEvent = {
  id: 'crossroads_uprising_alliance',
  meta: uhpAsturiasMeta,
  condition: (state) => {
    // Triggers once UHP has been attempted, and we are in 1934 or 1935, and have not yet decided this crossroads
    const isReady = state.uhp_attempt_triggered && !state.crossroads_uprising_alliance_decided;
    const isYearMatch = state.year >= 1934;
    return isReady && isYearMatch;
  },
  title: 'Crossroads: Proletarian Uprising or Anti-Fascist Alliance?',
  titleZh: '十字路口：无产阶级起义还是反法西斯同盟？',
  description: 'With the workers mobilizing under the banner of UHP, we face a historical crossroads. Do we focus entirely on the revolutionary Workers\' Alliance to launch a social revolution and prepare for a proletarian uprising? Or do we pivot to a broad Anti-Fascist Alliance (Popular Front) with the bourgeois republicans (IR, ERC) and the PCE to win the upcoming elections and save the Republic?',
  descriptionZh: '随着工人们在“联合无产阶级兄弟”（UHP）的旗帜下动员起来，我们面临着一个历史性的十字路口。我们是应当完全专注于革命的工人联盟（Alianza Obrera），发起社会革命并为无产阶级起义做好准备？还是转向与资产阶级共和派（IR、ERC）及共产党（PCE）结成广泛的反法西斯同盟（人民阵线），以赢得即将举行的大选并挽救共和国？',
  options: [
    {
      text: 'Option A: The Proletarian Uprising! We will tolerate no class collaboration.',
      textZh: '选项 A：无产阶级起义！我们绝不容忍任何阶级妥协。',
      effect: (state) => {
        const newFactions = adjustFactionInfluence(state.factions, 'Faistas', 10);
        
        return {
          crossroads_uprising_alliance_decided: true,
          crossroads_choice: 'uprising',
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 15)
          },
          partyRelations: {
            ...state.partyRelations,
            PSOE: Math.min(100, (state.partyRelations?.PSOE ?? 0) + 15)
          },
          workersAllianceProgress: Math.min(3, (state.workersAllianceProgress || 0) + 2),
          factions: newFactions
        };
      }
    },
    {
      text: 'Option B: The Anti-Fascist Alliance! Build the Popular Front to defeat reaction at the ballot box.',
      textZh: '选项 B：反法西斯同盟！组建人民阵线，用选票彻底击败反动派。',
      effect: (state) => {
        // Form the popular front coalition
        const nextState = formCoalition(state, 'popular_front');
        
        // Option B must NOT decrease tension. We can keep it the same or slightly increase.
        // Treintistas and Puristas influence must NOT increase.
        // Faistas influence must NOT decrease (let's increase it by 5).
        const newFactions = adjustFactionInfluence(nextState.factions, 'Faistas', 5);
        
        // Deactivate/fail the Workers' Alliance/UHP journals since we've chosen the Popular Front
        const updatedJournal = { ...nextState.journal };
        if (updatedJournal['journal_uhp']) {
          updatedJournal['journal_uhp'] = { ...updatedJournal['journal_uhp'], status: 'failed' };
        }
        if (updatedJournal['journal_alianza_obrera']) {
          updatedJournal['journal_alianza_obrera'] = { ...updatedJournal['journal_alianza_obrera'], status: 'failed' };
        }

        return {
          crossroads_uprising_alliance_decided: true,
          crossroads_choice: 'popular_front',
          cntStance: 'cooperate' as const,
          factions: newFactions,
          journal: updatedJournal,
          activeCoalitions: nextState.activeCoalitions,
          coalitionHistory: nextState.coalitionHistory,
          stats: {
            ...nextState.stats
          }
        };
      }
    }
  ]
};
