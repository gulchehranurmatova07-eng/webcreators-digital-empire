import { useState } from 'react';
import { act } from '../../store/game';
import * as E from '../../engine/engine';
import { CHARACTERS, portrait, type CharacterId } from '../../engine/characters';
import { navigate } from '../../app/router';
import { CityMap } from '../../art/Scene';
import { Button, CoinIcon, Field, Logo, cx, inputCls } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

const FEATURES = [
  { icon: 'building', title: 'Run businesses', body: 'Restaurants, hotels, fashion brands and agencies.' },
  { icon: 'template', title: 'Generate websites', body: 'Instant brand demos, then a full visual editor.' },
  { icon: 'graduation', title: 'Learn real skills', body: 'HTML, CSS and entrepreneurship challenges.' },
];

export function Welcome() {
  const [step, setStep] = useState<'intro' | 'character'>('intro');
  const [character, setCharacter] = useState<CharacterId>('lisa');
  const [name, setName] = useState('Lisa');
  const [nameTouched, setNameTouched] = useState(false);
  const valid = name.trim().length >= 2 && name.trim().length <= 24;
  const ch = CHARACTERS.find((c) => c.id === character)!;

  const choose = (id: CharacterId) => {
    setCharacter(id);
    if (!nameTouched) setName(CHARACTERS.find((c) => c.id === id)!.name);
  };
  const start = () => {
    if (act((s, ctx) => E.createPlayer(s, ctx, { name, avatar: 'spark', character }))) navigate('/dashboard');
  };

  return (
    <div className="relative min-h-dvh overflow-hidden flex flex-col">
      <CityMap businesses={[]} labels={false} zoom={1.25} className="!absolute inset-0 opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/70 to-ink pointer-events-none" />
      <header className="relative px-5 py-5 flex items-center justify-between max-w-6xl w-full mx-auto"><Logo /><span className="text-[11px] text-mute">v0.2 · Early access</span></header>

      <main className="relative flex-1 grid place-items-center px-4 pb-10">
        {step === 'intro' ? (
          <div className="max-w-3xl text-center">
            <h1 className="sr-only">WEB-CREATORS: Digital Empire. Build your digital empire.</h1>
            <div className="relative mx-auto w-[min(72vw,340px)] animate-pop">
              <div className="absolute inset-6 rounded-[28%] bg-brand/40 blur-3xl animate-glow" />
              <img src="./brand/logo-640.webp" width={640} height={640} alt="Digital Empire logo by WEB-CREATORS"
                className="relative w-full h-auto rounded-[22%] shadow-[0_30px_80px_-30px_rgb(30_107_255/0.9)]" />
            </div>
            <p className="mt-6 text-sm text-soft max-w-lg mx-auto animate-rise" style={{ animationDelay: '120ms' }}>
              Choose your founder, start with 500 virtual coins and grow from one small business in Novara Bay to a digital empire.
            </p>
            <div className="mt-7 animate-rise" style={{ animationDelay: '200ms' }}>
              <Button size="lg" icon="rocket" onClick={() => setStep('character')}>Start your empire</Button>
            </div>
            <div className="mt-10 grid sm:grid-cols-3 gap-3 text-left">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="panel p-4 animate-rise" style={{ animationDelay: `${260 + i * 60}ms` }}>
                  <div className="grid place-items-center size-9 rounded-xl bg-brand/15 text-brand-2 mb-3"><Icon name={f.icon} size={18} /></div>
                  <div className="font-display font-semibold text-sm">{f.title}</div>
                  <div className="text-xs text-mute mt-1">{f.body}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl animate-pop">
            <button type="button" onClick={() => setStep('intro')} className="flex items-center gap-1 text-xs text-mute hover:text-white mb-3"><Icon name="chevron-left" size={14} /> Back</button>
            <div className="text-[11px] tracking-[0.22em] text-cyan font-semibold">SELECT YOUR FOUNDER</div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1">Who will build the empire?</h2>
            <p className="text-sm text-mute mt-1">Each founder has one special perk. You can switch later in your profile.</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5" role="radiogroup" aria-label="Founder">
              {CHARACTERS.map((c) => {
                const on = c.id === character;
                return (
                  <button key={c.id} role="radio" aria-checked={on} onClick={() => choose(c.id)}
                    className={cx('group relative overflow-hidden rounded-2xl border text-left transition', on ? 'border-cyan shadow-[0_0_0_1px_#22d3ee,0_20px_50px_-20px_#1E6BFF]' : 'border-line hover:border-line-strong')}>
                    <div className="relative aspect-[4/5]">
                      <img src={portrait(c.id)} alt="" className={cx('absolute inset-0 w-full h-full object-cover object-top transition duration-500', on ? 'scale-105' : 'grayscale-[35%] group-hover:grayscale-0')} />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                      {on && <span className="absolute top-2 right-2 grid place-items-center size-6 rounded-full bg-cyan text-ink"><Icon name="check" size={14} strokeWidth={3} /></span>}
                      <div className="absolute bottom-0 inset-x-0 p-3">
                        <div className="font-display text-lg font-semibold leading-tight">{c.name}</div>
                        <div className="text-[11px] font-semibold tracking-wide" style={{ color: c.accent }}>{c.title}</div>
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] rounded-full bg-ink/70 border border-line px-2 py-0.5 text-soft"><Icon name="zap" size={10} className="text-cyan" />{c.perkShort}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <form className="panel mt-4 p-4 sm:p-5 grid sm:grid-cols-[1fr_auto] gap-4 items-end" onSubmit={(e) => { e.preventDefault(); if (valid) start(); }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="text-sm">
                  <div className="font-display font-semibold" style={{ color: ch.accent }}>{ch.name} · {ch.title}</div>
                  <p className="text-mute text-xs mt-1">{ch.bio}</p>
                  <p className="text-soft text-xs mt-2 flex gap-1.5"><Icon name="zap" size={13} className="text-cyan shrink-0" />{ch.perk}</p>
                </div>
                <Field label="Founder name" hint={<span className="flex items-center gap-1.5"><CoinIcon size={12} /> You start with 500 virtual coins, never real money.</span>}>
                  <input className={inputCls} value={name} maxLength={24} onChange={(e) => { setName(e.target.value); setNameTouched(true); }} />
                </Field>
              </div>
              <Button type="submit" size="lg" disabled={!valid} icon="arrow">Play as {ch.name}</Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
