// Tiny router. The current path lives in memory and is mirrored to the URL hash when the
// host allows it. Navigation therefore works on any static host, inside a Capacitor app,
// and inside sandboxed preview frames that restrict hash changes.
import { useSyncExternalStore } from 'react';

const readHash = () => (location.hash.startsWith('#/') ? decodeURI(location.hash.slice(1)) : null);

let current = readHash() ?? '/dashboard';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

window.addEventListener('hashchange', () => {
  const h = readHash();
  if (h && h !== current) { current = h; emit(); }
});

const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };

export const useRoute = () => useSyncExternalStore(subscribe, () => current, () => '/dashboard');

export function navigate(path: string) {
  if (path === current) return;
  current = path;
  try { location.hash = path; } catch { /* host blocks hash changes: memory routing still works */ }
  emit();
  window.scrollTo({ top: 0 });
}

/** Match "/empire/:id" style patterns. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export const NAV = [
  { path: '/dashboard', label: 'Dashboard', short: 'Home', icon: 'home' },
  { path: '/empire', label: 'Business Empire', short: 'Empire', icon: 'building' },
  { path: '/studio', label: 'Website Studio', short: 'Studio', icon: 'template' },
  { path: '/missions', label: 'Missions', short: 'Missions', icon: 'target' },
  { path: '/academy', label: 'Digital Academy', short: 'Academy', icon: 'graduation' },
] as const;
