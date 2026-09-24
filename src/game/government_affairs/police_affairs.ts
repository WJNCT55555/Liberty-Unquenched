import { Card, GameState } from '../types';
import { raiseSecurityCorpsLoyalty } from '../rules/securityForces';
import { adjustMilitarization } from '../rules/militarization';

/**
 * Police Affairs lets the CNT, holding the Interior Ministry, make the state's
 * police reliable and then reshape it by law. The loyalty raised here is exactly
 * what the higher Security Corps Law levels are gated on, so the two feed each
 * other: build reliability first, reform the law second.
 */
type LoyaltyCorpsId = 'guardiaNacional' | 'guardiaAsalto' | 'guardiaRepublicana';

const loyaltyOption = (
  corpsId: LoyaltyCorpsId,
  text: string,
  textZh: string,
  nameEn: string,
  nameZh: string,
) => ({
  text,
  textZh,
  subtitle: `${nameEn} loyalty +5.`,
  subtitleZh: `${nameZh}忠诚度 +5。`,
  condition: (state: GameState) => (state.armedForces?.[corpsId]?.manpower || 0) > 0,
  unavailableSubtitle: () => `Requires an existing ${nameEn}.`,
  unavailableSubtitleZh: () => `需要已成立的${nameZh}。`,
  effect: (state: GameState): Partial<GameState> => ({
    police_affairs_timer: 6,
    ...raiseSecurityCorpsLoyalty(state, corpsId, 5),
  }),
});

const lawLevel = (state: GameState) => Number(state.domesticPolicy?.security_corps_law) || 0;
const corpsLoyalty = (state: GameState, corpsId: 'guardiaNacional' | 'guardiaAsalto') =>
  state.armedForces?.[corpsId]?.loyalty || 0;
const atWar = (state: GameState) => state.civilWarStatus === 'ongoing' || Boolean(state.activeWar);

const description = 'One way or another the CNT now holds the police power. Like the Republican police, the old army and the Stalinist security apparatus, part of the security forces still carry the instincts of the old state, of reaction or of authoritarianism, and feel no loyalty to the people of Iberia or to the revolution. It is time to change that.';
const descriptionZh = '无论如何CNT已经掌握了警察力量。与共和政府警察、旧军队和斯大林主义安全机构一样，部分安全力量仍带有旧国家、反动或威权倾向，对伊比利亚的人民和革命缺乏忠诚。是时候做出改变了。';

export const policeAffairs: Card = {
  id: 'police_affairs',
  title: 'Police Affairs',
  titleZh: '警察事务',
  type: 'Government',
  description,
  descriptionZh,
  cost: 1,
  condition: (state: GameState) =>
    state.cntStance === 'govern'
    && state.ministers.interior === 'CNT'
    && (state.police_affairs_timer || 0) <= 0,
  effect: (state: GameState): Partial<GameState> => ({
    currentEvent: {
      id: 'police_affairs_event',
      title: 'Police Affairs',
      titleZh: '警察事务',
      description,
      descriptionZh,
      date: { year: state.year, month: state.month },
      options: [
        loyaltyOption('guardiaNacional', 'Raise Civil Guard loyalty', '提高国民警卫队忠诚', 'Guardia Civil', '国民警卫队'),
        loyaltyOption('guardiaAsalto', 'Raise Assault Guard loyalty', '提高突击卫队忠诚', 'Guardia de Asalto', '突击卫队'),
        loyaltyOption('guardiaRepublicana', 'Raise Republican Guard loyalty', '提高共和国警卫队忠诚', 'Guardia Republicana', '共和国警卫队'),
        {
          text: 'Put the corps through real training (-1 Armament)',
          textZh: '让警队接受真正的训练（-1 军备）',
          subtitle: 'Government militarization +4 and route progress +3. The police share the army\'s rate, so better-drilled police also mean a stronger field army.',
          subtitleZh: '政府军军事化率 +4，路线进度 +3。警察与政府军共用同一军事化率，所以警队练得更好，也意味着野战军更强。',
          condition: (s: GameState) => s.armaments >= 1,
          unavailableSubtitle: () => 'Requires 1 armament.',
          unavailableSubtitleZh: () => '需要 1 点军备。',
          effect: (s: GameState): Partial<GameState> => ({
            armaments: s.armaments - 1,
            police_affairs_timer: 6,
            ...adjustMilitarization(s, 'gov', 4),
          })
        },
        {
          text: 'The Civil Guard is too rotten; we must raise a new Assault Guard to defend the Republic.',
          textZh: '国民警卫队过于腐朽，我们需要新建一支突击卫队保卫共和国。',
          subtitle: 'Raises the Security Corps Law to level 1, creating the Assault Guard.',
          subtitleZh: '将治安机关法提升至 1 级，组建突击卫队。',
          // Normally unreachable: the 1931 start passes level 1 through the Azaña
          // reform long before the CNT can hold the Interior Ministry.
          condition: (state: GameState) => lawLevel(state) === 0 && corpsLoyalty(state, 'guardiaNacional') >= 60,
          unavailableSubtitle: () => 'Requires Security Corps Law level 0 and Civil Guard loyalty of 60.',
          unavailableSubtitleZh: () => '需要治安机关法为 0 级，且国民警卫队忠诚度达到 60。',
          effect: (s: GameState): Partial<GameState> => ({
            police_affairs_timer: 6,
            domesticPolicy: { ...s.domesticPolicy, security_corps_law: 1 },
          }),
        },
        {
          text: 'Raise the loyalty of the police forces by law.',
          textZh: '通过法律提升警察力量忠诚度。',
          subtitle: 'Raises the Security Corps Law to level 2.',
          subtitleZh: '将治安机关法提升至 2 级。',
          condition: (s: GameState) =>
            lawLevel(s) === 1
            && corpsLoyalty(s, 'guardiaNacional') >= 70
            && corpsLoyalty(s, 'guardiaAsalto') >= 90,
          unavailableSubtitle: () => 'Requires Security Corps Law level 1, Civil Guard loyalty of 70 and Assault Guard loyalty of 90.',
          unavailableSubtitleZh: () => '需要治安机关法为 1 级，国民警卫队忠诚度达到 70，突击卫队忠诚度达到 90。',
          effect: (s: GameState): Partial<GameState> => ({
            police_affairs_timer: 6,
            domesticPolicy: { ...s.domesticPolicy, security_corps_law: 2 },
          }),
        },
        {
          text: 'Found a Republican police force — the shared vision of all Republicans.',
          textZh: '组建共和国警察，这是共和派共同的愿景。',
          subtitle: 'Raises the Security Corps Law to level 3, merging both corps into the Republican Guard.',
          subtitleZh: '将治安机关法提升至 3 级，国民警卫队与突击卫队合并为共和国警卫队。',
          condition: (s: GameState) =>
            lawLevel(s) === 2
            && corpsLoyalty(s, 'guardiaNacional') >= 80
            && corpsLoyalty(s, 'guardiaAsalto') >= 95,
          unavailableSubtitle: () => 'Requires Security Corps Law level 2, Civil Guard loyalty of 80 and Assault Guard loyalty of 95.',
          unavailableSubtitleZh: () => '需要治安机关法为 2 级，国民警卫队忠诚度达到 80，突击卫队忠诚度达到 95。',
          effect: (s: GameState): Partial<GameState> => ({
            police_affairs_timer: 6,
            domesticPolicy: { ...s.domesticPolicy, security_corps_law: 3 },
          }),
        },
        {
          text: 'Workers\' patrols will crush everything.',
          textZh: '工人巡逻队将会碾碎一切。',
          subtitle: 'Raises the Security Corps Law to level 4 while the war runs, dissolving the guard for workers\' patrols.',
          subtitleZh: '战争状态下将治安机关法提升至 4 级，撤销警卫队、改设工人巡逻队。',
          condition: (s: GameState) => (lawLevel(s) === 2 || lawLevel(s) === 3) && atWar(s),
          unavailableSubtitle: () => 'Requires Security Corps Law level 2 or 3 and an ongoing war.',
          unavailableSubtitleZh: () => '需要治安机关法为 2 级或 3 级，且国家处于战争状态。',
          effect: (s: GameState): Partial<GameState> => ({
            police_affairs_timer: 6,
            domesticPolicy: { ...s.domesticPolicy, security_corps_law: 4 },
          }),
        },
        {
          text: 'We will raise workers\' patrols.',
          textZh: '我们将组建工人巡逻队。',
          subtitle: 'Raises the Security Corps Law to level 4 in peacetime, dissolving the guard for workers\' patrols.',
          subtitleZh: '在非战争状态下将治安机关法提升至 4 级，撤销警卫队、改设工人巡逻队。',
          condition: (s: GameState) =>
            lawLevel(s) === 3
            && s.civilWarStatus === 'not_started'
            && !s.activeWar,
          unavailableSubtitle: () => 'Requires Security Corps Law level 3 and peace.',
          unavailableSubtitleZh: () => '需要治安机关法为 3 级，且国家处于非战争状态。',
          effect: (s: GameState): Partial<GameState> => ({
            police_affairs_timer: 6,
            domesticPolicy: { ...s.domesticPolicy, security_corps_law: 4 },
          }),
        },
      ],
    },
  }),
};
