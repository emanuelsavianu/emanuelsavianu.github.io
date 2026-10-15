// ====================================================
// config.js — Constants, color palettes, defaults
// ====================================================

export const STORAGE_DOCTORS = 'ruap-turni-medici';
export const STORAGE_ASSIGNMENTS = 'ruap-turni-assegnazioni';
export const STORAGE_HISTORY = 'ruap-turni-history';
export const STORAGE_VERSION_KEY = 'ruap-storage-version';
export const STORAGE_PLACES = 'ruap-places';
export const STORAGE_SLOTS = 'ruap-slots';
export const STORAGE_CLOSED = 'ruap-giorni-chiusi';
export const STORAGE_DARK_MODE = 'ruap-dark-mode';
export const STORAGE_VERSION = 2;
export const CONFIG_DATA_KEY = 'ruap-config-data-version';
export const HISTORY_MAX = 50;

export const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
export const DAY_KEYS  = ['lun', 'mar', 'mer', 'gio', 'ven'];

export const DEFAULT_PLACES = ['M.S.Savino', 'Subbiano', 'Arezzo'];
export const DEFAULT_SLOTS = [
  { key: 'mat', label: '08:00–14:00', hours: 6, icon: '🌅' },
  { key: 'pom', label: '14:00–20:00', hours: 6, icon: '🌆' },
];

export const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

export const DROPDOWN_HEIGHT = 350;
export const DROPDOWN_WIDTH  = 320;
export const MONTHLY_WEEKS = 4;
export const EXTERNAL_PREFIX = '__ext__::';
export const MS_PER_DAY = 86400 * 1000;
export const EXCEL_EPOCH_OFFSET = 25569;
export const WIZARD_TOTAL = 4;

/* `hex` = colore dipinto (slot, pallini, export). Le tinte ferme a 500 davano
   bianco-su-colore fra 2.15:1 e 4.47:1: scese a 700/600 restano >=4.5:1 con testo
   bianco (contrasti misurati, audit 2026-10-14 F3). */
export const COLOR_PALETTE = [
  { bg: 'bg-blue-500',   text: 'text-white', hex: '#1d4ed8',  label: 'Blu' },
  { bg: 'bg-green-500',  text: 'text-white', hex: '#15803d',  label: 'Verde' },
  { bg: 'bg-purple-500', text: 'text-white', hex: '#7e22ce',  label: 'Viola' },
  { bg: 'bg-rose-500',   text: 'text-white', hex: '#be123c',  label: 'Rosa' },
  { bg: 'bg-amber-500',  text: 'text-white', hex: '#b45309',  label: 'Ambra' },
  { bg: 'bg-teal-500',   text: 'text-white', hex: '#0f766e',  label: 'Teal' },
  { bg: 'bg-orange-500', text: 'text-white', hex: '#c2410c',  label: 'Arancio' },
  { bg: 'bg-cyan-600',   text: 'text-white', hex: '#0e7490',  label: 'Ciano' },
  { bg: 'bg-indigo-500', text: 'text-white', hex: '#4338ca',  label: 'Indaco' },
  { bg: 'bg-pink-500',   text: 'text-white', hex: '#be185d',  label: 'Rosa Scuro' },
  { bg: 'bg-lime-500',   text: 'text-white', hex: '#4d7c0f',  label: 'Lime' },
  { bg: 'bg-emerald-500',text: 'text-white', hex: '#047857',  label: 'Smeraldo' },
  { bg: 'bg-sky-500',    text: 'text-white', hex: '#0369a1',  label: 'Sky' },
  { bg: 'bg-violet-500', text: 'text-white', hex: '#6d28d9',  label: 'ViolaChiaro' },
  { bg: 'bg-fuchsia-500',text: 'text-white', hex: '#a21caf',  label: 'Fucsia' },
  { bg: 'bg-rose-700',   text: 'text-white', hex: '#be123c',  label: 'Rosso' },
];
