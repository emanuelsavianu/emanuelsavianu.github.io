#!/usr/bin/env python
"""
Diagnostic: count glyphs whose stored bbox differs from BoundsPen-computed bounds.

NOTE: This is a DIAGNOSTIC only. Do not use it to rewrite bboxes - see the
caveat in docs/font-subset-notes.md: fontTools' own save path recomputes
bounds differently from BoundsPen, so a 'fix' based on this script does not
converge (run twice, it 'corrects' different counts each time).

Usage:
    python tools/check-bboxes.py <font-file>
"""
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen

path = Path(sys.argv[1])
font = TTFont(str(path))
glyf = font["glyf"]
gs = font.getGlyphSet()
order = font.getGlyphOrder()

mismatch = 0
for name in order:
    g = glyf[name]
    ncontours = getattr(g, "numberOfContours", None)
    if ncontours is None:
        continue
    stored = (
        getattr(g, "xMin", None),
        getattr(g, "yMin", None),
        getattr(g, "xMax", None),
        getattr(g, "yMax", None),
    )
    if None in stored:
        continue
    pen = BoundsPen(gs)
    try:
        gs[name].draw(pen)
    except Exception:
        continue
    if pen.bounds is None:
        continue
    vals = tuple(int(round(v)) for v in pen.bounds)
    if tuple(stored) != vals:
        mismatch += 1

print(f"{path.name}: {mismatch} bbox mismatch(es) / {len(order)} glyphs")
