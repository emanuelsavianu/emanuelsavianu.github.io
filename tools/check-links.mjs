#!/usr/bin/env node
// Broken relative link checker for savianu.it
// Usage: node tools/check-links.mjs
// Scans all *.html files, resolves relative href/src, reports missing targets.

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve, normalize, sep } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDE_DIRS = new Set(['node_modules', 'cloudflare', '.claude', '.git', 'docs', 'email-templates', 'schema-templates', '.superpowers']);

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

function hrefTargets(content) {
  const re = /(?:href|src)="([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    const v = m[1];
    if (/^(https?:|tel:|mailto:|#|javascript:|data:|blob:|about:)/.test(v)) continue;
    if (v.startsWith('//')) continue; // protocol-relative
    if (v.includes('://')) continue;
    // Normalize leading slash to be relative to site root
    const normalized = v.startsWith('/') ? v.slice(1) : v;
    out.push(normalized.split('#')[0].split('?')[0]);
  }
  return out;
}

const files = walk(ROOT);
let broken = 0;

for (const file of files) {
  const dir = dirname(file);
  const content = readFileSync(file, 'utf8');
  for (const target of hrefTargets(content)) {
    if (!target) continue;
    let resolved = normalize(resolve(dir, target));
    if (existsSync(resolved)) continue;
    // Directory index resolution: 'ssn/' or 'ssn' -> ssn/index.html
    const withIndex = join(resolved, 'index.html');
    const withHtml = resolved.endsWith(sep) ? join(resolved, 'index.html') : resolved + '.html';
    if (existsSync(withIndex) || existsSync(withHtml)) continue;
    broken++;
    console.log(`BROKEN: ${file.replace(ROOT + sep, '')} -> ${target}`);
  }
}

if (broken > 0) {
  console.log(`\n${broken} broken link(s) found.`);
  process.exit(1);
}
console.log(`OK: ${files.length} HTML files, no broken relative links.`);