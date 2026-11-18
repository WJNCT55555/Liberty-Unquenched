import { Advisor } from '../types';
import { isAlianzaObreraJournalActive } from '../journal/alianza_obrera';
import {
  COALITION_FRICTION_COMMITMENT,
  getRulingCoalitionMembers,
  raiseRulingCoalitionContribution,
} from '../utils';
import { publicInstruction } from '../government_affairs/public_instruction';

export const segundoBlanco: Advisor = {
  id: 'Segundo Blanco',
  name: 'Segundo Blanco',
  nameZh: '塞贡多·布兰科',
  faction: 'Cenetistas',
  description: 'An influential Asturian teacher and militant of the CNT who later served as General Secretary and Minister of Public Education and Health during the Civil War. He was a champion of unity with the UGT under the "UHP" banner.',
  descriptionZh: '有威望的阿斯图里亚斯教师、无政府主义活动家。曾任CNT全国总书记，并在内阁中出任公共教育与卫生部长，是“无产阶级兄弟联盟（UHP）”和工会团结协作路线的坚定拥护者。',
  image: 'img/Advisors/Segundo_Blanco.png',
  actions: [
    {
      id: 'blanco_promote_workers_alliance',
      title: 'Promote Workers Alliance',
      titleZh: '推动工人联盟',
      subtitle: 'Only a united working class can crush the reactionary plots.',
      subtitleZh: '只有团结一致的工人阶级，才能粉碎反动派的阴谋。',
      unavailableSubtitle: (state) => isAlianzaObreraJournalActive(state)
        ? `${state.advisorActionTimer} months before next advisor action.`
        : 'Requires the Alianza Obrera journal to be open (complete UHP, then choose the proletarian uprising at the crossroads).',
      unavailableSubtitleZh: (state) => isAlianzaObreraJournalActive(state)
        ? `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`
        : '需要先开启「工人联盟」日志（完成 UHP 日志，并在十字路口选择「无产阶级起义」）。',
      condition: (state) => state.advisorActionTimer <= 0 && isAlianzaObreraJournalActive(state),
      effect: (state) => ({
        advisorActionTimer: 6,
        workersAllianceProgress: (state.workersAllianceProgress || 0) + 1
      }),
      description: 'By working closely with local union committees, we foster a shared class consciousness across syndicalist and socialist ranks, paving the way for a unified proletarian alliance.',
      descriptionZh: '通过同基层工会委员会紧密协作，我们在工团与社会主义队伍中培养了共同的阶级觉悟，为实现钢铁般坚固的无产阶级联盟扫清了障碍。',
    },
    {
      id: 'blanco_coalition_friction',
      title: 'Reduce Coalition Friction',
      titleZh: '降低联盟分歧',
      subtitle: 'Mediate inside the ruling coalition to raise the CNT-FAI\'s commitment, and with it the coalition\'s cohesion.',
      subtitleZh: '在执政联盟内部斡旋，提高 CNT-FAI 的承诺度，从而抬升联盟凝聚力。',
      unavailableSubtitle: (state) => {
        if (state.cntStance !== 'cooperate') {
          return 'Requires the CNT-FAI to be cooperating with the government.';
        }
        if (!getRulingCoalitionMembers(state).includes('CNT_FAI')) {
          return 'Requires the CNT-FAI to sit in the ruling coalition.';
        }
        if (!getRulingCoalitionMembers(state).includes('PSOE')) {
          return 'Requires the PSOE in the same ruling coalition.';
        }
        return `${state.advisorActionTimer} months before next advisor action.`;
      },
      unavailableSubtitleZh: (state) => {
        if (state.cntStance !== 'cooperate') {
          return '需要 CNT-FAI 对政府采取合作态度。';
        }
        if (!getRulingCoalitionMembers(state).includes('CNT_FAI')) {
          return '需要 CNT-FAI 身处执政联盟。';
        }
        if (!getRulingCoalitionMembers(state).includes('PSOE')) {
          return '需要社会党在同一执政联盟内。';
        }
        return `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`;
      },
      condition: (state) => state.advisorActionTimer <= 0
        && state.cntStance === 'cooperate'
        && getRulingCoalitionMembers(state).includes('CNT_FAI')
        && getRulingCoalitionMembers(state).includes('PSOE'),
      effect: (state) => ({
        advisorActionTimer: 6,
        // Commitment is the source of truth; cohesion is recomputed from it.
        activeCoalitions: raiseRulingCoalitionContribution(state, 'CNT_FAI', COALITION_FRICTION_COMMITMENT)
      }),
      description: 'Blanco has spent the month shuttling between the ministry and the PSOE\'s offices; the pact holds because he keeps answering the telephone.',
      descriptionZh: '布兰科这个月往返于部里与社会党办公室之间；协议还在，是因为电话总有人接。',
    },
    {
      id: 'blanco_education_policy',
      title: 'Education Policy',
      titleZh: '教育政策',
      subtitle: 'Open the Public Instruction government card\'s decisions directly, without drawing it.',
      subtitleZh: '直接进入「公共教育」政府卡的选择，无需抽到该卡。',
      unavailableSubtitle: (state) => {
        if (state.cntStance !== 'govern') {
          return 'Requires the CNT-FAI to be in government.';
        }
        if (state.ministers.education !== 'CNT') {
          return 'Requires the CNT to hold the Ministry of Public Instruction.';
        }
        if ((state.education_policy_timer || 0) > 0) {
          return 'The Public Instruction card is still on cooldown.';
        }
        return `${state.advisorActionTimer} months before next advisor action.`;
      },
      unavailableSubtitleZh: (state) => {
        if (state.cntStance !== 'govern') {
          return '需要 CNT-FAI 参与政府。';
        }
        if (state.ministers.education !== 'CNT') {
          return '需要 CNT 掌管公共教育部。';
        }
        if ((state.education_policy_timer || 0) > 0) {
          return '公共教育卡仍在冷却中。';
        }
        return `距离下一次顾问行动还有 ${state.advisorActionTimer} 个月。`;
      },
      condition: (state) => state.advisorActionTimer <= 0
        && state.cntStance === 'govern'
        && state.ministers.education === 'CNT'
        && (state.education_policy_timer || 0) <= 0,
      effect: (state) => {
        const result = publicInstruction.effect(state);

        return {
          advisorActionTimer: 6,
          currentEvent: result.currentEvent
        };
      },
      description: 'A teacher by trade, Blanco walks into the ministry with a list: the schools the Republic has promised, and the ones it has quietly defunded.',
      descriptionZh: '教师出身的布兰科拿着一份清单走进部里：共和国答应办的学校，和它悄悄停拨经费的学校。',
    }
  ]
};
