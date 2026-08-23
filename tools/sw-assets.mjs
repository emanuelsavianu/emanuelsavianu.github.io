#!/usr/bin/env node
// Shared SW precache list generator for savianu.it
// Used by tools/update-sw.mjs, tools/check-sw.mjs and .claude/scripts/bump-sw.mjs

import { readdirSync, statSync } from 'fs';
import { join, resolve, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDE_DIRS = new Set(['node_modules', 'cloudflare', '.claude', '.git', 'docs', 'email-templates', 'schema-templates', '.superpowers', 'RUAP', 'gestoreturni']);
const EXCLUDE_FILES = new Set(['xsegretarie.html']);
const STATIC_ASSETS = ['/styles.css', '/app.js', '/config.js', '/manifest.json', '/assets/bluelogo.png', '/assets/bronzelogo.png', '/assets/studio/studio-location-desktop.avif', '/assets/studio/studio-location-desktop.webp', '/assets/studio/studio-location-tablet.avif', '/assets/studio/studio-location-tablet.webp', '/assets/studio/studio-location-mobile.avif', '/assets/studio/studio-location-mobile.webp', '/assets/fontawesome/css/fontawesome.min.css', '/assets/fontawesome/css/solid.min.css', '/assets/fontawesome/webfonts/fa-solid-900.woff2', '/assets/fonts/fonts.css', '/assets/fonts/montserrat-var-latin.woff2', '/assets/fonts/montserrat-var-latin-ext.woff2', '/assets/fonts/cormorant-garamond-var-latin.woff2', '/assets/fonts/cormorant-garamond-var-latin-ext.woff2', '/assets/css/tools.default.min.css', '/assets/css/tools.tw.blue.min.css', '/assets/css/tools.tw.navy.min.css', '/assets/css/tools.tw.teal.min.css'];

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
  return [...new Set(['/offline.html', '/404.html', ...unique, ...STATIC_ASSETS])];
}
