// =====================================================================
// chrome.js — markup of the shared site chrome (single source of truth)
//
// PERCHÉ ESISTE QUESTO MODULO
// `<site-nav>` è un custom element: finché app.js non lo definisce, l'elemento
// è VUOTO (o contiene solo il vecchio `.fallback-nav`, alto ~110px) e tutta la
// pagina sotto di lui sta ~200-400px troppo in alto. Quando il custom element
// si aggiorna, il contenuto salta giù: misurato con un observer su
// layout-shift = 0.17-0.21 su mobile, cioè ~90% del CLS della pagina
// (Lighthouse non dà l'attribuzione: `cls-culprits-insight` riporta solo il
// totale). `tools/prerender-nav.mjs` scrive QUESTO stesso markup dentro
// `<site-nav>` nell'HTML statico, così la barra occupa il suo box dal primo
// paint; app.js continua a rigenerarlo (output identico) e ad agganciare il
// comportamento. Tenere le due strade sulla stessa funzione è ciò che rende il
// pre-render a prova di deriva.
// =====================================================================

export function isPatientSection(section) {
  return section !== 'colleghi' && section !== 'static';
}

export function navItem(href, i18nKey, isPatient, isCurrent, label) {
  return `<li><a href="${href}"${isPatient ? ` data-i18n="${i18nKey}"` : ''}${isCurrent ? ' aria-current="page"' : ''}>${label}</a></li>`;
}

// Markup inserito PRIMA di <site-nav> da app.js (skip-link + barra avvisi).
// NON pre-renderizzato: app.js lo inserisce sempre, quindi scriverlo nell'HTML
// produrrebbe un doppione.
export function siteNoticesHTML() {
  const skipLink =
    '<a href="#main-content" class="skip-link" data-i18n="skip_link">Vai al contenuto principale</a>';
  const infoBar =
    '<div class="header-info" id="header-info-line" hidden>' +
      '<i class="fas fa-info-circle" aria-hidden="true"></i>' +
      '<span class="header-info-absence" id="header-info-absence"></span>' +
      '<button id="header-info-close" class="header-info-close" onclick="dismissHeaderInfo()" aria-label="Chiudi avviso">&times;</button>' +
    '</div>';
  return '<div class="site-notices" role="region" aria-label="Avvisi di servizio">' + skipLink + infoBar + '</div>';
}

// Markup interno di <site-nav>.
//   section   root|ssn|privati|colleghi|static   (data-section)
//   prefix    '../' * profondità               (getPathPrefix)
//   fixedLang data-lang-fixed ('' = selettore lingua attivo)
//   here      location.pathname senza slash finale (per aria-current)
//   config    CONFIG da config.js (nome, recapiti)
export function siteNavInnerHTML({ section = 'root', prefix = '', fixedLang = '', here = '', config }) {
  const isPatient = isPatientSection(section);
  const isRoot = section === 'root';
  const brandTag = isRoot ? 'h1' : 'div';

  const darkBtn =
    '<button onclick="toggleDarkMode()" class="lang-btn" id="btn-dark" title="Toggle Dark Mode" aria-label="Attiva/Disattiva Tema Scuro"><i class="fas fa-moon" aria-hidden="true"></i></button>';
  const controls = (isPatient && !fixedLang)
    ? '<button onclick="setLanguage(\'it\')" class="lang-btn active" id="btn-it">ITA</button>' +
      '<span class="lang-separator" aria-hidden="true">|</span>' +
      '<button onclick="setLanguage(\'en\')" class="lang-btn" id="btn-en">ENG</button>' +
      '<span class="lang-separator" aria-hidden="true">|</span>' +
      darkBtn
    : darkBtn;

  const navRow =
    '<nav class="site-nav" aria-label="Navigazione principale">' +
      '<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav-menu" aria-label="' + (isPatient ? 'Apri il menu di navigazione' : 'Apri il menu') + '"><i class="fas fa-bars" aria-hidden="true"></i></button>' +
      '<ul class="nav-menu" id="site-nav-menu">' +
        navItem(prefix || './', 'nav_home', isPatient, here.endsWith('/index.html') || here === '', 'Home') +
        navItem(prefix + 'ssn/index.html', 'nav_ssn', isPatient, here.includes('/ssn'), 'Pazienti') +
        navItem(prefix + 'privati/index.html', 'nav_privati', isPatient, here.includes('/privati'), 'Consulti e certificati INPS') +
        navItem(prefix + 'colleghi/index.html', 'nav_colleghi', isPatient, here.includes('/colleghi'), 'Colleghi') +
        navItem(prefix + 'ssn/faq.html', 'nav_faq', isPatient, false, 'FAQ') +
      '</ul>' +
    '</nav>';

  const phone =
    '<a href="' + config.CONTACTS.secretary.href + '" class="btn-telefono-header"><i class="fas fa-phone-alt" aria-hidden="true"></i> <span data-i18n="header_phone_label">Segreteria:</span> ' + config.CONTACTS.secretary.display + '</a>';

  const brand =
    '<div class="brand-wrap">' +
      // 192px = 2x del box massimo reso (96px a >=600px): era 480px/37KB per un
      // box 62-96px, cioè il 98% del file sprecato (image-delivery-insight).
      '<img class="brand-logo" src="' + prefix + 'assets/bronzelogo-192.png" alt="Studio Medico Ippocrate" width="96" height="96" decoding="async">' +
      '<div class="brand-text">' +
        '<' + brandTag + ' class="brand-name"' + (isRoot ? ' data-i18n="landing_hero_title"' : '') + '>' + config.NAME + '</' + brandTag + '>' +
        '<p class="brand-tagline"' + (isPatient ? ' data-i18n="header_subtitle"' : '') + '>Medico di Medicina Generale - Arezzo</p>' +
        phone +
      '</div>' +
    '</div>';

  return '<nav class="lang-switch" aria-label="' + (isPatient && !fixedLang ? 'Lingua e controlli pagina' : 'Controlli pagina') + '">' + controls + '</nav>' +
    '<header role="banner">' +
      '<div class="header-content">' + brand + '</div>' +
    '</header>' +
    (section !== 'static' ? navRow : '');
}

export function floatingFaqHTML(prefix) {
  return '<a href="' + prefix + 'ssn/faq.html" class="floating-faq" role="button" data-i18n-aria-label="floating_faq_label" aria-label="Domande Frequenti">' +
    '<i class="fas fa-question-circle" aria-hidden="true"></i><span class="floating-faq-text">FAQ</span>' +
  '</a>';
}
