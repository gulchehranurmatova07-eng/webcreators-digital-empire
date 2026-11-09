// Isometric drawing primitives for Canvas 2D. All game art (city, interiors, website images)
// is drawn procedurally with these helpers, so the game ships no heavy image files.

export interface Pt { x: number; y: number }

/** Grid → screen. tw = tile width in px (tile height is tw/2). z lifts the point up. */
export const iso = (gx: number, gy: number, gz = 0, tw = 64): Pt => ({ x: ((gx - gy) * tw) / 2, y: ((gx + gy) * tw) / 4 - gz });

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** Lighten (amt > 0) or darken (amt < 0) a hex color. amt in [-1, 1]. */
export function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
export const rgba = (hex: string, a: number) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

/** Deterministic random generator (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poly(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, stroke?: string, lw = 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

export interface BoxOpts {
  tw: number;
  windows?: { rows: number; cols: number; lit: number; color: string; seed: number };
  edge?: string; // outline color for a crisp look
  topColor?: string;
  glow?: string; // glowing outline (brand)
}

/** Draws an isometric box with footprint (gx,gy,w,d), lifted by z, height h (in px). */
export function box(ctx: CanvasRenderingContext2D, gx: number, gy: number, w: number, d: number, h: number, color: string, o: BoxOpts, z = 0) {
  const tw = o.tw;
  const A = iso(gx, gy, z, tw), B = iso(gx + w, gy, z, tw), C = iso(gx + w, gy + d, z, tw), D = iso(gx, gy + d, z, tw);
  const up = (p: Pt) => ({ x: p.x, y: p.y - h });
  const left = [D, C, up(C), up(D)];
  const right = [B, C, up(C), up(B)];
  const top = [up(A), up(B), up(C), up(D)];
  poly(ctx, left, shade(color, -0.28), o.edge, 0.6);
  poly(ctx, right, shade(color, -0.48), o.edge, 0.6);
  poly(ctx, top, o.topColor ?? shade(color, 0.08), o.edge, 0.6);

  if (o.windows && h > 10) {
    const { rows, cols, lit, color: wc, seed } = o.windows;
    const r = rng(seed);
    const faces: [Pt, Pt][] = [[D, C], [B, C]];
    for (const [p0, p1] of faces) {
      for (let row = 0; row < rows; row++) {
        const v = ((row + 0.6) / (rows + 0.4)) * h;
        for (let col = 0; col < cols; col++) {
          const u0 = (col + 0.25) / cols, u1 = (col + 0.75) / cols;
          const on = r() < lit;
          const a = { x: p0.x + (p1.x - p0.x) * u0, y: p0.y + (p1.y - p0.y) * u0 - v };
          const b = { x: p0.x + (p1.x - p0.x) * u1, y: p0.y + (p1.y - p0.y) * u1 - v };
          const wh = Math.max(1.4, (h / rows) * 0.38);
          poly(ctx, [a, b, { x: b.x, y: b.y - wh }, { x: a.x, y: a.y - wh }], on ? wc : 'rgba(10,20,40,0.55)');
        }
      }
    }
  }
  if (o.glow) {
    ctx.save();
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = o.glow;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    [up(A), up(B), up(C), up(D)].forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.moveTo(up(C).x, up(C).y); ctx.lineTo(C.x, C.y);
    ctx.moveTo(up(B).x, up(B).y); ctx.lineTo(B.x, B.y);
    ctx.moveTo(up(D).x, up(D).y); ctx.lineTo(D.x, D.y);
    ctx.stroke();
    ctx.restore();
  }
}

/** Flat diamond tile. */
export function tile(ctx: CanvasRenderingContext2D, gx: number, gy: number, w: number, d: number, fill: string, tw: number, stroke?: string, z = 0) {
  poly(ctx, [iso(gx, gy, z, tw), iso(gx + w, gy, z, tw), iso(gx + w, gy + d, z, tw), iso(gx, gy + d, z, tw)], fill, stroke, 0.5);
}

/** Wall face along the x axis (back-right wall) or y axis (back-left wall). */
export function wall(ctx: CanvasRenderingContext2D, axis: 'x' | 'y', from: number, to: number, h: number, fill: string, tw: number) {
  const a = axis === 'x' ? iso(from, 0, 0, tw) : iso(0, from, 0, tw);
  const b = axis === 'x' ? iso(to, 0, 0, tw) : iso(0, to, 0, tw);
  poly(ctx, [a, b, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }], fill);
}

/** Parallelogram painted onto a wall (windows, signs, art). u = along wall in tiles, v = height px. */
export function wallRect(ctx: CanvasRenderingContext2D, axis: 'x' | 'y', u0: number, u1: number, v0: number, v1: number, fill: string, tw: number) {
  const p = (u: number, v: number) => { const q = axis === 'x' ? iso(u, 0, 0, tw) : iso(0, u, 0, tw); return { x: q.x, y: q.y - v }; };
  poly(ctx, [p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)], fill);
}

export function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export interface PersonLook { shirt: string; skin: string; hair: string; hat?: 'chef' | 'cap' | null; apron?: string }

/** A small stylised person standing (or sitting) at screen point p. s = scale (1 ≈ 64px tiles). */
export function person(ctx: CanvasRenderingContext2D, p: Pt, look: PersonLook, s = 1, sitting = false) {
  const bodyH = (sitting ? 10 : 15) * s;
  ellipse(ctx, p.x, p.y, 6.5 * s, 3 * s, 'rgba(0,0,0,0.28)');
  // legs
  if (!sitting) {
    ctx.fillStyle = shade(look.shirt, -0.6);
    ctx.fillRect(p.x - 3.2 * s, p.y - 6 * s, 2.6 * s, 6 * s);
    ctx.fillRect(p.x + 0.6 * s, p.y - 6 * s, 2.6 * s, 6 * s);
  }
  // body
  const top = p.y - (sitting ? 4 : 6) * s - bodyH;
  ctx.beginPath();
  ctx.roundRect(p.x - 5 * s, top, 10 * s, bodyH, 3.5 * s);
  ctx.fillStyle = look.shirt;
  ctx.fill();
  if (look.apron) { ctx.fillStyle = look.apron; ctx.fillRect(p.x - 3.5 * s, top + bodyH * 0.35, 7 * s, bodyH * 0.65); }
  // head
  const hy = top - 5 * s;
  ellipse(ctx, p.x, hy, 5 * s, 5 * s, look.skin);
  ctx.beginPath();
  ctx.arc(p.x, hy - 0.8 * s, 5.2 * s, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fillStyle = look.hair;
  ctx.fill();
  if (look.hat === 'chef') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(p.x - 4 * s, hy - 9 * s, 8 * s, 4 * s);
    ellipse(ctx, p.x, hy - 10 * s, 5 * s, 3.5 * s, '#ffffff');
  } else if (look.hat === 'cap') {
    ctx.fillStyle = look.apron ?? '#1E6BFF';
    ctx.fillRect(p.x - 5 * s, hy - 5.5 * s, 10 * s, 2.6 * s);
  }
  return hy - 6 * s; // y just above the head (for bubbles)
}

export type BubbleKind = 'heart' | 'happy' | 'meh' | 'angry' | 'coin';

/** Speech bubble with a drawn icon, like a reaction above a customer. */
export function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, kind: BubbleKind, s = 1) {
  const w = 16 * s, h = 14 * s;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 4 * s;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h - 4 * s, w, h, 5 * s);
  ctx.moveTo(x - 3 * s, y - 4 * s); ctx.lineTo(x, y); ctx.lineTo(x + 3 * s, y - 4 * s);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  const cx = x, cy = y - h / 2 - 4 * s;
  if (kind === 'heart') {
    ctx.beginPath();
    const r = 2.6 * s;
    ctx.moveTo(cx, cy + 3.6 * s);
    ctx.bezierCurveTo(cx - 6 * s, cy - 0.5 * s, cx - 2.5 * s, cy - 5 * s, cx, cy - r * 0.6);
    ctx.bezierCurveTo(cx + 2.5 * s, cy - 5 * s, cx + 6 * s, cy - 0.5 * s, cx, cy + 3.6 * s);
    ctx.fillStyle = '#ef4466';
    ctx.fill();
  } else if (kind === 'coin') {
    ellipse(ctx, cx, cy, 4.2 * s, 4.2 * s, '#F5B942');
    ellipse(ctx, cx, cy, 2.4 * s, 2.4 * s, '#d79a1c');
  } else {
    const face = kind === 'happy' ? '#FFC93C' : kind === 'meh' ? '#F5D27A' : '#F06A6A';
    ellipse(ctx, cx, cy, 4.6 * s, 4.6 * s, face);
    ctx.fillStyle = '#3b2a1a';
    ellipse(ctx, cx - 1.6 * s, cy - 1 * s, 0.7 * s, 0.9 * s, '#3b2a1a');
    ellipse(ctx, cx + 1.6 * s, cy - 1 * s, 0.7 * s, 0.9 * s, '#3b2a1a');
    ctx.beginPath();
    ctx.lineWidth = 0.9 * s;
    ctx.strokeStyle = '#3b2a1a';
    if (kind === 'happy') ctx.arc(cx, cy + 0.6 * s, 2.2 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (kind === 'meh') { ctx.moveTo(cx - 1.8 * s, cy + 1.8 * s); ctx.lineTo(cx + 1.8 * s, cy + 1.8 * s); }
    else ctx.arc(cx, cy + 3.4 * s, 2 * s, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  }
}

/** Fit world-space bounds into a w×h viewport; returns a transform. */
export function fitTransform(bounds: { minX: number; minY: number; maxX: number; maxY: number }, w: number, h: number, pad = 12) {
  const bw = bounds.maxX - bounds.minX, bh = bounds.maxY - bounds.minY;
  const scale = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
  return { scale, ox: (w - bw * scale) / 2 - bounds.minX * scale, oy: (h - bh * scale) / 2 - bounds.minY * scale };
}
