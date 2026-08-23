#!/usr/bin/env python
"""Exhaustive subset verification: every fa-* icon used in HTML must have its
codepoint present in the subset woff2. Mirrors tools/subset-fontawesome.mjs logic."""
import re
from pathlib import Path
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
CSS_DIR = ROOT / 'assets' / 'fontawesome' / 'css'

# 1. Build name -> codepoint map from CSS (rule-by-rule, alias-aware)
codepoint_map = {}
for css_file in ['fontawesome.min.css', 'solid.min.css']:
    css = (CSS_DIR / css_file).read_text(encoding='utf8')
    for rule in css.split('}'):
        cm = re.search(r'content:\s*"\\([0-9a-f]{2,4})"', rule, re.I)
        if not cm:
            continue
        code = cm.group(1).lower()
        for sel in re.finditer(r'\.fa-([a-z0-9][a-z0-9-]*):(?:::)?before', rule, re.I):
            name = sel.group(1).lower()
            if name not in codepoint_map:
                codepoint_map[name] = code

print(f"CSS icon definitions parsed: {len(codepoint_map)}")

# 2. Scan HTML for used icons (class attributes only)
NON_ICON = {'solid', 'regular', 'brands', 'light', 'duotone', 'thin', 'fa'}
used = set()
html_count = 0
for f in ROOT.rglob('*.html'):
    if any(p in f.parts for p in ('node_modules', '.git')) or f.name.startswith('.'):
        continue
    html_count += 1
    html = f.read_text(encoding='utf8')
    for attr in re.finditer(r'class\s*=\s*"([^"]*)"', html):
        for m in re.finditer(r'\b(?:fas|fa-solid|far|fa-regular|fab|fa-brands|fal|fa-light)?\s*fa-([a-z0-9][a-z0-9-]*)\b', attr.group(1)):
            name = m.group(1)
            if name not in NON_ICON:
                used.add(name)

print(f"HTML files scanned: {html_count}")
print(f"Unique icons used: {len(used)}")

# 3. Load subset font cmap
font = TTFont(str(ROOT / 'assets' / 'fontawesome' / 'webfonts' / 'fa-solid-900.subset.woff2'))
cmap = font.getBestCmap()
print(f"Codepoints in subset: {len(cmap)}")

# 4. Cross-check: every used icon's codepoint must be in the subset
missing = []
for name in sorted(used):
    cp_hex = codepoint_map.get(name)
    if cp_hex is None:
        missing.append((name, 'NO CSS DEFINITION'))
        continue
    cp = int(cp_hex, 16)
    if cp not in cmap:
        missing.append((name, f'U+{cp:04X} NOT IN SUBSET'))

if missing:
    print(f"\nFAIL: {len(missing)} icon(s) would render as tofu:")
    for name, why in missing:
        print(f"  - fa-{name}: {why}")
    raise SystemExit(1)

print(f"\nPASS: all {len(used)} used icons resolve to glyphs present in the subset font.")

# 5. Also verify the FULL font still exists as regeneration source
full = ROOT / 'assets' / 'fontawesome' / 'webfonts' / 'fa-solid-900.woff2'
subset = ROOT / 'assets' / 'fontawesome' / 'webfonts' / 'fa-solid-900.subset.woff2'
fb, sb = full.stat().st_size, subset.stat().st_size
print(f"\nFull font kept:   {full.name}  {fb:,} bytes ({fb/1024:.1f} KB)")
print(f"Subset deployed:  {subset.name}  {sb:,} bytes ({sb/1024:.1f} KB)")
print(f"Reduction:        {(1 - sb/fb)*100:.1f}%")
