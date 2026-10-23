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
import { publicInstruction } from './public_instruction';
import { publicWorks } from './public_works';
import { commercePolicy } from './commerce_policy';
import { judiciaryReform } from './judiciary_reform';
import { healthReform } from './health_reform';

export const GOVERNMENT_AFFAIRS = [
  militaryPolicy,
  policeAffairs,
  agriculturalPolicy,
  laborRights,
  laborAffairs,
  // 公共教育部：1931 年 4 月起即存在的部，此前在代码里没有任何对应权限。
  publicInstruction,
  // 公共工程部（1931 年称 Fomento）与商业部：1933 年 12 月与工业分立，战时由 CNT 掌管。
  publicWorks,
  commercePolicy,
  // 司法改革：司法部此前是"有部长、没有牌"的两个部之一。
  judiciaryReform,
  // 公共卫生改革：卫生部是最后补上的一张，至此每个部委都有对应的政府卡。
  healthReform,
  fiscalPolicy,
  foreignPolicy,
  impeachPresident,
  // 经济改造的三张政府卡（docs/经济改造方案.md §6）：工业与商业、商业与贸易、财政手段。
  industryPolicy,
  tradePolicy,
  fiscalMeasures
];
