import re

with open('src/game/effectPreview.ts', 'r') as f:
    code = f.read()

def repl_class(m):
    return """export const classSupportPreview = (
  state: GameState,
  socialClass: SocialClass,
  force: ClassPoliticalForce | 'PRRevS',
  delta: number,
  options: { scaledByDissent?: boolean } = {}
): EffectPreviewLine => {
  const classLabels = CLASS_LABELS[socialClass];
  
  let partyNameEn = force;
  let partyNameZh = force;
  if (['CNT_FAI', 'POUM', 'PCE', 'PSOE', 'PS', 'ERC', 'IR', 'UR', 'PNV', 'PRR', 'DLR', 'AP', 'RE', 'CT', 'FE', 'PRRevS', 'Other'].includes(force)) {
    partyNameEn = getPartyName(state, force as any, false, true);
    partyNameZh = getPartyName(state, force as any, true, true);
  }

  return effectLine(
    `${classLabels.label} support for ${partyNameEn}`,
    `${classLabels.labelZh}对${partyNameZh}支持率`,
    resolveDelta(state, delta, options.scaledByDissent)
  );
};"""

code = re.sub(r'export const classSupportPreview = \([\s\S]*?\n\};\n', repl_class, code)

with open('src/game/effectPreview.ts', 'w') as f:
    f.write(code)
