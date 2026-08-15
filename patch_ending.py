import re

with open('src/components/EndingScreen.tsx', 'r') as f:
    code = f.read()

# Imports
if 'getPartyName' not in code:
    code = code.replace("import { PARTY_COLORS } from '../game/constants';",
                        "import { PARTY_COLORS } from '../game/constants';\nimport { getPartyName, getPartyColor } from '../game/partyNames';")

code = re.sub(r'const partyNames: Record<Party \| \'CNT_FAI\', \{ en: string, zh: string \}> = \{.*?\n  \};\n', '', code, flags=re.DOTALL)
code = re.sub(r'const partyNames: Record<Party, \{ en: string, zh: string \}> = \{.*?\n  \};\n', '', code, flags=re.DOTALL)

def repl(m):
    party = m.group(1)
    # The ending screen may not have `state`, but it has `gameState`
    return f"getPartyName(gameState, '{party}', isZh, true)"

code = re.sub(r'isZh \? partyNames\.(\w+)\.zh : partyNames\.\1\.en', repl, code)
code = code.replace("isZh ? partyNames[p].zh : partyNames[p].en", "getPartyName(gameState, p as any, isZh)")
code = code.replace("PARTY_COLORS[p] || '#9ca3af'", "getPartyColor(gameState, p as any)")

with open('src/components/EndingScreen.tsx', 'w') as f:
    f.write(code)
