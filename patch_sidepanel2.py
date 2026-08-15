import re

with open('src/components/SidePanel.tsx', 'r') as f:
    code = f.read()

# Lines 1051-1067 is another partyNames. Let's replace it.
code = re.sub(r'const partyNames: Record<Party, \{ en: string, zh: string \}> = \{.*?\n  \};\n', '', code, flags=re.DOTALL)
# It was actually typed as Record<Exclude<Party, 'PRRevS'>, ...>? Let's just find `const partyNames:`
code = re.sub(r'const partyNames: Record<[^>]+> = \{.*?\n  \};\n', '', code, flags=re.DOTALL)
# Check again if there are any remaining `partyNames` declarations
code = re.sub(r'const partyNames = \{.*?\n  \};\n', '', code, flags=re.DOTALL)

# In the render loop for Support Breakdown:
# `const label = isZh ? partyNames[party].zh : partyNames[party].en;`
def repl2(m):
    return "getPartyName(state, party as any, isZh, true)"

code = re.sub(r'isZh \? partyNames\[party\]\.zh : partyNames\[party\]\.en', repl2, code)

# Let's fix the AllianceBar names in SidePanel:
#   <AllianceBar name={isZh ? partyNames.POUM.zh : partyNames.POUM.en} ... />
def repl_alliance(m):
    party = m.group(1)
    return f"getPartyName(state, '{party}', isZh, true)"

code = re.sub(r'isZh \? partyNames\.(\w+)\.zh : partyNames\.\1\.en', repl_alliance, code)

with open('src/components/SidePanel.tsx', 'w') as f:
    f.write(code)
