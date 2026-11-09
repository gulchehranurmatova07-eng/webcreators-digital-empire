import { useState } from 'react';
import { act, useGame, useStore } from '../../store/game';
import * as E from '../../engine/engine';
import { levelFromXp } from '../../engine/config';
import { TEMPLATES, qualityScore } from '../../engine/website';
import type { Website } from '../../engine/types';
import { navigate } from '../../app/router';
import { Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Progress, cx, inputCls } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { SiteRenderer } from './SiteRenderer';

/** Scaled-down live thumbnail of a site. */
function Thumb({ site }: { site: Website }) {
  return (
    <div className="relative h-44 overflow-hidden rounded-t-[1.25rem] border-b border-line bg-ink pointer-events-none" aria-hidden="true">
      <div className="origin-top-left" style={{ width: 1000, transform: 'scale(0.36)' }}><SiteRenderer site={site} /></div>
    </div>
  );
}

export function StudioList() {
  const g = useGame((x) => x);
  const level = levelFromXp(g.xp);
  const [picking, setPicking] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Website | null>(null);

  const startCreate = (templateId: string) => {
    setPicking(templateId);
    setName(g.businesses.find((b) => !b.websiteId)?.name ?? g.player!.name + "'s Site");
  };
  const create = () => {
    if (!picking) return;
    if (act((s, c) => E.createWebsite(s, c, { templateId: picking, name }))) {
      const list = useStore.getState().game.websites;
      setPicking(null);
      navigate(`/studio/${list[list.length - 1].id}`);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Website Studio" title="Your websites" subtitle="Pick a template, customise it in the visual editor, then publish and link it to a business. Better websites attract more customers." />

      {g.websites.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
          {g.websites.map((w) => {
            const q = qualityScore(w);
            const biz = g.businesses.find((b) => b.websiteId === w.id);
            return (
              <Card key={w.id} className="overflow-hidden card-hover">
                <button className="block w-full text-left" onClick={() => navigate(`/studio/${w.id}`)} aria-label={`Edit ${w.name}`}><Thumb site={w} /></button>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display font-semibold truncate">{w.name}</div>
                    {w.published ? <Badge tone="good">Live</Badge> : <Badge tone="mute">Draft</Badge>}
                  </div>
                  <div className="text-xs text-mute mt-0.5 truncate">{biz ? `Linked to ${biz.name}` : 'Not linked to a business'}</div>
                  <div className="flex items-center gap-2 mt-3"><Progress value={q} max={100} className="h-1.5 flex-1" tone={q >= 75 ? 'good' : 'brand'} label="Quality" /><span className="text-xs tabular-nums">{q}/100</span></div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="flex-1" icon="palette" onClick={() => navigate(`/studio/${w.id}`)}>Edit</Button>
                    <Button size="sm" variant="ghost" aria-label={`Delete ${w.name}`} onClick={() => setConfirmDelete(w)}><Icon name="trash" size={15} /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="font-display text-lg font-semibold mb-1">Start from a template</h2>
      <p className="text-sm text-mute mb-4">Every template is fully editable. Premium templates unlock as you level up.</p>
      {g.websites.length === 0 && <Card className="mb-4"><EmptyState icon="template" title="No websites yet" body="Choose a template below to build your first website (Mission 01)." /></Card>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => {
          const locked = level < t.unlockLevel;
          const preview: Website = { id: t.id, name: 'Preview', templateId: t.id, theme: t.theme, published: false, createdAt: 0, updatedAt: 0, sections: t.build('Your Brand').map(([type, data], i) => ({ id: `${i}`, type, data: { ...data } }) as never) };
          return (
            <Card key={t.id} className={cx('overflow-hidden', locked ? 'opacity-60' : 'card-hover')}>
              <Thumb site={preview} />
              <div className="p-4">
                <div className="flex items-center justify-between"><div className="font-display font-semibold">{t.name}</div>{locked && <Badge tone="mute"><Icon name="lock" size={10} /> Level {t.unlockLevel}</Badge>}</div>
                <p className="text-xs text-mute mt-1 min-h-8">{t.description}</p>
                <Button size="sm" className="w-full mt-3" variant={locked ? 'secondary' : 'primary'} disabled={locked} onClick={() => startCreate(t.id)}>{locked ? 'Locked' : 'Use template'}</Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!picking} onClose={() => setPicking(null)} title="Name your website"
        footer={<><Button variant="ghost" onClick={() => setPicking(null)}>Cancel</Button><Button disabled={name.trim().length < 2} onClick={create} icon="arrow">Create & edit</Button></>}>
        <Field label="Website name" hint="Usually your business name. 2–28 characters.">
          <input autoFocus className={inputCls} value={name} maxLength={28} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim().length >= 2 && create()} />
        </Field>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={`Delete ${confirmDelete?.name}?`}
        footer={<><Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" onClick={() => { act((s, c) => E.deleteWebsite(s, c, confirmDelete!.id)); setConfirmDelete(null); }}>Delete</Button></>}>
        This website will be removed and unlinked from any business. This cannot be undone.
      </Modal>
    </>
  );
}
