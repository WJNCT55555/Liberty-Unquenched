// Make the SVG (province) layer's Gibraltar precise and add Andorra as a
// province. Both are pulled from world-neighbors.geojson (Natural Earth 10m
// admin-0), which matches the 10m precision of the rest of iberia-complete.
import { readFile, writeFile } from 'node:fs/promises';

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const iberia = await load('../public/date/iberia-complete.geojson');
const neighbors = await load('../public/date/world-neighbors.geojson');

const wnGibraltar = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'gibraltar');
const wnAndorra = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'andorra');
if (!wnGibraltar || !wnAndorra) throw new Error('Missing Gibraltar/Andorra in world-neighbors.geojson');

// 1) Replace the coarse rectangular Gibraltar geometry with the precise one.
let gibraltar = iberia.features.find(f => (f.properties.name || '').toLowerCase() === 'gibraltar');
if (!gibraltar) throw new Error('Gibraltar feature not found in iberia-complete');
const before = JSON.stringify(gibraltar.geometry.coordinates).length;
gibraltar.geometry = { type: wnGibraltar.geometry.type, coordinates: wnGibraltar.geometry.coordinates };
console.log(`Gibraltar geometry replaced (${before} -> ${JSON.stringify(gibraltar.geometry.coordinates).length} chars of coords).`);

// 2) Add Andorra as a province feature (idempotent: replace if already present).
const andorraFeature = {
  type: 'Feature',
  properties: {
    name: 'Andorra',
    name_alt: null,
    name_local: 'Andorra',
    name_es: 'Andorra',
    name_zh: '安道尔',
    admin: 'Andorra',
    adm1_code: 'AND-001',
    iso_a2: 'AD',
    iso_3166_2: 'AD',
    type: 'Principality',
    type_en: 'Principality',
    latitude: 42.55,
    longitude: 1.58,
    wikidataid: 'Q228',
  },
  geometry: { type: wnAndorra.geometry.type, coordinates: wnAndorra.geometry.coordinates },
};

const idx = iberia.features.findIndex(f => (f.properties.name || '').toLowerCase() === 'andorra');
if (idx >= 0) {
  iberia.features[idx] = andorraFeature;
  console.log('Andorra feature replaced.');
} else {
  iberia.features.push(andorraFeature);
  console.log('Andorra feature appended.');
}

const out = JSON.stringify(iberia);
for (const p of ['../public/date/iberia-complete.geojson', '../dist/date/iberia-complete.geojson']) {
  await writeFile(new URL(p, import.meta.url), out);
  console.log('Wrote', p, `(${(out.length / 1024 / 1024).toFixed(2)} MB)`);
}
