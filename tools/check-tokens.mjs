#!/usr/bin/env node
// Token gate — blocca NUOVI hex di colore fuori dai blocchi token.
//
// Il contratto (DESIGN.md) e' chiaro: i colori vivono in styles.css come
// custom properties; in HTML non si scrivono hex. In pratica la superficie
// storica e' grande (audit 2026-11-22: 187 hex in styles.css fuori dai token,
// 533 in HTML) e non si ripulisce in un colpo: qui si congela il debito e si
// impedisce che cresca.
//
// Regole:
//   - hex ammessi: dentro i blocchi token di styles.css (:root { } e
//     body.dark-mode { }), nei <meta name="theme-color"> e nelle entita'
//     numeriche HTML (&#8212;).
//   - ogni altro hex conta. Se il conteggio di un file supera il baseline
//     (tools/token-baseline.json) il check fallisce.
//   - se un file non e' nel baseline e ha hex, fallisce: nessun hex nuovo
//     puo' entrare senza revisione esplicita.
//
// Uso:
//   node tools/check-tokens.mjs            # verifica
//   node tools/check-tokens.mjs --update   # riscrive il baseline (solo dopo
//                                          # aver ridotto il debito, non per
//                                          # "far passare" un hex nuovo)
//   node tools/check-tokens.mjs --list     # elenca i file con hex e i conteggi

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(ROOT, 'tools', 'token-baseline.json');
const MODE_UPDATE = process.argv.includes('--update');
const MODE_LIST = process.argv.includes('--list');

const HEX = /(?<!&)#[0-9a-fA-F]{3,8}\b/g;
const SKIP_DIRS = new Set(['node_modules', '.git', '.hermes', '.opencode', '.github', '.impeccable', 'docs']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html|css)$/.test(name)) out.push(p);
  }
  return out;
}

// Righe coperte dai blocchi token di styles.css (:root e body.dark-mode).
function tokenLineRanges(text) {
  const ranges = [];
  const re = /(^|\n)(:root|body\.dark-mode)\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const start = m.index + (m[1] ? 1 : 0);
    let depth = 0, i = text.indexOf('{', start);
    const from = i;
    for (; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') { depth--; if (depth === 0) break; }
    }
    ranges.push([from, i]);
  }
  return ranges;
}

function inRanges(idx, ranges) {
  return ranges.some(([a, b]) => idx >= a && idx <= b);
}

function countHex(file, text) {
  const isCss = file.endsWith('.css');
  const ranges = isCss ? tokenLineRanges(text) : [];
  let count = 0;
  const hits = [];
  let m;
  HEX.lastIndex = 0;
  while ((m = HEX.exec(text))) {
    if (isCss && inRanges(m.index, ranges)) continue;
    // In HTML: theme-color e' l'unica occorrenza ammessa (colore del browser,
    // non del documento).
    if (!isCss) {
      const lineStart = text.lastIndexOf('\n', m.index) + 1;
      const line = text.slice(lineStart, text.indexOf('\n', m.index) === -1 ? undefined : text.indexOf('\n', m.index));
      if (/name=["']theme-color["']/.test(line)) continue;
    }
    count++;
    hits.push(`${relative(ROOT, file)}:${text.slice(0, m.index).split('\n').length}`);
  }
  // Per la diagnosi servono gli estremi: un hex nuovo sta spesso in coda o
  // all'inizio del blocco appena scritto.
  const samples = hits.length <= 8 ? hits : [...hits.slice(0, 3), '…', ...hits.slice(-3)];
  return { count, samples };
}

const files = walk(ROOT);
const current = {};
const details = {};
for (const f of files) {
  const rel = relative(ROOT, f).split(sep).join('/');
  const text = readFileSync(f, 'utf8');
  const { count, samples } = countHex(f, text);
  if (count > 0) {
    current[rel] = count;
    details[rel] = samples;
  }
}

if (MODE_LIST) {
  const rows = Object.entries(current).sort((a, b) => b[1] - a[1]);
  for (const [f, n] of rows) console.log(String(n).padStart(5), f);
  const total = rows.reduce((a, [, n]) => a + n, 0);
  console.log(`\n${rows.length} file, ${total} hex fuori dai token.`);
  process.exit(0);
}

if (MODE_UPDATE) {
  const payload = {
    note: 'Baseline hex fuori dai blocchi token. Abbassare quando si riduce il debito; un aumento va giustificato in revisione.',
    files: Object.fromEntries(Object.entries(current).sort((a, b) => a[0].localeCompare(b[0]))),
  };
  writeFileSync(BASELINE, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Baseline aggiornato: ${Object.keys(current).length} file, ${Object.values(current).reduce((a, b) => a + b, 0)} hex (${relative(ROOT, BASELINE)}).`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error(`FAIL: manca ${relative(ROOT, BASELINE)}. Genera il baseline: node tools/check-tokens.mjs --update`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8')).files || {};
const problems = [];
for (const [file, n] of Object.entries(current)) {
  const allowed = baseline[file];
  if (allowed === undefined) {
    problems.push(`${file}: ${n} hex in un file non presente nel baseline (${details[file].join(', ')})`);
  } else if (n > allowed) {
    problems.push(`${file}: ${n} hex, baseline ${allowed} (+${n - allowed}) — es. ${details[file].join(', ')}`);
  }
}

if (problems.length) {
  console.error('FAIL: nuovi colori hex fuori dai blocchi token (DESIGN.md §Colori).');
  for (const p of problems) console.error('  ' + p);
  console.error('\nUsa una custom property (var(--…)) oppure, se il colore e\' davvero un token nuovo,');
  console.error('aggiungilo a :root/body.dark-mode in styles.css e rigenera il baseline con');
  console.error('  node tools/check-tokens.mjs --update');
  process.exit(1);
}

const total = Object.values(current).reduce((a, b) => a + b, 0);
console.log(`OK: nessun hex nuovo fuori dai token (${total} hex storici in ${Object.keys(current).length} file, congelati nel baseline).`);
