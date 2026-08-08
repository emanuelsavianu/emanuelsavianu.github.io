#!/usr/bin/env node
// Regenerates PRECACHE_URLS in sw.js and bumps the savianu-vN cache version.
// Usage: node tools/update-sw.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { computePrecacheUrls } from './sw-assets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SW_PATH = join(ROOT, 'sw.js');
const sw = readFileSync(SW_PATH, 'utf8');

const urls = computePrecacheUrls();
const arrayBody = urls.map(u => `  '${u}',`).join('\n');
const newList = `const PRECACHE_URLS = [\n${arrayBody}\n];`;
const newSw = sw
  .replace(/const PRECACHE_URLS = \[[\s\S]*?\];/, newList)
  .replace(/savianu-v(\d+)/, (_, n) => 'savianu-v' + (+n + 1));

writeFileSync(SW_PATH, newSw, 'utf8');
const version = newSw.match(/savianu-v(\d+)/)[1];
console.log(`sw.js updated: ${urls.length} precache URLs, cache version savianu-v${version}`);
