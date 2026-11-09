import { useState } from 'react';
import { act, useGame } from '../../store/game';
import * as E from '../../engine/engine';
import { CAMPAIGNS, CAMPAIGN_ORDER, CATEGORIES, HIRE_FEE, LOCATIONS, levelFromXp, upgradesFor } from '../../engine/config';
import { breakdown, resaleValue } from '../../engine/sim';
import { qualityScore, websiteEffects } from '../../engine/website';
import { navigate } from '../../app/router';
import { Link } from '../../app/Link';
import { Badge, BarChart, Button, Card, CardTitle, Coins, EmptyState, Modal, PageHeader, Progress, Segmented, cx, fmt } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

type Tab = 'operations' | 'upgrades' | 'marketing' | 'website';

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'good' | 'bad' | 'mute' }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="text-mute">{label}</span>
      <span className={cx('tabular-nums font-medium', tone === 'good' && 'text-good', tone === 'bad' && 'text-bad', tone === 'mute' && 'text-mute')}>{value}</span>
    </div>
  );
}

export function BusinessDetail({ id }: { id: string }) {
  const g = useGame((x) => x);
  const [tab, setTab] = useState<Tab>('operations');
  const [confirmSell, setConfirmSell] = useState(false);
  const b = g.businesses.find((x) => x.id === id);
  if (!b) return <Card><EmptyState icon="building" title="Business not found" body="It may have been sold." action={<Button onClick={() => navigate('/empire')}>Back to empire</Button>} /></Card>;

  const cat = CATEGORIES[b.category];
  const site = g.websites.find((w) => w.id === b.websiteId);
  const bd = breakdown(b, site);
  const last = b.history[b.history.length - 1];
  const level = levelFromXp(g.xp);
  const fixed = bd.dailyFixed.rent + bd.dailyFixed.wages + bd.dailyFixed.upkeep;
  const bAct = (fn: Parameters<typeof act>[0]) => act(fn);

  return (
    <>
      <PageHeader eyebrow={`${cat.name} · ${LOCATIONS[b.location].name}`} title={b.name} subtitle={b.tagline || undefined}
        actions={<>
          <Button variant="ghost" icon="chevron-left" onClick={() => navigate('/empire')}>Empire</Button>
          <Button icon="sun" onClick={() => bAct(E.endDay)}>End day {g.day}</Button>
        </>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Card className="p-4">
          <div className="text-xs text-mute flex items-center gap-1.5"><Icon name="star" size={13} className="text-brand-2" />Reputation</div>
          <div className="font-display text-2xl font-semibold mt-1">{Math.round(b.reputation)}<span className="text-sm text-mute">/100</span></div>
          <Progress value={b.reputation} max={100} className="h-1 mt-2" label="Reputation" />
        </Card>
        <Card className="p-4">
          <div className="text-xs text-mute flex items-center gap-1.5"><Icon name="heart" size={13} className="text-brand-2" />Satisfaction</div>
          <div className="font-display text-2xl font-semibold mt-1">{b.satisfaction}<span className="text-sm text-mute">/100</span></div>
          <Progress value={b.satisfaction} max={100} className="h-1 mt-2" tone={b.satisfaction >= 60 ? 'good' : 'warn'} label="Satisfaction" />
        </Card>
        <Card className="p-4">
          <div className="text-xs text-mute flex items-center gap-1.5"><Icon name="users" size={13} className="text-brand-2" />Last day {cat.customerWord}</div>
          <div className="font-display text-2xl font-semibold mt-1 tabular-nums">{last ? last.customers : '—'}<span className="text-sm text-mute"> / {bd.capacity.total} cap.</span></div>
          <div className="text-[11px] mt-1 text-mute">{last && last.turnedAway > 0 ? <span className="text-warn">{last.turnedAway} turned away</span> : `${fmt(b.totals.customers)} served in total`}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-mute flex items-center gap-1.5"><Icon name="coins" size={13} className="text-brand-2" />Last day profit</div>
          <div className={cx('font-display text-2xl font-semibold mt-1 tabular-nums', last && (last.profit >= 0 ? 'text-good' : 'text-bad'))}>{last ? `${last.profit >= 0 ? '+' : ''}${fmt(last.profit)}` : '—'}</div>
          <div className="text-[11px] mt-1 text-mute">{fmt(b.totals.profit)} lifetime profit</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5 min-w-0">
          <Segmented label="Management section" value={tab} onChange={setTab} options={[
            { value: 'operations', label: 'Team', icon: 'users' },
            { value: 'upgrades', label: 'Upgrades', icon: 'zap' },
            { value: 'marketing', label: 'Marketing', icon: 'megaphone' },
            { value: 'website', label: 'Website', icon: 'globe' },
          ]} />

          {tab === 'operations' && (
            <Card className="p-5">
              <CardTitle icon="users">Team</CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.max(1, b.staff + 1) }).slice(0, 8).map((_, i) => (
                    <span key={i} className={cx('grid place-items-center size-10 rounded-full border-2 border-navy', i === 0 ? 'bg-brand' : 'bg-navy-2 text-brand-2')} title={i === 0 ? 'You (founder)' : `Employee ${i}`}>
                      <Icon name="user" size={16} />
                    </span>
                  ))}
                </div>
                <div className="flex-1 text-sm">
                  <div><b>{b.staff}</b> employee{b.staff === 1 ? '' : 's'} + you</div>
                  <div className="text-xs text-mute">Each employee serves {cat.capacityPerStaff} {cat.customerWord}/day and costs {cat.wage} coins/day. Hiring fee: {HIRE_FEE}.</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" icon="user-minus" disabled={b.staff === 0} onClick={() => bAct((s, c) => E.fireStaff(s, c, b.id))}>Let go</Button>
                  <Button icon="user-plus" disabled={g.coins < HIRE_FEE} onClick={() => bAct((s, c) => E.hireStaff(s, c, b.id))}>Hire</Button>
                </div>
              </div>
              {last && (
                <div className={cx('mt-4 rounded-xl p-3 text-sm border', last.turnedAway > 0 ? 'border-warn/30 bg-warn/[0.06] text-warn' : 'border-line bg-ink/40 text-mute')}>
                  {last.turnedAway > 0
                    ? `Demand was ${last.demand} but you could only serve ${last.capacity}. Overloaded staff also lowers satisfaction.`
                    : `Demand (${last.demand}) fit within capacity (${last.capacity}). ${last.capacity - last.demand > cat.capacityPerStaff ? 'You may have more staff than you need.' : ''}`}
                </div>
              )}
            </Card>
          )}

          {tab === 'upgrades' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {upgradesFor(b.category).map((u) => {
                const owned = b.upgrades.includes(u.id);
                const blocked = u.requiresWebsite && !b.websiteId;
                const eff = u.effects;
                return (
                  <Card key={u.id} className={cx('p-4 flex flex-col', owned && 'border-good/30')}>
                    <div className="flex items-start gap-3">
                      <span className={cx('grid place-items-center size-10 rounded-xl shrink-0', owned ? 'bg-good/15 text-good' : 'bg-brand/15 text-brand-2')}><Icon name={u.icon} size={18} /></span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs text-mute">{u.description}</div>
                      </div>
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
                        : <Button className="w-full" size="sm" disabled={blocked || g.coins < u.cost} onClick={() => bAct((s, c) => E.buyUpgrade(s, c, b.id, u.id))}>
                          {blocked ? 'Needs a linked website' : <>Buy · <Coins value={u.cost} /></>}
                        </Button>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {tab === 'marketing' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {CAMPAIGN_ORDER.map((cid) => {
                const c = CAMPAIGNS[cid];
                const running = b.campaigns.find((x) => x.id === cid);
                const locked = level < c.unlockLevel;
                const needsSite = c.requiresWebsite && !b.websiteId;
                return (
                  <Card key={cid} className={cx('p-4 flex flex-col', running && 'border-warn/40')}>
                    <div className="flex items-start gap-3">
                      <span className="grid place-items-center size-10 rounded-xl bg-brand/15 text-brand-2 shrink-0"><Icon name={locked ? 'lock' : c.icon} size={18} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-xs text-mute">{c.description}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-3"><Badge>+{c.visibility} visibility</Badge><Badge tone="mute">{c.days} days</Badge></div>
                    <div className="mt-auto pt-4">
                      {running ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-warn">Running</span><span className="text-mute">{running.daysLeft} day{running.daysLeft === 1 ? '' : 's'} left</span></div>
                          <Progress value={c.days - running.daysLeft} max={c.days} tone="warn" className="h-1.5" label="Campaign progress" />
                        </div>
                      ) : (
                        <Button className="w-full" size="sm" disabled={locked || needsSite || g.coins < c.cost} onClick={() => bAct((s, x) => E.launchCampaign(s, x, b.id, cid))}>
                          {locked ? `Unlocks at Level ${c.unlockLevel}` : needsSite ? 'Needs a linked website' : <>Launch · <Coins value={c.cost} /></>}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {tab === 'website' && (
            <Card className="p-5">
              <CardTitle icon="globe">Business website</CardTitle>
              {g.websites.length === 0 ? (
                <EmptyState icon="template" title="No websites yet" body="Build a website in the Studio, publish it, then link it here to boost visibility and conversion." action={<Button onClick={() => navigate('/studio')}>Open Studio</Button>} />
              ) : (
                <div className="space-y-2">
                  {g.websites.map((w) => {
                    const linked = b.websiteId === w.id;
                    const q = qualityScore(w);
                    const eff = websiteEffects(w);
                    const usedBy = g.businesses.find((x) => x.websiteId === w.id && x.id !== b.id);
                    return (
                      <div key={w.id} className={cx('flex flex-wrap items-center gap-3 p-3 rounded-xl border', linked ? 'border-brand bg-brand/[0.08]' : 'border-line bg-ink/40')}>
                        <Icon name="globe" size={18} className={w.published ? 'text-good' : 'text-mute'} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{w.name} {!w.published && <Badge tone="mute">Draft</Badge>}</div>
                          <div className="text-[11px] text-mute">Quality {q}/100 · {w.published ? `+${eff.visibility} visibility${eff.conversion ? `, +${eff.conversion * 100}% conversion` : ''}${eff.satisfaction ? `, +${eff.satisfaction} satisfaction` : ''}` : 'Publish to take effect'}{usedBy ? ` · linked to ${usedBy.name}` : ''}</div>
                        </div>
                        <Link to={`/studio/${w.id}`} className="text-xs text-brand-2 hover:underline">Edit</Link>
                        {linked ? <Button size="sm" variant="secondary" onClick={() => bAct((s, c) => E.linkWebsite(s, c, b.id, null))}>Unlink</Button>
                          : <Button size="sm" onClick={() => bAct((s, c) => E.linkWebsite(s, c, b.id, w.id))}>Link</Button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          <Card className="p-5">
            <CardTitle icon="chart">Profit history</CardTitle>
            {b.history.length ? <BarChart data={b.history.map((h) => ({ x: `Day ${h.day}`, y: h.profit }))} label={`Daily profit for ${b.name}`} />
              : <p className="text-sm text-mute py-6 text-center">No days run yet. Press “End day” to open your doors.</p>}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <CardTitle icon="info">Why these numbers?</CardTitle>
            <div className="text-[11px] uppercase tracking-wider text-brand-2 font-semibold mb-1">Visibility {bd.visibility.total}</div>
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
            <div className="text-[11px] uppercase tracking-wider text-brand-2 font-semibold mb-1">Daily fixed costs {fixed}</div>
            <Row label="Rent" value={`−${bd.dailyFixed.rent}`} />
            <Row label="Wages" value={`−${bd.dailyFixed.wages}`} />
            <Row label="Upkeep" value={`−${bd.dailyFixed.upkeep}`} />
            <Row label="Goods" value={`${Math.round(cat.goodsRate * 100)}% of revenue`} />
          </Card>

          {last && (
            <Card className="p-5">
              <CardTitle icon="file">Day {last.day} report</CardTitle>
              <Row label="Potential customers" value={last.demand} />
              <Row label="Served" value={last.customers} />
              {last.turnedAway > 0 && <Row label="Turned away" value={last.turnedAway} tone="bad" />}
              <Row label="Revenue" value={`+${fmt(last.revenue)}`} tone="good" />
              <Row label="Goods" value={`−${fmt(last.goodsCost)}`} />
              <Row label="Rent + wages + upkeep" value={`−${fmt(last.rent + last.wages + last.upkeep)}`} />
              <div className="h-px bg-line my-2" />
              <Row label="Profit" value={`${last.profit >= 0 ? '+' : ''}${fmt(last.profit)}`} tone={last.profit >= 0 ? 'good' : 'bad'} />
            </Card>
          )}

          <Card className="p-5">
            <CardTitle icon="warning">Sell business</CardTitle>
            <p className="text-sm text-mute">Get back 40% of what you invested ({fmt(b.invested)} coins).</p>
            <Button variant="danger" className="w-full mt-4" onClick={() => setConfirmSell(true)}>Sell for {fmt(resaleValue(b))} coins</Button>
          </Card>
        </div>
      </div>

      <Modal open={confirmSell} onClose={() => setConfirmSell(false)} title={`Sell ${b.name}?`}
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmSell(false)}>Keep it</Button>
          <Button variant="danger" onClick={() => { if (act((s, c) => E.sellBusiness(s, c, b.id))) navigate('/empire'); }}>Sell for {fmt(resaleValue(b))} coins</Button>
        </>}>
        This permanently removes the business, its staff and upgrades. Its history will be lost. This cannot be undone.
      </Modal>
    </>
  );
}
