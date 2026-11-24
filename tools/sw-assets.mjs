#!/usr/bin/env node
// Shared SW precache list generator for savianu.it
// Used by tools/update-sw.mjs and tools/check-sw.mjs
//
// REGOLA (2026-11-24): si precacha SOLO l'app shell, non il sito intero.
// 40+ pagine HTML e le varianti AVIF/WebP dei poster pesavano decine di MB sul
// primo install senza servire all'offline utile: quelle risorse le mette in cache
// a runtime `cacheFirst` (immagini/font) e `networkFirst` (HTML/JS/CSS).
// Un URL qui dentro deve essere (a) richiesto da quasi ogni pagina oppure
// (b) indispensabile perché l'app shell si avvii offline.

import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Ordine = ordine di download all'install: prima la shell che disegna qualcosa,
// poi font e icone.
const SHELL = [
  '/',
  '/offline.html',
  '/404.html',
  '/styles.css',
  '/app.js',
  '/chrome.js',                   // importato da app.js come modulo ES
  '/config.js',
  '/manifest.json',
  '/assets/bronzelogo-192.png',   // logo del chrome (96px resi, 192 = 2x)
  '/assets/css/offline.css?v=1',  // foglio autoportante di offline.html
];

const FONTS = [
  '/assets/fonts/fonts.css',
  '/assets/fonts/montserrat-var-latin.woff2',
  '/assets/fonts/montserrat-var-latin-ext.woff2',
  '/assets/fonts/cormorant-garamond-var-latin.woff2',
  '/assets/fonts/cormorant-garamond-var-latin-ext.woff2',
];

// Icone: SOLO i file effettivamente referenziati dalle pagine (30 su 30
// caricano `solid.subset.css` + `fa-solid-900.subset.woff2`). Il foglio intero
// `solid.min.css` e il woff2 da 150 KB non sono più usati dal subsetting.
const ICONS = [
  '/assets/fontawesome/css/fontawesome.min.css',
  '/assets/fontawesome/css/solid.subset.css',
  '/assets/fontawesome/webfonts/fa-solid-900.subset.woff2',
];

export const PRECACHE_GROUPS = { SHELL, FONTS, ICONS };

export function computePrecacheUrls() {
  const urls = [...SHELL, ...FONTS, ...ICONS];
  const missing = urls.filter(u => {
    const rel = u.split('?')[0].replace(/^\//, '');
    return !existsSync(join(ROOT, rel === '' ? 'index.html' : rel));
  });
  if (missing.length) {
    throw new Error('precache: file inesistenti nel repo → ' + missing.join(', '));
  }
  return [...new Set(urls)];
}
