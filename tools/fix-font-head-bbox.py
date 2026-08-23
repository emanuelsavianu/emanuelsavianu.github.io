#!/usr/bin/env python
"""Expand a font's head-table global bbox to strictly enclose every glyph's ink.

Why: pyftsubset --recalc-bounds writes INTEGER head coords (FWord int16). When a
retained glyph's float ink extent exceeds the integer box by a fraction
(e.g. xMax 647.14 vs head 647), strict OTS/bbox checkers flag the glyph as
out-of-global. Fix: recompute the exact float union with BoundsPen and rewrite
head with floor() on the min side and ceil() on the max side.

Usage:  python tools/fix-font-head-bbox.py <font.woff2|ttf>
Requires system python with fontTools (+ brotli for woff2 output).
"""
import math
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen


def main(path):
    # lazy=False: with lazy loading, head may be a deferred table whose attr
    # writes don't get re-serialized unless explicitly dirtied; force full load.
    f = TTFont(path, lazy=False)
    head = f["head"]
    gs = f.getGlyphSet()

    xs, ys = [], []
    for gname in f.getGlyphOrder():
        pen = BoundsPen(gs)
        try:
            gs[gname].draw(pen)
        except Exception:
            continue
        b = pen.bounds
        if not b:
            continue
        xs.extend((b[0], b[2]))
        ys.extend((b[1], b[3]))

    if not xs:
        print("no drawable glyphs found; nothing to do")
        return

    new_box = (
        math.floor(min(xs)),
        math.floor(min(ys)),
        math.ceil(max(xs)),
        math.ceil(max(ys)),
    )
    old_box = (head.xMin, head.yMin, head.xMax, head.yMax)
    print(f"old head bbox: {old_box}")
    print(f"new head bbox: {new_box}")

    head.xMin, head.yMin, head.xMax, head.yMax = new_box
    # Save to a temp path then move: fontTools' save() can silently fail to
    # re-serialize tables when overwriting the same file it is reading from.
    import os, tempfile, shutil
    fd, tmp = tempfile.mkstemp(suffix=os.path.splitext(path)[1] or ".bin")
    os.close(fd)
    try:
        f.save(tmp)
        shutil.move(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise
    print(f"saved {path}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python fix-font-head-bbox.py <font>")
        sys.exit(2)
    main(sys.argv[1])
