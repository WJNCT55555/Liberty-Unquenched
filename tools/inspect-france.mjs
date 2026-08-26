// Inspect how Natural Earth 10m admin-0 represents France (and friends)
const SOURCE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
const res = await fetch(SOURCE_URL);
const raw = await res.json();

const franceFeatures = raw.features.filter(f => {
  const p = f.properties || {};
  const name = (p.ADMIN || p.NAME || '').toLowerCase();
  return name === 'france' || (p.ISO_A2 === 'FR') || (p.NAME || '').toLowerCase().includes('french');
});

for (const f of franceFeatures) {
  const p = f.properties;
  const bbox = f.bbox || [];
  console.log(JSON.stringify({
    NAME: p.NAME, ADMIN: p.ADMIN, ISO_A2: p.ISO_A2, ISO_A3: p.ISO_A3,
    TYPE: p.TYPE, CONTINENT: p.CONTINENT, SUBREGION: p.SUBREGION,
    geometryType: f.geometry?.type,
    bbox: bbox.map(n => n.toFixed(2)),
  }));
}
