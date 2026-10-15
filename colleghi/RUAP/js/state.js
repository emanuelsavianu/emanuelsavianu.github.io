// ====================================================
// state.js — State engine, undo/redo, localStorage layer
// ====================================================

import {
  STORAGE_DOCTORS, STORAGE_ASSIGNMENTS, STORAGE_HISTORY,
  STORAGE_PLACES, STORAGE_SLOTS, STORAGE_DARK_MODE, STORAGE_CLOSED,
  STORAGE_VERSION_KEY, STORAGE_VERSION, HISTORY_MAX,
  DEFAULT_PLACES, DEFAULT_SLOTS
} from './config.js?v=20261015e';
import { el, toast, toDateKey, getWeekStart } from './core-utils.js?v=20261015e';

// --- Global mutable references (module-scoped) ---
export let PLACES = (typeof CONFIG !== 'undefined' && CONFIG.places) ? [...CONFIG.places] : DEFAULT_PLACES;
export let SLOTS = (typeof CONFIG !== 'undefined' && CONFIG.slots) ? CONFIG.slots : DEFAULT_SLOTS;

// --- State object ---
export let state = {
  doctors: [],
  assignments: {},
  places: [],
  slots: [],
  closedDays: [],
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  sidebarWeekStart: getWeekStart(new Date()),
  editingDoctorId: null,
  activeSlotKey: null,
  calendarView: 'monthly',
  calendarWeekStart: getWeekStart(new Date()),
};

// --- History ---
let historyStack = [];
let redoStack = [];
export let isProcessing = false;

export function setProcessing(v) { isProcessing = v; }

// --- Storage Layer ---

export function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_DOCTORS, JSON.stringify(state.doctors));
    localStorage.setItem(STORAGE_ASSIGNMENTS, JSON.stringify(state.assignments));
    localStorage.setItem(STORAGE_PLACES, JSON.stringify(state.places));
    localStorage.setItem(STORAGE_SLOTS, JSON.stringify(state.slots));
    localStorage.setItem(STORAGE_CLOSED, JSON.stringify(state.closedDays));
  } catch (e) {
    toast('Errore salvataggio: ' + e.message, 'error');
    console.error(e);
  }
}

export function loadFromStorage() {
  try {
    const docs = localStorage.getItem(STORAGE_DOCTORS);
    const asgn = localStorage.getItem(STORAGE_ASSIGNMENTS);
    const plcs = localStorage.getItem(STORAGE_PLACES);
    const slts = localStorage.getItem(STORAGE_SLOTS);
    const clos = localStorage.getItem(STORAGE_CLOSED);
    if (docs) state.doctors = JSON.parse(docs);
    if (asgn) state.assignments = JSON.parse(asgn);
    if (plcs) state.places = JSON.parse(plcs);
    if (slts) state.slots = JSON.parse(slts);
    if (clos) state.closedDays = JSON.parse(clos);
  } catch (e) { console.error(e); }
}

export function reloadPlaces() {
  if (state.places && state.places.length > 0) {
    PLACES = [...state.places];
  } else if (typeof CONFIG !== 'undefined' && CONFIG.places) {
    PLACES = [...CONFIG.places];
  } else {
    PLACES = [...DEFAULT_PLACES];
  }
}

/** Giorni di chiusura straordinaria (prefestivi, ponti): come le festività, il
    motore non li riempie e il calendario li mostra chiusi. Si semina dal config
    SOLO se l'utente non ha mai scritto il proprio elenco: una lista vuota salvata
    (tutti i giorni riaperti) è uno stato valido e non va sovrascritta. */
export function reloadClosedDays() {
  if (hasStoredClosedDays()) {
    if (!Array.isArray(state.closedDays)) state.closedDays = [];
    return;
  }
  if (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.closedDays)) {
    state.closedDays = [...CONFIG.closedDays];
  } else {
    state.closedDays = [];
  }
  // Il seme va anche SALVATO: altrimenti per un client esistente senza la chiave
  // il riallineo dal config si ripeterebbe a ogni caricamento (stato non
  // deterministico e non ispezionabile in localStorage).
  saveToStorage();
}

function hasStoredClosedDays() {
  try {
    return localStorage.getItem(STORAGE_CLOSED) !== null;
  } catch (e) {
    return false;
  }
}

export function reloadSlots() {
  if (state.slots && state.slots.length > 0) {
    SLOTS = [...state.slots];
  } else if (typeof CONFIG !== 'undefined' && CONFIG.slots) {
    SLOTS = CONFIG.slots.map(s => ({ ...s }));
  } else {
    SLOTS = DEFAULT_SLOTS.map(s => ({ ...s }));
  }
}

export function initDarkMode() {
  const enabled = localStorage.getItem(STORAGE_DARK_MODE) === 'true';
  if (enabled) document.documentElement.classList.add('dark');
  updateDarkModeButton();
}

function updateDarkModeButton() {
  const isDark = document.documentElement.classList.contains('dark');
  const icon = document.getElementById('darkmode-icon');
  const label = document.getElementById('darkmode-label');
  if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  if (label) label.textContent = isDark ? 'Chiaro' : 'Scuro';
}

export function toggleDarkMode() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  localStorage.setItem(STORAGE_DARK_MODE, html.classList.contains('dark') ? 'true' : 'false');
  updateDarkModeButton();
}

// --- History ---

// Modello (riscritto 2026-10-15): `historyStack` = stati PRE-azione (cima = ultima
// azione), `redoStack` = stati consumati dagli undo. Undo e redo spostano UNA sola
// azione; il modello precedente a indice (pushHistory registrava lo stato prima
// della mutazione e undo() leggeva stack[index-1]) saltava due azioni per volta.
function currentSnapshot() {
  return JSON.stringify({
    doctors: state.doctors, assignments: state.assignments, closedDays: state.closedDays
  });
}

function applySnapshot(snap) {
  state.assignments = snap.assignments;
  if (Array.isArray(snap.doctors)) state.doctors = snap.doctors;
  if (Array.isArray(snap.closedDays)) state.closedDays = snap.closedDays;
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify({ stack: historyStack, redo: redoStack }));
  } catch (e) { console.error(e); }
}

export function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_HISTORY);
    if (saved) {
      const data = JSON.parse(saved);
      historyStack = Array.isArray(data.stack) ? data.stack : [];
      redoStack = Array.isArray(data.redo) ? data.redo : [];
    }
  } catch (e) { console.error(e); }
}

/** Da chiamare PRIMA di mutare lo stato: registra lo stato corrente come punto di
    ripristino dell'undo e invalida la storia "futura" (redo). */
export function pushHistory() {
  historyStack.push(currentSnapshot());
  while (historyStack.length > HISTORY_MAX) historyStack.shift();
  redoStack = [];
  saveHistory();
  updateUndoRedoButtons();
}

/** Annulla l'ultima azione: ripristina lo stato pre-azione e mette da parte quello
    attuale, così il redo può riapplicarla. */
export function undo() {
  if (historyStack.length === 0) return;
  const current = currentSnapshot();
  const prev = historyStack.pop();
  redoStack.push(current);
  applySnapshot(JSON.parse(prev));
  saveToStorage();
  saveHistory();
  updateUndoRedoButtons();
}

export function redo() {
  if (redoStack.length === 0) return;
  const current = currentSnapshot();
  const next = redoStack.pop();
  historyStack.push(current);
  while (historyStack.length > HISTORY_MAX) historyStack.shift();
  applySnapshot(JSON.parse(next));
  saveToStorage();
  saveHistory();
  updateUndoRedoButtons();
}

export function clearHistory() {
  historyStack = [];
  redoStack = [];
  saveHistory();
  updateUndoRedoButtons();
}

export function updateUndoRedoButtons() {
  const undoBtn = el('btn-undo');
  const redoBtn = el('btn-redo');
  const noUndo = historyStack.length === 0;
  const noRedo = redoStack.length === 0;
  if (undoBtn) {
    undoBtn.classList.toggle('opacity-30', noUndo);
    undoBtn.classList.toggle('pointer-events-none', noUndo);
  }
  if (redoBtn) {
    redoBtn.classList.toggle('opacity-30', noRedo);
    redoBtn.classList.toggle('pointer-events-none', noRedo);
  }
}

// loadHistory is called from events.js init()
