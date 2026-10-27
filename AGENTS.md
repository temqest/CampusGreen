This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Mobile UI & Design Standards (Crucial)

- **Mobile First, Not a Website**: Mobile apps do NOT have website topbars, navigation headers on onboarding, or endless scrolling marketing pages. Keep onboarding to a single, focused viewport with thumb-friendly bottom action buttons.
- **Zero AI Art & Zero Sparkles**: Never generate or use AI artwork. Avoid sparkle icons, celebratory emoji clutter, and decorative visual noise. Construct all visuals using native shapes, clean vector icons (`@expo/vector-icons`), and typography.
- **Zero Decorative Badges / Pills**: Badges are strictly reserved for dynamic, actionable item or transaction state (e.g., "Reserved", "Pending Pickup"). Never sprinkle pills or status tags as decorative filler or section headers.
- **Thumb Zone Ergonomics**: Center short forms vertically (`centerWrapper: { flex: 1, justifyContent: 'center' }`) so inputs and primary CTAs sit in the natural thumb arc. Place secondary/SSO actions (like Google Sign-In) at the bottom. Never use `justifyContent: 'space-between'` on scrollable views.
- **Zero Pre-Selection Invariant**: Options, filters, and onboarding preferences must never be auto-selected or pre-checked by default. Initialize to empty (`[]`, `''`) and let users deliberately choose.
- **Strictly No Guest Mode**: CampusGreen is a verified student-only community. Never provide guest browsing pathways.
- **Restraint Over Fluff**: Avoid cluttering screens with fake stats, marketing pills, or unverified claims. Keep copy honest, warm, and concise.
- **Inviting Vector Hero Motifs**: Do not leave hero sections as empty boxes. Use balanced, warm native vector motifs (like the 3-circle community motif).
- **Stutter-Free Loop Animations & Focus Resilience**: Never run desynchronized sequence loops. Always use a single normalized linear driver (`0 → 1`) with closed-cycle interpolation (`0 → -x → 0 → x → 0`) on `useNativeDriver: true`. In React 19, initialize values via `useState(() => new Animated.Value(...))`. On screens in the navigation stack, manage loops via `useFocusEffect` and an `AppState` listener so animations cleanly restart when popping back from pushed screens.

## End-of-Session Learning Protocol

- At the end of every session, review any user corrections, design feedback, or architectural constraints and update `learning.md` so that future agent sessions retain and build upon these lessons.


