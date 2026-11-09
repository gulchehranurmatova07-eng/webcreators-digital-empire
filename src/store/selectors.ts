import { levelFromXp, MAX_LEVEL, rankForLevel, xpForLevel } from '../engine/config';
import { DAILIES, MISSIONS, dailyKey, isComplete } from '../engine/missions';
import type { GameState } from '../engine/types';

export function levelInfo(xp: number) {
  const level = levelFromXp(xp);
  const cur = xpForLevel(level);
  const next = level >= MAX_LEVEL ? cur : xpForLevel(level + 1);
  return { level, rank: rankForLevel(level), into: xp - cur, needed: next - cur, nextAt: next, max: level >= MAX_LEVEL };
}

export const missionClaimable = (g: GameState, id: string) => {
  const m = MISSIONS.find((x) => x.id === id)!;
  return !g.claimed[`mission:${m.id}`] && isComplete(m.progress(g));
};

export const claimableCount = (g: GameState) =>
  MISSIONS.filter((m) => missionClaimable(g, m.id)).length +
  DAILIES.filter((d) => !g.claimed[dailyKey(g.daily.date, d.id)] && isComplete(d.progress(g))).length;

export const unreadCount = (g: GameState) => g.notifications.filter((n) => !n.read).length;

export const timeAgo = (ts: number, now = Date.now()) => {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
