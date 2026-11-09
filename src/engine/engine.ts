// Game actions. Each action takes the current state and returns a NEW state plus events.
// Invalid actions throw GameError and leave the state untouched.
// Because rewards are keyed in `state.claimed`, the same reward can never be paid twice.
import {
  AVATARS, BRAND_COLORS, BRAND_ICONS, CAMPAIGNS, CATEGORIES, HIRE_FEE, LEDGER_LIMIT, LOCATIONS, START_COINS,
  levelFromXp, levelUpCoins, upgradeById, upgradesFor,
} from './config';
import { gradeAnswer, isLessonUnlocked, lessonById } from './lessons';
import { ACHIEVEMENTS, DAILIES, MISSIONS, STREAK_REWARDS, dailyKey, isComplete } from './missions';
import { resaleValue, simulateDay } from './sim';
import { makeSection, qualityScore, templateById } from './website';
import { CHARACTERS, PERKS, type CharacterId } from './characters';
import { demoSite, type DemoStyle } from './demo';
import type { Business, CampaignId, CategoryId, Ctx, GameEvent, GameState, LocationId, Notification, Section, SectionType, Website } from './types';
import { GameError } from './types';

export const SAVE_VERSION = 1 as const;

export const localDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function createInitialState(): GameState {
  return {
    version: SAVE_VERSION, seq: 0, player: null, coins: 0, xp: 0, day: 1, ledger: [], claimed: {},
    businesses: [], websites: [],
    stats: { businessesOpened: 0, campaignsLaunched: 0, campaignsCompleted: 0, staffHired: 0, upgradesBought: 0, websitesPublished: 0, lessonsCompleted: [], customersServed: 0, revenueEarned: 0, daysRun: 0, bestQuality: 0 },
    daily: { date: '', daysRun: 0, correctAnswers: 0, siteEdits: 0 },
    streak: { count: 0, best: 0, lastDate: '' },
    notifications: [],
    settings: { reducedMotion: false },
  };
}

// ---------------- helpers ----------------
interface Draft { s: GameState; events: GameEvent[]; ctx: Ctx }

const nextId = (d: Draft, prefix: string) => `${prefix}${++d.s.seq}`;

function cleanText(input: unknown, { min = 0, max = 60, field = 'Text' } = {}) {
  if (typeof input !== 'string') throw new GameError(`${field} is invalid.`);
  // eslint-disable-next-line no-control-regex
  const v = input.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  if (v.length < min) throw new GameError(`${field} must be at least ${min} characters.`);
  if (v.length > max) throw new GameError(`${field} must be at most ${max} characters.`);
  return v;
}

function notify(d: Draft, title: string, body: string, kind: Notification['kind'] = 'info') {
  d.s.notifications = [{ id: nextId(d, 'n'), ts: d.ctx.now, title, body, kind, read: false }, ...d.s.notifications].slice(0, 40);
}

function addTx(d: Draft, currency: 'coins' | 'xp', amount: number, label: string) {
  if (amount === 0) return;
  d.s.ledger = [{ id: nextId(d, 't'), ts: d.ctx.now, currency, amount, label }, ...d.s.ledger].slice(0, LEDGER_LIMIT);
}

function spend(d: Draft, amount: number, label: string) {
  if (amount < 0 || !Number.isFinite(amount)) throw new GameError('Invalid amount.');
  if (d.s.coins < amount) throw new GameError(`Not enough coins — you need ${amount}, you have ${d.s.coins}.`);
  d.s.coins -= amount;
  addTx(d, 'coins', -amount, label);
}

function earn(d: Draft, amount: number, label: string) {
  d.s.coins += amount;
  addTx(d, 'coins', amount, label);
}

/** The only way XP and reward coins are granted. Returns false if `key` was already claimed. */
function grant(d: Draft, key: string, reward: { xp: number; coins: number; label: string }) {
  if (d.s.claimed[key]) return false;
  d.s.claimed[key] = d.ctx.now;
  const before = levelFromXp(d.s.xp);
  if (reward.coins) earn(d, reward.coins, reward.label);
  if (reward.xp) { d.s.xp += reward.xp; addTx(d, 'xp', reward.xp, reward.label); }
  d.events.push({ type: 'reward', label: reward.label, xp: reward.xp, coins: reward.coins });
  const after = levelFromXp(d.s.xp);
  for (let lvl = before + 1; lvl <= after; lvl++) {
    if (d.s.claimed[`level:${lvl}`]) continue;
    d.s.claimed[`level:${lvl}`] = d.ctx.now;
    earn(d, levelUpCoins(lvl), `Level ${lvl} bonus`);
    d.events.push({ type: 'levelUp', level: lvl });
    notify(d, `Founder Level ${lvl}`, `You earned a ${levelUpCoins(lvl)} coin level bonus.`, 'reward');
  }
  return true;
}

function refreshDaily(d: Draft) {
  const today = localDate(d.ctx.now);
  if (d.s.daily.date !== today) d.s.daily = { date: today, daysRun: 0, correctAnswers: 0, siteEdits: 0 };
  // Streak: fair and non-punitive — one missed day is forgiven (grace day).
  const st = d.s.streak;
  if (st.lastDate !== today) {
    const gap = st.lastDate ? daysBetween(st.lastDate, today) : Infinity;
    st.count = gap <= 2 ? st.count + 1 : 1;
    st.best = Math.max(st.best, st.count);
    st.lastDate = today;
    for (const r of STREAK_REWARDS) {
      if (st.count >= r.days) grant(d, `streak:${r.days}`, { xp: r.xp, coins: r.coins, label: `${r.days}-day streak` });
    }
  }
}

function checkAchievements(d: Draft) {
  for (const a of ACHIEVEMENTS) {
    const key = `ach:${a.id}`;
    if (!d.s.claimed[key] && a.check(d.s)) {
      grant(d, key, { xp: a.xp, coins: 0, label: `Achievement: ${a.title}` });
      d.events.push({ type: 'achievement', id: a.id });
      notify(d, 'Achievement unlocked', a.title, 'reward');
    }
  }
  // Notify (once) when a mission becomes claimable.
  for (const m of MISSIONS) {
    const key = `ready:${m.id}`;
    if (!d.s.claimed[`mission:${m.id}`] && !d.s.claimed[key] && isComplete(m.progress(d.s))) {
      d.s.claimed[key] = d.ctx.now;
      notify(d, `Mission ${m.code} complete`, `"${m.title}" — claim your reward.`, 'success');
    }
  }
  const best = Math.max(0, ...d.s.websites.filter((w) => w.published).map(qualityScore));
  d.s.stats.bestQuality = Math.max(d.s.stats.bestQuality, best);
}

export interface Result { state: GameState; events: GameEvent[] }

function run(state: GameState, ctx: Ctx, fn: (d: Draft) => void, opts: { requirePlayer?: boolean } = {}): Result {
  if (opts.requirePlayer !== false && !state.player) throw new GameError('Create your founder profile first.');
  const d: Draft = { s: structuredClone(state), events: [], ctx };
  if (d.s.player) refreshDaily(d);
  fn(d);
  if (d.s.player) checkAchievements(d);
  return { state: d.s, events: d.events };
}

const getBusiness = (d: Draft, id: string) => {
  const b = d.s.businesses.find((x) => x.id === id);
  if (!b) throw new GameError('Business not found.');
  return b;
};
const getWebsite = (d: Draft, id: string) => {
  const w = d.s.websites.find((x) => x.id === id);
  if (!w) throw new GameError('Website not found.');
  return w;
};
const level = (d: Draft) => levelFromXp(d.s.xp);

// ---------------- Player ----------------
const validCharacter = (c: unknown): CharacterId | undefined => (CHARACTERS.some((x) => x.id === c) ? (c as CharacterId) : undefined);

export const createPlayer = (s: GameState, ctx: Ctx, input: { name: string; avatar: string; character?: CharacterId }) =>
  run(s, ctx, (d) => {
    if (d.s.player) throw new GameError('Founder profile already exists.');
    const name = cleanText(input.name, { min: 2, max: 24, field: 'Founder name' });
    const avatar = (AVATARS as readonly string[]).includes(input.avatar) ? input.avatar : AVATARS[0];
    d.s.player = { name, avatar, createdAt: ctx.now, character: validCharacter(input.character) };
    refreshDaily(d);
    grant(d, 'start', { xp: 0, coins: START_COINS, label: 'Founder starting capital' });
    notify(d, `Welcome, ${name}!`, 'You have 500 virtual coins. Open your first business to get started.', 'info');
  }, { requirePlayer: false });

export const updateProfile = (s: GameState, ctx: Ctx, input: { name: string; avatar: string }) =>
  run(s, ctx, (d) => {
    d.s.player!.name = cleanText(input.name, { min: 2, max: 24, field: 'Founder name' });
    if ((AVATARS as readonly string[]).includes(input.avatar)) d.s.player!.avatar = input.avatar;
  });

export const setCharacter = (s: GameState, ctx: Ctx, character: CharacterId) =>
  run(s, ctx, (d) => {
    const c = validCharacter(character);
    if (!c) throw new GameError('Unknown character.');
    d.s.player!.character = c;
  });

export const setReducedMotion = (s: GameState, ctx: Ctx, on: boolean) =>
  run(s, ctx, (d) => { d.s.settings.reducedMotion = !!on; }, { requirePlayer: false });

export const markNotificationsRead = (s: GameState, ctx: Ctx) =>
  run(s, ctx, (d) => { d.s.notifications = d.s.notifications.map((n) => ({ ...n, read: true })); });

// ---------------- Businesses ----------------
export interface NewBusiness { name: string; tagline: string; category: CategoryId; location: LocationId; color: string; icon: string }

export const openBusiness = (s: GameState, ctx: Ctx, input: NewBusiness) =>
  run(s, ctx, (d) => {
    const cat = CATEGORIES[input.category];
    if (!cat) throw new GameError('Unknown business category.');
    if (!LOCATIONS[input.location]) throw new GameError('Unknown location.');
    if (level(d) < cat.unlockLevel) throw new GameError(`${cat.name} unlocks at Founder Level ${cat.unlockLevel}.`);
    if (d.s.businesses.length >= 8) throw new GameError('You can own up to 8 businesses.');
    const name = cleanText(input.name, { min: 2, max: 28, field: 'Business name' });
    if (d.s.businesses.some((b) => b.name.toLowerCase() === name.toLowerCase())) throw new GameError('You already own a business with that name.');
    const tagline = cleanText(input.tagline, { max: 60, field: 'Tagline' });
    spend(d, cat.setupCost, `Opened ${name}`);
    const b: Business = {
      id: nextId(d, 'b'), name, tagline, category: cat.id, location: input.location,
      color: BRAND_COLORS.includes(input.color) ? input.color : BRAND_COLORS[0],
      icon: BRAND_ICONS.includes(input.icon) ? input.icon : cat.icon,
      openedDay: d.s.day, staff: 0, upgrades: [], reputation: 50, satisfaction: 60, campaigns: [], websiteId: null,
      totals: { customers: 0, revenue: 0, profit: 0 }, history: [], invested: cat.setupCost,
    };
    d.s.businesses.push(b);
    d.s.stats.businessesOpened++;
    notify(d, `${name} is open!`, `Your ${cat.name.toLowerCase()} in ${LOCATIONS[input.location].name} is ready for ${cat.customerWord}.`, 'success');
  });

export const hireStaff = (s: GameState, ctx: Ctx, businessId: string) =>
  run(s, ctx, (d) => {
    const b = getBusiness(d, businessId);
    if (b.staff >= 12) throw new GameError('Maximum team size reached.');
    spend(d, HIRE_FEE, `Hiring fee · ${b.name}`);
    b.staff++;
    d.s.stats.staffHired++;
  });

export const fireStaff = (s: GameState, ctx: Ctx, businessId: string) =>
  run(s, ctx, (d) => {
    const b = getBusiness(d, businessId);
    if (b.staff <= 0) throw new GameError('No employees to let go.');
    b.staff--;
  });

export const buyUpgrade = (s: GameState, ctx: Ctx, businessId: string, upgradeId: string) =>
  run(s, ctx, (d) => {
    const b = getBusiness(d, businessId);
    const u = upgradeById(upgradeId);
    if (!u || !upgradesFor(b.category).includes(u)) throw new GameError('That upgrade is not available for this business.');
    if (b.upgrades.includes(u.id)) throw new GameError('Already purchased.');
    if (u.requiresWebsite && !b.websiteId) throw new GameError('Link a website to this business first.');
    spend(d, u.cost, `${u.name} · ${b.name}`);
    b.upgrades.push(u.id);
    b.invested += u.cost;
    d.s.stats.upgradesBought++;
  });

export const launchCampaign = (s: GameState, ctx: Ctx, businessId: string, campaignId: CampaignId) =>
  run(s, ctx, (d) => {
    const b = getBusiness(d, businessId);
    const c = CAMPAIGNS[campaignId];
    if (!c) throw new GameError('Unknown campaign.');
    if (level(d) < c.unlockLevel) throw new GameError(`${c.name} unlocks at Founder Level ${c.unlockLevel}.`);
    if (c.requiresWebsite && !b.websiteId) throw new GameError('Link a website to run a search campaign.');
    if (b.campaigns.some((x) => x.id === c.id)) throw new GameError('This campaign is already running.');
    spend(d, Math.round(c.cost * PERKS.campaignCost(d.s.player!.character)), `${c.name} · ${b.name}`);
    b.campaigns.push({ id: c.id, daysLeft: c.days });
    d.s.stats.campaignsLaunched++;
  });

export const linkWebsite = (s: GameState, ctx: Ctx, businessId: string, websiteId: string | null) =>
  run(s, ctx, (d) => {
    const b = getBusiness(d, businessId);
    if (websiteId) {
      getWebsite(d, websiteId);
      const other = d.s.businesses.find((x) => x.websiteId === websiteId && x.id !== b.id);
      if (other) other.websiteId = null; // one site per business
    }
    b.websiteId = websiteId;
  });

export const sellBusiness = (s: GameState, ctx: Ctx, businessId: string) =>
  run(s, ctx, (d) => {
    const b = getBusiness(d, businessId);
    const value = resaleValue(b);
    d.s.businesses = d.s.businesses.filter((x) => x.id !== b.id);
    earn(d, value, `Sold ${b.name}`);
    notify(d, `${b.name} sold`, `You received ${value} coins (40% of what you invested).`, 'info');
  });

/** Advance the whole empire by one day. */
export const endDay = (s: GameState, ctx: Ctx) =>
  run(s, ctx, (d) => {
    if (d.s.businesses.length === 0) throw new GameError('Open a business before running a day.');
    const day = d.s.day;
    let total = 0;
    let customers = 0;
    d.s.businesses = d.s.businesses.map((b) => {
      const site = d.s.websites.find((w) => w.id === b.websiteId);
      const r = simulateDay(b, site, day, d.s.player!.character);
      total += r.report.profit;
      customers += r.report.customers;
      d.s.stats.customersServed += r.report.customers;
      d.s.stats.revenueEarned += r.report.revenue;
      if (r.finishedCampaigns) {
        d.s.stats.campaignsCompleted += r.finishedCampaigns;
        notify(d, 'Campaign finished', `A marketing campaign for ${b.name} has completed.`, 'info');
      }
      return r.business;
    });
    if (total >= 0) earn(d, total, `Day ${day} profit`);
    else {
      const pay = Math.min(d.s.coins, -total);
      if (pay > 0) { d.s.coins -= pay; addTx(d, 'coins', -pay, `Day ${day} loss`); }
      if (pay < -total) {
        // Couldn't cover all costs: the wallet never goes negative, but reputation suffers.
        d.s.businesses.forEach((b) => { b.reputation = Math.max(0, b.reputation - 5); });
        notify(d, 'Unpaid bills', 'You could not cover all costs. Reputation dropped. Cut staff, sell a business, or earn coins in the Academy.', 'warning');
      }
    }
    d.s.day++;
    d.s.stats.daysRun++;
    d.s.daily.daysRun++;
    d.events.push({ type: 'info', message: `Day ${day}: ${customers} customers · ${total >= 0 ? '+' : ''}${total} coins` });
  });

// ---------------- Websites ----------------
export const createWebsite = (s: GameState, ctx: Ctx, input: { templateId: string; name: string }) =>
  run(s, ctx, (d) => {
    const t = templateById(input.templateId);
    if (!t) throw new GameError('Unknown template.');
    if (level(d) < t.unlockLevel) throw new GameError(`${t.name} unlocks at Founder Level ${t.unlockLevel}.`);
    if (d.s.websites.length >= 12) throw new GameError('You can have up to 12 websites.');
    const name = cleanText(input.name, { min: 2, max: 28, field: 'Website name' });
    const sections = t.build(name).map(([type, data]) => makeSection(type, nextId(d, 's'), data as never));
    const site: Website = { id: nextId(d, 'w'), name, templateId: t.id, theme: { ...t.theme }, sections, published: false, createdAt: ctx.now, updatedAt: ctx.now };
    d.s.websites.push(site);
  });

function sanitizeSection(sec: Section): Section {
  const t = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
  switch (sec.type) {
    case 'nav': return { ...sec, data: { brand: t(sec.data.brand, 32) } };
    case 'hero': return { ...sec, data: { heading: t(sec.data.heading, 80), subheading: t(sec.data.subheading, 160), buttonText: t(sec.data.buttonText, 28), image: t(sec.data.image, 20), align: sec.data.align === 'left' ? 'left' : 'center' } };
    case 'about': return { ...sec, data: { title: t(sec.data.title, 60), text: t(sec.data.text, 600) } };
    case 'items': return { ...sec, data: { title: t(sec.data.title, 60), items: sec.data.items.slice(0, 12).map((i) => ({ name: t(i.name, 40), price: t(i.price, 10), description: t(i.description, 100) })) } };
    case 'gallery': return { ...sec, data: { title: t(sec.data.title, 60), images: sec.data.images.slice(0, 6).map((x) => t(x, 20)) } };
    case 'cta': return { ...sec, data: { heading: t(sec.data.heading, 80), buttonText: t(sec.data.buttonText, 28) } };
    case 'contact': return { ...sec, data: { title: t(sec.data.title, 60), address: t(sec.data.address, 100), hours: t(sec.data.hours, 60), phone: t(sec.data.phone, 30) } };
    case 'footer': return { ...sec, data: { text: t(sec.data.text, 100) } };
  }
}

/** Saves editor changes (sanitized). Counts toward the daily "edit a website" mission. */
export const saveWebsite = (s: GameState, ctx: Ctx, site: Website) =>
  run(s, ctx, (d) => {
    const w = getWebsite(d, site.id);
    w.name = cleanText(site.name, { min: 2, max: 28, field: 'Website name' });
    w.theme = { ...site.theme };
    w.sections = site.sections.slice(0, 16).map(sanitizeSection);
    w.updatedAt = ctx.now;
    d.s.daily.siteEdits++;
  });

export const addSection = (s: GameState, ctx: Ctx, websiteId: string, type: SectionType) =>
  run(s, ctx, (d) => {
    const w = getWebsite(d, websiteId);
    if (w.sections.length >= 16) throw new GameError('Maximum 16 sections per website.');
    const sec = makeSection(type, nextId(d, 's'), type === 'nav' ? { brand: w.name } : type === 'footer' ? { text: `© ${w.name}` } : undefined);
    const footerIdx = w.sections.findIndex((x) => x.type === 'footer');
    if (type === 'nav') w.sections.unshift(sec);
    else if (footerIdx >= 0 && type !== 'footer') w.sections.splice(footerIdx, 0, sec);
    else w.sections.push(sec);
    w.updatedAt = ctx.now;
    d.s.daily.siteEdits++;
  });

export const publishWebsite = (s: GameState, ctx: Ctx, websiteId: string, published: boolean) =>
  run(s, ctx, (d) => {
    const w = getWebsite(d, websiteId);
    if (published && !w.sections.some((x) => x.type === 'hero')) throw new GameError('Add a Hero section before publishing.');
    if (published && !w.published) {
      d.s.stats.websitesPublished++;
      notify(d, `${w.name} is live`, `Quality score: ${qualityScore(w)}/100. Link it to a business to attract customers.`, 'success');
    }
    w.published = published;
  });

export const deleteWebsite = (s: GameState, ctx: Ctx, websiteId: string) =>
  run(s, ctx, (d) => {
    getWebsite(d, websiteId);
    d.s.websites = d.s.websites.filter((w) => w.id !== websiteId);
    d.s.businesses.forEach((b) => { if (b.websiteId === websiteId) b.websiteId = null; });
  });

/** Generates a complete demo website from a business brand and links it to the business. */
export const generateDemoSite = (s: GameState, ctx: Ctx, input: { businessId: string; style: DemoStyle; variant: number }) =>
  run(s, ctx, (d) => {
    const b = getBusiness(d, input.businessId);
    if (d.s.websites.length >= 12) throw new GameError('You can have up to 12 websites. Delete one in the Studio first.');
    const demo = demoSite(b, input.style, input.variant);
    const sections = demo.sections.map(([type, data]) => makeSection(type, nextId(d, 's'), data as never));
    const site: Website = { id: nextId(d, 'w'), name: b.name, templateId: `demo-${input.style}`, theme: demo.theme, sections, published: false, createdAt: ctx.now, updatedAt: ctx.now };
    d.s.websites.push(site);
    b.websiteId = site.id;
    notify(d, `Demo website for ${b.name}`, 'Your demo is ready. Polish it in the Studio, then publish it to attract customers.', 'success');
  });

export const duplicateSection = (s: GameState, ctx: Ctx, websiteId: string, sectionId: string) =>
  run(s, ctx, (d) => {
    const w = getWebsite(d, websiteId);
    const i = w.sections.findIndex((x) => x.id === sectionId);
    if (i < 0) throw new GameError('Section not found.');
    if (w.sections.length >= 16) throw new GameError('Maximum 16 sections per website.');
    w.sections.splice(i + 1, 0, { ...structuredClone(w.sections[i]), id: nextId(d, 's') });
    w.updatedAt = ctx.now;
    d.s.daily.siteEdits++;
  });

// ---------------- Missions ----------------
export const claimMission = (s: GameState, ctx: Ctx, missionId: string) =>
  run(s, ctx, (d) => {
    const m = MISSIONS.find((x) => x.id === missionId);
    if (!m) throw new GameError('Unknown mission.');
    if (!isComplete(m.progress(d.s))) throw new GameError('Mission conditions are not met yet.');
    if (!grant(d, `mission:${m.id}`, { xp: m.xp, coins: m.coins, label: `Mission ${m.code}: ${m.title}` }))
      throw new GameError('Reward already claimed.');
  });

export const claimDaily = (s: GameState, ctx: Ctx, dailyId: string) =>
  run(s, ctx, (d) => {
    const m = DAILIES.find((x) => x.id === dailyId);
    if (!m) throw new GameError('Unknown daily mission.');
    if (!isComplete(m.progress(d.s))) throw new GameError('Daily mission not finished yet.');
    if (!grant(d, dailyKey(d.s.daily.date, m.id), { xp: m.xp, coins: m.coins, label: `Daily: ${m.title}` }))
      throw new GameError('Already claimed today. New daily missions arrive tomorrow.');
  });

// ---------------- Academy ----------------
/** Grade a single answer (used for live feedback and the daily practice counter). */
export const answerQuestion = (s: GameState, ctx: Ctx, lessonId: string, index: number, answer: number | string) => {
  let correct = false;
  const result = run(s, ctx, (d) => {
    const q = lessonById(lessonId)?.questions[index];
    if (!q) throw new GameError('Unknown question.');
    correct = gradeAnswer(q, answer);
    if (correct) d.s.daily.correctAnswers++;
  });
  return { ...result, correct };
};

/** Completes a lesson. The engine re-grades every answer — the UI cannot just claim success. */
export const completeLesson = (s: GameState, ctx: Ctx, lessonId: string, answers: (number | string)[]) =>
  run(s, ctx, (d) => {
    const lesson = lessonById(lessonId);
    if (!lesson) throw new GameError('Unknown lesson.');
    if (!isLessonUnlocked(lessonId, d.s.stats.lessonsCompleted)) throw new GameError('Complete the previous lesson first.');
    if (answers.length !== lesson.questions.length || !lesson.questions.every((q, i) => gradeAnswer(q, answers[i])))
      throw new GameError('Some answers are not correct yet.');
    if (d.s.stats.lessonsCompleted.includes(lesson.id)) {
      d.events.push({ type: 'info', message: 'Lesson replayed — rewards are only given the first time.' });
      return;
    }
    d.s.stats.lessonsCompleted.push(lesson.id);
    const m = PERKS.lessonReward(d.s.player!.character);
    grant(d, `lesson:${lesson.id}`, { xp: Math.round(lesson.xp * m), coins: Math.round(lesson.coins * m), label: `Lesson: ${lesson.title}` });
  });

// ---------------- Save validation ----------------
/** Light structural validation for imported / persisted saves. */
export function validateSave(raw: unknown): GameState {
  const s = raw as GameState;
  const ok =
    s && typeof s === 'object' && s.version === SAVE_VERSION &&
    typeof s.coins === 'number' && s.coins >= 0 && typeof s.xp === 'number' && s.xp >= 0 &&
    Array.isArray(s.businesses) && Array.isArray(s.websites) && Array.isArray(s.ledger) &&
    s.claimed && typeof s.claimed === 'object' && s.stats && Array.isArray(s.stats.lessonsCompleted) &&
    s.daily && s.streak && Array.isArray(s.notifications) && s.settings;
  if (!ok) throw new GameError('This save file is not valid for this version of the game.');
  return s;
}
