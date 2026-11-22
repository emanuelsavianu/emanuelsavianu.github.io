#!/usr/bin/env node
/**
 * Genera cloudflare/pdf-redirects.mjs a partire da pdf-drive-map.json.
 *
 * Uso:
 *   node tools/gen-pdf-redirects.mjs           # scrive il modulo
 *   node tools/gen-pdf-redirects.mjs --check   # exit 1 se non è allineato
 *
 * Perché esiste: i PDF del sito non stanno più nel repository ma su Google
 * Drive (limiti di dimensione GitHub). Chi ha in mano un link vecchio — un
 * bookmark, una email, un PDF indicizzato da Google, un poster stampato —
 * finirebbe su un 404 di GitHub Pages. Il worker Cloudflare risponde 301 verso
 * il file Drive: fonte unica resta pdf-drive-map.json, quindi il modulo è
 * GENERATO e il --check (dentro `npm test`) impedisce la deriva.
 *
 * Gli archivi (.zip) puntano alla pagina Drive del file, non al download
 * diretto: Google non serve i .zip con `uc?export=download` senza la conferma
 * antivirus, e la pagina di visualizzazione ha comunque il pulsante Download.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAP_FILE = join(ROOT, 'pdf-drive-map.json');
const OUT = join(ROOT, 'cloudflare', 'pdf-redirects.mjs');
const CHECK = process.argv.includes('--check');

const map = JSON.parse(readFileSync(MAP_FILE, 'utf8'));

const quote = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const lines = Object.entries(map.files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([sitePath, meta]) => {
    const isPdf = sitePath.toLowerCase().endsWith('.pdf');
    const target = isPdf
      ? map.base + meta.id
      : `https://drive.google.com/file/d/${meta.id}/view`;
    return `  ${quote('/' + sitePath)}: ${quote(target)},`;
  });

const moduleText = `/**
 * GENERATO da tools/gen-pdf-redirects.mjs — non modificare a mano.
 *
 * Vecchi URL dei documenti scaricabili (${lines.length} voci): i file non sono
 * più nel repository GitHub ma su Google Drive, cartella «${map.cartella}».
 * Il worker risponde 301 verso Drive, così link in entrata, bookmark e
 * documenti indicizzati continuano a funzionare.
 * Fonte: pdf-drive-map.json (aggiornata ${map.aggiornata}).
 */

export const PDF_REDIRECTS = {
${lines.join('\n')}
};
`;

if (CHECK) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== moduleText) {
    console.error('[pdf-redirects] cloudflare/pdf-redirects.mjs non allineato a pdf-drive-map.json.');
    console.error('  Rilancia: node tools/gen-pdf-redirects.mjs');
    process.exit(1);
  }
  console.log(`[pdf-redirects] OK: ${lines.length} redirect allineati alla mappa Drive.`);
  process.exit(0);
}

writeFileSync(OUT, moduleText, 'utf8');
console.log(`[pdf-redirects] scritto cloudflare/pdf-redirects.mjs — ${lines.length} redirect.`);
