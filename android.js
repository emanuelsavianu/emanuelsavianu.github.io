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
        book: "Prenota su Doctolib",
        booking_title: "Prenotazione su Doctolib",
        contacts: "Contatti Studio",
        label_doctolib_contacts: "Appuntamenti, Messaggi, Rinnovi Farmaci",
        label_secretary_fallback: "Segreteria (solo se non puoi usare Doctolib)",
        label_doctor: "Tel. Personale (Solo Urgenze)",
        label_secretary: "Segreteria e Appuntamenti",
        address: "Studio Medico Ippocrate",
        hours: "Orari di Studio",
        appt_only: "Solo su appuntamento",
        new_patients_alert: "<strong>Nuovi Pazienti:</strong> Prenotate \"Prima Visita\" su Doctolib. Vi iscriver\u00f2 all'assistenza in studio.",
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
        book: "Book on Doctolib",
        booking_title: "Book on Doctolib",
        contacts: "Office Contacts",
        label_doctolib_contacts: "Appointments, Messages, Prescription Renewals",
        label_secretary_fallback: "Reception (only if you cannot use Doctolib)",
        label_doctor: "Dr. Savianu (Emergencies only)",
        label_secretary: "Reception & Appointments",
        address: "Clinic Address",
        hours: "Opening Hours",
        appt_only: "By appointment only",
        new_patients_alert: "<strong>New Patients:</strong> Book a \u2018First Visit\u2019 on Doctolib. I will register you at the clinic.",
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
    localStorage.setItem(id + '_seen_v4', new Date().getTime());
}

function initDoctolibBanner() {
    var banner = document.getElementById('doctolib-banner');
    var textEl = document.getElementById('doctolib-banner-text');
    if (!banner || !textEl) return;
    var lang = localStorage.getItem('preferredLanguage') || 'it';
    var doctolibText = lang === 'it'
        ? 'Dal 30 giugno 2026 non si accettano più prenotazioni via email o sito savianu.it. Utilizza <strong>Doctolib</strong> per prenotazioni e richieste.'
        : 'From 30 June 2026, bookings via email or savianu.it are no longer accepted. Use <strong>Doctolib</strong> for appointments and requests.';
    textEl.innerHTML = doctolibText + ' <a href="https://tinyurl.com/Savianu" target="_blank" rel="noopener noreferrer" style="color:var(--accent);font-weight:700;text-decoration:underline;white-space:nowrap;">' + (lang === 'it' ? 'Clicca qui' : 'Click here') + ' →</a>';
}

window.addEventListener('DOMContentLoaded', function() {
    initTheme(); renderHours(); initDoctolibBanner();
    if(!localStorage.getItem('welcome-modal_seen_v4')) {
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
