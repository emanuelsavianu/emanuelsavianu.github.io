// ====================================================
// events.js — Event listener setup, hotkeys, init
// ====================================================

import {
  state, SLOTS,
  saveToStorage, loadFromStorage, loadHistory, clearHistory,
  reloadPlaces, reloadSlots, reloadClosedDays, reloadPlaceOpenDays,
  initDarkMode, toggleDarkMode, undo, redo,
  updateUndoRedoButtons
} from './state.js?v=20261104a';

import {
  el, toast, getDefaultDoctors, toDateKey, getWeekStart,
  calculateWeeklyHoursByPatients
} from './core-utils.js?v=20261104a';

import {
  updateGeneraButtonLabel, renderAll, renderCalendar,
  renderMonthlyStats, renderSidebar,
  updateConflictsHeaderBadge, updateHeaderSubtitle,
  toggleCalendarView, setSearchQuery, setFilterAFT,
  closeAssignDropdown, closeDoctorModal, closeConflictModal,
  closeConflictsModal, closeInstructions,
  openDoctorModal, deleteDoctor, resetAssignments,
  saveDoctorFromModal, addUnavailPeriodRow,
  openAssignDropdown, assignDoctor, removeAssignment,
  openConflictsModal, autoResolveAllConflicts,
  exportJSON, importJSONFromFile, importExcelFromFile,
  exportExcel, exportPDF, exportPNG, exportCalendarScreenshot,
  buildPdfContent, buildPngContent,
  copyWeekFromCurrentView, pasteWeekToCurrentView,
  toggleMonthlyStats, toggleHideZeroDocs, toggleClosedDay,
  openPlaceOnClosedDay, closePlaceOnClosedDay,
  startWizard, restartWizard, wizardGoBack, wizardGoNext,
  selectDoctorColor, firstFreeColorIndex,
  unavailCalNav, unavailCalToday,
  openExtraModal, closeExtraModal, saveExtraShift, askDeleteExtra, updateExtraSummary,
  toggleFocusDoctor
} from './renderers.js?v=20261104a';

import { autoAssign, generateNextMonth } from './engine.js?v=20261104a';
import {
  STORAGE_DOCTORS, STORAGE_ASSIGNMENTS, STORAGE_HISTORY,
  STORAGE_PLACES, STORAGE_SLOTS, STORAGE_VERSION, STORAGE_VERSION_KEY,
  CONFIG_DATA_KEY,
  STORAGE_HEADER_COLLAPSED,
  STORAGE_FILL_ONLY,
  EXTERNAL_PREFIX
} from './config.js?v=20261104a';

// ====================================================
// 15. KEYBOARD SHORTCUTS
// ====================================================

function shiftMonth(delta) {
  state.calMonth += delta;
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
  else if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
}

/** Dopo undo/redo lo stato cambia: il calendario va ridisegnato. undo()/redo() di
    per sé non renderizzano, perciò una chiusura annullata restava visivamente
    chiusa (e i turni ripristinati non ricomparivano) fino al render successivo. */
function renderAfterHistory() {
  renderAll();
  renderMonthlyStats();
  updateConflictsHeaderBadge();
}

document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); renderAfterHistory(); }
  if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); renderAfterHistory(); }
  if (e.key === 'ArrowLeft' && mod) { e.preventDefault(); shiftMonth(-1); renderAll(); }
  if (e.key === 'ArrowRight' && mod) { e.preventDefault(); shiftMonth(1); renderAll(); }
  if (e.key === 'Escape') {
    closeAssignDropdown(); closeDoctorModal(); closeConflictModal(); closeInstructions(); closeExtraModal();
    closeHeaderActions();
  }
});

// ====================================================
// 16. KONAMI CODE EASTER EGG
// ====================================================
const konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIndex = 0;
document.addEventListener('keydown', (e) => {
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      toast('🎉 Sei un vero utente RUAP!', 'success');
      document.body.style.animation = 'rainbow 2s';
      setTimeout(() => { document.body.style.animation = ''; }, 2000);
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

// ====================================================
// 17. WIZARD NAV LISTENERS
// ====================================================
el('wizard-back')?.addEventListener('click', wizardGoBack);
el('wizard-next')?.addEventListener('click', wizardGoNext);

// ====================================================
// 18. TOP-LEVEL EVENT LISTENERS
// ====================================================

// --- Export ---
el('btn-export')?.addEventListener('click', exportJSON);
el('btn-export-excel')?.addEventListener('click', exportExcel);

// --- Import file triggers ---
el('import-file')?.addEventListener('change', importJSONFromFile);
el('import-excel-file')?.addEventListener('change', importExcelFromFile);

// --- Assign dropdown ---
el('assign-remove')?.addEventListener('click', () => {
  if (state.activeSlotKey) removeAssignment(state.activeSlotKey);
});
document.addEventListener('click', (e) => {
  const dropdown = el('assign-dropdown');
  if (dropdown && !dropdown.contains(e.target)) closeAssignDropdown();
});
el('assign-close')?.addEventListener('click', closeAssignDropdown);
el('assign-exception-btn')?.addEventListener('click', () => {
  el('assign-unavail-section')?.classList.toggle('hidden');
});
el('assign-custom-add')?.addEventListener('click', () => {
  const input = el('assign-custom-input');
  const name = input?.value.trim();
  if (!name || !state.activeSlotKey) return;
  assignDoctor(state.activeSlotKey, EXTERNAL_PREFIX + name);
});
el('assign-custom-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el('assign-custom-add')?.click();
});

// --- Doctor modal ---
el('modal-close')?.addEventListener('click', closeDoctorModal);
el('modal-cancel')?.addEventListener('click', closeDoctorModal);
el('modal-save')?.addEventListener('click', saveDoctorFromModal);
el('modal-patients')?.addEventListener('input', (e) => {
  const patients = parseInt(e.target.value) || 0;
  const hours = calculateWeeklyHoursByPatients(patients);
  el('modal-hours').value = hours;
});
el('btn-add-period')?.addEventListener('click', () => { addUnavailPeriodRow('', ''); });
el('unavail-cal-prev')?.addEventListener('click', () => unavailCalNav(-1));
el('unavail-cal-next')?.addEventListener('click', () => unavailCalNav(1));
el('btn-unavail-today')?.addEventListener('click', unavailCalToday);

// --- Color swatch selection ---
document.addEventListener('click', (e) => {
  const swatch = e.target.closest ? e.target.closest('.color-swatch') : null;
  if (swatch) selectDoctorColor(parseInt(swatch.dataset.index, 10));
});

// --- Mobile: pannello azioni dell'header ---
// A schermo stretto le ~15 azioni non stanno in una riga: senza pannello
// l'header sticky copriva più di metà viewport e nascondeva il calendario.
function closeHeaderActions() {
  el('header-actions')?.classList.remove('open');
  el('btn-toolbar-toggle')?.setAttribute('aria-expanded', 'false');
}
el('btn-toolbar-toggle')?.addEventListener('click', () => {
  const bar = el('header-actions');
  if (!bar) return;
  const open = bar.classList.toggle('open');
  el('btn-toolbar-toggle').setAttribute('aria-expanded', String(open));
});
el('header-actions')?.addEventListener('click', (e) => {
  if (e.target.closest('button')) closeHeaderActions();
});

// --- Banner (header) richiudibile -------------------------------------------
// Richiesta della referente (2026-10-20): su un laptop piccolo l'header sticky
// con la barra azioni va a capo e occupa troppo spazio verticale. Collassato
// diventa una riga sottile (logo + titolo + chevron); lo stato e' ricordato in
// localStorage e riapplicato prima del paint da uno script inline in <head>.
function applyHeaderCollapsed(collapsed) {
  document.documentElement.classList.toggle('ruap-header-collapsed', collapsed);
  const btn = el('btn-header-collapse');
  if (!btn) return;
  btn.setAttribute('aria-expanded', String(!collapsed));
  const label = collapsed ? 'Espandi l\u2019intestazione' : 'Riduci l\u2019intestazione';
  btn.setAttribute('title', label);
  btn.setAttribute('aria-label', label);
}
el('btn-header-collapse')?.addEventListener('click', () => {
  const collapsed = !document.documentElement.classList.contains('ruap-header-collapsed');
  applyHeaderCollapsed(collapsed);
  try { localStorage.setItem(STORAGE_HEADER_COLLAPSED, collapsed ? '1' : '0'); } catch (e) {}
});
applyHeaderCollapsed(localStorage.getItem(STORAGE_HEADER_COLLAPSED) === '1');

// --- Header and toolbar buttons ---
el('btn-add-doctor')?.addEventListener('click', () => openDoctorModal());
// Turni extra (guardia/rinforzo): bottone «+» flottante + modale
el('btn-add-extra')?.addEventListener('click', () => openExtraModal());
el('extra-modal-close')?.addEventListener('click', closeExtraModal);
el('extra-cancel')?.addEventListener('click', closeExtraModal);
el('extra-save')?.addEventListener('click', saveExtraShift);
el('extra-doctor')?.addEventListener('change', updateExtraSummary);
el('extra-hours')?.addEventListener('change', updateExtraSummary);
el('extra-date')?.addEventListener('change', updateExtraSummary);
// Cestino nell'elenco della modale e click sul chip del calendario (delegati:
// le celle vengono ricostruite a ogni render).
document.addEventListener('click', (e) => {
  const del = e.target instanceof Element ? e.target.closest('[data-extra-del]') : null;
  if (del) { e.preventDefault(); askDeleteExtra(del.dataset.extraDel); return; }
  const chip = e.target instanceof Element ? e.target.closest('[data-extra-id]') : null;
  if (chip) { e.preventDefault(); askDeleteExtra(chip.dataset.extraId); }
});

el('btn-auto-assign')?.addEventListener('click', autoAssign);
el('btn-genera-mese')?.addEventListener('click', generateNextMonth);

// «Solo celle vuote»: la spunta accompagna Genera/Auto-Assegna e si ricorda.
(function initFillOnlyToggle() {
  const cb = el('chk-fill-only');
  if (!cb) return;
  try {
    const saved = localStorage.getItem(STORAGE_FILL_ONLY);
    if (saved !== null) cb.checked = saved === '1';
  } catch (e) { /* storage bloccato: resta il default */ }
  const syncStyle = () => {
    const wrap = el('fill-only-wrap');
    if (wrap) wrap.style.borderColor = cb.checked ? '#c29b57' : '#e2e8f0';
    const lbl = el('fill-only-state');
    if (lbl) lbl.textContent = cb.checked ? 'Solo celle vuote' : 'Rifinitura libera';
  };
  cb.addEventListener('change', () => {
    try { localStorage.setItem(STORAGE_FILL_ONLY, cb.checked ? '1' : '0'); } catch (e) {}
    syncStyle();
  });
  syncStyle();
})();

// Chiusure straordinarie (prefestivi/ponti): il lucchetto nella cella del giorno.
// Delegato sul document perché le celle vengono ricostruite a ogni render.
document.addEventListener('click', (e) => {
  const btn = e.target instanceof Element ? e.target.closest('[data-closed-toggle]') : null;
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  toggleClosedDay(btn.dataset.closedToggle);
});

// Aperture per sede sui giorni chiusi («+ COT» nel giorno 31/12) e richiusura
// («COT ✕»). In fase di cattura: i bottoni stanno dentro la cella del giorno e
// il click non deve arrivare all'handler della griglia (assegnazione turno).
document.addEventListener('click', (e) => {
  const el2 = e.target instanceof Element ? e.target : null;
  if (!el2) return;
  const open = el2.closest('[data-open-place]');
  if (open) {
    e.preventDefault();
    e.stopPropagation();
    openPlaceOnClosedDay(open.dataset.openPlace, open.dataset.openDate);
    return;
  }
  const close = el2.closest('[data-close-place]');
  if (close) {
    e.preventDefault();
    e.stopPropagation();
    closePlaceOnClosedDay(close.dataset.closePlace, close.dataset.closeDate);
  }
}, true);
el('btn-pdf')?.addEventListener('click', exportPDF);
el('btn-export-png')?.addEventListener('click', exportPNG);
el('btn-export-screen')?.addEventListener('click', exportCalendarScreenshot);
el('btn-darkmode')?.addEventListener('click', toggleDarkMode);
el('btn-instructions')?.addEventListener('click', () => {
  el('instructions-modal')?.classList.remove('hidden');
});
el('instructions-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'instructions-modal') e.target.classList.add('hidden');
});
el('close-instructions')?.addEventListener('click', closeInstructions);
el('close-instructions-bottom')?.addEventListener('click', closeInstructions);
el('btn-reset-assignments')?.addEventListener('click', resetAssignments);
el('btn-conflicts')?.addEventListener('click', openConflictsModal);
el('conflicts-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'conflicts-modal') closeConflictsModal();
});
el('btn-restart-wizard')?.addEventListener('click', restartWizard);
el('btn-undo')?.addEventListener('click', () => { undo(); renderAfterHistory(); });
el('btn-redo')?.addEventListener('click', () => { redo(); renderAfterHistory(); });
el('btn-oggi')?.addEventListener('click', () => {
  const now = new Date();
  state.calYear = now.getFullYear();
  state.calMonth = now.getMonth();
  state.sidebarWeekStart = getWeekStart(now);
  state.calendarWeekStart = getWeekStart(now);
  if (state.calendarView === 'weekly') toggleCalendarView();
  renderAll();
  toast('Tornato a oggi', 'info');
});

// --- Delegated click handler on cal-grid (single wiring for slot buttons) ---
el('cal-grid')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-slot-key]');
  if (!btn) return;
  const slotKey = btn.dataset.slotKey;
  const dateKey = btn.dataset.dateKey;
  const place = btn.dataset.place;
  const slotType = btn.dataset.slotType;
  if (!slotKey || !dateKey || !place || !slotType) return;
  const slot = SLOTS.find(s => s.key === slotType);
  if (!slot) return;
  e.stopPropagation();
  openAssignDropdown(slotKey, slot, dateKey, place, btn.getBoundingClientRect());
});

// --- Calendar navigation ---
el('cal-prev')?.addEventListener('click', () => {
  if (state.calendarView === 'weekly') {
    state.calendarWeekStart.setDate(state.calendarWeekStart.getDate() - 7);
    state.sidebarWeekStart = new Date(state.calendarWeekStart);
  } else {
    shiftMonth(-1);
  }
  renderAll();
});
el('cal-next')?.addEventListener('click', () => {
  if (state.calendarView === 'weekly') {
    state.calendarWeekStart.setDate(state.calendarWeekStart.getDate() + 7);
    state.sidebarWeekStart = new Date(state.calendarWeekStart);
  } else {
    shiftMonth(1);
  }
  renderAll();
});
el('sidebar-week-prev')?.addEventListener('click', () => {
  state.sidebarWeekStart.setDate(state.sidebarWeekStart.getDate() - 7);
  state.calendarWeekStart = new Date(state.sidebarWeekStart);
  renderSidebar();
  if (state.calendarView === 'weekly') renderCalendar();
});
el('sidebar-week-next')?.addEventListener('click', () => {
  state.sidebarWeekStart.setDate(state.sidebarWeekStart.getDate() + 7);
  state.calendarWeekStart = new Date(state.sidebarWeekStart);
  renderSidebar();
  if (state.calendarView === 'weekly') renderCalendar();
});

// Search and filter
el('doctor-search')?.addEventListener('input', (e) => {
  setSearchQuery(e.target.value);
  renderSidebar();
});
el('filter-aft')?.addEventListener('change', (e) => {
  setFilterAFT(e.target.value);
  renderSidebar();
});

// ====================================================
// Expose critical functions globally for inline onclick
// ====================================================
window.openDoctorModal = openDoctorModal;
window.closeConflictModal = closeConflictModal;
window.closeConflictsModal = closeConflictsModal;
window.autoResolveAllConflicts = autoResolveAllConflicts;
window.copyWeekFromCurrentView = copyWeekFromCurrentView;
window.pasteWeekToCurrentView = pasteWeekToCurrentView;
window.toggleMonthlyStats = toggleMonthlyStats;
window.toggleCalendarView = toggleCalendarView;
window.toggleHideZeroDocs = toggleHideZeroDocs;
window.toggleClosedDay = toggleClosedDay;
// Esposti anche per le verifiche automatiche (nessun effetto sull'uso normale).
window.buildPdfContent = buildPdfContent;
window.buildPngContent = buildPngContent;

// --- Evidenziazione del medico -------------------------------------------
// Il bottone «occhio» sta DENTRO la card che apre la modale del medico: il click
// va intercettato in fase di cattura e fermato, altrimenti si apre anche il modal.
document.addEventListener('click', (e) => {
  const btn = e.target && e.target.closest ? e.target.closest('[data-focus-doctor]') : null;
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  toggleFocusDoctor(btn.dataset.focusDoctor);
}, true);

// ====================================================
// Update banner — shown when config.js data changes
// ====================================================

function seedStateFromConfig() {
  state.doctors = getDefaultDoctors();
  if (typeof CONFIG !== 'undefined' && CONFIG.places) state.places = [...CONFIG.places];
  if (typeof CONFIG !== 'undefined' && CONFIG.slots) state.slots = CONFIG.slots.map(s => ({...s}));
  if (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.closedDays)) state.closedDays = [...CONFIG.closedDays];
  // Aperture per sede nei giorni chiusi: come le chiusure, il seed vince quando
  // l'utente accetta «Aggiorna» (è così che un'apertura pubblicata — COT 31/12 —
  // arriva a tutti i browser).
  if (typeof CONFIG !== 'undefined' && CONFIG.placeOpenDays && typeof CONFIG.placeOpenDays === 'object') {
    state.placeOpenDays = JSON.parse(JSON.stringify(CONFIG.placeOpenDays));
  } else {
    state.placeOpenDays = {};
  }
  // Turni extra pubblicati nel seed (guardia/rinforzo): come le chiusure, il seed
  // vince quando l'utente accetta «Aggiorna».
  if (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.extraShifts)) {
    state.extraShifts = CONFIG.extraShifts.map(x => ({ ...x }));
  }
  if (typeof CONFIG !== 'undefined' && CONFIG.assignments) {
    state.assignments = {};
    Object.entries(CONFIG.assignments).forEach(([key, docId]) => {
      if (state.doctors.some(d => d.id === docId)) state.assignments[key] = docId;
    });
  }
}

function acceptConfigUpdate(version) {
  seedStateFromConfig();
  saveToStorage();
  clearHistory();
  if (version) localStorage.setItem(CONFIG_DATA_KEY, version);
  el('update-banner')?.classList.add('hidden');
  window.location.reload();
}

function dismissConfigUpdate(version) {
  if (version) localStorage.setItem(CONFIG_DATA_KEY, version);
  el('update-banner')?.classList.add('hidden');
}

/**
 * @param {string} version — the CONFIG.configDataVersion that triggered the banner
 */
function showUpdateBanner(version) {
  const banner = el('update-banner');
  if (!banner) return;
  banner.classList.remove('hidden');
  // Attach one-time handlers (re-attach on each show to avoid stale closures)
  el('update-banner-accept').onclick = () => acceptConfigUpdate(version);
  el('update-banner-keep').onclick = () => dismissConfigUpdate(version);
  el('update-banner-close').onclick = () => el('update-banner')?.classList.add('hidden');
}

// ====================================================
// 19. INIT
// ====================================================
function init() {
  initDarkMode();

  // Schema version check — clearing on mismatch ensures compatibility
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  const isVersionMismatch = storedVersion !== String(STORAGE_VERSION);
  if (isVersionMismatch) {
    localStorage.removeItem(STORAGE_DOCTORS);
    localStorage.removeItem(STORAGE_ASSIGNMENTS);
    localStorage.removeItem(STORAGE_HISTORY);
    localStorage.removeItem(CONFIG_DATA_KEY);
    localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
  }

  // Config data version check — detects changes to config.js content
  const configDataVersion = (typeof CONFIG !== 'undefined' && CONFIG.configDataVersion) || '';
  const seenConfigVersion = localStorage.getItem(CONFIG_DATA_KEY) || '';
  const hasConfigUpdate = configDataVersion && configDataVersion !== seenConfigVersion;

  loadFromStorage();
  reloadPlaces();
  reloadSlots();
  reloadClosedDays();
  reloadPlaceOpenDays();
  loadHistory();

  const isFirstRun = state.doctors.length === 0;

  if (isFirstRun) {
    const now = new Date();
    state.calYear = now.getFullYear();
    state.calMonth = now.getMonth();
    seedStateFromConfig();
    saveToStorage();
    if (configDataVersion) localStorage.setItem(CONFIG_DATA_KEY, configDataVersion);
    el('demo-banner')?.classList.remove('hidden');
  } else if (hasConfigUpdate) {
    showUpdateBanner(configDataVersion);
  }
  updateGeneraButtonLabel();
  renderAll();
  renderMonthlyStats();
  updateUndoRedoButtons();
  updateConflictsHeaderBadge();
  updateHeaderSubtitle();
}

init();
