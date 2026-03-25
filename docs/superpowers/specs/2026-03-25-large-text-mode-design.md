# Large Text Accessibility Mode — Design Spec
**Date:** 2026-03-25
**Status:** Approved

## Problem

Target audience is elderly, technology-challenged Italian patients. Many give up and call the secretary rather than using the site. A key barrier is text and button size — difficult to read on mobile with aging eyes or unsteady hands.

## Solution

Add an opt-in "Testo Grande" (large text) accessibility mode toggled via a banner at the top of the page. The preference persists across visits via `localStorage`.

## Design

### Banner — inactive state (default)
- Light grey bar at very top of `<body>`, above the mobile-app-banner
- Text: "🔤 Difficoltà a leggere?" + blue pill button "A+ Testo Grande"
- Auto-hides after first scroll (if large text is NOT active), so it doesn't clutter the page for users who don't need it
- Does NOT show on pages other than `index.html` (not needed on FAQ/privacy)

### Banner — active state
- Gold/yellow bar (`#fffbea` background, `#c9a227` border) — always visible when active (needed to toggle off)
- Text: "✓ Testo grande attivo" + outlined button "A− Normale"

### CSS changes (`styles.css`)
Add `body.large-text` overrides:
- Base font-size: `16px` → `20px`
- Secondary/small text: proportional increase (~+4px)
- Flow option buttons, booking buttons, contact rows: padding increase (~+6px top/bottom)
- Line-height: `1.5` → `1.7`
- Welcome modal body text: larger
- Quick-actions bar labels: larger

### JS changes (`app.js`)
- `initLargeText()` — reads `localStorage.getItem('largeText')`, applies `body.large-text` if enabled, called on page load
- `toggleLargeText()` — toggles class + saves to localStorage + updates banner state
- Scroll listener: hides banner after first scroll if large text is inactive

### HTML changes (`index.html`)
- Insert `#large-text-banner` immediately **after** the inline `<script>` on line 116 (the `welcomeSeen` check) and before `#mobile-app-banner`

### Dark mode compatibility
- The banner active state (gold/yellow) must have a `body.dark-mode #large-text-banner.active` override with darker background and adjusted text colour so it remains readable in dark mode

### Defensive localStorage
- All `localStorage` calls in `initLargeText()` and `toggleLargeText()` must be wrapped in `try/catch`, matching the pattern used in `initDarkMode()` in `app.js`

### Scroll listener
- Use `{ once: true }` on the scroll event listener so it removes itself after firing — prevents memory leak and double-trigger bugs
- The listener only hides the banner if large text is NOT active (banner must stay visible when active)
- No interaction with `#ferie-banner` — the two are independent

### Cache-busting
- After adding rules to `styles.css`, bump the `?v=N` query string on the `styles.css` link in `index.html` (currently `?v=9` → `?v=10`)

### Quick-actions bar
- The `nav.quick-actions-bar` large-text overrides go **outside** any media query, so they apply whenever the bar is visible regardless of breakpoint

## Files Changed
- `index.html` — add banner HTML, bump styles.css version
- `styles.css` — add `body.large-text` overrides + banner styles (light + dark mode variants)
- `app.js` — add `initLargeText()`, `toggleLargeText()`, one-shot scroll listener

## Non-goals
- No changes to `faq.html`, `privacy.html`, or other pages
- No auto-detection of OS accessibility settings (keep it simple)
- No font-size slider (binary toggle only)
