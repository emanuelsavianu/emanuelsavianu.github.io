// ====================================================
// state.js — State engine, undo/redo, localStorage layer
// ====================================================

import {
  STORAGE_DOCTORS, STORAGE_ASSIGNMENTS, STORAGE_HISTORY,
  STORAGE_PLACES, STORAGE_SLOTS, STORAGE_DARK_MODE,
  STORAGE_VERSION_KEY, STORAGE_VERSION, HISTORY_MAX,
  DEFAULT_PLACES, DEFAULT_SLOTS
} from './config.js';
import { el, toast, toDateKey, getWeekStart } from './core-utils.js';

// --- Global mutable references (module-scoped) ---
export let PLACES = (typeof CONFIG !== 'undefined' && CONFIG.places) ? [...CONFIG.places] : DEFAULT_PLACES;
export let SLOTS = (typeof CONFIG !== 'undefined' && CONFIG.slots) ? CONFIG.slots : DEFAULT_SLOTS;

// --- State object ---
export let state = {
  doctors: [],
  assignments: {},
  places: [],
  slots: [],
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
let historyIndex = -1;
export let isProcessing = false;

export function setProcessing(v) { isProcessing = v; }

// --- Storage Layer ---

export function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_DOCTORS, JSON.stringify(state.doctors));
    localStorage.setItem(STORAGE_ASSIGNMENTS, JSON.stringify(state.assignments));
    localStorage.setItem(STORAGE_PLACES, JSON.stringify(state.places));
    localStorage.setItem(STORAGE_SLOTS, JSON.stringify(state.slots));
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
    if (docs) state.doctors = JSON.parse(docs);
    if (asgn) state.assignments = JSON.parse(asgn);
    if (plcs) state.places = JSON.parse(plcs);
    if (slts) state.slots = JSON.parse(slts);
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

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify({ stack: historyStack, index: historyIndex }));
  } catch (e) { console.error(e); }
}

export function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_HISTORY);
    if (saved) {
      const data = JSON.parse(saved);
      historyStack = data.stack || [];
      historyIndex = data.index ?? -1;
    }
  } catch (e) { console.error(e); }
}

export function pushHistory() {
  const snapshot = JSON.stringify({ doctors: state.doctors, assignments: state.assignments });
  if (historyIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, historyIndex + 1);
  }
  historyStack.push(snapshot);
  if (historyStack.length > HISTORY_MAX) {
    historyStack.shift();
  } else {
    historyIndex++;
  }
  saveHistory();
  updateUndoRedoButtons();
}

export function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  const snap = JSON.parse(historyStack[historyIndex]);
  state.assignments = snap.assignments;
  if (Array.isArray(snap.doctors)) state.doctors = snap.doctors;
  saveToStorage();
  saveHistory();
  updateUndoRedoButtons();
}

export function redo() {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex++;
  const snap = JSON.parse(historyStack[historyIndex]);
  state.assignments = snap.assignments;
  if (Array.isArray(snap.doctors)) state.doctors = snap.doctors;
  saveToStorage();
  saveHistory();
  updateUndoRedoButtons();
}

export function clearHistory() {
  historyStack = [];
  historyIndex = -1;
  saveHistory();
}

export function updateUndoRedoButtons() {
  const undoBtn = el('btn-undo');
  const redoBtn = el('btn-redo');
  if (undoBtn) {
    undoBtn.classList.toggle('opacity-30', historyIndex <= 0);
    undoBtn.classList.toggle('pointer-events-none', historyIndex <= 0);
  }
  if (redoBtn) {
    redoBtn.classList.toggle('opacity-30', historyIndex >= historyStack.length - 1);
    redoBtn.classList.toggle('pointer-events-none', historyIndex >= historyStack.length - 1);
  }
}

// loadHistory is called from events.js init()
