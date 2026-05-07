import React from 'react';
import { GameState } from './types';
import { ENDINGS } from './endings';

import { toast } from 'sonner';

export interface Achievement {
  id: string;
  title: { en: string; zh: string };
  description: { en: string; zh: string };
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'A_CHILDREN', title: { en: 'Hijos del Pueblo', zh: '人民之子' }, description: { en: 'Achieve the anarchist utopia ending.', zh: '达成无政府主义乌托邦结局。' }, icon: 'img/Achievement Icon/Hijos del Pueblo.png' },
  { id: 'A_FRANCO', title: { en: 'Hemos Pasado', zh: '他们已通过' }, description: { en: 'Lose the civil war to the Nationalists.', zh: '在内战中败给国民军。' }, icon: 'img/Achievement Icon/Hemos Pasado.png' },
  { id: 'A_POPULAR', title: { en: 'Frente Popular', zh: '人民阵线' }, description: { en: 'Win the war but lose the revolution.', zh: '赢得了战争，但输掉了革命。' }, icon: 'img/Achievement Icon/Frente Popular.png' },
  { id: 'A_RICH', title: { en: 'Arsenal de la Revolución', zh: '革命兵工厂' }, description: { en: 'Accumulate 50 Armaments.', zh: '囤积50点军备。' }, icon: 'img/Achievement Icon/Arsenal de la Revolución.png' },
  { id: 'A_UNITY', title: { en: 'Unión Inquebrantable', zh: '牢不可破的联盟' }, description: { en: 'Reduce overall dissent to 0%.', zh: '将整体异议度降至0%。' }, icon: 'img/Achievement Icon/Unión Inquebrantable.png' },
  { id: 'A_BARRICADES', title: { en: '¡A las barricadas!', zh: '到街垒去' }, description: { en: 'Reach 100,000 CNT-FAI militia manpower.', zh: '无政府主义民兵人数大于100,000。' }, icon: 'img/Achievement Icon/¡A las barricadas!.png' },
  { id: 'A_DURRUTI', title: { en: 'El sueño de Durruti', zh: '杜鲁蒂之梦' }, description: { en: 'Win the civil war with Durruti alive and Faistas dominant.', zh: '在杜鲁蒂存活且无政府主义者主导下赢得西班牙内战。' }, icon: 'img/Achievement Icon/El sueño de Durruti.png' },
  { id: 'A_CATALONIA', title: { en: 'Homenaje a Cataluña', zh: '向加泰罗尼亚致敬' }, description: { en: 'Catalonia is fully controlled by CNT-FAI and independent.', zh: '加泰罗尼亚完全由 CNT-FAI 控制且保持独立。' }, icon: 'img/Achievement Icon/Homenaje a Cataluña.png' },
  { id: 'A_THEOLOGY', title: { en: 'Teología de la liberación', zh: '解放神学' }, description: { en: 'CNT-FAI Church support reaches 40%.', zh: 'CNT-FAI天主教支持者至少占 40%。' }, icon: 'img/Achievement Icon/Teología de la liberación.png' },
  { id: 'A_TIZNAOS', title: { en: 'Tiznaos', zh: '黑漆战车' }, description: { en: 'Anarchists develop armored cars.', zh: '无政府主义者研发出装甲车。' }, icon: 'img/Achievement Icon/Tiznaos.png' },
  { id: 'A_MUJERES', title: { en: 'Mujeres Libres', zh: '自由妇女' }, description: { en: 'Pass reforms to guarantee women\'s rights.', zh: '通过改革以保障妇女权益。' }, icon: 'img/Achievement Icon/Mujeres Libres.png' },
  { id: 'A_YOUNG_WORLD', title: { en: 'El mundo cuando era joven', zh: '当世界正年轻' }, description: { en: 'International Brigades arrive in Madrid.', zh: '国际纵队到达马德里。' }, icon: 'img/Achievement Icon/El mundo cuando era joven.png' },
  { id: 'A_CULTURAL_REV', title: { en: 'Ateneos fiebre', zh: '雅典娜热' }, description: { en: 'Pass all women\'s rights reforms and secularize education.', zh: '通过所有妇女权利改革，使教育世俗化。' }, icon: 'img/Achievement Icon/Ateneos fiebre.png' }
];

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
  
  const totalInfluence = Object.values(state.factions).reduce((sum, f) => sum + f.influence, 0);
  const overallDissent = totalInfluence > 0 ? Object.values(state.factions).reduce((sum, f) => sum + (f.influence * f.dissent), 0) / 100 : 0;
  checkAndUnlock('A_UNITY', overallDissent === 0);

  const isFaistasDominant = state.factions.Faistas.influence > Math.max(
    state.factions.Treintistas.influence,
    state.factions.Cenetistas.influence,
    state.factions.Puristas.influence
  );
  checkAndUnlock('A_DURRUTI', state.civilWarStatus === 'won' && state.durrutiAlive && isFaistasDominant);
  checkAndUnlock('A_CATALONIA', state.cataloniaIndependent);
  checkAndUnlock('A_THEOLOGY', state.classes.Clero.support.CNT_FAI >= 40);
  checkAndUnlock('A_TIZNAOS', state.hasArmoredCars);
  checkAndUnlock('A_MUJERES', state.womensRightsReformed);
  checkAndUnlock('A_YOUNG_WORLD', state.internationalBrigadesArrived);
  checkAndUnlock('A_CULTURAL_REV', state.womensRightsReformed && state.educationSecularized);

  if (changed) {
    return { ...state, unlockedAchievementsThisRun: Array.from(newUnlocked) };
  }
  return state;
};
