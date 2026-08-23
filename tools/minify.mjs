#!/usr/bin/env node
/**
 * Minification Script for savianu.it
 *
 * Usage: node tools/minify.mjs
 *
 * Uses esbuild to minify styles.css and app.js
 * Input:  styles.css, app.js
 * Output: styles.min.css, app.min.js
 *
 * Run this before each deploy that touches CSS/JS.
 * Version bumps should be done manually in HTML files.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(process.cwd());
const INPUT_CSS = resolve(ROOT, 'styles.css');
const INPUT_JS = resolve(ROOT, 'app.js');
const OUTPUT_CSS = resolve(ROOT, 'styles.min.css');
const OUTPUT_JS = resolve(ROOT, 'app.min.js');

console.log('[minify] Starting minification...');

if (!existsSync(INPUT_CSS)) {
  console.error(`[minify] ERROR: ${INPUT_CSS} not found`);
  process.exit(1);
}

if (!existsSync(INPUT_JS)) {
  console.error(`[minify] ERROR: ${INPUT_JS} not found`);
  process.exit(1);
}

try {
  // Minify CSS
  console.log('[minify] Minifying styles.css...');
  execSync(
    `npx esbuild "${INPUT_CSS}" --minify --outfile="${OUTPUT_CSS}"`,
    { stdio: 'inherit', cwd: ROOT }
  );

  // Minify JS
  console.log('[minify] Minifying app.js...');
  execSync(
    `npx esbuild "${INPUT_JS}" --minify --outfile="${OUTPUT_JS}" --format=esm --target=es2020`,
    { stdio: 'inherit', cwd: ROOT }
  );

  const cssStats = statSync(OUTPUT_CSS);
  const jsStats = statSync(OUTPUT_JS);
  const origCssStats = statSync(INPUT_CSS);
  const origJsStats = statSync(INPUT_JS);

  console.log(`[minify] CSS: ${(origCssStats.size / 1024).toFixed(1)} KB -> ${(cssStats.size / 1024).toFixed(1)} KB (${((1 - cssStats.size / origCssStats.size) * 100).toFixed(1)}% reduction)`);
  console.log(`[minify] JS:  ${(origJsStats.size / 1024).toFixed(1)} KB -> ${(jsStats.size / 1024).toFixed(1)} KB (${((1 - jsStats.size / origJsStats.size) * 100).toFixed(1)}% reduction)`);

  console.log('[minify] Done!');
  console.log('[minify] Remember to update HTML files to reference .min.css/.min.js and bump ?v=NN query strings.');
  console.log('[minify] Then run: npm run update-sw && npm test');
} catch (error) {
  console.error('[minify] ERROR:', error.message);
  process.exit(1);
}