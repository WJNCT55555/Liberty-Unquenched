import type { GameEvent } from '../types';

const uhpAsturiasMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  series: ['asturias', 'uhp'],
  tags: ['journal'],
};

export const workersAllianceAttempt: GameEvent = {
  id: 'workers_alliance_attempt',
  meta: uhpAsturiasMeta,
  title: 'An Attempt at Workers\' Alliance?',
  titleZh: '工人联盟的尝试？',
  description: 'With the CNT in opposition and the Republican-Socialist Coalition dissolved or non-existent, the working class stands at a crucial crossroads. Prominent theoreticians argue that only a coordinated revolutionary alliance can secure the future of the proletariat. Shall we begin the attempt to unify our revolutionary forces with the socialist left under the banner of "Uníos Hermanos Proletarios"?',
  descriptionZh: '随着全国劳工联盟（CNT）处于反对派地位，且共和-社会党联合不复存在，工人阶级站在了一个关键的十字路口。杰出的理论家们主张，只有进行协调一致的革命联盟才能捍卫无产阶级的未来。我们是否应当在“联合无产阶级兄弟”（UHP）的旗帜下，开始尝试将我们的革命力量与社会主义左翼联合起来？',
  condition: (state) => {
    const isAfterNovember1933 = state.year > 1933 || (state.year === 1933 && state.month >= 11);
    const cntStanceOppose = state.cntStance === 'oppose';
    const republicanSocialistNotExists = state.rulingCoalition !== 'republican_socialist';
    
    return !state.uhp_attempt_triggered && isAfterNovember1933 && cntStanceOppose && republicanSocialistNotExists;
  },
  options: [
    {
      text: 'Initiate the attempt for workers\' unity. Uníos Hermanos Proletarios!',
      textZh: '启动工人团结的尝试。联合无产阶级兄弟！',
      effect: (state) => ({
        uhp_attempt_triggered: true,
        uhp_journal_activated: true
      })
    }
  ]
};
