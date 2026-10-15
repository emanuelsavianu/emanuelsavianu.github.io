// ====================================================
// engine.js — Shift distribution algorithm
// ====================================================

import { state, PLACES, SLOTS, isProcessing, setProcessing, pushHistory, saveToStorage } from './state.js?v=20261015g';
import { isItalianHoliday } from './holidays.js?v=20261015g';
import { MONTHS_IT } from './config.js?v=20261015g';
import {
  toDateKey, isDoctorAvailableForSlot, getMonthlyBudget,
  getAssignedHoursInMonth, el, toast, isClosedDay
} from './core-utils.js?v=20261015g';
import { renderAll, renderMonthlyStats, updateConflictsHeaderBadge } from './renderers.js?v=20261015g';

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
// Il greedy a passata singola NON e' un limite imposto dai vincoli: lascia celle
// scoperte e scarti di ore che poche mosse legali chiudono (lo ha dimostrato una
// review avversariale). Qui si lavora solo con mosse SEMPRE legali — spostare un
// turno da un medico a un altro, con disponibilita', assenze, niente doppio
// impegno nella stessa fascia, budget INTERO — e senza peggiorare i casi
// mattina-dopo-pomeriggio. Tre passaggi, deterministici (ordine fisso, prima
// mossa utile/migliore, tetto di iterazioni):
//   1. copertura: riempie le celle rimaste scoperte;
//   2. mosse singole: hill-climb sulle ore;
//   3. trasferimenti in due salti A -> B -> C (B fa da tramite), che servono
//      quando il collega meno carico non puo' ricevere direttamente un turno.
// Obiettivo: somma delle differenze a coppie DENTRO ogni gruppo di pari budget
// mensile (il gruppo e' la capacita' reale: budget uguale = stesso monte ore).
// Chi e' gia' il meno carico del suo gruppo non cede mai turni: nessuno viene
// "spogliato" per pareggiare gli altri.

function hoursSnapshot(year, month) {
  const out = {};
  state.doctors.forEach(d => {
    out[d.id] = getAssignedHoursInMonth(d.id, month, year, SLOTS, PLACES, state.assignments);
  });
  return out;
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
  const budgetOf = (doc) => getMonthlyBudget(doc);
  const keysOf = (docId) => Object.keys(state.assignments)
    .filter(k => k.startsWith(monthPrefix) && (!docId || state.assignments[k] === docId))
    .sort();

  let hours = hoursSnapshot(year, month);
  let moves = 0;

  // Indice "medico|data|fascia": rende O(1) il controllo "impegnato in quella
  // fascia in un'ALTRA sede" (senza, la ricerca in due salti e' troppo lenta).
  let busy = new Set();
  const rebuildBusy = () => {
    busy = new Set();
    for (const k in state.assignments) {
      const p = k.split('_');
      busy.add(`${state.assignments[k]}|${p[0]}|${p[1]}`);
    }
  };
  rebuildBusy();
  const isBusy = (docId, dateKey, slotKeyOnly) => busy.has(`${docId}|${dateKey}|${slotKeyOnly}`);

  /** Il medico `doc` puo' prendere il turno `slotKey` (liberandolo da `fromId`)? */
  const canReceive = (doc, slotKey, fromId, h) => {
    const p = slotKey.split('_');
    if (doc.id === fromId) return false;
    if (!isDoctorAvailableForSlot(doc, p[0], p[1])) return false;
    if (isBusy(doc.id, p[0], p[1])) return false;
    if ((h[doc.id] || 0) + slotHoursOf(p[1]) > budgetOf(doc)) return false;
    return restDelta(slotKey, fromId, doc.id) <= 0;
  };

  // --- 1. copertura: riempi le celle rimaste scoperte ---
  for (const item of enumerateEmptySlots(year, month)) {
    const parts = item.slotKey.split('_');
    const slotKeyOnly = parts[1];
    const slotHours = slotHoursOf(slotKeyOnly);
    const available = state.doctors.filter(d => isDoctorAvailableForSlot(d, item.dateKey, slotKeyOnly));

    // a) un medico disponibile, libero in quella fascia e con budget
    const free = available.find(d => !isBusy(d.id, item.dateKey, slotKeyOnly)
      && (hours[d.id] || 0) + slotHours <= budgetOf(d));
    if (free) {
      state.assignments[item.slotKey] = free.id;
      rebuildBusy();
      hours = hoursSnapshot(year, month);
      moves++;
      continue;
    }

    // b) nessuno libero: libera un medico disponibile spostando UN suo turno a chi
    //    puo' prenderlo (spesso e' il budget pieno il blocco: spostando via un
    //    turno si libera il posto), poi assegnagli la cella.
    let fixed = false;
    for (const d of available) {
      if (fixed) break;
      const mine = keysOf(d.id);
      const sameSlot = mine.filter(k => k.startsWith(`${item.dateKey}_${slotKeyOnly}_`));
      const movable = sameSlot.length > 0 ? sameSlot : mine;
      for (const k of movable) {
        const kParts = k.split('_');
        const kSlot = kParts[1];
        const kHours = slotHoursOf(kSlot);
        if ((hours[d.id] || 0) - kHours + slotHours > budgetOf(d)) continue;
        const receiver = state.doctors.find(r => canReceive(r, k, d.id, hours));
        if (!receiver) continue;
        state.assignments[k] = receiver.id;
        state.assignments[item.slotKey] = d.id;
        rebuildBusy();
        hours = hoursSnapshot(year, month);
        moves += 2;
        fixed = true;
        break;
      }
    }
  }

  // --- 2/3. equita' delle ore ---
  const pairwise = (h) => {
    const groups = {};
    state.doctors.forEach(d => {
      const b = budgetOf(d);
      (groups[b] = groups[b] || []).push(h[d.id] || 0);
    });
    let tot = 0;
    for (const b in groups) {
      const v = groups[b];
      for (let i = 0; i < v.length; i++) {
        for (let j = i + 1; j < v.length; j++) tot += Math.abs(v[i] - v[j]);
      }
    }
    return tot;
  };
  const aboveGroupMin = (h, doc) => {
    const g = state.doctors.filter(d => budgetOf(d) === budgetOf(doc)).map(d => h[d.id] || 0);
    return (h[doc.id] || 0) > Math.min(...g);
  };

  const singleMovePass = () => {
    const base = pairwise(hours);
    let best = null;
    for (const k of keysOf()) {
      const from = byId(state.assignments[k]);
      if (!from || !aboveGroupMin(hours, from)) continue;
      for (const to of state.doctors) {
        if (!canReceive(to, k, from.id, hours)) continue;
        const sh = slotHoursOf(k.split('_')[1]);
        const h2 = { ...hours };
        h2[from.id] -= sh;
        h2[to.id] = (h2[to.id] || 0) + sh;
        const gain = base - pairwise(h2);
        if (gain > 0 && (!best || gain > best.gain)) best = { k, toId: to.id, gain };
      }
    }
    return best;
  };

  const twoHopPass = () => {
    // Trasferimento A -> B -> C: A cede un turno a B, B ne cede uno a C (B resta
    // con le stesse ore). Serve quando C non puo' ricevere direttamente da A, per
    // disponibilita' o perche' il riposo peggiorerebbe.
    const base = pairwise(hours);
    const pairs = [];
    for (const a of state.doctors) {
      if (!aboveGroupMin(hours, a)) continue;
      for (const c of state.doctors) {
        if (c.id === a.id) continue;
        const h2 = { ...hours };
        h2[a.id] -= 6;
        h2[c.id] = (h2[c.id] || 0) + 6;
        const gain = base - pairwise(h2);
        if (gain > 0) pairs.push({ gain, aId: a.id, cId: c.id });
      }
    }
    pairs.sort((x, y) => y.gain - x.gain || (x.aId + x.cId).localeCompare(y.aId + y.cId));
    for (const { aId, cId } of pairs) {
      const c = byId(cId);
      for (const k1 of keysOf(aId)) {
        for (const b of state.doctors) {
          if (b.id === aId || b.id === cId) continue;
          if (!canReceive(b, k1, aId, hours)) continue;
          const hMid = { ...hours };
          hMid[aId] -= 6;
          hMid[b.id] = (hMid[b.id] || 0) + 6;
          for (const k2 of keysOf(b.id)) {
            if (k2 === k1) continue;
            if (!canReceive(c, k2, b.id, hMid)) continue;
            return { k1, bId: b.id, k2, cId };
          }
        }
      }
    }
    return null;
  };

  for (let iter = 0; iter < 100; iter++) {
    if (pairwise(hours) === 0) break;
    const one = singleMovePass();
    if (one) {
      state.assignments[one.k] = one.toId;
      rebuildBusy();
      hours = hoursSnapshot(year, month);
      moves++;
      continue;
    }
    const two = twoHopPass();
    if (!two) break;                    // nessuna mossa legale migliorativa
    state.assignments[two.k1] = two.bId;
    state.assignments[two.k2] = two.cId;
    rebuildBusy();
    hours = hoursSnapshot(year, month);
    moves += 2;
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
    // Mese gia' pieno: la rifinitura gira lo stesso, cosi' si puo' chiedere
    // copertura/equita' senza svuotare il mese (prima si usciva qui e i
    // commenti promettevano un comportamento che il codice non aveva).
    const rifinite = optimizeMonth(year, month);
    setProcessing(false);
    if (rifinite > 0) {
      saveToStorage();
      renderAll();
      renderMonthlyStats();
      updateConflictsHeaderBadge();
      toast(`${rifinite} spostamenti di rifinitura in ${monthName}`, 'success');
    } else {
      toast(`Nessun turno vuoto in ${monthName}`, 'info');
    }
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
      // Rifinitura: copertura + equita' (mosse singole e in due salti, sempre legali).
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
