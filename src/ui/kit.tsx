// WEB-CREATORS design system: reusable, branded components.
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({
  variant = 'primary', size = 'md', icon, children, className, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: string }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition select-none whitespace-nowrap',
        'disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        variant === 'primary' && 'bg-brand text-white shadow-[0_8px_24px_-8px_rgb(30_107_255/0.8)] hover:bg-[#2f78ff] enabled:hover:shadow-[0_10px_30px_-8px_rgb(30_107_255/0.95)]',
        variant === 'secondary' && 'bg-white/[0.06] text-white border border-line-strong hover:bg-white/[0.1]',
        variant === 'ghost' && 'text-soft hover:text-white hover:bg-white/[0.06]',
        variant === 'danger' && 'bg-bad/15 text-bad border border-bad/30 hover:bg-bad/25',
        className,
      )}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

export function Card({ children, className, as: As = 'div', ...rest }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' } & React.HTMLAttributes<HTMLElement>) {
  return <As {...rest} className={cx('card', className)}>{children}</As>;
}

export function CardTitle({ icon, children, action }: { icon?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight text-white">
        {icon && <span className="grid place-items-center size-7 rounded-lg bg-brand/15 text-brand-2"><Icon name={icon} size={15} /></span>}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Badge({ children, tone = 'blue', className }: { children: ReactNode; tone?: 'blue' | 'good' | 'warn' | 'bad' | 'mute'; className?: string }) {
  return (
    <span className={cx(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border',
      tone === 'blue' && 'bg-brand/12 text-brand-2 border-brand/25',
      tone === 'good' && 'bg-good/12 text-good border-good/25',
      tone === 'warn' && 'bg-warn/12 text-warn border-warn/25',
      tone === 'bad' && 'bg-bad/12 text-bad border-bad/25',
      tone === 'mute' && 'bg-white/5 text-mute border-white/10',
      className,
    )}>{children}</span>
  );
}

export function Progress({ value, max, tone = 'brand', className, label }: { value: number; max: number; tone?: 'brand' | 'good' | 'warn'; className?: string; label?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={cx('h-2 rounded-full bg-white/[0.06] overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div
        className={cx('h-full rounded-full transition-[width] duration-700 ease-out',
          tone === 'brand' && 'bg-gradient-to-r from-brand to-brand-2',
          tone === 'good' && 'bg-gradient-to-r from-good/80 to-good',
          tone === 'warn' && 'bg-gradient-to-r from-warn/70 to-warn')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Stat({ icon, label, value, sub, tone }: { icon: string; label: string; value: ReactNode; sub?: ReactNode; tone?: 'good' | 'bad' }) {
  return (
    <div className="card p-4 min-w-0">
      <div className="flex items-center gap-2 text-mute text-xs">
        <Icon name={icon} size={14} className="text-brand-2" />
        <span className="truncate">{label}</span>
      </div>
      <div className={cx('mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums', tone === 'good' && 'text-good', tone === 'bad' && 'text-bad')}>{value}</div>
      {sub && <div className="mt-1 text-xs text-mute truncate">{sub}</div>}
    </div>
  );
}

export function CoinIcon({ size = 16 }: { size?: number }) {
  const id = `cg${useId().replace(/:/g, '')}`; // unique per instance: hidden copies must not break visible ones
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9cc8ff" /><stop offset="1" stopColor="#1E6BFF" /></linearGradient></defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${id})`} />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#071426" strokeOpacity=".45" strokeWidth="1.5" />
      <path d="M9 9.5l1.2 5 1.8-4 1.8 4 1.2-5" fill="none" stroke="#071426" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Coins({ value, className, signed }: { value: number; className?: string; signed?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 tabular-nums', className)}>
      <CoinIcon />
      {signed && value > 0 ? '+' : ''}{fmt(value)}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-2xl bg-brand/30 blur-xl animate-glow" />
        <div className="relative grid place-items-center size-14 rounded-2xl bg-navy-2 border border-line-strong text-brand-2"><Icon name={icon} size={24} /></div>
      </div>
      <h3 className="font-display font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-mute">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-rise">
      <div className="min-w-0">
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.18em] text-brand-2 font-semibold mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-mute max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-soft mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-mute mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full h-10 rounded-xl bg-ink/70 border border-line-strong px-3 text-sm text-white placeholder:text-mute/60 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition';
export const textareaCls = inputCls.replace('h-10', 'min-h-24 py-2');

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; icon?: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-1 rounded-xl bg-ink/60 border border-line gap-1">
      {options.map((o) => (
        <button
          key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx('inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition',
            value === o.value ? 'bg-brand text-white' : 'text-mute hover:text-white')}
        >
          {o.icon && <Icon name={o.icon} size={14} />}{o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-ink/80" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className="card relative w-full sm:max-w-md p-6 rounded-b-none sm:rounded-b-[1.25rem] animate-pop outline-none max-h-[90dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-mute hover:text-white -m-1 p-1" aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="text-sm text-soft">{children}</div>
        {footer && <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Small bar chart (SVG) for daily profit history. */
export function BarChart({ data, height = 96, label }: { data: { x: string; y: number }[]; height?: number; label: string }) {
  const gid = `bg${useId().replace(/:/g, '')}`;
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => Math.abs(d.y)));
  const hasNeg = data.some((d) => d.y < 0);
  const zero = hasNeg ? height / 2 : height - 2;
  const scale = (hasNeg ? height / 2 - 4 : height - 6) / max;
  const w = 100 / data.length;
  return (
    <figure>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label={label}>
        <line x1="0" x2="100" y1={zero} y2={zero} stroke="rgb(88 166 255 / .2)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const h = Math.max(1, Math.abs(d.y) * scale);
          return (
            <rect key={i} x={i * w + w * 0.18} width={w * 0.64} y={d.y >= 0 ? zero - h : zero} height={h} rx="0.8"
              fill={d.y >= 0 ? `url(#${gid})` : '#f06a6a'} opacity={i === data.length - 1 ? 1 : 0.75}>
              <title>{`${d.x}: ${d.y >= 0 ? '+' : ''}${fmt(d.y)} coins`}</title>
            </rect>
          );
        })}
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#58A6FF" /><stop offset="1" stopColor="#1E6BFF" /></linearGradient></defs>
      </svg>
      <figcaption className="flex justify-between text-[10px] text-mute mt-1"><span>{data[0].x}</span><span>{data[data.length - 1].x}</span></figcaption>
    </figure>
  );
}

export function Avatar({ name, size = 40, className }: { name: string; size?: number; className?: string }) {
  return (
    <div className={cx('relative grid place-items-center rounded-2xl bg-gradient-to-br from-brand to-[#0a2a66] text-white shadow-[0_0_0_1px_rgb(88_166_255/0.35),0_8px_24px_-8px_rgb(30_107_255/0.7)] shrink-0', className)}
      style={{ width: size, height: size }}>
      <Icon name={name} size={size * 0.48} />
    </div>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <img src="./brand/logo-96.webp" width={36} height={36} alt="" className="size-9 rounded-[10px] shadow-[0_0_18px_-4px_rgb(30_107_255/0.8)]" />
      {!compact && (
        <div className="leading-none">
          <div className="font-display font-bold tracking-[0.08em] text-[13px]">WEB-CREATORS</div>
          <div className="text-[10px] tracking-[0.28em] text-brand-2 mt-1 font-semibold">DIGITAL EMPIRE</div>
        </div>
      )}
    </div>
  );
}
