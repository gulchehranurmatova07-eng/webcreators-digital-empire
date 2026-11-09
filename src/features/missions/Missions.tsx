import { act, useGame } from '../../store/game';
import * as E from '../../engine/engine';
import { DAILIES, MISSIONS, STREAK_REWARDS, dailyKey, isComplete } from '../../engine/missions';
import { navigate } from '../../app/router';
import { Badge, Button, Card, CardTitle, CoinIcon, PageHeader, Progress, cx, fmt } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

function Reward({ xp, coins }: { xp: number; coins: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {xp > 0 && <Badge><Icon name="zap" size={10} /> {xp} XP</Badge>}
      {coins > 0 && <Badge><CoinIcon size={11} /> {coins}</Badge>}
    </div>
  );
}

export function Missions() {
  const g = useGame((x) => x);
  const done = MISSIONS.filter((m) => g.claimed[`mission:${m.id}`]).length;
  const nextStreak = STREAK_REWARDS.find((r) => !g.claimed[`streak:${r.days}`]);

  return (
    <>
      <PageHeader eyebrow="Progression" title="Missions" subtitle="Rewards are granted only when the goal is really achieved — and each reward can be claimed once." />
      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <Card className="p-5">
          <CardTitle icon="target" action={<Badge tone={done === MISSIONS.length ? 'good' : 'blue'}>{done}/{MISSIONS.length} complete</Badge>}>Story missions</CardTitle>
          <div className="space-y-2.5">
            {MISSIONS.map((m) => {
              const p = m.progress(g);
              const claimed = !!g.claimed[`mission:${m.id}`];
              const ready = !claimed && isComplete(p);
              return (
                <div key={m.id} className={cx('flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border transition',
                  claimed ? 'border-line bg-ink/30 opacity-70' : ready ? 'border-brand bg-brand/[0.08] shadow-[0_0_30px_-12px_#1E6BFF]' : 'border-line bg-ink/40')}>
                  <div className={cx('grid place-items-center size-11 rounded-xl font-display font-bold text-sm shrink-0', claimed ? 'bg-good/15 text-good' : 'bg-brand/15 text-brand-2')}>
                    {claimed ? <Icon name="check" size={18} /> : m.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{m.title}</span><Reward xp={m.xp} coins={m.coins} /></div>
                    <div className="text-xs text-mute mt-0.5">{m.description}</div>
                    {!claimed && <div className="flex items-center gap-2 mt-2"><Progress value={p.current} max={p.target} className="h-1.5 flex-1" label={m.title} /><span className="text-[11px] text-mute tabular-nums">{fmt(p.current)}/{fmt(p.target)}</span></div>}
                  </div>
                  {claimed ? <span className="text-xs text-good shrink-0">Claimed</span>
                    : ready ? <Button icon="trophy" onClick={() => act((s, c) => E.claimMission(s, c, m.id))} className="shrink-0">Claim reward</Button>
                      : <Button variant="secondary" size="sm" onClick={() => navigate(m.route)} className="shrink-0">Go</Button>}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <CardTitle icon="calendar">Daily missions</CardTitle>
            <div className="space-y-3">
              {DAILIES.map((d) => {
                const p = d.progress(g);
                const claimed = !!g.claimed[dailyKey(g.daily.date, d.id)];
                const ready = !claimed && isComplete(p);
                return (
                  <div key={d.id} className="p-3 rounded-xl border border-line bg-ink/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cx('text-sm', claimed && 'text-mute')}>{d.title}</span>
                      {claimed ? <Icon name="check" size={16} className="text-good" /> : ready ? <Button size="sm" onClick={() => act((s, c) => E.claimDaily(s, c, d.id))}>Claim</Button>
                        : <button className="text-xs text-brand-2 hover:underline" onClick={() => navigate(d.route)}>Go</button>}
                    </div>
                    <div className="flex items-center gap-2 mt-2"><Progress value={p.current} max={p.target} className="h-1 flex-1" tone={claimed ? 'good' : 'brand'} label={d.title} /><Reward xp={d.xp} coins={d.coins} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <CardTitle icon="flame">Streak</CardTitle>
            <div className="flex items-end gap-2"><span className="font-display text-4xl font-semibold">{g.streak.count}</span><span className="text-sm text-mute mb-1.5">day{g.streak.count === 1 ? '' : 's'} · best {g.streak.best}</span></div>
            <p className="text-xs text-mute mt-2">Play on different days to grow your streak. Missing a single day is forgiven, and nothing is ever taken away.</p>
            {nextStreak && <div className="mt-4"><div className="flex justify-between text-xs mb-1"><span className="text-mute">Next: {nextStreak.days}-day bonus</span><Reward xp={nextStreak.xp} coins={nextStreak.coins} /></div><Progress value={g.streak.count} max={nextStreak.days} tone="warn" label="Streak progress" /></div>}
          </Card>
        </div>
      </div>
    </>
  );
}
