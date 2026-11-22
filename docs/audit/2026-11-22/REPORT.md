# UI backlog 2026-11-22 — esito implementazione

**Branch:** `ui-audit/2026-11` (base `main` = `022f148`), **non pushato**, niente deploy.
**Metodo:** ogni voce del backlog è stata prima verificata sul codice reale, poi corretta con la modifica minima; verifica con harness headless locale (`python3 -m http.server` + Chromium CDP + axe-core 4.10.2) a 390x844, 768x1024, 1280x800, tema chiaro e scuro.
**Stato gate:** `npm test` verde a ogni commit; `styles.css?v=20261122d`, `app.js?v=20261122a`, SW `savianu-v430`.

## 1. Tabella degli interventi

| id | stato | file | commit | verifica | prima / dopo |
|---|---|---|---|---|---|
| UI-001 | fixed | `colleghi/index.html` | `a0197dc` | axe `/colleghi/`: color-contrast **5 → 0** nodi (chiaro), 0 (scuro) | conteggio chip `opacity:.65` (3.2:1) → colore pieno `--text-medium` (7.53:1 su bianco) |
| UI-002 | fixed | `privati/certificato-invalidita-civile.html` | `dcd37f2` | `calendar.google.com` bloccato via CDP: fallback visibile, **0 errori console**, `href` tel corretto | `Uncaught ReferenceError: calendar is not defined` + riquadro vuoto → messaggio con telefono della segreteria |
| UI-003 | fixed | `international/index.html` | `7f3fc9a` | 390px: `tel:112` a y=712 (h 44), `tel:116117` subito sotto; axe 0 | emergenza solo nel testo a fine pagina (y=8537) → striscia toccabile nell'hero |
| UI-004 | fixed (parziale, vedi §3) | `index.html`, `styles.css` (tutte le pagine per il `?v=`) | `7345b12` | 390x844: chrome 356 → **292px**, CTA mobile y=869 → **499** | "Prenota su Doctolib" era sotto la piega **e** dietro la barra fissa (top 777) → CTA in prima schermata |
| UI-005 | fixed | `international/index.html` | `7f3fc9a` | 390x844: CTA y=786 → **590** (target <700) | CTA coperta dalla barra fissa → sopra il sottotitolo |
| UI-006 | needs owner | — | — | — | destinazione DOCTOLIB nella barra di `/international/` (profilo SSN) vs CTA privata: decisione del titolare |
| UI-007 | fixed | `styles.css` | `b4d1a41` | bersagli <24px a 390px: **31 → 1** (solo honeypot `.intl-website`, `aria-hidden`); liste aree in home 44-60px; overflow 0 su 9 pagine | link 20-22px → ≥24px con padding compensato (layout invariato), 44px per `.ed-path__links` |
| UI-008 | fixed | `tools/check-tokens.mjs`, `tools/token-baseline.json`, `tools/run-all-checks.mjs` | `2d83ebd` | test negativo: `.tmp-probe{color:#ff00aa}` → `npm test` FAIL con `styles.css:4103`; rimosso → verde | nessun gate → gate su incrementi (baseline 834 hex in 44 file) |
| UI-009 | fixed | `DESIGN.md` | `fbc1914` | tabella con i rapporti calcolati (luminanza WCAG) | 1.8:1 dichiarato → **2.25:1** misurato; aggiunto `#2E7D6B` su crema = 4.29:1, mai testo normale |
| UI-010 | fixed | `chrome.js`, `app.js` | `ba32eb0` | click ENG/ITA: `aria-pressed` commuta (`true/false`) con `html[lang]`; i18n 313/313 | stato attivo solo con classe CSS → esposto con `aria-pressed` |
| UI-011 | fixed | `styles.css` | `deba34f` | 390px `display:none`, 768px visibile | pulsante fisso sopra l'inizio delle righe di testo → nascosto solo sul telefono |
| UI-012 | needs owner | — | — | — | `og:image` 480x480 → serve una card 1200x630 approvata |
| UI-013 | needs owner | — | — | — | titoli duplicati `vivisano*.html` / poster: noindex, canonical o titolo distinto |

## 2. Verifica finale (matrice completa)

13 pagine × 390x844, 768x1024, 1280x800 × chiaro/scuro = **78 run** con axe (WCAG 2.0/2.1/2.2 A+AA + best-practice):

- **0 violazioni axe** in tutti i 78 run.
- **0 overflow orizzontale** (`scrollWidth - clientWidth = 0`) in tutti i run.
- `npm test` verde: link, URL, SEO/meta, i18n 313/313, prerender, SW precache (71 URL), PDF PII, **colori fuori dai token**.

Screenshot "dopo" in `docs/audit/2026-11-22/screens/` (cartella locale, non tracciata): `home-390-light.png`, `home-390-dark.png`, `international-390-light.png`, `colleghi-chips-390-light.png`, `certificato-fallback-390.png`, `home-1280-light.png`.

## 3. UI-004 — cosa è stato fatto e cosa resta

Il target del brief ("Prenota su Doctolib" a y<650) **non è raggiungibile senza togliere contenuto dalla prima schermata**: a 390px, prima della scheda Pazienti, ci sono masthead (237px), stato di apertura con i numeri di emergenza (167) e la striscia orari (133). Misure:

- chrome 356 → 292px (riga hamburger assorbita nella barra controlli + padding masthead/hero ridotti);
- CTA di prima schermata in hero: y=**499** (visibile sopra la barra fissa che inizia a 777);
- CTA dentro la scheda Pazienti: 869 → 859 (resta sotto la piega, come prima: è la ripetizione dell'azione, non la sua unica sede).

Restano due decisioni di design (non prese, perché cambiano l'identità visiva):
1. masthead mobile su una riga (logo accanto a nome+telefono): altri ~85px, ~400 con tutto il resto;
2. spostare la striscia orari sotto la prima scheda: ~133px.

## 4. Cambi sistemici

- **Un gate nuovo** (`tools/check-tokens.mjs`) congela il debito colore (834 hex storici) e blocca gli incrementi; `--update` per il baseline, `--list` per la fotografia.
- **Chrome mobile**: una sola barra controlli (lingua/tema + hamburger) sotto i 600px su tutte le pagine, dropdown a tutta larghezza con `position:fixed`.
- **Aree di tocco**: regola trasversale sui link di testo/lista a ≤768px (padding compensato dal margine, layout invariato) e 44px per le liste delle aree.
- **Versionamento**: `styles.css` e `app.js` allineati in tutte le pagine e nelle costanti di `tools/build-modulistica.mjs` (erano rimaste a `20261113a` / `20261104a`, una bomba a orologeria per il gate "modulistica allineata").

## 5. Annotazioni fuori backlog (non corrette)

1. **`fa-moon` non è nel subset FontAwesome** (`assets/fontawesome/css/solid.subset.css`): l'icona del toggle tema è vuota sulle pagine che usano il subset — il bottone resta senza glifo visibile (ha `aria-label`, quindi è solo visivo).
2. **Honeypot `#intl-website` visibile** su `/international/`: occupa 19px in flusso invece di essere fuori schermo.
3. **URL Doctolib ripetuto** tre volte in `index.html` (schede + CTA mobile): `CONFIG.DOCTOLIB.booking` esiste ma l'HTML lo scrive a mano — candidato a un `data-` link come per i contatti.
4. **`DESIGN.md` dice "no hex in HTML"** mentre l'HTML ne contiene 533: il gate ora impedisce la crescita, non la bonifica.

## 6. Non fatto per mandato

- Nessun push su `main`, nessun deploy: la verifica live e la pubblicazione richiedono il via del titolare.
- Nessuna modifica a copy, URL di prenotazione, orari o tariffe.
- `docs/audit/2026-10-14` §4 (deviazioni intenzionali: embed Google Calendar, placeholder poster, `assets/brand/wordmark.html`, RUAP, robots) non toccata.
