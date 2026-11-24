# savianu.it — brief per l'audit esterno

Sei un **senior frontend + accessibility auditor**. Il codice allegato è il sito pubblico di uno
studio medico di medicina generale (Arezzo, Italia). Leggi questo brief **prima** del codice: senza
i vincoli qui sotto produrrai finding che non sono applicabili.

## 1. Cos'è questo sito

Sito statico, nessun framework, nessun build step per le pagine. Served da GitHub Pages.
Un unico CSS globale (`styles.css`, ~157 KB) + due fogli print-first (schede e poster A4).
JavaScript vanilla in `app.js` (i18n, stati UI, service worker) + `chrome.js` (barra) + `config.js` (dati dello studio).
Contenuti in **italiano** (pazienti), inglese (pazienti internazionali), e schede/poster in
**IT / RO / EN / BN / UR** (bengalese e urdu con `dir="rtl"`).

Aree: `/` home · `/ssn/` pazienti del servizio pubblico · `/privati/` consulti e certificati privati ·
`/colleghi/` area per medici e professionisti · `/international/` pazienti stranieri.
Pagine `scheda-*` e `poster-*` sono fogli A4 pensati **per la stampa** (duplex), non per l'interazione.

## 2. Vincoli del repo — un fix che li viola è un fix sbagliato

1. **Niente esadecimali di colore fuori dai blocchi `:root` / `body.dark-mode`.** Il gate
   `tools/check-tokens.mjs` congela 834 hex storici e **blocca ogni incremento**. Un colore nuovo
   deve essere un token in `:root` (o `body.dark-mode`) dentro il CSS dove serve.
2. **I token hanno due registri**: chiaro e `body.dark-mode`. Un colore che funziona in chiaro può
   essere illeggibile in scuro: `--primary-dark` diventa ORO in dark (trappola già pagata).
3. **Bump di versione**: se tocchi `styles.css` o `app.js`, il riferimento `?v=YYYYMMDDx` va
   aggiornato su **tutte** le pagine **e** nelle costanti di `tools/build-modulistica.mjs`.
4. **Parità i18n**: 313 chiavi IT e 313 EN, coperte nell'HTML. Una stringa nuova va in entrambe.
5. **`npm run prerender`** inietta il markup di `<site-nav>` nell'HTML statico (per il CLS). Se
   cambi la barra, va rilanciato; il gate `--check` fallisce altrimenti.
6. **La barra `<site-nav>` è prerenderizzata in 29 pagine**: in questo pack è sostituita dal
   marcatore `[site-nav: markup prerenderizzato identico in 29 pagine]`. È la stessa in tutte:
   non segnalarla 29 volte, e non proporre modifiche "per pagina" che vadano fatte nel componente
   (`chrome.js`).
7. **Nessuna dipendenza nuova.** Niente React/Vue/Tailwind, niente CDN, niente build step: il sito
   deve restare apribile come file statici. Se una proposta richiede un framework, scartala.
8. **Le pagine `scheda-*` / `poster-*` sono print-first**: niente hover, tooltip, animazioni, JS.
   Si giudicano su impaginazione A4, corpo del testo, contrasto su carta, RTL.
9. **Il modulo internazionale ha un backend** (`cloudflare/worker.js`) che **non è in questo pack**.
   Non dedurre la causa dei suoi malfunzionamenti dal solo frontend.

## 3. Difetti già noti — NON riportarli

Sono stati misurati e sono in lavorazione. Se li ritrovi, ignora: non aggiungono informazione.

- `/api/intl-inquiry` risponde **502 `send_failed`**: nessun sender configurato (manca `RESEND_API_KEY`).
- `/international/` contiene **due orari privati contraddittori** (Mar/Gio 10–12 vs Lun–Ven 09:30–12:30).
- Il fallback di errore del modulo internazionale contiene un `<span class="js-email">` riempito a runtime.
- L'honeypot `#intl-website` su `/international/` è visibile (19 px in flusso).
- L'icona `fa-moon` del toggle tema non è nel subset FontAwesome: il bottone resta senza glifo (ha `aria-label`).
- I PDF delle schede/poster su Drive sono stati generati prima dell'ultimo fix di contrasto: vanno rigenerati.
- La pagina 404 e `offline.html` sono state appena portate a path assoluti (non è più un difetto).
- La CTA "Prenota la visita" su `faq-riforma` sta a 5 schermate di distanza: c'è una barra fissa con DOCTOLIB, è una scelta.

## 4. Cosa NON è in questo pack

Binari, font, immagini, PDF, `assets/`; report interni (`docs/`), configurazioni di agenti
(`.hermes/`, `.opencode/`), workflow (`.github/`), backend (`cloudflare/`), le app interne per i
colleghi (`colleghi/RUAP/`, `colleghi/gestoreturni/`, ~350 KB di JS). Non chiedere quei file: non
esistono nella sessione. Se un finding **dipende** da uno di essi, scrivilo nel campo "serve".

## 5. Formato di risposta — obbligatorio

Rispondi **solo** con una tabella di finding, nell'ordine in cui li hai trovati. Nessun preambolo,
nessun riassunto, nessuna riscrittura di file interi.

Per ogni finding:

```
### [ID] severità — titolo breve
FILE: percorso/relativo.html
ANCORA: <40-80 caratteri di codice ESATTI copiati dal file, unici nel file>
PROBLEMA: cosa non va, in una frase, con la conseguenza per l'utente
EVIDENZA: la misura o il fatto (es. "contrasto 3.2:1 su bianco, serve 4.5"; "3 tap per arrivare a X")
FIX: la sostituzione esatta, come blocco prima/dopo
SEVERITÀ: RED (blocca l'utente / accessibilità AA) | YELLOW (attrito reale, non bloccante) | GREEN (miglioramento)
SERVE: eventuali file non presenti nel pack
```

Regole:
- **Non inventare numeri di riga**: usa l'ANCORA testuale, copiata dal codice. Le righe di un pack
  concatenato non corrispondono al file.
- Una riga di tabella per finding, massimo **15 finding per pack**: meglio 8 veri che 30 dubbi.
- Se un finding riguarda una regola CSS globale, cita il selettore esatto e la media query.
- Se non sei sicuro, dillo nel campo EVIDENZA ("da verificare con axe"): non gonfiare.
- Non proporre: migrazione a framework, nuove dipendenze, riscritture di pagina, redesign grafico,
  cambio di identità (navy `#1A2F4C`, oro `#C29B57`, crema `#F3EFE6`, Cormorant + Montserrat).

## 6. Come verranno valutati i tuoi finding

Chi applica i fix misura prima di credere: axe-core per il contrasto (ma non legge i gradienti),
geometria reale del DOM per i target di tocco, e test statici (`npm test`) per i vincoli. Un finding
senza una misura o un'ancora verificabile viene scartato, anche se l'impressione è giusta.
