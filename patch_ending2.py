import re

with open('src/components/EndingScreen.tsx', 'r') as f:
    code = f.read()

code = code.replace("p === 'CNT_FAI' ? (isZh ? 'CNT-FAI 工团' : 'CNT-FAI') : (isZh ? partyNames[p as Party]?.zh || p : partyNames[p as Party]?.en || p)",
                    "getPartyName(gameState, p as any, isZh, true)")

with open('src/components/EndingScreen.tsx', 'w') as f:
    f.write(code)
