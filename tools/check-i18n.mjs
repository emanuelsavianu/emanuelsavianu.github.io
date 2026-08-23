#!/usr/bin/env node
// i18n completeness checker for savianu.it
// Usage: node tools/check-i18n.mjs
// 1. Verifies every `it` translation key has an `en` counterpart in app.js.
// 2. Verifies every data-i18n key used in HTML (root, ssn/, privati/) exists
//    in BOTH language blocks of app.js.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDE_DIRS = new Set(['node_modules', 'cloudflare', '.claude', '.git', 'docs', 'email-templates', 'schema-templates', '.superpowers', 'colleghi']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry)) walk(full, out);
    } else if (entry.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

const appJs = readFileSync(join(ROOT, 'app.js'), 'utf8');

// Extract the `it` and `en` objects from the translations structure
function extractLangBlock(lang) {
  const re = new RegExp(`^\\s*${lang}:\\s*\\{`, 'm');
  const start = appJs.search(re);
  if (start < 0) return null;
  // Brace matching from the opening brace
  const open = appJs.indexOf('{', start);
  let depth = 0, end = -1;
  for (let i = open; i < appJs.length; i++) {
    if (appJs[i] === '{') depth++;
    else if (appJs[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const block = appJs.slice(open + 1, end);
  // Match keys with flexible indentation (8+ spaces)
  const keys = [...block.matchAll(/^\s{8,}(\w+):/gm)].map(m => m[1]);
  return new Set(keys);
}

const itKeys = extractLangBlock('it');
const enKeys = extractLangBlock('en');

if (!itKeys || !enKeys) {
  console.error('FATAL: could not locate it/en blocks in app.js');
  process.exit(1);
}

let errors = 0;

// 1. it -> en parity
for (const key of itKeys) {
  if (!enKeys.has(key)) {
    errors++;
    console.log(`MISSING EN: ${key}`);
  }
}
for (const key of enKeys) {
  if (!itKeys.has(key)) {
    errors++;
    console.log(`MISSING IT: ${key}`);
  }
}

// 2. HTML usage coverage (only IT/EN pages)
const files = walk(ROOT);
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const used = new Set([...content.matchAll(/data-i18n(?:-placeholder|-aria-label)?="([^"]+)"/g)].map(m => m[1]));
  for (const key of used) {
    if (key === 'skip_link' || key === 'floating_faq_label') continue; // injected by app.js itself
    if (!itKeys.has(key) || !enKeys.has(key)) {
      errors++;
      console.log(`UNKNOWN KEY ${key} used in ${file.replace(ROOT + '\\', '')}`);
    }
  }
}

if (errors > 0) {
  console.log(`\n${errors} i18n issue(s) found.`);
  process.exit(1);
}
console.log(`OK: ${itKeys.size} IT keys, ${enKeys.size} EN keys, full parity + HTML coverage.`);
