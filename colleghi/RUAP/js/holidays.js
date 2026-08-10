// ====================================================
// holidays.js — Italian calendar calculations
// ====================================================

/**
 * Compute Easter date using the computus algorithm.
 * @param {number} year
 * @returns {Date}
 */
export function getEasterDate(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Easter Monday (Pasquetta).
 * @param {number} year
 * @returns {Date}
 */
export function getEasterMondayDate(year) {
  const easter = getEasterDate(year);
  return new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1);
}

// Fixed-date holidays keyed by month index (0 = January)
const FIXED_HOLIDAYS = {
  0: [1, 6],        // Capodanno, Epifania
  3: [25],          // Liberazione
  4: [1],           // Festa del Lavoro
  5: [2, 24],       // Festa della Repubblica, San Giovanni (Firenze patrono)
  7: [15],          // Ferragosto
  10: [1],          // Ognissanti
  11: [8, 25, 26],  // Immacolata, Natale, Santo Stefano
};

/**
 * Check if a date is an official Italian public holiday.
 * @param {Date} date
 * @returns {boolean}
 */
export function isItalianHoliday(date) {
  const fixed = FIXED_HOLIDAYS[date.getMonth()];
  if (fixed && fixed.includes(date.getDate())) return true;
  const easter = getEasterDate(date.getFullYear());
  const easterMon = getEasterMondayDate(date.getFullYear());
  return date.getTime() === easter.getTime() || date.getTime() === easterMon.getTime();
}
