# savianu.it — Studio Medico Dott. Emanuel Savianu

Unified static website for the medical practice of Dr. Emanuel Savianu (Studio Medico Ippocrate, Piazza Saione 3, Arezzo). Merged from the former patient portal (`emanuelsavianu.github.io`) and professional portal (`dottemanuelsavianu.it`).

## Structure

- **`index.html`** — three-choice landing: 🏥 Pazienti SSN · 💼 Pazienti Privati · 🤝 Colleghi
- **`ssn/`** — SSN patient portal (Doctolib booking, FAQ, esenzioni, impegnative, multilingual guides, posters) — IT/EN
- **`privati/`** — private practice (INPS certificates, Legge 104, Google Calendar booking) — IT/EN
- **`colleghi/`** — colleagues area (RUAP, Gestore Turni, calculators, protocols) — Italian-only
- **Root assets** — `styles.css`, `app.js`, `config.js`, `assets/` (logos), `sw.js`, `manifest.json`

## Tech

Pure static HTML/CSS/JS. No build step. GitHub Pages + Cloudflare. Service worker PWA.

## Local testing

Open `index.html` in a browser (no server needed).

## Link checks

```
node tools/check-links.mjs
```

## Full test suite

```
npm test          # JS syntax + link integrity + i18n parity + SW precache sync
```

## Minification (optional, one-off)

`styles.css` and `app.js` are the editable sources. To generate minified copies:

```
node tools/minify.mjs        # requires: npx esbuild (devDependency)
```

This writes `styles.min.css` / `app.min.js`. If you switch HTML to reference the minified
files, remember to re-run this script after every edit to either source file, and bump the
`?v=NN` query strings in HTML. The unminified files remain the canonical edited versions.

## Font Awesome subset (optional, one-off)

The full `fa-solid-900.woff2` (~150 KB) ships every icon; only a fixed subset is used.

```
node tools/subset-fontawesome.mjs   # requires: pip install fonttools (pyftsubset)
```

Writes `assets/fontawesome/webfonts/fa-solid-900.subset.woff2`. To add a new icon:
add its class to any HTML file, re-run the script, and bump the font version in HTML.
Keep the full font in the repo as the regeneration source.

## Deployment

Push to `main` — GitHub Pages deploys automatically; Cloudflare sits in front (worker: `cloudflare/worker.js`).
Dashboard-only actions (DNS records, Zero Trust Access policies) are documented in
`docs/manual-steps-cloudflare.md`.

## Old domains

`dottemanuelsavianu.it` and `emanuelsavianu.github.io` redirect to savianu.it via Cloudflare. Full old→new URL map: `docs/superpowers/specs/2026-08-08-unified-savianu-site-design.md` §10.
