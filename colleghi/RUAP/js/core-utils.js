// ====================================================
// core-utils.js — Pure helper functions (no state dep)
// ====================================================

import {
  EXCEL_EPOCH_OFFSET, MS_PER_DAY, DAY_KEYS, DAY_NAMES,
  COLOR_PALETTE, MONTHLY_WEEKS,
  DEFAULT_PLACE_SCHEDULE, DEFAULT_OPEN_DAYS,
  DEFAULT_PLACE_INACTIVE, DEFAULT_PLACE_OPEN_DAYS,
  DEFAULT_PLACE_ACTIVE_FROM, DEFAULT_PLACE_ACTIVE_UNTIL
} from './config.js?v=20261104d';
import { isItalianHoliday } from './holidays.js?v=20261104d';

// --- ID & Text ---

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function cleanDoctorName(name) {
  return name.replace(/^Dott\.\s*/i, '');
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Date helpers ---

export function excelDateToDate(excelDate) {
  if (typeof excelDate === 'number') {
    const utcDays = excelDate - EXCEL_EPOCH_OFFSET;
    return new Date(utcDays * MS_PER_DAY);
  }
  if (typeof excelDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(excelDate)) return new Date(excelDate + 'T00:00:00');
    if (/\//.test(excelDate)) {
      const parts = excelDate.split('/');
      if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(excelDate);
  }
  if (excelDate instanceof Date && !isNaN(excelDate)) return excelDate;
  return null;
}

export function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateShort(date) {
  return date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
}

// --- Business logic helpers (pure, no direct state dependency) ---

export function calculateWeeklyHoursByPatients(patients) {
  if (patients === undefined || patients === null || patients < 0) return 38;
  if (patients <= 400) return 38;
  if (patients <= 1000) return 24;
  if (patients <= 1200) return 12;
  if (patients <= 1500) return 6;
  return 0;
}

export function getDoctorColor(doctor) {
  return COLOR_PALETTE[doctor.colorIndex ?? 0] || COLOR_PALETTE[0];
}

export function getMonthlyBudget(doctor) {
  if (doctor.monthlyBudget != null) return doctor.monthlyBudget;
  return (doctor.weeklyHours ?? 38) * MONTHLY_WEEKS;
}

export function getProgressBarData(assigned, debt) {
  const pct = debt > 0 ? Math.min(100, Math.round((assigned / debt) * 100)) : 0;
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
  return { pct, barColor };
}

// --- DOM helpers ---

export function el(id) { return document.getElementById(id); }

export function toast(message, type = 'info', duration = 3000) {
  const container = el('toast-container');
  if (!container) return;
  const colors = { info: 'bg-slate-800', success: 'bg-green-600', warning: 'bg-amber-500', error: 'bg-red-500' };
  const toastEl = document.createElement('div');
  toastEl.className = `toast-item ${colors[type] || colors.info} text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all duration-300`;
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  toastEl.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toastEl);
  requestAnimationFrame(() => { toastEl.style.opacity = '1'; toastEl.style.transform = 'translateY(0)'; });
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(-10px)';
    setTimeout(() => toastEl.remove(), 300);
  }, duration);
}

// --- Domain queries that need state (passed as param) ---

/** Turni extra del mese (guardia/rinforzo), già filtrati per anno-mese. */
export function getExtraShiftsInMonth(extraShifts, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return (extraShifts || []).filter(x => String(x.dateKey || '').startsWith(prefix));
}

/** Ore di turni extra di un medico nel mese. */
export function getExtraHoursInMonth(docId, month, year, extraShifts) {
  return getExtraShiftsInMonth(extraShifts, year, month)
    .filter(x => x.doctorId === docId)
    .reduce((tot, x) => tot + (Number(x.hours) || 0), 0);
}

/** Il medico ha già un turno extra in quella data? */
export function hasExtraOnDate(docId, dateKey, extraShifts) {
  return (extraShifts || []).some(x => x.doctorId === docId && x.dateKey === dateKey);
}

/** Etichetta breve di un turno extra: «Guardia 6h». */
export function extraLabel(x) {
  return `${(x && x.type) || 'Turno'} ${Number(x && x.hours) || 0}h`;
}

export function getDoctorById(doctors, id) {
  return doctors.find(d => d.id === id);
}

export function isDoctorUnavailable(doctor, dateKey) {
  if (!doctor.unavailPeriods || doctor.unavailPeriods.length === 0) return false;
  const d = new Date(dateKey + 'T00:00:00');
  return doctor.unavailPeriods.some(p => {
    const from = new Date(p.from + 'T00:00:00');
    const to = new Date(p.to + 'T00:00:00');
    return d >= from && d <= to;
  });
}

/** Chiave giorno (lun…sab) di una data; null per la domenica. */
export function dayKeyOf(date) {
  const d = date.getDay();
  return d === 0 ? null : DAY_KEYS[d - 1];
}

/** Mappa delle sedi silenziate per mese (`CONFIG.placeInactive`). */
export function placeInactiveMap() {
  const cfg = (typeof CONFIG !== 'undefined' && CONFIG.placeInactive) ? CONFIG.placeInactive : null;
  return cfg || DEFAULT_PLACE_INACTIVE;
}

/** La sede è attiva (non silenziata) in quel mese? */
export function placeActiveFromMap() {
  const cfg = (typeof CONFIG !== 'undefined' && CONFIG.placeActiveFrom) ? CONFIG.placeActiveFrom : null;
  return cfg || DEFAULT_PLACE_ACTIVE_FROM;
}

export function placeActiveUntilMap() {
  const cfg = (typeof CONFIG !== 'undefined' && CONFIG.placeActiveUntil) ? CONFIG.placeActiveUntil : null;
  return cfg || DEFAULT_PLACE_ACTIVE_UNTIL;
}

/**
 * La sede è pianificabile in quel mese? Tre criteri, in quest'ordine:
 * (a) `placeInactive` la elenca per quel mese (buco puntuale);
 * (b) `placeActiveFrom` la fa partire più avanti (ym < from → non attiva);
 * (c) `placeActiveUntil` la chiude dopo (ym > until → non attiva).
 * `ym` è "YYYY-MM": il confronto è lessicografico, quindi funziona.
 * Una sede mai elencata da nessuna delle tre mappe è attiva da sempre.
 */
export function isPlaceActiveInMonth(place, year, month) {
  const ym = `${year}-${String(month + 1).padStart(2, '0')}`;
  const list = placeInactiveMap()[place];
  if (Array.isArray(list) && list.includes(ym)) return false;
  const from = placeActiveFromMap()[place];
  if (from && ym < String(from)) return false;
  const until = placeActiveUntilMap()[place];
  if (until && ym > String(until)) return false;
  return true;
}

/** Le sedi che il mese copre davvero (le silenziate restano fuori). */
export function activePlacesInMonth(places, year, month) {
  return (places || []).filter(p => isPlaceActiveInMonth(p, year, month));
}

/* Aperture per sede nei giorni chiusi: mappa effettiva in uso. Il seed
   (`CONFIG.placeOpenDays`) è il punto di partenza, ma la mappa è modificabile
   dall'app — una sede alla volta, sui giorni chiusi — e ogni browser la salva in
   localStorage. `state.js` la inietta qui con `setPlaceOpenDaysMap()` perché
   questa funzione è chiamata anche da helper puri e dal motore, che non possono
   leggere `state` (dipendenza circolare). */
let placeOpenDaysMap = null;

export function setPlaceOpenDaysMap(map) {
  placeOpenDaysMap = (map && typeof map === 'object' && !Array.isArray(map)) ? map : null;
}

/** Mappa delle aperture per sede attualmente in uso (override → seed → default). */
export function placeOpenDaysMapSnapshot() {
  if (placeOpenDaysMap) return placeOpenDaysMap;
  if (typeof CONFIG !== 'undefined' && CONFIG.placeOpenDays) return CONFIG.placeOpenDays;
  return DEFAULT_PLACE_OPEN_DAYS;
}

/** Giorni in cui QUESTA sede lavora anche se il giorno è chiuso per gli altri. */
export function placeOpenDays(place) {
  const days = placeOpenDaysMapSnapshot()[place];
  return Array.isArray(days) ? days : [];
}

/**
 * Chiusura straordinaria (prefestivo/ponte): vale come una festività.
 * Con `place`, la chiusura non vale per le sedi che quel giorno hanno
 * un'apertura straordinaria (`CONFIG.placeOpenDays`): es. la COT il 7 e il 24
 * dicembre lavora mentre ambulatori e RUAP sono chiusi.
 */
export function isClosedDay(closedDays, dateKey, place) {
  if (!Array.isArray(closedDays) || !closedDays.includes(dateKey)) return false;
  // L'apertura straordinaria di una sede non scavalca mai una FESTIVITÀ nazionale:
  // il motore salta comunque i festivi (`enumerateEmptySlots`), calendario ed
  // export devono dire la stessa cosa.
  if (place && placeOpenDays(place).includes(dateKey)
      && !isItalianHoliday(new Date(dateKey + 'T00:00:00'))) return false;
  return true;
}

/** Orario di una sede: {slots: null(=tutte le fasce), days: [...]}. */
export function getPlaceSchedule(place) {
  const configured = (typeof CONFIG !== 'undefined' && CONFIG.placeSchedules) ? CONFIG.placeSchedules[place] : null;
  const sch = configured || DEFAULT_PLACE_SCHEDULE[place] || {};
  const slots = Array.isArray(sch.slots) && sch.slots.length > 0 ? sch.slots.slice() : null;
  const days = Array.isArray(sch.days) && sch.days.length > 0 ? sch.days.slice() : DEFAULT_OPEN_DAYS.slice();
  return { slots, days };
}

/** Le fasce in cui una sede apre, nell'ordine di SLOTS. */
export function slotsForPlace(place, SLOTS) {
  const { slots } = getPlaceSchedule(place);
  return slots ? SLOTS.filter(s => slots.includes(s.key)) : SLOTS;
}

/**
 * La sede è aperta in questa data? (domenica mai)
 * Con `closedDays` si tiene conto anche delle chiusure straordinarie, salvo
 * l'apertura straordinaria della sede stessa: è il modo corretto di chiedere
 * «questa sede lavora quel giorno?» nel calendario, negli export e nel motore.
 */
export function isPlaceOpenOn(place, date, closedDays) {
  const dk = dayKeyOf(date);
  if (!dk) return false;
  if (!getPlaceSchedule(place).days.includes(dk)) return false;
  if (closedDays && isClosedDay(closedDays, toDateKey(date), place)) return false;
  return true;
}

export function isDoctorAvailableForSlot(doctor, dateKey, slotKey) {
  if (!doctor.availability) return false;
  if (isDoctorUnavailable(doctor, dateKey)) return false;
  const d = new Date(dateKey + 'T00:00:00');
  const dayKey = dayKeyOf(d);           // null = domenica
  if (!dayKey) return false;
  if (isItalianHoliday(d)) return false;
  const avail = doctor.availability[dayKey];
  if (!avail) return false;
  return avail[slotKey] === true;
}

function sumSlotHours(SLOTS, PLACES, assignments, predicate) {
  let hours = 0;
  SLOTS.forEach(slot => {
    PLACES.forEach(place => {
      if (predicate(slot, place)) hours += slot.hours;
    });
  });
  return hours;
}

export function getWeeklyAssignedHours(doctorId, weekStart, SLOTS, PLACES, assignments) {
  let hours = 0;
  for (let i = 0; i < 6; i++) {   // lun-sab: il sabato è aperto solo dove previsto
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dk = toDateKey(d);
    // Le sedi silenziate nel mese di QUEL giorno non contano (la settimana può
    // scavalcare due mesi): si filtra per giorno, non una volta per settimana.
    const dayPlaces = activePlacesInMonth(PLACES, d.getFullYear(), d.getMonth());
    hours += sumSlotHours(SLOTS, dayPlaces, assignments, (slot, place) =>
      assignments[`${dk}_${slot.key}_${place}`] === doctorId
    );
  }
  return hours;
}

export function getAssignedHoursInMonth(docId, month, year, SLOTS, PLACES, assignments) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Chi passa l'elenco globale (PLACES) deve comunque ottenere le ore del piano
  // REALE: le sedi silenziate in questo mese non entrano nel conteggio.
  const activePlaces = activePlacesInMonth(PLACES, year, month);
  let hours = 0;
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day);
    if (d.getDay() === 0) continue;
    const dk = toDateKey(d);
    hours += sumSlotHours(SLOTS, activePlaces, assignments, (slot, place) =>
      assignments[`${dk}_${slot.key}_${place}`] === docId
    );
  }
  return hours;
}

export function getRemainingMonthlyHours(doctor, month, year, SLOTS, PLACES, assignments) {
  return Math.max(0, getMonthlyBudget(doctor) - getAssignedHoursInMonth(doctor.id, month, year, SLOTS, PLACES, assignments));
}

export function getDefaultDoctors() {
  if (typeof CONFIG === 'undefined' || !CONFIG.doctors) return [];
  return CONFIG.doctors.map(d => ({
    ...d,
    availability: d.availability ? JSON.parse(JSON.stringify(d.availability)) : Object.fromEntries(
      // il sabato non ha il pomeriggio: si apre solo la mattina dove serve
      DAY_KEYS.map(k => [k, { mat: true, pom: k !== 'sab' }])
    ),
    unavailPeriods: d.unavailPeriods ? JSON.parse(JSON.stringify(d.unavailPeriods)) : [],
  }));
}

export function matchDoctorBySurname(doctors, excelName) {
  if (!excelName) return null;
  const cleanExcel = excelName.replace('Dott. ', '').trim().toLowerCase();
  let found = doctors.find(d => cleanDoctorName(d.name).toLowerCase() === cleanExcel);
  if (found) return found;
  const excelLast = cleanExcel.split(' ').slice(-1)[0];
  return doctors.find(d => {
    const docLast = cleanDoctorName(d.name).split(' ').slice(-1)[0].toLowerCase();
    return docLast === excelLast;
  });
}
