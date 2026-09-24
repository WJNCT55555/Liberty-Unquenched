import { militaryPolicy } from './military_policy';
import { policeAffairs } from './police_affairs';
import { agriculturalPolicy } from './agricultural_policy';
import { laborRights } from './labor_rights';
import { laborAffairs } from './labor_affairs';
import { fiscalPolicy } from './fiscal_policy';
import { foreignPolicy } from './foreign_policy';
import { impeachPresident } from './impeach_president';
import { industryPolicy } from './industry_policy';
import { tradePolicy } from './trade_policy';
import { fiscalMeasures } from './fiscal_measures';

export const GOVERNMENT_AFFAIRS = [
  militaryPolicy,
  policeAffairs,
  agriculturalPolicy,
  laborRights,
  laborAffairs,
  fiscalPolicy,
  foreignPolicy,
  impeachPresident,
  // 经济改造的三张政府卡（docs/经济改造方案.md §6）：工业与商业、商业与贸易、财政手段。
  industryPolicy,
  tradePolicy,
  fiscalMeasures
];
