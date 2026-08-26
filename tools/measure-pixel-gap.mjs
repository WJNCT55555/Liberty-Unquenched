// Rigorous Pyrenees gap measurement: densely sample both borders, project them
// with the map's actual projection, and report the pixel gap along the SHARED
// border only (excluding each country's own coasts).
import { readFile } from 'node:fs/promises';
import { geoMercator } from 'd3-geo';

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const neighbors = await load('../public/date/world-neighbors.geojson');
const iberia = await load('../public/date/iberia-complete.geojson');

const france = neighbors.features.find(f => (f.properties.NAME || '').toLowerCase() === 'france');
const spain = iberia.features.filter(f => f.properties.admin === 'Spain');

const projection = geoMercator().center([-3.7, 39.5]).scale(2600).translate([400, 300]);
const proj = (p) => { const q = projection(p); return q; };

function* ringsOf(g) {
  function* emit(poly) { for (const r of poly) if (Array.isArray(r) && r.length >= 2) yield r; }
  if (g.type === 'Polygon') yield* emit(g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) yield* emit(p);
}
function* segmentsOf(g) {
  for (const r of ringsOf(g)) for (let i = 0; i < r.length - 1; i++) yield [r[i], r[i + 1]];
}

const BAND = [-2.2, 42.2, 3.3, 43.6];
const inBand = (p) => p[0] >= BAND[0] && p[0] <= BAND[2] && p[1] >= BAND[1] && p[1] <= BAND[3];

function pxSegDist(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - a[0]) * dx + (py - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

// Build projected polylines as arrays of [x,y]
const franceSegs = [...segmentsOf(france.geometry)].filter(s => inBand(s[0]) || inBand(s[1])).map(s => [proj(s[0]), proj(s[1])]);
const spainSegs = spain.flatMap(f => [...segmentsOf(f.geometry)]).filter(s => inBand(s[0]) || inBand(s[1])).map(s => [proj(s[0]), proj(s[1])]);

// Densely sample a segment (n subdivisions) in projected space.
function sampleSeg(seg, n) {
  const [a, b] = seg;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return pts;
}

function gapOf(segsA, segsB, nearPx) {
  const dists = [];
  for (const s of segsA) {
    for (const p of sampleSeg(s, 8)) {
      let best = Infinity;
      for (const t of segsB) { const d = pxSegDist(p[0], p[1], t[0], t[1]); if (d < best) best = d; }
      if (best < nearPx) dists.push(best);
    }
  }
  return dists;
}

const NEAR = 3; // only count sample points that are within 3px of the other border
const franceGap = gapOf(franceSegs, spainSegs, NEAR);
const spainGap = gapOf(spainSegs, franceSegs, NEAR);

const report = (name, arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const pct = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  console.log(`${name} (sample points within ${NEAR}px of the other border):`);
  console.log(`  n=${s.length}  min=${s[0].toFixed(2)}px  median=${pct(0.5).toFixed(2)}px  p90=${pct(0.9).toFixed(2)}px  p99=${pct(0.99).toFixed(2)}px  max=${s[s.length-1].toFixed(2)}px`);
};
report('France border -> Spain border', franceGap);
report('Spain border -> France border', spainGap);
