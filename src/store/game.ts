// Zustand store: holds engine state, persists it locally, and turns engine events into toasts.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as E from '../engine/engine';
import type { GameEvent, GameState } from '../engine/types';
import { GameError } from '../engine/types';

export interface Toast {
  id: number;
  kind: 'reward' | 'error' | 'info' | 'achievement';
  title: string;
  body?: string;
}

interface Store {
  game: GameState;
  toasts: Toast[];
  levelUp: number | null;
  /** Run an engine action. Returns true on success; errors become toasts. */
  act: (fn: (s: GameState, ctx: { now: number }) => { state: GameState; events: GameEvent[] }) => boolean;
  dismissToast: (id: number) => void;
  dismissLevelUp: () => void;
  replaceGame: (g: GameState) => void;
  reset: () => void;
}

let toastId = 0;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      game: E.createInitialState(),
      toasts: [],
      levelUp: null,
      act: (fn) => {
        try {
          const { state, events } = fn(get().game, { now: Date.now() });
          const toasts: Toast[] = [];
          let levelUp: number | null = get().levelUp;
          for (const e of events) {
            if (e.type === 'reward') {
              const parts = [e.xp ? `+${e.xp} XP` : '', e.coins ? `+${e.coins} coins` : ''].filter(Boolean).join(' · ');
              toasts.push({ id: ++toastId, kind: 'reward', title: parts || 'Reward', body: e.label });
            } else if (e.type === 'levelUp') levelUp = e.level;
            else if (e.type === 'info') toasts.push({ id: ++toastId, kind: 'info', title: e.message });
          }
          const keep = toasts.some((t) => t.kind === 'info') ? get().toasts.filter((t) => t.kind !== 'info') : get().toasts;
          set({ game: state, toasts: [...keep, ...toasts].slice(-3), levelUp });
          return true;
        } catch (err) {
          const msg = err instanceof GameError ? err.message : 'Something went wrong. Your progress is safe.';
          if (!(err instanceof GameError)) console.error(err);
          set({ toasts: [...get().toasts.filter((t) => t.title !== msg), { id: ++toastId, kind: 'error' as const, title: msg }].slice(-3) });
          return false;
        }
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
      dismissLevelUp: () => set({ levelUp: null }),
      replaceGame: (g) => set({ game: g }),
      reset: () => set({ game: E.createInitialState(), toasts: [], levelUp: null }),
    }),
    {
      name: 'webcreators-save',
      version: E.SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ game: s.game }),
      merge: (persisted, current) => {
        try {
          const g = E.validateSave((persisted as { game?: unknown })?.game);
          return { ...current, game: g };
        } catch {
          return current;
        }
      },
    },
  ),
);

export const useGame = <T,>(sel: (g: GameState) => T) => useStore((s) => sel(s.game));
export const act = (fn: Parameters<Store['act']>[0]) => useStore.getState().act(fn);
