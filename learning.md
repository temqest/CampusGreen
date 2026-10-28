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

## 5. Marketplace & Discovery Standards

- **E-Wallet Balance Pattern for Green Impact Counter**:
  - Rather than treating sustainability stats as a web marketing banner, integrate it like an e-wallet balance card (e.g., GCash / Maya account balance) at the top of the mobile marketplace feed.
  - Presents authentic, grounded metrics: **Carbon Emissions Saved (`kg CO₂e`)**, **Waste Diverted (`kg`)**, and **Student Money Saved (`₱`)**.
  - Provides a clean toggle between **Campus Total** and **My Contribution** so students feel personal ownership of their campus carbon reduction.
  - Keeps card geometry compact with rounded corners (`Radius.lg`), deep forest academic tones (`#18482D` / `#1F5C3A`), and native vector leaf glyphs (`leaf-outline`), strictly avoiding celebratory sparkles or decorative pill noise.
- **Responsive 2-Column Discovery Grid**:
  - Use `FlatList` with `numColumns={2}` for the marketplace feed to optimize browsing speed and thumbnail preview on mobile viewports.
  - Actionable Dynamic Badges ONLY: Badges on cards are strictly reserved for dynamic transaction state (`₱350`, `Swap`, `Free`, `Reserved`). No decorative tag filler.
  - Include course and safe meetup spot context on each card (e.g. `BS Nursing • Yr 2` and `📍 Main Library Ground Floor`).
- **Clean Slate Discovery Hierarchy**:
  - Category and deal-type filters must start unselected (`null`).
  - Combining a neutral "All Categories" chip + individual category toggles ensures users make deliberate choices without default bias.
- **Strictly Typed TabBarIcon Props**:
  - In React Navigation tabs with TypeScript, avoid passing raw `color` from bottom-tabs renderer directly into Vector Icons props if internal color types include null; use explicitly typed theme tokens (`focused ? theme.primary : theme.textMuted`).

---

## 6. Checkout & Student Payment Standards

- **Context-Aware Bottom Action Dock**:
  - For items that cost money (`tradeType === 'buy' && price > 0`), the primary CTA must clearly show the financial commitment and flow: `Pay Now • ₱{item.price}`, paired with a secondary icon button for quick seller chat inquiry.
  - For swap or free items, preserve direct communication CTAs: `Propose Swap Trade` or `Request Freebie`.
- **Philippine Student Payment Channels (Cash on Delivery, GCash, Maya)**:
  - Standardize on official national channels: **Cash on Delivery (Meetup Handover)** as the primary option, followed by **GCash** (e-wallet) and **Maya** (digital bank & wallet). QR Ph has been removed in favor of direct meetup cash exchange with zero advance risk.
  - Respect official brand identities with tailored logo containers (e.g. green accent container with cash vector for COD, sleek dark container for Maya's `#2FF19E` logo, clean white/bordered containers for GCash).
  - Follow the **Zero Pre-Selection Invariant**: Payment methods must never be pre-selected; initialize to `null` so students explicitly and deliberately choose their payment channel.
- **Escrow & Cash Meetup Handover Peace of Mind**:
  - For digital payments, funds are locked safely in escrow until meetup verification.
  - For Cash on Delivery (COD), order reservations are confirmed in-app with clear handover instructions: buyer inspects the item at the designated campus safe meetup spot (`item.safeMeetupSpot`) before handing over exact cash, with confirmation recorded in-app.
- **Inline Non-Sticky Back Button on Same Row as Screen Title**:
  - Never float the back button sticky over the view using `position: 'absolute'`.
  - Place the back arrow button inside the `ScrollView` on the **same row** as the screen heading (`flexDirection: 'row'`, `alignItems: 'center'`, `gap: 12`), saving vertical space and allowing it to scroll away naturally.
- **Card Color Harmony (Never Monochromatic All-Green)**:
  - Never paint the background, border, title, and body text in variations of the same green tone.
  - Information and reassurance cards must use standard `theme.surface` (or subtle neutral `theme.surfaceSubtle`), with `theme.text` for the title and `theme.textSecondary` for body copy. Use brand green exclusively for the icon accent.
- **Zero Decorative Badges on Payment Channels**:
  - Do not attach decorative tags (`"Universal"`, `"E-Wallet"`, `"Digital Bank"`) to payment option titles.
- **72-Hour Auto-Completion Escrow Disclaimer**:
  - Always inform the buyer on the payment confirmation/escrow screen that following seller handover at the meetup spot, an automated 72-hour inspection window applies: if the buyer fails to respond or raise a dispute within 72 hours, the platform automatically completes the order without issue and releases payment to the seller.

---

## 7. Bottom Navbar Architecture & Workflow Hierarchy

- **Bottom Navbar Tab Selection**:
  - Keep the bottom navbar focused on core student workflows:
    1. **Marketplace** (`storefront`): Main campus discovery and search feed.
    2. **Basket** (`basket`): Campus pickup basket, escrow checkout summary, and CO₂ savings accumulator.
    3. **Sell** (`add-circle`): Centered prominent listing action.
    4. **Chat** (`chatbubbles`): Campus peer-to-peer messaging and meetup coordination.
    5. **Profile** (`person`): Student account, verifications, and reputation.
  - **In-Feed Filters over Redundant Tabs**: Deal types like *Swap* and *Freebies* are discovery filters rather than distinct apps; handle them via the in-feed deal selector in Marketplace, avoiding bottom tab bar bloat.
  - **Zero Website Topbars on Tab Views**:
    - Never render pinned horizontal header strips with `borderBottomWidth: 1` or decorative pill tags across the top of mobile tab screens (`Basket`, `Chat`, `Marketplace`).
    - In native mobile apps, screen titles are organic in-page large headings (`ListHeaderComponent` in `FlatList`) that scroll naturally with the content. Search inputs, filters, and safety notes must sit directly inside the scrollable feed rather than in pinned website-like navbar blocks.
  - **Hiding Deprecated Tab Files**: When removing screens from Expo Router tabs while preserving route files, always set `options={{ href: null }}` on `<Tabs.Screen />` so Expo Router does not generate auto-tabs.
  - **React 19 Compiler Purity Invariant**: Avoid calling impure functions like `Date.now()` or non-deterministic generators inside render or callbacks without stable identifiers to adhere to `react-hooks/purity` linter rules.

---

## 8. Peer Chat Confirmation for Trades & Freebies

- **Interactive Agreement Cards in Non-Monetary Chats**:
  - For `swap` and `free` items where escrow checkout is not applicable, render an interactive agreement card directly at the head of the chat feed.
  - Card details:
    - **Swap (Barter)**: Lists the proposed exchange (e.g. Drafting Board ⇄ Desk Study Lamp) and the campus safe meetup zone.
    - **Freebie (Pay-It-Forward)**: Explicitly notes ₱0.00 student gift and the pickup spot.
  - **Single-Tap Confirmation Button**:
    - Interactive button (`"Accept Swap Trade"` or `"Confirm Freebie Acceptance"`).
    - Tapping executes an optimistic state update to `'accepted'`, generates a unique campus handover pass (e.g. `PASS #SWAP-8492` or `PASS #FREE-3201`), and appends a system milestone message to the chat history.
    - Once students meet at the safe campus zone, provides a secondary `"Mark Handover Complete"` CTA to finalize the transaction.

---

## 9. Seller Listing Flow & Multi-Photo Picker Standards

- **Cross-Platform Image Picking**:
  - Always standardise on official `expo-image-picker` (`launchImageLibraryAsync` with `allowsMultipleSelection: true` and `launchCameraAsync`).
  - Configure clear, human permissions in `app.json` (`photosPermission` and `cameraPermission`).
- **Multi-Photo Mobile Ergonomics**:
  - Limit to 5 photos per item for optimal mobile memory and bandwidth.
  - Distinct "Cover Photo" badge on index 0 to clearly show the primary marketplace thumbnail.
  - "Make Cover" and individual deletion buttons directly on thumbnails.
  - Include quick campus sample photo presets (textbooks, scrubs, calculator, desk lamp) so developers and testers can verify multi-photo flows on simulators without camera hardware.
- **React 19 Immutability & Stable Counters**:
  - Never reassign module-level variables (`let counter = 0; counter += 1`) inside async callbacks or event handlers; React Compiler flags this with `react-hooks/immutability`.
  - Use component-scoped `useRef(0)` to track incremental counters within event handlers.
- **Progressive 3-Step Listing Flow over Monolithic Forms**:
  - Never dump 10+ disparate form fields onto a single scrolling mobile screen ("wall of forms" anti-pattern). It creates severe cognitive fatigue and makes navigation difficult.
  - Divide the listing journey into 3 focused, bite-sized stages:
    1. **Step 1: Item & Photos** (Hero photo picker, item title, category tile selection, honest condition).
    2. **Step 2: Pricing & Trade Deal** (Structured deal cards: Cash ₱ with quick presets, Swap barter wishlist, or Freebie Pay-It-Forward gift + description).
    3. **Step 3: Campus Handover & Review** (Campus switch, safe meetup spot chips, academic context, live CO₂ green impact, and a live marketplace card preview).
  - Include a clean stepper header with a progress track (`33% → 66% → 100%`) and tap-to-navigate pills for completed steps.
  - Perform step-level validation so users receive immediate, contextual guidance before advancing.
- **End-to-End Marketplace Visibility**:
  - Newly published items must immediately update the global `ItemsContext` so they appear at the top of the Marketplace feed.
  - Render real `photo.uri` across `ItemCard` and `item/[id].tsx` using `expo-image` with fallback to category vector motifs.

---

## 10. Student Profile, Escrow Wallet & Seller Success Growth Tools

- **Escrow Wallet Dual Balance Pattern**:
  - Avoid confusing total balance figures. Clearly distinguish between **Available for Cash-Out** (cleared funds from completed handovers) and **Locked in Escrow** (funds safely held while buyer inspects item at campus zone).
  - Explicitly remind students of the 72-hour auto-completion protection window post-meetup.
- **Philippine E-Wallet Cash-Out Flow**:
  - Standardize on official channels: **GCash** and **Maya**.
  - Respect the **Zero Pre-Selection Invariant**: Channel options start unselected (`null`).
  - Provide quick amount chips (`₱500`, `₱1,000`, `₱2,000`, `Cash Out All`) with instant balance validation and generation of traceable reference IDs (`CG-PO-XXXXXX`).
  - Highlight ₱0 student transfer fees to encourage in-app campus digital transactions.
- **Seller Success Growth Hub (Goal #6)**:
  - **Listing Bumps**: Reposition active items to index 0 of the marketplace discovery feed and refresh `createdAt` to `'Just now'`, giving students organic visibility.
  - **Urgent Selling Badges**: Strictly dynamic, actionable badges (`#DC2626` / `Urgent`) toggled by students for items needing rapid turnaround before exams, clinical duty rotations, or dorm move-outs. Rendered consistently on both `ItemCard` and `item/[id].tsx`.
- **Identity & Campus Reputation**:
  - Showcase institutional `.edu.ph` email verification, university affiliation, degree program, and authentic reputation score (⭐ 4.9 • 24 campus reviews • 100% meetup completion) alongside personal Green Impact metrics (kg CO₂ saved, items reused, ₱ saved).

- **Profile Mental Models & Mobile Navigation Standards**:
  - **Never put Settings or Ledger into Content Tabs**: Tabs must strictly partition user inventory and transactions (`Active Listings`, `Sold`, `My Orders`). Settings, preferences, and security belong in native grouped list rows at the base of the view or via a top-right header gear icon.
  - **Thumb-Friendly Cash-Out Action Dock**: The "Cash Out Funds" CTA must be a prominent, full-width button docked cleanly inside or below the Escrow Wallet card with generous vertical padding, never a cramped pill next to balance headers.
  - **Bottom Dock Safety Margin**: Always apply generous bottom padding (`paddingBottom: insets.bottom + 110`) so the bottom-most list items, logout buttons, and floating tab bar never overlap or cause clipped touch targets.
  - **Modal Auxiliary Sheets for Complex Actions**: Keep the main profile page uncluttered by housing secondary flows (Escrow Ledger history, Cash-Out transfer forms, Meetup Spot selector) in bottom-sliding modal sheets.

---

## 12. Real Mobile Screen Dimensions & Playwright Viewport Calibration

- **Always Test Against Real Student Smartphone Viewports**:
  - Never test or inspect UI in wide desktop browser viewports or default large desktop browser windows (>450px).
  - Desktop web widths provide artificial horizontal room that masks text wrapping bugs, cramped touch targets, and overlapping button rows that fail completely on actual mobile hardware.
- **Reference Device Specifications**:
  - **Tecno Camon 20 Pro (Primary Android Reference)**:
    - Screen Size: 6.67 inches (~107.4 cm² / ~85.7% screen-to-body ratio), 20:9 aspect ratio.
    - Physical Resolution: 1080 × 2400 pixels (~395 ppi density).
    - **Playwright / CSS Logical Viewport**: Set explicitly to **`width: 360, height: 800`** (or `width: 392, height: 872` at 2.75x ratio). Always use **`360 × 800`** as the baseline stress-test width.
  - **Standard Compact iPhone Reference**:
    - **`width: 375, height: 812`** (iPhone 11 Pro / X / 13 mini).
  - **Standard Modern iPhone Reference**:
    - **`width: 390, height: 844`** (iPhone 14 / 15).
- **Hard Mobile Layout Invariant**:
  - **Never squeeze more than 2-3 interactive buttons into a single horizontal row** inside a mobile card.
  - At 360px viewport width (360px screen - 32px screen padding - 24px card padding = ~304px card width), a 5-button row yields <55px per button, rendering text illegible and causing severe mis-taps.
  - Use a primary quick action button paired with a `••• Manage` / overflow action sheet modal instead of crowding the card dock.

---

## 14. Theme Mode Architecture & Account Action Descriptions

- **App Appearance Management**:
  - Theme switching must support 3 distinct modes: `'system' | 'light' | 'dark'`.
  - Provide a centralized `ThemeProvider` (`src/context/theme-context.tsx`) wrapping the root navigator so any screen or component using `useTheme()` reacts immediately to user preferences.
  - On web platforms, persist preference across sessions in `localStorage` under `campusgreen_theme_mode`.
  - When authoring theme selection modals, represent options with distinct vector iconography (`phone-portrait-outline` for system, `sunny-outline` for light, `moon-outline` for dark) and radio checkmarks.
- **Accurate Action Descriptions in Settings**:
  - Never use identity metadata (e.g. `"Signed in as user@campus.edu.ph"`) as the secondary helper text for a destructive or terminal action like **Log Out**.
  - Always explain the concrete device action: `"Sign out of this campus device"`.
- **Philippine E-Wallet Brand Assets**:
  - For Philippine payment channels (GCash, Maya, QR Ph), always render the authentic SVG logos located in `assets/` (`assets/gcash.svg`, `assets/maya.svg`, `assets/qr-ph.svg`) instead of generic placeholder icons (`wallet-outline`, `card-outline`).
  - Containerize GCash on soft blue `#EFF6FF` and Maya on dark `#0A1810` for maximum contrast and brand fidelity.

---

## 15. Student Profile Editing & Avatar Photo Picker Architecture

- **Unified Avatar & Identity Editing**:
  - The student identity header should provide two natural interaction pathways:
    1. **Tapping the avatar** or the subtle camera badge overlay triggers the **Profile Photo Picker Modal**.
    2. **Tapping the pen icon button** opens the full **Edit Profile Details Modal** (Name, Degree/Program, Year Level chips, and Avatar change).
- **Matching the File Picker Pattern**:
  - Replicate the proven photo upload flow from `src/components/sell/photo-picker-section.tsx`:
    - **Take a Live Photo**: `ImagePicker.launchCameraAsync` with `allowsEditing: true, aspect: [1, 1], quality: 0.85`.
    - **Choose from Gallery**: `ImagePicker.launchImageLibraryAsync` with `allowsEditing: true, aspect: [1, 1], quality: 0.85`.
    - **Campus Avatar Presets**: Include 4 realistic student avatar presets for instant selection and rapid simulator testing where native camera hardware is absent.
    - **Remove Photo Option**: Conditionally present when a custom avatar is set, reverting cleanly to student initials.
- **Modal Layering & Stacking Context Invariant**:
  - In React Native Web and native view hierarchies, if a modal can be triggered from inside another active modal (e.g. tapping "Change Photo" inside the Edit Profile sheet), the sub-modal (`PhotoPickerModal`) **must appear after** the parent modal (`EditProfileModal`) in the JSX render order.
  - Placing sub-modals earlier in the JSX causes the parent modal's backdrop overlay to render on top of the sub-modal in web DOM stacking order.

---

## 16. Product Detail Hero Ergonomics & Badge Placement

- **Zero Occlusion of Product Hero Images**:
  - The hero image is the single most critical asset on a product detail screen. Never place bulky, multi-pill clusters across the center or bottom-right of the carousel that obscure the product.
  - Camera angle tags (`photoAngleLabel`) belong in the bottom-left corner (`bottom: 14, left: 16`) with compact padding, away from the image subject.
- **Urgent & Sale Badges Must Be Single-Line Horizontal Chips**:
  - Always apply `flexDirection: 'row', alignItems: 'center'` to badge containers.
  - Never allow icons (`Ionicons name="flash"`) to stack vertically above label text, which creates an awkward, oversized, tower-like badge that breaks layout alignment.
  - On the hero image, place the `⚡ URGENT` chip in the top-left gutter (`top: insets.top + 54, left: 16`) directly beneath the floating back button so it stays completely out of the photo subject's bounding box.
- **Primary Price Belongs in the Product Body**:
  - Do not rely solely on floating pills on top of the image to communicate price.
  - Position a prominent **Price & Status Row** directly below the title in the product body with `22px` bold font, accompanied by a clean `⚡ URGENT SELLING` status tag and purchase type badge.

---

## 17. End-of-Session Learning Protocol

- At the conclusion of every session where design feedback, corrections, or user preferences are expressed:
  1. Review user corrections, design constraints, and negative feedback.
  2. Extract universal principles (app-wide rules) rather than narrow screen-specific fixes.
  3. Update `learning.md` so that future agent sessions retain and build upon these lessons.

---

## 18. Mobile Chat Architecture & Real-Time Ergonomics

- **Zero Pre-Filled Chat Option Chips**:
  - Never render canned quick prompts or pre-filled message chips above the chat input dock (e.g. `"Can we meet today?"`, `"Is this available?"`).
  - They create visual noise, conflict with the **Zero Pre-Selection Invariant**, and interfere with natural student conversation.
  - The text input must remain clean, focused, and thumb-friendly with only an input field and a reactive send button.
- **Auto-Scroll Behavior on Every New Message & Initial Open**:
  - Mobile chat feeds must maintain visible focus on the newest messages.
  - In `FlatList`, bind `ref={flatListRef}` and attach `onContentSizeChange={handleContentSizeChange}`.
  - When opening or re-focusing a chat thread, the screen must immediately land at the very latest message (using `useFocusEffect` with staggered `scrollToEnd({ animated: false })` at 30ms, 120ms, and 280ms) so users never see an old offset or the top of the header agreement card.
  - When a user sends a message or when a peer replies, the thread smoothly scrolls down to bring the new message into view (`scrollToEnd({ animated: true })`).
- **Centralized Chat State & Inbox Synchronization**:
  - Use `ChatProvider` (`src/context/chat-context.tsx`) wrapping the root navigator so message feeds and conversation lists are universally synced.
  - Whenever a student sends a message (from product detail, basket, payment, or chat thread), the conversation must automatically update and bump to index 0 of the **Messages Inbox** (`src/app/(tabs)/chat.tsx`) with the new message preview and `timestamp: 'Just now'`.
- **Contextual Peer Interactions & Typing Indicators**:
  - When a message is sent in simulation/mock mode, display a lightweight, non-intrusive typing indicator bubble (`{sellerName} is typing...` with `ellipsis-horizontal` icon) followed by a realistic peer response referencing the specific safe campus meetup zone or trade deal type.
- **In-Chat Photo Sharing Ergonomics**:
  - Provide a dedicated photo attachment button (`camera-outline`) in the input dock.
  - The photo picker action sheet offers **Live Camera** (`ImagePicker.launchCameraAsync`) and **Gallery** (`ImagePicker.launchImageLibraryAsync`).
  - Selected images render as a compact draft thumbnail with a removal button (`(x)`) directly above the input field, allowing students to type an optional caption before hitting Send.
  - Sent photos render in native bubble containers with rounded corners (`Radius.md`), optional caption text, timestamp, and tap-to-expand fullscreen modal viewer with dark overlay and close button.
  - The Messages Inbox dynamically reflects photo messages (`📷 Sent a photo` or `📷 {caption}`) with real-time timestamp updates.

### 19. Item Retrieval Handover & Buyer-to-Seller Peer Rating System (Chat Ergonomics)
- **Unified Handover & Retrieval Agreement Flow**:
  - All campus trades (`swap`, `free`, and `buy`) share an interactive `Campus Handover & Retrieval Agreement` card pinned in chat.
  - State progression transitions smoothly:
    1. `pending`: Displays handover details, meetup zone, offering, and "Confirm Meetup Plan" / "Accept Swap Trade" / "Confirm Freebie Acceptance".
    2. `accepted`: Displays generated Campus Handover Pass (e.g. `PASS #BUY-5120`, `PASS #SWAP-8492`), safety instructions, and a primary CTA: **"Confirm Item Retrieval"**.
    3. `completed`: Confirms successful inspection and item retrieval on campus.
- **Triggered 1/5 Star Rating Pop-up Ergonomics**:
  - Upon tapping **"Confirm Item Retrieval"**, the system:
    1. Commits `agreementStatus` to `'completed'`.
    2. Posts a verified system message into the chat feed confirming handover at the safe meetup spot.
    3. Smoothly prompts the **Rating Pop-up Modal** after 380ms so the student sees their action confirmed before the review modal appears.
- **Zero Pre-Selection Invariant in Rating Selectors**:
  - Star ratings start completely unselected (`selectedStars = 0`), adhering to the Zero Pre-Selection Invariant.
  - Interactive 1 to 5 star rating selector (`★ ★ ★ ★ ★`) built with `@expo/vector-icons` (`Ionicons` `star` / `star-outline`), warm amber gold (`#F59E0B`), and comfortable touch targets (hitSlop 8).
  - Descriptive rating label updates dynamically:
    - 0 stars: *"Tap a star to rate (1 to 5 stars)"* (Submit button disabled).
    - 1/5: *Needs Improvement*
    - 2/5: *Fair Handover*
    - 3/5: *Good & Smooth*
    - 4/5: *Great Experience!*
    - 5/5: *Outstanding Seller!*
  - Optional peer review tag chips (e.g., *Punctual Meetup*, *Item as Described*, *Friendly Peer*, *Smooth Handover*, *Fast Response*) and an optional written note input.
  - Primary button (`Submit X/5 Rating`) and secondary dismiss action (`Maybe Later`).
- **Post-Rating Persistence**:
  - Submitting appends a verified review system entry in chat (`⭐ You rated {sellerName} ★★★★★ ({scoreLabel})`).
  - The completed card in chat displays the buyer's review summary (`{score}/5 Stars · Verified Peer Review`) with an "Edit Rating" button, or an inviting "Rate {sellerName} (1–5 Stars)" button if previously skipped.

### 20. Realistic Media Population & Tourism Program Alignment (Media & Course Context)
- **Authentic Student & Gear Photography (Zero Placeholders, Zero AI Noise)**:
  - Blank gray boxes and icon placeholders reduce MVP perceived quality and user trust.
  - Populate listings with authentic, high-resolution photography sourced via Unsplash (respecting rate limits by caching search results and preserving URLs).
  - All avatars must feature natural student portraits with clean circular framing (`borderRadius: 999`), verified checkmark indicators, and robust fallbacks to initial monograms if an avatar URI fails to load.
- **Dynamic Multi-Angle Gallery Support**:
  - Each marketplace item supports an array of descriptive `photos` (`id`, `label`, `iconName`, `uri`) highlighting key product inspection points (e.g., front cover, detail stitching, labels, accessories).
  - Item detail screens display these as an interactive horizontal preview gallery (`Photo Gallery`) with thumbnail imagery and labels before committing to a purchase or meetup.
- **Curriculum-Specific Alignment (Tourism & Hospitality Context)**:
  - When steering an MVP towards a specific college demographic (e.g., BS Tourism Management), ensure consistency across the entire user experience:
    - **Listing Titles & Descriptions**: Real-world departmental items (e.g., official corporate blazers with silk neck scarves, Philippine Tourism Geography textbooks, 20-inch hard-shell cabin luggage for flight practicum, portable voice amplifiers with headset mics for tour guiding, and RFID airline document organizers).
    - **Safe Meetup Zones**: Reflect departmental campus hubs (e.g., `Alingal Hall Tourism Lobby` alongside `Main Library Ground Floor`).
    - **Chat Dialogues & Mock Threads**: Inquiries should naturally speak to practicum and tourism syllabus requirements (e.g., dry-cleaning quality, microphone AUX inputs, itinerary coverage).
    - **Profile Defaults**: Default active listings, degree programs (`BS Tourism Management`), and preferred exchange locations align with the student persona.
- **Consistent Thumbnail Rendering Across Tabs**:
  - Item images must be rendered in the **Basket** (`src/app/(tabs)/basket.tsx`), **Chat Inbox** (`src/app/(tabs)/chat.tsx`), **Active Profile Listings** (`src/app/(tabs)/profile.tsx`), and **Marketplace Grid** (`src/components/marketplace/item-card.tsx`) using `ExpoImage` (`contentFit="cover"`).
