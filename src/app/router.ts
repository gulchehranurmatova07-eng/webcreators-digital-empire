// Tiny hash router: works on any static host and inside a future Capacitor app, with zero dependencies.
import { useSyncExternalStore } from 'react';

const getPath = () => (location.hash.replace(/^#/, '') || '/dashboard');

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export const useRoute = () => useSyncExternalStore(subscribe, getPath, () => '/dashboard');

export function navigate(path: string) {
  if (getPath() === path) return;
  location.hash = path;
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
