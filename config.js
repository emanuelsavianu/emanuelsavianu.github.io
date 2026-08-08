// =================================================================
// GLOBAL CONFIGURATION — edit these values to update all pages
// =================================================================

const CONFIG = {
    // Vacation / closure / relocation banner config
    // 'from' and 'to' in YYYY-MM-DD format. Free-text note (Italian).
    ASSENZE: [
        {
            from: "2026-08-06",
            to: "2026-08-14",
            note: "🏖️ Studio chiuso dal 6 al 14 agosto 2026. Riprendo il 17 agosto. 🚨 Urgenze: Guardia Medica 116 117 — Emergenze: 112."
        }
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

    DOCTOLIB: {
        booking: 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/booking?source=profile',
        patientRequest: 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/patient-request?category=message',
        profile: 'https://tinyurl.com/Savianu'
    },

    GOOGLE_CAL: {
        iframe: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3doNfY80zH2XLETLNnYnaqXyu6ImECj_O5_WciNc6aBVZKQbtGYBK57W1g84TT7bvrHMUFzOhn?gv=true'
    }
};

CONFIG.getActiveAbsence = function() {
    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return CONFIG.ASSENZE.find(function(a) {
        const partsFrom = a.from.split('-').map(Number);
        const partsTo = a.to.split('-').map(Number);
        const fromUTC = Date.UTC(partsFrom[0], partsFrom[1] - 1, partsFrom[2]);
        const toUTC = Date.UTC(partsTo[0], partsTo[1] - 1, partsTo[2], 23, 59, 59, 999);
        return todayUTC >= fromUTC && todayUTC <= toUTC;
    }) || null;
};
