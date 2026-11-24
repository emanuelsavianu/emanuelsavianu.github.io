#!/usr/bin/env node
/**
 * Genera la pagina indice della modulistica: colleghi/modulistica/index.html
 *
 * Uso:
 *   node tools/build-modulistica.mjs           # scrive la pagina
 *   node tools/build-modulistica.mjs --check   # exit 1 se la pagina non è allineata
 *
 * Perché esiste: /colleghi/modulistica/ è linkata dalla home (CTA «Modulistica»)
 * e dalle pagine dei colleghi, ma nella cartella c'erano solo PDF e nessun
 * index.html → GitHub Pages rispondeva 404. La pagina è GENERATA perché i
 * documenti sono 54: l'elenco deve restare allineato al contenuto della
 * cartella, e il --check (dentro `npm test`) lo impone.
 *
 * Fonte di verità: colleghi/modulistica.json (titoli, gruppi, descrizioni).
 * Il numero di pagine viene dal campo `pagine`; il peso e l'URL di apertura
 * vengono da pdf-drive-map.json: i PDF NON stanno più nel repository (occupano
 * ~105 MB e GitHub ha limiti di dimensione per account) ma su Google Drive,
 * nella cartella «savianu.it-website-files». Il --check confronta il JSON con la
 * mappa Drive, così un documento elencato senza file resta un errore.
 * L'ordine dei gruppi e delle voci è quello del JSON, non alfabetico.
 *
 * Il markup di <site-nav> lo scrive tools/prerender.mjs: qui viene reso in
 * memoria con la STESSA funzione (chrome.js) per poter confrontare il file.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONFIG } from '../config.js';
import { siteNavInnerHTML } from '../chrome.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'colleghi', 'modulistica');
const DATA = join(ROOT, 'colleghi', 'modulistica.json');
const OUT = join(DIR, 'index.html');
const CHECK = process.argv.includes('--check');

const URL_PAGE = 'https://savianu.it/colleghi/modulistica/';
const STYLES_V = '20261124c';
const APP_V = '20261124c';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function peso(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

const data = JSON.parse(readFileSync(DATA, 'utf8'));

// --- mappa Drive: file del sito -> id Drive (+ peso). Vedi pdf-drive-map.json.
const DRIVE = JSON.parse(readFileSync(join(ROOT, 'pdf-drive-map.json'), 'utf8'));
const DRIVE_BASE = DRIVE.base;
const entry = (file) => DRIVE.files[`colleghi/modulistica/${file}`];
const driveUrl = (file) => `${DRIVE_BASE}${entry(file).id}`;

// --- coerenza dati <-> mappa Drive: il controllo che impedisce il ritorno del 404
const listed = data.gruppi.flatMap((g) => g.voci.map((v) => v.file));
const dupes = listed.filter((f, i) => listed.indexOf(f) !== i);
const missingDrive = listed.filter((f) => !entry(f) || !entry(f).id);
const mapped = Object.keys(DRIVE.files)
  .filter((k) => k.startsWith('colleghi/modulistica/'))
  .map((k) => k.slice('colleghi/modulistica/'.length));
const orphanDrive = mapped.filter((f) => !listed.includes(f));
// Un PDF rimesso nella cartella (invece che su Drive) è uno spreco di repository:
// va segnalato, non ignorato.
const onDisk = readdirSync(DIR).filter((f) => extname(f).toLowerCase() === '.pdf').sort();
const unlisted = onDisk.filter((f) => !listed.includes(f));
const problems = [];
if (dupes.length) problems.push(`voci duplicate nel JSON: ${[...new Set(dupes)].join(', ')}`);
if (missingDrive.length) problems.push(`voci senza file nella mappa Drive: ${missingDrive.join(', ')}`);
if (orphanDrive.length) problems.push(`file nella mappa Drive non elencati nel JSON: ${orphanDrive.join(', ')}`);
if (unlisted.length) problems.push(`PDF rimessi nella cartella del repository: ${unlisted.join(', ')}`);
if (problems.length) {
  console.error('[modulistica] dati non coerenti con la mappa Drive:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

function renderSections() {
  const out = [];
  for (const g of data.gruppi) {
    out.push(`        <section class="protocol-section mod-group" id="g-${esc(g.id)}" aria-labelledby="h-${esc(g.id)}">`);
    out.push(
      `            <h2 class="mod-h2" id="h-${esc(g.id)}"><i class="fas ${esc(g.icona)}" aria-hidden="true"></i>${esc(
        g.titolo
      )}<span class="mod-n">${g.voci.length}</span></h2>`
    );
    out.push(`            <p class="mod-intro">${esc(g.intro)}</p>`);
    out.push('            <ul class="mod-list">');
    for (const v of g.voci) {
      const size = peso(entry(v.file).size);
      const meta = [v.ente, v.pagine === 1 ? '1 pagina' : `${v.pagine} pagine`].join(' · ');
      const k = norm([v.titolo, v.desc, v.ente, v.file].join(' '));
      out.push(
        `                <li class="mod-item" data-k="${esc(k)}"><a href="${esc(driveUrl(v.file))}" target="_blank" rel="noopener">` +
          `<span class="mod-body"><span class="mod-title">${esc(v.titolo)}</span>` +
          `<span class="mod-meta">${esc(meta)}</span>` +
          `<span class="mod-desc">${esc(v.desc)}</span>` +
          `<span class="mod-open"><i class="fas fa-file-pdf" aria-hidden="true"></i> Apri il PDF <span class="mod-size">(${esc(
            size
          )})</span></span></span></a></li>`
      );
    }
    out.push('            </ul>');
    out.push('        </section>');
  }
  return out.join('\n');
}

const totale = listed.length;

const html = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">

    <title>Modulistica per MMG e PLS | Dott. Savianu</title>
    <meta name="description" content="${esc(data.descrizione)} ${totale} PDF in elenco.">
    <link rel="canonical" href="${URL_PAGE}">

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Modulistica per MMG e PLS | Dott. Savianu",
      "url": "${URL_PAGE}",
      "description": ${JSON.stringify(data.descrizione)},
      "inLanguage": "it-IT",
      "isPartOf": { "@type": "WebSite", "name": "Dott. Emanuel Savianu", "url": "https://savianu.it/" },
      "author": {
        "@type": "Physician",
        "name": "Dott. Emanuel Savianu",
        "url": "https://savianu.it/"
      },
      "about": { "@type": "Thing", "name": "Moduli e facsimili per la medicina generale" }
    }
    </script>

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${URL_PAGE}">
    <meta property="og:locale" content="it_IT">
    <meta property="og:site_name" content="Studio Medico Ippocrate">
    <meta property="og:title" content="Modulistica per MMG e PLS | Dott. Savianu">
    <meta property="og:description" content="${esc(data.descrizione)}">
    <meta property="og:image" content="https://savianu.it/assets/bronzelogo.png">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${URL_PAGE}">
    <meta name="twitter:title" content="Modulistica per MMG e PLS | Dott. Savianu">
    <meta name="twitter:description" content="${esc(data.descrizione)}">
    <meta name="twitter:image" content="https://savianu.it/assets/bronzelogo.png">

    <meta name="theme-color" content="#1a2f4c">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="icon" href="../../assets/pwa-icon-192.png">

<link rel="stylesheet" href="../../assets/fonts/fonts.css">
<link rel="preload" href="../../assets/fonts/montserrat-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../../assets/fonts/cormorant-garamond-var-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="../../assets/fontawesome/webfonts/fa-solid-900.subset.woff2?v=4" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="../../assets/fontawesome/css/fontawesome.min.css">
    <link rel="stylesheet" href="../../assets/fontawesome/css/solid.subset.css">
    <script>
(function(){try{
  var s=localStorage.getItem('savianu-theme');
  if(s==null&&localStorage.getItem('darkMode')==='enabled')s='dark';
  if(s==='dark'||(!s&&matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.classList.add('dark-mode');
}catch(e){}})();
</script>
    <link rel="stylesheet" href="../../styles.css?v=${STYLES_V}">

    <style>
        /* La barra di ricerca è sticky: un link a #g-… deve atterrare sotto
           la barra, non dietro. 80px = altezza barra (69px) + margine. */
        html { scroll-padding-top: 80px; }

        .page-wrapper {
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
        }

        .page-hero { padding: 40px 28px 32px; }
        .page-hero::before { top: -60px; right: -60px; width: 280px; height: 280px; }
        .hero-title {
            font-size: clamp(1.6rem, 4vw, 2.2rem);
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
        }
        .hero-desc {
            font-size: 0.85rem;
            margin: 0 auto;
            line-height: 1.6;
        }

        .content-wrapper {
            flex: 1;
            padding: 40px 28px;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
        }

        .protocol-section { margin-bottom: 32px; }

        /* Barra di ricerca: stesso comportamento della hub /colleghi/ */
        .mod-toolbar {
            position: sticky; top: 0; z-index: 5;
            display: flex; flex-wrap: nowrap; align-items: center; gap: 12px;
            padding: 12px 0 14px; margin-bottom: 8px;
            background: var(--bg-gradient-1);
            border-bottom: 1px solid var(--border-color);
        }
        .mod-search { position: relative; flex: 1 1 240px; min-width: 0; }
        .mod-search i {
            position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
            color: var(--text-medium); font-size: 0.85rem; pointer-events: none;
        }
        .mod-search input {
            width: 100%; padding: 10px 12px 10px 34px;
            font-size: 0.92rem; font-family: inherit;
            color: var(--text-dark); background: var(--card-bg);
            border: 1px solid var(--border-color); border-radius: var(--radius-md);
        }
        .mod-search input::placeholder { color: var(--text-medium); }
        .mod-search input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
        .mod-count { font-size: 0.78rem; color: var(--text-medium); white-space: nowrap; }

        .mod-h2 {
            display: flex; align-items: center; gap: 10px;
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 1.5rem; line-height: 1.25; margin: 0 0 12px;
            color: var(--primary);
        }
        .mod-h2 i { color: var(--accent); font-size: 1.1rem; }
        body.dark-mode .mod-h2 { color: var(--accent); }
        .mod-n {
            font-family: 'Montserrat', system-ui, sans-serif;
            font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em;
            color: var(--text-medium); border: 1px solid var(--border-color);
            border-radius: 999px; padding: 2px 8px;
        }
        .mod-intro { max-width: 60ch; color: var(--text-medium); line-height: 1.7; margin: 0 0 16px; font-size: 0.9rem; text-wrap: pretty; }

        .mod-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .mod-item > a {
            display: flex; align-items: flex-start; gap: 14px;
            padding: 14px 16px;
            background: var(--bg-gradient-1);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            text-decoration: none;
            transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .mod-item > a:hover, .mod-item > a:focus-visible { border-color: var(--accent); }
        .mod-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .mod-title { font-size: 0.98rem; font-weight: 700; line-height: 1.35; color: var(--primary); }
        body.dark-mode .mod-title { color: var(--accent); }
        .mod-meta { font-size: 0.76rem; line-height: 1.4; color: var(--text-medium); }
        .mod-desc { font-size: 0.86rem; line-height: 1.6; color: var(--text-medium); max-width: 62ch; text-wrap: pretty; }
        .mod-open {
            display: inline-flex; align-items: center; gap: 7px;
            margin-top: 4px; font-size: 0.82rem; font-weight: 600;
            color: var(--accent-text);
        }
        .mod-open i { font-size: 0.85rem; }
        .mod-item > a:hover .mod-open, .mod-item > a:focus-visible .mod-open { text-decoration: underline; }
        .mod-size { font-weight: 400; color: var(--text-medium); }
        .mod-empty {
            padding: 18px 16px; font-size: 0.9rem; color: var(--text-medium);
            border: 1px dashed var(--border-color); border-radius: var(--radius-md);
        }

        @media (max-width: 600px) {
            .content-wrapper { padding: 20px 16px; }
            .page-hero { padding: 28px 16px 20px; }
            .page-hero::before { display: none; }
            .mod-toolbar { padding-top: 8px; }
        }
    </style>
</head>
<body>
<script>try{if(document.documentElement.classList.contains('dark-mode'))document.body.classList.add('dark-mode')}catch(e){}</script>

<site-nav data-section="colleghi">
</site-nav>

<main role="main" class="page-wrapper" id="main-content">
    <section class="page-hero" aria-labelledby="hero-heading">
        <h1 class="hero-title" id="hero-heading">Modulistica</h1>
        <p class="hero-desc">
            Moduli, facsimili e documenti da compilare, consegnare o allegare a una richiesta:
            ${totale} PDF divisi per uso, con una riga che dice a cosa serve ciascuno.
            Cerca per parola chiave e apri il documento in una nuova scheda.
        </p>
    </section>

    <div class="content-wrapper">

        <section class="protocol-section" aria-labelledby="mod-avviso">
            <div class="alert-box" role="note">
                <p id="mod-avviso"><strong><i class="fas fa-triangle-exclamation" aria-hidden="true"></i> Raccolta di studio e di servizio.</strong>
                    ${esc(data.avviso)}</p>
                <p>Ultima revisione dell’elenco: <strong>${esc(data.revisione)}</strong>.
                    Se un modulo è cambiato o ne manca uno utile a tutti, segnalatelo allo studio.</p>
            </div>
        </section>

        <div class="mod-toolbar">
            <label class="mod-search" for="mod-q">
                <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
                <input id="mod-q" type="search" placeholder="Cerca un modulo, un ente, una parola chiave…" autocomplete="off">
            </label>
            <span class="mod-count" id="mod-count" aria-live="polite">${totale} documenti</span>
        </div>

${renderSections()}

        <p class="mod-empty" id="mod-empty" hidden>Nessun documento corrisponde alla ricerca. Prova con una parola più corta o cancella il filtro.</p>

        <section class="protocol-section">
            <div class="alert-box">
                <p><strong>Dove trovare il resto.</strong> La sintesi di procedure, note operative e contatti è nella
                    <a href="../">raccolta per i colleghi</a>; i manuali e i documenti commentati sono nella pagina
                    <a href="../risorse-informative.html">Risorse informative e manualistica</a>.</p>
            </div>
        </section>

    </main>

    <site-footer data-section="colleghi">
        <footer role="contentinfo">
            <p>© <span id="current-year">2026</span> - Dott. Emanuel Savianu</p>
        </footer>
    </site-footer>

<script>
(function () {
    var input = document.getElementById('mod-q');
    if (!input) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('.mod-item'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('.mod-group'));
    var count = document.getElementById('mod-count');
    var empty = document.getElementById('mod-empty');
    var total = items.length;
    var norm = function (s) {
        return String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    };
    input.addEventListener('input', function () {
        var q = norm(this.value).trim();
        var visible = 0;
        items.forEach(function (item) {
            var hit = !q || (item.getAttribute('data-k') || '').indexOf(q) !== -1;
            item.hidden = !hit;
            if (hit) visible++;
        });
        groups.forEach(function (g) {
            var any = g.querySelectorAll('.mod-item:not([hidden])').length > 0;
            g.hidden = !any;
        });
        count.textContent = visible === total ? total + ' documenti' : visible + ' di ' + total + ' documenti';
        if (empty) empty.hidden = visible !== 0;
    });
})();
</script>

<script type="module" src="../../app.js?v=${APP_V}"></script>
</body>
</html>
`;

// --- pre-render del nav in memoria: stesso markup che scriverebbe tools/prerender.mjs
const prefix = '../../';
const navMarkup = siteNavInnerHTML({
  section: 'colleghi',
  fixedLang: '',
  here: '/colleghi/modulistica',
  config: CONFIG,
  prefix,
}).trim();
// servedPath() di prerender.mjs toglie lo slash finale: /colleghi/modulistica/
const expected = html.replace(
  /([ \t]*)<site-nav\b([^>]*)>([\s\S]*?)<\/site-nav>/,
  (full, indent, attrs) => `${indent}<site-nav${attrs}>\n${indent}    ${navMarkup}\n${indent}</site-nav>`
);

if (CHECK) {
  if (!existsSync(OUT)) {
    console.error('[modulistica] colleghi/modulistica/index.html mancante: rilanciare node tools/build-modulistica.mjs');
    process.exit(1);
  }
  const current = readFileSync(OUT, 'utf8');
  if (current !== expected) {
    console.error('[modulistica] colleghi/modulistica/index.html non allineato a colleghi/modulistica.json.');
    console.error('  Rilancia: node tools/build-modulistica.mjs');
    const a = current.split('\n');
    const b = expected.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        console.error(`  prima differenza alla riga ${i + 1}:`);
        console.error(`    disco: ${(a[i] || '').slice(0, 160)}`);
        console.error(`    attesa: ${(b[i] || '').slice(0, 160)}`);
        break;
      }
    }
    process.exit(1);
  }
  console.log(`[modulistica] OK: index.html allineato (${totale} documenti, ${data.gruppi.length} gruppi).`);
  process.exit(0);
}

writeFileSync(OUT, expected, 'utf8');
console.log(`[modulistica] scritto colleghi/modulistica/index.html — ${totale} documenti in ${data.gruppi.length} gruppi.`);
