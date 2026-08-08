---
name: new-page
description: Create a new HTML page for the savianu.it site using the standard template with correct head, fonts, styles, site-nav/site-footer components, and module script tag
disable-model-invocation: true
---

Create a new HTML page in the project. The filename, section folder and purpose come from the arguments: {args}

Determine the section: `ssn/` (Pazienti SSN), `privati/` (Pazienti Privati), `colleghi/` (Colleghi, Italian-only), or root. Use the relative prefix `../` for every link to root assets when the page lives in a section folder (`../styles.css`, `../app.js`, `../privacy.html`, `../index.html`). Pages reference only `../styles.css` + `../app.js` — `config.js` is imported by `app.js` and is no longer a page tag.

Use this exact template structure (replace PAGENAME, PAGE_TITLE, PAGE_DESCRIPTION, SECTION, and PAGE_CONTENT as appropriate; PREFIX is `../` for section pages, empty for root):

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

    <link rel="stylesheet" href="PREFIX/styles.css?v=24">

    <style>
        /* PAGE_TITLE-specific styles */
    </style>
</head>

<body>

<site-nav data-section="SECTION">
    <div class="fallback-nav">
        <p><strong>Dott. Savianu Emanuel — Studio Medico Ippocrate</strong></p>
        <p><a href="tel:+390575910904">Segreteria 0575 910 904</a></p>
    </div>
</site-nav>

<div class="container">

    <main role="main" id="main-content">

        <nav class="breadcrumb-bar" aria-label="Breadcrumb">
            <a href="PREFIX/index.html"><i class="fas fa-arrow-left" aria-hidden="true"></i> Home</a>
            <span aria-hidden="true">/</span>
            <span>PAGE_TITLE</span>
        </nav>

        <h1>PAGE_TITLE</h1>

        PAGE_CONTENT

    </main>

</div>

<site-footer data-section="SECTION">
    <footer role="contentinfo">
        <p>© <span id="current-year">2026</span> - Dr. Savianu Emanuel</p>
    </footer>
</site-footer>

<script type="module" src="PREFIX/app.js?v=18"></script>
</body>
</html>
```

Rules:
- The `<site-nav>`/`<site-footer>` fallback blocks render the full chrome via the web components in `app.js`; set `data-section` on both to `root`, `ssn`, `privati`, or `colleghi`. `ssn`/`privati` get the full patient chrome (skip link, banners, ITA/ENG toggle, Google Translate, nav, quick actions) — use `data-i18n` on every user-facing string; `colleghi` is Italian-only (dark-mode toggle only, no translate widget, no `data-i18n`)
- The `<title>` must be descriptive and under 60 characters total
- The `<meta name="description">` must be under 160 characters
- Keep `lang="it"` on `<html>` always; the ITA/ENG toggle (native i18n) is for `ssn/` and `privati/` pages only — `colleghi/` pages are Italian-only, no Google Translate widget
- Every user-facing string on patient/private pages must use `data-i18n` with BOTH `it` and `en` entries in the `translations` object in `app.js`
- Do NOT change the fonts, the two-file Font Awesome CDN pattern, or the styles.css link
- Do NOT add external JS libraries unless explicitly requested
- Do NOT add a `config.js` tag on the page — `app.js` imports it; a single module tag `<script type="module" src="PREFIX/app.js?v=18"></script>` is all that's needed
- Put `data-badge-anchor` on the hours heading if the page shows opening hours (badge is appended there by app.js)
- Use `CONFIG.SCHEDULE` (Mon–Fri 09:30–12:30 + 16:00–19:00) for any hours content
- After creating the file, also add it to `sw.js` in the `PRECACHE_URLS` array if it is a major page
