#!/usr/bin/env node
/**
 * Genera le aree della hub /colleghi/ dal catalogo (colleghi/catalogo.json).
 *
 * Uso:
 *   node tools/build-colleghi.mjs           # riscrive il blocco dentro colleghi/index.html
 *   node tools/build-colleghi.mjs --check   # verifica che l'HTML sia allineato al catalogo (exit 1 se no)
 *
 * Il catalogo e' la fonte di verita': si modifica quello, non l'HTML.
 * Le voci `tipo: "doc"` (i PDF dentro le raccolte) non vengono elencate: finiscono
 * nel blocco JSON `#cat-docs` e si trovano solo con la ricerca.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CAT = resolve(ROOT, 'colleghi/catalogo.json');
const PAGE = resolve(ROOT, 'colleghi/index.html');
const START = '<!-- catalogo:start -->';
const END = '<!-- catalogo:end -->';

const AREE = {
  compilare: {
    titolo: 'Compilare e inviare',
    intro: 'Moduli, facsimili e richieste da consegnare o inviare.',
    icona: 'fa-file-signature',
  },
  prescrivere: {
    titolo: 'Prescrivere e certificare',
    intro: 'Criteri, codici, protocolli e moduli di prescrizione o certificazione.',
    icona: 'fa-file-prescription',
  },
  percorsi: {
    titolo: 'Percorsi e accessi',
    intro: 'Dove mandare il paziente: sedi, orari, procedure e contatti dei percorsi.',
    icona: 'fa-route',
  },
  strumenti: {
    titolo: 'Software, turni e strumenti di studio',
    intro: 'Millewin e i suoi manuali, RUAP e turni, calcolatori, note operative sempre aggiornate.',
    icona: 'fa-toolbox',
  },
  paziente: {
    titolo: 'Per il paziente',
    intro: 'Fogli da stampare o da linkare: schede multilingue, FAQ, esenzioni, impegnative.',
    icona: 'fa-print',
  },
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// stesso indice di ricerca del client: minuscole, senza accenti
const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const cat = JSON.parse(readFileSync(CAT, 'utf8'));
const voci = cat.voci;
const perArea = (a) => voci.filter((v) => v.area === a && v.tipo === 'page');
const docs = voci.filter((v) => v.tipo === 'doc');
const link = voci.filter((v) => v.tipo === 'link');

let out = [];
out.push(START);
out.push('            <!-- Generato da tools/build-colleghi.mjs a partire da colleghi/catalogo.json.');
out.push('                 Non modificare a mano: le modifiche vanno fatte nel catalogo. -->');

for (const [key, meta] of Object.entries(AREE)) {
  const items = perArea(key);
  if (!items.length) continue;
  out.push(`            <section class="cat-area" id="area-${key}" data-area="${key}" aria-labelledby="h-${key}">`);
  out.push(
    `                <h2 class="cat-h2" id="h-${key}"><i class="fas ${meta.icona}" aria-hidden="true"></i>${esc(
      meta.titolo
    )}<span class="cat-n"> ${items.length}</span></h2>`
  );
  out.push(`                <p class="cat-intro">${esc(meta.intro)}</p>`);
  out.push(
    `                <ul class="cat-list" data-area="${key}" data-more="Mostra tutte le ${items.length} risorse">`
  );
  for (const v of items) {
    const k = norm([v.titolo, v.desc, v.kw, (v.tag || []).join(' ')].join(' '));
    const sub = v.sub || v.desc || '';
    out.push(
      `                    <li class="cat-item" data-g="${esc((v.tag || []).join(' '))}" data-k="${esc(k)}"><a href="${esc(
        v.href
      )}"><i class="fas ${esc(v.icona || 'fa-file-lines')}" aria-hidden="true"></i><span class="cat-body"><span class="cat-title">${esc(
        v.titolo
      )}</span>${sub ? `<span class="cat-sub">${esc(sub)}</span>` : ''}</span></a></li>`
    );
  }
  out.push('                </ul>');
  out.push('            </section>');
}

// --- portali e link esterni: blocco compatto, cercabile ma fuori dalle aree
if (link.length) {
  out.push('            <section class="cat-area cat-links" id="area-link" aria-labelledby="h-link">');
  out.push(
    `                <h2 class="cat-h2" id="h-link"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>Portali e link esterni<span class="cat-n"> ${link.length}</span></h2>`
  );
  out.push(
    '                <p class="cat-intro">Siti che si aprono fuori da savianu.it: portali regionali, ordini, agenzie. Restano cercabili dalla barra qui sopra.</p>'
  );
  out.push('                <ul class="cat-linklist">');
  for (const v of link) {
    const k = norm([v.titolo, v.desc, v.kw].join(' '));
    out.push(
      `                    <li class="cat-item" data-g="${esc((v.tag || []).join(' '))}" data-k="${esc(k)}"><a href="${esc(
        v.href
      )}" target="_blank" rel="noopener noreferrer">${esc(v.titolo)}<span>${esc(v.sub || v.desc)}</span></a></li>`
    );
  }
  out.push('                </ul>');
  out.push('            </section>');
}

// --- documenti dentro le raccolte: solo per la ricerca
const docsPayload = docs.map((v) => ({
  t: v.titolo,
  s: v.sub || '',
  h: v.href,
  k: norm([v.titolo, v.desc, v.kw, (v.tag || []).join(' ')].join(' ')),
  g: (v.tag || []).join(' '),
}));
out.push('            <script type="application/json" id="cat-docs">');
out.push(JSON.stringify(docsPayload));
out.push('            </script>');
out.push(END);

const block = out.join('\n');
const html = readFileSync(PAGE, 'utf8');
const i0 = html.indexOf(START);
const i1 = html.indexOf(END);
if (i0 < 0 || i1 < 0) {
  console.error(`Mancano i marcatori ${START} / ${END} in colleghi/index.html`);
  process.exit(1);
}
const next = html.slice(0, i0) + block + html.slice(i1 + END.length);
const check = process.argv.includes('--check');

if (check) {
  if (next !== html) {
    console.error('build-colleghi --check: colleghi/index.html NON e\' allineato a colleghi/catalogo.json');
    console.error('Esegui: node tools/build-colleghi.mjs');
    process.exit(1);
  }
  console.log(`OK: hub colleghi allineata al catalogo (${voci.length} voci)`);
} else {
  writeFileSync(PAGE, next);
  console.log(
    `build-colleghi: ${perArea('compilare').length + perArea('prescrivere').length + perArea('percorsi').length + perArea('strumenti').length + perArea('paziente').length} voci in ${Object.keys(AREE).length} aree, ${link.length} link esterni, ${docs.length} documenti in indice`
  );
}
