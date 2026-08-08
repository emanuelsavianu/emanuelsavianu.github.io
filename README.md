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

## Deployment

Push to `main` — GitHub Pages deploys automatically; Cloudflare sits in front (worker: `cloudflare/worker.js`).

## Old domains

`dottemanuelsavianu.it` and `emanuelsavianu.github.io` redirect to savianu.it via Cloudflare. Full old→new URL map: `docs/superpowers/specs/2026-08-08-unified-savianu-site-design.md` §10.
