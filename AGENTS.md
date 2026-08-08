# AGENTS.md — savianu.it

Static HTML/CSS/JS medical practice site (no build step) on GitHub Pages + Cloudflare. **Test by opening `index.html` in a browser**; pushes to `main` deploy instantly.

## Structure

- `index.html` — three-choice landing → `ssn/` (Pazienti SSN, IT/EN), `privati/` (visite private/INPS, IT/EN), `colleghi/` (professionals, **Italian-only**)
- `app.js` — all JS incl. the `translations` IT/EN object and the `<site-nav>`/`<site-footer>` web components (banners, nav, footer, quick actions); `config.js` — operational config imported by app.js (no page script tag); `styles.css` — single design system (navy #1a2f4c / gold #c29b57)
- `docs/superpowers/specs/2026-08-08-unified-savianu-site-design.md` — architecture + old-domain redirect map (§10)

## Verification (run before claiming done)

- `node tools/check-links.mjs` — broken relative links (after any move/rename/link edit)
- `node tools/check-i18n.mjs` — IT/EN key parity + `data-i18n` coverage
- `node --check app.js` / `node --check config.js` — JS syntax
- `node tools/check-sw.mjs` — sw.js precache list in sync with pages (after page add/remove/rename)

## Rules that differ from defaults

- **Relative paths everywhere**: from `ssn/`, `privati/`, `colleghi/` use `../` for root assets (`../styles.css`, `../app.js`, `../index.html`, `../privacy.html`). No root-absolute internal links. `config.js` has no page script tag — `app.js` imports it as an ES module.
- **i18n**: every user-facing string on landing/`ssn/*`/`privati/*` uses `data-i18n` with BOTH `it` and `en` keys in `app.js`. Colleghi pages: Italian-only, no ITA/ENG toggle, no Google Translate widget. Google Translate init script must load AFTER the `app.js` module tag.
- **Cache-busting `?v=N`**: one consistent version per file across ALL pages. Current: `styles.css?v=24`, `app.js?v=18`. Bump when changing that file. Run `node tools/update-sw.mjs` after changing pages/assets (OpenCode: hooks do not run).
- **sw.js `savianu-vN`**: the `bump-sw.js` PostToolUse hook is Claude-Code-only — **it does NOT run in OpenCode**. In OpenCode use `node tools/update-sw.mjs`, which regenerates the `PRECACHE_URLS` list AND bumps `savianu-vN` by +1.
- **Font Awesome**: always load BOTH `fontawesome.min.css` + `solid.min.css` (6.4.0). Never `all.min.css`.
- **Hours/closure banners**: edit `config.js`, not HTML — `CONFIG.SCHEDULE` (Mon–Fri 09:30–12:30 + 16:00–19:00; badge + hours tables + JSON-LD), `CONFIG.ASSENZE` (free-text `note`, drives `#ferie-banner`). Badge appends to the element with `data-badge-anchor`.
- **Booking split**: SSN → Doctolib (`CONFIG.DOCTOLIB`); Privati → Google Calendar iframe (`CONFIG.GOOGLE_CAL.iframe`). Never swap them.
- **Millebook is legacy** — do not reintroduce Millebook CTAs or FAQ content (Doctolib is canonical).
- **Self-contained pages — don't restyle/refactor**: `ssn/malattia.html` (Tailwind), posters `ssn/salutementale.html` + `ssn/vivisano.html`, `ssn/bengalese.html`/`ssn/urdu.html`, colleghi calculators/Tailwind pages, `colleghi/RUAP/`, `colleghi/gestoreturni/`. Fix only inbound links.
- **Privacy**: `colleghi/xsegretarie.html` is staff-only — never link it from public pages; `colleghi/` is `noindex`. RUAP/gestoreturni stay noindex.
- **Cloudflare worker** (`cloudflare/worker.js`): CSP `script-src` must keep ALL of: `calendar.google.com`, `translate.google.com`, `ssl.google-analytics.com` + the tool-page CDNs `cdn.tailwindcss.com`, `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, `unpkg.com`, `cdn.sheetjs.com` — self-contained pages (RUAP, gestoreturni, calcolatori, ssn/malattia) load Tailwind/chart.js/react/jsPDF/xlsx from these and break completely if removed. `frame-src https://calendar.google.com` + Google Translate domains too. Deploy: `cd cloudflare && npx wrangler deploy`. Never re-add `cloudflare/node_modules`.
- **New pages**: follow `.claude/skills/new-page/SKILL.md` template (`<site-nav data-section="...">`/`<site-footer>` fallbacks, single module `app.js` tag); keep single `<h1>`, skip link, ferie-banner hook, `data-i18n` (patient pages). After adding a major page, run `node tools/update-sw.mjs` to regenerate the precache list.

## Environment quirks (Windows/PowerShell)

- `rg`/`grep` are NOT installed — use the Grep tool or `Select-String`.
- PowerShell `>` / `Out-File` write UTF-16 or BOM-UTF8 — write files with the Write/Edit tools (UTF-8, no BOM) or `[System.IO.File]::WriteAllText(path, text, (New-Object System.Text.UTF8Encoding $false))`.
- Full detail in `CLAUDE.md` (gotchas: Google Translate z-index, mobile header overflow, `#guida-rapida` dormant feature).
