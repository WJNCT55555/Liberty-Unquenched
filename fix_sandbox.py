import re

with open('src/components/SandboxMenu.tsx', 'r') as f:
    code = f.read()

# Replace the specific closing tag
code = code.replace(
'''                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-20 text-ink/40 text-center uppercase tracking-wider text-[10px] leading-relaxed">''',
'''                      </div>
                    )})() : (
                      <div className="flex flex-col items-center justify-center h-20 text-ink/40 text-center uppercase tracking-wider text-[10px] leading-relaxed">'''
)

with open('src/components/SandboxMenu.tsx', 'w') as f:
    f.write(code)
