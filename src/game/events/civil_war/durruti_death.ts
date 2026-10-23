import type { GameEvent, GameState } from '../../types';
import { getPartySupport } from '../../parties';
import { getOverallFactionDissent } from '../../utils/factionEffects';
import { isAtOrAfter } from '../../utils/eventTrigger';
import { isSpanishCivilWarOngoing } from '../../rules/wartimeCoalition';
import { MapFaction } from '../../../map/types_map';
import { PROVINCE_ADJACENCY } from '../../../map/map_constants';

const DURRUTI_ID = 'Buenaventura Durruti';

const nationalistAtMadridApproach = (state: GameState): boolean =>
  (PROVINCE_ADJACENCY.madrid ?? []).some(
    provinceId => state.provinces?.[provinceId]?.owner === MapFaction.NATIONALIST,
  );

export const durrutiDeath: GameEvent = {
  id: 'durruti_death',
  meta: { category: 'war', flow: 'solo', series: ['civil_war'], tags: ['military'] },
  date: { year: 1936, month: 11 },
  condition: (state) => {
    if (!state.durrutiAlive) return false;
    // Historical mode follows the November 1936 death even on a divergent map.
    if (state.difficulty === 'historical') return true;
    return isAtOrAfter(state, 1936, 12)
      && isSpanishCivilWarOngoing(state)
      && (
        getOverallFactionDissent(state.factions) > 60
        || getPartySupport(state, 'PCE') > 60
        || nationalistAtMadridApproach(state)
      );
  },
  title: 'The Death of Buenaventura Durruti',
  titleZh: '布埃纳文图拉·杜鲁蒂之死',
  description: 'News of Buenaventura Durruti\'s death reaches the confederation. The commander of the Durruti Column had been one of the most recognizable voices of the revolution. The circumstances of his final hours remain contested, but his absence from the movement is certain.',
  descriptionZh: '布埃纳文图拉·杜鲁蒂的死讯传到联合会。作为杜鲁蒂纵队的指挥者，他曾是革命最鲜明的声音之一。关于他最后时刻的说法仍有争议，但这场运动已经失去了他。',
  image: 'img/Advisors/Jose_Buenaventura_Durruti_Dumange.png',
  options: [{
    text: 'Mourn Durruti and carry on his struggle',
    textZh: '悼念杜鲁蒂，继续他的斗争',
    subtitle: 'Durruti dies and can no longer serve as an advisor.',
    subtitleZh: '杜鲁蒂逝世，无法再担任顾问。',
    effect: (state) => {
      if (!durrutiDeath.condition?.(state)) return {};
      return {
        durrutiAlive: false,
        activeAdvisors: state.activeAdvisors.map(advisor => advisor?.id === DURRUTI_ID ? null : advisor),
        advisorPool: state.advisorPool.filter(advisor => advisor.id !== DURRUTI_ID),
      };
    },
  }],
};
