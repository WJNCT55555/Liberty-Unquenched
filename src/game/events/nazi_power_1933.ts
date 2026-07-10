import { GameEvent } from '../types';
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
  description: 'In Berlin, the aging President Paul von Hindenburg has appointed Adolf Hitler, leader of the National Socialist German Workers\' Party (NSDAP), as Chancellor of Germany. This momentous event marks the birth of the Third Reich. Within weeks, using the Reichstag fire as a pretext, the new regime has suspended civil liberties, shuttered trade unions, and outlawed Left-wing parties. A brutal fascist dictatorship now stands at the heart of Europe. Across Spain, both the working class and republican politicians watch in utter dread, realizing that the global struggle between democracy, fascism, and revolution has entered a terrifying new phase. How does our National Committee respond to this fascist threat?',
  descriptionZh: '在柏林，年迈的总统保罗·冯·兴登堡正式任命国家社会主义德意志劳工党（纳粹党）领袖阿道夫·希特勒为德国总理。这一重大历史时刻标志着第三帝国的诞生。短短几周内，新政权以国会纵火案为借口，迅速废除了公民自由，强行解散了各级自由工会，并将所有左翼和民主政党定为非法。一个极其野蛮的法西斯独裁政权赫然矗立在欧洲的心脏地带。全西班牙的工人阶级和共和派政治家们陷入了深切的忧虑，深知民主、法西斯与革命之间的全球性博弈已步入一个极其险恶的新阶段。我们全国委员会应如何应对这一法西斯阴霾？',
  options: [
    {
      text: 'Publish fiery front-page indictments in Solidaridad Obrera and call for an anti-fascist worker alliance.',
      textZh: '在《工人团结报》头版发表最强烈的怒斥社论，号召建立广泛的反法西斯工人统一战线！',
      subtitle: 'Triggers deep offense from Berlin; boosts revolutionary fervor and aligns we closer to other left parties, but severely harms Spanish-German relations.',
      subtitleZh: '引发来自柏林的强烈抗议；提振革命热情、拉近同左翼各党派的距离，但西-德外交关系受到剧烈打击。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 12)
        },
        relations: {
          ...state.relations,
          germany: Math.max(0, state.relations.germany - 25)
        },
        partyRelations: {
          ...state.partyRelations,
          PSOE: Math.min(100, state.partyRelations.PSOE + 5),
          PCE: Math.min(100, state.partyRelations.PCE + 8)
        }
      })
    },
    {
      text: 'Approve covert support for exiled German anarcho-syndicalist refugees fleeing the Gestapo.',
      textZh: '批准秘密资金和越境援助，协助逃离盖世太保追捕的德国无政府工团主义流亡同志。',
      subtitle: 'Directly helps FAUD comrades; moderately boosts internal faction unity but risks high-tension diplomatic protests.',
      subtitleZh: '直接救助德国无政府工团主义（FAUD）流亡同志；温和提升内部派系统结度与威望，但会遭遇严重的外交抗议。',
      effect: (state) => {
        let newClasses = state.classes;
        newClasses = adjustClassSupport(newClasses, 'Obreros', 'CNT_FAI', 5);
        return {
          classes: newClasses,
          relations: {
            ...state.relations,
            germany: Math.max(0, state.relations.germany - 20)
          },
          budget: Math.max(0, state.budget - 1)
        };
      }
    },
    {
      text: 'Adopt a pragmatic stance of official non-intervention while keeping unions alert.',
      textZh: '在官方外交层面采取务实的“不干涉”自保姿态，但在基层工会内部维持高度警戒。',
      subtitle: 'Minimizes immediate friction, but Berlin remains deeply suspicious of Spain’s leftist atmosphere.',
      subtitleZh: '最大程度减少直接的摩擦抵触，但柏林依然对西班牙的左翼民主革命氛围保持深度怀疑。',
      effect: (state) => ({
        stats: {
          ...state.stats,
          revolutionaryFervor: Math.max(0, state.stats.revolutionaryFervor - 3)
        },
        relations: {
          ...state.relations,
          germany: Math.max(0, state.relations.germany - 10)
        }
      })
    }
  ]
};
