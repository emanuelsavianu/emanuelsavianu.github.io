#!/usr/bin/env node
// =====================================================================
// check-intl-endpoint.mjs — sentinella del modulo /international/
//
// PERCHE' ESISTE
// Il modulo di /international/ inoltra al medico via /api/intl-inquiry.
// Il worker ha due vie di consegna: Resend (RESEND_API_KEY) e, come
// fallback, Email Routing (SEND_EMAIL). Su savianu.it l'MX e' su Google
// Workspace, quindi Email Routing non e' attivabile e senza chiave Resend
// ogni invio finisce in 502 send_failed. Il difetto e' rimasto invisibile
// per 7 settimane perche' nessuno guardava l'endpoint: questa sentinella
// lo guarda, e distingue "worker vivo" da "consegna funzionante".
//
// DUE MODALITA', VOLUTAMENTE DIVERSE
//   --dry   (default) liveness, NESSUNA email.
//           ts a -2 s -> il time-trap deve rispondere
//           200 {ok:true, sent:false, reason:'challenge'}.
//           Prova che il worker gira e che la trappola respinge. Non
//           dice nulla sulla consegna: e' il controllo da fare spesso.
//   --real  end-to-end, UNA email vera.
//           ts a -10 s, campi validi -> successo solo con
//           200 {ok:true, sent:true}. Genera una mail allo studio con
//           mittente/nome "SENTINELLA AUTOMATICA - ignorare".
//           Da eseguire di rado (settimanale), non a ogni ora.
//
// FUORI DA `npm test` DI PROPOSITO: un probe di rete dentro il gate di
// pre-deploy rende il deploy dipendente da Cloudflare e dal sender.
//
// ESITI (exit code)
//   0  ok            — la modalita' ha dato il risultato atteso
//   0  skipped       — 429 / rate-limited: nessuna informazione, non un guasto
//   1  alarm         — qualcosa non va (il dettaglio dice cosa)
//   2  usage         — argomenti o ambiente sbagliati
//
// Uso:
//   node tools/check-intl-endpoint.mjs            # dry
//   node tools/check-intl-endpoint.mjs --real     # end-to-end (una email)
//   node tools/check-intl-endpoint.mjs --json     # output macchina
//   node tools/check-intl-endpoint.mjs --url http://127.0.0.1:8787/api/intl-inquiry
// =====================================================================

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

if (has('--help') || has('-h')) {
  console.log('Uso: node tools/check-intl-endpoint.mjs [--dry|--real] [--json] [--url URL]');
  process.exit(0);
}
if (has('--dry') && has('--real')) {
  console.error('Scegli una modalita\': --dry oppure --real, non entrambe.');
  process.exit(2);
}

const REAL = has('--real');
const JSON_OUT = has('--json');
const URL_ = val('--url', 'https://savianu.it/api/intl-inquiry');
const TIMEOUT_MS = Number(val('--timeout', '20000'));

// Il payload e' identico a quello che manda la pagina (vedi app.js):
// stessi nomi di campo, stessa forma. La sonda non deve avere scorciatoie,
// altrimenti verifica un percorso che nessun paziente usa.
function payload(mode) {
  return {
    name: 'SENTINELLA AUTOMATICA - ignorare',
    // reply_to della mail = questo indirizzo: una risposta resta in studio,
    // non finisce a un mittente inesistente.
    email: 'private@savianu.it',
    phone: '',
    consent: true,
    lang: 'it',
    status: 'visitor',
    reason: 'other',
    note: mode === 'real'
      ? 'Sonda settimanale del modulo internazionale. Nessuna azione richiesta.'
      : 'Sonda di liveness del modulo internazionale.',
    website: '', // honeypot vuoto: e' un campo che un umano non compila
    ts: Date.now() - (mode === 'real' ? 10000 : 2000),
  };
}

const t0 = Date.now();
let res, body, raw = '', netErr = null;
try {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  res = await fetch(URL_, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // UA esplicito: un probe anonimo puo' incrociare il bot-fight di
      // Cloudflare e produrre un 403 che non c'entra col modulo.
      'User-Agent': 'savianu-intl-sentinel/1.0 (+https://savianu.it/international/)',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload(REAL ? 'real' : 'dry')),
    signal: ctrl.signal,
  });
  clearTimeout(timer);
  raw = await res.text();
  try { body = JSON.parse(raw); } catch { body = null; }
} catch (e) {
  netErr = e && e.name === 'AbortError' ? 'timeout' : String((e && e.message) || e);
}

const ms = Date.now() - t0;
const status = res ? res.status : null;

function verdict() {
  if (netErr) return { code: 'unreachable', exit: 1, msg: `endpoint non raggiungibile: ${netErr}` };

  // Cloudflare puo' rispondere con HTML (bot fight, challenge, errore di
  // piattaforma): non e' il modulo, ma va distinto da un send_failed.
  if (body === null) {
    return { code: 'non_json', exit: 1,
      msg: `risposta non JSON (HTTP ${status}): ${raw.slice(0, 120).replace(/\s+/g, ' ')}` };
  }
  if (status === 429 || body.error === 'rate_limited') {
    return { code: 'skipped', exit: 0, msg: 'rate_limited: nessuna informazione utile, non e\' un guasto' };
  }
  if (status === 403) return { code: 'blocked', exit: 1, msg: 'HTTP 403 (bot-fight/WAF): la sonda non ha raggiunto il modulo' };

  if (!REAL) {
    // Liveness: la trappola deve respingere e NON deve consegnare nulla.
    if (status === 200 && body.ok === true && body.sent === false && body.reason === 'challenge') {
      return { code: 'ok', exit: 0, msg: 'worker vivo, time-trap attiva (nessuna email inviata)' };
    }
    if (status === 200 && body.ok === true && body.sent === true) {
      return { code: 'alarm', exit: 1,
        msg: 'LA TRAPPOLA NON HA BLOCCATO LA SONDA: un payload con ts a -2s e\' stato consegnato' };
    }
    return { code: 'alarm', exit: 1, msg: `risposta inattesa: HTTP ${status} ${JSON.stringify(body).slice(0, 160)}` };
  }

  // End-to-end: conta solo la consegna vera.
  if (status === 200 && body.ok === true && body.sent === true) {
    return { code: 'ok', exit: 0, msg: `consegna riuscita (via ${body.via || 'n/d'})` };
  }
  if (body.error === 'send_failed') {
    return { code: 'alarm', exit: 1,
      msg: 'consegna fallita (send_failed): nessun sender utilizzabile o sender rifiutato. '
         + 'Su savianu.it Email Routing non e\' attivabile (MX su Google Workspace): serve RESEND_API_KEY.' };
  }
  if (body.error === 'no_sender') {
    return { code: 'alarm', exit: 1, msg: 'nessun sender configurato (no_sender): manca RESEND_API_KEY e SEND_EMAIL non e\' utilizzabile' };
  }
  if (body.error === 'invalid_fields' || body.error === 'invalid_email') {
    return { code: 'alarm', exit: 1, msg: `il worker ha rifiutato il payload della sonda (${body.error}): il formato del modulo e' cambiato` };
  }
  return { code: 'alarm', exit: 1, msg: `risposta inattesa: HTTP ${status} ${JSON.stringify(body).slice(0, 160)}` };
}

const v = verdict();
const out = {
  mode: REAL ? 'real' : 'dry',
  url: URL_,
  http: status,
  ms,
  verdict: v.code,
  detail: v.msg,
  worker: body && typeof body === 'object' ? body : null,
};

if (JSON_OUT) {
  console.log(JSON.stringify(out, null, 2));
} else {
  const tag = v.exit === 0 ? (v.code === 'ok' ? 'OK' : 'SKIP') : 'ALLARME';
  console.log(`[${tag}] ${out.mode} ${URL_} -> HTTP ${status} in ${ms} ms`);
  console.log(`        ${v.msg}`);
}

// Riga per il summary di GitHub Actions, se ci siamo dentro.
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `| modo | HTTP | ms | esito |\n|---|---|---|---|\n| ${out.mode} | ${status} | ${ms} | **${v.code}** — ${v.msg} |\n`);
}

process.exit(v.exit);
