# savianu.it — Studio Medico Dott. Emanuel Savianu

Unified static HTML/CSS/JS medical practice website deployed at **savianu.it** via GitHub Pages + Cloudflare. Merged from the former patient portal (`emanuelsavianu.github.io`) and the professional portal (`dottemanuelsavianu.it`).

## Site Structure

The home page (`index.html`) is a three-choice gateway:

1. **`ssn/`** — 🏥 Pazienti SSN (Doctolib booking, FAQ, esenzioni, impegnative, multilingual guides, posters) — IT/EN
2. **`privati/`** — 💼 Pazienti Privati (visite private, certificati INPS, Legge 104, Google Calendar booking) — IT/EN
3. **`colleghi/`** — 🤝 Colleghi (internal tools, protocolli, RUAP, Gestore Turni, calcolatori) — **Italian-only**, no ITA/ENG toggle, no Google Translate

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Three-choice landing (SSN / Privati / Colleghi) |
| `app.js` | All JS: dark mode, i18n IT/EN, large-text mode, flowchart, accordion, filters, badges, ferie banner |
| `config.js` | **Edit here for operational changes**: hours (`SCHEDULE`), vacation/absence banners (`ASSENZE`), Doctolib + Google Calendar URLs |
| `styles.css` | Single shared design system (navy #1a2f4c / gold #c29b57) |
| `sw.js` | Service worker — cache version auto-bumped by hook |
| `404.html` | Custom 404 page |
| `assets/` | `bluelogo.png` (logo/icon), `bronzelogo.png` (OG image) |
| `cloudflare/worker.js` | Cloudflare Worker (security headers, CSP with calendar.google.com frame-src) |
| `ssn/index.html`, `privati/index.html`, `colleghi/index.html` | Section dashboards |
| `colleghi/RUAP/`, `colleghi/gestoreturni/` | Independent sub-apps (as-is, do not refactor) |

## Conventions

- **Relative paths**: all internal links relative. From section folders use `../` prefix for root assets (`../styles.css`, `../app.js`, `../config.js`, `../index.html`, `../privacy.html`).
- **Hours**: `CONFIG.SCHEDULE` = Mon–Fri 09:30–12:30 + 16:00–19:00 everywhere (badge + hours tables + JSON-LD). The open/closed badge appends to `[data-badge-anchor]`.
- **Absence/closure banner**: edit `CONFIG.ASSENZE` in `config.js` (YYYY-MM-DD dates, free-text `note`). Also drives the injected `#doctolib-banner` text.
- **i18n**: `translations` object in `app.js` with `it` + `en` blocks. Patient/private pages use `data-i18n` for ALL user-facing text; colleagues pages are Italian-only. Google Translate widget on landing + `ssn/*` + `privati/*` only.
- **Booking**: SSN → Doctolib (`CONFIG.DOCTOLIB`); Privati → Google Calendar iframe (`CONFIG.GOOGLE_CAL.iframe`).
- **Contacts**: Segreteria 0575 910 904 · Dottore (solo urgenze) 0575 171 3428 · segreteria@savianu.it · Piazza Saione 3, Arezzo · 112 emergenze · 116 117 guardia medica.

## Quick Start

No build step required. Open `index.html` directly in a browser to test locally.

## Testing

- **Local testing**: Open `index.html` in a browser (Firefox, Chrome, Safari)
- **Mobile testing**: Chrome DevTools device emulation
- **Dark mode**: theme button in the header
- **i18n**: ITA | ENG selector; verify `data-i18n` renders in both languages
- **Link checks**: `node tools/check-links.mjs` (broken relative links scan)

## Deployment

GitHub Pages (automatic on push to `main`) + Cloudflare in front. Commits to `main` deploy instantly.

## Automation (Critical)

A **PostToolUse hook** runs `node .claude/scripts/bump-sw.js` after every Edit/Write. It auto-increments the `savianu-vN` cache key in `sw.js`. **Do not manually bump sw.js cache version.**

## Asset Cache-Busting

`styles.css`, `app.js` and `config.js` are linked with `?v=N`. **Increment the version in every HTML file that loads them when changing those files** — keep one consistent version per file across all pages. Current: `styles.css?v=23`, `app.js?v=17`, `config.js?v=2`.

## Old-Domain Redirects

The former domains (`dottemanuelsavianu.it`, `emanuelsavianu.github.io`) redirect to savianu.it via Cloudflare. The full old→new URL map lives in `docs/superpowers/specs/2026-08-08-unified-savianu-site-design.md` (§10).

## New Pages

Use the `/new-page` skill (`.claude/skills/new-page/SKILL.md`) for the correct HTML template. After creating a new major page, add it to the `PRECACHE_URLS` array in `sw.js`.

## Operational Changes

- **Vacation/absence/relocation banner**: edit `CONFIG.ASSENZE` in `config.js` (YYYY-MM-DD dates). The `note` field is free text.
- **Opening hours**: edit `CONFIG.SCHEDULE` in `config.js` (days 1–5, decimal hours).
- **Booking links**: `CONFIG.DOCTOLIB` (SSN) and `CONFIG.GOOGLE_CAL.iframe` (private) in `config.js`.
- **Address/contact changes**: update all of `index.html`, `ssn/`, `privati/`, `privacy.html`, `offline.html`, `404.html`, and `app.js` (both IT and EN translation blocks). Include: meta description, JSON-LD, Google Maps links, and all address displays.

## Gotchas

- The `#guida-rapida` card logic exists in `app.js` and `styles.css` but the HTML element is currently absent — don't add it without intentionally re-enabling the feature.
- `xsegretarie.html` is a private staff page — not linked from the main site; `colleghi/` is `noindex`.
- The Cloudflare `node_modules/` folder is gitignored but large — don't accidentally re-add it.
- Font Awesome: All pages load as two separate files (`fontawesome.min.css` + `solid.min.css`). Keep consistent across all HTML files.
- **Google Translate widget**: Dropdown needs `z-index: 99999 !important` to float above `.container` (z-index: 10); on mobile with responsive controls, use `flex-wrap: wrap; justify-content: center` to allow wrapping, hide separators. Initialize script must load AFTER config.js/app.js.
- **Mobile header responsiveness**: When re-layouting header controls from absolute positioning to flex stacking, add `overflow: visible` to header so dropdowns/overlays can escape viewport bounds.
- **Language Strategy**: ITA/ENG buttons are native site functionality (set user's language preference). Google Translate widget is *for additional languages beyond Italian and English* — ensure both stay visible on mobile (`flex-wrap: wrap`) so patients can choose native mode or translate to other languages.
- **MilleBook is legacy** — the practice uses Doctolib for messages/prescriptions. Do not reintroduce Millebook CTAs or FAQ sections.
- Standalone pages (Tailwind/Chart.js/React calculators, A3 posters, Bengali/Urdu guides) are self-contained by design — don't force the shared design system on them.
