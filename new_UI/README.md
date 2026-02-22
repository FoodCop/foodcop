# FUZO | Technical Specification

**FUZO** is a AAA high-fidelity food discovery and culinary experience platform. It combines social discovery, interactive recipe packs, real-time location scouting, and AI-driven culinary assistance.

---

## 1. Visual Design Language (Design System)

The app follows a "Masterclass" aesthetic: high contrast, bold typography, and extreme radius corners.

### Color Palette
- **Primary:** `#FACC15` (Tailwind `yellow-400`) - Used for highlights, active states, and primary actions.
- **Background:** `#FAF9F6` (Tailwind `stone-50`) - Main canvas.
- **Surface:** `#FFFFFF` (White) - Cards and modals.
- **Accent:** `#000000` (Black) - High-contrast text and dark-mode elements.
- **Muted:** `#78716C` (Tailwind `stone-500`) - Labels and secondary info.

### Typography
- **Font Family:** Inter (System Sans-Serif).
- **Style:** No italics. Heavy use of `font-black` (900 weight) and `uppercase` for headings.
- **Character Spacing:** Wide tracking (`tracking-widest` / `0.1em` to `0.4em`) for badges and labels.

### Component Geometry
- **Main Radius:** `3xl` or `3rem` (Extremely rounded).
- **Borders:** Subtle `stone-100` borders or thick `4px` white borders for "Stacked Card" effects.
- **Shadows:** Soft, large blurs with subtle color tints (e.g., `shadow-yellow-100`).

---

## 2. Information Architecture & Navigation

### Navigation Strategy
- **Desktop:** Fixed left sidebar (64px width) with icon + label buttons.
- **Mobile:** Floating pill-shaped navigation bar (bottom-fixed, `85vw` width).
  - Icons only, except for a central prominent "Bites" (ChefHat) action button that is vertically offset.
- **Header:** Minimalist. Page-specific icon on the top-left, FUZO logo on the top-right.

### Primary Views (Routes)
1.  **Feed (home):** Vertical stack of swipable restaurant review cards.
2.  **Bites (bites):** Swipe-based recipe discovery engine using Gemini AI.
3.  **SNAP (snap):** Real-time camera interface for food photography/sharing.
4.  **Chats (chat):** Inbox/Messaging interface with per-friend threaded conversations.
5.  **Scout (places):** Map-integrated restaurant discovery based on geolocation and radius.
6.  **Trims (videos):** Full-screen vertical video player (Shorts style) with overlay controls.
7.  **Plate (profile):** User profile "Studio" featuring banner, bio card, and categorized content grid.
8.  **Prefs (settings):** Hierarchical settings menu for notifications and appearance.

---

## 3. Core Features & Logic

### AI Integration (Gemini SDK)
- **Recipe Engine:** Uses `gemini-3-flash-preview` to generate structured JSON recipe objects (Title, PrepTime, Ingredients, Instructions).
- **Scout Tool:** Uses `gemini-2.5-flash` with `googleMaps` tool grounding for real-world restaurant data.
- **Chef AI:** Conversational interface for culinary questions.

### Swipe Interaction Engine
- **Logic:** Threshold-based gesture detection (`onSwipeLeft`, `onSwipeRight`, `onSwipeUp`, `onSwipeDown`).
- **Feedback:** Visual overlays (e.g., "Save", "Share") and card rotation/translation during the swipe gesture.

### Media Handling
- **Trims Player:** YouTube Embed (Iframe API) with custom controls for mute/play states and vertical scaling to fit 9:16 aspect ratio.
- **SNAP:** Browser `getUserMedia` API integration for live video stream preview.

---

## 4. Flutter Implementation Mapping

### Recommended Widgets
- **Theme:** `ThemeData` with a custom `ColorScheme` using the Hex codes above.
- **Layout:** `Scaffold` with a custom `FloatingActionButtonLocation.centerDocked` for the mobile pill nav.
- **Cards:** `Container` with `BoxDecoration(borderRadius: BorderRadius.circular(48.0))`.
- **Swiping:** `GestureDetector` or `Dismissible` for the card stacks. For advanced AAA feel, use `flutter_card_swiper`.
- **Navigation:** `PersistentTabView` or a custom `Stack` with a `Positioned` bottom bar.
- **Icons:** `LucideIcons` package (available on pub.dev).

### Recommended Libraries
- **Networking:** `dio` or `http`.
- **State Management:** `provider`, `riverpod`, or `bloc`.
- **AI:** `google_generative_ai` (Official Flutter SDK).
- **Location:** `geolocator` and `google_maps_flutter`.
- **Video:** `youtube_player_flutter` or `video_player`.
- **Camera:** `camera` package.

---

## 5. API Requirements
- **Google Search/Maps Grounding:** Requires a valid Google Cloud API Key with Maps/Search enabled.
- **Image Hosting:** Unsplash API for high-quality food photography.
- **Media:** YouTube Data API for video content.
