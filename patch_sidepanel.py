import re

with open('src/components/SidePanel.tsx', 'r') as f:
    code = f.read()

# Add imports for getPartyName, getPartyColor
if 'getPartyName' not in code:
    code = code.replace("import { PARTY_COLORS, CLASS_COLORS, CLASS_INFO } from '../game/constants';",
                        "import { PARTY_COLORS, CLASS_COLORS, CLASS_INFO } from '../game/constants';\nimport { getPartyName, getPartyColor } from '../game/partyNames';")

# Remove partyNames object
code = re.sub(r'const partyNames: Record<Party, \{ en: string, zh: string \}> = \{.*?\n  \};\n', '', code, flags=re.DOTALL)

# Find all places using `partyNames[party].zh` and replace with `getPartyName(state, party, isZh, true)` (or short name)
# Actually the SidePanel uses `isZh ? partyNames.POUM.zh : partyNames.POUM.en`
def replace_party_names(m):
    party = m.group(1)
    return f"getPartyName(state, '{party}', isZh, true)"

code = re.sub(r'isZh \? partyNames\.(\w+)\.zh : partyNames\.\1\.en', replace_party_names, code)

# Fix CNT_FAI label explicitly
code = code.replace('state.isPRRevSFormed ? "PRRevS" : "CNT-FAI"', "getPartyName(state, 'CNT_FAI', isZh, true)")
code = code.replace("name={isZh ? '革命共和工团党 (PRRevS)' : 'PRRevS'}", "name={getPartyName(state, 'CNT_FAI', isZh, true)}")
code = code.replace('state.isPRRevSFormed ? PARTY_COLORS[\'PS\'] : PARTY_COLORS[\'CNT_FAI\']', "getPartyColor(state, 'CNT_FAI')")
code = code.replace('PARTY_COLORS[member as Party]', 'getPartyColor(state, member as any)')
code = code.replace('PARTY_COLORS[party]', 'getPartyColor(state, party as any)')

# For lines like `title={party}` -> we might want to keep or change?
# There are specific lines:
# `const pLabel = member === 'CNT_FAI' ? (state.isPRRevSFormed ? 'PRRevS' : 'CNT-FAI') : member;`
code = code.replace("const pLabel = member === 'CNT_FAI' ? (state.isPRRevSFormed ? 'PRRevS' : 'CNT-FAI') : member;", 
                    "const pLabel = getPartyName(state, member as any, isZh, true);")
code = code.replace("const pColor = member === 'CNT_FAI' ? (state.isPRRevSFormed ? PARTY_COLORS['PS'] : PARTY_COLORS['CNT_FAI']) : (PARTY_COLORS[member as Party] || '#9ca3af');",
                    "const pColor = getPartyColor(state, member as any);")

# Remove the other inline definitions
code = re.sub(r"CNT_FAI: \{ en: state\.isPRRevSFormed \? 'PRRevS' : 'CNT-FAI'.*?\},", "", code)
code = re.sub(r"PRRevS: \{ en: 'PRRevS', zh: '革命共和工团党' \}", "", code)

# Let's write it back
with open('src/components/SidePanel.tsx', 'w') as f:
    f.write(code)
