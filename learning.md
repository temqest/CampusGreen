# CampusGreen Connect — Design & Architecture Learnings

This document captures project-specific design standards, user preferences, and hard architectural constraints learned from active feedback. **Always read this file before designing or modifying UI in this project.**

---

## 1. Core Principles: Mobile App vs. Website

- **This is a native mobile app, NOT a marketing website**:
  - Never design mobile screens with desktop/website tropes.
  - Onboarding and welcome screens must **never have website-style topbars, headers, or navbars**.
  - Onboarding must fit within a **single mobile viewport** without unnecessary vertical scrolling.
  - Avoid SaaS bento grids, lengthy marketing feature matrices, or long web-style landing page sections on mobile screens.
  - Action buttons belong in a clean, thumb-friendly **bottom dock** (`Get Started`, `Log In`, `Explore as Guest`).

---

## 2. What NOT to Do (Anti-Patterns & User Dislikes)

- ❌ **No Topbars on Onboarding**: Apps do not have topbars or headers on the initial welcome screen. Keep it full-bleed and immersive.
- ❌ **No AI Art**: Never use AI-generated images or placeholders. All visual elements must be crafted using native shapes, clean vector icons (`@expo/vector-icons`), and typography.
- ❌ **No Information Overload or Marketing Fluff**: Do not bombard the user with excessive text, fake statistics (e.g., "1,420+ active peers"), or simulated card clutter. Keep copy authentic, human, and concise.
- ❌ **No Unverified Claims & Badges**: Do not sprinkle random pill badges, fake verification counts, or percentage-off tags unless backed by real data.
- ❌ **No "Empty Box with Text"**: Do not swing to the other extreme by creating a cold, solitary box. The hero must feel warm, human, and inviting.
- ❌ **No Desynchronized Multi-Loop Animations**: Never run multiple independent `Animated.sequence` or `Animated.loop` timers with varying durations. They drift out of phase and stutter at loop boundaries.

---

## 3. What TO Do (User Preferences & Best Practices)

- ✅ **Generous Breathing Room & Clean Spacing**: Give elements room to breathe. Use whitespace with confidence.
- ✅ **Harmonious Vector Visual Motifs**: Build warm, balanced geometric or iconography compositions using native React Native components (e.g., the connected 3-circle community motif representing academics, sustainability, and student exchange).
- ✅ **Warm, Honest Editorial Copy**:
  - Clear app title: `CampusGreen`
  - Welcoming, grounded headline: *"Where campus gear finds a second life."*
  - Concise 1–2 sentence description of what the app actually does.
- ✅ **Thumb-Friendly Bottom Dock**:
  - Large primary button (`Get Started` / `Create an account`)
  - Secondary button (`Log in`)
  - Subtle text link (`Continue as guest` / `Explore as guest`)
- ✅ **Single-Driver Seamless Animations**:
  - Use **one continuous linear loop driver** (`0 → 1`) running on the native driver (`useNativeDriver: true`).
  - Derive movements via **closed-cycle sinusoidal interpolation** (`[0, 0.25, 0.5, 0.75, 1] → [0, -6, 0, 6, 0]`) so the loop starts and ends at the identical value, eliminating all stutter, velocity jumps, and reset hitches.
  - In React 19, initialize animated values with `useState(() => new Animated.Value(...))` to avoid `Cannot access refs during render` compiler/linter warnings.

---

## 4. End-of-Session Learning Protocol

- At the conclusion of every session where design feedback, corrections, or user preferences are expressed:
  1. Update this `learning.md` file with the new findings, dos, and don'ts.
  2. Maintain and cross-reference these guidelines in future prompts to avoid repeating past mistakes.
