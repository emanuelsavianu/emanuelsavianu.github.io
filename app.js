import { CONFIG } from './config.js?v=2';

// =================================================================
// STUDIO MEDICO DOTT. SAVIANU - JAVASCRIPT
// =================================================================

// =================================================================
// WEB COMPONENTS — SiteNav & SiteFooter (light-DOM, SEO-safe)
// The static content inside the tags is the no-JS/crawler fallback;
// on upgrade the component replaces it with the full rendered chrome.
// =================================================================

function getPathPrefix() {
  const segments = location.pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';
  // L'ultimo segmento è un file se ha un'estensione (es. .html); altrimenti
  // è una directory (URL tipo /colleghi/ o /colleghi senza slash).
  const isFile = /\.\w+$/.test(last);
  const dirs = Math.max(0, segments.length - (isFile ? 1 : 0));
  return '../'.repeat(dirs);
}

function applyI18n(lang) {
  if (typeof setLanguage === 'function') setLanguage(lang);
}

function getPreferredLang() {
  try {
    return localStorage.getItem('preferredLanguage') || 'it';
  } catch (e) {
    return 'it';
  }
}

function isPatientSection(section) {
  return section !== 'colleghi' && section !== 'static';
}

function currentSection() {
  const navEl = document.querySelector('site-nav');
  return navEl ? navEl.dataset.section : 'root';
}

function navItem(href, i18nKey, isPatient, isCurrent, label) {
  return `<li><a href="${href}"${isPatient ? ` data-i18n="${i18nKey}"` : ''}${isCurrent ? ' aria-current="page"' : ''}>${label}</a></li>`;
}

function footerLink(href, i18nKey, isPatient, label) {
  return `<a href="${href}"${isPatient ? ` data-i18n="${i18nKey}"` : ''}>${label}</a>`;
}

class SiteNav extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered === '1') return;
    this.dataset.rendered = '1';
    const section = this.dataset.section || 'root'; // root|ssn|privati|colleghi|static
    const prefix = getPathPrefix();
    const isPatient = isPatientSection(section);
    const isRoot = section === 'root';
    const brandTag = isRoot ? 'h1' : 'div';

    // Skip link
    const skipLink =
      '<a href="#main-content" class="skip-link" data-i18n="skip_link">Vai al contenuto principale</a>';

    // Language/control switch
    const darkBtn =
      '<button onclick="toggleDarkMode()" class="lang-btn" id="btn-dark" title="Toggle Dark Mode" aria-label="Attiva/Disattiva Tema Scuro"><i class="fas fa-moon" aria-hidden="true"></i></button>';
    const controls = isPatient
      ? '<button onclick="setLanguage(\'it\')" class="lang-btn active" id="btn-it">ITA</button>' +
        '<span class="lang-separator" aria-hidden="true">|</span>' +
        '<button onclick="setLanguage(\'en\')" class="lang-btn" id="btn-en">ENG</button>' +
        '<span class="lang-separator" aria-hidden="true">|</span>' +
        darkBtn
      : darkBtn;

    // Nav links row + mobile menu
    const here = location.pathname.replace(/\/$/, '');
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
      '<a href="tel:+390575910904" class="btn-telefono-header"><i class="fas fa-phone-alt" aria-hidden="true"></i> Segreteria: 0575 910 904</a>';

    const brand =
      '<div class="brand-wrap">' +
        '<img class="brand-logo" src="' + prefix + 'assets/bronzelogo.png" alt="Studio Medico Ippocrate" width="96" height="96" decoding="async">' +
        '<div class="brand-text">' +
          '<' + brandTag + ' class="brand-name">Dott. Savianu Emanuel</' + brandTag + '>' +
          '<p class="brand-tagline"' + (isPatient ? ' data-i18n="header_subtitle"' : '') + '>Medico di Medicina Generale - Arezzo</p>' +
          phone +
        '</div>' +
      '</div>';

    const infoBar =
      '<div class="header-info" id="header-info-line">' +
        '<i class="fas fa-info-circle" aria-hidden="true"></i>' +
        '<span class="header-info-base" id="header-info-base"' + (isPatient ? ' data-i18n="doctolib_banner_text"' : '') + '></span>' +
        '<a class="header-info-link" id="header-info-doctolib" href="' + CONFIG.DOCTOLIB.booking + '" target="_blank" rel="noopener noreferrer" data-i18n="doctolib_banner_link">Prenota su Doctolib</a>' +
        '<span class="header-info-absence" id="header-info-absence" hidden></span>' +
        '<span class="header-info-urgenze" id="header-info-urgenze" data-i18n="urgenze_line"></span>' +
        '<button id="header-info-close" class="header-info-close" hidden onclick="dismissHeaderInfo()" aria-label="Chiudi avviso">&times;</button>' +
      '</div>';

    this.insertAdjacentHTML('beforebegin', skipLink + infoBar);
    // Root page (index.html): no brand header — the photo hero is the masthead.
    // All other sections keep the navy brand header with logo/name/phone.
    this.innerHTML =
      '<nav class="lang-switch" aria-label="' + (isPatient ? 'Lingua e controlli pagina' : 'Controlli pagina') + '">' + controls + '</nav>' +
      (isRoot ? '' : '<header role="banner">' +
        '<div class="header-content">' + brand + '</div>' +
      '</header>') +
      (section !== 'static' ? navRow : '');

    if (isPatient && this.dataset.noFloat !== '1') {
      this.insertAdjacentHTML('afterend',
        '<a href="' + prefix + 'ssn/faq.html" class="floating-faq" data-i18n-aria-label="floating_faq_label" aria-label="Domande Frequenti">' +
          '<i class="fas fa-question-circle" aria-hidden="true"></i><span class="floating-faq-text">FAQ</span>' +
        '</a>'
      );
    }

    // Mobile menu toggle
    const toggle = this.querySelector('#nav-toggle');
    const menu = this.querySelector('#site-nav-menu');
    if (toggle && menu) {
      const closeMenu = () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      };
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
        menu.classList.toggle('open', !open);
        toggle.setAttribute('aria-label', open ? 'Apri il menu di navigazione' : 'Chiudi il menu di navigazione');
      });
      document.addEventListener('click', (e) => {
        if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== toggle) closeMenu();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
          closeMenu();
          toggle.focus();
        }
      });
    }

    Promise.resolve().then(() => applyI18n(getPreferredLang()));
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered === '1') return;
    this.dataset.rendered = '1';
    const section = this.dataset.section || 'root';
    const prefix = getPathPrefix();
    const isPatient = isPatientSection(section);

    this.innerHTML =
      '<footer role="contentinfo">' +
        '<div class="footer-content">' +
          '<p>&copy; <span id="current-year">' + new Date().getFullYear() + '</span> - Dr. Savianu Emanuel</p>' +
          '<nav class="footer-nav" aria-label="Footer">' +
            footerLink(prefix || './', 'footer_home', isPatient, 'Home') +
            ' <span aria-hidden="true">·</span> ' +
            footerLink(prefix + 'ssn/faq.html', 'footer_faq', isPatient, 'FAQ') +
            ' <span aria-hidden="true">·</span> ' +
            (isPatient ? footerLink(prefix + 'international/index.html', 'footer_international', isPatient, 'International Patients') + ' <span aria-hidden="true">·</span> ' : '') +
            footerLink(prefix + 'privacy.html', 'link_privacy', isPatient, 'Privacy Policy') +
          '</nav>' +
          '<p class="footer-privacy-note">Questo sito non usa cookie di profilazione né strumenti di tracciamento invasivi. Le statistiche sono aggregate e anonime nel rispetto del GDPR.</p>' +
        '</div>' +
      '</footer>';

    if (isPatient) {
      this.insertAdjacentHTML('afterend',
        '<nav class="quick-actions-bar" aria-label="Azioni rapide">' +
          '<a href="tel:+390575910904" class="qa-item" data-i18n-aria-label="qa_call_label" aria-label="Chiama la segreteria"><i class="fas fa-phone-alt" aria-hidden="true"></i><span data-i18n="qa_call">Chiama</span></a>' +
          '<a href="' + prefix + 'ssn/faq.html" class="qa-item" data-i18n-aria-label="qa_faq_label" aria-label="Domande frequenti"><i class="fas fa-question-circle" aria-hidden="true"></i><span>FAQ</span></a>' +
          '<a href="https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu" target="_blank" rel="noopener noreferrer" class="qa-item" data-i18n-aria-label="qa_doctolib_label" aria-label="Doctolib"><i class="fas fa-calendar-check" aria-hidden="true"></i><span data-i18n="qa_doctolib">Doctolib</span></a>' +
        '</nav>'
      );
    }

    Promise.resolve().then(() => applyI18n(getPreferredLang()));
  }
}

customElements.define('site-nav', SiteNav);
customElements.define('site-footer', SiteFooter);

// --- AUTOMATIC YEAR ---
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- DARK MODE TOGGLE ---
function setDarkModeUI(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
    const icon = document.querySelector('#btn-dark i');
    if (icon) {
        icon.classList.toggle('fa-sun', isDark);
        icon.classList.toggle('fa-moon', !isDark);
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', isDark ? '#0a1628' : '#1a2f4c');
}

export function toggleDarkMode() {
    const isDark = !document.body.classList.contains('dark-mode');
    setDarkModeUI(isDark);
    try {
        localStorage.setItem('savianu-theme', isDark ? 'dark' : 'light');
        localStorage.removeItem('darkMode');
    } catch (e) {
        console.warn('Theme persistence unavailable', e);
    }
}

function initDarkMode() {
    try {
        let saved = localStorage.getItem('savianu-theme');
        if (saved === null && localStorage.getItem('darkMode') === 'enabled') saved = 'dark';
        const prefersD = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = saved === 'dark' || (saved === null && prefersD);

        if (shouldBeDark) setDarkModeUI(true);

        // React to OS-level changes at runtime
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('savianu-theme') === null) setDarkModeUI(e.matches);
        });
    } catch (e) {}
}

initDarkMode();



// --- LANGUAGE MANAGEMENT ---
export const translations = {
    it: {
        // Header
        header_subtitle: "Medico di Medicina Generale - Arezzo",

        // Landing triage
        landing_hero_eyebrow: "Studio Medico Ippocrate",
        landing_hero_title: "Dott. Emanuel Savianu",
        landing_hero_location: "Piazza Saione 3, Arezzo",
        landing_hero_phone: "Segreteria: 0575 910 904",
        triage_ssn_title: "Pazienti",
        triage_ssn_desc: "Sei assistito dal Dott. Savianu: prenota visite su Doctolib, richiedi ricette, consulta guide ed esenzioni.",
        triage_privati_title: "Consulti e certificati INPS",
        triage_privati_desc: "Consulenze private, certificati INPS, invalidità civile e Legge 104 — prenota su Google Calendar.",
        triage_colleghi_title: "Colleghi",
        triage_colleghi_desc: "Area riservata ai professionisti: strumenti, protocolli, normative e applicazioni di servizio.",
        triage_cta: "Entra",
        triage_section_label: "Scegli la tua area",


        // Services section
        services_title: "Servizi Online",
        btn_faq_main: "Hai dubbi? Leggi prima le FAQ",


        // Booking section
        booking_title: "Prenotazione su Doctolib",
        privacy_notice_text: "Leggi l'informativa privacy.",
        privacy_notice_link: "Informativa Trattamento Dati",


        // Emergency & out-of-hours
        emergency_112: "Per urgenze ed emergenze mediche, contattare sempre il Numero Unico 112.",
        title_116117: "116 117 — Assistenza Sanitaria Non Urgente",
        cta_116117_main: "CHIAMA IL 116 117",
        note_116117_free: "(Numero gratuito, sempre attivo 24 ore su 24)",
        desc_116117_operator: "Un medico o un operatore ti aiuterà a capire cosa fare.",
        when_call_116117: "✅ QUANDO CHIAMARE IL 116 117:",
        item_when_1: "Per consigli medici quando il tuo dottore non c'è.",
        item_when_2: "Per la Guardia Medica (di notte, nei weekend e festivi).",
        item_when_3: "Per informazioni sui servizi sanitari della zona.",
        when_not_call_116117: "❌ QUANDO NON CHIAMARE IL 116 117:",
        item_not_emergency: "<strong>Emergenze gravi:</strong> Chiama subito il <strong>112</strong>.",
        item_not_booking: "<strong>Per prenotare esami o visite:</strong> Chiama il CUP (<strong>800 575 575</strong>) o vai in farmacia.",
        aside_116117_prompt: "Segreteria chiusa o non risponde? Non trovi il medico?",
        aside_116117_sub: "Numero gratuito, sempre attivo 24 ore su 24",

        // Contacts
        contacts_title: "Contatti Studio",
        label_doctolib_contacts: "Appuntamenti, Messaggi, Rinnovi Farmaci",
        label_secretary_fallback: "Segreteria (solo se non puoi usare Doctolib)",
        label_address: "Studio Medico Ippocrate",
        label_via_doctolib: "tramite Doctolib",
        label_address_value: "Piazza Saione 3, Arezzo",

        // Hours
        hours_lun_ven: "Lun - Ven",
        hours_title: "Orari di Studio",
        closed: "Chiuso",

        // Footer
        link_privacy: "Privacy Policy",


        faq_back: "<i class='fas fa-arrow-left'></i> Torna al sito principale",
        faq_nav_prenotazioni: "Prenotazioni",
        faq_nav_ricette: "Ricette",
        faq_nav_certificati: "Certificati",
        faq_nav_referti: "Referti",
        faq_nav_nuovi: "Nuovi Pazienti",
        faq_nav_urgenze: "Urgenze",
        faq_nav_varie: "Servizi",
        faq_sec_prenotazioni: "<i class='fas fa-calendar-check'></i> Prenotazioni e Appuntamenti",
        faq_sec_ricette: "<i class='fas fa-pills'></i> Ricette e Farmaci",
        faq_q1: "Come prenoto una visita?",
        faq_a1: "Le prenotazioni avvengono tramite <strong>Doctolib</strong>:<ul><li>Clicca \"Prenota su Doctolib\" qui sotto o vai su <a href='index.html'>savianu.it</a></li><li>Scegli il tipo di visita nell'app Doctolib</li><li>Conferma l'appuntamento</li></ul><div class='highlight-box'><a href='https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Clicca qui per prenotare →</a></div><div class='highlight-box'>In alternativa, chiama la segreteria al <strong>0575 910 904</strong> durante gli orari di ambulatorio.</div>",
        faq_q2: "Posso venire senza appuntamento?",
        faq_a2: "Il Dottore riceve <strong>solo su appuntamento</strong> per garantire tempi di attesa ragionevoli e dedicare la giusta attenzione a ogni paziente.",
        faq_q3: "Quali sono gli orari dell'ambulatorio?",
        faq_a3: "<table style='width:100%; border-collapse: collapse;'><tr><td style='padding: 6px 0; font-weight: 600;'>Lunedì - Venerdì</td><td style='text-align:right; color: var(--text-dark); font-weight: 700;'>09:30 - 12:30 · 16:00 - 19:00</td></tr><tr><td style='padding: 6px 0; font-weight: 600; color: var(--danger);'>Sabato - Domenica</td><td style='text-align:right; color: var(--danger);'>Chiuso</td></tr></table><div class='highlight-box'><strong>Indirizzo:</strong> Studio Medico Ippocrate, Piazza Saione 3, Arezzo</div>",
        faq_q4: "Come annullo o sposto un appuntamento?",
        faq_a4: "Per modificare o cancellare un appuntamento, aprite la conferma nell'app Doctolib o accedete al vostro account su Doctolib.it.<br><br>In alternativa, chiamate la segreteria al <strong>0575 910 904</strong> con ragionevole anticipo.",
        faq_q5: "Come richiedo la ricetta per i farmaci che prendo regolarmente?",
        faq_a5: "Potete richiederla tramite <strong>Doctolib</strong> (inviando un messaggio al medico) o nei seguenti modi:<ul><li>Contattando la segreteria al <strong>0575 910 904</strong> durante gli orari di ambulatorio</li><li>Durante una visita in studio</li></ul><div class='highlight-box'><a href='https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Invia richiesta su Doctolib →</a></div><div class='highlight-box'><strong>Importante:</strong> Le ricette dematerializzate (NRE) vengono inviate direttamente al sistema, potete ritirarle in qualsiasi farmacia comunicando il codice fiscale.</div>",
        faq_sec_certificati: "<i class='fas fa-file-medical'></i> Certificati",
        faq_sec_referti: "<i class='fas fa-flask'></i> Referti ed Esami",
        faq_sec_nuovi: "<i class='fas fa-user-plus'></i> Nuovi Pazienti",
        faq_sec_urgenze: "<i class='fas fa-ambulance'></i> Urgenze e Fuori Orario",
        faq_sec_varie: "<i class='fas fa-stethoscope'></i> Altri Servizi",
        faq_q6: "Come richiedo un certificato medico?",
        faq_a6: "I certificati si richiedono durante una visita in ambulatorio o telefonando la segreteria al <strong>0575 910 904</strong>.<br><br>Presentarsi con la documentazione necessaria: il certificato viene emesso direttamente in ambulatorio.<div class='highlight-box'><strong>Certificati INPS malattia:</strong> Richiedono una visita. <a href='https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Prenotare su Doctolib →</a></div>",
        faq_q7: "Come accedo ai miei referti?",
        faq_a7: "I referti degli esami sono disponibili sul <strong>Fascicolo Sanitario Elettronico (FSE)</strong> regionale, accessibile su salute.toscana.it con SPID o CIE.<br><br>Il medico può visionare i referti durante la visita e commentarli. Se avete dubbi su un referto, <a href='https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>prenotate una visita su Doctolib →</a>",
        faq_q9: "Come mi iscrivo come nuovo paziente?",
        faq_a9: "Per iscriversi come nuovo paziente occorre:<ul><li>Avere residenza o domicilio nel territorio di Arezzo</li><li>Presentarsi in segreteria con <strong>tessera sanitaria</strong> e <strong>documento d'identità</strong></li></ul>Dopo la registrazione, prenotare la prima visita su <strong>Doctolib</strong> scegliendo il tipo di visita appropriato.<div class='highlight-box'>Portare alla prima visita: lista farmaci, esami precedenti, referti e codice esenzione se presente.</div>",
        faq_q10: "Cosa faccio in caso di emergenza?",
        faq_a10: "In caso di emergenza medica chiamare sempre il <strong>112</strong>.<br><br>Per situazioni urgenti ma non emergenziali fuori dagli orari di ambulatorio, contattare la <strong>Continuità Assistenziale</strong> (ex Guardia Medica) al numero <strong>116 117</strong>.",
        faq_q11: "Come richiedo un'impegnativa per esami o visite specialistiche?",
        faq_a11: "Le impegnative per esami del sangue, radiografie o visite specialistiche si richiedono durante la visita in ambulatorio o contattando la segreteria al <strong>0575 910 904</strong>.<div class='highlight-box'>Per prenotare esami tramite il SSN, utilizzate il <strong>CUP Toscana</strong> una volta ottenuta l'impegnativa.</div>",
        faq_q12: "Come faccio a richiedere la ripetizione di una ricetta?",
        faq_a12: "Il metodo più veloce è tramite <strong>Doctolib</strong>:<ul><li>Invia un messaggio al medico su Doctolib specificando il farmaco da ripetere</li><li>In alternativa, chiama la segreteria allo <strong>0575 910 904</strong> negli orari di ambulatorio</li></ul><div class='highlight-box'>Le ricette dematerializzate (NRE) vengono inviate direttamente al sistema: potete ritirarle in qualsiasi farmacia comunicando il codice fiscale. Le richieste vengono di norma evase entro <strong>2 giorni lavorativi</strong>.</div>",
        faq_q13: "Qual è la differenza tra ricetta rossa, bianca e dematerializzata?",
        faq_a13: "<ul><li><strong>Ricetta rossa (SSN)</strong> — A carico del Servizio Sanitario, soggetta a ticket (salvo esenzioni). Copre i farmaci nel Prontuario farmaceutico nazionale.</li><li><strong>Ricetta bianca</strong> — A carico del paziente (pagata al 100% dall'assistito). Usata per farmaci non rimborsabili dal SSN o su richiesta esplicita del paziente.</li><li><strong>Dematerializzata (NRE)</strong> — Formato digitale della ricetta rossa: il medico invia il Numero Ricetta Elettronica (NRE) via SMS/email. Non serve alcun foglio fisico: basta comunicare il codice fiscale in farmacia.</li></ul><div class='highlight-box'>La ricetta dematerializzata è valida su tutto il territorio nazionale.</div>",
        faq_q14: "Posso richiedere farmaci urgenti? Entro quanto arrivano?",
        faq_a14: "Per farmaci cronici abitualmente prescritti, segnala eventuali urgenze nel messaggio su <strong>Doctolib</strong> o alla segreteria: il medico cercherà di evadere la richiesta il prima possibile.<div class='highlight-box'><strong>Attenzione:</strong> Non è possibile garantire tempi immediati in caso di assenza del medico o giornate di ambulatorio intense. Pianifica le terapie croniche con almeno <strong>5-7 giorni di anticipo</strong>.</div>Per una vera urgenza clinica fuori orario, contatta la <strong>Guardia Medica: 116 117</strong>.",
        faq_q15: "Posso chiedere il certificato di malattia per telefono o email?",
        faq_a15: "<strong>No.</strong> Il certificato INPS non può essere rilasciato senza visita medica.<br><br>La legge (Circolare INPS n. 113/2013) impone che il certificato sia trasmesso <em>\"all'atto della visita\"</em>: il medico che certifica senza aver visitato il paziente commette il reato di Falso Ideologico (Art. 481 c.p.).<br><br>Devi presentarti in studio il <strong>primo giorno di malattia</strong>: l'INPS non riconosce copertura per i giorni precedenti alla visita.",
        faq_q16: "Mi sono ammalato nel weekend o in un giorno festivo: cosa faccio?",
        faq_a16: "Rivolgiti alla <strong>Continuità Assistenziale (Guardia Medica)</strong>, attiva nelle ore notturne, nei prefestivi e nei festivi.<div class='highlight-box'>Numero unico Guardia Medica: <strong>116 117</strong></div>La Guardia Medica può visitarti e rilasciarti il certificato di malattia con decorrenza dal giorno della visita, esattamente come farebbe il tuo medico di base. Il lunedì successivo non è necessario tornare dal medico di famiglia se il certificato è già stato rilasciato, salvo aggravamenti.",
        faq_q17: "Lavoro come libero professionista: ho bisogno del certificato INPS?",
        faq_a17: "Il certificato telematico INPS è obbligatorio <strong>solo per i lavoratori dipendenti</strong> (pubblici e privati) e alcune categorie di parasubordinati (es. cococo con indennità INPS).<br><br>Se sei <strong>libero professionista, lavoratore autonomo o titolare di partita IVA</strong> senza obbligo INPS, tecnicamente non hai diritto all'indennità di malattia INPS e il certificato telematico non è obbligatorio per la tua situazione.<br><br>Potresti comunque averne bisogno per il commercialista, una compagnia assicurativa privata o un committente: in questo caso il medico può rilasciare una <strong>certificazione su carta intestata</strong> (certificato bianco), che prevede comunque una visita.",
        faq_q18: "Per andare dallo specialista ho sempre bisogno dell'impegnativa del mio medico?",
        faq_a18: "<strong>Non sempre.</strong> In Toscana esistono due modalità di accesso alle visite specialistiche SSN:<ul><li><strong>Accesso tramite impegnativa MMG</strong> — La maggior parte delle specialistiche (cardiologia, pneumologia, neurologia, ortopedia, ecc.) richiede l'impegnativa del medico di medicina generale.</li><li><strong>Accesso diretto</strong> — Alcune specialità sono prenotabili direttamente al CUP senza impegnativa, per prime visite di screening o patologie di competenza diretta.</li></ul><div class='highlight-box'>In caso di dubbio, chiedi prima alla segreteria o contatta il CUP Toscana prima di prenotare.</div>Puoi sempre accedere privatamente (senza impegnativa) pagando la tariffa intera.",
        faq_q19: "Cosa significano le classi di priorità (U, B, D, P) sulla mia impegnativa?",
        faq_a19: "Il medico assegna una classe di priorità che indica la <strong>massima attesa accettabile</strong> prima della prestazione:<ul><li><strong>U — Urgente</strong>: entro <strong>72 ore</strong> (3 giorni).</li><li><strong>B — Breve</strong>: entro <strong>10 giorni</strong>.</li><li><strong>D — Differibile</strong>: entro <strong>30 giorni</strong> per visite, <strong>60 giorni</strong> per esami strumentali e di laboratorio.</li><li><strong>P — Programmabile</strong>: entro <strong>120 giorni</strong>, per controlli programmati e situazioni croniche stabili.</li></ul><div class='highlight-box'>Se al CUP non ci sono disponibilità nei tempi della tua classe di priorità, hai diritto a essere contattato per essere inserito in una struttura alternativa (pubblica o privata accreditata) senza costi aggiuntivi.</div>",
        faq_q20: "Ho la relazione/referto dello specialista: devo tornare dal mio medico?",
        faq_a20: "Non sempre è necessaria una visita di restituzione formale, ma è fortemente <strong>consigliata</strong> se:<ul><li>Lo specialista ha modificato la terapia o avviato nuovi farmaci</li><li>Raccomanda ulteriori accertamenti o visite di controllo</li><li>Hai dubbi su quanto scritto o prescritto</li><li>La tua condizione è peggiorata</li></ul>Puoi consegnare il referto anche alla segreteria: il medico lo valuta e ti contatta se ritiene necessaria una visita.<div class='highlight-box'>Per nuove prescrizioni di farmaci cronici derivanti dalla visita specialistica, prenota una visita ordinaria affinché il medico possa inserirle correttamente nella cartella clinica.</div>",
        faq_q21: "Come faccio a sapere se ho diritto a un'esenzione dal ticket?",
        faq_a21: "Le esenzioni ticket si dividono in tre grandi categorie:<ul><li><strong>Per reddito</strong> — Basate sul reddito familiare (ISEE): disoccupati, titolari di pensione minima/sociale, famiglie a basso reddito.</li><li><strong>Per patologia cronica o rara</strong> — Diabete, ipertensione grave, BPCO, ecc.: esenzione per le prestazioni correlate alla patologia.</li><li><strong>Per invalidità e disabilità</strong> — In base al grado di invalidità riconosciuta.</li></ul><div class='highlight-box'>Il tuo medico di base può prescrivere l'esenzione per patologia cronica dopo la diagnosi. Per le esenzioni per reddito devi fare domanda allo sportello della tua ASL di riferimento.</div>Per verificare le esenzioni attive sulla tua tessera sanitaria, accedi al <strong>Fascicolo Sanitario Elettronico</strong> della Regione Toscana.",
        faq_q22: "Ho una malattia cronica: l'esenzione copre tutto o solo alcune prestazioni?",
        faq_a22: "L'esenzione per patologia cronica è <strong>selettiva</strong>: copre solo le prestazioni sanitarie <em>correlate</em> alla patologia esente, non tutte.<br><br>Esempio: se sei esente per diabete mellito (codice 013), sei esente per gli esami del sangue correlati (glicemia, HbA1c, profilo lipidico…) e per le visite diabetologiche, ma non per una visita ortopedica non correlata.<div class='highlight-box'>Quando prenoti una prestazione al CUP, specifica il <strong>codice esenzione</strong> (es. \"013\") per non pagare il ticket sulle prestazioni coperte.</div>I codici esenzione delle patologie croniche sono definiti dal DPCM 12/01/2017 (LEA) e sono uniformi su tutto il territorio nazionale.",
        faq_q23: "Posso cambiare medico di base? Come funziona?",
        faq_a23: "Il cambio del medico di medicina generale in Toscana è <strong>libero e gratuito</strong>, effettuabile una volta l'anno (salvo motivi eccezionali).<ol><li>Rivolgiti allo sportello della tua <strong>ASL</strong> più vicino (o accedi online al portale regionale) con tessera sanitaria e documento</li><li>Scegli il nuovo medico dall'elenco degli iscritti della tua zona</li><li>Il cambio è effettivo dal giorno successivo alla richiesta</li></ol>Non è necessario \"disdire\" col vecchio medico: il sistema aggiorna automaticamente la lista dei pazienti di entrambi i medici.",
        faq_q24: "Quando devo chiamare il 112 e quando il 116 117?",
        faq_a24: "<ul><li><strong>112 — Emergenza (Numero Unico)</strong>: pericolo di vita imminente. Dolore toracico, difficoltà respiratoria grave, perdita di coscienza, ictus, trauma grave, emorragia abbondante.</li><li><strong>116 117 — Guardia Medica (Continuità Assistenziale)</strong>: problemi urgenti ma non a rischio di vita, fuori dagli orari di ambulatorio. Febbre alta, dolori acuti, problemi che non possono attendere il giorno dopo.</li><li><strong>Pronto Soccorso (PS)</strong>: in alternativa per urgenze che richiedono accertamenti (radiografie, esami urgenti) ma non necessariamente un'ambulanza.</li></ul><div class='highlight-box'>In caso di dubbio, chiama il <strong>116 117</strong>: un operatore valuta telefonicamente e ti indirizza al servizio più appropriato.</div>",
        faq_q25: "Il medico è assente: cosa faccio se ho bisogno urgente?",
        faq_a25: "In caso di assenza del Dott. Savianu per ferie o malattia, viene attivato un <strong>medico sostituto</strong>: la segreteria comunica i riferimenti del sostituto.<ul><li><strong>Orari di ambulatorio</strong>: contatta il medico sostituto</li><li><strong>Notturno, festivi e prefestivi</strong>: <strong>116 117</strong> (Guardia Medica)</li><li><strong>Emergenze</strong>: <strong>112</strong></li></ul><div class='highlight-box'>Le assenze programmate sono comunicate per tempo sul sito: controlla l'avviso in alto nella homepage per eventuali comunicazioni attive.</div>",
        faq_q26: "Posso richiedere una visita domiciliare?",
        faq_a26: "Sì. La visita domiciliare è dovuta quando il paziente è impossibilitato a raggiungere lo studio per motivi di salute (non semplice comodità).<ol><li>Chiama la segreteria la mattina presto (ore 09:30-10:30 preferibilmente) per segnalare la necessità</li><li>Il medico effettua le visite domiciliari di norma nel primo pomeriggio</li></ol>Per visite domiciliari urgenti in orario notturno o festivo, contatta il <strong>116 117</strong>.",
        faq_cta_title: "Non hai trovato la risposta?",
        faq_cta_desc: "Contatta la segreteria al 0575 910 904 per comunicare con il medico.",

        flowchart_opt_book: '<i class="fas fa-calendar-check"></i> Voglio prenotare una visita',
        flowchart_opt_night: '<i class="fas fa-moon"></i> È sera, notte o weekend',
        flowchart_opt_faq: '<i class="fas fa-question-circle"></i> Ho un\'altra domanda',
        flowchart_end_book_title: 'Prenota una visita',
        flowchart_end_book_desc: 'Clicca "Prenota su Doctolib" qui sotto per scegliere il tipo di visita e prenotare.',
        flowchart_end_book_action: 'Prenota su Doctolib',
        flowchart_end_116_title: 'Chiama il 116 117',
        flowchart_end_116_desc: 'Per assistenza medica non urgente fuori orario (sera, notte, weekend, festivi): Continuità Assistenziale.',
        flowchart_end_116_action: 'Chiama 116 117',
        flowchart_end_faq_title: 'Leggi le FAQ',
        flowchart_end_faq_desc: 'Trovi risposte immediate su certificati, esenzioni, referti e burocrazia nelle domande frequenti.',
        flowchart_end_faq_action: 'Vai alle FAQ',
        flowchart_restart: '↩ Ricomincia',
        cal_privata_title: 'Consulenze e visite private (non sono un assistito)',
        cal_privata_desc: 'Consulti e certificati privati.',

        // Quick actions bar
        qa_call: 'Chiama',
        qa_doctolib: 'Doctolib',

        // FAQ page extras
        faq_search_placeholder: 'Cerca nelle FAQ...',
        faq_search_label: 'Cerca nelle FAQ',
        faq_no_results: 'Nessuna domanda trovata — contatta la segreteria al 0575 910 904.',
        faq_header_title: 'Domande Frequenti',
        faq_header_desc: 'Risposte alle domande più comuni',

        // SW update toast
        sw_update_available: 'Aggiornamento disponibile',
        sw_update_now: 'Aggiorna ora',

        // Certificato INPS
        cert_inps_btn: 'Sei qui per un certificato per l\'INPS? Premi qui',
        cert_inps_desc: '<strong style="color: var(--primary);">Certificato Invalidità Civile, Accompagnamento e Legge 104 ad Arezzo</strong><br><br>Il Dott. Emanuel Savianu, Certificatore Telematico INPS autorizzato, fornisce il nuovo Certificato Medico Introduttivo necessario per la domanda di invalidità civile, Legge 104 e accompagnamento ad Arezzo e provincia (D.Lgs. 62/2024). Esperienza come medico di categoria ANMIC nelle commissioni Medico-Legali.',

        // Misc hardcoded
        service_banner_desc: 'Trovi subito le risposte ai dubbi più comuni (certificati, esenzioni, impegnative).',
        secretary_hours_label: 'Orari Segreteria - 0575 910 904',

        // Accessibility — aria-label i18n
        skip_link: 'Vai al contenuto principale',
        floating_faq_label: 'Domande Frequenti',
        qa_call_label: 'Chiama la segreteria',
        qa_faq_label: 'Domande frequenti',
        qa_doctolib_label: 'Apri Doctolib',

        // Doctolib announcement
        doctolib_banner_text: 'Il dott. Savianu visita solo su appuntamento. Si prega di prenotare tramite Doctolib.',
        doctolib_banner_link: 'Prenota su Doctolib',
        urgenze_line: 'Per urgenze: Guardia Medica 116 117 — Emergenze: 112.',
        doctolib_modal_title: 'Avviso Importante',
        doctolib_modal_text: 'Gentili Pazienti, un caro saluto.<br><br>Il <strong>Dott. Savianu visita solo su appuntamento</strong>. Si prega di prenotare tramite <a href="' + CONFIG.DOCTOLIB.booking + '" target="_blank" rel="noopener noreferrer" class="modal-link">Doctolib</a>.<br><br>🚨 <strong>Urgenze, notte, weekend e festivi</strong><br>Nei fine settimana, nei festivi e nelle ore notturne i medici di medicina generale non sono in servizio. Per qualsiasi urgenza in questi giorni — o se la segreteria non risponde — è sempre attiva la Guardia Medica 24h/24 al 116 117. Per le emergenze, 112.<br><br>📌 <strong>Appuntamenti e richieste</strong><br>Prenotate o scrivetemi su Doctolib, oppure chiamate la segreteria al 0575 910904.<br><br>Dott. Emanuel Savianu<br><em>Medico di Medicina Generale</em>',
        doctolib_modal_btn: 'Ho letto',

        // CTA buttons
        cta_book_doctolib: 'Prenota appuntamento',
        cta_book_doctolib_sub: 'Scegli giorno e orario su Doctolib',
        cta_message_doctolib: 'Invia messaggio / Richiedi ricetta',
        cta_message_doctolib_sub: 'Comunica col medico tramite Doctolib',

        // Nav (site-nav component)
        nav_home: 'Home',
        nav_ssn: 'Pazienti',
        nav_privati: 'Consulti e certificati INPS',
        nav_colleghi: 'Colleghi',
        nav_faq: 'FAQ',

        // Footer (site-footer component)
        footer_home: 'Home',
        footer_faq: 'Domande Frequenti',

        // Footer
        footer_malattia_link: 'Certificato di malattia: chi deve farlo?',

        // International patients (/international/)
        footer_international: 'Pazienti Internazionali',
        triage_intl_title: 'Pazienti Internazionali',
        triage_intl_desc: 'Consulenze di famiglia e medicina generale in inglese e italiano — per residenti internazionali e visitatori della Provincia di Arezzo.',
        intl_hero_title: 'Il suo medico di famiglia in inglese ad Arezzo',
                intl_hero_sub: 'Consulenze di medicina generale privata in lingua inglese, per residenti e visitatori della Provincia di Arezzo — Cortona, Castiglion Fiorentino, la Val di Chiana e oltre — sempre con lo stesso medico, visita dopo visita.',
                intl_hero_eyebrow: 'Studio Medico Ippocrate · Piazza Saione 3, Arezzo',
                intl_hero_cta: 'Richiedi informazioni sulla visita privata',
        intl_intro_heading: 'Informazioni sulle consulenze',
        intl_intro_1: "Muoversi tra sistemi sanitari diversi può disorientare, soprattutto quando la lingua aggiunge un ulteriore livello di mediazione a ogni conversazione medica. Le consulenze si svolgono direttamente in inglese — senza interprete, senza perdita di sfumature — per residenti internazionali, proprietari di seconde case e visitatori dell'area aretina.",
        intl_intro_2: 'Il Dott. Emanuel Savianu è un medico di medicina generale con studio ad Arezzo, in Toscana: offre consulenze private di medicina generale in lingua inglese rivolte a residenti internazionali e visitatori. Le consulenze sono disponibili anche in italiano.',
        intl_pillars_title: 'Come funziona lo studio per i pazienti internazionali',
        intl_pillar1_t: 'Continuità medica',
        intl_pillar1_d: "Un solo medico, un solo fascicolo clinico, ad ogni visita — incluso il coordinamento con gli specialisti e, dove rilevante, con il medico del paese d'origine.",
        intl_pillar2_t: 'Consulenze in lingua inglese',
        intl_pillar2_d: 'Colloquio clinico diretto in inglese. L’italiano è ugualmente disponibile.',
        intl_pillar3_t: 'Orientamento nel sistema sanitario italiano',
        intl_pillar3_d: "Indicazioni chiare su come funziona il SSN, le impegnative, l'accesso agli specialisti e quando è utile una visita privata.",
        intl_pillar4_t: 'Accesso flessibile',
        intl_pillar4_d: 'Controlli in telemedicina quando appropriato e visite domiciliari nella Provincia dove clinicamente indicate.',
        intl_steps_title: 'Che cosa aspettarsi',
        intl_step1: "<strong>Richiesta.</strong> Compili il modulo qui sotto, scriva un'email o lasci un messaggio telefonico: riceverà una risposta personale con disponibilità, informazioni sui costi e prossimi passi.",
        intl_step2: '<strong>Appuntamento.</strong> Concordiamo insieme data e modalità — nella lingua che preferisce — e organizziamo tutto ciò che serve per prepararsi.',
        intl_step3: '<strong>Visita.</strong> In studio (Piazza Saione 3, Arezzo), in telemedicina o a domicilio dove clinicamente indicato. Follow-up e documentazione sono gestiti direttamente con lei.',
        intl_info_title: 'Informazioni pratiche',
        intl_info_address_l: 'Studio',
        intl_info_hours_l: 'Orari',
        intl_info_hours_v: 'Martedì e giovedì, 10:00–12:00. Lunedì, mercoledì e venerdì, 16:00–18:00. Visite solo su appuntamento.',
        intl_info_phone_l: 'Telefono',
        intl_info_langs_l: 'Lingue',
        intl_info_langs_v: 'English · Italiano',
        intl_ssn_note: "I residenti internazionali in Italia non sono automaticamente iscritti al Servizio Sanitario Nazionale (SSN). La visita privata è una delle opzioni di cura mentre si definiscono residenza, iscrizione al SSN o un soggiorno di breve durata — lo studio può inoltre spiegare cosa comporta l'iscrizione al SSN.",
        intl_form_title: 'Richiedi una consulenza',
        intl_form_intro: 'Questo modulo raccoglie soltanto dati amministrativi: non inserisca informazioni mediche. Dopo la nostra risposta organizzeremo un canale sicuro per raccogliere la sua storia clinica. I campi contrassegnati con * sono obbligatori.',
        intl_f_name: 'Nome completo *',
        intl_f_email: 'Email *',
        intl_f_phone: 'Telefono (facoltativo)',
        intl_f_lang: 'Lingua preferita *',
        intl_f_lang_en: 'English',
        intl_f_lang_it: 'Italiano',
        intl_f_status: 'Lei è…',
        intl_f_status_resident: 'Residente',
        intl_f_status_secondhome: 'Proprietario/a di seconda casa',
        intl_f_status_visitor: 'Visitatore/trice',
        intl_f_status_nomad: 'Lavoratore/trice da remoto / digital nomad',
        intl_f_reason: 'Motivo della richiesta *',
        intl_f_reason_new: 'Prima consulenza da nuovo paziente',
        intl_f_reason_doc: 'Documentazione o certificato medico',
        intl_f_reason_coord: 'Coordinamento delle cure',
        intl_f_reason_home: 'Richiesta di visita domiciliare',
        intl_f_reason_other: 'Altro',
        intl_f_note: 'Nota (facoltativa)',
        intl_f_note_ph: 'Facoltativa — non inserisca dettagli medici qui; raccoglieremo la sua storia clinica in modo sicuro dopo il primo contatto.',
        intl_f_consent: 'Ho letto e accetto l\u2019<a href="../privacy.html">informativa privacy</a>.',
        intl_f_submit: 'Richiedi informazioni sulla visita privata',
        intl_f_alt: 'Per informazioni su costi e disponibilità scriva a <span class="js-email"></span>.',
        intl_f_done: 'Grazie — il suo programma di posta dovrebbe aprirsi con la richiesta precompilata. Se non succede, ci scriva direttamente.',
        intl_hero_cta: 'Richiedi informazioni sulla visita privata',
        intl_f_error: 'Invio non riuscito. Riprovi o scriva direttamente a <span class="js-email"></span>.',
        intl_f_success: 'Grazie — la sua richiesta è stata inviata. Le risponderemo entro pochi giorni lavorativi.',
        intl_f_sending: 'Invio in corso…',
        intl_f_invalid: 'Completare i campi obbligatori indicati.',
        intl_info_map_aria: 'Apri Studio Medico Ippocrate, Piazza Saione 3, Arezzo in Google Maps',
        intl_emergency: 'Per le emergenze mediche chiami sempre il 112. Fuori orario, per cure non urgenti, chiami il 116 117.',
        // International FAQ (/international/)
        intl_faq_title: 'Domande frequenti',
        intl_faq1_q: 'Devo essere iscritto al Servizio Sanitario Nazionale (SSN) per prenotare una consulenza privata?',
        intl_faq1_a: 'No. Le consulenze private sono aperte a tutti, compresi i visitatori e i residenti non iscritti al Servizio Sanitario Nazionale (SSN). Se sta valutando l’iscrizione, durante la visita le spieghiamo cosa comporta.',
        intl_faq2_q: 'Posso ottenere una ricetta o un certificato medico in inglese?',
        intl_faq2_a: 'Sì. Dove appropriato, i certificati e le lettere di presentazione possono essere corredati di documentazione in inglese, oltre alla versione ufficiale in italiano. Le ricette elettroniche seguono il formato nazionale e si ritirano in qualsiasi farmacia italiana con il codice fiscale.',
        intl_faq3_q: 'Quanto costa una consulenza privata?',
        intl_faq3_a: 'L’onorario dipende dal tipo e dalla durata della consulenza. Scriva per ricevere un’indicazione chiara prima di prenotare: nessun obbligo.',
        intl_faq4_q: 'È possibile il coordinamento con il medico nel paese d’origine?',
        intl_faq4_a: 'Sì. Con il suo consenso, referti e documentazione possono essere condivisi con il suo medico o specialista nel paese d’origine, e le cure possono essere coordinate mentre si trova in Italia.',
        intl_faq5_q: 'Sono disponibili visite a domicilio fuori Arezzo, ad esempio a Cortona o in Val di Chiana?',
        intl_faq5_a: 'Le visite domiciliari sono disponibili in tutta la Provincia di Arezzo — tra cui Cortona, Castiglion Fiorentino e la Val di Chiana — dove clinicamente indicate. La disponibilità viene confermata insieme all’appuntamento.',
        intl_faq6_q: 'Cosa succede in caso di emergenza medica?',
        intl_faq6_a: 'In caso di emergenza medica chiami sempre il 112. Lo studio offre cure programmate non urgenti; fuori orario, l’assistenza non urgente è disponibile tramite il 116 117.',
    },
    en: {
        // Header
        header_subtitle: "General Practitioner - Arezzo",

        // Landing triage
        landing_hero_eyebrow: "Studio Medico Ippocrate",
        landing_hero_title: "Dr. Emanuel Savianu",
        landing_hero_location: "Piazza Saione 3, Arezzo",
        landing_hero_phone: "Reception: 0575 910 904",
        triage_ssn_title: "Patients",
        triage_ssn_desc: "Are you a patient of Dr. Savianu? Book visits on Doctolib, request prescriptions, read guides and exemptions.",
        triage_privati_title: "INPS Consultations & Certificates",
        triage_privati_desc: "Private consultations, INPS certificates, civil disability and Law 104 — book on Google Calendar.",
        triage_colleghi_title: "Colleagues",
        triage_colleghi_desc: "Reserved area for professionals: tools, protocols, regulations and service applications.",
        triage_cta: "Enter",
        triage_section_label: "Choose your area",


        // Services section
        services_title: "Online Services",
        btn_faq_main: "Have questions? Read the FAQ first",


        // Booking section
        booking_title: "Book on Doctolib",
        cal_privata_title: "Private Consultations and Visits (I am not an existing patient)",
        cal_privata_desc: "Private consultations and certificates.",
        privacy_notice_text: "Please read the privacy policy.",
        privacy_notice_link: "Data Processing Policy",


        // Emergency & out-of-hours
        emergency_112: "For medical emergencies, always call the emergency number 112.",
        title_116117: "116 117 — Non-Urgent Health Care",
        cta_116117_main: "CALL 116 117",
        note_116117_free: "(Free, 24/7 service)",
        desc_116117_operator: "A doctor or operator will help you.",
        when_call_116117: "✅ WHEN TO CALL 116 117:",
        item_when_1: "For medical advice when your doctor is unavailable.",
        item_when_2: "For the out-of-hours doctor service (nights, weekends, holidays).",
        item_when_3: "For information about local health services.",
        when_not_call_116117: "❌ WHEN NOT TO CALL 116 117:",
        item_not_emergency: "<strong>Serious emergencies:</strong> Call <strong>112</strong> immediately.",
        item_not_booking: "<strong>To book exams or visits:</strong> Call CUP (<strong>800 575 575</strong>) or go to a pharmacy.",
        aside_116117_prompt: "Office closed or unreachable? Can't find your doctor?",
        aside_116117_sub: "Free, 24/7 service",

        // Contacts
        contacts_title: "Office Contacts",
        label_doctolib_contacts: "Appointments, Messages, Prescription Renewals",
        label_secretary_fallback: "Reception (only if you cannot use Doctolib)",
        label_address: "Studio Medico Ippocrate",
        label_via_doctolib: "via Doctolib",
        label_address_value: "Piazza Saione 3, Arezzo",

        // Hours
        hours_lun_ven: "Mon - Fri",
        hours_title: "Office Hours",
        closed: "Closed",

        // Footer
        link_privacy: "Privacy Policy",


        faq_back: "<i class='fas fa-arrow-left'></i> Back to main site",
        faq_nav_prenotazioni: "Appointments",
        faq_nav_ricette: "Prescriptions",
        faq_nav_certificati: "Certificates",
        faq_nav_referti: "Test Results",
        faq_nav_nuovi: "New Patients",
        faq_nav_urgenze: "Emergencies",
        faq_nav_varie: "Services",
        faq_sec_prenotazioni: "<i class='fas fa-calendar-check'></i> Appointments &amp; Bookings",
        faq_sec_ricette: "<i class='fas fa-pills'></i> Prescriptions &amp; Medications",
        faq_q1: "How do I book a visit?",
        faq_a1: "Book your appointment through <strong>Doctolib</strong>:<ul><li>Click \"Book on Doctolib\" below or go to <a href='index.html'>savianu.it</a></li><li>Choose the visit type in the Doctolib app</li><li>Confirm your appointment</li></ul><div class='highlight-box'><a href='https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Click here to book →</a></div><div class='highlight-box'>Alternatively, call reception on <strong>0575 910 904</strong> during clinic hours.</div>",
        faq_q2: "Can I come without an appointment?",
        faq_a2: "The doctor sees patients <strong>by appointment only</strong> to ensure reasonable waiting times and give each patient the attention they deserve.<br><br>If you are unwell and cannot book via Doctolib, come in anyway: the receptionist will let the doctor know, and he will contact you as soon as he is free.",
        faq_q3: "What are the clinic opening hours?",
        faq_a3: "<table style='width:100%; border-collapse: collapse;'><tr><td style='padding: 6px 0; font-weight: 600;'>Monday - Friday</td><td style='text-align:right; color: var(--text-dark); font-weight: 700;'>09:30 - 12:30 · 16:00 - 19:00</td></tr><tr><td style='padding: 6px 0; font-weight: 600; color: var(--danger);'>Saturday - Sunday</td><td style='text-align:right; color: var(--danger);'>Closed</td></tr></table><div class='highlight-box'><strong>Address:</strong> Studio Medico Ippocrate, Piazza Saione 3, Arezzo</div>",
        faq_q4: "How do I cancel or reschedule an appointment?",
        faq_a4: "To <strong>modify or cancel</strong> an appointment, open your confirmation in the Doctolib app or log in to your account at Doctolib.it.<br><br>Alternatively, call reception on <strong>0575 910 904</strong> with reasonable notice.",
        faq_q5: "How do I request a prescription for my regular medications?",
        faq_a5: "You can request a prescription via <strong>Doctolib</strong> (send a message to the doctor) or:<ul><li>Call reception on <strong>0575 910 904</strong> during clinic hours</li><li>During an in-office visit</li></ul><div class='highlight-box'><a href='https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Send a request on Doctolib →</a></div><div class='highlight-box'><strong>Important:</strong> Electronic prescriptions (NRE) are sent directly to the system — you can collect them at any pharmacy by providing your tax ID (Codice Fiscale).</div>",
        faq_sec_certificati: "<i class='fas fa-file-medical'></i> Certificates",
        faq_sec_referti: "<i class='fas fa-flask'></i> Test Results &amp; Referrals",
        faq_sec_nuovi: "<i class='fas fa-user-plus'></i> New Patients",
        faq_sec_urgenze: "<i class='fas fa-ambulance'></i> Emergencies &amp; Out-of-Hours",
        faq_sec_varie: "<i class='fas fa-stethoscope'></i> Other Services",
        faq_q6: "How do I request a medical certificate?",
        faq_a6: "Certificates can be requested during a clinic visit or by calling reception on <strong>0575 910 904</strong>.<br><br>Bring any relevant documents; the certificate is issued on the spot at the clinic.<div class='highlight-box'><strong>INPS sick leave certificates</strong> require an in-person visit. <a href='https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Book on Doctolib →</a></div>",
        faq_q7: "How do I access my test results?",
        faq_a7: "Test results are available on the <strong>Electronic Health Record (FSE)</strong>, accessible at salute.toscana.it using SPID or CIE.<br><br>The doctor can review and discuss results during a visit. If you have questions about a result, <a href='https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>book an appointment on Doctolib →</a>",
        faq_q9: "How do I register as a new patient?",
        faq_a9: "To register as a new patient you must:<ul><li>Reside or be domiciled in the Arezzo area</li><li>Present yourself at reception with your <strong>health card (tessera sanitaria)</strong> and <strong>photo ID</strong></li></ul>After registration, book your first appointment on <strong>Doctolib</strong> by selecting the appropriate visit type.<div class='highlight-box'>Bring to your first visit: a list of your current medications, previous test results, specialist reports, and your exemption code if applicable.</div>",
        faq_q10: "What do I do in an emergency?",
        faq_a10: "In a medical emergency always call <strong>112</strong>.<br><br>For urgent but non-emergency situations outside clinic hours, contact the <strong>Out-of-Hours Service</strong> (Continuità Assistenziale) on <strong>116 117</strong>.",
        faq_q11: "How do I get a referral for tests or specialist appointments?",
        faq_a11: "Referrals for blood tests, X-rays, or specialist visits must be requested during an in-person clinic visit or by calling reception on <strong>0575 910 904</strong>.<div class='highlight-box'>To book tests through the NHS, use <strong>CUP Toscana</strong> once you have your referral.</div>",
        faq_q12: "How do I request a prescription refill?",
        faq_a12: "The fastest way is via <strong>Doctolib</strong>:<ul><li>Send a message to your doctor on Doctolib specifying the medication to refill</li><li>Alternatively, call reception on <strong>0575 910 904</strong> during clinic hours</li></ul><div class='highlight-box'>Electronic prescriptions (NRE) are sent directly to the system: you can collect them at any pharmacy by providing your tax ID. Requests are usually processed within <strong>2 working days</strong>.</div>",
        faq_q13: "What is the difference between a red, white and electronic prescription?",
        faq_a13: "<ul><li><strong>Red prescription (NHS)</strong> — Funded by the National Health Service, subject to a co-payment (unless exempt). Covers medicines in the national pharmaceutical formulary.</li><li><strong>White prescription</strong> — Paid entirely by the patient. Used for medicines not reimbursed by the NHS or on explicit patient request.</li><li><strong>Electronic (NRE)</strong> — Digital format of the red prescription: the doctor sends the Electronic Prescription Number (NRE) via SMS/email. No paper needed: just give your tax ID at the pharmacy.</li></ul><div class='highlight-box'>Electronic prescriptions are valid throughout the country.</div>",
        faq_q14: "Can I request urgent medication? How long does it take?",
        faq_a14: "For regular chronic medication, mention any urgency in your message on <strong>Doctolib</strong> or to reception: the doctor will try to process the request as soon as possible.<div class='highlight-box'><strong>Please note:</strong> Immediate turnaround cannot be guaranteed when the doctor is away or during busy clinic days. Plan chronic therapies at least <strong>5-7 days in advance</strong>.</div>For a real clinical urgency outside office hours, contact the <strong>Out-of-Hours Service: 116 117</strong>.",
        faq_q15: "Can I request a sick leave certificate by phone or email?",
        faq_a15: "<strong>No.</strong> An INPS certificate cannot be issued without a medical examination.<br><br>The law (INPS Circular n. 113/2013) requires the certificate to be transmitted <em>\"at the time of the visit\"</em>: a doctor certifying without examining the patient commits the offence of Ideological Falsehood (Art. 481 of the Criminal Code).<br><br>You must attend the clinic on the <strong>first day of illness</strong>: INPS does not recognise cover for days before the visit.",
        faq_q16: "I got ill over the weekend or on a holiday: what should I do?",
        faq_a16: "Contact the <strong>Out-of-Hours Service (Continuità Assistenziale)</strong>, active at night and on holidays.<div class='highlight-box'>Out-of-hours number: <strong>116 117</strong></div>The out-of-hours doctor can examine you and issue the sick leave certificate starting from the day of the visit, just like your GP would. On the following Monday you do not need to see your GP again if the certificate has already been issued, unless your condition gets worse.",
        faq_q17: "I am self-employed: do I need an INPS certificate?",
        faq_a17: "The INPS electronic certificate is mandatory <strong>only for employed workers</strong> (public and private) and certain categories of quasi-subordinate workers (e.g. co.co.co with INPS benefits).<br><br>If you are a <strong>freelancer, self-employed worker or VAT-registered professional</strong> without INPS obligations, you technically have no entitlement to the INPS sickness benefit, so the electronic certificate is not mandatory for you.<br><br>You may still need one for your accountant, a private insurance company or a client: in that case the doctor can issue a <strong>certificate on headed paper</strong> (white certificate), which also requires a visit.",
        faq_q18: "Do I always need a referral from my GP to see a specialist?",
        faq_a18: "<strong>Not always.</strong> In Tuscany there are two ways to access NHS specialist visits:<ul><li><strong>GP referral</strong> — Most specialties (cardiology, pulmonology, neurology, orthopaedics, etc.) require a referral from your GP.</li><li><strong>Direct access</strong> — Some specialties can be booked directly with the CUP without a referral, for first screening visits or conditions under direct competence.</li></ul><div class='highlight-box'>If in doubt, ask reception first or contact CUP Toscana before booking.</div>You can always access privately (without a referral) by paying the full fee.",
        faq_q19: "What do the priority classes (U, B, D, P) on my referral mean?",
        faq_a19: "The doctor assigns a priority class that indicates the <strong>maximum acceptable waiting time</strong> for the service:<ul><li><strong>U — Urgent</strong>: within <strong>72 hours</strong> (3 days).</li><li><strong>B — Short</strong>: within <strong>10 days</strong>.</li><li><strong>D — Deferrable</strong>: within <strong>30 days</strong> for visits, <strong>60 days</strong> for diagnostic and laboratory tests.</li><li><strong>P — Programmable</strong>: within <strong>120 days</strong>, for scheduled check-ups and stable chronic conditions.</li></ul><div class='highlight-box'>If the CUP has no availability within your priority class timeframe, you have the right to be contacted to be placed in an alternative facility (public or accredited private) at no extra cost.</div>",
        faq_q20: "I have the specialist's report: do I need to go back to my GP?",
        faq_a20: "A formal follow-up visit is not always necessary, but it is strongly <strong>recommended</strong> if:<ul><li>The specialist changed your medication or started new drugs</li><li>Further tests or follow-up visits are recommended</li><li>You have doubts about what was written or prescribed</li><li>Your condition has worsened</li></ul>You can also leave the report with reception: the doctor will review it and contact you if a visit is needed.<div class='highlight-box'>For new chronic prescriptions resulting from a specialist visit, book a standard visit so the doctor can add them correctly to your medical record.</div>",
        faq_q21: "How do I know if I am entitled to a co-payment exemption?",
        faq_a21: "Co-payment exemptions fall into three broad categories:<ul><li><strong>By income</strong> — Based on household income (ISEE): unemployed people, minimum/social pension holders, low-income families.</li><li><strong>By chronic or rare condition</strong> — Diabetes, severe hypertension, COPD, etc.: exemption for services related to the condition.</li><li><strong>By disability</strong> — Based on the recognised degree of disability.</li></ul><div class='highlight-box'>Your GP can prescribe a chronic-condition exemption after diagnosis. For income-based exemptions you must apply at your local health authority office.</div>To check the exemptions active on your health card, access the <strong>Electronic Health Record</strong> of the Tuscany Region.",
        faq_q22: "I have a chronic condition: does the exemption cover everything or only some services?",
        faq_a22: "The chronic-condition exemption is <strong>selective</strong>: it covers only health services <em>related</em> to the exempt condition, not everything.<br><br>Example: if you are exempt for diabetes (code 013), you are exempt for related blood tests (glucose, HbA1c, lipid profile…) and diabetes consultations, but not for an unrelated orthopaedic visit.<div class='highlight-box'>When booking a service with the CUP, state your <strong>exemption code</strong> (e.g. \"013\") to avoid paying the co-payment on covered services.</div>Exemption codes for chronic conditions are defined by DPCM 12/01/2017 (LEA) and are uniform nationwide.",
        faq_q23: "Can I change my GP? How does it work?",
        faq_a23: "Changing your GP in Tuscany is <strong>free</strong> and can be done once a year (except for exceptional reasons).<ol><li>Go to the nearest <strong>local health authority</strong> office (or use the regional online portal) with your health card and ID</li><li>Choose the new doctor from the list of GPs in your area</li><li>The change takes effect from the day after your request</li></ol>You do not need to \"unsubscribe\" from your old doctor: the system automatically updates both doctors' patient lists.",
        faq_q24: "When should I call 112 and when 116 117?",
        faq_a24: "<ul><li><strong>112 — Emergency (Single Number)</strong>: imminent life-threatening situations. Chest pain, severe breathing difficulty, loss of consciousness, stroke, severe trauma, heavy bleeding.</li><li><strong>116 117 — Out-of-Hours Service</strong>: urgent but not life-threatening problems outside clinic hours. High fever, acute pain, issues that cannot wait until the next day.</li><li><strong>Emergency Department (ER)</strong>: an alternative for urgencies requiring tests (X-rays, urgent lab work) but not necessarily an ambulance.</li></ul><div class='highlight-box'>If in doubt, call <strong>116 117</strong>: an operator will assess you over the phone and direct you to the most appropriate service.</div>",
        faq_q25: "The doctor is away: what do I do if I need urgent care?",
        faq_a25: "When Dr. Savianu is away on holiday or sick, a <strong>covering doctor</strong> is arranged: reception will provide their contact details.<ul><li><strong>During clinic hours</strong>: contact the covering doctor</li><li><strong>At night, weekends and holidays</strong>: <strong>116 117</strong> (Out-of-Hours Service)</li><li><strong>Emergencies</strong>: <strong>112</strong></li></ul><div class='highlight-box'>Planned absences are announced in advance on the website: check the notice at the top of the homepage for any active communications.</div>",
        faq_q26: "Can I request a home visit?",
        faq_a26: "Yes. A home visit is due when the patient is unable to reach the clinic for health reasons (not mere convenience).<ol><li>Call reception early in the morning (ideally 09:30-10:30) to report the need</li><li>The doctor usually performs home visits in the early afternoon</li></ol>For urgent home visits at night or on holidays, contact <strong>116 117</strong>.",
        faq_cta_title: "Didn't find the answer?",
        faq_cta_desc: "Contact reception on 0575 910 904 to send a message to the doctor.",

        flowchart_opt_book: '<i class="fas fa-calendar-check"></i> I want to book a visit',
        flowchart_opt_night: '<i class="fas fa-moon"></i> It\'s evening, night or weekend',
        flowchart_opt_faq: '<i class="fas fa-question-circle"></i> I have another question',
        flowchart_end_book_title: 'Book a visit',
        flowchart_end_book_desc: 'Click "Book on Doctolib" below to choose the visit type and book.',
        flowchart_end_book_action: 'Book on Doctolib',
        flowchart_end_116_title: 'Call 116 117',
        flowchart_end_116_desc: 'For non-urgent medical assistance outside hours (evenings, nights, weekends, holidays): Out-of-Hours Service.',
        flowchart_end_116_action: 'Call 116 117',
        flowchart_end_faq_title: 'Read the FAQ',
        flowchart_end_faq_desc: 'Find immediate answers about certificates, exemptions, test results and bureaucracy in the frequently asked questions.',
        flowchart_end_faq_action: 'Go to FAQ',
        flowchart_restart: '↩ Start over',

        // Quick actions bar
        qa_call: 'Call',
        qa_doctolib: 'Doctolib',

        // FAQ page extras
        faq_search_placeholder: 'Search the FAQ...',
        faq_search_label: 'Search the FAQ',
        faq_no_results: 'No questions found — contact reception on 0575 910 904.',
        faq_header_title: 'Frequently Asked Questions',
        faq_header_desc: 'Answers to the most common questions',

        // SW update toast
        sw_update_available: 'Update available',
        sw_update_now: 'Update now',

        // Certificato INPS
        cert_inps_btn: 'INPS certificate? Click here',
        cert_inps_desc: '<strong style="color: var(--primary);">Civil Disability, Attendance Allowance and Law 104 Certificate in Arezzo</strong><br><br>Dr. Emanuel Savianu, authorized INPS Telematic Certifier, provides the new Introductory Medical Certificate required for civil disability, Law 104 and attendance allowance applications in Arezzo and province (Legislative Decree 62/2024). Experience as ANMIC category doctor in Medico-Legal commissions.',

        // Misc hardcoded
        service_banner_desc: 'Find immediate answers to common questions (certificates, exemptions, referrals).',
        secretary_hours_label: 'Reception Hours - 0575 910 904',

        // Accessibility — aria-label i18n
        skip_link: 'Skip to main content',
        floating_faq_label: 'Frequently Asked Questions',
        qa_call_label: 'Call reception',
        qa_faq_label: 'Frequently Asked Questions',
        qa_doctolib_label: 'Open Doctolib',

        // Doctolib announcement
        doctolib_banner_text: 'Dr. Savianu sees patients by appointment only. Please book via Doctolib.',
        doctolib_banner_link: 'Book on Doctolib',
        urgenze_line: 'For urgent matters: Guardia Medica 116 117 — Emergencies: 112.',
        doctolib_modal_title: 'Important Notice',
        doctolib_modal_text: 'Dear Patients, warm regards.<br><br><strong>Dr. Savianu sees patients by appointment only</strong>. Please book via <a href="' + CONFIG.DOCTOLIB.booking + '" target="_blank" rel="noopener noreferrer" class="modal-link">Doctolib</a>.<br><br>🚨 <strong>Urgencies, night, weekends and public holidays</strong><br>On weekends, public holidays and at night, general practitioners are not on duty. For any urgency on these days — or if the secretariat does not answer — the On-Call Doctor (Guardia Medica) is always available 24/7 at 116 117. For emergencies, 112.<br><br>📌 <strong>Appointments and requests</strong><br>Book or write to me on Doctolib, or call the secretariat at 0575 910904.<br><br>Dr. Emanuel Savianu<br><em>General Practitioner</em>',
        doctolib_modal_btn: 'I understand',

        // CTA buttons
        cta_book_doctolib: 'Book an appointment',
        cta_book_doctolib_sub: 'Choose date and time on Doctolib',
        cta_message_doctolib: 'Send a message / Request prescription',
        cta_message_doctolib_sub: 'Contact the doctor via Doctolib',

        // Nav (site-nav component)
        nav_home: 'Home',
        nav_ssn: 'Patients',
        nav_privati: 'INPS Consultations & Certificates',
        nav_colleghi: 'Colleagues',
        nav_faq: 'FAQ',

        // Footer (site-footer component)
        footer_home: 'Home',
        footer_faq: 'Frequently Asked Questions',

        // Footer
        footer_malattia_link: 'Sick leave certificate: who should issue it?',

        // International patients (/international/)
        footer_international: 'International Patients',
        triage_intl_title: 'International Patients',
        triage_intl_desc: 'Family doctor & GP consultations in English and Italian — for international residents and visitors across the Province of Arezzo.',
        intl_hero_title: 'Your English-Speaking Family Doctor in Arezzo',
                intl_hero_sub: 'Private primary care consultations in English, for residents and visitors across the Province of Arezzo — Cortona, Castiglion Fiorentino, the Val di Chiana and beyond — with the same physician, visit after visit.',
                intl_hero_eyebrow: 'Studio Medico Ippocrate · Piazza Saione 3, Arezzo',
                intl_hero_cta: 'Inquire About Private Primary Care',
        intl_intro_heading: 'About these consultations',
        intl_intro_1: 'Moving between healthcare systems can be disorienting, especially when language adds another layer to every medical conversation. These consultations are conducted directly in English — no interpreter, no loss of nuance — for international residents, second-home owners, and visitors throughout the Arezzo area.',
        intl_intro_2: 'Dr. Emanuel Savianu is a family doctor and general practitioner (GP) based in Arezzo, Tuscany, offering private primary care consultations in English for international residents, second-home owners and visitors. Consultations are also available in Italian.',
        intl_pillars_title: 'How the practice works for international patients',
        intl_pillar1_t: 'Medical continuity',
        intl_pillar1_d: 'One physician, one clinical record, across every visit — including coordination with specialists and, where relevant, with your doctor at home.',
        intl_pillar2_t: 'English-language consultations',
        intl_pillar2_d: 'Direct clinical conversation in English — whether you need a family doctor, a GP, or ongoing primary care. Italian is equally available.',
        intl_pillar3_t: 'Navigating Italian healthcare',
        intl_pillar3_d: 'Clear guidance on how the SSN works, referrals (impegnative), specialist access, and when a private consultation makes sense.',
        intl_pillar4_t: 'Flexible access',
        intl_pillar4_d: 'Telemedicine follow-ups when appropriate, and home visits across the Province where clinically indicated.',
        intl_steps_title: 'What to expect',
        intl_step1: '<strong>Inquiry.</strong> Send the form below, an email, or a phone message. You will receive a personal reply with availability, fee information, and next steps.',
        intl_step2: '<strong>Appointment.</strong> We confirm the date and format together — in your preferred language — and arrange anything needed to prepare.',
        intl_step3: '<strong>Consultation.</strong> At the studio (Piazza Saione 3, Arezzo), by telemedicine, or at home where clinically indicated. Follow-up and documentation are handled directly with you.',
        intl_info_title: 'Practical information',
        intl_info_address_l: 'Studio',
        intl_info_hours_l: 'Opening hours',
        intl_info_hours_v: 'Tuesday and Thursday, 10:00–12:00. Monday, Wednesday and Friday, 16:00–18:00. Visits by appointment.',
        intl_info_phone_l: 'Phone',
        intl_info_langs_l: 'Languages',
        intl_info_langs_v: 'English · Italiano',
        intl_ssn_note: 'International residents in Italy are not automatically enrolled in the national health service (SSN). A private consultation is one option for care while residency, SSN registration, or a short-term stay is being sorted out — and the practice can explain what SSN registration would involve.',
        intl_form_title: 'Request a consultation',
        intl_form_intro: 'This form collects administrative details only — please do not include medical information here. After we reply, we will arrange a secure way to collect your history. Fields marked * are required.',
        intl_f_name: 'Full name *',
        intl_f_email: 'Email *',
        intl_f_phone: 'Phone (optional)',
        intl_f_lang: 'Preferred language *',
        intl_f_lang_en: 'English',
        intl_f_lang_it: 'Italiano',
        intl_f_status: 'You are a…',
        intl_f_status_resident: 'Resident',
        intl_f_status_secondhome: 'Second-home owner',
        intl_f_status_visitor: 'Visitor',
        intl_f_status_nomad: 'Remote worker / digital nomad',
        intl_f_reason: 'Reason for inquiry *',
        intl_f_reason_new: 'New patient consultation',
        intl_f_reason_doc: 'Medical documentation or certificate',
        intl_f_reason_coord: 'Care coordination',
        intl_f_reason_home: 'Home visit request',
        intl_f_reason_other: 'Other',
        intl_f_note: 'Optional note',
        intl_f_note_ph: "Optional — please don't include medical details here; we'll collect your history securely after we're in touch.",
        intl_f_consent: 'I have read and accept the <a href="../privacy.html">privacy policy</a>.',
        intl_f_submit: 'Inquire About Primary Care',
        intl_f_alt: 'For information about fees and availability, please write to <span class="js-email"></span>.',
        intl_f_done: 'Thank you — your email program should now open with your inquiry pre-filled. If it does not, please write to us directly.',
        intl_hero_cta: 'Inquire About Private Primary Care',
        intl_f_error: 'Submission failed. Please try again, or write to us directly at <span class="js-email"></span>.',
        intl_f_success: 'Thank you — your inquiry has been sent. We will reply within a few business days.',
        intl_f_sending: 'Sending…',
        intl_f_invalid: 'Please complete the highlighted required fields.',
        intl_info_map_aria: 'Open Studio Medico Ippocrate, Piazza Saione 3, Arezzo in Google Maps',
        intl_emergency: 'For medical emergencies, always call 112. Outside opening hours, for non-urgent care, call 116 117.',
        // International FAQ (/international/)
        intl_faq_title: 'Common questions',
        intl_faq1_q: 'Do I need to be registered with the Italian national health service (SSN) to book a private consultation?',
        intl_faq1_a: 'No. Private consultations are open to everyone, including visitors and residents who are not registered with the Italian national health service (SSN). If you are thinking about registering, we can explain what it involves during your visit.',
        intl_faq2_q: 'Can I get a prescription or medical certificate written in English?',
        intl_faq2_a: 'Yes. Where appropriate, certificates and referral letters can be accompanied by documentation in English, alongside the official Italian version. Electronic prescriptions follow the national format and are collected at any Italian pharmacy using your tax code.',
        intl_faq3_q: 'How much does a private consultation cost?',
        intl_faq3_a: 'Fees depend on the type and length of the consultation. Write to us for a clear indication before booking — there is no obligation.',
        intl_faq4_q: 'Can you coordinate with my doctor back home?',
        intl_faq4_a: 'Yes. With your consent, reports and documentation can be shared with your doctor or specialist in your home country, and ongoing care can be coordinated while you are in Italy.',
        intl_faq5_q: 'Do you offer home visits outside Arezzo — e.g. Cortona or the Val di Chiana?',
        intl_faq5_a: 'Home visits are available across the Province of Arezzo — including Cortona, Castiglion Fiorentino and the Val di Chiana — where clinically appropriate. Availability is confirmed together with the appointment.',
        intl_faq6_q: 'What happens in a medical emergency?',
        intl_faq6_a: 'For medical emergencies, always call 112. This practice provides scheduled, non-emergency care; outside opening hours, non-urgent assistance is available through 116 117.',
    }
};

export function setLanguage(lang) {
    const btnIt = document.getElementById('btn-it');
    const btnEn = document.getElementById('btn-en');
    if (btnIt) btnIt.classList.toggle('active', lang === 'it');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang]?.[key]) el.innerHTML = translations[lang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang]?.[key]) el.placeholder = translations[lang][key];
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        if (translations[lang]?.[key]) el.setAttribute('aria-label', translations[lang][key]);
    });
    // Tier-2 international card: crawlable default (visible); hidden for non-EN sessions
    document.querySelectorAll('.triage-card--international').forEach(el => {
        el.classList.toggle('is-hidden', lang !== 'en');
    });
    const triageGrid = document.querySelector('.triage-grid');
    if (triageGrid) {
        triageGrid.classList.toggle('intl-hidden', lang !== 'en');
        triageGrid.classList.toggle('has-international', lang === 'en');
    }
    try { localStorage.setItem('preferredLanguage', lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('site:i18n', { detail: { lang: lang } }));
}

try {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) setLanguage(savedLang);
} catch (e) {}

// --- SMOOTH SCROLL ---
export function showSection(sectionId) {
    const section = document.getElementById(sectionId + '-section');
    if(section) {
        section.classList.remove('hidden');
        section.classList.add('fade-in');
        setTimeout(() => {
            const yOffset = -20;
            const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
            const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: y, behavior: noMotion ? 'auto' : 'smooth' });
        }, 100);
    }
}

// --- GUIDA RAPIDA ---
function initGuidaRapida() {
    var card = document.getElementById('guida-rapida');
    if (!card) return;
    try {
        if (localStorage.getItem('guidaRapidaSeen') === '1') {
            card.classList.add('hidden');
        }
    } catch(e) {}
}

export function dismissGuidaRapida() {
    var card = document.getElementById('guida-rapida');
    if (card) card.classList.add('hidden');
    try { localStorage.setItem('guidaRapidaSeen', '1'); } catch(e) {}
}

initGuidaRapida();

// --- FOCUS TRAP (kept for reps modal) ---
function trapFocus(modal) {
    const focusable = modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    modal.addEventListener('keydown', function handler(e) {
        if (e.key !== 'Tab') {
            return;
        }
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });
}

// --- OPEN/CLOSED BADGE ---
(function() {
    const SCHEDULE = CONFIG.SCHEDULE;
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours() + now.getMinutes() / 60;
    const slots = SCHEDULE[day] || [];
    const isOpen = slots.some(s => hour >= s.from && hour < s.to);

    const anchor = document.querySelector('[data-badge-anchor]');
    if (!anchor) return;
    const badge = document.createElement('span');
    badge.className = isOpen ? 'badge-open' : 'badge-closed';
    const lang = getPreferredLang();
    const openLabel = lang === 'en' ? 'Open now' : 'Aperto ora';
    const closedLabel = lang === 'en' ? 'Closed' : 'Chiuso';
    badge.innerHTML = isOpen
        ? '<i class="fas fa-circle"></i> ' + openLabel
        : '<i class="fas fa-circle"></i> ' + closedLabel;
    anchor.parentNode.appendChild(badge);
})();

// --- HEADER INFO LINE (merged doctolib + closure notice) ---
(function() {
    const isPatient = isPatientSection(currentSection());
    const line = document.getElementById('header-info-line');
    const base = document.getElementById('header-info-base');
    const absence = document.getElementById('header-info-absence');
    const urgenze = document.getElementById('header-info-urgenze');
    const closeBtn = document.getElementById('header-info-close');
    if (!line || !base || !absence || !urgenze || !closeBtn) return;

    const lang = getPreferredLang();
    const t = translations[lang] || translations['it'];

    const active = CONFIG.getActiveAbsence();
    let dismissed = false;
    if (active) {
        try { dismissed = sessionStorage.getItem('ferie-dismissed-' + active.from) === '1'; } catch(e) {}
    }

    if (isPatient) {
        base.textContent = t.doctolib_banner_text;
        urgenze.textContent = t.urgenze_line;
    } else if (active && !dismissed) {
        urgenze.textContent = t.urgenze_line;
    } else {
        line.setAttribute('hidden', '');
        return;
    }

    if (active && !dismissed) {
        absence.textContent = active.note;
        absence.removeAttribute('hidden');
        closeBtn.removeAttribute('hidden');
    }
})();

export function dismissHeaderInfo() {
    const isPatient = isPatientSection(currentSection());
    const line = document.getElementById('header-info-line');
    const absence = document.getElementById('header-info-absence');
    const closeBtn = document.getElementById('header-info-close');
    if (!line) return;

    if (isPatient) {
        if (absence) absence.setAttribute('hidden', '');
        if (closeBtn) closeBtn.setAttribute('hidden', '');
    } else {
        line.setAttribute('hidden', '');
    }

    try {
        const active = CONFIG.getActiveAbsence();
        if (active) sessionStorage.setItem('ferie-dismissed-' + active.from, '1');
    } catch(e) {}
}

// --- DOCTOLIB WELCOME MODAL ---
export function closeDoctolibModal() {
    const modal = document.getElementById('doctolib-modal');
    if (modal) modal.style.display = 'none';
    try {
        localStorage.setItem('doctolib-modal_seen', '1');
    } catch(e) {}
}

(function() {
    const modal = document.getElementById('doctolib-modal');
    if (!modal) return;
    try {
        if (localStorage.getItem('doctolib-modal_seen')) return;
    } catch(e) {}
    modal.style.display = 'flex';
})();

export function startBooking() {
    var el = document.getElementById('booking-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- DECISION FLOWCHART ---
function getFlowLabel(lang, key) {
    return translations[lang]?.[key] || translations['it'][key] || '';
}

export function renderFlowStep(stepKey) {
    const lang = getPreferredLang();
    const container = document.getElementById('flow-step');
    if (!container) return;

    const steps = {
        root: {
            q: '',
            options: [
                { labelKey: 'flowchart_opt_book', next: 'end_prenota' },
                { labelKey: 'flowchart_opt_night', next: 'end_116' },
                { labelKey: 'flowchart_opt_faq', next: 'end_faq' },
            ]
        },
        end_prenota: {
            end: true,
            icon: 'fas fa-calendar-check',
            color: 'var(--primary)',
            titleKey: 'flowchart_end_book_title',
            descKey: 'flowchart_end_book_desc',
            actionKey: 'flowchart_end_book_action',
            actionType: 'scroll_booking'
        },
        end_116: {
            end: true,
            icon: 'fas fa-moon',
            color: '#6c757d',
            titleKey: 'flowchart_end_116_title',
            descKey: 'flowchart_end_116_desc',
            actionKey: 'flowchart_end_116_action',
            actionType: 'link',
            href: 'tel:116117'
        },
        end_faq: {
            end: true,
            icon: 'fas fa-question-circle',
            color: 'var(--primary-light)',
            titleKey: 'flowchart_end_faq_title',
            descKey: 'flowchart_end_faq_desc',
            actionKey: 'flowchart_end_faq_action',
            actionType: 'link',
            href: 'faq.html'
        }
    };

    const step = steps[stepKey];
    if (!step) return;

    if (step.end) {
        let actionHTML = '';
        const actionLabel = getFlowLabel(lang, step.actionKey);
        if (step.actionType === 'scroll_booking') {
            actionHTML = `<button class="flow-action-btn" onclick="startBooking()">${actionLabel}</button>`;
        } else {
            const target = step.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            actionHTML = `<a class="flow-action-btn" href="${step.href}"${target}>${actionLabel}</a>`;
        }
        container.innerHTML = `
            <div class="flow-end-card" style="border-color:${step.color}">
                <div class="flow-end-icon" style="color:${step.color}"><i class="${step.icon}"></i></div>
                <h3 class="flow-end-title" style="color:${step.color}">${getFlowLabel(lang, step.titleKey)}</h3>
                <p class="flow-end-desc">${getFlowLabel(lang, step.descKey)}</p>
                ${actionHTML}
                <button class="flow-restart-btn" onclick="renderFlowStep('root')">${getFlowLabel(lang, 'flowchart_restart')}</button>
            </div>`;
    } else {
        const btns = step.options.map(o =>
            `<button class="flow-option-btn" onclick="renderFlowStep('${o.next}')">${getFlowLabel(lang, o.labelKey)}</button>`
        ).join('');
        container.innerHTML = `
            <div class="flow-question-card">
                ${step.q ? `<p class="flow-question">${step.q}</p>` : ''}
                <div class="flow-options">${btns}</div>
                ${stepKey !== 'root' ? `<button class="flow-restart-btn" onclick="renderFlowStep('root')">${getFlowLabel(lang, 'flowchart_restart')}</button>` : ''}
            </div>`;
    }
}

// --- UNIFIED ACCORDION LOGIC ---
export function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const activeClass = 'active';
    const openClass = 'open';

    const isActive = header.classList.contains(activeClass) || header.classList.contains(openClass);

    // Close all accordions on the page for exclusivity
    document.querySelectorAll('.accordion-header').forEach(h => {
        h.classList.remove(activeClass, openClass);
        h.setAttribute('aria-expanded', 'false');
        if (h.nextElementSibling) {
            h.nextElementSibling.classList.remove(activeClass, openClass);
            // Some old styles might use display: none/block
            if (h.nextElementSibling.style.display === 'block') {
                h.nextElementSibling.style.display = 'none';
            }
        }
    });

    if (!isActive) {
        header.classList.add(activeClass, openClass);
        header.setAttribute('aria-expanded', 'true');
        if (content) {
            content.classList.add(activeClass, openClass);
        }
    }
}

// Map toggleFaq to the same unified logic
export const toggleFaq = toggleAccordion;

// --- BACK TO TOP ---
function initBackToTop() {
    // Avoid double injection
    if (document.querySelector('.back-to-top')) return;

    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Torna all\'inizio');
    btn.setAttribute('title', 'Torna all\'inizio della pagina');
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- LIVE FILTERS ---
function initGlobalFilters() {
    // 1. Filter for colleghi/index.html "Strumenti e Risorse"
    initLiveFilter('search-tools', '.tools-grid-auto a', 'span');

    // 2. Filter for ssn/faq.html
    initLiveFilter('search-faq', '.accordion-item', '.accordion-header span', '.faq-category');

    // 3. Filter for ssn/esenzioni.html
    initLiveFilter('search-esenzioni', '.exemption-table tr:not(:first-child)', '', '.section-block');

    // 4. Filter for ssn/impegnative.html
    initLiveFilter('search-impegnative', '.branch-table tr:not(:first-child)', '', '.section-block');
}

function initLiveFilter(inputId, itemsSelector, textSelector, parentToHideSelector) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', function() {
        const term = this.value.toLowerCase().trim();
        const items = document.querySelectorAll(itemsSelector);

        items.forEach(item => {
            const textElement = textSelector ? item.querySelector(textSelector) : item;
            const text = textElement ? textElement.textContent.toLowerCase() : '';
            item.style.display = text.includes(term) ? '' : 'none';
        });

        // Optional: show/hide sections/categories if all their items are hidden
        if (parentToHideSelector) {
            document.querySelectorAll(parentToHideSelector).forEach(parent => {
                const hasVisible = Array.from(parent.querySelectorAll(itemsSelector)).some(i => i.style.display !== 'none');
                parent.style.display = hasVisible ? '' : 'none';
            });
        }
    });
}

// --- PRIVATE VISIT TYPE SELECTOR (Google Calendar) ---
export function selectVisitType(type, url) {
    // Highlight selected button
    document.querySelectorAll('.btn-cal-service').forEach(function(btn) {
        btn.classList.remove('selected');
    });
    var activeBtn = document.querySelector('.btn-cal-service.' + type);
    if (activeBtn) activeBtn.classList.add('selected');

    // Open calendar directly
    window.open(url, '_blank', 'noopener,noreferrer');
}

// --- GLOBAL INIT ON LOAD ---
window.addEventListener('load', function() {
    initBackToTop();
    initGlobalFilters();
});


// =================================================================
// LEGACY GLOBAL EXPOSURE — inline onclick handlers & injected HTML
// reference these globals; keep in sync with page templates.
// =================================================================
// Bridge for /international/ inline form script (feedback strings follow the
// language toggle without coupling app.js internals).
window.__INTL_I18N__ = {
    it: {
        intl_f_invalid: translations.it.intl_f_invalid,
        intl_f_sending: translations.it.intl_f_sending,
        intl_f_success: translations.it.intl_f_success,
        intl_f_done: translations.it.intl_f_done,
    },
    en: {
        intl_f_invalid: translations.en.intl_f_invalid,
        intl_f_sending: translations.en.intl_f_sending,
        intl_f_success: translations.en.intl_f_success,
        intl_f_done: translations.en.intl_f_done,
    },
};

const GLOBAL_FUNCTIONS = {
    setLanguage: setLanguage,
    toggleDarkMode: toggleDarkMode,
    dismissHeaderInfo: dismissHeaderInfo,
    closeDoctolibModal: closeDoctolibModal,
    startBooking: startBooking,
    renderFlowStep: renderFlowStep,
    toggleAccordion: toggleAccordion,
    // NOTE: toggleFaq intentionally NOT exposed. ssn/faq.html ships its own
    // inline toggleFaq (max-height + .faq-item.open contract); exposing the
    // unified toggleAccordion here SHADOWED it (module runs after parse) and
    // broke the FAQ accordion (2026-08-13). Keep this list in sync.
    showSection: showSection,
    dismissGuidaRapida: dismissGuidaRapida,
    selectVisitType: selectVisitType
};
for (const name in GLOBAL_FUNCTIONS) {
    window[name] = GLOBAL_FUNCTIONS[name];
}

/**
 * Shared Service Worker registration with update toast flow.
 * Call once on page load from any page.
 */
export function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  let pendingWorker = null;

  window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          registration.update(); // force check for new sw.js
          if (registration.waiting) showUpdateToast(registration.waiting);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(newWorker);
            }
          });
        });
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });

  function showUpdateToast(worker) {
    pendingWorker = worker;
    const toast = document.getElementById('sw-update-toast');
    if (toast) toast.classList.add('visible');
  }

  const updateBtn = document.getElementById('sw-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      if (pendingWorker) {
        pendingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }

  // Auto-initialize on module load — no inline script tag needed on pages
  initServiceWorker();



