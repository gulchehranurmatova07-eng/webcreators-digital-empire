import { act, useGame } from '../../store/game';
import * as E from '../../engine/engine';
import { CATEGORIES, CITY_NAME, LOCATIONS } from '../../engine/config';
import { navigate } from '../../app/router';
import { Link } from '../../app/Link';
import { Badge, Button, Card, Coins, EmptyState, PageHeader, Progress, cx, fmt } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { sceneImage } from '../../art/Scene';

export function EmpireList() {
  const g = useGame((x) => x);
  const totalLast = g.businesses.reduce((sum, b) => sum + (b.history[b.history.length - 1]?.profit ?? 0), 0);
  return (
    <>
      <PageHeader eyebrow={`${CITY_NAME} · Day ${g.day}`} title="Business Empire"
        subtitle="Each day, customers visit based on visibility, your website, reputation and capacity. Profit = revenue − goods − rent − wages − upkeep."
        actions={<>
          <Button variant="secondary" icon="plus" onClick={() => navigate('/empire/new')}>New business</Button>
          <Button icon="sun" disabled={g.businesses.length === 0} onClick={() => act(E.endDay)}>End day {g.day}</Button>
        </>} />

      {g.businesses.length === 0 ? (
        <Card><EmptyState icon="store" title="Your empire starts here" body={`You have ${fmt(g.coins)} virtual coins. Pick a business, give it a brand and choose a district in ${CITY_NAME}.`}
          action={<Button icon="plus" onClick={() => navigate('/empire/new')}>Open your first business</Button>} /></Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Card className="p-4"><div className="text-xs text-mute">Businesses</div><div className="font-display text-2xl font-semibold mt-1">{g.businesses.length}</div></Card>
            <Card className="p-4"><div className="text-xs text-mute">Customers served</div><div className="font-display text-2xl font-semibold mt-1 tabular-nums">{fmt(g.stats.customersServed)}</div></Card>
            <Card className="p-4"><div className="text-xs text-mute">Last day profit</div><div className={cx('font-display text-2xl font-semibold mt-1 tabular-nums', totalLast < 0 ? 'text-bad' : 'text-good')}>{g.stats.daysRun ? `${totalLast >= 0 ? '+' : ''}${fmt(totalLast)}` : '—'}</div></Card>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {g.businesses.map((b) => {
              const cat = CATEGORIES[b.category];
              const last = b.history[b.history.length - 1];
              const site = g.websites.find((w) => w.id === b.websiteId);
              return (
                <Link key={b.id} to={`/empire/${b.id}`} className="panel card-hover overflow-hidden block">
                  <img src={sceneImage({ type: 'venue', category: b.category, color: b.color, name: b.name }, 640, 300)} alt="" className="w-full h-36 object-cover border-b border-line" />
                  <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid place-items-center size-12 rounded-2xl shrink-0" style={{ background: `${b.color}22`, color: b.color, boxShadow: `inset 0 0 0 1px ${b.color}55` }}><Icon name={b.icon} size={22} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold truncate">{b.name}</div>
                      <div className="text-xs text-mute truncate">{cat.name} · {LOCATIONS[b.location].name}</div>
                    </div>
                    {b.campaigns.length > 0 && <Badge tone="warn"><Icon name="megaphone" size={10} /> {b.campaigns.length}</Badge>}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-ink/50 py-2"><div className="text-[10px] text-mute">Customers</div><div className="text-sm font-semibold tabular-nums">{last ? `${last.customers}/${last.capacity}` : '—'}</div></div>
                    <div className="rounded-xl bg-ink/50 py-2"><div className="text-[10px] text-mute">Profit</div><div className={cx('text-sm font-semibold tabular-nums', last && (last.profit >= 0 ? 'text-good' : 'text-bad'))}>{last ? `${last.profit >= 0 ? '+' : ''}${fmt(last.profit)}` : '—'}</div></div>
                    <div className="rounded-xl bg-ink/50 py-2"><div className="text-[10px] text-mute">Staff</div><div className="text-sm font-semibold">{b.staff}</div></div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-mute mb-1"><span>Reputation</span><span>{Math.round(b.reputation)}/100</span></div>
                    <Progress value={b.reputation} max={100} className="h-1.5" tone={b.reputation >= 60 ? 'good' : b.reputation >= 40 ? 'brand' : 'warn'} label="Reputation" />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-mute">
                    <Icon name="globe" size={12} className={site?.published ? 'text-good' : ''} />
                    {site ? `${site.name}${site.published ? '' : ' (draft)'}` : 'No website linked'}
                  </div>
                  </div>
                </Link>
              );
            })}
            <button onClick={() => navigate('/empire/new')} className="rounded-[1.25rem] border border-dashed border-line-strong p-5 flex flex-col items-center justify-center gap-2 text-mute hover:text-white hover:border-brand transition min-h-48">
              <Icon name="plus" size={22} /><span className="text-sm font-medium">Open another business</span>
              <span className="text-[11px]">You have <Coins value={g.coins} /></span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
