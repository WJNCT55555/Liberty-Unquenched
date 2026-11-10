import type { GameEvent, GameState } from '../types';
import { MINISTER_MINIMUM_COST } from '../rules/ministerAllocation';
import { buildCouncilGovernment } from '../rules/councilRepublic';
import { clearRulingCoalitionForRegime } from '../utils/coalition';
import { ministerAllocation } from './elections_1931_results';

const councilMeta = {
  category: 'politics' as const,
  flow: 'inline.root' as const,
  series: ['polity', 'council_republic'],
  tags: ['polity', 'council_republic'],
};

const hasCompletedCouncilSettlement = (state: GameState): boolean => {
  const latest = state.postwarSettlement ?? state.asturiasVictory;
  return Boolean(latest?.regime === 'council_republic' && latest.completedAt);
};

/**
 * Converts a completed Asturias/Postwar settlement into the playable Council
 * Republic. It is queued by condition after the settlement chain writes
 * `completedAt`; no settlement option needs to know about the new polity.
 */
export const councilRepublicTransition: GameEvent = {
  id: 'council_republic_transition',
  meta: councilMeta,
  condition: (state) => hasCompletedCouncilSettlement(state)
    && state.polity?.type !== 'council_republic',
  title: 'The Constituent Congress of Councils Convenes',
  titleZh: '工农兵代表会议制宪大会召开',
  description: 'The old Cortes is gone. Delegates from factory committees, peasant assemblies and soldiers’ councils fill the hall. The Congress of Councils must now elect a Central Executive Committee, name its chairman, and form the Council of People’s Commissars. The revolution has won the war; it must now learn to govern without recreating the old state.',
  descriptionZh: '旧议会已经不复存在。工厂委员会、农民大会与士兵委员会的代表挤满了大厅。工农兵代表会议必须选举中央执行委员会、选出主席，并组成人民委员会议。革命已经赢得了战争，现在必须学会在没有旧国家的情况下治理国家。',
  options: [
    {
      text: 'Convene the Congress. The councils are sovereign.',
      textZh: '召开代表会议。主权归于委员会。',
      subtitle: 'Elect the CEC, form the Council of People’s Commissars, and open the commissariat allocation.',
      subtitleZh: '选举中央执行委员会，组成人民委员会议，并开始人民委员分配。',
      effect: (state) => {
        const next = buildCouncilGovernment(state);
        const leverage = next.leverage ?? 0;
        const cleared = clearRulingCoalitionForRegime({ ...state, ...next });
        return {
          ...cleared,
          currentEvent: leverage >= MINISTER_MINIMUM_COST ? ministerAllocation : null,
        };
      },
    },
  ],
};

export const COUNCIL_REPUBLIC_EVENTS: GameEvent[] = [councilRepublicTransition];
