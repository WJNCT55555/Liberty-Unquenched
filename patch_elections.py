import re

files_to_patch = [
    'src/game/events/elections_1931_results.tsx',
    'src/game/events/elections_1933.ts',
    'src/game/events/elections_1936.ts'
]

for filepath in files_to_patch:
    with open(filepath, 'r') as f:
        code = f.read()

    if 'getPartyName' not in code:
        # these files might have specific imports
        code = code.replace("import { PARTY_COLORS } from '../constants';",
                            "import { PARTY_COLORS } from '../constants';\nimport { getPartyName } from '../partyNames';")

    code = re.sub(r'const partyNames: Record<Party, \{ en: string, zh: string \}> = \{.*?\n    \};\n', '', code, flags=re.DOTALL)
    
    def repl(m):
        # We need to pass `state` to getPartyName. 
        # For elections, `state` is passed into `effect: (state) => {` where this mapping happens usually.
        # Actually it's inside `description` which is a string or function? No, `results` is inside `effect` or `options`.
        return "getPartyName(state, party as any, isZh)"
    
    code = re.sub(r'isZh \? partyNames\[party as Party\]\.zh : partyNames\[party as Party\]\.en', repl, code)

    with open(filepath, 'w') as f:
        f.write(code)
