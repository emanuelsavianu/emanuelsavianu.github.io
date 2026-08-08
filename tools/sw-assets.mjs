#!/usr/bin/env node
// Shared SW precache list generator for savianu.it
// Used by tools/update-sw.mjs, tools/check-sw.mjs and .claude/scripts/bump-sw.mjs

import { readdirSync, statSync } from 'fs';
import { join, resolve, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDE_DIRS = new Set(['node_modules', 'cloudflare', '.claude', '.git', 'docs', 'email-templates', 'schema-templates', '.superpowers', 'RUAP', 'gestoreturni']);
const EXCLUDE_FILES = new Set(['xsegretarie.html']);
const STATIC_ASSETS = ['/styles.css', '/app.js', '/config.js', '/manifest.json', '/assets/bluelogo.png', '/assets/bronzelogo.png'];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry)) walk(full, out);
    } else if (entry.endsWith('.html') && !EXCLUDE_FILES.has(entry)) {
      out.push(full);
    }
  }
  return out;
}

export function computePrecacheUrls() {
  const pages = walk(ROOT).map(f => {
    const rel = relative(ROOT, f).split(sep).join('/');
    if (rel === 'index.html') return '/';
    const url = '/' + rel;
    return rel.endsWith('/index.html') ? [url, url.replace(/index\.html$/, '')] : [url];
  }).flat();

  const unique = [...new Set(pages)];
  return ['/offline.html', '/404.html', ...unique, ...STATIC_ASSETS];
}
