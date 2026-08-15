/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Province, MapFaction as Faction, Army } from './types_map';
import { FACTION_COLORS, UI_COLORS, MAJOR_CITIES, PROVINCE_ADJACENCY, CultureGroup, PROVINCE_CULTURES, PROVINCE_REGIONS, getCultureGridCoords, isPortugalProvince } from './map_constants';
import { ZoomIn, ZoomOut, RotateCcw, Swords, Map, Mountain, Users, Shield } from 'lucide-react';
import * as d3 from 'd3';

export const STRATEGIC_COLORS = [
  '#FAF5E6', // 0 (Beige)
  '#FAF0DA', // 1
  '#F6E3CA', // 2
  '#F1D4B8', // 3
  '#EBC2A4', // 4
  '#E3AE8E', // 5
  '#DB9779', // 6
  '#CD7A62', // 7
  '#BD5A4E', // 8
  '#A93A39', // 9
  '#8F1722'  // 10 (Dark red)
];


export const TERRAIN_COLORS: Record<'urban' | 'plains' | 'mountains' | 'forest', string> = {
  urban: '#7E858A',     // Cold Slate Grey
  plains: '#D7C49E',    // Sun-baked Clay/Starch yellow
  mountains: '#8E7F6B', // Rugged Earthy Ochre
  forest: '#506751',    // Olive Pine Green
};

interface ProvinceMapProps {
  provinces: { [key: string]: Province };
  armies: Army[];
  selectedId: string | null;
  selectedArmyId: string | null;
  selectedArmyIds: string[];
  onSelect: (id: string | null) => void;
  onSelectArmy: (id: string | null, isShift?: boolean) => void;
  onMoveArmy: (armyId: string, targetProvinceId: string) => void;
  canMoveSelectedArmy: boolean;
  lang: 'en' | 'zh';
}

interface InsetConfig {
  ids: string[];
  match: (name: string) => boolean;
  scale: number;
  label: string;
  box: { x: number; y: number; w: number; h: number };
  collapsedBox?: { x: number; y: number; w: number; h: number };
}

interface Segment {
  p1: [number, number];
  p2: [number, number];
  key: string;
}

function getSegments(geometry: any): Segment[] {
  const segments: Segment[] = [];
  if (!geometry) return segments;

  const processRing = (ring: [number, number][]) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const pt1 = ring[i];
      const pt2 = ring[i + 1];
      const key1 = `${pt1[0].toFixed(4)},${pt1[1].toFixed(4)}`;
      const key2 = `${pt2[0].toFixed(4)},${pt2[1].toFixed(4)}`;
      const key = key1 < key2 ? `${key1}_${key2}` : `${key2}_${key1}`;
      segments.push({ p1: pt1, p2: pt2, key });
    }
  };

  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring: any) => {
      if (Array.isArray(ring)) {
        processRing(ring);
      }
    });
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon: any) => {
      if (Array.isArray(polygon)) {
        polygon.forEach((ring: any) => {
          if (Array.isArray(ring)) {
            processRing(ring);
          }
        });
      }
    });
  }
  return segments;
}

const DIMENSIONS = { width: 800, height: 600 };
const BASE_URL = (import.meta as any).env?.BASE_URL || '/';

export const ProvinceMap: React.FC<ProvinceMapProps> = ({ 
  provinces, 
  armies, 
  selectedId, 
  selectedArmyId,
  selectedArmyIds = [],
  onSelect,
  onSelectArmy,
  onMoveArmy,
  canMoveSelectedArmy,
  lang
}) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [riverData, setRiverData] = useState<any>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'political' | 'terrain' | 'ethnic' | 'region' | 'strategic'>('political');
  
  const projection = useMemo(() => {
    return d3.geoMercator()
      .center([-3.7, 39.5]) 
      .scale(2600) // Adjusted for more prominent view
      .translate([DIMENSIONS.width / 2, DIMENSIONS.height / 2]);
  }, []);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  const provinceCenters = useMemo(() => {
    if (!geoData || !pathGenerator) return {};
    const centers: Record<string, [number, number]> = {};
    
    geoData.features.forEach((feature: any) => {
      const properties = feature.properties || {};
      const provinceName = properties.name || properties.name_es || properties.NAME_1 || properties.ID_1 || '';
      
      const provinceId = Object.keys(provinces).find(id => {
        const province = provinces[id];
        const normalizedId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedProvName = (province.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedInName = provinceName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedInNameEs = (properties.name_es || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        return normalizedId === normalizedInName || normalizedProvName === normalizedInName ||
               normalizedId === normalizedInNameEs || normalizedProvName === normalizedInNameEs;
      });

      if (provinceId) {
        centers[provinceId] = pathGenerator.centroid(feature) as [number, number];
      }
    });

    return centers;
  }, [geoData, provinces]);

  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({
    canarias: false,
    azores: true,
    madeira: true,
  });

  // Inset Map Configuration
  const INSET_CONFIG = useMemo<Record<string, InsetConfig>>(() => ({
    canarias: { 
      ids: ['laspalmas', 'santacruzdetenerife', 'canarias'], 
      match: (name: string) => /palmas|tenerife|canaria|hierro|gomera|lanzarote|fuerteventura/i.test(name),
      scale: 1.0, 
      label: 'ISLAS CANARIAS',
      box: { x: 20, y: 380, w: 220, h: 120 },
      collapsedBox: { x: 20, y: 470, w: 100, h: 30 }
    },
    azores: { 
      ids: ['azores'], 
      match: (name: string) => /azores|açores/i.test(name),
      scale: 0.8,
      label: 'AÇORES',
      box: { x: 20, y: 40, w: 140, h: 100 },
      collapsedBox: { x: 20, y: 40, w: 80, h: 30 }
    },
    madeira: { 
      ids: ['madeira'], 
      match: (name: string) => /madeira/i.test(name),
      scale: 3.5, 
      label: 'MADEIRA',
      box: { x: 20, y: 200, w: 100, h: 80 },
      collapsedBox: { x: 20, y: 250, w: 80, h: 30 }
    }
  }), []);

  const toggleInset = (key: string) => {
    setCollapsedStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const [currentScale, setCurrentScale] = useState<number>(1);
  const [normalizedPaths, setNormalizedPaths] = useState<any[]>([]);

  // Keep the map box an EXACT 4:3 rectangle regardless of the available flex
  // space. The background (grid/world) is drawn on a <canvas> stretched to
  // 100%×100% while the provinces are drawn on an <svg viewBox="0 0 800 600"
  // preserveAspectRatio="xMidYMid meet">. Those two layers only align when the
  // box itself is 4:3, so we measure the parent and force the largest 4:3 size
  // that fits instead of letting max-h/max-w squash the ratio.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [boxSize, setBoxSize] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;

    const update = () => {
      const rect = parent.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      let width = rect.width;
      let height = (rect.width * 3) / 4;
      if (height > rect.height) {
        height = rect.height;
        width = (rect.height * 4) / 3;
      }
      setBoxSize((prev) =>
        prev && Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
          ? prev
          : { width, height }
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const drawCanvas = (t: d3.ZoomTransform) => {
    const canvas = canvasRef.current;
    if (!canvas || !geoData || loading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    const canvasPath = d3.geoPath().projection(projection).context(ctx);

    // Geographic Lat/Lng Grid (Mercator: meridians=vertical, parallels=horizontal)
    const LON_MIN = -11, LON_MAX = 6, LAT_MIN = 32, LAT_MAX = 46;
    const GRID_STEP_MAJOR = 2.0;  // Major grid every 2°
    const GRID_STEP_MINOR = 1.0;  // Minor grid every 1°
    const W = DIMENSIONS.width;
    const H = DIMENSIONS.height;

    const getLatY = (lat: number): number | null => {
      const p = projection([0, lat]);
      return p ? p[1] : null;
    };

    const getLngX = (lng: number): number | null => {
      const p = projection([lng, 0]);
      return p ? p[0] : null;
    };

    // Minor grid lines (latitude = horizontal)
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += GRID_STEP_MINOR) {
      if (lat % GRID_STEP_MAJOR === 0) continue;
      const y = getLatY(lat);
      if (y !== null) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
    }
    for (let lng = LON_MIN; lng <= LON_MAX; lng += GRID_STEP_MINOR) {
      if (lng % GRID_STEP_MAJOR === 0) continue;
      const x = getLngX(lng);
      if (x !== null) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
    }
    ctx.stroke();

    // Major grid lines (every 2°)
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += GRID_STEP_MAJOR) {
      const y = getLatY(lat);
      if (y !== null) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
    }
    for (let lng = LON_MIN; lng <= LON_MAX; lng += GRID_STEP_MAJOR) {
      const x = getLngX(lng);
      if (x !== null) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
    }
    ctx.stroke();

    // Grid labels (lat/lng values)
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `${8 / t.k}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let lng = LON_MIN; lng <= LON_MAX; lng += GRID_STEP_MAJOR) {
      const x = getLngX(lng);
      if (x !== null) {
        ctx.fillText(`${lng}°`, x, 3 / t.k);
      }
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += GRID_STEP_MAJOR) {
      const y = getLatY(lat);
      if (y !== null) {
        ctx.fillText(`${lat}°`, 0 - 3 / t.k, y);
      }
    }

    // Draw world background
    if (worldData) {
      ctx.fillStyle = "#EAE6D6";
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.lineWidth = 0.3 / t.k;
      ctx.beginPath();
      canvasPath(worldData);
      ctx.fill();
      ctx.stroke();
    }

    // Draw rivers
    if (riverData) {
      ctx.strokeStyle = "#6B9BA5";
      ctx.lineWidth = 0.8 / t.k;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      canvasPath(riverData);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();

    // ═══════════════════════════════════════════════════════════
    // Vintage Map Border — segments align with grid at EVERY zoom
    // ═══════════════════════════════════════════════════════════
    const BW = 5;
    const DARK = "#2A2621";
    const LIGHT = "#F2F0E6";
    const LABEL_FONT = `bold 4.5px serif`;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const screenLngX: number[] = [];
    for (let lng = LON_MIN; lng <= LON_MAX; lng += GRID_STEP_MAJOR) {
      const px = getLngX(lng);
      if (px !== null) screenLngX.push(px * t.k + t.x);
    }
    const screenLatY: number[] = [];
    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += GRID_STEP_MAJOR) {
      const py = getLatY(lat);
      if (py !== null) screenLatY.push(py * t.k + t.y);
    }

    const buildSegs = (positions: number[], edgeMin: number, edgeMax: number): number[] => {
      const clamped = positions.map(x => clamp(x, edgeMin, edgeMax));
      clamped.sort((a, b) => a - b);
      if (clamped.length === 0 || clamped[0] !== edgeMin) clamped.unshift(edgeMin);
      if (clamped[clamped.length - 1] !== edgeMax) clamped.push(edgeMax);
      const out: number[] = [clamped[0]];
      for (let i = 1; i < clamped.length; i++) {
        if (clamped[i] !== out[out.length - 1]) out.push(clamped[i]);
      }
      return out;
    };
    const segLngX = buildSegs(screenLngX, 0, W);
    const segLatY = buildSegs(screenLatY, 0, H);

    // Top & Bottom border
    for (let i = 0; i < segLngX.length - 1; i++) {
      const segW = segLngX[i + 1] - segLngX[i];
      if (segW <= 0) continue;
      ctx.fillStyle = i % 2 === 0 ? DARK : LIGHT;
      ctx.fillRect(segLngX[i], 0, segW, BW);
      ctx.fillRect(segLngX[i], H - BW, segW, BW);
    }

    // Left & Right border
    for (let i = 0; i < segLatY.length - 1; i++) {
      const segH = segLatY[i + 1] - segLatY[i];
      if (segH <= 0) continue;
      ctx.fillStyle = i % 2 === 0 ? DARK : LIGHT;
      ctx.fillRect(0, segLatY[i], BW, segH);
      ctx.fillRect(W - BW, segLatY[i], BW, segH);
    }

    const findSeg = (pos: number, segs: number[]): number => {
      for (let i = 0; i < segs.length - 1; i++) {
        if (pos >= segs[i] && pos < segs[i + 1]) return i;
      }
      return Math.max(0, segs.length - 2);
    };

    // Outer & inner frame lines
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(BW, BW, W - 2 * BW, H - 2 * BW);

    // Longitude labels at top & bottom
    ctx.font = LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < screenLngX.length; i++) {
      const lng = LON_MIN + i * GRID_STEP_MAJOR;
      const sx = clamp(screenLngX[i], BW + 1, W - BW - 1);
      const segIdx = findSeg(clamp(screenLngX[i], 0, W), segLngX);
      ctx.fillStyle = segIdx % 2 === 0 ? LIGHT : DARK;
      ctx.fillText(`${lng}°`, sx, BW / 2);
      ctx.fillText(`${lng}°`, sx, H - BW / 2);
    }

    // Latitude labels at left & right
    for (let i = 0; i < screenLatY.length; i++) {
      const lat = LAT_MIN + i * GRID_STEP_MAJOR;
      const sy = clamp(screenLatY[i], BW + 1, H - BW - 1);
      const segIdx = findSeg(clamp(screenLatY[i], 0, H), segLatY);
      ctx.fillStyle = segIdx % 2 === 0 ? LIGHT : DARK;
      ctx.fillText(`${lat}°`, BW / 2, sy);
      ctx.fillText(`${lat}°`, W - BW / 2, sy);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !geoData || loading) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = DIMENSIONS.width * dpr;
    canvas.height = DIMENSIONS.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    drawCanvas(transformRef.current);
  }, [geoData, worldData, riverData, projection, loading]);

  useEffect(() => {
    const fetchWithFallback = async (primaryUrl: string, fallbackUrl?: string) => {
      try {
        const res = await fetch(primaryUrl);
        if (res.ok) return await res.json();
        throw new Error(`Failed with status ${res.status}`);
      } catch (e) {
        console.warn(`Failed primary fetch of ${primaryUrl}, trying fallback if available`, e);
        if (fallbackUrl) {
          try {
            const res = await fetch(fallbackUrl);
            if (res.ok) return await res.json();
          } catch (err) {
            console.error(`Failed fallback fetch of ${fallbackUrl}`, err);
          }
        }
        return null;
      }
    };

    const loadData = async () => {
      setLoading(true);

      // Local files
      const iberiaPromise = fetchWithFallback('/date/iberia-complete.geojson', './date/iberia-complete.geojson');
      const moroccoPromise = fetchWithFallback('/date/morocco-spanish-protectorate.geojson', './date/morocco-spanish-protectorate.geojson');

      // Optional external file (rivers)
      const riversPromise = fetchWithFallback('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson')
        .catch(() => null);
      // Neighbor countries (France, Andorra, Morocco, Algeria, Tunisia, Gibraltar)
      // now come from a local Natural Earth 10m extract so their shared borders
      // match the 10m admin-1 precision of iberia-complete.geojson (no more
      // 50m-vs-10m sliver gaps), and the map works offline.
      const countriesPromise = fetchWithFallback('/date/world-neighbors.geojson', './date/world-neighbors.geojson')
        .catch(() => null);

      const [iberia, morocco, globalRivers, worldCountries] = await Promise.all([
        iberiaPromise,
        moroccoPromise,
        riversPromise,
        countriesPromise
      ]);

      if (iberia || morocco) {
        setGeoData({
          type: 'FeatureCollection',
          features: [...(iberia?.features || []), ...(morocco?.features || [])]
        });
      } else {
        console.error("Critical: failed to load both Iberia and Morocco GeoJSON maps.");
      }

      if (worldCountries) {
        const neighbors = (worldCountries?.features || []).filter((f: any) => {
          const name = (f.properties.NAME || f.properties.name || '').toLowerCase();
          return ['france', 'morocco', 'algeria', 'tunisia', 'andorra', 'gibraltar'].includes(name);
        });
        setWorldData({ type: 'FeatureCollection', features: neighbors });
      }

      if (globalRivers) {
        const filteredRivers = {
          type: 'FeatureCollection',
          features: (globalRivers?.features || []).filter((f: any) => {
            const type = f.geometry?.type;
            const coords = f.geometry?.coordinates;
            if (!coords) return false;

            const isInView = (p: number[]) => p[0] > -11 && p[0] < 6 && p[1] > 34 && p[1] < 45;

            if (type === 'LineString') {
              return coords.some(isInView);
            } else if (type === 'MultiLineString') {
              return coords.some((line: any) => line.some(isInView));
            }
            return false;
          })
        };
        setRiverData(filteredRivers);
      }

      setLoading(false);
    };

    loadData();
  }, []);
  
  useEffect(() => {
    if (!geoData || !pathGenerator) return;
    
    const paths = geoData.features.map((feature: any) => {
      const properties = feature.properties || {};
      const provinceName = properties.name || properties.name_es || properties.NAME_1 || properties.ID_1 || '';
      
      const provinceId = Object.keys(provinces).find(id => {
        const province = provinces[id];
        const normalizedId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedProvName = (province.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedInName = provinceName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedInNameEs = (properties.name_es || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        return normalizedId === normalizedInName || normalizedProvName === normalizedInName ||
               normalizedId === normalizedInNameEs || normalizedProvName === normalizedInNameEs;
      });

      return {
        feature,
        id: feature.id || provinceName,
        provinceId,
        provinceName,
        path: pathGenerator(feature) || ''
      };
    });

    setNormalizedPaths(paths);
  }, [geoData, pathGenerator, provinces]);

  // Pre-calculate political border paths for different factions
  const politicalBordersPathString = useMemo(() => {
    if (!geoData || !projection || mapMode !== 'political' || normalizedPaths.length === 0) return '';

    // 1. Collect all segments for each province
    const allSegments: { 
      segment: Segment; 
      provinceId: string;
      owner: Faction;
    }[] = [];

    normalizedPaths.forEach((p) => {
      if (!p.provinceId) return;
      const gameProvince = provinces[p.provinceId];
      const owner = gameProvince?.owner || Faction.NEUTRAL;
      
      const isInset = (Object.values(INSET_CONFIG) as InsetConfig[]).some(config => 
        config.match(p.provinceName)
      );
      if (isInset) return;

      const segments = getSegments(p.feature.geometry);
      segments.forEach((seg) => {
        allSegments.push({
          segment: seg,
          provinceId: p.provinceId!,
          owner
        });
      });
    });

    // 2. Map segment occurrences & owner list
    const segmentOwners: Record<string, { provinceId: string, owner: Faction }[]> = {};
    allSegments.forEach((item) => {
      const key = item.segment.key;
      if (!segmentOwners[key]) {
        segmentOwners[key] = [];
      }
      if (!segmentOwners[key].some(x => x.provinceId === item.provinceId)) {
        segmentOwners[key].push({ provinceId: item.provinceId, owner: item.owner });
      }
    });

    // 3. Keep only borders shared by 2+ provinces belonging to DIFFERENT factions
    const borderSegments: Segment[] = [];
    const processedKeys = new Set<string>();

    allSegments.forEach((item) => {
      const key = item.segment.key;
      if (processedKeys.has(key)) return;
      processedKeys.add(key);

      const occurrences = segmentOwners[key] || [];
      if (occurrences.length >= 2) {
        const firstOwner = occurrences[0].owner;
        const possessesDiffOwner = occurrences.some(x => x.owner !== firstOwner);
        if (possessesDiffOwner) {
          borderSegments.push(item.segment);
        }
      }
    });

    // 4. Build single continuous compilation paths
    let dString = '';
    borderSegments.forEach((seg) => {
      const xy1 = projection(seg.p1);
      const xy2 = projection(seg.p2);
      if (xy1 && xy2) {
        dString += `M ${xy1[0].toFixed(1)} ${xy1[1].toFixed(1)} L ${xy2[0].toFixed(1)} ${xy2[1].toFixed(1)} `;
      }
    });

    return dString;
  }, [geoData, normalizedPaths, provinces, mapMode, projection, INSET_CONFIG]);

  const zoom = useMemo(() => {
    return d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10]) 
      .translateExtent([[0, 0], [DIMENSIONS.width, DIMENSIONS.height]]) 
      .filter((event: any) => {
        if (currentScale <= 1.05 && (event.type === 'mousedown' || event.type === 'touchstart')) {
          return false;
        }
        return !event.ctrlKey && !event.button;
      })
      .on('zoom', (event) => {
        const t = event.transform;
        transformRef.current = t;
        
        if (gRef.current) {
          gRef.current.setAttribute('transform', t.toString());
        }
        
        drawCanvas(t);
        setCurrentScale(t.k);
      });
  }, [currentScale]);

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).call(zoom);
  }, [loading, zoom]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoom.scaleBy as any, 1.5);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoom.scaleBy as any, 0.7);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(500).call(zoom.transform as any, d3.zoomIdentity);
  };

  const boxStyle: React.CSSProperties = boxSize
    ? { width: boxSize.width, height: boxSize.height }
    : { width: '100%', aspectRatio: '4 / 3' };

  if (loading) {
    return (
      <div
        ref={rootRef}
        className="bg-[#D7D2BF] rounded-lg flex items-center justify-center border-2 border-[#8B7355] selection:bg-none"
        style={boxStyle}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#A67C52] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif italic text-sm uppercase tracking-widest text-[#8B7355]">{lang === 'zh' ? '正在加载帝国档案...' : 'Consulting Imperial Archives...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative rounded-lg border-2 border-[#5C4D32] shadow-[inset_0_0_50px_rgba(0,0,0,0.15)] overflow-hidden group"
      style={{ backgroundColor: UI_COLORS.ocean, ...boxStyle }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${DIMENSIONS.width} ${DIMENSIONS.height}`}
        className={`relative z-10 w-full h-full ${currentScale > 1.05 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
        <defs>
          <filter id="inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset dy="1" dx="1" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
            <feFlood floodColor="black" floodOpacity="0.3" />
            <feComposite in2="shadowDiff" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>

          <filter id="paper-texture-filter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="2">
              <feDistantLight azimuth="45" elevation="45" />
            </feDiffuseLighting>
          </filter>

          {/* Clip province fills to inner area so they don't bleed onto the border */}
          <clipPath id="map-content-clip">
            <rect x="5" y="5" width={DIMENSIONS.width - 10} height={DIMENSIONS.height - 10} />
          </clipPath>

        </defs>
        
        {!geoData && <rect width="100%" height="100%" fill={UI_COLORS.ocean} />}
        
        <rect width="100%" height="100%" filter="url(#paper-texture-filter)" style={{ mixBlendMode: 'multiply', opacity: 0.3 }} pointerEvents="none" />

        <g clipPath="url(#map-content-clip)">
        <g ref={gRef} transform={transformRef.current.toString()} style={{ willChange: 'transform' }}>
          {/* Background Land and Rivers are now on Canvas layer */}

          {/* Background Labels for neighboring regions */}
          <g className="world-labels opacity-20 pointer-events-none select-none" style={{ fill: '#000', fontFamily: 'serif', fontStyle: 'italic' }}>
            {(() => {
              const francePos = projection([2, 46.5]);
              
              return (
                <>
                  {francePos && (
                    <text 
                      x={francePos[0]} y={francePos[1]} 
                      transform={`rotate(5, ${francePos[0]}, ${francePos[1]})`} 
                      style={{ fontSize: '24px', letterSpacing: '0.5em' }}
                      textAnchor="middle"
                    >
                      FRANCIA
                    </text>
                  )}
                </>
              );
            })()}
          </g>

          {/* Main Map Features */}
          {normalizedPaths.filter((p: any) => {
            return !(Object.values(INSET_CONFIG) as InsetConfig[]).some(config => config.match(p.provinceName));
          }).map((p: any) => {
            const gameProvince = p.provinceId ? provinces[p.provinceId] : null;
            let color = '#D4C9B3'; // Default Neutral Land
            
            if (mapMode === 'political') {
              const owner = gameProvince?.owner || Faction.NEUTRAL;
              color = FACTION_COLORS[owner];
            } else if (mapMode === 'terrain') {
              if (gameProvince) {
                color = TERRAIN_COLORS[gameProvince.terrain] || '#D4C9B3';
              } else {
                color = '#D4C9B3';
              }
            } else if (mapMode === 'ethnic') {
              if (p.provinceId && PROVINCE_CULTURES[p.provinceId]) {
                color = PROVINCE_CULTURES[p.provinceId].color;
              } else {
                color = '#D4C9B3';
              }
            } else if (mapMode === 'region') {
              if (p.provinceId && PROVINCE_REGIONS[p.provinceId]) {
                color = PROVINCE_REGIONS[p.provinceId].color;
              } else {
                color = '#D4C9B3';
              }
            } else if (mapMode === 'strategic') {
              if (gameProvince) {
                const val = Math.min(10, Math.max(0, gameProvince.strategicValue ?? 0));
                color = STRATEGIC_COLORS[val];
              } else {
                color = '#FAF5E6';
              }
            }

            const isSelected = selectedId === p.provinceId;
            const isHovered = hoveredProvince === p.provinceName;
            
            const selectedArmy = armies.find(a => a.id === selectedArmyId);
            const isPossibleMove = canMoveSelectedArmy && selectedArmy && p.provinceId &&
              PROVINCE_ADJACENCY[selectedArmy.provinceId]?.includes(p.provinceId) &&
              !(
                (selectedArmy.faction === Faction.REPUBLICAN || selectedArmy.faction === Faction.NATIONALIST) &&
                isPortugalProvince(p.provinceId)
              );

            // Customize border stroke and width
            let strokeColor = 'rgba(0,0,0,0.2)';
            let strokeWidthVal = 0.5;

            if (isSelected) {
              strokeColor = UI_COLORS.accent;
              strokeWidthVal = 2.5;
            } else if (isPossibleMove) {
              strokeColor = '#FFFFFF';
              strokeWidthVal = 1.8;
            } else if (isHovered) {
              strokeColor = '#000000';
              strokeWidthVal = 1.8;
            } else if (mapMode === 'political') {
              // Light/low-opacity provincial border lines for political subdivision
              strokeColor = 'rgba(42,32,24,0.12)';
              strokeWidthVal = 0.4;
            } else {
              // Standard crisp borders for other map modes showing geography/regions
              strokeColor = 'rgba(42,32,24,0.25)';
              strokeWidthVal = 0.5;
            }

            return (
              <g key={p.id}>
                <motion.path
                  d={p.path}
                  fill={color}
                  fillOpacity={0.75}
                  stroke={strokeColor}
                  strokeWidth={strokeWidthVal / currentScale}
                  strokeDasharray={isPossibleMove ? '3, 2' : 'none'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onMouseEnter={() => {
                    setHoveredProvince(p.provinceName);
                    setHoveredProvinceId(p.provinceId || null);
                  }}
                  onMouseLeave={() => {
                    setHoveredProvince(null);
                    setHoveredProvinceId(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!p.provinceId) return;
                    onSelect(p.provinceId);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (p.provinceId && selectedArmyId && isPossibleMove) {
                      onMoveArmy(selectedArmyId, p.provinceId);
                    }
                  }}
                  className="transition-colors duration-300"
                  style={{ 
                    mixBlendMode: 'multiply',
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'url(#inner-shadow)',
                    cursor: p.provinceId ? 'pointer' : 'default'
                  }}
                />
              </g>
            );
          })}

          <g className="armies-layer">
            {(() => {
              const provinceArmyCount: Record<string, number> = {};
              return armies.map((army) => {
                const center = provinceCenters[army.provinceId];
                if (!center) return null;
                
                const stackIndex = provinceArmyCount[army.provinceId] || 0;
                provinceArmyCount[army.provinceId] = stackIndex + 1;
                const offset = stackIndex * (4 / currentScale);
                
                const isSelected = selectedArmyIds.includes(army.id);
                const factionColor = FACTION_COLORS[army.faction];
                
                return (
                  <g
                    key={army.id}
                    transform={`translate(${center[0] + offset}, ${center[1] + offset})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArmy(army.id, e.shiftKey);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const selectedArmy = armies.find(a => a.id === selectedArmyId);
                      const canMoveHere = Boolean(
                        canMoveSelectedArmy &&
                        selectedArmy &&
                        selectedArmy.id !== army.id &&
                        PROVINCE_ADJACENCY[selectedArmy.provinceId]?.includes(army.provinceId) &&
                        !(
                          (selectedArmy.faction === Faction.REPUBLICAN || selectedArmy.faction === Faction.NATIONALIST) &&
                          isPortugalProvince(army.provinceId)
                        )
                      );
                      if (canMoveHere && selectedArmy) {
                        onMoveArmy(selectedArmy.id, army.provinceId);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <motion.g
                      initial={{ scale: 0, y: -20 }}
                      animate={{ scale: isSelected ? 1.2 : 1, y: 0 }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <ellipse 
                        cx={0} cy={12 / currentScale} 
                        rx={8 / currentScale} ry={3 / currentScale} 
                        fill="black" opacity={0.2} 
                      />

                      {isSelected && (
                        <circle r={14 / currentScale} fill={factionColor} opacity={0.4}>
                          <animate attributeName="r" values={`${14/currentScale};${18/currentScale};${14/currentScale}`} dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                      
                      <rect 
                        x={-12 / currentScale} 
                        y={-10 / currentScale} 
                        width={24 / currentScale} 
                        height={16 / currentScale} 
                        fill={factionColor}
                        stroke="#1A1A1A"
                        strokeWidth={1.5 / currentScale}
                        rx={1 / currentScale}
                        style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))' }}
                      />
                      
                      <g opacity={0.8}>
                        <rect 
                          x={-8 / currentScale} 
                          y={-7 / currentScale} 
                          width={16 / currentScale} 
                          height={10 / currentScale} 
                          fill="none"
                          stroke="#000"
                          strokeWidth={0.8 / currentScale}
                        />
                        <line 
                          x1={-8 / currentScale} y1={-7 / currentScale} 
                          x2={8 / currentScale} y2={3 / currentScale} 
                          stroke="#000" strokeWidth={0.8 / currentScale} 
                        />
                        <line 
                          x1={8 / currentScale} y1={-7 / currentScale} 
                          x2={-8 / currentScale} y2={3 / currentScale} 
                          stroke="#000" strokeWidth={0.8 / currentScale} 
                        />
                      </g>

                      <g transform={`translate(0, ${10 / currentScale})`}>
                        <text 
                          textAnchor="middle" 
                          style={{ fontSize: `${8/currentScale}px`, fontWeight: 'bold', fontFamily: 'serif' }}
                          fill="#000"
                        >
                          {Array(army.movesLeft).fill('•').join(' ')}
                        </text>
                      </g>

                      <rect 
                        x={-12 / currentScale} 
                        y={6 / currentScale} 
                        width={24 / currentScale} 
                        height={1.5 / currentScale} 
                        fill="rgba(0,0,0,0.3)"
                      />
                      <rect 
                        x={-12 / currentScale} 
                        y={6 / currentScale} 
                        width={(24 / currentScale) * (army.manpower / (army.maxManpower || 10000))}
                        height={1.5 / currentScale} 
                        fill="#4ade80"
                      />
                    </motion.g>
                  </g>
                );
              });
            })()}
          </g>

          <g className="cities-layer">
            {MAJOR_CITIES.map((city) => {
              const [x, y] = projection(city.coords as [number, number]) || [0, 0];
              if (x === 0 && y === 0) return null;

              return (
                <g key={`city-${city.name}`} transform={`translate(${x}, ${y})`}>
                  <circle 
                    r={city.isCapital ? 2.5 / currentScale : 1.2 / currentScale}
                    fill={UI_COLORS.ink}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={0.5 / currentScale}
                    className="drop-shadow-sm"
                  />
                  {city.isCapital && (
                    <circle 
                      r={4 / currentScale}
                      fill="none"
                      stroke={UI_COLORS.ink}
                      strokeWidth={0.3 / currentScale}
                      opacity={0.6}
                    />
                  )}
                  <text
                    y={-5 / currentScale}
                    textAnchor="middle"
                    className="select-none pointer-events-none fill-[#2A2621] font-serif"
                    style={{ 
                      fontSize: `${(city.isCapital ? 10 : 8) / currentScale}px`,
                      fontWeight: city.isCapital ? 'bold' : 'normal',
                      letterSpacing: '-0.01em',
                      paintOrder: 'stroke',
                      stroke: 'rgba(255,255,255,0.7)',
                      strokeWidth: 2.5 / currentScale,
                      strokeLinejoin: 'round'
                    }}
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Overlay Political Faction Borders — Draw on top of all province paths */}
          {mapMode === 'political' && politicalBordersPathString && (
            <path
              d={politicalBordersPathString}
              fill="none"
              stroke="#1C1510"
              strokeWidth={1.5 / currentScale}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
        </g>

        </g>

        {/* Fixed Inset Group (Temporarily disabled) */}
        {/*
        <g className="insets-fixed">
          ... (omitted content)
        </g>
        */}
      </svg>
      
      {/* Map Mode Dropdown */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-white/95 backdrop-blur border border-[#8B7355] rounded-md shadow-md px-3 py-2 text-xs font-serif font-bold text-[#8B7355]">
        <div className="flex items-center gap-1.5 shrink-0 text-[#8B7355]">
          {mapMode === 'political' && <Swords size={14} />}
          {mapMode === 'terrain' && <Mountain size={14} />}
          {mapMode === 'ethnic' && <Users size={14} />}
          {mapMode === 'region' && <Map size={14} />}
          {mapMode === 'strategic' && <Shield size={14} />}
        </div>
        <select
          value={mapMode}
          onChange={(e) => setMapMode(e.target.value as 'political' | 'terrain' | 'ethnic' | 'region' | 'strategic')}
          className="bg-transparent border-none outline-none cursor-pointer pr-1 py-0 font-bold text-[#8B7355] focus:ring-0"
        >
          <option value="political" className="bg-[#FAF5E6] text-[#8B7355] font-bold">{lang === 'zh' ? '势力分布' : 'Political'}</option>
          <option value="terrain" className="bg-[#FAF5E6] text-[#8B7355] font-bold">{lang === 'zh' ? '地形地貌' : 'Terrain'}</option>
          <option value="ethnic" className="bg-[#FAF5E6] text-[#8B7355] font-bold">{lang === 'zh' ? '民族文化' : 'Culture'}</option>
          <option value="region" className="bg-[#FAF5E6] text-[#8B7355] font-bold">{lang === 'zh' ? '行政区域' : 'Region'}</option>
          <option value="strategic" className="bg-[#FAF5E6] text-[#8B7355] font-bold">{lang === 'zh' ? '战略价值' : 'Strategic Value'}</option>
        </select>
      </div>

      <div className="absolute top-16 left-4 z-30 flex flex-col gap-2">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-white/80 hover:bg-white border border-accent rounded-md shadow-md text-accent transition-all hover:scale-105 active:scale-95"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-white/80 hover:bg-white border border-accent rounded-md shadow-md text-accent transition-all hover:scale-105 active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button 
          onClick={handleReset}
          className="p-2 bg-white/80 hover:bg-white border border-accent rounded-md shadow-md text-accent transition-all hover:scale-105 active:scale-95"
          title="Reset Map"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Floating Dynamic Legend */}
      <div className="absolute bottom-4 left-4 z-40 bg-white/95 backdrop-blur border-2 border-[#8B7355] p-2.5 rounded shadow-lg max-w-[170px] font-serif hover:opacity-100 transition-opacity">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8B7355] border-b border-gray-200 pb-1 mb-1.5">
          {lang === 'zh' ? (
            mapMode === 'political' ? '势力分布' : mapMode === 'terrain' ? '地形地貌' : mapMode === 'ethnic' ? '民族文化' : mapMode === 'region' ? '行政区域' : '战略价值'
          ) : (
            mapMode === 'political' ? 'Political' : mapMode === 'terrain' ? 'Terrain' : mapMode === 'ethnic' ? 'Culture' : mapMode === 'region' ? 'Region' : 'Strategic Value'
          )}
        </h4>
        
        <div className="space-y-1.5 text-[10px] font-mono font-bold leading-tight text-[#2A2621]">
          {mapMode === 'political' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: FACTION_COLORS[Faction.WORKERS_ALLIANCE] }} />
                <span>{lang === 'zh' ? '工人联盟自治政府' : "Workers' Alliance"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: FACTION_COLORS[Faction.REPUBLICAN] }} />
                <span>{lang === 'zh' ? '共和国' : 'Republicans (Rep.)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: FACTION_COLORS[Faction.NATIONALIST] }} />
                <span>{lang === 'zh' ? '国民军' : 'Nationalists (Nat.)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: FACTION_COLORS[Faction.PORTUGAL] }} />
                <span>{lang === 'zh' ? '葡萄牙' : 'Portugal'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: FACTION_COLORS[Faction.NEUTRAL] }} />
                <span>{lang === 'zh' ? '中立' : 'Neutral'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: FACTION_COLORS[Faction.UNITED_KINGDOM] }} />
                <span>{lang === 'zh' ? '英国' : 'United Kingdom'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: FACTION_COLORS[Faction.ANDORRA] }} />
                <span>{lang === 'zh' ? '安道尔' : 'Andorra'}</span>
              </div>
            </>
          )}

          {mapMode === 'terrain' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: TERRAIN_COLORS.urban }} />
                <span>{lang === 'zh' ? '城市' : 'Urban'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: TERRAIN_COLORS.plains }} />
                <span>{lang === 'zh' ? '平原' : 'Plains'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: TERRAIN_COLORS.mountains }} />
                <span>{lang === 'zh' ? '山地' : 'Mountains'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: TERRAIN_COLORS.forest }} />
                <span>{lang === 'zh' ? '森林' : 'Forest'}</span>
              </div>
            </>
          )}

          {mapMode === 'ethnic' && (
            <div className="max-h-[145px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '0% 0%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#B56C51' 
                  }} 
                />
                <span>{lang === 'zh' ? '卡斯蒂利亚' : 'Castilian'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '0% 25%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#E09F3E' 
                  }} 
                />
                <span>{lang === 'zh' ? '加泰罗尼亚' : 'Catalan'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '100% 0%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#4E8752' 
                  }} 
                />
                <span>{lang === 'zh' ? '巴斯克' : 'Basque'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '50% 0%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#4D8093' 
                  }} 
                />
                <span>{lang === 'zh' ? '加利西亚' : 'Galician'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '50% 25%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#8E9F76' 
                  }} 
                />
                <span>{lang === 'zh' ? '安达卢西亚' : 'Andalusian'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '50% 75%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#E5A93B' 
                  }} 
                />
                <span>{lang === 'zh' ? '巴伦西亚' : 'Valencia'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '0% 75%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#DDA72F' 
                  }} 
                />
                <span>{lang === 'zh' ? '阿拉贡' : 'Aragonese'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '0% 50%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#4A7A6E' 
                  }} 
                />
                <span>{lang === 'zh' ? '阿斯图里亚斯' : 'Asturias'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '50% 50%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#9E305C' 
                  }} 
                />
                <span>{lang === 'zh' ? '莱昂' : 'Leonese'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '100% 25%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#5E8075' 
                  }} 
                />
                <span>{lang === 'zh' ? '葡萄牙' : 'Portuguese'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '100% 50%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#BCA374' 
                  }} 
                />
                <span>{lang === 'zh' ? '摩洛哥与柏柏尔' : 'Moroccan & Berber'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm border border-black/20 inline-block shrink-0" 
                  style={{ 
                    backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                    backgroundSize: '300% 500%',
                    backgroundPosition: '100% 75%',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#5A9AD4' 
                  }} 
                />
                <span>{lang === 'zh' ? '加那利' : 'Canarian'}</span>
              </div>
            </div>
          )}

          {mapMode === 'region' && (
            <div className="max-h-[145px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#3F889D' }} />
                <span>{lang === 'zh' ? '加利西亚' : 'Galicia'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#2E7969' }} />
                <span>{lang === 'zh' ? '阿斯图里亚斯' : 'Asturias'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#488E4F' }} />
                <span>{lang === 'zh' ? '巴斯克地区' : 'Basque Country'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#7CA47F' }} />
                <span>{lang === 'zh' ? '纳瓦拉' : 'Navarre'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#BCA32B' }} />
                <span>{lang === 'zh' ? '阿拉贡' : 'Aragon'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#C46B4E' }} />
                <span>{lang === 'zh' ? '加泰罗尼亚' : 'Catalonia'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#DE9273' }} />
                <span>{lang === 'zh' ? '巴利阿里群岛' : 'Balearic Islands'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#DF9E3C' }} />
                <span>{lang === 'zh' ? '巴伦西亚' : 'Valencia'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#E1B26E' }} />
                <span>{lang === 'zh' ? '穆尔西亚' : 'Murcia'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#719E5A' }} />
                <span>{lang === 'zh' ? '安达卢西亚' : 'Andalusia'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#547A46' }} />
                <span>{lang === 'zh' ? '埃斯特雷马杜拉' : 'Extremadura'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#8C513E' }} />
                <span>{lang === 'zh' ? '莱昂' : 'León'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#A66A51' }} />
                <span>{lang === 'zh' ? '老卡斯蒂利亚' : 'Old Castile'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#B8535A' }} />
                <span>{lang === 'zh' ? '新卡斯蒂利亚' : 'New Castile'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#5082CD' }} />
                <span>{lang === 'zh' ? '加那利群岛' : 'Canary Islands'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#C5AC7E' }} />
                <span>{lang === 'zh' ? '西属摩洛哥' : 'Spanish Morocco'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-black/10 inline-block shrink-0" style={{ backgroundColor: '#508E8F' }} />
                <span>{lang === 'zh' ? '葡萄牙' : 'Portugal'}</span>
              </div>
            </div>
          )}

          {mapMode === 'strategic' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[9px] font-sans text-gray-500">
                <span>{lang === 'zh' ? '低 (0)' : 'Low (0)'}</span>
                <span>{lang === 'zh' ? '高 (10)' : 'High (10)'}</span>
              </div>
              <div className="h-3.5 w-full rounded flex overflow-hidden border border-black/10">
                {STRATEGIC_COLORS.map((color, idx) => (
                  <div key={idx} className="flex-1 h-full" style={{ backgroundColor: color }} title={`${idx}`} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-1 gap-y-1 text-[9px] font-sans">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0 border border-black/5" style={{ backgroundColor: STRATEGIC_COLORS[0] }} />
                  <span>0 ({lang === 'zh' ? '米色' : 'Beige'})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0 border border-black/5" style={{ backgroundColor: STRATEGIC_COLORS[10] }} />
                  <span>10 ({lang === 'zh' ? '深红' : 'Deep Red'})</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {hoveredProvince && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 z-30 bg-[#F2F0E6]/95 backdrop-blur text-[#2A2621] p-4 rounded-sm border-2 border-[#8B7355] font-serif shadow-xl pointer-events-none max-w-[240px]"
          >
            <div className="text-[#8B7355] font-bold border-b-2 border-[#8B7355]/30 pb-1 mb-2 uppercase tracking-tighter text-lg flex items-center justify-between">
              <span>{hoveredProvince}</span>
              {hoveredProvinceId && provinces[hoveredProvinceId] && (
                <span className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: FACTION_COLORS[provinces[hoveredProvinceId].owner] }} />
              )}
            </div>
            
            {hoveredProvinceId && provinces[hoveredProvinceId] ? (
              (() => {
                const prov = provinces[hoveredProvinceId];
                const culture = PROVINCE_CULTURES[hoveredProvinceId];
                const region = PROVINCE_REGIONS[hoveredProvinceId];
                const factionNameCn = prov.owner === Faction.REPUBLICAN ? '共和国' : prov.owner === Faction.NATIONALIST ? '国民军' : prov.owner === Faction.PORTUGAL ? '葡萄牙' : prov.owner === Faction.WORKERS_ALLIANCE ? '工人联盟自治政府' : prov.owner === Faction.UNITED_KINGDOM ? '英国' : prov.owner === Faction.ANDORRA ? '安道尔' : '中立';
                const factionName = lang === 'zh' ? factionNameCn : (prov.owner === Faction.REPUBLICAN ? 'Republicans' : prov.owner === Faction.NATIONALIST ? 'Nationalists' : prov.owner === Faction.PORTUGAL ? 'Portugal' : prov.owner === Faction.WORKERS_ALLIANCE ? "Workers' Alliance" : prov.owner === Faction.UNITED_KINGDOM ? 'United Kingdom' : prov.owner === Faction.ANDORRA ? 'Andorra' : 'Neutral');
                const terrainLabels: Record<string, string> = lang === 'zh' 
                  ? { urban: '城市', plains: '平原', mountains: '山地', forest: '森林' }
                  : { urban: 'Urban', plains: 'Plains', mountains: 'Mountains', forest: 'Forest' };
                
                return (
                  <div className="space-y-1.5 font-sans font-medium text-xs text-[#2A2621]/90">
                    <div className="flex justify-between border-b border-dashed border-[#8B7355]/20 pb-0.5">
                      <span className="text-gray-500 font-serif">{lang === 'zh' ? '控制阵营' : 'Control'}</span>
                      <span className="font-bold font-mono text-[11px]" style={{ color: FACTION_COLORS[prov.owner] }}>{factionName}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#8B7355]/20 pb-0.5">
                      <span className="text-gray-500 font-serif">{lang === 'zh' ? '地形地貌' : 'Terrain'}</span>
                      <span className="font-bold">{terrainLabels[prov.terrain] || prov.terrain}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#8B7355]/20 pb-0.5 items-center">
                      <span className="text-gray-500 font-serif">{lang === 'zh' ? '民族文化' : 'Culture'}</span>
                      <span className="font-bold text-[#8B7355] flex items-center gap-1.5">
                        {culture ? (lang === 'zh' ? culture.nameCn : culture.nameEn) : (lang === 'zh' ? '未知' : 'Unknown')}
                        {culture && hoveredProvinceId && (
                          (() => {
                            const coords = getCultureGridCoords(hoveredProvinceId, culture.group, lang);
                            return (
                              <span 
                                className="w-5 h-5 rounded-full border border-black/30 shadow-sm inline-block shrink-0"
                                title={coords.name}
                                style={{
                                  backgroundImage: `url(${BASE_URL}date/cultural%20spirit.png)`,
                                  backgroundSize: '300% 500%',
                                  backgroundPosition: `${coords.col * 50}% ${coords.row * 25}%`,
                                  backgroundRepeat: 'no-repeat',
                                }}
                              />
                            );
                          })()
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#8B7355]/20 pb-0.5">
                      <span className="text-gray-500 font-serif">{lang === 'zh' ? '行政区域' : 'Region'}</span>
                      <span className="font-bold text-[#865C38]">{region ? (lang === 'zh' ? region.nameCn : region.nameEn) : (lang === 'zh' ? '中立/未知' : 'Neutral/Unknown')}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#8B7355]/20 pb-0.5">
                      <span className="text-gray-500 font-serif">{lang === 'zh' ? '兵员基础' : 'Manpower'}</span>
                      <span className="font-bold font-mono">{(prov.manpower * 10).toLocaleString()}k</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-[#8B7355]/20 pb-0.5">
                      <span className="text-gray-500 font-serif">{lang === 'zh' ? '工业产能' : 'Industry'}</span>
                      <span className="font-bold font-mono">{prov.industry} IC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-serif">{lang === 'zh' ? '战略价值' : 'Strategic Value'}</span>
                      <span className="font-bold font-mono text-red-700">★ {prov.strategicValue} / 10</span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500 italic font-serif text-xs">{lang === 'zh' ? '中立 / 未探索区域' : 'Neutral / Unexplored Area'}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
