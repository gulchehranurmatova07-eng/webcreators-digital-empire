# WEB-CREATORS: DIGITAL EMPIRE

**Build your digital empire.**

A business simulation and website creation game. You start as a beginner founder with 500 virtual coins in the fictional city of Novara Bay. From there you open businesses, design their websites, win customers, complete missions and learn real web and business skills.

## What's playable (v0.2)

| Area | What works |
|---|---|
| Welcome & founders | Animated city intro; choose Lisa (+20% website visibility), Charlotte (+5 satisfaction), Victor (+25% Academy rewards) or Jack (−20% campaign cost); 500 starting coins |
| Command Center | Status bar (wallet, income, expenses, profit, reputation, level, End day); animated night map of Novara Bay with your businesses on it; hexagon KPIs; Celestia advice; missions; achievements |
| Business Empire | 6 categories (Restaurant, Hotel, Clothing Brand, Digital Agency; Coffee Shop at Lv 3, Tech Startup at Lv 5); brand name, color and icon; 4 districts with different traffic and rent; hiring staff; 26 upgrades; 4 marketing campaigns; linking a website; daily simulation with a full cost breakdown; selling a business |
| Demo generator | One tap turns a business brand into a complete website in 3 styles (Signature, Bold, Luxe) with category-specific copy; preview it on phone or desktop, then "Build real version" |
| Business interiors | Animated scenes per category; tables grow with capacity, staff with hires, customers and reaction bubbles follow the real daily results |
| Website Studio | 6 templates (Luxe unlocks at Lv 3); layers panel, dotted canvas and inspector; add, duplicate, reorder and delete sections; undo/redo; edit text, items and images; theme (color, light/dark, font, corners); phone/desktop preview; autosave; publishing; Website Quality Score checklist that affects linked businesses |
| Missions | 12 story missions, 3 daily missions, streak bonuses with a forgiven grace day; every reward is claimable exactly once |
| Achievements & levels | 13 achievements, XP levels with coin bonuses, 6 founder ranks |
| Digital Academy | 9 lessons (HTML, CSS, Entrepreneurship) with multiple-choice and coding challenges, a live code preview and instant feedback |
| Profile, Settings, Wallet | Edit profile, stats, ranks, achievements, transaction history, reduce-motion setting, save export/import, progress reset |

## How the game stays honest

- **The game engine is separate from the screens.** All rules live in `src/engine`, written in pure TypeScript with no React. Screens send actions, and the engine decides what happens.
- **Every coin and XP point has a reason.** Each one is recorded in the ledger shown on the Wallet page.
- **No double rewards.** Each reward has a unique key, so the same reward can never be paid twice. Mission conditions are re-checked when you claim, and lesson answers are graded by the engine, not the screen.
- **The wallet never goes negative.** If a business can't pay its costs, its reputation drops instead.
- **Nothing is fabricated.** There are no fake players or leaderboards and no real-money payments. Celestia's tips come from fixed rules and use no paid AI service.

## Tech stack

React 19, TypeScript, Vite 8, Tailwind CSS 4, Zustand (state and local saving), Lucide icons and self-hosted fonts. Initial JavaScript is about 125 KB gzipped.

## Run it

```bash
npm install
npm run dev        # development server
npm test           # engine unit tests
npm run build      # production build into dist/
npm run preview    # serve the production build
```

## Project layout

```
src/
  engine/     game rules: economy, simulation, missions, lessons, website model (+ tests)
  store/      Zustand store, selectors, Celestia advisor
  app/        shell, navigation, hash router
  features/   screens: onboarding, dashboard, empire, studio, missions, academy, profile
  art/        procedural isometric art: city, interiors, website images (Canvas 2D)
  ui/         design-system components, HUD panels and icon registry
```

## Art and images

The city, interiors and website images are drawn in code at runtime, so the app ships no heavy image files and the art reacts to game state. Founder portraits live in `public/characters/` and the logo in `public/brand/`. Before publishing to app stores, make sure you have the rights to use the portrait images commercially.

## Next steps

- Russian and Uzbek translations
- Weekly missions
- Cloud accounts and server-validated saves (e.g. Supabase)
- Capacitor builds for Android and iOS
- Leaderboards (only once saves are server-validated)
