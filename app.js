// =================================================================
// STUDIO MEDICO DOTT. SAVIANU - JAVASCRIPT
// =================================================================

// --- AUTOMATIC YEAR ---
document.getElementById('current-year').textContent = new Date().getFullYear();

// --- PWA INSTALLATION ---
let deferredPrompt;
const pwaPrompt = document.getElementById('pwa-install-prompt');
const pwaInstallBtn = document.getElementById('pwa-install-btn');
const pwaDismissBtn = document.getElementById('pwa-dismiss-btn');

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install prompt after a delay (only if not dismissed before)
    if (!localStorage.getItem('pwaPromptDismissed')) {
        setTimeout(() => {
            pwaPrompt.style.display = 'block';
        }, 3000);
    }
});

// Handle install button click
pwaInstallBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        // Fallback for browsers that don't support PWA
        alert('Per installare l\'app:\n\niOS: Tap sul pulsante di condivisione e seleziona "Aggiungi a Home"\n\nAndroid: Apri il menu del browser e seleziona "Installa app"');
        return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Clear the deferredPrompt
    deferredPrompt = null;
    
    // Hide the prompt
    pwaPrompt.style.display = 'none';
});

// Handle dismiss button click
pwaDismissBtn.addEventListener('click', () => {
    pwaPrompt.style.display = 'none';
    localStorage.setItem('pwaPromptDismissed', 'true');
});

// Function to manually prompt PWA install (called by Install App button)
function promptPWAInstall() {
    if (deferredPrompt) {
        pwaPrompt.style.display = 'block';
    } else {
        // Show instructions for manual installation
        const lang = document.documentElement.lang || 'it';
        const messages = {
            it: 'Per installare l\'app:\n\n📱 iOS/Safari:\n1. Tocca il pulsante di condivisione (quadrato con freccia)\n2. Seleziona "Aggiungi a Home"\n\n🤖 Android/Chrome:\n1. Apri il menu (tre puntini)\n2. Seleziona "Installa app" o "Aggiungi a Home"\n\n💻 Desktop:\nCerca l\'icona di installazione nella barra degli indirizzi',
            en: 'To install the app:\n\n📱 iOS/Safari:\n1. Tap the share button (square with arrow)\n2. Select "Add to Home Screen"\n\n🤖 Android/Chrome:\n1. Open menu (three dots)\n2. Select "Install app" or "Add to Home Screen"\n\n💻 Desktop:\nLook for the install icon in the address bar'
        };
        alert(messages[lang]);
    }
}

// --- DARK MODE TOGGLE ---
// Updated to change address bar color
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    const darkBtn = document.getElementById('btn-dark');
    
    // Update icon
    const icon = darkBtn.querySelector('i');
    if (isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        // Update Mobile Browser Bar to Dark
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0f1419');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        // Update Mobile Browser Bar to Blue
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0066cc');
    }
    
    // Save preference
    try {
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    } catch (e) {
        console.log('LocalStorage not available');
    }
}

// Initialize dark mode from saved preference
function initDarkMode() {
    try {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'enabled') {
            document.body.classList.add('dark-mode');
            const darkBtn = document.getElementById('btn-dark');
            const icon = darkBtn.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            // Ensure meta tag is correct on load
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0f1419');
        }
    } catch (e) {
        console.log('LocalStorage not available');
    }
}

// Call on page load
initDarkMode();

// --- REPS MODAL LOGIC ---
function toggleRepsModal(show) {
    const modal = document.getElementById('reps-overlay');
    const overlay = document.getElementById('welcome-overlay');
    
    if (show) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        modal.style.display = 'none';
        if (!overlay || !overlay.classList.contains('active')) {
            document.body.style.overflow = 'auto';
        }
    }
}

// --- CALENDAR LOGIC ---
const calendarLinks = {
    'brief': 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ03WcJPqa_eny-M9U6KLtqAzHpLTmNFUteypWETGpqmhgWhzASJZNLlorTWOZ3LmN0wi36AINIr?gv=true&hl=it',
    'first': 'https://calendar.google.com/calendar/appointments/AcZssZ18RVfugwJQ_BmPqV_t7afu_UKp2T9e8WLS6xE=?gv=true&hl=it'
};

function loadCalendar(type) {
    const uiDiv = document.getElementById('booking-selection-ui');
    const calWrapper = document.getElementById('calendar-wrapper');
    const iframe = document.getElementById('calendar-iframe');
    const loading = document.getElementById('calendar-loading');

    if(calendarLinks[type]) {
        loading.classList.add('active');
        iframe.src = calendarLinks[type];
        uiDiv.style.display = 'none';
        calWrapper.style.display = 'block';
        
        setTimeout(() => {
            const yOffset = -30; 
            const y = calWrapper.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({top: y, behavior: 'smooth'});
        }, 150);
    }
}

function hideCalendarLoading() {
    const loading = document.getElementById('calendar-loading');
    setTimeout(() => { loading.classList.remove('active'); }, 300);
}

function resetBookingSelection() {
    const uiDiv = document.getElementById('booking-selection-ui');
    const calWrapper = document.getElementById('calendar-wrapper');
    const iframe = document.getElementById('calendar-iframe');
    const loading = document.getElementById('calendar-loading');

    loading.classList.add('active');
    iframe.src = "";
    calWrapper.style.display = 'none';
    uiDiv.style.display = 'block';

    setTimeout(() => {
        const bookingSection = document.getElementById('booking-section');
        const yOffset = -20;
        const y = bookingSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
    }, 100);
}

// --- LANGUAGE MANAGEMENT ---
const translations = {
    it: {
        header_subtitle: "Medico di Medicina Generale - Arezzo",
        alert_p1: "<i class='fas fa-exclamation-circle'></i> <strong>Nuovi pazienti:</strong> Se è la tua prima volta, prenota tramite 'Prenota Visita'. Ti iscriverò a <strong>MilleBook</strong>.",
        alert_p2: "<i class='fas fa-check-circle'></i> Dopo la prima visita, usa esclusivamente MilleBook.",
        services_title: "Servizi Online",
        millebook_btn: "ACCEDI A MILLEBOOK",
        millebook_sub: "Il tuo fascicolo sanitario digitale",
        new_users_title: "Prenotazioni & Modulistica",
        new_users_desc: "Per fissare appuntamenti o problemi con MilleBook.",
        btn_book: "Prenota Visita",
        btn_book_sub: "Visite brevi e Nuovi pazienti",
        btn_drugs: "Modulo Farmaci",
        btn_drugs_sub: "Se Millebook non funziona",
        btn_app: "Installa App",
        btn_app_sub: "Versione Mobile",
        booking_title: "Seleziona il tipo di visita",
        booking_choose_desc: "Scegli il motivo della visita:",
        visit_brief: "Visita Breve",
        visit_brief_desc: "Per sintomi recenti",
        visit_first: "Prima Visita",
        visit_first_desc: "Nuovi pazienti",
        btn_change_visit: "Cambia tipo di visita",
        loading_calendar: "Caricamento calendario...",
        privacy_modulo_desc: "Per ridurre i tempi di attesa, leggi l'informativa.",
        privacy_modulo_link: "Leggi Informativa Trattamento Dati",
        emergency_112: "Per urgenze mediche, contattare il 112.",
        contacts_title: "Contatti Studio",
        label_secretary: "Segreteria",
        label_address: "Indirizzo",
        btn_map: "Portami qui",
        doorbell: "Campanello:",
        floor: "Primo Piano",
        hours_title: "Orari Ambulatorio",
        day_mon: "Lunedì",
        day_tue: "Martedì",
        day_wed: "Mercoledì",
        day_thu: "Giovedì",
        day_fri: "Venerdì",
        day_sat_sun: "Sab - Dom",
        closed: "Chiuso",
        guard_title: "Continuità Assistenziale",
        guard_desc: "Per assistenza non urgente (notte, festivi).",
        prof_info_title: "Dati Professionali",
        prof_role: "Medico di Medicina Generale",
        billing_title: "Fatturazione Elettronica",
        link_privacy: "Privacy Policy",
        link_patto: "Patto di Collaborazione",
        footer_reps: "Per offerte commerciali e informatori scientifici",
        reps_disclaimer_full: "Si informa che il Dott. Emanuel Savianu non accetta appuntamenti con informatori scientifici.",
        booking_reps_warning: "ATTENZIONE: Non si accettano appuntamenti con Informatori Scientifici.",
        pwa_install_title: "Installa l'App",
        pwa_install_desc: "Aggiungi questo sito alla schermata home per un accesso più rapido",
        pwa_install_btn: "Installa"
    },
    en: {
        header_subtitle: "General Practitioner - Arezzo",
        alert_p1: "<i class='fas fa-exclamation-circle'></i> <strong>New Patients:</strong> Book your first appointment via 'Book Visit'. I will register you on <strong>MilleBook</strong>.",
        alert_p2: "<i class='fas fa-check-circle'></i> After the first visit, please use MilleBook exclusively.",
        services_title: "Online Services",
        millebook_btn: "LOGIN TO MILLEBOOK",
        millebook_sub: "Your digital health record",
        new_users_title: "Bookings & Forms",
        new_users_desc: "Book appointments or report technical issues.",
        btn_book: "Book Visit",
        btn_book_sub: "Brief visits & New patients",
        btn_drugs: "Prescription Form",
        btn_drugs_sub: "If Millebook is down",
        btn_app: "Install App",
        btn_app_sub: "Mobile Version",
        booking_title: "Select visit type",
        booking_choose_desc: "Choose the reason for your visit:",
        visit_brief: "Brief Visit",
        visit_brief_desc: "For recent symptoms",
        visit_first: "First Visit",
        visit_first_desc: "New patients / Tourists",
        btn_change_visit: "Change visit type",
        loading_calendar: "Loading calendar...",
        privacy_modulo_desc: "Please read the data processing policy.",
        privacy_modulo_link: "Read Data Processing Policy",
        emergency_112: "For medical emergencies, contact 112.",
        contacts_title: "Office Contacts",
        label_secretary: "Reception",
        label_address: "Address",
        btn_map: "Take me there",
        doorbell: "Doorbell:",
        floor: "First Floor",
        hours_title: "Clinic Hours",
        day_mon: "Monday",
        day_tue: "Tuesday",
        day_wed: "Wednesday",
        day_thu: "Thursday",
        day_fri: "Friday",
        day_sat_sun: "Sat - Sun",
        closed: "Closed",
        guard_title: "Out-of-Hours Service",
        guard_desc: "For non-urgent assistance (nights, holidays).",
        prof_info_title: "Professional Details",
        prof_role: "General Practitioner",
        billing_title: "e-Billing Data",
        link_privacy: "Privacy Policy",
        link_patto: "Office Policy",
        footer_reps: "Info for Pharma Reps",
        reps_disclaimer_full: "Dr. Emanuel Savianu does not accept appointments with pharmaceutical representatives.",
        booking_reps_warning: "ATTENTION: No appointments for Pharma Reps.",
        pwa_install_title: "Install App",
        pwa_install_desc: "Add this site to your home screen for faster access",
        pwa_install_btn: "Install"
    }
};

function setLanguage(lang) {
    const btnIt = document.getElementById('btn-it');
    const btnEn = document.getElementById('btn-en');
    btnIt.classList.toggle('active', lang === 'it');
    btnEn.classList.toggle('active', lang === 'en');
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang]?.[key]) el.innerHTML = translations[lang][key];
    });
    try { localStorage.setItem('preferredLanguage', lang); } catch (e) {}
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
            window.scrollTo({ top: y, behavior: 'smooth' });
        }, 100);
    }
}

// --- WELCOME MODAL ---
function closeWelcome() {
    document.getElementById('welcome-overlay').classList.remove('active');
    document.body.classList.remove('modal-open');
    try { sessionStorage.setItem('welcomeSeen', 'true'); } catch(e) {}
}

function openWelcome() {
    document.getElementById('welcome-overlay').classList.add('active');
    document.body.classList.add('modal-open');
}

window.addEventListener('load', function() {
    if (sessionStorage.getItem('welcomeSeen')) closeWelcome();
});

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
