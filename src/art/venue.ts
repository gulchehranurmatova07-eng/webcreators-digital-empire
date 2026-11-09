// Isometric interiors for every business category. The scene reflects real game state:
// tables grow with capacity, staff with hires, seated customers with the last day's visits,
// and reaction bubbles with customer satisfaction.
import type { CategoryId } from '../engine/types';
import { box, bubble, ellipse, iso, person, rng, rgba, shade, tile, wall, wallRect, type BubbleKind, type PersonLook, type Pt } from './iso';

const TW = 64;
export const RX = 9, RY = 7;
const WALL_H = 96;

export interface VenueSpec {
  category: CategoryId;
  color: string;
  name: string;
  capacity: number;
  customers: number; // last day; -1 = not opened yet
  turnedAway: number;
  staff: number;
  satisfaction: number;
}

interface Theme { floorA: string; floorB: string; wallR: string; wallL: string; trim: string; wood: string }
const THEMES: Record<CategoryId, Theme> = {
  restaurant: { floorA: '#e9d9bf', floorB: '#dcc6a4', wallR: '#7a3b2e', wallL: '#64302a', trim: '#f2c48d', wood: '#9a6a43' },
  coffee: { floorA: '#d8c3a5', floorB: '#c9b08e', wallR: '#3f5a4a', wallL: '#334a3d', trim: '#e7d3b0', wood: '#8a5a3b' },
  hotel: { floorA: '#e8e2d6', floorB: '#d9d0bf', wallR: '#2c3e63', wallL: '#24344f', trim: '#e9c46a', wood: '#7b5236' },
  clothing: { floorA: '#f1eef0', floorB: '#e4dee3', wallR: '#5a3a64', wallL: '#4a3054', trim: '#f4a6c8', wood: '#c9a27c' },
  agency: { floorA: '#cfd8e6', floorB: '#c0cbdc', wallR: '#1d3557', wallL: '#172b48', trim: '#58A6FF', wood: '#e8edf5' },
  startup: { floorA: '#2a3446', floorB: '#232c3c', wallR: '#141d33', wallL: '#10182b', trim: '#22d3ee', wood: '#3a465c' },
};

const SKINS = ['#f2d0b5', '#e0ac8a', '#c68863', '#8d5a3b', '#f5d7c4', '#a86f4c'];
const HAIRS = ['#2b1d14', '#5a3a22', '#d9b26a', '#111111', '#7a2e1f', '#3b2a20', '#c9c9c9'];
const SHIRTS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b', '#f97316'];

const look = (i: number, extra?: Partial<PersonLook>): PersonLook => {
  const r = rng(i * 7919 + 13);
  return { shirt: SHIRTS[Math.floor(r() * SHIRTS.length)], skin: SKINS[Math.floor(r() * SKINS.length)], hair: HAIRS[Math.floor(r() * HAIRS.length)], ...extra };
};

interface Layout {
  tables: [number, number][]; // furniture anchor positions, in order of unlocking
  seatOffset: [number, number][]; // seats relative to each table anchor
  staffSpots: [number, number][];
  queue: [number, number][];
  sitting: boolean;
}

const LAYOUTS: Record<CategoryId, Layout> = {
  restaurant: { tables: [[1.6, 3], [4.1, 3], [6.6, 3], [1.6, 5.2], [4.1, 5.2], [6.6, 5.2], [8, 4.1]], seatOffset: [[0.4, 1.15], [1.15, 0.4]], staffSpots: [[2.1, 1.55], [3.5, 1.55], [6.2, 1.6], [3.2, 4.3], [5.6, 4.3], [7.4, 2.2]], queue: [[4.4, 7.4], [4.9, 7.9], [5.4, 8.4]], sitting: true },
  coffee: { tables: [[1.5, 3.4], [3.6, 3.4], [5.7, 3.4], [1.5, 5.5], [3.6, 5.5], [5.7, 5.5], [7.6, 4.4]], seatOffset: [[0.3, 0.95], [0.95, 0.3]], staffSpots: [[2.4, 1.6], [4, 1.6], [5.5, 1.6], [7.2, 2.3]], queue: [[4.4, 7.4], [4.9, 7.9], [5.4, 8.4]], sitting: true },
  hotel: { tables: [[1.4, 3.6], [4.2, 3.6], [1.4, 5.6], [4.2, 5.6], [6.8, 4.8], [6.8, 2.8]], seatOffset: [[0.5, 1.05], [1.2, 0.45]], staffSpots: [[3, 1.6], [4.4, 1.6], [7.6, 1.6], [5.6, 6.4]], queue: [[4.4, 7.4], [4.9, 7.9], [5.4, 8.4]], sitting: true },
  clothing: { tables: [[2.6, 3.2], [5.2, 3.2], [2.6, 5.4], [5.2, 5.4], [7.4, 4.2], [7.4, 6.2]], seatOffset: [[0.3, 1.05], [1.05, 0.3]], staffSpots: [[7, 1.7], [4, 4.4], [1.5, 2.2], [6.2, 6.6]], queue: [[4.4, 7.4], [4.9, 7.9], [5.4, 8.4]], sitting: false },
  agency: { tables: [[1.6, 2.4], [4, 2.4], [6.4, 2.4], [1.6, 4.6], [4, 4.6], [6.4, 4.6]], seatOffset: [[0.45, 1.1]], staffSpots: [[2, 3.6], [4.4, 3.6], [6.8, 3.6], [2, 5.8], [4.4, 5.8], [6.8, 5.8]], queue: [[4.4, 7.4], [4.9, 7.9], [5.4, 8.4]], sitting: true },
  startup: { tables: [[1.6, 2.6], [4, 2.6], [1.6, 4.8], [4, 4.8], [6.6, 4.8], [6.6, 2.6]], seatOffset: [[0.45, 1.1]], staffSpots: [[2, 3.8], [4.4, 3.8], [2, 6], [4.4, 6], [7, 6], [7, 3.8]], queue: [[4.4, 7.4], [4.9, 7.9], [5.4, 8.4]], sitting: true },
};

export const venueBounds = () => {
  const pts = [iso(0, 0, 0, TW), iso(RX, 0, 0, TW), iso(0, RY, 0, TW), iso(RX, RY, 0, TW), iso(5, 9, 0, TW)];
  return { minX: Math.min(...pts.map((p) => p.x)) - 4, maxX: Math.max(...pts.map((p) => p.x)) + 4, minY: Math.min(...pts.map((p) => p.y)) - WALL_H - 10, maxY: Math.max(...pts.map((p) => p.y)) + 4 };
};

/** How many furniture groups are shown for a capacity. */
export function tableCount(spec: VenueSpec) {
  const L = LAYOUTS[spec.category];
  const perTable = L.seatOffset.length * (spec.category === 'hotel' ? 0.5 : 2);
  return Math.max(2, Math.min(L.tables.length, Math.ceil(spec.capacity / Math.max(1, perTable * 2))));
}

function seats(spec: VenueSpec): Pt[] {
  const L = LAYOUTS[spec.category];
  const out: Pt[] = [];
  L.tables.slice(0, tableCount(spec)).forEach(([x, y]) => L.seatOffset.forEach(([dx, dy]) => out.push(iso(x + dx, y + dy, 0, TW))));
  return out;
}

function plant(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  box(ctx, gx, gy, 0.35, 0.35, 10, '#8a5a3b', { tw: TW });
  const p = iso(gx + 0.17, gy + 0.17, 14, TW);
  ellipse(ctx, p.x, p.y - 6, 9, 10, '#2f8f5b');
  ellipse(ctx, p.x - 4, p.y - 2, 6, 6, '#3fa86c');
  ellipse(ctx, p.x + 4, p.y - 9, 5, 5, '#5cc485');
}

function monitor(ctx: CanvasRenderingContext2D, gx: number, gy: number, z: number, glow: string) {
  box(ctx, gx, gy, 0.42, 0.08, 16, '#1b2433', { tw: TW, topColor: '#2a3448' }, z);
  const a = iso(gx, gy + 0.08, z + 3, TW), b = iso(gx + 0.42, gy + 0.08, z + 3, TW);
  ctx.beginPath();
  ctx.moveTo(a.x + 1, a.y); ctx.lineTo(b.x - 1, b.y); ctx.lineTo(b.x - 1, b.y - 11); ctx.lineTo(a.x + 1, a.y - 11); ctx.closePath();
  ctx.fillStyle = glow;
  ctx.fill();
}

function neonSign(ctx: CanvasRenderingContext2D, text: string, color: string) {
  // Painted along the back-right wall (x axis): skew to the isometric slope.
  const start = iso(2.2, 0, 0, TW);
  ctx.save();
  ctx.translate(start.x, start.y - WALL_H + 30);
  ctx.transform(1, 0.5, 0, 1, 0, 0);
  ctx.font = '700 17px "Space Grotesk Variable", system-ui, sans-serif';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = shade(color, 0.55);
  ctx.fillText(text.slice(0, 18), 0, 0);
  ctx.restore();
}

/** Static scene: room, walls, furniture. Drawn once per state change. */
export function drawVenueStatic(ctx: CanvasRenderingContext2D, spec: VenueSpec) {
  const th = THEMES[spec.category];
  const brand = spec.color;
  // Floor
  for (let y = 0; y < RY; y++) for (let x = 0; x < RX; x++) tile(ctx, x, y, 1, 1, (x + y) % 2 ? th.floorA : th.floorB, TW);
  // Front floor edge
  const f0 = iso(0, RY, 0, TW), f1 = iso(RX, RY, 0, TW), f2 = iso(RX, 0, 0, TW);
  ctx.beginPath(); ctx.moveTo(f0.x, f0.y); ctx.lineTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.lineTo(f2.x, f2.y + 10); ctx.lineTo(f1.x, f1.y + 10); ctx.lineTo(f0.x, f0.y + 10); ctx.closePath();
  ctx.fillStyle = shade(th.floorB, -0.5); ctx.fill();
  // Walls
  wall(ctx, 'y', 0, RY, WALL_H, th.wallL, TW);
  wall(ctx, 'x', 0, RX, WALL_H, th.wallR, TW);
  wallRect(ctx, 'x', 0, RX, WALL_H - 6, WALL_H, shade(th.wallR, 0.15), TW);
  wallRect(ctx, 'y', 0, RY, WALL_H - 6, WALL_H, shade(th.wallL, 0.12), TW);
  wallRect(ctx, 'x', 0, RX, 0, 6, th.trim, TW);
  wallRect(ctx, 'y', 0, RY, 0, 6, shade(th.trim, -0.15), TW);
  // Night windows on the left wall
  for (const u of [1.2, 3.4, 5.6]) {
    wallRect(ctx, 'y', u, u + 1.4, 30, 76, '#0b1f44', TW);
    for (let i = 0; i < 6; i++) wallRect(ctx, 'y', u + 0.15 + (i % 3) * 0.42, u + 0.3 + (i % 3) * 0.42, 40 + Math.floor(i / 3) * 16, 46 + Math.floor(i / 3) * 16, i % 2 ? '#ffd27a' : '#8cc8ff', TW);
    wallRect(ctx, 'y', u, u + 1.4, 74, 78, th.trim, TW);
  }
  neonSign(ctx, spec.name, brand);

  const L = LAYOUTS[spec.category];
  const n = tableCount(spec);
  const objs: { k: number; d: () => void }[] = [];
  const add = (k: number, d: () => void) => objs.push({ k, d });

  switch (spec.category) {
    case 'restaurant':
      add(1, () => { box(ctx, 0.9, 0.25, 4.4, 0.85, 26, '#9aa3ad', { tw: TW, topColor: '#cfd6dd' }); for (const sx of [1.3, 2.5, 3.7]) { box(ctx, sx, 0.35, 0.7, 0.6, 3, '#2a2f36', { tw: TW }, 26); const p = iso(sx + 0.35, 0.65, 30, TW); ellipse(ctx, p.x, p.y, 7, 3.5, 'rgba(255,120,40,0.7)'); } });
      add(1.5, () => box(ctx, 5.7, 0.3, 2.4, 0.8, 24, shade(brand, -0.2), { tw: TW, topColor: th.wood }));
      L.tables.slice(0, n).forEach(([x, y]) => add(x + y, () => { box(ctx, x, y, 0.85, 0.85, 14, th.wood, { tw: TW, topColor: '#f5efe6' }); box(ctx, x + 0.3, y + 0.3, 0.25, 0.25, 4, '#e94f37', { tw: TW }, 14); }));
      break;
    case 'coffee':
      add(1, () => { box(ctx, 1.4, 0.3, 5, 0.8, 24, th.wood, { tw: TW, topColor: '#efe2cf' }); box(ctx, 2, 0.4, 0.6, 0.5, 14, '#c0c7cf', { tw: TW }, 24); box(ctx, 4.6, 0.4, 0.5, 0.4, 18, '#2b2b2b', { tw: TW }, 24); });
      L.tables.slice(0, n).forEach(([x, y]) => add(x + y, () => { box(ctx, x + 0.1, y + 0.1, 0.55, 0.55, 13, '#2b2b2b', { tw: TW, topColor: th.wood }); }));
      break;
    case 'hotel':
      add(1, () => { box(ctx, 2.2, 0.35, 3, 0.8, 24, shade(brand, -0.25), { tw: TW, topColor: th.wood, glow: rgba(brand, 0.6) }); });
      add(1.2, () => { wallRect(ctx, 'x', 6.6, 7.8, 0, 62, '#aab4c3', TW); wallRect(ctx, 'x', 7.18, 7.22, 0, 62, '#6b7686', TW); wallRect(ctx, 'x', 6.9, 7.5, 66, 72, '#ffd27a', TW); });
      add(2, () => tile(ctx, 1, 3, 5, 3.4, rgba(brand, 0.25), TW));
      L.tables.slice(0, n).forEach(([x, y]) => add(x + y, () => { box(ctx, x, y, 1.1, 0.45, 10, '#4a3a5a', { tw: TW }); box(ctx, x, y, 1.1, 0.15, 20, '#3d2f4b', { tw: TW }); box(ctx, x + 0.3, y + 0.75, 0.5, 0.3, 8, th.wood, { tw: TW }); }));
      break;
    case 'clothing':
      add(1, () => { for (let i = 0; i < 4; i++) { const x = 1 + i * 1.6; box(ctx, x, 0.35, 1.2, 0.12, 50, '#9aa3ad', { tw: TW }); for (let j = 0; j < 5; j++) box(ctx, x + 0.1 + j * 0.22, 0.42, 0.16, 0.08, 26, SHIRTS[(i * 5 + j) % SHIRTS.length], { tw: TW }, 18); } });
      add(1.3, () => box(ctx, 6.8, 0.9, 1.6, 0.7, 22, shade(brand, -0.2), { tw: TW, topColor: '#f5f5f5' }));
      L.tables.slice(0, n).forEach(([x, y], i) => add(x + y, () => { box(ctx, x, y, 0.9, 0.9, 12, th.wood, { tw: TW }); for (let j = 0; j < 3; j++) box(ctx, x + 0.12 + j * 0.25, y + 0.2, 0.2, 0.5, 4 + j, SHIRTS[(i + j * 3) % SHIRTS.length], { tw: TW }, 12); }));
      break;
    case 'agency':
    case 'startup':
      add(0.5, () => { wallRect(ctx, 'x', 4.8, 8, 34, 70, '#f4f7fb', TW); wallRect(ctx, 'x', 5.1, 6.4, 50, 54, '#1E6BFF', TW); wallRect(ctx, 'x', 5.1, 7.2, 42, 45, '#94a3b8', TW); });
      if (spec.category === 'startup') add(1, () => { for (const x of [0.4, 1.2]) box(ctx, x, 0.3, 0.7, 0.6, 62, '#0f1726', { tw: TW, windows: { rows: 7, cols: 2, lit: 0.8, color: '#22d3ee', seed: x * 10 } }); });
      L.tables.slice(0, n).forEach(([x, y]) => add(x + y, () => { box(ctx, x, y, 1.3, 0.75, 16, th.wood, { tw: TW, topColor: shade(th.wood, 0.1) }); monitor(ctx, x + 0.2, y + 0.15, 16, spec.category === 'startup' ? '#22d3ee' : '#58A6FF'); monitor(ctx, x + 0.75, y + 0.15, 16, spec.category === 'startup' ? '#a78bfa' : '#8cc8ff'); }));
      break;
  }
  add(0.6, () => plant(ctx, 8.3, 0.4));
  add(6.9, () => plant(ctx, 0.35, 6.3));
  objs.sort((a, b) => a.k - b.k).forEach((o) => o.d());
  // Entrance mat
  tile(ctx, 4.1, 6.4, 1.4, 0.6, rgba(brand, 0.55), TW);
}

const reaction = (sat: number): BubbleKind => (sat >= 75 ? 'heart' : sat >= 58 ? 'happy' : sat >= 42 ? 'meh' : 'angry');

/** Animated layer: staff, customers, a walking guest and reaction bubbles. t in seconds. */
export function drawVenueDynamic(ctx: CanvasRenderingContext2D, spec: VenueSpec, t: number) {
  const L = LAYOUTS[spec.category];
  const st = seats(spec);
  const fill = spec.customers < 0 ? 0 : spec.capacity > 0 ? Math.min(1, spec.customers / spec.capacity) : 0;
  const shown = spec.customers > 0 ? Math.max(1, Math.round(st.length * fill)) : 0;
  const chef = spec.category === 'restaurant' || spec.category === 'coffee';
  const staffLook = (i: number) => look(900 + i, { shirt: i === 0 ? '#ffffff' : shade(spec.color, -0.1), apron: chef ? shade(spec.color, -0.25) : undefined, hat: chef && i < 3 ? 'chef' : spec.category === 'hotel' ? 'cap' : null });

  type Draw = { y: number; d: () => void };
  const list: Draw[] = [];
  // Staff (founder + hires)
  const staffN = Math.min(L.staffSpots.length, spec.staff + 1);
  for (let i = 0; i < staffN; i++) {
    const [gx, gy] = L.staffSpots[i];
    const sway = Math.sin(t * 1.6 + i) * 0.12;
    const p = iso(gx + sway, gy, 0, TW);
    list.push({ y: p.y, d: () => person(ctx, p, staffLook(i), 1, (spec.category === 'agency' || spec.category === 'startup')) });
  }
  // Seated / browsing customers
  for (let i = 0; i < shown; i++) {
    const p0 = st[i];
    const bob = L.sitting ? 0 : Math.sin(t * 2 + i) * 1.5;
    const p = { x: p0.x, y: p0.y + bob };
    list.push({ y: p.y, d: () => {
      const head = person(ctx, p, look(i), 1, L.sitting);
      if (Math.sin(t * 0.9 + i * 1.7) > 0.55) bubble(ctx, p.x, head, i % 4 === 3 ? 'coin' : reaction(spec.satisfaction), 1);
    } });
  }
  // Walking guest
  if (shown > 0) {
    const cyc = (t * 0.12) % 1;
    const k = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2;
    const gx = 4.7 + (2.5 - 4.7) * k, gy = 7.6 + (2.2 - 7.6) * k;
    const p = iso(gx, gy, Math.abs(Math.sin(t * 8)) * 1.5, TW);
    list.push({ y: p.y, d: () => person(ctx, p, look(77), 1) });
  }
  // Queue of turned-away customers
  for (let i = 0; i < Math.min(3, spec.turnedAway); i++) {
    const [gx, gy] = L.queue[i];
    const p = iso(gx, gy, 0, TW);
    list.push({ y: p.y, d: () => { const head = person(ctx, p, look(300 + i), 1); if (Math.sin(t * 1.3 + i) > 0) bubble(ctx, p.x, head, 'angry', 1); } });
  }
  list.sort((a, b) => a.y - b.y).forEach((o) => o.d());

  // Steam from kitchen / coffee machine
  if (chef && spec.customers > 0) {
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.6 + i / 6) % 1;
      const base = iso(spec.category === 'coffee' ? 2.3 : 1.65 + (i % 3) * 1.2, 0.65, (spec.category === 'coffee' ? 38 : 30) + ph * 30, TW);
      ellipse(ctx, base.x + Math.sin(ph * 6 + i) * 3, base.y, 3 + ph * 4, 3 + ph * 4, `rgba(255,255,255,${0.25 * (1 - ph)})`);
    }
  }
}
