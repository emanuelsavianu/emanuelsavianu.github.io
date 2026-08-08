---
name: new-page
description: Create a new HTML page for the savianu.it site using the standard template with correct head, fonts, styles, header, footer, and script links
disable-model-invocation: true
---

Create a new HTML page in the project. The filename, section folder and purpose come from the arguments: {args}

Determine the section: `ssn/` (Pazienti SSN), `privati/` (Pazienti Privati), `colleghi/` (Colleghi, Italian-only), or root. Use the relative prefix `../` for every link to root assets when the page lives in a section folder (`../styles.css`, `../app.js`, `../config.js`, `../privacy.html`, `../index.html`).

Use this exact template structure (replace PAGENAME, PAGE_TITLE, PAGE_DESCRIPTION, and PAGE_CONTENT as appropriate):

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">

    <title>PAGE_TITLE | Dr. Savianu Emanuel</title>
    <meta name="description" content="PAGE_DESCRIPTION">

    <meta name="geo.region" content="IT-AR" />
    <meta name="geo.placename" content="Arezzo" />
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://savianu.it/PREFIX/PAGENAME.html">

    <meta name="theme-color" content="#1a2f4c">
    <link rel="manifest" href="PREFIX/manifest.json">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Playball&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/fontawesome.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/solid.min.css">

    <link rel="stylesheet" href="PREFIX/styles.css?v=23">

    <style>
        /* PAGE_TITLE-specific styles */
    </style>
</head>

<body>

<div id="ferie-banner" hidden>
    <i class="fas fa-info-circle" aria-hidden="true"></i>
    <span id="ferie-banner-text"></span>
    <button id="ferie-banner-close" onclick="dismissFerieBanner()" aria-label="Chiudi avviso">×</button>
</div>

<div id="large-text-banner">
    <span id="large-text-banner-label">🔤 Difficoltà a leggere?</span>
    <button class="large-text-btn" id="large-text-toggle-btn" onclick="toggleLargeText()">A+ Testo Grande</button>
</div>

<site-header>
<header role="banner">
    <nav class="lang-switch" aria-label="Language and controls">
        <button onclick="setLanguage('it')" class="lang-btn active" id="btn-it">ITA</button>
        <span class="lang-separator">|</span>
        <button onclick="setLanguage('en')" class="lang-btn" id="btn-en">ENG</button>
        <span class="lang-separator">|</span>
        <button onclick="toggleDarkMode()" class="lang-btn" id="btn-dark" title="Toggle Dark Mode" aria-label="Attiva/Disattiva Tema Scuro"><i class="fas fa-moon"></i></button>
        <div id="google_translate_element" style="display:inline-block; vertical-align:middle; margin-left:8px;"></div>
    </nav>
    <div class="header-content">
        <h1 style="margin-bottom: 0;">Dott. Savianu Emanuel</h1>
        <p style="font-family: 'Montserrat', sans-serif; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; font-size: 1.1rem; color: var(--accent); margin-bottom: 5px;">STUDIO MEDICO IPPOCRATE</p>
        <p data-i18n="header_subtitle">Medico di Medicina Generale - Arezzo</p>
        <a href="tel:+390575910904" class="btn-telefono-header">
            <i class="fas fa-phone-alt"></i> Segreteria: 0575 910 904
        </a>
    </div>
</header>
</site-header>

<div class="container" id="main-content">
<nav class="breadcrumb-bar" aria-label="Breadcrumb">
    <a href="PREFIX/index.html"><i class="fas fa-arrow-left" aria-hidden="true"></i> Home</a>
    <span aria-hidden="true">/</span>
    <span>PAGE_TITLE</span>
</nav>

<main role="main">
    PAGE_CONTENT
</main>
</div>

<site-footer>
<footer role="contentinfo">
    <div class="footer-content">
        <p>© <span id="current-year">2026</span> Studio Medico Ippocrate - Dr. Savianu Emanuel</p>
        <nav style="margin-top:10px;">
            <a href="PREFIX/index.html">Home</a> ·
            <a href="PREFIX/privacy.html">Privacy Policy</a>
        </nav>
    </div>
</footer>
</site-footer>

<script src="PREFIX/config.js?v=2"></script>
<script src="PREFIX/app.js?v=17"></script>
</body>
</html>
```

Rules:
- The `<title>` must be descriptive and under 60 characters total
- The `<meta name="description">` must be under 160 characters
- Keep `lang="it"` on `<html>` always; the ITA/ENG toggle (native i18n) is for `ssn/` and `privati/` pages only — `colleghi/` pages use the header WITHOUT the lang-switch and Google Translate (Italian-only), keeping only the dark-mode toggle
- Every user-facing string on patient/private pages must use `data-i18n` with BOTH `it` and `en` entries in the `translations` object in `app.js`
- Do NOT change the fonts, the two-file Font Awesome CDN pattern, or the styles.css link
- Do NOT add external JS libraries unless explicitly requested
- Put `data-badge-anchor` on the hours heading if the page shows opening hours (badge is appended there by app.js)
- Use `CONFIG.SCHEDULE` (Mon–Fri 09:30–12:30 + 16:00–19:00) for any hours content
- After creating the file, also add it to `sw.js` in the `PRECACHE_URLS` array if it is a major page
