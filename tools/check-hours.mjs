#!/usr/bin/env node
// Test degli orari di apertura con orologi finti (nessuna dipendenza esterna).
// Verifica CONFIG.getOpenState() — la STESSA funzione che usano la home e il badge —
// su weekend, festività nazionali, Pasquetta e su fusi orari diversi.
//
// Usage: node tools/check-hours.mjs      (incluso in `npm test`)

import { CONFIG } from '../config.js';

let failed = 0;
let passed = 0;

function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { passed++; return; }
  failed++;
  console.log(`FAIL: ${label}\n      atteso:  ${e}\n      ottenuto:${a}`);
}

// Estrae solo i campi che ci interessano, per confronti leggibili.
const shape = (s) => {
  const o = { state: s.state };
  for (const k of ['closesAt', 'opensAt', 'inMinutes', 'nextDay', 'nextDelta', 'nextOpen']) {
    if (typeof s[k] === 'number') o[k] = s[k];
  }
  return o;
};
const at = (iso) => shape(CONFIG.getOpenState(new Date(iso)));

// ── 1. Orari normali (Europe/Rome, +02:00 in ottobre) ────────────────────
check('domenica 2026-10-04 11:18 → chiuso, riapre lunedì 09:30',
  at('2026-10-04T11:18:00+02:00'),
  { state: 'closed', nextDay: 1, nextDelta: 1, nextOpen: 9.5 });

check('lunedì 2026-10-05 11:18 → aperto, chiude 12:30',
  at('2026-10-05T11:18:00+02:00'),
  { state: 'open', closesAt: 12.5, inMinutes: 72 });

check('lunedì 2026-10-05 13:00 → chiuso, riapre oggi 16:00',
  at('2026-10-05T13:00:00+02:00'),
  { state: 'closed', opensAt: 16, inMinutes: 180 });

check('lunedì 2026-10-05 09:00 → chiuso, apre oggi 09:30',
  at('2026-10-05T09:00:00+02:00'),
  { state: 'closed', opensAt: 9.5, inMinutes: 30 });

check('lunedì 2026-10-05 19:00 (ora di chiusura) → chiuso, riapre martedì 09:30',
  at('2026-10-05T19:00:00+02:00'),
  { state: 'closed', nextDay: 2, nextDelta: 1, nextOpen: 9.5 });

check('sabato 2026-10-10 11:18 → chiuso, riapre lunedì 09:30',
  at('2026-10-10T11:18:00+02:00'),
  { state: 'closed', nextDay: 1, nextDelta: 2, nextOpen: 9.5 });

// ── 2. Festività nazionali (da CONFIG.HOLIDAYS, mai scritte a mano qui) ──
for (const mmdd of CONFIG.HOLIDAYS) {
  const iso = `2026-${mmdd}T11:18:00+01:00`;
  const s = CONFIG.getOpenState(new Date(iso));
  if (s.state !== 'closed') {
    failed++;
    console.log(`FAIL: festività ${mmdd} → atteso chiuso, ottenuto ${s.state}`);
  } else { passed++; }
}

// ── 3. Pasquetta (calcolata, non elencata) ──────────────────────────────
const em = CONFIG.easterMonday(2026);
check("Pasquetta 2026 = 04-06", em, '04-06');
check('Pasquetta 2026-04-06 (lunedì) → chiuso, riapre martedì',
  at('2026-04-06T11:18:00+02:00'),
  { state: 'closed', nextDay: 2, nextDelta: 1, nextOpen: 9.5 });

// ── 4. Ponte di Natale: 25/12 ven → lunedì 28 (26 sab + 27 dom chiusi) ──
check('Natale 2026-12-25 (venerdì) → chiuso, riapre lunedì 28',
  at('2026-12-25T11:18:00+01:00'),
  { state: 'closed', nextDay: 1, nextDelta: 3, nextOpen: 9.5 });

// ── 5. Indipendenza dal fuso del visitatore ─────────────────────────────
// Stesso istante assoluto, scritto in tre fusi: deve dare lo stesso esito.
const sameInstant = [
  '2026-10-05T13:18:00+02:00',  // Roma
  '2026-10-05T07:18:00-04:00',  // New York
  '2026-10-05T11:18:00+00:00',  // UTC
].map(at);
check('stesso istante in 3 fusi → identico',
  sameInstant[1], sameInstant[0]);
check('stesso istante in 3 fusi → identico (UTC)',
  sameInstant[2], sameInstant[0]);

// ── 6. Sanity: ogni giorno feriale apre e chiude due volte ──────────────
for (const d of [1, 2, 3, 4, 5]) {
  const slots = CONFIG.SCHEDULE[d];
  if (!slots || slots.length !== 2) { failed++; console.log(`FAIL: SCHEDULE[${d}] non ha 2 fasce`); }
  else passed++;
}

console.log('');
if (failed > 0) {
  console.error(`${failed} verifica/e fallita/e su ${passed + failed}.`);
  process.exit(1);
}
console.log(`OK: ${passed} verifiche orari (weekend, festività, Pasquetta, fusi, fasce).`);
