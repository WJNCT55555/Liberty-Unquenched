import re

with open('src/game/effectPreview.ts', 'r') as f:
    code = f.read()

code = code.replace("let partyNameEn = force;", "let partyNameEn: string = force;")
code = code.replace("let partyNameZh = force;", "let partyNameZh: string = force;")

with open('src/game/effectPreview.ts', 'w') as f:
    f.write(code)
