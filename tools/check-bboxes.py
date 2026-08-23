#!/usr/bin/env python
"""Compare stored vs recomputed bbox per glyph (strict, integer-aware)."""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont

path = Path(sys.argv[1])
font = TTFont(str(path))
glyf = font['glyf']
names = glyf.keys()
bad = []
for name in names:
    g = glyf[name]
    if g.numberOfContours != 0:
        stored = (g.xMin, g.yMin, g.xMax, g.yMax)
    else:
        stored = (getattr(g, 'xMin', None), getattr(g, 'yMin', None),
                  getattr(g, 'xMax', None), getattr(g, 'yMax', None))
        if None in stored:
            continue
    try:
        computed = g.calcBounds(glyf)
    except Exception as e:
        print(f"  calcBounds failed for {name}: {e}")
        continue
    if computed is None:
        continue
    cs = tuple(int(round(v)) for v in computed)
    if tuple(stored) != cs:
        bad.append((name, tuple(stored), cs))

print(f"{path.name}: {len(bad)} strict bbox mismatches / {len(list(glyf.keys()))} glyphs")
for name, s, c in bad[:15]:
    print(f"  {name}: stored={s} computed={c}")
