import type { CoalitionId, GameEvent, GameState } from '../types';
import { isRepublicanPartyPresent } from '../politicalEligibility';
import { formCoalition, isAtOrAfter } from '../utils';

const coalitionFormationMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  series: ['coalitions', 'elections'],
  tags: ['election', 'journal'],
};

const hasCoalition = (state: GameState, id: CoalitionId): boolean => (
  state.activeCoalitions.some(coalition => coalition.activeId === id)
);

const formPoliticalCoalition = (state: GameState, id: CoalitionId): Partial<GameState> => {
  const next = formCoalition(state, id);
  return {
    activeCoalitions: next.activeCoalitions,
    coalitionHistory: next.coalitionHistory,
    pendingEvents: next.pendingEvents,
  };
};

/**
 * Historical abstraction: CEDA did not initially enter Lerroux's December 1933
 * cabinet, but its parliamentary support made the Radical government possible.
 * The game records that public governing understanding before the ballot so the
 * alliance can appear as an event-formed electoral contestant.
 */
export const cedaRadicalUnderstanding: GameEvent = {
  id: 'ceda_radical_understanding',
  meta: coalitionFormationMeta,
  date: { year: 1933, month: 10 },
  condition: (state) => state.scenario === '1931'
    && state.civilWarStatus === 'not_started'
    && isAtOrAfter(state, 1933, 10)
    && state.ceda_formed
    && isRepublicanPartyPresent(state, 'AP')
    && isRepublicanPartyPresent(state, 'PRR')
    && !hasCoalition(state, 'ceda_radical'),
  title: 'The Radical–CEDA Understanding',
  titleZh: '激进党—CEDA谅解协议',
  description: 'As the republican left fragments, Alejandro Lerroux’s Radical Republican Party and Gil-Robles’s CEDA reach a public parliamentary understanding. The Radicals will provide the republican cabinet leadership; CEDA will contribute the decisive Catholic-right vote and initially support the cabinet from outside. Liberal democrats may join the arrangement. It is not yet a fully shared cabinet, but it is now a recognizable governing alliance capable of claiming seats after an election.',
  descriptionZh: '随着共和左翼分裂，亚历杭德罗·勒鲁领导的激进共和党与吉尔-罗夫莱斯领导的 CEDA 达成公开的议会谅解。激进党将提供共和制内阁的领导，CEDA 则提供决定性的天主教右翼选票，并在初期从阁外支持政府；自由民主派也可能加入。这还不是一个完全共同参阁的内阁，但已经成为能够在选举后汇总议席并争取执政的明确联盟。',
  options: [
    {
      text: 'The center and Catholic right prepare to govern together.',
      textZh: '中间派与天主教右翼准备共同执政。',
      subtitle: 'Forms the CEDA–Radical alliance. CEDA begins as a parliamentary supporter rather than automatically receiving cabinet posts.',
      subtitleZh: '成立 CEDA—激进党联盟。CEDA 初期是议会支持者，不会自动获得内阁职位。',
      effect: (state) => formPoliticalCoalition(state, 'ceda_radical'),
    },
  ],
};

/**
 * The right did not field one uniform national list in 1936. This event treats
 * the CEDA, Alfonsist and Carlist agreements as one game-level electoral pact;
 * Falange remains outside the default historical membership.
 */
export const nationalCounterrevolutionaryFront: GameEvent = {
  id: 'national_counterrevolutionary_front',
  meta: coalitionFormationMeta,
  date: { year: 1936, month: 1 },
  condition: (state) => state.scenario !== '1936'
    && state.civilWarStatus === 'not_started'
    && isAtOrAfter(state, 1936, 1)
    && isRepublicanPartyPresent(state, 'AP')
    && isRepublicanPartyPresent(state, 'RE')
    && isRepublicanPartyPresent(state, 'CT')
    && !hasCoalition(state, 'ceda_radical')
    && !hasCoalition(state, 'national_front'),
  title: 'The National Counter-Revolutionary Front',
  titleZh: '国民反革命阵线',
  description: 'CEDA, the Alfonsist monarchists and the Carlists negotiate common anti-left candidacies for the approaching election. Their agreements vary by province and do not amount to a single coherent program, but together they present a recognizable counter-revolutionary electoral front. Falange refuses the discipline of the pact and remains outside the default agreement.',
  descriptionZh: '面对即将到来的大选，CEDA、阿方索派君主主义者与卡洛斯派协商共同的反左翼候选名单。各省协议并不一致，也没有形成统一的共同纲领，但它们共同构成了一个清晰可辨的反革命选举阵线。长枪党拒绝接受联盟纪律，因此不属于默认协议。',
  options: [
    {
      text: 'The parliamentary right enters the election as a common front.',
      textZh: '议会右翼以共同阵线参加选举。',
      subtitle: 'Forms the National Front from CEDA, Renovación Española and the Carlists.',
      subtitleZh: '由 CEDA、西班牙革新党与卡洛斯派组成国民阵线。',
      effect: (state) => formPoliticalCoalition(state, 'national_front'),
    },
  ],
};
