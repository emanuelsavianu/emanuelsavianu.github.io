// ====================================================
// engine.js — Shift distribution algorithm
// ====================================================

import { state, PLACES, SLOTS, isProcessing, setProcessing, pushHistory, saveToStorage } from './state.js?v=20261015e';
import { isItalianHoliday } from './holidays.js?v=20261015e';
import { MONTHS_IT } from './config.js?v=20261015e';
import {
  toDateKey, isDoctorAvailableForSlot, getMonthlyBudget,
  getAssignedHoursInMonth, el, toast, isClosedDay
} from './core-utils.js?v=20261015e';
import { renderAll, renderMonthlyStats, updateConflictsHeaderBadge } from './renderers.js?v=20261015e';

// ====================================================
// 10. AUTO-ASSIGN & GENERATION
// ====================================================

export function enumerateEmptySlots(year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const slots = [];
  for (let day = 1; day <= lastDay; day++) {
    const cellDate = new Date(year, month, day);
    if (cellDate.getDay() === 0 || cellDate.getDay() === 6 || isItalianHoliday(cellDate)) continue;
    const dateKey = toDateKey(cellDate);
    // Chiusure straordinarie (prefestivi, ponti): come le festività, niente turni
    if (isClosedDay(state.closedDays, dateKey)) continue;
    SLOTS.forEach(slot => {
      PLACES.forEach(place => {
        const slotKey = `${dateKey}_${slot.key}_${place}`;
        if (!state.assignments[slotKey]) slots.push({ dateKey, slotKey, cellDate });
      });
    });
  }
  return slots;
}

function pickDoctorForSlot(primaryDocs, poolDocs, place, dateKey, slotKeyOnly, assignedInTarget, getEffectiveRemaining, slotHours) {
  const notBusy = (doc) => {
    const prefix = `${dateKey}_${slotKeyOnly}_`;
    return !Object.entries(state.assignments).some(([k, v]) => v === doc.id && k.startsWith(prefix));
  };

  // Prevent mat (08-14) after pom (14-20) on the previous calendar day.
  // NOT a hard constraint (referente turni, 2026-10-15): it is a PREFERENCE —
  // rested doctors are picked first, and a doctor who worked the previous
  // afternoon is used only when no other candidate is available.
  const hasConsecutiveShiftConflict = (doc) => {
    if (slotKeyOnly !== 'mat') return false;
    const parts = dateKey.split('-');
    const prevDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateKey = toDateKey(prevDate);
    return Object.entries(state.assignments).some(([k, v]) =>
      v === doc.id && k.startsWith(prevDateKey + '_pom_')
    );
  };

  // Budget must cover the WHOLE slot: no partial overshoot (e.g. 3h left cannot take a 6h shift)
  const filterAvailable = (docs) => docs.filter(doc =>
    isDoctorAvailableForSlot(doc, dateKey, slotKeyOnly)
    && notBusy(doc)
    && getEffectiveRemaining(doc) >= slotHours
  );

  const availablePrimary = filterAvailable(primaryDocs);
  const availablePool = filterAvailable(poolDocs);

  // La preferenza di sede NON e' piu' un tier rigido (referente, 2026-10-15:
  // «cerca di trovare il modo che sia abbastanza equilibrato sia le ore che le
  // sedi»). Il tier rigido faceva dipendere le ore dalla numerosita' del gruppo
  // della sede (chi preferiva una sede con pochi "titolari" assorbiva tutti i suoi
  // turni: dicembre dava 42h a chi copriva M.S.Savino in 7 turni e 84h a chi
  // copriva Arezzo in 14). Ora il PRIMO criterio sono le ore del mese su tutte le
  // sedi; la preferenza decide a parita' di ore, poi la rotazione fra sedi.
  const shiftsAtPlace = (doc) => {
    let n = 0;
    const suffix = '_' + place;
    for (const k in state.assignments) {
      if (state.assignments[k] === doc.id && k.startsWith(ym) && k.endsWith(suffix)) n++;
    }
    return n;
  };
  const ym = dateKey.slice(0, 7);

  // Rest first: rested doctors are tried before doctors coming off the previous
  // afternoon (preference, not a hard constraint — referente 2026-10-15).
  const candidates = availablePrimary.concat(availablePool);
  const priorityGroups = [
    candidates.filter(d => !hasConsecutiveShiftConflict(d)),
    candidates.filter(d => hasConsecutiveShiftConflict(d)),
  ];

  for (const group of priorityGroups) {
    if (group.length > 0) {
      // Fairness first: the doctor with the FEWEST assigned hours this month wins.
      // On a tie: the doctor who prefers this place (or has no preference), then
      // non-pool, then whoever has done fewer shifts AT THIS PLACE (so cross-site
      // work is spread), then the one with FEWER patients.
      group.sort((a, b) => {
        const hoursDiff = (assignedInTarget[a.id] || 0) - (assignedInTarget[b.id] || 0);
        if (hoursDiff !== 0) return hoursDiff;
        const prefA = (a.preferredPlace === place || !a.preferredPlace) ? 0 : 1;
        const prefB = (b.preferredPlace === place || !b.preferredPlace) ? 0 : 1;
        if (prefA !== prefB) return prefA - prefB;
        if (!!a.isPool !== !!b.isPool) return a.isPool ? 1 : -1;
        const placeDiff = shiftsAtPlace(a) - shiftsAtPlace(b);
        if (placeDiff !== 0) return placeDiff;
        return (a.patients ?? 0) - (b.patients ?? 0);
      });
      return group[0];
    }
  }
  return null;
}

export function runAutoAssignForMonth(year, month) {
  if (isProcessing) return;
  if (state.doctors.length === 0) {
    toast('Aggiungi prima dei medici', 'warning');
    return;
  }

  setProcessing(true);
  pushHistory();
  const monthName = MONTHS_IT[month];
  const slotsToProcess = enumerateEmptySlots(year, month);

  if (slotsToProcess.length === 0) {
    setProcessing(false);
    toast(`Nessun turno vuoto in ${monthName}`, 'info');
    return;
  }

  const assignedInTarget = {};
  state.doctors.forEach(d => { assignedInTarget[d.id] = getAssignedHoursInMonth(d.id, month, year, SLOTS, PLACES, state.assignments); });
  function getEffectiveRemaining(doc) {
    return Math.max(0, getMonthlyBudget(doc) - (assignedInTarget[doc.id] || 0));
  }

  const primaryDocs = state.doctors.filter(d => !d.isPool);
  const poolDocs = state.doctors.filter(d => d.isPool);

  const progressBar = el('autoassign-progress-bar');
  const progressLabel = el('autoassign-progress-label');
  const loadingEl = el('autoassign-loading');
  const loadingText = el('autoassign-loading-text');
  loadingEl.classList.remove('hidden');
  loadingText.textContent = `Generazione turni ${monthName}...`;
  let count = 0;
  const total = slotsToProcess.length;

  function processChunk(index) {
    const batchSize = 20;
    const end = Math.min(index + batchSize, total);

    for (let i = index; i < end; i++) {
      const { dateKey, slotKey, cellDate } = slotsToProcess[i];
      const parts = slotKey.split('_');
      const slotKeyOnly = parts[1];
      const slotDef = SLOTS.find(s => s.key === slotKeyOnly);
      const slotHours = slotDef ? slotDef.hours : 6;
      const place = parts.slice(2).join('_');

      const chosen = pickDoctorForSlot(primaryDocs, poolDocs, place, dateKey, slotKeyOnly, assignedInTarget, getEffectiveRemaining, slotHours);
      if (!chosen) continue;

      state.assignments[slotKey] = chosen.id;
      assignedInTarget[chosen.id] = (assignedInTarget[chosen.id] || 0) + slotHours;
      count++;
    }

    const pct = Math.round((end / total) * 100);
    progressBar.style.width = pct + '%';
    progressLabel.textContent = `${end} / ${total} turni`;
    loadingText.textContent = `Generazione turni ${monthName}... ${pct}%`;

    if (end < total) {
      requestAnimationFrame(() => processChunk(end));
    } else {
      loadingEl.classList.add('hidden');
      progressBar.style.width = '0%';
      setProcessing(false);
      if (count === 0) {
        toast(`Nessun turno da generare in ${monthName}`, 'info');
        return;
      }
      saveToStorage();
      renderAll();
      renderMonthlyStats();
      updateConflictsHeaderBadge();
      toast(`Generati ${count} turni per ${monthName}`, 'success');
    }
  }

  processChunk(0);
}

export function autoAssign() {
  runAutoAssignForMonth(state.calYear, state.calMonth);
}

export function generateNextMonth() {
  const nextMonth = state.calMonth + 1;
  const year = nextMonth > 11 ? state.calYear + 1 : state.calYear;
  runAutoAssignForMonth(year, nextMonth % 12);
}
