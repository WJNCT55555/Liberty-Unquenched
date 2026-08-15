import type { GameEvent } from '../types';
import { adjustFactionInfluence, adjustClassSupport, isAtOrAfter } from '../utils';

const politicsMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
};

export const cedaFormation: GameEvent = {
  id: 'ceda_formation',
  meta: politicsMeta,
  date: { year: 1933, month: 3 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1933, 3),
  title: 'The Rise of CEDA',
  titleZh: 'CEDA 的崛起',
  description: 'Under the leadership of José María Gil-Robles, various Catholic, conservative, and right-wing groups have united to form the Spanish Confederation of Autonomous Right-wing Groups (CEDA). This marks a dangerous turning point. CEDA is a massive mass party that aims to use the democratic system to dismantle the Republic from within and establish a Catholic corporatist state. The right is no longer fractured; it is organized, funded, and hungry for power.',
  descriptionZh: '在何塞·马利亚·吉尔-罗伯斯的领导下，各种天主教、保守派和右翼团体联合成立了“西班牙右翼自治组织同盟”（CEDA）。这标志着一个危险的转折点。CEDA 是一个庞大的群众性政党，旨在利用民主制度从内部瓦解共和国，建立一个天主教社团主义国家。右翼不再四分五裂；他们现在有组织、有资金，并且渴望权力。',
  options: [
    {
      text: 'Sound the anti-fascist alarm! We must mobilize the streets.',
      textZh: '拉响反法西斯警报！我们必须动员街头群众。',
      subtitle: 'Costs 1 Resource. Raises revolutionary fervor but lets the right consolidate around CEDA.',
      subtitleZh: '消耗 1 资源。提高革命热情，但右翼势力围绕CEDA进一步整合。',
      condition: (state) => state.resources >= 1,
      unavailableSubtitle: () => 'Requires 1 resource.',
      unavailableSubtitleZh: () => '需要 1 点资源。',
      effect: (state) => {
        let newClasses = state.classes;
        
        // CEDA (AP) consolidates right-wing support
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'AP', 20);
        newClasses = adjustClassSupport(newClasses, 'Clero', 'AP', 20);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'AP', 15);
        
        // Drain some support from extreme right to CEDA for strategic voting
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'CT', -10);
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'RE', -10);
        newClasses = adjustClassSupport(newClasses, 'Clero', 'CT', -10);

        return {
          resources: state.resources - 1,
          ceda_formed: true,
          classes: newClasses,
          stats: {
            ...state.stats,
            revolutionaryFervor: Math.min(100, state.stats.revolutionaryFervor + 10)
          }
        };
      }
    },
    {
      text: 'Left or Right, it is still a bourgeois republic. Let them fight.',
      textZh: '无论是左翼还是右翼，它仍然是一个资产阶级共和国。让他们狗咬狗吧。',
      subtitle: 'Maintains our ideological purity but weakens the broader anti-fascist front.',
      subtitleZh: '保持我们的意识形态纯洁性，但会削弱更广泛的反法西斯阵线。',
      effect: (state) => {
        let newClasses = state.classes;
        
        // CEDA (AP) consolidates right-wing support
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'AP', 20);
        newClasses = adjustClassSupport(newClasses, 'Clero', 'AP', 20);
        newClasses = adjustClassSupport(newClasses, 'PequenaBurguesia', 'AP', 15);
        
        // Drain some support from extreme right to CEDA for strategic voting
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'CT', -10);
        newClasses = adjustClassSupport(newClasses, 'Latifundistas', 'RE', -10);
        newClasses = adjustClassSupport(newClasses, 'Clero', 'CT', -10);

        return {
          ceda_formed: true,
          classes: newClasses,
          factions: adjustFactionInfluence(state.factions, 'Faistas', 5)
        };
      }
    }
  ]
};
