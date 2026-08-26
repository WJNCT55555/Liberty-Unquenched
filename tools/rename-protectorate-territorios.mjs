// Rename Spanish Morocco protectorate provinces to their historical
// Spanish "Territorio" names (matching the already-present historicalRegion
// field). Keeps the feature `id`/geometry; only updates display name fields.
import { readFile, writeFile } from 'node:fs/promises';

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const protectorate = await load('../public/date/morocco-spanish-protectorate.geojson');

const RENAME = {
  'Nador':       { name: 'Kert',    name_zh: '克尔特' },
  'Chefchaouen': { name: 'Gomara',  name_zh: '戈马拉' },
  'Larache':     { name: 'Lucus',   name_zh: '卢库斯' },
  'Tétouan':     { name: 'Yebala',  name_zh: '耶巴拉' },
  'AlHoceïma':   { name: 'Rif',     name_zh: '里夫' },
};

for (const f of protectorate.features) {
  const old = f.properties.name;
  const target = RENAME[old];
  if (!target) {
    console.log('SKIP (no rename entry):', old);
    continue;
  }
  console.log(`${old.padEnd(12)} -> ${target.name.padEnd(8)} (${target.name_zh})  [historicalRegion: ${f.properties.historicalRegion}]`);
  f.properties.name = target.name;
  f.properties.name_zh = target.name_zh;
  f.properties.name_alt = f.properties.name_alt || old; // keep old city/region hint
}

const out = JSON.stringify(protectorate);
for (const p of ['../public/date/morocco-spanish-protectorate.geojson', '../dist/date/morocco-spanish-protectorate.geojson']) {
  await writeFile(new URL(p, import.meta.url), out);
  console.log('Wrote', p);
}
