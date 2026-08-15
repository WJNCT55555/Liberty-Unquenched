with open('src/components/SidePanel.tsx', 'r') as f:
    lines = f.readlines()

lines[427] = lines[427].replace("})}", "})()}")

with open('src/components/SidePanel.tsx', 'w') as f:
    f.writelines(lines)
