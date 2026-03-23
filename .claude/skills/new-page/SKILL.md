---
name: new-page
description: Create a new HTML page for the savianu.it site using the standard template with correct head, fonts, styles, header, footer, and script links
disable-model-invocation: true
---

Create a new HTML page at the root of the project. The filename and purpose come from the arguments: {args}

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
    <link rel="canonical" href="https://savianu.it/PAGENAME.html">

    <meta name="theme-color" content="#1a2f4c">
    <link rel="manifest" href="manifest.json">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Playball&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <link rel="stylesheet" href="styles.css?v=7">

    <style>
        /* PAGE_TITLE-specific styles */
    </style>
</head>

<body>

<header role="banner">
    <nav class="lang-switch" aria-label="Language selector">
        <button onclick="setLanguage('it')" class="lang-btn active" id="btn-it">ITA</button>
        <span class="lang-separator">|</span>
        <button onclick="setLanguage('en')" class="lang-btn" id="btn-en">ENG</button>
        <span class="lang-separator">|</span>
        <button onclick="toggleDarkMode()" class="lang-btn" id="btn-dark" title="Toggle Dark Mode"><i class="fas fa-moon"></i></button>
    </nav>
    <div class="header-content">
        <h1 style="font-family: 'Playball', cursive;">PAGE_TITLE</h1>
        <p style="font-family: 'Montserrat', sans-serif;">PAGE_DESCRIPTION</p>
    </div>
</header>

<main>
    <a href="index.html" class="back-link"><i class="fas fa-arrow-left"></i> Torna al sito principale</a>

    PAGE_CONTENT

</main>

<footer role="contentinfo">
    <div class="footer-content">
        <p>© <span id="current-year">2026</span> Studio Medico Ippocrate - Dr. Savianu Emanuel</p>
        <nav style="margin-top:10px;">
            <a href="index.html">Home</a> ·
            <a href="privacy.html">Privacy Policy</a>
        </nav>
    </div>
</footer>

<script src="app.js?v=7"></script>
</body>
</html>
```

Rules:
- The `<title>` must be descriptive and under 60 characters total
- The `<meta name="description">` must be under 160 characters
- Keep `lang="it"` on `<html>` always
- Do NOT change the fonts, Font Awesome CDN, or styles.css link
- Do NOT add external JS libraries unless explicitly requested
- After creating the file, also add it to `sw.js` in the `urlsToCache` array if it is a major page
