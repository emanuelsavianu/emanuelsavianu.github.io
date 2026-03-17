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
        themeMeta.setAttribute('content', isDark ? '#0f1419' : '#0066cc');
    }
    
    try {
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    } catch (e) {
        console.log('LocalStorage not available');
    }
}

function initDarkMode() {
    try {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'enabled') {
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
            if (themeMeta) themeMeta.setAttribute('content', '#0f1419');
        }
    } catch (e) {}
}

initDarkMode();

// --- REPS MODAL LOGIC ---
function toggleRepsModal(show) {
    const modal = document.getElementById('reps-overlay');
    const overlay = document.getElementById('welcome-overlay');
    
    if (show && modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else if (modal) {
        modal.style.display = 'none';
        if (!overlay || !overlay.classList.contains('active')) {
            document.body.style.overflow = 'auto';
        }
    }
}

// --- LANGUAGE MANAGEMENT ---
const translations = {
    it: {
        header_subtitle: "Medico di Medicina Generale - Arezzo",
        alert_p1: "<i class='fas fa-exclamation-circle'></i> <strong>Nuovi pazienti:</strong> Prenotate tramite 'Prima Visita'. Vi iscriverò a <strong>MilleBook</strong> in ambulatorio.",
        alert_p2: "<i class='fas fa-check-circle'></i> Dopo la prima visita, usate esclusivamente MilleBook.",
        services_title: "Servizi Online",
        millebook_btn: "ACCEDI A MILLEBOOK",
        millebook_sub: "Il tuo fascicolo sanitario digitale",
        new_users_title: "Prenotazioni & Modulistica",
        new_users_desc: "Usa i tasti qui sotto.",
        btn_book: "Prenota Visita",
        btn_book_sub: "Scegli il tipo di visita",
        btn_drugs: "Modulo Farmaci",
        btn_drugs_sub: "Se Millebook non funziona",
        btn_faq: "FAQ Pazienti",
        booking_title: "Seleziona il tipo di visita",
        booking_choose_desc: "Tocca uno dei pulsanti qui sotto per aprire il calendario:",
        emergency_112: "Per urgenze mediche, contattare il 112.",
        contacts_title: "Contatti Studio",
        label_doctor: "Numero Dott. Savianu",
        label_secretary: "Segreteria",
        label_address: "Indirizzo",
        hours_title: "Orari Ambulatorio",
        day_mon: "Lunedì",
        day_tue: "Martedì",
        day_wed: "Mercoledì",
        day_thu: "Giovedì",
        day_fri: "Venerdì",
        day_sat_sun: "Sab - Dom",
        closed: "Chiuso",
        guard_title: "Continuità Assistenziale",
        guard_desc: "Per assistenza non urgente (notte, festivi)."
    },
    en: {
        header_subtitle: "General Practitioner - Arezzo",
        alert_p1: "<i class='fas fa-exclamation-circle'></i> <strong>New Patients:</strong> Book via 'First Visit'. I will register you on <strong>MilleBook</strong>.",
        alert_p2: "<i class='fas fa-check-circle'></i> After the first visit, please use MilleBook exclusively.",
        services_title: "Online Services",
        millebook_btn: "LOGIN TO MILLEBOOK",
        millebook_sub: "Your digital health record",
        new_users_title: "Bookings & Forms",
        new_users_desc: "Use the buttons below.",
        btn_book: "Book Visit",
        btn_book_sub: "Choose visit type",
        btn_drugs: "Prescription Form",
        btn_drugs_sub: "If Millebook is down",
        btn_faq: "Patient FAQ",
        booking_title: "Select visit type",
        booking_choose_desc: "Tap a button below to open the calendar:",
        emergency_112: "For medical emergencies, contact 112.",
        contacts_title: "Office Contacts",
        label_doctor: "Dr. Savianu Phone",
        label_secretary: "Reception",
        label_address: "Address",
        hours_title: "Clinic Hours",
        day_mon: "Monday",
        day_tue: "Tuesday",
        day_wed: "Wednesday",
        day_thu: "Thursday",
        day_fri: "Friday",
        day_sat_sun: "Sat - Sun",
        closed: "Closed",
        guard_title: "Out-of-Hours Service",
        guard_desc: "For non-urgent assistance (nights, holidays)."
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
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
    try { sessionStorage.setItem('welcomeSeen', 'true'); } catch(e) {}
}

function openWelcome() {
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) overlay.classList.add('active');
    document.body.classList.add('modal-open');
}

window.addEventListener('load', function() {
    if (sessionStorage.getItem('welcomeSeen')) closeWelcome();
});