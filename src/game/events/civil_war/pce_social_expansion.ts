import type { GameEvent, GameState } from '../../types';
import { adjustClassSupport, adjustFactionDissents, type ClassPoliticalForce } from '../../utils';
import { isRepublicanPartyEligible, isRepublicanPartyPresent, WARTIME_PARTY_STATUS } from '../../politicalEligibility';
import { getEconomyCounter } from '../../rules/economyReforms';
import { isSpanishCivilWarOngoing, monthIndex } from '../../rules/wartimeCoalition';

const eventMeta = { category: 'war' as const, flow: 'solo' as const, series: ['civil_war', 'pce_social_expansion'] };

/** Vacated political affiliations remain social support, not vacant parliamentary seats. */
const vacatedParties = (state: GameState): ClassPoliticalForce[] =>
  (Object.keys(WARTIME_PARTY_STATUS) as (keyof typeof WARTIME_PARTY_STATUS)[])
    .filter(party => !isRepublicanPartyEligible(state, party));

const campaignDue = (state: GameState, id: string, months: number, predecessor?: string): boolean => Boolean(
  isSpanishCivilWarOngoing(state) && state.civilWarSetupCompletedAt
  && monthIndex(state) - monthIndex(state.civilWarSetupCompletedAt) >= months
  && isRepublicanPartyPresent(state, 'PCE') && vacatedParties(state).length
  && !state.eventHistory?.resolved.includes(id)
  && (!predecessor || state.eventHistory?.resolved.includes(predecessor)),
);

type Recruitment = { pceFarmers?: number; pceShops?: number; pceProfessionals?: number;
  cntFarmers?: number; cntShops?: number; cntProfessionals?: number };

const recruit = (state: GameState, gains: Recruitment): GameState['classes'] => {
  const donors = vacatedParties(state);
  let classes = state.classes;
  if (gains.pceFarmers) classes = adjustClassSupport(classes, 'Labradores', 'PCE', gains.pceFarmers, donors);
  if (gains.pceShops) classes = adjustClassSupport(classes, 'PequenaBurguesia', 'PCE', gains.pceShops, donors);
  if (gains.pceProfessionals) classes = adjustClassSupport(classes, 'Intelectuales', 'PCE', gains.pceProfessionals, donors);
  if (gains.cntFarmers) classes = adjustClassSupport(classes, 'Labradores', 'CNT_FAI', gains.cntFarmers, donors);
  if (gains.cntShops) classes = adjustClassSupport(classes, 'PequenaBurguesia', 'CNT_FAI', gains.cntShops, donors);
  if (gains.cntProfessionals) classes = adjustClassSupport(classes, 'Intelectuales', 'CNT_FAI', gains.cntProfessionals, donors);
  return classes;
};

const stats = (state: GameState, fervor = 0, authority = 0): GameState['stats'] => ({
  ...state.stats,
  revolutionaryFervor: Math.max(0, Math.min(100, state.stats.revolutionaryFervor + fervor)),
  republicanAuthority: Math.max(0, Math.min(100, state.stats.republicanAuthority + authority)),
});

const settle = (state: GameState, event: GameEvent, gains: Recruitment, changes: Partial<GameState>): Partial<GameState> => {
  if (!event.condition?.(state) || (changes.resources !== undefined && changes.resources < 0)) return { currentEvent: null };
  return { ...changes, classes: recruit(state, gains), currentEvent: null };
};

const collectivizationPressure = (state: GameState): number => Math.min(6, getEconomyCounter(state, 'land_forced_collectivization') * 2);
const bankPressure = (state: GameState): number => getEconomyCounter(state, 'private_bank_seizure') >= 1 ? 4 : 0;
const pceRelations = (state: GameState, delta: number): GameState['partyRelations'] => ({
  ...state.partyRelations, PCE: Math.max(0, Math.min(100, state.partyRelations.PCE + delta)),
});

export const pcePoliticalVacuum: GameEvent = {
  id: 'pce_political_vacuum',
  meta: eventMeta,
  condition: (state) => campaignDue(state, 'pce_political_vacuum', 2),
  title: 'Who Speaks for the Unrepresented?',
  titleZh: '谁来代表失去代言人的人？',
  description: 'Right-wing organizations are excluded from Republican politics, while the Radicals and Liberal Democrats withdraw. Their former supporters have not disappeared: smallholders and shopkeepers still need harvests protected, shops supplied and disputes settled. PCE organizers offer a disciplined antifascist home. The CNT can compete for these people, leave the field to the Communists, or reject them. Support moves only from parties that have actually left Republican politics, and cannot exceed their remaining support.',
  descriptionZh: '右翼组织被排除在共和国政治之外，激进党与自由民主党退出，但原先支持它们的人并未消失：自耕农仍需要保护收成，小店主仍需要货源与纠纷处理。PCE 的组织者向这些人提供一个讲求纪律的反法西斯归宿。CNT 可以争取他们，也可以将空间留给共产党，或拒绝接纳。支持只从确已退出共和国政治的党派转移，增益以这些党派的剩余支持为限。',
  options: [
    {
      text: 'Leave their organization to the Communist committees',
      textZh: '让共产党委员会组织他们',
      subtitle: 'PCE: up to +12 smallholder and +10 shopkeeper support. Republican authority +4; Faistas dissent +4; PCE relations +6.',
      subtitleZh: 'PCE：自耕农支持最多 +12、小资产阶级最多 +10。共和国权威 +4；Faistas 异议 +4；PCE 关系 +6。',
      effect: (state) => settle(state, pcePoliticalVacuum, { pceFarmers: 12, pceShops: 10 }, {
        stats: stats(state, 0, 4), factions: adjustFactionDissents(state.factions, { Faistas: 4 }), partyRelations: pceRelations(state, 6),
      }),
    },
    {
      text: 'Open CNT aid and mediation offices',
      textZh: '建立 CNT 援助与调解站',
      subtitle: 'Spend 2 resources. CNT: up to +8 smallholder and +7 shopkeeper support; PCE: +4 and +3. Puristas dissent +3.',
      subtitleZh: '消耗 2 资源。CNT：自耕农支持最多 +8、小资产阶级最多 +7；PCE 分别最多 +4、+3。Puristas 异议 +3。',
      condition: (state) => state.resources >= 2,
      unavailableSubtitle: () => 'Requires 2 resources for local aid offices.',
      unavailableSubtitleZh: () => '地方援助站需要 2 资源。',
      effect: (state) => settle(state, pcePoliticalVacuum, { pceFarmers: 4, pceShops: 3, cntFarmers: 8, cntShops: 7 }, {
        resources: state.resources - 2, factions: adjustFactionDissents(state.factions, { Puristas: 3 }),
      }),
    },
    {
      text: 'Refuse to court former conservative voters',
      textZh: '拒绝争取过去的保守派选民',
      subtitle: 'PCE: up to +16 smallholder and +14 shopkeeper support. Fervor +3; Faistas and Puristas dissent -4.',
      subtitleZh: 'PCE：自耕农支持最多 +16、小资产阶级最多 +14。革命热情 +3；Faistas、Puristas 异议各 −4。',
      effect: (state) => settle(state, pcePoliticalVacuum, { pceFarmers: 16, pceShops: 14 }, {
        stats: stats(state, 3), factions: adjustFactionDissents(state.factions, { Faistas: -4, Puristas: -4 }),
      }),
    },
  ],
};

export const pceSmallholderGuarantees: GameEvent = {
  id: 'pce_smallholder_guarantees',
  meta: eventMeta,
  condition: (state) => campaignDue(state, 'pce_smallholder_guarantees', 4, 'pce_political_vacuum'),
  title: 'A Guarantee for the Smallholder',
  titleZh: '小农的土地与收成',
  description: 'The PCE promises to protect the plots and harvests of peasants who work their own land. It distinguishes them from the great landowners and presents state guarantees as protection against arbitrary seizure. The more forced collectivization has advanced, the more persuasive this message becomes. We can support the Communist campaign, organize our own voluntary cooperation, or refuse such guarantees.',
  descriptionZh: 'PCE 承诺保护亲自耕作的小农的土地与收成，将他们与大地主区别对待，并把国家保障塑造成抵御任意没收的屏障。强制集体化推进越多，这一宣传越容易获得回应。我们可以支持共产党争取小农，也可以自行组织自愿合作，或拒绝给予这种保障。',
  options: [
    {
      text: 'Support the PCE campaign to protect small property',
      textZh: '支持 PCE 的小农产权保障宣传',
      subtitle: 'PCE smallholder support: up to +18, with up to +6 extra from forced collectivization. Authority +3; fervor -3; Puristas dissent +6; PCE relations +8.',
      subtitleZh: 'PCE 自耕农支持最多 +18；强制集体化每推进一次额外 +2，上限 +6。共和国权威 +3；热情 −3；Puristas 异议 +6；PCE 关系 +8。',
      effect: (state) => settle(state, pceSmallholderGuarantees, { pceFarmers: 18 + collectivizationPressure(state) }, {
        stats: stats(state, -3, 3), factions: adjustFactionDissents(state.factions, { Puristas: 6 }), partyRelations: pceRelations(state, 8),
      }),
    },
    {
      text: 'Offer CNT assistance and voluntary cooperation',
      textZh: '由 CNT 提供援助，争取自愿合作',
      subtitle: 'Spend 2 resources. CNT smallholder support: up to +8; PCE: up to +6. Faistas dissent +3, Puristas +5; PCE relations -3.',
      subtitleZh: '消耗 2 资源。CNT 自耕农支持最多 +8；PCE 最多 +6。Faistas 异议 +3、Puristas +5；PCE 关系 −3。',
      condition: (state) => state.resources >= 2,
      unavailableSubtitle: () => 'Requires 2 resources for village assistance.',
      unavailableSubtitleZh: () => '乡村援助需要 2 资源。',
      effect: (state) => settle(state, pceSmallholderGuarantees, { pceFarmers: 6, cntFarmers: 8 }, {
        resources: state.resources - 2, factions: adjustFactionDissents(state.factions, { Faistas: 3, Puristas: 5 }), partyRelations: pceRelations(state, -3),
      }),
    },
    {
      text: 'Reject special protection for individual holdings',
      textZh: '拒绝为个体土地所有权提供特别保障',
      subtitle: 'PCE smallholder support: up to +22, plus the collectivization modifier. Fervor +4; Faistas and Puristas dissent -3.',
      subtitleZh: 'PCE 自耕农支持最多 +22，另计强制集体化修正。革命热情 +4；Faistas、Puristas 异议各 −3。',
      effect: (state) => settle(state, pceSmallholderGuarantees, { pceFarmers: 22 + collectivizationPressure(state) }, {
        stats: stats(state, 4), factions: adjustFactionDissents(state.factions, { Faistas: -3, Puristas: -3 }),
      }),
    },
  ],
};

export const pceMiddleClassAppeal: GameEvent = {
  id: 'pce_middle_class_appeal',
  meta: eventMeta,
  condition: (state) => campaignDue(state, 'pce_middle_class_appeal', 6, 'pce_smallholder_guarantees'),
  title: 'The Party of Order in the Rear',
  titleZh: '后方秩序的承诺',
  description: 'PCE organizers promise protection for small shops, regular distribution and respect for professional work. Shopkeepers, teachers and lawyers who have lost their previous political representatives listen. If the CNT has seized private bank deposits, fears for their remaining savings make the Communist appeal stronger. Union service networks can compete with this promise, but need resources and concessions to people outside the industrial workforce.',
  descriptionZh: 'PCE 的组织者承诺保护小商店、恢复稳定配送，并尊重专业工作。失去原有政治代表的店主、教师与律师开始倾听。如果 CNT 已没收私营银行储蓄，他们对剩余积蓄的担忧会使共产党的宣传更加有效。工会服务网络可以与之竞争，但这需要资源，也需要向产业工人之外的群体让步。',
  options: [
    {
      text: 'Support the Communist campaign for rear-area order',
      textZh: '支持共产党的后方秩序宣传',
      subtitle: 'PCE: up to +16 shopkeeper support (+4 if banks were seized), and +8 professional support. Authority +4; fervor -3; Faistas dissent +6, Puristas +5.',
      subtitleZh: 'PCE：小资产阶级支持最多 +16（已没收银行则额外 +4），知识分子最多 +8。共和国权威 +4；热情 −3；Faistas 异议 +6、Puristas +5。',
      effect: (state) => settle(state, pceMiddleClassAppeal, { pceShops: 16 + bankPressure(state), pceProfessionals: 8 }, {
        stats: stats(state, -3, 4), factions: adjustFactionDissents(state.factions, { Faistas: 6, Puristas: 5 }),
      }),
    },
    {
      text: 'Build union supply and professional service networks',
      textZh: '建立工会配送与专业服务网络',
      subtitle: 'Spend 2 resources. CNT: up to +8 shopkeeper and +5 professional support; PCE: +6 and +3. Puristas dissent +3; PCE relations -4.',
      subtitleZh: '消耗 2 资源。CNT：小资产阶级支持最多 +8、知识分子最多 +5；PCE 分别最多 +6、+3。Puristas 异议 +3；PCE 关系 −4。',
      condition: (state) => state.resources >= 2,
      unavailableSubtitle: () => 'Requires 2 resources for the service network.',
      unavailableSubtitleZh: () => '组织服务网络需要 2 资源。',
      effect: (state) => settle(state, pceMiddleClassAppeal, { pceShops: 6, pceProfessionals: 3, cntShops: 8, cntProfessionals: 5 }, {
        resources: state.resources - 2, factions: adjustFactionDissents(state.factions, { Puristas: 3 }), partyRelations: pceRelations(state, -4),
      }),
    },
    {
      text: 'Reject concessions to shops and professionals',
      textZh: '拒绝向店主与专业人士让步',
      subtitle: 'PCE: up to +20 shopkeeper support (+4 if banks were seized), and +10 professional support. Fervor +4; Faistas and Puristas dissent -3.',
      subtitleZh: 'PCE：小资产阶级支持最多 +20（已没收银行则额外 +4），知识分子最多 +10。革命热情 +4；Faistas、Puristas 异议各 −3。',
      effect: (state) => settle(state, pceMiddleClassAppeal, { pceShops: 20 + bankPressure(state), pceProfessionals: 10 }, {
        stats: stats(state, 4), factions: adjustFactionDissents(state.factions, { Faistas: -3, Puristas: -3 }),
      }),
    },
  ],
};
