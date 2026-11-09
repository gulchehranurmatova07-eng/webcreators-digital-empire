import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { LESSONS } from './lessons';
import { qualityScore } from './website';
import { levelFromXp } from './config';
import type { GameState } from './types';

const ctx = (now = Date.parse('2026-11-09T10:00:00')) => ({ now });

function newPlayer(): GameState {
  return E.createPlayer(E.createInitialState(), ctx(), { name: 'Ada', avatar: 'spark' }).state;
}

describe('player', () => {
  it('starts with 500 coins, 0 XP, level 1, recorded in the ledger', () => {
    const s = newPlayer();
    expect(s.coins).toBe(500);
    expect(levelFromXp(s.xp)).toBe(1);
    expect(s.ledger.some((t) => t.amount === 500 && t.currency === 'coins')).toBe(true);
    // "Day One" achievement grants a little XP
    expect(s.claimed['ach:founder']).toBeTruthy();
  });

  it('rejects invalid names', () => {
    expect(() => E.createPlayer(E.createInitialState(), ctx(), { name: ' a ', avatar: 'spark' })).toThrow();
  });
});

describe('business', () => {
  it('opens a business, charges setup cost and simulates days', () => {
    let s = newPlayer();
    s = E.openBusiness(s, ctx(), { name: 'Bella', tagline: '', category: 'restaurant', location: 'oldtown', color: '#1E6BFF', icon: 'utensils' }).state;
    expect(s.coins).toBe(200);
    expect(s.businesses).toHaveLength(1);
    const before = s.coins;
    const r = E.endDay(s, ctx());
    s = r.state;
    const rep = s.businesses[0].history[0];
    expect(rep.customers).toBeGreaterThan(0);
    expect(rep.profit).toBe(rep.revenue - rep.goodsCost - rep.rent - rep.wages - rep.upkeep);
    expect(s.coins).toBe(Math.max(0, before + rep.profit));
    expect(s.day).toBe(2);
  });

  it('refuses to open a business without enough coins', () => {
    let s = newPlayer();
    s = E.openBusiness(s, ctx(), { name: 'Grand', tagline: '', category: 'hotel', location: 'oldtown', color: '#1E6BFF', icon: 'bed' }).state;
    expect(() => E.openBusiness(s, ctx(), { name: 'Two', tagline: '', category: 'agency', location: 'oldtown', color: '#1E6BFF', icon: 'monitor' })).toThrow(/Not enough coins/);
  });

  it('never lets the wallet go negative', () => {
    let s = newPlayer();
    s = E.openBusiness(s, ctx(), { name: 'Grand', tagline: '', category: 'hotel', location: 'harbor', color: '#1E6BFF', icon: 'bed' }).state;
    s = { ...s, coins: 0 };
    for (let i = 0; i < 5; i++) {
      try { s = E.hireStaff(s, ctx(), s.businesses[0].id).state; } catch { /* no coins */ }
      s = E.endDay(s, ctx()).state;
      expect(s.coins).toBeGreaterThanOrEqual(0);
    }
  });

  it('locks categories behind founder level', () => {
    const s = newPlayer();
    expect(() => E.openBusiness(s, ctx(), { name: 'Rocket', tagline: '', category: 'startup', location: 'techquarter', color: '#1E6BFF', icon: 'rocket' })).toThrow(/Level 5/);
  });
});

describe('missions', () => {
  it('pays a mission once and only when conditions are met', () => {
    let s = newPlayer();
    expect(() => E.claimMission(s, ctx(), 'm02')).toThrow(/not met/);
    s = E.openBusiness(s, ctx(), { name: 'Bella', tagline: '', category: 'restaurant', location: 'oldtown', color: '#1E6BFF', icon: 'utensils' }).state;
    const xp = s.xp;
    s = E.claimMission(s, ctx(), 'm02').state;
    expect(s.xp).toBe(xp + 150);
    expect(() => E.claimMission(s, ctx(), 'm02')).toThrow(/already claimed/);
  });

  it('daily missions reset per day but cannot be claimed twice in a day', () => {
    let s = newPlayer();
    s = E.createWebsite(s, ctx(), { templateId: 'starter', name: 'Site' }).state;
    s = E.saveWebsite(s, ctx(), s.websites[0]).state;
    s = E.claimDaily(s, ctx(), 'edit').state;
    expect(() => E.claimDaily(s, ctx(), 'edit')).toThrow(/Already claimed/);
    const tomorrow = ctx(Date.parse('2026-11-10T10:00:00'));
    expect(() => E.claimDaily(s, tomorrow, 'edit')).toThrow(/not finished/);
    s = E.saveWebsite(s, tomorrow, s.websites[0]).state;
    expect(() => E.claimDaily(s, tomorrow, 'edit')).not.toThrow();
  });
});

describe('academy', () => {
  it('grades answers in the engine and rewards a lesson once', () => {
    let s = newPlayer();
    const lesson = LESSONS[0];
    expect(() => E.completeLesson(s, ctx(), lesson.id, [0, 0, 'nope'])).toThrow();
    const answers = [1, 1, '<h1> Digital   Empire </h1>'];
    s = E.completeLesson(s, ctx(), lesson.id, answers).state;
    expect(s.stats.lessonsCompleted).toContain(lesson.id);
    const coins = s.coins;
    s = E.completeLesson(s, ctx(), lesson.id, answers).state;
    expect(s.coins).toBe(coins);
  });

  it('locks later lessons until the previous one is done', () => {
    const s = newPlayer();
    expect(() => E.completeLesson(s, ctx(), 'html-2', [1, 2, '<a href="/contact">Contact us</a>'])).toThrow(/previous/);
  });
});

describe('websites', () => {
  it('templates score well and quality responds to edits', () => {
    let s = newPlayer();
    expect(() => E.createWebsite(s, ctx(), { templateId: 'luxe', name: 'Lux' })).toThrow(/Level 3/);
    s = E.createWebsite(s, ctx(), { templateId: 'bistro', name: 'Bistro' }).state;
    const site = s.websites[0];
    const q = qualityScore(site);
    expect(q).toBeGreaterThan(50);
    const worse = { ...site, sections: site.sections.filter((x) => x.type !== 'footer') };
    expect(qualityScore(worse)).toBeLessThan(q);
  });

  it('levels up and pays level bonus exactly once', () => {
    let s = newPlayer();
    s = { ...s, xp: 100 };
    s = E.openBusiness(s, ctx(), { name: 'Bella', tagline: '', category: 'restaurant', location: 'oldtown', color: '#1E6BFF', icon: 'utensils' }).state;
    const r = E.claimMission(s, ctx(), 'm02');
    expect(r.events.some((e) => e.type === 'levelUp')).toBe(true);
    expect(r.state.claimed['level:2']).toBeTruthy();
  });
});

describe('characters & demo generator', () => {
  const open = (s: GameState) => E.openBusiness(s, ctx(), { name: 'Bella', tagline: '', category: 'restaurant', location: 'oldtown', color: '#1E6BFF', icon: 'utensils' }).state;
  const as = (character: 'lisa' | 'charlotte' | 'victor' | 'jack') => E.createPlayer(E.createInitialState(), ctx(), { name: 'Ada', avatar: 'spark', character }).state;

  it('Jack pays 20% less for campaigns', () => {
    const s = open(as('jack'));
    const after = E.launchCampaign(s, ctx(), s.businesses[0].id, 'social').state;
    expect(s.coins - after.coins).toBe(112);
  });

  it('Victor earns 25% more from lessons', () => {
    const s = E.completeLesson(as('victor'), ctx(), 'html-1', [1, 1, '<h1>Digital Empire</h1>']).state;
    expect(s.ledger.find((t) => t.label.startsWith('Lesson') && t.currency === 'xp')!.amount).toBe(75);
  });

  it('generates a demo website, links it, and it scores well', () => {
    let s = open(as('lisa'));
    s = E.generateDemoSite(s, ctx(), { businessId: s.businesses[0].id, style: 'bold', variant: 2 }).state;
    expect(s.websites).toHaveLength(1);
    expect(s.businesses[0].websiteId).toBe(s.websites[0].id);
    expect(qualityScore(s.websites[0])).toBeGreaterThanOrEqual(75);
  });

  it('rejects unknown characters', () => {
    expect(() => E.setCharacter(as('lisa'), ctx(), 'daniel' as never)).toThrow();
  });
});
