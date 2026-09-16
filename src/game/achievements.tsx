import React from 'react';
import { GameState } from './types';
import { ENDINGS } from './endings';
import { LAW_LEVEL_LIMITS } from './lawStances';
import { isOrganizationEstablished } from './organizations';
import { getOverallFactionDissent } from './utils/factionEffects';

import { toast } from 'sonner';

export interface Achievement {
  id: string;
  title: { en: string; zh: string };
  description: { en: string; zh: string };
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'A_CHILDREN', title: { en: 'Hijos del Pueblo', zh: '人民之子' }, description: { en: 'Achieve the anarchist utopia ending.', zh: '达成无政府主义乌托邦结局。' }, icon: 'img/Achievement Icon/hijos_del_pueblo.png' },
  { id: 'A_FRANCO', title: { en: 'Hemos Pasado', zh: '他们已通过' }, description: { en: 'Lose the civil war to the Nationalists.', zh: '在内战中败给国民军。' }, icon: 'img/Achievement Icon/hemos_pasado.png' },
  { id: 'A_POPULAR', title: { en: 'Frente Popular', zh: '人民阵线' }, description: { en: 'Win the war but lose the revolution.', zh: '赢得了战争，但输掉了革命。' }, icon: 'img/Achievement Icon/frente_popular.png' },
  { id: 'A_RICH', title: { en: 'Arsenal de la Revolución', zh: '革命兵工厂' }, description: { en: 'Accumulate 50 Armaments.', zh: '囤积50点军备。' }, icon: 'img/Achievement Icon/arsenal_de_la_revolucion.png' },
  { id: 'A_UNITY', title: { en: 'Unión Inquebrantable', zh: '牢不可破的联盟' }, description: { en: 'Reduce overall dissent to 0%.', zh: '将整体异议度降至0%。' }, icon: 'img/Achievement Icon/union_inquebrantable.png' },
  { id: 'A_BARRICADES', title: { en: '¡A las barricadas!', zh: '到街垒去' }, description: { en: 'Reach 100,000 CNT-FAI militia manpower.', zh: '无政府主义民兵人数大于100,000。' }, icon: 'img/Achievement Icon/a_las_barricadas.png' },
  { id: 'A_DURRUTI', title: { en: 'El sueño de Durruti', zh: '杜鲁蒂之梦' }, description: { en: 'Win the civil war with Durruti alive and Faistas dominant.', zh: '在杜鲁蒂存活且无政府主义者主导下赢得西班牙内战。' }, icon: 'img/Achievement Icon/el_sueno_de_durruti.png' },
  { id: 'A_CATALONIA', title: { en: 'Homenaje a Cataluña', zh: '向加泰罗尼亚致敬' }, description: { en: 'Catalonia is fully controlled by CNT-FAI and independent.', zh: '加泰罗尼亚完全由 CNT-FAI 控制且保持独立。' }, icon: 'img/Achievement Icon/homenaje_a_cataluna.png' },
  { id: 'A_THEOLOGY', title: { en: 'Teología de la liberación', zh: '解放神学' }, description: { en: 'CNT-FAI Church support reaches 40%.', zh: 'CNT-FAI天主教支持者至少占 40%。' }, icon: 'img/Achievement Icon/teologia_de_la_liberacion.png' },
  { id: 'A_TIZNAOS', title: { en: 'Tiznaos', zh: '黑漆战车' }, description: { en: 'Anarchists develop armored cars.', zh: '无政府主义者研发出装甲车。' }, icon: 'img/Achievement Icon/tiznaos.png' },
  { id: 'A_MUJERES', title: { en: 'Mujeres Libres', zh: '自由妇女' }, description: { en: 'Establish Mujeres Libres and raise women\'s rights to full gender equality.', zh: '成立自由妇女组织，并将女性权利提升至全面性别平等。' }, icon: 'img/Achievement Icon/mujeres_libres.png' },
  { id: 'A_YOUNG_WORLD', title: { en: 'El mundo cuando era joven', zh: '当世界正年轻' }, description: { en: 'International Brigades arrive in Madrid.', zh: '国际纵队到达马德里。' }, icon: 'img/Achievement Icon/el_mundo_cuando_era_joven.png' },
  { id: 'A_CULTURAL_REV', title: { en: 'Ateneos fiebre', zh: '雅典娜热' }, description: { en: 'Reach the highest level of women\'s rights and education, and establish 5 Ateneos Libertarios.', zh: '将女性权利与教育制度提升至最高等级，并建立至少5个自由雅典学苑。' }, icon: 'img/Achievement Icon/ateneos_fiebre.png' },
  { id: 'A_OTHER_FRANCO', title: { en: 'El otro Franco', zh: '另一个佛朗哥' }, description: { en: 'Elect Ramón Franco — the Caudillo\'s own brother — President of the Republic.', zh: '让拉蒙·佛朗哥——那位"领袖"的亲弟弟——当选共和国总统。' }, icon: '✈️' },
  { id: 'A_NONE_LEFT', title: { en: 'Y no quedó ninguno', zh: '无人生还' }, description: { en: 'All eight of these figures are dead.', zh: '这八个角色全部死亡。' }, icon: '💀' },
  { id: 'A_NO_VOTEIS', title: { en: '¡No votéis!', zh: '不要投票！' }, description: { en: 'Reach an ending without the CNT ever abandoning its anti-electoral stance.', zh: '坚守 CNT 的反选举立场直到结局，从未转向合作或参政。' }, icon: '🚫' },
  { id: 'A_SIN_PARTIDO', title: { en: 'El partido de los sin partido', zh: '无党之党' }, description: { en: 'Found the PRRevS — a party of anarcho-syndicalists who swore they would never have one.', zh: '成立 PRRevS——一个由发誓永不结党的人组成的政党。' }, icon: '🗳️' },
  { id: 'A_MOSQUETEROS', title: { en: 'Los tres mosqueteros', zh: '三个火枪手' }, description: { en: 'Have Ascaso, Durruti and García Oliver serving as advisors at the same time.', zh: '让阿斯卡索、杜鲁蒂与加西亚·奥利弗同时担任顾问。' }, icon: '⚔️' },
  { id: 'A_ESPERANTO', title: { en: 'Esperanto', zh: '世界语' }, description: { en: 'Raise the language law all the way to Esperanto.', zh: '将语言法律提升至世界语。' }, icon: '🌍' },
  { id: 'A_OLIMPIADA', title: { en: 'Olimpíada Popular', zh: '人民奥林匹克' }, description: { en: 'Hold the People\'s Olympiad in Barcelona while the Republic is still at peace.', zh: '在共和国仍然和平时，让人民奥林匹克运动会在巴塞罗那举行。' }, icon: '🏅' }
];

/**
 * The three militants who led the armed workers of Barcelona shoulder to shoulder
 * (see events/civil_war/civil_war_setup.ts). All three begin in the advisor pool.
 */
const THREE_MUSKETEERS = ['Francisco Ascaso', 'Buenaventura Durruti', 'Juan García Oliver'] as const;

export const getUnlockedGlobalAchievements = (): string[] => {
  try {
    const data = localStorage.getItem('cnt_fai_achievements');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getUnlockedHistoricalAchievements = (): string[] => {
  try {
    const data = localStorage.getItem('cnt_fai_achievements_historical');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const unlockGlobalAchievement = (id: string, isHistorical: boolean) => {
  const unlocked = getUnlockedGlobalAchievements();
  if (!unlocked.includes(id)) {
    unlocked.push(id);
    localStorage.setItem('cnt_fai_achievements', JSON.stringify(unlocked));
  }
  if (isHistorical) {
    const historical = getUnlockedHistoricalAchievements();
    if (!historical.includes(id)) {
      historical.push(id);
      localStorage.setItem('cnt_fai_achievements_historical', JSON.stringify(historical));
    }
  }
};

export const checkAchievements = (state: GameState): GameState => {
  if (state.difficulty === 'sandbox') return state;

  const newUnlocked = new Set(state.unlockedAchievementsThisRun || []);
  let changed = false;

  const checkAndUnlock = (id: string, condition: boolean) => {
    if (condition && !newUnlocked.has(id)) {
      newUnlocked.add(id);
      unlockGlobalAchievement(id, state.difficulty === 'historical');
      changed = true;
      
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) {
        toast.custom((t) => (
          <div className="flex items-center gap-4 bg-paper border-2 border-ink p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] w-[360px] relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-ink"></div>
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-ink"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-ink"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-ink"></div>
            
            <div className="text-4xl drop-shadow-md">
              {ach.icon.endsWith('.png') ? (
                <img src={ach.icon} alt={ach.title.en} className="w-16 h-16 object-contain" />
              ) : (
                ach.icon
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-typewriter text-[10px] text-ink-light uppercase tracking-widest mb-1">
                {state.language === 'zh' ? '成就解锁' : 'Achievement Unlocked'}
              </span>
              <span className="font-typewriter font-bold text-lg text-ink leading-tight">
                {state.language === 'zh' ? ach.title.zh : ach.title.en}
              </span>
              <span className="font-typewriter text-xs text-ink/80 mt-1">
                {state.language === 'zh' ? ach.description.zh : ach.description.en}
              </span>
            </div>
          </div>
        ), { duration: 5000 });
      }
    }
  };

  // Check conditions
  checkAndUnlock('A_CHILDREN', state.ending === ENDINGS.CHILDREN_OF_THE_PEOPLE);
  checkAndUnlock('A_FRANCO', state.ending === ENDINGS.WE_HAVE_PASSED);
  checkAndUnlock('A_POPULAR', state.ending === ENDINGS.POPULAR_FRONT);
  
  checkAndUnlock('A_RICH', state.armaments >= 50);
  checkAndUnlock('A_BARRICADES', state.armedForces.militias.cntFai > 100000);
  
  const overallDissent = getOverallFactionDissent(state.factions);
  checkAndUnlock('A_UNITY', overallDissent === 0);

  const isFaistasDominant = state.factions.Faistas.influence > Math.max(
    state.factions.Treintistas.influence,
    state.factions.Cenetistas.influence,
    state.factions.Puristas.influence
  );
  checkAndUnlock('A_DURRUTI', state.civilWarStatus === 'won' && state.durrutiAlive && isFaistasDominant);
  checkAndUnlock(
    'A_CATALONIA',
    state.regionalStatuses?.catalonia === 'independent' &&
    (state.cataloniaControl === 'cnt_fai' || state.cataloniaControl === 'committee')
  );
  checkAndUnlock('A_THEOLOGY', state.classes.Clero.support.CNT_FAI >= 40);
  checkAndUnlock('A_TIZNAOS', state.hasArmoredCars);

  const maxWomensRights = LAW_LEVEL_LIMITS.womens_rights;
  const maxEducation = LAW_LEVEL_LIMITS.education_institutions;
  const maxLanguage = LAW_LEVEL_LIMITS.language_policy;

  checkAndUnlock(
    'A_MUJERES',
    isOrganizationEstablished(state, 'ML') &&
    state.domesticPolicy.womens_rights >= maxWomensRights
  );
  checkAndUnlock('A_YOUNG_WORLD', state.internationalBrigadesFormed);
  checkAndUnlock(
    'A_CULTURAL_REV',
    state.domesticPolicy.womens_rights >= maxWomensRights &&
    state.domesticPolicy.education_institutions >= maxEducation &&
    (state.ateneos_established || 0) >= 5
  );

  checkAndUnlock('A_OTHER_FRANCO', state.government.president === 'Ramón Franco');

  // The eight figures targeted by "propaganda by the deed" (action_affairs/propaganda_by_deed.ts).
  // Other events can kill some of them as well, so this is not an assassination-only goal.
  checkAndUnlock(
    'A_NONE_LEFT',
    state.francoStatus === 'dead' &&
    state.queipoStatus === 'dead' &&
    state.sanjurjoStatus === 'dead' &&
    state.calvoSoteloStatus === 'dead' &&
    state.primoDeRiveraStatus === 'dead' &&
    state.ramiroLedesmaStatus === 'dead' &&
    state.zamoraStatus === 'dead' &&
    state.alfonsoXIIIStatus === 'dead'
  );

  checkAndUnlock('A_SIN_PARTIDO', isOrganizationEstablished(state, 'PRRevS'));

  // Strictly "always opposed": the flag is only ever cleared, and gating on the
  // ending keeps it from firing on turn one. Formation of the PRRevS requires
  // cntStance === 'govern', so this and A_SIN_PARTIDO cannot coexist in one run.
  const neverAbandonedAbstention = state.cntStanceAlwaysOpposed ?? (state.cntStance === 'oppose');
  checkAndUnlock('A_NO_VOTEIS', Boolean(state.isGameOver) && neverAbandonedAbstention);

  checkAndUnlock(
    'A_MOSQUETEROS',
    THREE_MUSKETEERS.every(id => state.activeAdvisors?.some(advisor => advisor?.id === id))
  );
  checkAndUnlock('A_ESPERANTO', state.domesticPolicy.language_policy >= maxLanguage);

  // Resolved by events/olimpiada_popular.ts, which requires a Popular Front cabinet,
  // Catalan self-government and a Republic still at peace in June 1936. The event
  // history only grows, so the achievement cannot be un-earned mid-run.
  const heldPeopleOlympiad = (state.eventHistory?.resolved || []).includes('olimpiada_popular');
  checkAndUnlock('A_OLIMPIADA', heldPeopleOlympiad);

  if (changed) {
    return { ...state, unlockedAchievementsThisRun: Array.from(newUnlocked) };
  }
  return state;
};
