// Bumps savianu-vN and regenerates PRECACHE_URLS after any Edit/Write tool call,
// unless the file being edited IS sw.js (to avoid infinite loops).
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { computePrecacheUrls } from '../../tools/sw-assets.mjs';

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const fp = (input.tool_input && input.tool_input.file_path) || '';
    if (fp.includes('sw.js')) return;

    const swPath = join(process.cwd(), 'sw.js');
    const sw = readFileSync(swPath, 'utf8');
    const urls = computePrecacheUrls();
    const arrayBody = urls.map(u => `  '${u}',`).join('\n');
    const newList = `const PRECACHE_URLS = [\n${arrayBody}\n];`;
    const bumped = sw
      .replace(/const PRECACHE_URLS = \[[\s\S]*?\];/, newList)
      .replace(/savianu-v(\d+)/, (_, n) => 'savianu-v' + (+n + 1));
    if (bumped !== sw) {
      writeFileSync(swPath, bumped, 'utf8');
      const version = bumped.match(/savianu-v(\d+)/)[1];
      console.log('sw.js cache bumped to', 'savianu-v' + version, `(${urls.length} precache URLs)`);
    }
  } catch (e) {
    // silently skip on parse errors
  }
});
