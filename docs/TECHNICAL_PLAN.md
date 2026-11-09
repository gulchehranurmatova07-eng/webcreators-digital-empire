# WEB-CREATORS: DIGITAL EMPIRE — Technical Plan (Phase 0)

_Status: **proposal — awaiting founder approval**. No application code has been written yet._
_Date: 2026-11-09_

---

## 1. Repository inspection report

| Item | Finding |
|---|---|
| Commits | **None.** The repository is empty (no files, no history). |
| Remote branches | **None.** `origin` has no refs; `main` does not exist yet. |
| Working branch | `claude/compassionate-clarke-4qv483` (this plan is its first commit). |
| Existing stack | None — nothing to preserve, migrate or overwrite. |
| Cloud dev environment | Node 22, npm 10, pnpm 10, headless Chromium + Playwright available for automated UI testing and screenshots. |
| Founder hardware | Windows 10, 8 GB RAM → all building, testing and mobile packaging will run in the cloud (this environment + GitHub Actions). The founder only needs a browser. |

**Conclusion:** we are starting from zero, so we can choose the architecture deliberately instead of working around legacy decisions.

---

## 2. Recommended architecture (in plain language)

The single most important decision: **the game's rules live in a separate "engine" that knows nothing about screens.**

```
┌──────────────────────────────────────────────────────────┐
│  UI layer (React screens & components)                   │
│  - shows state, sends ACTIONS ("buy upgrade X")          │
└──────────────┬───────────────────────────────────────────┘
               │ actions                ▲ new state
               ▼                        │
┌──────────────────────────────────────────────────────────┐
│  Game engine (pure TypeScript, no React, no browser)     │
│  - economy, XP/levels, missions, business simulation     │
│  - deterministic: same state + same action = same result │
│  - every coin/XP change is a ledger entry with a reason  │
└──────────────┬───────────────────────────────────────────┘
               │ save / load
               ▼
┌──────────────────────────────────────────────────────────┐
│  Persistence adapter                                     │
│  - v1: local device storage (versioned save format)      │
│  - Phase 7: Supabase cloud — the SAME engine runs on the │
│    server and validates every action (anti-cheat)        │
└──────────────────────────────────────────────────────────┘
```

Why this matters for WEB-CREATORS:

1. **Honest numbers.** Every coin and XP point is recorded in a transaction ledger with a reason (`mission:first-website`, `upgrade:seo-basic`). Nothing is decorative; the dashboard simply reads the ledger.
2. **Cheat-proof cloud saves later.** In Phase 7 the phone sends *"I completed lesson 4"*, not *"my balance is 99,999"*. The server re-runs the same engine code and decides the result. Because the engine is pure TypeScript, we write the rules once and use them in both places.
3. **No reward exploits.** Each reward has a unique key (e.g. `mission:M01`, `daily:2026-11-09:login`). The engine refuses to pay the same key twice.
4. **Testable.** We can run thousands of automated checks on the economy (e.g. "can a player go bankrupt in a way they can't recover from?") without opening a browser.
5. **Save migrations.** Saves carry a version number, so updates never wipe a player's progress.

### Business simulation model (summary)
- Each business has stats: **reputation, satisfaction, visibility, capacity, weekly costs**.
- Customers per in-game day = f(visibility × website quality × reputation), capped by capacity (staff/space).
- Revenue = customers × average ticket (by category) − costs (staff, rent, marketing).
- Upgrades have clear, displayed effects ("Online reservations: +15% conversion, −2 coins/day").
- Time advances in game days while the app is open; offline progress is **capped** (e.g. max 8 hours) and shown in a "while you were away" report, so there is no money "from nowhere" and no pressure to play constantly.

### Website Creator model
- A website is **structured JSON** (list of sections: navigation, hero, menu/products, gallery, call-to-action, footer) plus a theme (fonts, colors).
- One renderer draws it in the editor, in mobile/desktop preview, and inside the business.
- Players never write raw HTML into the page → no security holes (XSS), and saved sites stay small.
- A transparent **Website Quality Score** (has a clear heading, a call-to-action, readable contrast, mobile-friendly, menu present…) feeds directly into the business's customer conversion. Building a better site visibly earns a better business — this ties the two game modes together.

---

## 3. Recommended technology stack

| Need | Choice | Why (simple version) |
|---|---|---|
| UI framework | **React 19 + TypeScript** | Industry standard, huge ecosystem, TypeScript catches mistakes before players see them. |
| Build tool | **Vite 8** | Very fast, small output, light on resources. |
| Styling | **Tailwind CSS 4** with our own design tokens | Consistent premium look, tiny CSS output; brand colors defined once. |
| State management | **Zustand 5** (≈1 KB) wrapping the engine | Simple, fast; the store only holds engine state and dispatches actions. Redux would be heavier than we need. |
| Routing | **React Router** | Standard screen navigation, works inside Capacitor. |
| Translations | **Small in-house typed i18n** (no library) | English/Russian/Uzbek dictionaries checked at compile time — a missing translation key is a build error. Uses the browser's built-in `Intl.PluralRules` for correct Russian plurals. Saves ~40 KB vs. i18next; we can switch later if we need advanced features. |
| Validation | **Zod** | Validates player input (business names, editor text) and save files. |
| Icons | **Lucide** (tree-shaken, only icons we use are bundled) | Clean professional line icons, consistent style. |
| Unit tests | **Vitest** | Tests the engine/economy rules. |
| UI tests | **Playwright** (already available in the cloud) | Clicks through real screens on phone & desktop sizes, takes screenshots for review. |
| Cloud backend (Phase 7) | **Supabase** (recommended over Firebase) | Real Postgres database with row-level security, built-in auth, Edge Functions (TypeScript — can run our engine), generous free tier, easy data export. |
| Mobile (Phase 8) | **Capacitor 8** | Wraps the same web app as Android/iOS apps. Android builds run on **GitHub Actions** — no Android Studio on the laptop. |
| Hosting for previews | GitHub Pages / Cloudflare Pages (free) | A link you can open on your phone after each milestone. |

**Deliberately NOT used in v1:** heavy animation libraries (CSS transitions are enough and cheaper on budget phones), UI component kits (we build our own branded kit), any paid AI service, real-time multiplayer, payment SDKs.

---

## 4. Folder structure

```
webcreators-digital-empire/
├── docs/                       # plan, roadmap, game-design & economy docs
├── public/                     # static icons, optimized images
├── src/
│   ├── app/                    # app shell, router, providers, layout (sidebar / bottom nav)
│   ├── engine/                 # PURE game logic — no React imports allowed
│   │   ├── core/               #   state types, action dispatcher, ledger, RNG (seeded)
│   │   ├── player/             #   XP, levels, ranks
│   │   ├── economy/            #   coins, transactions, prices
│   │   ├── business/           #   categories, upgrades, staff, customer simulation
│   │   ├── website/            #   site schema, templates, quality score
│   │   ├── missions/           #   missions, daily/weekly, achievements, streaks
│   │   ├── learning/           #   lesson definitions & grading
│   │   └── save/               #   versioned save format + migrations
│   ├── features/               # UI per feature (screens + feature components)
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── tycoon/
│   │   ├── website-creator/
│   │   ├── missions/
│   │   ├── learning/
│   │   ├── profile/
│   │   └── settings/
│   ├── ui/                     # reusable branded components (Button, Card, Stat, ProgressBar, Modal, EmptyState…)
│   ├── i18n/                   # en.ts (source of truth), ru.ts, uz.ts, typed t() helper
│   ├── store/                  # Zustand store wrapping the engine + persistence
│   ├── services/               # adapters: storage, (later) supabase, (later) AI assistant
│   └── styles/                 # Tailwind entry + design tokens
├── tests/e2e/                  # Playwright journeys
└── .github/workflows/          # CI: typecheck, lint, unit tests, build (later: Android build)
```

Rule enforced by lint: `src/engine/**` may not import React, the browser, or the store. That keeps the engine server-compatible.

---

## 5. Development roadmap

| Phase | Deliverable | "Done" means |
|---|---|---|
| 0 | Inspection + this plan | Founder approves. |
| **1** | **Visual foundation** (see §9) | Branded shell, welcome, navigation, live dashboard in 3 languages, CI green. |
| 2 | Player system | Profile, avatar, coins/XP/levels/ranks, transaction history, versioned local saves, export/import save file. |
| 3 | Business tycoon | 6 categories, creation flow, upgrades, staff, marketing, day simulation, performance charts. |
| 4 | Website creator | Templates, section editor, theme editing, mobile/desktop preview, quality score linked to businesses. |
| 5 | Missions & achievements | Missions M01–M05+, daily/weekly, streaks with "grace days", unlockable templates. |
| 6 | Learning center | Lessons with interactive challenges (HTML/CSS/JS/SEO/marketing/branding) + XP. |
| 7 | Cloud backend | Supabase auth, server-validated actions, sync, account deletion, privacy controls. Leaderboards architecture (real data only). |
| 8 | Mobile | Capacitor, Android build via GitHub Actions, iOS via cloud macOS. |
| 9 | Testing | Responsive, accessibility (WCAG AA contrast, keyboard, screen reader), performance budget on low-end Android, security review. |
| 10 | Publication | Store listings, privacy policy, age rating, data-safety forms. |

Celestia (AI companion) is designed as an interface in Phase 2–6 with **scripted, offline hints** (free). Connecting a real AI model is a separate, explicitly approved step after Phase 7 (keys must live on the server).

---

## 6. Dependency list (Phase 1 only)

Runtime: `react`, `react-dom`, `react-router`, `zustand`, `zod`, `lucide-react`
Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@playwright/test`, `eslint` + `typescript-eslint` + `eslint-plugin-react-hooks`, `prettier`

Fonts: self-hosted (no Google Fonts call at runtime → works offline and respects privacy). Proposal: **Space Grotesk** (headings, technical/brand feel) + **Inter** (body, excellent Cyrillic support for Russian; Latin for Uzbek).

Added later only when needed: `@supabase/supabase-js` (Phase 7), `@capacitor/*` (Phase 8). Versions will be pinned in `package.json` + lockfile and checked for compatibility at install time.

**Performance budget:** initial JavaScript ≤ 150 KB gzipped; first screen interactive in < 3 s on a mid/low-end Android phone over 4G.

---

## 7. Estimated service costs

All figures approximate; current pricing will be re-checked before anything is enabled.

| Service | When | Cost |
|---|---|---|
| GitHub (repo, Actions CI, Pages previews) | Now | **$0** (free tier is enough for this project) |
| Supabase | Phase 7 | **$0** free tier during development (projects pause after ~1 week of inactivity); **~$25/month** Pro at launch for reliability and backups |
| Google Play developer account | Phase 10 | **$25 one-time** |
| Apple Developer Program | Phase 10 | **$99/year** |
| iOS cloud builds (GitHub macOS runners or Codemagic) | Phase 8 | Free tier likely sufficient early; ~$0–$50/month at scale |
| Domain (e.g. for privacy policy / website) | Phase 10 | ~$10–15/year |
| AI for Celestia | Only after approval | Pay-per-use. Needs per-player rate limits and a monthly spending cap; we will model the cost per active player before enabling it. |

**Total until launch: effectively $0.** First unavoidable costs are the store accounts.

---

## 8. Technical risks & limitations

| Risk | Impact | Mitigation |
|---|---|---|
| Scope is very large | Unfinished, shallow features | Strict phases; each phase is playable and tested before the next. |
| Local saves can be cheated before Phase 7 | Leaderboards would be meaningless | No leaderboards until server-validated actions exist. Local single-player cheating harms no one. |
| Local saves can be lost (cleared browser data, iOS storage eviction) | Players lose progress | Versioned saves + "export/import save" in Phase 2; cloud sync in Phase 7. |
| Economy balance | Game too easy/boring or too grindy | Economy constants in one file; automated simulations of 30 in-game days in tests; tuning passes. |
| Budget Android performance | Laggy feel, battery drain | Use glass/blur effects sparingly (expensive on weak GPUs), respect "reduce motion", performance budget, test on throttled CPU. |
| Translation quality (RU, UZ) | Unprofessional impression | AI-drafted translations marked for **native-speaker review**; Uzbek script choice needed (see questions). |
| Audience includes teenagers | Store policy & privacy law (COPPA / GDPR) | Recommend 13+ rating; collect minimal data; no chat or user-generated public content until moderation exists. |
| Brand/trademark | Store rejection or disputes | Quick trademark search on "WEB-CREATORS" / "Digital Empire" before store submission. |
| iOS builds require macOS | Cannot build from Windows locally | Cloud macOS builds (Phase 8). |
| The AI companion costs money per message | Uncontrolled spending | Server-side proxy, rate limits, spending caps, opt-in only. |

---

## 9. PHASE 1 proposal — Visual Foundation

**Goal:** a polished, running app you can open on your phone, whose dashboard shows *real* starting state (not mock numbers).

Scope:
1. **Project scaffold** — Vite + React + TS + Tailwind, linting, formatting, unit tests, Playwright smoke test, GitHub Actions CI.
2. **Design system** — color tokens (#050A14, #071426, #1E6BFF, #58A6FF, neutrals), typography scale, spacing, radii, elevation, focus rings; components: Button, Card (subtle glass), StatTile, ProgressBar, Badge, Avatar, Modal, Toast, EmptyState, Skeleton loader. A `/design` page showcasing them for review.
3. **Brand** — WEB-CREATORS wordmark + app icon (original SVG), "BUILD YOUR DIGITAL EMPIRE." tagline.
4. **Welcome & onboarding** — intro screen → choose founder name (validated) and avatar → enter the dashboard.
5. **App shell & navigation** — sidebar on desktop, bottom tab bar on mobile: Dashboard, Empire (Tycoon), Studio (Website Creator), Missions, Academy (Learning), Profile. Not-yet-built sections show an honest, designed "Coming in Phase X" state — no fake buttons.
6. **Dashboard (live)** — founder card (level 1, Beginner Founder, 0 XP + level progress), wallet (500 coins, clearly labelled virtual), stats (0 businesses, 0 websites), active missions (M01–M05 shown as goals; reward logic arrives in Phase 5), achievements (empty state), notifications (welcome message), daily progress.
7. **Minimal engine + store** — initial player state, level/rank formula, ledger with the starting-grant transaction, local persistence with save versioning. (This is a thin slice of Phase 2, needed so the dashboard isn't decorative.)
8. **i18n** — English, Russian, Uzbek for every Phase 1 string; language switcher in settings; remembers choice.
9. **Accessibility & responsiveness** — WCAG AA contrast, keyboard navigation, `prefers-reduced-motion`, tested at 360 px, 768 px and 1440 px widths.
10. **Preview** — screenshots of every screen in all three languages for your review, plus a deploy preview link if you approve GitHub Pages.

Out of scope for Phase 1: businesses, editor, mission rewards, lessons, backend, mobile packaging.

---

## 10. Decisions needed from the founder

1. **Approve** the architecture (§2) and stack (§3)?
2. **Uzbek script:** Latin (official, recommended) or Cyrillic — or both?
3. **Minimum age:** 13+ (recommended) or younger audience (requires stricter privacy design)?
4. **Previews:** OK to publish a free preview site via GitHub Pages (makes the repo's build publicly viewable at a URL)?
