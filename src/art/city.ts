// Novara Bay — the procedurally drawn night city shown on the Command Center.
import type { LocationId } from '../engine/types';
import { box, ellipse, iso, rng, rgba, shade, tile, type Pt } from './iso';

export const CITY_N = 24;
const TW = 64;

export const districtOf = (x: number, y: number): LocationId =>
  x < 12 && y < 12 ? 'techquarter' : x < 12 ? 'oldtown' : y < 12 ? 'harbor' : 'riverside';

export const isWater = (x: number, y: number) => Math.hypot(x + 0.5 - 24.5, y + 0.5 - 24.5) < 9 || (y === 17 && x < 17 && x > 0);
export const isRoad = (x: number, y: number) => x % 6 === 0 || y % 6 === 0;
const isLandmark = (x: number, y: number) => (x === 9 || x === 10) && (y === 9 || y === 10);

/** Lots where the player's businesses are built, per district (in order of opening). */
export const LOTS: Record<LocationId, [number, number][]> = {
  techquarter: [[3, 8], [8, 3], [2, 2], [4, 4]],
  oldtown: [[3, 14], [8, 20], [3, 21], [9, 14]],
  harbor: [[14, 3], [20, 8], [15, 9], [21, 2]],
  riverside: [[14, 14], [20, 13], [13, 20], [15, 19]],
};

export const DISTRICT_LABEL_POS: Record<LocationId, [number, number]> = {
  techquarter: [5.5, 5.5], oldtown: [5.5, 21], harbor: [21, 5.5], riverside: [15.5, 15.5],
};

const STYLE: Record<LocationId, { chance: number; min: number; max: number; color: string; win: string; lit: number }> = {
  techquarter: { chance: 0.85, min: 46, max: 150, color: '#0f2a52', win: '#8cc8ff', lit: 0.55 },
  harbor: { chance: 0.72, min: 28, max: 84, color: '#103846', win: '#9ff3e6', lit: 0.45 },
  oldtown: { chance: 0.8, min: 14, max: 40, color: '#3a2a40', win: '#ffcf7a', lit: 0.5 },
  riverside: { chance: 0.32, min: 10, max: 26, color: '#22344f', win: '#c9e4ff', lit: 0.4 },
};

export interface CityBusiness { id: string; location: LocationId; color: string; level: number }
export interface CityLot { id: string; gx: number; gy: number; height: number; color: string }

export function lotsFor(businesses: CityBusiness[]): CityLot[] {
  const used: Record<string, number> = {};
  return businesses.map((b) => {
    const i = used[b.location] ?? 0;
    used[b.location] = i + 1;
    const [gx, gy] = LOTS[b.location][i % LOTS[b.location].length];
    return { id: b.id, gx, gy, height: 46 + Math.min(60, b.level * 6), color: b.color };
  });
}

export const cityBounds = () => {
  const pts = [iso(0, 0, 0, TW), iso(CITY_N, 0, 0, TW), iso(0, CITY_N, 0, TW), iso(CITY_N, CITY_N, 0, TW)];
  return { minX: Math.min(...pts.map((p) => p.x)), maxX: Math.max(...pts.map((p) => p.x)), minY: Math.min(...pts.map((p) => p.y)) - 120, maxY: Math.max(...pts.map((p) => p.y)) + 6 };
};

export const cityPoint = (gx: number, gy: number, z = 0): Pt => iso(gx, gy, z, TW);

function tree(ctx: CanvasRenderingContext2D, gx: number, gy: number, r: () => number) {
  const p = iso(gx, gy, 0, TW);
  ellipse(ctx, p.x, p.y, 7, 3.5, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = '#3b2a1f';
  ctx.fillRect(p.x - 1, p.y - 7, 2, 7);
  const g = 0.3 + r() * 0.25;
  ellipse(ctx, p.x, p.y - 12, 7, 8, shade('#1f7a55', -g));
  ellipse(ctx, p.x - 2, p.y - 14, 3.5, 3.5, 'rgba(120,255,200,0.12)');
}

/** Draws the static city (ground, water, roads, buildings, player lots) in world coordinates. */
export function drawCityStatic(ctx: CanvasRenderingContext2D, lots: CityLot[], seed = 7) {
  const r = rng(seed);
  const lotAt = new Map(lots.map((l) => [`${l.gx},${l.gy}`, l]));
  // Ground plate edge
  const e0 = iso(0, CITY_N, 0, TW), e1 = iso(CITY_N, CITY_N, 0, TW), e2 = iso(CITY_N, 0, 0, TW);
  ctx.beginPath();
  ctx.moveTo(e0.x, e0.y); ctx.lineTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y);
  ctx.lineTo(e2.x, e2.y + 14); ctx.lineTo(e1.x, e1.y + 14); ctx.lineTo(e0.x, e0.y + 14); ctx.closePath();
  ctx.fillStyle = '#040b18';
  ctx.fill();

  // Tiles
  for (let y = 0; y < CITY_N; y++) {
    for (let x = 0; x < CITY_N; x++) {
      if (isWater(x, y) && !(isRoad(x, y) && y === 17 && x % 6 === 0)) {
        tile(ctx, x, y, 1, 1, (x + y) % 2 ? '#0b2f5e' : '#0a2b57', TW);
        if (r() < 0.08) { const p = iso(x + 0.5, y + 0.5, 0, TW); ctx.fillStyle = 'rgba(140,200,255,0.25)'; ctx.fillRect(p.x - 6, p.y, 12, 1); }
      } else if (isRoad(x, y)) {
        tile(ctx, x, y, 1, 1, '#081426', TW, 'rgba(88,166,255,0.06)');
      } else {
        tile(ctx, x, y, 1, 1, districtOf(x, y) === 'riverside' ? '#0c2321' : '#0b1a30', TW, 'rgba(88,166,255,0.05)');
      }
    }
  }
  // Lane markings
  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(88,166,255,0.28)';
  ctx.lineWidth = 1;
  for (let k = 0; k <= CITY_N; k += 6) {
    const a = iso(k + 0.5, 0, 0, TW), b = iso(k + 0.5, CITY_N, 0, TW);
    const c = iso(0, k + 0.5, 0, TW), d = iso(CITY_N, k + 0.5, 0, TW);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
  }
  ctx.restore();
  // Re-cover lanes over open water (bay)
  for (let y = 0; y < CITY_N; y++) for (let x = 0; x < CITY_N; x++) if (isWater(x, y) && y !== 17) tile(ctx, x, y, 1, 1, (x + y) % 2 ? '#0b2f5e' : '#0a2b57', TW);

  // Objects in depth order
  type Obj = { k: number; draw: () => void };
  const objs: Obj[] = [];
  for (let y = 0; y < CITY_N; y++) {
    for (let x = 0; x < CITY_N; x++) {
      if (isWater(x, y) || isRoad(x, y) || isLandmark(x, y)) continue;
      const lot = lotAt.get(`${x},${y}`);
      const dist = districtOf(x, y);
      const st = STYLE[dist];
      const roll = r(), hRoll = r(), seed = Math.floor(r() * 1e6);
      if (lot) {
        objs.push({ k: x + y + 1, draw: () => {
          tile(ctx, x - 0.05, y - 0.05, 1.1, 1.1, rgba(lot.color, 0.25), TW);
          box(ctx, x + 0.14, y + 0.14, 0.72, 0.72, lot.height, shade(lot.color, -0.45), { tw: TW, glow: lot.color, windows: { rows: Math.max(2, Math.round(lot.height / 13)), cols: 2, lit: 0.75, color: shade(lot.color, 0.55), seed } });
        } });
      } else if (roll < st.chance) {
        const h = st.min + hRoll * (st.max - st.min);
        objs.push({ k: x + y + 1, draw: () => box(ctx, x + 0.12, y + 0.12, 0.76, 0.76, h, st.color, { tw: TW, edge: 'rgba(88,166,255,0.08)', windows: { rows: Math.max(1, Math.round(h / 14)), cols: 2, lit: st.lit, color: st.win, seed } }) });
      } else {
        objs.push({ k: x + y + 0.5, draw: () => { tree(ctx, x + 0.35, y + 0.4, r); tree(ctx, x + 0.7, y + 0.7, r); } });
      }
    }
  }
  // Landmark: Empire Spire (2x2 plaza with tower)
  objs.push({ k: 9 + 9 + 2, draw: () => {
    tile(ctx, 9, 9, 2, 2, '#0d2547', TW, 'rgba(88,166,255,0.4)');
    box(ctx, 9.45, 9.45, 1.1, 1.1, 40, '#123a74', { tw: TW, glow: '#58A6FF' });
    box(ctx, 9.7, 9.7, 0.6, 0.6, 150, '#1b4fa0', { tw: TW, glow: '#8cc8ff', windows: { rows: 10, cols: 1, lit: 0.9, color: '#bfe0ff', seed: 99 } }, 40);
  } });
  objs.sort((a, b) => a.k - b.k).forEach((o) => o.draw());
}

/** Animated overlay: traffic lights, pulsing business rings, spire beacon. t in seconds. */
export function drawCityDynamic(ctx: CanvasRenderingContext2D, lots: CityLot[], t: number) {
  // Traffic
  for (let k = 0; k <= CITY_N - 6; k += 6) {
    for (let i = 0; i < 3; i++) {
      for (const axis of [0, 1]) {
        const speed = 0.9 + ((k + i * 7 + axis * 3) % 5) * 0.18;
        const dir = (i + axis) % 2 ? 1 : -1;
        const s = (((t * speed * dir + i * 8.3 + k) % CITY_N) + CITY_N) % CITY_N;
        const gx = axis ? k + 0.5 : s, gy = axis ? s : k + 0.5;
        if (isWater(Math.floor(gx), Math.floor(gy)) && Math.floor(gy) !== 17) continue;
        const p = iso(gx, gy, 0, TW);
        const c = dir > 0 ? '255,240,200' : '255,84,112';
        ellipse(ctx, p.x, p.y, 5, 2.6, `rgba(${c},0.18)`);
        ellipse(ctx, p.x, p.y, 1.6, 1.1, `rgba(${c},0.95)`);
      }
    }
  }
  // Business rings
  for (const l of lots) {
    const p = iso(l.gx + 0.5, l.gy + 0.5, 0, TW);
    const ph = (t % 2) / 2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 18 + ph * 26, (18 + ph * 26) / 2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(l.color, 0.6 * (1 - ph));
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // Spire beacon
  const top = iso(10, 10, 190, TW);
  const a = 0.35 + 0.25 * Math.sin(t * 2);
  const g = ctx.createLinearGradient(top.x, top.y - 70, top.x, top.y);
  g.addColorStop(0, 'rgba(88,166,255,0)');
  g.addColorStop(1, `rgba(140,200,255,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(top.x - 3, top.y - 70, 6, 70);
  ellipse(ctx, top.x, top.y, 10, 5, `rgba(140,200,255,${a * 0.6})`);
  ellipse(ctx, top.x, top.y, 3, 2, '#e6f3ff');
}
