// Extract neighbor countries (France, Andorra, Morocco, Algeria, Tunisia, Gibraltar)
// from Natural Earth 10m admin-0 countries, matching the precision of
// public/date/iberia-complete.geojson (Natural Earth 10m admin-1).
//
// Natural Earth's 10m "France" feature is a sovereign-state MultiPolygon that
// bundles French Guiana, Reunion, Guadeloupe, Martinique, Mayotte, etc. We keep
// only metropolitan France + Corsica (the polygons that actually border Spain).
import { writeFile } from 'node:fs/promises';

const SOURCE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
const WANTED = new Set(['france', 'andorra', 'morocco', 'algeria', 'tunisia', 'gibraltar']);

console.log('Downloading', SOURCE_URL);
const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
const raw = await res.json();
console.log(`Downloaded ${raw.features.length} features`);

const nameOf = (f) => ((f.properties || {}).ADMIN || (f.properties || {}).NAME || '').toString().toLowerCase();

function polygonBBox(polygon) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of polygon) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return [minX, minY, maxX, maxY];
}

const overlaps = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];

// Metropolitan France + Corsica live within this box; all overseas territories fall outside it.
const EUROPE_BOX = [-6, 40, 10, 52];

function metropolitanFranceGeometry(geometry) {
  if (geometry.type !== 'MultiPolygon') return geometry;
  const kept = geometry.coordinates.filter((polygon) => overlaps(polygonBBox(polygon), EUROPE_BOX));
  return { type: 'MultiPolygon', coordinates: kept };
}

const keep = raw.features.filter((f) => WANTED.has(nameOf(f)));

const outFeatures = keep.map((f) => {
  const geometry = nameOf(f) === 'france' ? metropolitanFranceGeometry(f.geometry) : f.geometry;
  return {
    type: 'Feature',
    properties: {
      NAME: f.properties.NAME || f.properties.ADMIN,
      ADMIN: f.properties.ADMIN,
      ISO_A2: f.properties.ISO_A2,
    },
    geometry,
  };
});

for (const f of outFeatures) {
  const bb = f.geometry.type === 'MultiPolygon'
    ? f.geometry.coordinates.map(polygonBBox)
    : [polygonBBox(f.geometry.coordinates)];
  console.log(`- ${f.properties.NAME}: ${f.geometry.type}, polygons=${f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.length : 1}`,
    bb.map(b => `[${b[0].toFixed(1)},${b[1].toFixed(1)}..${b[2].toFixed(1)},${b[3].toFixed(1)}]`).join(' '));
}

if (outFeatures.length === 0) throw new Error('No neighbor countries matched.');

const out = { type: 'FeatureCollection', features: outFeatures };
const outPath = new URL('../public/date/world-neighbors.geojson', import.meta.url);
await writeFile(outPath, JSON.stringify(out));
console.log('Wrote', outPath.pathname, `(${(JSON.stringify(out).length / 1024).toFixed(1)} KB)`);
