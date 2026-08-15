const fs = require('fs');
let code = fs.readFileSync('src/game/types.ts', 'utf8');

code = code.replace(
  "export type CoalitionId =\n  | 'republican_socialist'",
  "export type CoalitionId =\n  | 'provisional_government'\n  | 'republican_socialist'"
);

code = code.replace(
  "activeCoalition: CoalitionState | null;",
  "activeCoalitions: CoalitionState[];\n  rulingCoalition: CoalitionId | null;"
);

fs.writeFileSync('src/game/types.ts', code);
