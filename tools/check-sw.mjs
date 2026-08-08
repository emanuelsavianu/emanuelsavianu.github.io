#!/usr/bin/env node
// Verifies sw.js PRECACHE_URLS match the repo's generated list. Exit 1 on drift.
// Usage: node tools/check-sw.mjs

import { readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { computePrecacheUrls } from './sw-assets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const match = sw.match(/const PRECACHE_URLS = \[([\s\S]*?)\];/);
if (!match) { console.error('FAIL: PRECACHE_URLS not found in sw.js'); process.exit(1); }
const current = [...match[1].matchAll(/^\s*'([^']+)',?\s*$/gm)].map(m => m[1]);
const expected = computePrecacheUrls();
const missing = expected.filter(u => !current.includes(u));
const stale = current.filter(u => !expected.includes(u));
if (missing.length || stale.length) {
  console.error('FAIL: sw.js precache list is out of date. Run: node tools/update-sw.mjs');
  if (missing.length) console.error('  missing:', missing.join(', '));
  if (stale.length) console.error('  stale:  ', stale.join(', '));
  process.exit(1);
}
console.log(`OK: sw.js precache list in sync (${current.length} URLs).`);
