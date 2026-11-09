import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fitTransform } from './iso';
import { cityBounds, cityPoint, drawCityDynamic, drawCityStatic, lotsFor, DISTRICT_LABEL_POS, type CityBusiness } from './city';
import { drawVenueDynamic, drawVenueStatic, venueBounds, type VenueSpec } from './venue';
import { useGame } from '../store/game';
import type { CategoryId, LocationId } from '../engine/types';

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
type Xf = { scale: number; ox: number; oy: number };

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Canvas scene with a cached static layer and an optional animated layer.
 * Animation runs at ~30fps, only while visible, and stops for reduced motion.
 */
function CanvasScene({ bounds, drawStatic, drawDynamic, background, staticKey, className, children, pad = 8, zoom = 1 }: {
  bounds: Bounds; drawStatic: (ctx: CanvasRenderingContext2D) => void; drawDynamic?: (ctx: CanvasRenderingContext2D, t: number) => void;
  background: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; staticKey: string; className?: string; pad?: number;
  children?: (xf: Xf) => ReactNode; zoom?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const reducedSetting = useGame((g) => g.settings.reducedMotion);
  const xf = useMemo(() => {
    if (!size.w) return { scale: 1, ox: 0, oy: 0 };
    const f = fitTransform(bounds, size.w, size.h, pad);
    // Zoom around the viewport centre (crops the edges for a closer view).
    return { scale: f.scale * zoom, ox: size.w / 2 - (size.w / 2 - f.ox) * zoom, oy: size.h / 2 - (size.h / 2 - f.oy) * zoom };
  }, [bounds, size, pad, zoom]);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const staticLayer = useMemo(() => {
    if (!size.w || !size.h) return null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const c = document.createElement('canvas');
    c.width = size.w * dpr; c.height = size.h * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.scale(dpr, dpr);
    background(ctx, size.w, size.h);
    ctx.setTransform(dpr * xf.scale, 0, 0, dpr * xf.scale, dpr * xf.ox, dpr * xf.oy);
    drawStatic(ctx);
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, xf, staticKey]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !staticLayer) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size.w * dpr; c.height = size.h * dpr;
    const ctx = c.getContext('2d')!;
    let raf = 0, last = 0, visible = true;
    const t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || now - last < 33) return;
      last = now;
      paint((now - t0) / 1000);
    };
    const paint = (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(staticLayer, 0, 0);
      if (drawDynamic) {
        ctx.setTransform(dpr * xf.scale, 0, 0, dpr * xf.scale, dpr * xf.ox, dpr * xf.oy);
        drawDynamic(ctx, t);
      }
    };
    const still = reducedSetting || prefersReduced() || !drawDynamic;
    paint(2.4);
    if (still) return;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(c);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [staticLayer, drawDynamic, size, xf, reducedSetting]);

  return (
    <div ref={wrap} className={`relative overflow-hidden ${className ?? ''}`}>
      <canvas ref={canvas} className="absolute inset-0 w-full h-full" style={{ width: size.w, height: size.h }} aria-hidden="true" />
      {size.w > 0 && children?.(xf)}
    </div>
  );
}

const nightSky = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#071630'); g.addColorStop(0.55, '#050c1c'); g.addColorStop(1, '#03060f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = ctx.createRadialGradient(w * 0.55, h * 0.55, 10, w * 0.55, h * 0.55, Math.max(w, h) * 0.6);
  r.addColorStop(0, 'rgba(30,107,255,0.22)'); r.addColorStop(1, 'rgba(30,107,255,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);
};

const DISTRICT_NAMES: Record<LocationId, string> = { techquarter: 'Tech Quarter', oldtown: 'Old Town', harbor: 'Harbor District', riverside: 'Riverside' };

export interface CityMarker extends CityBusiness { name: string; icon: ReactNode }

/** The animated night city with clickable business markers. */
export function CityMap({ businesses, onSelect, className, labels = true, zoom = 1 }: { businesses: CityMarker[]; onSelect?: (id: string) => void; className?: string; labels?: boolean; zoom?: number }) {
  const lots = useMemo(() => lotsFor(businesses), [businesses]);
  const key = lots.map((l) => `${l.id}${l.gx}${l.gy}${l.color}${l.height}`).join('|');
  const bounds = useMemo(cityBounds, []);
  const drawStatic = useMemo(() => (ctx: CanvasRenderingContext2D) => drawCityStatic(ctx, lots), [lots]);
  const drawDynamic = useMemo(() => (ctx: CanvasRenderingContext2D, t: number) => drawCityDynamic(ctx, lots, t), [lots]);
  return (
    <CanvasScene bounds={bounds} drawStatic={drawStatic} drawDynamic={drawDynamic} background={nightSky} staticKey={key} className={className} zoom={zoom} pad={0}>
      {(xf) => (
        <>
          {labels && (Object.keys(DISTRICT_LABEL_POS) as LocationId[]).map((d) => {
            const [gx, gy] = DISTRICT_LABEL_POS[d];
            const p = cityPoint(gx, gy, 6);
            return (
              <span key={d} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase text-brand-2/70 whitespace-nowrap"
                style={{ left: p.x * xf.scale + xf.ox, top: p.y * xf.scale + xf.oy }}>{DISTRICT_NAMES[d]}</span>
            );
          })}
          {lots.map((l) => {
            const b = businesses.find((x) => x.id === l.id)!;
            const p = cityPoint(l.gx + 0.5, l.gy + 0.5, l.height + 26);
            return (
              <button key={l.id} onClick={() => onSelect?.(l.id)} aria-label={`Open ${b.name}`} title={b.name}
                className="absolute -translate-x-1/2 -translate-y-full group flex flex-col items-center"
                style={{ left: p.x * xf.scale + xf.ox, top: p.y * xf.scale + xf.oy }}>
                <span className="grid place-items-center size-8 sm:size-9 rounded-full border-2 bg-ink/85 shadow-[0_0_18px_-2px_currentColor] transition group-hover:scale-110"
                  style={{ color: b.color, borderColor: b.color }}>{b.icon}</span>
                <span className="w-px h-2.5" style={{ background: b.color }} />
                <span className="hidden sm:block absolute top-full mt-0.5 text-[10px] font-semibold text-white bg-ink/80 border border-line rounded-md px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition">{b.name}</span>
              </button>
            );
          })}
        </>
      )}
    </CanvasScene>
  );
}

const interiorBg = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  const g = ctx.createRadialGradient(w / 2, h * 0.6, 20, w / 2, h * 0.6, Math.max(w, h) * 0.7);
  g.addColorStop(0, '#0d2244'); g.addColorStop(1, '#040a16');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
};

/** Animated interior of a business. */
export function VenueScene({ spec, className, animate = true }: { spec: VenueSpec; className?: string; animate?: boolean }) {
  const bounds = useMemo(venueBounds, []);
  const key = JSON.stringify(spec);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const drawStatic = useMemo(() => (ctx: CanvasRenderingContext2D) => drawVenueStatic(ctx, spec), [key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const drawDynamic = useMemo(() => (animate ? (ctx: CanvasRenderingContext2D, t: number) => drawVenueDynamic(ctx, spec, t) : undefined), [key, animate]);
  return <CanvasScene bounds={bounds} drawStatic={drawStatic} drawDynamic={drawDynamic} background={interiorBg} staticKey={key} className={className} pad={10} />;
}

// ---------- Static images for website assets (cached data URLs) ----------
const imageCache = new Map<string, string>();

export type SceneImageKind = { type: 'venue'; category: CategoryId; color: string; name: string } | { type: 'city' };

export function sceneImage(kind: SceneImageKind, w = 640, h = 400): string {
  const k = JSON.stringify(kind) + w + 'x' + h;
  const hit = imageCache.get(k);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  if (kind.type === 'city') {
    nightSky(ctx, w, h);
    const xf = fitTransform(cityBounds(), w, h, -40);
    ctx.setTransform(xf.scale, 0, 0, xf.scale, xf.ox, xf.oy);
    const lots = lotsFor([{ id: 'a', location: 'harbor', color: '#58A6FF', level: 4 }, { id: 'b', location: 'oldtown', color: '#F5B942', level: 2 }]);
    drawCityStatic(ctx, lots, 11);
    drawCityDynamic(ctx, lots, 3.3);
  } else {
    interiorBg(ctx, w, h);
    const spec: VenueSpec = { category: kind.category, color: kind.color, name: kind.name, capacity: 40, customers: 30, turnedAway: 0, staff: 3, satisfaction: 80 };
    const xf = fitTransform(venueBounds(), w, h, -6);
    ctx.setTransform(xf.scale, 0, 0, xf.scale, xf.ox, xf.oy);
    drawVenueStatic(ctx, spec);
    drawVenueDynamic(ctx, spec, 2.1);
  }
  let url = '';
  try { url = c.toDataURL('image/webp', 0.82); } catch { url = ''; }
  imageCache.set(k, url);
  return url;
}
