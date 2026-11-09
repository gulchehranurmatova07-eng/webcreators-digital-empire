// Missions, daily missions, achievements. Conditions are pure functions of GameState,
// so the engine can verify them before paying any reward.
import { LESSONS } from './lessons';
import { qualityScore } from './website';
import { levelFromXp } from './config';
import type { GameState } from './types';

export interface Progress {
  current: number;
  target: number;
}

export interface MissionDef {
  id: string;
  code: string;
  title: string;
  description: string;
  xp: number;
  coins: number;
  route: string;
  progress: (s: GameState) => Progress;
}

const bestPublishedQuality = (s: GameState) =>
  Math.max(0, ...s.websites.filter((w) => w.published).map(qualityScore));

export const MISSIONS: MissionDef[] = [
  { id: 'm01', code: '01', title: 'Build your first website', description: 'Create a website in the Studio and publish it.', xp: 100, coins: 50, route: '/studio',
    progress: (s) => ({ current: Math.min(1, s.stats.websitesPublished), target: 1 }) },
  { id: 'm02', code: '02', title: 'Open your first business', description: 'Choose a category, brand it and open its doors.', xp: 150, coins: 0, route: '/empire/new',
    progress: (s) => ({ current: Math.min(1, s.stats.businessesOpened), target: 1 }) },
  { id: 'm03', code: '03', title: 'Complete a marketing campaign', description: 'Launch a campaign and run days until it finishes.', xp: 100, coins: 60, route: '/empire',
    progress: (s) => ({ current: Math.min(1, s.stats.campaignsCompleted), target: 1 }) },
  { id: 'm04', code: '04', title: 'Reach 10 customers', description: 'Serve 10 simulated customers across your businesses.', xp: 200, coins: 100, route: '/empire',
    progress: (s) => ({ current: Math.min(10, s.stats.customersServed), target: 10 }) },
  { id: 'm05', code: '05', title: 'Improve your website design', description: 'Get a published website to a quality score of 75+.', xp: 150, coins: 75, route: '/studio',
    progress: (s) => ({ current: Math.min(75, bestPublishedQuality(s)), target: 75 }) },
  { id: 'm06', code: '06', title: 'Connect site and business', description: 'Link a published website to one of your businesses.', xp: 100, coins: 50, route: '/empire',
    progress: (s) => ({ current: s.businesses.some((b) => b.websiteId && s.websites.find((w) => w.id === b.websiteId)?.published) ? 1 : 0, target: 1 }) },
  { id: 'm07', code: '07', title: 'Hire your first employee', description: 'Grow your team to serve more customers.', xp: 80, coins: 0, route: '/empire',
    progress: (s) => ({ current: Math.min(1, s.stats.staffHired), target: 1 }) },
  { id: 'm08', code: '08', title: 'Academy graduate', description: 'Complete 3 lessons in the Digital Academy.', xp: 150, coins: 100, route: '/academy',
    progress: (s) => ({ current: Math.min(3, s.stats.lessonsCompleted.length), target: 3 }) },
  { id: 'm09', code: '09', title: 'Earn 2,000 revenue', description: 'Total revenue across all businesses.', xp: 250, coins: 150, route: '/empire',
    progress: (s) => ({ current: Math.min(2000, Math.floor(s.stats.revenueEarned)), target: 2000 }) },
  { id: 'm10', code: '10', title: 'Build a second business', description: 'Own two businesses at the same time.', xp: 300, coins: 0, route: '/empire/new',
    progress: (s) => ({ current: Math.min(2, s.businesses.length), target: 2 }) },
  { id: 'm11', code: '11', title: 'Invest in upgrades', description: 'Buy 3 business upgrades.', xp: 200, coins: 100, route: '/empire',
    progress: (s) => ({ current: Math.min(3, s.stats.upgradesBought), target: 3 }) },
  { id: 'm12', code: '12', title: 'Serve 500 customers', description: 'Become a known name in Novara Bay.', xp: 400, coins: 250, route: '/empire',
    progress: (s) => ({ current: Math.min(500, s.stats.customersServed), target: 500 }) },
];

export const isComplete = (p: Progress) => p.current >= p.target;

// ---------- Daily missions (reset each local calendar day) ----------
export interface DailyDef {
  id: string;
  title: string;
  xp: number;
  coins: number;
  route: string;
  progress: (s: GameState) => Progress;
}

export const DAILIES: DailyDef[] = [
  { id: 'run3', title: 'Run 3 business days', xp: 30, coins: 40, route: '/empire', progress: (s) => ({ current: Math.min(3, s.daily.daysRun), target: 3 }) },
  { id: 'answers', title: 'Answer 3 Academy questions correctly', xp: 30, coins: 30, route: '/academy', progress: (s) => ({ current: Math.min(3, s.daily.correctAnswers), target: 3 }) },
  { id: 'edit', title: 'Edit one of your websites', xp: 20, coins: 30, route: '/studio', progress: (s) => ({ current: Math.min(1, s.daily.siteEdits), target: 1 }) },
];

export const dailyKey = (date: string, id: string) => `daily:${date}:${id}`;

export const STREAK_REWARDS = [
  { days: 3, xp: 50, coins: 100 },
  { days: 7, xp: 150, coins: 300 },
  { days: 14, xp: 300, coins: 600 },
];

// ---------- Achievements (granted automatically) ----------
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  check: (s: GameState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'founder', title: 'Day One', description: 'Create your founder profile.', icon: 'flag', xp: 20, check: (s) => !!s.player },
  { id: 'restaurateur', title: 'Restaurateur', description: 'Open a restaurant.', icon: 'utensils', xp: 30, check: (s) => s.businesses.some((b) => b.category === 'restaurant') },
  { id: 'hotelier', title: 'Hotelier', description: 'Open a hotel.', icon: 'bed', xp: 30, check: (s) => s.businesses.some((b) => b.category === 'hotel') },
  { id: 'fashion', title: 'Fashion Founder', description: 'Open a clothing brand.', icon: 'shirt', xp: 30, check: (s) => s.businesses.some((b) => b.category === 'clothing') },
  { id: 'agency', title: 'Agency Owner', description: 'Open a digital agency.', icon: 'monitor', xp: 30, check: (s) => s.businesses.some((b) => b.category === 'agency') },
  { id: 'webdesigner', title: 'Web Designer', description: 'Publish a website.', icon: 'globe', xp: 30, check: (s) => s.stats.websitesPublished >= 1 },
  { id: 'perfectionist', title: 'Perfectionist', description: 'Reach a 100 website quality score.', icon: 'gem', xp: 100, check: (s) => s.stats.bestQuality >= 100 },
  { id: 'crowd', title: 'Crowd Pleaser', description: 'Serve 100 customers.', icon: 'users', xp: 60, check: (s) => s.stats.customersServed >= 100 },
  { id: 'profitable', title: 'In the Black', description: 'Earn 5,000 total revenue.', icon: 'trending', xp: 100, check: (s) => s.stats.revenueEarned >= 5000 },
  { id: 'scholar', title: 'Scholar', description: 'Complete every Academy lesson.', icon: 'graduation', xp: 150, check: (s) => s.stats.lessonsCompleted.length >= LESSONS.length },
  { id: 'mogul', title: 'Mogul', description: 'Own 4 businesses at once.', icon: 'crown', xp: 200, check: (s) => s.businesses.length >= 4 },
  { id: 'level5', title: 'Business Builder', description: 'Reach Founder Level 5.', icon: 'star', xp: 0, check: (s) => levelFromXp(s.xp) >= 5 },
  { id: 'streak3', title: 'On a Roll', description: 'Play 3 days in a row.', icon: 'flame', xp: 0, check: (s) => s.streak.count >= 3 },
];
