// Core game types. The engine (src/engine) is pure TypeScript: no React, no browser APIs.
// Every change to coins or XP goes through the ledger, so all numbers are explainable.

export type CategoryId = 'restaurant' | 'hotel' | 'clothing' | 'agency' | 'coffee' | 'startup';
export type LocationId = 'harbor' | 'oldtown' | 'techquarter' | 'riverside';
export type CampaignId = 'flyers' | 'social' | 'seo' | 'influencer';

export interface Tx {
  id: string;
  ts: number;
  currency: 'coins' | 'xp';
  amount: number;
  label: string;
}

export interface ActiveCampaign {
  id: CampaignId;
  daysLeft: number;
}

export interface DayReport {
  day: number;
  visibility: number;
  demand: number;
  capacity: number;
  customers: number;
  turnedAway: number;
  revenue: number;
  goodsCost: number;
  rent: number;
  wages: number;
  upkeep: number;
  profit: number;
  satisfaction: number;
}

export interface Business {
  id: string;
  name: string;
  tagline: string;
  category: CategoryId;
  location: LocationId;
  color: string;
  icon: string;
  openedDay: number;
  staff: number;
  upgrades: string[];
  reputation: number; // 0–100, slow-moving
  satisfaction: number; // 0–100, last day
  campaigns: ActiveCampaign[];
  websiteId: string | null;
  totals: { customers: number; revenue: number; profit: number };
  history: DayReport[]; // most recent last, capped
  invested: number; // setup + upgrades, used for resale value
}

// ---------- Website Creator ----------
export type SectionType = 'nav' | 'hero' | 'about' | 'items' | 'gallery' | 'cta' | 'contact' | 'footer';

export interface SiteItem {
  name: string;
  price: string;
  description: string;
}

export interface SectionData {
  nav: { brand: string };
  hero: { heading: string; subheading: string; buttonText: string; image: string; align: 'left' | 'center' };
  about: { title: string; text: string };
  items: { title: string; items: SiteItem[] };
  gallery: { title: string; images: string[] };
  cta: { heading: string; buttonText: string };
  contact: { title: string; address: string; hours: string; phone: string };
  footer: { text: string };
}

export type Section = {
  [K in SectionType]: { id: string; type: K; data: SectionData[K] };
}[SectionType];

export type FontId = 'modern' | 'grotesk' | 'serif' | 'mono';
export type RadiusId = 'sharp' | 'soft' | 'round';

export interface SiteTheme {
  primary: string;
  mode: 'dark' | 'light';
  font: FontId;
  radius: RadiusId;
}

export interface Website {
  id: string;
  name: string;
  templateId: string;
  theme: SiteTheme;
  sections: Section[];
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

// ---------- Player & meta ----------
export interface Notification {
  id: string;
  ts: number;
  title: string;
  body: string;
  kind: 'info' | 'success' | 'warning' | 'reward';
  read: boolean;
}

export interface Player {
  name: string;
  avatar: string;
  createdAt: number;
  character?: 'lisa' | 'charlotte' | 'victor' | 'jack';
}

export interface GameState {
  version: 1;
  seq: number;
  player: Player | null;
  coins: number;
  xp: number;
  day: number;
  ledger: Tx[];
  claimed: Record<string, number>; // reward key -> timestamp (prevents duplicate rewards)
  businesses: Business[];
  websites: Website[];
  stats: {
    businessesOpened: number;
    campaignsLaunched: number;
    campaignsCompleted: number;
    staffHired: number;
    upgradesBought: number;
    websitesPublished: number;
    lessonsCompleted: string[];
    customersServed: number;
    revenueEarned: number;
    daysRun: number;
    bestQuality: number;
  };
  daily: { date: string; daysRun: number; correctAnswers: number; siteEdits: number };
  streak: { count: number; best: number; lastDate: string };
  notifications: Notification[];
  settings: { reducedMotion: boolean };
}

// Events returned by engine actions so the UI can show toasts / modals.
export type GameEvent =
  | { type: 'reward'; label: string; xp: number; coins: number }
  | { type: 'levelUp'; level: number }
  | { type: 'achievement'; id: string }
  | { type: 'info'; message: string };

export interface Ctx {
  now: number;
}

export class GameError extends Error {}
