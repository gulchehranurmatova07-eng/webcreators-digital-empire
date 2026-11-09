import { useLayoutEffect, useRef, useState } from 'react';
import type { Website } from '../../engine/types';
import { cx } from '../../ui/kit';
import { SiteRenderer } from './SiteRenderer';

export type Device = 'mobile' | 'desktop';

/** Renders a website inside a phone or browser frame, scaled to fit its container. */
export function DeviceFrame({ site, device, selectedId, onSelect, height = 680 }: { site: Website; device: Device; selectedId?: string | null; onSelect?: (id: string) => void; height?: number }) {
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
  const chrome = device === 'desktop' ? 28 : 0;
  return (
    <div ref={ref} className="w-full">
      <div className={cx('mx-auto overflow-hidden border border-line-strong bg-ink shadow-[0_30px_80px_-30px_rgb(30_107_255/0.6)]', device === 'mobile' ? 'rounded-[2rem] border-[3px] border-[#1c2a44]' : 'rounded-xl')}
        style={{ width: frameW * scale, height }}>
        {device === 'desktop' && (
          <div className="flex items-center gap-1.5 h-7 px-3 bg-navy-2 border-b border-line" aria-hidden="true">
            <span className="size-2 rounded-full bg-bad/70" /><span className="size-2 rounded-full bg-warn/70" /><span className="size-2 rounded-full bg-good/70" />
            <span className="ml-3 flex-1 max-w-xs text-[10px] text-mute truncate bg-ink/60 rounded px-2 py-0.5">{site.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.novara.site</span>
          </div>
        )}
        <div className="overflow-y-auto overflow-x-hidden scroll-thin" style={{ height: height - chrome }}>
          <div style={{ width: frameW, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <SiteRenderer site={site} selectedId={selectedId} onSelect={onSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}
