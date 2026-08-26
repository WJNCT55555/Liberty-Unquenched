// Analyze how the Spanish Morocco protectorate boundary relates to the
// Morocco / Algeria 10m admin-0 background, to plan the "snap".
import { readFile } from 'node:fs/promises';

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const protectorate = await load('../public/date/morocco-spanish-protectorate.geojson');
const neighbors = await load('../public/date/world-neighbors.geojson');

const morocco = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'morocco');
const algeria = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'algeria');

function bboxOf(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (ring) => { for (const [x, y] of ring) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; } };
  const rings = [];
  const emit = (poly) => poly.forEach(ring => rings.push(ring));
  if (geometry.type === 'Polygon') emit(geometry.coordinates);
  else if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach(emit);
  rings.forEach(walk);
  return [minX, minY, maxX, maxY];
}

console.log('Protectorate features:');
for (const f of protectorate.features) {
  const bb = bboxOf(f.geometry);
  console.log(`  ${f.properties.name.padEnd(14)} ${f.geometry.type.padEnd(12)} lon[${bb[0].toFixed(2)},${bb[2].toFixed(2)}] lat[${bb[1].toFixed(2)},${bb[3].toFixed(2)}]`);
}
console.log('Morocco bbox:', bboxOf(morocco.geometry).map(n => n.toFixed(2)).join(' .. '));
console.log('Algeria bbox:', bboxOf(algeria.geometry).map(n => n.toFixed(2)).join(' .. '));

// Build boundary segments (outer rings only) for protectorate, Morocco, Algeria.
function* ringsOf(geometry) {
  function* emit(poly) { for (const r of poly) if (Array.isArray(r) && r.length >= 2) yield r; }
  if (geometry.type === 'Polygon') yield* emit(geometry.coordinates);
  else if (geometry.type === 'MultiPolygon') for (const p of geometry.coordinates) yield* emit(p);
}
function* segmentsOf(geometry) {
  for (const r of ringsOf(geometry)) for (let i = 0; i < r.length - 1; i++) yield [r[i], r[i + 1]];
}

const protSegs = protectorate.features.flatMap(f => [...segmentsOf(f.geometry)]);
const maghrebSegs = [...segmentsOf(morocco.geometry), ...segmentsOf(algeria.geometry)];

function ptSegDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  const cos = Math.cos((py * Math.PI) / 180);
  return Math.hypot((px - cx) * cos * 111320, (py - cy) * 110574);
}
function segSegDist(s1, s2) {
  return Math.min(
    ptSegDist(s1[0][0], s1[0][1], s2[0], s2[1]),
    ptSegDist(s1[1][0], s1[1][1], s2[0], s2[1]),
    ptSegDist(s2[0][0], s2[0][1], s1[0], s1[1]),
    ptSegDist(s2[1][0], s2[1][1], s1[0], s1[1]),
  );
}

// For each protectorate segment, min distance to Maghreb background.
const dists = protSegs.map(s => {
  let best = Infinity;
  for (const t of maghrebSegs) { const d = segSegDist(s, t); if (d < best) best = d; }
  return best;
});

const thresholds = [500, 1000, 2000, 3000, 5000, 10000];
console.log('\nProtectorate segments by min-distance to Morocco/Algeria background:');
for (const th of thresholds) {
  const n = dists.filter(d => d < th).length;
  console.log(`  < ${String(th).padStart(5)}m : ${n} / ${dists.length}`);
}
const near = dists.filter(d => d < 5000).sort((a, b) => a - b);
if (near.length) {
  const pct = q => near[Math.min(near.length - 1, Math.floor(q * near.length))];
  console.log(`\n  near (<5km) distribution n=${near.length}: min=${near[0].toFixed(0)}m median=${pct(0.5).toFixed(0)}m p90=${pct(0.9).toFixed(0)}m max=${near[near.length-1].toFixed(0)}m`);
}
