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
// Aperture per sede nei giorni chiusi (la COT il 31/12, per esempio): mappa
// { "<sede>": ["YYYY-MM-DD", …] } modificabile dall'app, una sede alla volta.
export const STORAGE_PLACE_OPEN = 'ruap-aperture-sedi';
export const STORAGE_DARK_MODE = 'ruap-dark-mode';
export const STORAGE_HEADER_COLLAPSED = 'ruap-header-collapsed';
export const STORAGE_FILL_ONLY = 'ruap-solo-riempimento';
export const STORAGE_EXTRA = 'ruap-turni-extra';
export const STORAGE_FOCUS = 'ruap-focus-medico';
export const STORAGE_VERSION = 2;
export const CONFIG_DATA_KEY = 'ruap-config-data-version';
export const HISTORY_MAX = 50;

export const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const DAY_KEYS  = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

export const DEFAULT_PLACES = ['M.S.Savino', 'Subbiano', 'COT', 'Baldaccio', 'Guadagnoli'];

/* Orario per sede. Una sede senza voce qui è aperta lun-ven in tutte le fasce.
   COT (Centrale Operativa Territoriale) è aperta lun-sab con il solo turno
   del mattino 08:00–14:00: `days` elenca i giorni feriali in cui la sede apre
   (il motore e il calendario chiedono `isPlaceOpenOn`/`slotsForPlace`, mai
   questi valori a mano). Il seed può sovrascrivere questa mappa con
   `CONFIG.placeSchedules` — è dato, non codice. */
export const DEFAULT_PLACE_SCHEDULE = {
  'COT': { slots: ['mat'], days: ['lun', 'mar', 'mer', 'gio', 'ven', 'sab'] },
};
/** Giorni di apertura di default (le sedi senza orario proprio). */
export const DEFAULT_OPEN_DAYS = ['lun', 'mar', 'mer', 'gio', 'ven'];

/* Sedi «silenziate» per singolo mese: { "<sede>": ["YYYY-MM", ...] }.
   Una sede silenziata in un mese NON compare nel calendario, il motore non la
   riempie e gli export non la stampano — ma resta in `places` (le sedi sono
   globali) e i mesi non elencati continuano a coprirla. Serve al caso «la sede
   X apre a fine mese / non è ancora operativa»: il seed silenzia, il mese dopo
   si toglie la voce e la sede torna. Il seed può sovrascrivere questa mappa con
   `CONFIG.placeInactive`; si legge SOLO da `isPlaceActiveInMonth`. */
export const DEFAULT_PLACE_INACTIVE = {};

/* Finestra di attività di una sede: { "<sede>": "YYYY-MM" }.
   `placeActiveFrom[place]`  = primo mese in cui la sede è pianificabile
   `placeActiveUntil[place]` = ultimo mese in cui lo è (dal mese dopo è silenziata).
   Servono a NON cancellare una sede dal roster quando la geografia dei servizi
   cambia (apre la CdC X, chiude l'ambulatorio Y): le sedi sono globali e i turni
   dei mesi passati devono restare leggibili. `placeInactive` resta per i buchi
   puntuali. Si leggono SOLO da `isPlaceActiveInMonth`. */
export const DEFAULT_PLACE_ACTIVE_FROM = {};
export const DEFAULT_PLACE_ACTIVE_UNTIL = {};

/* Giorni in cui UNA sede lavora anche se il giorno è chiuso per gli altri
   (chiusura straordinaria «per sede»): { "<sede>": ["YYYY-MM-DD", ...] }.
   Le festività nazionali restano chiuse comunque. Il seed lo sovrascrive con
   `CONFIG.placeOpenDays`; si legge SOLO da `isClosedDay(..., place)`. */
export const DEFAULT_PLACE_OPEN_DAYS = {};

/* Turni extra (guardia, rinforzo, reperibilità): turni FUORI griglia, inseriti a
   mano dal bottone «+» in qualunque giorno del mese — anche sabato, domenica,
   festivo o giorno chiuso. Non esistono di default: `state.extraShifts` parte
   vuoto e il motore non ne genera mai. `hours` è la durata (4 o 6 ore). */
export const EXTRA_TYPES = ['Guardia', 'Rinforzo', 'Reperibilità', 'Altro'];
export const EXTRA_HOURS = [4, 6];
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
