#!/usr/bin/env python3
"""Genera il wordmark Savianu in SVG VETTORIALE (contorni dei glifi, non testo).

Perché: un SVG con <text> dipende dal font installato; qui i glifi di Cormorant
Garamond vengono convertiti in <path>, così il file è autonomo e scala a
qualsiasi dimensione (stampa, carta intestata, poster).

Colori: navy #1a2f4c e oro #c29b57, gli stessi di savianu.it (styles.css).
Uso: /home/es/.hermes/cache/scratch/venv-wordmark/bin/python make-wordmark-svg.py
"""
import pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

REPO = pathlib.Path("/home/es/Projects/savianu.it")
FONT = REPO / "assets/fonts/cormorant-garamond-var-latin.woff2"
OUT = REPO / "assets/brand"

TEXT = "Savianu"
WEIGHT = 600          # peso usato dal master HTML
FONT_SIZE = 291       # px, come il master (adattato alla larghezza dello stage)
TRACKING = 0.02       # letter-spacing in em
PAD_RATIO = 0.13      # margine laterale come nel PNG rasterizzato
NAVY = "#1a2f4c"
GOLD = "#c29b57"


def build():
    f = TTFont(FONT)
    print("assi variabili:", [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in f["fvar"].axes])
    upem = f["head"].unitsPerEm
    f = instancer.instantiateVariableFont(f, {"wght": WEIGHT}, inplace=False)
    cmap = f.getBestCmap()
    hmtx = f["hmtx"]
    glyphset = f.getGlyphSet()
    kern = {}
    if "kern" in f:
        for st in f["kern"].kernTables:
            kern.update(getattr(st, "kernTable", {}))

    # --- posizionamento orizzontale (advance + kerning della tabella kern) ---
    scale = FONT_SIZE / upem
    x = 0.0
    items = []
    prev = None
    for ch in TEXT:
        gname = cmap[ord(ch)]
        if prev is not None:
            x += kern.get((prev, gname), 0) * scale
        pen = SVGPathPen(glyphset)
        glyphset[gname].draw(pen)
        d = pen.getCommands()
        items.append((gname, x, d))
        x += hmtx[gname][0] * scale
        x += TRACKING * FONT_SIZE          # letter-spacing (dopo ogni glifo)
        prev = gname

    # --- bounding box reale dell'inchiostro (font units -> px, y rovesciata) ---
    bb = BoundsPen(glyphset)
    xs, ys = [], []
    for gname, gx, _ in items:
        bp = BoundsPen(glyphset)
        glyphset[gname].draw(bp)
        if bp.bounds:
            x0, y0, x1, y1 = bp.bounds
            xs += [gx + x0 * scale, gx + x1 * scale]
            ys += [-y1 * scale, -y0 * scale]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    ink_w, ink_h = maxx - minx, maxy - miny
    print(f"inchiostro: {ink_w:.1f} x {ink_h:.1f} px (font-size {FONT_SIZE})")

    pad_x = PAD_RATIO * ink_w
    pad_y = 0.30 * ink_h
    vb_x, vb_y = minx - pad_x, miny - pad_y
    vb_w, vb_h = ink_w + 2 * pad_x, ink_h + 2 * pad_y

    def svg(with_bg):
        bg = f'<rect x="{vb_x:.2f}" y="{vb_y:.2f}" width="{vb_w:.2f}" height="{vb_h:.2f}" fill="{NAVY}"/>' if with_bg else ""
        paths = "".join(
            f'<path transform="translate({gx:.3f},0) scale({scale:.6f},{-scale:.6f})" d="{d}"/>'
            for _, gx, d in items
        )
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x:.2f} {vb_y:.2f} {vb_w:.2f} {vb_h:.2f}" '
            f'width="{vb_w:.0f}" height="{vb_h:.0f}" role="img" aria-label="{TEXT}">\n'
            f'  <title>{TEXT}</title>\n  {bg}\n  <g fill="{GOLD}">{paths}</g>\n</svg>\n'
        )

    (OUT / "savianu-wordmark.svg").write_text(svg(True))
    (OUT / "savianu-wordmark-oro.svg").write_text(svg(False))
    print("scritti:", OUT / "savianu-wordmark.svg", "|", OUT / "savianu-wordmark-oro.svg")
    print(f"viewBox: {vb_w:.1f} x {vb_h:.1f} (rapporto {vb_w/vb_h:.3f})")


build()
