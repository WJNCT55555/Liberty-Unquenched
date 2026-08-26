// Snap the Spanish Morocco protectorate boundary to the Morocco 10m admin-0
// boundary (coastline) so the two datasets share vertices and the visible gap
// closes. Only vertices within SNAP_THRESHOLD metres of the Morocco background
// boundary are moved; the protectorate's internal (southern interzonal / eastern
// Moulouya) borders are far from any international border and stay untouched.
import { readFile, writeFile } from 'node:fs/promises';

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const protectorate = await load('../public/date/morocco-spanish-protectorate.geojson');
const neighbors = await load('../public/date/world-neighbors.geojson');
const morocco = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'morocco');

function* ringsOf(g) {
  function* emit(poly) { for (const r of poly) if (Array.isArray(r) && r.length >= 2) yield r; }
  if (g.type === 'Polygon') yield* emit(g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) yield* emit(p);
}
function* segmentsOf(g) {
  for (const r of ringsOf(g)) for (let i = 0; i < r.length - 1; i++) yield [r[i], r[i + 1]];
}
const moroccoSegs = [...segmentsOf(morocco.geometry)];

function nearestPoint(px, py, segs) {
  let bestDist = Infinity, bestPoint = null;
  for (const [a, b] of segs) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - a[0]) * dx + (py - a[1]) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = a[0] + t * dx, cy = a[1] + t * dy;
    const cos = Math.cos((py * Math.PI) / 180);
    const d = Math.hypot((px - cx) * cos * 111320, (py - cy) * 110574);
    if (d < bestDist) { bestDist = d; bestPoint = [cx, cy]; }
  }
  return { dist: bestDist, point: bestPoint };
}

const SNAP_THRESHOLD = 5000; // metres
const snapDistances = [];

const snapped = structuredClone(protectorate);
let snappedCount = 0;

for (const feature of snapped.features) {
  const g = feature.geometry;
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 0; i < ring.length; i++) {
        const { dist, point } = nearestPoint(ring[i][0], ring[i][1], moroccoSegs);
        if (dist < SNAP_THRESHOLD && point) {
          ring[i] = point;
          snappedCount++;
          snapDistances.push(dist);
        }
      }
      // Remove consecutive duplicates introduced by snapping, keep ring closed.
      const clean = [];
      for (const p of ring) {
        const last = clean[clean.length - 1];
        if (!last || Math.abs(last[0] - p[0]) > 1e-9 || Math.abs(last[1] - p[1]) > 1e-9) clean.push(p);
      }
      const first = clean[0], lastPt = clean[clean.length - 1];
      if (first && lastPt && (Math.abs(first[0] - lastPt[0]) > 1e-9 || Math.abs(first[1] - lastPt[1]) > 1e-9)) clean.push(first);
      ring.length = 0;
      ring.push(...clean);
    }
  }
}

const sd = snapDistances.sort((a, b) => a - b);
const pct = q => sd[Math.min(sd.length - 1, Math.floor(q * sd.length))];
console.log(`Snapped ${snappedCount} vertices (threshold ${SNAP_THRESHOLD}m).`);
if (sd.length) console.log(`  snap distances: min=${sd[0].toFixed(0)}m median=${pct(0.5).toFixed(0)}m p90=${pct(0.9).toFixed(0)}m max=${sd[sd.length-1].toFixed(0)}m`);

const out = JSON.stringify(snapped);
for (const p of ['../public/date/morocco-spanish-protectorate.geojson', '../dist/date/morocco-spanish-protectorate.geojson']) {
  await writeFile(new URL(p, import.meta.url), out);
  console.log('Wrote', p);
}
