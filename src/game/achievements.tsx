import React from 'react';
import { GameState } from './types';
import { ACHIEVEMENT_CHECKS } from './achievementConditions';

import { toast } from 'sonner';
import { getImageUrl } from '../lib/assetUrl';

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
  { id: 'A_NONE_LEFT', title: { en: 'Y no quedó ninguno', zh: '无人生还' }, description: { en: 'All eight of these figures are dead.', zh: '这八个角色全部死亡。' }, icon: 'img/Achievement Icon/y_no_quedo_ninguno.png' },
  { id: 'A_NO_VOTEIS', title: { en: '¡No votéis!', zh: '不要投票！' }, description: { en: 'Reach an ending without the CNT ever abandoning its anti-electoral stance.', zh: '坚守 CNT 的反选举立场直到结局，从未转向合作或参政。' }, icon: 'img/Achievement Icon/no_voteis.png' },
  { id: 'A_SIN_PARTIDO', title: { en: 'El partido de los sin partido', zh: '无党之党' }, description: { en: 'Found the PRRevS — a party of anarcho-syndicalists who swore they would never have one.', zh: '成立 PRRevS——一个由发誓永不结党的人组成的政党。' }, icon: '🗳️' },
  { id: 'A_MOSQUETEROS', title: { en: 'Los tres mosqueteros', zh: '三个火枪手' }, description: { en: 'Have Ascaso, Durruti and García Oliver serving as advisors at the same time.', zh: '让阿斯卡索、杜鲁蒂与加西亚·奥利弗同时担任顾问。' }, icon: '⚔️' },
  { id: 'A_ESPERANTO', title: { en: 'Esperanto', zh: '世界语' }, description: { en: 'Raise the language law all the way to Esperanto.', zh: '将语言法律提升至世界语。' }, icon: 'img/Achievement Icon/esperanto.png' },
  { id: 'A_OLIMPIADA', title: { en: 'Olimpíada Popular', zh: '人民奥林匹克' }, description: { en: 'Hold the People\'s Olympiad in Barcelona while the Republic is still at peace.', zh: '在共和国仍然和平时，让人民奥林匹克运动会在巴塞罗那举行。' }, icon: 'img/Achievement Icon/olimpiada_popular.png' },
  { id: 'A_MONEY_ENDS', title: { en: 'El fin del dinero', zh: '货币的终结' }, description: { en: 'Reach the third level of abolition and declare the peseta finished in the liberated districts.', zh: '把废除货币推进到第三级，并正式宣布比塞塔在解放区作废。' }, icon: '🪙' }
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

/**
 * 解锁写入全局存储。
 *
 * **无头环境没有 `localStorage`**（Mission Runner、脚本测试、SSR 都会走到这里）：
 * 那种情况下解锁只记在 `state.unlockedAchievementsThisRun` 上，不再往存储里写，
 * 也绝不能因此抛错——否则一次 reducer 就会把整局脚本打断。
 */
export const unlockGlobalAchievement = (id: string, isHistorical: boolean) => {
  try {
    if (typeof localStorage === 'undefined') return;
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
  } catch {
    /* 存储不可用（隐私模式/无头环境）：忽略即可，本局记录仍然有效 */
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

      try {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) {
          toast.custom(() => (
          <div className="flex items-center gap-4 bg-paper border-2 border-ink p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] w-[360px] relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-ink"></div>
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-ink"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-ink"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-ink"></div>
            
            <div className="text-4xl drop-shadow-md">
              {ach.icon.endsWith('.png') ? (
                <img src={getImageUrl(ach.icon)} alt={ach.title.en} className="w-16 h-16 object-contain" />
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
      } catch {
        /* 无头环境没有 toast 容器：解锁本身已经记在 state 上，提示可以省掉 */
      }
    }
  };

  // Check conditions — the table itself lives in `achievementConditions.ts` so that
  // headless callers (Mission Runner, script tests) can evaluate it without React,
  // sonner or localStorage.
  for (const check of ACHIEVEMENT_CHECKS) checkAndUnlock(check.id, check.test(state));

  if (changed) {
    return { ...state, unlockedAchievementsThisRun: Array.from(newUnlocked) };
  }
  return state;
};
