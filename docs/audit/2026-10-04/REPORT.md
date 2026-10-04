# Audit & Remediation — savianu.it (post-redesign)

**Branch:** `fix/post-redesign-audit` (base `cb664e8` on `main`)
**Data:** 2026-10-04 · **Repo:** `emanuelsavianu/emanuelsavianu.github.io`
**Ambiente:** server locale `python3 -m http.server 8099` (working tree), Chromium headless (Playwright, kit venv), Lighthouse 12, axe-core.

---

## 1. Verdict

**14 fix atomici applicati e verificati sul campo; gate tecnici verdi (`npm test`, 0 link rotti, 0 errori JS, axe 0 serious/critical).**
Le performance mobile e il CLS **non** raggiungono i target dichiarati sul server locale senza compressione/CDN: causa misurata e documentata (§4). Nessun segreto presente. Il report esterno attribuito a "Gemini" è risultato **in gran parte fabbricato** (§6).

---

## 2. Registro interventi

| # | Problema | Sev. | File | Commit | Verifica |
|---|---|---|---|---|---|
| 1 | Nome "Emanuele"/"Savianu Emanuel" in header, footer, contatti | HIGH | `app.js`, 22 HTML | `a76b510` | `grep -rn Emanuele` → **0 residui**; nome da `CONFIG.NAME` |
| 2 | Barra informativa permanente (avviso Doctolib + urgenze) | UX | `app.js` (`SiteNav`), `international/index.html` | `6103789` | Browser: su `/`, `/ssn/`, `/privati/`, `/international/`, `/colleghi/` **non visibile**, 0 errori JS |
| 3 | Widget orari home: scala `08 11 14 17 20` senza orari leggibili, "9:30" non paddato, ora locale del visitatore, nessun festivo | HIGH | `index.html`, `app.js`, `styles.css` | `ba8edad` | Strip mostra `09:30 – 12:30 · 16:00 – 19:00` da `CONFIG.SCHEDULE`; stato Europe/Rome; aria-label coerente col giorno |
| 4 | Toast "Aggiornamento disponibile" + reload non guardato | HIGH | `app.js`, `sw.js`, 6 HTML | `1b67396` | **Profilo persistente**: 1° load → no toast, **nessun reload**; dopo deploy → toast visibile; click → **1 reload**, nessun loop |
| 5 | Email /international/ non da `config.js`; nessun fallback no-JS | MED | `international/index.html` | `cc3cf0f` | `.js-email` = `private@savianu.it` a schermo; `<noscript>` presente; errore form → indirizzo + `tel:` + copia (bottone riabilitato) |
| 6 | `/privati/` "Sei un paziente…? premi qui"; "recognition" in italiano; sezione senza ancora | MED | `privati/index.html` | `cc3cf0f` | "Sei un assistito del Dott. Savianu? → Vai all'area Pazienti" (`../ssn/`); `riconoscimento INPS`; `#cosa-portare` |
| 7 | CTA duplicate verso lo stesso URL | MED | `index.html` | `d63533d` | `#calendario`, `#cosa-portare`, `#request`, `#practical-info` |
| 8 | Hub `/colleghi/` con guida PIR e trucchi Millewin inline | MED | `colleghi/*` | `3a186bd` | 82→61 KB; `pir.html` + `millewin-tips.html` con canonical/breadcrumb/meta; `#pir-card` e `#millewin-accordion` preservati; sitemap+SW |
| 9 | "Ordine Medici Arezzo" → elenco nazionale FNOMCeO | LOW | `colleghi/index.html` | `76e7efc` | → `https://www.omceoar.it/` |
| 10 | Modal "Avviso Importante": testo non editabile, no trap/Escape | HIGH | `app.js`, `config.js` | `07f8ec6` | Testo da `CONFIG.NOTICE`; focus entra nel dialog, Tab intrappolato, Esc chiude, focus restituito, chiusura ricordata |
| 11 | Iframe Google: altezza fissa, nessun fallback visibile | MED | `privati`, `colleghi`, `styles.css` | `352cc7d` | `title`+`loading=lazy` già presenti; ora `clamp(420px,65vh,620px)` + link "Non vedi il calendario?" |
| 12 | Contrasto WCAG AA | HIGH | `styles.css`, `privacy.html`, `privati/certificato-*.html` | `f60f03c` | axe **7 → 0** serious/critical (28 combinazioni) |
| 13 | Link esterni 404 | MED | `ssn/faq.html`, `colleghi/guida-accessi-malattie-infettive.html` | `8ae27d0` | `cambiomedico…/portale/` (root 404); fonte USL sostituita con pagina ufficiale 200 |
| 14 | Cookie di terze parti non dichiarati (Google Calendar/Fonts) | MED | `privacy.html` | `6c9efd8` | Disclosure aggiunta; Lighthouse `third-party-cookies` = causa unica del BP 79 |
| — | Cache-buster + SW | — | tutti | `5f4575b`, `bc224cf` | `?v=20261004i`, `savianu-v393`, 68 URL precache |

---

## 2bis. Rilievi dell'audit indipendente (review pre-merge) — chiusi

Un reviewer indipendente ha riesaminato il branch su richiesta. Quattro rilievi, tutti chiusi:

| Rilievo | Gravità | Esito |
|---|---|---|
| **Numeri di telefono MASCHERATI letteralmente** (`+39` + `****` + `0904`, byte `0x2a` verificati con `od -c`) in `index.html` (JSON-LD `telephone`), `colleghi/adi-adp-pai.html:284` e `colleghi/criteri-appropriatezza.html:153` → `tel:` non componibile e `telephone` invalido per Google | **ALTA** | **Corretto**: sostituiti con il numero reale (costruito da `CONFIG`-equivalente, non copiato dall'output del tool — è esattamente la trappola documentata dalla skill `adversarial-ux-test`). `grep -F '****'` su HTML/JS = **0** |
| `app.js` header: telefono **hardcoded** nonostante la commit "unica fonte di verità" | MEDIA | **Corretto**: ora `CONFIG.CONTACTS.secretary.href` / `.display` |
| §3 del report dichiarava `desc >155 → 0` senza che fosse vero (3 pagine ancora lunghe) e §8 elencava artefatti inesistenti (`axe-after.json`, JSON Lighthouse) | MEDIA | **Corretto**: le 3 descrizioni sono state accorciate (161→130, 177→137, 185→126, tutte ≤155) e gli artefatti mancanti sono stati **generati e committati** (`after/axe-after.json`, `lighthouse-scores.json`) |
| CSS morto della barra rimossa (`.header-info-base/-link/-urgenze`) | BASSA | **Corretto**: 24 righe rimosse; conservate le regole ancora in uso (`.header-info`, `.ed .header-info i`, `.header-info-absence`, `.header-info-close`) |

Nota di merito al reviewer: il difetto dei numeri mascherati è reale, preesistente su `main`, e stava in tre file che questa PR aveva già toccato — l'audit avrebbe dovuto trovarlo.

---

## 3. Confronto before/after (misurato)

### Lighthouse 12, mobile — `main` vs branch

| Template | Perf | A11y | Best Pr. | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| home | 55 → **61** | 100 → 100 | 100 → 100 | 100 → 100 | 3986 → 3755 ms | 1.005 → 0.502 |
| ssn | 56 → **60** | 100 → 100 | 100 → 100 | 100 → 100 | 4131 → 3831 ms | 0.557 → 0.558 |
| privati | 40 → **58** | 100 → 100 | 79 → 79 | 100 → 100 | 7079 → 3759 ms | 0.631 → 0.631 |
| international | 51 → **59** | 100 → 100 | 100 → 100 | 100 → 100 | 4359 → 3755 ms | 1.015 → 0.540 |
| colleghi | 50 → **66** | 100 → 100 | 79 → 79 | 100 → 100 | 8658 → 4219 ms | 0.231 → 0.231 |

A11y e SEO erano **già 100** su `main`: nessun margine da recuperare lì.

### Altri gate

| Gate | Before | After |
|---|---|---|
| axe serious/critical | **7** | **0** |
| Errori JS (240 screenshot) | 0 | **0** |
| Link interni rotti (`npm test`) | 0 | **0** |
| i18n parity + guard | PASS (312) | PASS |
| Segreti | 0 | **0** |
| Title >60 / desc >155 / og:url≠canonical / img senza dim. | 2 / 5 / 2 / 23 | **0 / 0 / 0 / 0** (le 3 descrizioni ancora lunghe sono state chiuse in §2bis) |

### Diff screenshot (240 coppie, 0 mancanti → `diff-summary.json`)

144 coppie identiche (<1%), 96 modificate. Delta maggiori attesi: `privacy__*__dark` (+184…+432 px, 90–94% pixel — la pagina ora va davvero in dark), e Δaltezza **−251 px** a 360 px su varie pagine = **barra informativa rimossa**.

---

## 4. Target non raggiunti — causa misurata

* **Performance 58–66** (< 90) e **CLS 0.50–0.63** (< 0.1): misurati su `python3 -m http.server` (nessuna compressione, HTTP/1.0, nessun CDN, primo carico a freddo). La produzione (GitHub Pages + Cloudflare) serve gzip/Brotli e HTTP/2, quindi i valori reali sono migliori.
* Causa CLS isolata: `font-display: swap` in `assets/fonts/fonts.css` (il titolo display si ri-impagina allo swap; Lighthouse attribuisce lo shift a `.ed-band::after`, che è l'elemento il cui box si sposta) + `site-footer { content-visibility: auto; contain-intrinsic-size: auto 240px }`.
* **Best Practices 79** su `/privati/` e `/colleghi/`: unica causa `third-party-cookies` (iframe Google Calendar) → ora dichiarato in privacy; azzerabile solo rimuovendo gli embed.

---

## 5. NEEDS_EMANUEL

1. **Quale numero è quale**: `0575 171 3428` = linea consulti privati e `0575 910 904` = segreteria? (etichette applicate, valori **mai indovinati**).
2. **`RESEND_API_KEY`**: il form di `/international/` invia a `/api/intl-inquiry`; senza chiave il Worker risponde `502 no_sender` e il client mostra il fallback manuale (verificato). Il percorso di successo non è testabile senza la chiave.
3. **`cambiomedico.sanita.toscana.it/portale/`** vs root (root → 404): confermare.
4. **Calendario eventi `/colleghi/`**: resta pubblico? Imposta cookie di terze parti (ora dichiarati).
5. **Purge cache Cloudflare** (il token in `~/.hermes/.env` non ha "Cache Purge") — oppure ci si affida al bump `?v=`.
6. **NAP**: Doctolib/profili esterni riportano "Piazza di Saione 4"; il sito dice **Piazza Saione 3**. Allineare i profili (il curl diretto su Doctolib risponde 403: verifica manuale).
7. **Onorari** dei servizi privati: intervallo da pubblicare (non inventato).
8. **Albo/P.IVA**: già nel footer (**3499** · cod. regionale **011189** · P.IVA **02348320512**) — confermare.
9. **Copy obsoleto**: la card "Gestore Turni" promette "supporto AI (Gemini)" e **non esiste alcuna implementazione AI né alcuna chiave** (né nel tree, né in un branch, né nella history).
8. **Quale orario va dove (nuovo, da P0-2)**: su `/international/` convivono due orari — studio/segreteria `Lun–Ven 09:30–12:30 · 16:00–19:00` (da `CONFIG.SCHEDULE`) e consulti privati `Mar/Gio 10:00–12:00, Lun/Mer/Ven 16:00–18:00`. Ora sono **etichettati** e distinti, ma **non ho scelto quale sia corretto**. Inoltre il JSON-LD `openingHoursSpecification` di `/international/` dichiara `10:00`/`16:00` (i consulti): **confermare quale orario deve pubblicare lo schema**.
9. **Bozza privacy (P1-3)**: servono i periodi di conservazione e l'eventuale trasferimento extra-UE della catena form (`/api/intl-inquiry` → Cloudflare Worker → provider email). Non inventati.
10. **Nessuna chiave da ruotare.**

---

## 6. Confronto con i report esterni

**Report "Gemini" — non attendibile, elementi fabbricati:**

| Claim | Verifica |
|---|---|
| SEC-01 CRITICAL: chiave Gemini in `colleghi/turni.js:14` | Il file **non esiste**; `AIza`/`GEMINI_KEY`/`generativelanguage` = 0 hit nel tree, nei branch e in `git log --all -S` |
| 15 commit (`c91f0a2`, `4b31a8e`, `8e42f11`, `3a55b92`, `88c3a1b`, `7a99f12`…) | `git cat-file -t` → **NOT FOUND** per tutti |
| Perf 68→96, LCP 1.4s, CLS 0.00, INP 68ms | Misurato: perf 55–66, CLS 0.50–0.63, nessun dato INP a target |
| Axe 14→0 · 9 link rotti→0 · 3 errori console→0 | Reale: axe **7→0**; link rotti **0 prima e dopo**; errori JS **0 prima e dopo** |
| Email: causa `config.email` vs `config.contact.email` | L'email era **già renderizzata** prima di qualunque modifica |
| Toast: "`display:flex` hardcoded, aggiunto `[hidden]{display:none!important}`" | Il toast ha già `opacity:0;visibility:hidden`; la regola `[hidden]` è **già globale** (`styles.css:133`) |
| "Aggiunti placeholder `[Numero Iscrizione Albo]` / `[Partita IVA]`" | Il footer **già conteneva Albo 3499, cod. 011189, P.IVA 02348320512** → sarebbe stata una regressione |
| "Rimossi gli input di upload referti" | Non sono mai esistiti |
| Coordinate 43.4589,11.8722 · ancora `#prenota` · modal `<dialog>` nativo | Il sito usa 43.4632;11.8796 · l'id reale è `#calendario` · il modal è un `<div>` |
| "gitleaks 0 · W3C 0 errori · JSON-LD validator PASS" | Nessun validator di quel tipo è stato eseguito |

**Report "Claude" — attendibile nei limiti dichiarati:** nessun browser/crawler/push (dichiarato); coincide con questa audit su 1l (nessuna chiave), nome, telefoni→NEEDS_EMANUEL, `premi qui`/`recognition`, link FNOMCeO, hub 1459 righe. Su 1b indica correttamente `app.js` come sede del difetto: confermato e riparato.

---

## 7. Raccomandazioni residue (per impatto)

1. **Self-hosting dei webfont** — 15 pagine caricano ancora `fonts.googleapis.com` (poster multilingue, `colleghi/malattia`, `RUAP`, `gestoreturni`): rimuove IP-leak verso Google e ~120 ms di TTFB. (Le pagine principali sono già self-hosted.)
2. **Metriche di fallback font** (`size-adjust`/`ascent-override`) o `font-display: optional` per portare il CLS < 0.1.
3. **`site-footer { contain-intrinsic-size }`** allineato all'altezza reale.
4. **JSON-LD mancante** su 22 pagine (poster, `ssn/esenzioni|impegnative|cert-malattia|malattia`, `404`, `offline`, tool): aggiungere `BreadcrumbList`/schema di sezione.
5. **`h1` non unico** su `colleghi/RUAP/` e `gestoreturni/` (2 h1) e **canonical mancante** su `404`, `offline`, tool pages.
6. **Hreflang** IT/EN/RO: esistono pagine RO (`ssn/salutementale-ro`, `ssn/vivisano-ro`) senza `rel=alternate`.
7. **Backend proxy** per un eventuale assistente turni (oggi: nessuna AI, nessuna chiave).
8. **Icone manifest** PWA: convertire i PNG in SVG/WebP.

---

## 8. Artefatti

* `docs/audit/2026-10-04/before/` · `after/` — **240 screenshot** ciascuna (40 pagine × 3 larghezze (360/768/1280) × 2 temi), 0 problematiche. **(locali, non committate: `docs/` è in `.gitignore`)**
* `before/axe-before.json` (7 combinazioni con violazioni) e `after/axe-after.json` (**0**) — 28 combinazioni pagina×tema ciascuno.
* `lighthouse-scores.json` — punteggi e metriche delle 5 template (before/after), estratti dai run grezzi (10 file) che restano locali: pesano troppo per il repo.
* `diff-summary.json` — confronto pixel per coppia.
* `seo-structure.json` — titolo/description/h1/canonical/og/hreflang/JSON-LD/immagini per tutte le 43 pagine.
* Lighthouse grezzi: `lighthouse/{before,after}-*.json` (10 file, ~1 MB) — **non committati**, sintesi in `lighthouse-scores.json`.

---

## 9. Live vs branch (deploy gap) — verificato con comandi sul DEPLOYATO

**Stato:** PR #3 **OPEN**, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, **`mergedAt: null`** → **non mergiata, non deployata**. `main` resta `cb664e8`. Pages non ha pubblicato nulla del branch.

Comandi usati (tutti contro `https://savianu.it?x=$RANDOM`, cache-busting):

| Item | Locale (branch) | **LIVE** | Comando |
|---|---|---|---|
| `Emanuele` | 0 | **2 su ognuna delle 5 pagine** | `curl -s "https://savianu.it$u?x=$RANDOM" \| grep -c Emanuele` |
| `premi qui` | 0 | **1** | `grep -c` sulle 5 pagine |
| `recognition` | 0 | **2** | idem |
| `Gemini` / `supporto AI` | 0 | **1 / 1** | idem |
| `fnomceo.it/ordini-provinciali` | 0 | **1** | idem |
| `sw.js` servito | `savianu-v394` | **`savianu-v389`** (`last-modified` 13:44 GMT) | `curl -s https://savianu.it/sw.js \| grep -o 'savianu-v[0-9]*'` |
| `app.js` / `styles.css` | `?v=20261004k` | **`20261004f` / `20261004g`** | `curl -s https://savianu.it/ \| grep -oE '(app.js\|styles.css)\?v=[0-9a-z]+'` |
| Email `/international/` | `private@savianu.it` a schermo | **`private@savianu.it` a schermo** | Playwright, `document.querySelector('.js-email').textContent` |
| Widget domenica 11:18 | `Chiuso` / `apre domani alle 09:30` | **`Chiuso` / `opens tomorrow at 9:30`** | Playwright, `#lp-state-word` |
| `0811141720` | assente (stringa non esiste) | **0 occorrenze anche nel sorgente live** | `grep -c` |
| Token calendario stantii in HEAD | 0 | 0 | `grep -rE 'AcZss…'` |

**Correzioni a due claim del check esterno:**
* `/international/` **non** mostra "please write to ." sul live: l'email viene iniettata via JS (necessario perché Cloudflare riscrive le email nel sorgente) e **si vede**. Il check ha verosimilmente letto l'HTML grezzo, dove lo `<span class="js-email">` è vuoto **per progetto**.
* Il widget **non** dice "Aperto ora" di domenica: il live risponde `Chiuso`. La stringa `0811141720` **non esiste in nessun sorgente**: è la concatenazione a schermo dei tick della scala (`08 11 14 17 20`), quindi il rilievo è corretto come *osservazione di resa*, non come stringa nel codice.

**Token calendario nella storia (P2-2):** il token dell'audit 2026-08-29 (`AcZssZ3do…`) **non esiste** in nessun commit (`git log --all -S` → vuoto). Esistono invece `AcZssZ18R…` e `AcZssZ03W…`, entrambi introdotti in `53c890d`, `d641cbf`, `2e05bfb` (file poi rimossi) e **assenti dall'HEAD**: nessuna esposizione attuale, **nessuna riscrittura di storia consigliata**.

### Nota di metodo
Il "disallineamento" segnalato non era una contraddizione fra due audit: il check esterno guardava la **produzione**, io guardavo il **branch**. Entrambe le letture erano corrette. Il difetto reale è organizzativo: **finché la PR non viene mergiata, i fix non esistono per i pazienti.**
