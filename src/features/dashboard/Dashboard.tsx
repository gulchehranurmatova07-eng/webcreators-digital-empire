import { act, useGame } from '../../store/game';
import { levelInfo, missionClaimable } from '../../store/selectors';
import { celestiaAdvice } from '../../store/advisor';
import * as E from '../../engine/engine';
import { ACHIEVEMENTS, DAILIES, MISSIONS, dailyKey, isComplete } from '../../engine/missions';
import { CATEGORIES } from '../../engine/config';
import { navigate } from '../../app/router';
import { Link } from '../../app/Link';
import { Avatar, Badge, BarChart, Button, Card, CardTitle, Coins, EmptyState, Progress, Stat, cx, fmt } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

export function Dashboard() {
  const g = useGame((x) => x);
  const li = levelInfo(g.xp);
  const advice = celestiaAdvice(g);
  const active = MISSIONS.filter((m) => !g.claimed[`mission:${m.id}`]).slice(0, 4);
  const unlocked = ACHIEVEMENTS.filter((a) => g.claimed[`ach:${a.id}`]);
  const dailyDone = DAILIES.filter((d) => g.claimed[dailyKey(g.daily.date, d.id)]).length;

  // Empire-wide profit per day from real business history.
  const byDay = new Map<number, number>();
  g.businesses.forEach((b) => b.history.forEach((h) => byDay.set(h.day, (byDay.get(h.day) ?? 0) + h.profit)));
  const chart = [...byDay.entries()].sort((a, b) => a[0] - b[0]).slice(-14).map(([d, y]) => ({ x: `Day ${d}`, y }));
  const lastDay = chart[chart.length - 1];

  return (
    <div className="space-y-5">
      {/* Founder hero */}
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-brand/25 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar name={g.player!.avatar} size={64} />
            <div className="min-w-0">
              <div className="text-xs text-mute">Welcome back, founder</div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight truncate">{g.player!.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge>Founder Level {li.level}</Badge>
                <Badge tone="mute">{li.rank}</Badge>
                {g.streak.count > 0 && <Badge tone="warn"><Icon name="flame" size={11} /> {g.streak.count}-day streak</Badge>}
              </div>
            </div>
          </div>
          <div className="md:w-72">
            <div className="flex justify-between text-xs mb-1.5"><span className="text-mute">Experience</span><span className="tabular-nums"><b className="text-white">{fmt(g.xp)}</b><span className="text-mute"> / {fmt(li.nextAt)} XP</span></span></div>
            <Progress value={li.into} max={li.needed} label="Level progress" />
            <div className="text-[11px] text-mute mt-1.5">{li.max ? 'Max level reached' : `${fmt(li.needed - li.into)} XP to Level ${li.level + 1}`}</div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/wallet" className="block card-hover rounded-[1.25rem]"><Stat icon="wallet" label="Virtual wallet" value={<Coins value={g.coins} />} sub="View transactions →" /></Link>
        <Stat icon="building" label="Businesses" value={g.businesses.length} sub={`${fmt(g.stats.customersServed)} customers served`} />
        <Stat icon="template" label="Websites" value={g.websites.length} sub={`${g.websites.filter((w) => w.published).length} published`} />
        <Stat icon="trending" label="Total revenue" value={fmt(g.stats.revenueEarned)} sub={lastDay ? `${lastDay.x}: ${lastDay.y >= 0 ? '+' : ''}${fmt(lastDay.y)} profit` : 'No days run yet'} tone={lastDay && lastDay.y < 0 ? 'bad' : undefined} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Celestia */}
          <Card className="p-5 relative overflow-hidden border-brand/30">
            <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-transparent pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-brand-2/40 blur-md animate-glow" />
                <div className="relative grid place-items-center size-12 rounded-full bg-gradient-to-br from-brand-2 to-brand"><Icon name="sparkles" size={22} /></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] tracking-[0.2em] text-brand-2 font-semibold">CELESTIA · BUSINESS COMPANION</div>
                <div className="font-display font-semibold mt-0.5">{advice.title}</div>
                <p className="text-sm text-mute mt-0.5">{advice.body}</p>
              </div>
              <Button onClick={() => navigate(advice.route)} icon="arrow" className="shrink-0">{advice.action}</Button>
            </div>
          </Card>

          {/* Empire performance */}
          <Card className="p-5">
            <CardTitle icon="chart" action={g.businesses.length > 0 && <Button size="sm" icon="sun" onClick={() => act(E.endDay)}>End day {g.day}</Button>}>Empire performance</CardTitle>
            {g.businesses.length === 0 ? (
              <EmptyState icon="building" title="No businesses yet" body="Open your first business to start earning. Each day you run, customers visit based on your visibility, website and reputation."
                action={<Button icon="plus" onClick={() => navigate('/empire/new')}>Open a business</Button>} />
            ) : (
              <>
                {chart.length > 0 ? <BarChart data={chart} label="Daily profit across all businesses" /> : (
                  <p className="text-sm text-mute py-6 text-center">Run your first day to see profit history here.</p>
                )}
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {g.businesses.map((b) => {
                    const last = b.history[b.history.length - 1];
                    return (
                      <Link key={b.id} to={`/empire/${b.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-line hover:border-line-strong bg-ink/40 transition">
                        <span className="grid place-items-center size-9 rounded-xl" style={{ background: `${b.color}22`, color: b.color }}><Icon name={b.icon} size={17} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{b.name}</div>
                          <div className="text-[11px] text-mute">{CATEGORIES[b.category].name} · ★ {Math.round(b.reputation)}</div>
                        </div>
                        {last && <span className={cx('text-sm font-semibold tabular-nums', last.profit >= 0 ? 'text-good' : 'text-bad')}>{last.profit >= 0 ? '+' : ''}{fmt(last.profit)}</span>}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {/* Missions */}
          <Card className="p-5">
            <CardTitle icon="target" action={<Link to="/missions" className="text-xs text-brand-2 hover:underline">All missions</Link>}>Active missions</CardTitle>
            <div className="space-y-2">
              {active.map((m) => {
                const p = m.progress(g);
                const ready = missionClaimable(g, m.id);
                return (
                  <div key={m.id} className={cx('flex items-center gap-3 p-3 rounded-xl border bg-ink/40', ready ? 'border-brand/50' : 'border-line')}>
                    <span className="font-display text-xs font-bold text-brand-2 w-7 shrink-0">{m.code}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.title}</div>
                      <div className="flex items-center gap-2 mt-1.5"><Progress value={p.current} max={p.target} className="h-1.5 flex-1" label={m.title} /><span className="text-[11px] text-mute tabular-nums">{fmt(p.current)}/{fmt(p.target)}</span></div>
                    </div>
                    {ready
                      ? <Button size="sm" icon="trophy" onClick={() => act((s, c) => E.claimMission(s, c, m.id))}>Claim</Button>
                      : <Button size="sm" variant="ghost" onClick={() => navigate(m.route)} aria-label={`Go to ${m.title}`}><Icon name="chevron-right" size={16} /></Button>}
                  </div>
                );
              })}
              {active.length === 0 && <p className="text-sm text-mute">All missions complete. Legendary.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          {/* Daily */}
          <Card className="p-5">
            <CardTitle icon="calendar" action={<Badge tone={dailyDone === DAILIES.length ? 'good' : 'blue'}>{dailyDone}/{DAILIES.length}</Badge>}>Daily progress</CardTitle>
            <div className="space-y-3">
              {DAILIES.map((d) => {
                const p = d.progress(g);
                const claimed = !!g.claimed[dailyKey(g.daily.date, d.id)];
                const ready = !claimed && isComplete(p);
                return (
                  <div key={d.id}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className={cx('truncate', claimed && 'text-mute line-through')}>{d.title}</span>
                      {ready ? <Button size="sm" onClick={() => act((s, c) => E.claimDaily(s, c, d.id))}>Claim</Button>
                        : claimed ? <Icon name="check" size={16} className="text-good" />
                          : <span className="text-[11px] text-mute tabular-nums">{p.current}/{p.target}</span>}
                    </div>
                    <Progress value={p.current} max={p.target} className="h-1 mt-1.5" tone={claimed ? 'good' : 'brand'} label={d.title} />
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-mute mt-4">Resets at midnight. Missing a day never costs you anything — streaks forgive one skipped day.</p>
          </Card>

          {/* Achievements */}
          <Card className="p-5">
            <CardTitle icon="trophy" action={<Link to="/profile" className="text-xs text-brand-2 hover:underline">{unlocked.length}/{ACHIEVEMENTS.length}</Link>}>Achievements</CardTitle>
            <div className="grid grid-cols-5 gap-2">
              {ACHIEVEMENTS.slice(0, 10).map((a) => {
                const has = !!g.claimed[`ach:${a.id}`];
                return (
                  <div key={a.id} title={`${a.title} — ${a.description}`} className={cx('grid place-items-center aspect-square rounded-xl border', has ? 'border-brand/50 bg-brand/15 text-brand-2' : 'border-line text-mute/40')}>
                    <Icon name={has ? a.icon : 'lock'} size={16} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent activity */}
          <Card className="p-5">
            <CardTitle icon="bell">Recent activity</CardTitle>
            <ul className="space-y-3">
              {g.notifications.slice(0, 4).map((n) => (
                <li key={n.id} className="text-sm"><div className="font-medium">{n.title}</div><div className="text-xs text-mute">{n.body}</div></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
