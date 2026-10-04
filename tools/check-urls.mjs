#!/usr/bin/env node
// P1-1: gli URL interni devono usare la forma canonica (/cartella/), mai /index.html.
// Fallisce se: un href/src punta a *index.html, lo SW precachea la forma con
// index.html, o sitemap.xml la elenca. Usage: node tools/check-urls.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const SKIP = new Set(['node_modules', '.git', 'docs', 'design']);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

let failed = 0, checked = 0;
const files = walk(ROOT);
const rel = (f) => relative(ROOT, f).split(sep).join('/');

// 1) href/src negli HTML
const RE = /(?:href|src)="([^"]*index\.html[^"]*)"/g;
for (const f of files.filter(f => f.endsWith('.html'))) {
  const src = readFileSync(f, 'utf8');
  let m;
  while ((m = RE.exec(src)) !== null) {
    const line = src.slice(0, m.index).split('\n').length;
    console.log(`FAIL: ${rel(f)}:${line} link interno in forma index.html -> ${m[1]}`);
    failed++;
  }
  checked++;
}

// 2) lista di precache dello service worker
const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const list = sw.match(/const\s+PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/);
if (!list) {
  console.log("FAIL: sw.js — array PRECACHE_URLS non trovato (il check va aggiornato se cambia forma)");
  failed++;
} else {
  const urls = [...list[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const bad = urls.filter(u => u.includes('index.html'));
  for (const u of bad) { console.log(`FAIL: sw.js precache contiene ${u}`); failed++; }
  const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
  for (const u of new Set(dupes)) { console.log(`FAIL: sw.js precache duplicato ${u}`); failed++; }
  console.log(`OK: sw.js precache ${urls.length} URL, nessuna forma index.html, nessun duplicato.`);
}

// 3) sitemap.xml
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
if (/index\.html/.test(sm)) { console.log('FAIL: sitemap.xml elenca una URL con index.html'); failed++; }
else { console.log('OK: sitemap.xml senza index.html.'); }

// 4) canonical/og:url nelle pagine non devono finire in index.html
for (const f of files.filter(f => f.endsWith('.html'))) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/<link[^>]+rel="canonical"[^>]*>/g)) {
    if (/index\.html/.test(m[0])) { console.log(`FAIL: ${rel(f)} canonical con index.html`); failed++; }
  }
}

console.log('');
if (failed > 0) { console.error(`${failed} URL non canonica.`); process.exit(1); }
console.log(`OK: ${checked} pagine HTML senza link interni in forma index.html.`);
