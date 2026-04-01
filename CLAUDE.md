# savianu.it — Studio Medico Dott. Emanuel Savianu

Static HTML/CSS/JS medical practice website deployed at **savianu.it** via GitHub Pages + Cloudflare.

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main page (FAQ banner, booking, contacts, hours) |
| `app.js` | All JS: dark mode, i18n, booking with dynamic checklists, language switching |
| `config.js` | **Edit here for operational changes**: clinic hours (`SCHEDULE`) and vacation/absence banners (`ASSENZE`) |
| `styles.css` | All styles |
| `sw.js` | Service worker — cache version auto-bumped by hook |
| `faq.html` | FAQ page |
| `cloudflare/worker.js` | Cloudflare Worker (rate limiting, security headers) |

## Quick Start

No build step required. Open `index.html` directly in a browser to test locally. All functionality works from the filesystem.

## Testing

- **Local testing**: Open `index.html` in a browser (Firefox, Chrome, Safari)
- **Mobile testing**: Use Chrome DevTools device emulation or test on actual devices
- **Dark mode**: Toggle via the theme button in the header
- **Internationalization**: Switch languages via the ITA | ENG selector and verify `data-i18n` attributes render correctly

## Deployment

The site is deployed via **GitHub Pages** (automatic on push to `main`) and fronted by **Cloudflare** for caching, security headers, and rate limiting. No manual deployment steps needed — commits to `main` deploy instantly.

## Automation (Critical)

A **PostToolUse hook** runs `node .claude/scripts/bump-sw.js` after every Edit/Write. It auto-increments the `savianu-vN` cache key in `sw.js`. **Do not manually bump sw.js cache version.**

## Asset Cache-Busting

`styles.css` and `app.js` are linked with `?v=N`. **Manually increment this version in all three HTML files** (`index.html`, `faq.html`, `android.html`) when changing those files. Keep all three in sync on the same version number.

## i18n

All user-facing text uses `data-i18n` attributes on HTML elements. Translations for both `it` and `en` live in the `translations` object at the top of `app.js`. When adding new visible text, add entries for **both languages**.

**Critical:** When modifying visit descriptions in `visitMeta` (inside `selectVisitType()`), update both the Italian and English blocks—they're in separate locations (~line 682 and ~line 713). Use `grep -n "cal_privata"` to verify both exist.

## New Pages

Use the `/new-page` skill (`.claude/skills/new-page/SKILL.md`) for the correct HTML template. After creating a new major page, add it to the `urlsToCache` array in `sw.js`.

## Operational Changes

- **Vacation/absence/relocation banner**: edit `CONFIG.ASSENZE` in `config.js` (YYYY-MM-DD dates). The `note` field is free text — used for both holiday notices and address transfers. The `#ferie-banner` icon (`fa-umbrella-beach` for holidays, `fa-location-dot` for transfers) and color should match the message type.
- **Clinic hours badge**: edit `CONFIG.SCHEDULE` in `config.js`
- **Visit types & what to bring**: Modify the `visitMeta` object in `selectVisitType()` (app.js, ~line 682). The checklist is generated from the `checklist` array; the `note` field shows duration/details. **Keep descriptions in both `index.html` and `app.js` in sync.**
- **Booking calendar URLs**: inside `selectVisitType()` calls in `index.html` (Google Calendar links)
- **Address/contact changes**: update `index.html`, `app.js` translations, and JSON-LD in `<head>`

## Gotchas

- The welcome modal has been removed. In its place is the `#guida-rapida` inline card at the top of `<main>`. It is dismissed permanently via `localStorage` (`guidaRapidaSeen=1`). `dismissGuidaRapida()` in `app.js` handles this.
- `xsegretarie.html` is a private staff page — not linked from the main site.
- The Cloudflare `node_modules/` folder is gitignored but large — don't accidentally re-add it.
- Font Awesome is loaded as two separate files (`fontawesome.min.css` + `solid.min.css`) on `index.html`, but as `all.min.css` on other pages — keep consistent per page.
