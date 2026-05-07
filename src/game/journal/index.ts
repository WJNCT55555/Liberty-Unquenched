import { landReformJournal } from './land_reform';
import { regionalIssuesJournal } from './regional_issues';
import { iberianDreamJournal } from './iberian_dream';
import { JournalEntryDef } from '../types';

export const JOURNAL_ENTRIES: JournalEntryDef[] = [
  landReformJournal,
  regionalIssuesJournal,
  iberianDreamJournal
];

export const getJournalEntryDef = (id: string): JournalEntryDef | undefined => {
  return JOURNAL_ENTRIES.find(entry => entry.id === id);
};
