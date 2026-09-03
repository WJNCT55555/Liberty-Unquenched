import { proclamationSecondRepublic } from './proclamation_of_the_second_republic';
import { elections1931Results, cabinetFormation1931, ministerAllocation, republicanCabinet1931, leftCabinetExcludesCNT } from './elections_1931_results';
import { elections1933, elections1933Results } from './elections_1933';
import { constitution1931 } from './constitution_1931';
import { cnt_third_congress_1 } from './cnt_third_congress';
import { burningConvents } from './burning_of_the_convents';
import { azanaMilitaryReform } from './azana_military_reform';
import { manifestoOfThirty } from './manifesto_thirty';
import { foundingSyndicalistParty } from './founding_syndicalist_party';
import { cedaFormation } from './ceda_formation';
import { cataloniaDefense } from './civil_war/catalonia_defense';
import { aragonCouncil } from './civil_war/aragon_council';
import { nationalistSurrender } from './civil_war/nationalist_surrender';
import { republicanSurrender } from './civil_war/republican_surrender';
import { foundingOfFalange } from './founding_of_falange';
import { birthOfFeDeLasJons } from './birth_of_fe_de_las_jons';
import { foundingOfPOUM } from './founding_of_poum';
import { formationOfPRRevS } from './formation_of_prrevs';
import { fijlFormation } from './fijl_formation';
import { mujeresLibresFormation } from './mujeres_libres_formation';
import { laSanjurjada } from './la_sanjurjada';
import { jabaliEvent } from './jabali';
import { juradosMixtos } from './jurados_mixtos';
import { huelgaTelefonica1931 } from './huelga_telefonica_1931';
import { casasViejas1, casasViejas2Insurrection, casasViejas2Crackdown, casasViejas2Peace, generalStrikeFails } from './casas_viejas';
import { cataloniaAutonomy1932 } from './catalonia_autonomy_1932';
import { nombelaScandal } from './nombela_scandal';
import { naziPower1933 } from './nazi_power_1933';
import { civilWarSetup } from './civil_war/civil_war_setup';
import { defenseCommitteeFormation } from './defense_committee_formation';
import { workersAllianceAttempt } from './workers_alliance_attempt';
import { workersAllianceFormation } from './workers_alliance_formation';
import { crossroadsUprisingAlliance } from './crossroads_uprising_alliance';
import { elections1936, elections1936Results } from './elections_1936';
import { presidentialDissolutionOfCortes } from './presidential_dissolution';
import { earlyGeneralElectionResults } from './early_general_election';
import { ramonCampaignEvent1, ramonCampaignEvent2, ramonCampaignEvent3 } from './ramon_campaign_events';
import { presidentialElectionDecision, presidentialElectionPrimary, presidentialElectionCandidateSelection, presidentialElectionAutoResolve, presidentialElectionCampaignMenu, presidentialElectionResults, presidentialElectionResultsRound2 } from './presidential_election_chain';
import { asturiasRevolution, asturiasWarFailed } from './asturias_revolution';
import { andalusiaFireEvent } from './andalusia_fire';
import { cnt_fourth_congress_0 } from './cnt_fourth_congress';
import { formationOfIzquierdaRepublicana, formationOfUnionRepublicana } from './republican_party_mergers';
import * as civilWarSetupDefinitions from './civil_war/civil_war_setup';
import * as cntThirdCongressDefinitions from './cnt_third_congress';
import * as cntFourthCongressDefinitions from './cnt_fourth_congress';
import type { GameEvent } from '../types';

export { 
  civilWarSetup, 
  defenseCommitteeFormation, 
  fijlFormation,
  mujeresLibresFormation,
  workersAllianceAttempt, 
  workersAllianceFormation, 
  crossroadsUprisingAlliance, 
  elections1936, 
  elections1936Results, 
  presidentialDissolutionOfCortes, 
  earlyGeneralElectionResults,
  ramonCampaignEvent1, 
  ramonCampaignEvent2, 
  ramonCampaignEvent3,
  presidentialElectionDecision,
  presidentialElectionPrimary,
  presidentialElectionCandidateSelection,
  presidentialElectionAutoResolve,
  presidentialElectionCampaignMenu,
  presidentialElectionResults,
  presidentialElectionResultsRound2,
  asturiasRevolution,
  asturiasWarFailed,
  andalusiaFireEvent
};

export const INITIAL_EVENTS = [
  proclamationSecondRepublic,
  burningConvents,
  azanaMilitaryReform,
  elections1931Results,
  cabinetFormation1931,
  ministerAllocation,
  republicanCabinet1931,
  leftCabinetExcludesCNT,
  cnt_third_congress_1,
  huelgaTelefonica1931,
  manifestoOfThirty,
  constitution1931,
  foundingSyndicalistParty,
  cedaFormation,
  cataloniaDefense,
  aragonCouncil,
  nationalistSurrender,
  republicanSurrender,
  foundingOfFalange,
  birthOfFeDeLasJons,
  foundingOfPOUM,
  formationOfPRRevS,
  fijlFormation,
  mujeresLibresFormation,
  formationOfIzquierdaRepublicana,
  formationOfUnionRepublicana,
  laSanjurjada,
  jabaliEvent,
  juradosMixtos,
  elections1933,
  elections1933Results,
  casasViejas1,
  casasViejas2Insurrection,
  casasViejas2Crackdown,
  casasViejas2Peace,
  generalStrikeFails,
  cataloniaAutonomy1932,
  nombelaScandal,
  naziPower1933,
  civilWarSetup,
  defenseCommitteeFormation,
  workersAllianceAttempt,
  workersAllianceFormation,
  crossroadsUprisingAlliance,
  elections1936,
  elections1936Results,
  presidentialDissolutionOfCortes,
  earlyGeneralElectionResults,
  ramonCampaignEvent1,
  ramonCampaignEvent2,
  ramonCampaignEvent3,
  presidentialElectionDecision,
  presidentialElectionPrimary,
  presidentialElectionCandidateSelection,
  presidentialElectionAutoResolve,
  presidentialElectionCampaignMenu,
  presidentialElectionResults,
  presidentialElectionResultsRound2,
  asturiasRevolution,
  asturiasWarFailed,
  andalusiaFireEvent,
  cnt_fourth_congress_0
];

const isGameEvent = (value: unknown): value is GameEvent => Boolean(
  value
  && typeof value === 'object'
  && typeof (value as GameEvent).id === 'string'
  && Array.isArray((value as GameEvent).options),
);

/**
 * Runtime event definitions used only to rebuild functions when loading a save.
 * Chain nodes belong here without being added to INITIAL_EVENTS, because adding
 * them to the scheduled-event list could change when gameplay events trigger.
 */
export const RESTORABLE_EVENTS: GameEvent[] = [
  ...new Map(
    [
      ...INITIAL_EVENTS,
      ...Object.values(civilWarSetupDefinitions).filter(isGameEvent),
      ...Object.values(cntThirdCongressDefinitions).filter(isGameEvent),
      ...Object.values(cntFourthCongressDefinitions).filter(isGameEvent),
    ].map((event) => [event.id, event]),
  ).values(),
];
