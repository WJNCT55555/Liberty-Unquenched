import re

with open('src/components/EndingScreen.tsx', 'r') as f:
    code = f.read()

code = code.replace("gameState", "state")

with open('src/components/EndingScreen.tsx', 'w') as f:
    f.write(code)
