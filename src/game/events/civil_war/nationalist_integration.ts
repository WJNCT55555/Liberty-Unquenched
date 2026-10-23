import type { GameEvent, GameState, OrganizationId } from '../../types';
import { isSpanishCivilWarOngoing, monthIndex } from '../../rules/wartimeCoalition';
import { carlistsArmed, francoJoinedNationalists, nationalistChainDue, settleNationalistIntegration } from '../../rules/nationalistIntegration';
import { MapFaction } from '../../../map/types_map';

const meta = { category: 'war' as const, flow: 'solo' as const,
  series: ['civil_war', 'nationalist_integration'], tags: ['politics', 'map'] };
const resolved = (state: GameState, id: string) => state.eventHistory?.resolved.includes(id) ?? false;
const date = (state: GameState) => ({ year: state.year, month: state.month });
const establish = (state: GameState, id: OrganizationId): GameState['organizations'] => ({
  ...state.organizations, [id]: { established: true, establishedAt: date(state), status: 'active' },
});
const fetDue = (state: GameState, months: number) => nationalistChainDue(state, months)
  && state.nationalistIntegration?.stage === 'fet' && resolved(state, 'nationalist_unification_or_schism');

export const nationalistProvisionalCommand: GameEvent = {
  id: 'nationalist_provisional_command', meta,
  condition: state => nationalistChainDue(state, 0) && !resolved(state, 'nationalist_provisional_command'),
  title: 'A Provisional Rebel Command', titleZh: '叛军临时军事联合会议',
  description: 'The rebel generals establish a provisional command to coordinate their fronts. Falangists, Carlists and army officers still answer to different authorities. Cooperation is not political unification.',
  descriptionZh: '叛军将领建立临时指挥机构以协调各条战线。长枪党、卡洛斯派和军官仍服从不同权威；军事合作并不等于政治统一。',
  options: [{ text: 'Record the provisional command.', textZh: '记录临时指挥结构。',
    effect: state => nationalistProvisionalCommand.condition?.(state)
      ? { nationalistIntegration: { stage: 'provisional' } } : {} }],
};

export const nationalistFrancoAlignment: GameEvent = {
  id: 'nationalist_franco_alignment', meta,
  condition: state => nationalistChainDue(state, 2) && resolved(state, 'nationalist_provisional_command')
    && !resolved(state, 'nationalist_franco_alignment'),
  title: 'Franco and the Rebel Command', titleZh: '佛朗哥与叛军指挥权',
  description: 'The provisional junta reviews Franco’s actual allegiance. Sanjurjo and Mola may command their own forces, but neither can substitute for Franco in a national political unification. His status will be checked again before any decree.',
  descriptionZh: '临时军政机构核对佛朗哥的实际归属。桑胡尔霍和莫拉可以指挥各自部队，但都不能代替佛朗哥完成全国政治统一；颁令前仍须再次核对其状态。',
  options: [{ text: 'Confirm his current allegiance.', textZh: '确认他此时的归属。',
    effect: state => nationalistFrancoAlignment.condition?.(state) ? { nationalistIntegration: {
      stage: 'alignment_reported', francoAtReport: francoJoinedNationalists(state) } } : {} }],
};

export const nationalistCarlistAutonomy: GameEvent = {
  id: 'nationalist_carlist_autonomy', meta,
  condition: state => nationalistChainDue(state, 6) && resolved(state, 'nationalist_franco_alignment')
    && carlistsArmed(state) && !resolved(state, 'nationalist_carlist_autonomy'),
  title: 'The Requetés Demand Their Own Command', titleZh: '呼啸兵要求保留指挥权',
  description: 'The Carlist militia insists on retaining its officers, symbols and political voice. Its demands sharpen the divide between the Traditionalist Communion and the Falange.',
  descriptionZh: '卡洛斯派民兵要求保留军官、标志和政治发言权。传统主义共同体与长枪党之间的分歧更加尖锐。',
  options: [{ text: 'Record the Carlist demands.', textZh: '记下卡洛斯派的要求。',
    effect: state => nationalistCarlistAutonomy.condition?.(state)
      ? { mapHistory: [state.language === 'zh' ? '呼啸兵要求保留独立指挥。' : 'The Requetés demand their own command.', ...state.mapHistory] } : {} }],
};

export const nationalistUnificationOrSchism: GameEvent = {
  id: 'nationalist_unification_or_schism', meta,
  condition: state => nationalistChainDue(state, 9) && resolved(state, 'nationalist_franco_alignment')
    && (!carlistsArmed(state) || resolved(state, 'nationalist_carlist_autonomy'))
    && !resolved(state, 'nationalist_unification_or_schism'),
  title: 'The Unification Decree — or a Schism', titleZh: '统一令，或国民军的决裂',
  description: 'The rebel leadership settles its command question. If Franco still leads and both the Falange and Traditionalist Communion survive, a single FET movement is decreed. Without him, the command remains divided; an armed Carlist movement holding Navarre may break away altogether.',
  descriptionZh: '叛军领导层必须解决指挥权问题。若佛朗哥仍在且长枪党与传统主义共同体均存续，就颁布统一令、成立 FET；没有佛朗哥，指挥权继续分裂。若卡洛斯派仍有武装并控制纳瓦拉，还可能彻底脱离。',
  options: [{ text: 'Archive the decree and its consequences.', textZh: '归档决定及其后果。',
    effect: state => nationalistUnificationOrSchism.condition?.(state) ? settleNationalistIntegration(state) : {} }],
};

export const carlistSecessionAftermath: GameEvent = {
  id: 'carlist_secession_aftermath', meta,
  condition: state => isSpanishCivilWarOngoing(state) && !state.isGameOver
    && state.nationalistIntegration?.stage === 'carlist_secession'
    && Boolean(state.nationalistIntegration.splitAt)
    && monthIndex(state) > monthIndex(state.nationalistIntegration.splitAt!)
    && !resolved(state, 'carlist_secession_aftermath'),
  title: 'The Navarre Front After the Split', titleZh: '分离后的纳瓦拉战线',
  description: 'The Carlists now maintain their own front and recruiting pool. Their former Nationalist allies remain a separate army; the battlefield, not the announcement, will determine which camps survive.',
  descriptionZh: '卡洛斯派已有自己的战线和征兵池，昔日国民军盟友也仍保有独立部队。各阵营能否存续，将由战场而非一纸公告决定。',
  renderContent: state => {
    const provinces = Object.values(state.provinces).filter(province => province.owner === MapFaction.CARLIST);
    const troops = state.armies.filter(army => army.faction === MapFaction.CARLIST).reduce((sum, army) => sum + army.manpower, 0);
    const reserve = state.armedForces.entityPools.requetes.manpower;
    return state.language === 'zh'
      ? `卡洛斯派控制省份：${provinces.map(province => province.name).join('、') || '无'}；现役呼啸兵：${troops}；未部署兵源：${reserve}。`
      : `Carlist provinces: ${provinces.map(province => province.name).join(', ') || 'none'}; field troops: ${troops}; unraised Requetés reserve: ${reserve}.`;
  },
  options: [{ text: 'Update the front and manpower record.', textZh: '更新战线与兵源记录。',
    effect: state => carlistSecessionAftermath.condition?.(state) ? { mapHistory: [state.language === 'zh' ? '纳瓦拉战线记录已更新。'
      : 'The Navarre front record is updated.', ...state.mapHistory] } : {} }],
};

export const fetStatutes: GameEvent = {
  id: 'fet_statutes', meta,
  condition: state => fetDue(state, 13) && !resolved(state, 'fet_statutes'),
  title: 'The Statutes of FET', titleZh: 'FET 章程与机构',
  description: 'The new movement adopts statutes and formalizes its Political Board. The April decree had joined the Falange and Carlists in law; the statutes give their common organization a working structure.',
  descriptionZh: '新的政治运动通过章程，正式建立政治委员会。四月统一令在法律上合并长枪党与卡洛斯派，如今章程为共同组织确立运作结构。',
  options: [{ text: 'Record the new statutes.', textZh: '记录新章程。',
    effect: state => fetStatutes.condition?.(state) ? { organizations: establish(state, 'FET_POLITICAL_BOARD'),
      nationalistIntegration: { ...state.nationalistIntegration!, statutesAt: date(state) } } : {} }],
};

export const fetNationalCouncil: GameEvent = {
  id: 'fet_national_council', meta,
  condition: state => fetDue(state, 15) && resolved(state, 'fet_statutes')
    && !resolved(state, 'fet_national_council'),
  title: 'The National Council of FET', titleZh: 'FET 全国委员会',
  description: 'A National Council is appointed to give the unified movement a permanent leadership body under Franco.',
  descriptionZh: '全国委员会获任命，在佛朗哥领导下成为统一运动的常设领导机构。',
  options: [{ text: 'Record the council.', textZh: '记录委员会组成。',
    effect: state => fetNationalCouncil.condition?.(state) ? { organizations: establish(state, 'FET_NATIONAL_COUNCIL'),
      nationalistIntegration: { ...state.nationalistIntegration!, councilAt: date(state) } } : {} }],
};

export const fetAffiliateServices: GameEvent = {
  id: 'fet_affiliate_services', meta,
  condition: state => fetDue(state, 16) && resolved(state, 'fet_national_council')
    && !resolved(state, 'fet_affiliate_services'),
  title: 'Women’s and Student Services', titleZh: '妇女与学生机构整编',
  description: 'The Women’s Section and the Spanish University Union receive formal wartime service rules inside FET. Their existing members and organizations remain traceable; no second militia or youth corps is created.',
  descriptionZh: '妇女部和西班牙大学生联合会在 FET 内获得正式战时服务规则。原有成员与组织来源继续保留，不重复创建民兵或青年团体。',
  options: [{ text: 'Update the organizational record.', textZh: '更新组织档案。',
    effect: state => fetAffiliateServices.condition?.(state) ? { nationalistIntegration: {
      ...state.nationalistIntegration!, servicesAt: date(state) } } : {} }],
};

export const NATIONALIST_INTEGRATION_EVENTS: GameEvent[] = [
  nationalistProvisionalCommand, nationalistFrancoAlignment, nationalistCarlistAutonomy,
  nationalistUnificationOrSchism, carlistSecessionAftermath, fetStatutes,
  fetNationalCouncil, fetAffiliateServices,
];
