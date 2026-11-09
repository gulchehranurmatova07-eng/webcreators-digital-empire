// Renders a player's website from structured data. Uses container queries so the
// same markup responds to the preview frame width (mobile vs desktop), not the screen.
import type { Section, Website } from '../../engine/types';
import { FONTS, assetById, readableOn, siteBackground } from '../../engine/website';
import { Icon } from '../../ui/Icon';
import { sceneImage } from '../../art/Scene';
import { cx } from '../../ui/kit';

const RADIUS = { sharp: '3px', soft: '12px', round: '24px' } as const;

export function AssetArt({ id, className, label = true }: { id: string; className?: string; label?: boolean }) {
  const a = assetById(id);
  const src = sceneImage(a.scene === 'city' ? { type: 'city' } : { type: 'venue', ...a.scene });
  return (
    <div className={cx('relative overflow-hidden', className)} style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }} role="img" aria-label={a.label}>
      {src ? <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        : <div className="absolute inset-0 grid place-items-center"><Icon name={a.icon} size={44} className="text-white/85" strokeWidth={1.4} /></div>}
      {label && <span className="absolute bottom-2 left-2 text-[10px] font-medium text-white/90 bg-black/40 rounded px-1.5 py-0.5">{a.label}</span>}
    </div>
  );
}

const navLabel = (s: Section) =>
  s.type === 'about' ? 'About' : s.type === 'items' ? (s.data.title || 'Menu').split(' ').slice(-1)[0] : s.type === 'gallery' ? 'Gallery' : s.type === 'contact' ? 'Contact' : null;

export function SiteRenderer({ site, selectedId, onSelect }: { site: Website; selectedId?: string | null; onSelect?: (id: string) => void }) {
  const { theme } = site;
  const bg = siteBackground(theme.mode);
  const dark = theme.mode === 'dark';
  const fg = dark ? '#E8EEF8' : '#0B1220';
  const muted = dark ? 'rgba(232,238,248,.65)' : 'rgba(11,18,32,.62)';
  const surface = dark ? 'rgba(255,255,255,.04)' : 'rgba(11,18,32,.04)';
  const border = dark ? 'rgba(255,255,255,.08)' : 'rgba(11,18,32,.08)';
  const radius = RADIUS[theme.radius];
  const btn = { background: theme.primary, color: readableOn(theme.primary), borderRadius: radius };
  const links = site.sections.map(navLabel).filter(Boolean) as string[];

  const wrap = (s: Section, children: React.ReactNode, className = '') => (
    <section key={s.id} onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(s.id); } : undefined}
      className={cx('relative', className, onSelect && 'cursor-pointer', onSelect && 'hover:outline hover:outline-2 hover:outline-[#58A6FF]/50 hover:-outline-offset-2',
        selectedId === s.id && 'outline outline-2 outline-[#1E6BFF] -outline-offset-2')}>
      {children}
    </section>
  );

  return (
    <div className="@container min-h-full" style={{ background: bg, color: fg, fontFamily: FONTS[theme.font].css }}>
      {site.sections.length === 0 && <div className="p-16 text-center text-sm" style={{ color: muted }}>Empty page — add a section.</div>}
      {site.sections.map((s) => {
        switch (s.type) {
          case 'nav':
            return wrap(s, (
              <div className="flex items-center justify-between gap-4 px-5 @2xl:px-10 py-4" style={{ borderBottom: `1px solid ${border}` }}>
                <div className="font-bold text-lg tracking-tight" style={{ color: theme.primary }}>{s.data.brand || 'Brand'}</div>
                <nav className="hidden @xl:flex gap-6 text-sm" style={{ color: muted }}>{links.map((l, i) => <span key={i}>{l}</span>)}</nav>
                <span className="@xl:hidden" style={{ color: muted }}><Icon name="menu" size={20} /></span>
              </div>
            ));
          case 'hero': {
            const left = s.data.align === 'left';
            return wrap(s, (
              <div className={cx('px-5 @2xl:px-10 py-10 @2xl:py-16 grid gap-8 items-center', left && '@2xl:grid-cols-2')}>
                <div className={cx(!left && 'text-center max-w-2xl mx-auto')}>
                  <h1 className="text-3xl @2xl:text-5xl font-bold leading-tight tracking-tight">{s.data.heading || 'Your heading'}</h1>
                  {s.data.subheading && <p className="mt-4 text-base @2xl:text-lg" style={{ color: muted }}>{s.data.subheading}</p>}
                  {s.data.buttonText && <span className="inline-block mt-6 px-6 py-3 text-sm font-semibold" style={btn}>{s.data.buttonText}</span>}
                </div>
                <AssetArt id={s.data.image} label={false} className={cx('h-48 @2xl:h-72 w-full', !left && 'max-w-3xl mx-auto')} />
              </div>
            ));
          }
          case 'about':
            return wrap(s, (
              <div className="px-5 @2xl:px-10 py-10 max-w-3xl">
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>{s.data.title}</h2>
                <p className="mt-3 leading-relaxed" style={{ color: muted }}>{s.data.text}</p>
              </div>
            ));
          case 'items':
            return wrap(s, (
              <div className="px-5 @2xl:px-10 py-10">
                <h2 className="text-2xl font-bold">{s.data.title}</h2>
                <div className="mt-5 grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
                  {s.data.items.map((it, i) => (
                    <div key={i} className="p-4 flex justify-between gap-3" style={{ background: surface, border: `1px solid ${border}`, borderRadius: radius }}>
                      <div className="min-w-0">
                        <div className="font-semibold">{it.name || 'Item'}</div>
                        {it.description && <div className="text-sm mt-0.5" style={{ color: muted }}>{it.description}</div>}
                      </div>
                      {it.price && <div className="font-bold shrink-0" style={{ color: theme.primary }}>{it.price}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ));
          case 'gallery':
            return wrap(s, (
              <div className="px-5 @2xl:px-10 py-10">
                <h2 className="text-2xl font-bold">{s.data.title}</h2>
                <div className="mt-5 grid grid-cols-2 @2xl:grid-cols-3 gap-3">
                  {s.data.images.map((img, i) => <div key={i} style={{ borderRadius: radius }} className="overflow-hidden"><AssetArt id={img} className="aspect-[4/3]" /></div>)}
                </div>
              </div>
            ));
          case 'cta':
            return wrap(s, (
              <div className="px-5 @2xl:px-10 py-10">
                <div className="p-8 @2xl:p-12 text-center" style={{ background: `linear-gradient(135deg, ${theme.primary}33, ${theme.primary}0d)`, border: `1px solid ${theme.primary}44`, borderRadius: radius }}>
                  <h2 className="text-2xl @2xl:text-3xl font-bold">{s.data.heading}</h2>
                  {s.data.buttonText && <span className="inline-block mt-5 px-6 py-3 text-sm font-semibold" style={btn}>{s.data.buttonText}</span>}
                </div>
              </div>
            ));
          case 'contact':
            return wrap(s, (
              <div className="px-5 @2xl:px-10 py-10 grid gap-4 @2xl:grid-cols-3">
                <h2 className="text-2xl font-bold @2xl:col-span-3">{s.data.title}</h2>
                {[['map', s.data.address], ['calendar', s.data.hours], ['smartphone', s.data.phone]].filter(([, v]) => v).map(([icon, v]) => (
                  <div key={icon} className="flex items-center gap-3 p-4" style={{ background: surface, border: `1px solid ${border}`, borderRadius: radius }}>
                    <span style={{ color: theme.primary }}><Icon name={icon} size={18} /></span><span className="text-sm">{v}</span>
                  </div>
                ))}
              </div>
            ));
          case 'footer':
            return wrap(s, (
              <div className="px-5 @2xl:px-10 py-6 text-sm text-center" style={{ color: muted, borderTop: `1px solid ${border}` }}>{s.data.text}</div>
            ));
        }
      })}
    </div>
  );
}
