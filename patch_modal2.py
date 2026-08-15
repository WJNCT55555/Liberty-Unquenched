import re

with open('src/components/DomesticPoliticsModal.tsx', 'r') as f:
    code = f.read()

# Replace the specific hardcoded label with getPartyName
code = code.replace(
'''          {ministerParty === 'CNT' 
            ? (isZh ? '工团参政' : 'CNT-FAI') ''',
'''          {ministerParty === 'CNT' 
            ? getPartyName(state, 'CNT_FAI', isZh, true) '''
)

with open('src/components/DomesticPoliticsModal.tsx', 'w') as f:
    f.write(code)
