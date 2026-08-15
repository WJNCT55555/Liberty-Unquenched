import re

with open('src/components/DomesticPoliticsModal.tsx', 'r') as f:
    code = f.read()

pattern_present = r"const presentParties = \['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT_FAI'\] as const;"

replacement_present = """const allParties = ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT_FAI'] as const;
  const presentParties = allParties.filter(p => {
    if (p === 'POUM' && !state.poum_founded) return false;
    if (p === 'FE' && !state.fe_founded) return false;
    if (p === 'PS' && !state.ps_founded) return false;
    return true;
  });"""

code = code.replace("const presentParties = ['POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'CNT_FAI'] as const;", replacement_present)

with open('src/components/DomesticPoliticsModal.tsx', 'w') as f:
    f.write(code)
