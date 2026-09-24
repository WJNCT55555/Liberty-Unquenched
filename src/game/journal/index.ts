import { landReformJournal } from './land_reform';
import { regionalIssuesJournal } from './regional_issues';
import { iberianDreamJournal } from './iberian_dream';
import { uhpJournal } from './uhp';
import { alianzaObreraJournal } from './alianza_obrera';
import { ramonFrancoPresidencyJournal } from './ramon_franco_presidency';
import { popularArmyJournal } from './popular_army';
import { militiaAutonomyJournal } from './militia_autonomy';
import { landCollectivizationJournal } from './land_collectivization';
import { economySyndicalistJournal } from './economy_syndicalist';
import { economyFreeCommuneJournal } from './economy_free_commune';
import { economyCooperativeJournal } from './economy_cooperative';
import { economyOrganicJournal } from './economy_organic';
import { economyWarEffortJournal } from './economy_war_effort';
import { economyRevolutionaryWarJournal } from './economy_revolutionary_war';
import { JournalEntryDef } from '../types';

export const JOURNAL_ENTRIES: JournalEntryDef[] = [
  landReformJournal,
  regionalIssuesJournal,
  iberianDreamJournal,
  uhpJournal,
  alianzaObreraJournal,
  ramonFrancoPresidencyJournal,
  popularArmyJournal,
  militiaAutonomyJournal,
  // 经济改造的六条路线（docs/经济改造方案.md §5）与土地集体化日志（§13，第 5C 期落地）。
  // 集体化日志的完成条件读土地饼的集体份额（≥65%），与六条路线的饼图口径一致。
  landCollectivizationJournal,
  economySyndicalistJournal,
  economyFreeCommuneJournal,
  economyCooperativeJournal,
  economyOrganicJournal,
  economyWarEffortJournal,
  economyRevolutionaryWarJournal
];

export const getJournalEntryDef = (id: string): JournalEntryDef | undefined => {
  return JOURNAL_ENTRIES.find(entry => entry.id === id);
};
