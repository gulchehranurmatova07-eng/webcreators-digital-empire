import { useRef, useState } from 'react';
import { act, useGame } from '../../store/game';
import * as E from '../../engine/engine';
import { CAMPAIGNS, CAMPAIGN_ORDER, CATEGORIES, HIRE_FEE, LOCATIONS, levelFromXp, upgradesFor } from '../../engine/config';
import { PERKS } from '../../engine/characters';
import { breakdown, resaleValue } from '../../engine/sim';
import { qualityScore, websiteEffects } from '../../engine/website';
import { navigate } from '../../app/router';
import { Link } from '../../app/Link';
import { VenueScene } from '../../art/Scene';
import { Badge, BarChart, Button, Coins, EmptyState, Modal, Progress, cx, fmt } from '../../ui/kit';
import { HexStat, Panel } from '../../ui/hud';
import { Icon } from '../../ui/Icon';
import { DemoGenerator } from '../studio/DemoGenerator';

type Tab = 'team' | 'upgrades' | 'marketing' | 'website' | 'report';

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'good' | 'bad' | 'mute' }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="text-mute">{label}</span>
      <span className={cx('tabular-nums font-medium', tone === 'good' && 'text-good', tone === 'bad' && 'text-bad', tone === 'mute' && 'text-mute')}>{value}</span>
    </div>
  );
}

const DOCK: { id: Tab; label: string; icon: string }[] = [
  { id: 'team', label: 'Staff', icon: 'users' },
  { id: 'upgrades', label: 'Upgrades', icon: 'zap' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { id: 'website', label: 'Website', icon: 'globe' },
  { id: 'report', label: 'Report', icon: 'file' },
];

export function BusinessDetail({ id, openDemo = false }: { id: string; openDemo?: boolean }) {
  const g = useGame((x) => x);
  const [tab, setTab] = useState<Tab>('team');
  const [confirmSell, setConfirmSell] = useState(false);
  const [demo, setDemo] = useState(openDemo);
  const panelRef = useRef<HTMLDivElement>(null);
  const b = g.businesses.find((x) => x.id === id);
  if (!b) return <Panel><EmptyState icon="building" title="Business not found" body="It may have been sold." action={<Button onClick={() => navigate('/empire')}>Back to empire</Button>} /></Panel>;

  const cat = CATEGORIES[b.category];
  const ch = g.player!.character;
  const site = g.websites.find((w) => w.id === b.websiteId);
  const bd = breakdown(b, site, ch);
  const last = b.history[b.history.length - 1];
  const prev = b.history[b.history.length - 2];
  const level = levelFromXp(g.xp);
  const fixed = bd.dailyFixed.rent + bd.dailyFixed.wages + bd.dailyFixed.upkeep;
  const go = (t: Tab) => { setTab(t); panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const trend = (k: 'customers' | 'profit' | 'satisfaction') => (last && prev ? Math.sign(last[k] - prev[k]) : 0);
  const q = site ? qualityScore(site) : 0;
  const usage = last ? Math.round((last.customers / Math.max(1, last.capacity)) * 100) : 0;
  const margin = last && last.revenue > 0 ? Math.round((last.profit / last.revenue) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ---------- Venue ---------- */}
      <section className="panel overflow-hidden p-0">
        <div className="relative">
          <VenueScene className="h-[340px] sm:h-[460px]"
            spec={{ category: b.category, color: b.color, name: b.name, capacity: bd.capacity.total, customers: last ? last.customers : -1, turnedAway: last?.turnedAway ?? 0, staff: b.staff, satisfaction: b.satisfaction }} />

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink/85 border border-line px-3 py-2.5 max-w-[70%]">
              <button onClick={() => navigate('/empire')} className="text-mute hover:text-white" aria-label="Back to empire"><Icon name="chevron-left" size={18} /></button>
              <span className="grid place-items-center size-10 rounded-xl shrink-0" style={{ background: `${b.color}26`, color: b.color, boxShadow: `inset 0 0 0 1px ${b.color}66` }}><Icon name={b.icon} size={19} /></span>
              <div className="min-w-0">
                <h1 className="font-display font-semibold leading-tight truncate">{b.name}</h1>
                <div className="text-[11px] text-mute truncate">{cat.name} · {LOCATIONS[b.location].name}</div>
                <div className="flex gap-0.5 mt-0.5" aria-label={`Reputation ${Math.round(b.reputation)} of 100`}>
                  {Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" size={11} className={i < Math.round(b.reputation / 20) ? 'text-warn fill-warn' : 'text-white/20'} />)}
                </div>
              </div>
            </div>
            <div className="pointer-events-auto flex flex-col items-end gap-1.5">
              <Badge tone="mute"><Icon name="calendar" size={11} /> Day {g.day}</Badge>
              {last ? <Badge tone={last.turnedAway > 0 ? 'warn' : 'good'}><Icon name="users" size={11} /> {last.customers}/{last.capacity} {cat.customerWord}</Badge>
                : <Badge tone="blue">Opens on your next day</Badge>}
            </div>
          </div>

          {!site && (
            <div className="absolute left-3 bottom-20 sm:bottom-24 max-w-xs panel p-3 animate-rise">
              <div className="flex items-start gap-2.5">
                <span className="grid place-items-center size-8 rounded-lg bg-cyan/15 text-cyan shrink-0"><Icon name="sparkles" size={15} /></span>
                <div>
                  <div className="text-sm font-semibold">No website yet</div>
                  <p className="text-[11px] text-mute">Generate a demo website from your brand in one tap, then build the real version.</p>
                  <Button size="sm" className="mt-2" icon="sparkles" onClick={() => setDemo(true)}>Generate demo</Button>
                </div>
              </div>
            </div>
          )}

          <nav className="absolute bottom-3 inset-x-3 flex justify-center" aria-label="Business management">
            <div className="flex gap-1 rounded-2xl bg-ink/85 border border-line p-1.5 overflow-x-auto scroll-thin">
              {DOCK.map((d) => (
                <button key={d.id} onClick={() => go(d.id)} aria-pressed={tab === d.id}
                  className={cx('flex flex-col items-center gap-0.5 min-w-[60px] px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition', tab === d.id ? 'bg-brand text-white shadow-[0_0_18px_-4px_#1E6BFF]' : 'text-soft hover:bg-white/[0.06]')}>
                  <Icon name={d.icon} size={18} />{d.label}
                </button>
              ))}
              <button onClick={() => act(E.endDay)} className="flex flex-col items-center gap-0.5 min-w-[60px] px-2.5 py-1.5 rounded-xl text-[10px] font-semibold bg-cyan/15 text-cyan hover:bg-cyan/25 transition">
                <Icon name="sun" size={18} />End day
              </button>
            </div>
          </nav>
        </div>
      </section>

      {/* ---------- KPIs ---------- */}
      <Panel title="Performance" icon="chart" bodyClass="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-y-5 gap-x-2 justify-items-center">
          <HexStat label="Reputation" value={Math.round(b.reputation)} score={b.reputation} trend={trend('satisfaction')} />
          <HexStat label="Satisfaction" value={b.satisfaction} score={b.satisfaction} trend={trend('satisfaction')} />
          <HexStat label="Visibility" value={bd.visibility.total} score={Math.min(100, bd.visibility.total)} />
          <HexStat label="Capacity use" value={last ? `${usage}%` : '—'} score={last ? Math.min(100, usage) : 0} trend={trend('customers')} />
          <HexStat label="Website" value={site ? q : '—'} score={site?.published ? q : 0} />
          <HexStat label="Margin" value={last ? `${margin}%` : '—'} score={last ? Math.max(0, Math.min(100, margin * 3)) : 0} trend={trend('profit')} />
        </div>
      </Panel>

      <div ref={panelRef} className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4 scroll-mt-32">
        <div className="space-y-4 min-w-0">
          {tab === 'team' && (
            <Panel title="Staff" icon="users">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(8, b.staff + 1) }).map((_, i) => (
                    <span key={i} className={cx('grid place-items-center size-10 rounded-full border-2 border-navy', i === 0 ? 'bg-brand' : 'bg-navy-2 text-brand-2')} title={i === 0 ? 'You (founder)' : `Employee ${i}`}><Icon name="user" size={16} /></span>
                  ))}
                </div>
                <div className="flex-1 text-sm">
                  <div><b>{b.staff}</b> employee{b.staff === 1 ? '' : 's'} + you</div>
                  <div className="text-xs text-mute">Each employee serves {cat.capacityPerStaff} {cat.customerWord}/day and costs {cat.wage} coins/day. Hiring fee: {HIRE_FEE}.</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" icon="user-minus" disabled={b.staff === 0} onClick={() => act((s, c) => E.fireStaff(s, c, b.id))}>Let go</Button>
                  <Button icon="user-plus" disabled={g.coins < HIRE_FEE} onClick={() => act((s, c) => E.hireStaff(s, c, b.id))}>Hire</Button>
                </div>
              </div>
              {last && (
                <div className={cx('mt-4 rounded-xl p-3 text-sm border', last.turnedAway > 0 ? 'border-warn/30 bg-warn/[0.06] text-warn' : 'border-line bg-ink/40 text-mute')}>
                  {last.turnedAway > 0 ? `Demand was ${last.demand} but you could only serve ${last.capacity}. The queue at the door is unhappy, and overloaded staff lowers satisfaction.`
                    : `Demand (${last.demand}) fit within capacity (${last.capacity}).${last.capacity - last.demand > cat.capacityPerStaff ? ' You may have more staff than you need.' : ''}`}
                </div>
              )}
            </Panel>
          )}

          {tab === 'upgrades' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {upgradesFor(b.category).map((u) => {
                const owned = b.upgrades.includes(u.id);
                const blocked = u.requiresWebsite && !b.websiteId;
                const eff = u.effects;
                return (
                  <div key={u.id} className={cx('panel p-4 flex flex-col', owned && 'border-good/30')}>
                    <div className="flex items-start gap-3">
                      <span className={cx('grid place-items-center size-10 rounded-xl shrink-0', owned ? 'bg-good/15 text-good' : 'bg-brand/15 text-brand-2')}><Icon name={u.icon} size={18} /></span>
                      <div className="min-w-0"><div className="font-medium text-sm">{u.name}</div><div className="text-xs text-mute">{u.description}</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {eff.visibility && <Badge>+{eff.visibility} visibility</Badge>}
                      {eff.conversion && <Badge>+{Math.round(eff.conversion * 100)}% conversion</Badge>}
                      {eff.capacity && <Badge>+{eff.capacity} capacity</Badge>}
                      {eff.satisfaction && <Badge tone="good">+{eff.satisfaction} satisfaction</Badge>}
                      {eff.ticket && <Badge tone="good">+{Math.round(eff.ticket * 100)}% avg. ticket</Badge>}
                      {eff.upkeep && <Badge tone="warn">−{eff.upkeep}/day upkeep</Badge>}
                    </div>
                    <div className="mt-auto pt-4">
                      {owned ? <div className="flex items-center gap-1.5 text-sm text-good"><Icon name="check" size={15} /> Installed</div>
                        : <Button className="w-full" size="sm" disabled={blocked || g.coins < u.cost} onClick={() => act((s, c) => E.buyUpgrade(s, c, b.id, u.id))}>{blocked ? 'Needs a linked website' : <>Buy · <Coins value={u.cost} /></>}</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'marketing' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {CAMPAIGN_ORDER.map((cid) => {
                const c = CAMPAIGNS[cid];
                const cost = Math.round(c.cost * PERKS.campaignCost(ch));
                const running = b.campaigns.find((x) => x.id === cid);
                const locked = level < c.unlockLevel;
                const needsSite = c.requiresWebsite && !b.websiteId;
                return (
                  <div key={cid} className={cx('panel p-4 flex flex-col', running && 'border-warn/40')}>
                    <div className="flex items-start gap-3">
                      <span className="grid place-items-center size-10 rounded-xl bg-brand/15 text-brand-2 shrink-0"><Icon name={locked ? 'lock' : c.icon} size={18} /></span>
                      <div className="min-w-0 flex-1"><div className="font-medium text-sm">{c.name}</div><div className="text-xs text-mute">{c.description}</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3"><Badge>+{c.visibility} visibility</Badge><Badge tone="mute">{c.days} days</Badge>{cost < c.cost && <Badge tone="good">Jack’s discount</Badge>}</div>
                    <div className="mt-auto pt-4">
                      {running ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-warn">Running</span><span className="text-mute">{running.daysLeft} day{running.daysLeft === 1 ? '' : 's'} left</span></div>
                          <Progress value={c.days - running.daysLeft} max={c.days} tone="warn" className="h-1.5" label="Campaign progress" />
                        </div>
                      ) : (
                        <Button className="w-full" size="sm" disabled={locked || needsSite || g.coins < cost} onClick={() => act((s, x) => E.launchCampaign(s, x, b.id, cid))}>
                          {locked ? `Unlocks at Level ${c.unlockLevel}` : needsSite ? 'Needs a linked website' : <>Launch · <Coins value={cost} /></>}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'website' && (
            <Panel title="Business website" icon="globe" action={<Button size="sm" icon="sparkles" onClick={() => setDemo(true)}>Generate demo</Button>}>
              {g.websites.length === 0 ? (
                <EmptyState icon="template" title="No websites yet" body="Generate a demo from your brand, or build one from a template in the Studio." action={<Button icon="sparkles" onClick={() => setDemo(true)}>Generate demo website</Button>} />
              ) : (
                <div className="space-y-2">
                  {g.websites.map((w) => {
                    const linked = b.websiteId === w.id;
                    const wq = qualityScore(w);
                    const eff = websiteEffects(w);
                    const usedBy = g.businesses.find((x) => x.websiteId === w.id && x.id !== b.id);
                    return (
                      <div key={w.id} className={cx('flex flex-wrap items-center gap-3 p-3 rounded-xl border', linked ? 'border-cyan/60 bg-cyan/[0.06]' : 'border-line bg-ink/40')}>
                        <Icon name="globe" size={18} className={w.published ? 'text-good' : 'text-mute'} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{w.name} {!w.published && <Badge tone="mute">Draft</Badge>}</div>
                          <div className="text-[11px] text-mute">Quality {wq}/100 · {w.published ? `+${Math.round(eff.visibility * PERKS.websiteVisibility(ch))} visibility${eff.conversion ? `, +${eff.conversion * 100}% conversion` : ''}` : 'Publish it to attract customers'}{usedBy ? ` · linked to ${usedBy.name}` : ''}</div>
                        </div>
                        <Link to={`/studio/${w.id}`} className="text-xs text-brand-2 hover:underline">Edit</Link>
                        {linked ? <Button size="sm" variant="secondary" onClick={() => act((s, c) => E.linkWebsite(s, c, b.id, null))}>Unlink</Button>
                          : <Button size="sm" onClick={() => act((s, c) => E.linkWebsite(s, c, b.id, w.id))}>Link</Button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}

          {tab === 'report' && (
            <Panel title={last ? `Day ${last.day} report` : 'Daily report'} icon="file">
              {last ? (
                <>
                  <Row label="Potential customers" value={last.demand} />
                  <Row label="Served" value={last.customers} />
                  {last.turnedAway > 0 && <Row label="Turned away" value={last.turnedAway} tone="bad" />}
                  <Row label="Revenue" value={`+${fmt(last.revenue)}`} tone="good" />
                  <Row label="Goods" value={`−${fmt(last.goodsCost)}`} />
                  <Row label="Rent" value={`−${fmt(last.rent)}`} />
                  <Row label="Wages" value={`−${fmt(last.wages)}`} />
                  <Row label="Upkeep" value={`−${fmt(last.upkeep)}`} />
                  <div className="h-px bg-line my-2" />
                  <Row label="Profit" value={`${last.profit >= 0 ? '+' : ''}${fmt(last.profit)}`} tone={last.profit >= 0 ? 'good' : 'bad'} />
                </>
              ) : <p className="text-sm text-mute">Press “End day” to open your doors and get your first report.</p>}
            </Panel>
          )}

          <Panel title="Profit history" icon="trending">
            {b.history.length ? <BarChart data={b.history.map((h) => ({ x: `Day ${h.day}`, y: h.profit }))} label={`Daily profit for ${b.name}`} />
              : <p className="text-sm text-mute py-6 text-center">No days run yet.</p>}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Why these numbers?" icon="info">
            <div className="text-[10px] uppercase tracking-wider text-cyan font-semibold mb-1">Visibility {bd.visibility.total}</div>
            <Row label="Base presence" value={bd.visibility.base} />
            <Row label="Website" value={`+${bd.visibility.website}`} tone={bd.visibility.website ? 'good' : 'mute'} />
            <Row label="Upgrades" value={`+${bd.visibility.upgrades}`} tone={bd.visibility.upgrades ? 'good' : 'mute'} />
            <Row label="Campaigns" value={`+${bd.visibility.campaigns}`} tone={bd.visibility.campaigns ? 'good' : 'mute'} />
            <Row label="Location traffic" value={`×${bd.visibility.locationMult.toFixed(2)}`} />
            <div className="h-px bg-line my-2" />
            <Row label="Conversion boost" value={`×${bd.conversion.toFixed(2)}`} />
            <Row label="Average ticket" value={`${bd.ticket.toFixed(1)} coins`} />
            <Row label="Capacity" value={`${bd.capacity.total} / day`} />
            <div className="h-px bg-line my-2" />
            <div className="text-[10px] uppercase tracking-wider text-cyan font-semibold mb-1">Daily fixed costs {fixed}</div>
            <Row label="Rent" value={`−${bd.dailyFixed.rent}`} />
            <Row label="Wages" value={`−${bd.dailyFixed.wages}`} />
            <Row label="Upkeep" value={`−${bd.dailyFixed.upkeep}`} />
            <Row label="Goods" value={`${Math.round(cat.goodsRate * 100)}% of revenue`} />
          </Panel>
          <Panel title="Sell business" icon="warning">
            <p className="text-sm text-mute">Get back 40% of what you invested ({fmt(b.invested)} coins).</p>
            <Button variant="danger" className="w-full mt-4" onClick={() => setConfirmSell(true)}>Sell for {fmt(resaleValue(b))} coins</Button>
          </Panel>
        </div>
      </div>

      {demo && <DemoGenerator business={b} onClose={() => { setDemo(false); if (openDemo) navigate(`/empire/${b.id}`); }} />}

      <Modal open={confirmSell} onClose={() => setConfirmSell(false)} title={`Sell ${b.name}?`}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmSell(false)}>Keep it</Button>
          <Button variant="danger" onClick={() => { if (act((s, c) => E.sellBusiness(s, c, b.id))) navigate('/empire'); }}>Sell for {fmt(resaleValue(b))} coins</Button>
        </>}>
        This permanently removes the business, its staff and upgrades. Its history will be lost. This cannot be undone.
      </Modal>
    </div>
  );
}
