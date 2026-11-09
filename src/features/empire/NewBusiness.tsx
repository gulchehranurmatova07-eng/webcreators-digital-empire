import { useState } from 'react';
import { act, useGame, useStore } from '../../store/game';
import * as E from '../../engine/engine';
import { BRAND_COLORS, BRAND_ICONS, CATEGORIES, CATEGORY_ORDER, CITY_NAME, LOCATIONS, LOCATION_ORDER, levelFromXp } from '../../engine/config';
import type { CategoryId, LocationId } from '../../engine/types';
import { navigate } from '../../app/router';
import { Badge, Button, Card, Coins, Field, PageHeader, cx, fmt, inputCls } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

const STEPS = ['Category', 'Brand', 'Location', 'Open'];

const SUGGESTED: Record<CategoryId, string> = {
  restaurant: 'Bella Cucina', hotel: 'The Azure Harbor', clothing: 'Nord Atelier', agency: 'Pixel Forge', coffee: 'Morning Ritual', startup: 'Nimbus Labs',
};

export function NewBusiness() {
  const g = useGame((x) => x);
  const level = levelFromXp(g.xp);
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [color, setColor] = useState(BRAND_COLORS[0]);
  const [icon, setIcon] = useState('store');
  const [location, setLocation] = useState<LocationId>('oldtown');

  const cat = category ? CATEGORIES[category] : null;
  const nameOk = name.trim().length >= 2 && name.trim().length <= 28;

  const pickCategory = (id: CategoryId) => {
    setCategory(id);
    setIcon(CATEGORIES[id].icon);
    if (!name) setName(SUGGESTED[id]);
    setStep(1);
  };

  const open = () => {
    if (!category) return;
    const ok = act((s, c) => E.openBusiness(s, c, { name, tagline, category, location, color, icon }));
    if (ok) {
      const list = useStore.getState().game.businesses;
      navigate(`/empire/${list[list.length - 1].id}`);
    }
  };

  return (
    <>
      <PageHeader eyebrow="New business" title="Open a business" subtitle={`Every business needs a category, a brand and a location in ${CITY_NAME}.`}
        actions={<Button variant="ghost" icon="x" onClick={() => navigate('/empire')}>Cancel</Button>} />

      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-6 overflow-x-auto" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2 shrink-0">
            <button disabled={i > step || (i > 0 && !category)} onClick={() => setStep(i)}
              className={cx('flex items-center gap-2 h-8 pl-1 pr-3 rounded-full text-xs font-medium border transition',
                i === step ? 'border-brand bg-brand/15 text-white' : i < step ? 'border-line-strong text-soft' : 'border-line text-mute')}
              aria-current={i === step ? 'step' : undefined}>
              <span className={cx('grid place-items-center size-6 rounded-full text-[11px]', i < step ? 'bg-good/20 text-good' : i === step ? 'bg-brand text-white' : 'bg-white/5')}>{i < step ? <Icon name="check" size={12} /> : i + 1}</span>
              {s}
            </button>
            {i < STEPS.length - 1 && <span className="w-4 h-px bg-line-strong" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {CATEGORY_ORDER.map((id) => {
            const c = CATEGORIES[id];
            const locked = level < c.unlockLevel;
            const afford = g.coins >= c.setupCost;
            return (
              <button key={id} disabled={locked} onClick={() => pickCategory(id)}
                className={cx('card card-hover p-5 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none', category === id && 'border-brand')}>
                <div className="flex items-start justify-between">
                  <span className="grid place-items-center size-12 rounded-2xl bg-brand/15 text-brand-2"><Icon name={locked ? 'lock' : c.icon} size={22} /></span>
                  {locked ? <Badge tone="mute">Level {c.unlockLevel}</Badge> : <Badge tone={afford ? 'blue' : 'bad'}><Coins value={c.setupCost} /></Badge>}
                </div>
                <div className="font-display font-semibold mt-4">{c.name}</div>
                <p className="text-xs text-mute mt-1">{c.blurb}</p>
                <dl className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-lg bg-ink/50 py-1.5"><dt className="text-[10px] text-mute">Ticket</dt><dd className="text-xs font-semibold">{c.avgTicket}</dd></div>
                  <div className="rounded-lg bg-ink/50 py-1.5"><dt className="text-[10px] text-mute">Rent/day</dt><dd className="text-xs font-semibold">{c.rent}</dd></div>
                  <div className="rounded-lg bg-ink/50 py-1.5"><dt className="text-[10px] text-mute">Wage/day</dt><dd className="text-xs font-semibold">{c.wage}</dd></div>
                </dl>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && cat && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <Card className="p-5 sm:p-6 space-y-5">
            <Field label="Business name" hint="2–28 characters. Make it memorable."><input className={inputCls} value={name} maxLength={28} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Tagline (optional)" hint="A short promise to customers."><input className={inputCls} value={tagline} maxLength={60} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Fresh pasta, every day" /></Field>
            <div>
              <div className="text-xs font-medium text-soft mb-2">Brand color</div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Brand color">
                {BRAND_COLORS.map((c) => (
                  <button key={c} role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)}
                    className={cx('size-9 rounded-xl border-2 transition', color === c ? 'border-white scale-110' : 'border-transparent')} style={{ background: c }} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-soft mb-2">Logo icon</div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2" role="radiogroup" aria-label="Logo icon">
                {BRAND_ICONS.map((i) => (
                  <button key={i} role="radio" aria-checked={icon === i} aria-label={i} onClick={() => setIcon(i)}
                    className={cx('grid place-items-center aspect-square rounded-xl border transition', icon === i ? 'border-brand bg-brand/20' : 'border-line text-mute hover:text-white')}>
                    <Icon name={i} size={17} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button disabled={!nameOk} icon="arrow" onClick={() => setStep(2)}>Choose location</Button>
            </div>
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] tracking-[0.2em] text-mute mb-4">BRAND PREVIEW</div>
            <span className="grid place-items-center size-20 rounded-3xl" style={{ background: `${color}22`, color, boxShadow: `inset 0 0 0 1px ${color}66, 0 20px 40px -20px ${color}` }}><Icon name={icon} size={36} /></span>
            <div className="font-display text-xl font-semibold mt-4" style={{ color }}>{name || 'Your brand'}</div>
            <div className="text-sm text-mute mt-1">{tagline || cat.name}</div>
          </Card>
        </div>
      )}

      {step === 2 && cat && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {LOCATION_ORDER.map((id) => {
              const l = LOCATIONS[id];
              const bonus = l.bonusFor?.includes(cat.id) ? l.bonus ?? 0 : 0;
              const traffic = l.traffic + bonus;
              return (
                <button key={id} onClick={() => setLocation(id)} aria-pressed={location === id}
                  className={cx('card card-hover p-5 text-left', location === id && 'border-brand shadow-[0_0_0_1px_#1E6BFF]')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-display font-semibold"><Icon name="map" size={16} className="text-brand-2" />{l.name}</div>
                    {bonus > 0 && <Badge tone="good">+{Math.round(bonus * 100)}% for {cat.name.toLowerCase()}</Badge>}
                  </div>
                  <p className="text-xs text-mute mt-1">{l.blurb}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="rounded-lg bg-ink/50 p-2"><div className="text-[10px] text-mute">Foot traffic</div><div className={cx('text-sm font-semibold', traffic >= 1.1 ? 'text-good' : traffic < 1 ? 'text-warn' : '')}>×{traffic.toFixed(2)}</div></div>
                    <div className="rounded-lg bg-ink/50 p-2"><div className="text-[10px] text-mute">Rent per day</div><div className="text-sm font-semibold">{Math.round(cat.rent * l.rentMult)}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Back</Button><Button icon="arrow" onClick={() => setStep(3)}>Review</Button></div>
        </div>
      )}

      {step === 3 && cat && (
        <Card className="p-6 max-w-xl">
          <div className="flex items-center gap-4">
            <span className="grid place-items-center size-14 rounded-2xl" style={{ background: `${color}22`, color }}><Icon name={icon} size={26} /></span>
            <div>
              <div className="font-display text-xl font-semibold">{name}</div>
              <div className="text-sm text-mute">{cat.name} · {LOCATIONS[location].name}</div>
            </div>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-mute">Setup cost</dt><dd><Coins value={cat.setupCost} /></dd></div>
            <div className="flex justify-between"><dt className="text-mute">Daily rent</dt><dd>{Math.round(cat.rent * LOCATIONS[location].rentMult)} coins</dd></div>
            <div className="flex justify-between"><dt className="text-mute">Wage per employee</dt><dd>{cat.wage} coins/day</dd></div>
            <div className="flex justify-between"><dt className="text-mute">Founder capacity (no staff)</dt><dd>{cat.baseCapacity} {cat.customerWord}/day</dd></div>
            <div className="flex justify-between border-t border-line pt-2 mt-2"><dt className="text-mute">Your balance after opening</dt><dd className={g.coins - cat.setupCost < 0 ? 'text-bad' : ''}><Coins value={g.coins - cat.setupCost} /></dd></div>
          </dl>
          {g.coins < cat.setupCost && <p className="mt-4 text-sm text-bad">You need {fmt(cat.setupCost - g.coins)} more coins. Earn them through missions, the Academy or existing businesses.</p>}
          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button size="lg" icon="rocket" disabled={g.coins < cat.setupCost} onClick={open}>Open {name}</Button>
          </div>
        </Card>
      )}
    </>
  );
}
