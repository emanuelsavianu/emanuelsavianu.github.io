// ====================================================
// engine.js — Shift distribution algorithm
// ====================================================

import { state, PLACES, SLOTS, isProcessing, setProcessing, pushHistory, saveToStorage } from './state.js?v=20261015f';
import { isItalianHoliday } from './holidays.js?v=20261015f';
import { MONTHS_IT } from './config.js?v=20261015f';
import {
  toDateKey, isDoctorAvailableForSlot, getMonthlyBudget,
  getAssignedHoursInMonth, el, toast, isClosedDay
} from './core-utils.js?v=20261015f';
import { renderAll, renderMonthlyStats, updateConflictsHeaderBadge } from './renderers.js?v=20261015f';

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

// ====================================================
// Post-passo di copertura + equita' (2026-10-15)
// ====================================================
// Il greedy a passata singola lascia 1 cella scoperta e fino a 2 turni di scarto
// fra colleghi con la STESSA capacita': non e' un limite imposto dai vincoli, e'
// l'ordine con cui riempie (una volta che la cella resta vuota il greedy non ci
// torna piu'). Qui si applicano mosse SINGOLE — spostare un turno da un medico a
// un altro — sempre legali (disponibilita', assenze, niente doppio impegno nella
// stessa fascia, budget INTERO) e senza peggiorare i casi mattina-dopo-pomeriggio,
// finche' ne esiste una che migliora copertura o equita'. Deterministico: ordine
// fisso, prima mossa utile, tetto di iterazioni (niente rimpalli infiniti).

function hoursSnapshot(year, month) {
  const out = {};
  state.doctors.forEach(d => {
    out[d.id] = getAssignedHoursInMonth(d.id, month, year, SLOTS, PLACES, state.assignments);
  });
  return out;
}

function busyInSlot(docId, dateKey, slotKeyOnly, exceptKey) {
  const prefix = `${dateKey}_${slotKeyOnly}_`;
  for (const k in state.assignments) {
    if (k !== exceptKey && state.assignments[k] === docId && k.startsWith(prefix)) return true;
  }
  return false;
}

function blockOn(dateKey, slotKeyOnly, docId, exceptKey) {
  for (const k in state.assignments) {
    if (k === exceptKey) continue;
    if (state.assignments[k] !== docId) continue;
    if (k.startsWith(`${dateKey}_${slotKeyOnly}_`)) return true;
  }
  return false;
}

function shiftDayKey(dateKey, days) {
  const d = new Date(dateKey + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Variazione dei casi "mattina dopo pomeriggio" spostando il turno k da fromId a toId. */
function restDelta(slotKey, fromId, toId) {
  const parts = slotKey.split('_');
  const dateKey = parts[0];
  const slot = parts[1];
  let delta = 0;
  if (slot === 'mat') {
    const prev = shiftDayKey(dateKey, -1);
    if (blockOn(prev, 'pom', toId, null)) delta++;
    if (blockOn(prev, 'pom', fromId, slotKey)) delta--;
  } else {
    const next = shiftDayKey(dateKey, 1);
    if (blockOn(next, 'mat', toId, null)) delta++;
    if (blockOn(next, 'mat', fromId, slotKey)) delta--;
  }
  return delta;
}

function optimizeMonth(year, month) {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const byId = (id) => state.doctors.find(d => d.id === id);
  const slotHoursOf = (slot) => {
    const s = SLOTS.find(x => x.key === slot);
    return s ? s.hours : 6;
  };
  let hours = hoursSnapshot(year, month);
  let moves = 0;

  // --- 1. copertura: riempi le celle rimaste scoperte ---
  for (const item of enumerateEmptySlots(year, month)) {
    const parts = item.slotKey.split('_');
    const slotKeyOnly = parts[1];
    const slotHours = slotHoursOf(slotKeyOnly);
    const available = state.doctors.filter(d => isDoctorAvailableForSlot(d, item.dateKey, slotKeyOnly));

    // a) un medico disponibile, libero in quella fascia e con budget
    const free = available.find(d => !busyInSlot(d.id, item.dateKey, slotKeyOnly, null)
      && (hours[d.id] || 0) + slotHours <= getMonthlyBudget(d));
    if (free) {
      state.assignments[item.slotKey] = free.id;
      hours = hoursSnapshot(year, month);
      moves++;
      continue;
    }

    // b) nessuno libero: libera un medico disponibile spostando UN suo turno a chi
    //    puo' prenderlo (spesso e' il budget il blocco: spostando via un turno si
    //    libera il posto per questa cella), poi assegnagli la cella.
    let fixed = false;
    for (const d of available) {
      if (fixed) break;
      const mine = Object.keys(state.assignments)
        .filter(k => k.startsWith(monthPrefix) && state.assignments[k] === d.id).sort();
      const sameSlot = mine.filter(k => k.startsWith(`${item.dateKey}_${slotKeyOnly}_`));
      const movable = sameSlot.length > 0 ? sameSlot : mine;   // se e' occupato li', deve liberare QUELLA fascia
      for (const k of movable) {
        const kParts = k.split('_');
        const kSlot = kParts[1];
        const kHours = slotHoursOf(kSlot);
        // dopo lo spostamento d deve poter prendere la cella vuota
        if ((hours[d.id] || 0) - kHours + slotHours > getMonthlyBudget(d)) continue;
        const receiver = state.doctors.find(r => r.id !== d.id
          && isDoctorAvailableForSlot(r, kParts[0], kSlot)
          && !busyInSlot(r.id, kParts[0], kSlot, null)
          && (hours[r.id] || 0) + kHours <= getMonthlyBudget(r)
          && restDelta(k, d.id, r.id) <= 0);
        if (!receiver) continue;
        state.assignments[k] = receiver.id;
        state.assignments[item.slotKey] = d.id;
        hours = hoursSnapshot(year, month);
        moves += 2;
        fixed = true;
        break;
      }
    }
  }

  // --- 2. equita' delle ore DENTRO la stessa capacita' (stesso budget mensile) ---
  for (let iter = 0; iter < 300; iter++) {
    hours = hoursSnapshot(year, month);
    const groups = {};
    state.doctors.forEach(d => {
      const b = getMonthlyBudget(d);
      (groups[b] = groups[b] || []).push(d);
    });
    let applied = false;
    const budgets = Object.keys(groups).map(Number).sort((a, b) => b - a);
    for (const b of budgets) {
      const g = groups[b];
      if (g.length < 2) continue;
      const gMax = Math.max(...g.map(d => hours[d.id] || 0));
      const gMin = Math.min(...g.map(d => hours[d.id] || 0));
      if (gMax - gMin < 12) continue;                 // scarto accettato: mezzo turno
      const donors = [...g].sort((a, c) => (hours[c.id] || 0) - (hours[a.id] || 0)
        || (a.patients ?? 0) - (c.patients ?? 0));
      const receivers = [...g].sort((a, c) => (hours[a.id] || 0) - (hours[c.id] || 0)
        || (a.patients ?? 0) - (c.patients ?? 0));
      for (const from of donors) {
        if ((hours[from.id] || 0) !== gMax) continue;  // solo da chi e' al massimo del gruppo
        for (const to of receivers) {
          if ((hours[to.id] || 0) >= gMax - 6) continue;   // deve ridurre lo scarto di un turno
          for (const k of Object.keys(state.assignments)
            .filter(x => x.startsWith(monthPrefix) && state.assignments[x] === from.id).sort()) {
            const kParts = k.split('_');
            const kSlot = kParts[1];
            const kHours = slotHoursOf(kSlot);
            if (!isDoctorAvailableForSlot(to, kParts[0], kSlot)) continue;
            if (busyInSlot(to.id, kParts[0], kSlot, null)) continue;
            if ((hours[to.id] || 0) + kHours > getMonthlyBudget(to)) continue;
            if (restDelta(k, from.id, to.id) > 0) continue;   // non peggiorare il riposo
            state.assignments[k] = to.id;
            moves++;
            applied = true;
            break;
          }
          if (applied) break;
        }
        if (applied) break;
      }
      if (applied) break;
    }
    if (!applied) break;      // nessuna mossa legale migliorativa: mi fermo qui
  }

  return moves;
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
      // Rifinitura: copertura delle celle rimaste scoperte + equita' delle ore e
      // delle sedi (mosse singole sempre legali, vedi optimizeMonth). Gira anche
      // su un mese gia' pieno: se trova una mossa migliorativa la applica.
      const rifinite = optimizeMonth(year, month);
      if (count === 0 && rifinite === 0) {
        toast(`Nessun turno da generare in ${monthName}`, 'info');
        return;
      }
      saveToStorage();
      renderAll();
      renderMonthlyStats();
      updateConflictsHeaderBadge();
      toast(`Generati ${count} turni per ${monthName}` +
            (rifinite ? ` + ${rifinite} spostamenti di rifinitura` : ''), 'success');
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
