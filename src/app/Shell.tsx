import { useEffect, useState, type ReactNode } from 'react';
import { act, useGame, useStore } from '../store/game';
import { claimableCount, levelInfo, timeAgo, unreadCount } from '../store/selectors';
import * as E from '../engine/engine';
import { NAV } from './router';
import { Link } from './Link';
import { Button, Coins, Logo, Modal, Progress, cx, fmt } from '../ui/kit';
import { FounderPortrait } from '../ui/hud';
import { levelUpCoins } from '../engine/config';
import { Icon } from '../ui/Icon';

function isActive(route: string, path: string) {
  return route === path || route.startsWith(path + '/');
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const notes = useGame((g) => g.notifications);
  useEffect(() => {
    const t = setTimeout(() => act(E.markNotificationsRead), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="absolute right-0 top-12 z-40 w-[min(92vw,360px)] card p-2 animate-pop">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="font-display font-semibold text-sm">Notifications</div>
        <button className="text-mute hover:text-white" onClick={onClose} aria-label="Close notifications"><Icon name="x" size={16} /></button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto scroll-thin">
        {notes.length === 0 && <p className="px-3 py-8 text-center text-sm text-mute">No notifications yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className={cx('flex gap-3 px-3 py-2.5 rounded-xl', !n.read && 'bg-brand/[0.07]')}>
            <span className={cx('mt-0.5 grid place-items-center size-7 rounded-lg shrink-0',
              n.kind === 'warning' ? 'bg-warn/15 text-warn' : n.kind === 'success' ? 'bg-good/15 text-good' : n.kind === 'reward' ? 'bg-brand/15 text-brand-2' : 'bg-white/5 text-soft')}>
              <Icon name={n.kind === 'warning' ? 'warning' : n.kind === 'success' ? 'check' : n.kind === 'reward' ? 'trophy' : 'info'} size={14} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">{n.title}</div>
              <div className="text-xs text-mute">{n.body}</div>
              <div className="text-[10px] text-mute/70 mt-0.5">{timeAgo(n.ts)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HudSeg({ label, children, tone, to }: { label: string; children: React.ReactNode; tone?: 'good' | 'bad'; to?: string }) {
  const body = (
    <>
      <span className="block text-[9px] font-semibold tracking-[0.16em] uppercase text-mute">{label}</span>
      <span className={cx('block font-display text-[15px] font-semibold tabular-nums leading-tight mt-0.5', tone === 'good' && 'text-good', tone === 'bad' && 'text-bad')}>{children}</span>
    </>
  );
  const cls = 'hud-seg shrink-0 bg-navy-2/80 border-y border-cyan/20 pl-4 pr-5 lg:pl-5 lg:pr-6 py-1.5 min-w-[74px] lg:min-w-[104px]';
  return to ? <Link to={to} className={cx(cls, 'hover:bg-brand/20 transition')}>{body}</Link> : <div className={cls}>{body}</div>;
}

function useEmpireDay() {
  return useGame((g) => {
    let income = 0, expenses = 0, rep = 0;
    for (const b of g.businesses) {
      const last = b.history[b.history.length - 1];
      if (last && last.day === g.day - 1) { income += last.revenue; expenses += last.revenue - last.profit; }
      rep += b.reputation;
    }
    return `${income}|${expenses}|${g.businesses.length ? Math.round(rep / g.businesses.length) : 0}`;
  });
}

function TopBar() {
  const g = useGame((x) => x);
  const [open, setOpen] = useState(false);
  const unread = unreadCount(g);
  const li = levelInfo(g.xp);
  const [income, expenses, rep] = useEmpireDay().split('|').map(Number);
  const profit = income - expenses;
  const hasDay = g.stats.daysRun > 0 && g.businesses.length > 0;
  const endDay = (
    <button onClick={() => act(E.endDay)} disabled={g.businesses.length === 0}
      className="hud-seg shrink-0 flex items-center gap-2 h-full px-5 lg:px-6 ml-auto lg:ml-0 bg-brand text-white font-display font-semibold text-sm hover:bg-[#2f78ff] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[0_0_24px_-4px_#1E6BFF]"
      title={g.businesses.length === 0 ? 'Open a business first' : 'Simulate the next day for all businesses'}>
      <Icon name="sun" size={16} /> End day {g.day}
    </button>
  );
  return (
    <header className="sticky top-0 z-30 bg-ink/90 backdrop-blur-md border-b border-cyan/15">
      <div className="flex items-center gap-2 h-16 px-3 lg:px-6">
        <div className="lg:hidden"><Link to="/dashboard" aria-label="Dashboard"><Logo /></Link></div>
        <div className="hidden lg:flex items-stretch h-11 -space-x-1.5 min-w-0 overflow-x-auto">
          <HudSeg label="Wallet" to="/wallet"><Coins value={g.coins} /></HudSeg>
          <HudSeg label="Income">{hasDay ? `+${fmt(income)}` : '—'}</HudSeg>
          <HudSeg label="Expenses">{hasDay ? `−${fmt(expenses)}` : '—'}</HudSeg>
          <HudSeg label="Profit" tone={hasDay ? (profit >= 0 ? 'good' : 'bad') : undefined}>{hasDay ? `${profit >= 0 ? '+' : '−'}${fmt(Math.abs(profit))}` : '—'}</HudSeg>
          <HudSeg label="Reputation">{g.businesses.length ? `★ ${rep}` : '—'}</HudSeg>
          <HudSeg label={`Level ${li.level}`} to="/profile">
            <span className="flex items-center gap-2"><span className="text-sm">{fmt(g.xp)} XP</span><Progress value={li.into} max={li.needed} className="h-1 w-14" label="Level progress" /></span>
          </HudSeg>
          {endDay}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/wallet" className="lg:hidden flex items-center gap-2 h-9 px-3 rounded-xl bg-white/[0.04] border border-line text-sm font-semibold" aria-label={`Wallet: ${g.coins} virtual coins`}>
            <Coins value={g.coins} />
          </Link>
          <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="relative grid place-items-center size-9 rounded-xl bg-white/[0.04] border border-line hover:border-line-strong transition" aria-label={`Notifications (${unread} unread)`} aria-expanded={open}>
              <Icon name="bell" size={16} />
              {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-brand text-[10px] font-bold grid place-items-center">{unread > 9 ? '9+' : unread}</span>}
            </button>
            {open && <NotificationsPanel onClose={() => setOpen(false)} />}
          </div>
          <Link to="/profile" className="lg:hidden" aria-label="Profile"><FounderPortrait size={36} /></Link>
        </div>
      </div>
      {/* Mobile HUD strip */}
      <div className="lg:hidden flex items-stretch h-11 -space-x-1.5 overflow-x-auto px-1 pb-1 scroll-thin">
        <HudSeg label="Day">{g.day}</HudSeg>
        <HudSeg label="Profit" tone={hasDay ? (profit >= 0 ? 'good' : 'bad') : undefined}>{hasDay ? `${profit >= 0 ? '+' : '−'}${fmt(Math.abs(profit))}` : '—'}</HudSeg>
        <HudSeg label="Rep.">{g.businesses.length ? `★ ${rep}` : '—'}</HudSeg>
        {endDay}
      </div>
    </header>
  );
}

function Sidebar({ route }: { route: string }) {
  const g = useGame((x) => x);
  const li = levelInfo(g.xp);
  const claimable = claimableCount(g);
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-line bg-navy/60 z-20">
      <div className="h-16 flex items-center px-6 border-b border-line"><Link to="/dashboard" aria-label="Dashboard"><Logo /></Link></div>
      <nav className="flex-1 p-3 space-y-1" aria-label="Main">
        {NAV.map((n) => (
          <Link key={n.path} to={n.path}
            className={cx('group flex items-center gap-3 h-11 px-3 rounded-xl text-sm transition',
              isActive(route, n.path) ? 'bg-brand/15 text-white shadow-[inset_0_0_0_1px_rgb(30_107_255/0.35)]' : 'text-mute hover:text-white hover:bg-white/[0.04]')}
            aria-current={isActive(route, n.path) ? 'page' : undefined}>
            <Icon name={n.icon} size={18} className={isActive(route, n.path) ? 'text-brand-2' : ''} />
            {n.label}
            {n.path === '/missions' && claimable > 0 && <span className="ml-auto text-[10px] font-bold bg-brand rounded-full px-1.5 py-0.5">{claimable}</span>}
          </Link>
        ))}
        <div className="pt-4 mt-4 border-t border-line space-y-1">
          {[{ path: '/wallet', label: 'Wallet', icon: 'wallet' }, { path: '/profile', label: 'Profile', icon: 'user' }, { path: '/settings', label: 'Settings', icon: 'settings' }].map((n) => (
            <Link key={n.path} to={n.path} aria-current={isActive(route, n.path) ? 'page' : undefined}
              className={cx('flex items-center gap-3 h-10 px-3 rounded-xl text-sm transition', isActive(route, n.path) ? 'bg-brand/15 text-white' : 'text-mute hover:text-white hover:bg-white/[0.04]')}>
              <Icon name={n.icon} size={17} />{n.label}
            </Link>
          ))}
        </div>
      </nav>
      <Link to="/profile" className="m-3 p-3 rounded-2xl border border-line bg-ink/40 hover:border-line-strong transition flex items-center gap-3">
        <FounderPortrait size={38} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{g.player!.name}</div>
          <div className="text-[11px] text-mute truncate">{li.rank} · Lv {li.level}</div>
          <Progress value={li.into} max={li.needed} className="h-1 mt-1.5" label="Level progress" />
        </div>
      </Link>
    </aside>
  );
}

function BottomNav({ route }: { route: string }) {
  const claimable = useGame(claimableCount);
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-ink/92 backdrop-blur-md border-t border-line pb-safe" aria-label="Main">
      <div className="grid grid-cols-5 h-16">
        {NAV.map((n) => {
          const active = isActive(route, n.path);
          return (
            <Link key={n.path} to={n.path} aria-current={active ? 'page' : undefined}
              className={cx('relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition', active ? 'text-white' : 'text-mute')}>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand shadow-[0_0_12px_#1E6BFF]" />}
              <Icon name={n.icon} size={20} className={active ? 'text-brand-2' : ''} />
              {n.short}
              {n.path === '/missions' && claimable > 0 && <span className="absolute top-2 right-[calc(50%-18px)] size-2 rounded-full bg-brand ring-2 ring-ink" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), t.kind === 'error' ? 4500 : 3000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);
  return (
    <div className="fixed z-[60] inset-x-0 bottom-[76px] lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 flex flex-col items-center lg:items-stretch gap-2 px-4 lg:px-0 pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="status"
          className={cx('pointer-events-auto flex items-center gap-3 max-w-md w-full sm:w-auto rounded-xl lg:rounded-2xl px-3 py-2 lg:px-4 lg:py-3 border shadow-2xl animate-pop',
            t.kind === 'error' ? 'bg-[#2a0f16] border-bad/40' : t.kind === 'reward' ? 'bg-[#0b1d36] border-brand/50' : 'bg-navy-2 border-line-strong')}>
          <span className={cx('grid place-items-center size-7 lg:size-8 rounded-xl shrink-0', t.kind === 'error' ? 'bg-bad/20 text-bad' : t.kind === 'reward' ? 'bg-brand/25 text-brand-2' : 'bg-white/5 text-soft')}>
            <Icon name={t.kind === 'error' ? 'warning' : t.kind === 'reward' ? 'sparkles' : 'info'} size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{t.title}</div>
            {t.body && <div className="text-xs text-mute truncate">{t.body}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="ml-auto text-mute hover:text-white" aria-label="Dismiss"><Icon name="x" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function LevelUpModal() {
  const level = useStore((s) => s.levelUp);
  const close = useStore((s) => s.dismissLevelUp);
  if (!level) return null;
  const li = levelInfo(useStore.getState().game.xp);
  return (
    <Modal open onClose={close} title="Level up!" footer={<Button onClick={close} icon="arrow">Keep building</Button>}>
      <div className="text-center py-4">
        <div className="relative mx-auto size-24 mb-4">
          <div className="absolute inset-0 rounded-full bg-brand/40 blur-2xl animate-glow" />
          <div className="relative grid place-items-center size-24 rounded-full border-2 border-brand bg-navy-2 font-display text-4xl font-bold">{level}</div>
        </div>
        <div className="font-display text-xl font-semibold text-white">Founder Level {level}</div>
        <div className="text-brand-2 text-sm mt-1">{li.rank}</div>
        <p className="mt-3 text-mute">You received a {levelUpCoins(level)} coin bonus. New templates, businesses and campaigns may now be unlocked.</p>
      </div>
    </Modal>
  );
}

export function Shell({ route, children }: { route: string; children: ReactNode }) {
  const reduced = useGame((g) => g.settings.reducedMotion);
  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', reduced); }, [reduced]);
  return (
    <div className="min-h-dvh">
      <Sidebar route={route} />
      <div className="lg:pl-64">
        <TopBar />
        <main className="px-4 lg:px-8 pt-6 pb-28 lg:pb-12 max-w-[1480px] mx-auto">{children}</main>
      </div>
      <BottomNav route={route} />
      <Toasts />
      <LevelUpModal />
    </div>
  );
}

