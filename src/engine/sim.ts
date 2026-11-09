// Daily business simulation. Every number in a DayReport is derived from visible stats,
// so the UI can explain exactly why a business earned what it did.
import { CAMPAIGNS, CATEGORIES, LOCATIONS, upgradeById } from './config';
import { websiteEffects } from './website';
import type { Business, DayReport, Website } from './types';

/** Deterministic pseudo-random number in [0,1) from a string seed (no Math.random in the engine). */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h += 0x6d2b79f5;
  let t = h;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export interface Breakdown {
  visibility: { base: number; website: number; upgrades: number; campaigns: number; locationMult: number; total: number };
  conversion: number; // multiplier
  capacity: { base: number; staff: number; upgrades: number; total: number };
  ticket: number;
  satisfactionTarget: number;
  dailyFixed: { rent: number; wages: number; upkeep: number };
}

const BASE_VISIBILITY = 20;
const REFERENCE_VISIBILITY = 40;

export function breakdown(b: Business, site: Website | undefined): Breakdown {
  const cat = CATEGORIES[b.category];
  const loc = LOCATIONS[b.location];
  const ups = b.upgrades.map(upgradeById).filter((u) => !!u);
  const web = websiteEffects(site);
  const sum = (k: 'visibility' | 'conversion' | 'capacity' | 'satisfaction' | 'ticket' | 'upkeep') =>
    ups.reduce((acc, u) => acc + (u.effects[k] ?? 0), 0);

  const campaigns = b.campaigns.reduce((acc, c) => acc + CAMPAIGNS[c.id].visibility, 0);
  const locationMult = loc.traffic + (loc.bonusFor?.includes(b.category) ? loc.bonus ?? 0 : 0);
  const rawVis = BASE_VISIBILITY + web.visibility + sum('visibility') + campaigns;
  const capStaff = b.staff * cat.capacityPerStaff;
  return {
    visibility: { base: BASE_VISIBILITY, website: web.visibility, upgrades: sum('visibility'), campaigns, locationMult, total: Math.round(rawVis * locationMult) },
    conversion: 1 + sum('conversion') + web.conversion,
    capacity: { base: cat.baseCapacity, staff: capStaff, upgrades: sum('capacity'), total: cat.baseCapacity + capStaff + sum('capacity') },
    ticket: cat.avgTicket * (1 + sum('ticket')),
    satisfactionTarget: 60 + sum('satisfaction') + web.satisfaction,
    dailyFixed: { rent: Math.round(cat.rent * loc.rentMult), wages: b.staff * cat.wage, upkeep: sum('upkeep') },
  };
}

export function simulateDay(b: Business, site: Website | undefined, day: number): { business: Business; report: DayReport; finishedCampaigns: number } {
  const cat = CATEGORIES[b.category];
  const bd = breakdown(b, site);
  const noise = 0.9 + seeded(`${b.id}:${day}`) * 0.2;
  const repFactor = 0.7 + b.reputation / 200; // 0.7 … 1.2
  const demand = Math.max(0, Math.round(cat.baseDemand * (bd.visibility.total / REFERENCE_VISIBILITY) * repFactor * bd.conversion * noise));
  const capacity = bd.capacity.total;
  const customers = Math.min(demand, capacity);
  const turnedAway = demand - customers;

  // Overloaded businesses upset customers; spare capacity is calm.
  const overload = capacity > 0 && turnedAway > 0 ? Math.min(25, (turnedAway / capacity) * 40) : 0;
  const satisfaction = Math.max(0, Math.min(100, Math.round(bd.satisfactionTarget - overload)));
  const reputation = Math.max(0, Math.min(100, b.reputation + (satisfaction - b.reputation) * 0.15));

  const revenue = Math.round(customers * bd.ticket);
  const goodsCost = Math.round(revenue * cat.goodsRate);
  const { rent, wages, upkeep } = bd.dailyFixed;
  const profit = revenue - goodsCost - rent - wages - upkeep;

  const campaigns = b.campaigns.map((c) => ({ ...c, daysLeft: c.daysLeft - 1 }));
  const finishedCampaigns = campaigns.filter((c) => c.daysLeft <= 0).length;

  const report: DayReport = {
    day, visibility: bd.visibility.total, demand, capacity, customers, turnedAway,
    revenue, goodsCost, rent, wages, upkeep, profit, satisfaction,
  };

  return {
    finishedCampaigns,
    report,
    business: {
      ...b,
      reputation: Math.round(reputation * 10) / 10,
      satisfaction,
      campaigns: campaigns.filter((c) => c.daysLeft > 0),
      totals: { customers: b.totals.customers + customers, revenue: b.totals.revenue + revenue, profit: b.totals.profit + profit },
      history: [...b.history, report].slice(-14),
    },
  };
}

/** Coins returned when a business is sold: 40% of everything invested. */
export const resaleValue = (b: Business) => Math.round(b.invested * 0.4);
