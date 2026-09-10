import type { GameEvent, GameState } from '../types';
import { isAtOrAfter } from '../utils';
import { clampLawLevel } from '../lawStances';

const militaryReformMeta = {
  category: 'politics' as const,
  flow: 'solo' as const,
  tags: ['law', 'military'],
};

export const azanaMilitaryReform: GameEvent = {
  id: 'azana_military_reform',
  meta: militaryReformMeta,
  date: { year: 1931, month: 5 },
  condition: (state) => state.scenario === '1931' && isAtOrAfter(state, 1931, 5),
  title: "Azaña's Military Reform",
  titleZh: '阿萨尼亚军事改革',
  description: 'As Minister of War, Manuel Azaña has launched the most ambitious military reform the Republic has yet attempted. The Ley de Retiro offers full pay to every surplus officer who leaves the service, and thousands have already accepted; the rank of captain general is abolished, the Zaragoza military academy is closed, the swollen command structure is cut back to a handful of divisions, and the armed forces are placed firmly under civilian Republican authority. In parallel, the government is building a new urban security corps recruited from Republican loyalists, meant to take over riot control and public order in the cities that the Civil Guard has always dominated. The reform promises a smaller, cheaper and more professional army, and a security apparatus that will not turn its rifles on the Republic. But resentment is spreading among conservative and Africanist officers, who see their careers, privileges and honour dismantled by a civilian minister, and that grievance will outlive this government.',
  descriptionZh: '陆军部长曼努埃尔·阿萨尼亚推行了共和国迄今最具雄心的军事改革。《退役法》向所有冗余军官提供全额薪饷、鼓励其离队，已有数千人接受；上将军衔被废除，萨拉戈萨军事学院被关闭，臃肿的指挥体系被压缩为少数几个师，武装力量被牢固置于共和国文官政府之下。与此同时，政府着手组建一支从共和派忠诚者中招募的新型城市治安部队，用以接管历来由国民警卫队把持的城市防暴与公共秩序事务。改革有望带来一支规模更小、开支更低、更为专业的军队，以及一支不会把枪口对准共和国的治安力量。但保守军官与非洲派军官的不满正在蔓延——他们眼看自己的前程、特权与荣誉被一位文官部长拆解，而这份怨恨将比这届政府活得更久。',
  options: [
    {
      text: 'The barracks must answer to the Republic.',
      textZh: '军营必须服从共和国。',
      subtitle: 'Advances the Army Reform Law and the Security Corps Law by one level each, up to their maximum level.',
      subtitleZh: '军队改革法与治安机关法各提升一级，均不超过各自最高等级。',
      effect: (state: GameState): Partial<GameState> => {
        // The cabinet built the Republican-loyal urban security corps in the same reform drive
        // that purged the officer corps, so this event advances both laws together.
        const domesticPolicy = {
          ...state.domesticPolicy,
          army_reform_law: clampLawLevel('army_reform_law', state.domesticPolicy.army_reform_law + 1),
          security_corps_law: clampLawLevel('security_corps_law', state.domesticPolicy.security_corps_law + 1),
        };

        return { domesticPolicy };
      },
    },
  ],
};
