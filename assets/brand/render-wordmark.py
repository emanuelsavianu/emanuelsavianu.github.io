#!/usr/bin/env python3
"""Rasterizza il wordmark Savianu nei PNG del brand, a partire dal master HTML.

Uso:  env -u PYTHONPATH -u PYTHONHOME /home/es/.venvs/kit/bin/python render-wordmark.py
Richiede: Playwright (venv kit) + Chrome/Chromium. Il server statico sul repo
viene avviato e chiuso dallo script.
"""
import asyncio, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

REPO = pathlib.Path("/home/es/Projects/savianu.it")
MASTER = REPO / "assets/brand/wordmark.html"
OUT = REPO / "assets/brand"
PORT = 8931
# Il testo deve occupare questa frazione della larghezza (equilibrio ottico)
FILL = 0.78


def serve():
    p = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                         cwd=str(REPO), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    return p


async def main():
    srv = serve()
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch()
            # device_scale_factor 2 => 2400x800 px reali da uno stage 1200x400
            ctx = await browser.new_context(viewport={"width": 1400, "height": 600}, device_scale_factor=2)
            page = await ctx.new_page()
            await page.goto(f"http://127.0.0.1:{PORT}/assets/brand/wordmark.html", wait_until="networkidle")
            await page.wait_for_timeout(800)  # font variabile: attende il layout definitivo

            # Adatta il corpo del testo alla larghezza dello stage
            size = await page.evaluate(f"""(() => {{
              const stage = document.getElementById('stage-navy');
              const wm = document.getElementById('wordmark');
              const target = stage.getBoundingClientRect().width * {FILL};
              let size = 250;
              wm.style.fontSize = size + 'px';
              let w = wm.getBoundingClientRect().width;
              size = Math.floor(size * (target / w));
              wm.style.fontSize = size + 'px';
              return {{ fontSize: size, textWidth: Math.round(wm.getBoundingClientRect().width) }};
            }})()""")
            print("adattamento:", size)

            stage = page.locator("#stage-navy")
            await stage.screenshot(path=str(OUT / "savianu-wordmark-navy.png"))
            print("scritto:", OUT / "savianu-wordmark-navy.png")

            # Variante trasparente (solo scritta oro, per sovrapposizioni)
            await page.evaluate("document.getElementById('stage-navy').classList.add('trasparente')")
            await page.wait_for_timeout(200)
            await stage.screenshot(path=str(OUT / "savianu-wordmark-oro.png"), omit_background=True)
            print("scritto:", OUT / "savianu-wordmark-oro.png")

            # Variante quadrata 1:1 per social / icona (navy, scritta oro)
            await page.evaluate("""(() => {
              const s = document.getElementById('stage-navy');
              s.classList.remove('trasparente');
              s.style.width = '1200px'; s.style.height = '1200px';
            })()""")
            await page.wait_for_timeout(200)
            await stage.screenshot(path=str(OUT / "savianu-quadrato-navy.png"))
            print("scritto:", OUT / "savianu-quadrato-navy.png")
            await browser.close()
    finally:
        srv.terminate()


asyncio.run(main())
