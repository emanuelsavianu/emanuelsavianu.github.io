#!/usr/bin/env node
// Guardrail: refuse to publish a PDF that looks like a FILLED-IN form.
// Usage: node tools/check-pdf-pii.mjs [--all]
//   (default) scans the document folders that are actually published:
//             colleghi/modulistica/, ssn/, privati/, assets/ … i.e. every
//             *.pdf tracked by git, minus the dirs excluded below.
//   --all     also scans git HISTORY blobs of every *.pdf ever committed.
//
// Why: 2026-09-22 a filled PAI (patient name, birth date, phone, diagnoses)
// sat on the public site for 27 days because the "facsimile" was really a
// compiled copy. Blank templates carry NO digits in date fields, no phone
// numbers and no checked-box glyphs, so those signals are safe and precise.
//
// A finding can be explicitly accepted by adding a regex to
// tools/pdf-pii-allowlist.txt (one per line, '#' comments).
//
// Exits 1 on any un-allowed signal.

import { readFileSync, existsSync, mkdtempSync, writeFileSync, readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ALLOW_FILE = join(ROOT, 'tools', 'pdf-pii-allowlist.txt');

const SIGNALS = [
  ['data reale', /\b\d{1,2}\/\d{1,2}\/(?:19|20)\d{2}\b/g],
  ['telefono', /(?:\+39[\s.]?)?\b3\d{2}[\s.\-]?\d{3}[\s.\-]?\d{3,4}\b|\b0\d{2,3}[\s.\-]\d{5,7}\b/g],
  ['codice fiscale', /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g],
  ['IBAN', /\bIT\d{2}[A-Z]\d{10}[0-9A-Z]{12}\b/g],
  ['casella barrata', /[\u2713\u2714\u2611\u2612]/g],
  ['nome compilato', /(?:Cognome\s*Nome|Eventuali familiari[^\n]{0,60}|Care\s*Manager[^\n]{0,40})\s*[:_]*\s*([A-Z][a-z\u00e0-\u00ff]{2,}(?:\s+[A-Z][a-z\u00e0-\u00ff]{2,}){1,3})/g],
  ['diagnosi compilata', /(?:Patologia\s+Prevalente|Patologia\s+Concomitante)[ \t]*\n?[ \t]*([A-Za-z0-9][^\n]{5,80})/g],
];

// Testo che in un modulo VUOTO segue un'etichetta: non è un dato compilato.
const NOT_FILLED = /^(?:Patologia|Cognome|Nome|Indirizzo|Eventuali|Il caso|Data|Firma|Note|Autonomia|Grado|Disturbi|Supporto|Fragilit|Responsabilit|RINNOVO|La situazione|MEDICO|INFERMIERE|OPERAT|FISIOTERAPISTA|MEDICO|ASSISTENTE|RETE|CARE|Attivazione|Tipo|Sede|Altro|SNG|PEG|NPT|Valutazione|Addestramento|Ossigenoterapia|Gestione|Ventiloterapia|Bronco|Medicazione|Cura|Trattamento|Supervisione|Assistenza|Controllo|Trasfusioni|Telemetria|E\.C\.G|Rischio|Prelievi|Alimentazione|Manovre|Stomia|Tracheostomia|Procedura|\u2026|_|\.)/i;

const allow = existsSync(ALLOW_FILE)
  ? readFileSync(ALLOW_FILE, 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
      .map(l => new RegExp(l))
  : [];

const allowed = (s) => allow.some(rx => rx.test(s));

function textOf(pdf) {
  const t = spawnSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let txt = (t.stdout || '');
  if (txt.trim().length < 20) {                    // no text layer → OCR
    const dir = mkdtempSync(join(tmpdir(), 'pdfpii-'));
    const base = join(dir, basename(pdf, extname(pdf)));
    const ppm = spawnSync('pdftoppm', ['-r', '200', '-png', pdf, base], { encoding: 'utf8' });
    if (ppm.status === 0) {
      txt = readdirSync(dir).sort().map(f =>
        spawnSync('tesseract', [join(dir, f), '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stdout || ''
      ).join('\n');
    }
  }
  return txt;
}

function scan(pdf, label) {
  const txt = textOf(pdf);
  const findings = [];
  for (const [name, rx] of SIGNALS) {
    const re = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g');
    let m;
    while ((m = re.exec(txt)) !== null) {
      const raw = (m[1] || m[0]).replace(/\s+/g, ' ').trim();
      if (raw.length < 4) continue;
      if (NOT_FILLED.test(raw)) continue;
      if (allowed(raw)) continue;
      findings.push({ signal: name, value: raw.slice(0, 60) });
      if (findings.length > 25) break;
    }
  }
  return { label, findings };
}

function trackedPdfs() {
  const r = spawnSync('git', ['ls-files', '*.pdf'], { cwd: ROOT, encoding: 'utf8' });
  return (r.stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
}

function historyPdfs() {
  const r = spawnSync('git', ['rev-list', '--objects', '--all'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const seen = new Set();
  const out = [];
  const dir = mkdtempSync(join(tmpdir(), 'pdfhist-'));
  for (const line of (r.stdout || '').split('\n')) {
    const [sha, path] = line.split(' ', 2);
    if (!path || !path.toLowerCase().endsWith('.pdf') || seen.has(sha)) continue;
    seen.add(sha);
    const blob = spawnSync('git', ['cat-file', 'blob', sha], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    if (blob.status !== 0) continue;
    const dest = join(dir, sha + '.pdf');
    writeFileSync(dest, blob.stdout);
    out.push({ dest, label: `${path} @${sha.slice(0, 8)}` });
  }
  return out;
}

const useHistory = process.argv.includes('--all');
const explicit = process.argv.filter(a => a.startsWith('--file=')).map(a => a.slice(7));
const targets = explicit.length
  ? explicit.map(p => ({ dest: resolve(p), label: p }))
  : useHistory
    ? historyPdfs()
    : trackedPdfs().map(p => ({ dest: join(ROOT, p), label: p }));

let bad = 0;
for (const t of targets) {
  if (!existsSync(t.dest)) continue;
  const { findings } = scan(t.dest, t.label);
  if (findings.length) {
    bad++;
    console.error(`FAIL ${t.label}: possibile modulo COMPILATO`);
    for (const f of findings) console.error(`   - ${f.signal}: ${f.value}`);
  }
}
if (bad) {
  console.error(`\n${bad} PDF sospetto/i su ${targets.length} scansionati.`);
  console.error('Se il contenuto è legittimo (es. contatto di ufficio), aggiungi una regex a tools/pdf-pii-allowlist.txt.');
  process.exit(1);
}
console.log(`OK: nessun dato compilato in ${targets.length} PDF${useHistory ? ' (storia inclusa)' : ''}.`);
