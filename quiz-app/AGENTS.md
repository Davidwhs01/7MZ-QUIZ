# AGENTS.md — Geek Arena (7MZ QUIZ)

> **This is Next.js 16 with breaking changes.** APIs, conventions, and file structure may differ from older versions. Check `node_modules/next/dist/docs/` when unsure.

## Project Overview

Music quiz app ("Geek Arena") built for two YouTube music channels: **7 Minutoz** (7MZ) and **Enygma**. Players guess songs by listening to audio snippets from YouTube. Built with Next.js 16 App Router, React 19, TypeScript, Supabase (auth + DB), Framer Motion, CSS Modules.

## Commands

All commands run from `quiz-app/`:

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint (eslint-config-next + core-web-vitals + typescript)
```

No test framework is configured. Lint is the only automated check — **always run `npm run lint` and `npm run build` after changes.**

Node scripts in the project root (`fetch_durations.js`, `fetch_playlist.js`, etc.) are data utilities run directly with `node <script> <args>`.

## Project Structure

```
quiz-app/src/
├── app/                  # App Router pages (each folder = route)
│   ├── page.tsx          # Home lobby
│   ├── play/             # Quiz gameplay
│   ├── profile/          # User profile
│   ├── ranking/          # Global ranking
│   └── auth/callback/    # Supabase OAuth callback
├── components/
│   ├── game/             # Game UI (SearchBar)
│   └── home/             # Lobby cards (Login, Ranking, ChannelSelector, BottomDrawer)
├── context/              # React Contexts (ChannelContext)
├── data/                 # Static data (songs.ts — ~430 entries)
├── hooks/                # Custom hooks (useGameState, useYouTubePlayer)
├── lib/                  # Core logic (game-logic.ts, audio-effects.ts)
├── middleware.ts          # Supabase session refresh
└── utils/supabase/       # Supabase client, server, gameActions
```

## Code Style

### Imports
- Use `@/` path alias for all internal imports (`@/data/songs`, `@/hooks/useGameState`)
- Group: React/Next first, then third-party, then internal
- Named exports preferred for utilities; default exports for components

### Components
- `'use client'` directive at the top of any file using hooks, state, or browser APIs
- CSS Modules for styling (`Component.module.css`) — **no inline styles** except one-off dynamic values
- Default export per component file; filename matches component name (PascalCase)

### Types
- TypeScript `strict: true` — avoid `any`, use proper types
- Define interfaces in the same file where they're consumed, or in `data/songs.ts` for shared types
- Supabase query results: cast with explicit interfaces, not `as any`
- Key shared types: `Song`, `SongCategory`, `Artist` (in `@/data/songs`)

### Naming
- Components: `PascalCase` (e.g., `SearchBar`, `GlobalRankingCard`)
- Hooks: `use` prefix (e.g., `useGameState`, `useYouTubePlayer`)
- CSS classes: `camelCase` in modules (e.g., `styles.categoryCard`)
- Song IDs: `kebab-case` (e.g., `"naruto-demonio"`)

### State & Hooks
- Prefer `useCallback` / `useMemo` for functions passed as props or used in effects
- Refs for mutable values that shouldn't trigger re-renders (e.g., `hasStartedRef`, `feedbackTimerRef`)
- Never call `setState` synchronously inside an effect body — use callbacks or event handlers

### Error Handling
- Supabase calls: destructure `{ data, error }`, check `error` before using `data`
- YouTube player: wrap in try/catch, provide fallback durations
- Show loading states while async operations are in flight

## Data Model

- **songs.ts**: Local database of ~430 songs. Each has `id`, `title`, `youtubeId`, `duration` (0 = unknown), `category`, `artist`, `searchTerms[]`. Optional: `introSkip`, `outroBuffer` for per-song gate config.
- **Supabase tables**: `profiles`, `leaderboard` (global highscore), `match_history` (per-game records with `artist` column)
- **No tests exist** — if adding tests, use Vitest (compatible with Next.js + TypeScript)

## Important Notes

- YouTube player is hidden (0×0 iframe) — audio only. Errors 150/101/2 trigger auto-skip.
- `duration: 0` songs require `getRealDuration()` at runtime (slow). Run `node fetch_durations.js <API_KEY>` to populate.
- The `category` field is the "selo musical" (NERD HITS, 7MZ RECORDS, ENYGMA). The `artist` field is the channel (7MZ, ENYGMA). Keep them distinct.
- Gate defaults: skip first 30s, skip last 20s. Override per-song with `introSkip`/`outroBuffer`.
