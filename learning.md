# CampusGreen Connect — Design & Architecture Learnings

This document captures project-specific design standards, user preferences, and hard architectural constraints learned from active feedback. **Always read this file before designing or modifying UI in this project.**

---

## 1. Core Principles: Mobile App vs. Website

- **This is a native mobile app, NOT a marketing website**:
  - Never design mobile screens with desktop/website tropes.
  - Screens must **never have website-style topbars, headers, or navbars** on onboarding, auth, or standalone modal views.
  - Onboarding and welcome screens must fit within a **single mobile viewport** without unnecessary vertical scrolling.
  - Avoid SaaS bento grids, lengthy marketing feature matrices, or long web-style landing page sections on mobile screens.
  - Primary action buttons belong in a clean, thumb-friendly **bottom dock** (`Get Started`, `Log In`).
  - Keep screens strictly focused on a **single user objective** (no "kitchen sink" screens trying to do auth, marketing, trust badges, and directory browsing at the same time).

---

## 2. App-Wide Anti-Patterns (What NOT to Do Across the ENTIRE App)

- ❌ **No Excessive or Decorative Pill Badges**:
  - Do NOT sprinkle decorative status pills, category pills, or meta chips above headings or inside cards (e.g. `"Student Portal"`, `"Step 1 of 3"`, `"Campus-Verified"`).
  - Pills and badges create severe visual noise and feel like generic AI-generated filler.
  - **Rule**: Badges are strictly reserved for **dynamic, actionable item or transaction state** (e.g., `"Reserved"`, `"Pending Pickup"`, `"Free"`). Never use them as decorative labels or section headers.
- ❌ **No Sparkle Emojis or Decorative Icon Flourishes**:
  - Never use sparkle icons (`sparkles`), celebratory emoji clusters, or decorative flair.
- ❌ **No Information Overload or Marketing Fluff**:
  - Do not bombard the user with excessive text, fake statistics (e.g., `"1,420+ active peers"`), simulated card clutter, or marketing callouts (e.g., `"Campus-Verified Members"` boxes). Keep copy authentic, human, and concise.
- ❌ **No Auto-Selected / Pre-Checked Options (Clean Slate Invariant)**:
  - Never auto-check, pre-select, or default-highlight options in multi-choice lists, filter drawers, onboarding questions, or category selectors.
  - The app must never assume the student's choices; selections must start clean (`[]`, `''`, `null`). The user must make deliberate, active choices.
- ❌ **No Guest Access / Explore as Guest**:
  - CampusGreen is strictly a student-only verified marketplace. Guest mode breaks the primary objective of safety, accountability, and student trust. Never provide guest browsing pathways.
- ❌ **No Fake Verification Roadblocks in PoC**:
  - Do not stall early-stage user onboarding with mock PIN verification codes, simulated student ID scanner hurdles, or fake KYC walls. Focus on the core exchange value: discovering items, matching student needs, and trading gear.
- ❌ **No Top-Heavy Alternative SSO Buttons**:
  - Never place alternative login/sign-up actions (like Google Sign-In) at the top of forms. They belong at the **bottom**, within easy thumb reach.
- ❌ **No `justifyContent: 'space-between'` on ScrollViews**:
  - Never use `space-between` on scrollable form containers. On tall phone screens, it creates grotesque vertical gaps between fields, buttons, and helper links. Use explicit spacing tokens (`gap: 16`, `gap: 24`).
- ❌ **No Desynchronized Multi-Loop Animations**:
  - Never run multiple independent `Animated.sequence` or `Animated.loop` timers with varying durations. They drift out of phase and stutter at loop boundaries.

---

## 3. App-Wide Best Practices (What TO Do Across the ENTIRE App)

- ✅ **Generous Breathing Room & Clean Spacing**:
  - Give elements room to breathe. Use whitespace with confidence. Avoid cramming 5 different UI concepts onto one mobile viewport.
- ✅ **Ergonomic Thumb-Reach Zone Geometry**:
  - **Compact Views / Short Forms**: Wrap in an internal centering container (`centerWrapper: { flex: 1, justifyContent: 'center' }`) so inputs and primary actions land naturally in the middle of tall phone screens where the thumb rests comfortably without top-edge strain.
  - **Bottom Docking**: Place primary call-to-action buttons in a pinned bottom dock with safe area insets.
  - **SSO Actions at the Bottom**: Position "Continue with Google" / alternative auth buttons at the lower portion of the screen (under primary CTA and divider).
- ✅ **Strict Mobile Grid & Responsive Structure**:
  - Never rely on unwrapped horizontal chip rows that overflow on narrow phone screens.
  - Use structured segmented controls with `flex: 1` per cell for small sets (e.g. 4-item year selector), or full-width list cards with clear radio/checkbox indicators for long lists.
  - Ensure all touch targets meet or exceed minimum accessibility dimensions (min 44x44px, preferably 48-52px height).
- ✅ **Harmonious Vector Visual Motifs**:
  - Build warm, balanced geometric or iconography compositions using native React Native components (e.g., the connected 3-circle community motif representing academics, sustainability, and student exchange).
- ✅ **Warm, Honest Editorial Copy**:
  - Clear app title: `CampusGreen`
  - Welcoming, grounded headline: *"Where campus gear finds a second life."*
  - Concise 1–2 sentence description of what the app actually does.
- ✅ **Single-Driver Seamless Animations & Screen Focus Resumption**:
  - Use **one continuous linear loop driver** (`0 → 1`) running on the native driver (`useNativeDriver: true`).
  - Derive movements via **closed-cycle sinusoidal interpolation** (`[0, 0.25, 0.5, 0.75, 1] → [0, -6, 0, 6, 0]`) so the loop starts and ends at the identical value, eliminating all stutter, velocity jumps, and reset hitches.
  - In React 19, initialize animated values with `useState(() => new Animated.Value(...))` to avoid `Cannot access refs during render` compiler/linter warnings.
  - **Screen Focus Resilience**: When navigating away to stacked screens (e.g., from landing to auth) and back, `react-native-screens` halts background native driver animations, and `useEffect` does NOT re-run because the screen was never unmounted. Always bind loop animations to `useFocusEffect` (from `expo-router`) with an `AppState` listener. Reset and restart the loop on screen focus, and separate one-shot entrance animations (using an `isFirstMount` ref) so they do not stutter or freeze.

---

## 4. Auth & Onboarding Flow Standards

- **Frictionless Sign-Up**:
  - Collect only essential credentials (Full Name, Student Email, Password, Confirm Password). Defer academic details and preferences to the onboarding steps.
  - Include "Sign up with Google" / "Log in with Google" at the bottom of the form.
- **Mobile Spacing Hierarchy & Keyboard Safety**:
  - For short auth screens (Log In, Forgot Password), center content vertically.
  - Wrap in `KeyboardAvoidingView` (`Platform.OS === 'ios' ? 'padding' : undefined`) paired with `ScrollView` having `keyboardShouldPersistTaps="handled"`.
  - Set `keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}` so the screen glides smoothly when the software keyboard opens.
- **Student-Needs Focused Onboarding**:
  - Focus onboarding purely on student needs and discovery preferences:
    1. **Step 1: Academic Focus**: Year level (4-column segmented control) and Degree Program (searchable list).
    2. **Step 2: Needed Items**: Textbooks & Reviewers, Uniforms & Scrubs, Tools & Lab Equipment, Dorm & Room Essentials, Tech & Study Gadgets.
    3. **Step 3: Trade Preferences**: Buy at Student Prices, Swap Zone (Barter without cash), Pay-It-Forward (Free supplies), Pass Down Old Gear.
  - **No Pre-Selections**: Initialize all choices to empty (`[]` or `''`). The user chooses deliberately.
  - **Pinned Action Dock**: Keep the `Continue` / `Complete Setup` button pinned at the bottom with safe area insets so scrolling doesn't shift the action target.

---

## 5. End-of-Session Learning Protocol

- At the conclusion of every session where design feedback, corrections, or user preferences are expressed:
  1. Review user corrections, design constraints, and negative feedback.
  2. Extract universal principles (app-wide rules) rather than narrow screen-specific fixes.
  3. Update `learning.md` so that future agent sessions retain and build upon these lessons.
