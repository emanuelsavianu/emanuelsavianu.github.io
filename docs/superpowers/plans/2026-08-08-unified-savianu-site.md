# Unified savianu.it Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `emanuelsavianu.github.io` (patient portal) and `dottemanuelsavianu.it` (private/colleagues portal) into one unified static site at `savianu.it` with a three-choice landing (SSN / Privati / Colleghi).

**Architecture:** Transform the base repo (`emanuelsavianu.github.io`, already CNAME `savianu.it`) in place via `git mv`; copy dott files into new `ssn/`, `privati/`, `colleghi/` folders. One shared `styles.css` / `app.js` / `config.js` merged from both repos (they share identical design tokens: navy `#1a2f4c`, gold `#c29b57`, Montserrat/Playball). All internal links relative. i18n IT/EN on landing + `ssn/*` + `privati/*`; `colleghi/*` Italian-only.

**Tech Stack:** Pure static HTML/CSS/JS. No build step. GitHub Pages + Cloudflare. Service worker (auto-bumped by hook). Google Fonts + Font Awesome CDN.

**Spec:** `docs/superpowers/specs/2026-08-08-unified-savianu-site-design.md` (read first for full context).

## Global Constraints

- **Schedule:** `CONFIG.SCHEDULE` = Mon–Fri, 09:30–12:30 + 16:00–19:00 **everywhere** (badge, hours tables, JSON-LD). Days: 1=Mon…5=Fri.
- **Relative paths:** All internal links relative. From `ssn/`, `privati/`, `colleghi/` subfolders use `../` prefix for root assets (`../styles.css`, `../app.js`, `../config.js`, `../privacy.html`, `../index.html`).
- **i18n:** Every user-facing text on landing + `ssn/*` + `privati/*` uses `data-i18n` with BOTH `it` and `en` entries in `app.js`. Colleghi pages: Italian-only, no ITA/ENG toggle, no Google Translate widget. Dark mode everywhere.
- **Language switcher:** ITA | ENG | dark mode | Google Translate widget — on landing, `ssn/*`, `privati/*` only.
- **Booking:** SSN patients book via **Doctolib** (`https://tinyurl.com/Savianu`). Private patients book via **Google Calendar iframe**: `https://calendar.google.com/calendar/appointments/schedules/AcZssZ3doNfY80zH2XLETLNnYnaqXyu6ImECj_O5_WciNc6aBVZKQbtGYBK57W1g84TT7bvrHMUFzOhn?gv=true` (extracted from `dottemanuelsavianu.it/visite-private.html:965`).
- **MilleBook = legacy.** The current patient portal uses Doctolib for prescriptions/messages. Do NOT migrate Millebook CTAs or the MilleBook FAQ section. Doctolib-based answers are canonical.
- **Contacts (single source of truth):** Segreteria `0575 910 904` / `tel:+390575910904`; Doctor personal (urgent only) `0575 171 3428`; email `segreteria@savianu.it`; address Studio Medico Ippocrate, Piazza Saione 3, Arezzo (52100); Doctolib profile `https://tinyurl.com/Savianu`; emergency `112`; out-of-hours `116 117`.
- **sw.js:** Never edit the cache version manually — the PostToolUse hook (`node .claude/scripts/bump-sw.js`) bumps `savianu-vN` after every Edit/Write. Just update `PRECACHE_URLS`/`urlsToCache`.
- **Asset versioning:** When `styles.css`/`app.js`/`config.js` change, update their `?v=N` query strings in every HTML file that loads them (one consistent version per file across all pages).
- **Font Awesome:** always load both files: `fontawesome.min.css` + `solid.min.css` (CDN 6.4.0).
- **No build step; test by opening files in a browser** (or `node --check` for JS syntax).
- **Do not touch:** `RUAP/`, `gestoreturni/`, A3 posters, Bengali/Urdu pages, standalone Tailwind/React pages' internals — move them as-is, fix only their inbound links.

---

### Task 1: Scaffold folders and relocate base-repo pages

**Files:**
- Modify: repo root (all paths below relative to `C:\Users\emanu\Documents\Github\emanuelsavianu.github.io`)
- Create: `ssn/`, `privati/`, `colleghi/`, `assets/`

**Interfaces:**
- Produces: the folder skeleton + relocated files that Tasks 3–6 depend on.

- [ ] **Step 1: Create the section folders**

```powershell
New-Item -ItemType Directory -Path ssn, privati, colleghi, assets -Force
```

- [ ] **Step 2: Move base-repo pages into `ssn/` with `git mv` (preserves history)**

```powershell
git mv faq.html ssn/faq.html
git mv malattia.html ssn/malattia.html
git mv bengalese.html ssn/bengalese.html
git mv urdu.html ssn/urdu.html
git mv salutementale.html ssn/salutementale.html
git mv vivisano.html ssn/vivisano.html
```

- [ ] **Step 3: Move assets into `assets/`**

```powershell
git mv bronzelogo.png assets/bronzelogo.png
```

- [ ] **Step 4: Verify**

Run: `git status --short`
Expected: 6 moved pages under `ssn/`, `bronzelogo.png` under `assets/`, plus new untracked `ssn/ privati/ colleghi/` dirs.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "scaffold: section folders and relocate patient pages under ssn/"
```

---

### Task 2: Import dott repo pages into the sections

**Files:**
- Create (copied from `C:\Users\emanu\Documents\Github\dottemanuelsavianu.it`): see steps below

**Interfaces:**
- Consumes: Task 1 folders.
- Produces: all content pages in place for Tasks 10–14 (link rewriting happens in those tasks — copying is enough here).

- [ ] **Step 1: Copy `ssn/` content pages** (plain `Copy-Item`; these will be link-fixed in Task 11)

```powershell
$src = "C:\Users\emanu\Documents\Github\dottemanuelsavianu.it"
Copy-Item "$src\esenzioni.html" ssn\esenzioni.html
Copy-Item "$src\impegnative.html" ssn\impegnative.html
Copy-Item "$src\cert-malattia.html" ssn\cert-malattia.html
```

- [ ] **Step 2: Copy `privati/` pages**

```powershell
Copy-Item "$src\visite-private.html" privati\index.html
Copy-Item "$src\certificato-invalidita-civile.html" privati\certificato-invalidita-civile.html
Copy-Item "$src\faq-riforma.html" privati\faq-riforma.html
```

- [ ] **Step 3: Copy `colleghi/` pages** (note the kebab-case renames and the `malattia.html` rename — the dott one is the MMG legal guide, distinct from `ssn/malattia.html`)

```powershell
Copy-Item "$src\colleghi.html" colleghi\index.html
Copy-Item "$src\protocollo-certificati-inps.html" colleghi\protocollo-certificati-inps.html
Copy-Item "$src\rsa.html" colleghi\rsa.html
Copy-Item "$src\installazione.html" colleghi\installazione.html
Copy-Item "$src\xsegretarie.html" colleghi\xsegretarie.html
Copy-Item "$src\malattia.html" colleghi\malattia.html
Copy-Item "$src\guida_interattiva_mmg.html" colleghi\guida-interattiva-mmg.html
Copy-Item "$src\lo_scudo_del_medico.html" colleghi\lo-scudo-del-medico.html
Copy-Item "$src\calcolatore-ferie.html" colleghi\calcolatore-ferie.html
Copy-Item "$src\calcolatoreferiegemini.html" colleghi\calcolatore-ferie-gemini.html
```

- [ ] **Step 4: Copy sub-apps and admin assets**

```powershell
Copy-Item "$src\RUAP" colleghi\RUAP -Recurse
Copy-Item "$src\gestoreturni" colleghi\gestoreturni -Recurse
Copy-Item "$src\email-templates" email-templates -Recurse
Copy-Item "$src\schema-templates" schema-templates -Recurse
Copy-Item "$src\bluelogo.png" assets\bluelogo.png
```

- [ ] **Step 5: Verify all 20 files + 2 sub-app folders exist**

Run:
```powershell
Get-ChildItem ssn, privati, colleghi -Recurse -File | Select-Object -ExpandProperty FullName
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "import: migrate dottemanuelsavianu.it content into section folders"
```

---

### Task 3: Merge config.js

**Files:**
- Modify: `config.js` (root, currently the base-repo version)
- Reference: `C:\Users\emanu\Documents\Github\dottemanuelsavianu.it\config.js` (for `ASSENZE` + `getActiveAbsence`)

**Interfaces:**
- Produces: `CONFIG` with keys `SCHEDULE`, `ASSENZE`, `DOCTOLIB`, `GOOGLE_CAL` and method `CONFIG.getActiveAbsence()`. Consumed by app.js (badge, ferie banner) and all HTML pages.

- [ ] **Step 1: Replace `config.js` content with the merged version**

```js
// =================================================================
// GLOBAL CONFIGURATION — edit these values to update all pages
// =================================================================

const CONFIG = {
    // Vacation / closure / relocation banner config
    // 'from' and 'to' in YYYY-MM-DD format. Free-text note (Italian).
    ASSENZE: [
        {
            from: "2026-08-06",
            to: "2026-08-14",
            note: "🏖️ Studio chiuso dal 6 al 14 agosto 2026. Riprendo il 17 agosto. 🚨 Urgenze: Guardia Medica 116 117 — Emergenze: 112."
        }
    ],

    // Opening hours (used for badge and hours tables) — Mon–Fri
    // 09:30–12:30 + 16:00–19:00, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
    SCHEDULE: {
        1: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],
        2: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],
        3: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],
        4: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],
        5: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }]
    },

    DOCTOLIB: {
        booking: 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/booking?source=profile',
        patientRequest: 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/patient-request?category=message',
        profile: 'https://tinyurl.com/Savianu'
    },

    GOOGLE_CAL: {
        iframe: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3doNfY80zH2XLETLNnYnaqXyu6ImECj_O5_WciNc6aBVZKQbtGYBK57W1g84TT7bvrHMUFzOhn?gv=true'
    }
};

CONFIG.getActiveAbsence = function() {
    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return CONFIG.ASSENZE.find(function(a) {
        const partsFrom = a.from.split('-').map(Number);
        const partsTo = a.to.split('-').map(Number);
        const fromUTC = Date.UTC(partsFrom[0], partsFrom[1] - 1, partsFrom[2]);
        const toUTC = Date.UTC(partsTo[0], partsTo[1] - 1, partsTo[2], 23, 59, 59, 999);
        return todayUTC >= fromUTC && todayUTC <= toUTC;
    }) || null;
};
```

Note: the old relocation entry (2026-03-24 → 2026-04-27) is in the past and replaced by the active August closure notice. The hardcoded `doctolib_banner_text` translation and the August closure modal text stay as-is in app.js (Task 4) — they are still used by `ssn/index.html`.

- [ ] **Step 2: Verify syntax**

Run: `node --check config.js`
Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add config.js
git commit -m "config: merge schedules, assenze banner and private calendar config"
```

---

### Task 4: Merge app.js (i18n union + dott features)

**Files:**
- Modify: `app.js` (root, currently base-repo version, 762 lines)
- Reference: `C:\Users\emanu\Documents\Github\dottemanuelsavianu.it\app.js` (585 lines)

**Interfaces:**
- Produces (globals used by HTML pages): `setLanguage(lang)`, `toggleDarkMode()`, `toggleLargeText()`, `toggleAccordion(header)`, `toggleFaq(header)`, `showSection(id)`, `startBooking()`, `selectVisitType(type, url)`, `closeDoctolibModal()`, `renderFlowStep(key)`, `dismissFerieBanner()`, translations object with `it` + `en` keys listed below.

- [ ] **Step 1: Merge the JavaScript feature blocks**

Start from the current root `app.js`. Make these changes in order:

1. **Keep** (unchanged): web components `SiteHeader`/`SiteFooter`, dark mode, `setLanguage`, `showSection`, `initGuidaRapida`, `trapFocus`, open/closed badge, doctolib banner + modal logic, `startBooking`, decision flowchart (`renderFlowStep`), auto year.
2. **Add from dott app.js** (verbatim, adapted):
   - The **large-text accessibility block** (lines 84–124 of dott: `updateLargeTextBanner`, `toggleLargeText`, `initLargeText` + `initLargeText()` call).
   - The **ferie banner block** (lines 333–359: the IIFE that shows `#ferie-banner` from `CONFIG.getActiveAbsence()`, and `dismissFerieBanner()`). Rename `textEl.textContent = active.note` → keep as-is (note is free text).
   - The **unified accordion block** (lines 485–516: `toggleAccordion` + `const toggleFaq = toggleAccordion`).
   - **Back-to-top** (lines 518–541: `initBackToTop`) and the **live filters** (lines 543–585: `initGlobalFilters`, `initLiveFilter`). Update the filter IDs to match the new pages: `search-faq` (ssn/faq.html), `search-tools` (colleghi/index.html), `search-esenzioni` (ssn/esenzioni.html), `search-impegnative` (ssn/impegnative.html).
   - `initBackToTop()` + `initGlobalFilters()` called on `window load` (dott lines 472–483 pattern; keep the existing welcome-modal load handler too).
3. **Badge anchor:** change the badge IIFE to look for `[data-badge-anchor]` instead of `[data-i18n="secretary_hours_label"]`:
   ```js
   const anchor = document.querySelector('[data-badge-anchor]');
   if (!anchor) return;
   ```
   (Hours tables in new pages get `data-badge-anchor` attributes — Tasks 6–8.)
4. **Ferrie banner injection:** in `SiteHeader.connectedCallback()`, keep injecting `#doctolib-banner`; additionally the injected banner text should come from `CONFIG.getActiveAbsence()?.note` if an absence is active, else from the translation key `doctolib_banner_text` (which now falls back to a generic "Verifica gli orari di apertura" message — update the `doctolib_banner_text` IT/EN values to a neutral fallback, since the August notice now lives in `CONFIG.ASSENZE`).
5. **Flowchart:** keep the base repo's 3-option i18n-driven version (Millebook option from dott is legacy — do not add it).

- [ ] **Step 2: Merge the translations object**

The `translations` object must contain `it` AND `en`. Start from the current base `it`/`en` blocks. Add these dott-only keys to **both** languages (Italian from dott app.js lines 128–252; write the English equivalents yourself — they must match the tone of existing EN entries):

```
it + en: booking_guide_steps, guard_title, guard_desc, hours_title, appt_only,
hours_day1, hours_day2, day_sat_sun, closed, label_secretary, label_doctor,
hours_secretary_title, hours_secretary_desc
```

Do NOT migrate: `mobile_app_banner`, `millebook_btn`, `millebook_sub`, `welcome_step1_*` (Millebook-flavored), `faq_nav_millebook`, `faq_sec_millebook`, `faq_q8` (Millebook registration) — MilleBook is legacy (see Global Constraints).

Also **update** these existing keys to the current schedule (09:30–12:30 + 16:00–19:00 Mon–Fri, "Lun - Ven"):
- `faq_a3` (hours table in FAQ answer): replace the 3-row table with one row `Lun - Ven | 09:30 – 12:30 · 16:00 – 19:00` + `Sab - Dom | Chiuso` (both languages).
- `hours_lun_ven` already reads "Lun - Ven" (keep).
- Update `alert_notice` (both languages): the relocation notice is historical — replace with a neutral welcome line, e.g. IT: "Benvenuti nello Studio Medico Ippocrate — Dott. Emanuel Savianu, Piazza Saione 3, Arezzo." (EN equivalent). It is only used if a page includes the alert box; the new pages (Tasks 6–8) use the config-driven ferie banner instead of `alert_notice`, but keep the key for safety.
- `doctolib_banner_text` (both languages): neutral fallback, e.g. IT: "Prenotazioni e ricette tramite Doctolib." EN: "Bookings and prescriptions via Doctolib."
- `welcome_*` modal keys: keep the base repo's Doctolib-flavored steps (already correct).

- [ ] **Step 3: Verify syntax**

Run: `node --check app.js`
Expected: exit 0. Then grep-verify no `data-i18n` key is missing an EN entry:

```powershell
$it = (Select-String -Path app.js -Pattern '^\s{8}\w+: "' | Select-String -Pattern '^\s{8}' ).Count
```
(Simpler: after Tasks 6–8, run the link/i18n scan in Task 17 — full-page grep check `data-i18n` keys against translations.)

- [ ] **Step 4: Bump asset versions in HTML files that reference app.js/config.js** (they are still at root during this task)

In `index.html` (still the old patient landing until Task 6), `faq.html` (in `ssn/` now), set `app.js?v=17` and `config.js?v=2` and `styles.css` stays `?v=22` until Task 5. (Final version numbers unified across all pages in Task 17.)

- [ ] **Step 5: Commit**

```bash
git add app.js index.html ssn/faq.html
git commit -m "app: merge large-text, ferie banner, accordion, filters; union i18n IT/EN"
```

---

### Task 5: Merge styles.css (single design system)

**Files:**
- Modify: `styles.css` (root, base-repo version, 1195 lines)
- Reference: `C:\Users\emanu\Documents\Github\dottemanuelsavianu.it\styles.css` (1222 lines)

**Interfaces:**
- Produces: shared stylesheet with all selectors used by new pages. Tokens added: `--ssn`, `--privati`, `--colleghi`, `--accent-text`.

- [ ] **Step 1: Produce the diff to find dott-only additions**

Run:
```powershell
git diff --no-index C:\Users\emanu\Documents\Github\dottemanuelsavianu.it\styles.css styles.css
```
(Work from the root repo; the output is the deltas between the two files.)

- [ ] **Step 2: Cherry-pick dott-only selectors into root `styles.css`**

Add any of the following found in the diff (from dott-only features) — check each exists in dott styles.css and is absent from root, then append (with their dark-mode variants, if present in dott):
- `.large-text-banner`, `#large-text-banner-label`, `#large-text-toggle-btn`, `body.large-text` overrides (font-size bumps), banner active/hidden states
- `#ferie-banner`, `.ferie-banner-text`, `#ferie-banner-dismiss` + dark-mode variants
- `#welcome-overlay`, `.welcome-card`, `.welcome-overlay.active`, `.modal-open` (body scroll lock)
- `.accordion-item`, `.accordion-header`, `.accordion-content`, `.accordion-body` (+ open/active states, dark mode)
- `.back-to-top` (+ `.visible`, dark mode)
- `.tools-grid-auto` (colleghi tools grid), `.search-input` (if absent), `.section-block` (if absent)
- `.exemption-table`, `.branch-table` (esenzioni/impegnative tables)
- `.btn-cal-service` (+ `.selected`), `.cal-icon-wrapper`, `.cal-text` (private visit buttons — check if already in root; root has a `.btn-cal-service.privata` usage so the base selector likely exists — keep whichever version has the `.selected` state)
- `.expandable-card`, `.expandable-card-content` (colleghi)
- `.flow-warning` (flowchart warning box, if absent in root)
- `.contact-row`, `.icon-circle`, `.hours-table`, `.contact-label`, `.contact-value` — verify present in root; add if missing.

- [ ] **Step 3: Add new tokens to the `:root` block (and dark-mode overrides where needed)**

```css
--ssn: #1a2f4c;
--privati: #c29b57;
--colleghi: #2e7d6b;
--accent-text: #8a6d3b;
```
Dark mode: `--accent-text: #e0b976;` (same as accent — gold on dark already passes). These are used by landing cards and section headers.

- [ ] **Step 4: Global WCAG focus styles**

Append a global rule if not present:
```css
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
```
(If a `:focus-visible` rule already exists for `.flow-option-btn`, generalize it to the global rule.)

- [ ] **Step 5: Verify**

Run: `node --check styles.css` will fail (CSS, not JS) — instead run a brace-balance sanity check:
```powershell
$c = (Get-Content styles.css -Raw); "{": (($c.ToCharArray() | Where-Object {$_ -eq '{'}).Count), "}": (($c.ToCharArray() | Where-Object {$_ -eq '}'}).Count)
```
Expected: both counts equal. Then open `ssn/faq.html` in a browser and confirm layout is intact (dark mode toggle still works).

- [ ] **Step 6: Commit**

```bash
git add styles.css
git commit -m "styles: merge dott-only selectors, add section tokens and focus-visible"
```

---

### Task 6: Build the landing page (root `index.html`)

**Files:**
- Modify: `index.html` (root — replaces the old patient landing entirely)
- Reference: old `index.html` (base repo, now still at root until replaced), `C:\Users\emanu\Documents\Github\dottemanuelsavianu.it\index.html` (has the old `.triage-grid` CSS/design remnants — lines ~200–380 of its inline style)

**Interfaces:**
- Consumes: `config.js` (badge/assenze), `app.js` (dark mode, i18n, large text, banner).
- Produces: the three-choice gateway; links to `ssn/index.html`, `privati/index.html`, `colleghi/index.html`.

- [ ] **Step 1: Write the page skeleton**

Structure (IT default, `data-i18n` on all text; `<html lang="it">`):
1. **Head:** title "Dott. Emanuel Savianu | Medico di Famiglia Arezzo — Visite Private e Certificati INPS", meta description, canonical `https://savianu.it/`, geo meta (copy from old index.html), OG/Twitter (image `https://savianu.it/assets/bronzelogo.png`), theme-color, manifest, Google Fonts (Montserrat + Playball), Font Awesome both files, `styles.css?v=23`, JSON-LD `Physician` (copy from old index.html; add `openingHoursSpecification` Mon–Fri 09:30–12:30/16:00–19:00).
2. **Body:**
   - `<div id="ferie-banner" hidden>` + text span + dismiss button (hook for app.js banner logic).
   - `<site-header>` web component (auto-injects doctolib banner, skip link, floating FAQ — verify the injected floating-FAQ link still works from root: it must be `ssn/faq.html`; adjust `SiteHeader` in app.js so the link is `'ssn/faq.html'` when the page is at root. Implement by computing depth: `var depth = location.pathname.split('/').filter(Boolean).length; var prefix = depth > 1 ? '../'.repeat(depth - 1) : '';` and use `prefix + 'ssn/faq.html'`. Apply the same prefix logic in `SiteHeader`/`SiteFooter`/quick-actions for `faq.html`/`privacy.html` links.)
   - Static header block (same pattern as old index.html): `lang-switch` nav with ITA/ENG buttons + dark toggle + `#google_translate_element` div, `h1` Dott. Savianu Emanuel, subtitle, telephone button.
   - `<main id="main-content" class="container">`:
     - **Hero section** (`.card`): welcome heading (`landing_hero_title`), subtitle (`landing_hero_sub`), open/closed badge (element with `data-badge-anchor` + `data-i18n="hours_title"` — badge JS appends next to it), and the two emergency phone links (112, 116 117).
     - **Triage section**: `<section class="triage-section" aria-label="Scegli la tua area">` containing `<div class="triage-grid">` with **exactly three** `<a class="triage-card" href="...">` cards:
       | Card | Icon | Title key | Desc key | href | Accent |
       |---|---|---|---|---|---|
       | 1 | `fa-user-injured` | `triage_ssn_title` "Pazienti SSN" | `triage_ssn_desc` "Sei assistito dal Dott. Savianu: prenota visite, richiedi ricette, consulta le guide." | `ssn/index.html` | `var(--ssn)` |
       | 2 | `fa-user-tie` | `triage_privati_title` "Pazienti Privati" | `triage_privati_desc` "Consulenze private, certificati INPS, invalidità civile e Legge 104." | `privati/index.html` | `var(--privati)` |
       | 3 | `fa-handshake` | `triage_colleghi_title` "Colleghi" | `triage_colleghi_desc` "Area riservata ai professionisti: strumenti, protocolli e normative." | `colleghi/index.html` | `var(--colleghi)` |
       Each card: `<span class="triage-icon" aria-hidden="true"><i class="fas fa-..."></i></span><span class="triage-card-title">..</span><span class="triage-card-desc">..</span><span class="triage-card-cta">..</span>`. Cards must be large (min-height ~220px), keyboard-focusable (they're links), with hover lift and accent border; CSS `.triage-grid` (3 columns → 1 on mobile) added to styles.css in this task (inspired by the old dott triage CSS, modernized with tokens + focus styles).
     - **Info strip** (`.card`): the 116 117 "quando chiamare / quando non chiamare" two-box content from the old index.html (keys `cta_116117_main` … `item_not_booking`) and the `cert_inps_btn` banner linking to `privati/index.html`.
   - `<aside>` contacts card: Doctolib row, secretary phone, address (from old index.html), hours table with `data-badge-anchor` heading "Orari" + one row `Lun - Ven | 09:30 – 12:30 · 16:00 – 19:00`, 116 117 mini-card.
   - `<site-footer>` web component + static footer with FAQ/malattia/privacy links (relative from root: `ssn/faq.html`, `ssn/malattia.html`, `privacy.html`), `#current-year`.
   - Scripts: `config.js?v=2`, `app.js?v=17`, SW registration, Google Translate init + element script (AFTER config/app.js).

- [ ] **Step 2: Add the i18n keys for the landing (both languages)**

Add to `app.js` translations `it` + `en`: `landing_hero_title`, `landing_hero_sub`, `triage_ssn_title`, `triage_ssn_desc`, `triage_privati_title`, `triage_privati_desc`, `triage_colleghi_title`, `triage_colleghi_desc`, `triage_cta` ("Entra" / "Enter"), `hours_title` ("Orari di Studio" / "Office Hours") if not already present, `appt_only` reuse. Reuse existing keys (`contacts_title`, `label_doctolib_contacts`, `label_secretary_fallback`, `label_address`, `link_privacy`, `footer_malattia_link`, 116 117 keys) where possible.

- [ ] **Step 3: Verify**

Run: `node --check app.js` (after i18n edits). Open `index.html` in a browser: three cards visible, ITA/ENG toggles all text, dark mode works, badge shows, ferie banner appears (Aug closure active), each card navigates to the right section, footer links resolve.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css app.js
git commit -m "landing: three-choice gateway (SSN / Privati / Colleghi)"
```

---

### Task 7: Build `ssn/index.html` dashboard

**Files:**
- Create: `ssn/index.html` (based on the old root `index.html` content — recover it from git if needed: it was rewritten in Task 6, so copy from `git show HEAD~1:index.html` — no: the old file was *replaced* in Task 6, so restore from `git show <commit-before-task-6>:index.html > ssn/index.html`).
- Reference: old root `index.html` (patient landing with Doctolib booking).

**Interfaces:**
- Consumes: `config.js`, `app.js` (`../config.js`, `../app.js` relative links), site-header/footer components.
- Produces: the SSN patient dashboard; cross-links to `privati/index.html` (private CTA) and landing `../index.html`.

- [ ] **Step 1: Create the page from the old patient landing**

1. Recover the old `index.html` content: `git show <task6-commit>~1:index.html` (the commit right before Task 6's commit) → write to `ssn/index.html`.
2. Adapt:
   - Head: canonical `https://savianu.it/ssn/`, OG image `https://savianu.it/assets/bronzelogo.png`, stylesheet `../styles.css?v=23`, scripts `../config.js?v=2` + `../app.js?v=17` at end of body.
   - Keep: doctolib modal, doctolib-cta grid (booking + message), privacy notice, INPS cert banner (retarget `https://dottemanuelsavianu.it/visite-private.html` → `privati/index.html`), FAQ banner (`faq.html` → `faq.html` stays — same folder), Doctolib message row, 116 117 section, emergency aside, contacts card (Doctolib/segreteria/address), hours table (Lun–Ven 09:30–12:30 · 16:00–19:00, heading gets `data-badge-anchor`), footer links (`privacy.html` → `../privacy.html`, `malattia.html` stays local).
   - Add: a section-header breadcrumb row: "← Torna alla home" (`../index.html`), title "Pazienti SSN", and quick-link grid to the SSN guides: FAQ (`faq.html`), Esenzioni (`esenzioni.html`), Impegnative (`impegnative.html`), Certificato malattia (`cert-malattia.html`), Malattia: chi deve farlo (`malattia.html`), guides in Bengali (`bengalese.html`) / Urdu (`urdu.html`), posters (`salutementale.html`, `vivisano.html`).
   - Header: keep ITA/ENG + dark + Google Translate. Add `<div id="ferie-banner" hidden>` element (hook) if not present via component.
   - Footer: privacy link `../privacy.html`.
3. Add `data-badge-anchor` to the hours heading.

- [ ] **Step 2: Verify**

Open in browser: booking buttons link to `https://tinyurl.com/Savianu`; FAQ/guides links resolve; breadcrumb back to landing; badge; dark mode; i18n toggle; ferie banner.

- [ ] **Step 3: Commit**

```bash
git add ssn/index.html
git commit -m "ssn: patient dashboard with Doctolib booking and quick links"
```

---

### Task 8: Build `privati/index.html` dashboard

**Files:**
- Modify: `privati/index.html` (currently the raw copy of dott `visite-private.html`)

**Interfaces:**
- Consumes: `../config.js`, `../app.js`, `CONFIG.GOOGLE_CAL.iframe`.
- Produces: private-practice dashboard; links to `certificato-invalidita-civile.html`, `faq-riforma.html`, SSN CTA to `../ssn/index.html`.

- [ ] **Step 1: Adapt the copied `visite-private.html`**

1. Read the current `privati/index.html` and keep its full content (hero, INPS/Legge 104 services cards, Google Calendar booking iframe, inline FAQ accordion with pills, contacts, footer).
2. Head: title/canonical → `https://savianu.it/privati/`, OG image → `https://savianu.it/assets/bronzelogo.png`; replace its stylesheet link (`styles.css?v=12` → `../styles.css?v=23`), add `config.js?v=2` + `app.js?v=17` before `</body>` if absent (the dott page loads app.js; ensure config.js is loaded too since the ferie banner/badge need it).
3. The Google Calendar iframe `src` → replace with `CONFIG.GOOGLE_CAL.iframe` value (it is identical; keep hardcoded is fine — but keep in sync).
4. Links:
   - Any `https://dottemanuelsavianu.it/...` links → `../index.html` (landing) or `../ssn/index.html` (SSN CTA "Sei un assistito SSN?" → `../ssn/index.html`).
   - `privacy.html` → `../privacy.html`.
   - If it links to `index.html` → `../index.html`.
5. Add `data-badge-anchor` to the hours heading (it has an hours section — check; if it only shows "solo su appuntamento", add the hours row Lun–Ven 09:30–12:30 · 16:00–19:00 with the badge anchor).
6. Add breadcrumb "← Torna alla home" → `../index.html`, and cross-links: Certificato Invalidità Civile (`certificato-invalidita-civile.html`), FAQ Riforma (`faq-riforma.html`).
7. Header: ITA/ENG + dark + Google Translate (patient-facing). Ensure the header block matches the shared pattern (lang-switch nav). Add `<div id="ferie-banner" hidden>` if the page lacks it.
8. Remove any Millebook references if present.

- [ ] **Step 2: Verify**

Open in browser: iframe renders, services cards present, internal links resolve, badge, dark mode, i18n.

- [ ] **Step 3: Commit**

```bash
git add privati/index.html
git commit -m "privati: private practice dashboard with Google Calendar booking"
```

---

### Task 9: Build `colleghi/index.html` dashboard

**Files:**
- Modify: `colleghi/index.html` (currently the raw copy of dott `colleghi.html`)

**Interfaces:**
- Consumes: `../config.js`, `../app.js`.
- Produces: colleagues hub; links to all `colleghi/*` pages + sub-apps.

- [ ] **Step 1: Adapt the copied `colleghi.html`**

1. Head: title "Area Colleghi — Dott. Emanuel Savianu", canonical `https://savianu.it/colleghi/`, `styles.css?v=12` → `../styles.css?v=23`, scripts `../config.js?v=2` + `../app.js?v=17`.
2. Header: **remove** the ITA/ENG/Google-Translate widgets (Italian-only section) — keep only the dark-mode toggle button. Remove the `lang-switch` nav row if it exists; keep title block.
3. Rewrite links to moved pages (search the file for `.html` hrefs):
   - `esenzioni.html` → `../ssn/esenzioni.html`
   - `impegnative.html` → `../ssn/impegnative.html`
   - `cert-malattia.html` → `../ssn/cert-malattia.html`
   - `faq.html` → `../ssn/faq.html`
   - `privacy.html` → `../privacy.html`
   - `index.html#facsimili` → `index.html#facsimili` (same file, keep) — verify any links to the *old* dott index (`#facsimili` anchors are on this page itself; the esenzioni/impegnative pages' backlinks get fixed in Task 11)
   - `certificato-invalidita-civile.html` → `../privati/certificato-invalidita-civile.html`
   - `faq-riforma.html` → `../privati/faq-riforma.html`
   - `calcolatore-ferie.html`, `calcolatoreferiegemini.html` → `calcolatore-ferie.html`, `calcolatore-ferie-gemini.html`
   - `guida_interattiva_mmg.html` → `guida-interattiva-mmg.html`
   - `lo_scudo_del_medico.html` → `lo-scudo-del-medico.html`
   - `malattia.html` → `malattia.html` (stays local)
   - `RUAP/` → `RUAP/`, `gestoreturni/` → `gestoreturni/` (stays local)
4. Add breadcrumb "← Torna alla home" → `../index.html`.
5. Add `<div id="ferie-banner" hidden>` hook if absent.
6. Keep the accordion/search/filters markup (`toggleAccordion`, `search-tools` — now provided by merged app.js).

- [ ] **Step 2: Verify**

Open in browser: all internal links resolve (no 404), search filter works, accordions work, dark mode works.

- [ ] **Step 3: Commit**

```bash
git add colleghi/index.html
git commit -m "colleghi: colleagues hub with relocated tool links"
```

---

### Task 10: Merge the FAQ into `ssn/faq.html`

**Files:**
- Modify: `ssn/faq.html` (currently base-repo FAQ, moved in Task 1)
- Reference: `C:\Users\emanu\Documents\Github\dottemanuelsavianu.it\faq.html` (the dott patient FAQ)

**Interfaces:**
- Consumes: merged `app.js` (`toggleFaq`, search filter `search-faq`).
- Produces: canonical patient FAQ (IT/EN), linked from landing + ssn dashboard.

- [ ] **Step 1: Compare the two FAQ contents**

1. Read both FAQ files fully. The base-repo FAQ (current, Doctolib-based, IT/EN) is the **canonical base** — its sections: Prenotazioni, Ricette, Certificati, Referti, Nuovi Pazienti, Urgenze, Altri Servizi; questions q1–q7, q9, q10, q11.
2. Read the dott FAQ for Q&As NOT present in the base FAQ (it has more accordion items — some hardcoded, some keyed). Include any **still-relevant** questions (e.g., about privacy, esenzioni, referti specifics) as new `data-i18n` Q&A pairs in the same section, with IT + EN translations written by you. Skip: Millebook-related items (q8, Millebook category), anything referencing the old Via Ubaldo Pasqui address, anything about the old Google-Calendar booking flow (base FAQ already reflects Doctolib).
3. Update `faq_a3` (hours) to Lun–Ven 09:30–12:30 · 16:00–19:00 + Sab–Dom Chiuso (both languages).
4. Keep: search box (`id="faq-search"`, label `faq_search_label`), nav pills (7 sections — drop any Millebook pill), SW-update toast markup, JSON-LD FAQPage (update to the final question list), footer privacy link → `../privacy.html`, back link → `index.html` (local, the ssn dashboard).

- [ ] **Step 2: Verify**

Run: `node --check app.js` (translations edited). Open `ssn/faq.html`: all accordions open/close, search filters, pills anchor, ITA/ENG shows translations for every question, no missing EN keys (grep each `data-i18n="faq_..."` key against the `en` block manually or with the Task 17 scanner).

- [ ] **Step 3: Commit**

```bash
git add ssn/faq.html app.js
git commit -m "faq: merged canonical patient FAQ with IT/EN"
```

---

### Task 11: Fix relative links on `ssn/` sub-pages

**Files:**
- Modify: `ssn/esenzioni.html`, `ssn/impegnative.html`, `ssn/cert-malattia.html`, `ssn/malattia.html`, `ssn/bengalese.html`, `ssn/urdu.html`, `ssn/salutementale.html`, `ssn/vivisano.html`

**Interfaces:**
- Consumes: nothing new; pages must resolve from `/ssn/`.

- [ ] **Step 1: Fix shared-stack pages (`esenzioni`, `impegnative`, `cert-malattia`)**

For each: read the file, then apply ALL of the following where present:
- `styles.css` link → `../styles.css?v=23`; `config.js` → `../config.js?v=2`; `app.js` → `../app.js?v=17`.
- `faq.html` → `faq.html` (local is fine; if linking to patient FAQ it's already local — verify), `index.html` links → `index.html` (the ssn dashboard, local) EXCEPT `index.html#facsimili` backlinks → `../colleghi/index.html#facsimili`.
- `privacy.html` → `../privacy.html`.
- `dottemanuelsavianu.it/...` links → strip domain (relative equivalents), e.g. `https://dottemanuelsavianu.it/visite-private.html` → `../privati/index.html`.
- Any `#` back-links to old dott `index.html#facsimili` → `../colleghi/index.html#facsimili`.
- Add `data-badge-anchor` to the hours heading if present; add `<div id="ferie-banner" hidden>` hook if the page has a header.
- Keep ITA/ENG/dark/Translate header if present (these are patient pages).

- [ ] **Step 2: Fix `malattia.html` (patient guide, standalone Tailwind)**

- Footer link `https://savianu.it` → `../index.html` (or `index.html` — the ssn dashboard; use `../index.html` for the landing).
- No other changes (self-contained Tailwind/Chart.js page).

- [ ] **Step 3: Fix `bengalese.html`, `urdu.html`**

- No site assets to relink (self-contained). Fix only: any `tel:` links unchanged; if they reference `index.html`/`privacy.html`, use `index.html`/`../privacy.html`. Verify fonts/`lang`/`dir` untouched.

- [ ] **Step 4: Fix posters (`salutementale.html`, `vivisano.html`)**

- Self-contained; verify no broken relative refs; no changes expected. If they have a back link to the site home, point to `../index.html`.

- [ ] **Step 5: Verify**

Run a link scan (PowerShell):
```powershell
Get-ChildItem ssn -Filter *.html | ForEach-Object {
  Select-String -Path $_.FullName -Pattern 'href="(?!https?://|tel:|#|mailto:|javascript:)([^"]+)"' -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { "$($_.Line -replace '\s+',' ' | ForEach-Object { ($_ -split ':')[0..1] -join ':' }) -> $($_.Groups[1].Value)" }
}
```
(Simpler: in Task 17 the full-site scanner runs. Here: spot-check each page's links manually by opening the page and clicking through.)

- [ ] **Step 6: Commit**

```bash
git add ssn/
git commit -m "ssn: relative links and shared assets for sub-pages"
```

---

### Task 12: Fix relative links on `privati/` sub-pages

**Files:**
- Modify: `privati/certificato-invalidita-civile.html`, `privati/faq-riforma.html`

- [ ] **Step 1: Fix shared references on both pages**

For each: `styles.css` → `../styles.css?v=23`; add `../config.js?v=2` + `../app.js?v=17` if missing; `privacy.html` → `../privacy.html`; any `dottemanuelsavianu.it` links → relative (`../privati/...` stays local, `visite-private.html` → `index.html`); `faq.html` → `../ssn/faq.html`; booking calendar references stay (Google Calendar). Add `data-badge-anchor` on hours heading + `<div id="ferie-banner" hidden>` if a header exists. Keep dark-mode button; ensure ITA/ENG/Translate header pattern (patient pages).

- [ ] **Step 2: Verify**

Open both pages in browser; click through all links; check dark mode and (where applicable) i18n.

- [ ] **Step 3: Commit**

```bash
git add privati/
git commit -m "privati: relative links on disability reform pages"
```

---

### Task 13: Fix relative links on `colleghi/` sub-pages

**Files:**
- Modify: `colleghi/protocollo-certificati-inps.html`, `colleghi/rsa.html`, `colleghi/installazione.html`, `colleghi/xsegretarie.html`, `colleghi/malattia.html`, `colleghi/guida-interattiva-mmg.html`, `colleghi/lo-scudo-del-medico.html`, `colleghi/calcolatore-ferie.html`, `colleghi/calcolatore-ferie-gemini.html`

- [ ] **Step 1: Fix each page**

For the shared-stack pages (`protocollo-certificati-inps.html`): `styles.css` → `../styles.css?v=23`, `config.js`/`app.js` → `../config.js?v=2`/`../app.js?v=17`, `privacy.html` → `../privacy.html`, `index.html` → `index.html` (local colleghi dashboard), `faq.html` → `../ssn/faq.html`. Remove ITA/ENG/Google-Translate widgets if present (Italian-only section) — keep dark toggle.

For the standalone pages (`rsa.html`, `installazione.html`, `xsegretarie.html`, `malattia.html`, `guida-interattiva-mmg.html`, `lo-scudo-del-medico.html`, both calcolatori): no site assets loaded — just fix any `dottemanuelsavianu.it` or `index.html`/`faq.html`/`privacy.html` references to the local equivalents (`index.html` for colleghi dashboard, `../privacy.html`, `../ssn/faq.html`). Tailwind/React pages unchanged otherwise.

- [ ] **Step 2: Verify**

Click through each page from `colleghi/index.html` links; confirm no 404s.

- [ ] **Step 3: Commit**

```bash
git add colleghi/
git commit -m "colleghi: relative links on professional pages"
```

---

### Task 14: Sub-apps integration (`RUAP/`, `gestoreturni/`)

**Files:**
- Verify: `colleghi/RUAP/`, `colleghi/gestoreturni/` (moved in Task 2)

- [ ] **Step 1: Verify sub-apps work from their new location**

`RUAP/index.html` uses ES modules with relative `js/` paths and `config.js` — moving the whole folder preserves them. Open `colleghi/RUAP/index.html` and `colleghi/gestoreturni/gestoreturni.html` in a browser; confirm they load (no console errors), including their own styles.

- [ ] **Step 2: Verify inbound links from `colleghi/index.html` point to the moved paths**

Confirm `colleghi/index.html` links use `RUAP/index.html` and `gestoreturni/gestoreturni.html` (relative). Fix if they point elsewhere.

- [ ] **Step 3: Commit**

```bash
git add colleghi/
git commit -m "colleghi: verify sub-apps (RUAP, gestore turni) at new paths"
```

---

### Task 15: Infrastructure — sw.js, manifest, 404, sitemap, robots, Cloudflare worker

**Files:**
- Modify: `sw.js`, `manifest.json`, `sitemap.xml`, `robots.txt`, `cloudflare/worker.js`
- Create: `404.html`

- [ ] **Step 1: Update `sw.js` `PRECACHE_URLS`**

Set to:
```js
['/', '/index.html', '/ssn/', '/ssn/index.html', '/ssn/faq.html',
 '/ssn/esenzioni.html', '/ssn/impegnative.html', '/ssn/cert-malattia.html',
 '/ssn/malattia.html', '/privati/', '/privati/index.html',
 '/privati/certificato-invalidita-civile.html', '/privati/faq-riforma.html',
 '/colleghi/', '/colleghi/index.html', '/offline.html', '/404.html',
 '/styles.css', '/app.js', '/config.js', '/manifest.json',
 '/assets/bluelogo.png', '/assets/bronzelogo.png']
```
Keep the existing strategies + SKIP_WAITING logic. **Do not touch the version string** (hook bumps it).

- [ ] **Step 2: Update `manifest.json` icons**

```json
"icons": [
  { "src": "/assets/bluelogo.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
  { "src": "/assets/bluelogo.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
]
```
Keep name/theme/short_name/start_url.

- [ ] **Step 3: Create `404.html`**

Styled with the shared design system (link `styles.css?v=23` + Montserrat/Playball + Font Awesome both files): message "Pagina non trovata" (`404_title`), text, emergency contacts (112 / 116 117, segreteria 0575 910 904), and a big button back to the landing (`index.html`). Static Italian (per `offline.html` precedent).

- [ ] **Step 4: Rebuild `sitemap.xml`**

URLs (excluding xsegretarie, RUAP, gestoreturni, posters optional): `/`, `/ssn/`, `/ssn/faq.html`, `/ssn/esenzioni.html`, `/ssn/impegnative.html`, `/ssn/cert-malattia.html`, `/ssn/malattia.html`, `/privati/`, `/privati/certificato-invalidita-civile.html`, `/privati/faq-riforma.html`, `/colleghi/`, `/colleghi/rsa.html`, `/colleghi/malattia.html`, `/privacy.html`. Priorities: `/` 1.0, section indexes 0.9, rest 0.7–0.5. `lastmod` = today (2026-08-08).

- [ ] **Step 5: Update `robots.txt`**

Keep allow-all; Disallow: `/offline.html`, `/404.html`, `/cloudflare/`, `/.claude/`, `/colleghi/xsegretarie.html`, `/colleghi/RUAP/`, `/colleghi/gestoreturni/`, `/email-templates/`, `/schema-templates/`. Keep Sitemap line.

- [ ] **Step 6: Update `cloudflare/worker.js` CSP**

Read the current CSP; change `frame-src 'none'` to `frame-src 'none' https://calendar.google.com` (the private booking iframe). Leave everything else (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, sitemap content-type rewrite) intact.

- [ ] **Step 7: Verify**

Run: `node --check` on sw.js (it's JS — but it's gitignored; still fine to syntax-check). Open `404.html` in browser. Confirm sitemap XML well-formed (open in browser or `[xml](Get-Content sitemap.xml)` parse).

- [ ] **Step 8: Commit**

```bash
git add sw.js manifest.json 404.html sitemap.xml robots.txt cloudflare/worker.js
git commit -m "infra: service worker cache, manifest icons, 404, sitemap, robots, CSP frames"
```

---

### Task 16: Update project docs and tooling

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `.claude/skills/new-page/SKILL.md`

- [ ] **Step 1: Update `CLAUDE.md`**

Rewrite the "Key Files" table for the new structure (root landing, `ssn/`, `privati/`, `colleghi/`, shared assets). Update: schedule note (09:30–12:30 + 16:00–19:00 Mon–Fri), contacts (Piazza Saione 3, segreteria@savianu.it, 0575 910 904), i18n rule (colleghi Italian-only), relative-link rule (section folders use `../`), redirect-map reference to the design spec §10, remove Millebook/ferie.html references, note `data-badge-anchor` convention, note `CONFIG.GOOGLE_CAL`.

- [ ] **Step 2: Update `README.md`**

Short: repo purpose, structure overview (3 sections), "how to test", "how to deploy" (push to main), pointer to the design spec.

- [ ] **Step 3: Update `.claude/skills/new-page/SKILL.md`**

Template: relative `../styles.css`/`../app.js`/`../config.js` from section folders, shared header/footer pattern, `data-i18n` boilerplate for IT+EN on patient/private pages, `data-badge-anchor`, ferie-banner hook, Font Awesome two-file rule, "add major pages to sw.js PRECACHE_URLS".

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md .claude/skills/new-page/SKILL.md
git commit -m "docs: update project docs and page template for new structure"
```

---

### Task 17: WCAG + QA verification pass

**Files:**
- Modify: any file found failing the checks below
- Create: `tools/check-links.ps1` (or `.mjs` — your choice, run with Node) — a small script committed for future use

**Interfaces:**
- Produces: verified site ready for final commit.

- [ ] **Step 1: Write the broken-link scanner**

Create `tools/check-links.mjs` (Node, no deps):
- Walk all `**/*.html` files (excluding `node_modules`, `cloudflare/`, `.claude/`, `docs/`, `email-templates/`, `schema-templates/`).
- Extract `href`/`src` attributes that don't start with `http`, `tel:`, `mailto:`, `#`, `javascript:`.
- Resolve relative to the page's folder; report any target that doesn't exist on disk (account for `index.html`/directory equivalence).
- Exit code 1 with the list of broken links if any.

Run: `node tools/check-links.mjs`
Expected: no broken links. Fix any found (repeat until clean).

- [ ] **Step 2: i18n completeness scan**

Node one-liner (or extend the checker): parse `app.js` `translations.it` keys; for each key ensure `translations.en[key]` exists. Also scan every HTML in `ssn/`, `privati/`, root `index.html` for `data-i18n="X"` and confirm `it.X` and `en.X` exist. Report and fix all missing keys.

- [ ] **Step 3: WCAG spot audit on landing + 3 dashboards + FAQ**

Check and fix:
- One `<h1>` per page; no skipped heading levels.
- All accordion buttons have `aria-expanded` and `aria-controls` (add `aria-controls` where missing; `toggleAccordion` in app.js already sets `aria-expanded`).
- Skip link present on every page (injected by `SiteHeader` — verify on pages that have the component; standalone pages get a manual one if they lack it).
- All images have `alt` (posters use inline SVG with `role="img"`/titles — leave as-is).
- Buttons/links meet 44px min touch target on mobile (add `min-height`/`padding` where obvious).
- Gold text on cream: any element using `color: var(--accent)` for small body text → switch to `var(--accent-text)` (light mode). Run a quick grep for `color: var(--accent)` in the new pages and review each hit.
- `prefers-reduced-motion` respected (existing rules cover it).
- Form controls have labels (FAQ search has `sr-only` label — keep pattern for any new inputs).

- [ ] **Step 4: Runtime QA in browser**

- Dark mode toggle + persistence on landing, `ssn/`, `privati/`, `colleghi/`.
- ITA/ENG on landing, `ssn/`, `privati/`; no toggle on `colleghi/`.
- Large-text banner appears (scroll to dismiss; persists via localStorage).
- Ferie banner appears (Aug closure) and dismisses (sessionStorage).
- Open/closed badge matches current time vs Mon–Fri 09:30–12:30/16–19.
- Google Calendar iframe loads on `privati/`; Doctolib links open on `ssn/`.
- Service worker registers; `offline.html` reachable when offline (Chrome DevTools offline).
- Mobile emulation (Chrome DevTools, 375px): landing cards stack, header wraps, no horizontal overflow.

- [ ] **Step 5: Unify asset version strings**

Pick final versions and apply consistently: `styles.css?v=23`, `app.js?v=17`, `config.js?v=2` — grep every HTML for `styles.css?v=`, `app.js?v=`, `config.js?v=` and align them all (root and sections).

- [ ] **Step 6: Commit**

```bash
git add tools/check-links.mjs tools/check-i18n.mjs
git commit -m "qa: link and i18n checkers, WCAG fixes, version alignment"
```

---

### Task 18: Final verification and handoff

- [ ] **Step 1: Full scan**

Run: `node tools/check-links.mjs` and the i18n checker. Run `git status` — confirm clean working tree after commit.

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "site: unified savianu.it (SSN / Privati / Colleghi)"
```

- [ ] **Step 3: Handoff summary**

Report to the user:
- The redirect map (design spec §10) — remind them to configure Cloudflare 301s for both old domains.
- Confirm the old `index.html` on the dott repo still redirects (their responsibility) and that the dott repo can be archived/deleted after redirects are live.
- Any decisions flagged during execution (e.g., dropped Millebook content, merged FAQ question list, banner text).

---

## Self-Review Notes (fill during planning — remove before execution)

- Spec coverage: §3 structure → Tasks 1–2; §4 content mapping → Tasks 2, 6–14; §5 design system → Task 5; §6 i18n → Tasks 4, 6, 10; §7 config → Task 3; §8 infra → Task 15; §9 landing → Task 6; §10 redirect map → Task 18 handoff; §11 phases → Task numbering; §12 risks → flagged inline (Millebook, hours).
- Placeholder scan: no TBD/TODO; every step has commands or file references.
- Type consistency: `CONFIG.GOOGLE_CAL.iframe`, `data-badge-anchor`, `toggleAccordion`, `search-faq`/`search-tools`/`search-esenzioni`/`search-impegnative` used consistently across tasks.
