// --- SPLASH SCREEN ---
window.addEventListener('load', function() {
    setTimeout(function() {
        var splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(function() { splash.remove(); }, 400);
        }
    }, 800);
});

function initTheme() {
    const saved = localStorage.getItem('darkMode');
    const prefersD = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'enabled' || (saved === null && prefersD);
    document.body.classList.toggle('dark-mode', isDark);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0a1628' : '#1a2f4c');

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('darkMode') === null) {
            document.body.classList.toggle('dark-mode', e.matches);
            if (icon) icon.className = e.matches ? 'fas fa-sun' : 'fas fa-moon';
            if (meta) meta.setAttribute('content', e.matches ? '#0a1628' : '#1a2f4c');
        }
    });
}

function toggleTheme() {
    const isDark = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0a1628' : '#1a2f4c');
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const i18n = {
    it: {
        subtitle: "Studio Medico Ippocrate",
        millebook: "Accedi a MilleBook",
        millebook_sub: "Ricette, Referti e Fascicolo",
        book: "Prenota Visita",
        booking_title: "Prenotazione Online",
        tap_to_book: "Tocca un bottone per prenotare.",
        contacts: "Contatti Studio",
        label_doctor: "Tel. Personale (Solo Urgenze)",
        label_secretary: "Segreteria e Appuntamenti",
        address: "Studio Medico Ippocrate",
        hours: "Orari di Studio",
        appt_only: "Solo su appuntamento",
        new_patients_alert: "<strong>Nuovi Pazienti:</strong> Prenotate \"Prima Visita\". Vi iscriver\u00f2 a Millebook in studio.",
        cal_prima_title: "Prima Visita",
        cal_prima_sub: "Solo per i nuovi pazienti (45 min)",
        cal_ord_title: "Visita Ordinaria",
        cal_ord_sub: "Controlli e visione esami (20 min)",
        cal_breve_title: "Sintomi Recenti",
        cal_breve_sub: "Urgenze non gravi, certificati INPS (10 min)",
        nav_call: "Chiama",
        install_title: "Installa l'App",
        install_sub: "Aggiungila alla schermata Home",
        install_btn: "Installa",
        ios_install_sub: "Tocca <i class='fas fa-share-from-square'></i> poi \"Aggiungi a Home\""
    },
    en: {
        subtitle: "Studio Medico Ippocrate",
        millebook: "Login to MilleBook",
        millebook_sub: "Prescriptions & Records",
        book: "Book Visit",
        booking_title: "Book Appointment",
        tap_to_book: "Tap a button to book your appointment.",
        contacts: "Office Contacts",
        label_doctor: "Dr. Savianu (Emergencies only)",
        label_secretary: "Reception & Appointments",
        address: "Clinic Address",
        hours: "Opening Hours",
        appt_only: "By appointment only",
        new_patients_alert: "<strong>New Patients:</strong> Book a \u2018First Visit\u2019. I will enrol you in Millebook at the clinic.",
        cal_prima_title: "First Visit",
        cal_prima_sub: "For new patients only (45 min)",
        cal_ord_title: "Standard Visit",
        cal_ord_sub: "Check-ups and test reviews (20 min)",
        cal_breve_title: "Recent Symptoms",
        cal_breve_sub: "Non-urgent cases, INPS certificates (10 min)",
        nav_call: "Call",
        install_title: "Install the App",
        install_sub: "Add it to your Home Screen",
        install_btn: "Install",
        ios_install_sub: "Tap <i class='fas fa-share-from-square'></i> then \"Add to Home Screen\""
    }
};

const hoursData = [
    { d: "Lun·Mer·Ven / Mon·Wed·Fri", t: "16:00 - 19:00" }, 
    { d: "Mar·Gio / Tue·Thu", t: "10:00 - 13:00" },
    { d: "Sab-Dom / Sat-Sun", t: "Chiuso / Closed", cls: "closed" }
];

function initFerieBanner() {
    if (typeof CONFIG === 'undefined' || typeof CONFIG.getActiveAbsence !== 'function') return;
    const banner = document.getElementById('ferie-banner');
    const textEl = document.getElementById('ferie-banner-text');
    if (!banner || !textEl) return;

    const active = CONFIG.getActiveAbsence();

    if (!active) return;

    try {
        if (sessionStorage.getItem('ferie-dismissed-' + active.from)) return;
    } catch(e) {}

    textEl.textContent = active.note;
    banner.style.display = 'block';
}

function dismissFerieBanner() {
    const banner = document.getElementById('ferie-banner');
    if (banner) banner.style.display = 'none';
    try {
        const active = CONFIG.getActiveAbsence();
        if (active) sessionStorage.setItem('ferie-dismissed-' + active.from, '1');
    } catch(e) {}
}

function renderHours() {
    const container = document.getElementById('hours-table');
    if (!container) return;
    container.innerHTML = hoursData.map(h => '<div class="hours-row"><strong>' + h.d + '</strong><span class="' + (h.cls||'') + '">' + h.t + '</span></div>').join('');
}

function setLang(lang) {
    document.querySelectorAll('.lang-btn').forEach(function(b) { b.classList.remove('active'); });
    const btn = document.getElementById('btn-' + lang);
    if (btn) btn.classList.add('active');
    for (var key in i18n[lang]) {
        var el = document.querySelector('[data-i18n="' + key + '"]');
        if(el) el.innerHTML = i18n[lang][key];
    }
    localStorage.setItem('preferredLanguage', lang);
}

function scrollToBooking() {
    var el = document.getElementById('booking-section');
    if (el) window.scrollTo({top: el.offsetTop - 70, behavior: 'smooth'});
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
    localStorage.setItem(id + '_seen_v3', new Date().getTime());
}

window.addEventListener('DOMContentLoaded', function() {
    initTheme(); renderHours(); initFerieBanner();
    if(!localStorage.getItem('welcome-modal_seen_v3')) {
        const modal = document.getElementById('welcome-modal');
        if (modal) modal.style.display = 'flex';
    }
    var savedLang = localStorage.getItem('preferredLanguage');
    if(savedLang) setLang(savedLang);
    initInstallPrompt();
});

// --- PWA INSTALL PROMPT ---
var deferredInstallPrompt = null;

function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function initInstallPrompt() {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem('installDismissed')) return;

    if (isIOS()) {
        var banner = document.getElementById('install-banner-ios');
        if (banner) banner.style.display = 'block';
    }
}

window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (isInStandaloneMode() || localStorage.getItem('installDismissed')) return;
    var banner = document.getElementById('install-banner');
    if (banner) banner.style.display = 'block';
});

window.addEventListener('appinstalled', function() {
    var banner = document.getElementById('install-banner');
    if (banner) banner.style.display = 'none';
    deferredInstallPrompt = null;
});

function triggerInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(function(result) {
        if (result.outcome === 'accepted') {
            var banner = document.getElementById('install-banner');
            if (banner) banner.style.display = 'none';
        }
        deferredInstallPrompt = null;
    });
}

function dismissInstall() {
    var banner = document.getElementById('install-banner');
    if (banner) banner.style.display = 'none';
    var iosBanner = document.getElementById('install-banner-ios');
    if (iosBanner) iosBanner.style.display = 'none';
    localStorage.setItem('installDismissed', '1');
}
