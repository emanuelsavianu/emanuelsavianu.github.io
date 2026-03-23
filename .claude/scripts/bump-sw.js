// Bumps the savianu-vN cache version in sw.js after any Edit/Write tool call,
// unless the file being edited IS sw.js (to avoid infinite loops).
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const fp = (input.tool_input && input.tool_input.file_path) || '';
    if (fp.includes('sw.js')) return; // skip when editing sw.js directly

    const fs = require('fs');
    const path = require('path');
    const swPath = path.join(process.cwd(), 'sw.js');
    const sw = fs.readFileSync(swPath, 'utf8');
    const bumped = sw.replace(/savianu-v(\d+)/, (_, n) => 'savianu-v' + (+n + 1));
    if (bumped !== sw) {
      fs.writeFileSync(swPath, bumped);
      const match = bumped.match(/savianu-v(\d+)/);
      console.log('sw.js cache bumped to', match ? match[0] : '?');
    }
  } catch (e) {
    // silently skip on parse errors
  }
});
