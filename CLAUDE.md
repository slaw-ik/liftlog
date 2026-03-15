# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run start          # Start Expo dev server
bun run ios            # Run on iOS simulator
bun run android        # Run on Android emulator

# Code quality (run before committing)
bun run check          # typecheck + lint + format:check (all at once)
bun run fix            # lint:fix + format (auto-fix all)
bun run typecheck      # tsc --noEmit
bun run lint           # eslint .
bun run format         # prettier --write

# Build
bun run prebuild       # expo prebuild (generates native projects)
bun run prebuild:clean # expo prebuild --clean (full regeneration)
```

No test suite is configured.

## Architecture

**LiftLog** is a React Native workout logging app built with Expo, TypeScript, and file-based routing via Expo Router.

### Provider Stack (`app/_layout.tsx`)

Providers nest in this order (outermost first):
1. `I18nProvider` — locale state; remounts entire tree on language change (uses React `key`)
2. `ThemeProvider` — NativeWind light/dark theme CSS variables
3. `AuthProvider` — Firebase auth state and Google OAuth
4. `SafeAreaProvider`

### Navigation

Expo Router file-based routing:
- `app/login.tsx`, `app/signup.tsx` — pre-auth screens
- `app/(tabs)/` — bottom-tab group (4 tabs): `index` (workout), `history`, `sections`, `profile`

### Data Layer (`lib/database.ts`)

Local-only SQLite (expo-sqlite). Schema: `workouts`, `exercises`, `sets`.

- `exercises` have an `i18n_key` column — default (built-in) exercises use a stable key like `"exercise.squat"` to resolve their display name through i18n; custom user-created exercises have `null` and use the raw name.
- `lib/fitness.ts` — E1RM calculations (Epley formula), volume, weekly stats.

### State Management

No Redux or Zustand. Uses React Context API only:
- `useAuth()` — Firebase user, loading state, Google sign-in
- `useI18n()` — `t()` translation function, `locale`, `setLocale`
- Component-level `useState` for UI state
- `AsyncStorage` for persisting locale preference

### i18n (`lib/i18n.ts`)

i18n-js with three locales: `en`, `ru`, `uk`. The file is large (~47KB) with nested translation keys. Default exercises/categories have i18n keys; user-created ones store raw names.

### Styling

NativeWind (Tailwind for React Native). Use Tailwind utility classes in JSX. Semantic color tokens are defined in `tailwind.config.js` (e.g., `bg-primary`, `text-muted-foreground`). Fonts: Inter (body), JetBrainsMono (mono).

### Authentication

Firebase + Google OAuth via `expo-auth-session`. Native clients for iOS/Android. Redirect URI: `com.liftlog-app.app:/oauthredirect`. See `docs/GOOGLE-SIGNIN.md` for OAuth setup.

## Code Conventions

- Imports are auto-sorted by `eslint-plugin-simple-import-sort` (run `bun run fix`)
- `console.log` is disallowed; use `console.warn` / `console.error`
- Strict TypeScript (`strict: true`); path alias `@/*` maps to project root
- Prettier: 100-char line width, single quotes, trailing commas, semicolons