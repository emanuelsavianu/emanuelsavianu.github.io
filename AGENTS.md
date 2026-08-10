# AGENTS.md — savianu.it

Static HTML/CSS/JS medical practice site (no build step) on GitHub Pages + Cloudflare. Pushes to `main` deploy instantly.

**Browser testing caveat**: the page chrome (`<site-nav>`/`<site-footer>`, i18n, banners) is rendered by ES modules, and Chrome blocks module scripts on `file://` (CORS) — double-clicking `index.html` only shows the no-JS fallback. Serve the repo over HTTP (`python -m http.server` or a small `node` static server) for real rendering. For automated checks: headless Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` — `--headless=new --dump-dom http://127.0.0.1:PORT/page` gives the JS-rendered DOM; `getBoundingClientRect` measurements need CDP (`--remote-debugging-port=9222` + `Runtime.evaluate` via Node's native WebSocket).

## Structure

- `index.html` — three-choice landing → `ssn/` (Pazienti SSN, IT/EN), `privati/` (visite private/INPS, IT/EN), `colleghi/` (professionals, **Italian-only**). **index.html renders NO brand header by design** (header merger 2026-08-09): the `<site-nav data-section="root">` element IS present (with static fallback markup), but the component skips the `<header role="banner">` brand block on root (app.js:83-87) and renders only the nav + ITA/ENG strip, which floats over the hero's top-right corner at ≥600px — the photo hero is the masthead. Don't "restore" a header there.
- `app.js` — all JS incl. the `translations` IT/EN object and the `<site-nav>`/`<site-footer>` web components (banners, nav, footer, quick actions); `config.js` — operational config imported by app.js (no page script tag); `styles.css` — single design system (navy #1a2f4c / gold #c29b57)
- JS-injected chrome (don't search page HTML for it): `.back-to-top` (every page), `.floating-faq` (patient pages; suppressed by `data-no-float="1"` — `privati/index.html` uses its own `#floating-faq-btn` instead), `.quick-actions-bar` (after `<site-footer>` on patient pages).
- `docs/superpowers/specs/2026-08-08-unified-savianu-site-design.md` — architecture + old-domain redirect map (§10)
- Sub-apps: `colleghi/RUAP/` has its own `AGENTS.md` (read it before touching RUAP — module boot order, storage schema, export format). `colleghi/gestoreturni/` has none; both stay as-is, no shared chrome.

## Verification (run before claiming done)

- `npm test` (alias `node tools/run-all-checks.mjs`) — runs ALL of the below in one shot: JS syntax, link integrity, i18n parity, SW precache sync. Exit code 0 = all pass.
- `node tools/check-links.mjs` — broken relative links (after any move/rename/link edit)
- `node tools/check-i18n.mjs` — IT/EN key parity + `data-i18n` coverage
- `node --check app.js` / `node --check config.js` — JS syntax
- `node tools/check-sw.mjs` — sw.js precache list in sync with pages (after page add/remove/rename)
- Layout: sweep changed pages at mobile+desktop widths (headless Chrome, see caveat above). Repo-specific overflow failure patterns already fixed — apply the same fixes if they reappear: (a) flex items with default `min-width:auto` won't shrink below wide `<pre>`/table content → add `min-width:0` (`colleghi/installazione.html`); (b) `width:100%` tables wider than their container get silently clipped by an `overflow:hidden` ancestor → wrap in an `overflow-x:auto` container (`.table-scroll`, `ssn/impegnative.html`); (c) flex-column `.page-wrapper` with `align-items:normal` makes children resolve to max-content width → set `width:100%` on the child (`privati/certificato-invalidita-civile.html`).

## Rules that differ from defaults

- **Relative paths everywhere**: from `ssn/`, `privati/`, `colleghi/` use `../` for root assets (`../styles.css`, `../app.js`, `../index.html`, `../privacy.html`). No root-absolute internal links. `config.js` has no page script tag — `app.js` imports it as an ES module.
- **i18n**: every user-facing string on landing/`ssn/*`/`privati/*` uses `data-i18n` with BOTH `it` and `en` keys in `app.js`; keep the blocks' exact key indentation (8 spaces) — `tools/check-i18n.mjs` parses app.js textually. Colleghi pages: Italian-only, no ITA/ENG toggle, no Google Translate widget. Google Translate init script must load AFTER the `app.js` module tag.
- **Cache-busting `?v=N`**: one consistent version per file across ALL pages. Current: `styles.css?v=37`, `app.js?v=27` (grep to confirm if the file looks stale). Bump when changing that file. Run `node tools/update-sw.mjs` after changing pages/assets (OpenCode: hooks do not run).
- **sw.js `savianu-vN`**: the `bump-sw.mjs` PostToolUse hook (`.claude/scripts/bump-sw.mjs`) is Claude-Code-only — **it does NOT run in OpenCode**. In OpenCode use `node tools/update-sw.mjs`, which regenerates the `PRECACHE_URLS` list AND bumps `savianu-vN` by +1.
- **sitemap.xml / robots.txt are hand-maintained** (no tool): add new public pages to `sitemap.xml`; `colleghi/*` and `offline.html`/`404.html` are deliberately absent (noindex). robots.txt already disallows `colleghi/xsegretarie.html`, `colleghi/RUAP/`, `colleghi/gestoreturni/` — keep it that way.
- **Font Awesome**: always load BOTH `fontawesome.min.css` + `solid.min.css` (6.4.0). Never `all.min.css`.
- **Hours/closure banners**: edit `config.js`, not HTML — `CONFIG.SCHEDULE` (Mon–Fri 09:30–12:30 + 16:00–19:00; badge + hours tables + JSON-LD), `CONFIG.ASSENZE` (free-text `note`, drives `#ferie-banner`). Badge appends to the element with `data-badge-anchor`.
- **Booking split**: SSN → Doctolib (`CONFIG.DOCTOLIB`); Privati → Google Calendar iframe (`CONFIG.GOOGLE_CAL.iframe`). Never swap them.
- **Millebook is legacy** — do not reintroduce Millebook CTAs or FAQ content (Doctolib is canonical).
- **Self-contained pages — don't restyle/refactor**: `ssn/malattia.html` (Tailwind), posters `ssn/salutementale.html` + `ssn/vivisano.html`, `ssn/bengalese.html`/`ssn/urdu.html`, colleghi calculators/Tailwind pages, `colleghi/RUAP/`, `colleghi/gestoreturni/` — plus the un-migrated dott pages that link NO shared chrome at all (no `styles.css`/`app.js`): `colleghi/installazione.html`, `colleghi/rsa.html`, `colleghi/xsegretarie.html`, `colleghi/malattia.html`, `colleghi/guida-interattiva-mmg.html`, `colleghi/lo-scudo-del-medico.html`, `offline.html`. Fix only inbound links.
- **Page-local `<style>` blocks are deliberate**: `privati/index.html`, `privati/faq-riforma.html`, `privati/certificato-invalidita-civile.html`, `ssn/faq.html`, `ssn/esenzioni.html`, `ssn/impegnative.html`, `ssn/cert-malattia.html`, `colleghi/protocollo-certificati-inps.html`, `privacy.html` carry page-specific CSS by design (spec §5 "keep inline") and may intentionally override shared `.page-hero`/`.page-wrapper`/print rules — don't fold them into `styles.css` or delete them as "duplicates" without confirming the rule is dead.
- **Privacy**: `colleghi/xsegretarie.html` is staff-only — never link it from public pages; `colleghi/` is `noindex`. RUAP/gestoreturni stay noindex.
- **Cloudflare worker** (`cloudflare/worker.js`): CSP `script-src` must keep ALL of: `calendar.google.com`, `translate.google.com`, `ssl.google-analytics.com` + the tool-page CDNs `cdn.tailwindcss.com`, `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, `unpkg.com`, `cdn.sheetjs.com` — self-contained pages (RUAP, gestoreturni, calcolatori, ssn/malattia) load Tailwind/chart.js/react/jsPDF/xlsx from these and break completely if removed. `frame-src https://calendar.google.com` + Google Translate domains too. Deploy: `cd cloudflare && npx wrangler deploy`. Never re-add `cloudflare/node_modules`.
- **New pages**: follow `.claude/skills/new-page/SKILL.md` template (`<site-nav data-section="...">`/`<site-footer>` fallbacks, single module `app.js` tag); keep single `<h1>`, skip link, ferie-banner hook, `data-i18n` (patient pages). After adding a major page, run `node tools/update-sw.mjs` to regenerate the precache list.

## Environment quirks (Windows/PowerShell)

- `rg`/`grep` are NOT installed — use the Grep tool or `Select-String`.
- PowerShell `>` / `Out-File` write UTF-16 or BOM-UTF8 — write files with the Write/Edit tools (UTF-8, no BOM) or `[System.IO.File]::WriteAllText(path, text, (New-Object System.Text.UTF8Encoding $false))`.
- No playwright/puppeteer is installed — headless Chrome (see top caveat) is the only automated browser path.
- Full detail in `CLAUDE.md` (gotchas: Google Translate z-index, mobile header overflow, `#guida-rapida` dormant feature).

## Repository Map

A full codemap is available at `codemap.md` in the project root (local-only — the `*.md` gitignore keeps it out of git; `.slim/codemap.json` holds change-detection state, also untracked).

Before working on any task, read `codemap.md` to understand:
- Project architecture and entry points
- Directory responsibilities and design patterns
- Data flow and integration points between modules

For deep work on a specific folder, also read that folder's `codemap.md`.
