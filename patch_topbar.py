import re

with open('src/components/TopBar.tsx', 'r') as f:
    code = f.read()

if 'getPartyName' not in code:
    code = code.replace("import { FactionsBreakdown } from './FactionsBreakdown';",
                        "import { FactionsBreakdown } from './FactionsBreakdown';\nimport { getPartyName } from '../game/partyNames';")

code = code.replace("{isZh ? 'CNT-FAI 全国委员会' : 'CNT-FAI Comité Nacional'}",
                    "`${getPartyName(state, 'CNT_FAI', isZh, true)} ${isZh ? '全国委员会' : 'Comité Nacional'}`")

with open('src/components/TopBar.tsx', 'w') as f:
    f.write(code)
