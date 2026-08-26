// Audit helper: report imports in src/game/events files that are never referenced
// after the import statement. Read-only; run with: node tools/check_unused_imports.cjs
const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'src', 'game', 'events');
const files = [];

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})(root);

let foundAny = false;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const importRe = /import\s+(?:type\s+)?(?:\{([^}]*)\}|([^{][\s\S]*?))\s+from\s+['"][^'"]+['"]/g;
  const body = src.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
  let m;
  const unused = new Set();
  while ((m = importRe.exec(src))) {
    const names = (m[1] || m[2] || '');
    for (let part of names.split(',')) {
      part = part.trim();
      if (!part) continue;
      let name = part.split(/\s+as\s+/).pop().trim();
      name = name.replace(/^\{/, '').replace(/\}$/, '').trim(); // strip stray braces from mixed default+named imports
      if (name === 'default' || !name) continue;
      name = name.replace(/^type\s+/, '').trim();
      if (!name) continue;
      const re = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
      if (!re.test(body)) unused.add(name);
    }
  }
  if (unused.size) {
    foundAny = true;
    console.log(f.replace(process.cwd(), '') + ' -> unused: ' + [...unused].join(', '));
  }
}
if (!foundAny) console.log('No unused imports found.');
