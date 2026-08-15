with open('src/components/SidePanel.tsx', 'r') as f:
    lines = f.readlines()

for i in [297, 335]:
    if lines[i].strip() == "})}":
        lines[i] = lines[i].replace("})}", "})()}")

with open('src/components/SidePanel.tsx', 'w') as f:
    f.writelines(lines)
