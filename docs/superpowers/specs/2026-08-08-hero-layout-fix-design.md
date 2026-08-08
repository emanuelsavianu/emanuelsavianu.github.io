# Hero Layout Fix — Design

**Data:** 2026-08-08 · **Stato:** approvato

## Problema

Il nuovo hero con foto dello studio (commit `9fbaa25`) risultava tagliato/asimmetrico: l'illustrazione dello skyline occupa solo ~90% del canvas (desktop ~5–8% di cielo vuoto a destra; mobile ~4–8% su entrambi i lati) e l'overlay navy, top-heavy, lasciava visibile una striscia di cielo che sembra un taglio rotto. Inoltre il blocco testo era centrato sul vuoto tra gli edifici senza scrim, e la sezione sotto l'hero risultava schiacciata (`padding-top` 10px).

## Decisioni

1. **Overlay multi-strato simmetrico** (solo CSS, markup invariato): `--hero-overlay` diventa un background composto su `.hero-overlay` (unico elemento): vignette navy simmetriche sinistra/destra (0→16% e 84→100%), scrim radiale morbido dietro il testo, scrim verticale mantenuto. Variante dark-mode con toni più scuri. Risultato: il banner sfuma in navy in modo identico su entrambi i bordi — la striscia di cielo residua diventa un elemento di design intenzionale.
2. **Micro-polish hero**: eyebrow 0.6→0.68rem con `text-shadow` per leggibilità; `hero-info-bar` con hairline oro sottile (`border-top` 2px rgba gold) coerente con la `header-info`.
3. **Respirazione sotto l'hero**: `.triage-section` padding-top 10→24px. Nessun altro intervento below-the-fold (audit: griglia, card, footer già coerenti).
4. **Header invariato** (scelta utente: unità logo+nome laterale centrata, come da spec logo-header).
5. **Cache-busting immagini studio** (`?v=2` su tutte e 6 le referenze in `index.html`): le immagini erano state corrette a parità di nome file; browser, Cloudflare e il precache del service worker servivano ancora le vecchie. `styles.css?v=31 → v=32` su tutte le pagine; rigenerazione SW via `node tools/update-sw.mjs` (bump `savianu-vN`).

## Non-goals

- Nessun cambio di layout dell'header (unità laterale centrata mantenuta).
- Nessun restyle di altre pagine/sezioni; nessuna rigenerazione asset (le immagini correnti sono quelle in `assets/studio/`).
- Nessun cambio di markup, app.js o config.js.

## Note implementative

- L'overlay resta su un solo elemento: `background: var(--hero-overlay)` — zero markup nuovo.
- `object-position: center` invariato (simmetria).
- check-links gestisce i `?v=` (strip della query) — nessun falso positivo.

## Verifica

- Apertura di `index.html` nel browser: hero simmetrico senza striscia rotta su desktop/tablet/mobile, light e dark mode; hairline oro sotto l'hero; respiro sopra le triage card.
- `node tools/update-sw.mjs`, poi `node tools/check-links.mjs`, `node tools/check-i18n.mjs`, `node tools/check-sw.mjs`, `node --check app.js` / `config.js`.
- Hard-refresh (Ctrl+F5) dopo il deploy per superare le cache.

## Addendum — root cause definitivo (2026-08-08, seconda iterazione)

L'utente segnalava ancora asimmetria dopo il primo fix. Riproduzione headless (Playwright/Chromium, sia sul sito live sia su file locale) ha misurato la sezione `.page-hero--media` a **1447px in un viewport da 1920px** (75%), con il fondo pagina crema visibile a destra; a 1440px era 1411px; a breakpoint tablet ~75% e mobile ~56%.

**Causa:** per CSS Sizing Level 3, un box block con `aspect-ratio` + altezza definitiva (`max-height: min(42vw, 620px)`) + `width: auto` **deriva la larghezza dall'altezza** (620 × 21/9 = 1446.7px) invece di riempire il containing block. Il bug esisteva dal commit `9fbaa25` (introduzione dell'hero media) ed era indipendente dalle immagini.

**Fix:** `width: 100%; max-width: 100%` su `.page-hero--media` (larghezza esplicita vince sulla derivazione dall'aspect-ratio; l'altezza resta governata da aspect-ratio + max-height). Verificato con riproduzione headless a 1920/1440/1024/800/600/390: `rightGap: 0` ovunque, hero edge-to-edge, vignette simmetriche, testo centrato.
