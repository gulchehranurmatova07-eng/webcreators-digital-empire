import { useEffect, useRef, useState } from 'react';
import { act, useGame } from '../../store/game';
import * as E from '../../engine/engine';
import { ASSETS, FONTS, SECTION_META, SECTION_ORDER, SITE_COLORS, contrastRatio, qualityChecks, qualityScore, siteBackground } from '../../engine/website';
import type { Section, SectionType, SiteTheme, Website } from '../../engine/types';
import { navigate } from '../../app/router';
import { Badge, Button, EmptyState, Field, Progress, Segmented, cx, inputCls, textareaCls } from '../../ui/kit';
import { Panel } from '../../ui/hud';
import { Icon } from '../../ui/Icon';
import { AssetArt } from './SiteRenderer';
import { DeviceFrame, type Device } from './DeviceFrame';

type MobilePanel = 'canvas' | 'layers' | 'inspect' | 'theme' | 'score';
type RightTab = 'section' | 'score';

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-cyan/90 flex items-center gap-2"><span className="h-px w-3 bg-cyan/60" />{label}</div>
    {children}
  </div>
);

function SectionInspector({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  const set = (patch: Record<string, unknown>) => onChange({ ...section, data: { ...section.data, ...patch } } as Section);
  const text = (label: string, key: string, max: number, area = false, hint?: string) => {
    const value = (section.data as unknown as Record<string, string>)[key] ?? '';
    return (
      <Field label={label} hint={hint ?? `${value.length}/${max}`}>
        {area ? <textarea className={textareaCls} maxLength={max} value={value} onChange={(e) => set({ [key]: e.target.value })} />
          : <input className={inputCls} maxLength={max} value={value} onChange={(e) => set({ [key]: e.target.value })} />}
      </Field>
    );
  };
  const imagePicker = (selected: string[], onPick: (id: string) => void, max?: number) => (
    <div className="grid grid-cols-4 gap-2">
      {ASSETS.map((a) => {
        const on = selected.includes(a.id);
        return (
          <button key={a.id} onClick={() => onPick(a.id)} aria-label={a.label} aria-pressed={on} disabled={!on && max !== undefined && selected.length >= max}
            className={cx('relative rounded-lg overflow-hidden border-2 transition disabled:opacity-30', on ? 'border-cyan' : 'border-transparent opacity-75 hover:opacity-100')}>
            <AssetArt id={a.id} label={false} className="aspect-square" />
            {on && <span className="absolute top-1 right-1 grid place-items-center size-4 rounded-full bg-cyan text-ink"><Icon name="check" size={10} /></span>}
          </button>
        );
      })}
    </div>
  );
  switch (section.type) {
    case 'nav': return <Group label="Content">{text('Brand name', 'brand', 32)}<p className="text-xs text-mute">Menu links are created automatically from your About, Menu, Gallery and Contact sections.</p></Group>;
    case 'hero':
      return (
        <div className="space-y-6">
          <Group label="Content">{text('Heading', 'heading', 80)}{text('Subheading', 'subheading', 160, true)}{text('Button text', 'buttonText', 28, false, 'A clear call-to-action, like "Book a table". Leave empty for no button.')}</Group>
          <Group label="Layout"><Segmented label="Hero alignment" value={section.data.align} onChange={(v) => set({ align: v })} options={[{ value: 'center', label: 'Centered' }, { value: 'left', label: 'Split' }]} /></Group>
          <Group label="Background image">{imagePicker([section.data.image], (id) => set({ image: id }))}</Group>
        </div>
      );
    case 'about': return <Group label="Content">{text('Title', 'title', 60)}{text('Your story', 'text', 600, true, `${section.data.text.length}/600 · 40+ characters improves your score`)}</Group>;
    case 'items': {
      const items = section.data.items;
      const setItems = (next: typeof items) => set({ items: next });
      return (
        <div className="space-y-6">
          <Group label="Content">{text('Section title', 'title', 60)}</Group>
          <Group label={`Items (${items.length}/12)`}>
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
            <Button variant="secondary" size="sm" icon="plus" disabled={items.length >= 12} onClick={() => setItems([...items, { name: '', price: '', description: '' }])}>Add item</Button>
          </Group>
        </div>
      );
    }
    case 'gallery': {
      const imgs = section.data.images;
      return (
        <div className="space-y-6">
          <Group label="Content">{text('Title', 'title', 60)}</Group>
          <Group label={`Images (${imgs.length}/6)`}>{imagePicker(imgs, (id) => set({ images: imgs.includes(id) ? imgs.filter((x) => x !== id) : [...imgs, id] }), 6)}</Group>
        </div>
      );
    }
    case 'cta': return <Group label="Content">{text('Heading', 'heading', 80)}{text('Button text', 'buttonText', 28)}</Group>;
    case 'contact': return <Group label="Content">{text('Title', 'title', 60)}{text('Address', 'address', 100)}{text('Opening hours', 'hours', 60)}{text('Phone', 'phone', 30)}</Group>;
    case 'footer': return <Group label="Content">{text('Footer text', 'text', 100)}</Group>;
  }
}

function ThemePanel({ site, setTheme }: { site: Website; setTheme: (p: Partial<SiteTheme>) => void }) {
  const contrast = contrastRatio(site.theme.primary, siteBackground(site.theme.mode));
  return (
    <div className="space-y-6">
      <Group label="Brand colour">
        <div className="grid grid-cols-6 gap-2">
          {SITE_COLORS.map((c) => (
            <button key={c} onClick={() => setTheme({ primary: c })} aria-label={c} aria-pressed={site.theme.primary === c}
              className={cx('aspect-square rounded-lg border-2 transition', site.theme.primary === c ? 'border-white scale-105' : 'border-white/10')} style={{ background: c }} />
          ))}
        </div>
        {!SITE_COLORS.includes(site.theme.primary) && <div className="flex items-center gap-2 text-xs text-mute"><span className="size-4 rounded border border-white/20" style={{ background: site.theme.primary }} />Brand colour {site.theme.primary}</div>}
        <div className={cx('text-[11px]', contrast >= 3 ? 'text-good' : 'text-warn')}>Contrast on background: {contrast.toFixed(1)}:1 {contrast >= 3 ? '✓ readable' : '— too low, hard to read'}</div>
      </Group>
      <Group label="Background"><Segmented label="Background mode" value={site.theme.mode} onChange={(v) => setTheme({ mode: v })} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} /></Group>
      <Group label="Font">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FONTS) as SiteTheme['font'][]).map((f) => (
            <button key={f} onClick={() => setTheme({ font: f })} aria-pressed={site.theme.font === f}
              className={cx('p-3 rounded-xl border text-left transition', site.theme.font === f ? 'border-cyan bg-cyan/10' : 'border-line hover:border-line-strong')}>
              <div className="text-lg" style={{ fontFamily: FONTS[f].css }}>Aa</div><div className="text-[11px] text-mute">{FONTS[f].label}</div>
            </button>
          ))}
        </div>
      </Group>
      <Group label="Corners"><Segmented label="Corner style" value={site.theme.radius} onChange={(v) => setTheme({ radius: v })} options={[{ value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Round' }]} /></Group>
    </div>
  );
}

function ScorePanel({ site }: { site: Website }) {
  const q = qualityScore(site);
  return (
    <div>
      <div className="flex items-end justify-between mb-2"><div className="font-display text-3xl font-semibold">{q}<span className="text-base text-mute">/100</span></div><Badge tone={q >= 75 ? 'good' : q >= 50 ? 'blue' : 'warn'}>{q >= 90 ? 'Excellent' : q >= 75 ? 'Great' : q >= 50 ? 'Decent' : 'Needs work'}</Badge></div>
      <Progress value={q} max={100} tone={q >= 75 ? 'good' : 'brand'} label="Quality score" />
      <p className="text-xs text-mute mt-2 mb-4">Published & linked sites add up to +25 visibility. 60+ adds +10% conversion, 75+ adds satisfaction.</p>
      <ul className="space-y-2">
        {qualityChecks(site).map((c) => (
          <li key={c.id} className={cx('flex gap-2.5 p-2.5 rounded-xl border', c.passed ? 'border-good/20 bg-good/[0.04]' : 'border-line bg-ink/40')}>
            <span className={cx('grid place-items-center size-5 rounded-full shrink-0 mt-0.5', c.passed ? 'bg-good/20 text-good' : 'bg-white/5 text-mute')}><Icon name={c.passed ? 'check' : 'circle'} size={11} /></span>
            <div className="min-w-0 flex-1"><div className="text-sm flex justify-between gap-2"><span>{c.label}</span><span className="text-[11px] text-mute">+{c.points}</span></div>{!c.passed && <div className="text-[11px] text-mute mt-0.5">{c.tip}</div>}</div>
          </li>
        ))}
      </ul>
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

export function Editor({ id }: { id: string }) {
  const site = useGame((g) => g.websites.find((w) => w.id === id));
  const linkedTo = useGame((g) => g.businesses.find((b) => b.websiteId === id)?.name);
  const isDesktop = useMedia('(min-width: 1180px)');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('canvas');
  const [leftTab, setLeftTab] = useState<'layers' | 'theme'>('layers');
  const [rightTab, setRightTab] = useState<RightTab>('section');
  const [device, setDevice] = useState<Device>(() => (window.matchMedia('(min-width: 1180px)').matches ? 'desktop' : 'mobile'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState(site?.name ?? '');
  const [adding, setAdding] = useState(false);
  // Undo / redo history of whole-site snapshots. Rapid typing is grouped into one step.
  const past = useRef<Website[]>([]);
  const future = useRef<Website[]>([]);
  const lastPush = useRef(0);
  const [, rerender] = useState(0);

  if (!site) return <Panel><EmptyState icon="template" title="Website not found" body="It may have been deleted." action={<Button onClick={() => navigate('/studio')}>Back to Studio</Button>} /></Panel>;

  const remember = () => {
    const now = Date.now();
    if (now - lastPush.current > 700) { past.current = [...past.current.slice(-49), site]; future.current = []; }
    lastPush.current = now;
    rerender((n) => n + 1);
  };
  const save = (next: Website) => { remember(); act((s, c) => E.saveWebsite(s, c, next)); };
  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(site);
    lastPush.current = 0;
    act((s, c) => E.saveWebsite(s, c, prev));
    rerender((n) => n + 1);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(site);
    lastPush.current = 0;
    act((s, c) => E.saveWebsite(s, c, next));
    rerender((n) => n + 1);
  };

  const selected = site.sections.find((s) => s.id === selectedId) ?? null;
  const q = qualityScore(site);
  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...site.sections];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    lastPush.current = 0;
    save({ ...site, sections: arr });
  };
  const remove = (sid: string) => { lastPush.current = 0; save({ ...site, sections: site.sections.filter((s) => s.id !== sid) }); if (selectedId === sid) setSelectedId(null); };
  const setTheme = (patch: Partial<SiteTheme>) => { lastPush.current = 0; save({ ...site, theme: { ...site.theme, ...patch } }); };
  const select = (sid: string) => { setSelectedId(sid); setRightTab('section'); if (!isDesktop) setMobilePanel('inspect'); };
  const commitName = () => { if (name.trim().length >= 2 && name !== site.name) save({ ...site, name }); else setName(site.name); };
  const addSection = (t: SectionType) => { lastPush.current = 0; remember(); act((s, c) => E.addSection(s, c, site.id, t)); setAdding(false); };
  const duplicate = (sid: string) => { lastPush.current = 0; remember(); act((s, c) => E.duplicateSection(s, c, site.id, sid)); };

  const layers = (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-mute">Page · home</span>
        <span className="text-[10px] text-mute">{site.sections.length} layers</span>
      </div>
      {site.sections.map((s, i) => (
        <div key={s.id} className={cx('group flex items-center gap-1.5 pl-2 pr-1 py-1.5 rounded-lg border transition', selectedId === s.id ? 'border-cyan/70 bg-cyan/[0.08] shadow-[inset_2px_0_0_#22d3ee]' : 'border-transparent hover:border-line hover:bg-white/[0.03]')}>
          <button className="flex items-center gap-2 flex-1 min-w-0 text-left" onClick={() => select(s.id)}>
            <Icon name={SECTION_META[s.type].icon} size={14} className={selectedId === s.id ? 'text-cyan' : 'text-brand-2'} />
            <span className="text-[13px] truncate">{SECTION_META[s.type].label}</span>
          </button>
          <button className="p-1 text-mute hover:text-white disabled:opacity-25" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${SECTION_META[s.type].label} up`}><Icon name="chevron-up" size={14} /></button>
          <button className="p-1 text-mute hover:text-white disabled:opacity-25" disabled={i === site.sections.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${SECTION_META[s.type].label} down`}><Icon name="chevron-down" size={14} /></button>
          <button className="p-1 text-mute hover:text-bad" onClick={() => remove(s.id)} aria-label={`Remove ${SECTION_META[s.type].label}`}><Icon name="trash" size={13} /></button>
        </div>
      ))}
      {adding ? (
        <div className="grid grid-cols-2 gap-1.5 pt-2">
          {SECTION_ORDER.map((t) => (
            <button key={t} onClick={() => addSection(t)} className="flex items-center gap-2 p-2 rounded-lg border border-line hover:border-cyan bg-ink/40 text-left text-xs transition">
              <Icon name={SECTION_META[t].icon} size={13} className="text-cyan" />{SECTION_META[t].label}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="col-span-2" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      ) : <Button variant="secondary" size="sm" className="w-full mt-2" icon="plus" onClick={() => setAdding(true)}>Add section</Button>}
    </div>
  );

  const inspector = selected ? (
    <div>
      <div className="flex items-center gap-2 mb-1"><Badge>Section</Badge><span className="text-[10px] text-mute">#{selected.id}</span></div>
      <div className="font-display text-lg font-semibold mb-3">{SECTION_META[selected.type].label}</div>
      <div className="flex flex-wrap gap-2 mb-5">
        <Button size="sm" variant="secondary" icon="plus" onClick={() => duplicate(selected.id)}>Duplicate</Button>
        <Button size="sm" variant="secondary" icon="x" onClick={() => setSelectedId(null)}>Deselect</Button>
        <Button size="sm" variant="danger" icon="trash" onClick={() => remove(selected.id)}>Delete</Button>
      </div>
      <SectionInspector section={selected} onChange={(next) => save({ ...site, sections: site.sections.map((s) => (s.id === next.id ? next : s)) })} />
    </div>
  ) : <EmptyState icon="pointer" title="Select a layer" body="Click a section on the canvas or in the Layers list to edit it." />;

  const canvas = (
    <div className="dot-grid rounded-2xl border border-line p-3 sm:p-6 min-h-[520px]">
      <div className="flex items-center justify-between mb-3 text-[11px] text-mute">
        <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-cyan animate-glow" />{selected ? `Editing: ${SECTION_META[selected.type].label}` : 'Click any section to edit it'}</span>
        <span>{device === 'mobile' ? '390px' : '1200px'}</span>
      </div>
      <DeviceFrame site={site} device={device} selectedId={selectedId} onSelect={select} height={isDesktop ? 720 : 600} />
    </div>
  );

  return (
    <div className="-mt-2">
      {/* Project bar */}
      <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5 mb-4">
        <Button variant="ghost" size="sm" icon="chevron-left" onClick={() => navigate('/studio')}>Studio</Button>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cx('size-2 rounded-full shrink-0', site.published ? 'bg-good shadow-[0_0_8px_#22c3a6]' : 'bg-warn')} title={site.published ? 'Live' : 'Draft'} />
          <input aria-label="Website name" className={cx(inputCls, 'h-9 font-display font-semibold w-44 sm:w-56')} value={name} maxLength={28}
            onChange={(e) => setName(e.target.value)} onBlur={commitName} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!past.current.length} className="grid place-items-center size-9 rounded-lg border border-line text-soft hover:text-white disabled:opacity-30" aria-label="Undo" title="Undo"><Icon name="reset" size={15} /></button>
          <button onClick={redo} disabled={!future.current.length} className="grid place-items-center size-9 rounded-lg border border-line text-soft hover:text-white disabled:opacity-30 [&_svg]:-scale-x-100" aria-label="Redo" title="Redo"><Icon name="reset" size={15} /></button>
        </div>
        <span className="hidden sm:inline-flex"><Badge tone={site.published ? 'good' : 'mute'}>{site.published ? `Live${linkedTo ? ` · ${linkedTo}` : ''}` : 'Draft'}</Badge></span>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Segmented label="Preview device" value={device} onChange={setDevice} options={[{ value: 'mobile', label: 'Phone', icon: 'smartphone' }, { value: 'desktop', label: 'Desktop', icon: 'monitor' }]} />
          <button onClick={() => { setRightTab('score'); if (!isDesktop) setMobilePanel('score'); }} className="h-9 px-3 rounded-lg border border-line hover:border-cyan text-xs flex items-center gap-1.5"><Icon name="gem" size={13} className="text-cyan" />Score {q}</button>
          {site.published
            ? <Button size="sm" variant="secondary" onClick={() => act((s, c) => E.publishWebsite(s, c, site.id, false))}>Unpublish</Button>
            : <Button size="sm" icon="rocket" onClick={() => act((s, c) => E.publishWebsite(s, c, site.id, true))}>Publish</Button>}
        </div>
      </div>

      {isDesktop ? (
        <div className="grid grid-cols-[250px_minmax(0,1fr)_330px] gap-4 items-start">
          <div className="panel p-3 sticky top-20">
            <div className="flex gap-1 mb-3" role="tablist" aria-label="Left panel">
              {(['layers', 'theme'] as const).map((t) => (
                <button key={t} role="tab" aria-selected={leftTab === t} onClick={() => setLeftTab(t)}
                  className={cx('flex-1 h-8 rounded-lg text-xs font-medium capitalize transition', leftTab === t ? 'bg-brand/25 text-white shadow-[inset_0_0_0_1px_rgb(30_107_255/0.6)]' : 'text-mute hover:text-white')}>{t}</button>
              ))}
            </div>
            <div className="max-h-[calc(100dvh-230px)] overflow-y-auto scroll-thin pr-1">{leftTab === 'layers' ? layers : <ThemePanel site={site} setTheme={setTheme} />}</div>
          </div>
          {canvas}
          <div className="panel p-4 sticky top-20">
            <div className="flex gap-1 mb-4" role="tablist" aria-label="Inspector">
              {(['section', 'score'] as const).map((t) => (
                <button key={t} role="tab" aria-selected={rightTab === t} onClick={() => setRightTab(t)}
                  className={cx('h-7 px-3 rounded-md text-[10px] font-semibold tracking-[0.14em] uppercase transition', rightTab === t ? 'bg-white/10 text-white' : 'text-mute hover:text-white')}>{t}</button>
              ))}
            </div>
            <div className="max-h-[calc(100dvh-240px)] overflow-y-auto scroll-thin pr-1">{rightTab === 'section' ? inspector : <ScorePanel site={site} />}</div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex gap-1 overflow-x-auto mb-3 scroll-thin" role="tablist" aria-label="Editor panels">
            {([['canvas', 'Canvas', 'eye'], ['layers', 'Layers', 'list'], ['inspect', 'Edit', 'pointer'], ['theme', 'Theme', 'palette'], ['score', `Score ${q}`, 'gem']] as const).map(([v, l, ic]) => (
              <button key={v} role="tab" aria-selected={mobilePanel === v} onClick={() => setMobilePanel(v)}
                className={cx('flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium shrink-0 transition', mobilePanel === v ? 'bg-brand text-white' : 'bg-white/[0.04] text-mute')}>
                <Icon name={ic} size={13} />{l}
              </button>
            ))}
          </div>
          {mobilePanel === 'canvas' && canvas}
          {mobilePanel !== 'canvas' && (
            <div className="panel p-4">
              {mobilePanel === 'layers' && layers}
              {mobilePanel === 'inspect' && inspector}
              {mobilePanel === 'theme' && <ThemePanel site={site} setTheme={setTheme} />}
              {mobilePanel === 'score' && <ScorePanel site={site} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
