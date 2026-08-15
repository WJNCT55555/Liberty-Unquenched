with open('src/components/SidePanel.tsx', 'r') as f:
    lines = f.readlines()

lines[575] = lines[575].replace("})}", "})()}")

with open('src/components/SidePanel.tsx', 'w') as f:
    f.writelines(lines)
