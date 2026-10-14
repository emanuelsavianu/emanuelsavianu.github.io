# HANDOVER — Audit UX/A11y savianu.it (round 3, 2026-10-14)

**Destinatario:** agente implementatore (con accesso al repo `~/Projects/savianu.it`, push su `main`).
**Autore dell'audit:** sessione Hermes del 2026-10-14 (misure sul sito **DEPLOYATO**, `https://savianu.it`).
**Regola di questo documento:** nessun rilievo senza prova riproducibile. Ogni voce ha *Evidenza* e *Verifica*.
**Questo round NON ha modificato il sito né il repo.** Il working tree è rimasto pulito (`git status` vuoto).

---

## 0. TL;DR — cosa c'è da fare

| # | Priorità | Cosa | Dove | Perché conta |
|---|---|---|---|---|
| F1 | **P0** | Testo **invisibile** in dark mode (navy su navy) | `colleghi/guida-accessi-pronto-soccorso.html` (`:120-126` + `:154`) | Il collega non legge *dove* andare (ospedale, scala, piano) |
| F2 | **P1** | Badge numerati **bianco su oro‑chiaro** in dark (1.85:1) | `colleghi/criteri-appropriatezza.html:78-82`, `privati/certificato-invalidita-civile.html` (span inline ×4) | Numeri dei passi illeggibili in dark |
| F3 | **P1** | RUAP: 204 rilievi contrasto + 2 critical axe | `colleghi/RUAP/*` | Strumento turni usato dai colleghi in studio |
| F4 | **P1** | Poster/pagine poster: **overflow orizzontale 300–540px** su mobile | `ssn/poster-styles.css:133` (+ `salutementale*`, `vivisano*`) | Le pagine multilingue per i pazienti stranieri si trascinano di lato |
| F5 | **P1** | Poster live con **placeholder e prompt AI in inglese visibili** (e in sitemap) | 10 URL `ssn/poster*.html`, `salutementale*`, `vivisano*` | Il paziente vede "friendly doctor in white coat…" al posto dell'immagine |
| F6 | **P2** | Tabelle fuori viewport su mobile (pir, criteri) | `colleghi/pir.html:455,504`, `colleghi/criteri-appropriatezza.html:116-148` | Lettura con pan orizzontale |
| F7 | **P2** | 11 `<h1>` con `<br>` senza spazio → screen reader "OperativoCertificati" | 8 pagine `colleghi/*` (+ verificare le 2 `malattia`) | Regressione del fix T8 (round 2) mai propagata |
| F8 | **P2** | Focus ring **oro su crema = 2.25:1** (< 3:1, WCAG 2.2 SC 1.4.11) | `styles.css` (164, 1178, 1309, 1433, 2232, 3930, 3130, 3842) | Indicatore di focus debole per chi naviga da tastiera |
| F9 | **P2** | Nomi accessibili mancanti (bottoni-icona, select, progressbar) + h1 duplicati | `colleghi/RUAP/index.html:414,416,397`, `colleghi/gestoreturni/gestoreturni.html:194,219,380` | axe critical/serious |
| F10 | **P3** | 15 pagine caricano ancora Google Fonts; 6 script CDN senza SRI | vedi §5.10-5.11 | Perf (TTFB 1.7 s su poster) + privacy (IP a Google) + supply chain |
| F11 | **P3** | Stampa: le pagine principali escono in **Letter**, non A4 | `styles.css` blocco `@media print` | Chi stampa una guida per il paziente ottiene formato US |
| F12 | **P3** | Placeholder input sotto soglia in dark (3.47:1) e in RUAP (2.54:1) | 4 pagine con `#*search*`, `colleghi/RUAP` | Ricerca poco leggibile |
| F13 | **P3** | `robots.txt` Disallow ma contenuto pubblico 200 (RUAP, gestoreturni, tools/) | vedi §5.13 | robots ≠ controllo d'accesso |
| F14 | **P3** | `privacy.html:135` dichiara Cloudflare Web Analytics: nessun beacon nel DOM servito | `privacy.html` | Disclosure/realtà |
| F15 | **P3** | 1 h1 + main mancanti su pagine secondarie (wordmark, offline) | `assets/brand/wordmark.html`, `offline.html` | axe moderate |

**Prima di iniziare:** il `main` locale è **avanti di 1 commit non pushato** (§2). Fare `git fetch` + rebase e push: i rilievi qui sotto sono misurati sul **deployato**, quindi alcune righe citate possono differire di poco dal vostro HEAD.

---

## 1. Cosa è già OK (NON rifare — verificato in questo round)

- **0 errori JS e 0 errori console** su 44 pagine × 2 temi (88 caricamenti strumentati).
- **Lighthouse 13.5 mobile su `/`**: Perf **100**, Accessibility **100**, Best Practices **100**, SEO **100**, CLS **0.056**, LCP **0.2 s**, TBT 0 ms.
- **Contrasto pulito (light *e* dark)** su: `/`, `/ssn/`, `/privati/`, `/colleghi/`, `/international/`, `/privacy.html`, `/404.html`, `/offline.html`, `/ssn/faq.html`, `esenzioni`, `impegnative`, `cert-malattia`, `privati/faq-riforma`, `bengalese`, `urdu`, `poster_multilingue`, `criteri-appropriatezza` (light), `guida-accessi-*` (light), `ausili-assistenziali`, `medicina-fisica-codici-LR`, `millewin-tips`, `criteri-appropriatezza` (dark, tranne i badge F2), `comunicazioni-2026`.
- **Ordine di focus** = ordine DOM = ordine visivo: 22 stop su `/` senza inversioni (misurato con Y assoluta).
- **Skip-link** presente, primo elemento tabbabile, target `#main-content` esistente; **anello di focus presente su ogni elemento** (il colore è il tema F8).
- **Menu mobile**: `aria-expanded` corretto, apertura/chiusura con **Escape** e ritorno del focus su `#nav-toggle`.
- **Modale "Avviso Importante"** (`/ssn/`, `#doctolib-modal`): focus entra nel dialog, Tab resta dentro, **Escape chiude**, chiusura **ricordata** dopo reload, **contrasto del contenuto OK** in light.
- **`prefers-reduced-motion: reduce`**: transizioni a `1e-05s`, nessun contenuto bloccato invisibile (`.reveal` presenti e visibili).
- **`prefers-color-scheme: dark` senza preferenza salvata**: la pagina parte dark (`html.dark-mode` + `body.dark-mode`), `theme-color` aggiornato, nulla scritto in localStorage.
- **No-JS**: nav pre-renderizzata (7 link), contenuto aperto, nessuna sezione collassata.
- **Stampa**: nav/footer/floating-FAQ nascosti.
- **Poster: 1 pagina A3 landscape** (verificato con `Page.printToPDF` + `preferCSSPageSize` su `poster-it`, `poster-ur` RTL, `salutementale`: `Pages: 1`, `Page size: 1191.12 x 841.92 pts (A3)`).
- Header di sicurezza, CSP, JSON-LD, canonical/hreflang, `alt` immagini: invariati e corretti.

---

## 2. Stato del repo / deploy (leggere prima di toccare)

```
/                       HEAD = 882f031  2026-10-14 21:21  "fix(urls): ricanonicalizza i link interni…"
origin/main                    e43cf8b  2026-10-13 14:54
LIVE (savianu.it)              styles.css?v=20261005b · app.js?v=20261005a · config.js?v=20261005a · sw savianu-v400
```

- **Il commit `882f031` (84 link interni in 25 file, `chrome.js?v=20261005b`, SW v402) non è pushato** → non è live.
- Tutte le misure di questo audit sono prese sul **deployato**.
- Deploy = commit + **push su `main`** (GitHub Pages + worker Cloudflare).
- **Se tocchi CSS/JS: bump del cache-buster `?v=` su ogni pagina + `node tools/update-sw.mjs`**, altrimenti i pazienti continuano a vedere il CSS vecchio (già successo: `styles.css?v=20261005b` è servito con `max-age` lungo).
- **Se tocchi il markup della nav/footer in `chrome.js`: `npm run prerender`** (il markup è pre-scritto dentro ogni HTML; `prerender.mjs --check` è un gate di `npm test`).
- Gate attuali (`npm test` → `tools/run-all-checks.mjs`): sintassi JS, orari, URL canoniche, link, prerender, i18n, SW precache, PDF senza dati compilati. **Non esiste ancora un gate di contrasto/a11y**: vedi miglioria I1.

---

## 3. Metodo e ambiente di misura (per riprodurre)

Harness in `harness/` (bundle allegato): `probe.js` (≈14 KB, iniettato nella pagina) + `runner.py` (loop pagine × temi × viewport, con `axe-core 4.10.2` iniettato a chunk).

- Matrice: **44 URL × {light, dark} @ 390×844 DPR2 mobile** + **44 URL × light @ 1280** → **166 record** in `raw/results.jsonl`.
- Check del probe: contrasto WCAG (composizione bottom-up dei layer di sfondo, `::placeholder`, gradienti), controlli invisibili, tap target, overflow orizzontale, `alt`/dimensioni immagini, `iframe title`, struttura heading, link (nome accessibile, `tel:`/`mailto:`, `target=_blank` senza `rel`), id duplicati, `aria-hidden` con focusabili, label/autocomplete form, div con `onclick`, troncamenti, testi < 12px, skip-link/main.
- Interattivo (browser reale, `Page.bringToFront` obbligatorio): ordine di focus da tastiera, menu mobile, modale, reduced-motion, `prefers-color-scheme`, no-JS, stampa (`Page.printToPDF`).

### Trappole dell'ambiente (costano tempo se non le sai)

1. **La tab deve essere visibile**: senza `Page.bringToFront` `document.visibilityState === 'hidden'` e **`requestAnimationFrame` non scatta mai** (qualsiasi `await rAF` va in timeout). Misurare un layout in tab nascosta dà falsi risultati.
2. **`Runtime.evaluate` del harness ha un tetto ~5 s**: niente await lunghi; per axe usare *polling* su una variabile globale, non `await axe.run(...)`.
3. **Iniezione di axe**: una singola evaluate da 553 KB **rompe l'IPC** (`BrokenPipeError`). Iniettare a chunk ≤ 20 KB accumulando in `window.__axeChunks` → `(0,eval)(join(''))` (funziona anche con CSP del sito). `harness/runner.py` lo fa già.
4. **Elementi `sr-only` (1×1 px) generano falsi positivi** in contrasto/troncamento (`h2#band-title`, `h2#intl-intro-heading`, `.sr-only`, `label.sr-only`). Escludere `width<=1 || height<=1`.
5. **axe mente sui gradienti** (lezione già nota): su `colleghi/pir.html` dark axe segnala **16** celle e su `criteri-appropriatezza.html` dark **5** celle a 1.48:1 — ma i colori reali sono crema `#f3efe6` su `#162438` (**≈12:1**) e `#cbd5e1` su gradiente `#0a1628→#11223a` (**≈9:1**). Arbitro = `getComputedStyle` + istogramma di pixel.
6. **Il titolo della pagina risulta prefissato da "🐴"** nell'ambiente di automazione (`document.title === <title>.textContent` ma **l'HTML servito non ha emoji**: verificato con `curl`). È un artefatto dell'harness, **non è un rilievo del sito**: non inseguirlo.
7. ⚠️ **I numeri di telefono sono mascherati nell'output dei tool**: `+39` + 4 asterischi + `0904` al posto delle cifre reali (verificato: `od -c` mostra le cifre vere, `grep`/`cat` no). **Mai copiare un numero di telefono dall'output di un tool**: nei file si scrive `CONFIG.CONTACTS.*`, oppure si legge il byte grezzo. È esattamente la trappola che nel 2026-09 ha prodotto `tel:+390****0904` in `index.html` e in 2 pagine `colleghi/` (vedi `docs/audit/2026-10-04/REPORT.md` §2bis).

---

## 4. F1 (P0) — Testo invisibile in dark mode

**File:** `colleghi/guida-accessi-pronto-soccorso.html`
**Righe:** `.ps-location { … color: var(--primary); }` (≈`:120-126`) — l'unico override dark presente è `body.dark-mode .ps-card { background: var(--primary); }` (`:154`).

In dark mode `--primary` → `--color-brand` → **`#1f3659`**, usato *sia* come sfondo della card *sia* come colore del testo della riga di localizzazione:

| Elemento | Colore testo | Sfondo | Rapporto |
|---|---|---|---|
| `p.ps-location` "Ospedale San Donato — Scala 1, Piano 2" | `#1f3659` | `#1f3659` | **1.00:1** |

**Evidenza:** misure computed su LIVE (`color: rgb(31,54,89)`, card `rgb(31,54,89)`) + **istogramma di pixel** della regione ritagliata: 98.55 % `#1f3659`, 0.63 % oro (la sola icona), **nessun pixel di testo** → la riga non è dipinta. Screenshot: `shots/shot-pronto-soccorso-dark.png`.

**Fix proposto (2 righe, stessa pagina):**
```css
/* accanto agli override già presenti a :154 */
body.dark-mode .ps-location { color: var(--accent); }   /* #e0b976 su #1f3659 = 7.31:1 */
```
e, per igiene, sostituire l'override della card con un token di superficie:
```css
body.dark-mode .ps-card { background: var(--color-surface); }  /* #162438 */
```
(se si passa a `--color-surface`, `--primary` torna utilizzabile come colore testo: verificare *tutti* i figli `.ps-card` — `h3` usa già `--accent-text`, `hours-value` ha già l'override dark).

**Verifica:** su `/colleghi/guida-accessi-pronto-soccorso.html` in dark, `getComputedStyle(p.ps-location)` → contrasto ≥ 4.5; oppure ri-eseguire il probe (atteso: `contrast: 0`).

---

## 5. F2 (P1) — Badge "bianco su oro" in dark mode (trappola token dual-mode)

**File/righe:**
- `colleghi/criteri-appropriatezza.html:78-82` → `.protocol-section > h2 .sec-n { background: var(--accent-text); color: #fff; }`
- `privati/certificato-invalidita-civile.html` → span inline con `background: var(--accent-text); color: #fff` (4 occorrenze: 1‑2‑3‑4 nel blocco "Come Si Svolge la Consulenza", ≈`:528-546`)

`--accent-text` = `--color-accent-strong`: **light `#7a5c2e`** (bianco su bronzo = 6.18:1 ✓) / **dark `#e0b976`** (bianco su oro chiaro = **1.85:1** ✗).

**Evidenza:** computed (`color: rgb(255,255,255)`, `background-color: rgb(224,185,118)`) + istogramma di pixel (badge 47.8 % oro, 1.8 % bianco). Screenshot: `shots/criteri-secn-dark.png`, `shots/certinval-dark.png`.

**Fix proposto** (introdurre un token di *foreground del badge*, che è ciò che manca):
```css
:root            { --badge-fg: #ffffff; }
body.dark-mode   { --badge-fg: #0a1628; }           /* navy su oro = 9.82:1 */
.sec-n, .step-num, .badge-accent { color: var(--badge-fg); }
```
Nelle due pagine: sostituire `color:#fff` con `color: var(--badge-fg)` (o aggiungere la regola dark `body.dark-mode .sec-n, body.dark-mode ol li > span { color:#0a1628; }`).
Occorrenze totali di `background: var(--accent-text)`: **5** (`grep -rn 'background: var(--accent-text)' --include='*.html'`), solo in questi 2 file → intervento circoscritto.

**Verifica:** dark mode → contrasto del badge ≥ 4.5 in entrambe le pagine; light invariato (6.18).

---

## 6. F3 (P1) — RUAP (turni): contrasto e nomi accessibili

`/colleghi/RUAP/` (pagina **pubblica 200**, `robots.txt` la elenca come Disallow), 46 KB + `js/` + `config.js`.

**Contrasto — 204 nodi per scansione (misura identica in light e in dark; colori fissi):**

| Testo | Sfondo | Rapporto | Nodi | Cosa |
|---|---|---|---|---|
| `#94a3b8` (slate‑400) | `#ffffff` | 2.56 | **44** | "Assegna" su slot vuoti, etichette "residue" |
| `#ffffff` | `#0891b2` (cyan‑600) | 3.68 | 24 | slot medico colorIndex |
| `#ffffff` | `#3b82f6` (blue‑500) | 3.68 | 24 | slot "Savianu" |
| `#ffffff` | `#ec4899` (pink‑500) | 3.53 | 24 | slot "Zuppardo" |
| `#ffffff` | `#f97316` (orange‑500) | 2.80 | 22 | slot "Gabrielli" |
| `#ffffff` | `#a855f7` (violet‑500) | 3.96 | 22 | slot "Cerofolini" |
| `#ffffff` | `#22c55e` (green‑500) | 2.28 | 14 | slot "Fiori" |
| `#ffffff` | `#f43f5e` (rose‑500) | 3.67 | 8 | slot "Gavetta" |
| `#ffffff` | `#6366f1` (indigo‑500) | 4.47 | 8 | slot "Miroballo" |
| `#64748b` (slate‑500) | `#faf7f1` | 4.45 | 5 | intestazioni giorni (`Lun`, `Mar`…) |
| `#ffffff` | `#14b8a6` (teal‑500) | 2.49 | 4 | slot "Bensi" |
| `#ffffff` | `#f59e0b` (amber‑500) | 2.15 | 4 | slot "Sodo", `#btn-conflicts` |
| `#c29b57` (oro) | `#f3efe6` (crema) | 2.25 | 1 | `#update-banner-close` |

Origine dei colori: `colleghi/RUAP/config.js` (`colorIndex` per medico) + `colleghi/RUAP/js/renderers.js:102` (`slotBtn.style.backgroundColor = colorHex`, testo `text-white`).

**Fix proposto** — mappare i colori degli slot su tonalità **700** (bianco ≥ 5:1, misurate):

| Ruolo colore | attuale (500) | → 700 | contrasto con bianco |
|---|---|---|---|
| orange | `#f97316` | **`#c2410c`** | 5.18 |
| green | `#22c55e` | **`#15803d`** | 5.02 |
| amber | `#f59e0b` | **`#b45309`** | 5.02 |
| teal | `#14b8a6` | **`#0f766e`** | 5.47 |
| cyan | `#0891b2` | **`#0e7490`** | 5.36 |
| blue | `#3b82f6` | **`#2563eb`** | 5.17 |
| pink | `#ec4899` | **`#db2777`** | 4.60 |
| rose | `#f43f5e` | **`#e11d48`** | 4.70 |
| indigo | `#6366f1` | **`#4f46e5`** | 6.29 |
| violet | `#a855f7` | **`#7c3aed`** | 5.70 |

I 600 intermedi **non bastano** (orange 600 = 3.56, green 600 = 3.30, amber 600 = 3.19: misurati).
In alternativa (meno invasiva): mantenere il colore pastello ma passare il testo a navy (`#0f172a`) — verificare il contrasto per *ogni* colore (con i 500 il navy va da ~4.6 a ~9).
Altre correzioni RUAP:

- `#94a3b8` → `text-slate-500` (`#64748b`, 4.34 su bianco… **ancora sotto**: usare `text-slate-600` `#475569` = 5.6 su bianco).
- **axe critical `button-name` ×4**: `colleghi/RUAP/index.html:414,416` (`#sidebar-week-prev/next`, solo `<i class="fa-chevron-…">`) → `aria-label="Settimana precedente"` / `"Settimana successiva"` (verificare gli altri 2 bottoni-icona).
- **axe critical `select-name`**: `#filter-aft` (`:397`) e `#doctor-search` (solo placeholder) → `<label class="sr-only" for="…">` o `aria-label`.
- **Div con `onclick` non raggiungibili da tastiera** (≈39 nodi: `#sidebar-doctors .doctor-card`, `#monthly-stats-panel` rows, `#print-bilancio-grid .p-row`) → `role="button"` + `tabindex="0"` + gestione Enter/Spazio, oppure `<button>`.
- **axe moderate `region`**: contenuto fuori da landmark (`.max-w-screen-xl … > span`).
- **`<h1>` duplicato**: `:272` "Gestione Turni RUAP" + `:777` "Turni RUAP Attività Diurne" (area di stampa) → il secondo diventa `<h2>` o `<div role="heading" aria-level="2">`.
- **Testi 10–11 px**: `.text-[11px]`, `p#header-subtitle` (11 px), `#conflicts-header-badge` (10 px) → ≥ 12 px.
- **Troncamenti**: 100+ button slot con `truncate` e testo compresso a 390 px → valutare `title`/`aria-label` (già presente su alcuni) o due righe.

**Verifica:** ri-eseguire probe+axe su `/colleghi/RUAP/` → atteso `contrast: 0`, `axe.v: []`.

---

## 7. F4 (P1) — Overflow orizzontale su mobile (poster e derivati)

**Pagine:** `ssn/poster-it|en|ro|bn|ur.html`, `ssn/salutementale(-ro).html`, `ssn/vivisano(-ro).html` (8 file). `poster_multilingue.html` è **OK** (ha già le media query).

**Misura @390 px** (`documentElement.scrollWidth` − `clientWidth`): poster-it **437**, poster-ro **536**, poster-en **437**, poster-bn **419**, poster-ur **324**, salutementale **299**, salutementale-ro **311**, vivisano **385**, vivisano-ro **304** → Chrome riduce lo zoom (innerWidth 827 su clientWidth 390) e il contenuto resta tagliato/fuori misura.

**Causa (riga esatta):** `ssn/poster-styles.css:133-138`
```css
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; padding: 1mm 10mm 3mm; }
```
nessuna media query; le `.card` hanno `min-width:auto` e contenuto non comprimibile (`padding` in mm, `figcaption` con testo lungo) → la *min-content* delle 4 colonne ≈ 800-900 px.

**Fix proposto** (copiare il pattern già presente in `ssn/poster_multilingue.html:255-260`):
```css
@media screen and (max-width: 1200px) { .cards { grid-template-columns: repeat(2, 1fr); } }
@media screen and (max-width:  700px) { .cards { grid-template-columns: 1fr; } }
.card { min-width: 0; }
.card h3, .img-ph figcaption { overflow-wrap: anywhere; }
```
Le pagine `salutementale*.html` / `vivisano*.html` hanno stili inline propri: replicare le stesse due media query nel loro `<style>` (o farle passare a `poster-styles.css`).

**Verifica:** a 390 px `document.documentElement.scrollWidth === clientWidth` su tutte e 8; screenshot `shots/shot-poster-it-mobile-light.png` come riferimento "prima".

---

## 8. F5 (P1) — Poster pubblicati con placeholder + prompt AI visibili

Le 8 pagine poster + `poster_multilingue` sono **live, in `sitemap.xml`** (10 entry) e contengono `<figure class="img-ph">` con `figcaption` = **prompt di generazione immagine in inglese**, es. da `ssn/salutementale.html:49`:
`hero-mente · person sitting under a heavy cloud that is clearing, sun rising over the profile of a Tuscan cathedral dome … flat vector illustration … no text, no letters …`
Verificato anche nel PDF di stampa (`pdftotext print/poster-it.pdf`): il testo del prompt è nell'output stampabile.

**Impatto:** sono le pagine pensate per i pazienti stranieri (IT/EN/RO/BN/UR) → un paziente vede un riquadro tratteggiato con istruzioni in inglese per un generatore di immagini.

**Fix proposto (decisione di prodotto, tre opzioni):**
1. **Preferita** — nascondere i placeholder in produzione e tenerli solo con un flag:
   ```css
   @media screen { .img-ph figcaption { display: none; } }           /* il prompt non è contenuto */
   body.show-placeholders .img-ph figcaption { display: block; }      /* `?placeholders=1` o classe dev */
   ```
   (e `aria-hidden="true"` sul `figure` vuoto, oppure un `alt`/label sensata).
2. Mantenerli visibili ma **`<meta name="robots" content="noindex">` + fuori dalla sitemap** finché non ci sono le immagini.
3. Sostituire i `<figure>` con le immagini reali (`assets/img/poster/*.png` — i path sono già indicati nei commenti HTML) e rimuovere i `figcaption`.

**Verifica:** `grep -c 'friendly doctor in white coat' ssn/*.html` → 0 in produzione; sitemap coerente.

---

## 9. F6 (P2) — Tabelle larghe su mobile

- `colleghi/pir.html:455,504` → `.pir-table` **674 px** a 390 (pagina 725): nessun wrapper scrollabile, nessuna media query.
- `colleghi/criteri-appropriatezza.html:116-148` → `.crit-table` **508 px** a 390 malgrado la `@media (max-width:600px)` esistente (riduce solo il font e il `white-space` della prima colonna).

**Fix proposto:**
```css
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }
.table-scroll > table { min-width: 100%; }
```
avvolgere i `<table>` in `<div class="table-scroll" tabindex="0" role="region" aria-label="Tabella: …">`.
**Verifica:** `scrollWidth === clientWidth` a 390 e nessun taglio del contenuto.

---

## 10. F7 (P2) — `<h1>` con `<br>` senza spazio (screen reader)

8 pagine `colleghi/` con `<br>` attaccato alla parola precedente → il nome accessibile si concatena (**"Protocollo OperativoCertificati INPS D.Lgs. 62/2024"**, *"Guida AccessiMalattie Infettive…"*, *"Medicina FisicaPrestazioni Fascia LR"*, *"Ausili AssistenzialiElenco 2B"*, *"Assistenza DomiciliareADI · ADP · PAI · STU"*, *"Comunicazioni ufficiali 2026per la Medicina Generale"*, *"Guida AccessiPronto Soccorso Specialistici"*, *"Guida AccessiAccessi Vascolari"*):

```
colleghi/adi-adp-pai.html:290                colleghi/guida-accessi-vascolari.html:254
colleghi/ausili-assistenziali.html:171       colleghi/medicina-fisica-codici-LR.html:172
colleghi/guida-accessi-pronto-soccorso.html:198   colleghi/protocollo-certificati-inps.html:329
colleghi/guida-accessi-malattie-infettive.html:195 colleghi/comunicazioni-2026.html:408
```
(`privati/faq-riforma.html:458` ha già lo spazio → **OK**; le due pagine `malattia` contengono `<br>` negli h1: verificare lo spazio con lo stesso grep.)

**Fix:** inserire uno spazio prima di `<br>` (pattern già usato nel round 1) — `>Protocollo Operativo <br>Certificati INPS<`.
**Verifica:** `grep -rn '<h1[^>]*>[^<]*<br' --include='*.html' .` → nessun match senza spazio; `textContent` di ogni h1 senza parole incollate.
**Nota correlata (P2, basso):** salti di livello heading su `colleghi/guida-interattiva-mmg.html` (h2→h4 "1. Colpa Grave"), `colleghi/pir.html` (h2→h4 `.pir-summary-yes`), `colleghi/millewin-tips.html` (h1→h4).

---

## 11. F8 (P2) — Anello di focus sotto soglia di contrasto

Con la navigazione da tastiera (22 stop su `/`) l'outline applicato è **`3px solid rgb(194,155,87)`** = `--accent` (oro) → **2.25:1 su crema `#f3efe6`** (WCAG 2.2 SC 1.4.11 richiede ≥3:1 per gli indicatori non testuali). Su navy invece va bene (5.22:1) e in dark (7.01:1).

Il token corretto **esiste già** ma non è usato ovunque: `:root { --color-focus: #7a5c2e; --focus-ring: 3px solid var(--color-focus); }` (`#7a5c2e` su crema = **5.39:1**) e in dark `--color-focus: #e0b976`.

**Fix:** nelle regole con contesto **chiaro** sostituire `outline: … var(--accent)` con `outline: var(--focus-ring)`:
`styles.css:164, 1178, 1309, 1433, 2232, 3930` (+ verificare `3130` e `3842`, che usano `--ed-brass`).
**Verifica:** su `/` e `/ssn/`, con Tab, `getComputedStyle(document.activeElement).outlineColor` deve essere `rgb(122,92,46)` su fondo chiaro e `rgb(224,185,118)` in dark.

---

## 12. F9 (P2) — Gestore Turni (`colleghi/gestoreturni/gestoreturni.html`)

- **axe critical `button-name` ×3** (es. `:194` `#btn-dark-mode`, bottone solo-icona) → `aria-label`.
- **axe serious `aria-progressbar-name`** `:380` `#wizard-progress-dots role="progressbar"` → `aria-label="Avanzamento configurazione"`.
- **axe minor `empty-heading`** `:219` `<h2 id="cal-title"></h2>` (riempito via JS) → popolare subito o rimuovere il nodo vuoto.
- **Contrasto (misura mobile):** **3 nodi in light** — `#btn-export` bianco su `#3b82f6` **3.68**, `p#wizard-step-label` `#94a3b8` su bianco **2.56**, footer `#64748b` su `#f1f5f9` **4.34**; **4 nodi in dark** — gli stessi tre più l'emoji 📅 `#e2e8f0` su bianco **1.23** e il footer su `#0f172a` **3.75**.
- **`<h1>` duplicato** (`:188` + "Benvenuto!" del wizard).
- Il testo di `p#wizard-step-label` risulta troncato a 1 px di larghezza → verificare la classe `truncate`/larghezza del contenitore.

---

## 13. F10-F12 (P3) — Perf, SRI, stampa, placeholder

### 13.1 Google Fonts esterni (15 pagine)
`colleghi/RUAP/index.html`, `colleghi/malattia.html`, `ssn/malattia.html`, `ssn/bengalese.html`, `ssn/urdu.html`, `ssn/poster-{it,en,ro,bn,ur,multilingue}.html`, `ssn/salutementale{,-ro}.html`, `ssn/vivisano{,-ro}.html`.
Effetto misurato (mobile): `poster-it` **TTFB 1749 ms / load 2135 ms** vs pagine self-hosted **256–700 ms**. Inoltre: IP del visitatore a Google (rilevante per `privacy.html`). Il self-hosting è già pronto (`assets/fonts/fonts.css` + woff2 subsettati + licenza OFL): rimuovere il `<link>` a `fonts.googleapis.com` e usare `assets/fonts/fonts.css` (attenzione a CSP `style-src`/`font-src`, che oggi elencano Google).
### 13.2 Sei script CDN senza SRI
`grep -rn 'cdn.jsdelivr.net\|cdnjs.cloudflare.com\|unpkg.com' --include='*.html'` → **`integrity=` = 0 occorrenze**. File: `colleghi/RUAP/index.html` (4), `colleghi/gestoreturni/gestoreturni.html` (2), `colleghi/guida-interattiva-mmg.html` (1), `colleghi/malattia.html` (1), `ssn/malattia.html` (1). Librerie: chart.js, jspdf, html2canvas, dom-to-image-more, xlsx, + `calendar.google.com`.
**Fix:** `integrity="sha384-…"` + `crossorigin="anonymous"`, oppure vendorizzare in `/assets/vendor/` (come già fatto per Lenis e FontAwesome subset) e **stringere la CSP** rimuovendo cdnjs/jsdelivr/unpkg da `script-src`.
### 13.3 Stampa A4
`Page.printToPDF` su `/` e `/ssn/` → `Page size: 612 x 792 pts (letter)`. Aggiungere al blocco `@media print` di `styles.css`:
```css
@page { size: A4; margin: 12mm; }
```
(poster: **non toccare** — `@media print { @page { size: A3 landscape } }` in `poster-styles.css:243` funziona, verificato a 1 pagina).
### 13.4 Placeholder degli input di ricerca
`#faq-search`, `#search-esenzioni`, `#search-impegnative`, `#search-tools`: `#757575` su sfondo dark `#11223a` = **3.47**; RUAP `#doctor-search`: `#9ca3af` su bianco = **2.54**.
**Fix:** colore dai token per modo — light `#6b7280` (4.6 su bianco), dark `#94a3b8` (6.4 su `#11223a`): `::placeholder { color: var(--placeholder); }` con `--placeholder` ridefinito in `body.dark-mode`.
### 13.5 Fiocco "+" delle FAQ malattia (basso)
`ssn/malattia.html` e `colleghi/malattia.html`: `#0d9488` su bianco = **3.74** (20 px/300 → non è "large text"). Fix: `#0f766e` (4.9) o `aria-hidden="true"` sul glifo (è decorativo, il nome del bottone viene dal testo accanto).

---

## 14. F13-F15 (P3) — Igiene, robustezza, disclosure

- **F13 robots ≠ accesso:** `robots.txt` elenca `Disallow` per `/colleghi/RUAP/`, `/colleghi/gestoreturni/`, `/tools/`, `/colleghi/xsegretarie.html` (che ora è **301**), `/offline.html`, `/404.html` — ma tutti rispondono **200 pubblici**, a parte la 301 citata e `/404.html` (accessibile, usato dal 404 del worker). `tools/run-all-checks.mjs` è scaricabile pubblicamente.
  **Fix:** Cloudflare Access (service token) su `/colleghi/RUAP/*`, `/colleghi/gestoreturni/*`, `/tools/*`, `/cloudflare/*`, `/assets/brand/*`; e togliere dal `robots.txt` le righe che pubblicizzano i path interni (restano utili solo se Access è attivo).
- **F14 disclosure:** `privacy.html:135` dichiara "statistiche di navigazione raccolte in forma aggregata e anonima (Cloudflare Web Analytics)": nel DOM servito **non c'è alcun beacon** (`cloudflareinsights`/`beacon.min.js` assenti). O si abilita CF Web Analytics, o si riscrive la frase (direzione GDPR-safe: "il sito non raccoglie statistiche").
- **F15 landmark/h1 mancanti:** `assets/brand/wordmark.html` (axe moderate: `landmark-one-main`, `page-has-heading-one`, `region`; pagina asset pubblica 200) e `offline.html` (`landmark-one-main`, `region`) → avvolgere il contenuto in `<main>` e aggiungere un `<h1>` (o togliere la pagina dal pubblico se è solo un asset di lavoro).
- **Falsa pista documentata:** il campo honeypot di `/international/` (`.intl-hp` con `aria-hidden="true"`) **è già corretto** (`tabindex="-1"`); il probe lo segnala solo perché il selettore considera gli `input` a prescindere dal tabindex. Idem i `mailto:…?subject=…` (`colleghi/adi-adp-pai.html:480`, `guida-accessi-vascolari.html:284`, `guida-accessi-malattie-infettive.html:230,251`, `colleghi/index.html:684`): link **validi**, flaggati dal mio regex troppo rigido.
- **Nits modale** (funziona già): chiusura → il focus va su `<body>` invece che su `#main-content` (la modale si apre da sola, non c'è un trigger); il body **non** viene bloccato nello scroll (`overflow: visible`). Cosmetici.

---

## 15. Migliorie proposte (non solo fix)

1. **I1 — Gate a11y in `npm test` (alto valore).** Il repo ha già 9 gate in `tools/run-all-checks.mjs`. Aggiungere `tools/check-a11y.mjs` basato su questo harness (`harness/probe.js` + axe-core vendored in `tools/vendor/axe.min.js`), con soglie: **0** fallimenti di contrasto, **0** controlli senza nome accessibile, **0** `docOverflow`, **0** errori JS. Esecuzione consigliata su un set di 6-8 URL rappresentative (home, `/ssn/`, `/privati/`, `/colleghi/`, `criteri-appropriatezza`, `guida-accessi-pronto-soccorso`, `RUAP`, un poster) × {light, dark} a 390 px. Nota tecnica: nel CI headless servono `--no-sandbox`, `Page.bringToFront`, le stesse esclusioni per `sr-only` (§3.4) e l'arbitraggio manuale dei gradienti (§3.5).
2. **I2 — Guardia sui token dual-mode.** Accanto al commento `@guard:accent-on-light` in testa a `styles.css`, aggiungere `@guard:accent-badge` + un grep-gate che fallisce se compare `color:#fff` (o `#ffffff`) in una regola con `background: var(--accent*)`. Il difetto F2 è la stessa famiglia del T3/T5 del round 1 e tornerà.
3. **I3 — Passata dark sistematica negli artefatti di audit.** Il round 2 lasciava "dark-mode render pass" fra i pending: questo round l'ha fatto (44×2 record) — conservare `raw/results.jsonl` come baseline e rifare il diff dopo i fix (`docs/audit/<data>/` è la sede naturale; **nota:** `docs/` **non** è in `.gitignore`, i file del round 2026-10-04 sono committati: decidere se committare anche questi).
4. **I4 — Font self-hosted ovunque** (F10) + `font-display: optional` o metriche di fallback per portare il **CLS da 0.056 a < 0.05**.
5. **I5 — Stampa A4** (F11) + una classe `.no-print` riutilizzabile.
6. **I6 — Placeholder poster come flag di build** (F5, opzione 1).
7. **I7 — Utility `.table-scroll`** documentata in `DESIGN.md` e usata su pir/criteri (F6).
8. **I8 — Vendoring delle 5 librerie CDN** → -5 origini di terze parti, CSP più stretta, niente SRI da mantenere.
9. **I9 — Rieseguire l'audit dopo i fix e confrontare i record**: 1 comando (`harness/runner.py` + `raw/results.jsonl`) → diff per pagina/tema. Baseline 2026-10-14: **166 record, 1 pagina con contrasto critico in dark (F1), 2 pagine con badge 1.85 (F2), 3 pagine con overflow (F4/F6), 0 errori JS**.

---

## 16. Ordine di lavoro suggerito

1. `git fetch && git rebase origin/main` (o merge) e **push** del commit pendente: allineare repo e live prima di misurare.
2. **Batch A — dark mode (P0/P1)**: F1 (1 regola), F2 (1 token + 5 occorrenze), più la verifica dark delle pagine `colleghi/*` con `.ps-card`/badge. Bump `?v=` + SW. → `npm test` + probe dark su quei 3 URL.
3. **Batch B — mobile (P1/P2)**: F4 (poster CSS + media query), F6 (`.table-scroll`), F5 (placeholder poster: decisione).
4. **Batch C — RUAP/gestoreturni (P1/P2)**: F3 + F9 (colori slot, label/aria, tastiera, h1, font ≥12 px).
5. **Batch D — semantica e dettagli (P2/P3)**: F7 (spazi negli h1 + heading order), F8 (focus ring), F10-F12, F13-F15.
6. **Batch E — irrobustimento**: I1 (gate), I2 (guardia token), I4-I8.
7. Ogni batch: bump cache-buster + `node tools/update-sw.mjs`, `npm test` verde, poi `push` (deploy) e **ri-misura sul deployato** (il live può servire CSS in cache: usare `?cb=<ts>` come nell'harness).

**Divieti / attenzioni:**
- Non copiare **mai** numeri di telefono dall'output di tool (§3.7): usare `CONFIG.CONTACTS.*`.
- Non modificare a mano il markup della nav/footer dentro gli HTML: è generato da `chrome.js` via `tools/prerender.mjs`.
- Non toccare i colori di brand: oro `#C29B57` è **decorazione/icone**; per il testo su chiaro esiste `--accent-text` (`#7a5c2e`). Vedi l'header `@guard:accent-on-light` in `styles.css`.
- I poster sono **print-first**: le modifiche responsive vanno dentro `@media screen`, senza toccare il blocco `@media print`/`@page` A3.
- Dopo ogni modifica di `styles.css`/`app.js`/`chrome.js`/`config.js`: bump `?v=` **e** versione SW.

---

## 17. Appendice — artefatti di questo audit

Cartella: `~/Documents/savianu-audit-2026-10-14/`

| File | Contenuto |
|---|---|
| `raw/results.jsonl` | **166 record** grezzi: per pagina/tema/viewport → contrasto, unmeasurable, tap, overflow, immagini, heading, link, label, trunc, stuck, errori JS, `perf` (TTFB/load/byte/richieste), violazioni axe (id/impact/n/target) |
| `harness/probe.js` | probe di pagina (≈14 KB) — contrasto con composizione dei layer, controlli invisibili, tap, overflow, heading, link, form, stuck content |
| `harness/runner.py` | runner (matrice pagine×temi×viewport, iniezione axe a chunk, scroll-sweep per le reveal, `SET_THEME`, `PERF`) |
| `shots/` | screenshot di evidenza: `shot-pronto-soccorso-dark.png` (F1), `criteri-secn-dark.png` + `certinval-dark.png` + `certinval-step-dark.png` (F2), `shot-ruap-mobile-light.png` (F3), `shot-poster-it-mobile-light.png` (F4), `shot-home-dark.png`, `home-contact-label{,-dark}.png` + `ps-card-navy-dark.png` + `home-h2-band.png` (arbitraggi: falsi positivi ritirati) |
| `print/*.pdf` | prove di stampa: `poster-it.pdf`, `poster-ur.pdf`, `salutementale.pdf` (1 pagina A3 landscape), `home.pdf` e `ssn-hub.pdf` (Letter → F11) |
| `HANDOVER.md` | questo documento |

**Baseline di riferimento (da riconfrontare dopo i fix):**

| Metrica | Valore 2026-10-14 |
|---|---|
| Record | 166 (44 URL × 2 temi mobile + 44 desktop light) |
| Errori JS / console | 0 / 0 |
| Fallimenti contrasto (esclusi i falsi positivi documentati) | 1 pagina critica (F1) + 2 pagine badge dark (F2) + RUAP (204) + gestoreturni (10) + 2 pagine "+" FAQ |
| Overflow orizzontale mobile | 8 poster/pagine poster + 2 pagine con tabelle |
| axe violations | RUAP (2 critical, 1 serious, 1 moderate), gestoreturni (1 critical, 1 serious, 1 minor), pir (heading-order), wordmark (3 moderate), offline (2 moderate), criteri dark (1 serious → reale, 5 nodi = badge F2) |
| Lighthouse 13.5 mobile `/` | Perf/A11y/BP/SEO 100 · CLS 0.056 · LCP 0.2 s |
| Bytes/richieste `/` (mobile) | 473 KB / 16 richieste · TTFB 730 ms · load 769 ms |
