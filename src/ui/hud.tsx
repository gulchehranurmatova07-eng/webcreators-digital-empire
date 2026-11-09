// Command-center UI pieces: framed panels, hexagon KPIs, segment meters, founder portraits.
import type { ReactNode } from 'react';
import { characterById, portrait } from '../engine/characters';
import { useGame } from '../store/game';
import { Icon } from './Icon';
import { cx } from './kit';

export function Panel({ title, icon, action, children, className, bodyClass }: { title?: string; icon?: string; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cx('panel', className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5 border-b border-line">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-soft">
            {icon && <Icon name={icon} size={14} className="text-cyan" />}{title}
          </h2>
          {action}
        </header>
      )}
      <div className={cx('p-4', bodyClass)}>{children}</div>
    </section>
  );
}

export const grade = (score: number) => (score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D');
const gradeColor = (g: string) => (g === 'A' ? '#22c3a6' : g === 'B' ? '#58A6FF' : g === 'C' ? '#F5B942' : '#F06A6A');

/** Five-segment meter, like a signal-strength indicator. */
export function Meter({ score, color }: { score: number; color?: string }) {
  const filled = Math.round(Math.max(0, Math.min(100, score)) / 20);
  return (
    <div className="flex flex-col-reverse gap-[3px]" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="block w-4 h-[5px] rounded-[1px]" style={{ background: i < filled ? color ?? gradeColor(grade(score)) : 'rgb(255 255 255 / 0.08)' }} />
      ))}
    </div>
  );
}

/** Hexagon KPI with grade letter, trend and meter. score: 0–100. */
export function HexStat({ label, value, score, trend = 0, size = 92 }: { label: string; value: ReactNode; score: number; trend?: number; size?: number }) {
  const g = grade(score);
  const col = gradeColor(g);
  const h = size, w = size * 0.92;
  const pts = [[w / 2, 2], [w - 2, h * 0.26], [w - 2, h * 0.74], [w / 2, h - 2], [2, h * 0.74], [2, h * 0.26]].map((p) => p.join(',')).join(' ');
  const inner = [[w / 2, 9], [w - 8, h * 0.29], [w - 8, h * 0.71], [w / 2, h - 9], [8, h * 0.71], [8, h * 0.29]].map((p) => p.join(',')).join(' ');
  return (
    <div className="flex items-center gap-2.5" role="group" aria-label={`${label}: ${typeof value === 'string' || typeof value === 'number' ? value : ''}, grade ${g}`}>
      <div className="relative shrink-0" style={{ width: w, height: h }}>
        <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden="true">
          <polygon points={pts} fill="rgb(6 14 30 / 0.9)" stroke={col} strokeOpacity="0.85" strokeWidth="1.6" style={{ filter: `drop-shadow(0 0 6px ${col}66)` }} />
          <polygon points={inner} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="1" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2.5">
          <div className="font-display text-[17px] font-semibold leading-none tabular-nums text-white">{value}</div>
          <div className="text-[8px] leading-tight mt-1 text-mute uppercase tracking-wide max-w-full">{label}</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="flex items-center gap-0.5 font-display text-sm font-bold" style={{ color: col }}>
          {g}{trend > 0 ? <Icon name="chevron-up" size={12} className="text-good" /> : trend < 0 ? <Icon name="chevron-down" size={12} className="text-bad" /> : <span className="text-mute text-[10px]">=</span>}
        </span>
        <Meter score={score} color={col} />
      </div>
    </div>
  );
}

/** The player's portrait: chosen character photo, or the icon avatar for older saves. */
export function FounderPortrait({ size = 40, className, ring = true }: { size?: number; className?: string; ring?: boolean }) {
  const player = useGame((g) => g.player);
  const ch = characterById(player?.character);
  if (ch) {
    return (
      <img src={portrait(ch.id, size <= 64)} alt={ch.name} width={size} height={size}
        className={cx('rounded-2xl object-cover object-top shrink-0 bg-navy-2', ring && 'ring-1 ring-brand-2/40 shadow-[0_8px_24px_-8px_rgb(30_107_255/0.7)]', className)}
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className={cx('grid place-items-center rounded-2xl bg-gradient-to-br from-brand to-[#0a2a66] text-white shrink-0', className)} style={{ width: size, height: size }}>
      <Icon name={player?.avatar ?? 'user'} size={size * 0.48} />
    </div>
  );
}
