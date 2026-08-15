import re

with open('src/components/SidePanel.tsx', 'r') as f:
    code = f.read()

code = code.replace("            );\n          })}\n        </div>\n      </AccordionSection>", "            );\n          })()}\n        </div>\n      </AccordionSection>")

with open('src/components/SidePanel.tsx', 'w') as f:
    f.write(code)
