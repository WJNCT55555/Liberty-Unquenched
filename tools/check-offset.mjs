// Check whether the France (10m admin-0) and Spain (10m admin-1) Pyrenees
// borders coincide, or are offset / simplified relative to each other.
import { readFile } from 'node:fs/promises';

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const neighbors = await load('../public/date/world-neighbors.geojson');
const iberia = await load('../public/date/iberia-complete.geojson');

const france = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'france');
const spain = iberia.features.filter(f => f.properties.admin === 'Spain');

function* ringsOf(geometry) {
  function* emit(polygon) {
    for (const ring of polygon) if (Array.isArray(ring) && ring.length >= 2) yield ring;
  }
  if (geometry.type === 'Polygon') yield* emit(geometry.coordinates);
  else if (geometry.type === 'MultiPolygon') for (const p of geometry.coordinates) yield* emit(p);
}
function* segmentsOf(geometry) {
  for (const ring of ringsOf(geometry)) for (let i = 0; i < ring.length - 1; i++) yield [ring[i], ring[i + 1]];
}

const BAND = [-2.2, 42.2, 3.3, 43.6];
const inBand = (p) => p[0] >= BAND[0] && p[0] <= BAND[2] && p[1] >= BAND[1] && p[1] <= BAND[3];

// metres, equirectangular approximation
function ptSegDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  const cos = Math.cos((py * Math.PI) / 180);
  return Math.hypot((px - cx) * cos * 111320, (py - cy) * 110574);
}

// segment-to-segment distance (min of endpoint projections; fine for near-parallel borders)
function segSegDist(s1, s2) {
  return Math.min(
    ptSegDist(s1[0][0], s1[0][1], s2[0], s2[1]),
    ptSegDist(s1[1][0], s1[1][1], s2[0], s2[1]),
    ptSegDist(s2[0][0], s2[0][1], s1[0], s1[1]),
    ptSegDist(s2[1][0], s2[1][1], s1[0], s1[1]),
  );
}

const franceSegs = [...segmentsOf(france.geometry)].filter(s => inBand(s[0]) || inBand(s[1]));
const spainSegs = spain.flatMap(f => [...segmentsOf(f.geometry)]).filter(s => inBand(s[0]) || inBand(s[1]));
console.log(`France segments in band: ${franceSegs.length}, Spain segments in band: ${spainSegs.length}`);

// For each France segment, min distance to Spain segments -> keep "shared" (<5km)
const franceGaps = franceSegs.map(s => {
  let best = Infinity;
  for (const t of spainSegs) { const d = segSegDist(s, t); if (d < best) best = d; }
  return best;
});
const spainGaps = spainSegs.map(s => {
  let best = Infinity;
  for (const t of franceSegs) { const d = segSegDist(s, t); if (d < best) best = d; }
  return best;
});

const summarize = (name, arr) => {
  const near = arr.filter(d => d < 5000);
  const sorted = [...arr].sort((a, b) => a - b);
  const nearSorted = [...near].sort((a, b) => a - b);
  const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];
  console.log(`\n${name}: total=${arr.length}`);
  console.log(`  nearest-gap distribution (all): min=${sorted[0].toFixed(1)}m median=${pct(sorted,0.5).toFixed(1)}m p90=${pct(sorted,0.9).toFixed(1)}m max=${sorted[sorted.length-1].toFixed(1)}m`);
  if (near.length) {
    console.log(`  among segments within 5km ("shared border", n=${near.length}):`);
    console.log(`    min=${nearSorted[0].toFixed(1)}m median=${pct(nearSorted,0.5).toFixed(1)}m p90=${pct(nearSorted,0.9).toFixed(1)}m max=${nearSorted[nearSorted.length-1].toFixed(1)}m`);
  }
};
summarize('France -> Spain', franceGaps);
summarize('Spain -> France', spainGaps);

// Detect systematic offset: nearest-neighbour vertex displacement for the shared border.
const franceVerts = [];
for (const s of franceSegs) for (const p of s) franceVerts.push(p);
const spainVerts = [];
for (const s of spainSegs) for (const p of s) spainVerts.push(p);

const displacement = [];
for (const p of franceVerts) {
  let bestD = Infinity, bestQ = null;
  for (const q of spainVerts) {
    const d = Math.hypot((p[0]-q[0])*Math.cos(p[1]*Math.PI/180)*111320, (p[1]-q[1])*110574);
    if (d < bestD) { bestD = d; bestQ = q; }
  }
  if (bestD < 3000) displacement.push({ dlon: p[0]-bestQ[0], dlat: p[1]-bestQ[1], dist: bestD });
}
if (displacement.length) {
  const dlon = displacement.map(x => x.dlon).sort((a,b)=>a-b);
  const dlat = displacement.map(x => x.dlat).sort((a,b)=>a-b);
  const dist = displacement.map(x => x.dist).sort((a,b)=>a-b);
  const med = a => a[Math.floor(a.length/2)];
  console.log(`\nSystematic offset check (France verts vs nearest Spain vert, <3km, n=${displacement.length}):`);
  console.log(`  median dlon=${(med(dlon)*111320*Math.cos(42.7*Math.PI/180)).toFixed(0)}m E/W  dlat=${(med(dlat)*110574).toFixed(0)}m N/S`);
  console.log(`  median vertex offset magnitude=${med(dist).toFixed(1)}m`);
}
