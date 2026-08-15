import re

with open('src/components/DomesticPoliticsModal.tsx', 'r') as f:
    code = f.read()

# Replace PARTY_NAMES
if 'getPartyName' not in code:
    code = code.replace("import { PARTY_COLORS, getPartySupport } from '../game/parties';",
                        "import { PARTY_COLORS, getPartySupport } from '../game/parties';\nimport { getPartyName, getPartyColor } from '../game/partyNames';")

# Delete PARTY_NAMES dictionary
code = re.sub(r'// Party full translations and names\nconst PARTY_NAMES: Record<Party \| \'CNT_FAI\', \{ en: string; zh: string \}> = \{.*?\n\};\n', '', code, flags=re.DOTALL)

# Find where it's used: isZh ? PARTY_NAMES[party].zh : PARTY_NAMES[party].en
code = code.replace("isZh ? PARTY_NAMES[party].zh : PARTY_NAMES[party].en", "getPartyName(state, party, isZh)")
code = code.replace("PARTY_COLORS[ministerParty] || '#9ca3af'", "getPartyColor(state, ministerParty)")
code = code.replace("PARTY_COLORS[party] || '#9ca3af'", "getPartyColor(state, party)")
code = code.replace("PARTY_COLORS[member] || '#9ca3af'", "getPartyColor(state, member)")
code = code.replace("isZh ? PARTY_NAMES[ministerParty].zh : PARTY_NAMES[ministerParty].en", "getPartyName(state, ministerParty, isZh)")

with open('src/components/DomesticPoliticsModal.tsx', 'w') as f:
    f.write(code)
