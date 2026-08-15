with open('src/components/SidePanel.tsx', 'r') as f:
    lines = f.readlines()

# line 972 might be the one, let's fix any line that contains map
for i in range(970, 975):
    if "})()" in lines[i]:
        lines[i] = lines[i].replace("})()}", "})}")

with open('src/components/SidePanel.tsx', 'w') as f:
    f.writelines(lines)
