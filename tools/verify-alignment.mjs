// Verify alignment between the newly extracted 10m admin-0 neighbors and
// the local 10m admin-1 (Iberia) / custom protectorate data.
import { readFile } from 'node:fs/promises';

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));

const neighbors = await load('../public/date/world-neighbors.geojson');
const iberia = await load('../public/date/iberia-complete.geojson');
const protectorate = await load('../public/date/morocco-spanish-protectorate.geojson');

console.log('Protectorate features:', protectorate.features.map(f => f.properties.name).join(', '));
console.log('Iberia admins:', [...new Set(iberia.features.map(f => f.properties.admin))].join(', '));

// --- geometry helpers ---
function* ringsOf(geometry) {
  function* emit(polygon) {
    for (const ring of polygon) {
      if (Array.isArray(ring) && ring.length >= 2) yield ring;
    }
  }
  if (geometry.type === 'Polygon') yield* emit(geometry.coordinates);
  else if (geometry.type === 'MultiPolygon') for (const p of geometry.coordinates) yield* emit(p);
}

function* segmentsOf(geometry) {
  for (const ring of ringsOf(geometry)) {
    for (let i = 0; i < ring.length - 1; i++) {
      yield [ring[i], ring[i + 1]];
    }
  }
}

// point-to-segment distance in metres (equirectangular approx, fine at this scale)
function pointSegDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  const cos = Math.cos((py * Math.PI) / 180);
  return Math.hypot((px - cx) * cos * 111320, (py - cy) * 110574);
}

function inBox(p, bbox) {
  return p[0] >= bbox[0] && p[0] <= bbox[2] && p[1] >= bbox[1] && p[1] <= bbox[3];
}

// min distance from every vertex of A's segments (within box) to any segment of B (within box)
function vertexToSegmentGap(segmentsA, segmentsB, bbox) {
  const bSegs = segmentsB.filter(s => inBox(s[0], bbox) || inBox(s[1], bbox));
  if (!bSegs.length) return null;
  const dists = [];
  for (const [p1, p2] of segmentsA) {
    for (const p of [p1, p2]) {
      if (!inBox(p, bbox)) continue;
      let best = Infinity;
      for (const [q1, q2] of bSegs) {
        const d = pointSegDist(p[0], p[1], q1, q2);
        if (d < best) best = d;
      }
      dists.push(best);
    }
  }
  return dists;
}

function stats(dists) {
  if (!dists || !dists.length) return 'n/a';
  const sorted = [...dists].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const pct = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return `n=${sorted.length} min=${sorted[0].toFixed(1)}m median=${pct(0.5).toFixed(1)}m p90=${pct(0.9).toFixed(1)}m max=${sorted[sorted.length-1].toFixed(1)}m mean=${(sum/sorted.length).toFixed(1)}m`;
}

const france = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'france');
const spain = iberia.features.filter(f => f.properties.admin === 'Spain');

// Pyrenees band
const pyrenees = [-2.5, 42.2, 3.5, 43.9];
const franceSegs = [...segmentsOf(france.geometry)];
const spainSegs = spain.flatMap(f => [...segmentsOf(f.geometry)]);
console.log('\n[France -> Spain] Pyrenees vertex-to-Spain-boundary distance:');
console.log('  ' + stats(vertexToSegmentGap(franceSegs, spainSegs, pyrenees)));
console.log('[Spain -> France] Pyrenees vertex-to-France-boundary distance:');
console.log('  ' + stats(vertexToSegmentGap(spainSegs, franceSegs, pyrenees)));

// North Africa band (Spanish protectorate vs Morocco + Algeria)
const morocco = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'morocco');
const algeria = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'algeria');
const northAfrica = [-7.0, 33.0, 1.0, 36.5];
const protSegs = protectorate.features.flatMap(f => [...segmentsOf(f.geometry)]);
const maghrebSegs = [...segmentsOf(morocco.geometry), ...segmentsOf(algeria.geometry)];
console.log('\n[Protectorate -> Morocco/Algeria] vertex distance:');
console.log('  ' + stats(vertexToSegmentGap(protSegs, maghrebSegs, northAfrica)));
console.log('[Morocco/Algeria -> Protectorate] vertex distance:');
console.log('  ' + stats(vertexToSegmentGap(maghrebSegs, protSegs, northAfrica)));
