import { useState } from 'react';
import { act, useGame } from '../../store/game';
import * as E from '../../engine/engine';
import { AVATARS, RANKS } from '../../engine/config';
import { ACHIEVEMENTS, MISSIONS } from '../../engine/missions';
import { levelInfo } from '../../store/selectors';
import { navigate } from '../../app/router';
import { Avatar, Badge, Button, Card, CardTitle, Coins, Field, Modal, Progress, cx, fmt, inputCls } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

export function Profile() {
  const g = useGame((x) => x);
  const li = levelInfo(g.xp);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(g.player!.name);
  const [avatar, setAvatar] = useState(g.player!.avatar);
  const unlocked = ACHIEVEMENTS.filter((a) => g.claimed[`ach:${a.id}`]);
  const completed = MISSIONS.filter((m) => g.claimed[`mission:${m.id}`]);

  const stats: [string, string, string | number][] = [
    ['building', 'Businesses owned', g.businesses.length],
    ['template', 'Websites created', g.websites.length],
    ['globe', 'Websites published', g.stats.websitesPublished],
    ['users', 'Customers served', fmt(g.stats.customersServed)],
    ['trending', 'Total revenue', fmt(g.stats.revenueEarned)],
    ['sun', 'Days run', g.stats.daysRun],
    ['graduation', 'Lessons completed', g.stats.lessonsCompleted.length],
    ['megaphone', 'Campaigns launched', g.stats.campaignsLaunched],
  ];

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-6">
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-brand/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar name={g.player!.avatar} size={88} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-semibold tracking-tight truncate">{g.player!.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2"><Badge>Founder Level {li.level}</Badge><Badge tone="mute">{li.rank}</Badge><Badge tone="mute">Founder since {new Date(g.player!.createdAt).toLocaleDateString()}</Badge></div>
            <div className="mt-4 max-w-md"><div className="flex justify-between text-xs mb-1"><span className="text-mute">{fmt(g.xp)} XP</span><span className="text-mute">{li.max ? 'Max level' : `Level ${li.level + 1} at ${fmt(li.nextAt)}`}</span></div><Progress value={li.into} max={li.needed} label="Level progress" /></div>
          </div>
          <div className="flex sm:flex-col gap-2">
            <Button variant="secondary" icon="palette" onClick={() => { setName(g.player!.name); setAvatar(g.player!.avatar); setEditing(true); }}>Edit profile</Button>
            <Button variant="ghost" icon="settings" onClick={() => navigate('/settings')}>Settings</Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <CardTitle icon="chart">Statistics</CardTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-ink/50 p-3 col-span-2 sm:col-span-1"><div className="text-[11px] text-mute">Wallet</div><div className="font-semibold mt-1"><Coins value={g.coins} /></div></div>
            {stats.slice(0, 7).map(([icon, label, v]) => (
              <div key={label} className="rounded-xl bg-ink/50 p-3"><div className="text-[11px] text-mute flex items-center gap-1.5"><Icon name={icon} size={12} />{label}</div><div className="font-semibold mt-1 tabular-nums">{v}</div></div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <CardTitle icon="crown">Founder ranks</CardTitle>
          <ol className="space-y-2">
            {RANKS.map((r) => {
              const reached = li.level >= r.level;
              const current = li.rank === r.name;
              return (
                <li key={r.name} className={cx('flex items-center gap-3 text-sm p-2 rounded-lg', current && 'bg-brand/10')}>
                  <Icon name={reached ? 'check' : 'lock'} size={14} className={reached ? 'text-good' : 'text-mute'} />
                  <span className={cx('flex-1', !reached && 'text-mute')}>{r.name}</span>
                  <span className="text-[11px] text-mute">Lv {r.level}</span>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <Card className="p-5">
        <CardTitle icon="trophy" action={<Badge>{unlocked.length}/{ACHIEVEMENTS.length}</Badge>}>Achievements</CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const has = !!g.claimed[`ach:${a.id}`];
            return (
              <div key={a.id} className={cx('flex items-center gap-3 p-3 rounded-xl border', has ? 'border-brand/40 bg-brand/[0.07]' : 'border-line bg-ink/30')}>
                <span className={cx('grid place-items-center size-10 rounded-xl shrink-0', has ? 'bg-brand/20 text-brand-2' : 'bg-white/5 text-mute/50')}><Icon name={has ? a.icon : 'lock'} size={18} /></span>
                <div className="min-w-0"><div className={cx('text-sm font-medium truncate', !has && 'text-mute')}>{a.title}</div><div className="text-[11px] text-mute">{a.description}</div></div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <CardTitle icon="target">Completed missions</CardTitle>
        {completed.length === 0 ? <p className="text-sm text-mute">No missions completed yet. <button className="text-brand-2 hover:underline" onClick={() => navigate('/missions')}>See missions</button></p> : (
          <div className="flex flex-wrap gap-2">{completed.map((m) => <Badge key={m.id} tone="good"><Icon name="check" size={10} /> {m.code} · {m.title}</Badge>)}</div>
        )}
      </Card>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit profile"
        footer={<><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button><Button disabled={name.trim().length < 2} onClick={() => { if (act((s, c) => E.updateProfile(s, c, { name, avatar }))) setEditing(false); }}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Founder name"><input className={inputCls} value={name} maxLength={24} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="grid grid-cols-8 gap-2">
            {AVATARS.map((a) => (
              <button key={a} aria-label={a} aria-pressed={avatar === a} onClick={() => setAvatar(a)} className={cx('grid place-items-center aspect-square rounded-xl border', avatar === a ? 'border-brand bg-brand/20 text-white' : 'border-line text-mute')}><Icon name={a} size={16} /></button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
