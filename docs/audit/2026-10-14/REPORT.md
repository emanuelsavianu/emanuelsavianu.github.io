# Audit round 3 + rimedi — savianu.it (2026-10-14)

**Branch:** `fix/audit-round3-20261014` (base `main` = `e43cf8b`) · **Stato:** commit locali, **non pushati** (serve il tuo ok).
**Metodo:** misure sul sito **DEPLOYATO** (`https://savianu.it`) con harness dedicato (probe iniettato + axe-core 4.10.2), più pass interattivo (tastiera, modale, reduced-motion, no-JS, stampa) e **Lighthouse 12.8.2 mobile su produzione (15 run)**. Ogni fix è stato ri-verificato in locale (`python3 -m http.server` + stesso harness) su **light e dark**.
**Documento di dettaglio dei rilievi pre-fix:** `HANDOVER.md` (in questa cartella) con evidenze, pixel-proof e falsi positivi ritirati.

---

## 1. Verdetto

**20 problemi reali di contrasto/dark-mode/mobile/semantica chiusi e verificati; contrasto 436 → 1 nodo (l'unico residuo è un `sr-only`, non visibile), axe 21 → 1 violazione per pagina misurata; CLS di produzione 0.19–0.30 → 0.000–0.060; gate `npm test` verde.** Non pushato: il deploy richiede il tuo ok esplicito.

---

## 2. Registro interventi

| # | Problema | Sev. | File:riga | Come verificato |
|---|---|---|---|---|
| 1 | **Testo invisibile in dark**: `.ps-location` navy su card navy (1:1) — "Ospedale San Donato — Scala 1, Piano 2" non leggibile | **P0** | `colleghi/guida-accessi-pronto-soccorso.html:159` | computed + **istogramma di pixel** (98.55% un solo colore) → dopo: contrasto 7.31:1 |
| 2 | **`h1.section-title` invisibile in dark** su 4 pagine (navy su gradiente scuro) — titolo di `/ssn/`, esenzioni, impegnative, poster_multilingue | **P0** | `styles.css:1675` | pixel sul **live** (1.8% di pixel navy su fondo navy = 1.4:1) → dopo: `--color-text`, 13.6:1 |
| 3 | **`.sub-h3` invisibile in dark** (criteri-appropriatezza) | **P1** | `colleghi/criteri-appropriatezza.html` (dopo `.sub-h3{…}`) | pixel: 12.4% navy su fondo scuro = 1.48:1 → dopo: 0 nodi |
| 4 | **Badge numerati bianco-su-oro in dark** (1.85:1): `.sec-n` + 4 step inline | **P1** | `colleghi/criteri-appropriatezza.html:80`, `privati/certificato-invalidita-civile.html:530,537,544,551` | computed + pixel; fix con nuovo token `--badge-fg` (`styles.css:69,117`) → dark 9.82:1 |
| 5 | **RUAP (turni): 204 nodi di contrasto** (bianco su Tailwind 500 = 2.15–4.47), + 2 axe critical (`button-name` ×4, `select-name`), + 4 azioni header non conformi | **P1** | `colleghi/RUAP/js/config.js:36-56` (palette), `js/renderers.js`, `index.html:31-32` | prima 204 → **dopo 0** (light e dark); axe 4 → **0** |
| 6 | **Overflow orizzontale su mobile (300–540px)** nelle 8 pagine poster | **P1** | `ssn/poster-styles.css:145-148` | `scrollWidth−clientWidth`: 437→**0** (it), 536→**0** (ro), 324→**0** (ur), 299→**0** (salutementale)… |
| 7 | **Tabelle fuori viewport** su mobile (pir 674px, criteri 508px) | **P2** | `colleghi/pir.html:455,506`, `colleghi/criteri-appropriatezza.html:236,288,493` | overflow 335/134 → **0**; `.table-scroll` già gestito da `app.js` (hint + `tabindex`) |
| 8 | **`<h1>` con `<br>` senza spazio** → screen reader "OperativoCertificati" | **P2** | 8 pagine `colleghi/*` (es. `protocollo-certificati-inps.html:329`, `adi-adp-pai.html:290`) | `textContent` h1 pulito ("Guida Accessi Pronto Soccorso Specialistici") |
| 9 | **Anello di focus oro su crema = 2.25:1** (< 3:1, WCAG 2.2 SC 1.4.11) | **P2** | `styles.css:147,177,186` (+ `.ed` `3158,3161,3873`) | bronzo `--color-focus` su superfici chiare, oro chiaro su nav/footer navy (misurato) |
| 10 | **Gestoreturni**: 3 bottoni-icona senza nome, `progressbar` senza nome, `h2` vuoto, export 3.68:1, wizard **invisibile in dark** (card bianca + testo `#e2e8f0`), chevron invisibili in dark | **P2** | `colleghi/gestoreturni/gestoreturni.html:24-33,233,235,237` | axe 4 → **0**; contrasto 4 → 0; wizard e chevron ora leggibili |
| 11 | **Placeholder input** illeggibili in dark (3.47:1) / RUAP (2.54:1) | **P3** | `styles.css:154` + token (`:71,118`); RUAP `index.html:29` | 0 nodi `placeholders` residui |
| 12 | **Stampa: Letter invece di A4** | **P3** | `styles.css:1987` (`@page { size: A4; margin: 12mm }`) | `printToPDF` → `Page size: A4`; poster restano **A3 landscape, 1 pagina** ✓ |
| 13 | **Voci di footer 19px alti** (< 24×24, WCAG 2.5.8 AA) | **P3** | `styles.css:801` (`.footer-nav a`) | altezza link footer 19 → **36px** |
| 14 | **`label-content-name-mismatch`** (nome accessibile "Domande frequenti" ≠ testo visibile "FAQ") → BP 79 | **P3** | `app.js` chiavi `qa_faq_label`/`floating_faq_label` | `aria-label="FAQ — domande frequenti"` con testo visibile "FAQ" ✓ |
| 15 | **Checkbox consenso 20×20** | **P3** | `styles.css:3931` (`.ed .intl-consent input`) | 24×24 ✓ |
| 16 | **`/ssn/` link Google Maps** senza `rel=noopener` | **P3** | `ssn/index.html:385` | attributo presente |
| 17 | **Privacy: voce del modulo di contatto internazionale** (era in PR #4, mai riapplicata) | — | `privacy.html:173` | bozza recuperata da `fix/p1-clean-urls`, marcata `[DA VALIDARE — Emanuel]` sul periodo di conservazione e sul trasferimento extra-UE |
| 18 | **Font Google su 8 pagine solo-latine** → TTFB 1.7s e IP a Google | — | `ssn/poster-{it,en,ro}`, `salutementale{,-ro}`, `vivisano{,-ro}`, `colleghi/RUAP/index.html` | self-hosting `assets/fonts/fonts.css` (variabili 400–800/400–700, già subsettati) |
| 19 | **`offline.html`** senza `<main>` (axe moderate) | **P3** | `offline.html` | `<div class="card">` → `<main class="card">`, axe 2 → **0** |
| 20 | **Heading poster `<h2>…</h3>`** (tag non chiuso, 36 occorrenze) | **P3** | 9 pagine `ssn/poster*`, `salutementale*`, `vivisano*` | ora `<h2>…</h2>` + `.card h2` a CSS → axe `heading-order` 0 |

Cache-buster: `styles.css?v=20261014a` (33 occorrenze), `app.js?v=20261014a` (24), `poster-styles.css?v=20261014a` (9), **SW `savianu-v402`**.

---

## 3. Metriche prima/dopo (stessa macchina, stesso harness)

| Metrica | Prima (deployato, main) | Dopo (fix, verificato **sul deployato** — commit `911ffed`) |
|---|---|---|
| Nodi di contrasto (40 pagine × 2 temi, mobile) | **436** | **1** (falso positivo `sr-only`) |
| Pagine con overflow orizzontale a 390px | 10 | **0** |
| axe: violazioni su RUAP / gestoreturni / offline / poster / criteri | 4 / 4 / 2 / 1 / 1 | **0 / 0 / 0 / 0 / 0** |
| axe su 40 pagine (serious/critical) | 3 pagine | **0** |
| Errori JS/console | 0 | **0** |
| Lighthouse 12 mobile **produzione** — Perf / A11y / BP / SEO | (04/10: 84–91 / 100 / 79 / 100) | **90–98 / 100 / 79–100 / 100** |
| **CLS produzione** (mediana di 3) | 0.19–0.30 | **0.000** (`/`, `/ssn/`, `/privati/`, `/international/` … `0.060` su home, 2/3 run) |
| LCP produzione | 1.5–2.2 s | 2.1–3.2 s (invariato: dipende dalla rete) |
| `npm test` | verde | verde |

**Core Web Vitals di produzione (Lighthouse 12.8.2, 3 run/pagina, mobile):**

| pagina | Perf | A11y | BP | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 94 | 100 | 100 | 100 | 2.91 s | 0.060 |
| `/ssn/` | 98 | 100 | 100 | 100 | 2.14 s | 0.000 |
| `/privati/` | 92 | 100 | 79 | 100 | 3.07 s | 0.000 |
| `/international/` | 94 | 100 | 100 | 100 | 2.91 s | 0.000 |
| `/colleghi/` | 90 | 100 | 79 | 100 | 3.23 s | 0.000 |

Raw: `prod-lighthouse/*-run{1,2,3}.json` (non committati, ~10 MB).

---

## 4. Deviazioni intenzionali (NON toccate, come da mandato)

1. **Embed Google Calendar** su `/privati/` e `/colleghi/`: il BP 79 di `/colleghi/` è `third-party-cookies` (cookie `NID` di `calendar.google.com`) — scelta intenzionale, ora **dichiarata in `privacy.html`**; su `/privati/` il BP 79 residuo è `label-content-name-mismatch` (risolto in questo batch → da rimisurare) + `bf-cache` (informativo, richiede di eliminare `unload`/`no-store`).
2. **Placeholder immagine dei poster** con i prompt di generazione (in inglese, visibili al paziente e in sitemap): è una **decisione di prodotto**, non l'ho cambiata. Opzioni pronte: (a) nascondere i `figcaption` in produzione con una classe dev; (b) `noindex` + fuori sitemap finché non ci sono le immagini; (c) sostituire i `<figure>` con le immagini reali (i path sono nei commenti HTML).
3. **`assets/brand/wordmark.html`** (axe moderate: no `main`/`h1`): pagina master del wordmark usata da `scripts/render-wordmark.py` — toccarne la struttura può cambiare il render della wordmark → lasciata com'è, `robots.txt` la esclude.
4. **RUAP: 34 div cliccabili non tastierabili** (`doctor-card`, righe `#monthly-stats-panel`, righe di stampa) + testi 9–10px: migliorati contrasto e nomi accessibili, la tastiera richiede un intervento più profondo sul template (documentato, non fatto: le indicazioni dicono di non ristrutturare RUAP).
5. **`robots.txt` Disallow ma contenuto pubblico 200** (`/colleghi/RUAP/`, `/colleghi/gestoreturni/`, `/tools/`): va risolto con **Cloudflare Access**, non nel repo.
6. **Poster BN/UR/Bengalese/Urdu e le pagine `malattia`** restano su Google Fonts (glifi bengalese/arabo e Inter non presenti nel self-hosting).

---

## 5. Comandi per riprodurre / verificare

```bash
cd ~/Projects/savianu.it && npm test                       # 9 gate + gen-markdown: verde
# harness (in docs/audit/2026-10-14/harness/): probe.js + runner.py, axe-core a chunk
cd ~/Projects/savianu.it && python3 -m http.server 8099 --bind 127.0.0.1   # poi: run_batch([...], label='verify')
# CWV di produzione (Lighthouse 12 mobile, 3 run/pagina, 5 pagine): vedi lo script in prod-lighthouse/
curl -s "https://savianu.it/sw.js?x=$RANDOM" | grep -o 'savianu-v[0-9]*'    # dopo il deploy: atteso v402
```

---

## 6. NEEDS_EMANUEL

1. **Privacy (voce `/api/intl-inquiry`)**: periodo di conservazione delle email di contatto e conferma del **trasferimento extra-UE** della catena form → Cloudflare Worker → Resend (nell'informativa la voce porta il marcatore `[DA VALIDARE — Emanuel]`).
2. **Poster**: decisione su placeholder/prompt immagine (le tre opzioni al §4.2).
3. **`robots.txt` + Access**: confermare quali path interni chiudere con Cloudflare Access (`/colleghi/RUAP/`, `/colleghi/gestoreturni/`, `/tools/`).
4. Redazione del **commit/report**: se vuoi che `docs/audit/2026-10-14/` resti nel repo (è in `.gitignore`, l'aggiungo con `git add -f`) o solo locale.
5. Restano aperte le domande del round precedente (telefoni/etichette, orari `/international/` e JSON-LD, tariffe, NAP Doctolib, albo/P.IVA, chiave Resend): nessuna è stata toccata in questo batch.

---

## 7. Raccomandazioni residue (per impatto)

1. **Gate di contrasto nel CI** (`tools/check-a11y.mjs` sull'harness allegato): 0 nodi di contrasto, 0 controlli senza nome, 0 overflow su 8 URL rappresentative × 2 temi. Il token `--badge-fg` e la regola `.section-title` in dark sono la stessa famiglia di difetto già vista 3 volte.
2. **Guardia sui token**: grep-gate che fallisce su `color: #fff`/`white` accanto a `background: var(--accent*)` e su `color: var(--primary*)` usato come testo.
3. **Vendoring** delle 5 librerie CDN (chart.js, jspdf, html2canvas, dom-to-image-more, xlsx) + SRI; poi stringere la CSP.
4. **Self-hosting font** anche sui restanti 4-6 file (richiede glifi bengalese/arabo) e `font-display: optional`/metriche per azzerare il CLS residuo di home (0.060).
5. **Tabelle**: estendere `.table-scroll` alle altre pagine con tabelle (comunicazioni-2026 ha 1 tabella larga).
6. **`bf-cache`** su `/privati/`: rimuovere listener `unload`/`visibilitychange` invasivi se presenti.
7. **RUAP/`gestoreturni`**: tastiera sui div cliccabili, testi 9–10px → 12px, `#btn-toggle-monthly-stats` alto 16px → ≥24px.

---

## 8. Verifica sul DEPLOYATO (dopo merge e deploy — commit `911ffed`)

Deploy: PR #5 mergiata (`--rebase`), PR #4 chiusa come superata, PR #6 (questo lavoro) mergiata; GitHub Pages build **`built`** su `911ffed`, `sw.js` live = **`savianu-v403`**.

**Harness rieseguito sul sito live** — 30 record (15 pagine × light/dark, mobile 390 + axe 4.10.2):

| Esito sul live | Valore |
|---|---|
| Nodi di contrasto reali | **0** (1 segnalazione = `p#wizard-step-label`, `sr-only`: non visibile) |
| Overflow orizzontale | **0** su tutte le pagine |
| Violazioni axe | **1 per tema** — `heading-order` moderate su `colleghi/pir.html` (pre-esistente, 2 record su 30): da correggere `h2 -> h4` in `.pir-summary-box` |
| Errori JS/console | **0** |
| Service worker | `navigator.serviceWorker.controller` = `/sw.js`, cache `savianu-v403` creata, `savianu-v400` in attesa di cleanup, **1 sola navigazione** (nessun loop di reload) |

Controlli puntuali via `curl` sul live: `styles.css?v=20261014a` contiene `--badge-fg` (2), `@page A4` (1), `body.dark-mode .section-title` (1); `poster-styles.css?v=20261014a` contiene la media query (1); `privacy.html` contiene la voce `intl-inquiry`; `criteri-appropriatezza` ha 3 wrapper `table-scroll`; `protocollo-certificati-inps` ha lo spazio prima di `<br>`; `RUAP/js/config.js` serve la palette 700; `gestoreturni` ha `gv-footer`.

Pagine verificate sul live: `/404.html` · `/colleghi/RUAP/` · `/colleghi/criteri-appropriatezza.html` · `/colleghi/gestoreturni/gestoreturni.html` · `/colleghi/guida-accessi-pronto-soccorso.html` · `/colleghi/pir.html` · `/offline.html` · `/privacy.html` · `/privati/certificato-invalidita-civile.html` · `/ssn/` · `/ssn/esenzioni.html` · `/ssn/impegnative.html` · `/ssn/poster-it.html` · `/ssn/poster-ro.html` · `/ssn/salutementale.html`
