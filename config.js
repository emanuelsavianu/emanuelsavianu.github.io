// =================================================================
// GLOBAL CONFIGURATION — edit these values to update all pages
// (ES module — imported by app.js; no longer referenced in <script> tags)
//
// Questo file è l'UNICA fonte di verità per nome, recapiti, orari,
// indirizzo e link di prenotazione. Non duplicare questi valori in HTML.
// =================================================================

export const CONFIG = {
    // ── Identità e studio ────────────────────────────────────────────
    NAME: 'Dott. Emanuel Savianu',          // forma italiana (sito IT)
    NAME_EN: 'Dr. Emanuel Savianu',         // forma inglese (sito EN)
    STUDIO: 'Studio Medico Ippocrate',
    ADDRESS: 'Piazza Saione 3, Arezzo',

    // ── Recapiti ─────────────────────────────────────────────────────
    // display  = come si legge sul sito (con spazi, per leggibilità)
    // href     = link tel: canonico (internazionale, senza spazi)
    CONTACTS: {
        secretary: {
            label: 'Segreteria',
            labelEn: 'Front desk',
            display: '0575 910 904',
            href: 'tel:+390575910904'
        },
        private: {
            label: 'Telefono consulti privati',
            labelEn: 'Private consultations',
            display: '0575 171 3428',
            href: 'tel:+3905751713428'
        },
        email: {
            secretariat: 'segreteria@savianu.it',
            private: 'private@savianu.it',
            personal: 'emanuel@savianu.it'
        }
    },

    // ── Numeri di emergenza (fissi, non modificare) ──────────────────
    EMERGENCY: {
        emergenza: '112',
        guardia: '116 117'
    },

    // Vacation / closure / relocation banner config
    // 'from' and 'to' in YYYY-MM-DD format. Free-text note (Italian).
    ASSENZE: [
    ],

    // Opening hours (used for badge and hours tables) — Mon–Fri
    // 09:30–12:30 + 16:00–19:00, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
    SCHEDULE: {
        1: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],  // Mon
        2: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],  // Tue
        3: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],  // Wed
        4: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],  // Thu
        5: [{ from: 9.5, to: 12.5 }, { from: 16, to: 19 }],  // Fri
    },

    // Chiusure: festività nazionali italiane in formato MM-DD (valide ogni
    // anno) + il Lunedì dell'Angelo, calcolato automaticamente. Le chiusure
    // straordinarie dello studio vanno aggiunte qui (stesso formato MM-DD)
    // oppure tramite ASSENZE quando hanno una data precisa.
    HOLIDAYS: ['01-01', '01-06', '04-25', '05-01', '06-02', '08-15', '11-01', '12-08', '12-25', '12-26'],

    DOCTOLIB: {
        booking: 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/booking?source=profile',
        patientRequest: 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/patient-request?category=message',
        profile: 'https://prenota.savianu.it'
    },

    GOOGLE_CAL: {
        iframe: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1B_CFbVVkgJyLRQHZbycem1FEBy-DRubtJQrIvxm9DBt80Sm2jwvR6W2I73m1qEpjLLsstVXh5?gv=true'
    },

    // ── Avviso mostrato all'apertura dell'area Pazienti ──────────────
    // Testo editabile da qui: modificando NOTICE cambia il contenuto del
    // riquadro "Avviso Importante" su /ssn/ (data-i18n doctolib_modal_*).
    NOTICE: {
        it: {
            title: 'Avviso Importante',
            body: 'Gentili Pazienti, un caro saluto.<br><br>' +
                'Il <strong>Dott. Savianu visita solo su appuntamento</strong>. Si prega di prenotare tramite ' +
                '<a href="' + 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/booking?source=profile' + '" target="_blank" rel="noopener noreferrer" class="modal-link">Doctolib</a>.<br><br>' +
                '🚨 <strong>Urgenze, notte, weekend e festivi</strong><br>' +
                'Nei fine settimana, nei festivi e nelle ore notturne i medici di medicina generale non sono in servizio. ' +
                'Per qualsiasi urgenza in questi giorni — o se la segreteria non risponde — è sempre attiva la Guardia Medica ' +
                '24h/24 al 116 117. Per le emergenze, 112.<br><br>' +
                '📌 <strong>Appuntamenti e richieste</strong><br>' +
                'Prenotate o scrivetemi su Doctolib, oppure chiamate la segreteria al 0575 910 904.<br><br>' +
                'Dott. Emanuel Savianu<br><em>Medico di Medicina Generale</em>'
        },
        en: {
            title: 'Important Notice',
            body: 'Dear Patients, warm regards.<br><br>' +
                '<strong>Dr. Savianu sees patients by appointment only</strong>. Please book via ' +
                '<a href="' + 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/booking?source=profile' + '" target="_blank" rel="noopener noreferrer" class="modal-link">Doctolib</a>.<br><br>' +
                '🚨 <strong>Urgencies, night, weekends and public holidays</strong><br>' +
                'On weekends, public holidays and at night, general practitioners are not on duty. ' +
                'For any urgency on these days — or if the secretariat does not answer — the On-Call Doctor ' +
                '(Guardia Medica) is always available 24/7 at 116 117. For emergencies, 112.<br><br>' +
                '📌 <strong>Appointments and requests</strong><br>' +
                'Book or write to me on Doctolib, or call the secretariat at 0575 910 904.<br><br>' +
                'Dr. Emanuel Savianu<br><em>General Practitioner</em>'
        }
    },

    // Stato di apertura in un istante dato (o adesso). Unica implementazione:
    // la usano la home, il badge e il test con orologi finti (tools/check-hours.mjs).
    // Ritorna:
    //   { state:'open',    day, minutes, closesAt, inMinutes }
    //   { state:'closed',  day, minutes, opensAt, inMinutes }            -> apre più tardi oggi
    //   { state:'closed',  day, minutes, nextDay, nextDelta, nextOpen }  -> chiuso per oggi
    getOpenState: function(date) {
        const now = CONFIG.getRomeNow(date);
        const closedDay = CONFIG.isClosedDay(date);
        const slots = closedDay ? [] : (CONFIG.SCHEDULE[now.day] || []);
        for (let i = 0; i < slots.length; i++) {
            const opens = slots[i].from * 60;
            const closes = slots[i].to * 60;
            if (now.minutes >= opens && now.minutes < closes) {
                return { state: 'open', day: now.day, minutes: now.minutes,
                         closesAt: slots[i].to, inMinutes: closes - now.minutes };
            }
            if (now.minutes < opens) {
                return { state: 'closed', day: now.day, minutes: now.minutes,
                         opensAt: slots[i].from, inMinutes: opens - now.minutes };
            }
        }
        const base = date ? date.getTime() : Date.now();
        for (let d = 1; d <= 10; d++) {
            const dt = new Date(base + d * 86400000);
            if (CONFIG.isClosedDay(dt)) continue;
            const nd = CONFIG.getRomeNow(dt).day;
            if (CONFIG.SCHEDULE[nd] && CONFIG.SCHEDULE[nd].length) {
                return { state: 'closed', day: now.day, minutes: now.minutes,
                         nextDay: nd, nextDelta: d, nextOpen: CONFIG.SCHEDULE[nd][0].from };
            }
        }
        return { state: 'closed', day: now.day, minutes: now.minutes };
    },

    getActiveAbsence: function() {
        const now = new Date();
        const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        return CONFIG.ASSENZE.find(function(a) {
            const partsFrom = a.from.split('-').map(Number);
            const partsTo = a.to.split('-').map(Number);
            const fromUTC = Date.UTC(partsFrom[0], partsFrom[1] - 1, partsFrom[2]);
            const toUTC = Date.UTC(partsTo[0], partsTo[1] - 1, partsTo[2], 23, 59, 59, 999);
            return todayUTC >= fromUTC && todayUTC <= toUTC;
        }) || null;
    },

    // Ora dello studio (Europe/Rome), indipendente dal fuso del visitatore.
    // Ritorna { date: 'YYYY-MM-DD', day: 0..6 (0=domenica), minutes: minuti dalla mezzanotte }.
    getRomeNow: function(date) {
        const d = date || new Date();
        const parts = {};
        new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short'
        }).formatToParts(d).forEach(function(p) { parts[p.type] = p.value; });
        const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday];
        // '24' può comparire a mezzanotte con hour12:false in alcune ICU
        const hh = parseInt(parts.hour, 10) % 24;
        return {
            date: parts.year + '-' + parts.month + '-' + parts.day,
            day: wd,
            minutes: hh * 60 + parseInt(parts.minute, 10)
        };
    },

    // Lunedì dell'Angelo in formato MM-DD per l'anno indicato.
    easterMonday: function(year) {
        const a = year % 19, b = Math.floor(year / 100), c = year % 100;
        const d = Math.floor(b / 4), e = b % 4;
        const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4), k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        const em = new Date(Date.UTC(year, month - 1, day + 1));
        return String(em.getUTCMonth() + 1).padStart(2, '0') + '-' + String(em.getUTCDate()).padStart(2, '0');
    },

    // true se la data (oggi per default) è domenica, festività nazionale o
    // Lunedì dell'Angelo → lo studio è chiuso.
    isClosedDay: function(date) {
        const now = CONFIG.getRomeNow(date);
        if (now.day === 0 || now.day === 6) return true;
        const mmdd = now.date.slice(5);
        if (CONFIG.HOLIDAYS.indexOf(mmdd) !== -1) return true;
        return mmdd === CONFIG.easterMonday(parseInt(now.date.slice(0, 4), 10));
    }
};
