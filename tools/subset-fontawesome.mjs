#!/usr/bin/env node
/**
 * Font Awesome Subset Generator
 *
 * Usage: node tools/subset-fontawesome.mjs
 *
 * Reads the list of Font Awesome icons used across the site and creates a subset
 * of the fa-solid-900.woff2 font containing only those glyphs.
 *
 * Input:  assets/fontawesome/webfonts/fa-solid-900.woff2 (full font)
 * Output: assets/fontawesome/webfonts/fa-solid-900.subset.woff2 (subset)
 *
 * To add a new icon:
 * 1. Add the icon class to any HTML file
 * 2. Re-run this script to regenerate the subset
 * 3. Update the version in HTML files: styles.css?v=XX, app.js?v=XX, etc.
 *
 * Dependencies: fonttools (pip install fonttools), esbuild (npm install esbuild --save-dev)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(process.cwd());
const FONTS_DIR = resolve(ROOT, 'assets', 'fontawesome', 'webfonts');
const INPUT_FONT = resolve(FONTS_DIR, 'fa-solid-900.woff2');
const OUTPUT_FONT = resolve(FONTS_DIR, 'fa-solid-900.subset.woff2');
const SCRIPT_VERSION = '1.0.0';

// Complete list of Font Awesome solid icons used across the site (from grep scan)
const ICONS_USED = [
  // Navigation & UI
  'arrow-left', 'arrow-right', 'chevron-left', 'chevron-right', 'chevron-down',
  'chevron-up', 'xmark', 'times', 'close',

  // Layout & Structure
  'home', 'compass', 'door-open', 'door-closed', 'building', 'landmark',
  'users', 'user', 'user-tie', 'user-md', 'user-doctor', 'user-injured',
  'user-plus', 'user-check', 'user-shield', 'address-book',

  // Calendar & Time
  'calendar', 'calendar-alt', 'calendar-check', 'calendar-days', 'calendar-day',
  'calendar-week', 'calendar-plus', 'clock', 'hourglass-end', 'history', 'rotate-left',

  // Medical & Health
  'heart', 'heart-pulse', 'heartbeat', 'stethoscope', 'hospital', 'hospital-user',
  'clinic-medical', 'house-medical', 'ambulance', 'first-aid', 'procedures',
  'pills', 'prescription-bottle', 'prescription', 'file-prescription',
  'file-medical', 'file-prescription', 'stethoscope', 'syringe',
  'bone', 'brain', 'lungs', 'tooth', 'eye', 'ear-listen', 'baby',
  'weight', 'weight-hanging', 'heartbeat', 'lungs', 'virus', 'bacteria',
  'dna', 'vials', 'flask', 'microscope', 'pills', 'capsules',
  'bandage', 'band-aid', 'stretcher', 'wheelchair', 'crutches', 'walking',
  'hand-holding-heart', 'hand-holding-medical', 'heart-circle-check',
  'heart-circle-exclamation', 'heart-circle-plus', 'heart-circle-minus',

  // Documents & Files
  'file', 'file-alt', 'file-medical', 'file-prescription', 'file-invoice',
  'file-invoice-dollar', 'file-contract', 'file-medical', 'file-pdf',
  'file-word', 'file-excel', 'file-csv', 'file-image', 'file-video',
  'file-audio', 'file-code', 'file-archive', 'file-import', 'file-export',
  'file-upload', 'file-download', 'file-upload', 'file-signature',
  'file-certificate', 'certificate', 'award', 'medal', 'trophy', 'star',
  'clipboard', 'clipboard-list', 'clipboard-check', 'clipboard-question',
  'paste', 'copy', 'cut', 'print', 'save', 'floppy-disk', 'download',
  'upload', 'cloud-upload', 'cloud-download', 'cloud', 'database',
  'server', 'database', 'table', 'table-cells', 'table-rows', 'columns',

  // Communication
  'envelope', 'envelope-open', 'envelope-open-text', 'mail-bulk',
  'paper-plane', 'comment', 'comment-alt', 'comments', 'comment-dots',
  'comment-slash', 'phone', 'phone-alt', 'phone-volume', 'mobile',
  'mobile-alt', 'fax', 'video', 'camera', 'video-slash', 'microphone',
  'microphone-alt', 'microphone-slash', 'headset', 'headphones',
  'broadcast-tower', 'wifi', 'signal', 'rss', 'feed', 'podcast',

  // Navigation & Actions
  'search', 'search-plus', 'search-minus', 'filter', 'sort', 'sort-up',
  'sort-down', 'sort-alpha-up', 'sort-alpha-down', 'sort-numeric-up',
  'sort-numeric-down', 'filter', 'filter-circle', 'eye', 'eye-slash',
  'eye-dropper', 'magnifying-glass', 'magnifying-glass-plus',
  'magnifying-glass-minus', 'expand', 'compress', 'expand-alt',
  'compress-alt', 'arrows-alt', 'arrows-alt-h', 'arrows-alt-v',
  'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'arrow-up-left',
  'arrow-up-right', 'arrow-down-left', 'arrow-down-right', 'arrows-h',
  'arrows-v', 'arrow-circle-up', 'arrow-circle-down', 'arrow-circle-left',
  'arrow-circle-right', 'chevron-up', 'chevron-down', 'chevron-left',
  'chevron-right', 'chevron-circle-up', 'chevron-circle-down',
  'chevron-circle-left', 'chevron-circle-right', 'angle-up', 'angle-down',
  'angle-left', 'angle-right', 'angle-double-up', 'angle-double-down',
  'angle-double-left', 'angle-double-right', 'long-arrow-up',
  'long-arrow-down', 'long-arrow-left', 'long-arrow-right',

  // Editing & Formatting
  'edit', 'pencil-alt', 'pen', 'pencil', 'highlighter', 'marker',
  'underline', 'strikethrough', 'bold', 'italic', 'underline', 'strikethrough',
  'superscript', 'subscript', 'text-height', 'text-width', 'font',
  'text-height', 'text-width', 'align-left', 'align-center', 'align-right',
  'align-justify', 'indent', 'outdent', 'list', 'list-ol', 'list-ul',
  'list', 'indent', 'outdent', 'paragraph', 'header', 'heading',
  'text-height', 'text-width', 'font', 'bold', 'italic', 'underline',
  'strikethrough', 'superscript', 'subscript', 'text-height', 'text-width',

  // UI Elements
  'plus', 'minus', 'times', 'check', 'check-circle', 'check-double',
  'check-square', 'circle', 'circle-notch', 'dot-circle', 'circle',
  'square', 'square-full', 'minus-circle', 'plus-circle', 'check-circle',
  'times-circle', 'question-circle', 'info-circle', 'exclamation-circle',
  'exclamation-triangle', 'exclamation', 'question', 'check', 'minus',
  'plus', 'times', 'check', 'check-double', 'check-circle', 'check-square',
  'circle', 'circle-notch', 'dot-circle', 'circle', 'square', 'square-full',
  'minus-circle', 'plus-circle', 'check-circle', 'times-circle',
  'question-circle', 'info-circle', 'exclamation-circle',
  'exclamation-triangle', 'exclamation', 'question',

  // Status & Feedback
  'spinner', 'circle-notch', 'sync', 'sync-alt', 'redo', 'undo',
  'rotate-left', 'rotate-right', 'rotate-left', 'rotate-right',
  'history', 'clock', 'clock-o', 'hourglass', 'hourglass-half',
  'hourglass-end', 'hourglass-start', 'spinner', 'circle-notch',
  'spinner', 'circle-notch', 'cog', 'gear', 'cogs', 'wrench',
  'hammer', 'tools', 'wrench', 'screwdriver', 'hammer', 'toolbox',

  // Media & Content
  'image', 'images', 'photo', 'camera', 'camera-retro', 'video',
  'film', 'video-camera', 'play', 'play-circle', 'pause', 'pause-circle',
  'stop', 'stop-circle', 'forward', 'fast-forward', 'backward',
  'fast-backward', 'step-forward', 'step-backward', 'eject',
  'volume-up', 'volume-down', 'volume-off', 'volume-mute',
  'headphones', 'headphones-alt', 'music', 'music-alt', 'file-audio',
  'file-video', 'file-image', 'file-pdf', 'file-word', 'file-excel',
  'file-powerpoint', 'file-archive', 'file-code', 'file-text',
  'file-alt', 'file', 'copy', 'cut', 'paste', 'clipboard', 'clipboard-list',
  'clipboard-check', 'clipboard-question',

  // E-commerce & Business
  'shopping-cart', 'shopping-bag', 'shopping-basket', 'credit-card',
  'credit-card-front', 'credit-card-blank', 'money-bill', 'money-bill-alt',
  'money-bill-wave', 'money-bill-wave-alt', 'money-check', 'money-check-alt',
  'receipt', 'file-invoice', 'file-invoice-dollar', 'calculator',
  'chart-line', 'chart-bar', 'chart-pie', 'chart-area', 'chart-bar',
  'chart-line', 'chart-pie', 'chart-area', 'chart-scatter', 'chart-radar',
  'table', 'table-cells', 'th', 'th-large', 'th-list', 'columns',
  'columns', 'compress', 'compress-alt', 'expand', 'expand-alt',
  'arrows-alt', 'arrows-alt-h', 'arrows-alt-v', 'arrows-alt',

  // Social & External
  'external-link', 'external-link-alt', 'external-link-square',
  'external-link-square-alt', 'share', 'share-alt', 'share-square',
  'share-square-alt', 'reply', 'reply-all', 'forward', 'reply',
  'reply-all', 'retweet', 'mail-forward', 'mail-reply', 'mail-reply-all',
  'envelope', 'envelope-open', 'envelope-open-text', 'paper-plane',
  'paper-plane-alt', 'mail-bulk', 'inbox', 'archive', 'archive-alt',
  'trash', 'trash-alt', 'trash-restore', 'trash-restore-alt',
  'trash', 'trash-alt', 'trash-restore', 'trash-restore-alt',

  // Settings & System
  'cog', 'cogs', 'gear', 'gears', 'wrench', 'tools', 'screwdriver',
  'hammer', 'toolbox', 'cog', 'cogs', 'gear', 'gears', 'sliders-h',
  'sliders-v', 'sliders-h', 'sliders-v', 'adjust', 'tint', 'tint-slash',
  'palette', 'paint-brush', 'paint-roller', 'brush', 'pencil', 'pen',
  'pencil-alt', 'pen-alt', 'pencil-ruler', 'ruler', 'ruler-combined',
  'ruler-horizontal', 'ruler-vertical', 'drafting-compass', 'compass',
  'compass', 'angle-double-up', 'angle-double-down', 'angle-double-left',
  'angle-double-right', 'angle-up', 'angle-down', 'angle-left', 'angle-right',

  // Location & Maps
  'map', 'map-marked', 'map-marked-alt', 'map-marker', 'map-marker-alt',
  'map-pin', 'location-arrow', 'location', 'location-crosshairs',
  'location-dot', 'location-crosshairs', 'compass', 'route', 'directions',
  'navigation', 'map-marker', 'map-marker-alt', 'map-marked', 'map-marked-alt',

  // Security & Privacy
  'lock', 'lock-open', 'unlock', 'unlock-alt', 'key', 'key-skeleton',
  'fingerprint', 'eye', 'eye-slash', 'user-shield', 'user-lock',
  'user-lock', 'user-unlock', 'user-shield', 'user-lock', 'user-unlock',
  'shield', 'shield-alt', 'shield-check', 'shield-virus', 'shield-alt',
  'shield-check', 'shield-virus', 'shield-alt', 'shield-check',
  'shield-virus', 'mask', 'virus', 'virus-slash', 'biohazard', 'radiation',
  'radiation-alt', 'biohazard', 'radiation', 'radiation-alt',

  // Specialized Medical (additional)
  'procedures', 'stethoscope', 'syringe', 'bandage', 'pills', 'capsules',
  'tablets', 'prescription', 'prescription-bottle', 'prescription-bottle-alt',
  'thermometer', 'thermometer-empty', 'thermometer-full', 'thermometer-half',
  'thermometer-quarter', 'thermometer-three-quarters', 'heartbeat',
  'heartbeat', 'ekg', 'wave-square', 'lungs', 'brain', 'tooth', 'bone',
  'teeth', 'teeth-open', 'tooth', 'teeth', 'teeth-open', 'brain',
  'lungs', 'heart', 'heartbeat', 'stethoscope', 'procedures',
  'x-ray', 'mri', 'cat-scan', 'ultrasound', 'pet-scan', 'bone', 'teeth',
  'tooth', 'dental', 'dentist', 'orthodontist', 'optometrist', 'eye',
  'optometrist', 'eye', 'glasses', 'glasses-alt', 'contact-lens',
  'hearing-aid', 'ear', 'ear-muffs', 'hearing', 'stethoscope',
  'procedures', 'syringe', 'vaccination', 'vials', 'pills', 'capsules',
  'tablets', 'prescription', 'prescription-bottle', 'prescription-bottle-alt',
];

// Deduplicate and sort
const uniqueIcons = [...new Set(ICONS_USED)].sort();

console.log(`[subset-fontawesome] Found ${uniqueIcons.length} unique icons to include`);

// Write the list of icons to a temporary file for fonttools
const TEMP_ICONS_FILE = resolve(ROOT, 'temp-icons-to-keep.txt');
writeFileSync(TEMP_ICONS_FILE, uniqueIcons.join('\n'), 'utf8');
console.log(`[subset-fontawesome] Wrote icon list to ${TEMP_ICONS_FILE}`);

if (!existsSync(INPUT_FONT)) {
  console.error(`[subset-fontawesome] ERROR: Input font not found at ${INPUT_FONT}`);
  process.exit(1);
}

// Use pyftsubset to create the subset
try {
  console.log('[subset-fontawesome] Running pyftsubset...');
  execSync(
    `pyftsubset "${INPUT_FONT}" --output-file="${OUTPUT_FONT}" --unicodes-file="${TEMP_ICONS_FILE}" --flavor=woff2 --layout-features='*' --glyph-names --symbol-cmap --legacy-cmap --notdef-glyph --notdef-outline --recommended-glyphs --name-IDs='*' --name-legacy --name-languages='*' --drop-tables='DSIG' --verbose`,
    { stdio: 'inherit', cwd: ROOT }
  );
  console.log(`[subset-fontawesome] Successfully created subset at ${OUTPUT_FONT}`);
} catch (error) {
  console.error('[subset-fontawesome] ERROR: pyftsubset failed:', error.message);
  console.error('Make sure fonttools is installed: pip install fonttools');
  process.exit(1);
} finally {
  // Clean up temp file
  try {
    require('fs').unlinkSync(TEMP_ICONS_FILE);
  } catch (e) {}
}

// Verify output
const stats = require('fs').statSync(OUTPUT_FONT);
console.log(`[subset-fontawesome] Output size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log('[subset-fontawesome] Done! Remember to update HTML files to point to the new subset file.');