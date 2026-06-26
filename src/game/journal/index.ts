import { landReformJournal } from './land_reform';
import { regionalIssuesJournal } from './regional_issues';
import { iberianDreamJournal } from './iberian_dream';
import { uhpJournal } from './uhp';
import { alianzaObreraJournal } from './alianza_obrera';
import { ramonFrancoPresidencyJournal } from './ramon_franco_presidency';
import { JournalEntryDef } from '../types';

export const JOURNAL_ENTRIES: JournalEntryDef[] = [
  landReformJournal,
  regionalIssuesJournal,
  iberianDreamJournal,
  uhpJournal,
  alianzaObreraJournal,
  ramonFrancoPresidencyJournal
];

export const getJournalEntryDef = (id: string): JournalEntryDef | undefined => {
  return JOURNAL_ENTRIES.find(entry => entry.id === id);
};
