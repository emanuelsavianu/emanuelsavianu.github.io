# Logo nella Testata — Design

**Data:** 2026-08-08 · **Stato:** approvato

## Obiettivo

Inserire il logo bronze (`assets/bronzelogo.png`) nella testata di tutte le pagine che usano il componente `site-nav` (13 pagine), in modo discreto ed elegante: logo a sinistra del blocco testo, testo dominante.

## Contesto

- **Logo:** stesso simbolo (caduceo con teste di leone e montone) in due varianti colore: bronze `#c29b57` (accento del sito) e blu `#1a2f4c` (primary). Quadrato, trasparente, line-art, senza testo (scala bene a dimensioni piccole).
- **Header attuale:** navy (`--primary`) con overlay, testo bianco centrato, `.header-content` con `max-width: 900px`. Nessun logo presente oggi.
- **Stato attuale dei logo:** già in `sw.js` `PRECACHE_URLS` e nelle meta OG/JSON-LD.
- **Scelta colore:** variante **bronze** — visibile sul navy sia in light che in dark mode. La variante blu resta fuori scope (utile solo su fondi chiari).

## Decisioni di design

1. **Posizione:** header di tutte le pagine, via template del componente `SiteNav` in `app.js`. Il fallback no-JS dentro i tag `<site-nav>` resta invariato.
2. **Layout:** `.brand-wrap` flex row centrato — logo a sinistra (~96px, `drop-shadow` bronze per profondità sul navy), blocco testo a destra allineato a sinistra (nome + STUDIO MEDICO IPPOCRATE + tagline + pulsante telefono); il tutto centrato come unità.
3. **Mobile (<600px):** colonna centrata — logo 70px sopra il nome, testo di nuovo centrato.
4. **Accessibilità/i18n:** `alt` statico "Studio Medico Ippocrate" (nome proprio, invariato in EN) — nessun nuovo `data-i18n`, nessuna nuova chiave.
5. **Fuori scope (YAGNI):** favicon, footer, bluelogo, pagine self-contained (malattia, salutementale, vivisano, bengalese, urdu, colleghi tools), fallback no-JS.

## Implementazione

- `app.js` (righe ~68–72): nuovo markup del brand con `<img class="brand-logo">` (src via `getPathPrefix()` per percorsi relativi) + `<div class="brand-text">` contenente i blocchi esistenti.
- `styles.css`: nuove regole `.brand-wrap`, `.brand-logo`, `.brand-text`; nella media query mobile (<600px) variante colonna.
- **Cache-busting:** `styles.css?v=26 → v=27` e `app.js?v=20 → v=21` sulle 13 pagine che referenziano i due file.
- `node tools/update-sw.mjs` per rigenerare precache (i logo sono già presenti) e bump di `savianu-vN`.

## Verifica

- `node --check app.js`
- `node tools/check-links.mjs` (nuovo percorso relativo dell'immagine)
- `node tools/check-i18n.mjs` (nessuna chiave nuova)
- `node tools/check-sw.mjs`
- Apertura di `index.html` nel browser: testata su root, `ssn/`, `privati/`, `colleghi/`; light e dark mode; viewport mobile.
