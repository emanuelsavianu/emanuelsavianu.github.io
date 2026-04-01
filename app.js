// =================================================================
// STUDIO MEDICO DOTT. SAVIANU - JAVASCRIPT
// =================================================================

// --- AUTOMATIC YEAR ---
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- DARK MODE TOGGLE ---
function toggleDarkMode() {
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
    
    var lang = (function() { try { return localStorage.getItem('preferredLanguage') || 'it'; } catch(e) { return 'it'; } })();
    
    if (isActive) {
        banner.classList.add('active');
        banner.classList.remove('hidden');
        label.textContent = translations[lang]?.large_text_active || translations['it'].large_text_active;
        btn.textContent   = translations[lang]?.large_text_btn_active || translations['it'].large_text_btn_active;
    } else {
        banner.classList.remove('active');
        label.textContent = translations[lang]?.large_text_inactive || translations['it'].large_text_inactive;
        btn.textContent   = translations[lang]?.large_text_btn_inactive || translations['it'].large_text_btn_inactive;
    }
}

function toggleLargeText() {
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
const translations = {
    it: {
        // Mobile banner
        mobile_app_banner: "Installa sul telefono (Accesso Rapido)",

        // Header
        header_subtitle: "Medico di Medicina Generale - Arezzo",

        // Alert box (index.html)
        alert_notice: "<i class='fas fa-info-circle' aria-hidden='true' style='margin-right: 8px;'></i><strong>Trasferimento:</strong> Dal 27 Aprile 2026, il dottor Savianu visiterà in <strong>Piazza Saione 3</strong>.",

        // Services section
        services_title: "Servizi Online",
        btn_faq_main: "Hai dubbi? Leggi prima le FAQ",
        btn_book: "Prenota una visita",
        btn_book_sub: "Scegli giorno e orario",


        // Booking section
        booking_title: "Seleziona il tipo di visita",
        booking_guide_title: "Come prenotare:",
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
        guard_title: "Continuità Assistenziale (ex-Guardia Medica)",
        guard_desc: "Per assistenza medica non urgente durante la notte, i festivi e prefestivi.",

        // Contacts
        contacts_title: "Contatti Studio",
        label_secretary: "Segreteria e Appuntamenti",
        label_doctor: "Tel. Personale (Solo Urgenze)",
        label_address: "Studio Medico Ippocrate",
        label_email: "Email",

        // Hours
        hours_title: "Orari di Studio",
        appt_only: "Solo su appuntamento",
        hours_day1: "Lun · Mer · Ven",
        hours_day2: "Mar · Gio",
        day_sat_sun: "Sab - Dom",
        closed: "Chiuso",
        hours_secretary_title: "Orari Segreteria",
        hours_secretary_desc: "Per appuntamenti telefonici e info.",

        // Footer
        link_privacy: "Privacy Policy",

        // Welcome modal
        welcome_transfer_title: "Nuova Sede Studio",
        welcome_transfer_desc: "Dal 27 Aprile 2026, il Dott. Savianu si trasferirà in <strong>Piazza Saione 3</strong>. Attualmente: <strong>Via Ubaldo Pasqui 38</strong>.",
        welcome_intro: "Benvenuti. Ho organizzato questo sito per semplificare la vostra vita. Utilizzando gli strumenti digitali, mi permettete di dedicare la massima attenzione alle visite mediche vere e proprie.",
        welcome_step0_title: "0. Prima di tutto: Leggi le FAQ",
        welcome_step0_desc: "La maggior parte delle risposte a dubbi su certificati, ricette ed esenzioni si trova nelle <strong><a href='faq.html' style='text-decoration:underline; font-weight:bold;'>Domande Frequenti</a></strong>. Consultale prima di chiamare!",
        welcome_step1_title: "1. Prenotazione Appuntamenti",
        welcome_step1_desc: "L'agenda online vi permette di prenotare la visita senza attese al telefono.",
        welcome_step2_title: "2. Urgenze e Contatto Diretto",
        welcome_step2_p1: "Segreteria: <strong>0575 910 904</strong>",
        welcome_step2_p2: "<strong>Urgenze vere: chiamare 112 / 116 117.</strong>",
        welcome_step2_p3: "Il numero del Dottore (0575 171 3428) è riservato solo alle urgenze.",
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
        faq_a1: "Il modo più semplice e veloce è tramite il <strong>sito web</strong>:<ul><li>Vai su <a href='index.html'>savianu.it</a> e clicca \"Prenota Visita\"</li><li>Scegli il tipo: <strong>Prima Visita</strong>, <strong>Visita Ordinaria</strong> o <strong>Sintomi Recenti</strong></li><li>Seleziona giorno e orario dal calendario</li><li>Inserisci nome, cognome ed email per la conferma</li></ul><div class='highlight-box'>In alternativa, chiama la segreteria al <strong>0575 910 904</strong> durante gli orari di ambulatorio.</div>",
        faq_q2: "Posso venire senza appuntamento?",
        faq_a2: "Il Dottore riceve <strong>solo su appuntamento</strong> per garantire tempi di attesa ragionevoli e dedicare la giusta attenzione a ogni paziente.",
        faq_q3: "Quali sono gli orari dell'ambulatorio?",
        faq_a3: "<table style='width:100%; border-collapse: collapse;'><tr><td style='padding: 6px 0; font-weight: 600;'>Lunedì, Mercoledì, Venerdì</td><td style='text-align:right; color: var(--text-dark); font-weight: 700;'>16:00 - 19:00</td></tr><tr><td style='padding: 6px 0; font-weight: 600;'>Martedì, Giovedì</td><td style='text-align:right; color: var(--text-dark); font-weight: 700;'>10:00 - 13:00</td></tr><tr><td style='padding: 6px 0; font-weight: 600; color: var(--danger);'>Sabato - Domenica</td><td style='text-align:right; color: var(--danger);'>Chiuso</td></tr></table><div class='highlight-box'><strong>Indirizzo:</strong> Studio Medico Ippocrate, Via Ubaldo Pasqui 38, Arezzo (dal 27/04/2026: Piazza Saione 3)</div>",
        faq_q4: "Come annullo o sposto un appuntamento?",
        faq_a4: "Nell'email di conferma troverete un link per <strong>modificare o cancellare</strong> l'appuntamento direttamente dal calendario.<br><br>Se non trovate l'email, chiamate la segreteria al <strong>0575 910 904</strong> con ragionevole anticipo.",
        faq_q5: "Come richiedo la ricetta per i farmaci che prendo regolarmente?",
        faq_a5: "Potete richiederla contattando la segreteria al <strong>0575 910 904</strong> durante gli orari di ambulatorio, oppure durante una visita in studio.<div class='highlight-box'><strong>Importante:</strong> Le ricette dematerializzate (NRE) vengono inviate direttamente al sistema, potete ritirarle in qualsiasi farmacia comunicando il codice fiscale.</div>",
        faq_sec_certificati: "<i class='fas fa-file-medical'></i> Certificati",
        faq_sec_referti: "<i class='fas fa-flask'></i> Referti ed Esami",
        faq_sec_nuovi: "<i class='fas fa-user-plus'></i> Nuovi Pazienti",
        faq_sec_urgenze: "<i class='fas fa-ambulance'></i> Urgenze e Fuori Orario",
        faq_sec_varie: "<i class='fas fa-stethoscope'></i> Altri Servizi",
        faq_q6: "Come richiedo un certificato medico?",
        faq_a6: "I certificati si richiedono durante una visita in ambulatorio o telefonando la segreteria al <strong>0575 910 904</strong>.<br><br>Presentarsi con la documentazione necessaria: il certificato viene emesso direttamente in ambulatorio.<div class='highlight-box'><strong>Certificati INPS malattia:</strong> Richiedono una visita. Prenotare selezionando \"Sintomi Recenti\".</div>",
        faq_q7: "Come accedo ai miei referti?",
        faq_a7: "I referti degli esami sono disponibili sul <strong>Fascicolo Sanitario Elettronico (FSE)</strong> regionale, accessibile su salute.toscana.it con SPID o CIE.<br><br>Il medico può visionare i referti durante la visita e commentarli. Se avete dubbi su un referto, prenotate una visita ordinaria.",
        faq_q9: "Come mi iscrivo come nuovo paziente?",
        faq_a9: "Per iscriversi come nuovo paziente occorre:<ul><li>Avere residenza o domicilio nel territorio di Arezzo</li><li>Presentarsi in segreteria con <strong>tessera sanitaria</strong> e <strong>documento d'identità</strong></li></ul>Dopo la registrazione, prenotare la prima visita selezionando <strong>\"Prima Visita (Nuovi Pazienti)\"</strong> (30 min).<div class='highlight-box'>Portare alla prima visita: lista farmaci, esami precedenti, referti e codice esenzione se presente.</div>",
        faq_q10: "Cosa faccio in caso di emergenza?",
        faq_a10: "In caso di emergenza medica chiamare sempre il <strong>112</strong>.<br><br>Per situazioni urgenti ma non emergenziali fuori dagli orari di ambulatorio, contattare la <strong>Continuità Assistenziale</strong> (ex Guardia Medica) al numero <strong>116 117</strong>.<div class='highlight-box'>Il numero personale del Dottore (0575 171 3428) è riservato esclusivamente alle urgenze reali durante l'orario lavorativo.</div>",
        faq_q11: "Come richiedo un'impegnativa per esami o visite specialistiche?",
        faq_a11: "Le impegnative per esami del sangue, radiografie o visite specialistiche si richiedono durante la visita in ambulatorio o contattando la segreteria al <strong>0575 910 904</strong>.<div class='highlight-box'>Per prenotare esami tramite il SSN, utilizzate il <strong>CUP Toscana</strong> una volta ottenuta l'impegnativa.</div>",
        faq_cta_title: "Non hai trovato la risposta?",
        faq_cta_desc: "Contatta la segreteria al 0575 910 904 per comunicare con il medico.",

        // Flowchart
        flowchart_title: "Di cosa hai bisogno?",
        flowchart_opt_book: '<i class="fas fa-calendar-check"></i> Voglio prenotare una visita',
        flowchart_opt_night: '<i class="fas fa-moon"></i> È sera, notte o weekend',
        flowchart_opt_faq: '<i class="fas fa-question-circle"></i> Ho un\'altra domanda',
        flowchart_end_book_title: 'Prenota una visita',
        flowchart_end_book_desc: 'Scegli il tipo di visita qui sotto e poi seleziona giorno e orario sul calendario.',
        flowchart_end_book_action: 'Scegli il tipo di visita',
        flowchart_end_116_title: 'Chiama il 116 117',
        flowchart_end_116_desc: 'Per assistenza medica non urgente fuori orario (sera, notte, weekend, festivi): Continuità Assistenziale.',
        flowchart_end_116_action: 'Chiama 116 117',
        flowchart_end_faq_title: 'Leggi le FAQ',
        flowchart_end_faq_desc: 'Trovi risposte immediate su certificati, esenzioni, referti e burocrazia nelle domande frequenti.',
        flowchart_end_faq_action: 'Vai alle FAQ',
        flowchart_restart: '↩ Ricomincia',
        cal_privata_title: 'Visita Privata',
        cal_privata_desc: 'Consulti e certificati privati. (Non pazienti del dott. Savianu)',

        // Quick actions bar
        qa_call: 'Chiama',
        qa_book: 'Prenota',
        qa_home: 'Home',
        qa_email: 'Email',

        // FAQ page extras
        faq_search_placeholder: 'Cerca nelle FAQ...',
        faq_search_label: 'Cerca nelle FAQ',
        faq_no_results: 'Nessuna domanda trovata — contatta la segreteria al 0575 910 904.',
        faq_header_title: 'Domande Frequenti',
        faq_header_desc: 'Risposte alle domande più comuni',

        // SW update toast
        sw_update_available: 'Aggiornamento disponibile',
        sw_update_now: 'Aggiorna ora',

        // Misc hardcoded
        service_banner_desc: 'Trovi subito le risposte ai dubbi più comuni (certificati, esenzioni, impegnative).',
        email_privacy_notice: 'Per privacy, non inviare dettagli clinici via email: usa la visita in studio.',
        secretary_hours_label: 'Orari Segreteria - 0575 910 904',

        // Large text banner
        large_text_inactive: '🔤 Difficoltà a leggere?',
        large_text_btn_inactive: 'A+ Testo Grande',
        large_text_active: '✓ Testo grande attivo',
        large_text_btn_active: 'A− Normale'
    },
    en: {
        // Mobile banner
        mobile_app_banner: "Install on your phone (Quick Access)",

        // Header
        header_subtitle: "General Practitioner - Arezzo",

        // Alert box (index.html)
        alert_notice: "<i class='fas fa-info-circle' aria-hidden='true' style='margin-right: 8px;'></i><strong>Relocation:</strong> From 27 April 2026, Dr. Savianu will be visiting at <strong>Piazza Saione 3</strong>.",

        // Services section
        services_title: "Online Services",
        btn_faq_main: "Have questions? Read the FAQ first",
        btn_book: "Book a visit",
        btn_book_sub: "Choose date and time",


        // Booking section
        booking_title: "Select visit type",
        booking_guide_title: "How to book:",
        booking_guide_steps: "<li>Click the button for the visit type below.</li><li>Choose an available day and time from the calendar.</li><li>Enter your first name, surname, and an email address.</li><li>Click <strong>Confirm</strong> (you will receive a confirmation email).</li>",
        cal_prima_title: "First Visit (New Patients)",
        cal_prima_desc: "For new patients only. Bring documents, tests, reports and exemptions. (30 min)",
        cal_ord_title: "Standard Visit",
        cal_ord_desc: "Check-ups and non-urgent issues. (20 min)",
        cal_breve_title: "Recent Symptoms",
        cal_breve_desc: "Urgent but non-emergency visits, acute illness, INPS sick leave certificates. (10 min)",
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
        guard_title: "Out-of-Hours Service (ex-Guardia Medica)",
        guard_desc: "For non-urgent medical assistance during nights, public holidays and pre-holidays.",

        // Contacts
        contacts_title: "Office Contacts",
        label_secretary: "Reception &amp; Appointments",
        label_doctor: "Personal Phone (Emergencies only)",
        label_address: "Studio Medico Ippocrate",
        label_email: "Email",

        // Hours
        hours_title: "Clinic Hours",
        appt_only: "By appointment only",
        hours_day1: "Mon · Wed · Fri",
        hours_day2: "Tue · Thu",
        day_sat_sun: "Sat - Sun",
        closed: "Closed",
        hours_secretary_title: "Reception Hours",
        hours_secretary_desc: "For phone appointments and enquiries.",

        // Footer
        link_privacy: "Privacy Policy",

        // Welcome modal
        welcome_transfer_title: "New Office Location",
        welcome_transfer_desc: "From 27 April 2026, Dr. Savianu will move to <strong>Piazza Saione 3</strong>. Current address: <strong>Via Ubaldo Pasqui 38</strong>.",
        welcome_intro: "Welcome. This website is designed to make your life easier. By using the digital tools available, you allow me to focus my full attention on in-person medical consultations.",
        welcome_step0_title: "0. First of all: Read the FAQ",
        welcome_step0_desc: "Most answers about certificates, prescriptions and exemptions can be found in the <strong><a href='faq.html' style='text-decoration:underline; font-weight:bold;'>Frequently Asked Questions</a></strong>. Check there before calling!",
        welcome_step1_title: "1. Appointment Booking",
        welcome_step1_desc: "The online calendar lets you book a visit without waiting on the phone.",
        welcome_step2_title: "2. Urgent Matters &amp; Direct Contact",
        welcome_step2_p1: "Reception: <strong>0575 910 904</strong>",
        welcome_step2_p2: "<strong>True emergencies: call 112 / 116 117.</strong>",
        welcome_step2_p3: "The doctor's direct number (0575 171 3428) is reserved for genuine emergencies only.",
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
        faq_a1: "The simplest and fastest way is through the <strong>website</strong>:<ul><li>Go to <a href='index.html'>savianu.it</a> and click \"Book Visit\"</li><li>Choose the type: <strong>First Visit</strong>, <strong>Standard Visit</strong>, or <strong>Recent Symptoms</strong></li><li>Select a day and time from the calendar</li><li>Enter your name, surname and email for confirmation</li></ul><div class='highlight-box'>Alternatively, call reception on <strong>0575 910 904</strong> during clinic hours.</div>",
        faq_q2: "Can I come without an appointment?",
        faq_a2: "The doctor sees patients <strong>by appointment only</strong> to ensure reasonable waiting times and give each patient the attention they deserve.<br><br>If you are unwell and cannot book online, come in anyway: the receptionist will let the doctor know, and he will contact you as soon as he is free.",
        faq_q3: "What are the clinic opening hours?",
        faq_a3: "<table style='width:100%; border-collapse: collapse;'><tr><td style='padding: 6px 0; font-weight: 600;'>Monday, Wednesday, Friday</td><td style='text-align:right; color: var(--text-dark); font-weight: 700;'>16:00 - 19:00</td></tr><tr><td style='padding: 6px 0; font-weight: 600;'>Tuesday, Thursday</td><td style='text-align:right; color: var(--text-dark); font-weight: 700;'>10:00 - 13:00</td></tr><tr><td style='padding: 6px 0; font-weight: 600; color: var(--danger);'>Saturday - Sunday</td><td style='text-align:right; color: var(--danger);'>Closed</td></tr></table><div class='highlight-box'><strong>Address:</strong> Studio Medico Ippocrate, Via Ubaldo Pasqui 38, Arezzo (dal 27/04/2026: Piazza Saione 3)</div>",
        faq_q4: "How do I cancel or reschedule an appointment?",
        faq_a4: "Your confirmation email contains a link to <strong>modify or cancel</strong> the appointment directly in the calendar.<br><br>If you cannot find the email, please call reception on <strong>0575 910 904</strong> with reasonable notice.",
        faq_q5: "How do I request a prescription for my regular medications?",
        faq_a5: "You can request a prescription by calling reception on <strong>0575 910 904</strong> during clinic hours, or during an in-office visit.<div class='highlight-box'><strong>Important:</strong> Electronic prescriptions (NRE) are sent directly to the system — you can collect them at any pharmacy by providing your tax ID (Codice Fiscale).</div>",
        faq_sec_certificati: "<i class='fas fa-file-medical'></i> Certificates",
        faq_sec_referti: "<i class='fas fa-flask'></i> Test Results &amp; Referrals",
        faq_sec_nuovi: "<i class='fas fa-user-plus'></i> New Patients",
        faq_sec_urgenze: "<i class='fas fa-ambulance'></i> Emergencies &amp; Out-of-Hours",
        faq_sec_varie: "<i class='fas fa-stethoscope'></i> Other Services",
        faq_q6: "How do I request a medical certificate?",
        faq_a6: "Certificates can be requested during a clinic visit or by calling reception on <strong>0575 910 904</strong>.<br><br>Bring any relevant documents; the certificate is issued on the spot at the clinic.<div class='highlight-box'><strong>INPS sick leave certificates</strong> require an in-person visit. Book by selecting \"Recent Symptoms\".</div>",
        faq_q7: "How do I access my test results?",
        faq_a7: "Test results are available on the <strong>Electronic Health Record (FSE)</strong>, accessible at salute.toscana.it using SPID or CIE.<br><br>The doctor can review and discuss results during a visit. If you have questions about a result, book a standard appointment.",
        faq_q9: "How do I register as a new patient?",
        faq_a9: "To register as a new patient you must:<ul><li>Reside or be domiciled in the Arezzo area</li><li>Present yourself at reception with your <strong>health card (tessera sanitaria)</strong> and <strong>photo ID</strong></li></ul>After registration, book your first appointment by selecting <strong>\"First Visit (New Patients)\"</strong> (30 min).<div class='highlight-box'>Bring to your first visit: a list of your current medications, previous test results, specialist reports, and your exemption code if applicable.</div>",
        faq_q10: "What do I do in an emergency?",
        faq_a10: "In a medical emergency always call <strong>112</strong>.<br><br>For urgent but non-emergency situations outside clinic hours, contact the <strong>Out-of-Hours Service</strong> (Continuità Assistenziale) on <strong>116 117</strong>.<div class='highlight-box'>The doctor's personal number (0575 171 3428) is reserved for genuine emergencies during working hours only.</div>",
        faq_q11: "How do I get a referral for tests or specialist appointments?",
        faq_a11: "Referrals for blood tests, X-rays, or specialist visits must be requested during an in-person clinic visit or by calling reception on <strong>0575 910 904</strong>.<div class='highlight-box'>To book tests through the NHS, use <strong>CUP Toscana</strong> once you have your referral.</div>",
        faq_cta_title: "Didn't find the answer?",
        faq_cta_desc: "Contact reception on 0575 910 904 to send a message to the doctor.",

        // Flowchart
        flowchart_title: "What do you need?",
        flowchart_opt_book: '<i class="fas fa-calendar-check"></i> I want to book a visit',
        flowchart_opt_night: '<i class="fas fa-moon"></i> It\'s evening, night or weekend',
        flowchart_opt_faq: '<i class="fas fa-question-circle"></i> I have another question',
        flowchart_end_book_title: 'Book a visit',
        flowchart_end_book_desc: 'Choose the type of visit below and then select a day and time from the calendar.',
        flowchart_end_book_action: 'Choose visit type',
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
        qa_email: 'Email',

        // FAQ page extras
        faq_search_placeholder: 'Search the FAQ...',
        faq_search_label: 'Search the FAQ',
        faq_no_results: 'No questions found — contact reception on 0575 910 904.',
        faq_header_title: 'Frequently Asked Questions',
        faq_header_desc: 'Answers to the most common questions',

        // SW update toast
        sw_update_available: 'Update available',
        sw_update_now: 'Update now',

        // Misc hardcoded
        service_banner_desc: 'Find immediate answers to common questions (certificates, exemptions, referrals).',
        email_privacy_notice: 'For privacy reasons, do not send clinical details via email: use an in-office visit.',
        secretary_hours_label: 'Reception Hours - 0575 910 904',

        // Large text banner
        large_text_inactive: '🔤 Difficulty reading?',
        large_text_btn_inactive: 'A+ Large Text',
        large_text_active: '✓ Large text active',
        large_text_btn_active: 'A− Normal'
    }
};

function setLanguage(lang) {
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
    try { localStorage.setItem('preferredLanguage', lang); } catch (e) {}

    updateLargeTextBanner(document.body.classList.contains('large-text'));
}

try {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) setLanguage(savedLang);
} catch (e) {}

// --- SMOOTH SCROLL ---
function showSection(sectionId) {
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

function dismissGuidaRapida() {
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

    const anchor = document.querySelector('[data-i18n="hours_title"]');
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

// --- FERIE BANNER LOGIC ---
(function() {
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

function dismissFerieBanner() {
    const banner = document.getElementById('ferie-banner');
    if (banner) banner.setAttribute('hidden', '');
    try {
        const active = CONFIG.getActiveAbsence();
        if (active) sessionStorage.setItem('ferie-dismissed-' + active.from, '1');
    } catch(e) {}
}

// --- DECISION FLOWCHART ---
function getFlowLabel(lang, key) {
    return translations[lang]?.[key] || translations['it'][key] || '';
}

function renderFlowStep(stepKey) {
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

var _bookingUrl = '';

function selectVisitType(type, url) {
    _bookingUrl = url;
    var lang = (function() { try { return localStorage.getItem('preferredLanguage') || 'it'; } catch(e) { return 'it'; } })();

    var visitMeta = {
        prima: {
            icon: 'fas fa-user-plus',
            titleKey: 'cal_prima_title',
            checklist: [
                { icon: '📁', text: lang === 'it' ? 'Cartella Clinica completa (da chiedere al precedente Medico di Famiglia)' : 'Complete Medical Record (request from your previous GP)' },
                { icon: '📋', text: lang === 'it' ? 'Eventuali piani terapeutici' : 'Any active treatment plans' },
                { icon: '🏷️', text: lang === 'it' ? 'Esenzioni attive (se presenti)' : 'Active exemptions (if applicable)' }
            ],
            note: lang === 'it' ? '⏱ Durata stimata: 30 minuti. Si prega di arrivare puntuali.' : '⏱ Estimated duration: 30 minutes. Please arrive on time.'
        },
        ordinaria: {
            icon: 'fas fa-stethoscope',
            titleKey: 'cal_ord_title',
            checklist: [
                { icon: '📄', text: lang === 'it' ? 'Porta eventuali esami o referti recenti pertinenti alla visita' : 'Bring any recent test results or reports relevant to the visit' }
            ],
            note: lang === 'it' ? '⏱ Durata stimata: 20 minuti.' : '⏱ Estimated duration: 20 minutes.'
        },
        breve: {
            icon: 'fas fa-clock',
            titleKey: 'cal_breve_title',
            checklist: [
                { icon: 'ℹ️', text: lang === 'it' ? 'Nessun documento necessario — descrivi i sintomi al dottore durante la visita' : 'No documents needed — describe your symptoms to the doctor during the visit' }
            ],
            note: lang === 'it' ? '⏱ Durata stimata: 10 minuti.' : '⏱ Estimated duration: 10 minutes.'
        },
        privata: {
            icon: 'fas fa-user-tie',
            titleKey: 'cal_privata_title',
            checklist: [
                { icon: 'ℹ️', text: lang === 'it' ? 'Consulti, certificati privati e prestazioni non coperte dal SSN' : 'Private consultations, certificates and non-NHS services' }
            ],
            note: lang === 'it' ? '⏱ Contattare per disponibilità.' : '⏱ Contact for availability.'
        }
    };

    var meta = visitMeta[type];
    if (!meta) return;

    var t = translations[lang] || translations['it'];
    var visitTitle = t[meta.titleKey] || type;

    var checklistItems = meta.checklist.map(function(item) {
        return '<div class="checklist-item"><span class="checklist-item-icon">' + item.icon + '</span><span>' + item.text + '</span></div>';
    }).join('');

    var grid = document.querySelector('.cal-services-grid');
    var checklist = document.getElementById('booking-checklist');
    if (!grid || !checklist) return;

    checklist.innerHTML =
        '<div class="checklist-visit-header">' +
            '<i class="' + meta.icon + '" style="color:var(--accent);font-size:1.3rem;flex-shrink:0;"></i>' +
            '<h4>' + visitTitle + '</h4>' +
        '</div>' +
        (meta.checklist.length > 1 || meta.checklist[0].icon !== 'ℹ️' ? '<div class="checklist-label">' + (lang === 'it' ? '✅ Cosa portare alla visita:' : '✅ What to bring:') + '</div>' : '') +
        '<div class="checklist-items">' + checklistItems + '</div>' +
        '<div class="checklist-note">' + meta.note + '</div>' +
        '<button class="btn-proceed-booking" onclick="proceedToBooking()">📅 ' + (lang === 'it' ? 'Procedi alla prenotazione' : 'Proceed to booking') + '</button>' +
        '<button class="btn-change-visit" onclick="resetBookingGrid()">↩ ' + (lang === 'it' ? 'Cambia tipo di visita' : 'Change visit type') + '</button>';

    grid.classList.add('hidden');
    checklist.classList.remove('hidden');
}

function proceedToBooking() {
    if (_bookingUrl) window.open(_bookingUrl, '_blank', 'noopener,noreferrer');
}

function resetBookingGrid() {
    var grid = document.querySelector('.cal-services-grid');
    var checklist = document.getElementById('booking-checklist');
    if (grid) grid.classList.remove('hidden');
    if (checklist) checklist.classList.add('hidden');
    _bookingUrl = '';
}