#!/usr/bin/env node
// =====================================================================
// prerender.mjs — scrive nell'HTML statico le due cose che oggi esistono
// solo DOPO l'esecuzione di app.js, e che per questo producono CLS:
//
//   1. il markup interno di <site-nav>: fino all'upgrade del custom element
//      l'elemento contiene solo il vecchio `.fallback-nav` (alto ~110px),
//      quindi tutta la pagina sotto sta 200-400px troppo in alto e salta giù
//      quando app.js la riempie. Misurato con un observer su layout-shift:
//      0.17-0.21 su mobile = ~90% del CLS di ogni pagina.
//   2. i <link rel="preload"> dei due variable font Latin: senza preload il
//      testo si ridipinge al font-swap e le righe si spostano (0.04-0.07).
//
// Il markup della barra arriva da chrome.js, la STESSA funzione che usa
// app.js: all'upgrade app.js rigenera markup identico, quindi il pre-render
// non può divergere in silenzio (e il --check qui sotto lo verifica).
//
// Uso:  node tools/prerender.mjs          → scrive
//       node tools/prerender.mjs --check  → exit 1 se una pagina va rigenerata
// =====================================================================

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONFIG } from '../config.js';
import { siteNavInnerHTML } from '../chrome.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

// Stesse esclusioni degli altri tool: le cartelle non pubblicate non vanno toccate.
const EXCLUDE_DIRS = new Set([
  'node_modules', 'cloudflare', '.claude', '.git', 'docs', 'email-templates',
  'schema-templates', '.superpowers', 'design', '.slim', '.opencode',
  'openspec', '.hermes', '.github', 'brand', 'RUAP', 'gestoreturni',
]);

const PRELOAD_FONTS = [
  'assets/fonts/montserrat-var-latin.woff2',
  'assets/fonts/cormorant-garamond-var-latin.woff2',
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      walk(join(dir, entry.name), out);
    } else if (entry.name.endsWith('.html')) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

// Percorso URL servito, forma canonica (directory): ssn/index.html → /ssn/
function servedPath(file) {
  let p = relative(ROOT, file).split(sep).join('/');
  if (p.endsWith('index.html')) p = p.slice(0, -'index.html'.length);
  return '/' + p;
}

// Stessa formula di getPathPrefix() in app.js: ultimo segmento "file" se ha
// un'estensione, altrimenti directory.
function prefixFor(file) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const segs = rel.split('/');
  const isFile = /\.\w+$/.test(segs[segs.length - 1]);
  return '../'.repeat(Math.max(0, segs.length - (isFile ? 1 : 0)));
}

const NAV_RE = /([ \t]*)<site-nav\b([^>]*)>([\s\S]*?)<\/site-nav>/;

function prerenderNav(html, file) {
  const m = NAV_RE.exec(html);
  if (!m) return { html, changed: false, skipped: true };
  const [full, indent, attrs] = m;
  const section = (attrs.match(/data-section="([^"]*)"/) || [, 'root'])[1];
  const fixedLang = (attrs.match(/data-lang-fixed="([^"]*)"/) || [, ''])[1];
  const here = servedPath(file).replace(/\/$/, '');
  const markup = siteNavInnerHTML({
    section, fixedLang, here, config: CONFIG, prefix: prefixFor(file),
  }).trim();
  const next = `${indent}<site-nav${attrs}>\n${indent}    ${markup}\n${indent}</site-nav>`;
  const out = html.slice(0, m.index) + next + html.slice(m.index + full.length);
  return { html: out, changed: out !== html };
}

function prerenderFonts(html) {
  const m = /([ \t]*)<link rel="stylesheet" href="((?:\.\.\/)*)assets\/fonts\/fonts\.css">/.exec(html);
  if (!m) return { html, changed: false, skipped: true };
  if (html.includes(`href="${m[2]}${PRELOAD_FONTS[0]}" as="font"`)) {
    return { html, changed: false };
  }
  const indent = m[1];
  const tags = PRELOAD_FONTS
    .map((f) => `\n${indent}<link rel="preload" href="${m[2]}${f}" as="font" type="font/woff2" crossorigin>`)
    .join('');
  const out = html.slice(0, m.index + m[0].length) + tags + html.slice(m.index + m[0].length);
  return { html: out, changed: out !== html };
}

const files = walk(ROOT).sort();
const drift = [];
let navDone = 0;
let fontDone = 0;
let skipped = 0;

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  let html = original;
  const nav = prerenderNav(html, file);
  if (nav.skipped) { skipped++; continue; }
  html = nav.html;
  const fonts = prerenderFonts(html);
  html = fonts.html;
  if (html !== original) {
    drift.push(relative(ROOT, file));
    if (!CHECK) writeFileSync(file, html, 'utf8');
  }
  if (nav.changed) navDone++;
  if (fonts.changed) fontDone++;
}

const verb = CHECK ? 'da rigenerare' : 'aggiornate';
console.log(`[prerender] ${files.length} HTML, ${navDone} nav, ${fontDone} font-preload, ` +
  `${skipped} senza <site-nav>, ${drift.length} ${verb}.`);
if (CHECK && drift.length) {
  console.error('Pagine non allineate al pre-render (rilancia `npm run prerender`):');
  for (const f of drift) console.error(`  - ${f}`);
  process.exit(1);
}
