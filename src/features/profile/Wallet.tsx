import { useState } from 'react';
import { useGame } from '../../store/game';
import { Card, CoinIcon, EmptyState, PageHeader, Segmented, cx, fmt } from '../../ui/kit';
import { Icon } from '../../ui/Icon';
import { timeAgo } from '../../store/selectors';

export function Wallet() {
  const g = useGame((x) => x);
  const [filter, setFilter] = useState<'all' | 'coins' | 'xp'>('all');
  const list = g.ledger.filter((t) => filter === 'all' || t.currency === filter);
  const earned = g.ledger.filter((t) => t.currency === 'coins' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = g.ledger.filter((t) => t.currency === 'coins' && t.amount < 0).reduce((s, t) => s - t.amount, 0);

  return (
    <>
      <PageHeader eyebrow="Virtual wallet" title="Wallet & transactions" subtitle="Coins are a virtual in-game currency. They cannot be bought, sold or exchanged for real money." />
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <Card className="p-5 relative overflow-hidden"><div className="absolute -right-10 -top-10 size-32 rounded-full bg-brand/30 blur-2xl" />
          <div className="relative text-xs text-mute">Balance</div><div className="relative flex items-center gap-2 font-display text-3xl font-semibold mt-1"><CoinIcon size={26} />{fmt(g.coins)}</div></Card>
        <Card className="p-5"><div className="text-xs text-mute">Earned (recent history)</div><div className="font-display text-2xl font-semibold mt-1 text-good">+{fmt(earned)}</div></Card>
        <Card className="p-5"><div className="text-xs text-mute">Spent (recent history)</div><div className="font-display text-2xl font-semibold mt-1">−{fmt(spent)}</div></Card>
      </div>
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display font-semibold">History</h2>
          <Segmented label="Filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'coins', label: 'Coins' }, { value: 'xp', label: 'XP' }]} />
        </div>
        {list.length === 0 ? <EmptyState icon="wallet" title="No transactions" body="Your coin and XP history will appear here." /> : (
          <ul className="divide-y divide-line">
            {list.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span className={cx('grid place-items-center size-9 rounded-xl shrink-0', t.currency === 'xp' ? 'bg-brand/15 text-brand-2' : t.amount >= 0 ? 'bg-good/15 text-good' : 'bg-white/5 text-soft')}>
                  {t.currency === 'xp' ? <Icon name="zap" size={15} /> : <CoinIcon size={16} />}
                </span>
                <div className="flex-1 min-w-0"><div className="text-sm truncate">{t.label}</div><div className="text-[11px] text-mute">{timeAgo(t.ts)}</div></div>
                <div className={cx('text-sm font-semibold tabular-nums', t.amount >= 0 ? 'text-good' : 'text-soft')}>{t.amount >= 0 ? '+' : '−'}{fmt(Math.abs(t.amount))} {t.currency === 'xp' ? 'XP' : ''}</div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-mute mt-4">The latest 250 transactions are kept.</p>
      </Card>
    </>
  );
}
