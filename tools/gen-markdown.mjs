#!/usr/bin/env node
// Generate Markdown-for-Agents .md files from a route manifest.
//
// Each published page gets a sibling .md (e.g. ssn/index.md) served raw by
// GitHub Pages (.nojekyll present) and negotiated by cloudflare/worker.js when
// a request carries Accept: text/markdown.
//
// Design: MANIFEST-DRIVEN, not scraped. Pages on this site are JS-assembled, so
// HTML->Markdown extraction yields thin content. Instead, each route points to a
// hand-authored stub (markdown/<name>.md) that becomes the body; the generator
// extracts <title>/<meta description> from the live index.html to build accurate
// YAML frontmatter. Adding a new page = add ONE entry to markdown-routes.json.
//
// Usage:
//   node tools/gen-markdown.mjs            # write all .md + llms.txt
//   node tools/gen-markdown.mjs --check   # exit 1 if any generated file is stale
//   node tools/gen-markdown.mjs --map      # print the MARKDOWN_MAP JS block for the worker

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(ROOT, 'tools', 'markdown-routes.json');
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const SITE = manifest.site.replace(/\/$/, '');

const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');
const MAP = args.has('--map');

// ── helpers ──────────────────────────────────────────────────────────────
function extractMeta(htmlPath, override) {
  const html = readFileSync(htmlPath, 'utf8');
  const pick = (re, fallback) => {
    const m = html.match(re);
    return m ? m[1].replace(/\s+/g, ' ').trim() : fallback;
  };
  const title = override?.titleOverride
    || pick(/<title>([^<]*)<\/title>/i)
    || pick(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i)
    || '';
  const description = pick(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || pick(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i)
    || '';
  return { title, description };
}

function buildMarkdown(route) {
  const htmlPath = join(ROOT, route.html);
  const stubPath = join(ROOT, route.stub);
  if (!existsSync(htmlPath)) throw new Error(`HTML not found: ${route.html}`);
  if (!existsSync(stubPath)) throw new Error(`Stub not found: ${route.stub}`);
  const { title, description } = extractMeta(htmlPath, route);
  const body = readFileSync(stubPath, 'utf8').replace(/^\uFEFF/, '').trimEnd() + '\n';
  const front = `---\ntitle: ${title}\ndescription: ${description}\n---\n\n`;
  return front + body;
}

function relUrl(md) {
  // md like "ssn/index.md" or "home.md" -> "/ssn/" or "/"
  const base = md.replace(/\/index\.md$/, '/').replace(/^home\.md$/, '');
  return base.startsWith('/') || base === '' ? (base || '/') : '/' + base;
}

function relEndpoint(md) {
  // md like "ssn/index.md" or "home.md" -> "/ssn/index.md" or "/home.md"
  return md.startsWith('/') ? md : '/' + md;
}

// ── generate .md files ─────────────────────────────────────────────────────
const writes = [];
for (const route of manifest.routes) {
  const md = buildMarkdown(route);
  const outPath = join(ROOT, route.md);
  if (CHECK) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';
    if (current !== md) {
      console.error(`STALE: ${route.md} differs from generated output. Run: node tools/gen-markdown.mjs`);
      process.exit(1);
    }
  } else {
    writeFileSync(outPath, md, 'utf8');
    writes.push(route.md);
  }
}

// ── llms.txt ──────────────────────────────────────────────────────────────
function buildLlmsTxt() {
  const lines = [
    `# Studio Medico Ippocrate — Dott. Emanuel Savianu (savianu.it)`,
    ``,
    `> Sito ufficiale del Dott. Emanuel Savianu, Medico di Medicina Generale (SSN) ad Arezzo. Contenuti per pazienti del SSN, consulti e certificati INPS in libera professione, e area riservata ai colleghi medici.`,
    ``,
    `## Sezioni principali`,
    ``,
  ];
  for (const route of manifest.routes) {
    const { title } = extractMeta(join(ROOT, route.html), route);
    const url = SITE + relUrl(route.md);
    lines.push(`- [${title}](${url})`);
  }
  lines.push(``);
  lines.push(`## Markdown per agenti`);
  lines.push(``);
  lines.push(`Ogni sezione è disponibile in formato Markdown tramite content negotiation:`);
  lines.push(`invia l'header HTTP \`Accept: text/markdown\` (il worker edge lo gestisce), oppure apri direttamente i file:`);
  lines.push(``);
  for (const route of manifest.routes) {
    const url = SITE + relEndpoint(route.md);
    lines.push(`- [${relEndpoint(route.md)}](${url})`);
  }
  lines.push(``);
  lines.push(`## Contatti generali`);
  lines.push(``);
  lines.push(`- **Studio Medico Ippocrate** — Piazza Saione 3, Arezzo`);
  lines.push(`- **Segreteria:** 0575 910 904 — Lun–Ven 09:30–12:30 · 16:00–19:00`);
  lines.push(`- **Prenotazioni / ricette / messaggi:** Doctolib`);
  lines.push(`- **Urgenze:** 112 (Numero Unico) · 116 117 (Guardia Medica non urgente, 24h)`);
  lines.push(``);
  return lines.join('\n');
}

const llmsPath = join(ROOT, 'llms.txt');
if (CHECK) {
  const current = existsSync(llmsPath) ? readFileSync(llmsPath, 'utf8') : '';
  if (current !== buildLlmsTxt()) {
    console.error(`STALE: llms.txt differs from generated output. Run: node tools/gen-markdown.mjs`);
    process.exit(1);
  }
} else if (!MAP) {
  writeFileSync(llmsPath, buildLlmsTxt(), 'utf8');
  writes.push('llms.txt');
}

// ── worker MARKDOWN_MAP block ──────────────────────────────────────────────
if (MAP) {
  const entries = manifest.routes.flatMap((r) => {
    const ep = relEndpoint(r.md);
    const url = relUrl(r.md);
    const key = url === '/' ? '/' : url.replace(/\/$/, '');
    const out = [];
    out.push(`  '${key}':                 '${ep}',`);
    if (key !== '/' && key !== '') out.push(`  '${key}/index.html':   '${ep}',`);
    return out;
  });
  console.log('const MARKDOWN_MAP = {');
  console.log(entries.join('\n'));
  console.log('};');
  process.exit(0);
}

// ── summary ───────────────────────────────────────────────────────────────
if (CHECK) {
  console.log(`gen-markdown --check: all ${manifest.routes.length} routes + llms.txt up to date.`);
} else {
  console.log(`gen-markdown: wrote ${writes.length} files (${manifest.routes.length} .md + llms.txt).`);
}
