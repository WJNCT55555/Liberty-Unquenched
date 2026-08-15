import re

with open('src/game/effectPreview.ts', 'r') as f:
    code = f.read()

if 'getPartyName' not in code:
    code = code.replace("import { StateDiff, computeDiff } from './stateDiff';",
                        "import { StateDiff, computeDiff } from './stateDiff';\nimport { getPartyName } from './partyNames';")

# In classSupportPreview:
# const partyLabels = PARTY_LABELS[force as 'CNT_FAI' | Party] || humanizeKey(force);
# return effectLine(
#   `${classLabels.label} support for ${partyLabels.label}`,
#   `${classLabels.labelZh}对${partyLabels.labelZh}支持率`,
#   resolveDelta(state, delta, options.scaledByDissent)
# );
#
# Replace with getPartyName logic.

code = code.replace("const partyLabels = PARTY_LABELS[force as 'CNT_FAI' | Party] || humanizeKey(force);",
                    "const partyNameEn = ['CNT_FAI', ...parties].includes(force as any) ? getPartyName(state, force as any, false, true) : humanizeKey(force);\n  const partyNameZh = ['CNT_FAI', ...parties].includes(force as any) ? getPartyName(state, force as any, true, true) : humanizeKey(force);")
code = code.replace("${partyLabels.label}", "${partyNameEn}")
code = code.replace("${partyLabels.labelZh}", "${partyNameZh}")
# wait, 'parties' isn't available? 
# let's just do `const isParty = PARTY_LABELS[force as any];` to check if it's a party.
code = code.replace("const partyNameEn = ['CNT_FAI', ...parties].includes(force as any) ? getPartyName(state, force as any, false, true) : humanizeKey(force);\n  const partyNameZh = ['CNT_FAI', ...parties].includes(force as any) ? getPartyName(state, force as any, true, true) : humanizeKey(force);",
                    "const isParty = !!PARTY_LABELS[force as 'CNT_FAI' | Party];\n  const partyNameEn = isParty ? getPartyName(state, force as any, false, true) : (force as any).label || force;\n  const partyNameZh = isParty ? getPartyName(state, force as any, true, true) : (force as any).labelZh || force;")

with open('src/game/effectPreview.ts', 'w') as f:
    f.write(code)
