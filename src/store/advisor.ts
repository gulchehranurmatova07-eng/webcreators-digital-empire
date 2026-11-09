// CELESTIA — AI Business Companion (offline edition).
// Rule-based advice computed from real game state. No external AI service, no cost, no API keys.
import { CATEGORIES } from '../engine/config';
import { qualityScore } from '../engine/website';
import type { GameState } from '../engine/types';
import { claimableCount } from './selectors';

export interface Advice {
  title: string;
  body: string;
  action: string;
  route: string;
}

export function celestiaAdvice(g: GameState): Advice {
  const claimable = claimableCount(g);
  if (claimable > 0)
    return { title: `${claimable} reward${claimable > 1 ? 's' : ''} ready`, body: "You've completed mission goals. Claim the rewards to earn XP and coins.", action: 'Open missions', route: '/missions' };
  if (g.businesses.length === 0)
    return { title: 'Open your first business', body: `You have ${g.coins} coins. A Digital Agency (200) is cheap to start; a Restaurant (300) has steady demand.`, action: 'Choose a business', route: '/empire/new' };
  if (g.websites.length === 0)
    return { title: 'Your business is invisible online', body: `Generate a demo website for ${g.businesses[0].name} in one tap. A published, linked website raises visibility and conversion.`, action: 'Generate demo', route: `/empire/${g.businesses[0].id}/demo` };
  const draft = g.websites.find((w) => !w.published);
  if (!g.websites.some((w) => w.published) && draft)
    return { title: `Publish "${draft.name}"`, body: 'Draft websites do not attract customers. Publish it when it looks good.', action: 'Edit website', route: `/studio/${draft.id}` };
  const unlinked = g.businesses.find((b) => !b.websiteId);
  const freeSite = g.websites.find((w) => w.published && !g.businesses.some((b) => b.websiteId === w.id));
  if (unlinked && freeSite)
    return { title: `Link a website to ${unlinked.name}`, body: `"${freeSite.name}" is published but not connected to any business yet.`, action: 'Manage business', route: `/empire/${unlinked.id}` };
  for (const b of g.businesses) {
    const last = b.history[b.history.length - 1];
    if (last && last.turnedAway >= 3)
      return { title: `${b.name} is overloaded`, body: `${last.turnedAway} ${CATEGORIES[b.category].customerWord} were turned away yesterday. Hire staff or expand capacity.`, action: 'Manage business', route: `/empire/${b.id}` };
    if (last && last.profit < 0)
      return { title: `${b.name} lost ${-last.profit} coins`, body: 'Check the daily report: are wages or rent too high for your demand? Marketing or a better website can raise demand.', action: 'View report', route: `/empire/${b.id}` };
  }
  const weak = g.websites.find((w) => w.published && qualityScore(w) < 75);
  if (weak)
    return { title: `Improve "${weak.name}"`, body: `Its quality score is ${qualityScore(weak)}/100. The Studio checklist shows exactly what to fix.`, action: 'Improve website', route: `/studio/${weak.id}` };
  if (g.stats.lessonsCompleted.length < 3)
    return { title: 'Sharpen your skills', body: 'Academy lessons pay XP and coins — and teach real HTML, CSS and business basics.', action: 'Go to Academy', route: '/academy' };
  return { title: 'Keep the empire running', body: 'Run more days to earn profit, then reinvest in upgrades, campaigns or a new business.', action: 'View empire', route: '/empire' };
}
