# Header Info Banner Merge — Design

Date: 2026-08-08 · Status: Approved

## Problem

Three pastel info bars stacked above the navy header look mismatched and busy:

1. `#doctolib-banner` (yellow) — "Prenotazioni e ricette tramite Doctolib. Per urgenze: …"
2. `#ferie-banner` (light blue, dismissible) — "Studio chiuso dal 6 al 14 agosto 2026. … Urgenze: …"
3. `#large-text-banner` (grey) — "Difficoltà a leggere?" + **A+ Testo Grande** button

The two alert bars repeat the same urgenze line, and the pastel backgrounds clash with the navy/gold design system.

## Decisions

1. **Remove `#large-text-banner` entirely** (markup `app.js:38`, CSS `styles.css:1360-1432` incl. `.large-text-btn`, `toggleLargeText()` `app.js:267`, any orphaned translation keys). The text-zoom accessibility control is removed site-wide per user request.

2. **Merge `#doctolib-banner` + `#ferie-banner` into one info line folded into the top of the navy header** — rendered inside `header[role=banner]`, above `.header-content`, on every page via the shared `SiteNav` component. No bar above the header anymore.

3. **Text merge, no duplication** — urgenze line appears exactly once:
   - base: "Prenotazioni e ricette tramite Doctolib." (patient pages only)
   - absence: active `CONFIG.ASSENZE` note (all pages, only when present)
   - urgenze: "Per urgenze: Guardia Medica 116 117 — Emergenze: 112." (always, at the end)
   - Remove the urgenze text from `CONFIG.ASSENZE[].note` (`config.js:13`) and from `doctolib_banner_text`.

4. **Design**: navy header background, white base text, **gold (accent) closure sentence**, single gold `fa-info-circle` icon. No emojis. Non-patient pages (colleghi/static) show absence + urgenze only; when no absence is active the line is hidden there (as today), and the dismiss button only renders with an absence.

5. **Dismiss (×)**: hides *only the absence sentence* for the session (sessionStorage, same key/pattern as today) on patient pages; on non-patient pages it hides the whole line (matching today's behavior).

6. **Remove the "STUDIO MEDICO IPPOCRATE" gold line** from the header brand block (`app.js` brand string). Keep the tagline "Medico di Medicina Generale - Arezzo". Keep the brand name.

## Non-goals

- `.lang-switch` (ITA/ENG/🌙/Google Translate) untouched.
- Nav row, badge, quick-actions, floating FAQ untouched.
- JSON-LD, page titles, hero card title "Benvenuti nello Studio Medico Ippocrate" untouched.
- No Millebook reintroduction.

## Implementation notes

- Translations: split `doctolib_banner_text` into base + new `urgenze_line` key — both IT and EN (check-i18n parity).
- Desktop: info line must clear the absolutely-positioned `.lang-switch` (top-right); mobile (≤599px) the toggle strip flows above the header, the line wraps beneath it.
- Reuse the existing ferie-dismissal sessionStorage key.
- Remove/replace `dismissFerieBanner()` references with the new dismiss handler.
- Version bumps: `styles.css?v=25`, `app.js?v=19` on ALL pages; then `node tools/update-sw.mjs`.

## Verification

- Open `index.html` in a browser: exactly one info line at the top of the navy header; no bars above the header; no "A+ Testo Grande"; no "STUDIO MEDICO IPPOCRATE"; dismiss hides only the closure sentence (patient pages); IT/EN switch keeps merged text translated; mobile ≤599px: no overlap with the toggle strip.
- `node --check app.js` / `node --check config.js` / `node tools/check-i18n.mjs` / `node tools/check-links.mjs` all pass.
