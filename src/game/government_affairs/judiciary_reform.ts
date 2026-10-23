import React from 'react';
import { Card, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence } from '../utils';
import { applyCoalitionCommitmentDelta } from '../rules/wartimeCoalition';

/**
 * 司法改革（司法部）。
 *
 * 设计意图：司法系统与军队、教会、地主一样，是旧国家最反动的组成部分之一。许多法官自
 * 君主制时代起就一直任职。他们对暴力法西斯分子和叛乱者判处轻得可笑，却无情迫害工人、
 * 无政府主义者和革命者。CNT 掌司法部时，可以把这件事往两个方向推：温和的清洗，或者
 * 把整张法官席换掉。
 *
 * 两个实现要点：
 *
 * 1. **进度字段而不是法律等级。** `judiciary_reform_progress` 是 0—100 的流水进度，
 *    与 `land_reform_progress`、`regional_autonomy_progress` 同类；法律等级（0—4 级）
 *    走 `rules/lawChange.ts`。本卡两个选项各推进 1／2 点，因此温和路线约需九次、
 *    激进路线约需五次才能走完。
 *
 * 2. **「共和政党团结度下降」写的是成员承诺度，不是 cohesion。** `updateCoalitions()`
 *    每次 reducer 之后都会按 `memberContributions` 重算 `cohesion`，直接写 cohesion
 *    会被抹掉；因此激进路线通过 `applyCoalitionCommitmentDelta` 下调各成员承诺度——
 *    这正是「共和派因为无法接受这次清洗而抱团反对」的机械表达。
 */
const CLAMP = (value: number) => Math.max(0, Math.min(100, value));

/** 当前进度，供选项副标题与效果预览读取（旧存档缺字段时按 0 处理）。 */
const progressOf = (state: GameState): number =>
  state.domesticPolicy.judiciary_reform_progress || 0;

const progressLine = (state: GameState, isZh: boolean): string => (
  isZh
    ? `当前司法改革进度 ${progressOf(state)}%。`
    : `Judiciary reform progress: ${progressOf(state)}%.`
);

export const judiciaryReform: Card = {
  id: 'judiciary_reform',
  title: 'Judiciary Reform',
  titleZh: '司法改革',
  type: 'Government',
  description: 'The judiciary, like the army, the Church and the landlords, is one of the most reactionary parts of the old state. Many of its judges have held office since the monarchy. They hand absurdly light sentences to violent fascists and rebels, and persecute workers, anarchists and revolutionaries without mercy.',
  descriptionZh: '司法系统与军队、教会和地主一样，是旧国家最反动的组成部分之一。许多法官自君主制时代起就一直任职。他们对暴力法西斯分子和叛乱者判处轻得可笑，却无情迫害工人、无政府主义者和革命者。',
  cost: 1,
  condition: (state: GameState) => (
    state.cntStance === 'govern'
    && state.ministers.justice === 'CNT'
    && (state.judiciary_timer || 0) <= 0
  ),
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: {
      id: 'judiciary_reform_event',
      title: 'Judiciary Reform',
      titleZh: '司法改革',
      description: 'The minister has the magistrates\' files on the table: the men who signed the sentences of 1934, the men who have never signed one against a Falangist. Two lists can be drawn from them — a short one, and the whole bench.',
      descriptionZh: '部长桌上摊着法官们的档案：1934 年签下判决的那些人，以及从未对长枪党人签过一次判决的那些人。可以从里面挑出两份名单——一份很短，一份是整张法官席。',
      // 进度是 0—100 的流水值，弹出事件时把它直接摆在选项上方，玩家不必靠记忆。
      renderContent: (state) => {
        const isZh = state.language === 'zh';
        const progress = progressOf(state);
        return React.createElement('div', { className: 'font-typewriter text-xs border border-ink/20 p-3 mb-2' },
          React.createElement('div', { className: 'flex justify-between mb-1' },
            React.createElement('span', { className: 'font-bold' },
              isZh ? '司法改革进度' : 'Judiciary reform progress'),
            React.createElement('span', { className: 'font-mono' }, `${progress}%`),
          ),
          React.createElement('div', { className: 'h-3 w-full border border-ink bg-paper-dark overflow-hidden' },
            React.createElement('div', {
              className: 'h-full bg-ink transition-all',
              style: { width: `${Math.max(0, Math.min(100, progress))}%` },
            }),
          ),
        );
      },
      date: { year: state.year, month: state.month },
      options: [
        {
          text: 'Carry out a moderate judicial reform.',
          textZh: '进行温和的司法改革',
          subtitle: 'Retire the oldest and most compromised magistrates and promote Republicans into the vacancies. Reform progress +1. A short list satisfies everyone inside the movement, because it lets each tendency believe the next name would have been its own enemy.',
          subtitleZh: '让年资最深、包袱最重的法官退职，把共和派补进空缺。改革进度 +1。一份短名单能让运动内部各方都满意，因为每个派系都可以相信：下一个名字本来会是自己的敌人。',
          effect: (s: GameState): Partial<GameState> => {
            // 温和路线降低所有派系的异议：名单足够短，谁都能在里面看到自己的对手。
            const factions = adjustFactionDissents(s.factions, {
              Faistas: -4,
              Puristas: -3,
              Cenetistas: -5,
              Treintistas: -6,
            });
            let classes = adjustClassSupport(s.classes, 'Intelectuales', 'CNT_FAI', 2);
            classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 1);

            return {
              judiciary_timer: 6,
              factions,
              classes,
              domesticPolicy: {
                ...s.domesticPolicy,
                judiciary_reform_progress: CLAMP(progressOf(s) + 1),
              },
              stats: {
                ...s.stats,
                republicanAuthority: Math.min(100, s.stats.republicanAuthority + 4),
              },
              coupProgress: Math.max(0, (s.coupProgress || 0) - 2),
            };
          },
        },
        {
          text: 'Carry out a radical judicial reform.',
          textZh: '进行激进的司法改革',
          subtitle: 'Replace the bench wholesale with men who have defended workers, and put the old magistrates on trial for their sentences. Reform progress +2, but the republican parties close ranks against us — the socialists least of all, the republican left and the centre most.',
          subtitleZh: '把整张法官席换成替工人辩护过的人，并把旧法官送上法庭为他们的判决负责。改革进度 +2，但共和各党会因此抱团反对我们——社会党反应最轻，共和左翼与共和联盟反应最重。',
          effect: (s: GameState): Partial<GameState> => {
            let factions = adjustFactionDissents(s.factions, { Faistas: -8, Puristas: -6, Cenetistas: -4, Treintistas: 8 });
            factions = adjustFactionInfluence(factions, 'Faistas', 6);
            factions = adjustFactionInfluence(factions, 'Cenetistas', 4);
            let classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', 4);
            classes = adjustClassSupport(classes, 'Braceros', 'CNT_FAI', 3);
            classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 3);
            classes = adjustClassSupport(classes, 'Burguesia', 'CNT_FAI', -3);

            return {
              judiciary_timer: 6,
              factions,
              classes,
              // 「共和政党团结度下降」——按党派分别下调承诺度：社会党只降 2，共和左翼与
              // 共和联盟降 6／8，PNV 降 8。由 updateCoalitions 在下一步重算成更低的凝聚力。
              activeCoalitions: applyCoalitionCommitmentDelta(s, {
                PSOE: -2,
                PCE: -6,
                IR: -6,
                UR: -8,
                PNV: -8,
              }),
              domesticPolicy: {
                ...s.domesticPolicy,
                judiciary_reform_progress: CLAMP(progressOf(s) + 2),
              },
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.min(100, s.stats.revolutionaryFervor + 3),
                republicanAuthority: Math.max(0, s.stats.republicanAuthority - 6),
              },
              coupProgress: (s.coupProgress || 0) + 3,
            };
          },
        },
        {
          text: 'Leave the courts as they are.',
          textZh: '保持现状',
          subtitle: 'No list is drawn up. The magistrates keep their posts, their sentences and their pensions, and the minister goes back to signing releases for the men they convicted.',
          subtitleZh: '不拟任何名单。法官们保住职位、判决与养老金，而部长继续回去替他们定罪的人签署释放令。',
          effect: (s: GameState): Partial<GameState> => {
            let factions = adjustFactionDissents(s.factions, { Cenetistas: 3, Treintistas: -2 });
            factions = adjustFactionInfluence(factions, 'Puristas', 4);
            let classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', -2);
            classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', -1);

            return {
              judiciary_timer: 6,
              factions,
              classes,
              stats: {
                ...s.stats,
                revolutionaryFervor: Math.max(0, s.stats.revolutionaryFervor - 2),
                bureaucratization: Math.min(100, s.stats.bureaucratization + 2),
              },
              coupProgress: (s.coupProgress || 0) + 2,
            };
          },
        },
      ],
    },
  }),
};

/** 当前进度文案，供选项副标题或调试界面复用。 */
export const getJudiciaryProgressLine = (state: GameState, isZh: boolean): string =>
  progressLine(state, isZh);
