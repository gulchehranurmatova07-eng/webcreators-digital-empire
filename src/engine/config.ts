// Game balance constants. All economy tuning lives here.
import type { CampaignId, CategoryId, LocationId } from './types';

export const START_COINS = 500;
export const LEDGER_LIMIT = 250;
export const HISTORY_LIMIT = 14;
export const HIRE_FEE = 40;

export interface CategoryDef {
  id: CategoryId;
  name: string;
  icon: string;
  blurb: string;
  setupCost: number;
  avgTicket: number; // coins per customer
  goodsRate: number; // share of revenue spent on goods (ingredients, stock…)
  baseDemand: number; // potential customers/day at reference visibility
  rent: number; // per day
  wage: number; // per staff per day
  capacityPerStaff: number;
  baseCapacity: number; // what the founder alone can handle
  unlockLevel: number;
  customerWord: string;
  template: string;
}

export const CATEGORIES: Record<CategoryId, CategoryDef> = {
  restaurant: {
    id: 'restaurant', name: 'Restaurant', icon: 'utensils', blurb: 'Steady diners, thin margins. Great websites fill tables.',
    setupCost: 300, avgTicket: 12, goodsRate: 0.35, baseDemand: 30, rent: 40, wage: 35, capacityPerStaff: 15, baseCapacity: 8,
    unlockLevel: 1, customerWord: 'diners', template: 'bistro',
  },
  hotel: {
    id: 'hotel', name: 'Hotel', icon: 'bed', blurb: 'Few guests, big tickets. Online booking is everything.',
    setupCost: 450, avgTicket: 60, goodsRate: 0.25, baseDemand: 8, rent: 90, wage: 40, capacityPerStaff: 4, baseCapacity: 3,
    unlockLevel: 1, customerWord: 'guests', template: 'grandstay',
  },
  clothing: {
    id: 'clothing', name: 'Clothing Brand', icon: 'shirt', blurb: 'Style-driven shoppers. Branding and visuals sell.',
    setupCost: 250, avgTicket: 30, goodsRate: 0.5, baseDemand: 14, rent: 45, wage: 30, capacityPerStaff: 10, baseCapacity: 4,
    unlockLevel: 1, customerWord: 'shoppers', template: 'atelier',
  },
  agency: {
    id: 'agency', name: 'Digital Agency', icon: 'monitor', blurb: 'Few clients, high value. Your portfolio wins deals.',
    setupCost: 200, avgTicket: 80, goodsRate: 0.2, baseDemand: 4, rent: 30, wage: 60, capacityPerStaff: 2, baseCapacity: 1,
    unlockLevel: 1, customerWord: 'clients', template: 'studio',
  },
  coffee: {
    id: 'coffee', name: 'Coffee Shop', icon: 'coffee', blurb: 'High volume, small tickets. Speed and loyalty matter.',
    setupCost: 220, avgTicket: 5, goodsRate: 0.3, baseDemand: 70, rent: 35, wage: 25, capacityPerStaff: 30, baseCapacity: 10,
    unlockLevel: 3, customerWord: 'customers', template: 'bistro',
  },
  startup: {
    id: 'startup', name: 'Tech Startup', icon: 'rocket', blurb: 'Expensive to run, scales hard once users arrive.',
    setupCost: 600, avgTicket: 20, goodsRate: 0.1, baseDemand: 12, rent: 60, wage: 70, capacityPerStaff: 8, baseCapacity: 2,
    unlockLevel: 5, customerWord: 'users', template: 'studio',
  },
};

export const CATEGORY_ORDER: CategoryId[] = ['restaurant', 'hotel', 'clothing', 'agency', 'coffee', 'startup'];

export interface LocationDef {
  id: LocationId;
  name: string;
  blurb: string;
  traffic: number;
  rentMult: number;
  bonusFor?: CategoryId[];
  bonus?: number;
}

export const CITY_NAME = 'Novara Bay';

export const LOCATIONS: Record<LocationId, LocationDef> = {
  harbor: { id: 'harbor', name: 'Harbor District', blurb: 'Busy waterfront with tourists.', traffic: 1.2, rentMult: 1.25, bonusFor: ['hotel', 'restaurant'], bonus: 0.1 },
  oldtown: { id: 'oldtown', name: 'Old Town', blurb: 'Charming streets, balanced costs.', traffic: 1.0, rentMult: 1.0, bonusFor: ['clothing', 'coffee'], bonus: 0.1 },
  techquarter: { id: 'techquarter', name: 'Tech Quarter', blurb: 'Offices and founders everywhere.', traffic: 1.0, rentMult: 1.2, bonusFor: ['agency', 'startup', 'coffee'], bonus: 0.35 },
  riverside: { id: 'riverside', name: 'Riverside', blurb: 'Quiet and cheap. Fewer passers-by.', traffic: 0.85, rentMult: 0.8 },
};

export const LOCATION_ORDER: LocationId[] = ['harbor', 'oldtown', 'techquarter', 'riverside'];

export interface UpgradeEffects {
  visibility?: number; // flat
  conversion?: number; // +x multiplier on demand
  capacity?: number; // flat
  satisfaction?: number; // flat
  ticket?: number; // +x multiplier on average ticket
  upkeep?: number; // coins per day
}

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  effects: UpgradeEffects;
  categories: CategoryId[] | 'all';
  requiresWebsite?: boolean;
  icon: string;
}

export const UPGRADES: UpgradeDef[] = [
  // Shared
  { id: 'seo', name: 'SEO optimization', description: 'Search engines find your linked website more often.', cost: 180, effects: { visibility: 12 }, categories: 'all', requiresWebsite: true, icon: 'search' },
  { id: 'training', name: 'Staff training', description: 'Friendlier, faster service.', cost: 150, effects: { satisfaction: 6 }, categories: 'all', icon: 'graduation' },
  // Restaurant
  { id: 'menu-photos', name: 'Menu photography', description: 'Appetizing photos convince more visitors.', cost: 120, effects: { conversion: 0.1, satisfaction: 3 }, categories: ['restaurant', 'coffee'], icon: 'camera' },
  { id: 'reservations', name: 'Online reservations', description: 'Guests book a table in two taps.', cost: 200, effects: { conversion: 0.15, upkeep: 5 }, categories: ['restaurant'], icon: 'calendar' },
  { id: 'kitchen', name: 'Kitchen expansion', description: 'Serve many more diners per day.', cost: 350, effects: { capacity: 15, upkeep: 10 }, categories: ['restaurant'], icon: 'chef' },
  { id: 'tasting', name: "Chef's tasting menu", description: 'Premium dishes raise the average bill.', cost: 280, effects: { ticket: 0.2, satisfaction: 5 }, categories: ['restaurant'], icon: 'star' },
  // Hotel
  { id: 'booking', name: 'Booking engine', description: 'Direct online bookings, no phone tag.', cost: 250, effects: { conversion: 0.2, upkeep: 6 }, categories: ['hotel'], icon: 'calendar' },
  { id: 'renovation', name: 'Room renovation', description: 'Modern rooms justify higher rates.', cost: 400, effects: { satisfaction: 10, ticket: 0.15 }, categories: ['hotel'], icon: 'sparkles' },
  { id: 'wing', name: 'New guest wing', description: 'More rooms to fill.', cost: 600, effects: { capacity: 4, upkeep: 20 }, categories: ['hotel'], icon: 'building' },
  { id: 'spa', name: 'Wellness spa', description: 'A reason to stay — and spend.', cost: 450, effects: { ticket: 0.25, satisfaction: 5, upkeep: 10 }, categories: ['hotel'], icon: 'flower' },
  // Clothing
  { id: 'product-photos', name: 'Product photography', description: 'Clothes look as good online as in store.', cost: 120, effects: { conversion: 0.1 }, categories: ['clothing'], icon: 'camera' },
  { id: 'online-store', name: 'Online store', description: 'Sell beyond the shop window.', cost: 300, effects: { conversion: 0.2, visibility: 5, upkeep: 8 }, categories: ['clothing'], icon: 'cart' },
  { id: 'window', name: 'Window display', description: 'Stops passers-by in their tracks.', cost: 150, effects: { visibility: 10 }, categories: ['clothing'], icon: 'store' },
  { id: 'loyalty', name: 'Loyalty program', description: 'Happy regulars come back.', cost: 200, effects: { satisfaction: 8, conversion: 0.05 }, categories: ['clothing'], icon: 'heart' },
  // Agency
  { id: 'case-studies', name: 'Case studies', description: 'Show results; close more deals.', cost: 150, effects: { conversion: 0.15 }, categories: ['agency'], icon: 'file' },
  { id: 'pm-tools', name: 'Project management tools', description: 'Each team member handles more work.', cost: 180, effects: { capacity: 1, upkeep: 4 }, categories: ['agency'], icon: 'kanban' },
  { id: 'workstations', name: 'Design workstations', description: 'Premium work, premium prices.', cost: 300, effects: { ticket: 0.2 }, categories: ['agency'], icon: 'monitor' },
  { id: 'referrals', name: 'Referral program', description: 'Clients recommend you to friends.', cost: 220, effects: { visibility: 10, satisfaction: 3 }, categories: ['agency'], icon: 'users' },
  // Coffee
  { id: 'espresso', name: 'Pro espresso machine', description: 'Faster, better coffee.', cost: 250, effects: { capacity: 15, satisfaction: 5 }, categories: ['coffee'], icon: 'coffee' },
  { id: 'loyalty-app', name: 'Loyalty app', description: 'Every tenth coffee free keeps them coming.', cost: 200, effects: { conversion: 0.1, upkeep: 3 }, categories: ['coffee'], icon: 'smartphone' },
  { id: 'terrace', name: 'Terrace seating', description: 'Room for many more guests.', cost: 300, effects: { capacity: 20, upkeep: 6 }, categories: ['coffee'], icon: 'sun' },
  { id: 'beans', name: 'Specialty beans', description: 'Single-origin coffee at a premium.', cost: 150, effects: { ticket: 0.15, satisfaction: 4 }, categories: ['coffee'], icon: 'leaf' },
  // Startup
  { id: 'servers', name: 'Cloud servers', description: 'Handle more users without crashing.', cost: 300, effects: { capacity: 10, upkeep: 15 }, categories: ['startup'], icon: 'server' },
  { id: 'onboarding', name: 'Better onboarding', description: 'More sign-ups become paying users.', cost: 200, effects: { conversion: 0.2 }, categories: ['startup'], icon: 'rocket' },
  { id: 'premium', name: 'Premium tier', description: 'Power users pay more.', cost: 350, effects: { ticket: 0.3 }, categories: ['startup'], icon: 'gem' },
  { id: 'booth', name: 'Conference booth', description: 'Get noticed by the tech crowd.', cost: 400, effects: { visibility: 20 }, categories: ['startup'], icon: 'megaphone' },
];

export const upgradesFor = (cat: CategoryId) =>
  UPGRADES.filter((u) => u.categories === 'all' || u.categories.includes(cat));

export const upgradeById = (id: string) => UPGRADES.find((u) => u.id === id);

export interface CampaignDef {
  id: CampaignId;
  name: string;
  description: string;
  cost: number;
  visibility: number;
  days: number;
  unlockLevel: number;
  requiresWebsite?: boolean;
  icon: string;
}

export const CAMPAIGNS: Record<CampaignId, CampaignDef> = {
  flyers: { id: 'flyers', name: 'Local flyers', description: 'Cheap, short boost in the neighborhood.', cost: 60, visibility: 12, days: 3, unlockLevel: 1, icon: 'newspaper' },
  social: { id: 'social', name: 'Social media ads', description: 'Targeted ads reach many locals.', cost: 140, visibility: 25, days: 4, unlockLevel: 1, icon: 'megaphone' },
  seo: { id: 'seo', name: 'Search campaign', description: 'Long-lasting boost via your linked website.', cost: 160, visibility: 18, days: 7, unlockLevel: 2, requiresWebsite: true, icon: 'search' },
  influencer: { id: 'influencer', name: 'Influencer collab', description: 'A big but short spotlight.', cost: 320, visibility: 45, days: 4, unlockLevel: 3, icon: 'sparkles' },
};
export const CAMPAIGN_ORDER: CampaignId[] = ['flyers', 'social', 'seo', 'influencer'];

// ---------- Levels & ranks ----------
export const MAX_LEVEL = 30;
/** Total XP needed to reach `level`. L2=200, L3=600, L4=1200, L5=2000 … */
export const xpForLevel = (level: number) => 100 * level * (level - 1);

export const levelFromXp = (xp: number) => {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
};

export const levelUpCoins = (level: number) => 100 + level * 50;

export const RANKS: { level: number; name: string }[] = [
  { level: 1, name: 'Beginner Founder' },
  { level: 3, name: 'Rising Entrepreneur' },
  { level: 5, name: 'Business Builder' },
  { level: 8, name: 'Digital Strategist' },
  { level: 12, name: 'Empire Architect' },
  { level: 16, name: 'Digital Tycoon' },
];

export const rankForLevel = (level: number) =>
  [...RANKS].reverse().find((r) => level >= r.level)!.name;

export const AVATARS = ['spark', 'bolt', 'crown', 'rocket', 'gem', 'globe', 'compass', 'code'] as const;
export const BRAND_COLORS = ['#1E6BFF', '#58A6FF', '#22C3A6', '#F5B942', '#F06A6A', '#B07CFF', '#FF8A3D', '#E5E7EB'];
export const BRAND_ICONS = ['store', 'utensils', 'bed', 'shirt', 'monitor', 'coffee', 'rocket', 'gem', 'leaf', 'star', 'heart', 'sun'];
