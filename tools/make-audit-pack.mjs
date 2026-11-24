#!/usr/bin/env node
// =====================================================================
// make-audit-pack.mjs — pacchetti di codice sorgente per un audit esterno
//
// PERCHE' NON UN FILE UNICO
// Il sito pubblico e' ~1,6 MB di HTML: la stessa barra <site-nav> e'
// prerenderizzata in 29 pagine (43,8 KB di markup identico) e le pagine
// piu' grosse superano i 90 KB. Un unico allegato da ~1,5 MB viene
// accettato ma letto a meta', e le citazioni "file:riga" su un file
// concatenato non sono verificabili. Qui si producono pack tematici sotto
// un tetto di byte, con delimitatori e percorso per ogni file, cosi' ogni
// finding di chi legge e' ancorabile a un file reale del repo.
// Con --all si produce anche il file unico, per chi vuole provarci.
//
// Uso:
//   node tools/make-audit-pack.mjs                 # pack tematici
//   node tools/make-audit-pack.mjs --all           # aggiunge 99-ALL.txt
//   node tools/make-audit-pack.mjs --out DIR       # cartella di uscita
//   PACK_MAX=120000 node tools/make-audit-pack.mjs # tetto piu' basso
//
// Gate di qualita' (non un gate di deploy: non sta in npm test):
//   - solo file tracciati (git ls-files): niente roba non committata;
//   - niente binari, font, immagini, PDF, assets, docs interni, .hermes;
//   - dedup della barra prerenderizzata, con byte risparmiati in report;
//   - scansione segreti/PII prima di scrivere: se trova qualcosa che non
//     deve uscire, esce con codice 1 e non scrive nulla.
// =====================================================================

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argOut = process.argv.indexOf('--out');
const STAMP = new Date().toISOString().slice(0, 10);
const OUT = resolve(argOut > -1
  ? process.argv[argOut + 1]
  : join(homedir(), 'Documents', 'agent-reports', `savianu-it-audit-pack-${STAMP}`));
const MAX_PACK = Number(process.env.PACK_MAX || 170000); // byte per pack
const WITH_ALL = process.argv.includes('--all');

// Solo stringhe costanti ('git ls-files', 'git rev-parse ...'): nessun input
// utente arriva qui, quindi execSync non apre una superficie di injection.
const git = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
const COMMIT = git('git rev-parse --short HEAD');
const BRANCH = git('git rev-parse --abbrev-ref HEAD');

// ── Cosa entra e cosa no ─────────────────────────────────────────────────────
// Esclusi perche' non sono codice del sito: asset binari, report interni
// (possono contenere dati di pazienti), config di agenti, backend.
const DENY_DIRS = ['assets/', 'docs/', '.hermes/', '.opencode/', '.github/', 'openspec/',
  'design/', 'cloudflare/', 'markdown/', 'node_modules/', '.impeccable/'];
// App interne per i colleghi: 350 KB di JS che non riguardano l'audit del
// percorso paziente; si possono chiedere a parte con PACK_INCLUDE_TOOLS=1.
const TOOLS_DIRS = ['colleghi/RUAP/', 'colleghi/gestoreturni/'];
const INCLUDE_TOOLS = process.env.PACK_INCLUDE_TOOLS === '1';

const ALLOW_EXT = new Set(['.html', '.css', '.js', '.md', '.json', '.xml', '.txt']);
// File testuali che non servono a un audit di codice o che sono generati.
const DENY_FILES = new Set([
  'llms-full.txt', 'package-lock.json', 'pdf-drive-map.json', 'tools/token-baseline.json',
  'tools/markdown-routes.json', 'manifest.json', // manifest PWA: 1 KB, utile? no
]);

function trackedFiles() {
  return git('git ls-files').split('\n').filter(Boolean);
}

function isCandidate(p) {
  if (!INCLUDE_TOOLS && TOOLS_DIRS.some((d) => p.startsWith(d))) return false;
  if (DENY_DIRS.some((d) => p.startsWith(d))) return false;
  if (p.split('/').some((seg) => seg.startsWith('.') && seg !== '.well-known')) return false;
  if (p.includes('/.')) return false;
  if (DENY_FILES.has(p)) return false;
  const ext = p.slice(p.lastIndexOf('.'));
  if (!ALLOW_EXT.has(ext)) return false;
  if (/\.min\.(js|css)$/.test(p)) return false;
  // I tools .mjs sono solo .js: esclusi per estensione, ma per sicurezza:
  if (p.startsWith('tools/') || p.startsWith('email-templates/')) return false;
  return true;
}

// ── Gruppi tematici: un pack = una domanda di audit ─────────────────────────
const GROUPS = [
  {
    id: '01-css', title: 'Design system e CSS globale',
    why: 'token, contrasto, dark mode, media query, print',
    match: (p) => p === 'styles.css',
  },
  {
    id: '02-js-core', title: 'JavaScript del sito (app, chrome, config, service worker)',
    why: 'logica, i18n, stati UI, cache SW',
    match: (p) => ['app.js', 'chrome.js', 'config.js', 'sw.js'].includes(p),
  },
  {
    id: '03-html-home-ssn', title: 'Home + area pazienti',
    why: 'percorso principale del paziente, orari, prenotazione, FAQ',
    match: (p) => ['index.html', '404.html', 'offline.html'].includes(p)
      || (p.startsWith('ssn/') && !/^(ssn\/scheda-|ssn\/poster)/.test(p)),
  },
  {
    id: '04-html-privati-intl', title: 'Consulti privati + pazienti internazionali',
    why: 'conversione, modulo di contatto, multilingua',
    match: (p) => p.startsWith('privati/') || p.startsWith('international/') || p === 'privacy.html',
  },
  {
    id: '05-html-colleghi', title: 'Area colleghi',
    why: 'pagine per professionisti: densita\' informativa, tabelle, modulistica',
    match: (p) => p.startsWith('colleghi/'),
  },
  {
    id: '06-print', title: 'Schede e poster A4 (print-first, 5 lingue)',
    why: 'impaginazione, tipografia, RTL, contrasto su carta',
    match: (p) => /^ssn\/(scheda|poster)/.test(p) || /^ssn\/(scheda|poster)-styles\.css$/.test(p),
  },
  {
    id: '07-docs', title: 'Documenti di progetto e mappa del sito',
    why: 'vincoli dichiarati, design tokens, SEO',
    match: (p) => ['DESIGN.md', 'PRODUCT.md', 'README.md', 'sitemap.xml', 'robots.txt'].includes(p),
  },
];

// ── Dedup della barra prerenderizzata ───────────────────────────────────────
// <site-nav> e' identica in 29 pagine: la si sostituisce con un marcatore e si
// annota quanto markup e' stato tolto. Il marcatore e' citabile quanto il codice.
const NAV_RE = /[ \t]*<site-nav\b[^>]*>[\s\S]*?<\/site-nav>/;
function dedupNav(rel, text) {
  const m = NAV_RE.exec(text);
  if (!m) return { text, saved: 0, hits: 0 };
  const marker = '<!-- [site-nav: markup prerenderizzato identico in 29 pagine — vedi 00-INDEX.md §4] -->';
  return { text: text.slice(0, m.index) + marker + text.slice(m.index + m[0].length), saved: m[0].length, hits: 1 };
}

// ── Scansione segreti / dati personali ──────────────────────────────────────
// Il sito e' pubblico, quindi i contatti dello studio sono legittimi. Qui si
// cercano cose che NON devono uscire: chiavi, token, codici fiscali, IBAN.
const PII_RULES = [
  { name: 'codice fiscale', re: /\b[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]\b/g },
  { name: 'IBAN', re: /\bIT[0-9]{2}[A-Z][0-9]{10}[0-9A-Z]{12}\b/g },
  { name: 'chiave/token', re: /\b(?:api[_-]?key|secret|password|passwd|bearer)\s*[:=]\s*["'][^"']{8,}/gi },
  { name: 'chiave Cloudflare/Resend', re: /\b(?:re_|cf_)[A-Za-z0-9_-]{16,}\b/g },
];
function scanPII(rel, text) {
  const hits = [];
  for (const rule of PII_RULES) {
    for (const m of text.matchAll(rule.re)) {
      hits.push(`${rel}: ${rule.name} -> ${String(m[0]).slice(0, 24)}…`);
    }
  }
  return hits;
}

// ── Raccolta ────────────────────────────────────────────────────────────────
const files = trackedFiles().filter(isCandidate);
const byGroup = new Map(GROUPS.map((g) => [g.id, []]));
const leftovers = [];
for (const f of files) {
  const g = GROUPS.find((x) => x.match(f));
  if (g) byGroup.get(g.id).push(f);
  else leftovers.push(f);
}

const pii = [];
const items = [];
for (const g of GROUPS) {
  for (const rel of byGroup.get(g.id)) {
    const raw = readFileSync(join(ROOT, rel), 'utf8');
    const { text, saved } = dedupNav(rel, raw);
    pii.push(...scanPII(rel, raw));
    items.push({
      group: g.id, rel, text,
      bytes: Buffer.byteLength(text, 'utf8'),
      rawBytes: Buffer.byteLength(raw, 'utf8'),
      navSaved: saved,
      lines: text.split('\n').length,
    });
  }
}

if (pii.length) {
  console.error('STOP — il pack conterrebbe dati che non devono uscire:');
  for (const h of pii.slice(0, 20)) console.error('  ' + h);
  console.error(`\n${pii.length} occorrenze. Nessun file scritto.`);
  process.exit(1);
}

// ── Scrittura: split automatico sotto il tetto ──────────────────────────────
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const header = (it) => `\n\n========== FILE: ${it.rel} (${it.lines} righe, ${it.bytes} byte) ==========\n`;
const manifest = [];
let savedTotal = 0;

for (const g of GROUPS) {
  const list = items.filter((i) => i.group === g.id);
  if (!list.length) continue;
  // ordine stabile: il file principale prima, poi alfabetico
  list.sort((a, b) => (a.rel.length - b.rel.length) || a.rel.localeCompare(b.rel));

  let part = 1, buf = [], bufBytes = 0, written = [];
  const flush = () => {
    if (!buf.length) return;
    const name = `${g.id}${part > 1 ? '-' + String.fromCharCode(96 + part) : ''}.txt`;
    writeFileSync(join(OUT, name), buf.join(''), 'utf8');
    written.push({ name, bytes: bufBytes, files: buf.length });
    part++; buf = []; bufBytes = 0;
  };
  for (const it of list) {
    if (bufBytes + it.bytes > MAX_PACK && buf.length) flush();
    buf.push(header(it) + it.text);
    bufBytes += it.bytes + header(it).length;
    savedTotal += it.navSaved;
  }
  flush();
  manifest.push({ g, written, files: list });
}

if (WITH_ALL) {
  const all = items.map((it) => header(it) + it.text).join('');
  writeFileSync(join(OUT, '99-ALL.txt'), `# savianu.it — dump completo (${COMMIT})${all}`, 'utf8');
  manifest.push({ g: { id: '99-ALL', title: 'Dump completo (per il tentativo a file unico)', why: '' },
    written: [{ name: '99-ALL.txt', bytes: Buffer.byteLength(all, 'utf8'), files: items.length }] });
}

// ── Manifest + report a schermo ─────────────────────────────────────────────
const rows = [];
let totalBytes = 0;
for (const m of manifest) {
  for (const w of m.written) {
    totalBytes += w.bytes;
    rows.push(`| \`${w.name}\` | ${m.g.title}${m.g.id.startsWith('05') ? ' — **secondario**' : ''} | ${w.files} | ${(w.bytes / 1024).toFixed(0)} KB | ~${Math.round(w.bytes / 3.6 / 1000)}k token |`);
  }
}
const manifestMd = `# MANIFEST — audit pack savianu.it

- commit: \`${COMMIT}\` (branch \`${BRANCH}\`)
- generato: ${new Date().toISOString()}
- file sorgente inclusi: ${items.length}
- tetto per pack: ${MAX_PACK} byte
- markup \`<site-nav>\` duplicato rimosso: ${(savedTotal / 1024).toFixed(1)} KB
- binari/font/immagini/PDF esclusi: si'
- esclusi per costruzione: \`docs/\`, \`.github/\`, \`.hermes/\`, \`.opencode/\`, \`openspec/\`, \`cloudflare/\`, \`assets/\`, \`design/\`

| pack | area | file | peso | stima token |
|---|---|---|---|---|
${rows.join('\n')}

Totale: ${(totalBytes / 1024).toFixed(0)} KB.

Pack generati da \`tools/make-audit-pack.mjs\`; per rigenerarli: \`npm run audit-pack\` (o \`node tools/make-audit-pack.mjs --all\`).
`;
writeFileSync(join(OUT, 'MANIFEST.md'), manifestMd, 'utf8');

// Il brief e' parte del pack, non documentazione di contorno: senza i vincoli
// del repo chi legge propone fix che i gate respingono.
const brief = join(ROOT, 'tools', 'audit-pack-brief.md');
if (existsSync(brief)) {
  writeFileSync(join(OUT, '00-INDEX.md'), readFileSync(brief, 'utf8'), 'utf8');
} else {
  console.warn('ATTENZIONE: tools/audit-pack-brief.md assente — il pack esce senza istruzioni');
}

console.log(`OK — ${items.length} file, ${manifest.reduce((n, m) => n + m.written.length, 0)} pack in ${OUT}`);
for (const r of rows) console.log('  ' + r);
console.log(`\nbarre <site-nav> rimosse: ${(savedTotal / 1024).toFixed(1)} KB su ${items.filter((i) => i.navSaved).length} pagine`);
if (leftovers.length) console.log(`non assegnati a un pack (${leftovers.length}): ${leftovers.slice(0, 8).join(', ')}`);
