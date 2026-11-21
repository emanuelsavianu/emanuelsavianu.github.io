#!/usr/bin/env node
// SEO/meta guardrail: blocca le regressioni che Google vede per prime.
// Verifica, per ogni pagina indicizzabile:
//   - <head> chiuso, <html lang>, un solo <h1>
//   - <title> 15–70 caratteri, <meta description> 50–170
//   - canonical self-referencing in forma directory (/cartella/, mai index.html)
//   - Open Graph completo + twitter:card
//   - blocchi JSON-LD parse-abili
//   - presenza in sitemap.xml (e nessuna <loc> morta)
// Le pagine con <meta name="robots" content="noindex"> sono escluse dai
// controlli di metadata (strumenti interni), ma restano controllate su <head>.
// Usage: node tools/check-seo.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'docs', 'design', 'assets', 'markdown', 'cloudflare',
  'openspec', '.github', '.hermes', '.opencode', '.impeccable', '.slim',
]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const rel = (f) => relative(ROOT, f).split(sep).join('/');
const urlFor = (f) => {
  const r = rel(f);
  if (r === 'index.html') return 'https://savianu.it/';
  if (r.endsWith('/index.html')) return 'https://savianu.it/' + r.slice(0, -'index.html'.length);
  return 'https://savianu.it/' + r;
};
const fileFor = (u) => {
  const r = u.replace('https://savianu.it/', '');
  if (r === '') return 'index.html';
  return r.endsWith('/') ? r + 'index.html' : r;
};
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return m ? m[2].trim() : null;
};
const pickTag = (src, test) => src.match(test)?.[0] || null;

const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));
const titles = new Map();
const failures = [];
const warnings = [];
let indexable = 0;
let checked = 0;

for (const f of walk(ROOT)) {
  checked++;
  const src = readFileSync(f, 'utf8');
  const r = rel(f);
  const url = urlFor(f);

  if (!/<\/head>/i.test(src)) failures.push(`${r}: <head> non chiuso (</head> mancante)`);
  if (!/<html[^>]*\slang=["'][^"']+["']/i.test(src)) failures.push(`${r}: <html lang> mancante`);

  const h1 = [...src.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)];
  if (h1.length !== 1) failures.push(`${r}: ${h1.length} <h1> (atteso 1)`);

  for (const [, blk] of src.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(blk); } catch { failures.push(`${r}: blocco JSON-LD non parse-abibile`); }
  }

  const robotsTag = pickTag(src, /<meta\s+name=["']robots["'][^>]*>/i);
  const robots = robotsTag ? (attr(robotsTag, 'content') || '').toLowerCase() : '';
  if (robots.includes('noindex')) continue;
  indexable++;

  const titleTag = pickTag(src, /<title[^>]*>[\s\S]*?<\/title>/i);
  const title = titleTag ? titleTag.replace(/<\/?title[^>]*>/gi, '').trim() : '';
  if (!title) failures.push(`${r}: <title> mancante`);
  else if (title.length < 15 || title.length > 70) failures.push(`${r}: <title> ${title.length} caratteri (15–70)`);
  if (title) {
    if (titles.has(title)) warnings.push(`${r}: titolo duplicato con ${titles.get(title)} — "${title}"`);
    else titles.set(title, r);
  }

  const descTag = pickTag(src, /<meta\s+name=["']description["'][^>]*>/i);
  const desc = descTag ? (attr(descTag, 'content') || '') : '';
  if (!desc) failures.push(`${r}: <meta description> mancante`);
  else if (desc.length < 50 || desc.length > 170) failures.push(`${r}: description ${desc.length} caratteri (50–170)`);

  const canonTag = pickTag(src, /<link[^>]*rel=["']canonical["'][^>]*>/i);
  const canon = canonTag ? attr(canonTag, 'href') : null;
  if (!canon) failures.push(`${r}: canonical mancante`);
  else if (canon !== url) failures.push(`${r}: canonical ${canon} ≠ ${url}`);

  for (const [prop, label] of [['og:title', 'og:title'], ['og:description', 'og:description'], ['og:image', 'og:image'], ['og:url', 'og:url']]) {
    const tag = pickTag(src, new RegExp(`<meta\\s+property=["']${prop}["'][^>]*>`, 'i'));
    if (!tag || !attr(tag, 'content')) failures.push(`${r}: ${label} mancante`);
  }
  if (!pickTag(src, /<meta\s+name=["']twitter:card["'][^>]*>/i)) failures.push(`${r}: twitter:card mancante`);

  if (!sitemapUrls.has(url)) failures.push(`${r}: pagina indicizzabile assente da sitemap.xml`);
}

for (const u of sitemapUrls) {
  if (!existsSync(join(ROOT, fileFor(u)))) failures.push(`sitemap.xml: <loc> morta ${u}`);
}

for (const w of warnings) console.log(`WARN: ${w}`);
for (const f of failures) console.log(`FAIL: ${f}`);
console.log('');
if (failures.length) {
  console.error(`${failures.length} problema/i SEO su ${indexable} pagine indicizzabili (${checked} HTML).`);
  process.exit(1);
}
console.log(`OK: ${indexable} pagine indicizzabili (${checked} HTML) con metadata, canonical, OG e sitemap coerenti.`);
