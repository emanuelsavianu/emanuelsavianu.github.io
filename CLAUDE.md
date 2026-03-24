# savianu.it — Studio Medico Dott. Emanuel Savianu

Static HTML/CSS/JS medical practice website deployed at **savianu.it** via GitHub Pages + Cloudflare.

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main page (flowchart, booking, contacts, hours) |
| `app.js` | All JS: dark mode, i18n, flowchart, welcome modal, booking |
| `config.js` | **Edit here for operational changes**: clinic hours (`SCHEDULE`) and vacation/absence banners (`ASSENZE`) |
| `styles.css` | All styles |
| `sw.js` | Service worker — cache version auto-bumped by hook |
| `faq.html` | FAQ page |
| `cloudflare/worker.js` | Cloudflare Worker (rate limiting, security headers) |

## Automation (Critical)

A **PostToolUse hook** runs `node .claude/scripts/bump-sw.js` after every Edit/Write. It auto-increments the `savianu-vN` cache key in `sw.js`. **Do not manually bump sw.js cache version.**

## Asset Cache-Busting

`styles.css` and `app.js` are linked with `?v=N` (e.g. `styles.css?v=9`). **Manually increment this version** in all HTML files when changing those files, so browsers pick up the new version.

## i18n

All user-facing text uses `data-i18n` attributes on HTML elements. Translations for both `it` and `en` live in the `translations` object at the top of `app.js`. When adding new visible text, add entries for **both languages**.

## New Pages

Use the `/new-page` skill (`.claude/skills/new-page/SKILL.md`) for the correct HTML template. After creating a new major page, add it to the `urlsToCache` array in `sw.js`.

## Operational Changes

- **Vacation/absence banner**: edit `CONFIG.ASSENZE` in `config.js` (YYYY-MM-DD dates)
- **Clinic hours badge**: edit `CONFIG.SCHEDULE` in `config.js`
- **Booking calendar URLs**: inside `selectVisitType()` calls in `index.html` (Google Calendar links)
- **Address/contact changes**: update `index.html`, `app.js` translations, and JSON-LD in `<head>`

## Gotchas

- The welcome modal shows on every new session (controlled by `sessionStorage`). It is intentional.
- `xsegretarie.html` is a private staff page — not linked from the main site.
- The Cloudflare `node_modules/` folder is gitignored but large — don't accidentally re-add it.
- Font Awesome is loaded as two separate files (`fontawesome.min.css` + `solid.min.css`) on `index.html`, but as `all.min.css` on other pages — keep consistent per page.
