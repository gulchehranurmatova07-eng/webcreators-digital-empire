import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { act, useGame } from '../../store/game';
import * as E from '../../engine/engine';
import { ASSETS, FONTS, SECTION_META, SECTION_ORDER, SITE_COLORS, contrastRatio, qualityChecks, qualityScore, siteBackground } from '../../engine/website';
import type { Section, SectionType, SiteTheme, Website } from '../../engine/types';
import { navigate } from '../../app/router';
import { Badge, Button, Card, EmptyState, Field, Progress, Segmented, cx, inputCls, textareaCls } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { AssetArt, SiteRenderer } from './SiteRenderer';

type Panel = 'sections' | 'edit' | 'theme' | 'score' | 'preview';
type Device = 'mobile' | 'desktop';

/** Scales a fixed-width frame down to fit its container (so "desktop" preview works on phones). */
function PreviewFrame({ site, device, selectedId, onSelect }: { site: Website; device: Device; selectedId: string | null; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const frameW = device === 'mobile' ? 390 : 1200;
  const scale = Math.min(1, (w - 2) / frameW);
  const viewH = 680;
  return (
    <div ref={ref} className="w-full">
      <div className={cx('mx-auto overflow-hidden border border-line-strong bg-ink shadow-[0_30px_60px_-30px_rgb(30_107_255/0.5)]', device === 'mobile' ? 'rounded-[2rem]' : 'rounded-xl')}
        style={{ width: frameW * scale, height: viewH }}>
        {device === 'desktop' && (
          <div className="flex items-center gap-1.5 h-7 px-3 bg-navy-2 border-b border-line" aria-hidden="true">
            <span className="size-2 rounded-full bg-bad/70" /><span className="size-2 rounded-full bg-warn/70" /><span className="size-2 rounded-full bg-good/70" />
            <span className="ml-3 text-[10px] text-mute truncate">{site.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.novara.site</span>
          </div>
        )}
        <div className="overflow-y-auto overflow-x-hidden scroll-thin" style={{ height: viewH - (device === 'desktop' ? 28 : 0) }}>
          <div style={{ width: frameW, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <SiteRenderer site={site} selectedId={selectedId} onSelect={onSelect} />
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-mute mt-2">{device === 'mobile' ? 'Phone · 390px' : 'Desktop · 1200px'}{scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''} · Tap a section to edit it</p>
    </div>
  );
}

function SectionInspector({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  const set = <T extends Section>(patch: Partial<T['data']>) => onChange({ ...section, data: { ...section.data, ...patch } } as Section);
  const text = (label: string, key: string, max: number, area = false, hint?: string) => {
    const value = (section.data as unknown as Record<string, string>)[key] ?? '';
    return (
      <Field label={label} hint={hint ?? `${value.length}/${max}`}>
        {area ? <textarea className={textareaCls} maxLength={max} value={value} onChange={(e) => set({ [key]: e.target.value } as never)} />
          : <input className={inputCls} maxLength={max} value={value} onChange={(e) => set({ [key]: e.target.value } as never)} />}
      </Field>
    );
  };
  switch (section.type) {
    case 'nav': return <div className="space-y-4">{text('Brand name', 'brand', 32)}<p className="text-xs text-mute">Links are generated automatically from your About, Menu, Gallery and Contact sections.</p></div>;
    case 'hero':
      return (
        <div className="space-y-4">
          {text('Heading', 'heading', 80)}
          {text('Subheading', 'subheading', 160, true)}
          {text('Button text', 'buttonText', 28, false, 'A clear call-to-action, e.g. "Book a table". Leave empty for no button.')}
          <div>
            <div className="text-xs font-medium text-soft mb-1.5">Layout</div>
            <Segmented label="Hero alignment" value={section.data.align} onChange={(v) => set({ align: v } as never)} options={[{ value: 'center', label: 'Centered' }, { value: 'left', label: 'Split' }]} />
          </div>
          <div>
            <div className="text-xs font-medium text-soft mb-1.5">Hero image</div>
            <div className="grid grid-cols-4 gap-2">
              {ASSETS.map((a) => (
                <button key={a.id} onClick={() => set({ image: a.id } as never)} aria-label={a.label} aria-pressed={section.data.image === a.id}
                  className={cx('rounded-lg overflow-hidden border-2 transition', section.data.image === a.id ? 'border-brand' : 'border-transparent opacity-80 hover:opacity-100')}>
                  <AssetArt id={a.id} label={false} className="aspect-square [&_svg]:size-5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    case 'about': return <div className="space-y-4">{text('Title', 'title', 60)}{text('Your story', 'text', 600, true, `${section.data.text.length}/600 · 40+ characters improves your quality score`)}</div>;
    case 'items': {
      const items = section.data.items;
      const setItems = (next: typeof items) => set({ items: next } as never);
      return (
        <div className="space-y-4">
          {text('Section title', 'title', 60)}
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="rounded-xl border border-line bg-ink/40 p-3 space-y-2">
                <div className="flex gap-2">
                  <input aria-label={`Item ${i + 1} name`} className={inputCls} maxLength={40} placeholder="Name" value={it.name} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input aria-label={`Item ${i + 1} price`} className={cx(inputCls, 'w-20')} maxLength={10} placeholder="Price" value={it.price} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
                  <Button variant="ghost" size="sm" className="h-10" aria-label={`Remove item ${i + 1}`} onClick={() => setItems(items.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></Button>
                </div>
                <input aria-label={`Item ${i + 1} description`} className={inputCls} maxLength={100} placeholder="Short description" value={it.description} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon="plus" disabled={items.length >= 12} onClick={() => setItems([...items, { name: '', price: '', description: '' }])}>Add item</Button>
        </div>
      );
    }
    case 'gallery': {
      const imgs = section.data.images;
      return (
        <div className="space-y-4">
          {text('Title', 'title', 60)}
          <div>
            <div className="text-xs font-medium text-soft mb-1.5">Images ({imgs.length}/6) — tap to add or remove</div>
            <div className="grid grid-cols-4 gap-2">
              {ASSETS.map((a) => {
                const on = imgs.includes(a.id);
                return (
                  <button key={a.id} aria-pressed={on} aria-label={a.label} disabled={!on && imgs.length >= 6}
                    onClick={() => set({ images: on ? imgs.filter((x) => x !== a.id) : [...imgs, a.id] } as never)}
                    className={cx('relative rounded-lg overflow-hidden border-2 transition disabled:opacity-30', on ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100')}>
                    <AssetArt id={a.id} label={false} className="aspect-square [&_svg]:size-5" />
                    {on && <span className="absolute top-1 right-1 grid place-items-center size-4 rounded-full bg-brand"><Icon name="check" size={10} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    case 'cta': return <div className="space-y-4">{text('Heading', 'heading', 80)}{text('Button text', 'buttonText', 28)}</div>;
    case 'contact': return <div className="space-y-4">{text('Title', 'title', 60)}{text('Address', 'address', 100)}{text('Opening hours', 'hours', 60)}{text('Phone', 'phone', 30)}</div>;
    case 'footer': return <div className="space-y-4">{text('Footer text', 'text', 100)}</div>;
  }
}

export function Editor({ id }: { id: string }) {
  const site = useGame((g) => g.websites.find((w) => w.id === id));
  const linkedTo = useGame((g) => g.businesses.find((b) => b.websiteId === id)?.name);
  const [panel, setPanel] = useState<Panel>(() => (window.matchMedia('(min-width: 1024px)').matches ? 'sections' : 'preview'));
  const [device, setDevice] = useState<Device>('mobile');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState(site?.name ?? '');
  const [adding, setAdding] = useState(false);
  const isDesktop = useMedia('(min-width: 1024px)');

  useEffect(() => { if (isDesktop && panel === 'preview') setPanel('sections'); }, [isDesktop, panel]);
  useEffect(() => { if (isDesktop) setDevice('desktop'); }, [isDesktop]);

  if (!site) return <Card><EmptyState icon="template" title="Website not found" body="It may have been deleted." action={<Button onClick={() => navigate('/studio')}>Back to Studio</Button>} /></Card>;

  const save = (next: Website) => act((s, c) => E.saveWebsite(s, c, next));
  const selected = site.sections.find((s) => s.id === selectedId) ?? null;
  const q = qualityScore(site);
  const checks = qualityChecks(site);

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...site.sections];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    save({ ...site, sections: arr });
  };
  const remove = (sid: string) => { save({ ...site, sections: site.sections.filter((s) => s.id !== sid) }); if (selectedId === sid) setSelectedId(null); };
  const setTheme = (patch: Partial<SiteTheme>) => save({ ...site, theme: { ...site.theme, ...patch } });
  const select = (sid: string) => { setSelectedId(sid); setPanel('edit'); };
  const commitName = () => { if (name.trim().length >= 2 && name !== site.name) save({ ...site, name }); else setName(site.name); };

  const panels: { value: Panel; label: string; icon: string }[] = [
    ...(isDesktop ? [] : [{ value: 'preview' as Panel, label: 'Preview', icon: 'eye' }]),
    { value: 'sections', label: 'Sections', icon: 'list' },
    { value: 'edit', label: 'Edit', icon: 'pointer' },
    { value: 'theme', label: 'Theme', icon: 'palette' },
    { value: 'score', label: `Score ${q}`, icon: 'gem' },
  ];

  const contrast = contrastRatio(site.theme.primary, siteBackground(site.theme.mode));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" icon="chevron-left" onClick={() => navigate('/studio')} className="self-start">Studio</Button>
        <input aria-label="Website name" className={cx(inputCls, 'font-display font-semibold sm:max-w-64')} value={name} maxLength={28}
          onChange={(e) => setName(e.target.value)} onBlur={commitName} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          {site.published ? <Badge tone="good">Live{linkedTo ? ` · ${linkedTo}` : ''}</Badge> : <Badge tone="mute">Draft</Badge>}
          <span className="text-[11px] text-mute flex items-center gap-1"><Icon name="check" size={12} className="text-good" />Autosaved</span>
          <Segmented label="Preview device" value={device} onChange={setDevice} options={[{ value: 'mobile', label: 'Phone', icon: 'smartphone' }, { value: 'desktop', label: 'Desktop', icon: 'monitor' }]} />
          {site.published
            ? <Button size="sm" variant="secondary" onClick={() => act((s, c) => E.publishWebsite(s, c, site.id, false))}>Unpublish</Button>
            : <Button size="sm" icon="rocket" onClick={() => act((s, c) => E.publishWebsite(s, c, site.id, true))}>Publish</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-5 items-start">
        <Card className="p-3 lg:sticky lg:top-20 min-w-0">
          <div className="flex gap-1 overflow-x-auto pb-2 mb-2 border-b border-line" role="tablist" aria-label="Editor panels">
            {panels.map((p) => (
              <button key={p.value} role="tab" aria-selected={panel === p.value} onClick={() => setPanel(p.value)}
                className={cx('flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium shrink-0 transition', panel === p.value ? 'bg-brand/20 text-white' : 'text-mute hover:text-white')}>
                <Icon name={p.icon} size={13} />{p.label}
              </button>
            ))}
          </div>

          <div className="p-1 lg:max-h-[calc(100dvh-220px)] lg:overflow-y-auto scroll-thin">
            {panel === 'preview' && <PreviewFrame site={site} device={device} selectedId={selectedId} onSelect={select} />}

            {panel === 'sections' && (
              <div className="space-y-2">
                {site.sections.map((s, i) => (
                  <div key={s.id} className={cx('flex items-center gap-2 p-2 rounded-xl border transition', selectedId === s.id ? 'border-brand bg-brand/10' : 'border-line bg-ink/40')}>
                    <button className="flex items-center gap-2.5 flex-1 min-w-0 text-left" onClick={() => select(s.id)}>
                      <span className="grid place-items-center size-8 rounded-lg bg-brand/15 text-brand-2 shrink-0"><Icon name={SECTION_META[s.type].icon} size={15} /></span>
                      <span className="min-w-0"><span className="block text-sm font-medium">{SECTION_META[s.type].label}</span><span className="block text-[11px] text-mute truncate">{SECTION_META[s.type].description}</span></span>
                    </button>
                    <div className="flex">
                      <button className="p-1.5 text-mute hover:text-white disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Icon name="chevron-up" size={15} /></button>
                      <button className="p-1.5 text-mute hover:text-white disabled:opacity-30" disabled={i === site.sections.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Icon name="chevron-down" size={15} /></button>
                      <button className="p-1.5 text-mute hover:text-bad" onClick={() => remove(s.id)} aria-label={`Remove ${SECTION_META[s.type].label}`}><Icon name="trash" size={14} /></button>
                    </div>
                  </div>
                ))}
                {adding ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {SECTION_ORDER.map((t: SectionType) => (
                      <button key={t} onClick={() => { act((s, c) => E.addSection(s, c, site.id, t)); setAdding(false); }}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-line hover:border-brand bg-ink/40 text-left text-xs transition">
                        <Icon name={SECTION_META[t].icon} size={14} className="text-brand-2" />{SECTION_META[t].label}
                      </button>
                    ))}
                    <Button variant="ghost" size="sm" className="col-span-2" onClick={() => setAdding(false)}>Cancel</Button>
                  </div>
                ) : <Button variant="secondary" className="w-full" icon="plus" onClick={() => setAdding(true)}>Add section</Button>}
              </div>
            )}

            {panel === 'edit' && (selected
              ? <div><div className="flex items-center gap-2 mb-4 text-sm font-semibold"><Icon name={SECTION_META[selected.type].icon} size={16} className="text-brand-2" />{SECTION_META[selected.type].label}</div>
                <SectionInspector section={selected} onChange={(next) => save({ ...site, sections: site.sections.map((s) => (s.id === next.id ? next : s)) })} /></div>
              : <EmptyState icon="pointer" title="Select a section" body="Tap a section in the preview or the Sections list to edit its content." />)}

            {panel === 'theme' && (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-medium text-soft mb-2">Brand color</div>
                  <div className="grid grid-cols-6 gap-2">
                    {SITE_COLORS.map((c) => (
                      <button key={c} onClick={() => setTheme({ primary: c })} aria-label={c} aria-pressed={site.theme.primary === c}
                        className={cx('aspect-square rounded-xl border-2 transition', site.theme.primary === c ? 'border-white scale-105' : 'border-white/10')} style={{ background: c }} />
                    ))}
                  </div>
                  <div className={cx('text-[11px] mt-2', contrast >= 3 ? 'text-good' : 'text-warn')}>Contrast on background: {contrast.toFixed(1)}:1 {contrast >= 3 ? '✓ readable' : '— too low, hard to read'}</div>
                </div>
                <div><div className="text-xs font-medium text-soft mb-2">Background</div>
                  <Segmented label="Background mode" value={site.theme.mode} onChange={(v) => setTheme({ mode: v })} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} /></div>
                <div><div className="text-xs font-medium text-soft mb-2">Font</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(FONTS) as SiteTheme['font'][]).map((f) => (
                      <button key={f} onClick={() => setTheme({ font: f })} aria-pressed={site.theme.font === f}
                        className={cx('p-3 rounded-xl border text-left transition', site.theme.font === f ? 'border-brand bg-brand/10' : 'border-line hover:border-line-strong')}>
                        <div className="text-lg" style={{ fontFamily: FONTS[f].css }}>Aa</div><div className="text-[11px] text-mute">{FONTS[f].label}</div>
                      </button>
                    ))}
                  </div></div>
                <div><div className="text-xs font-medium text-soft mb-2">Corners</div>
                  <Segmented label="Corner style" value={site.theme.radius} onChange={(v) => setTheme({ radius: v })} options={[{ value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Round' }]} /></div>
              </div>
            )}

            {panel === 'score' && (
              <div>
                <div className="flex items-end justify-between mb-2"><div className="font-display text-3xl font-semibold">{q}<span className="text-base text-mute">/100</span></div><Badge tone={q >= 75 ? 'good' : q >= 50 ? 'blue' : 'warn'}>{q >= 90 ? 'Excellent' : q >= 75 ? 'Great' : q >= 50 ? 'Decent' : 'Needs work'}</Badge></div>
                <Progress value={q} max={100} tone={q >= 75 ? 'good' : 'brand'} label="Quality score" />
                <p className="text-xs text-mute mt-2 mb-4">Published & linked sites add up to +25 visibility. 60+ adds +10% conversion, 75+ adds satisfaction.</p>
                <ul className="space-y-2">
                  {checks.map((c) => (
                    <li key={c.id} className={cx('flex gap-2.5 p-2.5 rounded-xl border', c.passed ? 'border-good/20 bg-good/[0.04]' : 'border-line bg-ink/40')}>
                      <span className={cx('grid place-items-center size-5 rounded-full shrink-0 mt-0.5', c.passed ? 'bg-good/20 text-good' : 'bg-white/5 text-mute')}><Icon name={c.passed ? 'check' : 'circle'} size={11} /></span>
                      <div className="min-w-0 flex-1"><div className="text-sm flex justify-between gap-2"><span>{c.label}</span><span className="text-[11px] text-mute">+{c.points}</span></div>{!c.passed && <div className="text-[11px] text-mute mt-0.5">{c.tip}</div>}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {isDesktop && <PreviewFrame site={site} device={device} selectedId={selectedId} onSelect={select} />}
      </div>
    </div>
  );
}

function useMedia(query: string) {
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}
