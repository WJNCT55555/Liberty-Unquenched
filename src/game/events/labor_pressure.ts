import type { GameEvent, GameState } from '../types';
import { textPreview } from '../effectPreview';
import {
  addLaborPressure,
  getLaborPressureCampaign,
  getLaborPressureThreshold,
  LABOR_PRESSURE_LABELS,
  LABOR_PRESSURE_LAWS,
  type LaborPressureLawId,
} from '../rules/laborPressure';
import { LAW_LEVEL_LIMITS } from '../lawStances';

type PressureSource = 'strike' | 'assembly';

export const createLaborPressureChoiceEvent = (source: PressureSource, state: GameState): GameEvent => {
  const gain = source === 'strike' ? 2 : 1;
  return {
    id: source === 'strike' ? 'strike_labor_pressure_choice' : 'assembly_labor_pressure_choice',
    meta: { category: 'cnt', flow: 'inline.leaf', series: ['labor_pressure'], tags: ['law'] },
    date: { year: state.year, month: state.month },
    title: 'Choose a Labor Demand',
    titleZh: '选择劳工诉求',
    description: 'The unions must put one precise demand before the government. Changing the demand abandons pressure built for another law.',
    descriptionZh: '工会必须向政府提出一项明确诉求。改换诉求会放弃此前为另一项法律积累的压力。',
    options: LABOR_PRESSURE_LAWS.map(lawId => ({
      text: `Demand stronger ${LABOR_PRESSURE_LABELS[lawId].en.toLowerCase()} protections`,
      textZh: `争取更强的${LABOR_PRESSURE_LABELS[lawId].zh}保障`,
      subtitle: `Pressure +${gain}; current law rises only after the government responds next month.`,
      subtitleZh: `施压 +${gain}；只有下月政府回应后，法律才会提高一级。`,
      condition: (s: GameState) => s.domesticPolicy[lawId] < LAW_LEVEL_LIMITS[lawId],
      unavailableSubtitle: () => 'This law is already at its maximum level.',
      unavailableSubtitleZh: () => '这项法律已达到最高等级。',
      effectPreview: (s: GameState) => {
        const active = getLaborPressureCampaign(s);
        const target = s.domesticPolicy[lawId] + 1;
        const current = active?.lawId === lawId ? active.points : 0;
        const threshold = getLaborPressureThreshold(s, lawId, target);
        return [
          textPreview(
            `Pressure: ${current} → ${Math.min(8, current + gain)} / ${threshold}.`,
            `施压：${current} → ${Math.min(8, current + gain)} / ${threshold}。`,
          ),
          ...(active && active.lawId !== lawId
            ? [textPreview('Previous demand loses its accumulated pressure.', '旧诉求已积累的压力将清零。', 'negative')]
            : []),
        ];
      },
      effect: (s: GameState) => ({ ...addLaborPressure(s, lawId, gain), currentEvent: null }),
    })),
  };
};

const resultEvent = (lawId: LaborPressureLawId): GameEvent => ({
  id: `labor_pressure_${lawId}_enacted`,
  meta: { category: 'politics', flow: 'solo', series: ['labor_pressure'], tags: ['law', 'external'] },
  condition: () => false,
  title: 'The Government Concedes',
  titleZh: '政府作出让步',
  description: `Sustained assemblies and strikes have made inaction politically costly. The Republic has strengthened ${LABOR_PRESSURE_LABELS[lawId].en.toLowerCase()} protections by one legal level. The CNT did not need a ministry or a seat in the Cortes to force this concession.`,
  descriptionZh: `持续的集会和罢工使拖延付出政治代价。共和国将${LABOR_PRESSURE_LABELS[lawId].zh}保障提高了一个法律等级。CNT 无需拥有部长职位或议席，也迫使国家作出了让步。`,
  options: [{
    text: 'Continue the struggle',
    textZh: '继续斗争',
    subtitle: 'The new law is already in force; this event only reports the result.',
    subtitleZh: '新法律已经生效；此事件只报告结果。',
    effect: () => ({ currentEvent: null }),
  }],
});

export const LABOR_PRESSURE_RESULT_EVENTS: Record<LaborPressureLawId, GameEvent> = {
  max_hours_law: resultEvent('max_hours_law'),
  min_wage: resultEvent('min_wage'),
  workplace_safety: resultEvent('workplace_safety'),
};
