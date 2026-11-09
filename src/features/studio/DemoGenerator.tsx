import { useEffect, useMemo, useState } from 'react';
import { act, useGame, useStore } from '../../store/game';
import * as E from '../../engine/engine';
import { DEMO_STYLES, demoSite, type DemoStyle } from '../../engine/demo';
import { CATEGORIES } from '../../engine/config';
import { qualityScore } from '../../engine/website';
import type { Business, Website } from '../../engine/types';
import { navigate } from '../../app/router';
import { Badge, Button, Segmented, cx } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { DeviceFrame, type Device } from './DeviceFrame';
import { SiteRenderer } from './SiteRenderer';

const preview = (b: Business, style: DemoStyle, variant: number): Website => {
  const d = demoSite(b, style, variant);
  return {
    id: `demo-${style}-${variant}`, name: b.name, templateId: `demo-${style}`, theme: d.theme, published: false, createdAt: 0, updatedAt: 0,
    sections: d.sections.map(([type, data], i) => ({ id: `d${i}`, type, data: { ...data } }) as never),
  };
};

/** Full-screen generator: preview a complete website for a business before building it. */
export function DemoGenerator({ business, onClose }: { business: Business; onClose: () => void }) {
  const [style, setStyle] = useState<DemoStyle>('signature');
  const [variant, setVariant] = useState(0);
  const [device, setDevice] = useState<Device>(() => (window.matchMedia('(min-width: 1024px)').matches ? 'desktop' : 'mobile'));
  const [building, setBuilding] = useState(false);
  const linked = useGame((g) => g.websites.find((w) => w.id === business.websiteId));
  const site = useMemo(() => preview(business, style, variant), [business, style, variant]);
  const q = qualityScore(site);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const build = () => {
    setBuilding(true);
    if (act((s, c) => E.generateDemoSite(s, c, { businessId: business.id, style, variant }))) {
      const ws = useStore.getState().game.websites;
      navigate(`/studio/${ws[ws.length - 1].id}`);
    } else setBuilding(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/97 backdrop-blur-sm overflow-y-auto animate-pop" role="dialog" aria-modal="true" aria-label={`Demo generator for ${business.name}`}>
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 lg:px-6 h-14 border-b border-cyan/20 bg-ink/90">
        <span className="grid place-items-center size-8 rounded-lg bg-cyan/15 text-cyan"><Icon name="sparkles" size={16} /></span>
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.2em] text-cyan font-semibold">DEMO GENERATOR</div>
          <div className="font-display font-semibold text-sm truncate">{business.name} · {CATEGORIES[business.category].name}</div>
        </div>
        <button onClick={onClose} className="ml-auto grid place-items-center size-9 rounded-xl border border-line hover:border-line-strong text-mute hover:text-white" aria-label="Close generator"><Icon name="x" size={16} /></button>
      </div>

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-5 p-4 lg:p-6 max-w-[1500px] mx-auto">
        <div className="space-y-4 order-2 lg:order-1">
          <div className="panel p-4">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-soft mb-3">Choose a style</div>
            <div className="space-y-2.5" role="radiogroup" aria-label="Demo style">
              {DEMO_STYLES.map((s) => {
                const on = s.id === style;
                return (
                  <button key={s.id} role="radio" aria-checked={on} onClick={() => setStyle(s.id)}
                    className={cx('w-full flex gap-3 p-2 rounded-xl border text-left transition', on ? 'border-cyan bg-cyan/[0.07] shadow-[0_0_0_1px_#22d3ee]' : 'border-line hover:border-line-strong')}>
                    <div className="relative w-28 h-20 shrink-0 overflow-hidden rounded-lg border border-line pointer-events-none" aria-hidden="true">
                      <div className="origin-top-left" style={{ width: 1100, transform: 'scale(0.102)' }}><SiteRenderer site={preview(business, s.id, variant)} /></div>
                    </div>
                    <div className="min-w-0 py-1">
                      <div className="font-display font-semibold text-sm flex items-center gap-2">{s.name}{on && <Icon name="check" size={14} className="text-cyan" />}</div>
                      <div className="text-xs text-mute">{s.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button variant="secondary" className="w-full mt-3" icon="reset" onClick={() => setVariant((v) => v + 1)}>Generate new copy</Button>
          </div>

          <div className="panel p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-mute">Quality score</span><Badge tone={q >= 75 ? 'good' : 'blue'}>{q}/100</Badge></div>
            <div className="flex items-center justify-between"><span className="text-mute">Brand colour</span><span className="flex items-center gap-2"><span className="size-4 rounded" style={{ background: site.theme.primary }} />{site.theme.primary}</span></div>
            <div className="flex items-center justify-between"><span className="text-mute">Sections</span><span>{site.sections.length}</span></div>
            <p className="text-xs text-mute pt-2 border-t border-line">This is a demo built from your brand. "Build real version" saves it, links it to {business.name} and opens the editor, where you can change everything and publish it to attract customers.</p>
            {linked && <p className="text-xs text-warn">{business.name} is currently linked to "{linked.name}". The new website will replace that link; the old one stays in your Studio.</p>}
            <Button size="lg" className="w-full" icon="rocket" disabled={building} onClick={build}>Build real version</Button>
          </div>
        </div>

        <div className="order-1 lg:order-2 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs text-mute"><span className="size-1.5 rounded-full bg-cyan animate-glow" />Live demo preview</div>
            <Segmented label="Preview device" value={device} onChange={setDevice} options={[{ value: 'mobile', label: 'Phone', icon: 'smartphone' }, { value: 'desktop', label: 'Desktop', icon: 'monitor' }]} />
          </div>
          <div className="dot-grid rounded-2xl border border-line p-3 sm:p-6">
            <DeviceFrame site={site} device={device} height={Math.min(760, Math.max(460, window.innerHeight - 200))} />
          </div>
        </div>
      </div>
    </div>
  );
}
