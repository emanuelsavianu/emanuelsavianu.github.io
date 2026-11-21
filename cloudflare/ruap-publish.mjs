/**
 * Worker "ruap-publish" — coda di pubblicazione dei turni RUAP.
 *
 * Rotta dedicata `savianu.it/api/ruap/*`, più specifica di `savianu.it/*` (che resta
 * al security worker): deploy indipendente, nessun rischio per il sito.
 *
 * Il Worker NON ha accesso al repository: autentica, limita la dimensione, valida la
 * FORMA del payload e accoda in KV. La validazione delle regole (disponibilità,
 * sedi chiuse, doppio impegno, budget) e il merge restano a `publish-queue.py`.
 *
 *   POST /api/ruap/publish            accoda un export (un solo mese)
 *   GET  /api/ruap/pending            elenco job in coda (drain)
 *   GET  /api/ruap/jobs/:id           stato del job
 *   POST /api/ruap/jobs/:id/ack       esito {published|rejected|failed}
 *   POST /api/ruap/jobs/:id/notify    email di riserva col JSON in allegato
 */

const MAX_BYTES = 128 * 1024;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const KEY_RE = /^(\d{4}-\d{2}-\d{2})_(mat|pom)_([^_]{1,40})$/;
const JOB_RE = /^\/api\/ruap\/jobs\/([0-9a-f-]{36})(?:\/(ack|notify))?$/;
const STATUSES = new Set(['published', 'rejected', 'failed']);
const encoder = new TextEncoder();

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});

async function tokenMatches(given, expected) {
  if (!expected) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(String(given || ''))),
    crypto.subtle.digest('SHA-256', encoder.encode(String(expected))),
  ]);
  const va = new Uint8Array(a);
  const vb = new Uint8Array(b);
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(va, vb);
  let diff = 0;
  for (let i = 0; i < va.length; i += 1) diff |= va[i] ^ vb[i];
  return diff === 0;
}

function validate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return ['payload non valido'];
  const errs = [];
  const month = String(payload.month || '');
  if (!MONTH_RE.test(month)) errs.push('month deve essere YYYY-MM');
  const exp = payload.export;
  if (!exp || typeof exp !== 'object' || Array.isArray(exp)) return [...errs, 'export assente'];
  if (exp.version !== 1) errs.push('export.version deve essere 1');
  const doctors = Array.isArray(exp.doctors) ? exp.doctors : null;
  if (!doctors || doctors.length === 0 || doctors.length > 80) errs.push('export.doctors assente o fuori range');
  const ids = new Set((doctors || []).map((d) => d && d.id).filter(Boolean));
  const assignments = exp.assignments;
  if (!assignments || typeof assignments !== 'object' || Array.isArray(assignments)) {
    return [...errs, 'export.assignments assente'];
  }
  const keys = Object.keys(assignments);
  if (keys.length === 0) errs.push('export.assignments vuoto');
  if (keys.length > 3000) errs.push('export.assignments troppo grande');
  let outside = 0;
  for (const key of keys) {
    const match = KEY_RE.exec(key);
    if (!match) {
      errs.push(`chiave malformata: ${key.slice(0, 48)}`);
      continue;
    }
    if (match[1].slice(0, 7) !== month) outside += 1;
    if (!ids.has(assignments[key])) errs.push(`medico sconosciuto in ${key}`);
  }
  if (outside) errs.push(`${outside} chiavi fuori dal mese ${month}`);
  return errs.slice(0, 10);
}

async function rateLimited(env) {
  const bucket = `rl:${new Date().toISOString().slice(0, 13)}`;
  const current = Number(await env.RUAP_KV.get(bucket)) || 0;
  if (current >= 30) return true;
  await env.RUAP_KV.put(bucket, String(current + 1), { expirationTtl: 7200 });
  return false;
}

async function publish(request, env) {
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) {
    return json({ error: 'payload troppo grande' }, 413);
  }
  const text = await request.text();
  if (encoder.encode(text).length > MAX_BYTES) return json({ error: 'payload troppo grande' }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'JSON non valido' }, 400);
  }
  const errs = validate(body);
  if (errs.length) return json({ error: 'validazione fallita', details: errs }, 422);
  if (await rateLimited(env)) return json({ error: 'troppe pubblicazioni, riprova tra un\'ora' }, 429);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const record = {
    id,
    createdAt,
    month: body.month,
    appVersion: String(body.appVersion || '?').slice(0, 40),
    preflight: body.preflight && typeof body.preflight === 'object' ? body.preflight : null,
    export: body.export,
  };
  await env.RUAP_KV.put(`job:queued:${id}`, JSON.stringify(record), {
    metadata: { createdAt, month: body.month },
    expirationTtl: 30 * 24 * 3600,
  });
  return json({ jobId: id, status: 'queued' }, 202);
}

async function pending(env) {
  const list = await env.RUAP_KV.list({ prefix: 'job:queued:', limit: 20 });
  const jobs = [];
  for (const key of list.keys) {
    const raw = await env.RUAP_KV.get(key.name);
    if (!raw) continue;
    jobs.push(JSON.parse(raw));
  }
  jobs.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  return json({ jobs });
}

async function findJob(env, id) {
  for (const status of ['published', 'rejected', 'failed', 'queued']) {
    const raw = await env.RUAP_KV.get(`job:${status}:${id}`);
    if (raw) return { ...JSON.parse(raw), status };
  }
  return null;
}

async function jobStatus(env, id) {
  const job = await findJob(env, id);
  if (!job) return json({ error: 'job sconosciuto' }, 404);
  return json(job);
}

async function ack(request, env, id) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON non valido' }, 400);
  }
  const status = String(body.status || '');
  if (!STATUSES.has(status)) return json({ error: 'status non valido' }, 400);
  const raw = await env.RUAP_KV.get(`job:queued:${id}`);
  if (!raw) {
    const existing = await findJob(env, id);
    return existing ? json({ ok: true, already: existing.status }) : json({ error: 'job sconosciuto' }, 404);
  }
  const record = JSON.parse(raw);
  const out = {
    ...record,
    status,
    ackedAt: new Date().toISOString(),
    detail: String(body.detail || '').slice(0, 2000),
    version: body.version || null,
    liveSha: body.liveSha || null,
    numbers: body.numbers && typeof body.numbers === 'object' ? body.numbers : null,
  };
  await env.RUAP_KV.delete(`job:queued:${id}`);
  await env.RUAP_KV.put(`job:${status}:${id}`, JSON.stringify(out), {
    metadata: { createdAt: record.createdAt, month: record.month },
    expirationTtl: status === 'published' ? 7 * 24 * 3600 : 14 * 24 * 3600,
  });
  return json({ ok: true });
}

function toBase64(text) {
  const bytes = encoder.encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function notify(env, id) {
  const job = await findJob(env, id);
  if (!job) return json({ error: 'job sconosciuto' }, 404);
  if (!env.RESEND_API_KEY || !env.RUAP_NOTIFY_TO) {
    return json({ error: 'notifica non configurata' }, 501);
  }
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(job.createdAt)) / 60000));
  const auth = 'Bearer ' + env.RESEND_API_KEY;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: auth, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.RUAP_NOTIFY_FROM || 'savianu.it turni <noreply@savianu.it>',
      to: [env.RUAP_NOTIFY_TO],
      subject: `RUAP ${job.month} in coda da ${minutes} min`,
      text: `Export in allegato. jobId ${job.id}, creato ${job.createdAt}, stato ${job.status}.`,
      attachments: [{ filename: `ruap-${job.month}.json`, content: toBase64(JSON.stringify(job.export, null, 2)) }],
    }),
  });
  return json({ ok: response.ok, status: response.status }, response.ok ? 200 : 502);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/ruap/')) return json({ error: 'not found' }, 404);
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!(await tokenMatches(token, env.RUAP_PUBLISH_TOKEN))) return json({ error: 'unauthorized' }, 401);
    if (request.method === 'POST' && url.pathname === '/api/ruap/publish') return publish(request, env);
    if (request.method === 'GET' && url.pathname === '/api/ruap/pending') return pending(env);
    const match = JOB_RE.exec(url.pathname);
    if (match) {
      if (request.method === 'GET' && !match[2]) return jobStatus(env, match[1]);
      if (request.method === 'POST' && match[2] === 'ack') return ack(request, env, match[1]);
      if (request.method === 'POST' && match[2] === 'notify') return notify(env, match[1]);
    }
    return json({ error: 'not found' }, 404, { allow: 'GET, POST' });
  },
};
