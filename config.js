// =================================================================
// GLOBAL CONFIGURATION — edit these values to update all pages
// =================================================================

const CONFIG = {
    // Clinic hours (used for the badge logic)
    // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
    SCHEDULE: {
        1: [{ from: 16, to: 19 }],  // Mon
        2: [{ from: 10, to: 13 }],  // Tue
        3: [{ from: 16, to: 19 }],  // Wed
        4: [{ from: 10, to: 13 }],  // Thu
        5: [{ from: 16, to: 19 }],  // Fri
    },

    DOCTOLIB: {
        booking: 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/booking?source=profile',
        patientRequest: 'https://www.doctolib.it/medico-di-medicina-generale/castel-focognano/emanuel-savianu/patient-request?category=message',
        profile: 'https://tinyurl.com/Savianu'
    }
};
