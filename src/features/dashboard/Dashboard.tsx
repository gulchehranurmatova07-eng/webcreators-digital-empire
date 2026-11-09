import { useMemo } from 'react';
import { act, useGame } from '../../store/game';
import { levelInfo, missionClaimable } from '../../store/selectors';
import { celestiaAdvice } from '../../store/advisor';
import * as E from '../../engine/engine';
import { ACHIEVEMENTS, DAILIES, MISSIONS, dailyKey, isComplete } from '../../engine/missions';
import { CATEGORIES, levelFromXp } from '../../engine/config';
import { characterById } from '../../engine/characters';
import { qualityScore } from '../../engine/website';
import { navigate } from '../../app/router';
import { Link } from '../../app/Link';
import { CityMap } from '../../art/Scene';
import { Badge, BarChart, Button, Coins, Progress, cx, fmt } from '../../ui/kit';
import { FounderPortrait, HexStat, Meter, Panel } from '../../ui/hud';
import { Icon } from '../../ui/Icon';

export function Dashboard() {
  const g = useGame((x) => x);
  const li = levelInfo(g.xp);
  const ch = characterById(g.player!.character);
  const advice = celestiaAdvice(g);
  const active = MISSIONS.filter((m) => !g.claimed[`mission:${m.id}`]).slice(0, 4);
  const dailyDone = DAILIES.filter((d) => g.claimed[dailyKey(g.daily.date, d.id)]).length;
  const level = levelFromXp(g.xp);

  const markers = useMemo(() => g.businesses.map((b) => ({
    id: b.id, location: b.location, color: b.color, level: b.upgrades.length + b.staff, name: b.name, icon: <Icon name={b.icon} size={16} />,
  })), [g.businesses]);

  const byDay = new Map<number, number>();
  g.businesses.forEach((b) => b.history.forEach((h) => byDay.set(h.day, (byDay.get(h.day) ?? 0) + h.profit)));
  const chart = [...byDay.entries()].sort((a, b) => a[0] - b[0]).slice(-14).map(([d, y]) => ({ x: `Day ${d}`, y }));

  const avg = (f: (b: (typeof g.businesses)[number]) => number) => (g.businesses.length ? g.businesses.reduce((s, b) => s + f(b), 0) / g.businesses.length : 0);
  const rep = avg((b) => b.reputation);
  const sat = avg((b) => b.satisfaction);
  const bestSite = Math.max(0, ...g.websites.map(qualityScore));
  const last2 = chart.slice(-2);
  const profitTrend = last2.length === 2 ? Math.sign(last2[1].y - last2[0].y) : 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[262px_minmax(0,1fr)_292px] items-start">
      {/* ---------- Center: city ---------- */}
      <div className="space-y-4 xl:col-start-2 xl:row-start-1 min-w-0">
        <Panel title="Novara Bay · Live" icon="globe" bodyClass="p-0"
          action={<span className="flex items-center gap-1.5 text-[11px] text-mute"><span className="size-1.5 rounded-full bg-good animate-glow" />Day {g.day}</span>}>
          <div className="relative">
            <CityMap businesses={markers} onSelect={(id) => navigate(`/empire/${id}`)} className="h-[340px] sm:h-[480px] rounded-b-[14px]" zoom={1.35} />
            {g.businesses.length === 0 ? (
              <div className="absolute inset-x-3 bottom-3 panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1"><div className="font-display font-semibold">Your lot is waiting</div><p className="text-xs text-mute">Open a business and it appears on the map. Tap it any time to step inside.</p></div>
                <Button icon="plus" onClick={() => navigate('/empire/new')}>Open a business</Button>
              </div>
            ) : (
              <div className="absolute inset-x-2 bottom-2 flex gap-2 overflow-x-auto scroll-thin pb-1">
                {g.businesses.map((b) => (
                  <Link key={b.id} to={`/empire/${b.id}`} className="shrink-0 flex items-center gap-2.5 rounded-xl bg-ink/85 border border-line hover:border-cyan/60 px-3 py-2 transition min-w-[190px]">
                    <span className="grid place-items-center size-8 rounded-lg" style={{ background: `${b.color}26`, color: b.color }}><Icon name={b.icon} size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{b.name}</div>
                      <div className="flex items-center gap-1.5 mt-1"><Progress value={b.reputation} max={100} className="h-1 flex-1" label="Reputation" /><span className="text-[10px] text-mute tabular-nums">★{Math.round(b.reputation)}</span></div>
                    </div>
                  </Link>
                ))}
                <button onClick={() => navigate('/empire/new')} className="shrink-0 grid place-items-center w-11 rounded-xl bg-ink/85 border border-dashed border-line-strong text-mute hover:text-white" aria-label="Open another business"><Icon name="plus" size={16} /></button>
              </div>
            )}
          </div>
        </Panel>

        <Panel className="border-brand/30" bodyClass="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-cyan/30 blur-md animate-glow" />
              <div className="relative grid place-items-center size-12 rounded-full bg-gradient-to-br from-cyan to-brand"><Icon name="sparkles" size={22} /></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] tracking-[0.2em] text-cyan font-semibold">CELESTIA · BUSINESS COMPANION</div>
              <div className="font-display font-semibold mt-0.5">{advice.title}</div>
              <p className="text-sm text-mute mt-0.5">{advice.body}</p>
            </div>
            <Button onClick={() => navigate(advice.route)} icon="arrow" className="shrink-0">{advice.action}</Button>
          </div>
        </Panel>

        <Panel title="Active missions" icon="target" action={<Link to="/missions" className="text-[11px] text-brand-2 hover:underline">All missions</Link>}>
          <div className="grid sm:grid-cols-2 gap-2">
            {active.map((m) => {
              const p = m.progress(g);
              const ready = missionClaimable(g, m.id);
              return (
                <div key={m.id} className={cx('flex items-center gap-3 p-3 rounded-xl border bg-ink/50', ready ? 'border-cyan/60 shadow-[0_0_24px_-12px_#22d3ee]' : 'border-line')}>
                  <span className="font-display text-xs font-bold text-cyan w-6 shrink-0">{m.code}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                    <div className="flex items-center gap-2 mt-1.5"><Progress value={p.current} max={p.target} className="h-1 flex-1" label={m.title} /><span className="text-[10px] text-mute tabular-nums">{fmt(p.current)}/{fmt(p.target)}</span></div>
                  </div>
                  {ready ? <Button size="sm" icon="trophy" onClick={() => act((s, c) => E.claimMission(s, c, m.id))}>Claim</Button>
                    : <button onClick={() => navigate(m.route)} className="text-mute hover:text-white" aria-label={`Go to ${m.title}`}><Icon name="chevron-right" size={16} /></button>}
                </div>
              );
            })}
            {active.length === 0 && <p className="text-sm text-mute">Every story mission is complete.</p>}
          </div>
        </Panel>
      </div>

      {/* ---------- Left: founder & empire ---------- */}
      <div className="space-y-4 xl:col-start-1 xl:row-start-1">
        <Panel bodyClass="p-0">
          <Link to="/profile" className="block relative overflow-hidden rounded-[14px]">
            <div className="flex items-center gap-4 p-4">
              <FounderPortrait size={76} />
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.2em] text-cyan font-semibold">FOUNDER</div>
                <div className="font-display text-xl font-semibold truncate">{g.player!.name}</div>
                <div className="text-xs text-mute">{li.rank} · Level {li.level}</div>
                {ch && <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] rounded-full bg-ink/70 border border-line px-2 py-0.5 text-soft"><Icon name="zap" size={10} className="text-cyan" />{ch.perkShort}</div>}
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex justify-between text-[11px] mb-1"><span className="text-mute">XP</span><span className="tabular-nums">{fmt(g.xp)} / {fmt(li.nextAt)}</span></div>
              <Progress value={li.into} max={li.needed} label="Level progress" />
            </div>
          </Link>
        </Panel>

        <Panel title="Empire status" icon="chart">
          <div className="grid grid-cols-2 gap-x-2 gap-y-4">
            <HexStat label="Reputation" value={g.businesses.length ? Math.round(rep) : '—'} score={rep} size={74} />
            <HexStat label="Satisfaction" value={g.businesses.length ? Math.round(sat) : '—'} score={sat} size={74} />
            <HexStat label="Best site" value={bestSite || '—'} score={bestSite} size={74} />
            <HexStat label="Founder lv" value={level} score={Math.min(100, level * 12)} size={74} />
          </div>
        </Panel>

        <Panel title="Profit trend" icon="trending" action={chart.length ? <span className={cx('text-xs font-semibold tabular-nums', chart[chart.length - 1].y >= 0 ? 'text-good' : 'text-bad')}>{chart[chart.length - 1].y >= 0 ? '+' : ''}{fmt(chart[chart.length - 1].y)}{profitTrend > 0 ? ' ▲' : profitTrend < 0 ? ' ▼' : ''}</span> : null}>
          {chart.length ? <BarChart data={chart} label="Daily profit across all businesses" height={84} /> : <p className="text-xs text-mute py-4 text-center">Run a day to see your profit history.</p>}
          <div className="mt-3 pt-3 border-t border-line space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-mute">Wallet</span><Coins value={g.coins} /></div>
            <div className="flex justify-between"><span className="text-mute">Customers served</span><span className="tabular-nums">{fmt(g.stats.customersServed)}</span></div>
            <div className="flex justify-between"><span className="text-mute">Total revenue</span><span className="tabular-nums">{fmt(g.stats.revenueEarned)}</span></div>
          </div>
        </Panel>
      </div>

      {/* ---------- Right: progress ---------- */}
      <div className="space-y-4 xl:col-start-3 xl:row-start-1">
        <Panel title="Daily operations" icon="calendar" action={<Badge tone={dailyDone === DAILIES.length ? 'good' : 'blue'}>{dailyDone}/{DAILIES.length}</Badge>}>
          <div className="space-y-3">
            {DAILIES.map((d) => {
              const p = d.progress(g);
              const claimed = !!g.claimed[dailyKey(g.daily.date, d.id)];
              const ready = !claimed && isComplete(p);
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <Meter score={(p.current / p.target) * 100} color={claimed ? '#22c3a6' : '#22d3ee'} />
                  <span className={cx('flex-1 text-sm', claimed && 'text-mute line-through')}>{d.title}</span>
                  {ready ? <Button size="sm" onClick={() => act((s, c) => E.claimDaily(s, c, d.id))}>Claim</Button>
                    : claimed ? <Icon name="check" size={16} className="text-good" /> : <span className="text-[11px] text-mute tabular-nums">{p.current}/{p.target}</span>}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-mute mt-4">Resets at midnight · streak {g.streak.count} day{g.streak.count === 1 ? '' : 's'}</p>
        </Panel>

        <Panel title="Businesses" icon="building" action={<Link to="/empire" className="text-[11px] text-brand-2 hover:underline">Manage</Link>}>
          {g.businesses.length === 0 ? <p className="text-sm text-mute">No businesses yet.</p> : (
            <ul className="space-y-2.5">
              {g.businesses.map((b) => {
                const last = b.history[b.history.length - 1];
                return (
                  <li key={b.id}>
                    <Link to={`/empire/${b.id}`} className="flex items-center gap-3 group">
                      <span className="size-2 rounded-full shrink-0" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                      <span className="flex-1 min-w-0"><span className="block text-sm truncate group-hover:text-white">{b.name}</span><span className="block text-[10px] text-mute">{CATEGORIES[b.category].name}</span></span>
                      {last && <span className={cx('text-xs font-semibold tabular-nums', last.profit >= 0 ? 'text-good' : 'text-bad')}>{last.profit >= 0 ? '+' : ''}{fmt(last.profit)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Achievements" icon="trophy" action={<Link to="/profile" className="text-[11px] text-brand-2 hover:underline">{ACHIEVEMENTS.filter((a) => g.claimed[`ach:${a.id}`]).length}/{ACHIEVEMENTS.length}</Link>}>
          <div className="grid grid-cols-5 gap-2">
            {ACHIEVEMENTS.slice(0, 10).map((a) => {
              const has = !!g.claimed[`ach:${a.id}`];
              return (
                <div key={a.id} title={`${a.title} — ${a.description}`} className={cx('grid place-items-center aspect-square rounded-lg border', has ? 'border-cyan/50 bg-cyan/10 text-cyan shadow-[0_0_14px_-6px_#22d3ee]' : 'border-line text-mute/40')}>
                  <Icon name={has ? a.icon : 'lock'} size={15} />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Activity" icon="bell">
          <ul className="space-y-3">
            {g.notifications.slice(0, 4).map((n) => (
              <li key={n.id} className="text-sm border-l-2 border-cyan/40 pl-3"><div className="font-medium">{n.title}</div><div className="text-xs text-mute">{n.body}</div></li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
