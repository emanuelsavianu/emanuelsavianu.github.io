#!/usr/bin/env node
/**
 * Font Awesome Subset Generator
 *
 * Usage: node tools/subset-fontawesome.mjs
 *
 * Scans every *.html file in the repo for fa-* icon classes and subsets
 * assets/fontawesome/webfonts/fa-solid-900.woff2 down to only those glyphs,
 * writing assets/fontawesome/webfonts/fa-solid-900.subset.woff2.
 *
 * The icon list is derived AT RUN TIME from the HTML — never maintained by
 * hand. That means "re-run this after adding a new icon" is literally true:
 * add the class anywhere in any .html file, re-run this script, bump the font
 * version query string in the HTML files that preload it.
 *
 * Requirements:
 *   - Python + fonttools on PATH (pip install fonttools) — provides pyftsubset
 *   - brotli for woff2 output: pip install brotli (pyftsubset needs it)
 *
 * Keep the full font file in the repo; it is the regeneration source.
 */

import { execSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const FONTS_DIR = join(ROOT, 'assets', 'fontawesome', 'webfonts');
const INPUT_FONT = join(FONTS_DIR, 'fa-solid-900.woff2');
const OUTPUT_FONT = join(FONTS_DIR, 'fa-solid-900.subset.woff2');

// FA style-family class names that appear alongside real icon names — exclude them
const NON_ICON_WORDS = new Set(['solid', 'regular', 'brands', 'light', 'duotone', 'thin', 'fa']);

function findHtmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      findHtmlFiles(full, out);
    } else if (/\.html$/i.test(entry.name) || /\.js$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// JS that emits FA classes via template literals/innerHTML. app.js builds the
// <site-nav>/<site-footer> chrome (theme toggle moon<->sun swap, quick-action
// bar); missing these glyphs renders controls as blank/inactive.
const JS_SOURCES = ['app.js'];

function scanIconsUsed(rootDir) {
  const icons = new Set();
  const files = findHtmlFiles(rootDir);
  for (const file of files) {
    // Only hand-written site JS carries icon classes; skip generated/vendor bundles
    if (/\.js$/i.test(file)) {
      const rel = file.slice(rootDir.length + 1).replace(/\\/g, '/');
      const isSiteJs = JS_SOURCES.some(s => rel === s || rel.endsWith('/' + s));
      const isToolJs = rel.includes('colleghi/gestoreturni/') || rel.includes('colleghi/RUAP/');
      if (!isSiteJs && !isToolJs) continue;
    }
    const content = readFileSync(file, 'utf8');
    // Match fa-* inside class attributes AND JS template-literal class strings
    // (single/double quotes or backticks), still excluding URLs/filenames.
    for (const attr of content.matchAll(/class\s*=\s*["'`]([^"'`]*)["'`]/g)) {
      for (const m of attr[1].matchAll(/\b(?:fas|fa-solid|far|fa-regular|fab|fa-brands|fal|fa-light)?\s*fa-([a-z0-9][a-z0-9-]*)\b/g)) {
        if (!NON_ICON_WORDS.has(m[1])) icons.add(m[1]);
      }
    }
    // JS-only: bare 'fa-name' / "fa-name" literals (classList.toggle/replace
    // targets like icon.classList.toggle('fa-sun', isDark) never appear inside
    // a class="..." attribute and would be missed by attribute-only scanning).
    if (/\.js$/i.test(file)) {
      for (const m of content.matchAll(/\bfa-([a-z0-9][a-z0-9-]{1,})\b/g)) {
        const n = m[1];
        if (NON_ICON_WORDS.has(n)) continue;
        if (/\d/.test(n)) continue; // fa-solid-900 / weight-suffixed font filenames
        icons.add(n);
      }
    }
  }
  return { icons: [...icons].sort(), fileCount: files.length };
}

console.log('[subset-fontawesome] Scanning HTML files for fa-* icons...');
const { icons, fileCount } = scanIconsUsed(ROOT);
console.log(`[subset-fontawesome] Scanned ${fileCount} HTML files`);
console.log(`[subset-fontawesome] Found ${icons.length} unique icons`);

if (!existsSafe(INPUT_FONT)) {
  console.error(`[subset-fontawesome] ERROR: Input font not found at ${INPUT_FONT}`);
  process.exit(1);
}

if (!existsSafe(OUTPUT_FONT)) {
  // fine — first run
} else {
  const before = statSync(INPUT_FONT).size;
  console.log(`[subset-fontawesome] Full font: ${(before / 1024).toFixed(1)} KB`);
}

// pyftsubset takes Unicode codepoints, not icon names. Map each icon name to
// its U+Fxxx Private Use Area codepoint using the FontAwesome CSS as the
// source of truth (assets/fontawesome/css/*.min.css contains the .fa-name::before rules).
function buildCodepointMap(cssDir) {
  const map = new Map(); // iconName -> hex codepoint string like "f2b9"
  for (const cssFile of ['fontawesome.min.css', 'solid.min.css']) {
    const p = join(cssDir, cssFile);
    if (!existsSafe(p)) continue;
    const css = readFileSync(p, 'utf8');
    // Minified FA CSS packs multiple selectors per rule:
    //   .fa-clock-four:before,.fa-clock:before{content:"\f017"}
    // Split on } so each rule is isolated, then assign the rule's codepoint
    // to EVERY fa-* name in that rule's selector list.
    for (const rule of css.split('}')) {
      const contentMatch = rule.match(/content:\s*"\\([0-9a-f]{2,4})"/i);
      if (!contentMatch) continue;
      const code = contentMatch[1].toLowerCase();
      for (const sel of rule.matchAll(/\.fa-([a-z0-9][a-z0-9-]*):(?:::)?before/gi)) {
        const name = sel[1].toLowerCase();
        if (!map.has(name)) map.set(name, code); // first definition wins
      }
    }
  }
  return map;
}

const CSS_DIR = join(ROOT, 'assets', 'fontawesome', 'css');
const codepointMap = buildCodepointMap(CSS_DIR);
console.log(`[subset-fontawesome] Parsed ${codepointMap.size} icon definitions from CSS`);

// Resolve each used icon to a codepoint; warn loudly about misses
const missing = [];
const unicodes = [];
for (const name of icons) {
  const code = codepointMap.get(name);
  if (!code) {
    missing.push(name);
  } else {
    unicodes.push(code);
  }
}

if (missing.length > 0) {
  console.error(`[subset-fontawesome] ERROR: ${missing.length} icon(s) used in HTML but NOT found in the CSS:`);
  for (const name of missing) console.error(`  - fa-${name}`);
  console.error('');
  console.error('These would render as tofu (missing glyph) after subsetting.');
  console.error('Fix: check spelling against https://fontawesome.com/icons, or');
  console.error('remove the class from the HTML if it is genuinely unused.');
  process.exit(1);
}

// Deduplicate (aliases can share codepoints) and write the unicodes file
const uniqueUnicodes = [...new Set(unicodes)].sort();
console.log(`[subset-fontawesome] ${uniqueUnicodes.length} distinct codepoints to keep`);

const TEMP_UNI_FILE = join(ROOT, '.fa-subset-unicodes.tmp');

import { writeFileSync, unlinkSync, existsSync as existsSafe2 } from 'fs';

function existsSafe(p) {
  try { statSync(p); return true; } catch { return false; }
}

writeFileSync(TEMP_UNI_FILE, 'U+' + uniqueUnicodes.join(',U+'), 'utf8');

try {
  console.log('[subset-fontawesome] Running pyftsubset...');
  // Prefer the pyftsubset executable; fall back to python -m fontTools.subset
  let pyft;
  try {
    execSync('pyftsubset --help', { stdio: 'ignore' });
    pyft = 'pyftsubset';
  } catch {
    try {
      execSync('python -m fontTools.subset --help', { stdio: 'ignore' });
      pyft = 'python -m fontTools.subset';
    } catch {
      console.error('[subset-fontawesome] ERROR: neither pyftsubset nor python -m fontTools.subset is available.');
      console.error('Install with: pip install fonttools brotli');
      process.exit(1);
    }
  }
  console.log(`[subset-fontawesome] Using: ${pyft}`);
  execSync(
    `${pyft} "${INPUT_FONT}"` +
    ` --output-file="${OUTPUT_FONT}"` +
    ` --unicodes-file="${TEMP_UNI_FILE}"` +
    ` --flavor=woff2` +
    ` --layout-features='*'` +
    ` --glyph-names --symbol-cmap --legacy-cmap` +
    ` --notdef-glyph --notdef-outline --recommended-glyphs` +
    ` --name-IDs='*' --name-legacy --name-languages='*'` +
    ` --recalc-bounds` +
    ` --drop-tables='DSIG'`,
    { stdio: 'inherit' }
  );
} catch (error) {
  console.error('[subset-fontawesome] ERROR: subsetting failed:', error.message);
  process.exit(1);
} finally {
  try { unlinkSync(TEMP_UNI_FILE); } catch {}
}

const beforeSize = statSync(INPUT_FONT).size;
const afterSize = statSync(OUTPUT_FONT).size;
console.log('');
console.log('[subset-fontawesome] ==========================================');
console.log(`[subset-fontawesome] Before: ${beforeSize} bytes (${(beforeSize / 1024).toFixed(1)} KB)`);
console.log(`[subset-fontawesome] After:  ${afterSize} bytes (${(afterSize / 1024).toFixed(1)} KB)`);
console.log(`[subset-fontawesome] Saved:  ${(((beforeSize - afterSize) / beforeSize) * 100).toFixed(1)}%`);
console.log('[subset-fontawesome] ==========================================');
console.log('[subset-fontawesome] Done.');
console.log('[subset-fontawesome]');
console.log('[subset-fontawesome] Next steps to activate:');
console.log('[subset-fontawesome]   1. Point @font-face src at the subset file (or swap the preload <link>)');
console.log('[subset-fontawesome]   2. Bump the ?v=NN version on the preload/stylesheet URLs');
console.log('[subset-fontawesome]   3. Run npm run update-sw && npm test');
console.log('[subset-fontawesome]   4. Spot-check pages for tofu (missing-glyph boxes)');
