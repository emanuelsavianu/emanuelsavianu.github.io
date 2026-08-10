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
  { name: 'Link integrity',          cmd: NODE, args: [join('tools', 'check-links.mjs')] },
  { name: 'i18n parity + coverage',  cmd: NODE, args: [join('tools', 'check-i18n.mjs')] },
  { name: 'SW precache sync',        cmd: NODE, args: [join('tools', 'check-sw.mjs')] },
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
