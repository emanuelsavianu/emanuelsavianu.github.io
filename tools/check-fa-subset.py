#!/usr/bin/env python
"""Check: does fa-solid-900.subset.woff2 contain every FA glyph the site uses?"""
import re, sys, glob, os
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1) Build map: icon name -> codepoint from the FULL FA css (fontawesome.min.css)
css = open(os.path.join(ROOT, 'assets/fontawesome/css/fontawesome.min.css'), encoding='utf8').read()
icon_cp = {}
for m in re.finditer(r'\.fa-([a-z0-9-]+)(?::before|:before)?\s*{[^}]*?content\s*:\s*"\\([0-9a-f]{4,5})"', css):
    name, cp = m.group(1), int(m.group(2), 16)
    icon_cp.setdefault(name, cp)

# also solid.min.css / solid.subset.css just in case
for extra in ['solid.min.css', 'solid.subset.css']:
    p = os.path.join(ROOT, 'assets/fontawesome/css', extra)
    if os.path.exists(p):
        t = open(p, encoding='utf8').read()
        for m in re.finditer(r'\.fa-([a-z0-9-]+)\s*{\s*--fa(?:-[a-z-]+)?:\s*"?\\([0-9a-f]{4,5})"?', t):
            pass  # solid css uses var-based definitions; main mapping comes from fontawesome.min.css

print(f"FA css defines {len(icon_cp)} named icons")

# 2) Collect used icon names from HTML + JS
used = set()
scan_targets = glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True)
scan_targets += [os.path.join(ROOT, 'app.js')]
scan_targets = [p for p in scan_targets if 'node_modules' not in p and '.git' not in p]
pat = re.compile(r'(?:class(?:Name)?\s*=\s*["`][^"`]*?)\bfa[sb]?\s+fa-([a-z0-9-]+)')
pat2 = re.compile(r'\bfa-(?:solid|s|b)\s+fa-([a-z0-9-]+)')
for p in scan_targets:
    try: t = open(p, encoding='utf8', errors='ignore').read()
    except Exception: continue
    for rx in (pat, pat2):
        for m in rx.finditer(t):
            used.add(m.group(1))
print(f"site uses {len(used)} distinct icon names")

# 3) cmap of subset + full font (control)
def cmap_set(path):
    f = TTFont(path)
    cps = set()
    for table in f['cmap'].tables:
        if table.isUnicode():
            cps |= set(table.cmap.keys())
    return cps

sub_cps = cmap_set(os.path.join(ROOT, 'assets/fontawesome/webfonts/fa-solid-900.subset.woff2'))
full_cps = cmap_set(os.path.join(ROOT, 'assets/fontawesome/webfonts/fa-solid-900.woff2'))
print(f"subset cmap has {len(sub_cps)} codepoints; full font {len(full_cps)}")

missing_sub = sorted(n for n in used if n in icon_cp and icon_cp[n] not in sub_cps)
present_full_missing_sub = [n for n in missing_sub if icon_cp[n] in full_cps]

print("\n=== USED ICONS MISSING FROM SUBSET ===")
if not missing_sub:
    print("(none — subset covers everything used)")
for n in missing_sub:
    print(f"  fa-{n}  U+{icon_cp[n]:04X}  {'(EXISTS in full woff2!)' if icon_cp[n] in full_cps else '(absent in full too)'}")

# 4) sanity: known core icons present?
core = ['moon', 'sun', 'bars', 'xmark', 'phone', 'phone-alt', 'map-marker-alt', 'calendar-check', 'question-circle', 'chevron-down']
print("\n=== core icon presence (subset) ===")
for n in core:
    if n in icon_cp:
        print(f"  fa-{n}: {'OK' if icon_cp[n] in sub_cps else 'MISSING'} (U+{icon_cp[n]:04X})")
