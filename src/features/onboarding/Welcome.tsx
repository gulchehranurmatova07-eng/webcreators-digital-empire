import { useState } from 'react';
import { act } from '../../store/game';
import * as E from '../../engine/engine';
import { AVATARS } from '../../engine/config';
import { navigate } from '../../app/router';
import { Avatar, Button, CoinIcon, Field, Logo, cx, inputCls } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

const FEATURES = [
  { icon: 'building', title: 'Run businesses', body: 'Restaurants, hotels, fashion brands and agencies.' },
  { icon: 'template', title: 'Design websites', body: 'A visual editor with templates and live preview.' },
  { icon: 'graduation', title: 'Learn real skills', body: 'HTML, CSS and entrepreneurship challenges.' },
];

export function Welcome() {
  const [step, setStep] = useState<'intro' | 'profile'>('intro');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const valid = name.trim().length >= 2 && name.trim().length <= 24;

  const start = () => {
    if (act((s, ctx) => E.createPlayer(s, ctx, { name, avatar }))) navigate('/dashboard');
  };

  return (
    <div className="relative min-h-dvh overflow-hidden flex flex-col">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full bg-brand/20 blur-[120px] pointer-events-none" />
      <header className="relative px-6 py-5 flex items-center justify-between max-w-6xl w-full mx-auto"><Logo /><span className="text-[11px] text-mute">v0.1 · Early access</span></header>

      <main className="relative flex-1 grid place-items-center px-5 pb-10">
        {step === 'intro' ? (
          <div className="max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-navy/70 px-3 py-1 text-[11px] tracking-[0.18em] text-brand-2 font-semibold animate-rise">
              <span className="size-1.5 rounded-full bg-brand-2 animate-glow" /> WEB-CREATORS PRESENTS
            </div>
            <h1 className="sr-only">WEB-CREATORS: Digital Empire — Build your digital empire.</h1>
            <div className="relative mx-auto mt-6 w-[min(78vw,360px)] animate-pop" style={{ animationDelay: '60ms' }}>
              <div className="absolute inset-6 rounded-[28%] bg-brand/40 blur-3xl animate-glow" />
              <img src="./brand/logo-640.webp" width={640} height={640} alt="Digital Empire logo by WEB-CREATORS"
                className="relative w-full h-auto rounded-[22%] shadow-[0_30px_80px_-30px_rgb(30_107_255/0.9)]" />
            </div>
            <p className="mt-3 text-sm text-mute max-w-lg mx-auto animate-rise" style={{ animationDelay: '160ms' }}>
              Start with 500 virtual coins. Open businesses in the city of Novara Bay, design their websites, win customers and grow from beginner founder to digital tycoon.
            </p>
            <div className="mt-8 animate-rise" style={{ animationDelay: '220ms' }}>
              <Button size="lg" icon="rocket" onClick={() => setStep('profile')}>Start your empire</Button>
            </div>
            <div className="mt-12 grid sm:grid-cols-3 gap-3 text-left">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="card p-4 animate-rise" style={{ animationDelay: `${280 + i * 60}ms` }}>
                  <div className="grid place-items-center size-9 rounded-xl bg-brand/15 text-brand-2 mb-3"><Icon name={f.icon} size={18} /></div>
                  <div className="font-display font-semibold text-sm">{f.title}</div>
                  <div className="text-xs text-mute mt-1">{f.body}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form className="card w-full max-w-md p-6 sm:p-8 animate-pop" onSubmit={(e) => { e.preventDefault(); if (valid) start(); }}>
            <button type="button" onClick={() => setStep('intro')} className="flex items-center gap-1 text-xs text-mute hover:text-white mb-4"><Icon name="chevron-left" size={14} /> Back</button>
            <h2 className="font-display text-2xl font-semibold">Create your founder</h2>
            <p className="text-sm text-mute mt-1">This is how you'll appear in your empire. Saved only on this device.</p>
            <div className="flex items-center gap-4 mt-6">
              <Avatar name={avatar} size={64} />
              <div className="flex-1">
                <Field label="Founder name" hint="2–24 characters. No real name needed.">
                  <input autoFocus className={inputCls} value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nova" />
                </Field>
              </div>
            </div>
            <div className="mt-5">
              <div className="text-xs font-medium text-soft mb-2">Choose an avatar</div>
              <div className="grid grid-cols-8 gap-2" role="radiogroup" aria-label="Avatar">
                {AVATARS.map((a) => (
                  <button type="button" key={a} role="radio" aria-checked={avatar === a} aria-label={a} onClick={() => setAvatar(a)}
                    className={cx('grid place-items-center aspect-square rounded-xl border transition', avatar === a ? 'border-brand bg-brand/20 text-white' : 'border-line text-mute hover:text-white')}>
                    <Icon name={a} size={18} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-line bg-ink/50 p-3 flex items-center gap-3 text-sm">
              <CoinIcon size={22} />
              <div><span className="font-semibold">500 virtual coins</span><span className="text-mute"> — in-game only, never real money.</span></div>
            </div>
            <Button type="submit" size="lg" className="w-full mt-6" disabled={!valid} icon="arrow">Enter Novara Bay</Button>
          </form>
        )}
      </main>
    </div>
  );
}
