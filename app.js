import { CONFIG } from './config.js';

// =================================================================
// STUDIO MEDICO DOTT. SAVIANU - JAVASCRIPT
// =================================================================

// =================================================================
// WEB COMPONENTS — SiteNav & SiteFooter (light-DOM, SEO-safe)
// The static content inside the tags is the no-JS/crawler fallback;
// on upgrade the component replaces it with the full rendered chrome.
// =================================================================

function getPathPrefix() {
  const depth = location.pathname.split('/').filter(Boolean).length;
  return depth > 1 ? '../'.repeat(depth - 1) : '';
}

function applyI18n(lang) {
  if (typeof setLanguage === 'function') setLanguage(lang);
}

class SiteNav extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered === '1') return;
    this.dataset.rendered = '1';
    const section = this.dataset.section || 'root'; // root|ssn|privati|colleghi|static
    const prefix = getPathPrefix();
    const isPatient = section !== 'colleghi' && section !== 'static';
    const isRoot = section === 'root';
    const brandTag = isRoot ? 'h1' : 'div';

    // Skip link
    const skipLink =
      '<a href="#main-content" class="skip-link" data-i18n="skip_link">Vai al contenuto principale</a>';

    // Language/control switch
    const controls = isPatient
      ? '<button onclick="setLanguage(\'it\')" class="lang-btn active" id="btn-it">ITA</button>' +
        '<span class="lang-separator" aria-hidden="true">|</span>' +
        '<button onclick="setLanguage(\'en\')" class="lang-btn" id="btn-en">ENG</button>' +
        '<span class="lang-separator" aria-hidden="true">|</span>' +
        '<button onclick="toggleDarkMode()" class="lang-btn" id="btn-dark" title="Toggle Dark Mode" aria-label="Attiva/Disattiva Tema Scuro"><i class="fas fa-moon" aria-hidden="true"></i></button>' +
        '<div id="google_translate_element"></div>'
      : '<button onclick="toggleDarkMode()" class="lang-btn" id="btn-dark" title="Toggle Dark Mode" aria-label="Attiva/Disattiva Tema Scuro"><i class="fas fa-moon" aria-hidden="true"></i></button>';

    // Nav links row + mobile menu
    const here = location.pathname.replace(/\/$/, '');
    const navRow =
      '<nav class="site-nav" aria-label="Navigazione principale">' +
        '<button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav-menu" aria-label="' + (isPatient ? 'Apri il menu di navigazione' : 'Apri il menu') + '"><i class="fas fa-bars" aria-hidden="true"></i></button>' +
        '<ul class="nav-menu" id="site-nav-menu">' +
          '<li><a href="' + prefix + 'index.html"' + (isPatient ? ' data-i18n="nav_home"' : '') + (here.endsWith('/index.html') || here === '' ? ' aria-current="page"' : '') + '>Home</a></li>' +
          '<li><a href="' + prefix + 'ssn/index.html"' + (isPatient ? ' data-i18n="nav_ssn"' : '') + (here.includes('/ssn') ? ' aria-current="page"' : '') + '>Pazienti</a></li>' +
          '<li><a href="' + prefix + 'privati/index.html"' + (isPatient ? ' data-i18n="nav_privati"' : '') + (here.includes('/privati') ? ' aria-current="page"' : '') + '>Pazienti Privati</a></li>' +
          '<li><a href="' + prefix + 'colleghi/index.html"' + (isPatient ? ' data-i18n="nav_colleghi"' : '') + (here.includes('/colleghi') ? ' aria-current="page"' : '') + '>Colleghi</a></li>' +
          '<li><a href="' + prefix + 'ssn/faq.html"' + (isPatient ? ' data-i18n="nav_faq"' : '') + '>FAQ</a></li>' +
        '</ul>' +
      '</nav>';

    const phone =
      '<a href="tel:+390575910904" class="btn-telefono-header"><i class="fas fa-phone-alt" aria-hidden="true"></i> Segreteria: 0575 910 904</a>';

    const brand =
      '<div class="brand-wrap">' +
        '<img class="brand-logo" src="' + prefix + 'assets/bronzelogo.png" alt="Studio Medico Ippocrate" width="96" height="96" fetchpriority="high" decoding="async">' +
        '<div class="brand-text">' +
          '<' + brandTag + ' class="brand-name">Dott. Savianu Emanuel</' + brandTag + '>' +
          '<p class="brand-sub">STUDIO MEDICO IPPOCRATE</p>' +
          '<p class="brand-tagline"' + (isPatient ? ' data-i18n="header_subtitle"' : '') + '>Medico di Medicina Generale - Arezzo</p>' +
          phone +
        '</div>' +
      '</div>';

    this.insertAdjacentHTML('beforebegin', skipLink + banners);
    this.innerHTML =
      '<nav class="lang-switch" aria-label="' + (isPatient ? 'Lingua e controlli pagina' : 'Controlli pagina') + '">' + controls + '</nav>' +
      '<header role="banner"><div class="header-content">' + brand + '</div></header>' +
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
      toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
        menu.classList.toggle('open', !open);
        toggle.setAttribute('aria-label', open ? 'Apri il menu di navigazione' : 'Chiudi il menu di navigazione');
      });
      document.addEventListener('click', function(e) {
        if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== toggle) {
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }

    Promise.resolve().then(function() {
      var lang = 'it';
      try { lang = localStorage.getItem('preferredLanguage') || 'it'; } catch (e) {}
      applyI18n(lang);
      // Re-attach Google Translate to the freshly injected div if the widget already loaded
      if (isPatient && window.google && window.google.translate) {
        try { window.googleTranslateElementInit(); } catch (e) {}
      }
    });
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered === '1') return;
    this.dataset.rendered = '1';
    const section = this.dataset.section || 'root';
    const prefix = getPathPrefix();
    const isPatient = section !== 'colleghi' && section !== 'static';

    this.innerHTML =
      '<footer role="contentinfo">' +
        '<div class="footer-content">' +
          '<p>&copy; <span id="current-year">' + new Date().getFullYear() + '</span> - Dr. Savianu Emanuel</p>' +
          '<nav class="footer-nav" aria-label="Footer">' +
            '<a href="' + prefix + 'index.html"' + (isPatient ? ' data-i18n="footer_home"' : '') + '>Home</a>' +
            ' <span aria-hidden="true">·</span> ' +
            '<a href="' + prefix + 'ssn/faq.html"' + (isPatient ? ' data-i18n="footer_faq"' : '') + '>FAQ</a>' +
            ' <span aria-hidden="true">·</span> ' +
            '<a href="' + prefix + 'privacy.html"' + (isPatient ? ' data-i18n="link_privacy"' : '') + '>Privacy Policy</a>' +
          '</nav>' +
        '</div>' +
      '</footer>';

    if (isPatient) {
      this.insertAdjacentHTML('afterend',
        '<nav class="quick-actions-bar" aria-label="Azioni rapide">' +
          '<a href="tel:+390575910904" class="qa-item" data-i18n-aria-label="qa_call_label" aria-label="Chiama la segreteria"><i class="fas fa-phone-alt" aria-hidden="true"></i><span data-i18n="qa_call">Chiama</span></a>' +
          '<a href="' + prefix + 'ssn/faq.html" class="qa-item" data-i18n-aria-label="qa_faq_label" aria-label="Domande frequenti"><i class="fas fa-question-circle" aria-hidden="true"></i><span>FAQ</span></a>' +
          '<a href="https://tinyurl.com/Savianu" target="_blank" rel="noopener noreferrer" class="qa-item" data-i18n-aria-label="qa_doctolib_label" aria-label="Doctolib"><i class="fas fa-calendar-check" aria-hidden="true"></i><span data-i18n="qa_doctolib">Doctolib</span></a>' +
        '</nav>'
      );
    }

    Promise.resolve().then(function() {
      var lang = 'it';
      try { lang = localStorage.getItem('preferredLanguage') || 'it'; } catch (e) {}
      applyI18n(lang);
    });
  }
}

customElements.define('site-nav', SiteNav);
customElements.define('site-footer', SiteFooter);

// --- AUTOMATIC YEAR ---
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- DARK MODE TOGGLE ---
export function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    const darkBtn = document.getElementById('btn-dark');
    
    if (darkBtn) {
        const icon = darkBtn.querySelector('i');
        if (icon) {
            if (isDark) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }
    
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
        themeMeta.setAttribute('content', isDark ? '#0a1628' : '#1a2f4c');
    }
    
    try {
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    } catch (e) {
        console.log('LocalStorage not available');
    }
}

function initDarkMode() {
    try {
        const saved = localStorage.getItem('darkMode');
        const prefersD = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = saved === 'enabled' || (saved === null && prefersD);

        if (shouldBeDark) {
            document.body.classList.add('dark-mode');
            const darkBtn = document.getElementById('btn-dark');
            if (darkBtn) {
                const icon = darkBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }
            const themeMeta = document.querySelector('meta[name="theme-color"]');
            if (themeMeta) themeMeta.setAttribute('content', '#0a1628');
        }

        // React to OS-level changes at runtime
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('darkMode') === null) {
                if (e.matches) {
                    document.body.classList.add('dark-mode');
                    const icon = document.querySelector('#btn-dark i');
                    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
                    const m = document.querySelector('meta[name="theme-color"]');
                    if (m) m.setAttribute('content', '#0a1628');
                } else {
                    document.body.classList.remove('dark-mode');
                    const icon = document.querySelector('#btn-dark i');
                    if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
                    const m = document.querySelector('meta[name="theme-color"]');
                    if (m) m.setAttribute('content', '#1a2f4c');
                }
            }
        });
    } catch (e) {}
}

initDarkMode();


// --- LARGE TEXT ACCESSIBILITY MODE ---
function updateLargeTextBanner(isActive) {
    var banner = document.getElementById('large-text-banner');
    var label  = document.getElementById('large-text-banner-label');
    var btn    = document.getElementById('large-text-toggle-btn');
    if (!banner || !label || !btn) return;
    if (isActive) {
        banner.classList.add('active');
        banner.classList.remove('hidden');
        label.textContent = '✓ Testo grande attivo';
        btn.textContent   = 'A− Normale';
    } else {
        banner.classList.remove('active');
        label.textContent = '🔤 Difficoltà a leggere?';
        btn.textContent   = 'A+ Testo Grande';
    }
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
}

export function toggleLargeText() {
    var isActive = document.body.classList.toggle('large-text');
    try { localStorage.setItem('largeText', isActive ? 'enabled' : 'disabled'); } catch(e) {}
    updateLargeTextBanner(isActive);
}

function initLargeText() {
    try {
        if (localStorage.getItem('largeText') === 'enabled') {
            document.body.classList.add('large-text');
            updateLargeTextBanner(true);
        }
    } catch(e) {}
    // Hide banner on first scroll only if large text is NOT active
    window.addEventListener('scroll', function() {
        if (!document.body.classList.contains('large-text')) {
            var banner = document.getElementById('large-text-banner');
            if (banner) banner.classList.add('hidden');
        }
    }, { once: true });
}

initLargeText();





// --- LANGUAGE MANAGEMENT ---
export const translations = {
    it: {
        // Header
        header_subtitle: "Medico di Medicina Generale - Arezzo",

        // Landing triage
        landing_hero_title: "Benvenuti nello Studio Medico Ippocrate",
        landing_hero_sub: "Scegli la tua area: ogni percorso ti porta direttamente a ciò che ti serve.",
        triage_ssn_title: "Pazienti",
        triage_ssn_desc: "Sei assistito dal Dott. Savianu: prenota visite su Doctolib, richiedi ricette, consulta guide ed esenzioni.",
        triage_privati_title: "Pazienti Privati",
        triage_privati_desc: "Consulenze private, certificati INPS, invalidità civile e Legge 104 — prenota su Google Calendar.",
        triage_colleghi_title: "Colleghi",
        triage_colleghi_desc: "Area riservata ai professionisti: strumenti, protocolli, normative e applicazioni di servizio.",
        triage_cta: "Entra",
        triage_section_label: "Scegli la tua area",

        // Alert box (index.html)
        alert_notice: "<i class='fas fa-info-circle' aria-hidden='true' style='margin-right: 8px;'></i><strong>Benvenuti</strong> nello Studio Medico Ippocrate — Dott. Emanuel Savianu, <strong>Piazza Saione 3, Arezzo</strong>.",

        // Services section
        services_title: "Servizi Online",
        btn_faq_main: "Hai dubbi? Leggi prima le FAQ",
        btn_book: "Prenota una visita",
        btn_book_sub: "Scegli giorno e orario",


        // Booking section
        booking_title: "Prenotazione su Doctolib",
        booking_guide_title: "Scegli cosa fare:",
        booking_guide_steps: "<li>Clicca il pulsante del tipo di visita qui sotto.</li><li>Scegli il giorno e l'orario disponibile sul calendario.</li><li>Inserisci Nome, Cognome e un indirizzo Email.</li><li>Clicca <strong>Conferma</strong> (riceverai un'email di riepilogo).</li>",
        cal_prima_title: "Prima Visita (Nuovi Pazienti)",
        cal_prima_desc: "Solo per la prima visita. Portare documentazione, esami, referti ed esenzioni. (30 min)",
        cal_ord_title: "Visita Ordinaria",
        cal_ord_desc: "Controlli e problemi non urgenti. (20 min)",
        cal_breve_title: "Sintomi Recenti",
        cal_breve_desc: "Visite non rimandabili, malattie acute, certificati INPS malattia. (10 min)",
        privacy_notice_text: "Leggi l'informativa privacy.",
        privacy_notice_link: "Informativa Trattamento Dati",

        // Visit info section
        visit_info_title: "Cosa portare alla visita &amp; Link Utili",
        visit_info_desc: "Per la visita in ambulatorio, ricordarsi di portare:",
        visit_info_items: "<li>Lista aggiornata e dettagliata dei farmaci assunti regolarmente</li><li>Eventuali esami, referti specialistici o lettere di dimissioni precedenti</li>",
        btn_cup: "Accedi al CUP Toscana",
        btn_fse: "Fascicolo Sanitario",

        // Emergency & out-of-hours
        emergency_112: "Per urgenze ed emergenze mediche, contattare sempre il Numero Unico 112.",
        title_116117: "116 117 — Assistenza Sanitaria Non Urgente",
        guard_title: "Continuità Assistenziale (ex-Guardia Medica)",
        guard_desc: "Per assistenza medica non urgente durante la notte, i festivi e prefestivi.",
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
        label_secretary: "Segreteria e Appuntamenti",
        label_doctor: "Tel. Personale (Solo Urgenze)",
        label_address: "Studio Medico Ippocrate",
        label_email: "Email",
        label_via_doctolib: "tramite Doctolib",
        label_address_value: "Piazza Saione 3, Arezzo",

        // Hours
        hours_lun_ven: "Lun - Ven",
        hours_title: "Orari di Studio",
        appt_only: "Solo su appuntamento",
        hours_day1: "Lun - Ven",
        hours_day2: "",
        day_sat_sun: "Sab - Dom",
        closed: "Chiuso",
        hours_secretary_title: "Orari Segreteria",
        hours_secretary_desc: "Per appuntamenti telefonici e info.",

        // Footer
        link_privacy: "Privacy Policy",

        // Welcome modal
        welcome_transfer_title: "Nuova Sede Studio",
        welcome_transfer_desc: "Dal 27 Aprile 2026, il Dott. Savianu si è trasferito in <strong>Piazza Saione 3</strong>.",
        welcome_intro: "Benvenuti. Ho organizzato questo sito per semplificare la vostra vita. Utilizzando gli strumenti digitali, mi permettete di dedicare la massima attenzione alle visite mediche vere e proprie.",
        welcome_step0_title: "0. Prima di tutto: Leggi le FAQ",
        welcome_step0_desc: "La maggior parte delle risposte a dubbi su certificati, ricette ed esenzioni si trova nelle <strong><a href='faq.html' style='text-decoration:underline; font-weight:bold;'>Domande Frequenti</a></strong>. Consultale prima di chiamare!",
        welcome_step1_title: "1. Prenotazione Appuntamenti",
        welcome_step1_desc: "L'agenda online vi permette di prenotare la visita senza attese al telefono.",
        welcome_step2_title: "2. Urgenze e Contatto Diretto",
        welcome_step2_p1: "Segreteria: <strong>0575 910 904</strong>",
        welcome_step2_p2: "<strong>Urgenze vere: chiamare 112 / 116 117.</strong>",
        welcome_step2_p3: "",
        welcome_step3_title: "",
        welcome_step3_p1: "",
        welcome_step3_p2: "",
        welcome_step3_p3: "",
        welcome_btn: "<span>Ho letto e accetto</span><i class='fas fa-arrow-right'></i>",

        // FAQ page
        faq_hero_title: "<i class='fas fa-question-circle' style='margin-right: 10px;'></i>FAQ per i Pazienti",
        faq_hero_desc: "Risposte alle domande più comuni sullo studio medico",
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
        faq_a1: "Le prenotazioni avvengono tramite <strong>Doctolib</strong>:<ul><li>Clicca \"Prenota su Doctolib\" qui sotto o vai su <a href='index.html'>savianu.it</a></li><li>Scegli il tipo di visita nell'app Doctolib</li><li>Conferma l'appuntamento</li></ul><div class='highlight-box'><a href='https://tinyurl.com/Savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Clicca qui per prenotare →</a></div><div class='highlight-box'>In alternativa, chiama la segreteria al <strong>0575 910 904</strong> durante gli orari di ambulatorio.</div>",
        faq_q2: "Posso venire senza appuntamento?",
        faq_a2: "Il Dottore riceve <strong>solo su appuntamento</strong> per garantire tempi di attesa ragionevoli e dedicare la giusta attenzione a ogni paziente.",
        faq_q3: "Quali sono gli orari dell'ambulatorio?",
        faq_a3: "<table style='width:100%; border-collapse: collapse;'><tr><td style='padding: 6px 0; font-weight: 600;'>Lunedì - Venerdì</td><td style='text-align:right; color: var(--text-dark); font-weight: 700;'>09:30 - 12:30 · 16:00 - 19:00</td></tr><tr><td style='padding: 6px 0; font-weight: 600; color: var(--danger);'>Sabato - Domenica</td><td style='text-align:right; color: var(--danger);'>Chiuso</td></tr></table><div class='highlight-box'><strong>Indirizzo:</strong> Studio Medico Ippocrate, Piazza Saione 3, Arezzo</div>",
        faq_q4: "Come annullo o sposto un appuntamento?",
        faq_a4: "Per modificare o cancellare un appuntamento, aprite la conferma nell'app Doctolib o accedete al vostro account su Doctolib.it.<br><br>In alternativa, chiamate la segreteria al <strong>0575 910 904</strong> con ragionevole anticipo.",
        faq_q5: "Come richiedo la ricetta per i farmaci che prendo regolarmente?",
        faq_a5: "Potete richiederla tramite <strong>Doctolib</strong> (inviando un messaggio al medico) o nei seguenti modi:<ul><li>Contattando la segreteria al <strong>0575 910 904</strong> durante gli orari di ambulatorio</li><li>Durante una visita in studio</li></ul><div class='highlight-box'><a href='https://tinyurl.com/Savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Invia richiesta su Doctolib →</a></div><div class='highlight-box'><strong>Importante:</strong> Le ricette dematerializzate (NRE) vengono inviate direttamente al sistema, potete ritirarle in qualsiasi farmacia comunicando il codice fiscale.</div>",
        faq_sec_certificati: "<i class='fas fa-file-medical'></i> Certificati",
        faq_sec_referti: "<i class='fas fa-flask'></i> Referti ed Esami",
        faq_sec_nuovi: "<i class='fas fa-user-plus'></i> Nuovi Pazienti",
        faq_sec_urgenze: "<i class='fas fa-ambulance'></i> Urgenze e Fuori Orario",
        faq_sec_varie: "<i class='fas fa-stethoscope'></i> Altri Servizi",
        faq_q6: "Come richiedo un certificato medico?",
        faq_a6: "I certificati si richiedono durante una visita in ambulatorio o telefonando la segreteria al <strong>0575 910 904</strong>.<br><br>Presentarsi con la documentazione necessaria: il certificato viene emesso direttamente in ambulatorio.<div class='highlight-box'><strong>Certificati INPS malattia:</strong> Richiedono una visita. <a href='https://tinyurl.com/Savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Prenotare su Doctolib →</a></div>",
        faq_q7: "Come accedo ai miei referti?",
        faq_a7: "I referti degli esami sono disponibili sul <strong>Fascicolo Sanitario Elettronico (FSE)</strong> regionale, accessibile su salute.toscana.it con SPID o CIE.<br><br>Il medico può visionare i referti durante la visita e commentarli. Se avete dubbi su un referto, <a href='https://tinyurl.com/Savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>prenotate una visita su Doctolib →</a>",
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

        // Flowchart
        flowchart_title: "Di cosa hai bisogno?",
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
        qa_book: 'Prenota',
        qa_home: 'Home',
        qa_email: 'Doctolib',
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
        email_privacy_notice: 'Per comunicazioni mediche usa Doctolib o la visita in studio.',
        secretary_hours_label: 'Orari Segreteria - 0575 910 904',
        prescription_request_header: 'Per richiedere la ricetta per i farmaci assunti abitualmente:',

        // Accessibility — aria-label i18n
        skip_link: 'Vai al contenuto principale',
        floating_faq_label: 'Domande Frequenti',
        qa_call_label: 'Chiama la segreteria',
        qa_faq_label: 'Domande frequenti',
        qa_email_label: 'Apri Doctolib',
        qa_doctolib_label: 'Apri Doctolib',

        // Doctolib announcement
        doctolib_banner_text: 'Prenotazioni e ricette tramite Doctolib. Per urgenze: Guardia Medica 116 117 — Emergenze: 112.',
        doctolib_modal_title: 'Avviso Importante',
        doctolib_modal_text: 'Gentili Pazienti, un caro saluto.<br><br>Vi informo sulle prossime variazioni dello studio:<br><br><strong>6 – 7 Agosto (prefestivo e festivo)</strong><br>Studio chiuso. Attiva la Guardia Medica 24h/24 al 116 117.<br><br><strong>10 – 14 Agosto</strong><br>Sarò in ferie. Vi assisteranno i colleghi di studio contattando la segreteria allo 0575 910904.<br><br><strong>Dal 17 Agosto</strong><br>Tornerò regolarmente in studio.<br><br>🚨 <strong>Urgenze, notte, weekend e festivi</strong><br>Nei fine settimana, nei festivi e nelle ore notturne i medici di medicina generale non sono in servizio. Per qualsiasi urgenza in questi giorni — o se la segreteria non risponde — è sempre attiva la Guardia Medica 24h/24 al 116 117. Per le emergenze, 112.<br><br>📌 <strong>Appuntamenti e richieste</strong><br>Prenotate o scrivetemi su Doctolib, oppure chiamate la segreteria al 0575 910904.<br><br>Buone e serene vacanze a tutti voi.<br><br>Dott. Emanuel Savianu<br><em>Medico di Medicina Generale</em>',
        doctolib_modal_btn: 'Ho letto',

        // CTA buttons
        cta_book_doctolib: 'Prenota appuntamento',
        cta_book_doctolib_sub: 'Scegli giorno e orario su Doctolib',
        cta_message_doctolib: 'Invia messaggio / Richiedi ricetta',
        cta_message_doctolib_sub: 'Comunica col medico tramite Doctolib',

        // Nav (site-nav component)
        nav_home: 'Home',
        nav_ssn: 'Pazienti',
        nav_privati: 'Pazienti Privati',
        nav_colleghi: 'Colleghi',
        nav_faq: 'FAQ',
        nav_menu_open: 'Apri il menu di navigazione',
        nav_menu_close: 'Chiudi il menu di navigazione',
        nav_menu_label: 'Menu principale',

        // Footer (site-footer component)
        footer_home: 'Home',
        footer_faq: 'Domande Frequenti',

        // Footer
        footer_malattia_link: 'Certificato di malattia: chi deve farlo?'
    },
    en: {
        // Header
        header_subtitle: "General Practitioner - Arezzo",

        // Landing triage
        landing_hero_title: "Welcome to Studio Medico Ippocrate",
        landing_hero_sub: "Choose your area: each path takes you straight to what you need.",
        triage_ssn_title: "Patients",
        triage_ssn_desc: "Are you a patient of Dr. Savianu? Book visits on Doctolib, request prescriptions, read guides and exemptions.",
        triage_privati_title: "Private Patients",
        triage_privati_desc: "Private consultations, INPS certificates, civil disability and Law 104 — book on Google Calendar.",
        triage_colleghi_title: "Colleagues",
        triage_colleghi_desc: "Reserved area for professionals: tools, protocols, regulations and service applications.",
        triage_cta: "Enter",
        triage_section_label: "Choose your area",

        // Alert box (index.html)
        alert_notice: "<i class='fas fa-info-circle' aria-hidden='true' style='margin-right: 8px;'></i><strong>Welcome</strong> to Studio Medico Ippocrate — Dr. Emanuel Savianu, <strong>Piazza Saione 3, Arezzo</strong>.",

        // Services section
        services_title: "Online Services",
        btn_faq_main: "Have questions? Read the FAQ first",
        btn_book: "Book a visit",
        btn_book_sub: "Choose date and time",


        // Booking section
        booking_title: "Book on Doctolib",
        booking_guide_title: "Choose what to do:",
        booking_guide_steps: "<li>Click the button for the visit type below.</li><li>Choose the day and time available on the calendar.</li><li>Enter First Name, Last Name and an Email address.</li><li>Click <strong>Confirm</strong> (you will receive a summary email).</li>",
        cal_prima_title: "First Visit (New Patients)",
        cal_prima_desc: "For new patients only. Bring documents, tests, reports and exemptions. (30 min)",
        cal_ord_title: "Standard Visit",
        cal_ord_desc: "Check-ups and non-urgent issues. (20 min)",
        cal_breve_title: "Recent Symptoms",
        cal_breve_desc: "Urgent but non-emergency visits, acute illness, INPS sick leave certificates. (10 min)",
        cal_privata_title: "Private Consultations and Visits (I am not an existing patient)",
        cal_privata_desc: "Private consultations and certificates.",
        privacy_notice_text: "Please read the privacy policy.",
        privacy_notice_link: "Data Processing Policy",

        // Visit info section
        visit_info_title: "What to Bring &amp; Useful Links",
        visit_info_desc: "For your in-office visit, please remember to bring:",
        visit_info_items: "<li>An up-to-date list of all medications you take regularly</li><li>Any previous tests, specialist reports, or hospital discharge letters</li>",
        btn_cup: "Book via CUP Toscana",
        btn_fse: "Health Record (FSE)",

        // Emergency & out-of-hours
        emergency_112: "For medical emergencies, always call the emergency number 112.",
        title_116117: "116 117 — Non-Urgent Health Care",
        guard_title: "Out-of-Hours Service (Continuità Assistenziale)",
        guard_desc: "For non-urgent medical care at night, on holidays and days before holidays.",
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
        label_secretary: "Reception &amp; Appointments",
        label_doctor: "Personal Phone (Emergencies only)",
        label_address: "Studio Medico Ippocrate",
        label_email: "Email",
        label_via_doctolib: "via Doctolib",
        label_address_value: "Piazza Saione 3, Arezzo",

        // Hours
        hours_lun_ven: "Mon - Fri",
        hours_title: "Office Hours",
        appt_only: "By appointment only",
        hours_day1: "Mon - Fri",
        hours_day2: "",
        day_sat_sun: "Sat - Sun",
        closed: "Closed",
        hours_secretary_title: "Reception Hours",
        hours_secretary_desc: "For phone appointments and information.",

        // Footer
        link_privacy: "Privacy Policy",

        // Welcome modal
        welcome_transfer_title: "New Office Location",
        welcome_transfer_desc: "From 27 April 2026, Dr. Savianu has moved to <strong>Piazza Saione 3</strong>.",
        welcome_intro: "Welcome. This website is designed to make your life easier. By using the digital tools available, you allow me to focus my full attention on in-person medical consultations.",
        welcome_step0_title: "0. First of all: Read the FAQ",
        welcome_step0_desc: "Most answers about certificates, prescriptions and exemptions can be found in the <strong><a href='faq.html' style='text-decoration:underline; font-weight:bold;'>Frequently Asked Questions</a></strong>. Check there before calling!",
        welcome_step1_title: "1. Appointment Booking",
        welcome_step1_desc: "The online calendar lets you book a visit without waiting on the phone.",
        welcome_step2_title: "2. Urgent Matters &amp; Direct Contact",
        welcome_step2_p1: "Reception: <strong>0575 910 904</strong>",
        welcome_step2_p2: "<strong>True emergencies: call 112 / 116 117.</strong>",
        welcome_step2_p3: "",
        welcome_step3_title: "",
        welcome_step3_p1: "",
        welcome_step3_p2: "",
        welcome_step3_p3: "",
        welcome_btn: "<span>I have read and accept</span><i class='fas fa-arrow-right'></i>",

        // FAQ page
        faq_hero_title: "<i class='fas fa-question-circle' style='margin-right: 10px;'></i>FAQ for Patients",
        faq_hero_desc: "Answers to the most common questions about the practice",
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
        faq_a1: "Book your appointment through <strong>Doctolib</strong>:<ul><li>Click \"Book on Doctolib\" below or go to <a href='index.html'>savianu.it</a></li><li>Choose the visit type in the Doctolib app</li><li>Confirm your appointment</li></ul><div class='highlight-box'><a href='https://tinyurl.com/Savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Click here to book →</a></div><div class='highlight-box'>Alternatively, call reception on <strong>0575 910 904</strong> during clinic hours.</div>",
        faq_q2: "Can I come without an appointment?",
        faq_a2: "The doctor sees patients <strong>by appointment only</strong> to ensure reasonable waiting times and give each patient the attention they deserve.<br><br>If you are unwell and cannot book via Doctolib, come in anyway: the receptionist will let the doctor know, and he will contact you as soon as he is free.",
        faq_q3: "What are the clinic opening hours?",
        faq_a3: "<table style='width:100%; border-collapse: collapse;'><tr><td style='padding: 6px 0; font-weight: 600;'>Monday - Friday</td><td style='text-align:right; color: var(--text-dark); font-weight: 700;'>09:30 - 12:30 · 16:00 - 19:00</td></tr><tr><td style='padding: 6px 0; font-weight: 600; color: var(--danger);'>Saturday - Sunday</td><td style='text-align:right; color: var(--danger);'>Closed</td></tr></table><div class='highlight-box'><strong>Address:</strong> Studio Medico Ippocrate, Piazza Saione 3, Arezzo</div>",
        faq_q4: "How do I cancel or reschedule an appointment?",
        faq_a4: "To <strong>modify or cancel</strong> an appointment, open your confirmation in the Doctolib app or log in to your account at Doctolib.it.<br><br>Alternatively, call reception on <strong>0575 910 904</strong> with reasonable notice.",
        faq_q5: "How do I request a prescription for my regular medications?",
        faq_a5: "You can request a prescription via <strong>Doctolib</strong> (send a message to the doctor) or:<ul><li>Call reception on <strong>0575 910 904</strong> during clinic hours</li><li>During an in-office visit</li></ul><div class='highlight-box'><a href='https://tinyurl.com/Savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Send a request on Doctolib →</a></div><div class='highlight-box'><strong>Important:</strong> Electronic prescriptions (NRE) are sent directly to the system — you can collect them at any pharmacy by providing your tax ID (Codice Fiscale).</div>",
        faq_sec_certificati: "<i class='fas fa-file-medical'></i> Certificates",
        faq_sec_referti: "<i class='fas fa-flask'></i> Test Results &amp; Referrals",
        faq_sec_nuovi: "<i class='fas fa-user-plus'></i> New Patients",
        faq_sec_urgenze: "<i class='fas fa-ambulance'></i> Emergencies &amp; Out-of-Hours",
        faq_sec_varie: "<i class='fas fa-stethoscope'></i> Other Services",
        faq_q6: "How do I request a medical certificate?",
        faq_a6: "Certificates can be requested during a clinic visit or by calling reception on <strong>0575 910 904</strong>.<br><br>Bring any relevant documents; the certificate is issued on the spot at the clinic.<div class='highlight-box'><strong>INPS sick leave certificates</strong> require an in-person visit. <a href='https://tinyurl.com/Savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>Book on Doctolib →</a></div>",
        faq_q7: "How do I access my test results?",
        faq_a7: "Test results are available on the <strong>Electronic Health Record (FSE)</strong>, accessible at salute.toscana.it using SPID or CIE.<br><br>The doctor can review and discuss results during a visit. If you have questions about a result, <a href='https://tinyurl.com/Savianu' target='_blank' rel='noopener noreferrer' style='color:var(--accent);font-weight:700;'>book an appointment on Doctolib →</a>",
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

        // Flowchart
        flowchart_title: "What do you need?",
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
        qa_book: 'Book',
        qa_home: 'Home',
        qa_email: 'Doctolib',
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
        email_privacy_notice: 'For medical communications use Doctolib or an in-office visit.',
        secretary_hours_label: 'Reception Hours - 0575 910 904',
        prescription_request_header: 'To request a prescription for your regular medications:',

        // Accessibility — aria-label i18n
        skip_link: 'Skip to main content',
        floating_faq_label: 'Frequently Asked Questions',
        qa_call_label: 'Call reception',
        qa_faq_label: 'Frequently Asked Questions',
        qa_email_label: 'Open Doctolib',
        qa_doctolib_label: 'Open Doctolib',

        // Doctolib announcement
        doctolib_banner_text: 'Bookings and prescriptions via Doctolib. For urgent needs: Out-of-Hours Service 116 117 — Emergencies: 112.',
        doctolib_modal_title: 'Important Notice',
        doctolib_modal_text: 'Dear Patients, warm regards.<br><br>I would like to inform you about the upcoming changes to the practice:<br><br><strong>6 – 7 August (day before and public holiday)</strong><br>The practice is closed. The On-Call Doctor (Guardia Medica) is available 24/7 at 116 117.<br><br><strong>10 – 14 August</strong><br>I will be on holiday. My practice colleagues will assist you by contacting the secretariat at 0575 910904.<br><br><strong>From 17 August</strong><br>I will be back in the practice as usual.<br><br>🚨 <strong>Urgencies, night, weekends and public holidays</strong><br>On weekends, public holidays and at night, general practitioners are not on duty. For any urgency on these days — or if the secretariat does not answer — the On-Call Doctor (Guardia Medica) is always available 24/7 at 116 117. For emergencies, 112.<br><br>📌 <strong>Appointments and requests</strong><br>Book or write to me on Doctolib, or call the secretariat at 0575 910904.<br><br>Have a restful holiday, everyone.<br><br>Dr. Emanuel Savianu<br><em>General Practitioner</em>',
        doctolib_modal_btn: 'I understand',

        // CTA buttons
        cta_book_doctolib: 'Book an appointment',
        cta_book_doctolib_sub: 'Choose date and time on Doctolib',
        cta_message_doctolib: 'Send a message / Request prescription',
        cta_message_doctolib_sub: 'Contact the doctor via Doctolib',

        // Nav (site-nav component)
        nav_home: 'Home',
        nav_ssn: 'Patients',
        nav_privati: 'Private Patients',
        nav_colleghi: 'Colleagues',
        nav_faq: 'FAQ',
        nav_menu_open: 'Open navigation menu',
        nav_menu_close: 'Close navigation menu',
        nav_menu_label: 'Main menu',

        // Footer (site-footer component)
        footer_home: 'Home',
        footer_faq: 'Frequently Asked Questions',

        // Footer
        footer_malattia_link: 'Sick leave certificate: who should issue it?'
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
    try { localStorage.setItem('preferredLanguage', lang); } catch (e) {}
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
    const lang = (function() { try { return localStorage.getItem('preferredLanguage') || 'it'; } catch(e) { return 'it'; } })();
    const openLabel = lang === 'en' ? 'Open now' : 'Aperto ora';
    const closedLabel = lang === 'en' ? 'Closed' : 'Chiuso';
    badge.innerHTML = isOpen
        ? '<i class="fas fa-circle"></i> ' + openLabel
        : '<i class="fas fa-circle"></i> ' + closedLabel;
    anchor.parentNode.appendChild(badge);
})();

// --- DOCTOLIB BANNER LOGIC ---
// NOTE: this banner always shows its own i18n text. The closure/absence
// notice is rendered exclusively by #ferie-banner (CONFIG.ASSENZE) — showing
// it in both banners caused duplicated notices on every patient page.
(function() {
    const banner = document.getElementById('doctolib-banner');
    const textEl = document.getElementById('doctolib-banner-text');
    if (!banner || !textEl) return;
    var lang = (function() { try { return localStorage.getItem('preferredLanguage') || 'it'; } catch(e) { return 'it'; } })();
    var t = translations[lang] || translations['it'];
    textEl.textContent = t.doctolib_banner_text;
})();

// --- FERIE BANNER LOGIC ---
(function() {
    if (typeof CONFIG === 'undefined') return;
    const banner = document.getElementById('ferie-banner');
    const textEl = document.getElementById('ferie-banner-text');
    if (!banner || !textEl) return;

    const active = CONFIG.getActiveAbsence();

    if (!active) return;

    try {
        if (sessionStorage.getItem('ferie-dismissed-' + active.from)) return;
    } catch(e) {}

    textEl.textContent = active.note;
    banner.removeAttribute('hidden');
})();

export function dismissFerieBanner() {
    const banner = document.getElementById('ferie-banner');
    if (banner) banner.setAttribute('hidden', '');
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
    const lang = (function() { try { return localStorage.getItem('preferredLanguage') || 'it'; } catch(e) { return 'it'; } })();
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
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
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

            if (text.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
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
const GLOBAL_FUNCTIONS = {
    setLanguage: setLanguage,
    toggleDarkMode: toggleDarkMode,
    toggleLargeText: toggleLargeText,
    dismissFerieBanner: dismissFerieBanner,
    closeDoctolibModal: closeDoctolibModal,
    startBooking: startBooking,
    renderFlowStep: renderFlowStep,
    toggleAccordion: toggleAccordion,
    toggleFaq: toggleFaq,
    showSection: showSection,
    dismissGuidaRapida: dismissGuidaRapida,
    selectVisitType: selectVisitType
};
for (const name in GLOBAL_FUNCTIONS) {
    window[name] = GLOBAL_FUNCTIONS[name];
}



