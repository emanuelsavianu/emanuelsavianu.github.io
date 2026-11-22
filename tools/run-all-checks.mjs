#!/usr/bin/env node
// Unified verification suite for savianu.it.
// Usage: node tools/run-all-checks.mjs   (or: npm test)
// Runs, in order: JS syntax check (app.js, config.js), link integrity,
// i18n parity/coverage, and service-worker precache sync.
// Exits with a non-zero code if any check fails.

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NODE = process.execPath;

const steps = [
  { name: 'JS syntax (app.js)',      cmd: NODE, args: ['--check', 'app.js'] },
  { name: 'JS syntax (config.js)',   cmd: NODE, args: ['--check', 'config.js'] },
  { name: 'Orari (orologi finti)',   cmd: NODE, args: [join('tools', 'check-hours.mjs')] },
  { name: 'URL canoniche',            cmd: NODE, args: [join('tools', 'check-urls.mjs')] },
  { name: 'SEO/meta guardrail',        cmd: NODE, args: [join('tools', 'check-seo.mjs')] },
  { name: 'Link integrity',          cmd: NODE, args: [join('tools', 'check-links.mjs')] },
  { name: 'Hub colleghi <- catalogo', cmd: NODE, args: [join('tools', 'build-colleghi.mjs'), '--check'] },
  { name: 'Modulistica <- documenti', cmd: NODE, args: [join('tools', 'build-modulistica.mjs'), '--check'] },
  { name: 'Redirect PDF <- mappa Drive', cmd: NODE, args: [join('tools', 'gen-pdf-redirects.mjs'), '--check'] },
  { name: 'Pre-render allineato',    cmd: NODE, args: [join('tools', 'prerender.mjs'), '--check'] },
  { name: 'i18n parity + coverage',  cmd: NODE, args: [join('tools', 'check-i18n.mjs')] },
  { name: 'SW precache sync',        cmd: NODE, args: [join('tools', 'check-sw.mjs')] },
  { name: 'Colori fuori dai token',   cmd: NODE, args: [join('tools', 'check-tokens.mjs')] },
  { name: 'PDF senza dati compilati', cmd: NODE, args: [join('tools', 'check-pdf-pii.mjs')] },
];

let failed = 0;
for (const step of steps) {
  process.stdout.write(`\n[${step.name}]\n`);
  const res = spawnSync(step.cmd, step.args, { cwd: ROOT, encoding: 'utf8' });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) {
    failed++;
    console.error(`FAIL: ${step.name}`);
  } else {
    console.log(`PASS: ${step.name}`);
  }
}

console.log('');
if (failed > 0) {
  console.error(`${failed} check(s) failed.`);
  process.exit(1);
}
console.log('All checks passed.');
process.exit(0);
