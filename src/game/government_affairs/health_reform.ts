import React from 'react';
import { Card, GameState } from '../types';
import { adjustClassSupport, adjustFactionDissents, adjustFactionInfluence } from '../utils';
import { changeLaws } from '../rules/lawChange';

/**
 * 公共卫生改革（卫生部）。
 *
 * 这是最后一张补上的"有部长、没有牌"的政府卡（评审 §10.1）。两条路线：
 *
 *  1. **堕胎合法化**——女性权利法 L3「女性堕胎权」的既有等级表里已经写着"受监管医疗
 *     服务保障生育选择权"，因此这条路线不是自创新的法律，而是把既有的 L3 接上卫生
 *     部的权限：需在女性权利已达 L2「离婚合法化」之后才可推动，每次推进一级。
 *  2. **保持现状**——部里继续做检查、统计与通函，共和国继续用它本来就有的医疗。
 *
 * 进度字段 `health_reform_progress`（0—100）与司法、土改、区域自治同属流水进度，
 * **不是法律等级**；法律等级走 `rules/lawChange.ts`。
 */
const CLAMP = (value: number) => Math.max(0, Math.min(100, value));

/** 当前进度，旧存档缺字段时按 0 处理。 */
const progressOf = (state: GameState): number =>
  state.domesticPolicy.health_reform_progress || 0;

export const healthReform: Card = {
  id: 'health_reform',
  title: 'Public Health',
  titleZh: '公共卫生',
  type: 'Government',
  description: 'Spain enters this decade with more priests than doctors and more churches than hospitals. The health ministry can spend its authority on the one reform that changes the law, or it can spend the year on inspections and statistics and leave the law alone.',
  descriptionZh: '西班牙带着比医生更多的神父、比医院更多的教堂走进这个十年。卫生部可以把它的权力花在那唯一一项会改动法律的改革上，也可以把这一年花在检查与统计上，让那部法律原样不动。',
  cost: 1,
  condition: (state: GameState) => (
    state.cntStance === 'govern'
    && state.ministers.health === 'CNT'
    && (state.health_timer || 0) <= 0
  ),
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: {
      id: 'health_reform_event',
      title: 'Public Health',
      titleZh: '公共卫生',
      description: 'The minister has one budget and one waiting room that matters this month: the committee of women who have been asking for a year what the Republic intends to do about the law that governs their bodies. The blood banks and the village clinics will keep until the ministry has decided whether it is willing to spend its authority here at all.',
      descriptionZh: '这个月部长只有一份预算、一间真正要紧的候诊室：一年来一直在问共和国打算怎么处理那部规范她们身体的法律的妇女委员会。血库与乡村诊所可以再等，先要看部里究竟愿不愿意把权力花在这件事上。',
      // 进度是 0—100 的流水值，直接摆在选项上方，与司法改革卡同一写法。
      renderContent: (state) => {
        const isZh = state.language === 'zh';
        const progress = progressOf(state);
        return React.createElement('div', { className: 'font-typewriter text-xs border border-ink/20 p-3 mb-2' },
          React.createElement('div', { className: 'flex justify-between mb-1' },
            React.createElement('span', { className: 'font-bold' },
              isZh ? '公共卫生改革进度' : 'Public health reform progress'),
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
          text: 'Legalize abortion under regulated medical care.',
          textZh: '推动堕胎合法化',
          subtitle: 'The ministry drafts the regulation, the women’s committees staff the clinics, and the Republic puts its name to the one reform the Church will never forgive. Women’s Rights +1; the clergy and the conservative press are irreconcilable.',
          subtitleZh: '部里起草条例，妇女委员会配备诊所人手，共和国则把自己的名字签在教会永远不会原谅的那一项改革上。女性权利 +1；神职人员与保守派报刊从此不可挽回。',
          condition: (s: GameState) => s.domesticPolicy.womens_rights === 2,
          unavailableSubtitle: (s: GameState) => (s.domesticPolicy.womens_rights < 2
            ? 'Requires Women\'s Rights at level 2 (divorce legalized).'
            : 'Women\'s Rights are already past this level.'),
          unavailableSubtitleZh: (s: GameState) => (s.domesticPolicy.womens_rights < 2
            ? '需要女性权利达到 2 级（离婚合法化）。'
            : '女性权利已经超过这一级。'),
          effect: (s: GameState): Partial<GameState> => {
            let factions = adjustFactionDissents(s.factions, { Puristas: -6, Faistas: -4, Cenetistas: -3, Treintistas: 6 });
            factions = adjustFactionInfluence(factions, 'Puristas', 5);
            let classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', 3);
            classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', 3);
            classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', 2);
            classes = adjustClassSupport(classes, 'Clero', 'CNT_FAI', -5);
            classes = adjustClassSupport(classes, 'Burguesia', 'CNT_FAI', -2);

            return {
              health_timer: 8,
              factions,
              classes,
              domesticPolicy: {
                ...s.domesticPolicy,
                // 走上既有的女性权利等级表：L2「离婚合法化」→ L3「女性堕胎权」。
                ...changeLaws(s, { womens_rights: 'up' }),
                health_reform_progress: CLAMP(progressOf(s) + 3),
              },
              stats: {
                ...s.stats,
                republicanAuthority: Math.max(0, s.stats.republicanAuthority - 3),
              },
              coupProgress: (s.coupProgress || 0) + 2,
            };
          },
        },
        {
          text: 'Leave public health as it is.',
          textZh: '保持现状',
          subtitle: 'The ministry keeps its inspections, its statistics and its circulars, and the Republic keeps the medicine it already had: more priests than doctors, more churches than hospitals. The women’s committee is told to come back next year.',
          subtitleZh: '部里继续做它的检查、统计与通函，共和国继续用它本来就有的医疗：神父比医生多，教堂比医院多。妇女委员会被告知明年再来。',
          effect: (s: GameState): Partial<GameState> => {
            let factions = adjustFactionDissents(s.factions, { Cenetistas: 3, Treintistas: -2 });
            factions = adjustFactionInfluence(factions, 'Puristas', 4);
            let classes = adjustClassSupport(s.classes, 'Obreros', 'CNT_FAI', -2);
            classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', -1);

            return {
              health_timer: 6,
              factions,
              classes,
              domesticPolicy: {
                ...s.domesticPolicy,
                // 明确写回当前进度（而不是靠"不写这个键"）：旧存档没有这个字段时，
                // 这一步顺带把它补成 0，避免进度条永远读到 undefined。
                health_reform_progress: progressOf(s),
              },
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

/** 当前进度文案，供调试界面或后续事件复用。 */
export const getHealthProgressLine = (state: GameState, isZh: boolean): string => (
  isZh
    ? `当前公共卫生改革进度 ${progressOf(state)}%。`
    : `Public health reform progress: ${progressOf(state)}%.`
);
