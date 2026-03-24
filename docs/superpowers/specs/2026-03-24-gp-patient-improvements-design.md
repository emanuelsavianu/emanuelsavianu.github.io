# GP Website — Patient-Facing Improvements Design

**Date:** 2026-03-24
**Site:** savianu.it (GitHub Pages, static HTML/CSS/JS PWA)
**Scope:** Frontend, patient-facing, practical improvements — no backend required

---

## Overview

Four improvements that reduce patient confusion and unnecessary phone calls, all implemented as static HTML/CSS/JS additions to existing files.

---

## 1. Open/Closed Badge

### What
A small pill badge showing whether the studio is currently open or closed.

### Where
`index.html` — injected by JS immediately after the `<h2 data-i18n="hours_title">` element (use `querySelector('[data-i18n="hours_title"]')` as the selector anchor). The Segreteria sub-section heading is an `<h3>` inside a plain `<div>` and does not get a badge.

### How
Pure JS in `app.js`. On page load, check `new Date()` against the hardcoded schedule:
- Mon / Wed / Fri: 16:00–19:00
- Tue / Thu: 10:00–13:00
- Sat / Sun: closed

Renders a green `Aperto ora` or red `Chiuso` pill appended inside that `.card-header`. No maintenance required ever.

### Styles
New `.badge-open` (green) and `.badge-closed` (red/grey) utility classes in `styles.css`.

---

## 2. Ferie / Assenza Auto-Banner

### What
A dismissible banner that automatically appears when the current date falls within a configured absence period.

### Where
`index.html` — new `<div id="ferie-banner" hidden>` inserted **between** the closing `</a>` of the `mobile-app-banner` and the `<a href="#main-content" class="skip-link">`. The banner uses **normal document flow** (no fixed/absolute positioning) so it naturally appears below the mobile-app-banner strip without any `top` offset needed.

`app.js` — new `ASSENZE` config array at the top of the file.

### Config format
```js
const ASSENZE = [
  { from: "2026-08-01", to: "2026-08-31", note: "Il dottore è in ferie. Rientro previsto: 1 Settembre." },
];
```

### Behavior
- On page load, JS checks if today is within any absence range (inclusive).
- If yes: banner is shown with the `note` text and a dismiss (×) button.
- Dismiss stores state in `sessionStorage` (keyed by the `from` date) so it doesn't reappear mid-session.
- If no active absence: element stays hidden (`hidden` attribute), no visual impact.

### Maintenance
To add an absence: append one object to `ASSENZE` in `app.js`. No HTML changes needed.

---

## 3. "Cosa fare se..." Decision Flowchart

### What
An interactive decision tree that replaces the existing `#triage-section` (which it supersedes). Always visible above the services card, helping patients choose the right channel before reaching for the phone.

### Where
`index.html` — the existing `#triage-section` and its show/hide logic (`showTriage()`, `proceedToBooking()`) are **removed**. A new `<section id="flowchart-section">` is inserted between the `alert-box` section (`<section class="alert-box">`) and the services card (`<section class="card">` containing "Servizi Online"). The "Prenota una visita" button in the services card is updated to call `startBooking()` (which shows `#booking-section` directly). The **"Torna indietro" back-button** inside `#booking-section` (`<button onclick="showTriage()">`) is also **removed** since there is no triage step to go back to.

### Language
Italian only (hardcoded). The existing triage section had `data-i18n` keys (`triage_title`, `triage_desc`, `triage_opt1_*`, `triage_opt2_*`) — remove these stale keys from the `translations` object in `app.js` when removing the triage section. English flowchart translation keys can be added in a future pass if needed.

### Flow structure

```
Root: "Di cosa hai bisogno?"
├── [Farmaco / ricetta / impegnativa]
│     └── END → "Usa Millebook" (link to millebook.it)
├── [Un sintomo o problema da valutare]
│     ├── [Può aspettare qualche giorno?]
│     │     ├── [Sì] → END → "Prenota Visita Ordinaria"
│     │     └── [No, è urgente] → END → "Prenota Sintomi Recenti"
│     Note: "Pericolo di vita? Chiama il 112" shown as a red warning on this step.
├── [È notte / festivo / weekend]
│     └── END → "Chiama il 116 117"
└── [Certificato / burocrazia / altra domanda]
      └── END → "Leggi le FAQ"
```

### END node actions
- **Millebook** → links to `https://www.millebook.it/#/login` (same as existing button)
- **Prenota Visita Ordinaria** → calls `selectVisitType('ordinaria', <url>)` (the Feature 5 function), which shows `#booking-section`, scrolls to it, and opens the checklist pre-populated for Visita Ordinaria. The Visita Ordinaria button gets a CSS class `selected` (e.g. a colored border) to indicate it is active; the class is removed from the others. This is the same visual treatment as when the patient clicks the card directly.
- **Prenota Sintomi Recenti** → same as above via `selectVisitType('breve', <url>)`
- **116 117** → `tel:116117` link
- **FAQ** → links to `faq.html`

### Interaction model
- Each step renders as a card with a question and 2–3 button options.
- Tapping a button transitions to the next step (CSS opacity/transform transition).
- END steps show a highlighted result card with icon, explanation, and action button/link.
- A "Ricomincia" link at every step resets to the root.

### Implementation
- All steps defined as a static JS data structure in `app.js`.
- A single `<div id="flow-step">` inside the section is re-rendered on each transition.
- No external dependencies.

---

## 4. FAQ Search

### What
A live text filter on `faq.html` that hides non-matching FAQ items as the user types.

### Where
`faq.html` — new `<input id="faq-search">` and an empty `<p id="faq-no-results" hidden>` inserted at the top of `.faq-container`, above `.faq-nav`. The search JS is added to the **existing inline `<script>` block** at the bottom of `faq.html` (do not create a second script block).

### Behavior
- On `input` event: iterate all `.faq-item` elements.
- For each item, check if the question or answer text content (`.textContent`, not `.innerHTML`) contains the query string (case-insensitive).
- Non-matching items get `display: none`; matching items remain visible.
- **No DOM manipulation** (no `<mark>` injection) — plain show/hide only. This avoids breaking the accordion `scrollHeight` animation and the i18n `innerHTML` replacement.
- If zero items are visible: show `#faq-no-results` with the text "Nessuna domanda trovata — contatta la segreteria al 0575 910 904." This string is intentionally Italian-only (consistent with the flowchart policy); i18n support can be added later.
- The search operates against `.textContent` of each `.faq-item`, which reflects whichever language is currently active — so searching works correctly after `setLanguage('en')` is called.
- Clearing the input restores all items and hides the no-results message.

### Implementation
~20 lines of vanilla JS appended to the existing inline script block.

---

## 5. Pre-appointment Checklist

### What
A two-step booking interaction. Clicking a visit-type card no longer immediately opens the external URL. Instead it reveals a checklist + a confirm button that then opens the URL. This gives patients a moment to verify they have everything before going to the calendar.

### Where
`index.html` — inside `#booking-section`. The three `<a>` booking cards (Prima Visita, Visita Ordinaria, Sintomi Recenti) are converted to `<button>` elements that trigger JS. A new `<div id="visit-checklist">` is appended below the grid, initially hidden.

### Checklist content by visit type

**Prima Visita:**
- Tessera sanitaria / codice fiscale
- Documento d'identità
- Esenzioni ticket (se presenti)
- Lista aggiornata dei farmaci assunti
- Referti, esami e lettere di dimissione precedenti

**Visita Ordinaria:**
- Tessera sanitaria
- Lista aggiornata dei farmaci assunti
- Esami o referti recenti (se pertinenti al motivo della visita)

**Sintomi Recenti:**
- Tessera sanitaria
- Descrizione dei sintomi e data di inizio

### Interaction flow
1. Patient clicks a visit-type button.
2. The checklist div appears below the grid with the appropriate items (checkboxes, purely visual).
3. A "Procedi alla prenotazione →" button at the bottom opens the corresponding Google Calendar URL in a new tab (same URLs already in the HTML).
4. Clicking a different visit-type button swaps the checklist content.

### Implementation
- Checklist data defined as a JS object keyed by visit type in `app.js`.
- `selectVisitType(type, url)` renders the checklist items and sets the `href` attribute on the confirm `<a>` element (the confirm element is an `<a>` tag, not a `<button>`, so `href` is valid and `target="_blank"` opens the calendar URL in a new tab).
- The three booking cards become `<button>` elements calling `selectVisitType(type, url)`. The Google Calendar URLs are moved from the `href` attribute into the JS call arguments.

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Add ferie-banner div; replace triage section with flowchart section; update booking cards to buttons; add visit-checklist div; update "Prenota" button to call `startBooking()` |
| `faq.html` | Add search input and no-results message; append search JS to existing inline script block |
| `app.js` | Add ASSENZE config; open/closed badge logic; ferie banner logic; flowchart data + renderer; checklist data + renderer; replace `showTriage`/`proceedToBooking` with `startBooking` |
| `styles.css` | Add badge styles, ferie banner styles, flowchart card styles, checklist styles |

## Cache / PWA
After changes, bump the version query string on `app.js` and `styles.css` references in **all HTML files** (`index.html`, `faq.html`, `android.html`, `privacy.html`, `installazione.html`, `dottori.html`, `ferie.html`, `xsegretarie.html`, `calcolatore-ferie.html`, `calcolatoreferiegemini.html`) from `?v=7` to `?v=8`. Also update the cache version constant in `sw.js` to force service worker cache invalidation.
