import re

with open('src/components/SidePanel.tsx', 'r') as f:
    code = f.read()

code = code.replace("isZh ? partyNames[party as 'CNT_FAI' | Party].zh : partyNames[party as 'CNT_FAI' | Party].en", 
                    "getPartyName(state, party as any, isZh, true)")

with open('src/components/SidePanel.tsx', 'w') as f:
    f.write(code)
