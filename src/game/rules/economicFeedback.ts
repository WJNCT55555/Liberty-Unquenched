import type { GameState, SocialClass } from '../types';
import { adjustClassSupport, type ClassPoliticalForce } from '../utils';

/**
 * 经济困境 → 政治阵营重组的月度反馈。
 *
 * 设计参考 SDAAH `post_event` 中 `unemployed / inflation → pro_republic →
 * NSDAP` 的传导链，替换为西班牙语境：经济苦难一方面让工人阶级更激进
 * （CNT-FAI 与 FE 同时受益），另一方面让恐惧混乱的小资产阶级抛弃改良派
 * 共和国、倒向威权右翼。
 *
 * 规则（每月结算时按当月指标判定，增量以 1/12 为步长，与 SDAAH 的
 * `−4/12`、`−5/12` 保持同一量级）：
 *  - 失业率 > 15：小资产阶级 → AP（CEDA 核心）每月 +4/12；
 *    工人/雇农 → CNT-FAI 每月 +1/12；工人/雇农 → FE（FE 已成立时）每月 +1/12。
 *  - 通胀率 >= 8：小资产阶级对 PSOE 每月 −4/12，其中转向 FE（FE 已成立时）+4/12。
 */
export const ECONOMIC_FEEDBACK_RULES = {
  /** 失业率高于该值时触发“苦难激进化”。 */
  unemploymentThreshold: 15,
  /** 通胀率达到该值时触发“生活成本政治冲击”。 */
  inflationThreshold: 8,
  /** 月度份额分母（与 SDAAH 的 /12 一致）。 */
  monthlyDivisor: 12,
  /** 失业 >15：小资产阶级 → AP（CEDA）。 */
  unemploymentPettyBourgeoisieToAP: 4 / 12,
  /** 失业 >15：工人/雇农 → CNT-FAI。 */
  unemploymentWorkerToCNT: 1 / 12,
  /** 失业 >15：工人/雇农 → FE（需 FE 已成立）。 */
  unemploymentWorkerToFE: 1 / 12,
  /** 通胀 >=8：小资产阶级离开 PSOE。 */
  inflationPettyBourgeoisieFromPSOE: -4 / 12,
  /** 通胀 >=8：小资产阶级 → FE（需 FE 已成立）。 */
  inflationPettyBourgeoisieToFE: 4 / 12,
} as const;

/**
 * 返回应用本月经济反馈后的 `classes`；纯函数，不修改入参。
 * 由月度管线在国民经济结算与政策结算之后调用。
 */
export const calculateEconomicPoliticalFeedback = (
  state: GameState,
): GameState['classes'] => {
  const rules = ECONOMIC_FEEDBACK_RULES;
  const unemployment = state.unemployment_rate ?? 0;
  const inflation = state.inflation_rate ?? 0;
  // FE 未成立（且尚未并入 FE de las JONS）时，其支持度只是占位数据，
  // 不应被写入，否则会在成立当天凭空继承累积值。
  const falangeFounded = Boolean(state.fe_founded || state.falange_jons);

  let classes = state.classes;

  const apply = (socialClass: SocialClass, force: ClassPoliticalForce, delta: number) => {
    if (delta === 0) return;
    if (force === 'FE' && !falangeFounded) return;
    classes = adjustClassSupport(classes, socialClass, force, delta);
  };

  if (unemployment > rules.unemploymentThreshold) {
    apply('PequenaBurguesia', 'AP', rules.unemploymentPettyBourgeoisieToAP);
    apply('Obreros', 'CNT_FAI', rules.unemploymentWorkerToCNT);
    apply('Braceros', 'CNT_FAI', rules.unemploymentWorkerToCNT);
    apply('Obreros', 'FE', rules.unemploymentWorkerToFE);
    apply('Braceros', 'FE', rules.unemploymentWorkerToFE);
  }

  if (inflation >= rules.inflationThreshold) {
    apply('PequenaBurguesia', 'PSOE', rules.inflationPettyBourgeoisieFromPSOE);
    apply('PequenaBurguesia', 'FE', rules.inflationPettyBourgeoisieToFE);
  }

  return classes;
};
