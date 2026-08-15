import re

with open('src/game/effectPreview.ts', 'r') as f:
    code = f.read()

def repl(m):
    return """const partyLabels = PARTY_LABELS[force as 'CNT_FAI' | Party];
    const pEn = partyLabels ? partyLabels.label : humanizeKey(force);
    const pZh = partyLabels ? partyLabels.labelZh : humanizeKey(force);
    lines.push(effectLine(
      `${classLabels.label} support for ${pEn}`,
      `${classLabels.labelZh}对${pZh}支持率`,"""

code = re.sub(r'const partyLabels = PARTY_LABELS\[force\] \|\| humanizeKey\(force\);\s*lines\.push\(effectLine\(\s*`\$\{classLabels\.label\} support for \$\{partyNameEn\}`,\s*`\$\{classLabels\.labelZh\}对\$\{partyNameZh\}支持率`,', repl, code)

with open('src/game/effectPreview.ts', 'w') as f:
    f.write(code)
