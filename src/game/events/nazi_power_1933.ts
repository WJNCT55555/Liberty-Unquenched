import type { GameEvent } from '../types';
import { adjustClassSupport, isAtOrAfter } from '../utils';

const newsMeta = {
  category: 'news' as const,
  flow: 'solo' as const,
};

export const naziPower1933: GameEvent = {
  id: 'nazi_power_1933',
  meta: newsMeta,
  date: { year: 1933, month: 1 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1933, 1),
  title: 'Machtergreifung: Nazi Seizure of Power in Germany',
  titleZh: '权力夺取：纳粹在德国掌权',
  description: `In Berlin, the aging President Paul von Hindenburg has appointed Adolf Hitler, leader of the National Socialist German Workers' Party (NSDAP), as Chancellor of Germany. This momentous event marks the birth of the Third Reich. Within weeks, using the Reichstag fire as a pretext, the new regime has suspended civil liberties, shuttered trade unions, and outlawed Left-wing parties. A brutal fascist dictatorship now stands at the heart of Europe. Across Spain, both the working class and republican politicians watch in utter dread, realizing that the global struggle between democracy, fascism, and revolution has entered a terrifying new phase. How does our National Committee respond to this fascist threat?`,
  descriptionZh: `在柏林，年迈的总统保罗·冯·兴登堡正式任命国家社会主义德意志劳工党（纳粹党）领袖阿道夫·希特勒为德国总理。这一重大历史时刻标志着第三帝国的诞生。短短几周内，新政权以国会纵火案为借口，迅速废除了公民自由，强行解散了各级自由工会，并将所有左翼和民主政党定为非法。一个极其野蛮的法西斯独裁政权赫然矗立在欧洲的心脏地带。全西班牙的工人阶级和共和派政治家们陷入了深切的忧虑，深知民主、法西斯与革命之间的全球性博弈已步入一个极其险恶的新阶段。我们全国委员会应如何应对这一法西斯阴霾？`,
  options: [
    {
      text: 'Publish fiery front-page indictments in Solidaridad Obrera and call for an anti-fascist worker alliance.',
      textZh: '在《工人团结报》头版发表最强烈的怒斥社论，号召建立广泛的反法西斯工人统一战线！',
      subtitle: 'Raises revolutionary fervor by 12, improves PSOE and PCE relations, and damages German relations by 25.',
      subtitleZh: '提高革命热情 12 点，改善与 PSOE 和 PCE 的关系，并使德国关系下降 25 点。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 12),
        },
        relations: {
          ...state.relations,
          germany: Math.max(-100, state.relations.germany - 25)
        },
        partyRelations: {
          ...state.partyRelations,
          PSOE: Math.min(100, state.partyRelations.PSOE + 5),
          PCE: Math.min(100, state.partyRelations.PCE + 8),
        },
      }),
    },
  ],
};
