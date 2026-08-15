import re

with open('src/components/SidePanel.tsx', 'r') as f:
    code = f.read()

# Replace state.cntVotingRate with (state.cntVotingRate || 0) in the few places it's used
code = code.replace("state.cntVotingRate.toFixed(0)", "(state.cntVotingRate || 0).toFixed(0)")
code = code.replace("state.cntVotingRate ===", "(state.cntVotingRate || 0) ===")
code = code.replace("state.cntVotingRate%", "(state.cntVotingRate || 0)%")
code = code.replace("state.cntVotingRate}%", "(state.cntVotingRate || 0)}%")

with open('src/components/SidePanel.tsx', 'w') as f:
    f.write(code)
