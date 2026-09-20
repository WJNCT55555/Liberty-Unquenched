import type { GameEvent } from '../types';
import { proclamationSecondRepublic } from '../events/proclamation_of_the_second_republic';
import { elections1933 } from '../events/elections_1933';
import { constitution1931 } from '../events/constitution_1931';
import { cnt_third_congress_1 } from '../events/cnt_third_congress';
import { burningConvents } from '../events/burning_of_the_convents';
import { azanaMilitaryReform } from '../events/azana_military_reform';
import { manifestoOfThirty } from '../events/manifesto_thirty';
import { foundingSyndicalistParty } from '../events/founding_syndicalist_party';
import { cedaFormation } from '../events/ceda_formation';
import { accionNacionalFormation } from '../events/accion_nacional_formation';
import { jonsFormation, seuFormation, seccionFemeninaFormation } from '../events/falange_organizations';
import { jsuFormation, mujeresAntifascistasFormation, egiFormation, jciFormation } from '../events/party_auxiliary_organizations';
import { cataloniaDefense } from '../events/civil_war/catalonia_defense';
import { aragonCouncil } from '../events/civil_war/aragon_council';
import { nationalistSurrender } from '../events/civil_war/nationalist_surrender';
import { republicanSurrender } from '../events/civil_war/republican_surrender';
import { foundingOfFalange } from '../events/founding_of_falange';
import { birthOfFeDeLasJons } from '../events/birth_of_fe_de_las_jons';
import { foundingOfPOUM } from '../events/founding_of_poum';
import { maocFormation } from '../events/maoc_formation';
import { consFormation } from '../events/cons_formation';
import { formationOfPRRevS } from '../events/formation_of_prrevs';
import { fijlFormation } from '../events/fijl_formation';
import { mujeresLibresFormation } from '../events/mujeres_libres_formation';
import { olimpiadaPopular, olimpiadaPopularStranded } from '../events/olimpiada_popular';
import { laSanjurjada } from '../events/la_sanjurjada';
import { jabaliEvent } from '../events/jabali';
import { juradosMixtos } from '../events/jurados_mixtos';
import { leyDefensaRepublica } from '../events/ley_defensa_republica';
import { leyOrdenPublico } from '../events/ley_orden_publico';
import { huelgaTelefonica1931 } from '../events/huelga_telefonica_1931';
import { casasViejas1 } from '../events/casas_viejas';
import { cataloniaAutonomy1932 } from '../events/catalonia_autonomy_1932';
import { nombelaScandal } from '../events/nombela_scandal';
import { naziPower1933 } from '../events/nazi_power_1933';
import { wartimePowerArrangement, wartimeCabinetCoordination } from '../events/civil_war/wartime_power_arrangement';
import { mayDays, mayDaysPOUMCase } from '../events/civil_war/may_days';
import { defenseCommitteeFormation } from '../events/defense_committee_formation';
import { workersAllianceAttempt } from '../events/workers_alliance_attempt';
import { workersAllianceFormation } from '../events/workers_alliance_formation';
import { crossroadsUprisingAlliance } from '../events/crossroads_uprising_alliance';
import { elections1936 } from '../events/elections_1936';
import { presidentialDissolutionOfCortes } from '../events/presidential_dissolution';
import { presidentialElectionDecision } from '../events/presidential_election_chain';
import { asturiasRevolution } from '../events/asturias_revolution';
import { andalusiaFireEvent } from '../events/andalusia_fire';
import { cnt_fourth_congress_0 } from '../events/cnt_fourth_congress';
import { formationOfIzquierdaRepublicana, formationOfUnionRepublicana } from '../events/republican_party_mergers';
import { defineUniqueRegistry } from './registryUtils';

export type ScheduledEventDefinition = GameEvent & (
  | { date: NonNullable<GameEvent['date']> }
  | { condition: NonNullable<GameEvent['condition']> }
);

const defineScheduledEventRegistry = (events: readonly GameEvent[]): ScheduledEventDefinition[] => {
  for (const event of events) {
    if (!event.date && !event.condition) {
      throw new Error(`Scheduled event requires a date or condition: ${event.id}`);
    }
  }
  return defineUniqueRegistry('scheduled event', events) as ScheduledEventDefinition[];
};

/** Events discoverable by start/month scheduling or its explicit forced-entry rules. */
export const SCHEDULED_EVENT_REGISTRY = defineScheduledEventRegistry([
  wartimePowerArrangement,
  mayDays,
  mayDaysPOUMCase,
  wartimeCabinetCoordination,
  proclamationSecondRepublic,
  burningConvents,
  azanaMilitaryReform,
  cnt_third_congress_1,
  huelgaTelefonica1931,
  manifestoOfThirty,
  constitution1931,
  foundingSyndicalistParty,
  cedaFormation,
  accionNacionalFormation,
  jonsFormation,
  seuFormation,
  seccionFemeninaFormation,
  jsuFormation,
  mujeresAntifascistasFormation,
  egiFormation,
  jciFormation,
  cataloniaDefense,
  aragonCouncil,
  nationalistSurrender,
  republicanSurrender,
  foundingOfFalange,
  birthOfFeDeLasJons,
  foundingOfPOUM,
  maocFormation,
  consFormation,
  formationOfPRRevS,
  fijlFormation,
  mujeresLibresFormation,
  olimpiadaPopular,
  olimpiadaPopularStranded,
  formationOfIzquierdaRepublicana,
  formationOfUnionRepublicana,
  laSanjurjada,
  jabaliEvent,
  juradosMixtos,
  leyDefensaRepublica,
  leyOrdenPublico,
  elections1933,
  casasViejas1,
  cataloniaAutonomy1932,
  nombelaScandal,
  naziPower1933,
  defenseCommitteeFormation,
  workersAllianceAttempt,
  workersAllianceFormation,
  crossroadsUprisingAlliance,
  elections1936,
  presidentialDissolutionOfCortes,
  presidentialElectionDecision,
  asturiasRevolution,
  andalusiaFireEvent,
  cnt_fourth_congress_0,
]);
