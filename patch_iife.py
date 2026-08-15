import re

with open('src/components/SidePanel.tsx', 'r') as f:
    code = f.read()

# I will find all `(() => { ... })` and replace `})}` with `})()}` if it is missing.
# Let's just find specific lines and replace them.

lines_to_fix = [
    "          })}",
    "            })}",
]

# We need to be careful not to replace array.map() closing tags!
# For array map, it's `items.map((item) => { ... })}`
# So we must look for the start `(() => {` to pair it up, or just manually patch the known locations.

# Let's write a script that counts `(` and `{` to be absolutely sure, or just regex the known blocks.

blocks = [
    # next election
    (r"const nextElectionText = isZh \? '[^']+' : '[^']+';\n\s*return \([\s\S]*?\);\n\s*\})\}", "})()}"),
    # cnt stance
    (r"const stanceText = isZh \? stanceLabels\[state\.cntStance\]\?\.zh : stanceLabels\[state\.cntStance\]\?\.en;\n\s*return \([\s\S]*?\);\n\s*\})\}", "})()}"),
    # cnt voting rate flow
    (r"const totalLeftSupport = pceSupport \+ poumSupport \+ psoeSupport \+ irSupport \+ ercSupport;[\s\S]*?return \([\s\S]*?\);\n\s*\}\n\s*\})\}", "})()}"),
]

for pattern, replacement in blocks:
    def repl(m):
        return m.group(0)[:-2] + ")()}"
    code = re.sub(pattern, repl, code)

with open('src/components/SidePanel.tsx', 'w') as f:
    f.write(code)

