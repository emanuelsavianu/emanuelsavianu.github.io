# GP Patient-Facing Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five practical patient-facing features to savianu.it: open/closed badge, ferie auto-banner, decision flowchart (replaces triage), FAQ search, and pre-appointment checklist.

**Architecture:** All changes are pure static HTML/CSS/JS. No build step, no framework, no backend. Features are added directly to `index.html`, `faq.html`, `app.js`, and `styles.css`. No new files are created.

**Tech Stack:** Vanilla JS, HTML5, CSS custom properties (already used throughout). PWA with service worker (`sw.js`) — must bump cache version after changes.

---

## Reference: Key existing facts

- `app.js` triage functions to DELETE: `showTriage()` (lines 404–421) and `proceedToBooking()` (lines 423–427)
- Triage i18n keys to DELETE from `translations` (both `it` and `en` blocks): `triage_title`, `triage_desc`, `triage_opt1_title`, `triage_opt1_desc`, `triage_opt1_btn`, `triage_opt2_title`, `triage_opt2_desc`, `triage_opt2_btn`
- Google Calendar URLs (move these from HTML `href` to JS in Task 5):
  - Prima Visita: `https://calendar.app.google/tuFm2ZZSnsHvn5F19?hl=it&ctz=Europe/Rome`
  - Visita Ordinaria: `https://calendar.app.google/qgWNNbUKJHLa2GnKA?hl=it&ctz=Europe/Rome`
  - Sintomi Recenti: `https://calendar.app.google/C57sv4LCP9w3Cxe49?hl=it&ctz=Europe/Rome`
- SW cache name: `savianu-v41` → bump to `savianu-v42` in Task 6
- Asset version: `?v=7` → `?v=8` across all HTML files in Task 6

---

## Task 1: Open/Closed Badge

**Files:**
- Modify: `styles.css` (append at end)
- Modify: `app.js` (append before the final `window.addEventListener('load', ...)`)

### Step 1: Add badge CSS to `styles.css`

Append at the very end of `styles.css`:

```css
/* --- OPEN/CLOSED BADGE --- */
.badge-open, .badge-closed {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-left: 10px;
    vertical-align: middle;
}
.badge-open {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}
.badge-closed {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}
body.dark-mode .badge-open { background: #1a3a22; color: #7ecf8e; border-color: #2a5a32; }
body.dark-mode .badge-closed { background: #3a1a1e; color: #f08090; border-color: #5a2a30; }
```

### Step 2: Add badge JS to `app.js`

Append this block just before the `window.addEventListener('load', ...)` block at the bottom of `app.js`:

```js
// --- OPEN/CLOSED BADGE ---
(function() {
    const SCHEDULE = {
        1: [{ from: 16, to: 19 }],  // Mon
        2: [{ from: 10, to: 13 }],  // Tue
        3: [{ from: 16, to: 19 }],  // Wed
        4: [{ from: 10, to: 13 }],  // Thu
        5: [{ from: 16, to: 19 }],  // Fri
    };
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours() + now.getMinutes() / 60;
    const slots = SCHEDULE[day] || [];
    const isOpen = slots.some(s => hour >= s.from && hour < s.to);

    const anchor = document.querySelector('[data-i18n="hours_title"]');
    if (!anchor) return;
    const badge = document.createElement('span');
    badge.className = isOpen ? 'badge-open' : 'badge-closed';
    badge.innerHTML = isOpen
        ? '<i class="fas fa-circle" style="font-size:0.5rem"></i> Aperto ora'
        : '<i class="fas fa-circle" style="font-size:0.5rem"></i> Chiuso';
    anchor.parentNode.appendChild(badge);
})();
```

### Step 3: Verify in browser

Open `index.html` in a browser. Look at the "Orari di Studio" section in the sidebar. A green "Aperto ora" or red "Chiuso" pill should appear next to the heading. To test the opposite state temporarily, change the hour check in the IIFE.

### Step 4: Commit

```bash
git add styles.css app.js
git commit -m "feat: add open/closed badge to studio hours"
```

---

## Task 2: Ferie Auto-Banner

**Files:**
- Modify: `index.html` (add banner HTML after mobile-app-banner)
- Modify: `styles.css` (append banner styles)
- Modify: `app.js` (add ASSENZE config + banner logic)

### Step 1: Add banner HTML to `index.html`

Find this line in `index.html`:
```html
<a href="android.html" class="mobile-app-banner">
```
It closes with `</a>` a few lines later. Immediately **after** that closing `</a>` (and before the `<a href="#main-content" class="skip-link">` line), insert:

```html
<div id="ferie-banner" hidden role="alert" aria-live="polite">
    <i class="fas fa-umbrella-beach"></i>
    <span id="ferie-banner-text"></span>
    <button id="ferie-banner-close" aria-label="Chiudi avviso ferie" onclick="dismissFerieBanner()">×</button>
</div>
```

### Step 2: Add banner CSS to `styles.css`

Append at the end of `styles.css`:

```css
/* --- FERIE BANNER --- */
#ferie-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff3cd;
    color: #856404;
    border-bottom: 2px solid #ffc107;
    padding: 10px 20px;
    font-weight: 600;
    font-size: 0.9rem;
    width: 100%;
    box-sizing: border-box;
    z-index: 999;
}
#ferie-banner i { flex-shrink: 0; font-size: 1.1rem; }
#ferie-banner span { flex: 1; }
#ferie-banner-close {
    background: none;
    border: 1px solid #856404;
    color: #856404;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
body.dark-mode #ferie-banner { background: #3a2e00; color: #ffd060; border-bottom-color: #ffc107; }
body.dark-mode #ferie-banner-close { border-color: #ffd060; color: #ffd060; }
```

### Step 3: Add ASSENZE config and banner logic to `app.js`

At the very **top** of `app.js` (before the first comment), insert:

```js
// =================================================================
// FERIE / ASSENZE CONFIG — edit these dates to show the absence banner
// =================================================================
const ASSENZE = [
    // { from: "2026-08-01", to: "2026-08-31", note: "Il dottore è in ferie. Rientro previsto: 1 Settembre." },
];
```

Then append this function block **after** the IIFE for the open/closed badge (still before `window.addEventListener('load', ...)`):

```js
// --- FERIE BANNER LOGIC ---
(function() {
    const banner = document.getElementById('ferie-banner');
    const textEl = document.getElementById('ferie-banner-text');
    if (!banner || !textEl) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = ASSENZE.find(a => {
        const from = new Date(a.from);
        const to = new Date(a.to);
        to.setHours(23, 59, 59, 999);
        return today >= from && today <= to;
    });

    if (!active) return;

    try {
        if (sessionStorage.getItem('ferie-dismissed-' + active.from)) return;
    } catch(e) {}

    textEl.textContent = active.note;
    banner.removeAttribute('hidden');
})();

function dismissFerieBanner() {
    const banner = document.getElementById('ferie-banner');
    if (banner) banner.setAttribute('hidden', '');
    try {
        // find the active absence key to store dismissal
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const active = ASSENZE.find(a => {
            const from = new Date(a.from);
            const to = new Date(a.to);
            to.setHours(23, 59, 59, 999);
            return today >= from && today <= to;
        });
        if (active) sessionStorage.setItem('ferie-dismissed-' + active.from, '1');
    } catch(e) {}
}
```

### Step 4: Verify

To test, temporarily add an active absence to `ASSENZE`:
```js
{ from: "2026-01-01", to: "2099-12-31", note: "Test: Il dottore è in ferie." }
```
Reload `index.html` — a yellow banner should appear below the mobile app banner (on mobile) or at the top of the page. Click × to dismiss. Reload — banner should not reappear (sessionStorage). Remove the test entry when done.

### Step 5: Commit

```bash
git add index.html styles.css app.js
git commit -m "feat: add ferie auto-banner driven by ASSENZE config"
```

---

## Task 3: Remove Triage + Add Decision Flowchart

**Files:**
- Modify: `index.html` (remove triage section, remove back button, add flowchart section, update prenota button)
- Modify: `app.js` (remove showTriage/proceedToBooking, remove stale i18n keys, add flowchart logic + startBooking)
- Modify: `styles.css` (append flowchart styles)

### Step 1: Remove triage section from `index.html`

In `index.html`, find and **delete** this entire block (approximately lines 185–207):

```html
<section id="triage-section" class="card hidden triage-card" aria-labelledby="triage-title">
    ...
</section>
```

(Delete everything from `<section id="triage-section"` to its closing `</section>`)

### Step 2: Remove "Torna indietro" back-button from `#booking-section`

In `index.html`, inside `#booking-section`, find and **delete** this button:

```html
<button onclick="showTriage()" style="margin-left: auto; background: none; border: 1px solid var(--border-color); color: var(--text-medium); border-radius: 20px; padding: 5px 14px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
    <i class="fas fa-arrow-left"></i> Torna indietro
</button>
```

### Step 3: Update "Prenota una visita" button in `index.html`

Find:
```html
<button onclick="showTriage()" class="btn-prenota-large">
```
Replace with:
```html
<button onclick="startBooking()" class="btn-prenota-large">
```

### Step 4: Add flowchart section HTML to `index.html`

Find `<section class="alert-box"` in `index.html`. Immediately **after** its closing `</section>`, insert:

```html
<section id="flowchart-section" class="card">
    <div class="card-header">
        <i class="fas fa-route" aria-hidden="true"></i>
        <h2>Di cosa hai bisogno?</h2>
    </div>
    <p style="font-size:1rem; color:var(--text-medium); margin-bottom:18px;">
        Scegli la situazione che ti descrive meglio per sapere subito cosa fare.
    </p>
    <div id="flow-step"></div>
</section>
```

### Step 5: Remove stale triage functions from `app.js`

In `app.js`, find and **delete** the entire `showTriage()` function (lines ~404–421) and the `proceedToBooking()` function (lines ~423–427). Also delete the `// --- TRIAGE LOGIC ---` comment line above them.

### Step 6: Remove stale triage i18n keys from `app.js`

In the `it` block of `translations`, delete these 8 lines:
```js
// Triage section
triage_title: "Cosa ti serve esattamente?",
triage_desc: "Per ottimizzare i tempi ...",
triage_opt1_title: "Solo Ricette o Burocrazia?",
triage_opt1_desc: "Non occupare uno spazio visita ...",
triage_opt1_btn: "Usa Millebook",
triage_opt2_title: "Problema Medico da Valutare?",
triage_opt2_desc: "Hai sintomi nuovi ...",
triage_opt2_btn: "Procedi alla Prenotazione",
```

In the `en` block, delete the equivalent English triage keys (same key names, starting with `// Triage section`).

### Step 7: Add flowchart data + renderer + startBooking to `app.js`

Append after the ferie banner logic (before `window.addEventListener('load', ...)`):

```js
// --- DECISION FLOWCHART ---
const FLOWCHART = {
    root: {
        q: 'Di cosa hai bisogno?',
        options: [
            { label: '<i class="fas fa-pills"></i> Farmaco, ricetta o impegnativa', next: 'end_millebook' },
            { label: '<i class="fas fa-stethoscope"></i> Un sintomo o problema da valutare', next: 'sintomo' },
            { label: '<i class="fas fa-moon"></i> È notte, weekend o festivo', next: 'end_116' },
            { label: '<i class="fas fa-file-alt"></i> Certificato, burocrazia o altra domanda', next: 'end_faq' },
        ]
    },
    sintomo: {
        q: 'Può aspettare qualche giorno?',
        warning: '<i class="fas fa-exclamation-triangle"></i> Pericolo di vita o emergenza grave? Chiama il <strong>112</strong> subito.',
        options: [
            { label: '<i class="fas fa-check"></i> Sì, qualche giorno va bene', next: 'end_ordinaria' },
            { label: '<i class="fas fa-clock"></i> No, non può aspettare', next: 'end_breve' },
        ]
    },
    end_millebook: {
        end: true,
        icon: 'fas fa-laptop-medical',
        color: 'var(--primary)',
        title: 'Usa Millebook',
        desc: 'Richiedi farmaci continuativi, ricette o impegnative di controllo direttamente da Millebook — senza occupare uno slot visita.',
        action: { label: 'Apri Millebook', href: 'https://www.millebook.it/#/login', external: true }
    },
    end_ordinaria: {
        end: true,
        icon: 'fas fa-calendar-check',
        color: 'var(--accent)',
        title: 'Prenota una Visita Ordinaria',
        desc: 'Hai tempo — prenota una visita ordinaria (20 min) per controlli e problemi non urgenti.',
        action: { label: 'Prenota Visita Ordinaria', type: 'booking', visitType: 'ordinaria' }
    },
    end_breve: {
        end: true,
        icon: 'fas fa-clock',
        color: '#e67e22',
        title: 'Prenota Sintomi Recenti',
        desc: 'Non può aspettare — prenota il tipo "Sintomi Recenti" (10 min) per problemi acuti non rimandabili.',
        action: { label: 'Prenota Sintomi Recenti', type: 'booking', visitType: 'breve' }
    },
    end_116: {
        end: true,
        icon: 'fas fa-moon',
        color: '#6c757d',
        title: 'Chiama il 116 117',
        desc: 'Per assistenza medica non urgente fuori orario (notte, weekend, festivi): Continuità Assistenziale.',
        action: { label: 'Chiama 116 117', href: 'tel:116117' }
    },
    end_faq: {
        end: true,
        icon: 'fas fa-question-circle',
        color: 'var(--primary-light)',
        title: 'Leggi le FAQ',
        desc: 'Trovi risposte immediate su certificati, esenzioni, referti e burocrazia nelle domande frequenti.',
        action: { label: 'Vai alle FAQ', href: 'faq.html' }
    }
};

function renderFlowStep(stepKey) {
    const step = FLOWCHART[stepKey];
    if (!step) return;
    const container = document.getElementById('flow-step');
    if (!container) return;

    if (step.end) {
        let actionHTML = '';
        const a = step.action;
        if (a.type === 'booking') {
            const url = a.visitType === 'ordinaria'
                ? 'https://calendar.app.google/qgWNNbUKJHLa2GnKA?hl=it&ctz=Europe/Rome'
                : 'https://calendar.app.google/C57sv4LCP9w3Cxe49?hl=it&ctz=Europe/Rome';
            actionHTML = `<button class="flow-action-btn" onclick="selectVisitType('${a.visitType}','${url}')">${a.label}</button>`;
        } else {
            const target = a.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            actionHTML = `<a class="flow-action-btn" href="${a.href}"${target}>${a.label}</a>`;
        }
        container.innerHTML = `
            <div class="flow-end-card" style="border-color:${step.color}">
                <div class="flow-end-icon" style="color:${step.color}"><i class="${step.icon}"></i></div>
                <h3 class="flow-end-title" style="color:${step.color}">${step.title}</h3>
                <p class="flow-end-desc">${step.desc}</p>
                ${actionHTML}
                <button class="flow-restart-btn" onclick="renderFlowStep('root')">↩ Ricomincia</button>
            </div>`;
    } else {
        const warningHTML = step.warning
            ? `<div class="flow-warning">${step.warning}</div>`
            : '';
        const btns = step.options.map(o =>
            `<button class="flow-option-btn" onclick="renderFlowStep('${o.next}')">${o.label}</button>`
        ).join('');
        container.innerHTML = `
            <div class="flow-question-card">
                ${warningHTML}
                <p class="flow-question">${step.q}</p>
                <div class="flow-options">${btns}</div>
                ${stepKey !== 'root' ? '<button class="flow-restart-btn" onclick="renderFlowStep(\'root\')">↩ Ricomincia</button>' : ''}
            </div>`;
    }
}

function startBooking() {
    showSection('booking');
}

// Init flowchart on page load if the section exists
if (document.getElementById('flow-step')) {
    renderFlowStep('root');
}
```

### Step 8: Add flowchart CSS to `styles.css`

Append at the end of `styles.css`. **Important:** also add `--radius-md: 8px` to the existing `:root` block at the top of `styles.css` (find `:root {` and add it alongside `--radius-lg`).

```css
/* --- FLOWCHART --- */
.flow-question-card, .flow-end-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 20px;
    border: 2px solid var(--border-color);
    animation: fadeIn 0.2s ease;
}
.flow-end-card { border-width: 2px; }
.flow-question { font-size: 1.1rem; font-weight: 700; color: var(--text-dark); margin-bottom: 14px; }
.flow-options { display: flex; flex-direction: column; gap: 10px; }
.flow-option-btn {
    background: var(--bg-gradient-1);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--primary);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s, border-color 0.15s;
}
.flow-option-btn:hover { background: var(--accent); border-color: var(--accent); color: var(--primary); }
.flow-warning {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffc107;
    border-radius: var(--radius-md);
    padding: 10px 14px;
    margin-bottom: 14px;
    font-size: 0.9rem;
    font-weight: 600;
}
body.dark-mode .flow-warning { background: #3a2e00; color: #ffd060; border-color: #ffc107; }
.flow-end-icon { font-size: 2rem; margin-bottom: 10px; }
.flow-end-title { font-size: 1.2rem; font-weight: 800; margin-bottom: 8px; }
.flow-end-desc { color: var(--text-medium); margin-bottom: 16px; font-size: 0.95rem; }
.flow-action-btn {
    display: inline-block;
    background: var(--primary);
    color: var(--accent);
    border: none;
    border-radius: var(--radius-md);
    padding: 12px 20px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    margin-bottom: 10px;
    transition: opacity 0.15s;
}
.flow-action-btn:hover { opacity: 0.85; }
.flow-restart-btn {
    background: none;
    border: none;
    color: var(--text-medium);
    font-size: 0.85rem;
    cursor: pointer;
    padding: 4px 0;
    display: block;
    margin-top: 6px;
}
.flow-restart-btn:hover { color: var(--primary); }
```

### Step 9: Verify

Open `index.html`. The old triage card should be gone. A new "Di cosa hai bisogno?" card should appear above the services card. Click through all 6 branches and verify each END node shows the correct result and action. Clicking a booking END node should show and scroll to `#booking-section`. The "Torna indietro" button should be gone from the booking section.

### Step 10: Commit

```bash
git add index.html app.js styles.css
git commit -m "feat: replace triage section with decision flowchart"
```

---

## Task 4: FAQ Search

**Files:**
- Modify: `faq.html` (add search input + no-results element + search JS)
- Modify: `styles.css` (append search styles)

### Step 1: Add search input HTML to `faq.html`

In `faq.html`, find:
```html
<div class="faq-container">
```
Immediately after the opening `<div class="faq-container">` tag (and before `<div class="faq-hero">`), insert:

```html
<div class="faq-search-wrapper">
    <label for="faq-search" class="sr-only">Cerca nelle FAQ</label>
    <div class="faq-search-inner">
        <i class="fas fa-search faq-search-icon"></i>
        <input
            type="search"
            id="faq-search"
            placeholder="Cerca nelle FAQ..."
            autocomplete="off"
            aria-label="Cerca nelle domande frequenti"
        >
    </div>
    <p id="faq-no-results" hidden style="text-align:center; padding:20px; color:var(--text-medium);">
        Nessuna domanda trovata — contatta la segreteria al <strong>0575 910 904</strong>.
    </p>
</div>
```

### Step 2: Add search CSS to `styles.css`

Append at the end of `styles.css`:

```css
/* --- FAQ SEARCH --- */
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
.faq-search-wrapper { margin-bottom: 20px; }
.faq-search-inner {
    position: relative;
    display: flex;
    align-items: center;
}
.faq-search-icon {
    position: absolute;
    left: 14px;
    color: var(--text-medium);
    font-size: 0.95rem;
    pointer-events: none;
}
#faq-search {
    width: 100%;
    padding: 12px 16px 12px 38px;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    font-size: 1rem;
    font-family: var(--font-sans);
    background: var(--white);
    color: var(--text-dark);
    box-sizing: border-box;
    transition: border-color 0.2s;
}
#faq-search:focus {
    outline: none;
    border-color: var(--accent);
}
body.dark-mode #faq-search { background: var(--bg-gradient-2); color: var(--text-dark); }
```

### Step 3: Add search JS to `faq.html` existing inline script

In `faq.html`, find the existing `<script>` block (around line 535). Inside it, **after** the closing `}` of the smooth scroll listener (before `</script>`), append:

```js
    // FAQ search
    var faqSearch = document.getElementById('faq-search');
    var faqNoResults = document.getElementById('faq-no-results');
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            var q = this.value.trim().toLowerCase();
            var items = document.querySelectorAll('.faq-item');
            var visible = 0;
            items.forEach(function(item) {
                var text = item.textContent.toLowerCase();
                var match = !q || text.indexOf(q) !== -1;
                item.style.display = match ? '' : 'none';
                if (match) visible++;
            });
            if (faqNoResults) {
                faqNoResults.hidden = (visible > 0 || !q);
            }
        });
    }
```

### Step 4: Verify

Open `faq.html`. A search box should appear above the hero banner. Type "ricetta" — only FAQ items mentioning "ricetta" should remain visible. Type "zzzzz" — no results message should appear. Clear the input — all items restore.

### Step 5: Commit

```bash
git add faq.html styles.css
git commit -m "feat: add live search filter to FAQ page"
```

---

## Task 5: Pre-appointment Checklist

**Files:**
- Modify: `index.html` (convert booking `<a>` to `<button>`, add checklist div + confirm link)
- Modify: `app.js` (add selectVisitType + checklist data)
- Modify: `styles.css` (append checklist styles)

### Step 1: Add `selectVisitType` and checklist data to `app.js`

Append before `window.addEventListener('load', ...)`:

```js
// --- PRE-APPOINTMENT CHECKLIST ---
const CHECKLIST_DATA = {
    prima: {
        title: 'Prima Visita — Cosa portare:',
        items: [
            'Tessera sanitaria / codice fiscale',
            'Documento d\'identità',
            'Esenzioni ticket (se presenti)',
            'Lista aggiornata dei farmaci assunti regolarmente',
            'Referti, esami e lettere di dimissione precedenti',
        ]
    },
    ordinaria: {
        title: 'Visita Ordinaria — Cosa portare:',
        items: [
            'Tessera sanitaria',
            'Lista aggiornata dei farmaci assunti',
            'Esami o referti recenti (se pertinenti al motivo della visita)',
        ]
    },
    breve: {
        title: 'Sintomi Recenti — Cosa portare:',
        items: [
            'Tessera sanitaria',
            'Descrizione dei sintomi e data di inizio',
        ]
    }
};

function selectVisitType(type, url) {
    // Highlight selected button
    document.querySelectorAll('.btn-cal-service').forEach(function(btn) {
        btn.classList.remove('selected');
    });
    var activeBtn = document.querySelector('.btn-cal-service.' + type);
    if (activeBtn) activeBtn.classList.add('selected');

    // Render checklist
    var checklist = document.getElementById('visit-checklist');
    var confirmLink = document.getElementById('checklist-confirm');
    if (!checklist || !confirmLink) return;

    var data = CHECKLIST_DATA[type];
    if (!data) return;

    var itemsHTML = data.items.map(function(item) {
        return '<li><label><input type="checkbox"> ' + item + '</label></li>';
    }).join('');

    checklist.innerHTML = '<h3 class="checklist-title">' + data.title + '</h3>'
        + '<ul class="checklist-items">' + itemsHTML + '</ul>';

    confirmLink.href = url;
    confirmLink.removeAttribute('hidden');
    checklist.removeAttribute('hidden');

    // Scroll to checklist
    setTimeout(function() {
        var y = checklist.getBoundingClientRect().top + window.pageYOffset - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }, 100);
}
```

### Step 2: Convert booking `<a>` cards to `<button>` in `index.html`

In `index.html`, inside `#booking-section`, find the three `<a>` booking cards and replace them.

**Replace this:**
```html
<a href="https://calendar.app.google/tuFm2ZZSnsHvn5F19?hl=it&ctz=Europe/Rome" target="_blank" class="btn-cal-service prima">
    <div class="cal-icon-wrapper"><i class="fas fa-user-plus"></i></div>
    <div class="cal-text">
        <h3 data-i18n="cal_prima_title">Prima Visita (Nuovi Pazienti)</h3>
        <p data-i18n="cal_prima_desc">Solo per la prima visita. Portare documentazione, esami, referti ed esenzioni. (30 min)</p>
    </div>
</a>

<a href="https://calendar.app.google/qgWNNbUKJHLa2GnKA?hl=it&ctz=Europe/Rome" target="_blank" class="btn-cal-service ordinaria">
    <div class="cal-icon-wrapper"><i class="fas fa-stethoscope"></i></div>
    <div class="cal-text">
        <h3 data-i18n="cal_ord_title">Visita Ordinaria</h3>
        <p data-i18n="cal_ord_desc">Controlli e problemi non urgenti. (20 min)</p>
    </div>
</a>

<a href="https://calendar.app.google/C57sv4LCP9w3Cxe49?hl=it&ctz=Europe/Rome" target="_blank" class="btn-cal-service breve">
    <div class="cal-icon-wrapper"><i class="fas fa-clock"></i></div>
    <div class="cal-text">
        <h3 data-i18n="cal_breve_title">Sintomi Recenti</h3>
        <p data-i18n="cal_breve_desc">Visite non rimandabili, malattie acute, certificati INPS malattia. (10 min)</p>
    </div>
</a>
```

**With this:**
```html
<button onclick="selectVisitType('prima','https://calendar.app.google/tuFm2ZZSnsHvn5F19?hl=it&ctz=Europe/Rome')" class="btn-cal-service prima">
    <div class="cal-icon-wrapper"><i class="fas fa-user-plus"></i></div>
    <div class="cal-text">
        <h3 data-i18n="cal_prima_title">Prima Visita (Nuovi Pazienti)</h3>
        <p data-i18n="cal_prima_desc">Solo per la prima visita. Portare documentazione, esami, referti ed esenzioni. (30 min)</p>
    </div>
</button>

<button onclick="selectVisitType('ordinaria','https://calendar.app.google/qgWNNbUKJHLa2GnKA?hl=it&ctz=Europe/Rome')" class="btn-cal-service ordinaria">
    <div class="cal-icon-wrapper"><i class="fas fa-stethoscope"></i></div>
    <div class="cal-text">
        <h3 data-i18n="cal_ord_title">Visita Ordinaria</h3>
        <p data-i18n="cal_ord_desc">Controlli e problemi non urgenti. (20 min)</p>
    </div>
</button>

<button onclick="selectVisitType('breve','https://calendar.app.google/C57sv4LCP9w3Cxe49?hl=it&ctz=Europe/Rome')" class="btn-cal-service breve">
    <div class="cal-icon-wrapper"><i class="fas fa-clock"></i></div>
    <div class="cal-text">
        <h3 data-i18n="cal_breve_title">Sintomi Recenti</h3>
        <p data-i18n="cal_breve_desc">Visite non rimandabili, malattie acute, certificati INPS malattia. (10 min)</p>
    </div>
</button>
```

### Step 3: Add checklist div + confirm link to `index.html`

Inside `#booking-section`, immediately after the closing `</div>` of `.cal-services-grid` (and before the `.privacy-notice` div), insert:

```html
<div id="visit-checklist" hidden style="margin-top: 24px;"></div>
<a id="checklist-confirm" hidden href="#" target="_blank" rel="noopener noreferrer" class="btn-main" style="display:flex; align-items:center; gap:10px; justify-content:center; margin-top:16px; background:var(--primary); color:var(--accent); font-size:1.05rem;">
    <i class="fas fa-calendar-check"></i>
    <span>Procedi alla prenotazione &rarr;</span>
</a>
```

### Step 4: Add checklist CSS to `styles.css`

Append at the end of `styles.css`:

```css
/* --- CHECKLIST --- */
/* Reset <button> browser defaults without overriding the existing .btn-cal-service layout styles */
.btn-cal-service {
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    /* Do NOT add padding or width here — the existing .btn-cal-service rule already sets padding: 15px 20px and full width */
}
.btn-cal-service.selected {
    outline: 3px solid var(--accent);
    border-radius: var(--radius-lg);
}
.checklist-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 12px;
}
.checklist-items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.checklist-items li label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    font-size: 0.95rem;
    color: var(--text-dark);
    line-height: 1.4;
}
.checklist-items li input[type="checkbox"] {
    margin-top: 2px;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
    cursor: pointer;
}
```

### Step 5: Verify

Open `index.html` and click "Prenota una visita" (or scroll to the booking section). Click "Prima Visita" — a checklist should appear below with 5 items and a "Procedi alla prenotazione →" link that opens Google Calendar. Click "Visita Ordinaria" — checklist swaps to 3 items. Click the confirm link — Google Calendar opens in a new tab.

### Step 6: Commit

```bash
git add index.html app.js styles.css
git commit -m "feat: add pre-appointment checklist to booking flow"
```

---

## Task 6: Cache / PWA Version Bump

**Files:**
- Modify: All HTML files — change `?v=7` to `?v=8` on `app.js` and `styles.css` references
- Modify: `sw.js` — bump `CACHE_NAME` from `savianu-v41` to `savianu-v42`

### Step 1: Bump asset version in all HTML files

HTML files that reference `app.js?v=7` or `styles.css?v=7`:
- `index.html`
- `faq.html`
- `android.html`
- `privacy.html`
- `installazione.html`
- `dottori.html`
- `ferie.html`
- `xsegretarie.html`
- `calcolatore-ferie.html`
- `calcolatoreferiegemini.html`

In each file, replace `styles.css?v=7` with `styles.css?v=8` and `app.js?v=7` with `app.js?v=8`. (Not all files may reference both — only replace what exists.)

### Step 2: Bump SW cache name in `sw.js`

In `sw.js` line 3, change:
```js
const CACHE_NAME = 'savianu-v41';
```
to:
```js
const CACHE_NAME = 'savianu-v42';
```

### Step 3: Verify

Open `index.html` in a browser with DevTools open. In Application → Service Workers, confirm the new SW (`savianu-v42`) is registered and activated. In Network tab, confirm `styles.css?v=8` and `app.js?v=8` are requested (not served from old cache).

### Step 4: Final commit

```bash
git add index.html faq.html android.html privacy.html installazione.html dottori.html ferie.html xsegretarie.html calcolatore-ferie.html calcolatoreferiegemini.html sw.js
git commit -m "chore: bump asset version to v8 and SW cache to v42"
```

---

## Done

All six tasks complete. The site now has:
1. Live open/closed badge next to studio hours
2. Automatic ferie banner (edit `ASSENZE` in `app.js` to activate)
3. Decision flowchart replacing the old triage section
4. Live search filter on FAQ page
5. Pre-appointment checklist in the booking flow
6. Updated PWA cache
